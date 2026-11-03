//! Shared workspace context — discovered once, threaded to every task.
//!
//! Replaces ad-hoc `ToolResolver::discover()` calls per command.
//! Provides cross-platform tool resolution via [`which`], augmented PATH
//! with `node_modules/.bin`, and spawn/exec helpers.

use anyhow::{Context, Result};
use serde::Deserialize;
use std::env;
use std::fs::OpenOptions;
use std::io::{BufReader, BufWriter, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, ExitStatus};
use std::sync::{Arc, Mutex, OnceLock};
use std::thread;
use std::time::Instant;

// Idempotence guards for build-env activation. xtask sub-commands may
// share a single process (e.g. `cargo xtask verify` chains several
// internal stages); the env mutations below MUST NOT double-apply or
// the second invocation would log false "skipping" lines without
// actually wiring anything. OnceLock encodes the contract.
static MSVC_ENV_APPLIED: OnceLock<bool> = OnceLock::new();
static GENERATOR_SELECTED: OnceLock<String> = OnceLock::new();

#[path = "../../tools/platform_config.rs"]
mod platform_config;

/// Immutable workspace context. Created once in `main`, passed to every [`Task`].
pub struct Workspace {
    /// Monorepo root (contains root `Cargo.toml` + `interfaces/`).
    root: PathBuf,
    /// `PATH` with `node_modules/.bin` prepended for Node tool resolution.
    node_bin: PathBuf,
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

        Ok(Self { root, node_bin })
    }

    // ── Paths ──────────────────────────────────────────────────────

    /// Monorepo root.
    pub fn root(&self) -> &Path {
        &self.root
    }

    /// `interfaces/desktop/` — `SvelteKit` + Tauri frontend.
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

    /// Compose the current build PATH after native toolchain activation.
    fn path(&self) -> std::ffi::OsString {
        let inherited = crate::child_env::var_os("PATH").unwrap_or_default();
        let dirs = std::iter::once(self.node_bin.clone()).chain(env::split_paths(&inherited));
        env::join_paths(dirs).unwrap_or(inherited)
    }

    /// Resolve a binary name to its full path (cross-platform via `which`).
    pub fn resolve(&self, program: &str) -> Result<PathBuf> {
        which::which_in(program, Some(self.path()), &self.root)
            .with_context(|| format!("`{program}` not found in PATH"))
    }

    /// Build a `Command` with augmented PATH, rooted in workspace.
    fn cmd(&self, program: &str) -> Result<Command> {
        let bin = self.resolve(program)?;
        let mut cmd = crate::child_env::command(bin);
        cmd.env("PATH", self.path());
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
            thread::spawn(move || drain_stream(stdout, &log_out, "OUT", start, true));

        let log_err = Arc::clone(&log);
        let stderr_handle =
            thread::spawn(move || drain_stream(stderr, &log_err, "ERR", start, false));

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

    /// Spawn a tool with both streams teed to a transcript, returning
    /// the `Child` + drain handles instead of blocking.
    ///
    /// Use this for long-running children where `exec_tee_log` would
    /// not return until the child exits — typically `pnpm tauri dev`,
    /// where the operator wants the dev server running for hours but
    /// also wants every line captured to disk so a mid-session crash
    /// doesn't lose the run-up output.
    ///
    /// The returned [`TeeChild`] owns the spawned process plus the two
    /// drain threads and the shared log handle. Call [`TeeChild::wait`]
    /// to block until the child exits + flush the log; the same
    /// drain-failure surfacing that `exec_tee_log` provides applies.
    ///
    /// Drop semantics: dropping the `TeeChild` without calling `wait`
    /// detaches the drain threads. They will continue to run until the
    /// child closes its pipes (usually because someone else killed it).
    /// For Job-Object-managed dev sessions this is fine — the kernel
    /// kills the child when xtask exits.
    pub fn spawn_tee_log_non_blocking(
        &self,
        dir: &Path,
        program: &str,
        args: &[&str],
        log_path: &Path,
    ) -> Result<TeeChild> {
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
            thread::spawn(move || drain_stream(stdout, &log_out, "OUT", start, true));

        let log_err = Arc::clone(&log);
        let stderr_handle =
            thread::spawn(move || drain_stream(stderr, &log_err, "ERR", start, false));

        Ok(TeeChild {
            child,
            stdout_handle: Some(stdout_handle),
            stderr_handle: Some(stderr_handle),
            log,
            log_path: log_path.to_path_buf(),
            program: program.to_string(),
        })
    }

    /// Absolute path to `interfaces/desktop/src-tauri/tauri.conf.json`.
    /// Centralized so callers don't drift from the canonical location.
    pub fn tauri_conf_path(&self) -> PathBuf {
        self.root
            .join("interfaces")
            .join("desktop")
            .join("src-tauri")
            .join("tauri.conf.json")
    }

    /// Parse `tauri.conf.json` into the subset of fields xtask cares
    /// about. This is the SSOT for everything downstream — filename,
    /// version, externalBin sidecars, bundled resource DLLs, icon list.
    ///
    /// Previously multiple xtask commands each opened the file and
    /// hand-parsed the shape they needed. That's a drift surface every
    /// time tauri.conf.json changes — the canonical parse lives here
    /// and each command takes only what it needs from the typed result.
    pub fn tauri_config(&self) -> Result<TauriConfig> {
        let conf_path = self.tauri_conf_path();
        let raw = std::fs::read_to_string(&conf_path)
            .with_context(|| format!("reading {}", conf_path.display()))?;
        let mut value: serde_json::Value = serde_json::from_str(&raw)
            .with_context(|| format!("parsing {}", conf_path.display()))?;

        // Apply platform override (tauri.<platform>.conf.json) the same
        // way the Tauri CLI merges them during `tauri build`. Without
        // this, `bundle.resources` declared in the Windows override (the
        // 10 runtime DLLs) would be invisible to package-portable and
        // the resulting portable folder would ship with NO DLLs — which
        // is exactly the regression we shipped once already. RFC 7396:
        // arrays REPLACE, objects merge recursively.
        #[cfg(target_os = "windows")]
        let platform_override = Some("tauri.windows.conf.json");
        #[cfg(target_os = "macos")]
        let platform_override = Some("tauri.macos.conf.json");
        #[cfg(target_os = "linux")]
        let platform_override = Some("tauri.linux.conf.json");
        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        let platform_override: Option<&str> = None;

        for filename in platform_override
            .into_iter()
            .chain(Some("tauri.agenthub.conf.json"))
        {
            let override_path = self
                .root
                .join("interfaces")
                .join("desktop")
                .join("src-tauri")
                .join(filename);
            if override_path.exists() {
                let override_raw = std::fs::read_to_string(&override_path).with_context(|| {
                    format!("reading bundle override {}", override_path.display())
                })?;
                let override_value: serde_json::Value = serde_json::from_str(&override_raw)
                    .with_context(|| {
                        format!("parsing bundle override {}", override_path.display())
                    })?;
                merge_rfc7396(&mut value, &override_value);
            }
        }

        let product_name = value
            .get("productName")
            .and_then(serde_json::Value::as_str)
            .with_context(|| format!("`productName` missing from {}", conf_path.display()))?
            .to_string();
        let version = value
            .get("version")
            .and_then(serde_json::Value::as_str)
            .with_context(|| format!("`version` missing from {}", conf_path.display()))?
            .to_string();
        let bundle = value
            .get("bundle")
            .with_context(|| format!("`bundle` missing from {}", conf_path.display()))?;

        Ok(TauriConfig {
            product_name,
            version,
            resources: parse_resources(bundle.get("resources")),
            external_bins: json_string_array(bundle.get("externalBin")),
            icons: json_string_array(bundle.get("icon")),
        })
    }

    /// Convenience wrapper — returns just the `productName`. Thin
    /// delegate to [`tauri_config`](Self::tauri_config) so there is
    /// exactly one JSON parsing path in xtask.
    pub fn tauri_product_name(&self) -> Result<String> {
        Ok(self.tauri_config()?.product_name)
    }
}

/// Typed view of the subset of `tauri.conf.json` xtask reads from. All
/// string-typed fields are owned copies of the JSON values so the struct
/// is independent of the raw `serde_json::Value`'s lifetime and can be
/// passed between stages freely.
#[derive(Debug, Clone)]
pub struct TauriConfig {
    /// `productName` — drives the final binary filename on Windows
    /// (`<productName>-app.exe`) and the portable folder name.
    pub product_name: String,
    /// Package semver string — drives portable folder + zip versioning.
    pub version: String,
    /// `bundle.resources` — parsed from either the list form
    /// (`["path/a.dll", "dir/"]`) or the map form
    /// (`{"path/a.dll": "", "dir/**/*": "out/"}`). Both Tauri v2 shapes are
    /// supported; every entry carries an explicit target so downstream
    /// packagers never have to guess where a resource should land.
    pub resources: Vec<ResourceEntry>,
    /// `bundle.externalBin` — sidecar binaries. Paths are prefix form
    /// (no `.exe` suffix in JSON) matching the tauri-bundler convention.
    pub external_bins: Vec<String>,
    /// `bundle.icon` — icon variants shipped with the app.
    pub icons: Vec<String>,
}

/// A single entry from `bundle.resources`, normalized so both Tauri list
/// and map forms flow through the same packaging pipeline.
///
/// * `source` — path relative to `interfaces/desktop/src-tauri/`. May be
///   a file, a directory (with or without trailing slash), or a glob
///   ending in `/**/*` or `/*`. Globs are resolved by walking the base
///   directory at package time.
/// * `target` — destination subpath inside the portable/resource root.
///   Empty string means "at the root" (sibling of the exe). A trailing
///   slash means "into this subfolder, preserve contents". A target with
///   no trailing slash is treated as a rename when the source is a file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResourceEntry {
    pub source: String,
    pub target: String,
}

