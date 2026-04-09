//! Telemetry commands — lane tracing configuration.
//!
//! Read and mutate lane trace config at runtime. The config lives
//! in `Arc<RwLock<LaneTraceConfig>>` on the `TelemetryHandle` —
//! changes take effect immediately without restart.

use crate::state::PlatformState;
use devpulse_engine::platform::{AnalyticsAdapter, LaneTraceConfig, SqlValue};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// Get the current lane tracing configuration.
///
/// # Errors
/// Returns error if platform is still booting or telemetry is disabled.
#[tauri::command]
#[specta::specta]
pub async fn get_lane_config(
    state: State<'_, PlatformState>,
) -> Result<LaneTraceConfig, String> {
    let lock = state.platform.read().await;
    match lock.as_ref() {
        Some(platform) => match platform.telemetry() {
            Some(t) => Ok(t.config_snapshot().await),
            None => Err("Telemetry not enabled".to_string()),
        },
        None => Err("Platform is still booting".to_string()),
    }
}

/// Update the lane tracing configuration at runtime.
///
/// Changes take effect immediately — no restart required.
/// The background writer respects the new config on the next trace.
///
/// # Errors
/// Returns error if platform is still booting or telemetry is disabled.
#[tauri::command]
#[specta::specta]
pub async fn set_lane_config(
    state: State<'_, PlatformState>,
    config: LaneTraceConfig,
) -> Result<(), String> {
    let lock = state.platform.read().await;
    match lock.as_ref() {
        Some(platform) => match platform.telemetry() {
            Some(t) => {
                t.update_config(config).await;
                Ok(())
            }
            None => Err("Telemetry not enabled".to_string()),
        },
        None => Err("Platform is still booting".to_string()),
    }
}

// ═══════════════════════════════════════════════════════════════
// Span trace queries — read from DuckDB span_traces table
// ═══════════════════════════════════════════════════════════════

/// A span trace row from DuckDB, serialized for the frontend.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SpanTraceRow {
    /// Unique trace identifier (groups spans into a single execution path).
    pub trace_id: String,
    /// Unique span identifier within this trace.
    pub span_id: i64,
    /// Parent span ID for tree reconstruction. `None` for root spans.
    pub parent_span_id: Option<i64>,
    /// Human-readable span name (e.g. "boot_task", "surreal_init").
    pub name: String,
    /// Rust module target that emitted this span (e.g. "devpulse_engine::platform").
    pub target: String,
    /// Tracing level: TRACE, DEBUG, INFO, WARN, ERROR.
    pub level: String,
    /// Wall-clock duration of this span in microseconds.
    pub duration_us: i64,
    /// Structured fields captured during span execution, JSON-encoded.
    pub fields_json: Option<String>,
    /// ISO-8601 timestamp when the span was created.
    pub created_at: String,
}

/// Query span traces from DuckDB.
///
/// If `trace_id` is provided, returns all spans for that trace (tree view).
/// Otherwise returns the most recent spans up to `limit`.
#[tauri::command]
#[specta::specta]
pub async fn query_span_traces(
    state: State<'_, PlatformState>,
    trace_id: Option<String>,
    limit: Option<u32>,
) -> Result<Vec<SpanTraceRow>, String> {
    let lock = state.platform.read().await;
    let platform = lock
        .as_ref()
        .ok_or_else(|| "Platform is still booting".to_string())?;
    let analytics = platform
        .analytics()
        .ok_or_else(|| "Analytics service not available".to_string())?;

    let sql = if let Some(ref tid) = trace_id {
        format!(
            "SELECT trace_id, span_id, parent_span_id, name, target, level, \
             duration_us, fields_json, created_at::VARCHAR as created_at \
             FROM span_traces WHERE trace_id = '{}' ORDER BY created_at ASC",
            tid.replace('\'', "''")
        )
    } else {
        let lim = limit.unwrap_or(50).min(500);
        format!(
            "SELECT trace_id, span_id, parent_span_id, name, target, level, \
             duration_us, fields_json, created_at::VARCHAR as created_at \
             FROM span_traces ORDER BY created_at DESC LIMIT {lim}"
        )
    };

    let rows = analytics
        .adapter()
        .analytics_query(&sql)
        .await
        .map_err(|e| format!("DuckDB query failed: {e}"))?;

    let results: Vec<SpanTraceRow> = rows
        .iter()
        .map(|row| {
            // SqlValue imported at module level
            let get_str = |i: usize| match row.get(i) {
                Some(SqlValue::Text(s)) => s.clone(),
                _ => String::new(),
            };
            let get_i64 = |i: usize| match row.get(i) {
                Some(SqlValue::Integer(n)) => *n,
                _ => 0,
            };
            let get_opt_i64 = |i: usize| match row.get(i) {
                Some(SqlValue::Integer(n)) => Some(*n),
                Some(SqlValue::Null) => None,
                _ => None,
            };
            let get_opt_str = |i: usize| match row.get(i) {
                Some(SqlValue::Text(s)) if !s.is_empty() => Some(s.clone()),
                _ => None,
            };
            SpanTraceRow {
                trace_id: get_str(0),
                span_id: get_i64(1),
                parent_span_id: get_opt_i64(2),
                name: get_str(3),
                target: get_str(4),
                level: get_str(5),
                duration_us: get_i64(6),
                fields_json: get_opt_str(7),
                created_at: get_str(8),
            }
        })
        .collect();

    Ok(results)
}

