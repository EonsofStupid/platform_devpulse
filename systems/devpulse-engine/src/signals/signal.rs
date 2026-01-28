//! Signal - the complete broadcast packet.
//!
//! Signal = SignalHeader + Arc<SignalVariant>
//! This is what gets emitted and broadcast.

use std::sync::Arc;

use serde::{Deserialize, Deserializer, Serialize, Serializer};
use ts_rs::TS;

use super::header::{SignalHeader, SignalSource};
use super::variants::SignalVariant;

// =============================================================================
// ARC SERIALIZATION HELPERS
// =============================================================================

/// Serialize Arc<T> by serializing the inner value.
fn serialize_arc<S, T>(arc: &Arc<T>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
    T: Serialize,
{
    arc.as_ref().serialize(serializer)
}

/// Deserialize into Arc<T> by deserializing T and wrapping.
fn deserialize_arc<'de, D, T>(deserializer: D) -> Result<Arc<T>, D::Error>
where
    D: Deserializer<'de>,
    T: Deserialize<'de>,
{
    Ok(Arc::new(T::deserialize(deserializer)?))
}

// =============================================================================
// SIGNAL
// =============================================================================

/// The complete signal packet for broadcast.
///
/// Uses `Arc<SignalVariant>` for zero-copy fanout to multiple subscribers.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Signal {
    /// The 4 atomic metadata fields.
    pub header: SignalHeader,
    /// The typed payload (Arc-wrapped for zero-copy).
    #[serde(serialize_with = "serialize_arc", deserialize_with = "deserialize_arc")]
    #[ts(type = "SignalVariant")]
    pub payload: Arc<SignalVariant>,
}

impl Signal {
    /// Create a new root signal (no parent).
    ///
    /// Use this for signals originating from user input or system events.
    pub fn new(source: SignalSource, payload: SignalVariant) -> Self {
        Self {
            header: SignalHeader::new(source),
            payload: Arc::new(payload),
        }
    }

    /// Create a signal caused by another signal.
    ///
    /// Use this for signals that are reactions to other signals.
    /// The correlation_id links back to the parent.
    pub fn caused_by(parent: &Signal, payload: SignalVariant) -> Self {
        Self {
            header: SignalHeader::child_of(parent.header.id, SignalSource::Expert),
            payload: Arc::new(payload),
        }
    }

    /// Create a signal from an existing header and payload.
    pub fn from_parts(header: SignalHeader, payload: SignalVariant) -> Self {
        Self {
            header,
            payload: Arc::new(payload),
        }
    }

    /// Get the payload variant name.
    pub fn variant_name(&self) -> &'static str {
        self.payload.name()
    }
}
