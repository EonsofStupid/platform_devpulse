//! `DevPulse` task runner for development orchestration.

use clap::{Parser, Subcommand};
use xshell::{cmd, Shell};

#[derive(Parser)]
#[command(name = "xtask")]
#[command(about = "DevPulse Orchestrator", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the full Tauri dev environment (desktop + engine)
    RunDev,
    /// Verify the setup: svelte-check + cargo check
    VerifyDogfood,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let sh = Shell::new()?;

    match cli.command {
        Commands::RunDev => {
            println!("Starting DevPulse Tauri dev...");
            sh.change_dir("interfaces/desktop");
            cmd!(sh, "cargo tauri dev").run()?;
        }
        Commands::VerifyDogfood => {
            println!("Running verification checks...");

            // 1. SvelteKit type check
            println!("  [1/2] svelte-check...");
            sh.change_dir("interfaces/desktop");
            cmd!(sh, "pnpm svelte-check").run()?;

            // 2. Rust workspace check
            println!("  [2/2] cargo check...");
            sh.change_dir("../..");
            cmd!(sh, "cargo check --workspace").run()?;

            println!("All checks passed.");
        }
    }

    Ok(())
}
