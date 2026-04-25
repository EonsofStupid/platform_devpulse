//! Platform configuration types.
//!
//! Two layers:
//! - **Public** (`PlatformConfig`): TS-exported, what Tauri/frontend sees.
//! - **Internal** (`PlatformBootConfig`): TOML-driven boot config, never exposed to TS.
//!
//! Per-service enable/critical flags are exposed to the UI through
//! `Platform::services_status()` which derives its entries from
//! [`SERVICE_MANIFEST`](super::services::manifest::SERVICE_MANIFEST) —
//! there is no hand-maintained `DatabaseConfig` mirror.
//!
//! Store layout uses four scopes:
//! - **system**: Kernel/engine internals (FSM, telemetry, boot state)
//! - **user**: User-owned data (sessions, messages, preferences, memory)
//! - **global**: Cross-project shared knowledge
//! - **project**: Per-project namespaced data (created on demand)

use devpulse_clyffy::cortex::grammar::GrammarConfig;
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
/// Per-service enable/critical flags are NOT embedded here — they are
/// served through `Platform::services_status()` which is derived from
/// the SSOT [`SERVICE_MANIFEST`](super::services::manifest::SERVICE_MANIFEST).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PlatformConfig {
    /// Root data directory path.
    pub data_dir: String,
    /// Whether portable mode is active.
    pub portable: bool,
}

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
    /// Vision embedding (`SigLIP2`). CPU.
    VisionEmbedding,
    // ── Storage lanes ───────────────────────────────────────
    /// Vector search (RRO/Qdrant). Disk-backed.
    VectorRetrieval,
    /// Relational query (libSQL). File-backed.
    RelationalQuery,
    /// Analytical query (`DuckDB`). File-backed.
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
            Self::BrainInference | Self::HelperInference | Self::EscalationInference => "gpu",

            Self::Embedding
            | Self::Reranking
            | Self::SpeechToText
            | Self::TextToSpeech
            | Self::VisionEmbedding
            | Self::PromptAssembly
            | Self::ThinkingPipeline => "cpu",

            Self::VectorRetrieval | Self::RelationalQuery | Self::AnalyticalQuery => "disk",

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

    /// TOML key name for this lane (`snake_case`).
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
    /// Write every trace to `DuckDB` for baseline analysis.
    pub persist_to_duckdb: bool,
}

// ═══════════════════════════════════════════════════════════════
// Internal boot config (TOML-driven, NOT TS-exported)
// ═══════════════════════════════════════════════════════════════

/// Embedded default config generated from repo-root platform fragments.
const DEFAULT_CONFIG: &str = include_str!(concat!(env!("OUT_DIR"), "/platform.default.toml"));

/// Root boot configuration deserialized from TOML.
#[derive(Debug, Clone, Deserialize, Default)]
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
#[derive(Debug, Clone, Deserialize, Default)]
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
    /// Grammar service — structured generation engine.
    #[serde(default)]
    pub grammar: GrammarConfig,
    /// Model Loader service (AI model management, inference).
    #[serde(default)]
    pub model_loader: ModelLoaderServiceEntry,
    /// `DevForge` service (managed `VSCode` process).
    #[serde(default)]
    pub devforge: DevForgeServiceEntry,
    /// Claude integration (MCP server, lanes, sidecar, API provider).
    #[serde(default)]
    pub claude: ClaudeServiceEntry,
    /// Ollama sidecar service (managed `ollama serve` child process).
    #[serde(default)]
    pub ollama: OllamaServiceEntry,
    /// SurrealDB sidecar service (managed `surreal start` child process).
    #[serde(default)]
    pub surreal: SurrealServiceEntry,
}

impl Default for SystemServicesConfig {
    fn default() -> Self {
        Self {
            relational: ServiceEntry::system_relational_default(),
            analytics: ServiceEntry::system_analytics_default(),
            graph: GraphServiceEntry::system_default(),
            cache: CacheServiceEntry::default(),
            vector: VectorServiceEntry::default(),
            grammar: GrammarConfig::default(),
            model_loader: ModelLoaderServiceEntry::default(),
            devforge: DevForgeServiceEntry::default(),
            claude: ClaudeServiceEntry::default(),
            ollama: OllamaServiceEntry::default(),
            surreal: SurrealServiceEntry::default(),
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
#[derive(Debug, Clone, Deserialize, Default)]
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
    /// Retrieval tuning parameters.
    #[serde(default)]
    pub retrieval: RetrievalBootConfig,
}

impl Default for VectorServiceEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            critical: true,
            kind: default_rro_kind(),
            path: default_rro_path(),
            retrieval: RetrievalBootConfig::default(),
        }
    }
}

impl VectorServiceEntry {
    /// Resolve the full storage path from data directory.
    pub fn resolve_path(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.path)
    }
}

// ═══════════════════════════════════════════════════════════════
// Retrieval config (public TS-exported + internal boot)
// ═══════════════════════════════════════════════════════════════

/// Named retrieval baseline presets.
///
/// Each preset defines a complete set of retrieval tuning parameters.
/// Research-validated for nomic-embed-text-v1.5 (768-dim, cosine) +
/// Qwen3-Reranker-0.6B (cross-encoder, top-100 eval baseline).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum RetrievalPreset {
    /// High precision, few results. `top_k=50`, threshold=0.70.
    Conservative,
    /// Default. Matches Qwen3 eval baseline. `top_k=100`, threshold=0.50.
    Balanced,
    /// Max recall, broad search. `top_k=200`, threshold=0.30.
    Aggressive,
    /// Tight filter, consensus-heavy. `top_k=50`, threshold=0.80.
    Precision,
}

