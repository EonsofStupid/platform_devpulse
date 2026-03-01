//! `VerifyDogfood` — svelte-check + cargo check.

use xshell::{cmd, Shell};

/// Run frontend and backend verification checks.
pub fn run() -> anyhow::Result<()> {
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
    Ok(())
}
