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
use specta::Type;
use std::path::{Path, PathBuf};
use std::time::Duration;

// ═══════════════════════════════════════════════════════════════
// Public types (TS-exported)
// ═══════════════════════════════════════════════════════════════

/// Public platform configuration.
///
/// This is what Tauri and the frontend see for settings display.
/// Wraps clyffy's `PersistenceConfig` without exposing it.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PlatformConfig {
    /// Root data directory path.
    pub data_dir: String,
    /// Whether portable mode is active.
    pub portable: bool,
    /// Database subsystem configuration.
    pub databases: DatabaseConfig,
}

/// Database subsystem configuration (public-safe names).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
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
    /// Voice service enabled (`Kokoros`).
    pub voice_enabled: bool,
    /// Grammar service enabled (`llguidance` — future sprint).
    pub grammar_enabled: bool,
    /// Embedder service enabled (Candle).
    pub embedder_enabled: bool,
    /// Whisper ASR service enabled (Candle).
    pub whisper_enabled: bool,
    /// DevForge service enabled (VSCode).
    pub devforge_enabled: bool,
}

// DatabaseConfig has NO Default impl by design.
// The ONLY way to construct it is via PlatformBootConfig::to_database_config(),
// which reads real values from the parsed TOML. This prevents config drift.

// ═══════════════════════════════════════════════════════════════
// Internal boot config (TOML-driven, NOT TS-exported)
// ═══════════════════════════════════════════════════════════════

/// Embedded default config — SSOT for service settings.
const DEFAULT_CONFIG: &str = include_str!("../../platform.default.toml");

/// Root boot configuration deserialized from TOML.
#[derive(Debug, Clone, Deserialize)]
#[derive(Default)]
pub struct PlatformBootConfig {
    /// Portable mode configuration.
    #[serde(default)]
    pub portable: PortableConfig,
    /// Per-scope service configurations.
    pub services: ScopedServicesConfig,
    /// Boot gate configuration — controls when UI is allowed to render.
    #[serde(default)]
    pub boot: BootGateConfig,
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

/// All service configurations, organized by scope.
#[derive(Debug, Clone, Deserialize)]
#[derive(Default)]
pub struct ScopedServicesConfig {
    /// System-scope services (kernel internals).
    #[serde(default)]
    pub system: SystemServicesConfig,
    /// User-scope services (sessions, preferences, auto-managed).
    #[serde(default)]
    pub user: UserServicesConfig,
    /// Global-scope services (cross-project knowledge).
    #[serde(default)]
    pub global: GlobalServicesConfig,
    /// Project-scope service templates.
    #[serde(default)]
    pub project: ProjectServicesConfig,
    /// Network services (ports, bind addresses).
    #[serde(default)]
    pub network: NetworkServicesConfig,
}


/// System-scope service configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct SystemServicesConfig {
    /// Relational store (`LibSQL`) — kernel state, boot records.
    #[serde(default = "ServiceEntry::system_relational_default")]
    pub relational: ServiceEntry,
    /// Analytics store (`DuckDB`) — system telemetry.
    #[serde(default = "ServiceEntry::system_analytics_default")]
    pub analytics: ServiceEntry,
    /// Graph store (`SurrealDB`) — kernel FSM, reasoning.
    #[serde(default = "GraphServiceEntry::system_default")]
    pub graph: GraphServiceEntry,
    /// In-memory cache (`Moka`).
    #[serde(default)]
    pub cache: CacheServiceEntry,
    /// Vector store (`RRO`) — embedded Qdrant for two-tier retrieval.
    #[serde(default)]
    pub vector: VectorServiceEntry,
    /// Voice service (`Kokoros`) — embedded TTS engine.
    #[serde(default)]
    pub voice: VoiceServiceEntry,
    /// Grammar service (`llguidance` — future sprint) — structured generation engine.
    #[serde(default)]
    pub grammar: GrammarServiceEntry,
    /// Embedder service (Candle — dense text embedding, CPU burst).
    #[serde(default)]
    pub embedder: EmbedderServiceEntry,
    /// Whisper service (Candle — speech-to-text, CPU burst).
    #[serde(default)]
    pub whisper: WhisperServiceEntry,
    /// Model Loader service (AI model management, inference).
    #[serde(default)]
    pub model_loader: ModelLoaderServiceEntry,
    /// DevForge service (managed VSCode process).
    #[serde(default)]
    pub devforge: DevForgeServiceEntry,
}