impl RetrievalPreset {
    /// Resolve this preset into a full `RetrievalConfig`.
    #[must_use]
    pub fn to_config(&self) -> RetrievalConfig {
        match self {
            Self::Conservative => RetrievalConfig {
                preset: "conservative".to_string(),
                top_k: 50,
                score_threshold: 0.70,
                rerank_top_n: 5,
                fusion_k: 40,
            },
            Self::Balanced => RetrievalConfig {
                preset: "balanced".to_string(),
                top_k: 100,
                score_threshold: 0.50,
                rerank_top_n: 10,
                fusion_k: 30,
            },
            Self::Aggressive => RetrievalConfig {
                preset: "aggressive".to_string(),
                top_k: 200,
                score_threshold: 0.30,
                rerank_top_n: 20,
                fusion_k: 20,
            },
            Self::Precision => RetrievalConfig {
                preset: "precision".to_string(),
                top_k: 50,
                score_threshold: 0.80,
                rerank_top_n: 3,
                fusion_k: 50,
            },
        }
    }

    /// Parse a preset name string into a variant.
    #[must_use]
    pub fn from_name(name: &str) -> Option<Self> {
        match name {
            "conservative" => Some(Self::Conservative),
            "balanced" => Some(Self::Balanced),
            "aggressive" => Some(Self::Aggressive),
            "precision" => Some(Self::Precision),
            _ => None,
        }
    }
}

/// Runtime-mutable retrieval configuration (TS-exported).
///
/// Controls how the vector store returns and filters results.
/// Switchable via devtools preset buttons or per-field slider editing.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RetrievalConfig {
    /// Active preset name (for UI display). "custom" when manually tuned.
    pub preset: String,
    /// Maximum vectors to retrieve from ANN search.
    pub top_k: u32,
    /// Minimum similarity score to accept (0.0–1.0).
    pub score_threshold: f32,
    /// How many results to keep after reranking.
    pub rerank_top_n: u32,
    /// Fusion blend constant. Lower = stronger top-rank preference.
    /// 30 = local store default. 60 = web-scale.
    pub fusion_k: u32,
}

impl Default for RetrievalConfig {
    fn default() -> Self {
        RetrievalPreset::Balanced.to_config()
    }
}

/// Metadata for a single retrieval parameter — drives devtools UI.
///
/// The frontend renders sliders from this registry. Layman labels only.
/// Internal field names never appear in the UI.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RetrievalParamMeta {
    /// Internal field name on `RetrievalConfig` (e.g. "`top_k`").
    pub field: String,
    /// Human-readable label (e.g. "Search Depth").
    pub label: String,
    /// Capability family (e.g. "retrieval").
    pub family: String,
    /// One-line description for the UI.
    pub description: String,
    /// Slider minimum value.
    pub min: f32,
    /// Slider maximum value.
    pub max: f32,
    /// Slider step increment.
    pub step: f32,
}

/// Return the layman-labeled parameter registry for retrieval config.
///
/// The frontend calls this once on mount and renders sliders generically.
/// This is the SSOT for how params are presented — no labels hardcoded in Svelte.
#[must_use]
pub fn retrieval_param_meta() -> Vec<RetrievalParamMeta> {
    vec![
        RetrievalParamMeta {
            field: "top_k".to_string(),
            label: "Search Depth".to_string(),
            family: "retrieval".to_string(),
            description: "How many candidates to consider".to_string(),
            min: 10.0,
            max: 200.0,
            step: 10.0,
        },
        RetrievalParamMeta {
            field: "score_threshold".to_string(),
            label: "Relevance Floor".to_string(),
            family: "retrieval".to_string(),
            description: "Minimum match quality to accept".to_string(),
            min: 0.0,
            max: 1.0,
            step: 0.05,
        },
        RetrievalParamMeta {
            field: "rerank_top_n".to_string(),
            label: "Final Results".to_string(),
            family: "retrieval".to_string(),
            description: "How many results to keep after filtering".to_string(),
            min: 1.0,
            max: 50.0,
            step: 1.0,
        },
        RetrievalParamMeta {
            field: "fusion_k".to_string(),
            label: "Blend Strength".to_string(),
            family: "retrieval".to_string(),
            description: "How aggressively top matches are favored".to_string(),
            min: 10.0,
            max: 100.0,
            step: 5.0,
        },
    ]
}

/// Internal boot config for retrieval — TOML-driven, NOT TS-exported.
///
/// Mirrors the `LaneTraceBootConfig` pattern: a `preset` field selects
/// the baseline, optional per-field overrides take precedence.
#[derive(Debug, Clone, Deserialize)]
pub struct RetrievalBootConfig {
    /// Preset name: "conservative", "balanced", "aggressive", "precision".
    #[serde(default = "default_retrieval_preset")]
    pub preset: String,
    /// Override: max vectors from ANN search.
    #[serde(default)]
    pub top_k: Option<u32>,
    /// Override: minimum similarity score.
    #[serde(default)]
    pub score_threshold: Option<f32>,
    /// Override: results to keep after reranking.
    #[serde(default)]
    pub rerank_top_n: Option<u32>,
    /// Override: fusion blend constant.
    #[serde(default)]
    pub fusion_k: Option<u32>,
}

