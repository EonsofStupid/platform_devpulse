//! Model-loader MANAGEMENT layer — DevPulse-local, kernel-free.
//!
//! Relocated from `kernel/model-loader` during the kernel-severance. Owns
//! the DevPulse-local half of model management:
//!
//! - [`slots`] — the slot table (named model positions), defaults,
//!   fallback chains, KV-cache config, persistence classes, symlink
//!   contract.
//! - [`models`] — model discovery (candle-free GGUF header parse via
//!   `ggus`), the on-disk registry, per-model `devpulse.json` manifests,
//!   HuggingFace search + download (`hf-hub` + `reqwest`/`sha2`), and the
//!   tier recommender.
//! - [`loading`] — the shared model-status data types.
//! - [`traits`] — persistence + event-sink integration traits (and the
//!   inference-backend trait DEFINITIONS, which carry no linkage).
//! - [`voices`] — the TTS voice catalog (data, not synthesis).
//! - [`build_mode`] — the dev/production/customer build-mode flag.
//! - [`service`] — [`ModelLoaderService`], the management facade.
//!
//! Hardware-tier auto-config + VRAM budgeting live one level up in
//! [`crate::platform::hardware`]. NO inference backend is linked here —
//! candle/llama.cpp/ort/mistralrs/burn/sherpa all run on headless
//! Clyffy/GB10 over the wire.

pub mod build_mode;
pub mod loading;
pub mod models;
pub mod service;
pub mod slots;
pub mod traits;
pub mod voices;

pub use build_mode::BuildMode;
pub use service::ModelLoaderService;

pub use loading::{LoadParams, LoadingStage, MemoryFootprint, ModelStatus, SlotStatus};
pub use models::{
    resolve_bundle_dir, search_huggingface, BackendType, DownloadScope, HfFileInfo, HfSearchResult,
    ModelFormat, ModelMetadata, ModelRegistry, ModelRegistryEntry, ModelSource,
};
pub use slots::{
    load_default_slots, DevicePreference, KvCacheConfig, KvCacheQuant, LoadingStrategy,
    ModelCapability, ModelSourceTier, PersistenceClass, RopeScalingMode, Slot, SlotDefaultsError,
    SlotRegistry, YarnConfig, BASELINE_SLOT_IDS,
};
pub use traits::{
    ConfigBackend, EmbeddingBackend, InferenceBackend, LoaderError, LoaderEvent, LoaderEventSink,
    MemoryConfig, NullEventSink, RebindReason, RecoverySuggestion, RerankerBackend,
    RuntimeFingerprint, TracingEventSink, VisionEmbeddingBackend,
};
pub use voices::{VoiceEntry, VoiceRegistry};
