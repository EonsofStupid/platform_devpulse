//! `Dev` — staged dev environment orchestration.
//!
//! Pipeline (each stage is modular and reports its own status):
//!   1. Banner
//!   2. Job Object creation — all children die when xtask dies (Windows)
//!   3. Zombie cleanup — kill stale processes from crashed sessions
//!   4. Port management — ensure dev port is free (config-driven)
//!   5. Pre-flight — validate toolchain
//!   6. Backend compile — cargo check with live progress (spinner + crate count + elapsed)
//!   7. Launch — `pnpm tauri dev`
//!
//! The Job Object is the key: if xtask crashes, gets killed from Task Manager,
//! or receives Ctrl+C, Windows kernel automatically kills cargo, pnpm, vite,
//! rustc — everything. No zombie processes. Ever.

use crate::commands::preflight::Preflight;
use crate::commands::sccache;
use crate::commands::Task;
use crate::net;
use crate::stage::{self, Stage};
#[allow(unused_imports)] // Stage used conditionally on Windows
use crate::workspace::Workspace;
use crate::zombie;

use anyhow::Context;
use std::fs;
use std::io::Write;
use std::time::Instant;

const VERSION: &str = "0.1.0";

/// Full dev environment startup.
pub struct Dev;

impl Task for Dev {
    fn name(&self) -> &'static str {
        "dev"
    }

    fn run(&self, ws: &Workspace) -> anyhow::Result<()> {
        let run_start = Instant::now();
        let platform_config = ws.platform_config()?;
        let dev_port = platform_config.services.network.dev_server.port;

        // ── Log file setup ──
        // Overwrites on each run — always reflects the latest session.
        let log_dir = ws.root().join(".userdata").join("logs");
        fs::create_dir_all(&log_dir)?;
        let log_path = log_dir.join("run-dev.log");
        let mut log = LogFile::create(&log_path)?;
        log.header("DevPulse Platform", VERSION, self.name())?;

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
                    log.stage("job_object", "OK", "kernel-enforced child cleanup")?;
                    Some(guard)
                }
                Err(e) => {
                    let msg = format!("failed: {e} — zombies possible");
                    s.warn(&msg);
                    log.stage("job_object", "WARN", &msg)?;
                    None
                }
            }
        };

        // ── Stage 3: Zombie cleanup ──
        // Clean ALL platform ports — not just the dev server.
        let graph_api_port = platform_config.services.network.graph_api.port;
        stage::section("Cleanup");
        let cleanup_start = Instant::now();
        zombie::cleanup(dev_port)?;
        log.stage_timed(
            "zombie_cleanup",
            "OK",
            "stale processes cleaned",
            cleanup_start,
        )?;

        // ── Stage 4: Port management ──
        // Ensure ALL platform ports are free before launching anything.
        stage::section("Port Check");
        let port_start = Instant::now();
        net::ensure_port_free(dev_port)?;
        log.stage_timed("port_check", "OK", &format!(":{dev_port} free"), port_start)?;

        let graph_port_start = Instant::now();
        net::ensure_port_free(graph_api_port)?;
        log.stage_timed(
            "port_check",
            "OK",
            &format!(":{graph_api_port} free (SurrealDB HTTP)"),
            graph_port_start,
        )?;

        // ── Stage 5: Pre-flight ──
        let preflight_start = Instant::now();
        Preflight.run(ws)?;
        log.stage_timed("preflight", "OK", "toolchain validated", preflight_start)?;

        // ── Stage 5.5: External dep builds (only when source changed) ──
        stage::section("External Dependencies");
        let deps_start = Instant::now();
        match crate::commands::build_deps::build_all(ws) {
            Ok(()) => {
                log.stage_timed("dep_builds", "OK", "external deps checked", deps_start)?;
            }
            Err(e) => {
                // Non-fatal — DevForge/etc can be disabled
                log.stage_timed("dep_builds", "WARN", &format!("{e:#}"), deps_start)?;
                eprintln!("  [WARN] External dep build issue: {e:#}");
            }
        }

        // ── Stage 5.6: Build lock scan ──
        // Kill stale cargo/rustc from crashed sessions BEFORE we touch cargo.
        // Without this, cargo check blocks forever on the file lock with zero output.
        stage::section("Build Lock");
        let lock_start = Instant::now();
        let lock_killed = zombie::clear_build_lock_holders()?;
        if lock_killed > 0 {
            log.stage_timed(
                "build_lock",
                "OK",
                &format!("killed {lock_killed} lock holder(s)"),
                lock_start,
            )?;
        } else {
            log.stage_timed("build_lock", "OK", "lock is free", lock_start)?;
        }

        // ── Stage 5.7: Compile cache (sccache) ──
        // Transparent rustc caching. If sccache is installed, every rustc
        // invocation from here on routes through it — surviving `cargo
        // clean`, feature-flag flips, and toolchain bumps. If not installed,
        // this stage prints an install hint and proceeds without caching.
        // See xtask/src/commands/sccache.rs for the rationale (sccache vs
        // wrapper-crate staging).
        stage::section("Compile Cache");
        let sccache_start = Instant::now();
        let sccache_guard = sccache::Guard::new(ws)?;
        log.stage_timed("sccache", "OK", "compile cache checked", sccache_start)?;

        // ── Stage 6: Backend compile with live progress ──
        let estimated = stage::estimate_crate_count(ws.root(), "devpulse_desktop_backend");
        if estimated > 0 {
            stage::section(&format!(
                "Backend (~{estimated} crates in dependency graph)"
            ));
        } else {
            stage::section("Backend");
        }
        println!("  > cargo check -p devpulse_desktop_backend");
        println!("  > Scope: Tauri backend + Platform facade + 7 services");
        log.entry(&format!(
            "backend_compile: ~{estimated} crates in dep graph"
        ))?;

        // Build environment — all env vars from platform.default.toml [build.deps.*] SSOT.
        // No hardcoded env vars here. Everything derives from the config.
        println!("  > Build env from [build.deps.*] SSOT:");
        platform_config.build.apply_env(ws.root());

        let compile_start = Instant::now();
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

        let compile = stage::monitor_cargo_child("backend", cargo_child, estimated)?;

        if !compile.status.success() {
            log.stage_timed(
                "backend_compile",
                "FAIL",
                "compilation errors",
                compile_start,
            )?;
            log.footer(run_start)?;
            anyhow::bail!(
                "Backend compilation failed — fix the Rust errors above.\n  \
                 Scope: Tauri backend, Platform facade, all 4 embedded services\n  \
                 (LibSQL, DuckDB, SurrealDB, Moka)."
            );
        }
        let compile_secs = compile_start.elapsed().as_secs_f64();
        log.stage_timed(
            "backend_compile",
            "OK",
            &format!("{estimated} crates in {compile_secs:.1}s"),
            compile_start,
        )?;

        // Diff sccache stats against the pre-compile snapshot so the dev
        // server UX shows the hit rate this build got from the cache.
        sccache_guard.report();

        // Re-verify port — something might have grabbed it during compile
        if !net::port_is_free(dev_port) {
            stage::section("Port Recovery");
            net::ensure_port_free(dev_port)?;
            log.stage("port_recovery", "OK", "port reclaimed after compile")?;
        }

        // ── Stage 7: Launch ──
        // Spawn as Child so we can assign to Job Object.
        // exec_in() uses .status() which never returns a handle — zombies escape.
        stage::section("Launch");
        println!("  > pnpm tauri dev");
        let dev_bind = &platform_config.services.network.dev_server.bind;
        println!("  > Vite        → http://{}:{}", dev_bind, dev_port);
        println!("  > Platform    → LibSQL + DuckDB + SurrealDB + Moka + RRO + Kokoros + Outlines");
        let graph_api = &platform_config.services.network.graph_api;
        println!(
            "  > SurrealDB   → http://{}:{} (HTTP server)",
            graph_api.bind, graph_api.port
        );
        println!("  > Ctrl+C      → kills all children (job object enforced)");
        println!();
        log.stage("launch", "START", "pnpm tauri dev")?;
        log.footer(run_start)?;

        // Set env var so Vite reads port from config SSOT
        std::env::set_var("DEVPULSE_DEV_PORT", dev_port.to_string());

        let mut tauri_child = ws.spawn_in_verbose(&ws.desktop_dir(), "pnpm", &["tauri", "dev"])?;

        // Assign pnpm (and its child tree) to the Job Object so Ctrl+C
        // kills everything — vite, node, cargo, the Tauri backend, all of it.
        #[cfg(windows)]
        if let Some(ref guard) = _job_guard {
            if let Err(e) = guard.assign(&tauri_child) {
                eprintln!("  [!!] failed to assign tauri dev to job: {e}");
                log.stage("launch", "WARN", &format!("job assign failed: {e}"))?;
            }
        }

        let status = tauri_child
            .wait()
            .context("failed to wait on pnpm tauri dev")?;
        if !status.success() {
            let code = status.code().unwrap_or(-1);
            anyhow::bail!("`pnpm tauri dev` exited with code {code}");
        }

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

