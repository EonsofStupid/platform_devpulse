//! Stdout / stderr policy for xtask.
//!
//! Why this module exists:
//!
//! Previously every command inside xtask made its own call on whether
//! progress lines went to `stdout` (`println!`) or `stderr` (`eprintln!`).
//! The distribution drifted — some `[OK]` success markers were on stderr,
//! banners on stderr, warnings on stdout — and there was no way for CI
//! to quiet the tool down.
//!
//! This module centralizes that policy. The routing rule is blunt:
//!
//!   * `info`  → stdout — progress, results, artifacts. The tool's OUTPUT.
//!   * `warn`  → stderr — non-fatal issues the human should notice.
//!
//! Hard failures are returned as `Err(anyhow!(...))` from task `run`
//! methods and rendered by the runtime; there is no side-channel
//! error helper because none is needed today.
//!
//! Verbosity is a process-global atomic set once in `main`:
//!
//!   * `--quiet`   — suppress `info`; `warn` still shown on stderr.
//!   * (default)   — `info` + `warn` shown.
//!   * `--verbose` — reserved for future `debug` level; currently a no-op.
//!
//! # File sink (optional tee)
//!
//! [`set_file_sink`] attaches a process-global file that every subsequent
//! `info!` and `warn!` line is also written to. This was added after a
//! portable-build regression where the only durable build transcript
//! (`target/xtask-build-release.log`) captured subprocess output only —
//! xtask's own per-resource copy lines went to terminal and were lost.
//! Long-running commands like `build-release` set the sink at the top of
//! `run` so the resulting `target/xtask-run.log` holds a complete,
//! ctrl-C-safe record of the tool's own narration.
//!
//! # Why not `tracing`?
//!
//! xtask is a short-lived dev CLI whose stdout *is* its API — the same
//! transcript is read by humans in a terminal and by CI. Structured
//! telemetry lives in `systems/infra/devpulse-telemetry`, not here.
//! A tracing dep would add timestamps + spans + targets that make
//! a 40-minute build log harder to scan, not easier.

use std::fmt;
use std::fs::{File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU8, Ordering};
use std::sync::Mutex;

/// Atomic verbosity level — set once from CLI flags in `main`.
/// Numeric ordering matches visibility: higher level → more output.
const QUIET: u8 = 0;
const NORMAL: u8 = 1;
const VERBOSE: u8 = 2;

static LEVEL: AtomicU8 = AtomicU8::new(NORMAL);

/// Optional per-process file sink. Every `info!` / `warn!` line is also
/// written here when set. `None` by default — short commands like
/// `preflight` print to terminal only. Long-running commands (`build-release`,
/// `run-dev`) attach a sink so the transcript survives after the terminal
/// closes.
///
/// Stored behind a `Mutex<Option<_>>` rather than a `OnceLock` because
/// some callers may want to swap the sink (e.g. a future multi-stage
/// command that rotates logs per phase). The mutex is on the cold path —
/// a locked write per log line is cheaper than the stdout flush already
/// happening.
static FILE_SINK: Mutex<Option<File>> = Mutex::new(None);

/// Remember the attached sink's path so [`file_sink_path`] can report it
/// back to callers that want to print "transcript at X" banners without
/// threading the path through their own state.
static FILE_SINK_PATH: Mutex<Option<PathBuf>> = Mutex::new(None);

/// Initialize the global verbosity from CLI flags. Both flags being
/// passed is not an error — `--quiet` wins because the caller explicitly
/// asked for silence.
pub fn set_level_from_flags(quiet: bool, verbose: bool) {
    let level = match (quiet, verbose) {
        (true, _) => QUIET,
        (_, true) => VERBOSE,
        _ => NORMAL,
    };
    LEVEL.store(level, Ordering::Relaxed);
}

/// Attach a file sink that mirrors every subsequent `info!` / `warn!`
/// line. Caller chooses the path — typically `target/xtask-run.log`.
///
/// The file is **truncated on attach**: callers expect `target/xtask-run.log`
/// to hold the current run, not a century of history. If durable history
/// is needed, the caller should rotate the file themselves before calling
/// this.
///
/// # Errors
/// Returns `io::Error` if the parent directory cannot be created or the
/// file cannot be opened. Callers typically log-and-continue — a missing
/// transcript is annoying but does not justify failing the build.
pub fn set_file_sink(path: &Path) -> io::Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(path)?;
    *FILE_SINK
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner) = Some(file);
    *FILE_SINK_PATH
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner) = Some(path.to_path_buf());
    Ok(())
}

