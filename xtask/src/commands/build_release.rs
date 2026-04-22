//! `BuildRelease` — portable release `.exe` / installer bundle.
//!
//! Wraps `pnpm tauri build` with the same hardened env the dev
//! command uses ([`Dev`]), so NASM, PYO3, CMake, sccache, and the
//! llama.cpp / CUDA runtime DLLs declared in `platform.default.toml
//! [build.deps.*]` all reach the bundle step with the correct flags.
//!
//! Output lands under `interfaces/desktop/src-tauri/target/release/bundle/`.
//! On Windows that's `bundle/msi/*.msi` + `bundle/nsis/*.exe` plus a
//! standalone `target/release/devpulse-desktop.exe` that loads the
//! compiled-static frontend from the bundled resources — no Vite, no
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

use crate::commands::preflight::Preflight;
use crate::commands::sccache;
use crate::commands::Task;
use crate::stage;
#[allow(unused_imports)]
use crate::workspace::Workspace;
use crate::zombie;

use anyhow::Context;
use std::time::Instant;

const VERSION: &str = "0.1.0";

/// Portable release bundle build.
pub struct BuildRelease;

impl Task for BuildRelease {
    fn name(&self) -> &'static str {
        "build-release"
    }

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
        // Mirror dev — every env var in [build.deps.*] SSOT is applied
        // here so NASM, PYO3_PYTHON, CMAKE_POLICY_VERSION_MINIMUM, etc.
        // reach rustc + tauri bundle in release mode.
        stage::section("Build Environment");
        println!("  > Build env from [build.deps.*] SSOT:");
        platform_config.build.apply_env(ws.root());

        // ── Stage 7: Launch `pnpm tauri build` ──
        stage::section("Tauri Bundle");
        println!("  > pnpm tauri build");
        println!("  > Scope: release profile compile + static frontend + Windows installers");
        println!("  > Output: interfaces/desktop/src-tauri/target/release/bundle/");
        println!("  > This runs the full Rust release compile — expect 10–40 min cold, 2–8 min warm.");
        println!();

        let build_start = Instant::now();
        let mut tauri_child = ws.spawn_in_verbose(
            &ws.desktop_dir(),
            "pnpm",
            &["tauri", "build"],
        )?;

        // Assign pnpm (and its child tree) to the Job Object.
        #[cfg(windows)]
        if let Some(ref guard) = _job_guard {
            if let Err(e) = guard.assign(&tauri_child) {
                eprintln!("  [!!] failed to assign tauri build to job: {e}");
            }
        }

        let status = tauri_child.wait().context("failed to wait on pnpm tauri build")?;
        let build_secs = build_start.elapsed().as_secs_f64();

        if !status.success() {
            // Print sccache stats anyway — they may explain a cache miss storm.
            sccache_guard.report();
            let code = status.code().unwrap_or(-1);
            anyhow::bail!(
                "`pnpm tauri build` exited with code {code} after {build_secs:.1}s — \
                 fix the compile errors above.\n  \
                 Common causes: missing CUDA DLL under interfaces/desktop/src-tauri/binaries/, \
                 stale sccache (try `cargo clean && sccache --zero-stats`), \
                 feature-flag drift between run-dev and build."
            );
        }

        sccache_guard.report();

        // ── Stage 8: Locate the artifact ──
        stage::section("Artifact");
        let bundle_dir = ws.root()
            .join("interfaces/desktop/src-tauri/target/release/bundle");
        let standalone = ws.root()
            .join("interfaces/desktop/src-tauri/target/release/devpulse-desktop.exe");

        println!("  Build completed in {build_secs:.1}s.");
        println!();
        println!("  Standalone .exe:");
        if standalone.exists() {
            println!("    {}", standalone.display());
        } else {
            println!("    (expected at {} — not found; check tauri.conf.json)", standalone.display());
        }
        println!();
        println!("  Installers:");
        if bundle_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&bundle_dir) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_dir() {
                        if let Ok(inner) = std::fs::read_dir(&p) {
                            for sub in inner.flatten() {
                                let sp = sub.path();
                                if sp.is_file() {
                                    println!("    {}", sp.display());
                                }
                            }
                        }
                    }
                }
            }
        } else {
            println!("    (expected under {} — not found)", bundle_dir.display());
        }
        println!();
        println!("  Smoke test:");
        println!("    1. Close ALL dev processes (no vite, no `tauri dev`).");
        println!("    2. Double-click the standalone .exe or run an installer.");
        println!("    3. Expect: wizard visible, `http://127.0.0.1:8822/health` healthy,");
        println!("       `.userdata/libsql/platform.db` + `.userdata/duckdb/analytics.duckdb` written.");

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
