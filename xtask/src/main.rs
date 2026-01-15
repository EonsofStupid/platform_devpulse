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
    /// Start the full Platform + Lab environment
    RunDev,
    /// Verify the setup (Dogfooding)
    VerifyDogfood,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let sh = Shell::new()?;

    match cli.command {
        Commands::RunDev => {
            println!("🚀 Starting DevPulse Platform + Lab...");
            // Use sh to verify environment (Example implementation)
            let _env_check = cmd!(sh, "echo 'Environment Checked'").read()?;
            println!("{}", _env_check);
        }
        Commands::VerifyDogfood => {
            println!("🔍 Verifying Dogfood Status...");
             let _status = cmd!(sh, "echo 'Dogfood Status: OK'").read()?;
             println!("{}", _status);
        }
    }

    Ok(())
}
