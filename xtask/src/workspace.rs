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
            thread::spawn(move || drain_stream(stdout, log_out, "OUT", start, true));

        let log_err = Arc::clone(&log);
        let stderr_handle =
            thread::spawn(move || drain_stream(stderr, log_err, "ERR", start, false));

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

        if let Some(filename) = platform_override {
            let override_path = self
                .root
                .join("interfaces")
                .join("desktop")
                .join("src-tauri")
                .join(filename);
            if override_path.exists() {
                let override_raw = std::fs::read_to_string(&override_path).with_context(|| {
                    format!("reading platform override {}", override_path.display())
                })?;
                let override_value: serde_json::Value =
                    serde_json::from_str(&override_raw).with_context(|| {
                        format!("parsing platform override {}", override_path.display())
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
///   overrides use today; it lets DevForge remap from
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
///   base    : { "bundle": { "resources": [] } }
///   patch   : { "bundle": { "resources": ["binaries/llama.dll"] } }
///   merged  : { "bundle": { "resources": ["binaries/llama.dll"] } }
///
/// Shipped as a small local helper instead of a dependency — the single
/// call site is `tauri_config`, and we already have serde_json.
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
    use super::merge_rfc7396;
    use serde_json::json;

    #[test]
    fn array_replaces_wholesale() {
        let mut base = json!({ "bundle": { "resources": [] } });
        let patch = json!({ "bundle": { "resources": ["a.dll", "b.dll"] } });
        merge_rfc7396(&mut base, &patch);
        assert_eq!(base, json!({ "bundle": { "resources": ["a.dll", "b.dll"] } }));
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
}

#[cfg(test)]
mod resource_parse_tests {
    use super::{parse_resources, ResourceEntry};
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
        assert!(parse_resources(None).is_empty());
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

/// Drain a child pipe with two layered behaviors:
///
///   1. **Byte passthrough to terminal** — every byte read from the
///      pipe is written verbatim to the destination stream (stdout or
///      stderr) and flushed. This preserves cargo's `\r`-based progress
///      bar, rustc colors, and any other in-place terminal rewriting.
///      From the user's perspective, the terminal behaves as if we had
///      used `Stdio::inherit()`.
///
///   2. **Line-buffered log** — bytes are also accumulated into a line
///      buffer; on `\n` the buffer is committed to the log with the
///      `[<elapsed_ms>] [<label>] ` prefix. A `\r` resets the buffer
///      without committing, because `\r` means "next writes overwrite
///      this line" — logging every progress-bar tick would produce
///      tens of thousands of noise entries and drown real events.
///
/// Non-UTF8 bytes in the line buffer become U+FFFD via `from_utf8_lossy`
/// at commit time — dropped lines on Windows CP1252 output would hide
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
    /// commits the BufWriter's last partial buffer to disk.
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

/// real failures.
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
                commit_line(&log, label, start, &line_buf)?;
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
                        commit_line(&log, label, start, &line_buf)?;
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
                        commit_line(&log, label, start, &line_buf)?;
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
    /// CMake (for ort-sys source builds).
    #[serde(default)]
    pub cmake: Option<BuildDepEntry>,
    /// Ninja (for cmake-rs when CMAKE_GENERATOR = "Ninja"; harmless under
    /// the Visual Studio generator).
    #[serde(default)]
    pub ninja: Option<BuildDepEntry>,
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
            ("ninja", &self.deps.ninja),
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

        // ── Fast-build wiring resolved at runtime ──
        // rust-lld + sccache live outside the repo (per-machine toolchain and
        // per-machine cargo bin). Hardcoded paths in `.cargo/config.toml`
        // would break for every other dev box. cargo respects
        // `CARGO_TARGET_<TARGET>_LINKER` and `RUSTC_WRAPPER` env vars with
        // higher precedence than config-file settings, so injecting them
        // here keeps the repo config portable.
        self.apply_fast_build_env();
    }

    /// Detect installed acceleration SDKs and return the cargo `--features`
    /// string that activates the buildable subset. Returns `None` when no
    /// SDK is installed — caller builds with default features (pure CPU,
    /// no MKL, no GPU).
    ///
    /// Detection composes GPU + CPU features into one comma-joined list:
    ///   - CUDA Toolkit + NVIDIA GPU → `gpu-nvidia`
    ///   - else Vulkan SDK installed → `gpu-vulkan`
    ///   - Intel MKL (MKLROOT or default install) → `cpu-mkl` (additive)
    ///
    /// CUDA is preferred over Vulkan on NVIDIA (runs ~20-30% faster for
    /// llama.cpp). MKL composes with either GPU pick — GPU handles the
    /// heavy nets, MKL handles the remaining CPU BLAS/LAPACK.
    pub fn detect_build_features(&self) -> Option<String> {
        let mut features: Vec<&'static str> = Vec::new();

        let cuda_toolkit = std::env::var("CUDA_PATH")
            .ok()
            .filter(|p| std::path::Path::new(p).join("bin").join("nvcc.exe").is_file())
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
        let nvidia_gpu_present = which::which("nvidia-smi").is_ok();
        let cuda_active = cuda_toolkit.is_some() && nvidia_gpu_present;

        if cuda_active {
            features.push("gpu-nvidia");
        } else {
            let vulkan_sdk = std::env::var("VULKAN_SDK")
                .ok()
                .filter(|p| std::path::Path::new(p).is_dir())
                .or_else(|| {
                    let candidates = ["C:/VulkanSDK", "C:/Program Files/VulkanSDK"];
                    candidates
                        .iter()
                        .find(|c| std::path::Path::new(c).is_dir())
                        .map(|s| (*s).to_string())
                });
            if vulkan_sdk.is_some() {
                features.push("gpu-vulkan");
            }
        }

        let mkl_root = std::env::var("MKLROOT")
            .ok()
            .filter(|p| std::path::Path::new(p).is_dir())
            .or_else(|| {
                // Default Intel oneAPI install layout on Windows.
                let mkl_dir = std::path::Path::new("C:/Program Files (x86)/Intel/oneAPI/mkl");
                if !mkl_dir.is_dir() {
                    return None;
                }
                std::fs::read_dir(mkl_dir)
                    .ok()?
                    .filter_map(Result::ok)
                    .map(|e| e.path())
                    .filter(|p| p.is_dir())
                    .max()
                    .map(|p| p.to_string_lossy().to_string())
            });
        if mkl_root.is_some() {
            features.push("cpu-mkl");
        }

        if features.is_empty() {
            None
        } else {
            Some(features.join(","))
        }
    }

    /// Resolve rust-lld and sccache from per-machine locations and export
    /// them as cargo env vars. Idempotent; safe to call multiple times.
    fn apply_fast_build_env(&self) {
        // rust-lld ships in the `llvm-tools-preview` rustup component at
        // `{sysroot}/lib/rustlib/{target}/bin/rust-lld[.exe]`.
        match Command::new("rustc").args(["--print", "sysroot"]).output() {
            Ok(out) if out.status.success() => {
                let sysroot = String::from_utf8_lossy(&out.stdout).trim().to_string();
                let lld_name = if cfg!(windows) { "rust-lld.exe" } else { "rust-lld" };
                let rust_lld = Path::new(&sysroot)
                    .join("lib")
                    .join("rustlib")
                    .join(&self.toolchain.target)
                    .join("bin")
                    .join(lld_name);
                if rust_lld.is_file() {
                    let env_key = format!(
                        "CARGO_TARGET_{}_LINKER",
                        self.toolchain.target.replace('-', "_").to_uppercase()
                    );
                    std::env::set_var(&env_key, &rust_lld);
                    println!(
                        "  [env] {} = {} (rust-lld fast linker)",
                        env_key,
                        rust_lld.display()
                    );
                } else {
                    println!(
                        "  [warn] rust-lld missing at {} — run `rustup component add llvm-tools-preview`",
                        rust_lld.display()
                    );
                }
            }
            _ => println!("  [warn] `rustc --print sysroot` failed; rust-lld not wired"),
        }

        // sccache — compile cache that survives `cargo clean` and branch
        // switches. Bootstrap with `cargo install sccache --locked` once;
        // afterwards it lives at `~/.cargo/bin/sccache(.exe)` which is on
        // every rustup user's PATH.
        match which::which("sccache") {
            Ok(path) => {
                std::env::set_var("RUSTC_WRAPPER", &path);
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
        match self.detect_build_features() {
            Some(feats) => println!("  [accel] auto-detected features = {feats}"),
            None => println!(
                "  [accel] no SDK detected — bare CPU build. \
                 Install Vulkan SDK (cross-vendor GPU), CUDA Toolkit 12.x \
                 (NVIDIA peak), and/or Intel oneAPI MKL (CPU BLAS) to enable."
            ),
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

#[cfg(test)]
mod tests {
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

        drain_stream(input, Arc::clone(&log), label, start, stdout).unwrap();

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
