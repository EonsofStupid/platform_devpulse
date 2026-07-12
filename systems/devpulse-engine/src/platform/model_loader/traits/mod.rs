//! Consumer integration traits — the boundary between the model-loader
//! management layer and its host (persistence + event sink).
//!
//! The inference-backend trait DEFINITIONS ([`InferenceBackend`],
//! [`EmbeddingBackend`], [`RerankerBackend`], [`VisionEmbeddingBackend`])
//! are pure type contracts with no linkage — the concrete IMPLs are
//! Clyffy's (clyffyos repo) and are not part of this crate.

pub mod backend;
pub mod capability;
pub mod config;
pub mod errors;
pub mod events;

pub use backend::InferenceBackend;
pub use capability::{EmbeddingBackend, RerankerBackend, VisionEmbeddingBackend};
pub use config::{ConfigBackend, MemoryConfig};
pub use errors::{LoaderError, RecoverySuggestion};
pub use events::{
    LoaderEvent, LoaderEventSink, NullEventSink, RebindReason, RuntimeFingerprint, TracingEventSink,
};
