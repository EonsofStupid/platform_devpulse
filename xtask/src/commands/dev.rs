//! `RunDev` — start the full Tauri dev environment.

use crate::tools::ToolResolver;

/// Start the desktop + engine in dev mode.
///
/// Uses `pnpm tauri dev` from `interfaces/desktop/` since the Tauri CLI
/// is installed as an npm devDependency (`@tauri-apps/cli`).
pub fn run() -> anyhow::Result<()> {
    let tools = ToolResolver::discover()?;
    println!("Starting DevPulse Tauri dev...");
    tools.run_in(&tools.desktop_dir(), "pnpm", &["tauri", "dev"])?;
    Ok(())
}
