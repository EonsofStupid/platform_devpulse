use clap::{Parser, Subcommand};
use xshell::{cmd, Shell};

#[derive(Parser)]
#[command(name = "xtask")]
#[command(about = "DevPulse System Orchestrator")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Starts the Full System (Platform + Lab)
    /// "ONE EMBEDDED FOR PLATFORM, ONE FOR LAB"
    RunDev,
    /// Strict Release Testing
    TestRelease,
}

fn main() -> anyhow::Result<()> {
    let args = Cli::parse();
    let sh = Shell::new()?;

    match args.command {
        Commands::RunDev => {
            println!(">> [XTASK] ORCHESTRATING DEV MODE...");
            
            // 1. Terminate existing instances
            // (TODO: Robust kill logic)

            // 2. Launch The Lab (Observer) - Has its own Embedded DB
            // Runs in background
            let _lab = std::thread::spawn(move || {
                // cmd!(sh, "cargo tauri dev --cwd ../devpulse_lab").run().unwrap();
                println!(">> [XTASK] SPURNING LAB (Observer)...");
            });

            // 3. Launch The Platform (Maestro) - Has its own Embedded DB
            // Runs in foreground
            println!(">> [XTASK] LAUNCHING PLATFORM (Maestro)...");
            cmd!(sh, "cargo tauri dev --cwd interfaces/desktop").run()?;
        }
        Commands::TestRelease => {
            println!(">> [XTASK] STRICT RELEASE TESTING...");
            cmd!(sh, "cargo test --workspace").run()?;
        }
    }

    Ok(())
}