// ═══════════════════════════════════════════════════════════════
// Log file — technical run log, overwrites each session
// ═══════════════════════════════════════════════════════════════

/// Structured log file for xtask run-dev sessions.
///
/// Overwrites on each run. Provides a technical record of every stage,
/// timing, and outcome for post-run review.
struct LogFile {
    file: fs::File,
    run_start: Instant,
}

impl LogFile {
    /// Create (or truncate) the log file.
    fn create(path: &std::path::Path) -> anyhow::Result<Self> {
        let file = fs::File::create(path)?;
        Ok(Self {
            file,
            run_start: Instant::now(),
        })
    }

    /// Write the log file header with timestamp and version.
    fn header(&mut self, name: &str, version: &str, task: &str) -> anyhow::Result<()> {
        let now = timestamp();
        writeln!(self.file, "# {name} v{version} [{task}]")?;
        writeln!(self.file, "# Started: {now}")?;
        writeln!(
            self.file,
            "# OS: {} {}",
            std::env::consts::OS,
            std::env::consts::ARCH
        )?;
        writeln!(self.file, "#")?;
        writeln!(self.file)?;
        Ok(())
    }

    /// Log a stage result.
    fn stage(&mut self, name: &str, status: &str, detail: &str) -> anyhow::Result<()> {
        let ts = elapsed_tag(&self.run_start);
        writeln!(self.file, "[{ts}] [{status:>5}] {name}: {detail}")?;
        self.file.flush()?;
        Ok(())
    }

