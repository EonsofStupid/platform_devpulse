//! Model discovery, registry, and download management.

pub mod discovery;
pub mod download;
pub mod manifest;
pub mod recommender;
pub mod registry;
pub mod scope;
pub mod search;
pub mod secrets;

pub use registry::{
    BackendType, ModelFormat, ModelMetadata, ModelRegistry, ModelRegistryEntry, ModelSource,
};
pub use scope::{resolve_bundle_dir, DownloadScope, PER_PROJECT_ROOT, UNSCOPED_PLACEHOLDER};
pub use search::{search_huggingface, HfFileInfo, HfSearchResult};
