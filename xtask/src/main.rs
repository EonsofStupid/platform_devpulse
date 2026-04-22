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
    /// Build the portable release bundle — standalone .exe + Windows installers.
    /// Runs `pnpm tauri build` with the hardened [build.deps.*] env.
    BuildRelease,
    /// Package a portable folder + zip from the already-compiled release build.
    /// Reads `tauri.conf.json` for SSOT: productName/version/externalBin/resources.
    /// Does NOT compile — requires a prior successful `build-release`.
    PackagePortable,
    /// Verify the setup: svelte-check + cargo check.
    Verify,
    /// Verify IP boundary: desktop must not depend on clyffy.
    VerifyIpBoundary,
    /// Download, verify, and extract a pinned DevForge REH release
    /// artifact into the per-platform resource dir. Reads the committed
    /// manifest at `interfaces/desktop/src-tauri/resources/devforge/
    /// manifest.json`. Requires `GITHUB_TOKEN` env var for private repos.
    FetchDevforge {
        /// Target platform subdir: `win32-x64`, `darwin-arm64`,
        /// `darwin-x64`, or `linux-x64`.
        #[arg(long)]
        target: String,
        /// Override the manifest path (defaults to the committed one).
        #[arg(long)]
        manifest: Option<PathBuf>,
        /// Artifact kind — defaults to `reh-web-min` (full extension
        /// support via client/server). Use `client-min` for the Electron
        /// standalone (not currently wired into the runtime).
        #[arg(long)]
        kind: Option<String>,
    },
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let ws = workspace::Workspace::discover()?;

    let task: Box<dyn Task> = match cli.command {
        Commands::Preflight => Box::new(commands::preflight::Preflight),
        Commands::Deps => Box::new(commands::deps::Deps),
        Commands::RunDev => Box::new(commands::dev::Dev),
        Commands::BuildRelease => Box::new(commands::build_release::BuildRelease),
        Commands::PackagePortable => Box::new(commands::package_portable::PackagePortable),
        Commands::Verify => Box::new(commands::verify::Verify),
        Commands::VerifyIpBoundary => Box::new(commands::ip_boundary::IpBoundary),
        Commands::FetchDevforge {
            target,
            manifest,
            kind,
        } => Box::new(commands::fetch_devforge::FetchDevForge {
            target,
            manifest,
            kind,
        }),
    };

    eprintln!("xtask: {}", task.name());
    task.run(&ws)
}
