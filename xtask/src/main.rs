//! DevPulse orchestrator — `cargo xtask <command>`.
//!
//! Architecture:
//! - [`Workspace`] — shared context, discovered once, threaded to every task
//! - [`Task`] trait — each subcommand implements it
//! - [`Stage`] — timed status reporting per pipeline step
//! - [`net`] — cross-platform port management
//! - [`zombie`] — stale process cleanup

mod commands;
mod events;
mod manifest;
mod net;
mod out;
mod sbom;
mod smoke;
mod stage;
mod workspace;
mod zombie;

use clap::{Parser, Subcommand};
use commands::Task;
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "xtask", about = "DevPulse Orchestrator")]
struct Cli {
    /// Suppress informational progress lines. Warnings and errors still
    /// print to stderr. Useful for CI where only failures matter.
    #[arg(long, global = true)]
    quiet: bool,
    /// Enable verbose diagnostic output (`out::debug` lines). Takes
    /// effect only when `--quiet` is not set.
    #[arg(long, global = true)]
    verbose: bool,
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
    BuildRelease {
        /// Skip installer bundling (NSIS/MSI). Builds the standalone .exe
        /// and frontend only, then invokes `package-portable` to produce
        /// the runnable folder + zip. Use this when installer generation
        /// is failing (e.g. Defender locking MSI, NSIS script errors)
        /// or when you only need a portable distribution.
        #[arg(long)]
        portable_only: bool,
    },
    /// Write `devpulse.json` manifests into every model directory under
    /// `models/` (or `--dir <path>`). Infers canonical_id, architecture,
    /// parameter count, quant from path + filename; computes SHA-256 for
    /// every file. One-shot migration to the canonical-id SSOT so presets
    /// stop filename-string-matching against phantom inventory.
    ModelManifestBackfill {
        /// Root models directory. Defaults to `<repo>/models`.
        #[arg(long)]
        dir: Option<PathBuf>,
        /// Overwrite existing `devpulse.json` files. Default: skip.
        #[arg(long)]
        force: bool,
        /// Plan only — classify + report, never write.
        #[arg(long)]
        dry_run: bool,
    },
    /// Regenerate `interfaces/desktop/src/lib/sys/generated/bindings.ts` by
    /// running the dedicated `export-bindings` binary from the correct
    /// cwd. Exists so the specta export is reproducible, gated, and
    /// logged instead of a manual incantation that keeps regressing to
    /// black-screen installers.
    RegenBindings,
    /// Package a portable folder + zip from the already-compiled release build.
    /// Reads `tauri.conf.json` for SSOT: productName/version/externalBin/resources.
    /// Does NOT compile — requires a prior successful `build-release`.
    PackagePortable {
        /// Walk every stage, report what would be copied, write nothing.
        /// Surfaces missing externalBin/resource files before a real run.
        #[arg(long)]
        dry_run: bool,
    },
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
    /// Download the SurrealDB sidecar binary into
    /// `interfaces/desktop/src-tauri/binaries/`. The release tag is
    /// pinned in `fetch_surreal.rs` to match the `surrealdb` crate
    /// version in the workspace.
    FetchSurreal {
        /// Target platform: `win32-x64`, `darwin-arm64`, `darwin-x64`,
        /// `linux-x64`, or `linux-arm64`.
        #[arg(long)]
        target: String,
        /// Re-download even if the destination file already exists.
        #[arg(long)]
        force: bool,
    },
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    out::set_level_from_flags(cli.quiet, cli.verbose);
    let ws = workspace::Workspace::discover()?;

    let task: Box<dyn Task> = match cli.command {
        Commands::Preflight => Box::new(commands::preflight::Preflight),
        Commands::Deps => Box::new(commands::deps::Deps),
        Commands::RunDev => Box::new(commands::dev::Dev),
        Commands::BuildRelease { portable_only } => {
            Box::new(commands::build_release::BuildRelease { portable_only })
        }
        Commands::ModelManifestBackfill { dir, force, dry_run } => Box::new(
            commands::model_manifest_backfill::ModelManifestBackfill { dir, force, dry_run },
        ),
        Commands::RegenBindings => Box::new(commands::regen_bindings::RegenBindings),
        Commands::PackagePortable { dry_run } => {
            Box::new(commands::package_portable::PackagePortable { dry_run })
        }
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
        Commands::FetchSurreal { target, force } => {
            Box::new(commands::fetch_surreal::FetchSurreal { target, force })
        }
    };

    // Task banner on stdout — it's progress, not a warning. Suppressed
    // under --quiet alongside the other info lines.
    xinfo!("xtask: {}", task.name());
    task.run(&ws)
}
