//! `BuildRelease` — portable release `.exe` / installer bundle.
//!
//! Wraps `pnpm tauri build` with the same hardened env the dev
//! command uses ([`Dev`]), so NASM, PYO3, `CMake`, sccache, and the
//! llama.cpp / CUDA runtime DLLs declared in `platform.default.toml
//! [build.deps.*]` all reach the bundle step with the correct flags.
//!
//! Output lands under `target/release/bundle/` (workspace root target
//! directory). On Windows that's `bundle/msi/*.msi` + `bundle/nsis/*.exe`
//! plus a standalone `target/release/<productName>-app.exe` that loads
//! the compiled-static frontend from the bundled resources — no Vite, no
//! dev server, no console required.
//!
//! This is the dogfood build. When it runs, the owner has a portable
//! app they can launch and actually use, and every subsequent sprint
//! phase gains live ground truth (`SurrealDB` on :8822, Turso
//! `platform.db`, `DuckDB` `analytics.duckdb`) to verify against.
//!
//! # Differences vs `RunDev`
//!
//! - No port management — release build does not bind a dev port.
//! - No backend-only precompile — `tauri build` compiles everything it
//!   needs with release profile.
//! - No zombie port cleanup for `dev_port` — same reason.
//! - Still runs preflight, still uses the job object for child cleanup.
//!
//! # Logging & failure classification
//!
//! Every run writes a full merged stdout/stderr transcript to
//! `target/xtask-build-release.log`. When `pnpm tauri build` exits
//! non-zero, we scan the transcript for stage markers
//! (`Compiling <crate>`, `Finished`, `Built application`, `Running
//! candle`, `Running light`, `failed to bundle`, `failed to run`, NSIS)
//! and report the classified stage plus a stage-specific hint instead
//! of the previous hard-coded "fix the compile errors above" message
//! that lied when the failure was in bundling.

use crate::commands::preflight::Preflight;
use crate::commands::sccache;
use crate::commands::Task;
use crate::events::{EventBuilder, EventSink, StageEvent, StageStatus, SummaryCounts};
use crate::manifest::BuildManifest;
use crate::stage;
use crate::workspace::Workspace;
use crate::zombie;

use std::fmt;
use std::path::{Path, PathBuf};
use std::time::{Instant, SystemTime};

const VERSION: &str = "0.1.0";

/// Convert a byte count to MB as `f64` for display-only formatting.
///
/// `u64 → f64` is intentional: `u64::MAX` exceeds `f64`'s 52-bit mantissa,
/// so the conversion is lossy for ≥ 4 PiB. Our largest portable
/// artifact is ~100 MB, so the precision floor is several orders of
/// magnitude away from this rendering. Centralised here so future
/// callers don't reintroduce the lint per-site.
#[expect(
    clippy::cast_precision_loss,
    reason = "u64 byte counts of ≤ a few GB stay well inside f64 mantissa precision; \
              the f64 is used only for `{:.1}` display formatting."
)]
fn bytes_to_mb(bytes: u64) -> f64 {
    bytes as f64 / (1024.0 * 1024.0)
}

/// Portable release bundle build.
///
/// `portable_only = false` (default) runs the full installer bundler.
/// `portable_only = true` skips bundling (`tauri build --no-bundle`) and
/// invokes `package-portable` at the end to produce a runnable zip.
pub struct BuildRelease {
    pub portable_only: bool,
}

impl Task for BuildRelease {
    fn name(&self) -> &'static str {
        if self.portable_only {
            "build-release --portable-only"
        } else {
            "build-release"
        }
    }

    fn run(&self, ws: &Workspace) -> anyhow::Result<()> {
        // File sink — every xinfo!/xwarn! line is also persisted to
        // target/xtask-run.log from this point on. Without this, xtask's
        // own narration (package-portable per-category copy totals,
        // portable folder assertions, etc.) exists only in the terminal
        // scrollback and is lost when the user closes the window. The
        // subprocess transcript (target/xtask-build-release.log) captures
        // only cargo/pnpm/tauri output — it doesn't see anything xtask
        // itself prints. A durable transcript of both streams is the
        // minimum bar for diagnosing regressions after the fact.
        //
        // Failure to attach is warned, not fatal: a read-only FS or disk
        // full shouldn't block the build.
        let xtask_log_path = ws.root().join("target").join("xtask-run.log");
        if let Err(e) = crate::out::set_file_sink(&xtask_log_path) {
            crate::xwarn!(
                "file sink attach failed ({}): {e:#} — terminal-only output this run",
                xtask_log_path.display()
            );
        } else {
            crate::xinfo!("  > xtask transcript: {}", xtask_log_path.display());
        }

        // Event sink wraps the whole task — SUMMARY runs on both success
        // and failure paths. The inner function is free to `bail!()`; the
        // sink's writer thread drains whatever events landed first.
        let events_path = ws.root().join("target").join("xtask-events.jsonl");
        let sink = EventSink::open(&events_path)?;
        // The sink is the SSOT for the event log location. Capture it via
        // its accessor so the SUMMARY printer reads from a single source
        // instead of recomputing the path.
        let event_log_path = sink.log_path().to_path_buf();
        let result = run_inner(ws, &sink, self.portable_only);
        match sink.finish() {
            Ok(events) => print_summary(&events, &event_log_path),
            Err(e) => crate::xwarn!("event log finalize failed: {e}"),
        }
        // Close the file sink so the final flush lands before the process
        // exits. `info!`/`warn!` after this point return to terminal only.
        crate::out::close_file_sink();
        result
    }
}

