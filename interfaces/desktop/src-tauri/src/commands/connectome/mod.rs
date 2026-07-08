//! Connectome governance-graph + encoder-swap commands — Tier-2, served
//! by headless Clyffy.
//!
//! Operator-authored reasoning trees (`CORTEX.md` §4) and the Burn encoder
//! hot-swap are **Clyffy's** — headless, on the GB10 — not local DevPulse
//! services. These commands are **connection-gated**: when Clyffy is
//! disconnected DevPulse returns the honest "connect Clyffy" state; when
//! connected they proxy to Clyffy's `/v1/graph` (thoughts) and `/v1/loader`
//! (encoder swap) surfaces over the gb10-client wire. Available once the
//! AI-layer connection is active.
//!
//! The [`ThoughtRecord`], [`RroState`], and [`SwapStats`] DTOs are the
//! wire-contract types (`clyffyos-wire`), re-exported via
//! `devpulse-gb10-client` — one source of truth, no parallel DTOs. The live
//! `/v1/graph` + `/v1/loader` endpoints are served by `clyffyd`; until they
//! land on the connected build, the connected path reports them as
//! not-yet-served (deferred, not retired).
#![expect(
    clippy::missing_errors_doc,
    clippy::needless_pass_by_value,
    reason = "Tauri command module — each Result-returning command is a thin connection-gated shell: it fails with the standalone 'connect Clyffy' message when disconnected, or the 'endpoint not yet served' message when connected but clyffyd has not exposed the surface. Args (Tauri State + deserialized payloads) are framework-mandated by-value and used only by-ref while gated; they are consumed once forwarded over the wire, so needless_pass_by_value is a false-positive here (the #![expect] warns to remove itself once clyffyd lands and the args are used)."
)]

use crate::state::ClyffyConnectionState;
use devpulse_gb10_client::{ConnectionState, RroState, SwapStats, ThoughtRecord};
use tauri::State;

/// Standalone answer (Clyffy disconnected) — the connectome graph + encoder
/// swap are Tier-2 capabilities.
const CONNECTOME_TIER2_UNAVAILABLE: &str = "Connectome unavailable — reasoning trees and the encoder hot-swap are Tier-2 capabilities served by Clyffy over the gb10-client wire. Connect Clyffy to enable.";

/// Connected, but this Clyffy endpoint does not yet serve the reasoning-tree
/// graph surface (deferred, not retired — lands when `clyffyd` exposes
/// `/v1/graph`).
const GRAPH_ENDPOINT_PENDING: &str =
    "Reasoning-tree control pending — connected to Clyffy, but its advertised capability does not include the reasoning-tree graph yet.";

/// Connected, but this Clyffy endpoint does not yet serve the model-loader
/// surface (deferred, not retired — lands when `clyffyd` exposes `/v1/loader`).
const LOADER_ENDPOINT_PENDING: &str =
    "Encoder swap pending — connected to Clyffy, but its advertised capability does not include model-loader control yet.";

/// Connection gate: `Ok` only when Clyffy is connected (the caller may then
/// proxy to the wire); the honest standalone `Err` otherwise.
fn require_connected(clyffy: &State<'_, ClyffyConnectionState>) -> Result<(), String> {
    match clyffy.current() {
        ConnectionState::Connected { .. } => Ok(()),
        ConnectionState::Disconnected | ConnectionState::Connecting { .. } => {
            Err(CONNECTOME_TIER2_UNAVAILABLE.to_string())
        }
    }
}

/// Create a new thought in the operator's reasoning tree on Clyffy.
///
/// Writes to Clyffy's user graph, scoped to `project_id`. Returns the
/// persisted [`ThoughtRecord`] whose `id` is the canonical Surreal record
/// reference for subsequent edges.
#[tauri::command]
#[specta::specta]
pub fn connectome_thought_create(
    clyffy: State<'_, ClyffyConnectionState>,
    project_id: String,
    branch_id: String,
    content: String,
    rro_state: RroState,
    depth: i32,
    proximity: f32,
) -> Result<ThoughtRecord, String> {
    require_connected(&clyffy)?;
    let _ = (project_id, branch_id, content, rro_state, depth, proximity);
    Err(GRAPH_ENDPOINT_PENDING.to_string())
}

/// Load every thought in a branch from Clyffy, ordered by depth ascending.
#[tauri::command]
#[specta::specta]
pub fn connectome_thought_load_branch(
    clyffy: State<'_, ClyffyConnectionState>,
    project_id: String,
    branch_id: String,
) -> Result<Vec<ThoughtRecord>, String> {
    require_connected(&clyffy)?;
    let _ = (project_id, branch_id);
    Err(GRAPH_ENDPOINT_PENDING.to_string())
}

/// Hot-swap the live Burn encoder weights to a safetensors file on Clyffy.
///
/// Drives Clyffy's RRD daemon through one full
/// `pause → drain → load → validate → swap → resume` cycle and returns the
/// structured [`SwapStats`]. The matching UI surface is the `SwapDialog`
/// under `interfaces/desktop/src/lib/devtools/clyffy/reasoning/rrd/feature`.
#[tauri::command]
#[specta::specta]
pub fn connectome_swap_encoder(
    clyffy: State<'_, ClyffyConnectionState>,
    weights_path: String,
) -> Result<SwapStats, String> {
    require_connected(&clyffy)?;
    let _ = weights_path;
    Err(LOADER_ENDPOINT_PENDING.to_string())
}