/// A lane baseline row from DuckDB — percentile stats per execution lane.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct LaneBaselineRow {
    /// Lane identifier (e.g. "inference", "embedding", "boot").
    pub lane: String,
    /// Number of samples used to compute these baselines.
    pub sample_count: i32,
    /// 50th percentile (median) duration in microseconds.
    pub p50_us: i64,
    /// 95th percentile duration in microseconds.
    pub p95_us: i64,
    /// 99th percentile duration in microseconds.
    pub p99_us: i64,
    /// Average queue wait time before execution started, in microseconds.
    pub avg_queue_wait_us: i64,
    /// Fraction of requests served from cache (0.0–1.0).
    pub cache_hit_rate: f64,
    /// Fraction of requests that required cold-start initialization (0.0–1.0).
    pub cold_start_rate: f64,
    /// ISO-8601 timestamp when these baselines were last computed.
    pub computed_at: String,
}

/// Query lane trace baselines (percentiles per lane).
#[tauri::command]
#[specta::specta]
pub async fn query_lane_baselines(
    state: State<'_, PlatformState>,
) -> Result<Vec<LaneBaselineRow>, String> {
    let lock = state.platform.read().await;
    let platform = lock
        .as_ref()
        .ok_or_else(|| "Platform is still booting".to_string())?;
    let analytics = platform
        .analytics()
        .ok_or_else(|| "Analytics service not available".to_string())?;

    let sql = "SELECT lane, sample_count, p50_us, p95_us, p99_us, \
               avg_queue_wait_us, cache_hit_rate, cold_start_rate, \
               computed_at::VARCHAR as computed_at \
               FROM lane_baselines ORDER BY lane";

    let rows = analytics
        .adapter()
        .analytics_query(sql)
        .await
        .map_err(|e| format!("DuckDB query failed: {e}"))?;

    let results: Vec<LaneBaselineRow> = rows
        .iter()
        .map(|row| {
            // SqlValue imported at module level
            let get_str = |i: usize| match row.get(i) {
                Some(SqlValue::Text(s)) => s.clone(),
                _ => String::new(),
            };
            let get_i64 = |i: usize| match row.get(i) {
                Some(SqlValue::Integer(n)) => *n,
                _ => 0,
            };
            let get_f64 = |i: usize| match row.get(i) {
                Some(SqlValue::Real(n)) => *n,
                _ => 0.0,
            };
            LaneBaselineRow {
                lane: get_str(0),
                sample_count: get_i64(1) as i32,
                p50_us: get_i64(2),
                p95_us: get_i64(3),
                p99_us: get_i64(4),
                avg_queue_wait_us: get_i64(5),
                cache_hit_rate: get_f64(6),
                cold_start_rate: get_f64(7),
                computed_at: get_str(8),
            }
        })
        .collect();

    Ok(results)
}
