//! Telemetry commands — lane tracing, OTel pipeline health, and session file management.
//!
//! Backs the `/devtools/telemetry` devtool. All read paths are live —
//! no mocked values. Write paths mutate runtime state and persist where
//! applicable.
//!
//! Groups:
//! - **Lane config**: which pipeline stages emit traces
//! - **Pipeline info**: OTel service identity, exporter state, storage path
//! - **Session files**: rotating JSONL files the exporter writes
//! - **Queries**: span traces + lane baselines (DuckDB)

use crate::state::PlatformState;
use devpulse_engine::platform::{AnalyticsAdapter, LaneTraceConfig, SqlValue};
use devpulse_telemetry::boot::TelemetryGuard;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Mutex;
use tauri::{Manager, State};

/// Get the current lane tracing configuration.
///
/// # Errors
/// Returns error if platform is still booting or telemetry is disabled.
#[tauri::command]
#[specta::specta]
pub async fn get_lane_config(state: State<'_, PlatformState>) -> Result<LaneTraceConfig, String> {
    // P0: lock-free atomic load.
    match state.platform.load_full() {
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
    // P0: lock-free atomic load.
    match state.platform.load_full() {
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

/// A span trace row from `DuckDB`, serialized for the frontend.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SpanTraceRow {
    /// Unique trace identifier (groups spans into a single execution path).
    pub trace_id: String,
    /// Unique span identifier within this trace.
    pub span_id: i64,
    /// Parent span ID for tree reconstruction. `None` for root spans.
    pub parent_span_id: Option<i64>,
    /// Human-readable span name (e.g. "`boot_task`", "`surreal_init`").
    pub name: String,
    /// Rust module target that emitted this span (e.g. "`devpulse_engine::platform`").
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

/// Query span traces from `DuckDB`.
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
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
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

/// A lane baseline row from `DuckDB` — percentile stats per execution lane.
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
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
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

// ═══════════════════════════════════════════════════════════════
// OTel pipeline info — service identity, exporter status, storage
// ═══════════════════════════════════════════════════════════════

/// Live snapshot of the telemetry pipeline for the devtool Status panel.
///
/// `exporter_installed` distinguishes between "still buffering boot spans"
/// and "writing to disk". `telemetry_dir` is absolute so users can copy
/// it directly into their file explorer.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TelemetryPipelineInfo {
    /// Platform version string (matches `service.version` OTel attribute).
    pub service_version: String,
    /// Per-launch session identifier (matches `service.instance.id`).
    pub session_id: String,
    /// Absolute path to the telemetry directory. `None` before exporter installs.
    pub telemetry_dir: Option<String>,
    /// Retained session file count. `None` before exporter installs.
    pub keep_sessions: Option<u32>,
    /// Absolute path of the current JSONL file. `None` before exporter installs.
    pub current_session_file: Option<String>,
    /// Unix ms timestamp when the subscriber was installed.
    pub started_at_ms: i64,
    /// Unix ms timestamp when the file exporter took over. `None` before install.
    pub exporter_installed_at_ms: Option<i64>,
    /// Whether the `BufferingProcessor` has been replaced with the real exporter.
    pub exporter_installed: bool,
}

fn system_time_to_ms(t: std::time::SystemTime) -> i64 {
    t.duration_since(std::time::UNIX_EPOCH)
        .map(|d| i64::try_from(d.as_millis()).unwrap_or(i64::MAX))
        .unwrap_or(0)
}

/// Read the live telemetry pipeline snapshot.
///
/// # Errors
/// Returns error if the platform's telemetry guard has not been installed
/// (i.e. the app is very early in boot, before logging::init completed).
#[tauri::command]
#[specta::specta]
pub async fn get_telemetry_info(app: tauri::AppHandle) -> Result<TelemetryPipelineInfo, String> {
    let guard_state = app.state::<Mutex<Option<TelemetryGuard>>>();
    let lock = guard_state
        .lock()
        .map_err(|_| "Telemetry guard mutex poisoned".to_string())?;
    let Some(guard) = lock.as_ref() else {
        return Err(
            "Telemetry pipeline not active — file exporter failed to install at boot.".to_string(),
        );
    };

    let info = guard.info();
    Ok(TelemetryPipelineInfo {
        service_version: info.service_version,
        session_id: info.session_id,
        telemetry_dir: info.telemetry_dir.as_ref().map(|p| p.display().to_string()),
        keep_sessions: info
            .keep_sessions
            .map(|n| u32::try_from(n).unwrap_or(u32::MAX)),
        current_session_file: info
            .current_session_file
            .as_ref()
            .map(|p| p.display().to_string()),
        started_at_ms: system_time_to_ms(info.started_at),
        exporter_installed_at_ms: info.exporter_installed_at.map(system_time_to_ms),
        exporter_installed: info.exporter_installed_at.is_some(),
    })
}

// ═══════════════════════════════════════════════════════════════
// Session file listing
// ═══════════════════════════════════════════════════════════════

/// One rotated `spans-*.otlp.jsonl` file on disk.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TelemetrySessionFile {
    /// File name, e.g. `spans-20260419-124509.otlp.jsonl`.
    pub name: String,
    /// Absolute path.
    pub path: String,
    /// Size in bytes at scan time.
    pub size_bytes: u64,
    /// Unix ms of last modification. `0` if unreadable.
    pub modified_ms: i64,
    /// True for the file the exporter is currently appending to.
    pub is_current: bool,
}

/// List the telemetry session files currently on disk.
///
/// Returns an empty list if the exporter has not installed yet or the
/// directory does not exist (pre-install runs buffer in memory only).
#[tauri::command]
#[specta::specta]
pub async fn list_telemetry_sessions(
    app: tauri::AppHandle,
) -> Result<Vec<TelemetrySessionFile>, String> {
    let guard_state = app.state::<Mutex<Option<TelemetryGuard>>>();
    let (telemetry_dir, current_file) = {
        let lock = guard_state
            .lock()
            .map_err(|_| "Telemetry guard mutex poisoned".to_string())?;
        let Some(guard) = lock.as_ref() else {
            return Ok(Vec::new());
        };
        let info = guard.info();
        let Some(dir) = info.telemetry_dir else {
            return Ok(Vec::new());
        };
        (dir, info.current_session_file)
    };

    if !telemetry_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = std::fs::read_dir(&telemetry_dir)
        .map_err(|e| format!("Failed to read telemetry directory: {e}"))?;

    let mut files: Vec<TelemetrySessionFile> = entries
        .filter_map(std::result::Result::ok)
        .filter(|e| {
            e.file_name().to_string_lossy().starts_with("spans-")
                && e.file_name().to_string_lossy().ends_with(".otlp.jsonl")
        })
        .map(|entry| {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            let metadata = entry.metadata().ok();
            let size_bytes = metadata.as_ref().map(std::fs::Metadata::len).unwrap_or(0);
            let modified_ms = metadata
                .and_then(|m| m.modified().ok())
                .map(system_time_to_ms)
                .unwrap_or(0);
            let is_current = current_file
                .as_ref()
                .map(|cur| cur == &path)
                .unwrap_or(false);
            TelemetrySessionFile {
                name,
                path: path.display().to_string(),
                size_bytes,
                modified_ms,
                is_current,
            }
        })
        .collect();

    // Most recent first.
    files.sort_by(|a, b| b.modified_ms.cmp(&a.modified_ms));
    Ok(files)
}

// ═══════════════════════════════════════════════════════════════
// Actions
// ═══════════════════════════════════════════════════════════════

/// Open the telemetry directory in the OS file manager.
///
/// Used by the "Open folder" action on the devtool so users can inspect
/// OTLP JSONL files directly without copying a path string.
///
/// # Errors
/// Returns error if the directory is unknown (exporter not yet installed)
/// or the OS reveal command fails.
#[tauri::command]
#[specta::specta]
pub async fn open_telemetry_folder(app: tauri::AppHandle) -> Result<(), String> {
    let guard_state = app.state::<Mutex<Option<TelemetryGuard>>>();
    let dir = {
        let lock = guard_state
            .lock()
            .map_err(|_| "Telemetry guard mutex poisoned".to_string())?;
        let Some(guard) = lock.as_ref() else {
            return Err("Telemetry not active yet.".to_string());
        };
        let Some(dir) = guard.info().telemetry_dir else {
            return Err("Telemetry directory not resolved yet.".to_string());
        };
        dir
    };

    open_in_os_explorer(&dir)
}

fn open_in_os_explorer(path: &std::path::Path) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {e}"))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to open Finder: {e}"))?;
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to xdg-open: {e}"))?;
    }
    Ok(())
}

