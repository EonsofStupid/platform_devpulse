//! Per-project `LibSQL` commands — init, health, query, table listing.
//!
//! Project databases live at `{project_root}/.devpulse/project.db`.
//! Created on demand via `init_project_db`, not during boot.

use crate::state::PlatformState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

use devpulse_engine::platform::SqlAdapter;

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

/// Result of initializing a project database.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectDbInitResult {
    /// Project ID.
    pub project_id: String,
    /// Absolute path to the database file.
    pub db_path: String,
    /// Number of tables created.
    pub table_count: u64,
}

/// Health of a project database.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectDbHealth {
    /// Project ID.
    pub project_id: String,
    /// Whether SELECT 1 succeeded.
    pub reachable: bool,
    /// Latency in microseconds.
    pub latency_us: u64,
    /// Error message if unreachable.
    pub error: Option<String>,
}

/// A table in the project database with its row count.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectDbTableInfo {
    /// Table name.
    pub name: String,
    /// Number of rows.
    pub row_count: u64,
}

/// Result of a raw SQL query against a project database.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectDbQueryResult {
    /// Rows as JSON string (serialized array of arrays).
    pub rows_json: String,
    /// Number of rows returned.
    pub row_count: u64,
    /// Number of rows affected (for mutations).
    pub rows_affected: u64,
}

// ═══════════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════════

/// Initialize a project database at `{project_root}/.devpulse/project.db`.
///
/// Creates the database, applies the project schema, and seeds `project_meta`.
/// Safe to call multiple times — uses `CREATE TABLE IF NOT EXISTS`.
#[tauri::command]
#[specta::specta]
pub async fn init_project_db(
    state: State<'_, PlatformState>,
    project_id: String,
    project_root: String,
    project_name: String,
) -> Result<ProjectDbInitResult, String> {
    tracing::info!(
        project_id = %project_id,
        project_root = %project_root,
        "cmd init_project_db: entry"
    );

    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform is still booting")?;

    let root = std::path::Path::new(&project_root);
    if !root.exists() {
        return Err(format!("Project root does not exist: {project_root}"));
    }

    let adapter = platform
        .project_db()
        .init_project(&project_id, root, &project_name)
        .await
        .map_err(|e| format!("Failed to init project database: {e:#}"))?;

    // Count tables created
    let rows = adapter
        .query(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
            &[],
        )
        .await
        .map_err(|e| format!("Failed to count tables: {e:#}"))?;

    let table_count = rows
        .first()
        .and_then(|r| r.first())
        .and_then(devpulse_engine::platform::SqlValue::as_integer)
        .unwrap_or(0) as u64;

    let db_path = root.join(".devpulse").join("project.db");

    Ok(ProjectDbInitResult {
        project_id,
        db_path: db_path.display().to_string(),
        table_count,
    })
}

/// Health check for a project database.
#[tauri::command]
#[specta::specta]
pub async fn project_db_health(
    state: State<'_, PlatformState>,
    project_id: String,
) -> Result<ProjectDbHealth, String> {
    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform is still booting")?;

    let adapter = platform
        .project_db()
        .get(&project_id)
        .await
        .ok_or_else(|| format!("No open database for project '{project_id}'"))?;

    let start = std::time::Instant::now();
    match adapter.query("SELECT 1", &[]).await {
        Ok(_) => Ok(ProjectDbHealth {
            project_id,
            reachable: true,
            latency_us: start.elapsed().as_micros() as u64,
            error: None,
        }),
        Err(e) => Ok(ProjectDbHealth {
            project_id,
            reachable: false,
            latency_us: 0,
            error: Some(format!("{e:#}")),
        }),
    }
}

/// List tables and row counts for a project database.
#[tauri::command]
#[specta::specta]
pub async fn project_db_list_tables(
    state: State<'_, PlatformState>,
    project_id: String,
) -> Result<Vec<ProjectDbTableInfo>, String> {
    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform is still booting")?;

    let adapter = platform
        .project_db()
        .get(&project_id)
        .await
        .ok_or_else(|| format!("No open database for project '{project_id}'"))?;

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
                .unwrap_or(0) as u64;

            tables.push(ProjectDbTableInfo {
                name: name.to_string(),
                row_count: count,
            });
        }
    }

    Ok(tables)
}

/// Execute a raw SQL query against a project database — devtools console.
#[tauri::command]
#[specta::specta]
pub async fn project_db_query(
    state: State<'_, PlatformState>,
    project_id: String,
    sql: String,
) -> Result<ProjectDbQueryResult, String> {
    tracing::info!(
        project_id = %project_id,
        sql_len = sql.len(),
        "cmd project_db_query: entry"
    );

    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform is still booting")?;

    let adapter = platform
        .project_db()
        .get(&project_id)
        .await
        .ok_or_else(|| format!("No open database for project '{project_id}'"))?;

    let trimmed = sql.trim();
    if trimmed.is_empty() {
        return Err("Empty query".into());
    }

    let is_select = {
        let upper = trimmed.to_uppercase();
        upper.starts_with("SELECT")
            || upper.starts_with("PRAGMA")
            || upper.starts_with("EXPLAIN")
    };

    if is_select {
        let rows = adapter
            .query(trimmed, &[])
            .await
            .map_err(|e| format!("Query failed: {e:#}"))?;

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
        let rows_json = serde_json::to_string(&json_rows)
            .map_err(|e| format!("Failed to serialize rows: {e}"))?;

        Ok(ProjectDbQueryResult {
            rows_json,
            row_count,
            rows_affected: 0,
        })
    } else {
        let affected = adapter
            .execute(trimmed, &[])
            .await
            .map_err(|e| format!("Execute failed: {e:#}"))?;

        Ok(ProjectDbQueryResult {
            rows_json: "[]".to_string(),
            row_count: 0,
            rows_affected: affected,
        })
    }
}