#[allow(clippy::too_many_lines)]
fn run_inner(ws: &Workspace, sink: &EventSink, portable_only: bool) -> anyhow::Result<()> {
    let run_start = Instant::now();
    let run_wall_start = SystemTime::now();
    let platform_config = ws.platform_config()?;

    // Build manifest — provenance + checksums for every artifact this
    // run produces. Populated as the pipeline progresses; written at
    // the end of Stage 8. Missing git/rustc/node downgrade to `None`
    // fields rather than blocking the build.
    let manifest_gather_guard = sink.start("manifest-gather");
    let mut manifest = match BuildManifest::gather(
        ws.root(),
        platform_config.build.toolchain.target.clone(),
        platform_config.build.toolchain.msvc_crt.clone(),
        run_wall_start,
    ) {
        Ok(m) => {
            manifest_gather_guard.ok();
            Some(m)
        }
        Err(e) => {
            // Manifest gathering is non-fatal — emit warn and continue.
            // A missing manifest doesn't stop the build from producing
            // a runnable .exe; it just disables provenance output.
            crate::xwarn!("build manifest gathering failed: {e:#}");
            manifest_gather_guard.warn(
                EventBuilder::new()
                    .classification("manifest_gather_failed")
                    .detail(format!("{e:#}")),
            );
            None
        }
    };

    // ── Stage 1: Banner ──
    print_banner("build-release");
    // One-shot factual event — captures version + flags at run start so
    // the jsonl log alone (without the terminal banner) can answer
    // "which xtask invocation produced these stages?". Owner-thread
    // emission, no timing, no failure mode — exactly what `EventSink::emit`
    // is for.
    sink.emit(
        "build-banner",
        StageStatus::Ok,
        EventBuilder::new().detail(format!(
            "v{VERSION} build-release{}",
            if portable_only {
                " --portable-only"
            } else {
                ""
            }
        )),
    );

    // ── Stage 2: Job Object (Windows) ──
    // Same pattern as dev — children die with xtask.
    #[cfg(windows)]
    let _job_guard = {
        let guard = sink.start("job-object");
        let s = stage::Stage::start("job object");
        match zombie::JobGuard::new() {
            Ok(jg) => {
                s.ok_with("children will die with xtask (kernel-enforced)");
                guard.ok();
                Some(jg)
            }
            Err(e) => {
                s.warn(format!("failed: {e} — zombies possible"));
                guard.warn(EventBuilder::new().detail(format!("{e}")));
                None
            }
        }
    };

    // ── Stage 3: Zombie cleanup ──
    // Clear stale cargo/rustc/node from crashed sessions. A previous
    // dev run can leave build-lock holders that silently block release.
    stage::section("Cleanup");
    let cleanup_guard = sink.start("cleanup-build-locks");
    let lock_killed = zombie::clear_build_lock_holders();
    if lock_killed > 0 {
        crate::xinfo!("  [OK] killed {lock_killed} stale build-lock holder(s)");
        cleanup_guard.ok_with(EventBuilder::new().detail(format!("killed {lock_killed}")));
    } else {
        crate::xinfo!("  [OK] no stale build-lock holders");
        cleanup_guard.ok_with(EventBuilder::new().detail("no stale holders"));
    }

    // ── Stage 4: Pre-flight ──
    stage::section("Pre-flight");
    let preflight_guard = sink.start("preflight");
    match Preflight.run(ws) {
        Ok(()) => preflight_guard.ok(),
        Err(e) => {
            preflight_guard.fail(EventBuilder::new().detail(format!("{e:#}")));
            return Err(e);
        }
    }

    // ── Stage 5: Compile cache (sccache) ──
    stage::section("Compile Cache");
    let sccache_guard_event = sink.start("sccache-init");
    let sccache_guard = sccache::Guard::new(ws);
    sccache_guard_event.ok();

    // ── Stage 6: Hardened build env ──
    stage::section("Build Environment");
    println!("  > Build env from [build.deps.*] SSOT:");
    let stage_guard = sink.start("build-env");
    platform_config.build.apply_env(ws.root());
    stage_guard.ok();

    // ── Stage 7: Launch `pnpm tauri build` with teed transcript ──
    // In portable-only mode, pass `--no-bundle` so tauri-cli skips the
    // installer step entirely. The exe + frontend still compile; we just
    // don't generate NSIS/MSI output. PackagePortable later produces the
    // runnable zip from the compiled exe.
    stage::section(if portable_only {
        "Tauri Build (no-bundle)"
    } else {
        "Tauri Bundle"
    });
    let log_path = ws.root().join("target").join("xtask-build-release.log");
    let accel_feats = crate::workspace::BuildConfig::detect_build_features();
    let mut pnpm_args: Vec<String> = if portable_only {
        vec!["tauri".into(), "build".into(), "--no-bundle".into()]
    } else {
        vec!["tauri".into(), "build".into()]
    };
    if let Some(feats) = accel_feats.as_deref() {
        pnpm_args.push("--features".into());
        pnpm_args.push(feats.into());
    }
    let pnpm_arg_refs: Vec<&str> = pnpm_args.iter().map(String::as_str).collect();
    println!("  > pnpm {}", pnpm_arg_refs.join(" "));
    if portable_only {
        println!("  > Scope: release profile compile + static frontend (NO installers)");
    } else {
        println!("  > Scope: release profile compile + static frontend + Windows installers");
    }
    println!("  > Output: {}", ws.root().join("target/release").display());
    println!("  > Transcript: {}", log_path.display());
    println!("  > This runs the full Rust release compile — expect 10–40 min cold, 2–8 min warm.");
    println!();

    let bundle_stage_id = if portable_only {
        "tauri-build-nobundle"
    } else {
        "tauri-bundle"
    };
    let bundle_guard = sink.start(bundle_stage_id);
    let build_start = Instant::now();
    let status = ws.exec_tee_log(&ws.desktop_dir(), "pnpm", &pnpm_arg_refs, &log_path)?;
    let build_secs = build_start.elapsed().as_secs_f64();

    if !status.success() {
        sccache_guard.report();
        let code = status.code().unwrap_or(-1);
        let stage = classify_tauri_failure(&log_path);
        bundle_guard.fail(
            EventBuilder::new()
                .classification(stage.classification_tag())
                .detail(format!(
                    "exit code {code} after {build_secs:.1}s at stage `{stage}`"
                ))
                .hint(stage.hint()),
        );
        anyhow::bail!(
            "`pnpm tauri build` exited with code {code} after {build_secs:.1}s\n  \
             Stage:        {stage}\n  \
             Transcript:   {log}\n  \
             Hint:         {hint}",
            log = log_path.display(),
            hint = stage.hint(),
        );
    }

    bundle_guard.ok_with(EventBuilder::new().detail(format!("{build_secs:.1}s")));
    sccache_guard.report();

    // ── Stage 8: Locate the artifact ──
    // Paths come from the workspace root's `target/` — cargo workspaces
    // write there, not under `interfaces/desktop/src-tauri/target/`.
    // The standalone filename is `<productName>-app.exe` on Windows,
    // read from tauri.conf.json so we don't drift from the SSOT.
    stage::section("Artifact");
    let artifact_guard = sink.start("artifact-locate");
    let target_release = ws.root().join("target").join("release");
    let bundle_dir = target_release.join("bundle");
    let standalone = match ws.tauri_product_name() {
        Ok(name) => target_release.join(format!("{name}-app.exe")),
        Err(e) => {
            // Genuine warning — tauri.conf.json unreadable, fallback
            // filename is a guess. Stays on stderr.
            crate::xwarn!("  [!!] could not read productName from tauri.conf.json: {e}");
            target_release.join("devpulse-desktop-app.exe")
        }
    };

    println!("  Build completed in {build_secs:.1}s.");
    println!();
    println!("  Standalone .exe:");
    let mut installer_count = 0usize;
    if standalone.exists() {
        println!("    {}", standalone.display());
        if let Some(mf) = manifest.as_mut() {
            add_artifact_or_warn(mf, ws.root(), "standalone-exe", &standalone);
        }
    } else {
        println!(
            "    (expected at {} — not found; check tauri.conf.json and the transcript at {})",
            standalone.display(),
            log_path.display()
        );
    }
    println!();
    if portable_only {
        println!("  Installers: skipped (--portable-only)");
        // Real semantic skip — the bundle phase ran in `--no-bundle`
        // mode, so installer artifacts are not produced this run.
        // Surfacing this as an explicit `Skip` event keeps the jsonl
        // log honest: the SUMMARY counts a skipped stage instead of
        // pretending the installer phase silently succeeded.
        sink.start("installer-bundle").skip(
            EventBuilder::new()
                .classification("portable_only")
                .detail("--portable-only suppressed tauri-bundler installer phase"),
        );
    } else {
        println!("  Installers:");
        // Cloned sender for one-shot per-installer events emitted from
        // inside the discovery loop. We don't want a timed `start` per
        // file (no observable duration to measure), but we DO want a
        // structured event so the jsonl log lists every installer the
        // bundler produced — useful when `installer_count == 0` and we
        // need to know what bundler attempted vs. what landed.
        let installer_emitter = sink.sender();
        if bundle_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&bundle_dir) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_dir() {
                        // Subdir name (`nsis`, `msi`, ...) maps to artifact kind tag.
                        let subdir = p
                            .file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("unknown")
                            .to_string();
                        if let Ok(inner) = std::fs::read_dir(&p) {
                            for sub in inner.flatten() {
                                let sp = sub.path();
                                if sp.is_file() {
                                    println!("    {}", sp.display());
                                    installer_count += 1;
                                    installer_emitter.emit(
                                        "installer-found",
                                        StageStatus::Ok,
                                        EventBuilder::new()
                                            .classification(subdir.clone())
                                            .detail(sp.display().to_string()),
                                    );
                                    if let Some(mf) = manifest.as_mut() {
                                        let kind = format!("installer-{subdir}");
                                        add_artifact_or_warn(mf, ws.root(), &kind, &sp);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if installer_count == 0 {
                println!(
                    "    (bundle dir exists but is empty at {} — tauri-bundler produced no installers; see transcript)",
                    bundle_dir.display()
                );
            }
        } else {
            println!("    (expected under {} — not found)", bundle_dir.display());
        }
    }

    // Artifact stage resolution:
    // - Standalone missing is a hard fail (compile succeeded but tauri
    //   didn't produce the exe — that never happens benignly).
    // - In normal mode: zero installers is a warn (portable path still works).
    // - In portable-only mode: zero installers is EXPECTED — ok.
    if !standalone.exists() {
        artifact_guard.fail(
            EventBuilder::new()
                .classification("standalone_missing")
                .detail(format!("not found at {}", standalone.display()))
                .hint("inspect the tauri build transcript for the real failure"),
        );
    } else if portable_only {
        artifact_guard.ok_with(
            EventBuilder::new()
                .classification("portable_only")
                .detail("standalone exe present, installers skipped by flag"),
        );
    } else if installer_count == 0 {
        artifact_guard.warn(
            EventBuilder::new()
                .classification("no_installers")
                .detail("standalone exe present, no installer produced")
                .hint("run `cargo xtask build-release --portable-only` to ship a runnable zip without bundling"),
        );
    } else {
        artifact_guard.ok_with(
            EventBuilder::new().detail(format!("{installer_count} installer(s) produced")),
        );
    }

    // ── Stage 8.5: Package portable (only when --portable-only) ──
    // Reuses the PackagePortable task. It reads tauri.conf.json (merged
    // with the per-platform override), copies exe + sidecar + runtime
    // DLLs + icon + tree resources (DevForge) into
    // target/release/portable/<productName>-v<version>/, emits
    // manifest.json with per-file SHA256, then zips.
    //
    // The `run_and_report` entry point (vs. plain `run`) returns a
    // [`PortableSummary`] we attach to the event log so regressions like
    // "zero resources landed" show up as structured truth — not a bare
    // `ok` with no payload. Package-portable's own internal coverage
    // assertion will have already bailed if nothing landed; the summary
    // is the post-hoc receipt.
    let mut portable_zip_path: Option<PathBuf> = None;
    let mut portable_summary: Option<crate::commands::package_portable::PortableSummary> = None;
    if !portable_only {
        // Mirror of the installer-bundle skip above: when not in
        // `--portable-only` mode the package-portable phase is bypassed
        // by design, so the SUMMARY records a real skip instead of a
        // missing stage entry.
        sink.start("package-portable").skip(
            EventBuilder::new()
                .classification("installers_only")
                .detail("--portable-only flag absent; portable zip not produced"),
        );
    }
    if portable_only && standalone.exists() {
        stage::section("Package Portable");
        let pkg_guard = sink.start("package-portable");
        let pkg = crate::commands::package_portable::PackagePortable { dry_run: false };
        match pkg.run_and_report(ws) {
            Ok(summary) => {
                let detail = summary.as_ref().map_or_else(
                    || "dry-run (no files on disk)".to_string(),
                    super::package_portable::PortableSummary::event_detail,
                );
                pkg_guard.ok_with(EventBuilder::new().detail(detail));
                portable_summary = summary;

                // The zip lives at target/release/<productName>-v<version>-portable.zip;
                // locate it so we can add it to the build manifest.
                if let (Ok(product_name), Some(mf)) = (ws.tauri_product_name(), manifest.as_ref()) {
                    let zip_path = target_release.join(format!(
                        "{}-v{}-portable.zip",
                        product_name, mf.product.version
                    ));
                    if zip_path.exists() {
                        portable_zip_path = Some(zip_path);
                    }
                }
            }
            Err(e) => {
                pkg_guard.fail(
                    EventBuilder::new()
                        .classification("package_portable_failed")
                        .detail(format!("{e:#}")),
                );
                return Err(e);
            }
        }
    }

    if let (Some(zip), Some(mf)) = (portable_zip_path.as_ref(), manifest.as_mut()) {
        add_artifact_or_warn(mf, ws.root(), "portable-zip", zip);
    }

    // Durable per-category receipts in `target/xtask-run.log`. Terminal
    // users already see these during the Package Portable stage; the
    // reprint here ensures a post-build `grep resource_tree_file
    // target/xtask-run.log` yields a single authoritative line even when
    // the in-stage output was scrolled past. Also lays the groundwork
    // for Phase 4's smoke-stage resource-presence assertions.
    if let Some(summary) = portable_summary.as_ref() {
        crate::xinfo!("");
        crate::xinfo!("  Portable summary:");
        crate::xinfo!(
            "    {} total files, {:.1} MB",
            summary.total_files,
            bytes_to_mb(summary.total_bytes),
        );
        crate::xinfo!(
            "    declared: {} resources, {} external bins",
            summary.declared_resources,
            summary.declared_external_bins,
        );
        for (cat, totals) in &summary.per_category {
            crate::xinfo!(
                "    {cat:<20} {:>5} files, {:>8.2} MB",
                totals.files,
                bytes_to_mb(totals.bytes),
            );
        }
    }

    // ── Stage 9: SBOM — CycloneDX 1.4 (Rust + npm) ──
    // Written BEFORE the build manifest so the manifest can include
    // the SBOM file as one of its checksummed artifacts. The SBOM is
    // the "what's inside" subject; the manifest is the "how it was
    // built" attestation. A future SLSA workflow references both.
    stage::section("SBOM");
    let sbom_guard = sink.start("sbom-cyclonedx");
    let sbom_path = target_release.join("sbom.cdx.json");
    let sbom_written = match ws.tauri_product_name() {
        Ok(product_name) => {
            // Version comes from tauri.conf.json. If we can't read it,
            // the manifest gather above already warned; fall through with
            // a placeholder so the SBOM still generates.
            let product_version = manifest
                .as_ref()
                .map_or_else(|| "0.0.0".to_string(), |m| m.product.version.clone());
            let sbom_build = crate::sbom::SbomBuild {
                workspace_root: ws.root().to_path_buf(),
                desktop_dir: ws.desktop_dir(),
                product_name,
                product_version,
            };
            match sbom_build
                .generate()
                .and_then(|bom| crate::sbom::write_bom(&bom, &sbom_path).map(|()| bom))
            {
                Ok(bom) => {
                    println!(
                        "  sbom.cdx.json: {} ({} components)",
                        sbom_path.display(),
                        bom.components.len()
                    );
                    sbom_guard.ok_with(
                        EventBuilder::new().detail(format!("{} components", bom.components.len())),
                    );
                    true
                }
                Err(e) => {
                    crate::xwarn!("SBOM generation failed: {e:#}");
                    sbom_guard.fail(
                        EventBuilder::new()
                            .classification("sbom_failed")
                            .detail(format!("{e:#}")),
                    );
                    false
                }
            }
        }
        Err(e) => {
            crate::xwarn!("cannot generate SBOM — productName unreadable: {e:#}");
            sbom_guard.fail(
                EventBuilder::new()
                    .classification("sbom_no_product_name")
                    .detail(format!("{e:#}")),
            );
            false
        }
    };

    // Record the SBOM in the manifest so consumers have a single
    // attested entry point.
    if sbom_written {
        if let Some(mf) = manifest.as_mut() {
            add_artifact_or_warn(mf, ws.root(), "sbom-cyclonedx", &sbom_path);
        }
    }

    // ── Stage 10: Provenance — write build.manifest.json ──
    // Stamps finish time + duration_s and writes the populated manifest
    // to target/release/build.manifest.json. This is the SLSA-ready
    // artifact subject map — per-file SHA256, toolchain, vcs, build host.
    if let Some(mf) = manifest.take() {
        stage::section("Provenance");
        let write_guard = sink.start("manifest-write");
        let manifest_path = target_release.join("build.manifest.json");
        match mf.finalize_and_write(&manifest_path, SystemTime::now()) {
            Ok(p) => {
                println!("  build.manifest.json: {}", p.display());
                write_guard.ok();
            }
            Err(e) => {
                crate::xwarn!("build manifest write failed: {e:#}");
                write_guard.fail(
                    EventBuilder::new()
                        .classification("manifest_write_failed")
                        .detail(format!("{e:#}")),
                );
            }
        }
    }

    // ── Stage 11: Automated smoke test ──
    // Launch the standalone exe, poll :8822/health for up to 90s, kill
    // the child. If the app never reported healthy we quarantine every
    // artifact (standalone + installers) by prepending `REJECTED-` so
    // a broken installer is not mistaken for a shippable one. This is
    // the gate that catches the black-screen class — a release that
    // compiled green but cannot boot.
    //
    // Skipped when the standalone is missing — the earlier artifact
    // stage already marked that as a hard failure and the smoke run
    // has no target to exercise.
    let smoke_result = if standalone.exists() {
        stage::section("Smoke test");
        let smoke_guard = sink.start("smoke-test");
        println!(
            "  Launching {} and polling http://127.0.0.1:8822/health  (timeout 90s)…",
            standalone.display(),
        );
        let result = crate::smoke::run_smoke(&standalone);
        match &result {
            Ok(r) if r.is_healthy() => {
                println!("  OK — {}", r.summary());
                smoke_guard.ok_with(EventBuilder::new().detail(r.summary()));
            }
            Ok(r) => {
                crate::xwarn!("  smoke FAILED — {}", r.summary());
                smoke_guard.fail(
                    EventBuilder::new()
                        .classification("smoke_unhealthy_or_timeout")
                        .detail(r.summary())
                        .hint(
                            "app launched but never reported healthy on :8822 — \
                             check .userdata/logs/boot.log for the stalled stage",
                        ),
                );
            }
            Err(e) => {
                crate::xwarn!("  smoke ERRORED — {e:#}");
                smoke_guard.fail(
                    EventBuilder::new()
                        .classification("smoke_error")
                        .detail(format!("{e:#}"))
                        .hint("smoke harness could not run — see trace above"),
                );
            }
        }
        Some(result)
    } else {
        crate::xwarn!("  skipping smoke test — standalone exe not present");
        None
    };

    // Quarantine artifacts if smoke failed. A broken installer on disk
    // is worse than no installer — we have literally mailed "broken" to
    // ourselves before. Prefixing with `REJECTED-` keeps the file for
    // diagnosis but makes accidental launch impossible.
    let smoke_passed = matches!(&smoke_result, Some(Ok(r)) if r.is_healthy());
    if !smoke_passed && smoke_result.is_some() {
        stage::section("Quarantine");
        let quarantine_guard = sink.start("quarantine");
        let mut renamed = 0usize;
        renamed += quarantine_file(&standalone);
        if !portable_only && bundle_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&bundle_dir) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_dir() {
                        if let Ok(inner) = std::fs::read_dir(&p) {
                            for sub in inner.flatten() {
                                let sp = sub.path();
                                if sp.is_file() {
                                    renamed += quarantine_file(&sp);
                                }
                            }
                        }
                    }
                }
            }
        }
        println!(
            "  Quarantined {} artifact{} with `REJECTED-` prefix.",
            renamed,
            if renamed == 1 { "" } else { "s" }
        );
        quarantine_guard
            .ok_with(EventBuilder::new().detail(format!("{renamed} artifacts renamed")));
    }

    println!();
    if smoke_passed {
        println!("  Smoke test: PASSED");
        println!("    :8822/health answered healthy after launching the standalone exe.");
    } else if smoke_result.is_none() {
        println!("  Smoke test: SKIPPED (no standalone exe to exercise)");
    } else {
        println!("  Smoke test: FAILED — artifacts quarantined with REJECTED- prefix");
        println!("    Rerun after fixing boot path; see event log + .userdata/logs/boot.log");
    }

    let total = run_start.elapsed();
    println!();
    println!("xtask build-release: total {:.1}s", total.as_secs_f64());

    // If smoke failed, fail the whole build so CI / lefthook / humans
    // treat the run as broken. The quarantine above ensures the artifacts
    // on disk match that verdict.
    if smoke_result.is_some() && !smoke_passed {
        anyhow::bail!("smoke test failed — installer rejected. See event log for classification.");
    }

    // _job_guard drops here → any lingering children killed by kernel.
    Ok(())
}

