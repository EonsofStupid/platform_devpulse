//! Graph store commands — `SurrealDB` devtool operations.
//!
//! Health, namespace browsing, `SurrealQL` console, KV listing.
//! Mirrors the telemetry.rs / vector.rs pattern: read platform state,
//! access the graph service, execute scoped operations.
//!
//! Three namespaces:
//! - `system` / `engine` — FSM, thinking state, quality checks
//! - `user` / `profile` — memory graph, corrections, concepts
//! - `global` / `knowledge` — cross-project patterns, dev profile

use crate::state::PlatformState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

/// Which graph namespace to target.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum GraphNamespace {
    /// system/engine — FSM, quality checks, thinking state.
    System,
    /// user/profile — memory, corrections, concepts.
    User,
    /// global/knowledge — cross-project patterns, dev profile.
    Global,
}

/// Result of pinging a single graph namespace.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GraphPingResult {
    /// Which namespace was pinged.
    pub namespace: String,
    /// Database within the namespace.
    pub database: String,
    /// Whether the ping succeeded.
    pub reachable: bool,
    /// Latency in microseconds (0 if unreachable).
    pub latency_us: u64,
    /// Error message if unreachable.
    pub error: Option<String>,
}

/// Health of all three graph namespaces.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GraphHealthAll {
    /// Per-namespace health results.
    pub namespaces: Vec<GraphPingResult>,
    /// Whether the HTTP server on :8822 is reachable.
    pub http_server_up: bool,
    /// Resolved storage path on disk.
    pub storage_path: String,
}

/// Info about a single table in a namespace.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GraphTableInfo {
    /// Table name.
    pub name: String,
    /// Number of records in this table.
    pub record_count: u64,
}

/// Stats for a single namespace.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GraphNamespaceStats {
    /// Namespace name.
    pub namespace: String,
    /// Database name.
    pub database: String,
    /// Number of tables.
    pub table_count: u32,
    /// Total records across all tables.
    pub total_records: u64,
    /// Table breakdown.
    pub tables: Vec<GraphTableInfo>,
}

/// A key-value entry from the scoped kv table.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GraphKvEntry {
    /// Key name.
    pub key: String,
    /// Value size in bytes.
    pub value_size: u64,
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/// Resolve a `GraphNamespace` enum to the platform graph service accessor.
macro_rules! resolve_graph {
    ($platform:expr, $ns:expr) => {
        match $ns {
            GraphNamespace::System => $platform
                .graph()
                .ok_or_else(|| "System graph not available".to_string()),
            GraphNamespace::User => $platform
                .user_graph()
                .ok_or_else(|| "User graph not available".to_string()),
            GraphNamespace::Global => $platform
                .global_graph()
                .ok_or_else(|| "Global graph not available".to_string()),
        }
    };
}

/// Get the platform reference or return a boot error.
/// P0: lock-free atomic load via `ArcSwapOption::load_full`.
macro_rules! get_platform {
    ($state:expr) => {
        $state
            .platform
            .load_full()
            .ok_or_else(|| "Platform is still booting".to_string())
    };
}

// ═══════════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════════

/// Ping a single graph namespace — returns reachable + latency.
///
/// # Errors
/// Returns error string if platform is still booting.
#[tauri::command]
#[specta::specta]
pub async fn ping_graph(
    state: State<'_, PlatformState>,
    namespace: GraphNamespace,
) -> Result<GraphPingResult, String> {
    let platform = get_platform!(state)?;
    let svc = resolve_graph!(&platform, &namespace)?;
    let handle = svc.handle();

    let ns_name = handle.namespace().to_string();
    let db_name = handle.database().to_string();
    let start = std::time::Instant::now();

    match handle.ping().await {
        Ok(()) => Ok(GraphPingResult {
            namespace: ns_name,
            database: db_name,
            reachable: true,
            latency_us: start.elapsed().as_micros() as u64,
            error: None,
        }),
        Err(e) => Ok(GraphPingResult {
            namespace: ns_name,
            database: db_name,
            reachable: false,
            latency_us: 0,
            error: Some(format!("{e:#}")),
        }),
    }
}

