//! DevPulse orchestrator — `cargo xtask <command>`.
//!
//! Architecture:
//! - [`Workspace`] — shared context, discovered once, threaded to every task
//! - [`Task`] trait — each subcommand implements it
//! - [`Stage`] — timed status reporting per pipeline step
//! - [`net`] — cross-platform port management

mod commands;
mod net;
mod stage;
mod workspace;

use clap::{Parser, Subcommand};
use commands::Task;

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
    /// Start the full Tauri dev environment (desktop + engine).
    RunDev,
    /// Verify the setup: svelte-check + cargo check.
    Verify,
    /// Verify IP boundary: desktop must not depend on maestro.
    VerifyIpBoundary,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let ws = workspace::Workspace::discover()?;

    let task: Box<dyn Task> = match cli.command {
        Commands::Preflight => Box::new(commands::preflight::Preflight),
        Commands::RunDev => Box::new(commands::dev::Dev),
        Commands::Verify => Box::new(commands::verify::Verify),
        Commands::VerifyIpBoundary => Box::new(commands::ip_boundary::IpBoundary),
    };

    eprintln!("xtask: {}", task.name());
    task.run(&ws)
}
