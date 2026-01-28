//! SignalVariant - the master enum of all output payload types.
//!
//! This is what gets broadcast. Each variant carries a typed payload.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::kinds::SinkKind;
use super::payloads::*;

/// The master enum of all signal output types.
///
/// Each variant maps to specific sinks for routing.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SignalVariant {
    /// Chat message (LLM response, user message)
    Chat(ChatPayload),
    /// Analytics event
    Analytics(AnalyticsPayload),
    /// Retrieved context (RAG)
    Context(ContextPayload),
    /// Inference metrics
    Inference(InferencePayload),
    /// System status change
    System(SystemPayload),
}

impl SignalVariant {
    /// Get the sinks this variant should be routed to.
    pub fn sinks(&self) -> &'static [SinkKind] {
        match self {
            SignalVariant::Chat(_) => &[SinkKind::Broadcast, SinkKind::Durable],
            SignalVariant::Analytics(_) => &[SinkKind::Analytics],
            SignalVariant::Context(_) => &[SinkKind::Broadcast, SinkKind::Cache],
            SignalVariant::Inference(_) => &[SinkKind::Analytics, SinkKind::Cache],
            SignalVariant::System(_) => &[SinkKind::Broadcast],
        }
    }

    /// Get the variant name for logging/debugging.
    pub fn name(&self) -> &'static str {
        match self {
            SignalVariant::Chat(_) => "chat",
            SignalVariant::Analytics(_) => "analytics",
            SignalVariant::Context(_) => "context",
            SignalVariant::Inference(_) => "inference",
            SignalVariant::System(_) => "system",
        }
    }
}
