//! # Internal Events
//!
//! Every event the kernel can emit. These are the raw, unfiltered
//! signals that flow through `tokio::broadcast` before hitting the facade.
//!
//! Design principle: **enumerate everything**. If the kernel does it internally,
//! there's a variant here. The whitelist controls what surfaces — not this enum.
//!
//! All variants carry enough context to translate into a `SurfaceEvent`
//! without needing to query external state.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::platform::services::ServiceRole;

// ─────────────────────────────────────────────────────────────────
// Event category (used by whitelist for allow/deny filtering)
// ─────────────────────────────────────────────────────────────────

/// Coarse-grained category for whitelist filtering.
/// Each `InternalEvent` variant maps to exactly one category.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum EventCategory {
    ModelLifecycle,
    MinionSignal,
    RuminationTrace,
    CostarAssembly,
    GovernanceDecision,
    SignalRouting,
    ResourceArbiter,
    InferenceMetrics,
    /// Sidecar lifecycle phase transitions — preflight, spawn, ready,
    /// freeze (hot-update reserved), shutdown, fail. Mirror of the
    /// `sidecar.lifecycle` tracing taxonomy in
    /// [`crate::platform::services::lifecycle_phase`]. Both layers must
    /// emit in lockstep — see `feedback_dual_observability.md`.
    SidecarLifecycle,
    /// User-scope routing config changed (escalation chain, latency
    /// tuning, response source). Engine consumers (chat dispatcher,
    /// audio pipeline, voice brain orchestrator) subscribe to react
    /// without polling.
    RoutingConfig,
}

// ─────────────────────────────────────────────────────────────────
// Supporting types
// ─────────────────────────────────────────────────────────────────

/// Registered model slot identifiers.
/// Maps 1:1 to engine slot registry.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SlotId {
    ChatBrain,
    MinionShared,
    MinionEscalation,
    RagEmbedder,
    RagReranker,
    VisionEmbedder,
    VoiceStt,
    VoiceTts,
    VoiceBrain,
    Custom(String),
}

/// Model loading states.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LoadingState {
    /// Not loaded anywhere. Weights on disk only.
    Cold,
    /// Weights cached on disk, fast reload. GGUF mmap ready.
    Warm,
    /// Weights in memory + session created. Activation <500ms.
    Standby,
    /// Active on GPU. Inference-ready.
    Hot,
}

/// Target compute device for a model.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Device {
    Gpu { index: u8 },
    Cpu,
}

/// Why a model is being unloaded.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UnloadReason {
    UserRequested,
    VramPressure { free_gb: f64, needed_gb: f64 },
    IdleTimeout { idle_seconds: u64, threshold: u64 },
    Shutdown,
    Error(String),
}

/// What the arbiter decided to do under pressure.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PressureAction {
    EvictToRam {
        slot: SlotId,
    },
    DowngradeQuant {
        slot: SlotId,
        from: String,
        to: String,
    },
    RequestRestart,
    NoAction,
}

/// VRAM allocation mode from `ResourceArbiter`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum AllocationMode {
    /// No GPU: everything on CPU.
    CpuOnly,
    /// 6GB: 4B brain, CPU assist heavy.
    Budget,
    /// 8GB: 7B brain, embedder on CPU.
    Standard,
    /// 12GB: 14B fits tight, smaller KV cache.
    High,
    /// 16GB+: everything on GPU, all models hot.
    Flagship,
}

/// Minion identifiers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum MinionId {
    Clyffy,
    Guardian,
    Enforcer,
    Diary,
    Psych,
    Teacher,
    Scribe,
    Vision,
    Researcher,
}

/// Mood labels from scoring.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MoodLabel {
    Enraged,
    Frustrated,
    Neutral,
    Encouraged,
    Happy,
    PicassoMode,
}

/// Gate traffic light.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GateColor {
    Red,
    Teal,
    Green,
}

/// What a minion observed (generic envelope).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Observation {
    pub kind: String,
    pub summary: String,
    pub confidence: f32,
    pub raw_json: Option<String>,
}

/// Processing layer.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProcessingLayer {
    Keystroke,
    Pause,
    Send,
    Background,
}

