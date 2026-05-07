//! Persistence + resource adapters for Clyffy.
//!
//! Every external resource that the platform touches lives here as a
//! cortex adapter, regardless of whether it is a "database" in the
//! strict sense. The naming is historical (persistence = the SSOT for
//! where-we-talk-to-something-external) and covers:
//!
//! - `LibSQL`: Relational data (users, settings, projects, messages).
//! - `DuckDB`: Analytics (user + AI metrics, telemetry).
//! - `SurrealDB`: Graph store — WS client to the managed child process.
//! - `Moka`: In-memory cache (hot data, TTL-based eviction).
//! - `RRO`: Vector similarity search (embedded Qdrant — two-tier retrieval).
//! - `Ollama`: Managed child process — local inference runtime.
//! - `Whisper`, `Kokoros`, `Embedder`: local audio + embedding runtimes.
//!
//! Managed adapters use the shared `port_alloc` helper for probe /
//! attach / bump. Engine facades wrap each adapter with lifecycle
//! plumbing (boot, health, shutdown) per the project IP-boundary rule.

pub mod config;
pub mod traits;

// Port allocation (shared by every sidecar).
pub mod port_alloc;

// Embedded deps — siblings of each other, composed by the
// layman entries `cortex::rro` and (for the constrained-decoding
// runtime) `cortex::llguidance`. Each in its own folder per
// `project_devtool_modular_layout.md`.
pub mod burn;
pub mod duckdb;
#[cfg(feature = "candle")]
pub mod embedder;
pub mod encoder;
pub mod libsql;
pub mod moka;
#[cfg(feature = "rro")]
pub mod rro;
pub mod surreal;
#[cfg(feature = "candle")]
pub mod whisper;

// Managed child-process runtimes
pub mod ollama;

// Re-exports for convenience
pub use config::{PersistenceConfig, StoreKind, SurrealNamespace};
pub use duckdb::DuckDbAdapter;
#[cfg(feature = "candle")]
pub use embedder::CandleEmbedder;
pub use libsql::LibSqlAdapter;
pub use moka::{MokaAdapter, MokaCacheConfig};
pub use ollama::{OllamaAdapter, OllamaConfig, OllamaModel};
pub use port_alloc::{Disposition, PortAllocation};
#[cfg(feature = "rro")]
pub use rro::RroAdapter;
pub use surreal::{
    ScopedGraphHandle, SurrealAdapter, SurrealConfig, SurrealLifecycle,
};
pub use traits::{
    AnalyticsAdapter, CacheAdapter, GraphAdapter, PersistenceAdapter, SparseVector, SqlAdapter,
    SqlRow, SqlValue, TypedPersistence, VectorAdapter, VectorMatch,
};
#[cfg(feature = "candle")]
pub use whisper::WhisperAdapter;

// `PersistenceLayer` removed: it predated the engine-driven boot
// pipeline and had zero callers anywhere in the workspace. Engine
// boot constructs each adapter directly via its scoped constructor
// (`LibSqlAdapter::open_with_schema`, `DuckDbAdapter::open_with_schema`,
// `SurrealLifecycle::boot`). Test scaffolding lives in each
// adapter's own `#[cfg(test)]` module.
