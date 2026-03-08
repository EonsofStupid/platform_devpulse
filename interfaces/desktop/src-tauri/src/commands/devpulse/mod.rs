//! DevPulse dashboard commands — real data from stores.
//!
//! Queries LibSQL (projects, sessions, messages) and DuckDB (daily_stats)
//! to populate the DevPulse dashboard with live data.

use crate::state::PlatformState;
use devpulse_engine::platform::{
    AnalyticsAdapter, CacheAdapter, SqlAdapter,
};
use serde::Serialize;
use tauri::State;

/// A project row from LibSQL.
#[derive(Debug, Serialize)]
pub struct ProjectRow {
    pub id: String,
    pub name: String,
    pub root_path: String,
    pub project_type: String,
    pub created_at: i64,
    pub last_accessed: i64,
}

/// Daily stats row from DuckDB.
#[derive(Debug, Serialize)]
pub struct DailyStatsRow {
    pub date: String,
    pub total_signals: i64,
    pub total_messages: i64,
    pub total_tokens: i64,
    pub avg_latency_ms: f64,
}

/// Cache stats from Moka.
#[derive(Debug, Serialize)]
pub struct CacheStats {
    pub entry_count: u64,
    pub max_capacity: u64,
}

/// Message count summary.
#[derive(Debug, Serialize)]
pub struct MessageStats {
    pub total_messages: i64,
    pub total_sessions: i64,
}

/// Full dashboard payload returned to the frontend.
#[derive(Debug, Serialize)]
pub struct DashboardPayload {
    pub projects: Vec<ProjectRow>,
    pub project_count: i64,
    pub daily_stats: Vec<DailyStatsRow>,
    pub cache_stats: CacheStats,
    pub message_stats: MessageStats,
    pub uptime_secs: u64,
}

/// Fetch dashboard data from all stores.
///
/// Queries:
/// - LibSQL: projects (recent 8), project count, message/session counts
/// - DuckDB: daily_stats (last 20 days)
/// - Moka: cache stats (entry count / capacity)
#[tauri::command]
pub async fn fetch_dashboard(
    state: State<'_, PlatformState>,
) -> Result<DashboardPayload, String> {
    let lock = state.platform.read().await;
    let platform = lock.as_ref().ok_or("Platform is still booting")?;

    // ── LibSQL queries ───────────────────────────────────────────────────
    let (projects, project_count, message_stats) = if let Some(store) = platform.relational() {
        let adapter = store.adapter();

        // Recent projects (up to 8)
        let project_rows = adapter
            .query(
                "SELECT id, name, root_path, project_type, created_at, last_accessed \
                 FROM projects ORDER BY last_accessed DESC LIMIT 8",
                &[],
            )
            .await
            .map_err(|e| format!("Failed to query projects: {e}"))?;

        let projects: Vec<ProjectRow> = project_rows
            .into_iter()
            .map(|row| ProjectRow {
                id: row.first().map(|v| v.to_string()).unwrap_or_default(),
                name: row.get(1).and_then(|v| v.as_text()).unwrap_or("").to_string(),
                root_path: row.get(2).and_then(|v| v.as_text()).unwrap_or("").to_string(),
                project_type: row.get(3).and_then(|v| v.as_text()).unwrap_or("").to_string(),
                created_at: row.get(4).and_then(|v| v.as_integer()).unwrap_or(0),
                last_accessed: row.get(5).and_then(|v| v.as_integer()).unwrap_or(0),
            })
            .collect();

        // Project count
        let count_rows = adapter
            .query("SELECT COUNT(*) FROM projects", &[])
            .await
            .map_err(|e| format!("Failed to count projects: {e}"))?;
        let project_count = count_rows
            .first()
            .and_then(|r| r.first())
            .and_then(|v| v.as_integer())
            .unwrap_or(0);

        // Message + session counts
        let msg_rows = adapter
            .query("SELECT COUNT(*) FROM messages", &[])
            .await
            .map_err(|e| format!("Failed to count messages: {e}"))?;
        let total_messages = msg_rows
            .first()
            .and_then(|r| r.first())
            .and_then(|v| v.as_integer())
            .unwrap_or(0);

        let sess_rows = adapter
            .query("SELECT COUNT(*) FROM sessions", &[])
            .await
            .map_err(|e| format!("Failed to count sessions: {e}"))?;
        let total_sessions = sess_rows
            .first()
            .and_then(|r| r.first())
            .and_then(|v| v.as_integer())
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
    let daily_stats = if let Some(store) = platform.analytics() {
        let adapter = store.adapter();

        let stats_rows = adapter
            .analytics_query(
                "SELECT date, total_signals, total_messages, total_tokens, avg_latency_ms \
                 FROM daily_stats ORDER BY date DESC LIMIT 20",
            )
            .await
            .map_err(|e| format!("Failed to query daily_stats: {e}"))?;

        stats_rows
            .into_iter()
            .map(|row| DailyStatsRow {
                date: row.first().map(|v| v.to_string()).unwrap_or_default(),
                total_signals: row.get(1).and_then(|v| v.as_integer()).unwrap_or(0),
                total_messages: row.get(2).and_then(|v| v.as_integer()).unwrap_or(0),
                total_tokens: row.get(3).and_then(|v| v.as_integer()).unwrap_or(0),
                avg_latency_ms: row.get(4).and_then(|v| v.as_real()).unwrap_or(0.0),
            })
            .collect()
    } else {
        Vec::new()
    };

    // ── Moka cache stats ─────────────────────────────────────────────────
    let cache_stats = if let Some(store) = platform.cache() {
        let (entry_count, max_capacity) = store.adapter().stats();
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
