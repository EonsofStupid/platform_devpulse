// engine/src/signals/sinks/vector.rs

//! Vector sink - routes signals to RRO
//!
//! Handles: Context signals (semantic search)

use super::SignalSink;
use crate::{Signal, SignalVariant};
use tracing::instrument;

/// Vector sink - writes to RRO for semantic search
///
/// Note: Currently a placeholder. Full implementation requires
/// the RRO VectorStore to be integrated.
pub struct VectorSink {
    // TODO: Add VectorStore handle when RRO is fully integrated
}

impl VectorSink {
    pub fn new() -> Self {
        Self {}
    }
}

impl Default for VectorSink {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl SignalSink for VectorSink {
    #[instrument(skip(self, signal), fields(signal_id = %signal.header.id))]
    async fn process(&self, signal: &Signal) {
        match &*signal.payload {
            SignalVariant::Context(payload) => {
                // Context signals contain CAG results that could be embedded
                tracing::debug!(
                    "Context signal routed to vector (chunks={})",
                    payload.chunk_ids.len()
                );
                // TODO: Embed and store in RRO when VectorStore is ready
            }
            _ => {
                // Other signal types don't go to vector storage
            }
        }
    }

    fn name(&self) -> &'static str {
        "vector"
    }
}
