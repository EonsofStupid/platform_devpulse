//! Typed payloads for each SignalVariant.
//!
//! These are the actual data payloads that signals carry.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Chat message payload - LLM responses, user messages.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ChatPayload {
    pub content: String,
    pub role: ChatRole,
    pub model: Option<String>,
}

/// Chat message role.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum ChatRole {
    User,
    Assistant,
    System,
}

/// Analytics event payload - metrics, usage tracking.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AnalyticsPayload {
    pub event_type: String,
    pub properties: serde_json::Value,
}

/// Context payload - RAG results, retrieved context.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ContextPayload {
    pub chunks: Vec<ContextChunk>,
    pub query: String,
}

/// A single context chunk from retrieval.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ContextChunk {
    pub content: String,
    pub source: String,
    pub score: f64,
}

/// Inference metrics payload - model performance data.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct InferencePayload {
    pub tokens_in: u32,
    pub tokens_out: u32,
    pub latency_ms: u64,
    pub model: String,
}

/// System status payload - health checks, state changes.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SystemPayload {
    pub status: SystemStatus,
    pub message: String,
}

/// System status enum.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SystemStatus {
    Ready,
    Processing,
    Error,
    Shutdown,
}
