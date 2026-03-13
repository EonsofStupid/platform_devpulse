//! Platform configuration types.
//!
//! Two layers:
//! - **Public** (`PlatformConfig`, `DatabaseConfig`): TS-exported, what Tauri/frontend sees.
//! - **Internal** (`PlatformBootConfig`): TOML-driven boot config, never exposed to TS.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::Duration;
use ts_rs::TS;

// ═══════════════════════════════════════════════════════════════
// Public types (TS-exported)
// ═══════════════════════════════════════════════════════════════

/// Public platform configuration.
///
/// This is what Tauri and the frontend see for settings display.
/// Wraps maestro's `PersistenceConfig` without exposing it.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct PlatformConfig {
    /// Root data directory path.
    pub data_dir: String,
    /// Database subsystem configuration.
    pub databases: DatabaseConfig,
}

/// Database subsystem configuration (public-safe names).
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[allow(clippy::struct_excessive_bools)] // TS-exported config — bools are the natural shape
pub struct DatabaseConfig {
    /// Relational store enabled (`LibSQL`).
    pub relational_enabled: bool,
    /// Analytics store enabled (`DuckDB`).
    pub analytics_enabled: bool,
    /// Graph store enabled (`SurrealDB`).
    pub graph_enabled: bool,
    /// Cache store enabled (`Moka`).
    pub cache_enabled: bool,
    /// Vector store enabled (`RRO`).
    pub vector_enabled: bool,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            relational_enabled: true,
            analytics_enabled: true,
            graph_enabled: true,
            cache_enabled: true,
            vector_enabled: false,
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Internal boot config (TOML-driven, NOT TS-exported)
// ═══════════════════════════════════════════════════════════════

/// Embedded default config — SSOT for store settings.
const DEFAULT_CONFIG: &str = include_str!("../../platform.default.toml");

/// Root boot configuration deserialized from TOML.
#[derive(Debug, Clone, Deserialize)]
pub struct PlatformBootConfig {
    /// Per-store configuration.
    pub stores: StoresConfig,
}

/// All store configurations.
#[derive(Debug, Clone, Deserialize)]
pub struct StoresConfig {
    /// Relational store (`LibSQL`).
    #[serde(default = "StoreEntry::relational_default")]
    pub relational: StoreEntry,
    /// Analytics store (`DuckDB`).
    #[serde(default = "StoreEntry::analytics_default")]
    pub analytics: StoreEntry,
    /// Graph store (`SurrealDB`).
    #[serde(default)]
    pub graph: GraphStoreEntry,
    /// In-memory cache (`Moka`).
    #[serde(default)]
    pub cache: CacheStoreEntry,
    /// Vector store (`RRO`).
    #[serde(default)]
    pub vector: VectorStoreEntry,
}

/// Configuration for a file-based store.
#[derive(Debug, Clone, Deserialize)]
pub struct StoreEntry {
    /// Whether this store is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Store kind identifier (e.g., "libsql", "duckdb").
    #[serde(default)]
    pub kind: String,
    /// Relative path from data directory.
    #[serde(default)]
    pub path: String,
}

impl StoreEntry {
    fn relational_default() -> Self {
        Self {
            enabled: true,
            kind: "libsql".to_string(),
            path: "libsql/platform.db".to_string(),
        }
    }

    fn analytics_default() -> Self {
        Self {
            enabled: true,
            kind: "duckdb".to_string(),
            path: "duckdb/analytics.duckdb".to_string(),
        }
    }

    /// Resolve the full path from data directory.
    pub fn resolve_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.path)
    }
}

/// Configuration for the graph store (`SurrealDB`).
#[derive(Debug, Clone, Deserialize)]
pub struct GraphStoreEntry {
    /// Whether this store is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Store kind identifier.
    #[serde(default = "default_surreal_kind")]
    pub kind: String,
    /// Relative path from data directory.
    #[serde(default = "default_surreal_path")]
    pub path: String,
    /// `SurrealDB` namespace.
    #[serde(default = "default_surreal_namespace")]
    pub namespace: String,
    /// `SurrealDB` database.
    #[serde(default = "default_surreal_database")]
    pub database: String,
}

