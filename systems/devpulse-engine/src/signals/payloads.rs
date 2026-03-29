//! Typed payloads for each `SignalVariant`.
//!
//! These are the actual data payloads that signals carry.
//! All payloads derive `Type` for TypeScript generation via specta.

use serde::{Deserialize, Serialize};
use specta::Type;
use uuid::Uuid;

// =============================================================================
// CHAT
// =============================================================================

/// Chat message payload - LLM responses, user messages.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub struct ChatPayload {
    /// The message content.
    pub content: String,
    /// Who sent the message.
    pub role: ChatRole,
    /// Model used for generation (if assistant).
    pub model: Option<String>,
}

/// Chat message role.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub enum ChatRole {
    /// Human user message.
    User,
    /// AI assistant response.
    Assistant,
    /// System instruction or context.
    System,
}

// =============================================================================
// ANALYTICS
// =============================================================================

/// Analytics event payload - metrics, usage tracking.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub struct AnalyticsPayload {
    /// Event classification (e.g., `page_view`, `feature_used`, `error`).
    pub event_type: AnalyticsEventType,
    /// Structured event properties.
    pub properties: AnalyticsProperties,
}

/// Analytics event classification.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub enum AnalyticsEventType {
    /// User viewed a page/screen.
    PageView,
    /// User interacted with a feature.
    FeatureUsed,
    /// An error occurred.
    Error,
    /// Performance metric recorded.
    Performance,
    /// User session event.
    Session,
    /// Custom event type.
    Custom(String),
}

/// Structured analytics properties.
#[derive(Clone, Debug, Default, Serialize, Deserialize, Type)]
pub struct AnalyticsProperties {
    /// User identifier (anonymized).
    pub user_id: Option<Uuid>,
    /// Session identifier.
    pub session_id: Option<Uuid>,
    /// Feature or page name.
    pub target: Option<String>,
    /// Action taken (e.g., "click", "submit", "navigate").
    pub action: Option<String>,
    /// Numeric value (e.g., `duration_ms`, count).
    pub value: Option<f64>,
    /// Additional context label.
    pub label: Option<String>,
    /// Error code if applicable.
    pub error_code: Option<String>,
    /// Component or module source.
    pub source: Option<String>,
}

// =============================================================================
// CONTEXT (RAG)
// =============================================================================

/// Context payload - RAG results, retrieved context.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub struct ContextPayload {
    /// Retrieved context chunks.
    pub chunks: Vec<ContextChunk>,
    /// Original query that triggered retrieval.
    pub query: String,
}

/// A single context chunk from retrieval.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub struct ContextChunk {
    /// The retrieved text content.
    pub content: String,
    /// Source document/location.
    pub source: String,
    /// Relevance score (0.0 - 1.0).
    pub score: f64,
}

// =============================================================================
// INFERENCE
// =============================================================================

/// Inference metrics payload - model performance data.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub struct InferencePayload {
    /// Input token count.
    pub tokens_in: u32,
    /// Output token count.
    pub tokens_out: u32,
    /// Total latency in milliseconds.
    pub latency_ms: u64,
    /// Model identifier.
    pub model: String,
}

// =============================================================================
// SYSTEM
// =============================================================================

/// System status payload - health checks, state changes.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub struct SystemPayload {
    /// Current system status.
    pub status: SystemStatus,
    /// Human-readable status message.
    pub message: String,
}

/// System status enum.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub enum SystemStatus {
    /// System is ready to process requests.
    Ready,
    /// System is actively processing.
    Processing,
    /// System encountered an error.
    Error,
    /// System is shutting down.
    Shutdown,
}