/// Ping all three graph namespaces + check HTTP server.
///
/// # Errors
/// Returns error string if platform is still booting.
#[tauri::command]
#[specta::specta]
pub async fn graph_health_all(state: State<'_, PlatformState>) -> Result<GraphHealthAll, String> {
    let platform = get_platform!(state)?;

    let scopes: &[(GraphNamespace, &str, &str)] = &[
        (GraphNamespace::System, "system", "engine"),
        (GraphNamespace::User, "user", "profile"),
        (GraphNamespace::Global, "global", "knowledge"),
    ];

    let mut namespaces = Vec::with_capacity(3);

    for (ns_enum, fallback_ns, fallback_db) in scopes {
        match resolve_graph!(&platform, ns_enum) {
            Ok(svc) => {
                let handle = svc.handle();
                let ns_name = handle.namespace().to_string();
                let db_name = handle.database().to_string();
                let start = std::time::Instant::now();

                match handle.ping().await {
                    Ok(()) => namespaces.push(GraphPingResult {
                        namespace: ns_name,
                        database: db_name,
                        reachable: true,
                        latency_us: start.elapsed().as_micros() as u64,
                        error: None,
                    }),
                    Err(e) => namespaces.push(GraphPingResult {
                        namespace: ns_name,
                        database: db_name,
                        reachable: false,
                        latency_us: 0,
                        error: Some(format!("{e:#}")),
                    }),
                }
            }
            Err(_) => {
                namespaces.push(GraphPingResult {
                    namespace: (*fallback_ns).to_string(),
                    database: (*fallback_db).to_string(),
                    reachable: false,
                    latency_us: 0,
                    error: Some("Service not booted".to_string()),
                });
            }
        }
    }

    // Check HTTP server on :8822
    let http_server_up = reqwest_check_disabled();

    let storage_path = platform.config().data_dir.clone();

    Ok(GraphHealthAll {
        namespaces,
        http_server_up,
        storage_path,
    })
}

/// HTTP check is a bonus — we don't add reqwest dependency just for this.
/// The embedded adapter ping is the real health check.
fn reqwest_check_disabled() -> bool {
    // HTTP server health is verified by the frontend separately
    // via fetch() to localhost:8822/health. This avoids adding
    // reqwest as a dependency to the Tauri binary.
    false
}

/// List tables and record counts for a namespace.
///
/// Runs `INFO FOR DB` then `SELECT count() FROM {table} GROUP ALL`
/// for each table discovered.
///
/// # Errors
/// Returns error string if platform is still booting or namespace unavailable.
#[tauri::command]
#[specta::specta]
pub async fn graph_list_tables(
    state: State<'_, PlatformState>,
    namespace: GraphNamespace,
) -> Result<Vec<GraphTableInfo>, String> {
    let platform = get_platform!(state)?;
    let svc = resolve_graph!(&platform, &namespace)?;
    let handle = svc.handle();

    // INFO FOR DB returns table definitions — parse table names from result
    let info = handle
        .query("INFO FOR DB")
        .await
        .map_err(|e| format!("INFO FOR DB failed: {e:#}"))?;

    let table_names = extract_table_names(&info);
    let mut tables = Vec::with_capacity(table_names.len());

    for name in &table_names {
        let count_query = format!("SELECT count() FROM {name} GROUP ALL");
        let count = match handle.query(&count_query).await {
            Ok(result) => extract_count(&result),
            Err(_) => 0,
        };
        tables.push(GraphTableInfo {
            name: name.clone(),
            record_count: count,
        });
    }

    Ok(tables)
}

/// Get aggregate stats for a namespace.
///
/// # Errors
/// Returns error string if platform is still booting or namespace unavailable.
#[tauri::command]
#[specta::specta]
pub async fn graph_stats(
    state: State<'_, PlatformState>,
    namespace: GraphNamespace,
) -> Result<GraphNamespaceStats, String> {
    let platform = get_platform!(state)?;
    let svc = resolve_graph!(&platform, &namespace)?;
    let handle = svc.handle();

    let ns_name = handle.namespace().to_string();
    let db_name = handle.database().to_string();

    let tables = graph_list_tables_inner(svc).await;
    let total_records: u64 = tables.iter().map(|t| t.record_count).sum();

    Ok(GraphNamespaceStats {
        namespace: ns_name,
        database: db_name,
        table_count: tables.len() as u32,
        total_records,
        tables,
    })
}