impl Default for SystemServicesConfig {
    fn default() -> Self {
        Self {
            relational: ServiceEntry::system_relational_default(),
            analytics: ServiceEntry::system_analytics_default(),
            graph: GraphServiceEntry::system_default(),
            cache: CacheServiceEntry::default(),
            vector: VectorServiceEntry::default(),
            voice: VoiceServiceEntry::default(),
            grammar: GrammarServiceEntry::default(),
            embedder: EmbedderServiceEntry::default(),
            whisper: WhisperServiceEntry::default(),
            model_loader: ModelLoaderServiceEntry::default(),
            devforge: DevForgeServiceEntry::default(),
        }
    }
}

/// User-scope service configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct UserServicesConfig {
    /// Relational store (`LibSQL`) — sessions, messages, user config.
    #[serde(default = "ServiceEntry::user_relational_default")]
    pub relational: ServiceEntry,
    /// Graph store (`SurrealDB`) — user knowledge graph, memory.
    #[serde(default = "GraphServiceEntry::user_default")]
    pub graph: GraphServiceEntry,
}

impl Default for UserServicesConfig {
    fn default() -> Self {
        Self {
            relational: ServiceEntry::user_relational_default(),
            graph: GraphServiceEntry::user_default(),
        }
    }
}

/// Global-scope service configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct GlobalServicesConfig {
    /// Graph store (`SurrealDB`) — shared knowledge graph.
    #[serde(default = "GraphServiceEntry::global_default")]
    pub graph: GraphServiceEntry,
}

impl Default for GlobalServicesConfig {
    fn default() -> Self {
        Self {
            graph: GraphServiceEntry::global_default(),
        }
    }
}

/// Project-scope service template configuration.
#[derive(Debug, Clone, Deserialize)]
#[derive(Default)]
pub struct ProjectServicesConfig {
    /// Graph service template — instantiated per project.
    #[serde(default)]
    pub graph: ProjectGraphServiceEntry,
}


// ═══════════════════════════════════════════════════════════════
// Store entry types
// ═══════════════════════════════════════════════════════════════

/// Per-service retry configuration — overrides global [windows] defaults.
#[derive(Debug, Clone, Deserialize)]
pub struct ServiceRetryConfig {
    /// Maximum number of retry attempts on file lock errors.
    #[serde(default = "default_retry_max")]
    pub max_retries: u32,
    /// Base delay between retries in milliseconds (multiplied by 2^attempt).
    #[serde(default = "default_retry_delay")]
    pub base_delay_ms: u64,
}

impl Default for ServiceRetryConfig {
    fn default() -> Self {
        Self {
            max_retries: default_retry_max(),
            base_delay_ms: default_retry_delay(),
        }
    }
}

impl ServiceRetryConfig {
    /// Convert to the retry utility's config type.
    pub fn to_retry_config(&self) -> crate::platform::boot::retry::RetryConfig {
        crate::platform::boot::retry::RetryConfig {
            max_retries: self.max_retries,
            base_delay_ms: self.base_delay_ms,
        }
    }
}

/// Configuration for a file-based service.
#[derive(Debug, Clone, Deserialize)]
pub struct ServiceEntry {
    /// Whether this service is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Whether boot fails if this service fails (critical = true).
    #[serde(default)]
    pub critical: bool,
    /// Service kind identifier (e.g., "libsql", "duckdb").
    #[serde(default)]
    pub kind: String,
    /// Relative path from data directory.
    #[serde(default)]
    pub path: String,
    /// Per-service retry config — overrides global defaults.
    #[serde(default)]
    pub retry: ServiceRetryConfig,
}

impl ServiceEntry {
    /// System relational service defaults.
    pub fn system_relational_default() -> Self {
        Self {
            enabled: true,
            critical: true,
            kind: "libsql".to_string(),
            path: "system/libsql/platform.db".to_string(),
            retry: ServiceRetryConfig::default(),
        }
    }

    /// System analytics service defaults.
    /// NOTE: critical=true matches platform.default.toml (SSOT).
    pub fn system_analytics_default() -> Self {
        Self {
            enabled: true,
            critical: true,
            kind: "duckdb".to_string(),
            path: "system/duckdb/analytics.duckdb".to_string(),
            retry: ServiceRetryConfig::default(),
        }
    }