/// Prepend `REJECTED-` to a file's name in place. Returns 1 on success,
/// 0 on miss or error. Failures warn but don't abort — we're already on
/// the error path and want to finish quarantining whatever we can.
fn quarantine_file(path: &Path) -> usize {
    let Some(file_name) = path.file_name().and_then(|s| s.to_str()) else {
        return 0;
    };
    if file_name.starts_with("REJECTED-") {
        return 0;
    }
    let new_name = format!("REJECTED-{file_name}");
    let Some(parent) = path.parent() else {
        return 0;
    };
    let dest = parent.join(&new_name);
    match std::fs::rename(path, &dest) {
        Ok(()) => {
            println!("    {} -> {}", path.display(), dest.display());
            1
        }
        Err(e) => {
            crate::xwarn!("  rename failed for {}: {e}", path.display());
            0
        }
    }
}

/// Add an artifact to the manifest. Failures downgrade to a `xwarn!` —
/// a hash collision or permission issue on a single file should not
/// fail the whole build. The artifact simply won't appear in the manifest,
/// and the warning surfaces the reason.
fn add_artifact_or_warn(
    manifest: &mut BuildManifest,
    workspace_root: &Path,
    kind: &str,
    absolute_path: &Path,
) {
    if let Err(e) = manifest.add_artifact(workspace_root, kind, absolute_path) {
        crate::xwarn!(
            "skipping artifact `{kind}` at {}: {e:#}",
            absolute_path.display()
        );
    }
}

