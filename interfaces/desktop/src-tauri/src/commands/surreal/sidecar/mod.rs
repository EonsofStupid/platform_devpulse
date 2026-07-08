//! `SurrealDB` commands — Tier-2, served by headless Clyffy.
//!
//! The knowledge-graph `SurrealDB` store is **Clyffy's** (headless, on the
//! GB10), not a local DevPulse sidecar. These commands are **connection-gated**:
//! standalone DevPulse returns the honest "connect Clyffy" state; the status /
//! health / config surface reflects Clyffy's store once it advertises it.
#![expect(
    clippy::missing_errors_doc,
    clippy::needless_pass_by_value,
    reason = "Tauri command module — each command is a thin connection-gated shell: it fails with the standalone 'connect Clyffy' message when disconnected, or the 'not advertised by this capability yet' message when connected but Clyffy's capability does not include the graph store. Args (Tauri State + payloads) are framework-mandated by-value and used only by-ref while gated; consumed once forwarded over the wire, so needless_pass_by_value is a false-positive here (#![expect] warns to remove once clyffyd lands)."
)]

use crate::state::ClyffyConnectionState;
use devpulse_gb10_client::ConnectionState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// Runtime status of Clyffy's `SurrealDB` store — DevPulse's presentation shape.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SurrealStatus {
    /// True iff the store is present in Clyffy's slot table.
    pub running: bool,
    /// True iff Clyffy owns the embedded store (always `true` for the
    /// embedded path — retained for source-compat).
    pub managed: bool,
    /// Storage backend identifier (`"kv-surrealkv"`).
    pub backend: String,
    /// Absolute path to the `SurrealKV` data directory on the node.
    pub data_path: String,
}

/// Badge-shaped tri-state health of Clyffy's `SurrealDB` store.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SurrealHealth {
    /// `"up"` / `"down"` / `"stopped"`.
    pub state: String,
    /// Human-readable label (short).
    pub label: String,
}

/// Persisted user overrides for the store. Empty today — reserved for future
/// tuning knobs (cache size, compaction policy, snapshot retention).
#[derive(Debug, Clone, Default, Serialize, Deserialize, Type)]
pub struct SurrealUserConfig {}

/// Standalone answer (Clyffy disconnected) — the graph store is Tier-2.
const SURREAL_TIER2_UNAVAILABLE: &str = "SurrealDB unavailable — the knowledge-graph store is Clyffy's (headless, on the GB10) over the gb10-client wire. Connect Clyffy to enable.";

/// Connected, but Clyffy's advertised capability does not include the graph store yet.
const SURREAL_ENDPOINT_PENDING: &str =
    "SurrealDB pending — connected to Clyffy, but its advertised capability does not include the graph store yet.";

/// Connection gate: `Ok` only when Clyffy is connected; the honest standalone
/// `Err` otherwise.
fn require_connected(clyffy: &State<'_, ClyffyConnectionState>) -> Result<(), String> {
    match clyffy.current() {
        ConnectionState::Connected { .. } => Ok(()),
        ConnectionState::Disconnected | ConnectionState::Connecting { .. } => {
            Err(SURREAL_TIER2_UNAVAILABLE.to_string())
        }
    }
}

/// Runtime status of Clyffy's `SurrealDB` store.
#[tauri::command]
#[specta::specta]
pub fn surreal_status(clyffy: State<'_, ClyffyConnectionState>) -> Result<SurrealStatus, String> {
    require_connected(&clyffy)?;
    Err(SURREAL_ENDPOINT_PENDING.to_string())
}

/// Live-probe Clyffy's `SurrealDB` store and return a badge tri-state.
#[tauri::command]
#[specta::specta]
pub fn surreal_health(clyffy: State<'_, ClyffyConnectionState>) -> Result<SurrealHealth, String> {
    require_connected(&clyffy)?;
    Err(SURREAL_ENDPOINT_PENDING.to_string())
}

/// Load the user-scope config overlay for Clyffy's store.
#[tauri::command]
#[specta::specta]
pub fn surreal_config_load(
    clyffy: State<'_, ClyffyConnectionState>,
) -> Result<SurrealUserConfig, String> {
    require_connected(&clyffy)?;
    Err(SURREAL_ENDPOINT_PENDING.to_string())
}

/// Atomically persist the user-scope config overlay for Clyffy's store.
#[tauri::command]
#[specta::specta]
pub fn surreal_config_save(
    clyffy: State<'_, ClyffyConnectionState>,
    cfg: SurrealUserConfig,
) -> Result<SurrealUserConfig, String> {
    require_connected(&clyffy)?;
    let _ = cfg;
    Err(SURREAL_ENDPOINT_PENDING.to_string())
}
