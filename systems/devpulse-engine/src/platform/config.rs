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

// ═══════════════════════════════════════════════════════════════
// Public telemetry types (TS-exported)
// ═══════════════════════════════════════════════════════════════

/// Hardware execution lane in the inference pipeline.
///
/// Each variant maps to a model slot + device combination.
/// Names are PUBLIC equivalents only — kernel terms never appear here.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
pub enum ExecutionLane {
    // ── GPU lanes ────────────────────────────────────────────
    /// Brain model (configurable size). GPU Hot.
    BrainInference,
    /// Helper model (shared slot). GPU Hot/Standby.
    HelperInference,
    /// Escalation path. GPU Warm. Fallback to brain.
    EscalationInference,
    // ── CPU burst lanes ─────────────────────────────────────
    /// Dense text embedding. CPU burst.
    Embedding,
    /// Cross-encoder reranking. CPU burst.
    Reranking,
    /// Speech-to-text (Whisper). CPU burst.
    SpeechToText,
    /// Text-to-speech (Kokoro). CPU burst.
    TextToSpeech,
    // ── CPU persistent lanes ────────────────────────────────
    /// Vision embedding (SigLIP2). CPU.
    VisionEmbedding,
    // ── Storage lanes ───────────────────────────────────────
    /// Vector search (RRO/Qdrant). Disk-backed.
    VectorRetrieval,
    /// Relational query (libSQL). File-backed.
    RelationalQuery,
    /// Analytical query (DuckDB). File-backed.
    AnalyticalQuery,
    /// In-memory cache lookup (Moka).
    CacheLookup,
    // ── Orchestration lanes ─────────────────────────────────
    /// Prompt assembly. CPU-bound string construction.
    PromptAssembly,
    /// Full thinking pipeline (end-to-end trace).
    ThinkingPipeline,
}

impl ExecutionLane {
    /// All lane variants in definition order.
    pub const ALL: &'static [Self] = &[
        Self::BrainInference,
        Self::HelperInference,
        Self::EscalationInference,
        Self::Embedding,
        Self::Reranking,
        Self::SpeechToText,
        Self::TextToSpeech,
        Self::VisionEmbedding,
        Self::VectorRetrieval,
        Self::RelationalQuery,
        Self::AnalyticalQuery,
        Self::CacheLookup,
        Self::PromptAssembly,
        Self::ThinkingPipeline,
    ];

    /// Device category for this lane.
    pub fn device_category(&self) -> &'static str {
        match self {
            Self::BrainInference
            | Self::HelperInference
            | Self::EscalationInference => "gpu",

            Self::Embedding
            | Self::Reranking
            | Self::SpeechToText
            | Self::TextToSpeech
            | Self::VisionEmbedding
            | Self::PromptAssembly
            | Self::ThinkingPipeline => "cpu",

            Self::VectorRetrieval
            | Self::RelationalQuery
            | Self::AnalyticalQuery => "disk",

            Self::CacheLookup => "memory",
        }
    }

    /// `tracing` span name for this lane.
    pub fn span_name(&self) -> &'static str {
        match self {
            Self::BrainInference => "lane.brain",
            Self::HelperInference => "lane.helper",
            Self::EscalationInference => "lane.escalation",
            Self::Embedding => "lane.embed",
            Self::Reranking => "lane.rerank",
            Self::SpeechToText => "lane.stt",
            Self::TextToSpeech => "lane.tts",
            Self::VisionEmbedding => "lane.vision",
            Self::VectorRetrieval => "lane.vector",
            Self::RelationalQuery => "lane.relational",
            Self::AnalyticalQuery => "lane.analytical",
            Self::CacheLookup => "lane.cache",
            Self::PromptAssembly => "lane.prompt",
            Self::ThinkingPipeline => "lane.thinking",
        }
    }

    /// TOML key name for this lane (snake_case).
    pub fn toml_key(&self) -> &'static str {
        match self {
            Self::BrainInference => "brain_inference",
            Self::HelperInference => "helper_inference",
            Self::EscalationInference => "escalation_inference",
            Self::Embedding => "embedding",
            Self::Reranking => "reranking",
            Self::SpeechToText => "speech_to_text",
            Self::TextToSpeech => "text_to_speech",
            Self::VisionEmbedding => "vision_embedding",
            Self::VectorRetrieval => "vector_retrieval",
            Self::RelationalQuery => "relational_query",
            Self::AnalyticalQuery => "analytical_query",
            Self::CacheLookup => "cache_lookup",
            Self::PromptAssembly => "prompt_assembly",
            Self::ThinkingPipeline => "thinking_pipeline",
        }
    }

    /// Expected latency bucket in milliseconds (initial estimates).
    /// Replaced by measured p50 after baseline collection.
    pub fn expected_latency_ms(&self) -> u64 {
        match self {
            Self::CacheLookup => 1,
            Self::RelationalQuery => 5,
            Self::AnalyticalQuery => 10,
            Self::VectorRetrieval => 20,
            Self::Embedding => 50,
            Self::PromptAssembly => 50,
            Self::Reranking => 80,
            Self::VisionEmbedding => 200,
            Self::HelperInference => 200,
            Self::TextToSpeech => 300,
            Self::SpeechToText => 500,
            Self::EscalationInference => 500,
            Self::BrainInference => 3000,
            Self::ThinkingPipeline => 5000,
        }
    }
}