// ═══════════════════════════════════════════════════════════════
// DuckDB row counts (used for pipeline health summary)
// ═══════════════════════════════════════════════════════════════

/// Count of persisted rows per telemetry table — drives the health panel.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TelemetryRowCounts {
    /// Rows in DuckDB `span_traces` table.
    pub span_traces: i64,
    /// Rows in DuckDB `lane_traces` table.
    pub lane_traces: i64,
    /// Rows in DuckDB `lane_baselines` table.
    pub lane_baselines: i64,
}

/// Report how much telemetry has accumulated in DuckDB.
#[tauri::command]
#[specta::specta]
pub async fn get_telemetry_row_counts(
    state: State<'_, PlatformState>,
) -> Result<TelemetryRowCounts, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_string())?;
    let analytics = platform
        .analytics()
        .ok_or_else(|| "Analytics service not available".to_string())?;

    // Inline-count each table. Failures → 0 so the UI still renders counts
    // for the tables that DO exist. The devtool surfaces errors elsewhere.
    let adapter = analytics.adapter();

    let count_one = |sql: String| async move {
        match adapter.analytics_query(&sql).await {
            Ok(rows) => rows
                .first()
                .and_then(|r| r.first())
                .and_then(SqlValue::as_integer)
                .unwrap_or(0),
            Err(_) => 0,
        }
    };

    Ok(TelemetryRowCounts {
        span_traces: count_one("SELECT COUNT(*) FROM span_traces".to_string()).await,
        lane_traces: count_one("SELECT COUNT(*) FROM lane_traces".to_string()).await,
        lane_baselines: count_one("SELECT COUNT(*) FROM lane_baselines".to_string()).await,
    })
}