fn json_string_array(v: Option<&serde_json::Value>) -> Vec<String> {
    v.and_then(serde_json::Value::as_array)
        .map(|arr| {
            arr.iter()
                .filter_map(serde_json::Value::as_str)
                .map(String::from)
                .collect()
        })
        .unwrap_or_default()
}

/// Parse `bundle.resources` in either of the two Tauri v2 shapes.
///
/// * Array: `["path/a.dll", "dir/"]` — each string becomes a
///   `ResourceEntry { source, target: "" }`, meaning "place at root".
///   Tauri's native list form preserves source path inside the bundle;
///   we deliberately flatten to root for portable layouts because the
///   Windows DLL search resolves siblings of the exe, not a nested
///   `binaries/` subfolder.
/// * Object: `{"src/path": "target/"}` — one entry per key, target taken
///   verbatim. This is the form the Windows/Linux/macOS platform
///   overrides use today; it lets `DevForge` remap from
///   `resources/devforge/<platform>/**/*` to `devforge/` at bundle time.
///
/// Unknown JSON shapes (null, bool, number, nested arrays) are dropped
/// silently rather than failing the parse — the same tolerance tauri-bundler
/// applies when it reconciles platform overrides.
fn parse_resources(v: Option<&serde_json::Value>) -> Vec<ResourceEntry> {
    let Some(v) = v else { return Vec::new() };
    match v {
        serde_json::Value::Array(arr) => arr
            .iter()
            .filter_map(serde_json::Value::as_str)
            .map(|s| ResourceEntry {
                source: s.to_string(),
                target: String::new(),
            })
            .collect(),
        serde_json::Value::Object(map) => map
            .iter()
            .filter_map(|(k, v)| {
                v.as_str().map(|target| ResourceEntry {
                    source: k.clone(),
                    target: target.to_string(),
                })
            })
            .collect(),
        _ => Vec::new(),
    }
}

/// RFC 7396 JSON Merge Patch — matches the semantics Tauri's CLI uses
/// when merging `tauri.<platform>.conf.json` into `tauri.conf.json`:
/// objects merge recursively, arrays REPLACE wholesale, primitives
/// REPLACE, and `null` on the patch side deletes the key.
///
/// Example (the one that burned us):
///
/// ```text
///   base    : { "bundle": { "resources": [] } }
///   patch   : { "bundle": { "resources": ["binaries/llama.dll"] } }
///   merged  : { "bundle": { "resources": ["binaries/llama.dll"] } }
/// ```
///
/// Shipped as a small local helper instead of a dependency — the single
/// call site is `tauri_config`, and we already have `serde_json`.
fn merge_rfc7396(target: &mut serde_json::Value, patch: &serde_json::Value) {
    match (target, patch) {
        (serde_json::Value::Object(target_map), serde_json::Value::Object(patch_map)) => {
            for (k, v) in patch_map {
                if v.is_null() {
                    target_map.remove(k);
                } else if let Some(existing) = target_map.get_mut(k) {
                    merge_rfc7396(existing, v);
                } else {
                    target_map.insert(k.clone(), v.clone());
                }
            }
        }
        (target_slot, patch_v) => {
            *target_slot = patch_v.clone();
        }
    }
}

#[cfg(test)]
mod merge_tests {
    #![allow(clippy::expect_used, reason = "test assertions")]

    use super::merge_rfc7396;
    use serde_json::json;

    #[test]
    fn array_replaces_wholesale() {
        let mut base = json!({ "bundle": { "resources": [] } });
        let patch = json!({ "bundle": { "resources": ["a.dll", "b.dll"] } });
        merge_rfc7396(&mut base, &patch);
        assert_eq!(
            base,
            json!({ "bundle": { "resources": ["a.dll", "b.dll"] } })
        );
    }

    #[test]
    fn nested_object_merges_recursively() {
        let mut base = json!({ "bundle": { "active": true, "targets": ["nsis"] } });
        let patch = json!({ "bundle": { "icon": "x.ico" } });
        merge_rfc7396(&mut base, &patch);
        assert_eq!(
            base,
            json!({ "bundle": { "active": true, "targets": ["nsis"], "icon": "x.ico" } })
        );
    }

    #[test]
    fn null_on_patch_deletes_key() {
        let mut base = json!({ "a": 1, "b": 2 });
        let patch = json!({ "b": null });
        merge_rfc7396(&mut base, &patch);
        assert_eq!(base, json!({ "a": 1 }));
    }

    #[test]
    fn primitive_replaces() {
        let mut base = json!({ "version": "0.1.0" });
        let patch = json!({ "version": "0.2.0" });
        merge_rfc7396(&mut base, &patch);
        assert_eq!(base, json!({ "version": "0.2.0" }));
    }

    #[test]
    fn shipped_runtime_overlay_is_visible_to_portable_packaging() {
        let ws = super::Workspace::discover().expect("workspace");
        let config = ws.tauri_config().expect("bundle declarations");
        assert_eq!(
            config.external_bins,
            [
                "binaries/devpulse-agenthub",
                "binaries/devpulse-persona-mcp"
            ]
        );
        let overlay = ws
            .desktop_dir()
            .join(crate::commands::build_agenthub::BUNDLE_CONFIG);
        assert!(
            overlay.is_file(),
            "Tauri and the portable planner must use the same declaration"
        );
    }
}

#[cfg(test)]
mod resource_parse_tests {
    use super::{ResourceEntry, parse_resources};
    use serde_json::json;

    #[test]
    fn list_form_flattens_target_to_root() {
        let v = json!(["binaries/llama.dll", "resources/devforge/win32-x64/"]);
        let got = parse_resources(Some(&v));
        assert_eq!(
            got,
            vec![
                ResourceEntry {
                    source: "binaries/llama.dll".to_string(),
                    target: String::new(),
                },
                ResourceEntry {
                    source: "resources/devforge/win32-x64/".to_string(),
                    target: String::new(),
                },
            ]
        );
    }

    #[test]
    fn map_form_preserves_per_entry_target() {
        let v = json!({
            "binaries/llama.dll": "",
            "resources/devforge/win32-x64/**/*": "devforge/"
        });
        let mut got = parse_resources(Some(&v));
        got.sort_by(|a, b| a.source.cmp(&b.source));
        assert_eq!(
            got,
            vec![
                ResourceEntry {
                    source: "binaries/llama.dll".to_string(),
                    target: String::new(),
                },
                ResourceEntry {
                    source: "resources/devforge/win32-x64/**/*".to_string(),
                    target: "devforge/".to_string(),
                },
            ]
        );
    }

    #[test]
    fn missing_resources_key_is_empty() {
        assert_eq!(parse_resources(None).len(), 0);
    }

    #[test]
    fn non_string_map_values_are_dropped() {
        let v = json!({ "a": "x/", "b": 42, "c": null });
        let got = parse_resources(Some(&v));
        assert_eq!(got.len(), 1);
        assert_eq!(got[0].source, "a");
        assert_eq!(got[0].target, "x/");
    }
}

// ═══════════════════════════════════════════════════════════════
// exec_tee_log support
// ═══════════════════════════════════════════════════════════════

// Drain a child pipe with two layered behaviors:
//
//   1. **Byte passthrough to terminal** — every byte read from the
//      pipe is written verbatim to the destination stream (stdout or
//      stderr) and flushed. This preserves cargo's `\r`-based progress
//      bar, rustc colors, and any other in-place terminal rewriting.
//      From the user's perspective, the terminal behaves as if we had
//      used `Stdio::inherit()`.
//
//   2. **Line-buffered log** — bytes are also accumulated into a line
//      buffer; on `\n` the buffer is committed to the log with the
//      `[<elapsed_ms>] [<label>] ` prefix. A `\r` resets the buffer
//      without committing, because `\r` means "next writes overwrite
//      this line" — logging every progress-bar tick would produce
//      tens of thousands of noise entries and drown real events.
//
// Non-UTF8 bytes in the line buffer become U+FFFD via `from_utf8_lossy`
// at commit time — dropped lines on Windows CP1252 output would hide
// real failures.

// ═══════════════════════════════════════════════════════════════════════
// Non-blocking tee child handle
// ═══════════════════════════════════════════════════════════════════════

/// Long-running child process whose stdio is being teed to a transcript.
///
/// Returned by [`Workspace::spawn_tee_log_non_blocking`]. Owns the
/// spawned `Child` plus the two drain threads and the shared log file
/// handle. Call [`TeeChild::wait`] to block until the child exits and
/// the log is flushed.
///
/// Why a struct instead of a tuple: `dev.rs` needs to assign the
/// child to a Job Object on Windows (so Ctrl+C kills the entire
/// process tree) which means it needs to grab the inner `&Child`
/// before waiting. Exposing it as a method on a typed handle is
/// clearer than tuple destructuring.
pub struct TeeChild {
    child: Child,
    /// Stdout drain thread. Taken (set to `None`) by `wait` so we
    /// don't double-join. Surfaces drain IO errors on join.
    stdout_handle: Option<thread::JoinHandle<std::io::Result<()>>>,
    /// Stderr drain thread, same shape as stdout.
    stderr_handle: Option<thread::JoinHandle<std::io::Result<()>>>,
    /// Shared log file handle — held until `wait` so the final flush
    /// commits the `BufWriter`'s last partial buffer to disk.
    log: Arc<Mutex<BufWriter<std::fs::File>>>,
    /// Path the log writes to — held so error context can name it.
    log_path: PathBuf,
    /// Program name for error context.
    program: String,
}

impl TeeChild {
    /// Read access to the underlying `Child` for OS-level operations
    /// like Job Object assignment. Do NOT call `wait` on this directly
    /// — use [`TeeChild::wait`] instead so the drain threads are
    /// joined and the log is flushed.
    #[cfg(windows)]
    #[must_use]
    pub fn child(&self) -> &Child {
        &self.child
    }

