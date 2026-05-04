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
    ScopedGraphHandle, SurrealAdapter, SurrealConfig, SurrealEndpoint, SurrealLifecycle,
};
pub use traits::{
    AnalyticsAdapter, CacheAdapter, GraphAdapter, PersistenceAdapter, SparseVector, SqlAdapter,
    SqlRow, SqlValue, TypedPersistence, VectorAdapter, VectorMatch,
};
#[cfg(feature = "candle")]
pub use whisper::WhisperAdapter;

use anyhow::Result;
use std::sync::Arc;

/// Unified persistence layer combining all databases.
///
/// This struct predates the engine-driven boot pipeline and is no
/// longer the primary wiring path — engine boot constructs adapters
/// directly via their `connect` / `open` / `boot` constructors. Left
/// here for low-level tests that want a single lazy-init container.
pub struct PersistenceLayer {
    config: PersistenceConfig,
    libsql: Option<Arc<LibSqlAdapter>>,
    duckdb: Option<Arc<DuckDbAdapter>>,
    surreal: Option<Arc<SurrealAdapter>>,
    moka: Option<Arc<MokaAdapter>>,
    #[cfg(feature = "rro")]
    rro: Option<Arc<RroAdapter>>,
}

impl PersistenceLayer {
    /// Create a new persistence layer with the given config.
    pub fn new(config: PersistenceConfig) -> Self {
        Self {
            config,
            libsql: None,
            duckdb: None,
            surreal: None,
            moka: None,
            #[cfg(feature = "rro")]
            rro: None,
        }
    }

    /// Initialize the file-backed stores (`LibSQL` + `DuckDB`).
    ///
    /// `SurrealDB` is intentionally not part of `init()` — it is a client
    /// to a managed child process, so callers must pass a ready `SurrealEndpoint`
    /// via [`Self::connect_surreal`].
    ///
    /// # Errors
    /// Returns error if any file-backed adapter fails to initialize.
    pub async fn init(&mut self) -> Result<()> {
        self.config.ensure_dirs()?;

        let libsql_path = self.config.store_path(StoreKind::LibSql);
        let libsql = LibSqlAdapter::open(&libsql_path).await?;
        self.libsql = Some(Arc::new(libsql));

        let duckdb_path = self.config.store_path(StoreKind::DuckDb);
        let duckdb = DuckDbAdapter::open(&duckdb_path)?;
        self.duckdb = Some(Arc::new(duckdb));

        Ok(())
    }

    /// Get the `LibSQL` adapter.
    pub fn libsql(&self) -> Option<&Arc<LibSqlAdapter>> {
        self.libsql.as_ref()
    }

    /// Get the `DuckDB` adapter.
    pub fn duckdb(&self) -> Option<&Arc<DuckDbAdapter>> {
        self.duckdb.as_ref()
    }

    /// Get the `SurrealDB` adapter.
    pub fn surreal(&self) -> Option<&Arc<SurrealAdapter>> {
        self.surreal.as_ref()
    }

    /// Get the `Moka` cache adapter.
    pub fn moka(&self) -> Option<&Arc<MokaAdapter>> {
        self.moka.as_ref()
    }

    /// Get the `RRO` vector store adapter.
    #[cfg(feature = "rro")]
    pub fn rro(&self) -> Option<&Arc<RroAdapter>> {
        self.rro.as_ref()
    }

    /// Check if a store is initialized.
    pub fn is_initialized(&self, kind: StoreKind) -> bool {
        match kind {
            StoreKind::LibSql => self.libsql.is_some(),
            StoreKind::DuckDb => self.duckdb.is_some(),
            StoreKind::Surreal => self.surreal.is_some(),
            StoreKind::Moka => self.moka.is_some(),
            #[cfg(feature = "rro")]
            StoreKind::Rro => self.rro.is_some(),
            #[cfg(not(feature = "rro"))]
            StoreKind::Rro => false,
        }
    }

    /// Get the persistence config.
    pub fn config(&self) -> &PersistenceConfig {
        &self.config
    }

