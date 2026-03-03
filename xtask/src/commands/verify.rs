//! `Verify` — frontend + backend type/lint checks.

use crate::commands::Task;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;

/// Run `svelte-check` + `cargo check --workspace`.
pub struct Verify;

impl Task for Verify {
    fn name(&self) -> &'static str {
        "verify"
    }

    fn run(&self, ws: &Workspace) -> anyhow::Result<()> {
        stage::section("Verify");

        let s1 = Stage::start("svelte-check");
        ws.exec_in(&ws.desktop_dir(), "pnpm", &["svelte-check"])?;
        s1.ok();

        let s2 = Stage::start("cargo check");
        ws.exec("cargo", &["check", "--workspace"])?;
        s2.ok();

        println!();
        println!("  All checks passed.");
        Ok(())
    }
}
