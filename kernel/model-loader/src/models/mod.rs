//! Model discovery, registry, and download management.

pub mod discovery;
pub mod download;
pub mod manifest;
pub mod recommender;
pub mod registry;
pub mod search;
pub mod secrets;

pub use registry::{
    BackendType, ModelFormat, ModelMetadata, ModelRegistry, ModelRegistryEntry, ModelSource,
};
