//! `DevPulse` dashboard commands — real data from services.
//!
//! Queries Turso (projects, sessions, messages) and `DuckDB` (`daily_stats`)
//! to populate the `DevPulse` dashboard with live data.

pub mod profile;

use crate::state::PlatformState;
use devpulse_engine::platform::{AnalyticsAdapter, CacheAdapter, SqlAdapter};
use serde::Serialize;
use specta::Type;
use tauri::State;

/// A project row from Turso — maps 1:1 to the `projects` table.
#[derive(Debug, Serialize, Type)]
pub struct ProjectRow {
    /// Application-generated string key, not a DB auto-increment.
    pub id: String,
    /// Display label shown in the dashboard project list.
    pub name: String,
    /// Absolute filesystem path; used to open the project in the IDE.
    pub root_path: String,
    /// Free-form tag (e.g. `"rust"`, `"node"`, `"python"`). Not an enum — user-supplied.
    pub project_type: String,
    /// Epoch seconds. Set once on INSERT, never updated.
    pub created_at: i64,
    /// Epoch seconds. Updated on every project open; drives dashboard sort order.
    pub last_accessed: i64,
}

/// One row per day from the `DuckDB` `daily_stats` table.
///
/// Populated by the analytics pipeline, not by user actions directly.
#[derive(Debug, Serialize, Type)]
pub struct DailyStatsRow {
    /// `YYYY-MM-DD` string from `DuckDB` `DATE` column cast to text.
    pub date: String,
    /// Engine events (API calls, tool invocations, etc.) — not chat messages.
    pub total_signals: i64,
    /// Chat messages specifically, across all sessions that day.
    pub total_messages: i64,
    /// LLM token consumption (prompt + completion) aggregated for the day.
    pub total_tokens: i64,
    /// Arithmetic mean of per-request latencies. 0.0 if no requests that day.
    pub avg_latency_ms: f64,
}

/// Snapshot of the Moka in-memory cache. Changes between calls.
#[derive(Debug, Serialize, Type)]
pub struct CacheStats {
    /// Live count — may decrease between calls due to TTL eviction.
    pub entry_count: u64,
    /// Hard ceiling configured at boot. Entries beyond this are evicted LRU.
    pub max_capacity: u64,
}

/// Aggregate counts from Turso — cheap `COUNT(*)` queries, not row scans.
#[derive(Debug, Serialize, Type)]
pub struct MessageStats {
    /// All messages ever stored. Includes both user and assistant roles.
    pub total_messages: i64,
    /// Distinct sessions (open + closed). A session with 0 messages still counts.
    pub total_sessions: i64,
}

/// Single IPC response for the dashboard route. Assembles data from all services.
///
/// Turso may be unavailable during early boot — fields fall back to empty/zero.
#[derive(Debug, Serialize, Type)]
pub struct DashboardPayload {
    /// Most recently accessed projects, hard-capped at 8. Sorted by `last_accessed DESC`.
    pub projects: Vec<ProjectRow>,
    /// Separate from `projects.len()` — this is the true total across all projects.
    pub project_count: i64,
    /// Reverse-chronological, capped at 20 rows. Empty if `DuckDB` is unavailable.
    pub daily_stats: Vec<DailyStatsRow>,
    /// Both fields zero if the Moka service hasn't initialized yet.
    pub cache_stats: CacheStats,
    /// Both fields zero if Turso is unavailable.
    pub message_stats: MessageStats,
    /// Wall-clock seconds since `Platform::new()`. Monotonic, never resets.
    pub uptime_secs: u64,
}