/// Per-lane toggle state (public, TS-exported).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct LaneToggle {
    /// Which lane this toggle controls.
    pub lane: ExecutionLane,
    /// Whether tracing is enabled for this lane.
    pub enabled: bool,
}

/// Lane tracing configuration (public, TS-exported, runtime-mutable).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct LaneTraceConfig {
    /// Per-lane toggle states.
    pub lanes: Vec<LaneToggle>,
    /// Log input/output content (expensive, never in prod).
    pub verbose: bool,
    /// Write every trace to DuckDB for baseline analysis.
    pub persist_to_duckdb: bool,
}
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
    /// Telemetry — lane tracing for inference pipeline instrumentation.
    #[serde(default)]
    pub telemetry: TelemetryBootConfig,
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
    /// Relative path from data_dir to the models directory.
    #[serde(default = "default_models_dir")]
    pub models_dir: String,
    /// Subdirectory names for model discovery.
    #[serde(default)]
    pub subdirs: ModelSubdirsConfig,
    /// Slot definitions — SSOT. If empty at boot, engine hard-fails.
    #[serde(default)]
    pub slots: Vec<SlotConfigEntry>,
    /// Download catalog — HF repos and options per slot.
    #[serde(default)]
    pub catalog: Vec<CatalogEntry>,
}

impl Default for ModelLoaderServiceEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            critical: false,
            models_dir: default_models_dir(),
            subdirs: ModelSubdirsConfig::default(),
            slots: Vec::new(),
            catalog: Vec::new(),
        }
    }
}

impl ModelLoaderServiceEntry {
    /// Resolve the full models directory path from the data directory.
    pub fn resolve_models_dir(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.models_dir)
    }

    /// Get the list of subdirectory names for model discovery.
    pub fn subdir_names(&self) -> Vec<String> {
        vec![
            self.subdirs.chat.clone(),
            self.subdirs.voice.clone(),
            self.subdirs.rag.clone(),
            self.subdirs.vision.clone(),
        ]
    }

    /// Convert config slot entries to kernel `Slot` types.
    ///
    /// # Errors
    /// Returns an error if no slots are defined (TOML is SSOT — no fallback).
    #[cfg(feature = "inference")]
    pub fn build_slots(&self) -> anyhow::Result<Vec<devpulse_clyffy::model_loader::Slot>> {
        if self.slots.is_empty() {
            anyhow::bail!(
                "No slots defined in [services.system.model_loader.slots] — \
                 TOML is the SSOT, there is no fallback. Add slot definitions to platform.default.toml."
            );
        }
        Ok(self.slots.iter().map(SlotConfigEntry::to_kernel_slot).collect())
    }
}

/// Subdirectory names for model discovery.
#[derive(Debug, Clone, Deserialize)]
pub struct ModelSubdirsConfig {
    /// Chat models subdirectory.
    #[serde(default = "default_subdir_chat")]
    pub chat: String,
    /// Voice models subdirectory.
    #[serde(default = "default_subdir_voice")]
    pub voice: String,
    /// RAG models subdirectory.
    #[serde(default = "default_subdir_rag")]
    pub rag: String,
    /// Vision models subdirectory.
    #[serde(default = "default_subdir_vision")]
    pub vision: String,
}

impl Default for ModelSubdirsConfig {
    fn default() -> Self {
        Self {
            chat: default_subdir_chat(),
            voice: default_subdir_voice(),
            rag: default_subdir_rag(),
            vision: default_subdir_vision(),
        }
    }
}