/// Signal sources in the platform.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SignalSource {
    UserInput,
    FileWatcher,
    ProcessMonitor,
    ScreenCapture,
    VoiceInput,
    Timer,
    Minion(MinionId),
    Custom(String),
}

/// Signal kind (coarse classification of what happened).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SignalKind {
    ChatMessage,
    FileCreated,
    FileModified,
    FileMoved,
    ToolLaunched(String),
    ToolClosed(String),
    ScreenState,
    Transcription,
    VisualEmbedding,
    Command,
    Custom(String),
}

/// Governance action taken.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GovernanceAction {
    Blocked,
    Warned,
    Logged,
    AutoFixed,
}

/// Drift type detected by governance.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DriftType {
    Duplication,
    OutOfBoundaryWrite,
    AbandonedTodo,
    PatternViolation(String),
    DeleteWithoutBackup,
}

/// Tone level applied to prompt assembly.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ToneLevel {
    Technical,
    Neutral,
    Empathetic,
    Encouraging,
    Celebratory,
}

// ─────────────────────────────────────────────────────────────────
// The main event enum
// ─────────────────────────────────────────────────────────────────

/// Every internal event the kernel can emit.
///
/// Events are sent via `tokio::broadcast` which requires `Clone`.
/// The `Observation::raw_json` field is the heaviest payload — consider
/// `Arc<str>` if profiling shows clone cost matters.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InternalEvent {
    // ── Model lifecycle ─────────────────────────────────────────
    ModelLoadStarted {
        slot: SlotId,
        path: PathBuf,
        target_device: Device,
        estimated_vram_mb: u32,
    },
    ModelLoadComplete {
        slot: SlotId,
        vram_used_mb: u32,
        load_time_ms: u64,
    },
    ModelUnloadStarted {
        slot: SlotId,
        reason: UnloadReason,
    },
    ModelUnloadComplete {
        slot: SlotId,
        vram_freed_mb: u32,
    },
    ModelStateChanged {
        slot: SlotId,
        from: LoadingState,
        to: LoadingState,
    },
    VramPressureDetected {
        free_gb: f64,
        threshold_gb: f64,
        action: PressureAction,
    },

    // ── Minion signals ──────────────────────────────────────────
    MinionActivated {
        minion: MinionId,
        trigger: SignalKind,
    },
    MinionObservation {
        minion: MinionId,
        observation: Observation,
    },
    MinionMoodUpdate {
        mood_score: f32,
        label: MoodLabel,
    },

    // ── Processing traces ───────────────────────────────────────
    ProcessingLayerFired {
        layer: ProcessingLayer,
        latency_ms: u64,
    },
    ContextRetrieved {
        query_hash: u64,
        results_count: usize,
        top_score: f32,
    },
    EmbeddingComputed {
        input_tokens: usize,
        latency_ms: u64,
    },
    RerankerScored {
        candidates: usize,
        kept: usize,
        latency_ms: u64,
    },

    // ── Prompt assembly ─────────────────────────────────────────
    PromptAssembled {
        context_tokens: usize,
        objective_summary: String,
        tone: ToneLevel,
    },
    PromptGateResult {
        gate: GateColor,
        reason: String,
    },
    PromptTranslated {
        user_words: usize,
        assembled_tokens: usize,
    },

    // ── Governance ──────────────────────────────────────────────
    GovernanceRuleTriggered {
        rule_id: String,
        action: GovernanceAction,
        detail: String,
    },
    DriftDetected {
        file: PathBuf,
        drift_type: DriftType,
    },
    AntiPatternBlocked {
        pattern: String,
        suggestion: String,
    },

    // ── Signal routing ──────────────────────────────────────────
    SignalReceived {
        source: SignalSource,
        kind: SignalKind,
    },
    SignalRouted {
        from: SignalSource,
        to: MinionId,
    },

    // ── Resource arbiter ────────────────────────────────────────
    AllocationChanged {
        from: AllocationMode,
        to: AllocationMode,
        free_vram_gb: f64,
    },

    // ── Inference metrics ───────────────────────────────────────
    TokenGenerated {
        slot: SlotId,
        tokens_per_sec: f32,
        total_tokens: usize,
    },
    KvCacheUsage {
        slot: SlotId,
        used_mb: u32,
        max_mb: u32,
    },
    InferenceComplete {
        slot: SlotId,
        total_tokens: usize,
        latency_ms: u64,
    },

    // ── Sidecar lifecycle ───────────────────────────────────────
    /// A managed sidecar transitioned between lifecycle phases.
    ///
    /// Mirrors the structured `sidecar.lifecycle` tracing event so
    /// minion subscribers, surface-events whitelist, and governance
    /// reactors can observe sidecar state without parsing log lines.
    /// Emitted in lockstep with the `emit_lifecycle!` macro — see
    /// `emit_lifecycle_dual!` in `platform::services` for the helper
    /// that enforces 1:1 emission.
    SidecarPhaseTransition {
        /// Which sidecar emitted the event.
        service: ServiceRole,
        /// Phase identifier — one of the constants in
        /// [`crate::platform::services::lifecycle_phase`]
        /// (e.g. `"preflight"`, `"ready"`, `"shutdown"`).
        phase: String,
        /// Human-readable summary — bind addr, error, elapsed time.
        detail: String,
    },

    // ── Routing config persistence ──────────────────────────────
    /// User-scope routing config persisted via `Platform::routing_config_save`.
    ///
    /// Emitted in lockstep with the `routing.config` `tracing::info!`
    /// event — per `feedback_dual_observability.md`, persistence
    /// surfaces are observable on BOTH the tracing taxonomy AND the
    /// `InternalEvent` broadcast bus. Subscribers (chat dispatcher,
    /// audio pipeline, voice brain orchestrator) react without polling.
    RoutingConfigChanged {
        /// Selected response source / Claude lane. Round-tripped to
        /// the kernel `assistant.routing.mode` SSOT on save so the
        /// existing `inner_get_inference_provider` consumer is gated
        /// by this surface.
        response_source: crate::platform::services::routing_config::InferenceProvider,
        /// Number of escalation tiers currently `enabled` in the chain.
        enabled_tier_count: u32,
        /// Audio-pipeline buffer at time of persist (ms) — engine-stored
        /// surface; consumer is the audio pipeline (`audio` service).
        audio_buffer_ms: u32,
        /// VAD silence threshold at time of persist (ms).
        vad_silence_ms: u32,
        /// Stream chunk size at time of persist (tokens).
        stream_chunk_size: u32,
    },
}