/// Flush and drop the current file sink. Safe to call even when no sink
/// is attached — subsequent `info!` / `warn!` calls revert to
/// stdout/stderr only.
pub fn close_file_sink() {
    if let Some(mut f) = FILE_SINK
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
        .take()
    {
        let _ = f.flush();
    }
    *FILE_SINK_PATH
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner) = None;
}

/// Return the path of the currently attached file sink, if any.
/// Reserved for callers that want to reference the transcript in error
/// messages without threading the path through their own state — notably
/// the portable-build coverage assertion in `package_portable.rs`.
pub fn file_sink_path() -> Option<PathBuf> {
    FILE_SINK_PATH
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
        .clone()
}

fn level() -> u8 {
    LEVEL.load(Ordering::Relaxed)
}

/// Write a line to the file sink if one is attached. Errors are
/// deliberately swallowed — a disk full or a read-only FS should not
/// take down the build.
fn tee_to_file(line: &str) {
    if let Some(file) = FILE_SINK
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
        .as_mut()
    {
        let _ = file.write_all(line.as_bytes());
    }
}

/// Informational progress line — stdout, suppressed under `--quiet`.
///
/// The file sink (if attached) ALWAYS receives the line, even under
/// `--quiet`. Suppressing progress in CI still produces a complete
/// durable record. This matches how real release pipelines treat their
/// transcript: terminal silence, file truth.
pub fn info(args: fmt::Arguments<'_>) {
    let line = format!("{args}\n");
    if level() >= NORMAL {
        let mut out = io::stdout().lock();
        let _ = out.write_all(line.as_bytes());
    }
    tee_to_file(&line);
}

/// Non-fatal warning — stderr, always shown. Mirrored to the file sink
/// if one is attached.
pub fn warn(args: fmt::Arguments<'_>) {
    let line = format!("{args}\n");
    let mut err = io::stderr().lock();
    let _ = err.write_all(line.as_bytes());
    tee_to_file(&line);
}

// ── Macros ─────────────────────────────────────────────────────────────
//
// Thin wrappers so callers can write `info!("..."),` with the same
// ergonomics as `println!`. Kept at module scope (not `#[macro_export]`
// to the crate root) so the naming stays namespaced — collisions with
// `log::info!` or any future macro in that shape are impossible because
// callers must say `out::info!(...)`.

/// Emit an `info` line. See [`info`].
#[macro_export]
macro_rules! xinfo {
    ($($arg:tt)*) => { $crate::out::info(format_args!($($arg)*)) };
}

/// Emit a `warn` line. See [`warn`].
#[macro_export]
macro_rules! xwarn {
    ($($arg:tt)*) => { $crate::out::warn(format_args!($($arg)*)) };
}

#[cfg(test)]
mod tests {
    use super::*;

    // Tests cover the level-selection logic only — capturing stdout/stderr
    // in a cross-platform way would need a global redirect, which conflicts
    // with parallel test execution. The output functions themselves are
    // trivial once level is right.

    #[test]
    fn quiet_beats_verbose_when_both_set() {
        // Snapshot/restore so other tests aren't affected.
        let prev = LEVEL.load(Ordering::Relaxed);
        set_level_from_flags(true, true);
        assert_eq!(level(), QUIET);
        LEVEL.store(prev, Ordering::Relaxed);
    }

    #[test]
    fn verbose_sets_verbose_level() {
        let prev = LEVEL.load(Ordering::Relaxed);
        set_level_from_flags(false, true);
        assert_eq!(level(), VERBOSE);
        LEVEL.store(prev, Ordering::Relaxed);
    }

    #[test]
    fn default_is_normal() {
        let prev = LEVEL.load(Ordering::Relaxed);
        set_level_from_flags(false, false);
        assert_eq!(level(), NORMAL);
        LEVEL.store(prev, Ordering::Relaxed);
    }
}
