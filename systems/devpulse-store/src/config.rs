//! Persistence configuration and path resolution.
//!
//! `StoreKind` routes the DevPulse-local stores; path resolution places the
//! embedded database files. This layer is **store-agnostic** — callers pick a
//! `StoreKind` and get a path; the concrete engine (Turso, DuckDB) is an
//! implementation detail behind the trait layer. Surreal / vector / AI stores
//! are ClyffyOS-side and intentionally absent here.

use std::path::PathBuf;

/// DevPulse-local store types.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum StoreKind {
    /// Turso (libSQL-compatible) — the relational SSOT: users, settings, projects.
    Turso,
    /// DuckDB — local project analytics.
    DuckDb,
    /// Moka — in-memory cache (no disk).
    Moka,
}

impl StoreKind {
    /// Subdirectory name for this store.
    pub fn subdir(&self) -> &'static str {
        match self {
            StoreKind::Turso => "turso",
            StoreKind::DuckDb => "duckdb",
            StoreKind::Moka => "",
        }
    }

    /// Default filename for this store.
    pub fn default_filename(&self) -> &'static str {
        match self {
            StoreKind::Turso => "platform.db",
            StoreKind::DuckDb => "analytics.duckdb",
            StoreKind::Moka => "",
        }
    }

    /// Whether this store persists to disk.
    pub fn is_persistent(&self) -> bool {
        !matches!(self, StoreKind::Moka)
    }
}

/// Configuration for the persistence layer.
#[derive(Debug, Clone)]
pub struct PersistenceConfig {
    /// Root data directory (e.g. `{app_root}/data/platform/`).
    pub data_root: PathBuf,
}

impl PersistenceConfig {
    /// Create a new persistence config with the given data root.
    pub fn new(data_root: impl Into<PathBuf>) -> Self {
        Self {
            data_root: data_root.into(),
        }
    }

    /// Path for a specific store.
    pub fn store_path(&self, kind: StoreKind) -> PathBuf {
        self.data_root
            .join(kind.subdir())
            .join(kind.default_filename())
    }

    /// Directory for a specific store.
    pub fn store_dir(&self, kind: StoreKind) -> PathBuf {
        self.data_root.join(kind.subdir())
    }

    /// Ensure all persistent store directories exist (skips in-memory stores).
    ///
    /// # Errors
    /// Returns error if directory creation fails.
    pub fn ensure_dirs(&self) -> std::io::Result<()> {
        for kind in [StoreKind::Turso, StoreKind::DuckDb] {
            if kind.is_persistent() {
                std::fs::create_dir_all(self.store_dir(kind))?;
            }
        }
        Ok(())
    }
}

impl Default for PersistenceConfig {
    fn default() -> Self {
        Self::new("./data/platform")
    }
}
