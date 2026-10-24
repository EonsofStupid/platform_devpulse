//! Post-build smoke test — launch the compiled exe and confirm it
//! actually boots past the platform Services stage.
//!
//! # What "passing" means
//!
//! A pass means the engine's own boot log
//! (`{data_dir}/logs/boot.log`) contains the
//! `[READY] All critical services confirmed — UI may render` line
//! within [`SMOKE_TIMEOUT`]. That marker is emitted by
//! `BootLog::ready` after every critical service has reported `[  OK ]`.
//! A line starting with `[FAIL!]` short-circuits the wait with an
//! Unhealthy verdict carrying the failed stage as the snippet.
//!
//! # Why not the `SurrealDB` sidecar :8822/health
//!
//! The previous revision of this file probed `http://127.0.0.1:8822/health`
//! and verified a `surreal-version:` response header. That contract was
//! tied to the `SurrealDB` SIDECAR architecture. The platform has since
//! moved to **embedded** `SurrealKV` (`kv-surrealkv` in-process, no HTTP,
//! no port — see `project_surreal_purpose`), so :8822 intentionally no
//! longer answers. Polling it produces a guaranteed timeout, masking
//! a perfectly healthy boot. Reading the boot log follows the engine's
//! current contract directly.
//!
//! # Why the boot log file (not stderr or a Tauri-served endpoint)
//!
//! - The engine **always** writes the boot log, regardless of build
//!   profile, GPU backend, or feature flags — it's the lowest-common
//!   denominator signal.
//! - File is truncated on every boot (`BootLog::open` uses
//!   `fs::File::create`), so we don't read stale state from a prior run.
//! - Tauri's IPC and webview are NOT contractually "up" at READY —
//!   READY is engine-side, the window may still be mounting. The
//!   previous comment in this file explicitly noted "Tauri window
//!   mounted is not asserted by this probe"; we preserve that scope.
//! - stderr is consumed by the spawned child's null stdio; rewiring
//!   pipes would conflict with the `kill_on_drop` lifecycle and break
//!   the kill-and-wait guarantee.
//!
//! # Boot log location
//!
//! Resolved from the Tauri app identifier `com.devpulse.desktop`:
//! - Windows: `%APPDATA%\com.devpulse.desktop\logs\boot.log`
//! - macOS:   `~/Library/Application Support/com.devpulse.desktop/logs/boot.log`
//! - Linux:   `$XDG_DATA_HOME/com.devpulse.desktop/logs/boot.log`
//!   (or `~/.local/share/com.devpulse.desktop/logs/boot.log`)
//!
//! The portable build also uses these paths because the bundled exe
//! resolves `data_dir` via the same Tauri convention as a normal install.
//!
//! # Why not `--smoke-test-mode` in the app
//!
//! Intentionally tests the REAL boot path. A dedicated mode would
//! bypass exactly the slot that broke last time (e.g. the IPC bindings
//! loading in the renderer).

use anyhow::Result;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::thread;
use std::time::{Duration, Instant, SystemTime};

/// Maximum time to wait for the app to boot before giving up.
/// Cold first-run on a fresh install can take ~60s depending on disk
/// and `DuckDB` initialization. 90s leaves head-room for slow CI hosts
/// and HDD-backed dev boxes.
const SMOKE_TIMEOUT: Duration = Duration::from_secs(90);
/// Gap between boot-log polls. 250 ms keeps the verdict latency low
/// without burning CPU — file read is microseconds, but spinning
/// faster yields no real win.
const PROBE_INTERVAL: Duration = Duration::from_millis(250);
/// Tauri app identifier — drives the `data_dir` resolution. Must match
/// `interfaces/desktop/src-tauri/tauri.conf.json::identifier`. If the
/// identifier ever changes, this constant moves with it.
const APP_IDENTIFIER: &str = "com.devpulse.desktop";

/// READY marker emitted by `BootLog::ready` once every critical service
/// reports OK. Substring match; the full line carries timing
/// (`(NNms total)`) we don't need to parse.
const READY_MARKER: &str = "[READY] All critical services confirmed";

/// FAIL marker emitted by `BootLog::fail` for any failed stage. We use
/// `contains` so it matches whether or not surrounding whitespace
/// changes.
const FAIL_MARKER: &str = "[FAIL!]";

