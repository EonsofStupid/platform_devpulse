//! `RunDev` — start the full Tauri dev environment.

use crate::tools::ToolResolver;

const VERSION: &str = "0.1.0";

/// Start the desktop + engine in dev mode.
///
/// The Tauri CLI lives in `node_modules/.bin/` as an npm devDependency.
/// `ToolResolver` finds it regardless of platform (handles `.CMD` shims
/// on Windows, bare binaries on Unix).
pub fn run() -> anyhow::Result<()> {
    print_banner();
    super::preflight::run()?;

    let tools = ToolResolver::discover()?;
    println!();
    println!("--- Starting UI ---");
    println!("  > tauri dev");
    println!();
    tools.run_in(&tools.desktop_dir(), "pnpm", &["tauri", "dev"])?;
    Ok(())
}

fn print_banner() {
    println!();
    println!("========================================");
    println!("  DevPulse Platform v{VERSION}");
    println!("========================================");
    println!();
}
