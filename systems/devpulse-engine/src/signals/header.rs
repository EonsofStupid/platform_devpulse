//! Signal header - the 4 atomic requirements for every signal.
//!
//! This is THE envelope. Every signal in the system carries this.

use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

/// Who created this signal - provenance tracking.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SignalSource {
    /// Human input (keyboard, mouse, voice)
    User,
    /// System events (OS, file watcher, process monitor)
    System,
    /// Expert/sub-agent output (LLM reaction)
    Expert,
    /// Timer/scheduled events
    Clock,
}

/// The 4 atomic requirements for every signal.
///
/// This enables:
/// - Tracing: Follow any output back to its input via `correlation_id`
/// - Replay: Reconstruct sessions from stored headers
/// - Debugging: Know exactly when/where/who created each signal
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SignalHeader {
    /// Unique identity for this signal (Uuid v7 for time-ordering)
    pub id: Uuid,
    /// Links to parent signal for causality tracking (None = root/user input)
    pub correlation_id: Option<Uuid>,
    /// Unix millis at creation time (not emission time)
    pub timestamp: u64,
    /// Who created this signal
    pub source: SignalSource,
}

impl SignalHeader {
    /// Create a new root header (no parent).
    pub fn new(source: SignalSource) -> Self {
        Self {
            id: Uuid::now_v7(),
            correlation_id: None,
            timestamp: epoch_millis(),
            source,
        }
    }

    /// Create a child header linked to a parent.
    pub fn child_of(parent_id: Uuid, source: SignalSource) -> Self {
        Self {
            id: Uuid::now_v7(),
            correlation_id: Some(parent_id),
            timestamp: epoch_millis(),
            source,
        }
    }
}

/// Current epoch milliseconds (safe — no `unwrap`, no truncation).
fn epoch_millis() -> u64 {
    u64::try_from(
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis(),
    )
    .unwrap_or(u64::MAX)
}