// ── TOML-side config enums (deser from TOML, convert to kernel) ──

/// TOML-side `ModelCapability` — deserialized from config, converts to kernel type.
#[derive(Debug, Clone, Deserialize)]
pub enum ModelCapabilityConfig {
    /// LLM — chat, reasoning, translation.
    TextGeneration,
    /// Bi-encoder — vector generation for search.
    Embedding,
    /// Cross-encoder — relevance scoring.
    Reranking,
    /// Multimodal — image + text understanding.
    VisionLanguage,
    /// Image to vector (SigLIP2 etc.).
    VisionEmbedding,
    /// Speech-to-text (Whisper).
    SpeechToText,
    /// Text-to-speech (Kokoro).
    TextToSpeech,
    /// Neural audio codec (SNAC — speech token decoding).
    AudioDecoding,
}

#[cfg(feature = "inference")]
impl ModelCapabilityConfig {
    fn to_kernel(&self) -> devpulse_clyffy::model_loader::ModelCapability {
        use devpulse_clyffy::model_loader::ModelCapability;
        match self {
            Self::TextGeneration => ModelCapability::TextGeneration,
            Self::Embedding => ModelCapability::Embedding,
            Self::Reranking => ModelCapability::Reranking,
            Self::VisionLanguage => ModelCapability::VisionLanguage,
            Self::VisionEmbedding => ModelCapability::VisionEmbedding,
            Self::SpeechToText => ModelCapability::SpeechToText,
            Self::TextToSpeech => ModelCapability::TextToSpeech,
            Self::AudioDecoding => ModelCapability::AudioDecoding,
        }
    }
}

/// TOML-side `DevicePreference`.
#[derive(Debug, Clone, Deserialize)]
pub enum DevicePreferenceConfig {
    /// Must run on GPU (generation models).
    Gpu,
    /// Prefer CPU (embedders, rerankers).
    Cpu,
    /// Try GPU, fall back to CPU if VRAM insufficient.
    GpuWithCpuFallback,
    /// Loader decides based on VRAM budget.
    Any,
}

#[cfg(feature = "inference")]
impl DevicePreferenceConfig {
    fn to_kernel(&self) -> devpulse_clyffy::model_loader::DevicePreference {
        use devpulse_clyffy::model_loader::DevicePreference;
        match self {
            Self::Gpu => DevicePreference::Gpu,
            Self::Cpu => DevicePreference::Cpu,
            Self::GpuWithCpuFallback => DevicePreference::GpuWithCpuFallback,
            Self::Any => DevicePreference::Any,
        }
    }
}

/// TOML-side `LoadingStrategy`.
#[derive(Debug, Clone, Deserialize)]
pub enum LoadingStrategyConfig {
    /// Keep loaded while platform is active.
    Hot,
    /// Load proactively when conditions suggest need.
    Warm,
    /// Load when first request arrives, unload after idle.
    OnDemand,
    /// Load when a specific signal fires (e.g. `"voice.activated"`).
    Signal(String),
    /// Loaded/unloaded alongside a parent slot.
    Coupled {
        /// The parent slot ID that controls this slot's lifecycle.
        parent: String,
    },
}

#[cfg(feature = "inference")]
impl LoadingStrategyConfig {
    fn to_kernel(&self) -> devpulse_clyffy::model_loader::LoadingStrategy {
        use devpulse_clyffy::model_loader::LoadingStrategy;
        match self {
            Self::Hot => LoadingStrategy::Hot,
            Self::Warm => LoadingStrategy::Warm,
            Self::OnDemand => LoadingStrategy::OnDemand,
            Self::Signal(s) => LoadingStrategy::Signal(s.clone()),
            Self::Coupled { parent } => LoadingStrategy::Coupled { parent: parent.clone() },
        }
    }
}

/// TOML-side `BackendType`.
#[derive(Debug, Clone, Deserialize)]
pub enum BackendTypeConfig {
    /// Candle (canonical — Rust-native, llguidance integration).
    Candle,
    /// llama.cpp via FFI (secondary — broader architecture support).
    LlamaCpp,
    /// ONNX Runtime via ort crate (SNAC, small inference models).
    Ort,
    /// sherpa-rs (Whisper STT, Kokoro TTS).
    Sherpa,
}

