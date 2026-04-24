//! Platform configuration.
//!
//! [`loader`] is the authoritative loader. `PlatformBootConfig::load` reads
//! `{data_dir}/platform.toml` if present, otherwise the compile-time
//! `DEFAULT_CONFIG` baked from `config/platform/**/*.toml` at build time.
//!
//! The peer subdirectories below ([`runtime`], [`stores`], [`runtimes`],
//! [`capabilities`], [`integrations`]) hold per-axis modules that the rest
//! of the engine consumes for typed access to specific config slices.

mod loader;

pub mod capabilities;
pub mod integrations;
pub mod runtime;
pub mod runtimes;
pub mod stores;

pub use loader::{
    retrieval_param_meta, sanitize_path, CacheServiceEntry, CatalogEntry, CatalogOption, DataScope,
    ExecutionLane, LaneToggle, LaneTraceConfig, ModelLoaderServiceEntry,
    OllamaSidecarServiceEntry, PlatformBootConfig, PlatformConfig, RetrievalConfig,
    RetrievalParamMeta, RetrievalPreset, ServiceEntry, SurrealdbSidecarServiceEntry,
    VectorServiceEntry, WindowsConfig,
};
