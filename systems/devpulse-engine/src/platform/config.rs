//! Platform configuration types.
//!
//! Two layers:
//! - **Public** (`PlatformConfig`, `DatabaseConfig`): TS-exported, what Tauri/frontend sees.
//! - **Internal** (`PlatformBootConfig`): TOML-driven boot config, never exposed to TS.
//!
//! Store layout uses four scopes:
//! - **system**: Kernel/engine internals (FSM, telemetry, boot state)
//! - **user**: User-owned data (sessions, messages, preferences, memory)
//! - **global**: Cross-project shared knowledge
//! - **project**: Per-project namespaced data (created on demand)

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
    /// Whether portable mode is active.
    pub portable: bool,
    /// Database subsystem configuration.
    pub databases: DatabaseConfig,
}

/// Database subsystem configuration (public-safe names).
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[allow(clippy::struct_excessive_bools)] // TS-exported config — bools are the natural shape
pub struct DatabaseConfig {
    /// System relational store enabled (`LibSQL`).
    pub system_relational_enabled: bool,
    /// System analytics store enabled (`DuckDB`).
    pub system_analytics_enabled: bool,
    /// System graph store enabled (`SurrealDB`).
    pub system_graph_enabled: bool,
    /// System cache store enabled (`Moka`).
    pub system_cache_enabled: bool,
    /// User relational store enabled (`LibSQL`).
    pub user_relational_enabled: bool,
    /// User graph store enabled (`SurrealDB`).
    pub user_graph_enabled: bool,
    /// Global graph store enabled (`SurrealDB`).
    pub global_graph_enabled: bool,
    /// Vector store enabled (`RRO`).
    pub vector_enabled: bool,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            system_relational_enabled: true,
            system_analytics_enabled: true,
            system_graph_enabled: true,
            system_cache_enabled: true,
            user_relational_enabled: true,
            user_graph_enabled: true,
            global_graph_enabled: true,
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
    /// Portable mode configuration.
    #[serde(default)]
    pub portable: PortableConfig,
    /// Per-scope store configurations.
    pub stores: ScopedStoresConfig,
    /// Windows-specific hardening options.
    #[serde(default)]
    pub windows: WindowsConfig,
}

/// Portable mode configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct PortableConfig {
    /// When true, all data stays within .userdata/ relative to project root.
    #[serde(default = "default_true")]
    pub enabled: bool,
}

impl Default for PortableConfig {
    fn default() -> Self {
        Self { enabled: true }
    }
}

/// Windows-specific hardening configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct WindowsConfig {
    /// Number of retries on file sharing violations.
    #[serde(default = "default_file_lock_retries")]
    pub file_lock_retries: u32,
    /// Delay between retries in milliseconds.
    #[serde(default = "default_file_lock_retry_delay_ms")]
    pub file_lock_retry_delay_ms: u64,
    /// Skip path canonicalization (avoids \\?\ prefix issues).
    #[serde(default = "default_true")]
    pub skip_canonicalize: bool,
    /// Maximum path depth before warning.
    #[serde(default = "default_max_path_depth")]
    pub max_path_depth: usize,
}

impl Default for WindowsConfig {
    fn default() -> Self {
        Self {
            file_lock_retries: default_file_lock_retries(),
            file_lock_retry_delay_ms: default_file_lock_retry_delay_ms(),
            skip_canonicalize: true,
            max_path_depth: default_max_path_depth(),
        }
    }
}

/// All store configurations, organized by scope.
#[derive(Debug, Clone, Deserialize)]
#[derive(Default)]
pub struct ScopedStoresConfig {
    /// System-scope stores (kernel internals).
    #[serde(default)]
    pub system: SystemStoresConfig,
    /// User-scope stores (sessions, preferences).
    #[serde(default)]
    pub user: UserStoresConfig,
    /// Global-scope stores (cross-project knowledge).
    #[serde(default)]
    pub global: GlobalStoresConfig,
    /// Project-scope store templates.
    #[serde(default)]
    pub project: ProjectStoresConfig,
}


/// System-scope store configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct SystemStoresConfig {
    /// Relational store (`LibSQL`) — kernel state, boot records.
    #[serde(default = "StoreEntry::system_relational_default")]
    pub relational: StoreEntry,
    /// Analytics store (`DuckDB`) — system telemetry.
    #[serde(default = "StoreEntry::system_analytics_default")]
    pub analytics: StoreEntry,
    /// Graph store (`SurrealDB`) — kernel FSM, reasoning.
    #[serde(default = "GraphStoreEntry::system_default")]
    pub graph: GraphStoreEntry,
    /// In-memory cache (`Moka`).
    #[serde(default)]
    pub cache: CacheStoreEntry,
    /// Vector store (`RRO`) — embedded Qdrant for two-tier retrieval.
    #[serde(default)]
    pub vector: VectorStoreEntry,
}