impl Default for RetrievalBootConfig {
    fn default() -> Self {
        Self {
            preset: default_retrieval_preset(),
            top_k: None,
            score_threshold: None,
            rerank_top_n: None,
            fusion_k: None,
        }
    }
}

impl RetrievalBootConfig {
    /// Resolve preset + per-field overrides into the public `RetrievalConfig`.
    #[must_use]
    pub fn to_retrieval_config(&self) -> RetrievalConfig {
        let base = RetrievalPreset::from_name(&self.preset)
            .unwrap_or(RetrievalPreset::Balanced)
            .to_config();

        RetrievalConfig {
            preset: self.preset.clone(),
            top_k: self.top_k.unwrap_or(base.top_k),
            score_threshold: self.score_threshold.unwrap_or(base.score_threshold),
            rerank_top_n: self.rerank_top_n.unwrap_or(base.rerank_top_n),
            fusion_k: self.fusion_k.unwrap_or(base.fusion_k),
        }
    }
}

fn default_retrieval_preset() -> String {
    "balanced".to_string()
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
    /// Relative path from `data_dir` to the models directory.
    #[serde(default = "default_models_dir")]
    pub models_dir: String,
    /// Subdirectory names for model discovery.
    #[serde(default)]
    pub subdirs: ModelSubdirsConfig,
    /// Download catalog — HF repos and options per slot.
    ///
    /// Slots themselves are NOT defined here — the kernel owns the slot
    /// registry via `kernel/model-loader/config/slots.default.toml`. The
    /// catalog is engine-level presentation data that the frontend model
    /// browser renders against each kernel slot id.
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
            catalog: Vec::new(),
        }
    }
}

impl ModelLoaderServiceEntry {
    /// Resolve the full models directory path via a first-hit-wins chain.
    ///
    /// Same chain in debug and release — no `cfg(debug_assertions)`
    /// branches. The app finds models in whichever location actually
    /// exists on the running machine:
    ///
    /// 1. **Sibling-of-exe** `<exe_dir>/models/` — the portable-zip
    ///    case. The end user unzips the distribution; `models/` is a
    ///    sibling of the exe they double-click. This is the primary
    ///    path for shipped builds because it IS the portable promise:
    ///    files next to the app.
    /// 2. **Repo-root** `<repo>/models/` — the dev case. The exe runs
    ///    from `target/debug/` or `target/release/`; we walk up looking
    ///    for a `Cargo.toml` + `interfaces/` pair, which uniquely
    ///    identifies this workspace. Lets dev machines share a single
    ///    on-disk models folder with the rest of the team.
    /// 3. **Configured path** (absolute or joined to `data_dir`) —
    ///    typically resolves to `<data_dir>/models/`, which is where
    ///    the model-loader feature downloads new models at user
    ///    request. The LAST fallback so bundled + dev-checked-in
    ///    models are always preferred over re-downloaded copies.
    ///
    /// The old code had a `#[cfg(debug_assertions)]` override in
    /// `platform/boot/model_loader.rs` that rebound a `let mut`
    /// locally. That release path silently skipped the dev models —
    /// this chain replaces it so release builds scan real directories
    /// instead of scanning an empty `.userdata/models/`.
    pub fn resolve_models_dir(&self, data_dir: &Path) -> PathBuf {
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(std::path::Path::to_path_buf));
        resolve_models_dir_chain(&self.models_dir, data_dir, exe_dir.as_deref())
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

// ── Catalog entry (exposed to frontend via specta) ──
//
// Slot / capability / device / loading-strategy / backend-type / source-tier
// shadow types used to live here. They are deleted — the engine no longer
// carries a parallel definition of the kernel's Slot vocabulary. Every
// deserialization of a slot now goes through kernel/model-loader/src/slots/
// defaults.rs via load_default_slots() at boot.

/// A download catalog entry — one per slot. Each has one or more download options.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CatalogEntry {
    /// Slot ID this catalog entry is for.
    pub slot_id: String,
    /// `ModelCapability` this entry targets (e.g., "`TextGeneration`", "Embedding").
    /// Used by the frontend to filter catalog entries by what the slot needs.
    #[serde(default)]
    pub capability: Option<String>,
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
    /// `HuggingFace` repository ID.
    pub repo: String,
    /// Filename to download.
    pub file: String,
    /// Approximate size in MB.
    pub size_mb: u32,
    /// Whether this is a directory download (e.g., Whisper models).
    #[serde(default)]
    pub is_dir: bool,
}

fn default_models_dir() -> String {
    "models".to_string()
}