    /// User relational service defaults.
    pub fn user_relational_default() -> Self {
        Self {
            enabled: true,
            critical: false,
            kind: "libsql".to_string(),
            path: "user/libsql/user.db".to_string(),
            retry: ServiceRetryConfig::default(),
        }
    }

    /// Resolve the full path from data directory.
    pub fn resolve_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.path)
    }
}

/// Configuration for the graph store (`SurrealDB`).
#[derive(Debug, Clone, Deserialize)]
pub struct GraphServiceEntry {
    /// Whether this service is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Whether boot fails if this service fails (critical = true).
    #[serde(default)]
    pub critical: bool,
    /// Service kind identifier.
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
    /// Dedicated system user for platform engine access.
    #[serde(default = "default_system_user")]
    pub system_user: String,
    /// Password for the dedicated system user.
    #[serde(default = "default_system_password")]
    pub system_password: String,
    /// Per-service retry config.
    #[serde(default)]
    pub retry: ServiceRetryConfig,
}

impl Default for GraphServiceEntry {
    fn default() -> Self {
        Self::system_default()
    }
}

impl GraphServiceEntry {
    /// System graph service defaults.
    pub fn system_default() -> Self {
        Self {
            enabled: true,
            critical: true,
            kind: default_surreal_kind(),
            path: "system/surreal/reasoning".to_string(),
            namespace: "system".to_string(),
            database: "engine".to_string(),
            system_user: default_system_user(),
            system_password: "dp_sys_2026!".to_string(),
            retry: ServiceRetryConfig::default(),
        }
    }

    /// User graph service defaults.
    pub fn user_default() -> Self {
        Self {
            enabled: true,
            critical: false,
            kind: default_surreal_kind(),
            path: "user/surreal/profile".to_string(),
            namespace: "user".to_string(),
            database: "profile".to_string(),
            system_user: default_system_user(),
            system_password: "dp_usr_2026!".to_string(),
            retry: ServiceRetryConfig::default(),
        }
    }

    /// Global graph service defaults.
    pub fn global_default() -> Self {
        Self {
            enabled: true,
            critical: false,
            kind: default_surreal_kind(),
            path: "global/surreal/knowledge".to_string(),
            namespace: "global".to_string(),
            database: "knowledge".to_string(),
            system_user: default_system_user(),
            system_password: "dp_glb_2026!".to_string(),
            retry: ServiceRetryConfig::default(),
        }
    }

    /// Resolve the full path from data directory.
    pub fn resolve_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.path)
    }
}

/// Configuration for a per-project graph service template.
#[derive(Debug, Clone, Deserialize)]
pub struct ProjectGraphServiceEntry {
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

impl Default for ProjectGraphServiceEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            kind: default_surreal_kind(),
            path_template: default_project_path_template(),
            namespace: default_project_namespace(),
        }
    }
}

impl ProjectGraphServiceEntry {
    /// Resolve the full path for a specific project.
    pub fn resolve_path(&self, data_dir: &Path, project_id: &str) -> PathBuf {
        let path = self.path_template.replace("{project_id}", project_id);
        data_dir.join(path)
    }
}

/// Configuration for the in-memory cache (`Moka`).
#[derive(Debug, Clone, Deserialize)]
pub struct CacheServiceEntry {
    /// Whether this store is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Whether boot fails if this service fails.
    #[serde(default = "default_true")]
    pub critical: bool,
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

impl Default for CacheServiceEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            critical: true,
            kind: default_moka_kind(),
            max_capacity: default_max_capacity(),
            time_to_live_secs: default_ttl(),
            time_to_idle_secs: default_tti(),
        }
    }
}

impl CacheServiceEntry {
    /// Convert to a `MokaCacheConfig`.
    pub fn to_moka_config(&self) -> devpulse_clyffy::cortex::persistence::MokaCacheConfig {
        devpulse_clyffy::cortex::persistence::MokaCacheConfig {
            max_capacity: self.max_capacity,
            time_to_live: Duration::from_secs(self.time_to_live_secs),
            time_to_idle: Duration::from_secs(self.time_to_idle_secs),
        }
    }
}

/// Configuration for the vector store (`RRO` — embedded Qdrant).
#[derive(Debug, Clone, Deserialize)]
pub struct VectorServiceEntry {
    /// Whether this store is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Whether boot fails if this service fails.
    #[serde(default = "default_true")]
    pub critical: bool,
    /// Store kind identifier.
    #[serde(default = "default_rro_kind")]
    pub kind: String,
    /// Relative path from data directory for RRO storage.
    #[serde(default = "default_rro_path")]
    pub path: String,
}