impl InternalEvent {
    /// Which category this event belongs to.
    pub fn category(&self) -> EventCategory {
        match self {
            Self::ModelLoadStarted { .. }
            | Self::ModelLoadComplete { .. }
            | Self::ModelUnloadStarted { .. }
            | Self::ModelUnloadComplete { .. }
            | Self::ModelStateChanged { .. }
            | Self::VramPressureDetected { .. } => EventCategory::ModelLifecycle,

            Self::MinionActivated { .. }
            | Self::MinionObservation { .. }
            | Self::MinionMoodUpdate { .. } => EventCategory::MinionSignal,

            Self::ProcessingLayerFired { .. }
            | Self::ContextRetrieved { .. }
            | Self::EmbeddingComputed { .. }
            | Self::RerankerScored { .. } => EventCategory::RuminationTrace,

            Self::PromptAssembled { .. }
            | Self::PromptGateResult { .. }
            | Self::PromptTranslated { .. } => EventCategory::CostarAssembly,

            Self::GovernanceRuleTriggered { .. }
            | Self::DriftDetected { .. }
            | Self::AntiPatternBlocked { .. } => EventCategory::GovernanceDecision,

            Self::SignalReceived { .. } | Self::SignalRouted { .. } => EventCategory::SignalRouting,

            Self::AllocationChanged { .. } => EventCategory::ResourceArbiter,

            Self::TokenGenerated { .. }
            | Self::KvCacheUsage { .. }
            | Self::InferenceComplete { .. } => EventCategory::InferenceMetrics,

            Self::SidecarPhaseTransition { .. } => EventCategory::SidecarLifecycle,

            Self::RoutingConfigChanged { .. } => EventCategory::RoutingConfig,
        }
    }
}