impl Default for SystemStoresConfig {
    fn default() -> Self {
        Self {
            relational: StoreEntry::system_relational_default(),
            analytics: StoreEntry::system_analytics_default(),
            graph: GraphStoreEntry::system_default(),
            cache: CacheStoreEntry::default(),
            vector: VectorStoreEntry::default(),
        }
    }
}

/// User-scope store configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct UserStoresConfig {
    /// Relational store (`LibSQL`) — sessions, messages, user config.
    #[serde(default = "StoreEntry::user_relational_default")]
    pub relational: StoreEntry,
    /// Graph store (`SurrealDB`) — user knowledge graph, memory.
    #[serde(default = "GraphStoreEntry::user_default")]
    pub graph: GraphStoreEntry,
}

impl Default for UserStoresConfig {
    fn default() -> Self {
        Self {
            relational: StoreEntry::user_relational_default(),
            graph: GraphStoreEntry::user_default(),
        }
    }
}

/// Global-scope store configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct GlobalStoresConfig {
    /// Graph store (`SurrealDB`) — shared knowledge graph.
    #[serde(default = "GraphStoreEntry::global_default")]
    pub graph: GraphStoreEntry,
}

impl Default for GlobalStoresConfig {
    fn default() -> Self {
        Self {
            graph: GraphStoreEntry::global_default(),
        }
    }
}

/// Project-scope store template configuration.
#[derive(Debug, Clone, Deserialize)]
#[derive(Default)]
pub struct ProjectStoresConfig {
    /// Graph store template — instantiated per project.
    #[serde(default)]
    pub graph: ProjectGraphEntry,
}


// ═══════════════════════════════════════════════════════════════
// Store entry types
// ═══════════════════════════════════════════════════════════════

/// Per-store retry configuration — overrides global [windows] defaults.
#[derive(Debug, Clone, Deserialize)]
pub struct StoreRetryConfig {
    /// Maximum number of retry attempts on file lock errors.
    #[serde(default = "default_retry_max")]
    pub max_retries: u32,
    /// Base delay between retries in milliseconds (multiplied by 2^attempt).
    #[serde(default = "default_retry_delay")]
    pub base_delay_ms: u64,
}

impl Default for StoreRetryConfig {
    fn default() -> Self {
        Self {
            max_retries: default_retry_max(),
            base_delay_ms: default_retry_delay(),
        }
    }
}

impl StoreRetryConfig {
    /// Convert to the retry utility's config type.
    pub fn to_retry_config(&self) -> crate::platform::boot::retry::RetryConfig {
        crate::platform::boot::retry::RetryConfig {
            max_retries: self.max_retries,
            base_delay_ms: self.base_delay_ms,
        }
    }
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
    /// Per-store retry config — overrides global defaults.
    #[serde(default)]
    pub retry: StoreRetryConfig,
}

impl StoreEntry {
    /// System relational store defaults.
    pub fn system_relational_default() -> Self {
        Self {
            enabled: true,
            kind: "libsql".to_string(),
            path: "system/libsql/platform.db".to_string(),
            retry: StoreRetryConfig::default(),
        }
    }

    /// System analytics store defaults.
    pub fn system_analytics_default() -> Self {
        Self {
            enabled: true,
            kind: "duckdb".to_string(),
            path: "system/duckdb/analytics.duckdb".to_string(),
            retry: StoreRetryConfig::default(),
        }
    }

    /// User relational store defaults.
    pub fn user_relational_default() -> Self {
        Self {
            enabled: true,
            kind: "libsql".to_string(),
            path: "user/libsql/user.db".to_string(),
            retry: StoreRetryConfig::default(),
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
    #[serde(default)]
    pub path: String,
    /// `SurrealDB` namespace.
    #[serde(default)]
    pub namespace: String,
    /// `SurrealDB` database.
    #[serde(default)]
    pub database: String,
    /// Per-store retry config.
    #[serde(default)]
    pub retry: StoreRetryConfig,
}

impl Default for GraphStoreEntry {
    fn default() -> Self {
        Self::system_default()
    }
}

impl GraphStoreEntry {
    /// System graph store defaults.
    pub fn system_default() -> Self {
        Self {
            enabled: true,
            kind: default_surreal_kind(),
            path: "system/surreal/reasoning".to_string(),
            namespace: "system".to_string(),
            database: "engine".to_string(),
            retry: StoreRetryConfig::default(),
        }
    }

    /// User graph store defaults.
    pub fn user_default() -> Self {
        Self {
            enabled: true,
            kind: default_surreal_kind(),
            path: "user/surreal/profile".to_string(),
            namespace: "user".to_string(),
            database: "profile".to_string(),
            retry: StoreRetryConfig::default(),
        }
    }

    /// Global graph store defaults.
    pub fn global_default() -> Self {
        Self {
            enabled: true,
            kind: default_surreal_kind(),
            path: "global/surreal/knowledge".to_string(),
            namespace: "global".to_string(),
            database: "knowledge".to_string(),
            retry: StoreRetryConfig::default(),
        }
    }

    /// Resolve the full path from data directory.
    pub fn resolve_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.path)
    }
}

