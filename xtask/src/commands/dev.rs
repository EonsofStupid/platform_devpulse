//! `Dev` — staged dev environment orchestration.
//!
//! Pipeline:
//!   1. Banner (task name)
//!   2. Pre-flight (toolchain validation)
//!   3. Backend verification (cargo check of desktop backend + all embedded stores)
//!      — runs parallel with port management via `spawn_in()`
//!   4. Port management (ensure 1420 is free)
//!   5. Launch `pnpm tauri dev` (Vite + Cargo in parallel, managed by Tauri CLI)
//!
//! When Tauri starts, `Platform::boot()` initializes all 4 embedded stores
//! (LibSQL, DuckDB, SurrealDB, Moka) and runs health verification.
//! The xtask backend check ensures this code compiles BEFORE launching.

use crate::commands::preflight::Preflight;
use crate::commands::Task;
use crate::net;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;
use anyhow::Context;

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

        // ── Stage 2: Pre-flight ──
        Preflight.run(ws)?;

        // ── Stage 3+4: Backend check (verbose) + Port management (parallel) ──
        //
        // `cargo check -p devpulse_desktop_backend` transitively compiles:
        //   devpulse_desktop_backend → devpulse-engine → devpulse-maestro
        //   Including: Platform facade, all 4 store adapters, health checks.
        //
        // Spawned via spawn_in_verbose() — stderr streams to the terminal
        // so the user sees cargo's real-time progress (Compiling X, Checking Y).
        // On a warm cache this is <1s. On cold it shows every crate as it builds.
        stage::section("Backend");
        println!("  > cargo check -p devpulse_desktop_backend");
        let s_backend = Stage::start("compile check");
        let mut cargo_child = ws.spawn_in_verbose(
            ws.root(),
            "cargo",
            &["check", "-p", "devpulse_desktop_backend"],
        )?;

        // Port management runs WHILE backend compiles
        stage::section("Port Check");
        net::ensure_port_free(net::DEV_PORT)?;

        // Wait for backend — stderr already streamed to terminal
        let status = cargo_child
            .wait()
            .context("failed to wait on cargo check")?;

        if status.success() {
            s_backend.ok_with("devpulse_desktop_backend + stores (LibSQL, DuckDB, SurrealDB, Moka)");
        } else {
            anyhow::bail!(
                "backend compilation failed — fix Rust errors above.\n  \
                 This check covers: Tauri backend, Platform facade, all 4 embedded stores."
            );
        }

        // ── Stage 5: Launch ──
        stage::section("Launch");
        println!("  > pnpm tauri dev");
        println!("  > Vite → http://localhost:{}", net::DEV_PORT);
        println!("  > Platform::boot() → 4 embedded stores");
        println!();

        ws.exec_in(&ws.desktop_dir(), "pnpm", &["tauri", "dev"])?;

        Ok(())
    }
}

fn print_banner(task_name: &str) {
    println!();
    println!("========================================");
    println!("  DevPulse Platform v{VERSION} [{task_name}]");
    println!("========================================");
}
