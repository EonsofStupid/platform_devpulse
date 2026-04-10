//! # model-loader
//!
//! Self-enclosed model management crate. Zero DevPulse dependencies.
//!
//! Manages model discovery, registry, slot assignment, hardware detection,
//! VRAM budget planning, and inference backend routing.
//!
//! Consumers implement [`traits::ConfigBackend`] and [`traits::LoaderEventSink`]
//! to wire into their own persistence and event systems.

pub mod backends;
pub mod build_mode;
pub mod built_ins;
pub mod hardware;
pub mod loading;
pub mod models;
pub mod service;
pub mod slots;
pub mod traits;
pub mod voices;
pub mod wizard;

// Top-level re-exports for convenience
pub use build_mode::BuildMode;
pub use built_ins::{load_default_built_ins, BuiltIn, BuiltInsError};
pub use service::ModelLoaderService;

// Inference bridge types
pub use backends::bridge::{InferenceHandle, InferenceResponse};

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
pub use backends::phoneme::{KokoroVocab, text_to_phonemes, text_to_kokoro_ids};

// Slot types
pub use slots::{
    load_default_slots, DevicePreference, LoadingStrategy, ModelCapability, ModelSourceTier,
    PersistenceClass, Slot, SlotDefaultsError, SlotRegistry, BASELINE_SLOT_IDS,
};

// Model types
pub use models::{
    BackendType, ModelFormat, ModelMetadata, ModelRegistry, ModelRegistryEntry, ModelSource,
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
pub use models::search::{HfFileInfo, HfSearchResult, search_huggingface};

// Trait re-exports
pub use traits::{
    ConfigBackend, EmbeddingBackend, InferenceBackend, LoaderError, LoaderEvent, LoaderEventSink,
    MemoryConfig, NullEventSink, RecoverySuggestion, RerankerBackend, TracingEventSink,
    VisionEmbeddingBackend,
};
