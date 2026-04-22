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
//! ## Architectural rule: sccache server is INFRASTRUCTURE, not a build child
//!
//! The sccache daemon is a long-running service whose value proposition
//! is surviving across xtask invocations. If xtask's Job Object owned
//! its lifetime, the server would die every time xtask exits, the cache
//! would be cold on every build, and the server would be vulnerable to
//! being killed mid-compile when another process in the job crashed.
//!
//! Therefore: **the sccache server is started OUTSIDE xtask's Job Object.**
//!
//! On Windows this is done by spawning `sccache --start-server` with
//! `CREATE_BREAKAWAY_FROM_JOB`, which escapes the job set up in
//! [`crate::zombie::JobGuard`] (whose `JOB_OBJECT_LIMIT_BREAKAWAY_OK`
//! flag authorises this escape). On Unix, `sccache --start-server`
//! daemonizes itself by default — no explicit breakaway needed.
//!
//! After start, we health-check via `sccache --show-stats`. If the
//! server is reachable, we wire `RUSTC_WRAPPER`. If it is not — for any
//! reason: not installed, crashed, permissions, network — we emit a
//! LOUD warning and proceed in [`Mode::Disabled`]. The build continues
//! with no cache rather than with a broken cache.
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
//! - No "disable mid-compile and retry" logic. The old code treated the
//!   server as a build child and layered retry-on-transport-failure
//!   scaffolding on top of a broken foundation. With the server now
//!   infrastructure, the scaffold is gone.
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
use std::process::Command;
use std::time::Duration;

/// Active sccache session spanning the backend compile stage.
///
/// Held by `dev.rs` / `build_release.rs` across the `cargo check` /
/// `tauri build` invocation so that `report()` can diff stats after
/// compilation finishes. When sccache is not installed OR the server
/// fails health-check the guard is still created (in [`Mode::Disabled`])
/// so the caller doesn't need to branch.
pub struct Guard {
    mode: Mode,
}

