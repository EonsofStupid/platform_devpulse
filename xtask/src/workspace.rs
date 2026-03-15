//! Shared workspace context — discovered once, threaded to every task.
//!
//! Replaces ad-hoc `ToolResolver::discover()` calls per command.
//! Provides cross-platform tool resolution via [`which`], augmented PATH
//! with `node_modules/.bin`, and spawn/exec helpers.

use anyhow::{Context, Result};
use serde::Deserialize;
use std::env;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, ExitStatus};

/// Immutable workspace context. Created once in `main`, passed to every [`Task`].
pub struct Workspace {
    /// Monorepo root (contains root `Cargo.toml` + `interfaces/`).
    root: PathBuf,
    /// `PATH` with `node_modules/.bin` prepended for Node tool resolution.
    path: std::ffi::OsString,
}

impl Workspace {
    /// Discover the workspace by walking up from `cwd` until we find
    /// `Cargo.toml` + `interfaces/` side by side.
    pub fn discover() -> Result<Self> {
        let cwd = env::current_dir().context("failed to read cwd")?;
        let root = find_root(&cwd)
            .context("workspace root not found (need Cargo.toml + interfaces/)")?;

        let node_bin = root
            .join("interfaces")
            .join("desktop")
            .join("node_modules")
            .join(".bin");

        let system_path = env::var_os("PATH").unwrap_or_default();
        let mut dirs: Vec<PathBuf> = vec![node_bin];
        dirs.extend(env::split_paths(&system_path));
        let path = env::join_paths(&dirs).unwrap_or(system_path);

        Ok(Self { root, path })
    }

    // ── Paths ──────────────────────────────────────────────────────

    /// Monorepo root.
    pub fn root(&self) -> &Path {
        &self.root
    }

    /// `interfaces/desktop/` — SvelteKit + Tauri frontend.
    pub fn desktop_dir(&self) -> PathBuf {
        self.root.join("interfaces").join("desktop")
    }

    /// Load platform config from `platform.default.toml` — SSOT for ports.
    pub fn platform_config(&self) -> Result<PlatformConfig> {
        let toml_path = self.root
            .join("systems")
            .join("devpulse-engine")
            .join("platform.default.toml");
        let content = std::fs::read_to_string(&toml_path)
            .with_context(|| format!("failed to read {}", toml_path.display()))?;
        let config: PlatformConfig = toml::from_str(&content)
            .with_context(|| format!("failed to parse {}", toml_path.display()))?;
        Ok(config)
    }

    // ── Tool Resolution ────────────────────────────────────────────

    /// Resolve a binary name to its full path (cross-platform via `which`).
    pub fn resolve(&self, program: &str) -> Result<PathBuf> {
        which::which_in(program, Some(&self.path), &self.root)
            .with_context(|| format!("`{program}` not found in PATH"))
    }

    /// Build a `Command` with augmented PATH, rooted in workspace.
    fn cmd(&self, program: &str) -> Result<Command> {
        let bin = self.resolve(program)?;
        let mut cmd = Command::new(bin);
        cmd.env("PATH", &self.path);
        cmd.current_dir(&self.root);
        Ok(cmd)
    }

    // ── Execution ──────────────────────────────────────────────────

    /// Run a tool, capture stdout + stderr. Does NOT check exit code.
    pub fn output(&self, program: &str, args: &[&str]) -> Result<std::process::Output> {
        self.cmd(program)?
            .args(args)
            .output()
            .with_context(|| format!("failed to run `{program}`"))
    }

    /// Run a tool, inherit stdio, block until done. Errors on non-zero exit.
    pub fn exec(&self, program: &str, args: &[&str]) -> Result<ExitStatus> {
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

    /// Run a tool in a specific directory. Blocks, errors on non-zero.
    pub fn exec_in(&self, dir: &Path, program: &str, args: &[&str]) -> Result<ExitStatus> {
        let status = self
            .cmd(program)?
            .args(args)
            .current_dir(dir)
            .status()
            .with_context(|| {
                format!("failed to start `{program}` in {}", dir.display())
            })?;

        if !status.success() {
            let code = status.code().unwrap_or(-1);
            anyhow::bail!("`{program}` exited with code {code}");
        }
        Ok(status)
    }

    /// Spawn a tool in a directory WITHOUT blocking. Returns the `Child`.
    ///
    /// Stdout and stderr are piped (captured) — this is a background task.
    /// Use [`exec_in`](Self::exec_in) for foreground tasks with inherited stdio.
    pub fn spawn_in(
        &self,
        dir: &Path,
        program: &str,
        args: &[&str],
    ) -> Result<Child> {
        use std::process::Stdio;
        self.cmd(program)?
            .args(args)
            .current_dir(dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .with_context(|| {
                format!("failed to spawn `{program}` in {}", dir.display())
            })
    }

    /// Spawn a tool with stderr inherited (visible to user) but non-blocking.
    ///
    /// Use this when you want the user to see real-time progress (e.g. cargo
    /// compilation output) while still being able to check the exit code later.
    /// Stdout is piped (captured), stderr streams directly to the terminal.
    pub fn spawn_in_verbose(
        &self,
        dir: &Path,
        program: &str,
        args: &[&str],
    ) -> Result<Child> {
        use std::process::Stdio;
        self.cmd(program)?
            .args(args)
            .current_dir(dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .with_context(|| {
                format!("failed to spawn `{program}` in {}", dir.display())
            })
    }

    /// Spawn a tool with stderr PIPED for monitoring.
    ///
    /// Use with [`stage::monitor_cargo_child`] — parses cargo output
    /// to show live progress (crate count, elapsed time, current crate).
    pub fn spawn_in_stderr_piped(
        &self,
        dir: &Path,
        program: &str,
        args: &[&str],
    ) -> Result<Child> {
        use std::process::Stdio;
        self.cmd(program)?
            .args(args)
            .current_dir(dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .with_context(|| {
                format!("failed to spawn `{program}` in {}", dir.display())
            })
    }
}

// ═══════════════════════════════════════════════════════════════
// Platform config — minimal deserialization for xtask
// ═══════════════════════════════════════════════════════════════

/// Minimal view of `platform.default.toml` — only what xtask needs.
#[derive(Debug, Deserialize)]
pub struct PlatformConfig {
    /// Service configurations.
    pub services: PlatformServicesConfig,
}

/// Top-level services scope.
#[derive(Debug, Deserialize)]
pub struct PlatformServicesConfig {
    /// Network services (ports, bind addresses).
    pub network: PlatformNetworkConfig,
}

/// Network services — ports are the SSOT.
#[derive(Debug, Deserialize)]
pub struct PlatformNetworkConfig {
    /// Vite dev server.
    pub dev_server: PlatformDevServerConfig,
    /// `SurrealDB` HTTP API.
    pub graph_api: PlatformGraphApiConfig,
}

/// Dev server config — port defined in `[services.network.dev_server]`.
#[derive(Debug, Deserialize)]
pub struct PlatformDevServerConfig {
    /// Port the Vite dev server binds.
    pub port: u16,
    /// Bind address.
    pub bind: String,
}

/// Graph API config — port defined in `[services.network.graph_api]`.
#[derive(Debug, Deserialize)]
pub struct PlatformGraphApiConfig {
    /// Port the `SurrealDB` HTTP API binds.
    pub port: u16,
    /// Bind address.
    pub bind: String,
}

/// Walk up from `start` to find the monorepo root.
fn find_root(start: &Path) -> Option<PathBuf> {
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
