//! sccache integration for the backend compile stage.
//!
//! Transparent compile caching via Mozilla's sccache. When sccache is
//! installed on the developer's machine, this module points it at a
//! workspace-local cache directory (`.userdata/sccache/`) and sets
//! `RUSTC_WRAPPER=sccache` so every subsequent `rustc` invocation is
//! content-addressed.
//!
//! ## What this buys
//!
//! - `cargo clean` stops costing 5 minutes. Clean wipes `target/`, but
//!   sccache repopulates it from its own cache on the next build.
//! - Feature-flag flips don't rebuild libsql/duckdb/surrealdb/rro from
//!   scratch as long as that feature set has been compiled before.
//! - Toolchain bumps naturally miss once, then hit.
//!
//! ## What this deliberately does NOT do
//!
//! - No auto-install. If sccache isn't on PATH, we emit a one-time hint
//!   and move on. Installing binaries behind the developer's back is a
//!   risky action we do not take autonomously.
//! - No config flag. sccache is opt-in by virtue of being installed.
//!   No `platform.default.toml` knob to maintain.
//! - No shared remote cache (S3/R2). Local disk only for now. Remote
//!   cache is a five-line follow-up if/when the team wants CI and devs
//!   to share hits.
//!
//! ## Stats
//!
//! [`Guard::new`] captures pre-build cache stats. [`Guard::report`]
//! diffs them against post-build stats and prints the delta, so the
//! dev-server UX shows "+17 hits, +3 misses this compile" and the
//! value of the cache is visible rather than mysterious.

use crate::stage::Stage;
use crate::workspace::Workspace;
use anyhow::Result;
use std::path::PathBuf;

/// Active sccache session spanning the backend compile stage.
///
/// Held by `dev.rs` across the `cargo check` invocation so that
/// `report()` can diff stats after compilation finishes. When sccache
/// is not installed the guard is still created (in [`Mode::Disabled`])
/// so the caller doesn't need to branch.
pub struct Guard {
    mode: Mode,
}

enum Mode {
    /// sccache resolved and environment wired.
    Active {
        /// Absolute path to the sccache binary for post-compile stats.
        binary: PathBuf,
        /// Stats snapshot taken before the compile started.
        pre_stats: Option<Stats>,
    },
    /// sccache not installed — no-op, just so callers don't branch.
    Disabled,
}

/// Parsed subset of `sccache --show-stats` that we care about.
///
/// sccache's stats output is a human-formatted table; we scrape two
/// lines ("Compile requests executed" and "Cache hits"). If scraping
/// fails we simply don't show a delta — never panic, never error.
#[derive(Default, Clone, Copy)]
struct Stats {
    requests: u64,
    hits: u64,
}

impl Guard {
    /// Detect sccache, configure environment, and snapshot pre-build stats.
    ///
    /// Emits its own [`Stage`] so the dev pipeline shows a line for this
    /// step either way — "enabled" or "not installed — install hint".
    pub fn new(ws: &Workspace) -> Result<Self> {
        let s = Stage::start("sccache");

        let binary = match ws.resolve("sccache") {
            Ok(path) => path,
            Err(_) => {
                s.skip("not installed — `cargo install sccache` to enable compile caching");
                return Ok(Self {
                    mode: Mode::Disabled,
                });
            }
        };

        // Workspace-local cache dir. Lives next to the other .userdata
        // build state so one `.userdata/` wipe resets everything together.
        let cache_dir = ws.root().join(".userdata").join("sccache");
        if let Err(e) = std::fs::create_dir_all(&cache_dir) {
            // Non-fatal: fall back to sccache's default location (~/.cache/sccache)
            // rather than failing the dev pipeline over a cache dir.
            s.warn(format!(
                "failed to create {}: {e} — falling back to sccache default dir",
                cache_dir.display()
            ));
            std::env::set_var("RUSTC_WRAPPER", &binary);
            let pre_stats = read_stats(&binary);
            return Ok(Self {
                mode: Mode::Active { binary, pre_stats },
            });
        }

        // Point sccache at the workspace cache. SCCACHE_DIR takes effect
        // for the local-disk backend, which is the default. If the dev
        // has SCCACHE_BUCKET or similar set in their shell, we respect
        // it — don't clobber remote backends.
        if std::env::var_os("SCCACHE_BUCKET").is_none()
            && std::env::var_os("SCCACHE_REDIS").is_none()
            && std::env::var_os("SCCACHE_AZURE_CONNECTION_STRING").is_none()
            && std::env::var_os("SCCACHE_GCS_BUCKET").is_none()
        {
            std::env::set_var("SCCACHE_DIR", &cache_dir);
        }

        // The load-bearing line: make cargo route every rustc call
        // through sccache. This is inherited by every child process
        // we spawn from here on (cargo check, tauri dev, etc).
        std::env::set_var("RUSTC_WRAPPER", &binary);

        // Snapshot stats BEFORE moving `binary` into the Mode::Active
        // variant below — `read_stats` borrows the path.
        let pre_stats = read_stats(&binary);

        s.ok_with(format!("enabled → {}", cache_dir.display()));

        Ok(Self {
            mode: Mode::Active { binary, pre_stats },
        })
    }