    /// Block until the child exits, then join both drain threads and
    /// flush the log. Mirrors [`Workspace::exec_tee_log`]'s shutdown
    /// path so the failure modes are identical:
    ///   - drain-thread panic → `Err`
    ///   - drain IO failure (broken log file, full disk) → `Err`
    ///   - log final-flush failure → `Err`
    ///   - non-zero exit code → `Ok(ExitStatus)`; classification is
    ///     the caller's job (read the transcript).
    pub fn wait(mut self) -> Result<ExitStatus> {
        let status = self
            .child
            .wait()
            .with_context(|| format!("failed to wait on `{}`", self.program))?;

        if let Some(h) = self.stdout_handle.take() {
            h.join()
                .map_err(|_| anyhow::anyhow!("stdout drain thread panicked"))?
                .with_context(|| format!("stdout drain failed for `{}`", self.program))?;
        }
        if let Some(h) = self.stderr_handle.take() {
            h.join()
                .map_err(|_| anyhow::anyhow!("stderr drain thread panicked"))?
                .with_context(|| format!("stderr drain failed for `{}`", self.program))?;
        }

        let mut guard = self
            .log
            .lock()
            .map_err(|_| anyhow::anyhow!("log mutex poisoned on final flush"))?;
        guard
            .flush()
            .with_context(|| format!("flushing log {}", self.log_path.display()))?;

        Ok(status)
    }
}

/// Drain a child pipe with two layered behaviors: byte passthrough to
/// the terminal (preserves cargo's `\r` progress bar) and a line-buffered
/// log with timestamped `[<elapsed_ms>] [<label>] ` prefix.
///
/// Returned `io::Result<()>` lets the caller surface drain failures
/// instead of swallowing them with `let _ = handle.join()`.
fn drain_stream<R: std::io::Read>(
    source: R,
    log: &Arc<Mutex<BufWriter<std::fs::File>>>,
    label: &'static str,
    start: Instant,
    route_to_stdout: bool,
) -> std::io::Result<()> {
    let mut reader = BufReader::new(source);
    let mut chunk = [0u8; 4096];
    let mut line_buf: Vec<u8> = Vec::with_capacity(1024);
    // `pending_cr` is true when the previous byte was `\r` and we have
    // not yet decided whether it's a CRLF terminator or a lone
    // progress-bar tick. Persisted across chunks so a `\r` at the end
    // of one read is correctly reconciled with the `\n` that opens the
    // next.
    let mut pending_cr = false;

    loop {
        let n = reader.read(&mut chunk)?;
        if n == 0 {
            // EOF. Commit any trailing partial line. Lone `\r` at EOF
            // (pending_cr = true with no follow-up) was a progress tick
            // whose final frame was never committed — drop it, do not
            // pollute the log with half-updates.
            if !line_buf.is_empty() && !pending_cr {
                commit_line(log, label, start, &line_buf)?;
                line_buf.clear();
            }
            return Ok(());
        }
        let bytes = &chunk[..n];

        // ── 1. Byte passthrough: preserves \r progress bars ──
        if route_to_stdout {
            let mut out = std::io::stdout().lock();
            out.write_all(bytes)?;
            out.flush()?;
        } else {
            let mut err = std::io::stderr().lock();
            err.write_all(bytes)?;
            err.flush()?;
        }

        // ── 2. Line accumulation for the log ──
        //
        // State machine for `\r` / `\n` / `\r\n`:
        //
        //   * `\n`          → commit line_buf.
        //   * `\r\n`        → commit line_buf (CRLF terminator).
        //   * `\r<other>`   → lone `\r` = progress tick; discard
        //                     line_buf, start fresh with `<other>`.
        //   * `\r\r`        → still progress; discard, stay pending.
        for &b in bytes {
            if pending_cr {
                match b {
                    b'\n' => {
                        commit_line(log, label, start, &line_buf)?;
                        line_buf.clear();
                        pending_cr = false;
                    }
                    b'\r' => {
                        // Another CR — still a progress refresh.
                        line_buf.clear();
                        // pending_cr stays true
                    }
                    other => {
                        // Lone CR was a progress tick. Reset buffer and
                        // begin accumulating with this byte.
                        line_buf.clear();
                        line_buf.push(other);
                        pending_cr = false;
                    }
                }
            } else {
                match b {
                    b'\n' => {
                        commit_line(log, label, start, &line_buf)?;
                        line_buf.clear();
                    }
                    b'\r' => {
                        // Defer: might be CRLF or a progress tick.
                        pending_cr = true;
                    }
                    other => line_buf.push(other),
                }
            }
        }
    }
}

