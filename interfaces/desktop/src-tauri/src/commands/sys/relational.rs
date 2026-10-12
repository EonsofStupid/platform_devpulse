//! Turso devtool commands — health, tables, row editing, migration history
//! and the SQL console for the system (`platform.db`) and user (`user.db`)
//! databases.
//!
//! Thin wrappers: the table editor lives in the engine
//! (`devpulse_engine::platform::db::editor`), which checks every change
//! against the table's columns before writing. Changes are logged to the
//! `devtools.turso` scope, which the devtool's Logs tab reads.
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri command module — every Result-returning fn is a thin wrapper over the engine's `db` module, whose docs hold the canonical # Errors copy"
)]

use std::sync::Arc;

use crate::state::PlatformState;
use devpulse_engine::platform::db::editor::{
    self, CellChange, Row, RowPage, SqlOutcome, TableSummary,
};
use devpulse_engine::platform::db::{self, MigrationStatus};
use devpulse_engine::platform::services::relational::RelationalService;
use devpulse_engine::platform::Platform;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// Scoped-log target the devtool's Logs tab reads.
const LOG_TARGET: &str = "devtools.turso";

/// Which Turso database to target.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
pub enum TursoDatabase {
    /// System database — `platform.db` (platform state, never user data).
    System,
    /// User database — `user.db` (profile, preferences, projects, chat).
    User,
}

impl TursoDatabase {
    const ALL: [Self; 2] = [Self::System, Self::User];

    fn service(self, platform: &Platform) -> Result<&Arc<RelationalService>, String> {
        match self {
            Self::System => platform.relational(),
            Self::User => platform.user_relational(),
        }
        .ok_or_else(|| format!("The {self:?} database is not open"))
    }
}

/// Health of one Turso database.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TursoHealth {
    /// Which database.
    pub database: TursoDatabase,
    /// Whether it answered `SELECT 1`.
    pub reachable: bool,
    /// Round-trip time in microseconds.
    pub latency_us: u64,
    /// Why it is unreachable.
    pub error: Option<String>,
    /// The database file the service opened; `None` when it is not open.
    pub path: Option<String>,
}

fn platform(state: &PlatformState) -> Result<Arc<Platform>, String> {
    state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_owned())
}

/// Ping every Turso database.
#[tauri::command]
#[specta::specta]
pub async fn turso_health_all(state: State<'_, PlatformState>) -> Result<Vec<TursoHealth>, String> {
    let platform = platform(&state)?;
    let mut out = Vec::with_capacity(TursoDatabase::ALL.len());
    for database in TursoDatabase::ALL {
        let health = match database.service(&platform) {
            Ok(svc) => {
                let start = std::time::Instant::now();
                let ping = svc.adapter().ping().await;
                TursoHealth {
                    database,
                    reachable: ping.is_ok(),
                    latency_us: u64::try_from(start.elapsed().as_micros()).unwrap_or(u64::MAX),
                    error: ping.err().map(|e| format!("{e:#}")),
                    path: Some(svc.path().display().to_string()),
                }
            }
            Err(e) => TursoHealth {
                database,
                reachable: false,
                latency_us: 0,
                error: Some(e),
                path: None,
            },
        };
        out.push(health);
    }
    Ok(out)
}

/// The tables in a database, with row and column counts.
#[tauri::command]
#[specta::specta]
pub async fn turso_list_tables(
    state: State<'_, PlatformState>,
    database: TursoDatabase,
) -> Result<Vec<TableSummary>, String> {
    let platform = platform(&state)?;
    let svc = database.service(&platform)?;
    editor::tables(svc.adapter().as_ref())
        .await
        .map_err(|e| format!("{e:#}"))
}

/// One page of a table's rows, with its columns.
#[tauri::command]
#[specta::specta]
pub async fn turso_table_rows(
    state: State<'_, PlatformState>,
    database: TursoDatabase,
    table: String,
    offset: u32,
    limit: u32,
) -> Result<RowPage, String> {
    let platform = platform(&state)?;
    let svc = database.service(&platform)?;
    editor::rows(svc.adapter().as_ref(), &table, offset, limit)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Change some columns of one row; returns the row as stored.
#[tauri::command]
#[specta::specta]
pub async fn turso_update_row(
    state: State<'_, PlatformState>,
    database: TursoDatabase,
    table: String,
    rowid: i64,
    changes: Vec<CellChange>,
) -> Result<Row, String> {
    let platform = platform(&state)?;
    let svc = database.service(&platform)?;
    let columns: Vec<&str> = changes.iter().map(|c| c.column.as_str()).collect();
    match editor::update_row(svc.adapter().as_ref(), &table, rowid, &changes).await {
        Ok(row) => {
            tracing::info!(target: LOG_TARGET, ?database, %table, rowid, ?columns, "row updated");
            Ok(row)
        }
        Err(e) => {
            tracing::warn!(target: LOG_TARGET, ?database, %table, rowid, error = %format!("{e:#}"), "row update refused");
            Err(format!("{e:#}"))
        }
    }
}

/// Add a row; returns it as stored (defaults filled in).
#[tauri::command]
#[specta::specta]
pub async fn turso_insert_row(
    state: State<'_, PlatformState>,
    database: TursoDatabase,
    table: String,
    values: Vec<CellChange>,
) -> Result<Row, String> {
    let platform = platform(&state)?;
    let svc = database.service(&platform)?;
    match editor::insert_row(svc.adapter().as_ref(), &table, &values).await {
        Ok(row) => {
            tracing::info!(target: LOG_TARGET, ?database, %table, rowid = row.rowid, "row added");
            Ok(row)
        }
        Err(e) => {
            tracing::warn!(target: LOG_TARGET, ?database, %table, error = %format!("{e:#}"), "row add refused");
            Err(format!("{e:#}"))
        }
    }
}

/// Delete one row.
#[tauri::command]
#[specta::specta]
pub async fn turso_delete_row(
    state: State<'_, PlatformState>,
    database: TursoDatabase,
    table: String,
    rowid: i64,
) -> Result<(), String> {
    let platform = platform(&state)?;
    let svc = database.service(&platform)?;
    match editor::delete_row(svc.adapter().as_ref(), &table, rowid).await {
        Ok(()) => {
            tracing::info!(target: LOG_TARGET, ?database, %table, rowid, "row deleted");
            Ok(())
        }
        Err(e) => {
            tracing::warn!(target: LOG_TARGET, ?database, %table, rowid, error = %format!("{e:#}"), "row delete refused");
            Err(format!("{e:#}"))
        }
    }
}

/// Every migration this build ships for a database, with when it was applied.
#[tauri::command]
#[specta::specta]
pub async fn turso_migrations(
    state: State<'_, PlatformState>,
    database: TursoDatabase,
) -> Result<Vec<MigrationStatus>, String> {
    let platform = platform(&state)?;
    let svc = database.service(&platform)?;
    db::status(svc.adapter(), svc.migrations())
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Run one statement from the SQL console.
#[tauri::command]
#[specta::specta]
pub async fn turso_query(
    state: State<'_, PlatformState>,
    database: TursoDatabase,
    sql: String,
) -> Result<SqlOutcome, String> {
    let platform = platform(&state)?;
    let svc = database.service(&platform)?;
    let outcome = editor::run_sql(svc.adapter().as_ref(), &sql)
        .await
        .map_err(|e| format!("{e:#}"))?;
    if outcome.rows_affected > 0 {
        tracing::info!(target: LOG_TARGET, ?database, rows_affected = outcome.rows_affected, sql = %sql.trim(), "console statement changed rows");
    }
    Ok(outcome)
}
