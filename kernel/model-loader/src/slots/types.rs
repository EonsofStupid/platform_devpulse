//! Slot system types — hierarchical named positions for model assignment.

use super::persistence_class::PersistenceClass;
use crate::hardware::lanes::LaneKind;
use serde::{Deserialize, Serialize};

/// A slot is a named position where a model can be assigned.
/// Slots are hierarchical: `subsystem.purpose` convention.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct Slot {
    /// Unique identifier. Convention: `"subsystem.purpose"`.
    ///
    /// Examples: `"rag.embedder"`, `"minion.shared"`, `"chat.brain"`, `"voice.stt"`.
    pub id: String,

    /// Human-readable label for UI display.
    pub label: String,

    /// What kind of model this slot accepts.
    pub capability: ModelCapability,

    /// Preferred device placement.
    pub preferred_device: DevicePreference,

    /// Loading strategy — when should this model be loaded?
    pub loading: LoadingStrategy,

    /// Residency contract — how the budgeter treats this slot under
    /// memory pressure. `OnDemand` is fully evictable, `WarmStandby`
    /// evicts last, `AlwaysOn` is non-evictable.
    ///
    /// Defaults to `OnDemand` when missing from TOML — see
    /// [`PersistenceClass::default`].
    #[serde(default)]
    pub persistence_class: PersistenceClass,

    /// Which compute lane this slot is assigned to. Drives the
    /// backend pool routing and the lane-scoped capacity accounting.
    ///
    /// Defaults to `Vram` for GPU-preferred slots; TOML files override
    /// this on a per-slot basis. Serialised in lowercase to match the
    /// TOML key vocabulary (`vram` / `ddr` / `cpu` / `ssd`).
    #[serde(default = "default_lane_vram")]
    pub lane: LaneKind,

    /// Currently assigned model (registry entry ID), if any.
    pub assigned_model: Option<String>,

    /// Fallback slot ID. If this slot's model isn't loaded,
    /// try the fallback. Enables escalation chains.
    pub fallback: Option<String>,

    /// Which inference backend to use (overrides auto-detection).
    pub runtime: Option<crate::models::BackendType>,

    /// Default model filename for auto-assignment during setup.
    pub default_model: Option<String>,

    /// Slot IDs that must be loaded alongside this slot.
    #[serde(default)]
    pub requires: Vec<String>,

    /// Slot ID that this slot can replace when conditions are met.
    pub overrides: Option<String>,

    /// Whether this model is bundled with the app or user-managed.
    #[serde(default)]
    pub source_tier: ModelSourceTier,

    /// Backend-specific configuration (`voice_profile`, `vad`, `sample_rate`, etc.).
    #[serde(default)]
    pub extensions: std::collections::HashMap<String, String>,

    /// KV-cache and context controls applied at backend load time.
    /// Each backend adapter (llama.cpp FFI, mistral.rs, moshi) reads
    /// the fields it can support and ignores the rest with a debug log.
    /// Defaults to "use all runtime defaults" so existing slot configs
    /// without a `kv_cache` block keep loading unchanged.
    #[serde(default)]
    pub kv_cache: super::kv_cache::KvCacheConfig,

    /// Whether this slot is a platform built-in.
    ///
    /// Built-in slots are platform-essential services (vector store,
    /// primary encoder, search filter, wake-word detector). They live in
    /// the same slot table and use the same mutation path as every other
    /// slot — the devtool can toggle them, swap their model, reassign
    /// their lane, change their persistence class, all through the
    /// normal slot UI.
    ///
    /// The flag exists so the devtool can render two filtered views
    /// against the same data:
    ///
    /// - **System tab**: `slots.iter().filter(|s| s.builtin)` — shows
    ///   the platform essentials grouped together.
    /// - **Slots tab**: `slots.iter().filter(|s| !s.builtin)` — shows
    ///   the user-facing slots (chat brain, helpers, voice surfaces).
    ///
    /// Same data, two views. There is no second TOML file, no second
    /// loader, no second mutation path. Senior pattern: built-in is a
    /// property, not a parallel system.
    #[serde(default)]
    pub builtin: bool,
}

