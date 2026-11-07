// engine/src/error.rs

//! Engine error types
//!
//! Unified error type for all engine operations.
//! Designed for graceful degradation - AI failures don't crash the app.

use thiserror::Error;

/// Engine-level errors
#[derive(Debug, Error)]
pub enum EngineError {
    /// AI pipeline not ready (models not loaded, orchestrator failed)
    /// App continues in stub mode
    #[error("AI not ready: {0}")]
    AiNotReady(String),

    /// Project not found in registry
    #[error("Project not found: {0}")]
    ProjectNotFound(String),

    /// Invalid filesystem path
    #[error("Invalid path: {0}")]
    InvalidPath(String),

    /// Path doesn't exist
    #[error("Path does not exist: {0}")]
    PathNotFound(String),

    /// Session not found
    #[error("Session not found: {0}")]
    SessionNotFound(String),

    /// Adapter not available
    #[error("Adapter not available: {0}")]
    AdapterNotAvailable(String),

    /// Orchestrator error (wrapped)
    #[error("Orchestrator error: {0}")]
    Orchestrator(String),

    /// Voice backend error
    #[error("Voice error: {0}")]
    Voice(String),

    /// Storage error
    #[error("Storage error: {0}")]
    Storage(String),

    /// Database error (libSQL)
    #[error("Database error: {0}")]
    Database(String),

    /// Indexing error
    #[error("Indexing error: {0}")]
    Indexing(String),

    /// Initialization error
    #[error("Initialization error: {0}")]
    Init(String),

    /// Reasoning error (CAG, embedder, rro)
    #[error("Reasoning error: {0}")]
    Reasoning(String),

    /// Generic not found error
    #[error("Not found: {0}")]
    NotFound(String),
}

impl EngineError {
    /// Is this error recoverable? (app can continue)
    pub fn is_recoverable(&self) -> bool {
        match self {
            Self::AiNotReady(_) => true,  // Stub mode
            Self::ProjectNotFound(_) => true,
            Self::SessionNotFound(_) => true,
            Self::AdapterNotAvailable(_) => true,
            Self::InvalidPath(_) => true,
            Self::PathNotFound(_) => true,
            Self::Orchestrator(_) => true,  // Fallback to stub
            Self::Voice(_) => true,
            Self::Storage(_) => false,  // Data loss risk
            Self::Database(_) => false,  // Data loss risk
            Self::Indexing(_) => true,  // Can retry
            Self::Init(_) => true,  // Can retry
            Self::Reasoning(_) => true,  // Graceful degradation
            Self::NotFound(_) => true,
        }
    }
}

/// Convert anyhow errors to EngineError
impl From<anyhow::Error> for EngineError {
    fn from(e: anyhow::Error) -> Self {
        Self::Orchestrator(e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ai_not_ready_is_recoverable() {
        let err = EngineError::AiNotReady("models missing".into());
        assert!(err.is_recoverable());
    }

    #[test]
    fn test_storage_error_not_recoverable() {
        let err = EngineError::Storage("disk full".into());
        assert!(!err.is_recoverable());
    }
}