impl Default for GraphStoreEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            kind: default_surreal_kind(),
            path: default_surreal_path(),
            namespace: default_surreal_namespace(),
            database: default_surreal_database(),
        }
    }
}

impl GraphStoreEntry {
    /// Resolve the full path from data directory.
    pub fn resolve_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.path)
    }
}

/// Configuration for the in-memory cache (`Moka`).
#[derive(Debug, Clone, Deserialize)]
pub struct CacheStoreEntry {
    /// Whether this store is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Store kind identifier.
    #[serde(default = "default_moka_kind")]
    pub kind: String,
    /// Maximum number of entries.
    #[serde(default = "default_max_capacity")]
    pub max_capacity: u64,
    /// Time-to-live in seconds.
    #[serde(default = "default_ttl")]
    pub time_to_live_secs: u64,
    /// Time-to-idle in seconds.
    #[serde(default = "default_tti")]
    pub time_to_idle_secs: u64,
}

impl Default for CacheStoreEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            kind: default_moka_kind(),
            max_capacity: default_max_capacity(),
            time_to_live_secs: default_ttl(),
            time_to_idle_secs: default_tti(),
        }
    }
}

impl CacheStoreEntry {
    /// Convert to a `MokaCacheConfig`.
    pub fn to_moka_config(&self) -> devpulse_maestro::cortex::persistence::MokaCacheConfig {
        devpulse_maestro::cortex::persistence::MokaCacheConfig {
            max_capacity: self.max_capacity,
            time_to_live: Duration::from_secs(self.time_to_live_secs),
            time_to_idle: Duration::from_secs(self.time_to_idle_secs),
        }
    }
}

/// Configuration for the vector store (`RRO`).
#[derive(Debug, Clone, Deserialize)]
pub struct VectorStoreEntry {
    /// Whether this store is enabled.
    #[serde(default)]
    pub enabled: bool,
}

impl Default for VectorStoreEntry {
    fn default() -> Self {
        Self { enabled: false }
    }
}

impl PlatformBootConfig {
    /// Load boot config: embedded default, optionally overridden by user file.
    ///
    /// 1. Parse embedded `platform.default.toml` (compile-time SSOT).
    /// 2. If `{data_dir}/platform.toml` exists, use it as full replacement.
    ///
    /// # Errors
    /// Returns error if the TOML cannot be parsed.
    pub fn load(data_dir: &Path) -> anyhow::Result<Self> {
        let override_path = data_dir.join("platform.toml");

        if override_path.exists() {
            let content = std::fs::read_to_string(&override_path)?;
            let config: Self = toml::from_str(&content)?;
            Ok(config)
        } else {
            let config: Self = toml::from_str(DEFAULT_CONFIG)?;
            Ok(config)
        }
    }

    /// Convert to the public `DatabaseConfig` for TS export.
    pub fn to_database_config(&self) -> DatabaseConfig {
        DatabaseConfig {
            relational_enabled: self.stores.relational.enabled,
            analytics_enabled: self.stores.analytics.enabled,
            graph_enabled: self.stores.graph.enabled,
            cache_enabled: self.stores.cache.enabled,
            vector_enabled: self.stores.vector.enabled,
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Serde defaults
// ═══════════════════════════════════════════════════════════════

fn default_true() -> bool {
    true
}
fn default_surreal_kind() -> String {
    "surreal".to_string()
}
fn default_surreal_path() -> String {
    "surreal/reasoning".to_string()
}
fn default_surreal_namespace() -> String {
    "maestro".to_string()
}
fn default_surreal_database() -> String {
    "devpulse".to_string()
}
fn default_moka_kind() -> String {
    "moka".to_string()
}
fn default_max_capacity() -> u64 {
    10_000
}
fn default_ttl() -> u64 {
    300
}
fn default_tti() -> u64 {
    60
}