/// End-of-run SUMMARY — counts terminal stage statuses + replays
/// every failure's classification and hint. Prints even on the success
/// path so `Warn`/`Skip` stages are visible in a `[OK] everywhere else`
/// run.
fn print_summary(events: &[StageEvent], log_path: &Path) {
    let counts = SummaryCounts::from_events(events);
    println!();
    println!("── Summary ──────────────────────────────");
    println!(
        "  stages: {} ok, {} warn, {} skip, {} fail",
        counts.ok, counts.warn, counts.skip, counts.fail
    );
    if counts.warn > 0 || counts.fail > 0 {
        for e in events {
            match e.status {
                StageStatus::Warn | StageStatus::Fail => {
                    // Status label comes from the canonical lifecycle
                    // string — keeps the SUMMARY line in lockstep with
                    // the jsonl wire format if the enum ever grows new
                    // members.
                    let tag = e.status.as_str().to_uppercase();
                    let class = e.classification.as_deref().unwrap_or("-");
                    let detail = e.detail.as_deref().unwrap_or("");
                    println!("  [{tag}] {} ({class}) {detail}", e.stage_id);
                    if let Some(hint) = &e.hint {
                        println!("         hint: {hint}");
                    }
                }
                _ => {}
            }
        }
    }
    println!("  event log: {}", log_path.display());
}

