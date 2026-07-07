//! RRO (reasoning) state machine commands — Tier-2, served by headless Clyffy.
//!
//! The RRO deliberation state machine is **Clyffy's** (headless, on the GB10),
//! not a local DevPulse service. These commands are **connection-gated**: when
//! Clyffy is disconnected DevPulse returns the honest "connect Clyffy" state;
//! when connected it renders whatever Clyffy advertises in its capability.
//! Available once the AI-layer connection is active.
//!
//! The snapshot / depth DTOs are the wire-contract types (`clyffyos-wire`),
//! re-exported via `devpulse-gb10-client` — one source of truth, no parallel
//! DTOs. The serving daemon (`clyffyd`) is built in the clyffyos repo; until it
//! advertises the reasoning state machine in its capability, the connected path
//! reports it as not-yet-advertised (deferred, not retired).
//!
//! # Event emission
//!
//! When served, transitions fire Tauri events on `platform:rro-state-changed`
//! with the new snapshot as payload; the frontend subscribes via `listen()`.
//! The bridge is re-established from the gb10-client event stream once Clyffy
//! connects.
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri command module — each Result-returning command is a thin connection-gated shell: it fails with the standalone 'connect Clyffy' message when disconnected, or the 'not advertised by this capability yet' message when connected but Clyffy's capability does not include the reasoning state machine."
)]

use crate::state::ClyffyConnectionState;
use devpulse_gb10_client::{ConnectionState, RroDepth, RroStateSnapshot};
use tauri::State;

/// Standalone answer (Clyffy disconnected) — RRO is a Tier-2 capability.
const RRO_TIER2_UNAVAILABLE: &str = "Reasoning (RRO) unavailable — the deliberation state machine is a Tier-2 capability served by Clyffy over the gb10-client wire. Connect Clyffy to enable.";

/// Connected, but Clyffy's advertised capability does not include the reasoning
/// state machine yet (deferred, not retired — lands when `clyffyd` advertises it).
const RRO_ENDPOINT_PENDING: &str =
    "Reasoning control pending — connected to Clyffy, but its advertised capability does not include the reasoning state machine yet.";

/// Connection gate: `Ok` only when Clyffy is connected (the caller may then
/// proxy to the wire); the honest standalone `Err` otherwise.
fn require_connected(clyffy: &State<'_, ClyffyConnectionState>) -> Result<(), String> {
    match clyffy.current() {
        ConnectionState::Connected { .. } => Ok(()),
        ConnectionState::Disconnected | ConnectionState::Connecting { .. } => {
            Err(RRO_TIER2_UNAVAILABLE.to_string())
        }
    }
}

/// Get the current RRO state snapshot from headless Clyffy.
#[tauri::command]
#[specta::specta]
pub fn get_rro_state(clyffy: State<'_, ClyffyConnectionState>) -> Result<RroStateSnapshot, String> {
    require_connected(&clyffy)?;
    Err(RRO_ENDPOINT_PENDING.to_string())
}

/// Set the deliberation depth on Clyffy. Does not transition state.
#[tauri::command]
#[specta::specta]
pub fn set_rro_depth(
    clyffy: State<'_, ClyffyConnectionState>,
    depth: RroDepth,
) -> Result<RroStateSnapshot, String> {
    require_connected(&clyffy)?;
    let _ = depth;
    Err(RRO_ENDPOINT_PENDING.to_string())
}

/// Trigger a gather on Clyffy. Transitions state → gathering.
#[tauri::command]
#[specta::specta]
pub fn trigger_rro_gather(
    clyffy: State<'_, ClyffyConnectionState>,
    source: String,
) -> Result<RroStateSnapshot, String> {
    require_connected(&clyffy)?;
    let _ = source;
    Err(RRO_ENDPOINT_PENDING.to_string())
}

/// Trigger a purge on Clyffy. Transitions state → purged.
#[tauri::command]
#[specta::specta]
pub fn trigger_rro_purge(
    clyffy: State<'_, ClyffyConnectionState>,
    reason: String,
) -> Result<RroStateSnapshot, String> {
    require_connected(&clyffy)?;
    let _ = reason;
    Err(RRO_ENDPOINT_PENDING.to_string())
}

/// Trigger a fork on Clyffy. Transitions state → forked.
#[tauri::command]
#[specta::specta]
pub fn trigger_rro_fork(
    clyffy: State<'_, ClyffyConnectionState>,
    label: String,
) -> Result<RroStateSnapshot, String> {
    require_connected(&clyffy)?;
    let _ = label;
    Err(RRO_ENDPOINT_PENDING.to_string())
}

/// Set the proximity diagnostic indicator on Clyffy. Clamped to [0.0, 1.0].
#[tauri::command]
#[specta::specta]
pub fn set_rro_proximity(
    clyffy: State<'_, ClyffyConnectionState>,
    value: f32,
) -> Result<RroStateSnapshot, String> {
    require_connected(&clyffy)?;
    let _ = value;
    Err(RRO_ENDPOINT_PENDING.to_string())
}
