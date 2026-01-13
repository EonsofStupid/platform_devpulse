// shared/src/types/sink.rs

//! Sink kinds - where signals are routed
//!
//! SSOT for signal destinations. Used by engine's SignalProcessor
//! to route signals to appropriate storage backends.

use serde::{Deserialize, Serialize};

/// Sink kinds - compile-time known destinations
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, Serialize, Deserialize)]
pub enum SinkKind {
    /// tokio::broadcast - UI updates, real-time subscribers
    Broadcast,

    /// moka cache - hot session data, fast lookups (L2)
    Cache,

    /// libSQL - durable persistence, chat history (L4)
    Durable,

    /// RRO - vector embeddings, semantic search (L3)
    Vector,

    /// fjall LSM-tree - large blobs, signal replay (L3)
    Parking,

    /// DuckDB - analytics, metrics, telemetry (L5)
    Analytics,
}

impl SinkKind {
    /// Human-readable name for logging
    pub const fn name(&self) -> &'static str {
        match self {
            Self::Broadcast => "broadcast",
            Self::Cache => "cache",
            Self::Durable => "durable",
            Self::Vector => "vector",
            Self::Parking => "parking",
            Self::Analytics => "analytics",
        }
    }

    /// Storage tier (for documentation/debugging)
    pub const fn tier(&self) -> &'static str {
        match self {
            Self::Broadcast => "L1 (ephemeral)",
            Self::Cache => "L2 (hot)",
            Self::Vector => "L3 (vector)",
            Self::Parking => "L3 (blob)",
            Self::Durable => "L4 (persistent)",
            Self::Analytics => "L5 (analytics)",
        }
    }
}

impl std::fmt::Display for SinkKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name())
    }
}