impl Default for VectorServiceEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            critical: true,
            kind: default_rro_kind(),
            path: default_rro_path(),
        }
    }
}

impl VectorServiceEntry {
    /// Resolve the full storage path from data directory.
    pub fn resolve_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.path)
    }
}

/// Configuration for the voice service (`Kokoros` — embedded TTS).
#[derive(Debug, Clone, Deserialize)]
pub struct VoiceServiceEntry {
    /// Whether this service is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Whether boot fails if this service fails.
    #[serde(default = "default_true")]
    pub critical: bool,
    /// Service kind identifier.
    #[serde(default = "default_kokoros_kind")]
    pub kind: String,
    /// Relative path from data directory for model storage.
    #[serde(default = "default_kokoros_model_path")]
    pub model_path: String,
    /// Relative path from data directory for voice data.
    #[serde(default = "default_kokoros_voices_path")]
    pub voices_path: String,
}

impl Default for VoiceServiceEntry {
    fn default() -> Self {
        Self {
            enabled: false,
            critical: false,
            kind: default_kokoros_kind(),
            model_path: default_kokoros_model_path(),
            voices_path: default_kokoros_voices_path(),
        }
    }
}

impl VoiceServiceEntry {
    /// Resolve the model path from data directory.
    pub fn resolve_model_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.model_path)
    }

    /// Resolve the voices path from data directory.
    pub fn resolve_voices_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.voices_path)
    }
}

/// Configuration for the grammar service (llguidance — future sprint).
/// Kept for config deserialization compatibility. Defaults to disabled.
#[derive(Debug, Clone, Deserialize)]
pub struct GrammarServiceEntry {
    /// Whether this service is enabled.
    #[serde(default)]
    pub enabled: bool,
    /// Whether boot fails if this service fails.
    #[serde(default)]
    pub critical: bool,
    /// Service kind identifier.
    #[serde(default = "default_grammar_kind")]
    pub kind: String,
}

fn default_grammar_kind() -> String {
    "llguidance".to_string()
}

impl Default for GrammarServiceEntry {
    fn default() -> Self {
        Self {
            enabled: false,
            critical: false,
            kind: default_grammar_kind(),
        }
    }
}

/// Configuration for the embedder service (Candle — dense text embedding).
#[derive(Debug, Clone, Deserialize)]
pub struct EmbedderServiceEntry {
    /// Whether this service is enabled.
    #[serde(default)]
    pub enabled: bool,
    /// Whether boot fails if this service fails.
    #[serde(default)]
    pub critical: bool,
    /// Service kind identifier.
    #[serde(default = "default_candle_kind")]
    pub kind: String,
    /// Relative path from data directory for model files.
    #[serde(default = "default_embedder_model_path")]
    pub model_path: String,
}

impl Default for EmbedderServiceEntry {
    fn default() -> Self {
        Self {
            enabled: false,
            critical: false,
            kind: default_candle_kind(),
            model_path: default_embedder_model_path(),
        }
    }
}

impl EmbedderServiceEntry {
    /// Resolve the model directory from data directory.
    pub fn resolve_model_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.model_path)
    }
}

/// Configuration for the Whisper ASR service (Candle — speech-to-text).
#[derive(Debug, Clone, Deserialize)]
pub struct WhisperServiceEntry {
    /// Whether this service is enabled.
    #[serde(default)]
    pub enabled: bool,
    /// Whether boot fails if this service fails.
    #[serde(default)]
    pub critical: bool,
    /// Service kind identifier.
    #[serde(default = "default_candle_kind")]
    pub kind: String,
    /// Relative path from data directory for model files.
    #[serde(default = "default_whisper_model_path")]
    pub model_path: String,
}

impl Default for WhisperServiceEntry {
    fn default() -> Self {
        Self {
            enabled: false,
            critical: false,
            kind: default_candle_kind(),
            model_path: default_whisper_model_path(),
        }
    }
}

impl WhisperServiceEntry {
    /// Resolve the model directory from data directory.
    pub fn resolve_model_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.model_path)
    }
}