#[cfg(feature = "inference")]
impl BackendTypeConfig {
    fn to_kernel(&self) -> devpulse_clyffy::model_loader::BackendType {
        use devpulse_clyffy::model_loader::BackendType;
        match self {
            Self::Candle => BackendType::Candle,
            Self::LlamaCpp => BackendType::LlamaCpp,
            Self::Ort => BackendType::Ort,
            Self::Sherpa => BackendType::Sherpa,
        }
    }
}

/// TOML-side `ModelSourceTier`.
#[derive(Debug, Clone, Deserialize)]
pub enum SourceTierConfig {
    /// User downloads and manages via Model Loader UI.
    UserManaged,
    /// Ships with the app binary, auto-loads on boot.
    Bundled {
        /// Path relative to models_dir (e.g. `"voice/kokoro/model_quantized.onnx"`).
        bundled_path: String,
    },
}

#[cfg(feature = "inference")]
impl SourceTierConfig {
    fn to_kernel(&self) -> devpulse_clyffy::model_loader::ModelSourceTier {
        use devpulse_clyffy::model_loader::ModelSourceTier;
        match self {
            Self::UserManaged => ModelSourceTier::UserManaged,
            Self::Bundled { bundled_path } => ModelSourceTier::Bundled {
                bundled_path: bundled_path.clone(),
            },
        }
    }
}

impl Default for SourceTierConfig {
    fn default() -> Self {
        Self::UserManaged
    }
}

// ── Slot config entry (TOML → kernel::Slot) ──

/// A slot definition from TOML. All fields from kernel `Slot` except `assigned_model`
/// (always None at boot — restored from persistence/MemoryConfig).
#[derive(Debug, Clone, Deserialize)]
pub struct SlotConfigEntry {
    /// Unique identifier (e.g., `"chat.brain"`).
    pub id: String,
    /// Human-readable label.
    pub label: String,
    /// What kind of model this slot accepts.
    pub capability: ModelCapabilityConfig,
    /// Preferred device placement.
    #[serde(default = "default_device_any")]
    pub preferred_device: DevicePreferenceConfig,
    /// Loading strategy.
    #[serde(default = "default_loading_hot")]
    pub loading: LoadingStrategyConfig,
    /// Fallback slot ID.
    #[serde(default)]
    pub fallback: Option<String>,
    /// Override inference backend.
    #[serde(default)]
    pub runtime: Option<BackendTypeConfig>,
    /// Default model filename for auto-assignment.
    #[serde(default)]
    pub default_model: Option<String>,
    /// Slot IDs that must be loaded alongside this slot.
    #[serde(default)]
    pub requires: Vec<String>,
    /// Slot ID that this slot can replace.
    #[serde(default)]
    pub overrides: Option<String>,
    /// Whether bundled or user-managed.
    #[serde(default)]
    pub source_tier: SourceTierConfig,
    /// Backend-specific key-value config.
    #[serde(default)]
    pub extensions: std::collections::HashMap<String, String>,
}

#[cfg(feature = "inference")]
impl SlotConfigEntry {
    /// Convert to the kernel `Slot` type. `assigned_model` is always `None` at boot.
    fn to_kernel_slot(&self) -> devpulse_clyffy::model_loader::Slot {
        devpulse_clyffy::model_loader::Slot {
            id: self.id.clone(),
            label: self.label.clone(),
            capability: self.capability.to_kernel(),
            preferred_device: self.preferred_device.to_kernel(),
            loading: self.loading.to_kernel(),
            assigned_model: None,
            fallback: self.fallback.clone(),
            runtime: self.runtime.as_ref().map(BackendTypeConfig::to_kernel),
            default_model: self.default_model.clone(),
            requires: self.requires.clone(),
            overrides: self.overrides.clone(),
            source_tier: self.source_tier.to_kernel(),
            extensions: self.extensions.clone(),
        }
    }
}

// ── Catalog entry (exposed to frontend via specta) ──

/// A download catalog entry — one per slot. Each has one or more download options.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CatalogEntry {
    /// Slot ID this catalog entry is for.
    pub slot_id: String,
    /// Human-readable label (e.g., "Clyffy's Brain").
    pub label: String,
    /// Description for the UI.
    pub description: String,
    /// Download options for this slot.
    pub options: Vec<CatalogOption>,
}

/// A single download option within a catalog entry.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CatalogOption {
    /// Human-readable label (e.g., "4B (Fast)").
    pub label: String,
    /// HuggingFace repository ID.
    pub repo: String,
    /// Filename to download.
    pub file: String,
    /// Approximate size in MB.
    pub size_mb: u32,
    /// Whether this is a directory download (e.g., Whisper models).
    #[serde(default)]
    pub is_dir: bool,
}

