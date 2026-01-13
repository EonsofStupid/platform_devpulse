// shared/src/types/header.rs

//! Signal Atomic Contract - SSOT for all signal headers
//!
//! Every signal in DevPulse MUST have these 4 fields.
//! This enables:
//! - Time Travel Debugging
//! - Causality Tracking
//! - Distributed Tracing
//! - Replay
//!
//! See: docs/SIGNAL_CONTRACT.md

use serde::{Deserialize, Serialize};
use uuid::Uuid;

// =============================================================================
// SIGNAL SOURCE (Provenance)
// =============================================================================

/// Who created this signal - the 4th atomic requirement
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SignalSource {
    /// User input (keyboard, mouse, voice)
    User,

    /// System events (OS, file watcher, process monitor)
    System,

    /// Expert/sub-agent output (llm reacting)
    Expert,

    /// Timer/scheduled events
    Clock,
}

// =============================================================================
// SIGNAL HEADER (The 4 Required Metadata Fields)
// =============================================================================

/// Signal header - strict metadata for every signal
///
/// This is THE atomic contract. Every signal type (Toon, Signal, etc.)
/// must include or embed this header.
///
/// # The 4 Atomic Requirements
///
/// | # | Field | Type | Purpose |
/// |---|-------|------|---------|
/// | 1 | `id` | `Uuid` | Unique ID for this event instance |
/// | 2 | `correlation_id` | `Option<Uuid>` | Parent signal ID (None = root) |
/// | 3 | `timestamp` | `u64` | Unix millis at creation |
/// | 4 | `source` | `SignalSource` | Who created this signal |
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SignalHeader {
    /// 1. Identity: Unique ID for this specific event instance (v7 for time-ordering)
    pub id: Uuid,

    /// 2. Causality: ID of the signal that triggered this one
    /// None = Root event (user input, system event, timer)
    pub correlation_id: Option<Uuid>,

    /// 3. Temporality: Unix millis at creation (not emission)
    pub timestamp: u64,

    /// 4. Provenance: Who created this signal
    pub source: SignalSource,
}

impl SignalHeader {
    /// Create a root header (new causality chain)
    ///
    /// Use for: user input, system events, timer triggers
    pub fn new(source: SignalSource) -> Self {
        Self {
            id: Uuid::now_v7(),
            correlation_id: None, // Root of chain
            timestamp: current_time_millis(),
            source,
        }
    }

    /// Create a chained header (reaction to parent)
    ///
    /// Links this header's correlation_id to parent's id.
    pub fn caused_by(parent_id: Uuid, source: SignalSource) -> Self {
        Self {
            id: Uuid::now_v7(),
            correlation_id: Some(parent_id),
            timestamp: current_time_millis(),
            source,
        }
    }

    /// Create a chained header from another header
    pub fn caused_by_header(parent: &SignalHeader, source: SignalSource) -> Self {
        Self::caused_by(parent.id, source)
    }
}

// =============================================================================
// HELPERS
// =============================================================================

/// Get current time in milliseconds (unix epoch)
#[inline]
pub fn current_time_millis() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_root_header() {
        let header = SignalHeader::new(SignalSource::User);

        assert!(header.correlation_id.is_none());
        assert_eq!(header.source, SignalSource::User);
        assert!(header.timestamp > 0);
    }

    #[test]
    fn test_chained_header() {
        let parent = SignalHeader::new(SignalSource::User);
        let child = SignalHeader::caused_by_header(&parent, SignalSource::Expert);

        assert_eq!(child.correlation_id, Some(parent.id));
        assert_eq!(child.source, SignalSource::Expert);
        assert!(child.timestamp >= parent.timestamp);
    }

    #[test]
    fn test_uuid_v7_ordering() {
        let h1 = SignalHeader::new(SignalSource::System);
        std::thread::sleep(std::time::Duration::from_millis(1));
        let h2 = SignalHeader::new(SignalSource::System);

        // v7 UUIDs should be time-ordered
        assert!(h2.id > h1.id);
    }
}