/// Fetch dashboard data from all services.
///
/// Queries:
/// - Turso: projects (recent 8), project count, message/session counts
/// - `DuckDB`: `daily_stats` (last 20 days)
/// - Moka: cache stats (entry count / capacity)
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc, clippy::too_many_lines)]
pub async fn fetch_dashboard(state: State<'_, PlatformState>) -> Result<DashboardPayload, String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;

    // ── Turso queries ───────────────────────────────────────────────────
    let (projects, project_count, message_stats) = if let Some(svc) = platform.user_relational() {
        let adapter = svc.adapter();

        // Live projects from the projects service (the one source), most
        // recently used first; the dashboard shows up to 8.
        let live = match platform.projects() {
            Some(service) => service
                .list(false)
                .await
                .map_err(|e| format!("Failed to read projects: {e:#}"))?,
            None => Vec::new(),
        };
        let project_count = i64::try_from(live.len()).unwrap_or(i64::MAX);
        let projects: Vec<ProjectRow> = live
            .into_iter()
            .take(8)
            .map(|p| ProjectRow {
                id: p.id,
                name: p.name,
                root_path: p.root_path,
                project_type: p.project_type,
                created_at: p.created_at,
                last_accessed: p.last_active_at.unwrap_or(0),
            })
            .collect();

        // Message + session counts
        let msg_rows = adapter
            .query("SELECT COUNT(*) FROM turns", &[])
            .await
            .map_err(|e| format!("Failed to count turns: {e}"))?;
        let total_messages = msg_rows
            .first()
            .and_then(|r| r.first())
            .and_then(devpulse_engine::platform::SqlValue::as_integer)
            .unwrap_or(0);

        let sess_rows = adapter
            .query("SELECT COUNT(*) FROM sessions", &[])
            .await
            .map_err(|e| format!("Failed to count sessions: {e}"))?;
        let total_sessions = sess_rows
            .first()
            .and_then(|r| r.first())
            .and_then(devpulse_engine::platform::SqlValue::as_integer)
            .unwrap_or(0);

        (
            projects,
            project_count,
            MessageStats {
                total_messages,
                total_sessions,
            },
        )
    } else {
        (
            Vec::new(),
            0,
            MessageStats {
                total_messages: 0,
                total_sessions: 0,
            },
        )
    };

    // ── DuckDB queries ───────────────────────────────────────────────────
    // `daily_stats` lives in the USER analytics schema (USER_ANALYTICS_SCHEMA
    // in `systems/devpulse-engine/src/platform/services/analytics.rs`),
    // not the system schema. Reading from `platform.analytics()` (system)
    // tried to query a table that doesn't exist there and surfaced as
    // "Failed to load dashboard" the moment the user opened the app on
    // a fresh data dir. We read from `user_analytics()` instead, and
    // fail-soft to an empty vec when the table is absent (fresh install
    // before any usage events have accumulated) or any other DuckDB
    // error occurs — the dashboard UI already renders a zero-state for
    // an empty array, so the right product behavior is "no data yet"
    // rather than a full dashboard failure.
    let daily_stats = if let Some(svc) = platform.user_analytics() {
        let adapter = svc.adapter();

        match adapter
            .analytics_query(
                "SELECT date, total_model_calls, total_messages, total_prompt_tokens + total_completion_tokens AS total_tokens, avg_latency_ms \
                 FROM daily_stats ORDER BY date DESC LIMIT 20",
            )
            .await
        {
            Ok(stats_rows) => stats_rows
                .into_iter()
                .map(|row| DailyStatsRow {
                    date: row
                        .first()
                        .map(std::string::ToString::to_string)
                        .unwrap_or_default(),
                    total_signals: row
                        .get(1)
                        .and_then(devpulse_engine::platform::SqlValue::as_integer)
                        .unwrap_or(0),
                    total_messages: row
                        .get(2)
                        .and_then(devpulse_engine::platform::SqlValue::as_integer)
                        .unwrap_or(0),
                    total_tokens: row
                        .get(3)
                        .and_then(devpulse_engine::platform::SqlValue::as_integer)
                        .unwrap_or(0),
                    avg_latency_ms: row
                        .get(4)
                        .and_then(devpulse_engine::platform::SqlValue::as_real)
                        .unwrap_or(0.0),
                })
                .collect(),
            Err(e) => {
                tracing::warn!(error = %e, "daily_stats query failed — returning empty");
                Vec::new()
            }
        }
    } else {
        Vec::new()
    };

    // ── Moka cache stats ─────────────────────────────────────────────────
    let cache_stats = if let Some(svc) = platform.cache() {
        let (entry_count, max_capacity) = svc.adapter().stats();
        CacheStats {
            entry_count,
            max_capacity,
        }
    } else {
        CacheStats {
            entry_count: 0,
            max_capacity: 0,
        }
    };

    // ── Uptime ───────────────────────────────────────────────────────────
    let uptime_secs = platform.uptime_secs();

    Ok(DashboardPayload {
        projects,
        project_count,
        daily_stats,
        cache_stats,
        message_stats,
        uptime_secs,
    })
}
