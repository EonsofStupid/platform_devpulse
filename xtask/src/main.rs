//! `DevPulse` task runner for development orchestration.

mod commands;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "xtask")]
#[command(about = "DevPulse Orchestrator", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the full Tauri dev environment (desktop + engine).
    RunDev,
    /// Verify the setup: svelte-check + cargo check.
    VerifyDogfood,
    /// Verify IP boundary: desktop must not depend on maestro.
    VerifyIpBoundary,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::RunDev => commands::dev::run(),
        Commands::VerifyDogfood => commands::verify::run(),
        Commands::VerifyIpBoundary => commands::ip_boundary::run(),
    }
}
