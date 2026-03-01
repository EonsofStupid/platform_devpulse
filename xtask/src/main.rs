//! `DevPulse` task runner for development orchestration.

use anyhow::Context;
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
        Commands::RunDev => {
            let sh = Shell::new()?;
            println!("Starting DevPulse Tauri dev...");
            sh.change_dir("interfaces/desktop");
            cmd!(sh, "cargo tauri dev").run()?;
        }
        Commands::VerifyDogfood => {
            let sh = Shell::new()?;
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
        Commands::VerifyIpBoundary => {
            verify_ip_boundary()?;
        }
    }

    Ok(())
}

/// Verify the IP boundary invariants using cargo metadata.
///
/// Checks:
/// 1. Desktop backend does NOT depend on maestro directly
/// 2. Engine DOES depend on maestro (facade pattern)
/// 3. Engine has both `kernel` and `engine` features
fn verify_ip_boundary() -> anyhow::Result<()> {
    println!("Verifying IP boundary...");

    let metadata = cargo_metadata::MetadataCommand::new()
        .exec()
        .context("Failed to run cargo metadata")?;

    // 1. Desktop must NOT depend on maestro
    let desktop = metadata
        .packages
        .iter()
        .find(|p| p.name == "devpulse_desktop_backend")
        .context("Desktop backend package not found in workspace")?;

    let desktop_has_maestro = desktop
        .dependencies
        .iter()
        .any(|d| d.name == "devpulse-maestro");

    if desktop_has_maestro {
        anyhow::bail!(
            "IP BOUNDARY VIOLATION: devpulse_desktop_backend has a direct \
             dependency on devpulse-maestro. All kernel access must go \
             through the devpulse-engine facade."
        );
    }
    println!("  [OK] Desktop does not depend on maestro directly");

    // 2. Engine MUST depend on maestro (facade pattern)
    let engine = metadata
        .packages
        .iter()
        .find(|p| p.name == "devpulse-engine")
        .context("Engine package not found in workspace")?;

    let engine_has_maestro = engine
        .dependencies
        .iter()
        .any(|d| d.name == "devpulse-maestro");

    if !engine_has_maestro {
        anyhow::bail!(
            "IP BOUNDARY BROKEN: devpulse-engine does not depend on \
             devpulse-maestro. The facade pattern requires this dependency."
        );
    }
    println!("  [OK] Engine depends on maestro (facade pattern)");

    // 3. Engine must have both feature gates
    let feature_names: Vec<&str> = engine.features.keys().map(String::as_str).collect();

    if !feature_names.contains(&"kernel") {
        anyhow::bail!("Engine missing 'kernel' feature gate");
    }
    if !feature_names.contains(&"engine") {
        anyhow::bail!("Engine missing 'engine' feature gate");
    }
    println!("  [OK] Feature gates present: kernel, engine");

    println!("IP boundary verified.");
    Ok(())
}
