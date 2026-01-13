// lab/src/types/mod.rs

//! Lab-specific types
//!
//! All Lab types use `Lab` prefix to distinguish from Engine types.
//! Signals emitted by Lab use `lab::` namespace in event_type.

use serde::{Deserialize, Serialize};

/// Lab signal event - wrapper around Engine signals with Lab metadata
///
/// All Lab signals have event_type prefixed with "lab::" for Lab-originated signals
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LabSignalEvent {
    /// Unique ID (UUID v7)
    pub id: String,
    /// Event type - MUST start with "lab::" for Lab-originated signals
    pub event_type: String,
    /// Source component
    pub source: LabSource,
    /// ISO timestamp
    pub timestamp: String,
    /// JSON payload
    pub payload: serde_json::Value,
}

/// Lab signal sources
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum LabSource {
    /// Signal bridged from Engine
    Engine,
    /// Lab backend generated
    Backend,
    /// Lab UI generated
    Ui,
    /// Lab CLI generated
    Cli,
}

impl LabSignalEvent {
    /// Create a new Lab-originated signal
    pub fn new_lab_signal(event_type: &str, source: LabSource, payload: serde_json::Value) -> Self {
        Self {
            id: uuid::Uuid::now_v7().to_string(),
            event_type: format!("lab::{}", event_type),
            source,
            timestamp: chrono::Utc::now().to_rfc3339(),
            payload,
        }
    }

    /// Create from Engine signal (preserves original event_type)
    pub fn from_engine_signal(
        id: String,
        event_type: String,
        timestamp: String,
        payload: serde_json::Value,
    ) -> Self {
        Self {
            id,
            event_type, // NOT prefixed - comes from Engine
            source: LabSource::Engine,
            timestamp,
            payload,
        }
    }

    /// Is this a Lab-originated signal?
    pub fn is_lab_signal(&self) -> bool {
        self.event_type.starts_with("lab::")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lab_signal_has_prefix() {
        let sig = LabSignalEvent::new_lab_signal(
            "test",
            LabSource::Backend,
            serde_json::json!({}),
        );
        assert!(sig.event_type.starts_with("lab::"));
        assert!(sig.is_lab_signal());
    }

    #[test]
    fn engine_signal_no_prefix() {
        let sig = LabSignalEvent::from_engine_signal(
            "123".into(),
            "Chat".into(),
            "2026-01-10T00:00:00Z".into(),
            serde_json::json!({}),
        );
        assert!(!sig.event_type.starts_with("lab::"));
        assert!(!sig.is_lab_signal());
    }
}
