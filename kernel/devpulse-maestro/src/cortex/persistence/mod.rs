//! Persistence layer for Maestro
//!
//! Three embedded databases for different workloads:
//! - LibSQL: Relational data (users, settings, projects, messages)
//! - DuckDB: Analytics (user + AI metrics, telemetry)
//! - SurrealDB: Reasoning graph (knowledge, states, transitions)
//!
//! All adapters implement PersistenceAdapter for signal-based access
//! plus specialized traits for their specific use cases.

pub mod config;
pub mod traits;

// Database adapters
pub mod libsql;
pub mod duckdb;
pub mod surreal;

// Re-exports for convenience
pub use config::{PersistenceConfig, StoreKind, SurrealNamespace};
pub use traits::{AnalyticsAdapter, GraphAdapter, PersistenceAdapter, SqlAdapter, TypedPersistence};
pub use libsql::LibSqlAdapter;
pub use duckdb::DuckDbAdapter;
pub use surreal::SurrealAdapter;

use anyhow::Result;
use std::sync::Arc;

/// Unified persistence layer combining all databases
pub struct PersistenceLayer {
    config: PersistenceConfig,
    libsql: Option<Arc<LibSqlAdapter>>,
    duckdb: Option<Arc<DuckDbAdapter>>,
    surreal: Option<Arc<SurrealAdapter>>,
}

impl PersistenceLayer {
    /// Create a new persistence layer with the given config
    pub fn new(config: PersistenceConfig) -> Self {
        Self {
            config,
            libsql: None,
            duckdb: None,
            surreal: None,
        }
    }

    /// Initialize all databases
    pub async fn init(&mut self) -> Result<()> {
        // Ensure directories exist
        self.config.ensure_dirs()?;

        // Initialize LibSQL
        let libsql_path = self.config.store_path(StoreKind::LibSql);
        let libsql = LibSqlAdapter::open(&libsql_path).await?;
        self.libsql = Some(Arc::new(libsql));

        // Initialize DuckDB
        let duckdb_path = self.config.store_path(StoreKind::DuckDb);
        let duckdb = DuckDbAdapter::open(&duckdb_path)?;
        self.duckdb = Some(Arc::new(duckdb));

        // Initialize SurrealDB
        let surreal_path = self.config.store_path(StoreKind::Surreal);
        let surreal = SurrealAdapter::open(&surreal_path).await?;
        self.surreal = Some(Arc::new(surreal));

        Ok(())
    }

    /// Get the LibSQL adapter
    pub fn libsql(&self) -> Option<&Arc<LibSqlAdapter>> {
        self.libsql.as_ref()
    }

    /// Get the DuckDB adapter
    pub fn duckdb(&self) -> Option<&Arc<DuckDbAdapter>> {
        self.duckdb.as_ref()
    }

    /// Get the SurrealDB adapter
    pub fn surreal(&self) -> Option<&Arc<SurrealAdapter>> {
        self.surreal.as_ref()
    }

    /// Check if a store is initialized
    pub fn is_initialized(&self, kind: StoreKind) -> bool {
        match kind {
            StoreKind::LibSql => self.libsql.is_some(),
            StoreKind::DuckDb => self.duckdb.is_some(),
            StoreKind::Surreal => self.surreal.is_some(),
        }
    }

    /// Get the persistence config
    pub fn config(&self) -> &PersistenceConfig {
        &self.config
    }
}
