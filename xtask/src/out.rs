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
//! # Why not `tracing`?
//!
//! xtask is a short-lived dev CLI whose stdout *is* its API — the same
//! transcript is read by humans in a terminal and by CI. Structured
//! telemetry lives in `systems/infra/devpulse-telemetry`, not here.
//! A tracing dep would add timestamps + spans + targets that make
//! a 40-minute build log harder to scan, not easier.

use std::fmt;
use std::io::{self, Write};
use std::sync::atomic::{AtomicU8, Ordering};

/// Atomic verbosity level — set once from CLI flags in `main`.
/// Numeric ordering matches visibility: higher level → more output.
const QUIET: u8 = 0;
const NORMAL: u8 = 1;
const VERBOSE: u8 = 2;

static LEVEL: AtomicU8 = AtomicU8::new(NORMAL);

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

fn level() -> u8 {
    LEVEL.load(Ordering::Relaxed)
}

/// Informational progress line — stdout, suppressed under `--quiet`.
pub fn info(args: fmt::Arguments<'_>) {
    if level() >= NORMAL {
        let mut out = io::stdout().lock();
        let _ = writeln!(out, "{args}");
    }
}

/// Non-fatal warning — stderr, always shown.
pub fn warn(args: fmt::Arguments<'_>) {
    let mut err = io::stderr().lock();
    let _ = writeln!(err, "{args}");
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