fn print_banner(task_name: &str) {
    println!();
    println!("========================================");
    println!("  DevPulse Platform v{VERSION} [{task_name}]");
    println!("========================================");
}

// ═══════════════════════════════════════════════════════════════════════
// Failure stage classification
// ═══════════════════════════════════════════════════════════════════════
//
// Scans the build-release transcript for tauri-bundler / cargo markers
// and returns the most advanced stage we observed. The error printed to
// the user then reflects what actually failed — not a hard-coded guess.
//
// Substring matching against English tauri-bundler output is inherently
// brittle — a CLI version bump can reword a marker and turn a correct
// classification into `Unknown` overnight. Two mitigations live here:
//
//   1. Markers are gathered in [`TranscriptObservations::observe_line`]
//      so updating them is a single data edit, not scattered logic.
//   2. The version this was verified against is pinned in
//      [`TAURI_CLI_VERSION_VERIFIED`] — mismatched output is a known
//      maintenance trigger, not a mystery.
//
// Input is scanned one line at a time via [`BufRead::lines`] so a 500 MB
// transcript doesn't pin 500 MB of heap. Input lines may be raw child
// output OR the `exec_tee_log` prefix format (`[<ms>] [OUT|ERR] ...`);
// [`strip_log_prefix`] peels the latter before matching.

/// tauri-bundler version the marker strings were last verified against.
/// When the CLI upgrades and a real failure classifies as `Unknown`, refresh
/// the markers in `observe_line` and bump this string.
const TAURI_CLI_VERSION_VERIFIED: &str = "@tauri-apps/cli 2.10.x (verified 2026-05-14)";

/// Stage of `pnpm tauri build` that produced the non-zero exit.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TauriStage {
    /// Rust compile error — `error[E...]` or `error:` seen before `Built application`.
    Compile,
    /// Compile succeeded, bundling stage failed but which sub-step is unclear.
    CompileSucceededBundleFailed,
    /// `Running candle` seen, `Running light` not reached — `WiX` compile failed.
    CandleFailed,
    /// tauri-bundler reported `failed to run light.exe` after a successful build.
    /// If `target/release/wix/x64/output.msi` exists, light itself succeeded —
    /// the real failure is in a post-link step (rename, NSIS, signing).
    LightReportedFailed,
    /// NSIS `makensis` failed.
    NsisFailed,
    /// Transcript did not contain enough signal to classify.
    Unknown,
}

impl TauriStage {
    /// Stable classification tag for the event log. Used as the
    /// `classification` field on `StageEvent` when the tauri-bundle stage
    /// fails — downstream tooling can filter/alert on these tags without
    /// parsing human-readable hints.
    fn classification_tag(self) -> &'static str {
        match self {
            Self::Compile => "compile",
            Self::CompileSucceededBundleFailed => "bundle_unknown",
            Self::CandleFailed => "wix_candle",
            Self::LightReportedFailed => "wix_light",
            Self::NsisFailed => "nsis",
            Self::Unknown => "unknown",
        }
    }

    fn hint(self) -> String {
        match self {
            Self::Compile => {
                "Rust compile failed. Look for `error[E` or `error:` lines in the transcript."
                    .to_string()
            }
            Self::CompileSucceededBundleFailed => {
                "Rust compile succeeded; tauri-bundler failed before producing installers. \
                 Inspect `target/release/wix/x64/` for intermediate artifacts, and re-run \
                 `pnpm tauri build --verbose` from interfaces/desktop to surface the exact bundler stderr.".to_string()
            }
            Self::CandleFailed => {
                "WiX `candle.exe` failed to compile main.wxs. Check the generated \
                 `target/release/wix/x64/main.wxs` for schema or reference errors.".to_string()
            }
            Self::LightReportedFailed => {
                "tauri-bundler reported `failed to run light.exe`. \
                 If `target/release/wix/x64/output.msi` exists, light itself succeeded — \
                 the real failure is a post-link step (rename to `bundle/msi/...`, NSIS, \
                 or signing). Re-run with `pnpm tauri build --verbose` to see the exact step. \
                 On Windows this is frequently Defender locking the produced MSI during \
                 real-time scan — exclude `target/release/` to diagnose.".to_string()
            }
            Self::NsisFailed => {
                "NSIS `makensis.exe` failed. Check the transcript for the NSIS script error; \
                 `targets: \"all\"` in tauri.conf.json builds both MSI and NSIS.".to_string()
            }
            Self::Unknown => {
                format!(
                    "Failure stage could not be classified from the transcript. \
                     Markers were last verified against {TAURI_CLI_VERSION_VERIFIED} — if \
                     tauri-bundler has been upgraded, the phrasing may have changed and \
                     the markers in `TranscriptObservations::observe_line` need a refresh. \
                     Read the transcript end-to-end to see which step produced the error."
                )
            }
        }
    }
}

