//! `VerifyDogfood` — svelte-check + cargo check.

use crate::tools::ToolResolver;

/// Run frontend and backend verification checks.
pub fn run() -> anyhow::Result<()> {
    let tools = ToolResolver::discover()?;
    println!("Running verification checks...");

    // 1. SvelteKit type check
    println!("  [1/2] svelte-check...");
    tools.run_in(&tools.desktop_dir(), "pnpm", &["svelte-check"])?;

    // 2. Rust workspace check
    println!("  [2/2] cargo check...");
    tools.run("cargo", &["check", "--workspace"])?;

    println!("All checks passed.");
    Ok(())
}