    /// Log a stage result with elapsed time from a specific start point.
    fn stage_timed(
        &mut self,
        name: &str,
        status: &str,
        detail: &str,
        started: Instant,
    ) -> anyhow::Result<()> {
        let elapsed_ms = started.elapsed().as_millis();
        let ts = elapsed_tag(&self.run_start);
        writeln!(
            self.file,
            "[{ts}] [{status:>5}] {name}: {detail} ({elapsed_ms}ms)"
        )?;
        self.file.flush()?;
        Ok(())
    }

    /// Log a free-form entry.
    fn entry(&mut self, msg: &str) -> anyhow::Result<()> {
        let ts = elapsed_tag(&self.run_start);
        writeln!(self.file, "[{ts}] [INFO ] {msg}")?;
        self.file.flush()?;
        Ok(())
    }

    /// Write the footer with total elapsed time.
    fn footer(&mut self, run_start: Instant) -> anyhow::Result<()> {
        let total = run_start.elapsed();
        let now = timestamp();
        writeln!(self.file)?;
        writeln!(
            self.file,
            "# Completed: {now} (total: {:.1}s)",
            total.as_secs_f64()
        )?;
        self.file.flush()?;
        Ok(())
    }
}

/// UTC timestamp string from `SystemTime`.
fn timestamp() -> String {
    use std::time::SystemTime;
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = now.as_secs();
    // Simple UTC breakdown (no chrono needed)
    let days = secs / 86400;
    let time_secs = secs % 86400;
    let hours = time_secs / 3600;
    let mins = (time_secs % 3600) / 60;
    let s = time_secs % 60;
    let ms = now.subsec_millis();

    // Days since epoch → year/month/day (simplified)
    let (year, month, day) = days_to_ymd(days);
    format!("{year:04}-{month:02}-{day:02}T{hours:02}:{mins:02}:{s:02}.{ms:03}Z")
}

/// Elapsed time tag relative to run start (e.g. "+002.341s").
fn elapsed_tag(start: &Instant) -> String {
    let e = start.elapsed();
    let secs = e.as_secs();
    let ms = e.subsec_millis();
    format!("+{secs:03}.{ms:03}s")
}

/// Convert days since Unix epoch to (year, month, day).
fn days_to_ymd(days: u64) -> (u64, u64, u64) {
    // Shift to March 1, 2000 epoch for easier leap year calculation
    let era_days = days + 719_468;
    let era = era_days / 146_097;
    let doe = era_days - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}