impl fmt::Display for TauriStage {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let label = match self {
            Self::Compile => "Rust compile",
            Self::CompileSucceededBundleFailed => "Bundle (post-compile, step unknown)",
            Self::CandleFailed => "WiX candle.exe (compile)",
            Self::LightReportedFailed => "WiX light.exe (reported by tauri-bundler)",
            Self::NsisFailed => "NSIS makensis.exe",
            Self::Unknown => "unknown (transcript lacked stage markers)",
        };
        f.write_str(label)
    }
}

/// Classify the stage of a tauri build failure from the transcript file.
/// Streaming line scan via `BufReader` — a 500 MB log costs one line of
/// heap, not the whole file. Missing file or I/O failure returns
/// `Unknown` (the caller already reports the transcript path, so a user
/// can cross-check without needing this function to name the failure).
fn classify_tauri_failure(log_path: &Path) -> TauriStage {
    let Ok(file) = std::fs::File::open(log_path) else {
        return TauriStage::Unknown;
    };
    let reader = std::io::BufReader::new(file);
    classify_from_reader(reader)
}

/// Streaming classifier — the form used by production code paths.
fn classify_from_reader<R: std::io::BufRead>(reader: R) -> TauriStage {
    let mut obs = TranscriptObservations::default();
    // drain_stream writes only valid UTF-8 (lossy decode already ran on
    // the producer side) so silent `Result::ok` on decode is safe here —
    // any IO error on the log file itself is an unrelated pathology.
    for line in reader.lines().map_while(Result::ok) {
        obs.observe_line(&line);
    }
    obs.classify()
}

/// String-input classifier — kept as the test entry point. Delegates
/// to the streaming path by wrapping the input bytes. Production code
/// reads the on-disk transcript directly through
/// [`classify_from_reader`]; this string form exists so the unit-test
/// fixtures below can pass canned transcripts in-memory without
/// touching the filesystem. Gated to test builds so a live release
/// build never compiles an unused symbol.
#[cfg(test)]
fn classify_from_transcript(transcript: &str) -> TauriStage {
    classify_from_reader(std::io::Cursor::new(transcript.as_bytes()))
}

/// Distinct transcript-observation flags. Each variant corresponds to
/// a marker [`TranscriptObservations::observe_line`] scans for; the
/// classifier in [`TranscriptObservations::classify`] then chooses the
/// furthest-reached marker as the verdict. Defined as an enum + bitmask
/// instead of N independent `bool` fields so the struct stays under
/// `struct_excessive_bools` while preserving the single-bit semantics.
#[derive(Copy, Clone)]
#[repr(u16)]
enum TranscriptMarker {
    BuiltApp = 1 << 0,
    Candle = 1 << 1,
    Light = 1 << 2,
    /// `Running makensis to produce …` — NSIS phase entered.
    Nsis = 1 << 3,
    /// `Finished N bundle(s) at: …` — bundler ran to completion.
    BundleFinished = 1 << 4,
    FailedToRunLight = 1 << 5,
    /// 2.10.x `failed to run command "candle.exe": …` envelope.
    FailedToRunCandle = 1 << 6,
    FailedNsis = 1 << 7,
    CompileError = 1 << 8,
}

/// Accumulates transcript observations across lines, then emits the
/// furthest-reached stage. Keeping the line-level matching in one place
/// — instead of scattering `line.contains(...)` across the for-loop —
/// makes a tauri-bundler version bump a single edit site.
#[derive(Default)]
struct TranscriptObservations {
    flags: u16,
}

impl TranscriptObservations {
    fn set(&mut self, m: TranscriptMarker) {
        self.flags |= m as u16;
    }

    fn has(&self, m: TranscriptMarker) -> bool {
        self.flags & m as u16 != 0
    }
}

impl TranscriptObservations {
    /// Record whatever markers are present on a single transcript line.
    /// The input may still wear the `exec_tee_log` prefix; we peel it
    /// first so marker strings match the raw child output regardless of
    /// whether the caller is streaming our log file or piping a raw
    /// child transcript directly.
    fn observe_line(&mut self, raw: &str) {
        let line = strip_log_prefix(raw);
        let lower = line.to_lowercase();

        // Markers last verified against `TAURI_CLI_VERSION_VERIFIED`.
        // Update both sides together when the CLI changes phrasing.
        if line.contains("Built application at:") || line.contains("Built application at ") {
            self.set(TranscriptMarker::BuiltApp);
        }
        if line.contains("Running candle") {
            self.set(TranscriptMarker::Candle);
        }
        if line.contains("Running light") {
            self.set(TranscriptMarker::Light);
        }
        // 2.10.x: tauri-bundler emits `Running makensis to produce …`
        // when the NSIS bundle stage begins. Without this we cannot
        // distinguish "compile succeeded, NSIS staging died before
        // makensis even ran" from "makensis ran and failed silently".
        if line.contains("Running makensis") {
            self.set(TranscriptMarker::Nsis);
        }
        // 2.10.x success marker — `Finished 1 bundle at:` / `Finished
        // N bundles at:`. Tracks "the bundler reached completion" so
        // the classifier can disambiguate `built_app && !bundle_finished`
        // (real failure) from a re-invocation transcript.
        if line.contains("Finished") && lower.contains("bundle") && line.contains(" at:") {
            self.set(TranscriptMarker::BundleFinished);
        }
        // 2.10.x error envelope: `failed to run command "light.exe": …`.
        // The quoted form was new in 2.x — the unquoted 1.x form still
        // matches via `contains("failed to run")` + the substring.
        if lower.contains("failed to run") && lower.contains("light.exe") {
            self.set(TranscriptMarker::FailedToRunLight);
        }
        if lower.contains("failed to run") && lower.contains("candle.exe") {
            self.set(TranscriptMarker::FailedToRunCandle);
        }
        // NSIS — 2.10.x quoted envelope OR the legacy "makensis failed"
        // shape (kept so transcripts captured under earlier CLIs still
        // classify).
        if (lower.contains("failed to run") && lower.contains("makensis"))
            || (lower.contains("makensis") && lower.contains("fail"))
        {
            self.set(TranscriptMarker::FailedNsis);
        }
        // rustc diagnostic prefixes. We only treat these as compile errors
        // when they happened BEFORE a successful `Built application at:`
        // marker — post-build `error:` text typically belongs to bundler
        // output, not the compiler.
        let trimmed = line.trim_start();
        if !self.has(TranscriptMarker::BuiltApp)
            && (trimmed.starts_with("error[E") || trimmed.starts_with("error: "))
        {
            self.set(TranscriptMarker::CompileError);
        }
    }

