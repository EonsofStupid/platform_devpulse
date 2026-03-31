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
pub mod hardware;
pub mod loading;
pub mod models;
pub mod service;
pub mod slots;
pub mod traits;

// Top-level re-exports for convenience
pub use service::ModelLoaderService;

// Slot types
pub use slots::{DevicePreference, LoadingStrategy, ModelCapability, Slot, SlotRegistry};

// Model types
pub use models::{BackendType, ModelFormat, ModelMetadata, ModelRegistryEntry, ModelSource};

// Loading types
pub use loading::{LoadParams, LoadingStage, MemoryFootprint, ModelStatus, SlotStatus};

// Hardware types
pub use hardware::{
    AutoConfig, HardwareMetrics, HardwareTier, SlotRecommendation, VramBudget,
};

// Trait re-exports
pub use traits::{
    ConfigBackend, InferenceBackend, LoaderError, LoaderEvent, LoaderEventSink,
    MemoryConfig, NullEventSink, RecoverySuggestion, TracingEventSink,
};
