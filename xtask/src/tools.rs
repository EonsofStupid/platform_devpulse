//! Project-local tool resolver.
//!
//! Prepends `interfaces/desktop/node_modules/.bin` to the search path and
//! uses the [`which`] crate for cross-platform binary resolution (handles
//! `PATHEXT` on Windows, executable-bit checks on Unix, symlinks everywhere).

use anyhow::{Context, Result};
use std::env;
use std::path::{Path, PathBuf};
use std::process::{Command, ExitStatus};

/// Resolves project-local and system tools, spawns them correctly.
pub struct ToolResolver {
    /// Workspace root (contains root `Cargo.toml`).
    project_root: PathBuf,
    /// Augmented PATH for tool resolution and child process inheritance.
    augmented_path: std::ffi::OsString,
}

impl ToolResolver {
    /// Discover the workspace from the current working directory.
    pub fn discover() -> Result<Self> {
        let cwd = env::current_dir().context("failed to get cwd")?;
        let project_root = find_workspace_root(&cwd)
            .context("could not find workspace root (Cargo.toml + interfaces/)")?;

        let node_bin = project_root
            .join("interfaces")
            .join("desktop")
            .join("node_modules")
            .join(".bin");

        let system_path = env::var_os("PATH").unwrap_or_default();
        let mut dirs: Vec<PathBuf> = vec![node_bin];
        dirs.extend(env::split_paths(&system_path));
        let augmented_path = env::join_paths(&dirs).unwrap_or(system_path);

        Ok(Self {
            project_root,
            augmented_path,
        })
    }

    /// The desktop frontend directory.
    pub fn desktop_dir(&self) -> PathBuf {
        self.project_root.join("interfaces").join("desktop")
    }

    /// Resolve a program to its full path using the augmented PATH.
    ///
    /// Delegates to [`which::which_in`] which handles `PATHEXT` on Windows
    /// and executable-bit checks on Unix.
    pub fn resolve(&self, program: &str) -> Result<PathBuf> {
        which::which_in(program, Some(&self.augmented_path), &self.project_root)
            .with_context(|| format!("tool `{program}` not found in PATH"))
    }

    /// Create a `Command` for a resolved tool.
    pub fn cmd(&self, program: &str) -> Result<Command> {
        let resolved = self.resolve(program)?;
        let mut cmd = Command::new(resolved);
        cmd.env("PATH", &self.augmented_path);
        cmd.current_dir(&self.project_root);
        Ok(cmd)
    }

    /// Run a tool and capture its output (stdout + stderr).
    pub fn output(&self, program: &str, args: &[&str]) -> Result<std::process::Output> {
        self.cmd(program)?
            .args(args)
            .output()
            .with_context(|| format!("failed to run `{program}`"))
    }

    /// Spawn a tool and wait for exit. Errors on not-found or non-zero exit.
    pub fn run(&self, program: &str, args: &[&str]) -> Result<ExitStatus> {
        let status = self
            .cmd(program)?
            .args(args)
            .status()
            .with_context(|| format!("failed to start `{program}`"))?;

        if !status.success() {
            let code = status.code().unwrap_or(-1);
            anyhow::bail!("`{program}` exited with code {code}");
        }
        Ok(status)
    }

    /// Spawn a tool in a specific directory.
    pub fn run_in(&self, dir: &Path, program: &str, args: &[&str]) -> Result<ExitStatus> {
        let status = self
            .cmd(program)?
            .args(args)
            .current_dir(dir)
            .status()
            .with_context(|| format!("failed to start `{program}` in {}", dir.display()))?;

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