/// Outcome of a smoke run. `Healthy` is the only pass.
#[derive(Debug)]
pub enum SmokeResult {
    Healthy {
        elapsed: Duration,
        /// What we observed — typically the READY line with timing.
        /// Goes into the build-event `detail` so logs show the real
        /// signal.
        signal: String,
    },
    Unhealthy {
        elapsed: Duration,
        /// The `[FAIL!]` line that short-circuited the wait. Carries
        /// the failed stage + reason in the engine's own words.
        response_snippet: String,
    },
    Timeout {
        elapsed: Duration,
        last_error: String,
    },
}

impl SmokeResult {
    /// True when the run passed — used by callers to decide whether to
    /// quarantine artifacts or keep them.
    pub const fn is_healthy(&self) -> bool {
        matches!(self, Self::Healthy { .. })
    }

    /// Short one-line summary for logs + stage event `detail`.
    pub fn summary(&self) -> String {
        match self {
            Self::Healthy { elapsed, signal } => {
                format!("healthy in {:.1}s: {}", elapsed.as_secs_f64(), signal)
            }
            Self::Unhealthy {
                elapsed,
                response_snippet,
            } => format!(
                "unhealthy after {:.1}s: {}",
                elapsed.as_secs_f64(),
                truncate(response_snippet, 200)
            ),
            Self::Timeout {
                elapsed,
                last_error,
            } => format!(
                "timeout after {:.1}s (last error: {})",
                elapsed.as_secs_f64(),
                truncate(last_error, 160)
            ),
        }
    }
}

/// Launch `exe`, poll the boot log for `[READY]`, kill the child,
/// return the verdict.
///
/// The child is spawned with null stdio so it does not pollute the
/// xtask transcript. Killing uses `Child::kill()` on the direct child.
/// For deeper teardown (subprocesses that broke away), rely on the
/// `JobGuard` the caller holds in `build_release.rs`.
pub fn run_smoke(exe: &Path) -> Result<SmokeResult> {
    if !exe.exists() {
        anyhow::bail!("smoke target does not exist: {}", exe.display());
    }

    let log_path = boot_log_path()
        .ok_or_else(|| anyhow::anyhow!("could not resolve data_dir for {APP_IDENTIFIER}"))?;

    // Snapshot the pre-spawn state so we only count READY/FAIL lines
    // from the NEW boot. The engine truncates boot.log on every run
    // (`BootLog::open` uses `fs::File::create`), so seeing the file's
    // mtime change confirms the new run is writing.
    let pre_mtime = log_path.metadata().and_then(|m| m.modified()).ok();

    let start = Instant::now();
    let mut child = spawn_detached(exe)
        .map_err(|e| anyhow::anyhow!("failed to spawn smoke target {}: {e}", exe.display()))?;

    let result = poll_until_ready(&mut child, &log_path, pre_mtime, start);

    // Always attempt to stop the child, even if polling returned an error —
    // leaving a rogue copy running would hold file handles and block the
    // next build.
    let _ = child.kill();
    let _ = child.wait();

    result
}

fn spawn_detached(exe: &Path) -> Result<Child> {
    // CWD = exe dir so the launched binary resolves relative paths
    // (`.userdata/`, `models/`, `binaries/`) the same way a user would.
    let cwd: PathBuf = exe.parent().map(Path::to_path_buf).unwrap_or_default();
    let child = Command::new(exe)
        .current_dir(&cwd)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()?;
    Ok(child)
}

