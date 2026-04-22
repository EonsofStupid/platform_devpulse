//! Shared workspace context — discovered once, threaded to every task.
//!
//! Replaces ad-hoc `ToolResolver::discover()` calls per command.
//! Provides cross-platform tool resolution via [`which`], augmented PATH
//! with `node_modules/.bin`, and spawn/exec helpers.

use anyhow::{Context, Result};
use serde::Deserialize;
use std::env;
use std::fs::OpenOptions;
use std::io::{BufRead, BufReader, BufWriter, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, ExitStatus};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Instant;

#[path = "../../tools/platform_config.rs"]
mod platform_config;

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
        let root =
            find_root(&cwd).context("workspace root not found (need Cargo.toml + interfaces/)")?;

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

    /// Load platform config from repo-root fragments — SSOT for ports and build env.
    pub fn platform_config(&self) -> Result<PlatformConfig> {
        let composed = platform_config::compose_platform_config(&self.root)
            .map_err(anyhow::Error::msg)
            .context("failed to compose repo-root platform config fragments")?;
        let source_file_count = composed.source_files.len();
        let config: PlatformConfig = toml::from_str(&composed.content)
            .with_context(|| {
                format!(
                    "failed to parse composed repo-root platform config from {source_file_count} fragments"
                )
            })?;
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

    /// Spawn a tool in a directory WITHOUT blocking. Returns the `Child`.
    ///
    /// Stdout and stderr are piped (captured) — this is a background task.
    /// Use [`exec_in`](Self::exec_in) for foreground tasks with inherited stdio.
    pub fn spawn_in(&self, dir: &Path, program: &str, args: &[&str]) -> Result<Child> {
        use std::process::Stdio;
        self.cmd(program)?
            .args(args)
            .current_dir(dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .with_context(|| format!("failed to spawn `{program}` in {}", dir.display()))
    }

    /// Spawn a tool with BOTH stdio streams inherited, non-blocking.
    ///
    /// Use this when you want the user to see real-time progress (e.g. cargo
    /// compilation output) without any intermediation. The caller must still
    /// `.wait()` on the returned [`Child`] — nothing is captured on either
    /// pipe, so no drain thread is required.
    ///
    /// Historical note: an earlier version of this helper piped stdout with
    /// no reader, which silently enqueued every stdout line into a 4 KB
    /// Windows buffer and eventually deadlocked long-running children. If
    /// you also need a captured transcript, use [`exec_tee_log`](Self::exec_tee_log)
    /// instead — it merges both streams, tees to the terminal, and writes
    /// a log file.
    pub fn spawn_in_verbose(&self, dir: &Path, program: &str, args: &[&str]) -> Result<Child> {
        use std::process::Stdio;
        self.cmd(program)?
            .args(args)
            .current_dir(dir)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .spawn()
            .with_context(|| format!("failed to spawn `{program}` in {}", dir.display()))
    }

    /// Spawn a tool with stderr PIPED for monitoring.
    ///
    /// Use with [`stage::monitor_cargo_child`] — parses cargo output
    /// to show live progress (crate count, elapsed time, current crate).
    pub fn spawn_in_stderr_piped(&self, dir: &Path, program: &str, args: &[&str]) -> Result<Child> {
        use std::process::Stdio;
        self.cmd(program)?
            .args(args)
            .current_dir(dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .with_context(|| format!("failed to spawn `{program}` in {}", dir.display()))
    }

    /// Run a tool, tee both streams to the terminal AND a transcript file, block until done.
    ///
    /// Both stdout and stderr are piped and drained by dedicated threads —
    /// this avoids the 4 KB Windows pipe-buffer deadlock that plagues
    /// naive `Stdio::piped()` usage without a reader. Each line is echoed
    /// to the terminal (stdout → stdout, stderr → stderr) and appended to
    /// the log file as a single merged transcript.
    ///
    /// Log format per line: `[<ms-since-start>] [OUT|ERR] <line>` — the
    /// elapsed-millis prefix gives forensic line ordering even though two
    /// threads drain concurrently, and the stream label makes stdout vs
    /// stderr identifiable post-mortem. Terminal output is unchanged
    /// (plain line on its natural stream).
    ///
    /// Non-UTF8 bytes in child output are replaced with U+FFFD rather than
    /// dropped — Windows tooling occasionally emits CP1252 or mixed
    /// encoding, and silently discarding lines would mask real failures.
    ///
    /// On non-zero exit the caller gets the [`ExitStatus`] back without
    /// being told "compile errors" — inspecting the log tail is how you
    /// classify the failure stage. Drain-thread panics and log-write IO
    /// errors are surfaced as `Err`, not swallowed.
    ///
    /// Creates the log file's parent directory if needed. Truncates the
    /// log on each run so you always read the most recent transcript.
    pub fn exec_tee_log(
        &self,
        dir: &Path,
        program: &str,
        args: &[&str],
        log_path: &Path,
    ) -> Result<ExitStatus> {
        use std::process::Stdio;

        if let Some(parent) = log_path.parent() {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("creating log dir {}", parent.display()))?;
        }
        let log_file = OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(log_path)
            .with_context(|| format!("opening log file {}", log_path.display()))?;
        // BufWriter amortizes the per-line syscall down to one flush per 8 KB.
        // The Mutex still serializes interleaving between the two drain threads.
        let log = Arc::new(Mutex::new(BufWriter::new(log_file)));
        let start = Instant::now();

        let mut child = self
            .cmd(program)?
            .args(args)
            .current_dir(dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .with_context(|| format!("failed to spawn `{program}` in {}", dir.display()))?;

        let stdout = child
            .stdout
            .take()
            .context("child stdout pipe missing — Stdio::piped() should have created one")?;
        let stderr = child
            .stderr
            .take()
            .context("child stderr pipe missing — Stdio::piped() should have created one")?;

        let log_out = Arc::clone(&log);
        let stdout_handle =
            thread::spawn(move || drain_stream(stdout, log_out, "OUT", start, true));

        let log_err = Arc::clone(&log);
        let stderr_handle =
            thread::spawn(move || drain_stream(stderr, log_err, "ERR", start, false));

        let status = child
            .wait()
            .with_context(|| format!("failed to wait on `{program}`"))?;

        // Drain reader threads. Surface IO failures and thread panics
        // instead of swallowing them — a silent drain is worse than no drain.
        stdout_handle
            .join()
            .map_err(|_| anyhow::anyhow!("stdout drain thread panicked"))?
            .with_context(|| format!("stdout drain failed for `{program}`"))?;
        stderr_handle
            .join()
            .map_err(|_| anyhow::anyhow!("stderr drain thread panicked"))?
            .with_context(|| format!("stderr drain failed for `{program}`"))?;

        // Final flush so the BufWriter's last partial buffer hits disk
        // before we hand the exit status back to the caller.
        let mut guard = log
            .lock()
            .map_err(|_| anyhow::anyhow!("log mutex poisoned on final flush"))?;
        guard
            .flush()
            .with_context(|| format!("flushing log {}", log_path.display()))?;

        Ok(status)
    }

    /// Read `tauri.conf.json` and return the `productName` — the SSOT for
    /// the final binary filename that tauri-bundler writes to
    /// `target/release/<productName>-app.exe` (with `-app` suffix on Windows).
    ///
    /// Why: build_release must locate the artifact without duplicating the
    /// product name as a string literal — drift between tauri.conf.json and
    /// xtask would silently produce "not found" lies in the artifact report.
    pub fn tauri_product_name(&self) -> Result<String> {
        let conf_path = self
            .root
            .join("interfaces")
            .join("desktop")
            .join("src-tauri")
            .join("tauri.conf.json");
        let raw = std::fs::read_to_string(&conf_path)
            .with_context(|| format!("reading {}", conf_path.display()))?;
        let value: serde_json::Value = serde_json::from_str(&raw)
            .with_context(|| format!("parsing {}", conf_path.display()))?;
        let name = value
            .get("productName")
            .and_then(serde_json::Value::as_str)
            .with_context(|| format!("`productName` missing from {}", conf_path.display()))?;
        Ok(name.to_string())
    }
}

// ═══════════════════════════════════════════════════════════════
// exec_tee_log support
// ═══════════════════════════════════════════════════════════════

/// Drain a child pipe line-by-line, teeing to the terminal and appending
/// to the shared log with a `[<elapsed_ms>] [<label>] ` prefix.
///
/// Byte-oriented on purpose: `BufRead::lines()` silently drops lines that
/// aren't valid UTF-8, and Windows toolchain output is not always UTF-8.
/// We read until the newline, strip trailing `\r?\n`, then lossy-decode —
/// a malformed byte becomes U+FFFD rather than vanishing.
///
/// Returned `io::Result<()>` lets the caller surface drain failures
/// instead of swallowing them with `let _ = handle.join()`.
fn drain_stream<R: std::io::Read>(
    source: R,
    log: Arc<Mutex<BufWriter<std::fs::File>>>,
    label: &'static str,
    start: Instant,
    route_to_stdout: bool,
) -> std::io::Result<()> {
    let mut reader = BufReader::new(source);
    let mut buf: Vec<u8> = Vec::with_capacity(1024);
    loop {
        buf.clear();
        let n = reader.read_until(b'\n', &mut buf)?;
        if n == 0 {
            return Ok(());
        }
        // Trim trailing \r?\n from the captured bytes so the log isn't
        // littered with carriage returns and the terminal line isn't
        // doubled.
        let end = buf
            .iter()
            .rposition(|&b| b != b'\n' && b != b'\r')
            .map_or(0, |i| i + 1);
        let line = String::from_utf8_lossy(&buf[..end]);
        if route_to_stdout {
            println!("{line}");
        } else {
            eprintln!("{line}");
        }
        let ms = start.elapsed().as_millis();
        let mut guard = log
            .lock()
            .map_err(|_| std::io::Error::other("log mutex poisoned"))?;
        writeln!(guard, "[{ms:>8}] [{label}] {line}")?;
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
    /// Build toolchain configuration — SSOT for all build env vars.
    #[serde(default)]
    pub build: BuildConfig,
}

// ═══════════════════════════════════════════════════════════════
// Build config — SSOT for toolchain, deps, repos
// ═══════════════════════════════════════════════════════════════

/// Build toolchain and dependency configuration.
///
/// xtask reads `[build.*]` from `platform.default.toml` and sets all
/// env vars before invoking cargo. No env vars should live in
/// `.cargo/config.toml` — everything derives from here.
#[derive(Debug, Default, Deserialize)]
pub struct BuildConfig {
    /// Toolchain settings (target triple, CRT linkage).
    #[serde(default)]
    pub toolchain: BuildToolchainConfig,
    /// Build dependencies with paths and env var mappings.
    #[serde(default)]
    pub deps: BuildDepsConfig,
}

/// Toolchain configuration.
#[derive(Debug, Deserialize)]
pub struct BuildToolchainConfig {
    /// Target triple (e.g., "x86_64-pc-windows-msvc").
    #[serde(default = "default_target")]
    pub target: String,
    /// MSVC CRT linkage: "static" (/MT) or "dynamic" (/MD).
    /// ALL C/C++ deps MUST match this value.
    #[serde(default = "default_crt")]
    pub msvc_crt: String,
}

impl Default for BuildToolchainConfig {
    fn default() -> Self {
        Self {
            target: default_target(),
            msvc_crt: default_crt(),
        }
    }
}

fn default_target() -> String {
    "x86_64-pc-windows-msvc".to_string()
}
fn default_crt() -> String {
    "static".to_string()
}

/// Build dependency declarations — each has a path and env vars to set.
#[derive(Debug, Default, Deserialize)]
pub struct BuildDepsConfig {
    /// NASM assembler (for aws-lc-sys).
    #[serde(default)]
    pub nasm: Option<BuildDepEntry>,
    /// Python interpreter (for pyo3/outlines-core).
    #[serde(default)]
    pub python: Option<BuildDepEntry>,
    /// ONNX Runtime (for kokoros/ort).
    #[serde(default)]
    pub onnxruntime: Option<BuildDepEntry>,
    /// CMake (for ort-sys source builds).
    #[serde(default)]
    pub cmake: Option<BuildDepEntry>,
    /// Legacy code-oss build toggle — disabled, kept for TOML compat only.
    /// DevForge REH is now fetched via `cargo xtask fetch-devforge`.
    #[serde(default)]
    #[allow(dead_code)]
    pub code_oss: Option<BuildToggleEntry>,
}

/// Simple enable/disable entry for build-only external dependencies.
/// Kept for backward-compatible TOML deserialization of `[build.deps.code_oss]`.
#[derive(Debug, Default, Deserialize)]
#[allow(dead_code)]
pub struct BuildToggleEntry {
    #[serde(default)]
    pub enabled: bool,
}

/// A single build dependency entry.
#[derive(Debug, Deserialize)]
pub struct BuildDepEntry {
    /// Path relative to workspace root.
    pub path: String,
    /// Version string (informational).
    #[serde(default)]
    pub version: Option<String>,
    /// Env vars to set with this path as value.
    #[serde(default)]
    pub env: Vec<String>,
    /// Build strategy: "source", "load-dynamic", "prebuilt".
    #[serde(default)]
    pub build: Option<String>,
    /// Extra env vars to set (key=value pairs).
    #[serde(default)]
    pub extras: std::collections::HashMap<String, String>,
}

impl BuildConfig {
    /// Apply all build env vars from the SSOT config.
    ///
    /// Resolves relative paths against workspace root, sets each env var
    /// declared in `[build.deps.*.env]`, and sets extras.
    /// Logs every env var set so the user sees exactly what's happening.
    pub fn apply_env(&self, workspace_root: &std::path::Path) {
        // Log toolchain SSOT so the developer sees exactly what target is configured
        println!(
            "  [toolchain] target = {} (from [build.toolchain])",
            self.toolchain.target
        );
        println!(
            "  [toolchain] msvc_crt = {} (from [build.toolchain])",
            self.toolchain.msvc_crt
        );

        let deps = [
            ("nasm", &self.deps.nasm),
            ("python", &self.deps.python),
            ("onnxruntime", &self.deps.onnxruntime),
            ("cmake", &self.deps.cmake),
        ];

        for (name, dep_opt) in deps {
            if let Some(dep) = dep_opt {
                let resolved = workspace_root.join(&dep.path);
                let resolved_str = resolved.to_string_lossy();

                for env_key in &dep.env {
                    std::env::set_var(env_key, &*resolved_str);
                    println!("  [env] {env_key} = {resolved_str} (from [build.deps.{name}])");
                }

                for (key, value) in &dep.extras {
                    std::env::set_var(key, value);
                    println!("  [env] {key} = {value} (from [build.deps.{name}].extras)");
                }

                if let Some(ver) = &dep.version {
                    println!("  [dep] {name}: expected version = {ver}");
                }
                if let Some(build_strategy) = &dep.build {
                    println!("  [build] {name}: strategy = {build_strategy}");
                }
            }
        }
    }
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
