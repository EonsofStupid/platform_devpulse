//! Persistence configuration and path resolution
//!
//! Defines `StoreKind` for database routing and path resolution
//! for embedded database files.

use std::path::PathBuf;

/// Database store types available in the platform
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum StoreKind {
    /// `LibSQL` - relational data, users, settings, projects.
    LibSql,
    /// `DuckDB` - analytics, user + AI metrics.
    DuckDb,
    /// `SurrealDB` - reasoning system graph.
    Surreal,
    /// `Moka` - in-memory cache (no disk).
    Moka,
    /// `RRO` - vector similarity search (embedded Qdrant).
    Rro,
}

impl StoreKind {
    /// Get the subdirectory name for this store
    pub fn subdir(&self) -> &'static str {
        match self {
            StoreKind::LibSql => "libsql",
            StoreKind::DuckDb => "duckdb",
            StoreKind::Surreal => "surreal",
            StoreKind::Moka => "",
            StoreKind::Rro => "rro",
        }
    }

    /// Get the default filename for this store
    pub fn default_filename(&self) -> &'static str {
        match self {
            StoreKind::LibSql => "platform.db",
            StoreKind::DuckDb => "analytics.duckdb",
            StoreKind::Surreal => "reasoning",
            StoreKind::Moka => "",
            StoreKind::Rro => "vectors",
        }
    }

    /// Whether this store persists to disk.
    pub fn is_persistent(&self) -> bool {
        !matches!(self, StoreKind::Moka)
    }
}

/// Configuration for the persistence layer
#[derive(Debug, Clone)]
pub struct PersistenceConfig {
    /// Root data directory (e.g., `{app_root}/data/platform/`).
    pub data_root: PathBuf,
}

impl PersistenceConfig {
    /// Create a new persistence config with the given data root
    pub fn new(data_root: impl Into<PathBuf>) -> Self {
        Self {
            data_root: data_root.into(),
        }
    }

    /// Get the path for a specific store
    pub fn store_path(&self, kind: StoreKind) -> PathBuf {
        self.data_root
            .join(kind.subdir())
            .join(kind.default_filename())
    }

    /// Get the directory for a specific store
    pub fn store_dir(&self, kind: StoreKind) -> PathBuf {
        self.data_root.join(kind.subdir())
    }

    /// Ensure all store directories exist (skips in-memory stores).
    ///
    /// # Errors
    /// Returns error if directory creation fails.
    pub fn ensure_dirs(&self) -> std::io::Result<()> {
        for kind in [StoreKind::LibSql, StoreKind::DuckDb, StoreKind::Surreal, StoreKind::Rro] {
            if kind.is_persistent() {
                std::fs::create_dir_all(self.store_dir(kind))?;
            }
        }
        Ok(())
    }
}

impl Default for PersistenceConfig {
    fn default() -> Self {
        // Default to ./data/platform/ relative to current dir
        Self::new("./data/platform")
    }
}

/// `SurrealDB` namespace configuration.
/// Follows: maestro/devpulse/reasoning/ pattern with sub-categories.
pub struct SurrealNamespace {
    /// Namespace name.
    pub namespace: &'static str,
    /// Database name within namespace.
    pub database: &'static str,
}

impl SurrealNamespace {
    /// Main reasoning namespace
    pub const REASONING: Self = Self {
        namespace: "maestro",
        database: "devpulse",
    };
}

/// Reasoning graph tables in `SurrealDB`.
pub struct ReasoningTables;

impl ReasoningTables {
    /// Table name for reasoning graph nodes.
    pub const NODES: &'static str = "reasoning:nodes";
    /// Table name for reasoning graph edges.
    pub const EDGES: &'static str = "reasoning:edges";
    /// Table name for reasoning graph states.
    pub const STATES: &'static str = "reasoning:states";
    /// Table name for reasoning graph state transitions.
    pub const TRANSITIONS: &'static str = "reasoning:transitions";
}