/// Pure first-hit-wins resolver for the models directory.
///
/// Extracted from [`ModelLoaderServiceEntry::resolve_models_dir`] so it
/// is testable without touching `std::env::current_exe()` — the caller
/// passes in whatever `exe_dir` they want the walker to anchor on.
///
/// Chain:
/// 1. `<exe_dir>/models/` — portable zip case.
/// 2. `<repo>/models/` — dev workspace case; repo root detected by the
///    co-presence of `Cargo.toml` and `interfaces/` on the walk up.
/// 3. `configured_models_dir`, absolute or joined to `data_dir`.
///
/// Rule 3 always returns a path even when that path doesn't exist on
/// disk — it is the deterministic endpoint of the chain. Earlier rules
/// only trigger when the candidate directory actually exists, so there
/// is never an ambiguity about which one "wins".
pub(crate) fn resolve_models_dir_chain(
    configured_models_dir: &str,
    data_dir: &Path,
    exe_dir: Option<&Path>,
) -> PathBuf {
    // Rule 1: sibling-of-exe — the portable-zip case.
    if let Some(exe) = exe_dir {
        let sibling = exe.join("models");
        if sibling.is_dir() {
            return sibling;
        }
    }

    // Rule 2: repo-root — only hit when the exe runs from inside a
    // dev checkout (`target/debug/` or `target/release/`). On an
    // end-user install this walk fails at the filesystem root and
    // we fall through.
    if let Some(exe) = exe_dir {
        if let Some(repo_root) = find_repo_root(exe) {
            let repo_models = repo_root.join("models");
            if repo_models.is_dir() {
                return repo_models;
            }
        }
    }

    // Rule 3: configured path. Absolute passes through; relative
    // joins `data_dir` (typically `<LOCALAPPDATA>/DevPulse/models/`
    // on Windows).
    let configured = Path::new(configured_models_dir);
    if configured.is_absolute() {
        configured.to_path_buf()
    } else {
        data_dir.join(configured)
    }
}

/// Walk up from `start` looking for the monorepo root, defined as any
/// ancestor directory containing both `Cargo.toml` and `interfaces/`.
///
/// This is the same shape used by `xtask::workspace::find_root` — the
/// repo has exactly one directory that matches, so the check is
/// unambiguous. Returns `None` at filesystem root if no match.
fn find_repo_root(start: &Path) -> Option<PathBuf> {
    let mut dir = start.to_path_buf();
    loop {
        if dir.join("Cargo.toml").is_file() && dir.join("interfaces").is_dir() {
            return Some(dir);
        }
        if !dir.pop() {
            return None;
        }
    }
}
fn default_subdir_chat() -> String {
    "chat".to_string()
}
fn default_subdir_voice() -> String {
    "voice".to_string()
}
fn default_subdir_rag() -> String {
    "rag".to_string()
}
fn default_subdir_vision() -> String {
    "vision".to_string()
}

/// Configuration for the `DevForge` service (managed REH web server).
///
/// `DevForge` is a Layer 1 infrastructure service — a managed Node process
/// running the VS Code REH (Remote Extension Host) server. It boots
/// through the platform service pipeline like libSQL, `DuckDB`, etc.
///
/// The REH tree is fetched from `github.com/EonsofStupid/devforge`
/// releases via `cargo xtask fetch-devforge` and lives under
/// `interfaces/desktop/src-tauri/resources/devforge/<platform>/` at
/// build time. At runtime, the `server_dir` field points to either the
/// dev checkout or the fetched/bundled tree.
#[derive(Debug, Clone, Deserialize)]
pub struct DevForgeServiceEntry {
    /// Whether this service is enabled.
    #[serde(default)]
    pub enabled: bool,
    /// Whether boot fails if this service fails.
    #[serde(default)]
    pub critical: bool,
    /// Service mode: "reh" (client/server, full extension support) or
    /// "standalone" (legacy Electron — deprecated).
    #[serde(default = "default_devforge_mode")]
    pub mode: String,
    /// Port for the REH server. 0 = auto-pick a free port.
    #[serde(default)]
    pub port: u16,
    /// User data directory (relative to `data_dir`). REH `--user-data-dir`.
    #[serde(default = "default_devforge_user_data_dir")]
    pub user_data_dir: String,
    /// Extensions directory (relative to `data_dir`). REH `--extensions-dir`.
    #[serde(default = "default_devforge_extensions_dir")]
    pub extensions_dir: String,
    /// Workspace to open. "." means the `platform_devpulse` repo root.
    #[serde(default = "default_devforge_workspace_path")]
    pub workspace_path: String,
    /// Update channel URL for runtime patching.
    #[serde(default)]
    pub update_channel_url: String,
    /// Legacy binary path — only used in "standalone" mode.
    #[serde(default)]
    pub binary_path: String,
}

fn default_devforge_mode() -> String {
    "reh".to_string()
}
fn default_devforge_user_data_dir() -> String {
    "devforge/user-data".to_string()
}
fn default_devforge_extensions_dir() -> String {
    "devforge/extensions".to_string()
}

impl Default for DevForgeServiceEntry {
    fn default() -> Self {
        Self {
            enabled: false,
            critical: false,
            mode: default_devforge_mode(),
            port: 0,
            user_data_dir: default_devforge_user_data_dir(),
            extensions_dir: default_devforge_extensions_dir(),
            workspace_path: default_devforge_workspace_path(),
            update_channel_url: String::new(),
            binary_path: String::new(),
        }
    }
}

impl DevForgeServiceEntry {
    /// Resolve the user data directory from `data_dir`.
    pub fn resolve_user_data_dir(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.user_data_dir)
    }

    /// Resolve the extensions directory from `data_dir`.
    pub fn resolve_extensions_dir(&self, data_dir: &Path) -> PathBuf {
        data_dir.join(&self.extensions_dir)
    }

    /// Whether this entry is configured for REH mode.
    pub fn is_reh(&self) -> bool {
        self.mode == "reh"
    }
}

