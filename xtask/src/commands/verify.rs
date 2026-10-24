//! `Verify` — frontend + backend type/lint checks.
//!
//! Runs svelte-check and cargo check **in parallel** — both spawn immediately,
//! both report independently. Cuts verify time nearly in half on warm cache.

use crate::commands::Task;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;

/// Run `svelte-check` + `cargo check --workspace` in parallel.
pub struct Verify;

impl Task for Verify {
    fn name(&self) -> &'static str {
        "verify"
    }

    fn run(&self, ws: &Workspace) -> anyhow::Result<()> {
        stage::section("Verify");

        // Apply build env from the [build.deps.*] SSOT before spawning cargo —
        // matches `run-dev` / `build-release`. Without this, native build
        // scripts (C/C++ dependencies) fail to find cmake/ninja/nasm.
        let platform_config = ws.platform_config()?;
        println!("  > Build env from [build.deps.*] SSOT:");
        platform_config.build.apply_env(ws.root());

        // Spawn both checks concurrently — don't wait for one to finish first
        let svelte_child = ws.spawn_in_verbose(&ws.desktop_dir(), "pnpm", &["svelte-check"])?;

        let cargo_child = ws.spawn_in(ws.root(), "cargo", &["check", "--workspace"])?;

        // Wait for both — order doesn't matter, both are already running
        let svelte_stage = Stage::start("svelte-check");
        let svelte_status = svelte_child
            .wait_with_output()
            .map_err(|e| anyhow::anyhow!("svelte-check wait failed: {e}"))?;

        if svelte_status.status.success() {
            svelte_stage.ok();
        } else {
            svelte_stage.fail("type errors (see output above)");
        }

        let cargo_stage = Stage::start("cargo check");
        let cargo_status = cargo_child
            .wait_with_output()
            .map_err(|e| anyhow::anyhow!("cargo check wait failed: {e}"))?;

        if cargo_status.status.success() {
            cargo_stage.ok();
        } else {
            cargo_stage.fail("compilation errors");
            let stderr = String::from_utf8_lossy(&cargo_status.stderr);
            for line in stderr.lines().filter(|l| l.trim().starts_with("error")) {
                eprintln!("         {line}");
            }
        }

        // Fail the task if either check failed
        let svelte_ok = svelte_status.status.success();
        let cargo_ok = cargo_status.status.success();

        if !svelte_ok && !cargo_ok {
            anyhow::bail!("Both svelte-check and cargo check failed.");
        } else if !svelte_ok {
            anyhow::bail!("svelte-check failed — fix TypeScript errors above.");
        } else if !cargo_ok {
            anyhow::bail!("cargo check failed — fix Rust errors above.");
        }

        println!();
        println!("  All checks passed.");
        Ok(())
    }
}
