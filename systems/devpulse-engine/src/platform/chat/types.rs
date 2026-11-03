//! Shared chat records; storage timestamps are Unix seconds.
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
}