    /// Order matters: the later an exit marker is in this chain, the
    /// further the build progressed. We return the furthest-reached
    /// failure class so a candle-then-nsis transcript (e.g. a
    /// re-invocation of the build in a single log) still classifies as
    /// the stage that actually died.
    fn classify(&self) -> TauriStage {
        // Explicit error markers first — they pin the exact failing tool.
        if self.has(TranscriptMarker::FailedNsis) {
            return TauriStage::NsisFailed;
        }
        if self.has(TranscriptMarker::FailedToRunLight) && self.has(TranscriptMarker::BuiltApp) {
            return TauriStage::LightReportedFailed;
        }
        if self.has(TranscriptMarker::FailedToRunCandle) && self.has(TranscriptMarker::BuiltApp) {
            return TauriStage::CandleFailed;
        }
        // No explicit error marker — infer from furthest-reached phase.
        // NSIS phase entered but bundle never finished → NSIS failure
        // even without an explicit `failed to run` line (2.10.x can die
        // inside makensis stdout before tauri-cli wraps the error).
        if self.has(TranscriptMarker::Nsis) && !self.has(TranscriptMarker::BundleFinished) {
            return TauriStage::NsisFailed;
        }
        if self.has(TranscriptMarker::Candle) && !self.has(TranscriptMarker::Light) {
            return TauriStage::CandleFailed;
        }
        if self.has(TranscriptMarker::BuiltApp) && !self.has(TranscriptMarker::BundleFinished) {
            return TauriStage::CompileSucceededBundleFailed;
        }
        if self.has(TranscriptMarker::CompileError) {
            return TauriStage::Compile;
        }
        TauriStage::Unknown
    }
}

/// Peel the `exec_tee_log` log-line prefix `[<ms>] [<LABEL>] ` from a
/// line so substring matches hit the raw child output. No-op on lines
/// that don't wear the prefix — raw child transcripts (and old logs)
/// stay untouched.
///
/// Accepts any text inside the two bracket pairs; we don't validate the
/// millis column or the label alphabet because the classifier should
/// cope with minor drift in our own log format without rewriting.
fn strip_log_prefix(line: &str) -> &str {
    let Some(rest) = line.strip_prefix('[') else {
        return line;
    };
    let Some(idx_ms_close) = rest.find("] [") else {
        return line;
    };
    let after_label_open = &rest[idx_ms_close + 3..];
    let Some(idx_label_close) = after_label_open.find("] ") else {
        return line;
    };
    &after_label_open[idx_label_close + 2..]
}

#[cfg(test)]
mod tests {
    use super::{classify_from_transcript, strip_log_prefix, TauriStage};

    #[test]
    fn compile_error_before_built_app_is_compile() {
        let t = "\
            Compiling devpulse-engine v0.1.0\n\
            error[E0432]: unresolved import `foo::bar`\n\
            error: could not compile `devpulse-engine` (lib)\n";
        assert_eq!(classify_from_transcript(t), TauriStage::Compile);
    }

    #[test]
    fn built_app_then_failed_light_is_light_reported() {
        let t = "\
            Built application at: D:\\target\\release\\devpulse-desktop-app.exe\n\
            Running candle for main.wxs\n\
            Running light to produce the MSI\n\
            failed to bundle project `failed to run C:\\tauri\\light.exe`\n";
        assert_eq!(classify_from_transcript(t), TauriStage::LightReportedFailed);
    }

    #[test]
    fn candle_without_light_is_candle_failed() {
        let t = "\
            Built application at: D:\\target\\release\\app.exe\n\
            Running candle for main.wxs\n\
            candle.exe : error CNDL0001: bad reference\n";
        assert_eq!(classify_from_transcript(t), TauriStage::CandleFailed);
    }

    #[test]
    fn nsis_failure_dominates() {
        let t = "\
            Built application at: D:\\target\\release\\app.exe\n\
            Running candle for main.wxs\n\
            Running light to produce the MSI\n\
            makensis failed with exit code 1\n";
        assert_eq!(classify_from_transcript(t), TauriStage::NsisFailed);
    }

    #[test]
    fn silent_transcript_is_unknown() {
        assert_eq!(classify_from_transcript(""), TauriStage::Unknown);
    }

    #[test]
    fn built_app_with_no_bundle_markers_is_bundle_failed() {
        let t = "\
            Built application at: D:\\target\\release\\app.exe\n\
            some unrelated error about a locked file\n";
        assert_eq!(
            classify_from_transcript(t),
            TauriStage::CompileSucceededBundleFailed
        );
    }

    // ── exec_tee_log prefixed lines ────────────────────────────────────

    #[test]
    fn prefixed_compile_error_classifies_as_compile() {
        // New exec_tee_log format: `[<ms>] [OUT|ERR] <raw>`. Without prefix
        // stripping, the leading `[` prevents `starts_with("error[E")` and
        // the classifier would return Unknown.
        let t = "\
            [       0] [OUT] Compiling devpulse-engine v0.1.0\n\
            [     415] [ERR] error[E0432]: unresolved import `foo::bar`\n\
            [     420] [ERR] error: could not compile `devpulse-engine` (lib)\n";
        assert_eq!(classify_from_transcript(t), TauriStage::Compile);
    }

    #[test]
    fn prefixed_built_app_then_light_is_light_reported() {
        let t = "\
            [  120000] [OUT] Built application at: D:\\target\\release\\app.exe\n\
            [  120010] [OUT] Running candle for main.wxs\n\
            [  120500] [OUT] Running light to produce the MSI\n\
            [  120900] [ERR] failed to bundle project `failed to run C:\\tauri\\light.exe`\n";
        assert_eq!(classify_from_transcript(t), TauriStage::LightReportedFailed);
    }

    // ── pathological transcripts ───────────────────────────────────────

    #[test]
    fn bom_prefixed_transcript_still_classifies() {
        // Windows tooling occasionally writes a UTF-8 BOM; our log never
        // does, but a hand-copied transcript might. The BOM sits on the
        // first line and must not defeat classification.
        let t = "\u{FEFF}\
            Compiling devpulse-engine v0.1.0\n\
            error[E0599]: method not found\n";
        assert_eq!(classify_from_transcript(t), TauriStage::Compile);
    }

    #[test]
    fn multi_iteration_transcript_reports_last_failure() {
        // Two failures concatenated — a classic retry-in-one-log pattern.
        // NSIS fail dominates light fail regardless of input order, so
        // the classifier must not be position-sensitive on its checks.
        let t = "\
            Built application at: D:\\target\\release\\app.exe\n\
            Running candle for main.wxs\n\
            Running light to produce the MSI\n\
            failed to run C:\\tauri\\light.exe\n\
            Built application at: D:\\target\\release\\app.exe\n\
            makensis.exe failed with exit code 1\n";
        assert_eq!(classify_from_transcript(t), TauriStage::NsisFailed);
    }

    #[test]
    fn out_of_order_markers_still_classify_nsis_dominant() {
        // Simulated interleaving: makensis-fail on stderr shows up before
        // candle on stdout. Classification is accumulator-based so order
        // within the log should not change the verdict.
        let t = "\
            [      10] [ERR] makensis failed with exit code 2\n\
            [      11] [OUT] Built application at: D:\\target\\release\\app.exe\n\
            [      12] [OUT] Running candle for main.wxs\n";
        assert_eq!(classify_from_transcript(t), TauriStage::NsisFailed);
    }