enum Mode {
    /// sccache resolved, server healthy, environment wired.
    Active {
        /// Absolute path to the sccache binary for post-compile stats.
        binary: PathBuf,
        /// Stats snapshot taken before the compile started.
        pre_stats: Option<Stats>,
    },
    /// sccache not installed, server unreachable, or otherwise unusable.
    /// Build proceeds without cache.
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
    /// Detect sccache, start the server outside the Job Object, health-
    /// check it, and wire `RUSTC_WRAPPER` only if healthy.
    ///
    /// Emits its own [`Stage`] so the pipeline shows a line either way —
    /// "enabled", "not installed — install hint", or "unreachable —
    /// building without cache".
    pub fn new(ws: &Workspace) -> Result<Self> {
        let s = Stage::start("sccache");

        // ── 1. Is sccache installed? ──
        let binary = match ws.resolve("sccache") {
            Ok(path) => path,
            Err(_) => {
                s.skip("not installed — `cargo install sccache` to enable compile caching");
                return Ok(Self {
                    mode: Mode::Disabled,
                });
            }
        };

        // ── 2. Cache dir (workspace-local so one `.userdata/` wipe resets) ──
        //
        // Non-terminal step: we don't consume the Stage here, because
        // Stage is move-only and has exactly one terminal outcome per
        // instance. A cache-dir failure is informational only — sccache
        // still works with its default `~/.cache/sccache` location.
        let cache_dir = ws.root().join(".userdata").join("sccache");
        if let Err(e) = std::fs::create_dir_all(&cache_dir) {
            crate::xwarn!(
                "  [!!] failed to create {}: {e} — falling back to sccache default dir",
                cache_dir.display()
            );
        } else if std::env::var_os("SCCACHE_BUCKET").is_none()
            && std::env::var_os("SCCACHE_REDIS").is_none()
            && std::env::var_os("SCCACHE_AZURE_CONNECTION_STRING").is_none()
            && std::env::var_os("SCCACHE_GCS_BUCKET").is_none()
        {
            // Only point at the local dir if the dev hasn't configured a
            // remote backend in their shell.
            std::env::set_var("SCCACHE_DIR", &cache_dir);
        }

        // ── 3. Start the server OUTSIDE the Job Object ──
        //
        // `sccache --start-server` is idempotent: if a server is already
        // running it returns success without starting a new one. We still
        // issue the call every time so we don't depend on implicit "server
        // is probably up" state — explicit ensure-running is the whole
        // reason this refactor happened.
        if let Err(e) = start_server_detached(&binary) {
            s.warn(format!(
                "could not start sccache server: {e} — building without cache"
            ));
            crate::xwarn!(
                "  [!!] sccache server start failed ({e}) — proceeding without compile cache"
            );
            return Ok(Self {
                mode: Mode::Disabled,
            });
        }

        // ── 4. Health-check: can we actually reach the server? ──
        //
        // `--show-stats` returns non-zero when the server isn't reachable.
        // This is the authoritative "is it alive" check; if it fails we
        // refuse to wire RUSTC_WRAPPER, because a half-broken cache layer
        // is worse than no cache layer.
        let pre_stats = match health_check(&binary) {
            Ok(stats) => stats,
            Err(e) => {
                s.warn(format!(
                    "server unreachable after start: {e} — building without cache"
                ));
                crate::xwarn!(
                    "  [!!] sccache health-check failed ({e}) — proceeding without compile cache"
                );
                return Ok(Self {
                    mode: Mode::Disabled,
                });
            }
        };

        // ── 5. Wire RUSTC_WRAPPER only now that the server is confirmed ──
        //
        // Inherited by every child process we spawn from here on (cargo
        // check, tauri dev, etc). Order matters: we never set this before
        // health-check because half-wired state is the root cause of the
        // "compile errors were actually sccache transport errors" bugs
        // the old retry scaffolding tried to paper over.
        std::env::set_var("RUSTC_WRAPPER", &binary);

        s.ok_with(format!("enabled → {}", cache_dir.display()));

        Ok(Self {
            mode: Mode::Active {
                binary,
                pre_stats: Some(pre_stats),
            },
        })
    }