fn poll_until_ready(
    child: &mut Child,
    log_path: &Path,
    pre_mtime: Option<SystemTime>,
    start: Instant,
) -> Result<SmokeResult> {
    let mut last_error = String::from("boot log never written");

    while start.elapsed() < SMOKE_TIMEOUT {
        // If the child died before answering, no point polling any longer.
        if let Ok(Some(status)) = child.try_wait() {
            anyhow::bail!(
                "smoke target exited before boot log reported READY (status={})",
                status
                    .code()
                    .map_or_else(|| "signal".to_string(), |c| c.to_string())
            );
        }

        match read_boot_log(log_path, pre_mtime) {
            BootLogState::Stale => {
                last_error = format!("boot log unchanged at {}", log_path.display());
            }
            BootLogState::InFlight { last_line } => {
                last_error = format!("boot in flight, last line: {last_line}");
            }
            BootLogState::Failed { line } => {
                return Ok(SmokeResult::Unhealthy {
                    elapsed: start.elapsed(),
                    response_snippet: line,
                });
            }
            BootLogState::Ready { line } => {
                return Ok(SmokeResult::Healthy {
                    elapsed: start.elapsed(),
                    signal: line,
                });
            }
        }

        thread::sleep(PROBE_INTERVAL);
    }

    Ok(SmokeResult::Timeout {
        elapsed: start.elapsed(),
        last_error,
    })
}

/// What the boot log told us this poll.
#[derive(Debug)]
enum BootLogState {
    /// File doesn't exist or mtime matches the pre-spawn snapshot — the
    /// new run hasn't started writing yet.
    Stale,
    /// File is being written but no READY or FAIL line yet. Carries the
    /// most recent non-blank line for diagnostic continuity.
    InFlight { last_line: String },
    /// A `[FAIL!]` line was found.
    Failed { line: String },
    /// A `[READY]` line was found.
    Ready { line: String },
}

fn read_boot_log(log_path: &Path, pre_mtime: Option<SystemTime>) -> BootLogState {
    let Ok(meta) = log_path.metadata() else {
        return BootLogState::Stale;
    };
    let Ok(cur_mtime) = meta.modified() else {
        return BootLogState::Stale;
    };
    if let Some(pre) = pre_mtime {
        if cur_mtime <= pre {
            // File hasn't been touched since spawn; the new run hasn't
            // reached the BootLog::open call yet (or it's the same file
            // with same mtime — unlikely given mtime granularity).
            return BootLogState::Stale;
        }
    }

    let Ok(content) = std::fs::read_to_string(log_path) else {
        return BootLogState::Stale;
    };

    // READY wins ties — engine writes READY only after all OK lines, so
    // if both appear (shouldn't happen but be robust) the READY is the
    // final word.
    let mut last_line = String::new();
    let mut failed_line: Option<String> = None;
    for raw in content.lines() {
        let line = raw.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        last_line = line.to_string();
        if line.contains(READY_MARKER) {
            return BootLogState::Ready {
                line: line.to_string(),
            };
        }
        if line.contains(FAIL_MARKER) {
            failed_line = Some(line.to_string());
        }
    }

    if let Some(line) = failed_line {
        return BootLogState::Failed { line };
    }

    if last_line.is_empty() {
        BootLogState::Stale
    } else {
        BootLogState::InFlight { last_line }
    }
}

/// Resolve `{data_dir}/logs/boot.log` for the bundled app.
///
/// Mirrors what Tauri's `app_data_dir()` and `BootLog::open()` produce
/// on the running app. We compute it from env vars instead of pulling
/// `tauri` or `dirs` into xtask — those crates would balloon the build.
fn boot_log_path() -> Option<PathBuf> {
    let data_dir = app_data_dir()?;
    Some(data_dir.join("logs").join("boot.log"))
}

#[cfg(target_os = "windows")]
fn app_data_dir() -> Option<PathBuf> {
    let appdata = std::env::var_os("APPDATA")?;
    Some(PathBuf::from(appdata).join(APP_IDENTIFIER))
}

#[cfg(target_os = "macos")]
fn app_data_dir() -> Option<PathBuf> {
    let home = std::env::var_os("HOME")?;
    Some(
        PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join(APP_IDENTIFIER),
    )
}

#[cfg(all(unix, not(target_os = "macos")))]
fn app_data_dir() -> Option<PathBuf> {
    if let Some(xdg) = std::env::var_os("XDG_DATA_HOME") {
        return Some(PathBuf::from(xdg).join(APP_IDENTIFIER));
    }
    let home = std::env::var_os("HOME")?;
    Some(
        PathBuf::from(home)
            .join(".local")
            .join("share")
            .join(APP_IDENTIFIER),
    )
}

