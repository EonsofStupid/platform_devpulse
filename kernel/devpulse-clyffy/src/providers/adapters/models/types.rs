//! Model-discovery contracts owned by the kernel, independent of desktop IPC.

use serde::Serialize;

/// One model advertised by an endpoint. Listing is not an inference check.
#[derive(Debug, Clone, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct ProviderModelInfo {
    /// Identifier accepted by the provider's model selector.
    pub id: String,
    /// Provider-supplied owner or namespace, if present.
    pub owned_by: Option<String>,
}

/// Classified failure that engine and UI consumers can handle without parsing text.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ModelDiscoveryErrorKind {
    /// Credentials were refused.
    AuthFailed,
    /// Retryable throttling.
    RateLimit,
    /// Provider quota or billing limit.
    QuotaExhausted,
    /// Connection, transport or timeout failure.
    Network,
    /// Endpoint returned an unsuccessful HTTP status.
    Server,
    /// Response did not contain the expected model-list shape.
    Parse,
    /// Required connection configuration is absent or invalid.
    NotConfigured,
    /// This provider requires a transport not implemented here.
    NotImplemented,
    /// HTTP client initialization or other internal failure.
    Internal,
}

/// Error details with credentials redacted before leaving the adapter.
#[derive(Debug, Clone)]
pub struct ModelDiscoveryError {
    /// Machine-readable classification.
    pub kind: ModelDiscoveryErrorKind,
    /// Human-readable explanation.
    pub message: String,
    /// Optional response detail, bounded and redacted.
    pub context: Option<String>,
}

impl ModelDiscoveryError {
    pub(super) fn new(kind: ModelDiscoveryErrorKind, message: impl Into<String>) -> Self {
        Self {
            kind,
            message: message.into(),
            context: None,
        }
    }

    pub(super) fn with_context(
        kind: ModelDiscoveryErrorKind,
        message: impl Into<String>,
        context: impl Into<String>,
    ) -> Self {
        Self {
            kind,
            message: message.into(),
            context: Some(context.into()),
        }
    }
}

impl std::fmt::Display for ModelDiscoveryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}: {}", self.kind, self.message)
    }
}

impl std::error::Error for ModelDiscoveryError {}
