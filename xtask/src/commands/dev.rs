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

        // ── Stage 3+4: Backend check (background) + Port management (parallel) ──
        //
        // `cargo check -p devpulse_desktop_backend` transitively compiles:
        //   devpulse_desktop_backend → devpulse-engine → devpulse-maestro
        //   Including: Platform facade, all 4 store adapters, health checks.
        //
        // Spawned via spawn_in() so port management runs in parallel.
        // On a warm cache this is <1s. On cold it catches compile errors
        // BEFORE wasting time on the slow Tauri dev build.
        stage::section("Backend");
        let s_backend = Stage::start("compile check");
        let cargo_child = ws.spawn_in(
            ws.root(),
            "cargo",
            &["check", "-p", "devpulse_desktop_backend", "-q"],
        )?;

        // Port management runs WHILE backend compiles
        stage::section("Port Check");
        net::ensure_port_free(net::DEV_PORT)?;

        // Collect backend result
        let cargo_output = cargo_child
            .wait_with_output()
            .context("failed to collect cargo check output")?;

        if cargo_output.status.success() {
            s_backend.ok_with("devpulse_desktop_backend + stores (LibSQL, DuckDB, SurrealDB, Moka)");
        } else {
            let stderr = String::from_utf8_lossy(&cargo_output.stderr);
            if !stderr.is_empty() {
                eprintln!("{stderr}");
            }
            anyhow::bail!(
                "backend compilation failed — fix Rust errors before dev.\n  \
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