    // ─────────────────────────────────────────────────────────
    // Granular initialization
    // ─────────────────────────────────────────────────────────

    /// Ensure all database directories exist.
    ///
    /// # Errors
    /// Returns error if directory creation fails.
    pub fn ensure_dirs(&self) -> Result<()> {
        self.config.ensure_dirs()?;
        Ok(())
    }

    /// Initialize `LibSQL` only.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema fails.
    pub async fn init_libsql(&mut self) -> Result<()> {
        let path = self.config.store_path(StoreKind::LibSql);
        let adapter = LibSqlAdapter::open(&path).await?;
        self.libsql = Some(Arc::new(adapter));
        Ok(())
    }

    /// Initialize `DuckDB` only.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema fails.
    pub fn init_duckdb(&mut self) -> Result<()> {
        let path = self.config.store_path(StoreKind::DuckDb);
        let adapter = DuckDbAdapter::open(&path)?;
        self.duckdb = Some(Arc::new(adapter));
        Ok(())
    }

    /// Connect `SurrealDB` as a client to a managed sidecar.
    ///
    /// # Errors
    /// Returns error if the WS connection or schema init fails.
    pub async fn connect_surreal(&mut self, endpoint: &SurrealEndpoint) -> Result<()> {
        let adapter = SurrealAdapter::connect(endpoint).await?;
        self.surreal = Some(Arc::new(adapter));
        Ok(())
    }

    // ─────────────────────────────────────────────────────────
    // Health checks
    // ─────────────────────────────────────────────────────────

    /// Ping `LibSQL` — executes `SELECT 1`.
    ///
    /// # Errors
    /// Returns error if `LibSQL` is not initialized or unreachable.
    pub async fn ping_libsql(&self) -> Result<()> {
        if let Some(adapter) = &self.libsql {
            adapter.ping().await
        } else {
            anyhow::bail!("LibSQL not initialized")
        }
    }

    /// Ping `DuckDB` — executes `SELECT 1`.
    ///
    /// # Errors
    /// Returns error if `DuckDB` is not initialized or unreachable.
    pub async fn ping_duckdb(&self) -> Result<()> {
        if let Some(adapter) = &self.duckdb {
            adapter.ping().await
        } else {
            anyhow::bail!("DuckDB not initialized")
        }
    }

    /// Ping `SurrealDB` — executes `SELECT 1` to verify connection.
    ///
    /// # Errors
    /// Returns error if `SurrealDB` is not initialized or unreachable.
    pub async fn ping_surreal(&self) -> Result<()> {
        if let Some(adapter) = &self.surreal {
            adapter.ping().await
        } else {
            anyhow::bail!("SurrealDB not initialized")
        }
    }

    /// Initialize `Moka` in-memory cache.
    pub fn init_moka(&mut self, config: MokaCacheConfig) {
        self.moka = Some(Arc::new(MokaAdapter::new(config)));
    }

    /// Ping `Moka` — always succeeds if initialized.
    ///
    /// # Errors
    /// Returns error if `Moka` is not initialized.
    pub async fn ping_moka(&self) -> Result<()> {
        if let Some(adapter) = &self.moka {
            adapter.ping().await
        } else {
            anyhow::bail!("Moka cache not initialized")
        }
    }

    /// Initialize `RRO` vector store.
    ///
    /// # Errors
    /// Returns error if the vector store cannot be opened.
    #[cfg(feature = "rro")]
    pub async fn init_rro(&mut self) -> Result<()> {
        let path = self.config.store_path(StoreKind::Rro);
        let adapter = RroAdapter::open(&path).await?;
        self.rro = Some(Arc::new(adapter));
        Ok(())
    }

    /// Ping `RRO` — health check.
    ///
    /// # Errors
    /// Returns error if `RRO` is not initialized or unreachable.
    #[cfg(feature = "rro")]
    pub async fn ping_rro(&self) -> Result<()> {
        if let Some(adapter) = &self.rro {
            adapter.ping().await
        } else {
            anyhow::bail!("RRO not initialized")
        }
    }
}
