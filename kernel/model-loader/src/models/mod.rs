//! Model discovery, registry, and download management.

pub mod discovery;
pub mod download;
pub mod registry;

pub use registry::{BackendType, ModelFormat, ModelMetadata, ModelRegistryEntry, ModelSource};