/// Execute a raw `SurrealQL` query against a namespace — devtools console.
///
/// Returns JSON-encoded string of the result.
///
/// # Errors
/// Returns error string if platform is still booting, namespace unavailable,
/// or the query fails.
#[tauri::command]
#[specta::specta]
pub async fn graph_query(
    state: State<'_, PlatformState>,
    namespace: GraphNamespace,
    query: String,
) -> Result<String, String> {
    let platform = get_platform!(state)?;
    let svc = resolve_graph!(&platform, &namespace)?;
    let handle = svc.handle();

    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Err("Empty query".to_string());
    }

    let result = handle
        .query(trimmed)
        .await
        .map_err(|e| format!("SurrealQL query failed: {e:#}"))?;

    serde_json::to_string_pretty(&result).map_err(|e| format!("Failed to serialize result: {e}"))
}

/// List all keys in the scoped kv table for a namespace.
///
/// # Errors
/// Returns error string if platform is still booting or namespace unavailable.
#[tauri::command]
#[specta::specta]
pub async fn graph_kv_list(
    state: State<'_, PlatformState>,
    namespace: GraphNamespace,
) -> Result<Vec<GraphKvEntry>, String> {
    let platform = get_platform!(state)?;
    let svc = resolve_graph!(&platform, &namespace)?;
    let handle = svc.handle();

    let result = handle
        .query("SELECT key, math::len(value) AS value_size FROM kv ORDER BY key")
        .await
        .map_err(|e| format!("KV list query failed: {e:#}"))?;

    let entries = match result {
        serde_json::Value::Array(rows) => rows
            .into_iter()
            .filter_map(|row| {
                let key = row.get("key")?.as_str()?.to_string();
                let value_size = row
                    .get("value_size")
                    .and_then(serde_json::Value::as_u64)
                    .unwrap_or(0);
                Some(GraphKvEntry { key, value_size })
            })
            .collect(),
        _ => Vec::new(),
    };

    Ok(entries)
}

// ═══════════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════════

/// Extract table names from `INFO FOR DB` JSON result.
///
/// `SurrealDB` returns `{ "tables": { "tableName": "DEFINE TABLE ..." } }`.
fn extract_table_names(info: &serde_json::Value) -> Vec<String> {
    let mut names = Vec::new();

    // INFO FOR DB returns an array with one object containing "tables"
    let tables_obj = if let Some(arr) = info.as_array() {
        arr.first()
            .and_then(|obj| obj.get("tables"))
            .or_else(|| arr.first().and_then(|obj| obj.get("tb")))
    } else {
        info.get("tables").or_else(|| info.get("tb"))
    };

    if let Some(serde_json::Value::Object(tables)) = tables_obj {
        for key in tables.keys() {
            names.push(key.clone());
        }
    }

    names.sort();
    names
}

/// Extract count from `SELECT count() FROM table GROUP ALL` result.
fn extract_count(result: &serde_json::Value) -> u64 {
    if let Some(arr) = result.as_array() {
        if let Some(row) = arr.first() {
            // SurrealDB returns { "count": N }
            if let Some(count) = row.get("count") {
                return count.as_u64().unwrap_or(0);
            }
        }
    }
    0
}

/// Internal table listing — reused by `graph_stats`.
///
/// Takes the `GraphService` and queries through its scoped handle.
async fn graph_list_tables_inner(
    svc: &devpulse_engine::platform::services::graph::GraphService,
) -> Vec<GraphTableInfo> {
    let handle = svc.handle();
    let info = match handle.query("INFO FOR DB").await {
        Ok(i) => i,
        Err(_) => return Vec::new(),
    };

    let table_names = extract_table_names(&info);
    let mut tables = Vec::with_capacity(table_names.len());

    for name in &table_names {
        let count_query = format!("SELECT count() FROM {name} GROUP ALL");
        let count = match handle.query(&count_query).await {
            Ok(result) => extract_count(&result),
            Err(_) => 0,
        };
        tables.push(GraphTableInfo {
            name: name.clone(),
            record_count: count,
        });
    }

    tables
}
