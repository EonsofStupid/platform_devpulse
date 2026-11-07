// engine/src/signals/payloads.rs

//! Signal payloads - typed data for each signal variant
//!
//! All payloads have Serialize/Deserialize for Desktop JSON rendering.
//! Internally we use Arc<SignalVariant> for zero-copy.

use serde::{Deserialize, Serialize};
use shared::types::ids::SessionId;

/// Chat message payload
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ChatPayload {
    pub session_id: SessionId,
    pub role: Role,
    pub content: String,
}

/// Analytics event payload
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AnalyticsPayload {
    pub event_type: AnalyticsEvent,
    pub value: i64,
}

/// Context retrieval payload (CAG results)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ContextPayload {
    pub query: String,
    pub chunk_ids: Vec<String>,
    pub scores: Vec<f32>,
}

/// Model inference metrics payload
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct InferencePayload {
    pub model_id: String,
    pub tokens_in: u32,
    pub tokens_out: u32,
    pub latency_ms: u32,
}

/// Debug/diagnostic payload
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DebugPayload {
    pub level: DebugLevel,
    pub message: String,
}

/// Chat message role
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum Role {
    User,
    Assistant,
    System,
}

/// Debug severity level
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum DebugLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

/// Analytics event types
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum AnalyticsEvent {
    MessageSent,
    MessageReceived,
    ContextRetrieved,
    Adapterswitched,
    SessionStarted,
    SessionEnded,
}

// =============================================================================
// RUMINATION PAYLOADS
// =============================================================================

/// Rumination layer event
///
/// Tracks the 4-layer rumination process:
/// - Keystroke: Real-time prefetch (<50ms)
/// - Pause: Context assembly (100-500ms)
/// - Send: Full LLM inference (2-5s)
/// - Background: Extended processing (30s+)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RuminationPayload {
    pub session_id: SessionId,
    pub event: RuminationEvent,
    pub layer: RuminationLayer,
}

/// Rumination event types
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum RuminationEvent {
    /// Layer started processing
    LayerStarted,
    /// Layer completed processing
    LayerCompleted { duration_ms: u32 },
    /// New thought added to tree
    ThoughtAdded { node_id: String, content: String },
    /// Error during rumination
    Error { message: String },
}

/// The 4 rumination layers
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum RuminationLayer {
    /// Keystroke layer - real-time prefetch (<50ms)
    Keystroke,
    /// Pause layer - context assembly (100-500ms)
    Pause,
    /// Send layer - full LLM inference (2-5s)
    Send,
    /// Background layer - extended processing (30s+)
    Background,
}

/// Thought tree node for visualization
///
/// Each node represents a step in the reasoning chain.
/// Used by Lab to visualize the thought tree.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ThoughtNodePayload {
    pub node_id: String,
    pub parent_id: Option<String>,
    pub content: String,
    pub layer: RuminationLayer,
    pub timestamp: u64,
}

// =============================================================================
// SYSTEM PAYLOADS
// =============================================================================

/// Generic system event payload
///
/// Used for configuration changes, status updates, and other system events
/// that don't fit into specific categories.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SystemPayload {
    /// Event type identifier
    pub event: String,
    /// Human-readable message
    pub message: String,
    /// Optional structured data
    pub data: Option<serde_json::Value>,
}

// =============================================================================
// DIAGNOSTIC PAYLOADS (Model Loading Observability)
// =============================================================================

/// Diagnostic event for system observability
///
/// Tracks model loading, infrastructure initialization, and runtime events.
/// Designed for Lab UI to visualize system startup and health.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DiagnosticPayload {
    /// Component being tracked (e.g., "embedder", "reranker", "llm", "rro")
    pub component: String,
    /// Current event type
    pub event: DiagnosticEvent,
    /// Optional progress percentage (0-100)
    pub progress_pct: Option<u8>,
    /// Optional memory usage in MB
    pub memory_mb: Option<u64>,
    /// Optional device (CPU, CUDA:0, etc.)
    pub device: Option<String>,
}

/// Diagnostic event types
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum DiagnosticEvent {
    /// Component initialization started
    Loading { model_name: String },
    /// Loading progress update
    Progress { stage: String, detail: Option<String> },
    /// Model weights being loaded
    WeightsLoading { file: String, size_mb: u64 },
    /// Model successfully loaded
    Loaded { latency_ms: u64 },
    /// Component initialization failed
    Failed { error: String },
    /// Component health check
    HealthCheck { status: HealthStatus },
    /// VRAM allocation event
    VramAllocated { allocated_mb: u64, total_mb: u64 },
}

/// Health status for components
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum HealthStatus {
    /// Component fully operational
    Healthy,
    /// Component working but degraded (e.g., CPU fallback)
    Degraded,
    /// Component not available
    Unavailable,
    /// Component loading
    Loading,
}

// =============================================================================
// VOICE PAYLOADS (STT/TTS Observability)
// =============================================================================

/// Voice event payload
///
/// Tracks voice model discovery, loading, and usage events.
/// Enables UI to show voice setup progress and status.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VoicePayload {
    /// Event type
    pub event: VoiceEvent,
    /// STT (Whisper) readiness
    pub stt_ready: bool,
    /// TTS (Kokoro) readiness
    pub tts_ready: bool,
}

/// Voice event types
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum VoiceEvent {
    /// Voice model discovered during folder scan
    ModelDiscovered {
        /// "stt" or "tts"
        model_type: String,
        /// Model name (e.g., "whisper-medium")
        name: String,
        /// Whether model has all required files
        ready: bool,
    },
    /// Voice model selected by user
    ModelSelected {
        /// "stt" or "tts"
        model_type: String,
        /// Model ID
        id: String,
    },
    /// Voice model loading started
    ModelLoading {
        /// "stt" or "tts"
        model_type: String,
    },
    /// Voice model loaded successfully
    ModelLoaded {
        /// "stt" or "tts"
        model_type: String,
        /// Load time in milliseconds
        latency_ms: u64,
    },
    /// Voice model failed to load
    ModelFailed {
        /// "stt" or "tts"
        model_type: String,
        /// Error message
        error: String,
    },
    /// Transcription (STT) started
    TranscriptionStarted,
    /// Transcription (STT) completed
    TranscriptionComplete {
        /// Transcribed text
        text: String,
        /// Processing time in milliseconds
        duration_ms: u64,
    },
    /// Text-to-speech synthesis started
    SynthesisStarted {
        /// Length of text being synthesized
        text_len: usize,
    },
    /// Text-to-speech synthesis completed
    SynthesisComplete {
        /// Processing time in milliseconds
        duration_ms: u64,
    },
    /// Voice setup required - models not configured
    SetupRequired {
        /// User-friendly message
        message: String,
    },
}
