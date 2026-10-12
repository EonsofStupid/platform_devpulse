//! Turso devtool commands — health, table listing, raw SQL console.
//!
//! Two databases: system (platform.db) and user (user.db).
//! Mirrors the graph.rs pattern: read platform state, access service, execute.
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri command module — every Result-returning fn is a thin wrapper over the `Platform` relational service whose adapter docs hold the canonical # Errors copy"
)]

use crate::state::PlatformState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

use devpulse_engine::platform::SqlAdapter;

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

/// Which Turso database to target.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum TursoDatabase {
    /// System database — platform.db (sessions, projects, config).
    System,
    /// User database — user.db (turns, preferences, `api_keys`).
    User,
}

/// Health of a single Turso database.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TursoHealth {
    /// Which database.
    pub database: String,
    /// Whether SELECT 1 succeeded.
    pub reachable: bool,
    /// Latency in microseconds.
    pub latency_us: u64,
    /// Error message if unreachable.
    pub error: Option<String>,
    /// Database file path.
    pub path: String,
}

/// Combined health of both databases.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TursoHealthAll {
    /// Per-database health.
    pub databases: Vec<TursoHealth>,
}

/// A table in the database with its row count.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TursoTableInfo {
    /// Table name.
    pub name: String,
    /// Number of rows.
    pub row_count: u64,
}

/// Result of a raw SQL query (JSON-serialized rows).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TursoQueryResult {
    /// Column names.
    pub columns: Vec<String>,
    /// Rows as JSON string (serialized array of arrays).
    pub rows_json: String,
    /// Number of rows returned.
    pub row_count: u64,
    /// Number of rows affected (for INSERT/UPDATE/DELETE).
    pub rows_affected: u64,
}

// ═══════════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════════

/// Ping both Turso databases — returns health for each.
#[tauri::command]
#[specta::specta]
pub async fn turso_health_all(state: State<'_, PlatformState>) -> Result<TursoHealthAll, String> {
    tracing::info!("cmd turso_health_all: entry");
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;

    let mut databases = Vec::with_capacity(2);

    // System DB
    {
        let start = std::time::Instant::now();
        match platform.relational() {
            Some(svc) => {
                let adapter = svc.adapter();
                match adapter.query("SELECT 1", &[]).await {
                    Ok(_) => databases.push(TursoHealth {
                        database: "system".into(),
                        reachable: true,
                        latency_us: start.elapsed().as_micros() as u64,
                        error: None,
                        path: svc.path().display().to_string(),
                    }),
                    Err(e) => databases.push(TursoHealth {
                        database: "system".into(),
                        reachable: false,
                        latency_us: 0,
                        error: Some(format!("{e:#}")),
                        path: String::new(),
                    }),
                }
            }
            None => databases.push(TursoHealth {
                database: "system".into(),
                reachable: false,
                latency_us: 0,
                error: Some("Service not booted".into()),
                path: String::new(),
            }),
        }
    }

    // User DB
    {
        let start = std::time::Instant::now();
        match platform.user_relational() {
            Some(svc) => {
                let adapter = svc.adapter();
                match adapter.query("SELECT 1", &[]).await {
                    Ok(_) => databases.push(TursoHealth {
                        database: "user".into(),
                        reachable: true,
                        latency_us: start.elapsed().as_micros() as u64,
                        error: None,
                        path: svc.path().display().to_string(),
                    }),
                    Err(e) => databases.push(TursoHealth {
                        database: "user".into(),
                        reachable: false,
                        latency_us: 0,
                        error: Some(format!("{e:#}")),
                        path: String::new(),
                    }),
                }
            }
            None => databases.push(TursoHealth {
                database: "user".into(),
                reachable: false,
                latency_us: 0,
                error: Some("Service not booted".into()),
                path: String::new(),
            }),
        }
    }

    Ok(TursoHealthAll { databases })
}

/// List tables and row counts for a Turso database.
#[tauri::command]
#[specta::specta]
pub async fn turso_list_tables(
    state: State<'_, PlatformState>,
    database: TursoDatabase,
) -> Result<Vec<TursoTableInfo>, String> {
    tracing::info!(?database, "cmd turso_list_tables: entry");
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;

    let svc = match &database {
        TursoDatabase::System => platform.relational(),
        TursoDatabase::User => platform.user_relational(),
    }
    .ok_or("Database service not available")?;

    let adapter = svc.adapter();

    // SQLite schema query
    let rows = adapter
        .query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
            &[],
        )
        .await
        .map_err(|e| format!("Failed to list tables: {e:#}"))?;

    let mut tables = Vec::new();
    for row in &rows {
        if let Some(name) = row.first().and_then(|v| v.as_text()) {
            let count_rows = adapter
                .query(&format!("SELECT COUNT(*) FROM [{name}]"), &[])
                .await
                .unwrap_or_default();
            let count = count_rows
                .first()
                .and_then(|r| r.first())
                .and_then(devpulse_engine::platform::SqlValue::as_integer)
                .and_then(|n| u64::try_from(n).ok())
                .unwrap_or(0);

            tables.push(TursoTableInfo {
                name: name.to_string(),
                row_count: count,
            });
        }
    }

    Ok(tables)
}

/// Execute a raw SQL query against a Turso database — devtools console.
#[tauri::command]
#[specta::specta]
pub async fn turso_query(
    state: State<'_, PlatformState>,
    database: TursoDatabase,
    sql: String,
) -> Result<TursoQueryResult, String> {
    tracing::info!(?database, sql_len = sql.len(), "cmd turso_query: entry");
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;

    let svc = match &database {
        TursoDatabase::System => platform.relational(),
        TursoDatabase::User => platform.user_relational(),
    }
    .ok_or("Database service not available")?;

    let adapter = svc.adapter();
    let trimmed = sql.trim();

    if trimmed.is_empty() {
        return Err("Empty query".into());
    }

    // Detect if this is a SELECT or a mutation
    let is_select = trimmed.to_uppercase().starts_with("SELECT")
        || trimmed.to_uppercase().starts_with("PRAGMA")
        || trimmed.to_uppercase().starts_with("EXPLAIN");

    if is_select {
        let rows = adapter
            .query(trimmed, &[])
            .await
            .map_err(|e| format!("Query failed: {e:#}"))?;

        // Convert SqlRow → JSON arrays
        let json_rows: Vec<Vec<serde_json::Value>> = rows
            .iter()
            .map(|row| {
                row.iter()
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
                    .collect()
            })
            .collect();

        let row_count = json_rows.len() as u64;
        Ok(TursoQueryResult {
            columns: Vec::new(),
            rows_json: serde_json::to_string(&json_rows).unwrap_or_default(),
            row_count,
            rows_affected: 0,
        })
    } else {
        let affected = adapter
            .execute(trimmed, &[])
            .await
            .map_err(|e| format!("Execute failed: {e:#}"))?;

        Ok(TursoQueryResult {
            columns: Vec::new(),
            rows_json: "[]".to_string(),
            row_count: 0,
            rows_affected: affected,
        })
    }
}