/// Configuration for the Model Loader service (AI model management, inference).
#[derive(Debug, Clone, Deserialize)]
pub struct ModelLoaderServiceEntry {
    /// Whether this service is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Whether boot fails if this service fails.
    #[serde(default)]
    pub critical: bool,
}

impl Default for ModelLoaderServiceEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            critical: false,
        }
    }
}

/// Configuration for the DevForge service (managed VSCode process).
#[derive(Debug, Clone, Deserialize)]
pub struct DevForgeServiceEntry {
    /// Whether this service is enabled.
    #[serde(default)]
    pub enabled: bool,
    /// Whether boot fails if this service fails.
    #[serde(default)]
    pub critical: bool,
    /// Relative path from project root to the VSCode binary.
    #[serde(default = "default_devforge_binary_path")]
    pub binary_path: String,
    /// Workspace path to open.
    #[serde(default = "default_devforge_workspace_path")]
    pub workspace_path: String,
    /// Port for VSCode server.
    #[serde(default = "default_devforge_port")]
    pub port: u16,
}

impl Default for DevForgeServiceEntry {
    fn default() -> Self {
        Self {
            enabled: false,
            critical: false,
            binary_path: default_devforge_binary_path(),
            workspace_path: default_devforge_workspace_path(),
            port: default_devforge_port(),
        }
    }
}

impl DevForgeServiceEntry {
    /// Resolve the binary path from data directory.
    pub fn resolve_binary_path(&self, _data_dir: &Path) -> PathBuf {
        // Binary is relative to project root, not data dir
        PathBuf::from(&self.binary_path)
    }

    /// Resolve the workspace path from data directory.
    pub fn resolve_workspace_path(&self, _data_dir: &Path) -> PathBuf {
        PathBuf::from(&self.workspace_path)
    }
}

fn default_system_user() -> String { "devpulse_engine".to_string() }
fn default_system_password() -> String { "dp_sys_2026!".to_string() }
fn default_candle_kind() -> String { "candle".to_string() }
fn default_embedder_model_path() -> String { "system/candle/embedder".to_string() }
fn default_whisper_model_path() -> String { "system/candle/whisper".to_string() }
fn default_devforge_binary_path() -> String { "deps/code-oss/bin/code-oss".to_string() }
fn default_devforge_workspace_path() -> String { ".".to_string() }
fn default_devforge_port() -> u16 { 8443 }

// ═══════════════════════════════════════════════════════════════
// Network services + boot gate
// ═══════════════════════════════════════════════════════════════

/// Network services configuration — ports and bind addresses.
#[derive(Debug, Clone, Deserialize)]
#[derive(Default)]
pub struct NetworkServicesConfig {
    /// Vite dev server configuration.
    #[serde(default)]
    pub dev_server: DevServerConfig,
    /// `SurrealDB` HTTP API configuration.
    #[serde(default)]
    pub graph_api: GraphApiConfig,
}

/// Vite dev server — serves `SvelteKit` frontend during development.
///
/// xtask injects this as `DEVPULSE_DEV_PORT` env var before spawning Vite.
/// `tauri.conf.json` `devUrl` must match — xtask preflight verifies.
#[derive(Debug, Clone, Deserialize)]
pub struct DevServerConfig {
    /// Port for the Vite dev server.
    #[serde(default = "default_dev_port")]
    pub port: u16,
    /// Bind address.
    #[serde(default = "default_bind")]
    pub bind: String,
    /// Whether Vite should fail if port is already in use.
    #[serde(default = "default_true")]
    pub strict_port: bool,
}

impl Default for DevServerConfig {
    fn default() -> Self {
        Self {
            port: default_dev_port(),
            bind: default_bind(),
            strict_port: true,
        }
    }
}

/// `SurrealDB` HTTP API — exposes the embedded graph store for external tools.
#[derive(Debug, Clone, Deserialize)]
pub struct GraphApiConfig {
    /// Whether the HTTP API is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Port for the HTTP API.
    #[serde(default = "default_graph_api_port")]
    pub port: u16,
    /// Bind address.
    #[serde(default = "default_bind")]
    pub bind: String,
}

impl Default for GraphApiConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            port: default_graph_api_port(),
            bind: default_bind(),
        }
    }
}

/// Boot gate — controls when the UI is allowed to render.
#[derive(Debug, Clone, Deserialize)]
pub struct BootGateConfig {
    /// When true, boot task will not emit "ready" until every critical
    /// service passes health check. Non-critical failures = degraded mode.
    #[serde(default = "default_true")]
    pub require_all_critical: bool,
    /// Maximum time (seconds) to wait for all services before failing.
    #[serde(default = "default_boot_timeout")]
    pub timeout_secs: u64,
}