/// SurrealDB sidecar service entry — managed `surreal start` child process.
///
/// Spawns a child running the real SurrealDB server binary against a
/// RocksDB store at `{data_dir}/surreal/devpulse`. Attaches if a
/// compatible SurrealDB is already listening on the configured port
/// (identity probe via `/version`). Auto-bumps `+1` up to `max_bumps`
/// if the configured port is held by a foreign listener.
///
/// The server's bind host/port come from `[services.network.graph_api]`
/// (shared with the embedded path so `.claude/hooks/*.js` keep working
/// on the same URL after the cutover).
#[derive(Debug, Clone, Deserialize)]
pub struct SurrealServiceEntry {
    /// Whether this service is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Whether boot fails if this service fails. SurrealDB is critical —
    /// the graph store depends on it — defaults to `true`.
    #[serde(default = "default_true")]
    pub critical: bool,
    /// Explicit path to the `surreal` binary. Empty = resolve against
    /// sidecar bundle / standard install paths / PATH.
    #[serde(default)]
    pub binary_path: String,
    /// Whether to start at platform boot. Defaults to `true` — the
    /// graph store assumes the sidecar is running.
    #[serde(default = "default_true")]
    pub auto_start: bool,
    /// Root user passed to `surreal start --user`. Must match one of
    /// the NAMESPACE-scoped users created during boot so `/sql` auth
    /// works. Defaults to `root`.
    #[serde(default = "default_surreal_root_user")]
    pub root_user: String,
    /// Root password passed to `surreal start --pass`. Defaults to
    /// `root` — override in `platform.default.toml`.
    #[serde(default = "default_surreal_root_password")]
    pub root_password: String,
    /// `--log <level>` flag. Default `warn` to keep session logs clean.
    #[serde(default = "default_surreal_log_level")]
    pub log_level: String,
    /// Maximum `+1` port bumps when the configured port is foreign.
    /// `None` = use the allocator default (20).
    #[serde(default)]
    pub max_bumps: Option<u16>,
}

fn default_surreal_root_user() -> String {
    "root".to_string()
}
fn default_surreal_root_password() -> String {
    "root".to_string()
}
fn default_surreal_log_level() -> String {
    "warn".to_string()
}

impl Default for SurrealServiceEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            critical: true,
            binary_path: String::new(),
            auto_start: true,
            root_user: default_surreal_root_user(),
            root_password: default_surreal_root_password(),
            log_level: default_surreal_log_level(),
            max_bumps: None,
        }
    }
}

impl SurrealServiceEntry {
    /// Explicit binary path if configured, else `None`.
    #[must_use]
    pub fn resolved_binary(&self) -> Option<PathBuf> {
        let trimmed = self.binary_path.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(PathBuf::from(trimmed))
        }
    }
}

/// Ollama sidecar service entry — managed `ollama serve` child process.
///
/// Spawns a child running the Ollama HTTP server on `<host>:<port>`.
/// If Ollama is already listening when boot is requested, the service
/// attaches in observe-only mode instead of spawning a competing child.
/// Lazy-started by the devtool (or by boot when `auto_start = true`).
#[derive(Debug, Clone, Deserialize)]
pub struct OllamaServiceEntry {
    /// Whether this service is enabled. When `false`, lifecycle verbs
    /// return an explicit `disabled` error instead of spawning.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Whether boot fails if this service fails. Ollama is optional —
    /// defaults to `false`.
    #[serde(default)]
    pub critical: bool,
    /// Host the Ollama server binds to. Default `127.0.0.1`.
    #[serde(default = "default_ollama_host")]
    pub host: String,
    /// Port the Ollama server listens on. Default `11434`.
    #[serde(default = "default_ollama_port")]
    pub port: u16,
    /// Explicit path to the `ollama` binary. Empty = resolve against PATH.
    #[serde(default)]
    pub binary_path: String,
    /// Whether to start at platform boot. `false` = lazy start via devtool.
    #[serde(default)]
    pub auto_start: bool,
}

fn default_ollama_host() -> String {
    "127.0.0.1".to_string()
}
fn default_ollama_port() -> u16 {
    11434
}

impl Default for OllamaServiceEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            critical: false,
            host: default_ollama_host(),
            port: default_ollama_port(),
            binary_path: String::new(),
            auto_start: false,
        }
    }
}

impl OllamaServiceEntry {
    /// Resolve an explicit binary path if configured, else `None`
    /// (caller should fall back to PATH resolution).
    #[must_use]
    pub fn resolved_binary(&self) -> Option<PathBuf> {
        let trimmed = self.binary_path.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(PathBuf::from(trimmed))
        }
    }
}

