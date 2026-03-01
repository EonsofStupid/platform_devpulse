//! Project-local tool resolver.
//!
//! Discovers the workspace root and builds a `PATH` that includes
//! `node_modules/.bin/` so Node-ecosystem tools (pnpm, tauri, biome, etc.)
//! are found without relying on global installs or `.CMD` shim hacks.
//!
//! Uses `std::process::Command` which respects `PATHEXT` on Windows
//! natively — no `cmd /c` wrappers or `#[cfg(windows)]` branches needed.

use anyhow::{Context, Result};
use std::env;
use std::path::{Path, PathBuf};
use std::process::{Command, ExitStatus};

/// Knows where the project's tools live and spawns them correctly.
pub struct ToolResolver {
    /// Workspace root (contains `Cargo.toml` with `[workspace]`).
    project_root: PathBuf,
    /// Augmented `PATH` with local tool dirs prepended.
    augmented_path: std::ffi::OsString,
}

impl ToolResolver {
    /// Discover the workspace from the current working directory.
    ///
    /// Walks up from `cwd` looking for a `Cargo.toml` that sits next to
    /// an `interfaces/desktop/node_modules/.bin/` directory.
    pub fn discover() -> Result<Self> {
        let cwd = env::current_dir().context("failed to get cwd")?;
        let project_root = find_workspace_root(&cwd)
            .context("could not find workspace root (looking for Cargo.toml)")?;

        let node_bin = project_root
            .join("interfaces")
            .join("desktop")
            .join("node_modules")
            .join(".bin");

        let augmented_path = build_augmented_path(&node_bin);

        Ok(Self {
            project_root,
            augmented_path,
        })
    }

    /// The desktop frontend directory (`interfaces/desktop/`).
    pub fn desktop_dir(&self) -> PathBuf {
        self.project_root.join("interfaces").join("desktop")
    }

    /// Create a `Command` for a tool, with the augmented PATH set.
    ///
    /// Works for both Node tools (`pnpm`, `tauri`, `biome`) and system
    /// tools (`cargo`, `git`). `std::process::Command` resolves `.CMD`
    /// and `.BAT` extensions on Windows via `PATHEXT` automatically.
    pub fn cmd(&self, program: &str) -> Command {
        let mut cmd = Command::new(program);
        cmd.env("PATH", &self.augmented_path);
        cmd.current_dir(&self.project_root);
        cmd
    }

    /// Convenience: spawn a tool and wait for it to finish.
    ///
    /// Returns an error if the process cannot be started or exits non-zero.
    pub fn run(&self, program: &str, args: &[&str]) -> Result<ExitStatus> {
        let status = self
            .cmd(program)
            .args(args)
            .status()
            .with_context(|| format!("failed to run `{program}`"))?;

        if !status.success() {
            let code = status.code().unwrap_or(-1);
            anyhow::bail!("`{program}` exited with code {code}");
        }

        Ok(status)
    }

    /// Convenience: run a tool in a specific directory.
    pub fn run_in(&self, dir: &Path, program: &str, args: &[&str]) -> Result<ExitStatus> {
        let status = self
            .cmd(program)
            .args(args)
            .current_dir(dir)
            .status()
            .with_context(|| format!("failed to run `{program}` in {}", dir.display()))?;

        if !status.success() {
            let code = status.code().unwrap_or(-1);
            anyhow::bail!("`{program}` exited with code {code}");
        }

        Ok(status)
    }
}

/// Walk up from `start` to find the workspace root.
fn find_workspace_root(start: &Path) -> Option<PathBuf> {
    let mut dir = start.to_path_buf();
    loop {
        if dir.join("Cargo.toml").is_file() && dir.join("interfaces").is_dir() {
            return Some(dir);
        }
        if !dir.pop() {
            return None;
        }
    }
}

/// Prepend `node_bin` to the system `PATH`.
fn build_augmented_path(node_bin: &Path) -> std::ffi::OsString {
    let system_path = env::var_os("PATH").unwrap_or_default();
    let mut paths = vec![node_bin.to_path_buf()];
    paths.extend(env::split_paths(&system_path));
    env::join_paths(paths).unwrap_or(system_path)
}