/// Configuration for a per-project graph store template.
#[derive(Debug, Clone, Deserialize)]
pub struct ProjectGraphEntry {
    /// Whether project graph stores are enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Store kind identifier.
    #[serde(default = "default_surreal_kind")]
    pub kind: String,
    /// Path template with `{project_id}` placeholder.
    #[serde(default = "default_project_path_template")]
    pub path_template: String,
    /// Namespace for project stores.
    #[serde(default = "default_project_namespace")]
    pub namespace: String,
}

impl Default for ProjectGraphEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            kind: default_surreal_kind(),
            path_template: default_project_path_template(),
            namespace: default_project_namespace(),
        }
    }
}

impl ProjectGraphEntry {
    /// Resolve the full path for a specific project.
    pub fn resolve_path(&self, data_dir: &Path, project_id: &str) -> PathBuf {
        let path = self.path_template.replace("{project_id}", project_id);
        data_dir.join(path)
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

/// Configuration for the vector store (`RRO` — embedded Qdrant).
#[derive(Debug, Clone, Deserialize)]
pub struct VectorStoreEntry {
    /// Whether this store is enabled.
    #[serde(default)]
    pub enabled: bool,
    /// Store kind identifier.
    #[serde(default = "default_rro_kind")]
    pub kind: String,
    /// Relative path from data directory for RRO storage.
    #[serde(default = "default_rro_path")]
    pub path: String,
}

impl Default for VectorStoreEntry {
    fn default() -> Self {
        Self {
            enabled: false,
            kind: default_rro_kind(),
            path: default_rro_path(),
        }
    }
}

impl VectorStoreEntry {
    /// Resolve the full storage path from data directory.
    pub fn resolve_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.path)
    }
}

// ═══════════════════════════════════════════════════════════════
// Data scope enum
// ═══════════════════════════════════════════════════════════════

/// Identifies which scope a store belongs to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum DataScope {
    /// Kernel/engine internals — never user-facing.
    System,
    /// User-owned data — sessions, preferences, memories.
    User,
    /// Cross-project shared knowledge.
    Global,
    /// Per-project namespaced data.
    Project,
}

impl DataScope {
    /// Directory name for this scope under the data root.
    pub fn dir_name(&self) -> &'static str {
        match self {
            Self::System => "system",
            Self::User => "user",
            Self::Global => "global",
            Self::Project => "projects",
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Loading
// ═══════════════════════════════════════════════════════════════

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
            system_relational_enabled: self.stores.system.relational.enabled,
            system_analytics_enabled: self.stores.system.analytics.enabled,
            system_graph_enabled: self.stores.system.graph.enabled,
            system_cache_enabled: self.stores.system.cache.enabled,
            user_relational_enabled: self.stores.user.relational.enabled,
            user_graph_enabled: self.stores.user.graph.enabled,
            global_graph_enabled: self.stores.global.graph.enabled,
            vector_enabled: self.stores.system.vector.enabled,
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Windows path utilities
// ═══════════════════════════════════════════════════════════════

/// Sanitize a path for Windows compatibility.
///
/// - Strips `\\?\` extended-length prefix if present (`SurrealKV` chokes on it)
/// - Checks path length against configured maximum
pub fn sanitize_path(path: &Path, config: &WindowsConfig) -> PathBuf {
    let mut path_str = path.to_string_lossy().to_string();

    // Strip \\?\ prefix that canonicalize() adds on Windows
    if path_str.starts_with(r"\\?\") {
        path_str = path_str[4..].to_string();
    }

    // Check path length
    if path_str.len() > config.max_path_depth {
        tracing::warn!(
            path = %path_str,
            len = path_str.len(),
            max = config.max_path_depth,
            "Path exceeds configured max depth — may fail on Windows"
        );
    }

    PathBuf::from(path_str)
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
fn default_file_lock_retries() -> u32 {
    5
}
fn default_file_lock_retry_delay_ms() -> u64 {
    200
}
fn default_max_path_depth() -> usize {
    200
}
fn default_project_path_template() -> String {
    "projects/{project_id}/surreal/context".to_string()
}
fn default_project_namespace() -> String {
    "project".to_string()
}
fn default_rro_kind() -> String {
    "rro".to_string()
}
fn default_rro_path() -> String {
    "system/rro/storage".to_string()
}
fn default_retry_max() -> u32 {
    5
}
fn default_retry_delay() -> u64 {
    500
}