/// Claude integration service entry — MCP server, lanes, sidecar, API provider.
///
/// Wraps the full `ClaudeConfig` from `crate::claude` with standard service
/// `enabled` + `critical` fields for the platform boot lifecycle.
#[derive(Debug, Clone, Deserialize)]
pub struct ClaudeServiceEntry {
    /// Whether Claude integration is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Whether boot fails if Claude integration fails.
    #[serde(default)]
    pub critical: bool,
    /// MCP server configuration.
    #[serde(default)]
    pub mcp: crate::claude::McpServerConfig,
    /// Sidecar configuration (internal builds only).
    #[serde(default)]
    pub sidecar: crate::claude::SidecarConfig,
    /// Claude Code CLI configuration (internal builds only).
    #[serde(default)]
    pub claude_code: crate::claude::ClaudeCodeConfig,
    /// API provider configuration (always available).
    #[serde(default)]
    pub api: crate::claude::ApiProviderConfig,
    /// Lane rate limit configuration.
    #[serde(default)]
    pub lanes: ClaudeLanesConfig,
    /// Council configuration.
    #[serde(default)]
    pub council: ClaudeCouncilConfig,
    /// Browser automation configuration (internal builds only).
    #[serde(default)]
    pub browser: crate::claude::BrowserAutomationConfig,
}

/// Lane rate limit configuration — internal + API lanes.
#[derive(Debug, Clone, Deserialize)]
pub struct ClaudeLanesConfig {
    /// Internal lane (Jesse's subscription).
    #[serde(default)]
    pub internal: LaneRateLimitEntry,
    /// API lane (customer key).
    #[serde(default)]
    pub api: LaneRateLimitEntry,
}

impl Default for ClaudeLanesConfig {
    fn default() -> Self {
        Self {
            internal: LaneRateLimitEntry {
                max_requests_per_minute: 60,
                max_tokens_per_day: 1_000_000,
                cooldown_after_429_ms: 5000,
                cost_cap_daily_usd: 0.0,
            },
            api: LaneRateLimitEntry {
                max_requests_per_minute: 20,
                max_tokens_per_day: 500_000,
                cooldown_after_429_ms: 10_000,
                cost_cap_daily_usd: 50.0,
            },
        }
    }
}

/// Rate limit configuration for a single lane.
#[derive(Debug, Clone, Deserialize)]
pub struct LaneRateLimitEntry {
    /// Max requests per minute before throttling.
    #[serde(default = "default_lane_rpm")]
    pub max_requests_per_minute: u32,
    /// Max tokens per day before hard stop.
    #[serde(default = "default_lane_tpd")]
    pub max_tokens_per_day: u64,
    /// Cooldown in ms after receiving a 429 from provider.
    #[serde(default = "default_lane_cooldown")]
    pub cooldown_after_429_ms: u64,
    /// Daily cost cap in USD. 0.0 = no cap.
    #[serde(default)]
    pub cost_cap_daily_usd: f64,
}

impl Default for LaneRateLimitEntry {
    fn default() -> Self {
        Self {
            max_requests_per_minute: 20,
            max_tokens_per_day: 500_000,
            cooldown_after_429_ms: 10_000,
            cost_cap_daily_usd: 50.0,
        }
    }
}

/// Council arbitration configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct ClaudeCouncilConfig {
    /// Arbitration mode. "`rule_based`" now, "`forge_jit`" future.
    #[serde(default = "default_council_mode")]
    pub mode: String,
    /// Try internal lane first.
    #[serde(default = "default_true")]
    pub prefer_internal: bool,
    /// Escalate to other lane on rate limit.
    #[serde(default = "default_true")]
    pub escalation_on_rate_limit: bool,
}

impl Default for ClaudeCouncilConfig {
    fn default() -> Self {
        Self {
            mode: "rule_based".to_string(),
            prefer_internal: true,
            escalation_on_rate_limit: true,
        }
    }
}

impl Default for ClaudeServiceEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            critical: false,
            mcp: crate::claude::McpServerConfig::default(),
            sidecar: crate::claude::SidecarConfig::default(),
            claude_code: crate::claude::ClaudeCodeConfig::default(),
            api: crate::claude::ApiProviderConfig::default(),
            lanes: ClaudeLanesConfig::default(),
            council: ClaudeCouncilConfig::default(),
            browser: crate::claude::BrowserAutomationConfig::default(),
        }
    }
}

fn default_lane_rpm() -> u32 {
    20
}
fn default_lane_tpd() -> u64 {
    500_000
}
fn default_lane_cooldown() -> u64 {
    10_000
}
fn default_council_mode() -> String {
    "rule_based".to_string()
}

fn default_system_user() -> String {
    "devpulse_engine".to_string()
}
fn default_system_password() -> String {
    "dp_sys_2026!".to_string()
}
fn default_devforge_workspace_path() -> String {
    ".".to_string()
}

// ═══════════════════════════════════════════════════════════════
// Network services + boot gate
// ═══════════════════════════════════════════════════════════════

