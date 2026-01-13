// engine/src/signals/variants.rs

//! SignalVariant - the master enum
//!
//! Compiler-checked exhaustive matching.
//! Add a new variant → compiler forces handling everywhere.
//!
//! Serialize/Deserialize for Desktop JSON:
//! { "Chat": { "content": "hello", ... } }

use super::kinds::SinkKind;
use super::payloads::*;
use serde::{Deserialize, Serialize};

/// Master signal enum - all signal types
///
/// This is the core of compile-time dispatch:
/// - No JSON parsing internally (Arc sharing)
/// - Serde for Desktop UI (discriminated union)
/// - Compiler enforces exhaustive handling
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum SignalVariant {
    /// Chat message (user/assistant/system)
    Chat(ChatPayload),

    /// Analytics event (metrics, telemetry)
    Analytics(AnalyticsPayload),

    /// Context retrieval result (CAG hits)
    Context(ContextPayload),

    /// Model inference metrics
    Inference(InferencePayload),

    /// Debug/diagnostic message
    Debug(DebugPayload),

    /// Rumination layer events (4-layer processing)
    Rumination(RuminationPayload),

    /// Thought tree node updates (reasoning visualization)
    ThoughtNode(ThoughtNodePayload),

    /// System configuration changes (persona, settings, etc.)
    System(SystemPayload),

    /// Diagnostic events (model loading, health checks, infra status)
    Diagnostic(DiagnosticPayload),

    /// Voice events (STT/TTS discovery, loading, transcription, synthesis)
    Voice(VoicePayload),
}

impl SignalVariant {
    /// Get sinks for this variant - compile-time known
    ///
    /// Each variant declares where its data should flow.
    /// Router uses this to dispatch to appropriate sinks.
    pub fn sinks(&self) -> &'static [SinkKind] {
        match self {
            // Chat → UI updates + session cache + persistent history
            Self::Chat(_) => &[SinkKind::Broadcast, SinkKind::Cache, SinkKind::Durable],

            // Analytics → metrics DB only
            Self::Analytics(_) => &[SinkKind::Analytics],

            // Context → session cache + vector store
            Self::Context(_) => &[SinkKind::Cache, SinkKind::Vector],

            // Inference → UI updates + metrics
            Self::Inference(_) => &[SinkKind::Broadcast, SinkKind::Analytics],

            // Debug → UI only (when diagnostic mode enabled)
            Self::Debug(_) => &[SinkKind::Broadcast],

            // Rumination → UI only (Lab visualization)
            Self::Rumination(_) => &[SinkKind::Broadcast],

            // ThoughtNode → UI + session cache (tree state)
            Self::ThoughtNode(_) => &[SinkKind::Broadcast, SinkKind::Cache],

            // System → UI only (config change notifications)
            Self::System(_) => &[SinkKind::Broadcast],

            // Diagnostic → UI + Analytics (for Lab monitoring and metrics)
            Self::Diagnostic(_) => &[SinkKind::Broadcast, SinkKind::Analytics],

            // Voice → UI only (voice status updates)
            Self::Voice(_) => &[SinkKind::Broadcast],
        }
    }

    /// Signal name for logging/tracing
    pub const fn name(&self) -> &'static str {
        match self {
            Self::Chat(_) => "chat",
            Self::Analytics(_) => "analytics",
            Self::Context(_) => "context",
            Self::Inference(_) => "inference",
            Self::Debug(_) => "debug",
            Self::Rumination(_) => "rumination",
            Self::ThoughtNode(_) => "thought_node",
            Self::System(_) => "system",
            Self::Diagnostic(_) => "diagnostic",
            Self::Voice(_) => "voice",
        }
    }
}
