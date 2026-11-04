//! Shared chat records; storage timestamps are Unix seconds.
use devpulse_clyffy::rooms::{Outcome, RoomTurn};
use serde::{Deserialize, Serialize};
use specta::Type;

/// A chat turn returned to the frontend (`turns.id` is a string key).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    /// Turn primary key (UUID, string-encoded).
    pub id: String,
    /// Parent session this turn belongs to.
    pub session_id: String,
    /// Speaker role: `"user"`, `"assistant"`, or `"system"`.
    pub role: String,
    /// Message body (Markdown for assistant, plain text for user).
    pub content: String,
    /// Unix timestamp in seconds when this turn was created.
    pub created_at: i64,
    /// Token count consumed by this turn (populated for assistant turns).
    pub token_count: Option<i64>,
    /// Model identifier used for this turn (e.g. `"Qwen3-0.6B"`).
    pub model_used: Option<String>,
    /// Inference latency in milliseconds (populated for assistant turns).
    pub latency_ms: Option<i64>,
    /// What a room saved with this turn.
    #[serde(default)]
    #[specta(optional)]
    pub room: Option<RoomEntry>,
}

/// What a room saved with a turn, so it reads the same when you reopen it.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum RoomEntry {
    /// Which place said this.
    Turn {
        /// The place, role and agent, with what it said.
        turn: Box<RoomTurn>,
    },
    /// How the run ended.
    Outcome {
        /// Rounds run, why they stopped, and what was picked or routed.
        outcome: Box<Outcome>,
    },
}

impl RoomEntry {
    /// The entry in a turn's saved metadata. Anything else, including metadata
    /// from an older version, is simply not a room entry: the turn still shows.
    #[must_use]
    pub fn from_metadata(metadata: &str) -> Option<Self> {
        let value: serde_json::Value = serde_json::from_str(metadata).ok()?;
        if let Some(turn) = value.get("room") {
            let turn = serde_json::from_value(turn.clone()).ok()?;
            return Some(Self::Turn { turn });
        }
        let outcome = serde_json::from_value(value.get("roomOutcome")?.clone()).ok()?;
        Some(Self::Outcome { outcome })
    }
}