fn default_models_dir() -> String { "models".to_string() }
fn default_subdir_chat() -> String { "chat".to_string() }
fn default_subdir_voice() -> String { "voice".to_string() }
fn default_subdir_rag() -> String { "rag".to_string() }
fn default_subdir_vision() -> String { "vision".to_string() }
fn default_device_any() -> DevicePreferenceConfig { DevicePreferenceConfig::Any }
fn default_loading_hot() -> LoadingStrategyConfig { LoadingStrategyConfig::Hot }

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
// Internal telemetry boot config (TOML-driven, NOT TS-exported)
// ═══════════════════════════════════════════════════════════════

/// Telemetry configuration from TOML. Internal only — not TS-exported.
#[derive(Debug, Clone, Deserialize)]
pub struct TelemetryBootConfig {
    /// Whether the telemetry subsystem is enabled at all.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Lane tracing configuration.
    #[serde(default)]
    pub lanes: LaneTraceBootConfig,
}

impl Default for TelemetryBootConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            lanes: LaneTraceBootConfig::default(),
        }
    }
}

/// Lane tracing boot config — TOML-driven defaults.
///
/// `preset` selects the base toggle set. Per-lane `Option<bool>` fields
/// override the preset when present (Some). Missing keys (None) fall
/// through to the preset value.
#[derive(Debug, Clone, Deserialize)]
pub struct LaneTraceBootConfig {
    /// Preset name: "off", "standard", "debug".
    #[serde(default = "default_lane_preset")]
    pub preset: String,
    /// Log input/output content (expensive).
    #[serde(default)]
    pub verbose: bool,
    /// Write every trace to DuckDB.
    #[serde(default = "default_true")]
    pub persist_to_duckdb: bool,
    // ── Per-lane overrides (None = use preset default) ───────
    /// Override: brain model inference (GPU).
    #[serde(default)]
    pub brain_inference: Option<bool>,
    /// Override: helper model inference (GPU).
    #[serde(default)]
    pub helper_inference: Option<bool>,
    /// Override: escalation inference (GPU).
    #[serde(default)]
    pub escalation_inference: Option<bool>,
    /// Override: dense text embedding (CPU burst).
    #[serde(default)]
    pub embedding: Option<bool>,
    /// Override: cross-encoder reranking (CPU burst).
    #[serde(default)]
    pub reranking: Option<bool>,
    /// Override: speech-to-text (CPU burst).
    #[serde(default)]
    pub speech_to_text: Option<bool>,
    /// Override: text-to-speech (CPU burst).
    #[serde(default)]
    pub text_to_speech: Option<bool>,
    /// Override: vision embedding (CPU).
    #[serde(default)]
    pub vision_embedding: Option<bool>,
    /// Override: vector search (disk).
    #[serde(default)]
    pub vector_retrieval: Option<bool>,
    /// Override: relational query (disk).
    #[serde(default)]
    pub relational_query: Option<bool>,
    /// Override: analytical query (disk).
    #[serde(default)]
    pub analytical_query: Option<bool>,
    /// Override: in-memory cache lookup.
    #[serde(default)]
    pub cache_lookup: Option<bool>,
    /// Override: prompt assembly (CPU).
    #[serde(default)]
    pub prompt_assembly: Option<bool>,
    /// Override: full thinking pipeline (end-to-end).
    #[serde(default)]
    pub thinking_pipeline: Option<bool>,
}

impl Default for LaneTraceBootConfig {
    fn default() -> Self {
        Self {
            preset: default_lane_preset(),
            verbose: false,
            persist_to_duckdb: true,
            brain_inference: None,
            helper_inference: None,
            escalation_inference: None,
            embedding: None,
            reranking: None,
            speech_to_text: None,
            text_to_speech: None,
            vision_embedding: None,
            vector_retrieval: None,
            relational_query: None,
            analytical_query: None,
            cache_lookup: None,
            prompt_assembly: None,
            thinking_pipeline: None,
        }
    }
}