/// Emit one `[<elapsed_ms>] [<label>] <content>` line to the shared log.
/// Split out of `drain_stream` so the EOF tail-flush path and the
/// newline-commit path share the same formatting.
fn commit_line(
    log: &Arc<Mutex<BufWriter<std::fs::File>>>,
    label: &'static str,
    start: Instant,
    line_bytes: &[u8],
) -> std::io::Result<()> {
    let line = String::from_utf8_lossy(line_bytes);
    let ms = start.elapsed().as_millis();
    let mut guard = log
        .lock()
        .map_err(|_| std::io::Error::other("log mutex poisoned"))?;
    writeln!(guard, "[{ms:>8}] [{label}] {line}")
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
    /// `CMake` (for ort-sys source builds).
    #[serde(default)]
    pub cmake: Option<BuildDepEntry>,
    /// Ninja (for cmake-rs when `CMAKE_GENERATOR` = "Ninja"; harmless under
    /// the Visual Studio generator).
    #[serde(default)]
    pub ninja: Option<BuildDepEntry>,
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
            ("ninja", &self.deps.ninja),
        ];

        for (name, dep_opt) in deps {
            if let Some(dep) = dep_opt {
                match Self::resolve_dep_path(workspace_root, &dep.path) {
                    Some(resolved) => {
                        let resolved_str = resolved.to_string_lossy();
                        for env_key in &dep.env {
                            crate::child_env::set(env_key, &*resolved_str);
                            println!(
                                "  [env] {env_key} = {resolved_str} (from [build.deps.{name}])"
                            );
                        }
                    }
                    None => {
                        println!(
                            "  [warn] [build.deps.{name}].path = {} not on disk and not on PATH; \
                             not exporting {:?}",
                            dep.path, dep.env
                        );
                    }
                }

                for (key, value) in &dep.extras {
                    crate::child_env::set(key, value);
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

        // ── Fast-build wiring ──
        // The linker is declared in `.cargo/config.toml`, never injected
        // here: cargo hashes the target linker into every unit's
        // fingerprint, so a linker only xtask's cargo sees makes every
        // other cargo invocation rebuild the shared units in place.
        self.apply_fast_build_env();

        // ── MSVC toolchain activation + cmake generator selection ──
        // Both layers MUST run after the SSOT deps loop above (which sets
        // the configured `CMAKE_GENERATOR` from `[build.deps.cmake].extras`).
        // `activate_msvc_env` exports the cl.exe / INCLUDE / LIB / LIBPATH /
        // PATH set Rust's own bootstrap uses, so child cmake + ninja
        // invocations find the toolchain without a manual vcvars64.bat run.
        // `select_generator` then validates that "Ninja" can actually be
        // honored on this box (MSVC env active + ninja resolves) and falls
        // back to "Visual Studio 17 2022" only if a precondition is missing.
        //
        // Historical: an earlier patch set CMAKE_BUILD_PARALLEL_LEVEL=1 to
        // serialize cmake under the VS generator, working around the
        // ExternalProject ordering race in ggml-vulkan's vulkan-shaders-gen
        // host tool. That fix was structurally ineffective because (a)
        // cmake-rs forwards `--parallel $NUM_JOBS` to `cmake --build`,
        // and the CLI flag overrides the env var; (b) `llama-cpp-sys-2`'s
        // build.rs unconditionally re-sets the env to
        // `available_parallelism()` regardless. The correct fix is to use
        // Ninja — its dep graph honors `add_custom_command DEPENDS` so the
        // race disappears entirely. No parallel-level override is needed.
        self.activate_msvc_env();
        self.select_generator(workspace_root);
        Self::purge_stale_cmake_dirs(workspace_root);
    }

    /// Resolve a `[build.deps.*].path` to a real file.
    ///
    /// Order: the configured path (relative to the workspace root, or
    /// absolute) if it exists, then the tool's binary name on `PATH`.
    /// Returns `None` when neither resolves, so callers never export an
    /// env var pointing at a file that is not there.
    fn resolve_dep_path(workspace_root: &Path, configured: &str) -> Option<PathBuf> {
        let candidate = workspace_root.join(configured);
        if candidate.is_file() {
            return Some(candidate);
        }
        let tool = Path::new(configured).file_stem()?;
        crate::child_env::which(tool).ok()
    }

    /// Detect installed acceleration SDKs and return the cargo `--features`
    /// string that activates the buildable subset. Returns `None` when no
    /// SDK is installed — caller builds with default features (pure CPU,
    /// no MKL, no GPU).
    ///
    /// Detection composes GPU + CPU features into one comma-joined list:
    ///   - CUDA Toolkit + NVIDIA GPU → `gpu-nvidia`
    ///   - Intel MKL (MKLROOT or default install) → `cpu-mkl` (additive)
    ///
    /// No Vulkan or llama.cpp build: GGUF chat runs in llama-server, a
    /// separate process (plan 0007). MKL composes with the GPU pick — GPU
    /// handles the heavy nets, MKL the remaining CPU BLAS/LAPACK.
    pub fn detect_build_features() -> Option<String> {
        let mut features: Vec<&'static str> = Vec::new();

        let cuda_active = detect_and_export_cuda();
        if cuda_active {
            features.push("gpu-nvidia");
        }

        if detect_and_export_mkl() {
            features.push("cpu-mkl");
        }

        if features.is_empty() {
            None
        } else {
            Some(features.join(","))
        }
    }
}

/// CUDA Toolkit auto-detection: prefer `CUDA_PATH` if it points at a valid
/// `nvcc`; otherwise pick the highest versioned subdir of the default
/// NVIDIA install root. Returns `true` only when `nvidia-smi` is also
/// present (the toolkit alone does not mean a usable GPU). On success
/// `CUDA_PATH` is re-exported so child build scripts see it.
fn detect_and_export_cuda() -> bool {
    let cuda_toolkit = crate::child_env::var("CUDA_PATH")
        .ok()
        .filter(|p| {
            std::path::Path::new(p)
                .join("bin")
                .join("nvcc.exe")
                .is_file()
        })
        .or_else(|| {
            let base = std::path::Path::new("C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA");
            if !base.is_dir() {
                return None;
            }
            std::fs::read_dir(base)
                .ok()?
                .filter_map(Result::ok)
                .map(|e| e.path())
                .filter(|p| p.join("bin").join("nvcc.exe").is_file())
                .max()
                .map(|p| p.to_string_lossy().to_string())
        });
    let nvidia_gpu_present = crate::child_env::which("nvidia-smi").is_ok();
    let cuda_active = cuda_toolkit.is_some() && nvidia_gpu_present;
    if cuda_active && let Some(ref path) = cuda_toolkit {
        crate::child_env::set("CUDA_PATH", path);
        println!("  [env] CUDA_PATH = {path} (auto-export for child build scripts)");
    }
    cuda_active
}

/// Intel MKL auto-detection: prefer `MKLROOT` if valid; otherwise pick the
/// highest versioned subdir of the default `oneAPI/mkl` root. Returns
/// `true` and re-exports `MKLROOT` on success.
fn detect_and_export_mkl() -> bool {
    let mkl_root = crate::child_env::var("MKLROOT")
        .ok()
        .filter(|p| std::path::Path::new(p).is_dir())
        .or_else(|| {
            let mkl_dir = std::path::Path::new("C:/Program Files (x86)/Intel/oneAPI/mkl");
            if !mkl_dir.is_dir() {
                return None;
            }
            std::fs::read_dir(mkl_dir)
                .ok()?
                .filter_map(Result::ok)
                .map(|e| e.path())
                .filter(|p| {
                    p.is_dir()
                        && p.file_name()
                            .and_then(|n| n.to_str())
                            .is_some_and(|n| n.chars().next().is_some_and(|c| c.is_ascii_digit()))
                })
                .max()
                .map(|p| p.to_string_lossy().to_string())
        });
    if let Some(ref path) = mkl_root {
        crate::child_env::set("MKLROOT", path);
        println!("  [env] MKLROOT = {path} (auto-export for child build scripts)");
        true
    } else {
        false
    }
}

impl BuildConfig {
    /// Confirm the rust-lld linker `.cargo/config.toml` names is installed,
    /// and export sccache as `RUSTC_WRAPPER`. Idempotent; safe to call
    /// multiple times.
    fn apply_fast_build_env(&self) {
        // rust-lld ships in the `llvm-tools-preview` rustup component at
        // `{sysroot}/lib/rustlib/{target}/bin/rust-lld[.exe]`; rustc finds
        // it there by bare name, so the config needs no machine path.
        match crate::child_env::command("rustc")
            .args(["--print", "sysroot"])
            .output()
        {
            Ok(out) if out.status.success() => {
                let sysroot = String::from_utf8_lossy(&out.stdout).trim().to_string();
                let lld_name = if cfg!(windows) {
                    "rust-lld.exe"
                } else {
                    "rust-lld"
                };
                let rust_lld = Path::new(&sysroot)
                    .join("lib")
                    .join("rustlib")
                    .join(&self.toolchain.target)
                    .join("bin")
                    .join(lld_name);
                if rust_lld.is_file() {
                    println!(
                        "  [linker] rust-lld at {} (declared in .cargo/config.toml)",
                        rust_lld.display()
                    );
                } else {
                    println!(
                        "  [warn] rust-lld missing at {} — run `rustup component add llvm-tools-preview`",
                        rust_lld.display()
                    );
                }
            }
            _ => println!("  [warn] `rustc --print sysroot` failed; rust-lld presence not checked"),
        }

        // sccache — compile cache that survives `cargo clean` and branch
        // switches. Bootstrap with `cargo install sccache --locked` once;
        // afterwards it lives at `~/.cargo/bin/sccache(.exe)` which is on
        // every rustup user's PATH.
        match crate::child_env::which("sccache") {
            Ok(path) => {
                crate::child_env::set("RUSTC_WRAPPER", &path);
                println!(
                    "  [env] RUSTC_WRAPPER = {} (sccache compile cache)",
                    path.display()
                );
            }
            Err(_) => println!(
                "  [warn] sccache not on PATH — `cargo install sccache --locked` enables compile cache"
            ),
        }

        // Acceleration probe — logs the auto-detected feature set so dev
        // knows what the upcoming `cargo check`/`cargo build` will compile.
        match Self::detect_build_features() {
            Some(feats) => println!("  [accel] auto-detected features = {feats}"),
            None => println!(
                "  [accel] no SDK detected — bare CPU build. \
                 Install CUDA Toolkit 12.x (NVIDIA) and/or Intel oneAPI MKL \
                 (CPU BLAS) to enable."
            ),
        }
    }

    /// Configure the MSVC build environment for child commands so nested
    /// cmake + ninja invocations find the full toolchain without needing a
    /// manual `vcvars64.bat` run. Returns whether activation succeeded.
    ///
    /// **Two-layer activation, vcvars64-first:**
    ///
    /// 1. **Preferred — invoke `vcvars64.bat`.** This is the canonical
    ///    Microsoft pattern: the batch file exports every env var the MSVC
    ///    + Windows SDK toolchain expects — PATH (MSVC bin + SDK bin +
    ///      Common7), INCLUDE (MSVC + UCRT + UM + `WinRT` + shared), LIB
    ///      (MSVC + UCRT + UM), LIBPATH (ATL/MFC + SDK refs),
    ///      `WindowsSdkVerBinPath`, `VCToolsInstallDir`, UCRT root, and ~40
    ///      more vars some build tools key off of. `rc.exe`, `mt.exe`,
    ///      `signtool.exe` etc all land on PATH this way, which the
    ///      cc-rs-only path consistently fails to surface (verified
    ///      2026-05-12: cmake's compiler-test reported
    ///      `--mt=CMAKE_MT-NOTFOUND` and aborted at CMakeTestCCompiler:67
    ///      even with the SDK bin prepended via xtask's parent env, because
    ///      cmake-rs overrides PATH with cc-rs's `Tool::env()` which doesn't
    ///      include the SDK bin).
    ///
    /// 2. **Fallback — `cc::windows_registry::find_tool`.** When vcvars
    ///    can't be located or fails to run, fall through to cc-rs's
    ///    registry-walk-based discovery. This path is sufficient for
    ///    pure compile workflows that don't need rc.exe/mt.exe (most
    ///    Rust-only builds). Logs the degradation so failures downstream
    ///    are traceable.
    ///
    /// Idempotent via `MSVC_ENV_APPLIED`: a second call in the same
    /// process is a no-op log line.
    ///
    /// No-op on non-Windows hosts.
    #[cfg(windows)]
    pub fn activate_msvc_env(&self) -> bool {
        if let Some(&already) = MSVC_ENV_APPLIED.get() {
            println!(
                "  [env] MSVC toolchain env already activated this process (success = {already}); skipping"
            );
            return already;
        }

        // ── Layer 1: vcvars64.bat (canonical) ─────────────────────────
        if let Some(vcvars) = find_vcvars64(&self.toolchain.target) {
            println!(
                "  [env] vcvars64.bat located at {} — invoking for full MSVC + SDK env",
                vcvars.display()
            );
            if apply_vcvars_env(&vcvars) {
                finalize_vcvars_success();
                let _ = MSVC_ENV_APPLIED.set(true);
                return true;
            }
            println!(
                "  [warn] vcvars64.bat invocation did not yield usable env; \
                 falling back to cc::windows_registry"
            );
        } else {
            println!(
                "  [info] vcvars64.bat not located at any known VS 2022 install root; \
                 falling back to cc::windows_registry"
            );
        }

        // ── Layer 2: cc::windows_registry fallback ────────────────────
        let activated = apply_cc_rs_fallback(self.toolchain.target.as_str());
        let _ = MSVC_ENV_APPLIED.set(activated);
        activated
    }

    #[cfg(not(windows))]
    #[expect(
        clippy::unused_self,
        reason = "Linux stub mirrors Windows method signature so callers stay platform-agnostic"
    )]
    pub fn activate_msvc_env(&self) -> bool {
        true
    }

    /// Select the cmake generator and export `CMAKE_GENERATOR` (plus
    /// `CMAKE_MAKE_PROGRAM` when generator = "Ninja") so child cmake-rs
    /// invocations pick the right one. Idempotent via `GENERATOR_SELECTED`.
    ///
    /// Selection logic on Windows:
    ///   1. SSOT preference: `[build.deps.cmake].extras.CMAKE_GENERATOR` (set
    ///      to "Ninja" today). The SSOT loop has already exported it as an
    ///      env var; this method validates the preference can be honored.
    ///   2. If preference = "Ninja" AND MSVC env active AND ninja.exe
    ///      resolves → keep "Ninja", export `CMAKE_MAKE_PROGRAM`.
    ///   3. Else → fall back to "Visual Studio 17 2022", overwrite env,
    ///      explicitly clear `CMAKE_MAKE_PROGRAM` (the VS generator would
    ///      try to use ninja as `MSBuild`'s build tool — fails).
    ///
    /// Cross-platform note: on Linux / macOS this method still picks a
    /// sensible default (Ninja if resolved, else cmake's auto-detection
    /// kicks in via leaving the var alone). The MSVC-specific fallback is
    /// Windows-only.
    pub fn select_generator(&self, workspace_root: &Path) {
        if let Some(existing) = GENERATOR_SELECTED.get() {
            println!(
                "  [env] CMAKE_GENERATOR already selected this process = {existing}; skipping"
            );
            return;
        }

        let preference = self
            .deps
            .cmake
            .as_ref()
            .and_then(|c| c.extras.get("CMAKE_GENERATOR").cloned())
            .unwrap_or_else(|| {
                if cfg!(windows) {
                    "Ninja".to_string()
                } else {
                    String::new()
                }
            });

        let msvc_active = MSVC_ENV_APPLIED.get().copied().unwrap_or(!cfg!(windows));
        let ninja_path = self.resolve_ninja(workspace_root);

        let chosen = if preference == "Ninja" {
            if msvc_active && ninja_path.is_some() {
                "Ninja".to_string()
            } else {
                let reason = if msvc_active {
                    "ninja.exe not resolved"
                } else {
                    "MSVC env not active"
                };
                println!(
                    "  [warn] CMAKE_GENERATOR preference \"Ninja\" not honorable ({reason}); \
                     falling back to \"Visual Studio 17 2022\""
                );
                "Visual Studio 17 2022".to_string()
            }
        } else if preference.is_empty() {
            // No preference on non-Windows: let cmake auto-detect.
            String::new()
        } else {
            preference
        };

        if chosen.is_empty() {
            crate::child_env::remove("CMAKE_GENERATOR");
            println!("  [env] CMAKE_GENERATOR unset (cmake will auto-detect)");
        } else {
            crate::child_env::set("CMAKE_GENERATOR", &chosen);
            println!("  [env] CMAKE_GENERATOR = {chosen}");
        }

        if chosen == "Ninja" {
            if let Some(path) = ninja_path {
                crate::child_env::set("CMAKE_MAKE_PROGRAM", &path);
                println!(
                    "  [env] CMAKE_MAKE_PROGRAM = {} (ninja for cmake)",
                    path.display()
                );
                // Prepend ninja's parent dir to PATH so nested
                // `ExternalProject_Add` sub-cmakes that DON'T inherit
                // `CMAKE_MAKE_PROGRAM` via -D can still find ninja via the
                // standard PATH scan. cmake's Ninja generator detection
                // falls back to PATH when no cache entry / no env hint is
                // available; without ninja on PATH the inner cmake emits
                // "CMake was unable to find a build program corresponding
                // to Ninja" and aborts (observed in the vulkan-shaders-gen
                // ExternalProject 2026-05-12).
                if let Some(parent) = path.parent() {
                    let parent_str = parent.to_string_lossy().into_owned();
                    let existing = crate::child_env::var_os("PATH").unwrap_or_default();
                    let mut prepended = std::ffi::OsString::from(parent_str.clone());
                    prepended.push(if cfg!(windows) { ";" } else { ":" });
                    prepended.push(&existing);
                    crate::child_env::set("PATH", &prepended);
                    println!("  [env] PATH prepended with ninja directory: {parent_str}");
                }
            }
        } else {
            // Under the VS generator, cmake-rs would forward
            // CMAKE_MAKE_PROGRAM=ninja.exe via -D, and cmake would try to use
            // ninja AS MSBuild's build tool — fails. Strip it explicitly so
            // a stale env from a prior process can't poison the build.
            crate::child_env::remove("CMAKE_MAKE_PROGRAM");
        }

        let _ = GENERATOR_SELECTED.set(chosen);
    }

    /// Purge any cmake-rs build directory whose cached `CMAKE_GENERATOR`
    /// disagrees with the generator selected by `select_generator`.
    ///
    /// **Why this exists.** `cmake-rs` honours `Config::always_configure(false)`
    /// (set by `llama-cpp-sys-2`'s build.rs) by skipping the cmake configure
    /// step entirely when `CMakeCache.txt` already exists. The new
    /// `CMAKE_GENERATOR` env is never observed; the cached generator wins.
    /// Concretely: a prior failed build configured with the VS 17 2022
    /// generator leaves `CMAKE_GENERATOR:INTERNAL=Visual Studio 17 2022`
    /// in the cache, and the next xtask invocation — even with
    /// `CMAKE_GENERATOR=Ninja` set in env — still runs `MSBuild`, reproducing
    /// the `vulkan-shaders-gen` race we just fixed (verified by the
    /// 33-minute failure on 2026-05-12).
    ///
    /// `CMake` itself errors on `-G <mismatch>` when re-invoking against a
    /// non-matching cache, but `cmake-rs` doesn't re-invoke cmake under
    /// `always_configure(false)`, so the error never fires. Upstream
    /// `cmake-rs`'s `maybe_clear()` only validates `CMAKE_HOME_DIRECTORY`
    /// (source-dir move), never the generator. There is no upstream knob
    /// to force re-configure on generator change — fingerprinting +
    /// purging from the orchestrator is the canonical workaround.
    ///
    /// **What we do.** Walk every
    /// `target/<profile>/build/<crate>-<hash>/out/build/CMakeCache.txt`,
    /// extract the `CMAKE_GENERATOR:INTERNAL=` value, and when it
    /// disagrees with the selected generator (or is missing — corrupt
    /// cache from an interrupted configure), remove both the
    /// `build/<crate>-<hash>/` dir AND its matching
    /// `.fingerprint/<crate>-<hash>/` dir so cargo re-runs the build
    /// script and `cmake-rs` reconfigures from scratch. Object files for
    /// that crate are lost on purge — that's the cost of switching
    /// generators — but every other crate's incremental state is
    /// preserved.
    ///
    /// **Idempotence.** When every cached cmake cache already matches the
    /// selected generator, no I/O happens beyond reading the cache files.
    /// Re-running the same xtask command twice in a row is a no-op past
    /// the first purge.
    fn purge_stale_cmake_dirs(workspace_root: &Path) {
        let Some(selected) = GENERATOR_SELECTED.get() else {
            return;
        };
        if selected.is_empty() {
            // No generator pinned — let cmake auto-detect. Mismatch is
            // ambiguous; skip purge.
            return;
        }

        let target_root = workspace_root.join("target");
        if !target_root.is_dir() {
            return;
        }

        let Ok(profile_entries) = std::fs::read_dir(&target_root) else {
            return;
        };

        let mut checked: u32 = 0;
        let mut purged: Vec<String> = Vec::new();

        for profile in profile_entries.filter_map(Result::ok) {
            let profile_path = profile.path();
            // Skip non-directories (lock files, etc.).
            if !profile_path.is_dir() {
                continue;
            }
            let build_root = profile_path.join("build");
            if !build_root.is_dir() {
                continue;
            }
            let Ok(crate_entries) = std::fs::read_dir(&build_root) else {
                continue;
            };
            for crate_entry in crate_entries.filter_map(Result::ok) {
                let crate_dir = crate_entry.path();
                if !crate_dir.is_dir() {
                    continue;
                }
                // cmake-rs writes its cache at <OUT_DIR>/build/CMakeCache.txt,
                // where OUT_DIR is `build/<crate>-<hash>/out/`. Earlier
                // cmake-rs versions used <OUT_DIR>/CMakeCache.txt directly;
                // probe both paths to stay tolerant of either layout.
                let candidate_caches = [
                    crate_dir.join("out").join("build").join("CMakeCache.txt"),
                    crate_dir.join("out").join("CMakeCache.txt"),
                ];
                let Some(cache) = candidate_caches.into_iter().find(|p| p.is_file()) else {
                    continue;
                };
                checked += 1;
                let Ok(contents) = std::fs::read_to_string(&cache) else {
                    continue;
                };

                let stored: Option<&str> = contents
                    .lines()
                    .find_map(|l| l.strip_prefix("CMAKE_GENERATOR:INTERNAL="))
                    .map(str::trim);

                if stored == Some(selected.as_str()) {
                    continue;
                }

                let dir_name = crate_dir
                    .file_name()
                    .and_then(|n| n.to_str())
                    .map(String::from)
                    .unwrap_or_default();
                let stored_label = stored.unwrap_or("<missing>");

                println!(
                    "  [purge] {dir_name}: cmake cache generator = \"{stored_label}\", \
                     selected = \"{selected}\" — clearing build + fingerprint to force reconfigure"
                );

                // Remove the build dir so cargo loses the build-script's
                // OUT_DIR, output, and timestamp records.
                if let Err(e) = std::fs::remove_dir_all(&crate_dir) {
                    println!("  [warn] remove {} failed: {}", crate_dir.display(), e);
                    continue;
                }

                // Cargo's incremental-rerun decision keys off the matching
                // fingerprint dir (`<profile>/.fingerprint/<crate>-<hash>/`),
                // NOT the build dir. Removing the build dir alone leaves a
                // stale fingerprint that says "build script up to date,
                // skip" — link errors follow because the static lib is now
                // missing. Nuke the fingerprint too.
                let fingerprint_dir = profile_path.join(".fingerprint").join(&dir_name);
                if fingerprint_dir.is_dir()
                    && let Err(e) = std::fs::remove_dir_all(&fingerprint_dir)
                {
                    println!(
                        "  [warn] remove {} failed: {}",
                        fingerprint_dir.display(),
                        e
                    );
                }

                purged.push(dir_name);
            }
        }

        if checked > 0 {
            if purged.is_empty() {
                println!(
                    "  [cmake] {checked} cmake-cached build dir(s) — all match selected generator \"{selected}\""
                );
            } else {
                println!(
                    "  [cmake] purged {} stale cmake build dir(s) ({}) — next cargo build will reconfigure under \"{selected}\"",
                    purged.len(),
                    purged.join(", ")
                );
            }
        }
    }

    /// Resolve ninja.exe from layered sources:
    ///   1. `[build.deps.ninja].path` SSOT (if the file exists)
    ///   2. Common VS 2022 install roots (`BuildTools` / Community / Pro / Enterprise)
    ///   3. `crate::child_env::which("ninja")` — falls back to system PATH
    ///
    /// Returns `None` if every layer misses. The caller decides whether to
    /// downgrade the generator or hard-fail.
    fn resolve_ninja(&self, workspace_root: &Path) -> Option<PathBuf> {
        // 1. SSOT
        if let Some(ninja) = &self.deps.ninja {
            let p = workspace_root.join(&ninja.path);
            if p.is_file() {
                return Some(p);
            }
            // Also try the path verbatim — `[build.deps.ninja].path` is
            // often absolute (e.g. `D:/localdev/BuildTools/...`).
            let abs = PathBuf::from(&ninja.path);
            if abs.is_file() {
                return Some(abs);
            }
            println!(
                "  [info] [build.deps.ninja].path = {} not on disk; trying VS 2022 BuildTools roots",
                p.display()
            );
        }

        // 2. VS 2022 known install roots. BuildTools first because that's
        // the canonical CI / lean-install pattern.
        #[cfg(windows)]
        {
            let candidates: &[&str] = &[
                "D:/localdev/BuildTools/Common7/IDE/CommonExtensions/Microsoft/CMake/Ninja/ninja.exe",
                "C:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools/Common7/IDE/CommonExtensions/Microsoft/CMake/Ninja/ninja.exe",
                "C:/Program Files/Microsoft Visual Studio/2022/BuildTools/Common7/IDE/CommonExtensions/Microsoft/CMake/Ninja/ninja.exe",
                "C:/Program Files/Microsoft Visual Studio/2022/Community/Common7/IDE/CommonExtensions/Microsoft/CMake/Ninja/ninja.exe",
                "C:/Program Files/Microsoft Visual Studio/2022/Professional/Common7/IDE/CommonExtensions/Microsoft/CMake/Ninja/ninja.exe",
                "C:/Program Files/Microsoft Visual Studio/2022/Enterprise/Common7/IDE/CommonExtensions/Microsoft/CMake/Ninja/ninja.exe",
            ];
            for c in candidates {
                let p = PathBuf::from(c);
                if p.is_file() {
                    return Some(p);
                }
            }
        }

        // 3. System PATH
        crate::child_env::which("ninja").ok()
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

/// Locate `vcvars64.bat` from known VS 2022 install roots, then fall back
/// to derivation from `cc::windows_registry::find_tool(target, "cl.exe")`
/// (cl.exe sits at `<VS_ROOT>\VC\Tools\MSVC\<ver>\bin\HostX64\x64\cl.exe`;
/// vcvars64.bat sits at `<VS_ROOT>\VC\Auxiliary\Build\vcvars64.bat`).
///
/// Returns `None` when neither lookup yields an existing file.
#[cfg(windows)]
fn find_vcvars64(target: &str) -> Option<PathBuf> {
    // Known install roots — BuildTools first (canonical headless install),
    // then Community / Professional / Enterprise. The dev box has
    // BuildTools at D:\localdev\BuildTools per the SSOT in
    // config/platform/build/deps.toml.
    let candidates: &[&str] = &[
        "D:/localdev/BuildTools/VC/Auxiliary/Build/vcvars64.bat",
        "C:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools/VC/Auxiliary/Build/vcvars64.bat",
        "C:/Program Files/Microsoft Visual Studio/2022/BuildTools/VC/Auxiliary/Build/vcvars64.bat",
        "C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Auxiliary/Build/vcvars64.bat",
        "C:/Program Files/Microsoft Visual Studio/2022/Professional/VC/Auxiliary/Build/vcvars64.bat",
        "C:/Program Files/Microsoft Visual Studio/2022/Enterprise/VC/Auxiliary/Build/vcvars64.bat",
    ];
    for c in candidates {
        let p = PathBuf::from(c);
        if p.is_file() {
            return Some(p);
        }
    }

    // Derive from cc-rs's cl.exe discovery. cl.exe lives at
    //   <VS_ROOT>\VC\Tools\MSVC\<ver>\bin\HostX64\x64\cl.exe
    // — seven path components below VS_ROOT. Pop them all to reach the
    // root, then join the vcvars64.bat suffix.
    if let Some(tool) = cc::windows_registry::find_tool(target, "cl.exe") {
        let mut path = tool.path().to_path_buf();
        for _ in 0..7 {
            if !path.pop() {
                return None;
            }
        }
        let vcvars = path
            .join("VC")
            .join("Auxiliary")
            .join("Build")
            .join("vcvars64.bat");
        if vcvars.is_file() {
            return Some(vcvars);
        }
    }
    None
}

#[cfg(not(windows))]
#[allow(dead_code)]
fn find_vcvars64(_target: &str) -> Option<PathBuf> {
    None
}

/// Invoke `vcvars64.bat` in a child `cmd` process and apply every
/// `KEY=value` pair it sets to the current process's env. Returns `true`
/// when the batch ran successfully and at least one env var was applied.
///
/// `vcvars64.bat` is a Microsoft-distributed batch file that exports the
/// complete env set the MSVC + Windows SDK toolchain expects. It's the
/// canonical way to activate a "Visual Studio Developer Command Prompt"
/// from a script. Running `cmd /c "<vcvars64> && set"` lets us capture
/// every var the batch sets; we parse the stdout lines and forward each
/// pair to the child environment.
///
/// Pitfalls handled:
///   * The batch writes a banner to stdout before `set` runs — we filter
///     to lines that match the `KEY=value` shape (no spaces around `=`,
///     KEY is a valid env-var-name char run).
///   * `cmd` returns the batch's exit code; vcvars64.bat returns non-zero
///     only on hard failure (missing VS install). We require status
///     success AND at least one applied var before declaring victory.
///   * UTF-8 lossy decode preserves Windows CP1252 byte ranges (rare in
///     vcvars output, but worth being safe).
#[cfg(windows)]
fn apply_vcvars_env(vcvars: &Path) -> bool {
    use std::os::windows::process::CommandExt;
    // Two-layer quoting problem solved with `raw_arg`:
    //
    //   1. `cmd /c <arg>` strips the outer pair of quotes from `<arg>` per
    //      Microsoft's documented quote-stripping rule (ss64.com/nt/cmd).
    //      So to invoke a quoted path AS A COMMAND, the arg must be wrapped
    //      in DOUBLE-DOUBLE quotes: `""<quoted-path>" >nul && set"`.
    //
    //   2. Rust's `Command::arg` / `Command::args` auto-escape inner quotes
    //      with backslash, breaking cmd's parser (`\"` is not a cmd escape
    //      — cmd reads it as literal backslash + quote). `raw_arg`
    //      (windows-only `CommandExt`) appends the arg verbatim, bypassing
    //      Rust's escaping so the cmd-specific quoting reaches cmd intact.
    //
    // Verified failure on 2026-05-12: without `raw_arg`, cmd received
    // `\"D:\...\vcvars64.bat\"` as the literal command name and reported
    // "is not recognized as an internal or external command".
    //
    // Also normalize forward → backslash for the path inside the quotes —
    // both work in cmd, but backslash matches the canonical Windows form.
    let vcvars_str = vcvars.to_string_lossy().replace('/', "\\");
    let raw = format!(r#"/c ""{vcvars_str}" >nul && set""#);
    let output = match crate::child_env::command("cmd").raw_arg(&raw).output() {
        Ok(o) => o,
        Err(e) => {
            println!("  [warn] vcvars64.bat spawn failed: {e}");
            return false;
        }
    };
    if !output.status.success() {
        println!(
            "  [warn] vcvars64.bat exit {:?}: stderr = {}",
            output.status,
            String::from_utf8_lossy(&output.stderr).trim()
        );
        return false;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut applied: u32 = 0;
    for line in stdout.lines() {
        // Valid env-var lines from `set` look like `NAME=value`. The first
        // char of NAME is a letter or underscore; subsequent chars are
        // alnum or underscore. Anything else (banner text, blank lines)
        // is skipped.
        let Some(eq_idx) = line.find('=') else {
            continue;
        };
        if eq_idx == 0 {
            continue;
        }
        let key = &line[..eq_idx];
        let first = key.as_bytes()[0];
        let valid_first = first.is_ascii_alphabetic() || first == b'_';
        let valid_rest = key
            .bytes()
            .skip(1)
            .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'(' || b == b')');
        if !valid_first || !valid_rest {
            continue;
        }
        let value = &line[eq_idx + 1..];
        crate::child_env::set(key, value);
        applied += 1;
    }
    if applied == 0 {
        println!("  [warn] vcvars64.bat ran but produced no recognizable env vars");
        return false;
    }
    println!(
        "  [env] vcvars64.bat applied {applied} env vars (PATH, INCLUDE, LIB, LIBPATH, \
         WindowsSdkBinPath, VCToolsInstallDir, UCRT root, etc.)"
    );

    // Diagnostic: confirm the four executables the build chain needs are
    // now resolvable via PATH. Surfacing this up front means a future
    // failure mode (e.g. SDK install partially broken) shows here rather
    // than buried 20 minutes into a llama.cpp configure.
    for tool in ["cl", "link", "ninja", "rc", "mt"] {
        match crate::child_env::which(tool) {
            Ok(p) => println!("  [tool] {tool} = {}", p.display()),
            Err(_) => {
                println!(
                    "  [warn] {tool} not on PATH after vcvars64 — toolchain may be incomplete"
                );
            }
        }
    }
    true
}

#[cfg(not(windows))]
#[allow(dead_code)]
fn apply_vcvars_env(_vcvars: &Path) -> bool {
    false
}

/// Build the contents of the MSVC toolchain `CMake` fragment xtask emits
/// under `target/.xtask/msvc-toolchain.cmake`.
///
/// **Why a toolchain file is the right shape:** `CMAKE_TOOLCHAIN_FILE` is
/// the one mechanism `CMake` guarantees propagates to every nested cmake
/// invocation — `ExternalProject_Add` sub-projects, `try_compile` probes,
/// recursive `find_package` configures. `CMake` reads the env var into a
/// cache var on first configure (per
/// <https://cmake.org/cmake/help/latest/envvar/CMAKE_TOOLCHAIN_FILE.html>)
/// and the cache var is sticky from then on. `cmake-rs` ALSO forwards
/// the env to its `cmake` invocation via `-DCMAKE_TOOLCHAIN_FILE=` at
/// `cmake-0.1.58/src/lib.rs:451-453`, so the outer cmake honors it too.
///
/// **What we set:**
///   - `CMAKE_C_COMPILER` / `CMAKE_CXX_COMPILER` — full absolute path to
///     `cl.exe`. Both `EnableLanguage(C)` and `EnableLanguage(CXX)` in
///     sub-cmakes will pick these up without needing `CC`/`CXX` env.
///   - `CMAKE_MAKE_PROGRAM` — full path to `ninja.exe`. The Ninja
///     generator's `find_program` step uses this when set.
///   - `CMAKE_<LANG>_LINK_FLAGS_INIT` carrying `/MANIFEST:NO` — applies
///     to EXE / SHARED / MODULE link variants. Belt-and-suspenders for
///     the `LDFLAGS=/MANIFEST:NO` env (LDFLAGS only seeds
///     `CMAKE_<LANG>_LINK_FLAGS` once during first configure; `_INIT`
///     covers re-configures and `ExternalProject_Add` children whose
///     fresh cache never read LDFLAGS).
///
/// **Why we use `_INIT` not direct cache vars:** `CMAKE_<LANG>_LINK_FLAGS`
/// set directly in a toolchain file gets overwritten when the project
/// calls `enable_language()`. The `_INIT` variants are `CMake`'s
/// documented contract for toolchain-file-set defaults that survive
/// language enablement.
/// Post-vcvars success path: set the `CC`/`CXX` belts, `LDFLAGS`, and
/// write the toolchain file. Extracted from `activate_msvc_env` so the
/// main function stays under `too_many_lines`.
///
/// The `LDFLAGS=/MANIFEST:NO` setting skips manifest generation in
/// link.exe so cmake's `vs_link_exe` step doesn't depend on mt.exe /
/// rc.exe at all. `CMake` reads `LDFLAGS` env as the initial value for
/// `CMAKE_<LANG>_LINK_FLAGS` per the documented env-var contract
/// (<https://cmake.org/cmake/help/latest/envvar/LDFLAGS.html>).
///
/// Verified failure on 2026-05-12: without this, every `try_compile`
/// link step ends with `--mt=CMAKE_MT-NOTFOUND` and the build dies at
/// `CMakeTestCCompiler.cmake:67`.
#[cfg(windows)]
fn finalize_vcvars_success() {
    if let Ok(cl) = crate::child_env::which("cl") {
        let cl_str = cl.to_string_lossy().into_owned();
        crate::child_env::set("CC", &cl_str);
        crate::child_env::set("CXX", &cl_str);
        println!("  [env] CC = {cl_str} (post-vcvars belt)");
        println!("  [env] CXX = {cl_str} (post-vcvars belt)");
    }
    crate::child_env::set("LDFLAGS", "/MANIFEST:NO");
    println!(
        "  [env] LDFLAGS = /MANIFEST:NO (skip manifest — sidesteps cmake-rs PATH-replace stripping SDK bin)"
    );
    write_msvc_toolchain_file();
}

/// `cc::windows_registry` fallback path: locate `cl.exe`, export the
/// Tool's env (PATH/INCLUDE/LIB/LIBPATH), derive the Windows SDK bin,
/// and set `CC`/`CXX`/`LDFLAGS` for nested `ExternalProject_Add` configures.
/// Returns whether the activation succeeded.
#[cfg(windows)]
fn apply_cc_rs_fallback(target: &str) -> bool {
    let Some(tool) = cc::windows_registry::find_tool(target, "cl.exe") else {
        println!(
            "  [warn] MSVC cl.exe not found via cc::windows_registry for target {target}. \
             Install Visual Studio Build Tools 2022 with the \"Desktop development with C++\" \
             workload AND the Windows 10/11 SDK. xtask will fall back to the Visual Studio \
             17 2022 cmake generator, which still needs cl.exe on PATH — expect a \
             configure-time failure if it is absent."
        );
        return false;
    };

    let cl_path = tool.path().to_path_buf();
    println!(
        "  [env] MSVC cl.exe = {} (resolved via cc::windows_registry, target {target})",
        cl_path.display()
    );
    for (key, value) in tool.env() {
        let key_str = key.to_string_lossy();
        if key_str.eq_ignore_ascii_case("PATH") {
            let entries = value
                .to_string_lossy()
                .split(';')
                .filter(|s| !s.is_empty())
                .count();
            println!("  [env] PATH augmented with MSVC toolchain ({entries} entries prepended)");
        } else if key_str.eq_ignore_ascii_case("INCLUDE")
            || key_str.eq_ignore_ascii_case("LIB")
            || key_str.eq_ignore_ascii_case("LIBPATH")
        {
            let entries = value
                .to_string_lossy()
                .split(';')
                .filter(|s| !s.is_empty())
                .count();
            println!("  [env] {key_str} = {entries} entries (from MSVC toolchain)");
        } else {
            println!("  [env] {key_str} set (from MSVC toolchain)");
        }
        crate::child_env::set(key, value);
    }

    // CC / CXX hand-off for `ExternalProject_Add` sub-builds — see the
    // rationale in the original 2026-05-12 verification note.
    let cl_path_str = cl_path.to_string_lossy().into_owned();
    crate::child_env::set("CC", &cl_path_str);
    crate::child_env::set("CXX", &cl_path_str);
    println!("  [env] CC = {cl_path_str} (for nested ExternalProject configures)");
    println!("  [env] CXX = {cl_path_str} (for nested ExternalProject configures)");

    // Windows SDK bin (rc.exe + mt.exe).
    if let Some(sdk_bin) = derive_windows_sdk_bin() {
        let sdk_str = sdk_bin.to_string_lossy().into_owned();
        let existing = crate::child_env::var_os("PATH").unwrap_or_default();
        let mut prepended = std::ffi::OsString::from(&sdk_str);
        prepended.push(";");
        prepended.push(&existing);
        crate::child_env::set("PATH", &prepended);
        println!("  [env] PATH prepended with Windows SDK bin (rc.exe / mt.exe): {sdk_str}");
    } else {
        println!(
            "  [warn] Could not derive Windows SDK bin from INCLUDE — cmake's link \
             step may fail to find rc.exe / mt.exe. Install the latest Windows 10/11 SDK \
             via the Visual Studio Build Tools installer."
        );
    }

    crate::child_env::set("LDFLAGS", "/MANIFEST:NO");
    println!("  [env] LDFLAGS = /MANIFEST:NO (skip manifest generation)");

    true
}

/// Locate `cl.exe` + `ninja.exe` on the post-vcvars PATH, materialise the
/// MSVC toolchain `.cmake` file under `target/.xtask/`, and export
/// `CMAKE_TOOLCHAIN_FILE` so every nested cmake invocation sees it.
/// Best-effort — failures are logged, not propagated, because the
/// outer `activate_msvc_env` still treats `CC`/`CXX`/`LDFLAGS` as the
/// minimum-viable activation and only the deeper `ExternalProject_Add`
/// sub-cmakes need the toolchain file.
#[cfg(windows)]
fn write_msvc_toolchain_file() {
    let Ok(cl) = crate::child_env::which("cl") else {
        return;
    };
    let cl_path = cl.to_string_lossy().into_owned();
    let ninja_path = crate::child_env::which("ninja").map_or_else(
        |_| {
            "D:/localdev/BuildTools/Common7/IDE/CommonExtensions/Microsoft/CMake/Ninja/ninja.exe"
                .to_string()
        },
        |p| p.to_string_lossy().into_owned(),
    );
    let target_dir = std::env::current_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
        .join("target")
        .join(".xtask");
    if std::fs::create_dir_all(&target_dir).is_err() {
        return;
    }
    let toolchain = target_dir.join("msvc-toolchain.cmake");
    let contents = build_toolchain_file_contents(&cl_path, &ninja_path);
    match std::fs::write(&toolchain, &contents) {
        Ok(()) => {
            let toolchain_str = toolchain.to_string_lossy().into_owned();
            crate::child_env::set("CMAKE_TOOLCHAIN_FILE", &toolchain_str);
            println!(
                "  [env] CMAKE_TOOLCHAIN_FILE = {toolchain_str} \
                 (compiler + make_program + /MANIFEST:NO for every nested cmake)"
            );
        }
        Err(e) => println!(
            "  [warn] could not write toolchain file at {}: {e}",
            toolchain.display()
        ),
    }
}

#[cfg(windows)]
fn build_toolchain_file_contents(cl_path: &str, ninja_path: &str) -> String {
    // CMake parses backslash-escape sequences in `set()` literals, so
    // normalize to forward slashes — CMake accepts forward slashes in
    // Windows paths universally.
    let cl = cl_path.replace('\\', "/");
    let ninja = ninja_path.replace('\\', "/");
    format!(
        "# Auto-generated by xtask. Do not edit by hand.\n\
         # Pins the MSVC toolchain for every cmake invocation that\n\
         # inherits CMAKE_TOOLCHAIN_FILE — including ExternalProject_Add\n\
         # sub-projects that don't forward the outer cmake's `-D` args.\n\
         set(CMAKE_C_COMPILER \"{cl}\" CACHE FILEPATH \"\")\n\
         set(CMAKE_CXX_COMPILER \"{cl}\" CACHE FILEPATH \"\")\n\
         set(CMAKE_MAKE_PROGRAM \"{ninja}\" CACHE FILEPATH \"\")\n\
         # /MANIFEST:NO skips manifest generation so link.exe doesn't need\n\
         # mt.exe (which cmake's find_program won't locate when PATH is\n\
         # replaced by cmake-rs's cc-rs-derived narrower env). Static-lib\n\
         # builds and cmake try_compile probes don't need a manifest.\n\
         set(CMAKE_EXE_LINKER_FLAGS_INIT \"/MANIFEST:NO\")\n\
         set(CMAKE_SHARED_LINKER_FLAGS_INIT \"/MANIFEST:NO\")\n\
         set(CMAKE_MODULE_LINKER_FLAGS_INIT \"/MANIFEST:NO\")\n",
    )
}

/// Derive the Windows 10/11 SDK `bin/<ver>/x64` directory from the current
/// `INCLUDE` env var. cc-rs populates `INCLUDE` with SDK header paths of
/// the form `<kits-root>\include\<sdk-ver>\<subdir>`; the matching bin
/// directory (which carries `rc.exe`, `mt.exe`, `signtool.exe`) is
/// `<kits-root>\bin\<sdk-ver>\x64`.
///
/// Walks every entry in `INCLUDE`, identifies the first one matching the
/// kits-root pattern, and returns the bin path when it exists on disk.
/// Returns `None` when `INCLUDE` is unset, no entry matches the pattern,
/// or the derived bin path is missing.
#[cfg(windows)]
fn derive_windows_sdk_bin() -> Option<PathBuf> {
    let include = crate::child_env::var_os("INCLUDE")?;
    for entry in std::env::split_paths(&include) {
        // Need three pops to walk: <kits-root>\include\<ver>\<subdir>
        //                                                    ^ entry
        // pop -> <kits-root>\include\<ver>
        // pop -> <kits-root>\include
        // pop -> <kits-root>
        let mut cursor = entry.clone();
        if !cursor.pop() {
            continue;
        }
        let sdk_ver = match cursor.file_name() {
            Some(n) => n.to_owned(),
            None => continue,
        };
        if !cursor.pop() {
            continue;
        }
        let dirname_is_include = cursor
            .file_name()
            .and_then(|n| n.to_str())
            .is_some_and(|n| n.eq_ignore_ascii_case("include"));
        if !dirname_is_include {
            continue;
        }
        if !cursor.pop() {
            continue;
        }
        let kits_root = cursor;
        let bin = kits_root.join("bin").join(&sdk_ver).join("x64");
        if bin.is_dir() {
            return Some(bin);
        }
    }
    None
}

/// Linux/macOS stub of [`derive_windows_sdk_bin`]. Returns `None` so that
/// future cross-platform toolchain-probe code (e.g. clang/gcc resolver
/// folded into the same call site) can call this without `#[cfg(windows)]`
/// gating at every callsite. The Windows SDK has no analogue on POSIX —
/// the equivalent abstraction there is "system include/lib roots" handled
/// by clang/gcc themselves — so this stub stays a no-op until the
/// cross-platform path is authored.
#[cfg(not(windows))]
#[expect(
    dead_code,
    reason = "API-parity stub for derive_windows_sdk_bin so future POSIX toolchain probes \
              can share callsites with the Windows path without per-call cfg gating"
)]
fn derive_windows_sdk_bin() -> Option<PathBuf> {
    None
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

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use std::io::Read;
    use std::sync::atomic::{AtomicU64, Ordering};

    static DRAIN_TEST_SEQ: AtomicU64 = AtomicU64::new(0);

    fn run_drain(input: &[u8], label: &'static str, stdout: bool) -> String {
        // Cargo runs tests in parallel — each invocation needs a unique
        // path or they trample each other's log file.
        let seq = DRAIN_TEST_SEQ.fetch_add(1, Ordering::Relaxed);
        let tmp = std::env::temp_dir().join(format!(
            "xtask-drain-test-{}-{}-{}.log",
            std::process::id(),
            label,
            seq,
        ));
        let file = OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .read(true)
            .open(&tmp)
            .unwrap();
        let log = Arc::new(Mutex::new(BufWriter::new(file)));
        let start = Instant::now();

        drain_stream(input, &log, label, start, stdout).unwrap();

        // Flush before reading back.
        log.lock().unwrap().flush().unwrap();

        let mut reopened = std::fs::File::open(&tmp).unwrap();
        let mut s = String::new();
        reopened.read_to_string(&mut s).unwrap();
        let _ = std::fs::remove_file(&tmp);
        s
    }

    #[test]
    fn drain_adds_label_and_elapsed_prefix() {
        let out = run_drain(b"hello world\n", "OUT", true);
        assert!(out.contains("[OUT] hello world"), "got: {out:?}");
        assert!(
            out.starts_with('['),
            "expected leading [ms] bracket: {out:?}"
        );
    }

    #[test]
    fn drain_strips_carriage_returns() {
        let out = run_drain(b"line-a\r\nline-b\r\n", "OUT", true);
        assert!(!out.contains('\r'), "raw CR leaked to log: {out:?}");
        assert!(out.contains("[OUT] line-a"));
        assert!(out.contains("[OUT] line-b"));
    }

    #[test]
    fn drain_lossy_decodes_non_utf8() {
        // 0xFF is never valid UTF-8. BufRead::lines() would have silently
        // dropped this line; drain_stream must keep it (as U+FFFD).
        let out = run_drain(b"warn: \xFFbad byte\n", "ERR", false);
        assert!(out.contains("[ERR]"), "label missing: {out:?}");
        assert!(out.contains("bad byte"), "surviving ascii missing: {out:?}");
        assert!(
            out.contains('\u{FFFD}'),
            "replacement char missing: {out:?}"
        );
    }

    #[test]
    fn drain_handles_final_line_without_newline() {
        let out = run_drain(b"no-trailing-newline", "OUT", true);
        assert!(out.contains("[OUT] no-trailing-newline"), "got: {out:?}");
    }

    #[test]
    fn drain_yields_multiple_distinct_lines() {
        let out = run_drain(b"one\ntwo\nthree\n", "OUT", true);
        let count = out.matches("[OUT]").count();
        assert_eq!(count, 3, "expected 3 labeled lines, got: {out:?}");
    }

    #[test]
    fn drain_treats_lone_cr_as_progress_tick_not_log_entry() {
        // Cargo/rustc progress bars update in place via lone `\r`:
        //   "  Building [===>] 3/10\r  Building [====] 4/10\r...\n"
        // The log should NOT contain an entry per tick (would flood
        // with junk); it should only record the final committed line.
        let out = run_drain(b"tick1\rtick2\rfinal\n", "OUT", true);
        // Only "final" commits on `\n`.
        assert!(out.contains("[OUT] final"), "final line missing: {out:?}");
        assert!(
            !out.contains("[OUT] tick1"),
            "progress tick leaked to log: {out:?}"
        );
        assert!(
            !out.contains("[OUT] tick2"),
            "progress tick leaked to log: {out:?}"
        );
        assert_eq!(
            out.matches("[OUT]").count(),
            1,
            "expected exactly 1 labeled line (the committed final), got: {out:?}"
        );
    }

    #[test]
    fn drain_crlf_terminator_commits_line_normally() {
        // Windows tools emit `\r\n` as line terminator. `\r\n` MUST
        // commit the line — it's not a progress tick.
        let out = run_drain(b"winline-a\r\nwinline-b\r\n", "OUT", true);
        assert!(
            out.contains("[OUT] winline-a"),
            "first CRLF line missing: {out:?}"
        );
        assert!(
            out.contains("[OUT] winline-b"),
            "second CRLF line missing: {out:?}"
        );
        assert_eq!(out.matches("[OUT]").count(), 2);
    }

    // ── Integration: real child process through exec_tee_log ───────────
    //
    // Unit tests above feed `drain_stream` pre-baked byte slices. That
    // exercises the parser but not the composition of spawn + pipe +
    // drain + join + flush. The historical Windows 4 KB pipe-buffer
    // deadlock lived in that composition, not in the line parser, so
    // the unit tests alone don't prove it's fixed.
    //
    // This test spawns a real child (`cargo --version` — always present
    // in any `cargo test` environment) through the full `exec_tee_log`
    // call, then reads the produced log back and verifies format and
    // content.

    #[test]
    fn exec_tee_log_with_real_child_produces_labeled_log() {
        let ws = Workspace::discover().expect("workspace discovery failed");
        let seq = DRAIN_TEST_SEQ.fetch_add(1, Ordering::Relaxed);
        let log_path = std::env::temp_dir().join(format!(
            "xtask-exec-tee-test-{}-{}.log",
            std::process::id(),
            seq,
        ));

        let status = ws
            .exec_tee_log(ws.root(), "cargo", &["--version"], &log_path)
            .expect("exec_tee_log failed");
        assert!(status.success(), "cargo --version exited non-zero");

        let body = std::fs::read_to_string(&log_path).expect("reading log");
        let _ = std::fs::remove_file(&log_path);

        // Every line must wear the `[<ms>] [OUT|ERR] ` prefix.
        for line in body.lines() {
            assert!(
                line.starts_with('[') && (line.contains("] [OUT] ") || line.contains("] [ERR] ")),
                "log line missing expected prefix: {line:?}"
            );
        }
        // And the version banner itself must be in there.
        assert!(
            body.contains("cargo "),
            "log did not capture cargo version banner:\n{body}"
        );
    }
}
