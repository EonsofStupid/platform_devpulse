//! `Dev` — staged dev environment orchestration.
//!
//! Pipeline (each stage is modular and reports its own status):
//!   1. Banner
//!   2. Job Object creation — all children die when xtask dies (Windows)
//!   3. Zombie cleanup — kill stale processes from crashed sessions
//!   4. Port management — ensure :1420 is free
//!   5. Pre-flight — validate toolchain
//!   6. Backend compile — cargo check with live progress (spinner + crate count + elapsed)
//!   7. Launch — `pnpm tauri dev`
//!
//! The Job Object is the key: if xtask crashes, gets killed from Task Manager,
//! or receives Ctrl+C, Windows kernel automatically kills cargo, pnpm, vite,
//! rustc — everything. No zombie processes. Ever.

use crate::commands::preflight::Preflight;
use crate::commands::Task;
use crate::net;
use crate::stage::{self, Stage};
#[allow(unused_imports)] // Stage used conditionally on Windows
use crate::workspace::Workspace;
use crate::zombie;

const VERSION: &str = "0.1.0";

/// Full dev environment startup.
pub struct Dev;

impl Task for Dev {
    fn name(&self) -> &'static str {
        "dev"
    }

    fn run(&self, ws: &Workspace) -> anyhow::Result<()> {
        // ── Stage 1: Banner ──
        print_banner(self.name());

        // ── Stage 2: Job Object (Windows) ──
        // Create BEFORE spawning any children. The _guard must live
        // until the end of this function — dropping it kills all children.
        #[cfg(windows)]
        let _job_guard = {
            let s = Stage::start("job object");
            match zombie::JobGuard::new() {
                Ok(guard) => {
                    s.ok_with("children will die with xtask (kernel-enforced)");
                    Some(guard)
                }
                Err(e) => {
                    s.warn(format!("failed to create job object: {e} — zombies possible"));
                    None
                }
            }
        };

        // ── Stage 3: Zombie cleanup ──
        // Kill stale cargo/node/vite processes from crashed sessions.
        // Without this, port 1420 stays occupied and cargo locks deadlock.
        stage::section("Cleanup");
        zombie::cleanup()?;

        // ── Stage 4: Port management ──
        stage::section("Port Check");
        net::ensure_port_free(net::DEV_PORT)?;

        // ── Stage 5: Pre-flight ──
        Preflight.run(ws)?;

        // ── Stage 6: Backend compile with live progress ──
        //
        // `cargo check -p devpulse_desktop_backend` transitively compiles:
        //   devpulse_desktop_backend → devpulse-engine → devpulse-maestro
        //   Including: Platform facade, all 4 store adapters, health checks.
        //
        // Cold cache: 3-12 minutes (live progress shows layer + crate + X/~Y).
        // Warm cache: <2s.
        let estimated = stage::estimate_crate_count(ws.root(), "devpulse_desktop_backend");
        if estimated > 0 {
            stage::section(&format!("Backend (~{estimated} crates in dependency graph)"));
        } else {
            stage::section("Backend");
        }
        println!("  > cargo check -p devpulse_desktop_backend");
        println!("  > Scope: Tauri backend + Platform facade + 4 stores");

        let cargo_child = ws.spawn_in_stderr_piped(
            ws.root(),
            "cargo",
            &["check", "-p", "devpulse_desktop_backend"],
        )?;

        // Assign cargo to Job Object so it dies if we die
        #[cfg(windows)]
        if let Some(ref guard) = _job_guard {
            if let Err(e) = guard.assign(&cargo_child) {
                eprintln!("  [!!] failed to assign cargo to job: {e}");
            }
        }

        let status = stage::monitor_cargo_child("backend", cargo_child, estimated)?;

        if !status.success() {
            anyhow::bail!(
                "Backend compilation failed — fix the Rust errors above.\n  \
                 Scope: Tauri backend, Platform facade, all 4 embedded stores\n  \
                 (LibSQL, DuckDB, SurrealDB, Moka)."
            );
        }

        // Re-verify port — something might have grabbed it during compile
        if !net::port_is_free(net::DEV_PORT) {
            stage::section("Port Recovery");
            net::ensure_port_free(net::DEV_PORT)?;
        }

        // ── Stage 7: Launch ──
        stage::section("Launch");
        println!("  > pnpm tauri dev");
        println!("  > Vite        → http://localhost:{}", net::DEV_PORT);
        println!("  > Platform    → LibSQL + DuckDB + SurrealDB + Moka");
        println!("  > Ctrl+C      → kills all children (job object enforced)");
        println!();

        ws.exec_in(&ws.desktop_dir(), "pnpm", &["tauri", "dev"])?;

        // _job_guard drops here → all remaining children killed by kernel
        Ok(())
    }
}

fn print_banner(task_name: &str) {
    println!();
    println!("========================================");
    println!("  DevPulse Platform v{VERSION} [{task_name}]");
    println!("========================================");
}