impl Default for BootGateConfig {
    fn default() -> Self {
        Self {
            require_all_critical: true,
            timeout_secs: default_boot_timeout(),
        }
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

    /// Check if a service is both enabled AND critical in config.
    ///
    /// Used by boot validation to determine which failures are fatal.
    /// Reads directly from parsed TOML — no hardcoded list.
    pub fn is_enabled_and_critical(
        &self,
        role: crate::platform::services::ServiceRole,
        scope: DataScope,
    ) -> bool {
        use crate::platform::services::ServiceRole;
        match (role, scope) {
            (ServiceRole::Relational, DataScope::System) => {
                self.services.system.relational.enabled && self.services.system.relational.critical
            }
            (ServiceRole::Analytics, DataScope::System) => {
                self.services.system.analytics.enabled && self.services.system.analytics.critical
            }
            (ServiceRole::Graph, DataScope::System) => {
                self.services.system.graph.enabled && self.services.system.graph.critical
            }
            (ServiceRole::Cache, DataScope::System) => {
                self.services.system.cache.enabled && self.services.system.cache.critical
            }
            (ServiceRole::Vector, DataScope::System) => {
                self.services.system.vector.enabled && self.services.system.vector.critical
            }
            (ServiceRole::Voice, DataScope::System) => {
                self.services.system.voice.enabled && self.services.system.voice.critical
            }
            (ServiceRole::Grammar, DataScope::System) => {
                self.services.system.grammar.enabled && self.services.system.grammar.critical
            }
            (ServiceRole::Embedder, DataScope::System) => {
                self.services.system.embedder.enabled && self.services.system.embedder.critical
            }
            (ServiceRole::Whisper, DataScope::System) => {
                self.services.system.whisper.enabled && self.services.system.whisper.critical
            }
            (ServiceRole::ModelLoader, DataScope::System) => {
                self.services.system.model_loader.enabled && self.services.system.model_loader.critical
            }
            (ServiceRole::DevForge, DataScope::System) => {
                self.services.system.devforge.enabled && self.services.system.devforge.critical
            }
            (ServiceRole::Relational, DataScope::User) => {
                self.services.user.relational.enabled && self.services.user.relational.critical
            }
            (ServiceRole::Graph, DataScope::User) => {
                self.services.user.graph.enabled && self.services.user.graph.critical
            }
            (ServiceRole::Graph, DataScope::Global) => {
                self.services.global.graph.enabled && self.services.global.graph.critical
            }
            // Project scope doesn't participate in boot validation
            _ => false,
        }
    }

    /// Convert to the public `DatabaseConfig` for TS export.
    pub fn to_database_config(&self) -> DatabaseConfig {
        DatabaseConfig {
            system_relational_enabled: self.services.system.relational.enabled,
            system_analytics_enabled: self.services.system.analytics.enabled,
            system_graph_enabled: self.services.system.graph.enabled,
            system_cache_enabled: self.services.system.cache.enabled,
            user_relational_enabled: self.services.user.relational.enabled,
            user_graph_enabled: self.services.user.graph.enabled,
            global_graph_enabled: self.services.global.graph.enabled,
            vector_enabled: self.services.system.vector.enabled,
            voice_enabled: self.services.system.voice.enabled,
            grammar_enabled: self.services.system.grammar.enabled,
            embedder_enabled: self.services.system.embedder.enabled,
            whisper_enabled: self.services.system.whisper.enabled,
            devforge_enabled: self.services.system.devforge.enabled,
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
fn default_kokoros_kind() -> String {
    "kokoros".to_string()
}
fn default_kokoros_model_path() -> String {
    "system/kokoros/model/kokoro-v1.0.onnx".to_string()
}
fn default_kokoros_voices_path() -> String {
    "system/kokoros/voices/voices-v1.0.bin".to_string()
}
fn default_retry_max() -> u32 {
    5
}
fn default_retry_delay() -> u64 {
    500
}
fn default_dev_port() -> u16 {
    1420
}
fn default_graph_api_port() -> u16 {
    8822
}
fn default_bind() -> String {
    "127.0.0.1".to_string()
}
fn default_boot_timeout() -> u64 {
    60
}