fn truncate(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        return s.to_string();
    }
    let mut out: String = s.chars().take(max).collect();
    out.push('…');
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn truncate_short_returns_input() {
        assert_eq!(truncate("hello", 10), "hello");
    }

    #[test]
    fn truncate_long_appends_ellipsis() {
        let out = truncate("abcdefghij", 4);
        assert_eq!(out, "abcd…");
    }

    #[test]
    fn summary_healthy_formats_elapsed_and_signal() {
        let r = SmokeResult::Healthy {
            elapsed: Duration::from_millis(1500),
            signal: "[READY] All critical services confirmed — UI may render (1500ms total)"
                .to_string(),
        };
        let s = r.summary();
        assert!(s.contains("healthy in"));
        assert!(s.contains("[READY]"));
        assert!(r.is_healthy());
    }

    #[test]
    fn summary_timeout_is_not_healthy() {
        let r = SmokeResult::Timeout {
            elapsed: Duration::from_secs(90),
            last_error: "boot log unchanged".to_string(),
        };
        assert!(!r.is_healthy());
        assert!(r.summary().contains("timeout"));
    }

    #[test]
    fn summary_unhealthy_is_not_healthy() {
        let r = SmokeResult::Unhealthy {
            elapsed: Duration::from_secs(10),
            response_snippet: "[FAIL!] graph_store: cannot open kv".to_string(),
        };
        assert!(!r.is_healthy());
        assert!(r.summary().contains("unhealthy"));
    }

    fn write_log(content: &str) -> (tempfile::TempDir, PathBuf) {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("boot.log");
        std::fs::write(&path, content).unwrap();
        (dir, path)
    }

    #[test]
    fn ready_line_returns_ready_state() {
        let log = "\
# DevPulse Boot Log
[+000.000s] [START] DevPulse Boot
[+000.082s] [  OK ] preflight: directories ready
[+010.628s] [READY] All critical services confirmed — UI may render (10628ms total)
";
        let (_dir, path) = write_log(log);
        match read_boot_log(&path, None) {
            BootLogState::Ready { line } => {
                assert!(line.contains("[READY]"));
                assert!(line.contains("10628ms"));
            }
            other => panic!("expected Ready, got {other:?}"),
        }
    }

    #[test]
    fn fail_line_returns_failed_state() {
        let log = "\
# DevPulse Boot Log
[+000.000s] [START] DevPulse Boot
[+002.341s] [FAIL!] graph_store: SurrealKV open denied (EACCES)
";
        let (_dir, path) = write_log(log);
        match read_boot_log(&path, None) {
            BootLogState::Failed { line } => {
                assert!(line.contains("[FAIL!]"));
                assert!(line.contains("graph_store"));
            }
            other => panic!("expected Failed, got {other:?}"),
        }
    }

    #[test]
    fn ready_wins_over_fail_when_both_present() {
        // Defensive: in practice the engine never emits both, but if it
        // ever did, READY is the final word and should win.
        let log = "\
[+001.000s] [FAIL!] something flaked
[+002.000s] [READY] All critical services confirmed — UI may render (2000ms total)
";
        let (_dir, path) = write_log(log);
        assert!(matches!(
            read_boot_log(&path, None),
            BootLogState::Ready { .. }
        ));
    }

    #[test]
    fn in_flight_returns_last_line() {
        let log = "\
[+000.082s] [  OK ] preflight: directories ready
[+000.090s] [  OK ] System relational: Turso platform.db
";
        let (_dir, path) = write_log(log);
        match read_boot_log(&path, None) {
            BootLogState::InFlight { last_line } => {
                assert!(last_line.contains("System relational"));
            }
            other => panic!("expected InFlight, got {other:?}"),
        }
    }

    #[test]
    fn missing_log_returns_stale() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("never-written.log");
        assert!(matches!(read_boot_log(&path, None), BootLogState::Stale));
    }

    #[test]
    fn comments_and_blanks_are_skipped() {
        let log = "\
# header line
# another
\t
[+000.082s] [  OK ] preflight
";
        let (_dir, path) = write_log(log);
        match read_boot_log(&path, None) {
            BootLogState::InFlight { last_line } => {
                assert!(last_line.contains("preflight"));
            }
            other => panic!("expected InFlight, got {other:?}"),
        }
    }
}
