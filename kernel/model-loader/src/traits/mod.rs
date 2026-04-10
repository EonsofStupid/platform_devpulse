//! Consumer integration traits — the boundary between model-loader and its host app.

pub mod backend;
pub mod capability;
pub mod config;
pub mod errors;
pub mod events;

pub use backend::InferenceBackend;
pub use capability::{EmbeddingBackend, RerankerBackend, VisionEmbeddingBackend};
pub use config::{ConfigBackend, MemoryConfig};
pub use errors::{LoaderError, RecoverySuggestion};
pub use events::{LoaderEvent, LoaderEventSink, NullEventSink, TracingEventSink};
