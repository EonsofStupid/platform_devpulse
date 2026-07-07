//! Graph store commands — Tier-2, served by headless Clyffy.
//!
//! The `SurrealDB` knowledge graph (system / user / global namespaces) is
//! **Clyffy's** (headless, on the GB10), not a local DevPulse service. These
//! commands are **connection-gated**: when Clyffy is disconnected DevPulse
//! returns the honest "connect Clyffy" state; when connected it renders whatever
//! Clyffy advertises in its capability. Available once the AI-layer connection
//! is active.
//!
//! The response DTOs below (`GraphPingResult`, `GraphHealthAll`, …) are the
//! devtool's own presentation shapes — desktop-local, not wire types — and are
//! returned once `clyffyd` serves the graph endpoint (deferred, not retired).

use crate::state::ClyffyConnectionState;
use devpulse_gb10_client::ConnectionState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

// ═══════════════════════════════════════════════════════════════
// Types (devtool presentation shapes — desktop-local)
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
    /// Whether the HTTP server is reachable.
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
// Connection gate
// ═══════════════════════════════════════════════════════════════

/// Standalone answer (Clyffy disconnected) — the graph is a Tier-2 capability.
const GRAPH_TIER2_UNAVAILABLE: &str = "Graph store unavailable — the SurrealDB knowledge graph is a Tier-2 capability served by Clyffy over the gb10-client wire. Connect Clyffy to enable.";

/// Connected, but Clyffy's advertised capability does not include the knowledge
/// graph yet (deferred, not retired — lands when `clyffyd` advertises it).
const GRAPH_ENDPOINT_PENDING: &str =
    "Graph query pending — connected to Clyffy, but its advertised capability does not include the knowledge graph yet.";

/// Connection gate: `Ok` only when Clyffy is connected (the caller may then
/// proxy to the wire); the honest standalone `Err` otherwise.
fn require_connected(clyffy: &State<'_, ClyffyConnectionState>) -> Result<(), String> {
    match clyffy.current() {
        ConnectionState::Connected { .. } => Ok(()),
        ConnectionState::Disconnected | ConnectionState::Connecting { .. } => {
            Err(GRAPH_TIER2_UNAVAILABLE.to_string())
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════════

/// Ping a single graph namespace on Clyffy — reachable + latency.
///
/// # Errors
/// `Err` when Clyffy is disconnected, or connected but its capability lacks the graph surface.
#[tauri::command]
#[specta::specta]
pub fn ping_graph(
    clyffy: State<'_, ClyffyConnectionState>,
    namespace: GraphNamespace,
) -> Result<GraphPingResult, String> {
    require_connected(&clyffy)?;
    let _ = namespace;
    Err(GRAPH_ENDPOINT_PENDING.to_string())
}

/// Ping all three graph namespaces on Clyffy + check the graph server.
///
/// # Errors
/// `Err` when Clyffy is disconnected, or connected but its capability lacks the graph surface.
#[tauri::command]
#[specta::specta]
pub fn graph_health_all(
    clyffy: State<'_, ClyffyConnectionState>,
) -> Result<GraphHealthAll, String> {
    require_connected(&clyffy)?;
    Err(GRAPH_ENDPOINT_PENDING.to_string())
}

/// List tables and record counts for a namespace on Clyffy.
///
/// # Errors
/// `Err` when Clyffy is disconnected, or connected but its capability lacks the graph surface.
#[tauri::command]
#[specta::specta]
pub fn graph_list_tables(
    clyffy: State<'_, ClyffyConnectionState>,
    namespace: GraphNamespace,
) -> Result<Vec<GraphTableInfo>, String> {
    require_connected(&clyffy)?;
    let _ = namespace;
    Err(GRAPH_ENDPOINT_PENDING.to_string())
}

/// Get aggregate stats for a namespace on Clyffy.
///
/// # Errors
/// `Err` when Clyffy is disconnected, or connected but its capability lacks the graph surface.
#[tauri::command]
#[specta::specta]
pub fn graph_stats(
    clyffy: State<'_, ClyffyConnectionState>,
    namespace: GraphNamespace,
) -> Result<GraphNamespaceStats, String> {
    require_connected(&clyffy)?;
    let _ = namespace;
    Err(GRAPH_ENDPOINT_PENDING.to_string())
}

/// Execute a raw `SurrealQL` query against a namespace on Clyffy — devtools console.
///
/// # Errors
/// `Err` when Clyffy is disconnected, or connected but its capability lacks the graph surface.
#[tauri::command]
#[specta::specta]
pub fn graph_query(
    clyffy: State<'_, ClyffyConnectionState>,
    namespace: GraphNamespace,
    query: String,
) -> Result<String, String> {
    require_connected(&clyffy)?;
    let _ = (namespace, query);
    Err(GRAPH_ENDPOINT_PENDING.to_string())
}

/// List all keys in the scoped kv table for a namespace on Clyffy.
///
/// # Errors
/// `Err` when Clyffy is disconnected, or connected but its capability lacks the graph surface.
#[tauri::command]
#[specta::specta]
pub fn graph_kv_list(
    clyffy: State<'_, ClyffyConnectionState>,
    namespace: GraphNamespace,
) -> Result<Vec<GraphKvEntry>, String> {
    require_connected(&clyffy)?;
    let _ = namespace;
    Err(GRAPH_ENDPOINT_PENDING.to_string())
}
