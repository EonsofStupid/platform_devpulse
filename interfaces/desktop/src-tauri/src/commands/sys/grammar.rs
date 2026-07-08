//! Grammar (structured-output) Tauri commands — Tier-2, served by headless Clyffy.
//!
//! Grammar-constrained decoding is **Clyffy's** (headless, on the GB10), not a
//! local DevPulse service. These commands are **connection-gated**: when Clyffy
//! is disconnected DevPulse returns the honest "connect Clyffy" state; when
//! connected it renders whatever Clyffy advertises in its capability. Available
//! once the AI-layer connection is active.
//!
//! The snapshot / kind DTOs are the wire-contract types (`clyffyos-wire`),
//! re-exported via `devpulse-gb10-client` — one source of truth, no parallel
//! DTOs. The serving daemon (`clyffyd`) is built in the clyffyos repo; until it
//! advertises structured-output control in its capability, the connected path
//! reports it as not-yet-advertised (deferred, not retired).
//!
//! # Event emission
//!
//! When served, transitions fire Tauri events on `platform:grammar-changed`
//! with the new snapshot as payload — the frontend subscribes via `listen()`,
//! no polling. The bridge is re-established from the gb10-client event stream
//! once Clyffy connects.
#![expect(
    clippy::missing_errors_doc,
    clippy::needless_pass_by_value,
    reason = "Tauri command module — each Result-returning command is a thin connection-gated shell: it fails with the standalone 'connect Clyffy' message when disconnected, or the 'not advertised by this capability yet' message when connected but Clyffy's capability does not include grammar control. Args (Tauri State + payloads) are framework-mandated by-value and used only by-ref while gated; consumed once forwarded over the wire, so needless_pass_by_value is a false-positive here (#![expect] warns to remove once clyffyd lands)."
)]

use crate::state::ClyffyConnectionState;
use devpulse_gb10_client::{ConnectionState, GrammarKind, GrammarSnapshot};
use tauri::State;

/// Standalone answer (Clyffy disconnected) — grammar is a Tier-2 capability.
const GRAMMAR_TIER2_UNAVAILABLE: &str = "Grammar unavailable — structured-output control is a Tier-2 capability served by Clyffy over the gb10-client wire. Connect Clyffy to enable.";

/// Connected, but Clyffy's advertised capability does not include grammar
/// control yet (deferred, not retired — lands when `clyffyd` advertises it).
const GRAMMAR_ENDPOINT_PENDING: &str =
    "Grammar control pending — connected to Clyffy, but its advertised capability does not include structured-output control yet.";

/// Connection gate: `Ok` only when Clyffy is connected (the caller may then
/// proxy to the wire); the honest standalone `Err` otherwise.
fn require_connected(clyffy: &State<'_, ClyffyConnectionState>) -> Result<(), String> {
    match clyffy.current() {
        ConnectionState::Connected { .. } => Ok(()),
        ConnectionState::Disconnected | ConnectionState::Connecting { .. } => {
            Err(GRAMMAR_TIER2_UNAVAILABLE.to_string())
        }
    }
}

/// Get the current grammar snapshot from headless Clyffy.
#[tauri::command]
#[specta::specta]
pub fn get_grammar_state(
    clyffy: State<'_, ClyffyConnectionState>,
) -> Result<GrammarSnapshot, String> {
    require_connected(&clyffy)?;
    Err(GRAMMAR_ENDPOINT_PENDING.to_string())
}

/// Set the active grammar kind on Clyffy (does not imply enforcement).
#[tauri::command]
#[specta::specta]
pub fn set_grammar_kind(
    clyffy: State<'_, ClyffyConnectionState>,
    kind: GrammarKind,
) -> Result<GrammarSnapshot, String> {
    require_connected(&clyffy)?;
    let _ = kind;
    Err(GRAMMAR_ENDPOINT_PENDING.to_string())
}

/// Enable Clyffy's grammar engine with an opaque grammar id.
#[tauri::command]
#[specta::specta]
pub fn enable_grammar(
    clyffy: State<'_, ClyffyConnectionState>,
    grammar_id: String,
) -> Result<GrammarSnapshot, String> {
    require_connected(&clyffy)?;
    let _ = grammar_id;
    Err(GRAMMAR_ENDPOINT_PENDING.to_string())
}

/// Disable Clyffy's grammar engine entirely.
#[tauri::command]
#[specta::specta]
pub fn disable_grammar(
    clyffy: State<'_, ClyffyConnectionState>,
) -> Result<GrammarSnapshot, String> {
    require_connected(&clyffy)?;
    Err(GRAMMAR_ENDPOINT_PENDING.to_string())
}
