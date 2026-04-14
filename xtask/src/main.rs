//! DevPulse orchestrator — `cargo xtask <command>`.
//!
//! Architecture:
//! - [`Workspace`] — shared context, discovered once, threaded to every task
//! - [`Task`] trait — each subcommand implements it
//! - [`Stage`] — timed status reporting per pipeline step
//! - [`net`] — cross-platform port management
//! - [`zombie`] — stale process cleanup

mod commands;
mod net;
mod stage;
mod workspace;
mod zombie;

use clap::{Parser, Subcommand};
use commands::Task;
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "xtask", about = "DevPulse Orchestrator")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Pre-flight checks: verify toolchain and dependencies.
    Preflight,
    /// Pull and verify external dependency repos.
    Deps,
    /// Start the full Tauri dev environment (desktop + engine).
    RunDev,
    /// Verify the setup: svelte-check + cargo check.
    Verify,
    /// Verify IP boundary: desktop must not depend on clyffy.
    VerifyIpBoundary,
    /// Copy a built DevForge REH tree into the committed per-platform
    /// resource dir. Manual — run after rebuilding REH externally.
    RefreshDevforge {
        /// Target platform subdir: `win32-x64`, `darwin-arm64`,
        /// `darwin-x64`, or `linux-x64`.
        #[arg(long)]
        target: String,
        /// Source REH build root. Defaults to `deps/code-oss-reh-web/`.
        #[arg(long)]
        source: Option<PathBuf>,
    },
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let ws = workspace::Workspace::discover()?;

    let task: Box<dyn Task> = match cli.command {
        Commands::Preflight => Box::new(commands::preflight::Preflight),
        Commands::Deps => Box::new(commands::deps::Deps),
        Commands::RunDev => Box::new(commands::dev::Dev),
        Commands::Verify => Box::new(commands::verify::Verify),
        Commands::VerifyIpBoundary => Box::new(commands::ip_boundary::IpBoundary),
        Commands::RefreshDevforge { target, source } => {
            Box::new(commands::refresh_devforge::RefreshDevForge { target, source })
        }
    };

    eprintln!("xtask: {}", task.name());
    task.run(&ws)
}
