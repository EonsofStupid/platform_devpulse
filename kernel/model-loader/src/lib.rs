//! # model-loader
//!
//! Self-enclosed model management crate. Zero `DevPulse` dependencies.
//!
//! Manages model discovery, registry, slot assignment, hardware detection,
//! VRAM budget planning, and inference backend routing.
//!
//! Consumers implement [`traits::ConfigBackend`] and [`traits::LoaderEventSink`]
//! to wire into their own persistence and event systems.

pub mod assistant;
pub mod backends;
pub mod build_mode;
pub mod hardware;
pub mod loading;
pub mod models;
pub mod registry;
pub mod service;
pub mod slots;
pub mod traits;
pub mod voices;
pub mod wizard;

// Top-level re-exports for convenience
pub use assistant::{
    AssistantAction, AssistantConfig, IdentityConfig, KeywordActionEntry, OffloadConfig, TtsConfig,
    VoiceBrainConfig, VoiceCloneEntry, WakeConfig, WindowConfig,
};
pub use build_mode::BuildMode;
pub use service::ModelLoaderService;

// Inference bridge types
pub use backends::bridge::{InferenceHandle, InferenceResponse};

// Backend routing
pub use backends::router::llamacpp_supports_architecture;

// Voice backend types
pub use backends::voice::{AudioDecoderBackend, AudioSamples, SttBackend, TtsBackend};

// Voice registry — SSOT for TTS voice catalog
pub use voices::{VoiceEntry, VoiceRegistry};

// Capability backend types — embedder, reranker, vision encoder
pub use backends::candle::SigLipVision;
#[cfg(feature = "ort-backend")]
pub use backends::ort::embedder::Qwen3Embedder;
#[cfg(feature = "ort-backend")]
pub use backends::ort::reranker::Qwen3Reranker;

// Alternate TTS backend (feature-gated)
pub use backends::piper::PiperTts;

// Phoneme helpers
pub use backends::phoneme::{text_to_kokoro_ids, text_to_phonemes, KokoroVocab};

// Slot types
pub use slots::{
    load_default_slots, DevicePreference, KvCacheConfig, KvCacheQuant, LoadingStrategy,
    ModelCapability, ModelSourceTier, PersistenceClass, RopeScalingMode, Slot,
    SlotDefaultsError, SlotRegistry, YarnConfig, BASELINE_SLOT_IDS,
};

// Model types
pub use models::{
    BackendType, DownloadScope, ModelFormat, ModelMetadata, ModelRegistry, ModelRegistryEntry,
    ModelSource,
};

// Loading types
pub use loading::{LoadParams, LoadingStage, MemoryFootprint, ModelStatus, SlotStatus};

// Hardware types
pub use hardware::{
    load_default_presets, AutoConfig, BrainSwapPolicy, HardwareMetrics, HardwareMonitor,
    HardwareTier, LaneAllocation, LaneBudget, LaneCapacity, LaneKind, LaneStatus, PresetBlueprint,
    PresetsError, SlotRecommendation, VramBudget,
};

// Wizard types — copy, tier display, tooltips
pub use wizard::{
    ActivateCopy, BrowseCopy, CompletionCopy, CustomizeCopy, GreetingCopy, HardwareCopy,
    ModelsCopy, ProfileCopy, ScanningCopy, StepTooltips, TierDisplay, TierRole, TooltipEntry,
    WizardCopy,
};

// Search types + function
pub use models::search::{search_huggingface, HfFileInfo, HfSearchResult};

// Trait re-exports
pub use traits::{
    ConfigBackend, EmbeddingBackend, InferenceBackend, LoaderError, LoaderEvent, LoaderEventSink,
    MemoryConfig, NullEventSink, RebindReason, RecoverySuggestion, RerankerBackend,
    RuntimeFingerprint, TracingEventSink, VisionEmbeddingBackend,
};