impl LaneTraceBootConfig {
    /// Resolve preset + per-lane overrides into the public `LaneTraceConfig`.
    pub fn to_lane_trace_config(&self) -> LaneTraceConfig {
        let preset_defaults = match self.preset.as_str() {
            "off" => LanePreset::off(),
            "debug" => LanePreset::debug(),
            _ => LanePreset::standard(), // "standard" or unknown → standard
        };

        let resolve = |override_val: Option<bool>, preset_val: bool| -> bool {
            override_val.unwrap_or(preset_val)
        };

        let lanes = vec![
            LaneToggle { lane: ExecutionLane::BrainInference, enabled: resolve(self.brain_inference, preset_defaults.brain_inference) },
            LaneToggle { lane: ExecutionLane::HelperInference, enabled: resolve(self.helper_inference, preset_defaults.helper_inference) },
            LaneToggle { lane: ExecutionLane::EscalationInference, enabled: resolve(self.escalation_inference, preset_defaults.escalation_inference) },
            LaneToggle { lane: ExecutionLane::Embedding, enabled: resolve(self.embedding, preset_defaults.embedding) },
            LaneToggle { lane: ExecutionLane::Reranking, enabled: resolve(self.reranking, preset_defaults.reranking) },
            LaneToggle { lane: ExecutionLane::SpeechToText, enabled: resolve(self.speech_to_text, preset_defaults.speech_to_text) },
            LaneToggle { lane: ExecutionLane::TextToSpeech, enabled: resolve(self.text_to_speech, preset_defaults.text_to_speech) },
            LaneToggle { lane: ExecutionLane::VisionEmbedding, enabled: resolve(self.vision_embedding, preset_defaults.vision_embedding) },
            LaneToggle { lane: ExecutionLane::VectorRetrieval, enabled: resolve(self.vector_retrieval, preset_defaults.vector_retrieval) },
            LaneToggle { lane: ExecutionLane::RelationalQuery, enabled: resolve(self.relational_query, preset_defaults.relational_query) },
            LaneToggle { lane: ExecutionLane::AnalyticalQuery, enabled: resolve(self.analytical_query, preset_defaults.analytical_query) },
            LaneToggle { lane: ExecutionLane::CacheLookup, enabled: resolve(self.cache_lookup, preset_defaults.cache_lookup) },
            LaneToggle { lane: ExecutionLane::PromptAssembly, enabled: resolve(self.prompt_assembly, preset_defaults.prompt_assembly) },
            LaneToggle { lane: ExecutionLane::ThinkingPipeline, enabled: resolve(self.thinking_pipeline, preset_defaults.thinking_pipeline) },
        ];

        LaneTraceConfig {
            lanes,
            verbose: self.verbose,
            persist_to_duckdb: self.persist_to_duckdb,
        }
    }
}

/// Internal preset definitions — per-lane defaults for each named preset.
struct LanePreset {
    brain_inference: bool,
    helper_inference: bool,
    escalation_inference: bool,
    embedding: bool,
    reranking: bool,
    speech_to_text: bool,
    text_to_speech: bool,
    vision_embedding: bool,
    vector_retrieval: bool,
    relational_query: bool,
    analytical_query: bool,
    cache_lookup: bool,
    prompt_assembly: bool,
    thinking_pipeline: bool,
}

impl LanePreset {
    /// All lanes disabled.
    fn off() -> Self {
        Self {
            brain_inference: false,
            helper_inference: false,
            escalation_inference: false,
            embedding: false,
            reranking: false,
            speech_to_text: false,
            text_to_speech: false,
            vision_embedding: false,
            vector_retrieval: false,
            relational_query: false,
            analytical_query: false,
            cache_lookup: false,
            prompt_assembly: false,
            thinking_pipeline: false,
        }
    }

    /// Critical path: inference + orchestration + retrieval. Skip noisy lanes.
    fn standard() -> Self {
        Self {
            brain_inference: true,
            helper_inference: true,
            escalation_inference: true,
            embedding: true,
            reranking: true,
            speech_to_text: false,
            text_to_speech: false,
            vision_embedding: false,
            vector_retrieval: true,
            relational_query: false,
            analytical_query: false,
            cache_lookup: false,
            prompt_assembly: true,
            thinking_pipeline: true,
        }
    }

    /// All lanes enabled for comprehensive baseline collection.
    fn debug() -> Self {
        Self {
            brain_inference: true,
            helper_inference: true,
            escalation_inference: true,
            embedding: true,
            reranking: true,
            speech_to_text: true,
            text_to_speech: true,
            vision_embedding: true,
            vector_retrieval: true,
            relational_query: true,
            analytical_query: true,
            cache_lookup: true,
            prompt_assembly: true,
            thinking_pipeline: true,
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
fn default_lane_preset() -> String {
    "standard".to_string()
}