/// Default lane for slots that don't specify one — GPU-first since the
/// main brain and helpers live on VRAM. CPU-preferred slots override
/// this in their TOML entry.
fn default_lane_vram() -> LaneKind {
    LaneKind::Vram
}

/// Whether a slot's model ships with the app or is user-managed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum ModelSourceTier {
    /// Ships with the app binary. Auto-loads on boot from bundled path.
    /// User never downloads or manages these.
    Bundled {
        /// Path relative to `models_dir` (e.g. `"voice/kokoro/model_quantized.onnx"`).
        bundled_path: String,
    },
    /// User downloads and manages via Model Loader UI.
    UserManaged,
}

impl Default for ModelSourceTier {
    fn default() -> Self {
        Self::UserManaged
    }
}

/// What kind of inference a model supports.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum ModelCapability {
    /// LLM — chat, reasoning, translation.
    TextGeneration,
    /// Bi-encoder — vector generation.
    Embedding,
    /// Cross-encoder — relevance scoring.
    Reranking,
    /// Multimodal — image + text understanding.
    VisionLanguage,
    /// Image to vector (`SigLIP2` etc.).
    VisionEmbedding,
    /// Speech-to-text.
    SpeechToText,
    /// Text-to-speech.
    TextToSpeech,
    /// Neural audio codec (SNAC — speech token decoding).
    AudioDecoding,
}

/// Preferred device for a slot.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum DevicePreference {
    /// Must be GPU (generation models).
    Gpu,
    /// Prefer CPU (embedders, rerankers).
    Cpu,
    /// Try GPU, fall back to CPU.
    GpuWithCpuFallback,
    /// Loader decides based on VRAM budget.
    Any,
}

/// When should the model for this slot be loaded?
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum LoadingStrategy {
    /// Keep loaded while platform is active.
    Hot,
    /// Load proactively when conditions suggest need.
    Warm,
    /// Load when first request arrives, unload after idle.
    OnDemand,
    /// Load when a specific signal fires.
    Signal(String),
    /// Loaded/unloaded alongside a parent slot.
    Coupled {
        /// The parent slot ID that controls this slot's lifecycle.
        parent: String,
    },
}

impl std::fmt::Display for LoadingStrategy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Hot => write!(f, "hot"),
            Self::Warm => write!(f, "warm"),
            Self::OnDemand => write!(f, "on_demand"),
            Self::Signal(sig) => write!(f, "signal:{sig}"),
            Self::Coupled { parent } => write!(f, "coupled:{parent}"),
        }
    }
}

impl Slot {
    /// Extract the subsystem portion of the slot ID (everything before the first `.`).
    #[must_use]
    pub fn subsystem(&self) -> &str {
        self.id.split('.').next().unwrap_or(&self.id)
    }

    /// Validate slot ID format: must contain at least one `.` separator.
    /// Multi-segment IDs remain valid for future extensions, but the
    /// current platform voice baseline is the canonical `voice.tts` slot.
    #[must_use]
    pub fn is_valid_id(id: &str) -> bool {
        let parts: Vec<&str> = id.split('.').collect();
        parts.len() >= 2 && parts.iter().all(|p| !p.is_empty())
    }
}

impl std::fmt::Display for ModelCapability {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::TextGeneration => write!(f, "Text Generation"),
            Self::Embedding => write!(f, "Embedding"),
            Self::Reranking => write!(f, "Reranking"),
            Self::VisionLanguage => write!(f, "Vision Language"),
            Self::VisionEmbedding => write!(f, "Vision Embedding"),
            Self::SpeechToText => write!(f, "Speech to Text"),
            Self::TextToSpeech => write!(f, "Text to Speech"),
            Self::AudioDecoding => write!(f, "Audio Decoding"),
        }
    }
}

impl std::fmt::Display for DevicePreference {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Gpu => write!(f, "GPU"),
            Self::Cpu => write!(f, "CPU"),
            Self::GpuWithCpuFallback => write!(f, "GPU (CPU fallback)"),
            Self::Any => write!(f, "Auto"),
        }
    }
}