    #[test]
    fn lossy_replacement_char_in_line_does_not_break_match() {
        // drain_stream lossy-decodes non-UTF8 bytes into U+FFFD. A garbled
        // byte adjacent to a marker must not defeat substring matching.
        let t = "\
            Running candle\u{FFFD}for main.wxs\n\
            candle.exe : error CNDL0001\n\
            Built application at: D:\\target\\release\\app.exe\n";
        // Built application precedes "Running candle" only if BOTH fire;
        // here we still reach candle. Since Running light never fires,
        // candle-without-light wins.
        assert_eq!(classify_from_transcript(t), TauriStage::CandleFailed);
    }

    // ── strip_log_prefix unit coverage ─────────────────────────────────

    #[test]
    fn strip_prefix_removes_ms_and_label() {
        assert_eq!(
            strip_log_prefix("[     123] [OUT] Running candle"),
            "Running candle"
        );
    }

    #[test]
    fn strip_prefix_handles_err_label() {
        assert_eq!(
            strip_log_prefix("[  120900] [ERR] error[E0432]: boom"),
            "error[E0432]: boom"
        );
    }

    #[test]
    fn strip_prefix_noop_on_raw_line() {
        assert_eq!(
            strip_log_prefix("Built application at: D:\\x.exe"),
            "Built application at: D:\\x.exe"
        );
    }

    #[test]
    fn strip_prefix_noop_on_partial_prefix() {
        // Opening bracket present but no matching `] [` — must not corrupt the line.
        assert_eq!(strip_log_prefix("[truncated"), "[truncated");
    }

    #[test]
    fn strip_prefix_noop_on_missing_second_close() {
        // First bracket pair present, second label bracket missing.
        assert_eq!(
            strip_log_prefix("[123] [OUT continuing"),
            "[123] [OUT continuing"
        );
    }

    // ── Integration: classify_tauri_failure reads a real file ──────────
    //
    // The rest of the tests feed the classifier pre-baked strings via
    // `classify_from_transcript`. This one writes a transcript to a
    // temp file, calls the streaming file-reading path, and verifies
    // that a large multi-line transcript classifies correctly — the
    // path that build_release.rs actually uses in production.

    #[test]
    fn classify_tauri_failure_streams_real_file() {
        use super::classify_tauri_failure;
        use std::io::Write;
        use std::sync::atomic::{AtomicU64, Ordering};

        static SEQ: AtomicU64 = AtomicU64::new(0);
        let seq = SEQ.fetch_add(1, Ordering::Relaxed);
        let log_path = std::env::temp_dir().join(format!(
            "xtask-classify-test-{}-{}.log",
            std::process::id(),
            seq,
        ));

        // Build a realistic-shaped exec_tee_log transcript covering the
        // Rust compile → Built application → candle → light → failed-to-run
        // chain, then classify it off disk.
        let mut f = std::fs::File::create(&log_path).expect("creating log");
        writeln!(f, "[       0] [OUT] Compiling devpulse-engine v0.1.0").unwrap();
        writeln!(
            f,
            "[  120000] [OUT] Finished release [optimized] target(s) in 120s"
        )
        .unwrap();
        writeln!(
            f,
            "[  125000] [OUT] Built application at: D:\\target\\release\\devpulse-desktop-app.exe"
        )
        .unwrap();
        writeln!(f, "[  130000] [OUT] Running candle for main.wxs").unwrap();
        writeln!(f, "[  135000] [OUT] Running light to produce the MSI").unwrap();
        writeln!(
            f,
            "[  140000] [ERR] failed to bundle project `failed to run C:\\tauri\\light.exe`"
        )
        .unwrap();
        drop(f);

        let stage = classify_tauri_failure(&log_path);
        let _ = std::fs::remove_file(&log_path);

        assert_eq!(
            stage,
            TauriStage::LightReportedFailed,
            "expected LightReportedFailed from file-backed streaming read"
        );
    }

    // ── tauri-cli 2.10.x phrasing verification ────────────────────────
    //
    // These transcripts mirror the exact CommandFailed Display envelope
    // emitted by tauri-bundler 2.10.x: `failed to run command "<tool>":
    // <io error>`. The legacy 1.x envelope (`failed to bundle project …`)
    // is gone in 2.x; without the new markers we'd classify every
    // bundler death as `Unknown`.

    #[test]
    fn tauri_2_10_light_command_failed_classifies_as_light() {
        let t = "\
               Built application at: D:\\target\\release\\app.exe\n\
             Running candle for \"main.wxs\"\n\
             Running light to produce D:\\target\\release\\bundle\\msi\\app.msi\n\
            Error failed to run command \"light.exe\": program not found\n";
        assert_eq!(classify_from_transcript(t), TauriStage::LightReportedFailed);
    }

    #[test]
    fn tauri_2_10_candle_command_failed_classifies_as_candle() {
        // Quoted-envelope candle failure — the 2.10.x replacement for
        // the inferred `candle && !light` heuristic. With the explicit
        // `failed_to_run_candle` marker we no longer need to fall
        // through the inference path.
        let t = "\
               Built application at: D:\\target\\release\\app.exe\n\
             Running candle for \"main.wxs\"\n\
            Error failed to run command \"candle.exe\": exit status 1\n";
        assert_eq!(classify_from_transcript(t), TauriStage::CandleFailed);
    }

    #[test]
    fn tauri_2_10_makensis_command_failed_classifies_as_nsis() {
        let t = "\
               Built application at: D:\\target\\release\\app.exe\n\
             Running candle for \"main.wxs\"\n\
             Running light to produce D:\\target\\release\\bundle\\msi\\app.msi\n\
             Running makensis to produce D:\\target\\release\\bundle\\nsis\\app-setup.exe\n\
            Error failed to run command \"makensis.exe\": exit status 1\n";
        assert_eq!(classify_from_transcript(t), TauriStage::NsisFailed);
    }

    #[test]
    fn tauri_2_10_nsis_entered_no_finished_classifies_as_nsis() {
        // NSIS phase entered but bundle never reached `Finished` —
        // implicit fail (tauri-bundler can die inside makensis stdout
        // before wrapping a CommandFailed envelope).
        let t = "\
               Built application at: D:\\target\\release\\app.exe\n\
             Running candle for \"main.wxs\"\n\
             Running light to produce D:\\target\\release\\bundle\\msi\\app.msi\n\
             Running makensis to produce D:\\target\\release\\bundle\\nsis\\app-setup.exe\n";
        assert_eq!(classify_from_transcript(t), TauriStage::NsisFailed);
    }

    #[test]
    fn tauri_2_10_finished_bundle_marker_avoids_misclassification() {
        // Successful bundle — `bundle_finished` short-circuits the
        // "built_app && !finished" inference, so a successful
        // transcript fed to the failure classifier returns Unknown
        // (the correct verdict — there's no failure to classify).
        let t = "\
               Built application at: D:\\target\\release\\app.exe\n\
             Running candle for \"main.wxs\"\n\
             Running light to produce D:\\target\\release\\bundle\\msi\\app.msi\n\
            Finished 1 bundle at: D:\\target\\release\\bundle\\msi\\app.msi\n";
        assert_eq!(classify_from_transcript(t), TauriStage::Unknown);
    }
}
