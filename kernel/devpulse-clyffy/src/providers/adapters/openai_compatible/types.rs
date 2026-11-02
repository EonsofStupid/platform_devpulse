//! Text-operation contracts shared by saved endpoints and supervised runtimes.
use serde::{Deserialize, Serialize};

/// Roles supported by the text-only endpoint transport.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum EndpointRole {
    /// Instructions for the model.
    System,
    /// Application instructions.
    Developer,
    /// A person's input.
    User,
    /// A previous model answer.
    Assistant,
}

/// A text message; transport decisions and wire roles belong in the kernel.
#[derive(Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct EndpointChatMessage {
    /// Author of this message.
    pub role: EndpointRole,
    /// Text sent only to the explicitly selected endpoint.
    pub content: String,
}

/// Generation parameters recovered from the orchestrator's web adapter.
/// Intentionally no Debug: message content must not enter diagnostic logs.
#[derive(Serialize)]
pub struct EndpointChatRequest {
    /// Explicit model for a saved connection; a single-model runtime may omit it.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// Ordered conversation, including optional system instructions.
    pub messages: Vec<EndpointChatMessage>,
    /// Output limit in the compatible API dialect.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
    /// Output limit for the current hosted `OpenAI` dialect, including reasoning.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_completion_tokens: Option<u32>,
    /// Optional sampling temperature; omit for models that do not support it.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    /// Optional nucleus sampling.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,
    /// Explicit stop sequences.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub stop: Vec<String>,
}

/// Provider-reported token usage. Missing usage remains unknown, never zero.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct EndpointUsage {
    /// Input tokens reported by the endpoint.
    pub prompt_tokens: u64,
    /// Output tokens reported by the endpoint.
    pub completion_tokens: u64,
}

/// A completed text operation, not a general service-readiness claim.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct EndpointChatResult {
    /// Actual generated answer.
    pub text: String,
    /// Model identity reported by the endpoint, if present.
    pub model: Option<String>,
    /// Actual usage when supplied.
    pub usage: Option<EndpointUsage>,
    /// Stop or output-limit termination.
    pub finish_reason: String,
    /// Time to the complete response, including stream consumption.
    pub elapsed_ms: u64,
}
