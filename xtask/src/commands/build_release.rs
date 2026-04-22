//! `BuildRelease` — portable release `.exe` / installer bundle.
//!
//! Wraps `pnpm tauri build` with the same hardened env the dev
//! command uses ([`Dev`]), so NASM, PYO3, CMake, sccache, and the
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
//! phase gains live ground truth (SurrealDB on :8822, libSQL
//! `platform.db`, DuckDB `analytics.duckdb`) to verify against.
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
use crate::stage;
#[allow(unused_imports)]
use crate::workspace::Workspace;
use crate::zombie;

use std::fmt;
use std::path::Path;
use std::time::Instant;

const VERSION: &str = "0.1.0";

/// Portable release bundle build.
pub struct BuildRelease;

impl Task for BuildRelease {
    fn name(&self) -> &'static str {
        "build-release"
    }

    #[allow(clippy::too_many_lines)]
    fn run(&self, ws: &Workspace) -> anyhow::Result<()> {
        let run_start = Instant::now();
        let platform_config = ws.platform_config()?;

        // ── Stage 1: Banner ──
        print_banner(self.name());

        // ── Stage 2: Job Object (Windows) ──
        // Same pattern as dev — children die with xtask.
        #[cfg(windows)]
        let _job_guard = {
            let s = stage::Stage::start("job object");
            match zombie::JobGuard::new() {
                Ok(guard) => {
                    s.ok_with("children will die with xtask (kernel-enforced)");
                    Some(guard)
                }
                Err(e) => {
                    s.warn(&format!("failed: {e} — zombies possible"));
                    None
                }
            }
        };

        // ── Stage 3: Zombie cleanup ──
        // Clear stale cargo/rustc/node from crashed sessions. A previous
        // dev run can leave build-lock holders that silently block release.
        stage::section("Cleanup");
        let cleanup_start = Instant::now();
        let lock_killed = zombie::clear_build_lock_holders()?;
        if lock_killed > 0 {
            eprintln!("  [OK] killed {lock_killed} stale build-lock holder(s)");
        } else {
            eprintln!("  [OK] no stale build-lock holders");
        }
        let _ = cleanup_start;

        // ── Stage 4: Pre-flight ──
        stage::section("Pre-flight");
        Preflight.run(ws)?;

        // ── Stage 5: Compile cache (sccache) ──
        stage::section("Compile Cache");
        let sccache_guard = sccache::Guard::new(ws)?;

        // ── Stage 6: Hardened build env ──
        stage::section("Build Environment");
        println!("  > Build env from [build.deps.*] SSOT:");
        platform_config.build.apply_env(ws.root());

        // ── Stage 7: Launch `pnpm tauri build` with teed transcript ──
        stage::section("Tauri Bundle");
        let log_path = ws.root().join("target").join("xtask-build-release.log");
        println!("  > pnpm tauri build");
        println!("  > Scope: release profile compile + static frontend + Windows installers");
        println!(
            "  > Output: {}",
            ws.root().join("target/release/bundle").display()
        );
        println!("  > Transcript: {}", log_path.display());
        println!(
            "  > This runs the full Rust release compile — expect 10–40 min cold, 2–8 min warm."
        );
        println!();

        let build_start = Instant::now();
        let status = ws.exec_tee_log(&ws.desktop_dir(), "pnpm", &["tauri", "build"], &log_path)?;
        let build_secs = build_start.elapsed().as_secs_f64();

        if !status.success() {
            sccache_guard.report();
            let code = status.code().unwrap_or(-1);
            let stage = classify_tauri_failure(&log_path);
            anyhow::bail!(
                "`pnpm tauri build` exited with code {code} after {build_secs:.1}s\n  \
                 Stage:        {stage}\n  \
                 Transcript:   {log}\n  \
                 Hint:         {hint}",
                log = log_path.display(),
                hint = stage.hint(),
            );
        }

        sccache_guard.report();

        // ── Stage 8: Locate the artifact ──
        // Paths come from the workspace root's `target/` — cargo workspaces
        // write there, not under `interfaces/desktop/src-tauri/target/`.
        // The standalone filename is `<productName>-app.exe` on Windows,
        // read from tauri.conf.json so we don't drift from the SSOT.
        stage::section("Artifact");
        let target_release = ws.root().join("target").join("release");
        let bundle_dir = target_release.join("bundle");
        let standalone = match ws.tauri_product_name() {
            Ok(name) => target_release.join(format!("{name}-app.exe")),
            Err(e) => {
                eprintln!("  [!!] could not read productName from tauri.conf.json: {e}");
                target_release.join("devpulse-desktop-app.exe")
            }
        };

        println!("  Build completed in {build_secs:.1}s.");
        println!();
        println!("  Standalone .exe:");
        if standalone.exists() {
            println!("    {}", standalone.display());
        } else {
            println!(
                "    (expected at {} — not found; check tauri.conf.json and the transcript at {})",
                standalone.display(),
                log_path.display()
            );
        }
        println!();
        println!("  Installers:");
        if bundle_dir.exists() {
            let mut any = false;
            if let Ok(entries) = std::fs::read_dir(&bundle_dir) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_dir() {
                        if let Ok(inner) = std::fs::read_dir(&p) {
                            for sub in inner.flatten() {
                                let sp = sub.path();
                                if sp.is_file() {
                                    println!("    {}", sp.display());
                                    any = true;
                                }
                            }
                        }
                    }
                }
            }
            if !any {
                println!(
                    "    (bundle dir exists but is empty at {} — tauri-bundler produced no installers; see transcript)",
                    bundle_dir.display()
                );
            }
        } else {
            println!("    (expected under {} — not found)", bundle_dir.display());
        }
        println!();
        println!("  Smoke test:");
        println!("    1. Close ALL dev processes (no vite, no `tauri dev`).");
        println!("    2. Double-click the standalone .exe or run an installer.");
        println!("    3. Expect: wizard visible, `http://127.0.0.1:8822/health` healthy,");
        println!(
            "       `.userdata/libsql/platform.db` + `.userdata/duckdb/analytics.duckdb` written."
        );

        let total = run_start.elapsed();
        println!();
        println!("xtask build-release: total {:.1}s", total.as_secs_f64());

        // _job_guard drops here → any lingering children killed by kernel.
        Ok(())
    }
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

