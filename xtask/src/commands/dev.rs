//! `RunDev` — start the full Tauri dev environment.

use xshell::{cmd, Shell};

/// Start the desktop + engine in dev mode.
///
/// Uses `pnpm tauri dev` from `interfaces/desktop/` since the Tauri CLI
/// is installed as an npm devDependency (`@tauri-apps/cli`).
pub fn run() -> anyhow::Result<()> {
    let sh = Shell::new()?;
    println!("Starting DevPulse Tauri dev...");
    sh.change_dir("interfaces/desktop");
    cmd!(sh, "pnpm tauri dev").run()?;
    Ok(())
}
