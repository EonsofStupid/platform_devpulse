//! `DuckDB` devtool commands — health, table listing, raw SQL console.
//!
//! Analytics engine for telemetry spans, lane baselines, OLAP queries.
//! Mirrors the graph.rs + relational.rs pattern.
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri command module — every Result-returning fn is a thin wrapper over the `Platform` analytics adapter whose docs hold the canonical # Errors copy"
)]

use crate::state::PlatformState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

use devpulse_engine::platform::AnalyticsAdapter;

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

/// Health of the `DuckDB` analytics database.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DuckDbHealth {
    /// Whether SELECT 1 succeeded.
    pub reachable: bool,
    /// Latency in microseconds.
    pub latency_us: u64,
    /// Error message if unreachable.
    pub error: Option<String>,
    /// Database file path.
    pub path: String,
}

/// A table in `DuckDB` with row count.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DuckDbTableInfo {
    /// Table name.
    pub name: String,
    /// Number of rows.
    pub row_count: u64,
}

/// Result of a raw SQL query against `DuckDB`.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DuckDbQueryResult {
    /// Rows as JSON string (serialized array of arrays).
    pub rows_json: String,
    /// Number of rows returned.
    pub row_count: u64,
}

// ═══════════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════════

/// Health check for the `DuckDB` analytics database.
#[tauri::command]
#[specta::specta]
pub async fn duckdb_health(state: State<'_, PlatformState>) -> Result<DuckDbHealth, String> {
    tracing::info!("cmd duckdb_health: entry");
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;

    match platform.analytics() {
        Some(svc) => {
            let adapter = svc.adapter();
            let start = std::time::Instant::now();

            match adapter.ping().await {
                Ok(()) => Ok(DuckDbHealth {
                    reachable: true,
                    latency_us: start.elapsed().as_micros() as u64,
                    error: None,
                    path: platform.config().data_dir.clone() + "/telemetry/analytics.duckdb",
                }),
                Err(e) => Ok(DuckDbHealth {
                    reachable: false,
                    latency_us: 0,
                    error: Some(format!("{e:#}")),
                    path: String::new(),
                }),
            }
        }
        None => Ok(DuckDbHealth {
            reachable: false,
            latency_us: 0,
            error: Some("Analytics service not booted".into()),
            path: String::new(),
        }),
    }
}

/// List tables in `DuckDB` with row counts.
#[tauri::command]
#[specta::specta]
pub async fn duckdb_list_tables(
    state: State<'_, PlatformState>,
) -> Result<Vec<DuckDbTableInfo>, String> {
    tracing::info!("cmd duckdb_list_tables: entry");
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;

    let svc = platform
        .analytics()
        .ok_or("Analytics service not available")?;
    let adapter = svc.adapter();

    let rows = adapter
        .analytics_query(
            "SELECT table_name, estimated_size FROM duckdb_tables() ORDER BY table_name",
        )
        .await
        .map_err(|e| format!("Failed to list tables: {e:#}"))?;

    let mut tables = Vec::new();
    for row in &rows {
        let name = row
            .first()
            .and_then(|v| v.as_text())
            .unwrap_or("?")
            .to_string();

        // Get actual row count
        let count_result = adapter
            .analytics_query(&format!("SELECT COUNT(*) FROM [{name}]"))
            .await
            .unwrap_or_default();
        let count = count_result
            .first()
            .and_then(|r| r.first())
            .and_then(devpulse_engine::platform::SqlValue::as_integer)
            .and_then(|n| u64::try_from(n).ok())
            .unwrap_or(0);

        tables.push(DuckDbTableInfo {
            name,
            row_count: count,
        });
    }

    Ok(tables)
}

/// Execute a raw SQL query against `DuckDB` — devtools console.
#[tauri::command]
#[specta::specta]
pub async fn duckdb_query(
    state: State<'_, PlatformState>,
    sql: String,
) -> Result<DuckDbQueryResult, String> {
    tracing::info!(sql_len = sql.len(), "cmd duckdb_query: entry");
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;

    let svc = platform
        .analytics()
        .ok_or("Analytics service not available")?;
    let adapter = svc.adapter();

    let trimmed = sql.trim();
    if trimmed.is_empty() {
        return Err("Empty query".into());
    }

    let rows = adapter
        .analytics_query(trimmed)
        .await
        .map_err(|e| format!("DuckDB query failed: {e:#}"))?;

    let json_rows: Vec<serde_json::Value> = rows
        .iter()
        .map(|row| {
            let values: Vec<serde_json::Value> = row
                .iter()
                .map(|val| {
                    if let Some(t) = val.as_text() {
                        serde_json::Value::String(t.to_string())
                    } else if let Some(i) = val.as_integer() {
                        serde_json::json!(i)
                    } else if let Some(f) = val.as_real() {
                        serde_json::json!(f)
                    } else {
                        serde_json::Value::Null
                    }
                })
                .collect();
            serde_json::Value::Array(values)
        })
        .collect();

    let row_count = json_rows.len() as u64;

    Ok(DuckDbQueryResult {
        rows_json: serde_json::to_string(&json_rows).unwrap_or_default(),
        row_count,
    })
}
