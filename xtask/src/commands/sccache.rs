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
//! ## Server lifetime: health-check-first, no job breakaway
//!
//! Earlier revisions of this file spawned the server with
//! `CREATE_BREAKAWAY_FROM_JOB` to escape xtask's Job Object, reasoning
//! that a daemon's value is surviving xtask invocations. In practice
//! that flag failed on Windows with `ERROR_ACCESS_DENIED` (os error 5)
//! because Windows Terminal / ConHost places the shell — and therefore
//! xtask — inside its own outer Job Object, and
//! `CREATE_BREAKAWAY_FROM_JOB` requires every enclosing nested job to
//! allow breakaway (per the Win8+ nested-jobs model). The outer
//! terminal job does not, so `CreateProcess` returned access-denied
//! before sccache ever ran. Symptom: 14 ms fast-fail + "building
//! without cache" every run, defeating the whole point of installing
//! sccache.
//!
//! The current approach:
//!
//! 1. **Health-check first.** `sccache --show-stats` returns 0 when a
//!    server is already alive. If a developer started one from their
//!    PowerShell `$PROFILE` (the recommended setup for maximum value),
//!    we detect it and reuse it without spawning anything.
//! 2. **Start without breakaway if health-check fails.** The spawned
//!    server inherits xtask's Job Object and dies when xtask exits
//!    (`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`). That would matter if
//!    sccache re-populated its cache from memory, but it doesn't: the
//!    cache **disk** at `.userdata/sccache/` is the source of truth,
//!    and persists across runs regardless of server lifetime. A fresh
//!    server reads the same cache dir on the next xtask run and serves
//!    hits immediately.
//! 3. **Wire `RUSTC_WRAPPER` only after health-check succeeds.** A
//!    half-broken cache wrapper is worse than no wrapper; any failure
//!    in 1+2 leaves `RUSTC_WRAPPER` unset and the build proceeds
//!    without cache.
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

        // ── 0. User opt-out via env var ──
        //
        // `SCCACHE_DISABLE=1` (or any non-empty non-zero value) skips the
        // entire integration — no health-check, no `RUSTC_WRAPPER`, no
        // logging changes. Use this when sccache itself is the cause of
        // a compile failure (transport errors, server panics) so the
        // build can complete uncached without uninstalling sccache.
        if std::env::var_os("SCCACHE_DISABLE")
            .is_some_and(|v| !v.is_empty() && v != "0")
        {
            s.skip("disabled via SCCACHE_DISABLE env var");
            return Ok(Self { mode: Mode::Disabled });
        }

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

        // ── 2.5. Server error log (always — invisible failures are worse than verbose ones) ──
        //
        // Without this, an sccache server panic vanishes to a detached
        // process's stderr — clients see only `os error 10054` (broken
        // pipe) and have no way to diagnose. The correct env var is
        // `SCCACHE_ERROR_LOG` (NOT `SCCACHE_LOG_FILE`, which sccache
        // does not honour). `SCCACHE_LOG` controls log filtering level
        // for both server and client.
        //
        // Note: `SCCACHE_ERROR_LOG` only takes effect when the SERVER
        // starts. A pre-existing server (shell-profile-spawned) keeps
        // whatever logging config it was started with. The health-check
        // path below will reuse it as-is — if its log isn't on disk and
        // it crashes, the dev needs to `sccache --stop-server` and let
        // xtask respawn it under these defaults.
        let log_path = ws.root().join(".userdata").join("sccache.log");
        if std::env::var_os("SCCACHE_ERROR_LOG").is_none() {
            std::env::set_var("SCCACHE_ERROR_LOG", &log_path);
        }
        if std::env::var_os("SCCACHE_LOG").is_none() {
            // `info` for the framework, `debug` for sccache itself —
            // enough to see panics + cache-write errors without
            // gigabytes of trace.
            std::env::set_var("SCCACHE_LOG", "info,sccache=debug");
        }

        // ── 3. Ensure a server is reachable: health-check first, start only if down ──
        //
        // Health-check-first sidesteps the Windows nested-job breakaway
        // problem. When a server is already running (either from a prior
        // xtask run whose child inherited the kill-on-close job, or from
        // a developer who ran `sccache --start-server` in their PowerShell
        // $PROFILE), we reuse it without ever spawning. Only when the
        // check fails do we try to start one — and the start path no
        // longer uses `CREATE_BREAKAWAY_FROM_JOB` because Windows returns
        // ERROR_ACCESS_DENIED on nested jobs (Windows Terminal's outer job
        // did not opt into breakaway even when our own JobGuard does).
        //
        // Trade-off we accept: an xtask-spawned server dies when xtask
        // exits (our JobGuard has `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`),
        // so subsequent xtask runs respawn. The CACHE DISK at
        // `.userdata/sccache/` persists across runs, so respawned servers
        // still serve hits immediately — the only lost value is ~1 second
        // of server startup per xtask invocation. The "server survives
        // across xtask runs" property is fully recovered for developers
        // who start the server from their shell profile, because the
        // health-check-first path detects and reuses it.
        let pre_stats = match health_check(&binary) {
            Ok(stats) => {
                // Server already running — skip the spawn entirely.
                stats
            }
            Err(_) => {
                // No server; start one. Inherits the job; dies with xtask.
                if let Err(e) = start_server(&binary) {
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
                // Re-verify after start.
                match health_check(&binary) {
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
                }
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

/// Start the sccache server.
///
/// On Windows: **does NOT** use `CREATE_BREAKAWAY_FROM_JOB`. Windows
/// Terminal / ConHost places the shell (and xtask) inside its own outer
/// Job Object. `CREATE_BREAKAWAY_FROM_JOB` requires every enclosing job
/// in the nested hierarchy to allow breakaway; the outer terminal job
/// often does not, which makes Windows return `ERROR_ACCESS_DENIED`
/// from `CreateProcess` before the child even runs. That surfaced as
/// the "Access is denied. (os error 5)" failure in 14ms.
///
/// The consequence of not breaking away is that the sccache server
/// inherits xtask's job and dies when xtask exits (our JobGuard has
/// `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`). We trade that against having
/// a working cache: subsequent xtask runs respawn the server, and since
/// the cache **disk** at `.userdata/sccache/` persists across runs,
/// respawned servers still serve hits immediately. The ~1 second of
/// cold-start overhead per xtask invocation is negligible next to a
/// 30-minute cold backend compile.
///
/// Developers who want a truly persistent server should start it from
/// their shell profile (`sccache --start-server` in `$PROFILE` on
/// PowerShell). The `Guard::new` health-check-first path detects the
/// externally-started server and reuses it without spawning anything,
/// so the server survives across xtask runs in that configuration.
///
/// On Unix: `sccache --start-server` daemonizes itself; Unix has no
/// analogous nested-job problem.
///
/// The call is short (sub-second when server already running, ~1–2s on
/// cold start). We time-bound it defensively regardless.
fn start_server(binary: &std::path::Path) -> Result<()> {
    let mut cmd = Command::new(binary);
    cmd.arg("--start-server");

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