/// Network services configuration — ports and bind addresses.
#[derive(Debug, Clone, Deserialize, Default)]
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
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
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
    /// Load boot config: composed embedded default, optionally overridden by user file.
    ///
    /// 1. Parse the compile-time config generated from `config/platform/**/*.toml`.
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
    /// Reads directly from parsed TOML via [`service_flags`](Self::service_flags).
    pub fn is_enabled_and_critical(
        &self,
        role: crate::platform::services::ServiceRole,
        scope: DataScope,
    ) -> bool {
        self.service_flags(role, scope)
            .is_some_and(|(enabled, critical)| enabled && critical)
    }

    /// Look up the `(enabled, critical)` flags for a manifest entry.
    ///
    /// Returns `None` if the `(role, scope)` pair has no corresponding
    /// config entry (e.g. `(Graph, Project)`). Every `(role, scope)` pair
    /// present in [`SERVICE_MANIFEST`](super::super::services::manifest::SERVICE_MANIFEST)
    /// MUST return `Some` — drift is caught by the
    /// `every_manifest_entry_has_config_flags` unit test in
    /// `services::manifest`.
    #[must_use]
    pub fn service_flags(
        &self,
        role: crate::platform::services::ServiceRole,
        scope: DataScope,
    ) -> Option<(bool, bool)> {
        use crate::platform::services::ServiceRole;
        match (role, scope) {
            (ServiceRole::Relational, DataScope::System) => Some((
                self.services.system.relational.enabled,
                self.services.system.relational.critical,
            )),
            (ServiceRole::Analytics, DataScope::System) => Some((
                self.services.system.analytics.enabled,
                self.services.system.analytics.critical,
            )),
            (ServiceRole::Graph, DataScope::System) => Some((
                self.services.system.graph.enabled,
                self.services.system.graph.critical,
            )),
            (ServiceRole::Cache, DataScope::System) => Some((
                self.services.system.cache.enabled,
                self.services.system.cache.critical,
            )),
            (ServiceRole::Vector, DataScope::System) => Some((
                self.services.system.vector.enabled,
                self.services.system.vector.critical,
            )),
            (ServiceRole::Grammar, DataScope::System) => Some((
                self.services.system.grammar.enabled,
                self.services.system.grammar.critical,
            )),
            (ServiceRole::ModelLoader, DataScope::System) => Some((
                self.services.system.model_loader.enabled,
                self.services.system.model_loader.critical,
            )),
            (ServiceRole::DevForge, DataScope::System) => Some((
                self.services.system.devforge.enabled,
                self.services.system.devforge.critical,
            )),
            (ServiceRole::Ollama, DataScope::System) => Some((
                self.services.system.ollama.enabled,
                self.services.system.ollama.critical,
            )),
            (ServiceRole::Surreal, DataScope::System) => Some((
                self.services.system.surreal.enabled,
                self.services.system.surreal.critical,
            )),
            (ServiceRole::Relational, DataScope::User) => Some((
                self.services.user.relational.enabled,
                self.services.user.relational.critical,
            )),
            (ServiceRole::Graph, DataScope::User) => Some((
                self.services.user.graph.enabled,
                self.services.user.graph.critical,
            )),
            (ServiceRole::Graph, DataScope::Global) => Some((
                self.services.global.graph.enabled,
                self.services.global.graph.critical,
            )),
            _ => None,
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
    /// Write every trace to `DuckDB`.
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
            LaneToggle {
                lane: ExecutionLane::BrainInference,
                enabled: resolve(self.brain_inference, preset_defaults.brain_inference),
            },
            LaneToggle {
                lane: ExecutionLane::HelperInference,
                enabled: resolve(self.helper_inference, preset_defaults.helper_inference),
            },
            LaneToggle {
                lane: ExecutionLane::EscalationInference,
                enabled: resolve(
                    self.escalation_inference,
                    preset_defaults.escalation_inference,
                ),
            },
            LaneToggle {
                lane: ExecutionLane::Embedding,
                enabled: resolve(self.embedding, preset_defaults.embedding),
            },
            LaneToggle {
                lane: ExecutionLane::Reranking,
                enabled: resolve(self.reranking, preset_defaults.reranking),
            },
            LaneToggle {
                lane: ExecutionLane::SpeechToText,
                enabled: resolve(self.speech_to_text, preset_defaults.speech_to_text),
            },
            LaneToggle {
                lane: ExecutionLane::TextToSpeech,
                enabled: resolve(self.text_to_speech, preset_defaults.text_to_speech),
            },
            LaneToggle {
                lane: ExecutionLane::VisionEmbedding,
                enabled: resolve(self.vision_embedding, preset_defaults.vision_embedding),
            },
            LaneToggle {
                lane: ExecutionLane::VectorRetrieval,
                enabled: resolve(self.vector_retrieval, preset_defaults.vector_retrieval),
            },
            LaneToggle {
                lane: ExecutionLane::RelationalQuery,
                enabled: resolve(self.relational_query, preset_defaults.relational_query),
            },
            LaneToggle {
                lane: ExecutionLane::AnalyticalQuery,
                enabled: resolve(self.analytical_query, preset_defaults.analytical_query),
            },
            LaneToggle {
                lane: ExecutionLane::CacheLookup,
                enabled: resolve(self.cache_lookup, preset_defaults.cache_lookup),
            },
            LaneToggle {
                lane: ExecutionLane::PromptAssembly,
                enabled: resolve(self.prompt_assembly, preset_defaults.prompt_assembly),
            },
            LaneToggle {
                lane: ExecutionLane::ThinkingPipeline,
                enabled: resolve(self.thinking_pipeline, preset_defaults.thinking_pipeline),
            },
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

#[cfg(test)]
mod models_dir_resolver_tests {
    use super::resolve_models_dir_chain;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicU64, Ordering};

    static SEQ: AtomicU64 = AtomicU64::new(0);

    /// Allocate a unique scratch directory for a single test, returning
    /// the absolute path. Caller deletes it explicitly — parallel tests
    /// each get their own, never collide.
    fn scratch(label: &str) -> PathBuf {
        let seq = SEQ.fetch_add(1, Ordering::Relaxed);
        let p = std::env::temp_dir().join(format!(
            "dp-models-resolver-{}-{}-{seq}",
            std::process::id(),
            label
        ));
        fs::create_dir_all(&p).unwrap();
        p
    }

    #[test]
    fn rule_1_sibling_of_exe_wins_when_it_exists() {
        let exe_dir = scratch("r1");
        fs::create_dir(exe_dir.join("models")).unwrap();
        let data_dir = scratch("r1-data");

        let resolved = resolve_models_dir_chain("models", &data_dir, Some(&exe_dir));

        assert_eq!(resolved, exe_dir.join("models"));
        fs::remove_dir_all(&exe_dir).unwrap();
        fs::remove_dir_all(&data_dir).unwrap();
    }

    #[test]
    fn rule_2_repo_root_models_hit_when_sibling_missing() {
        // Construct a fake repo: <repo>/Cargo.toml + <repo>/interfaces/
        // + <repo>/models/. Exe lives under <repo>/target/debug/exe_dir.
        // No sibling-of-exe models → rule 2 must walk up and find the
        // repo-root models.
        let repo = scratch("r2");
        fs::write(repo.join("Cargo.toml"), "[workspace]\n").unwrap();
        fs::create_dir(repo.join("interfaces")).unwrap();
        fs::create_dir(repo.join("models")).unwrap();
        let exe_dir = repo.join("target").join("debug");
        fs::create_dir_all(&exe_dir).unwrap();
        let data_dir = scratch("r2-data");

        let resolved = resolve_models_dir_chain("models", &data_dir, Some(&exe_dir));

        assert_eq!(resolved, repo.join("models"));
        fs::remove_dir_all(&repo).unwrap();
        fs::remove_dir_all(&data_dir).unwrap();
    }

    #[test]
    fn rule_3_fallback_to_configured_when_neither_rule_1_nor_2_hit() {
        // Exe in a directory that doesn't contain a repo root and has
        // no sibling models/. Expect fallback to data_dir/models.
        let exe_dir = scratch("r3");
        let data_dir = scratch("r3-data");

        let resolved = resolve_models_dir_chain("models", &data_dir, Some(&exe_dir));

        assert_eq!(resolved, data_dir.join("models"));
        fs::remove_dir_all(&exe_dir).unwrap();
        fs::remove_dir_all(&data_dir).unwrap();
    }

    #[test]
    fn rule_3_absolute_configured_path_bypasses_data_dir_join() {
        let exe_dir = scratch("r3abs");
        let data_dir = scratch("r3abs-data");
        let abs_models = scratch("r3abs-abs");

        let resolved =
            resolve_models_dir_chain(abs_models.to_str().unwrap(), &data_dir, Some(&exe_dir));

        assert_eq!(resolved, abs_models);
        fs::remove_dir_all(&exe_dir).unwrap();
        fs::remove_dir_all(&data_dir).unwrap();
        fs::remove_dir_all(&abs_models).unwrap();
    }

    #[test]
    fn no_exe_dir_skips_rules_1_and_2_cleanly() {
        // None for exe_dir means the app couldn't determine its own
        // path. Rules 1 + 2 must skip silently and fall to rule 3.
        let data_dir = scratch("noexe-data");

        let resolved = resolve_models_dir_chain("models", &data_dir, None);

        assert_eq!(resolved, data_dir.join("models"));
        fs::remove_dir_all(&data_dir).unwrap();
    }

    #[test]
    fn rule_1_dominates_rule_2_when_both_would_hit() {
        // Simulate the case where the dev also has a sibling models/
        // next to `target/debug/exe_dir`. Rule 1 (exe sibling) must
        // win — portable semantics trump dev-workspace semantics when
        // both are co-present.
        let repo = scratch("dom");
        fs::write(repo.join("Cargo.toml"), "[workspace]\n").unwrap();
        fs::create_dir(repo.join("interfaces")).unwrap();
        fs::create_dir(repo.join("models")).unwrap();
        let exe_dir = repo.join("target").join("debug");
        fs::create_dir_all(&exe_dir).unwrap();
        fs::create_dir(exe_dir.join("models")).unwrap();
        let data_dir = scratch("dom-data");

        let resolved = resolve_models_dir_chain("models", &data_dir, Some(&exe_dir));

        assert_eq!(resolved, exe_dir.join("models"));
        fs::remove_dir_all(&repo).unwrap();
        fs::remove_dir_all(&data_dir).unwrap();
    }

    #[test]
    fn empty_directory_at_rule_1_still_wins_over_rule_3() {
        // Sibling-of-exe models/ exists but is empty. It still wins —
        // the resolver picks by "does the directory exist", not "does
        // it contain files". An empty dir is the user's choice; model
        // discovery downstream handles empty dirs fine.
        let exe_dir = scratch("empty-r1");
        fs::create_dir(exe_dir.join("models")).unwrap();
        let data_dir = scratch("empty-r1-data");
        // Also populate rule-3 target to prove rule-1 still dominates.
        fs::create_dir(data_dir.join("models")).unwrap();
        fs::write(data_dir.join("models").join("placeholder.gguf"), b"x").unwrap();

        let resolved = resolve_models_dir_chain("models", &data_dir, Some(&exe_dir));

        assert_eq!(resolved, exe_dir.join("models"));
        fs::remove_dir_all(&exe_dir).unwrap();
        fs::remove_dir_all(&data_dir).unwrap();
    }
}