    /// Print a one-line delta summary of cache activity during the compile.
    ///
    /// Called by `dev.rs` after `cargo check` returns successfully.
    /// No-op when sccache is disabled or pre-stats failed to parse.
    pub fn report(&self) {
        let Mode::Active { binary, pre_stats } = &self.mode else {
            return;
        };
        let Some(pre) = pre_stats else {
            return;
        };
        let Some(post) = read_stats(binary) else {
            return;
        };

        let req_delta = post.requests.saturating_sub(pre.requests);
        let hit_delta = post.hits.saturating_sub(pre.hits);
        let miss_delta = req_delta.saturating_sub(hit_delta);

        if req_delta == 0 {
            // Cargo did zero compilation — already incremental-cached.
            // Don't clutter the UI.
            return;
        }

        let pct = if req_delta > 0 {
            (hit_delta as f64 / req_delta as f64) * 100.0
        } else {
            0.0
        };

        println!(
            "  > sccache: {hit_delta} hits, {miss_delta} misses ({pct:.0}% hit rate this compile)"
        );
    }

    /// Whether this process currently has sccache wired as the rustc wrapper.
    #[must_use]
    pub fn is_active(&self) -> bool {
        matches!(self.mode, Mode::Active { .. })
    }

    /// Disable compile-cache env for the current process before a retry.
    ///
    /// If the sccache daemon drops the transport mid-compile, cargo exits as if
    /// rustc itself failed. Clearing the wrapper and stopping the server lets the
    /// same cargo command be retried immediately without the cache layer.
    pub fn disable_for_retry(&self) {
        if let Mode::Active { binary, .. } = &self.mode {
            let _ = std::process::Command::new(binary)
                .arg("--stop-server")
                .output();
        }

        std::env::remove_var("RUSTC_WRAPPER");
        std::env::remove_var("SCCACHE_DIR");
    }
}

/// Run `sccache --show-stats` and scrape the two lines we care about.
///
/// Returns `None` on any failure — this is informational output, never
/// load-bearing, so failure must never propagate.
fn read_stats(binary: &std::path::Path) -> Option<Stats> {
    let output = std::process::Command::new(binary)
        .arg("--show-stats")
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let text = String::from_utf8_lossy(&output.stdout);

    let mut stats = Stats::default();
    for line in text.lines() {
        let line = line.trim();
        // sccache stats format (stable across versions we care about):
        //   "Compile requests                  42"
        //   "Compile requests executed         40"
        //   "Cache hits                        37"
        if let Some(rest) = line.strip_prefix("Compile requests executed") {
            stats.requests = parse_trailing_u64(rest).unwrap_or(0);
        } else if let Some(rest) = line.strip_prefix("Cache hits") {
            // "Cache hits" appears on multiple lines (Rust/C/etc). Take
            // the first one, which is the aggregate total.
            if stats.hits == 0 {
                stats.hits = parse_trailing_u64(rest).unwrap_or(0);
            }
        }
    }
    Some(stats)
}

/// Parse the trailing integer from a stats line like `"        42"`.
fn parse_trailing_u64(s: &str) -> Option<u64> {
    s.split_whitespace().next()?.parse().ok()
}