    /// Print a one-line delta summary of cache activity during the compile.
    ///
    /// Called after `cargo check` / `tauri build` returns. No-op when
    /// sccache is disabled.
    pub fn report(&self) {
        let Mode::Active { binary, pre_stats } = &self.mode else {
            return;
        };
        let Some(pre) = pre_stats else {
            return;
        };
        let Ok(post) = health_check(binary) else {
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

        crate::xinfo!(
            "  > sccache: {hit_delta} hits, {miss_delta} misses ({pct:.0}% hit rate this compile)"
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Server lifecycle — the load-bearing pieces
// ═══════════════════════════════════════════════════════════════════════

/// Start the sccache server with explicit breakaway-from-job semantics.
///
/// On Windows: uses `CREATE_BREAKAWAY_FROM_JOB` so the spawned process
/// does NOT inherit xtask's Job Object. This is paired with
/// `JOB_OBJECT_LIMIT_BREAKAWAY_OK` on the job itself (see
/// [`crate::zombie::JobGuard`]). Together they let the server survive
/// xtask exiting — the whole point of this refactor.
///
/// On Unix: sccache --start-server daemonizes itself; no explicit
/// breakaway needed, and Unix has no analogous cascade problem.
///
/// The call is short (sub-second when server already running, ~1–2s on
/// cold start). We time-bound it defensively regardless.
fn start_server_detached(binary: &std::path::Path) -> Result<()> {
    let mut cmd = Command::new(binary);
    cmd.arg("--start-server");

    #[cfg(windows)]
    {
        // CREATE_BREAKAWAY_FROM_JOB = 0x01000000. Use the windows-sys
        // constant rather than a magic number so a tree-wide audit can
        // find this site.
        use std::os::windows::process::CommandExt;
        use windows_sys::Win32::System::Threading::CREATE_BREAKAWAY_FROM_JOB;
        cmd.creation_flags(CREATE_BREAKAWAY_FROM_JOB);
    }

    let output = run_with_timeout(cmd, Duration::from_secs(10))?;
    if !output.status.success() {
        anyhow::bail!(
            "`sccache --start-server` exited with code {}: {}",
            output.status.code().unwrap_or(-1),
            String::from_utf8_lossy(&output.stderr).trim()
        );
    }
    Ok(())
}

/// Confirm the sccache server is reachable and snapshot pre-build stats.
///
/// `sccache --show-stats` returns non-zero when it can't talk to the
/// server, which is the definitive "is it alive" signal — far more
/// reliable than parsing server logs. Exit code 0 with no stats is
/// also treated as healthy (server up, no activity yet).
fn health_check(binary: &std::path::Path) -> Result<Stats> {
    let mut cmd = Command::new(binary);
    cmd.arg("--show-stats");

    let output = run_with_timeout(cmd, Duration::from_secs(5))?;
    if !output.status.success() {
        anyhow::bail!(
            "`sccache --show-stats` exited with code {}: {}",
            output.status.code().unwrap_or(-1),
            String::from_utf8_lossy(&output.stderr).trim()
        );
    }
    Ok(parse_stats(&String::from_utf8_lossy(&output.stdout)))
}

/// Run a command with a timeout. Unlike `Command::output`, which blocks
/// forever if the child hangs, this bounds the wait — a silently hung
/// sccache binary must never freeze xtask startup.
fn run_with_timeout(mut cmd: Command, timeout: Duration) -> Result<std::process::Output> {
    use std::process::Stdio;
    use std::time::Instant;

    let mut child = cmd.stdout(Stdio::piped()).stderr(Stdio::piped()).spawn()?;

    let deadline = Instant::now() + timeout;
    loop {
        if let Some(_status) = child.try_wait()? {
            return Ok(child.wait_with_output()?);
        }
        if Instant::now() >= deadline {
            let _ = child.kill();
            let _ = child.wait();
            anyhow::bail!("command timed out after {}s", timeout.as_secs());
        }
        std::thread::sleep(Duration::from_millis(50));
    }
}

/// Parse `sccache --show-stats` human-formatted output.
///
/// Returns `Stats::default()` for any parse failure — stats are
/// informational and must never fail a build.
fn parse_stats(text: &str) -> Stats {
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
    stats
}

/// Parse the trailing integer from a stats line like `"        42"`.
fn parse_trailing_u64(s: &str) -> Option<u64> {
    s.split_whitespace().next()?.parse().ok()
}

// ═══════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::parse_stats;

    #[test]
    fn parses_empty_stats_to_zero() {
        let stats = parse_stats("");
        assert_eq!(stats.requests, 0);
        assert_eq!(stats.hits, 0);
    }

    #[test]
    fn parses_populated_stats() {
        let text = "\
            Compile requests                  42\n\
            Compile requests executed         40\n\
            Cache hits                        37\n\
            Cache hits (Rust)                 30\n\
            Cache misses                       3\n";
        let stats = parse_stats(text);
        assert_eq!(stats.requests, 40);
        assert_eq!(stats.hits, 37);
    }

    #[test]
    fn multiple_cache_hits_lines_take_the_first() {
        // sccache emits aggregated "Cache hits" first, then per-language.
        // We must not double-count or prefer a later per-language value.
        let text = "\
            Compile requests executed        100\n\
            Cache hits                        80\n\
            Cache hits (Rust)                 60\n";
        let stats = parse_stats(text);
        assert_eq!(stats.hits, 80);
    }

    #[test]
    fn malformed_stats_are_zero_not_panic() {
        let text = "\
            Compile requests executed        not-a-number\n\
            Cache hits                        also-not\n";
        let stats = parse_stats(text);
        assert_eq!(stats.requests, 0);
        assert_eq!(stats.hits, 0);
    }
}