/// Stage of `pnpm tauri build` that produced the non-zero exit.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TauriStage {
    /// Rust compile error — `error[E...]` or `error:` seen before `Built application`.
    Compile,
    /// Compile succeeded, bundling stage failed but which sub-step is unclear.
    CompileSucceededBundleFailed,
    /// `Running candle` seen, `Running light` not reached — WiX compile failed.
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
    fn hint(self) -> &'static str {
        match self {
            Self::Compile => {
                "Rust compile failed. Look for `error[E` or `error:` lines in the transcript."
            }
            Self::CompileSucceededBundleFailed => {
                "Rust compile succeeded; tauri-bundler failed before producing installers. \
                 Inspect `target/release/wix/x64/` for intermediate artifacts, and re-run \
                 `pnpm tauri build --verbose` from interfaces/desktop to surface the exact bundler stderr."
            }
            Self::CandleFailed => {
                "WiX `candle.exe` failed to compile main.wxs. Check the generated \
                 `target/release/wix/x64/main.wxs` for schema or reference errors."
            }
            Self::LightReportedFailed => {
                "tauri-bundler reported `failed to run light.exe`. \
                 If `target/release/wix/x64/output.msi` exists, light itself succeeded — \
                 the real failure is a post-link step (rename to `bundle/msi/...`, NSIS, \
                 or signing). Re-run with `pnpm tauri build --verbose` to see the exact step. \
                 On Windows this is frequently Defender locking the produced MSI during \
                 real-time scan — exclude `target/release/` to diagnose."
            }
            Self::NsisFailed => {
                "NSIS `makensis.exe` failed. Check the transcript for the NSIS script error; \
                 `targets: \"all\"` in tauri.conf.json builds both MSI and NSIS."
            }
            Self::Unknown => {
                "Failure stage could not be classified from the transcript. \
                 Read the transcript end-to-end to see which step produced the error."
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
/// Read-once, line-scan. Missing file or I/O failure returns `Unknown`.
fn classify_tauri_failure(log_path: &Path) -> TauriStage {
    let Ok(content) = std::fs::read_to_string(log_path) else {
        return TauriStage::Unknown;
    };
    classify_from_transcript(&content)
}

fn classify_from_transcript(transcript: &str) -> TauriStage {
    let mut seen_built_app = false;
    let mut seen_candle = false;
    let mut seen_light = false;
    let mut seen_failed_to_run_light = false;
    let mut seen_failed_nsis = false;
    let mut seen_compile_error = false;

    for line in transcript.lines() {
        if line.contains("Built application at:") || line.contains("Built application at ") {
            seen_built_app = true;
        }
        if line.contains("Running candle") {
            seen_candle = true;
        }
        if line.contains("Running light") {
            seen_light = true;
        }
        if line.contains("failed to run") && line.contains("light.exe") {
            seen_failed_to_run_light = true;
        }
        let lower = line.to_lowercase();
        if lower.contains("makensis") && lower.contains("fail") {
            seen_failed_nsis = true;
        }
        // rustc diagnostic prefixes. We only treat these as compile errors when
        // they happened BEFORE a successful `Built application at:` marker.
        let trimmed = line.trim_start();
        if !seen_built_app && (trimmed.starts_with("error[E") || trimmed.starts_with("error: ")) {
            seen_compile_error = true;
        }
    }

    // Order matters: the later an exit marker is in this chain, the further
    // the build progressed. We return the furthest-reached failure class.
    if seen_failed_nsis {
        return TauriStage::NsisFailed;
    }
    if seen_failed_to_run_light && seen_built_app {
        return TauriStage::LightReportedFailed;
    }
    if seen_candle && !seen_light {
        return TauriStage::CandleFailed;
    }
    if seen_built_app {
        return TauriStage::CompileSucceededBundleFailed;
    }
    if seen_compile_error {
        return TauriStage::Compile;
    }
    TauriStage::Unknown
}

#[cfg(test)]
mod tests {
    use super::{classify_from_transcript, TauriStage};

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
}
