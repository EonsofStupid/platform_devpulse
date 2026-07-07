//! Type-time chat-input suggestion commands — Tier-2, served by Clyffy.
//!
//! Suggestions come from Clyffy's embedder recall: embed the partial the user
//! is typing, recall top-`k` similar past prompts. Clyffy is headless (on the
//! GB10), so these commands are **connection-gated** — standalone DevPulse
//! returns the honest "connect Clyffy" state.
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri command module — each command is a thin connection-gated shell: it fails with the standalone 'connect Clyffy' message when disconnected, or the 'not advertised by this capability yet' message when connected but Clyffy's capability does not include the embedder."
)]

use crate::state::ClyffyConnectionState;
use devpulse_gb10_client::ConnectionState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// A recalled prompt suggestion — DevPulse's presentation shape for one entry
/// Clyffy's embedder recall returns once connected.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Suggestion {
    /// Original prompt id (`UUIDv7` — recency-sortable on lex order).
    pub id: String,
    /// Original prompt text the user committed previously.
    pub text: String,
    /// Cosine similarity in `[0.0, 1.0]`. Higher is closer.
    pub similarity: f32,
    /// Unix-seconds capture time — feeds the recency factor in the final rank.
    pub captured_at: i64,
    /// Whether the original prompt was accepted (boosts rank).
    pub accepted: bool,
    /// Final fused score (recency × similarity × accepted-boost), descending.
    pub score: f32,
}

/// Standalone answer (Clyffy disconnected) — recall is a Tier-2 capability.
const SUGGEST_TIER2_UNAVAILABLE: &str = "Suggestions unavailable — type-time recall runs on Clyffy's embedder (headless, on the GB10) over the gb10-client wire. Connect Clyffy to enable.";

/// Connected, but Clyffy's advertised capability does not include the embedder yet.
const SUGGEST_ENDPOINT_PENDING: &str =
    "Suggestion recall pending — connected to Clyffy, but its advertised capability does not include the embedder yet.";

/// Connection gate: `Ok` only when Clyffy is connected; the honest standalone
/// `Err` otherwise.
fn require_connected(clyffy: &State<'_, ClyffyConnectionState>) -> Result<(), String> {
    match clyffy.current() {
        ConnectionState::Connected { .. } => Ok(()),
        ConnectionState::Disconnected | ConnectionState::Connecting { .. } => {
            Err(SUGGEST_TIER2_UNAVAILABLE.to_string())
        }
    }
}

/// Recall top-`k` historical prompts most similar to the partial being typed.
#[tauri::command]
#[specta::specta]
pub fn suggest_query(
    clyffy: State<'_, ClyffyConnectionState>,
    partial: String,
    persona_id: String,
    k: u32,
) -> Result<Vec<Suggestion>, String> {
    require_connected(&clyffy)?;
    let _ = (partial, persona_id, k);
    Err(SUGGEST_ENDPOINT_PENDING.to_string())
}

/// Capture a committed prompt into Clyffy's recall corpus for future recall.
#[tauri::command]
#[specta::specta]
pub fn suggest_record(
    clyffy: State<'_, ClyffyConnectionState>,
    text: String,
    persona_id: String,
    accepted: bool,
) -> Result<(), String> {
    require_connected(&clyffy)?;
    let _ = (text, persona_id, accepted);
    Err(SUGGEST_ENDPOINT_PENDING.to_string())
}
