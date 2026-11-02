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

use crate::signals::SignalKind;
use devpulse_clyffy::cortex::llguidance::GrammarConfig;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
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
    /// Relational query (Turso). File-backed.
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
    ///
    /// `match_same_arms` is allowed here because the lane → latency
    /// mapping is a per-lane design table: pairs that happen to share
    /// a default (Embedding/PromptAssembly = 50 ms,
    /// VisionEmbedding/HelperInference = 200 ms,
    /// SpeechToText/EscalationInference = 500 ms) are expected to
    /// diverge as we collect real p50s. Combining them with `|` would
    /// make the next tuning pass an unrelated diff.
    #[allow(clippy::match_same_arms)]
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
pub(crate) const DEFAULT_CONFIG: &str =
    include_str!(concat!(env!("OUT_DIR"), "/platform.default.toml"));

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
    /// Signal delivery tuning (`[signals]`). An override file without a
    /// `[signals]` section keeps the shipped default suggestions.
    #[serde(default = "SignalsConfig::shipped")]
    pub signals: SignalsConfig,
    /// Log organization and retention (`[logs]`). Kept as written here and
    /// checked against its schema by
    /// [`super::runtime::logs::LogsPolicy`], so a policy below its floors is
    /// refused by name instead of failing the whole config.
    #[serde(default)]
    pub logs: Option<toml::Value>,
    /// External services (`[integrations]`, `config/platform/integrations/`).
    #[serde(default)]
    pub integrations: super::integrations::IntegrationsConfig,
}

/// Signal delivery tuning from `config/platform/signals.toml`.
///
/// The shipped values are default suggestions; `{data_dir}/platform.toml`
/// overrides them. Keys are signal kinds, so an unknown kind fails parsing.
/// What a kind *is* (event or state) and its wire version are code — see
/// `SignalSpec` — because every consumer depends on them.
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
pub struct SignalsConfig {
    /// Minimum milliseconds between two UI deliveries of a kind; a newer
    /// value replaces one still waiting. Unlisted kinds are delivered every time.
    #[serde(default)]
    pub coalesce_ms: HashMap<SignalKind, u32>,
    /// How often a sampled producer runs while a window watches its kind.
    #[serde(default)]
    pub sample_interval_ms: HashMap<SignalKind, u32>,
}

impl SignalsConfig {
    /// The `[signals]` section of the shipped platform config — the single
    /// source of the default suggestions.
    #[must_use]
    pub fn shipped() -> Self {
        #[derive(Deserialize)]
        struct Shipped {
            #[serde(default)]
            signals: SignalsConfig,
        }
        match toml::from_str::<Shipped>(DEFAULT_CONFIG) {
            Ok(shipped) => shipped.signals,
            Err(err) => {
                tracing::error!(%err, "shipped [signals] config does not parse — no signal tuning applied");
                Self::default()
            }
        }
    }

    /// Minimum time between two UI deliveries of `kind` (zero = every signal).
    #[must_use]
    pub fn coalesce_window(&self, kind: SignalKind) -> Duration {
        Duration::from_millis(u64::from(self.coalesce_ms.get(&kind).copied().unwrap_or(0)))
    }

    /// Sampling period for a sampled producer of `kind`, if configured.
    #[must_use]
    pub fn sample_interval(&self, kind: SignalKind) -> Option<Duration> {
        self.sample_interval_ms
            .get(&kind)
            .map(|ms| Duration::from_millis(u64::from(*ms)))
    }
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
    /// Relational store (Turso) — kernel state, boot records.
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
    /// Model Loader service (`AI` model management, inference).
    #[serde(default)]
    pub model_loader: ModelLoaderServiceEntry,
    /// `DevForge` service (managed `VSCode` process).
    #[serde(default)]
    pub devforge: DevForgeServiceEntry,
    /// `Claude` integration (`MCP` server, lanes, sidecar, `API` provider).
    #[serde(default)]
    pub claude: ClaudeServiceEntry,
    /// `Ollama` sidecar service (managed `ollama serve` child process).
    #[serde(default)]
    pub ollama: OllamaServiceEntry,
    /// `SurrealDB` sidecar service (managed `surreal start` child process).
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
    /// Relational store (Turso) — sessions, messages, user config.
    #[serde(default = "ServiceEntry::user_relational_default")]
    pub relational: ServiceEntry,
    /// Analytics store (`DuckDB`) — user/project stats: ROTI,
    /// perceived turn timing, daily rollups, mood, teaching moments.
    /// Separate file from system analytics so user data is
    /// independently backup/wipeable.
    #[serde(default = "ServiceEntry::user_analytics_default")]
    pub analytics: ServiceEntry,
    /// Graph store (`SurrealDB`) — user knowledge graph, memory.
    #[serde(default = "GraphServiceEntry::user_default")]
    pub graph: GraphServiceEntry,
}

impl Default for UserServicesConfig {
    fn default() -> Self {
        Self {
            relational: ServiceEntry::user_relational_default(),
            analytics: ServiceEntry::user_analytics_default(),
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
    /// Service kind identifier (e.g., "turso", "duckdb").
    #[serde(default)]
    pub kind: String,
    /// Relative path from data directory.
    #[serde(default)]
    pub path: String,
    /// Per-service retry config — overrides global defaults.
    #[serde(default)]
    pub retry: ServiceRetryConfig,
    /// Relational stores: how long an operation waits for a lock held by
    /// another connection before reporting busy.
    #[serde(default = "default_busy_timeout_ms")]
    pub busy_timeout_ms: u64,
}

/// Shipped suggestion for [`ServiceEntry::busy_timeout_ms`].
const fn default_busy_timeout_ms() -> u64 {
    5_000
}

impl ServiceEntry {
    /// Connection options for a relational (Turso) store.
    #[must_use]
    pub const fn turso_options(&self) -> crate::platform::TursoOptions {
        crate::platform::TursoOptions {
            busy_timeout: std::time::Duration::from_millis(self.busy_timeout_ms),
        }
    }

    /// System relational service defaults.
    pub fn system_relational_default() -> Self {
        Self {
            enabled: true,
            critical: true,
            kind: "turso".to_string(),
            path: "system/turso/platform.db".to_string(),
            retry: ServiceRetryConfig::default(),
            busy_timeout_ms: default_busy_timeout_ms(),
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
            busy_timeout_ms: default_busy_timeout_ms(),
        }
    }

    /// User relational service defaults.
    pub fn user_relational_default() -> Self {
        Self {
            enabled: true,
            critical: false,
            kind: "turso".to_string(),
            path: "user/turso/user.db".to_string(),
            retry: ServiceRetryConfig::default(),
            busy_timeout_ms: default_busy_timeout_ms(),
        }
    }

    /// User analytics service defaults.
    ///
    /// `critical = false` — user data being unavailable should not fail
    /// platform boot. The Clyffy AI runs without user analytics; the
    /// dashboard widgets simply render an empty state.
    pub fn user_analytics_default() -> Self {
        Self {
            enabled: true,
            critical: false,
            kind: "duckdb".to_string(),
            path: "user/duckdb/user-analytics.duckdb".to_string(),
            retry: ServiceRetryConfig::default(),
            busy_timeout_ms: default_busy_timeout_ms(),
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
    /// The models folder: the configured `models_dir`
    /// (`config/platform/services/system/model-loader.toml`). A relative
    /// path is under the data dir — `.userdata/models/` with the shipped
    /// `"models"`, in dev and in a portable build alike, since both resolve
    /// the data dir to the `.userdata/` in the `DevPulse` folder. An absolute
    /// path is used as given, for a user who keeps models elsewhere.
    pub fn resolve_models_dir(&self, data_dir: &Path) -> PathBuf {
        under_data_dir(data_dir, &self.models_dir)
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
/// through the platform service pipeline like Turso, `DuckDB`, etc.
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
    /// REH bind host. Loopback by default; non-loopback exposes the
    /// editor to the LAN — `DevPulse` does not gate this, the operator
    /// owns the security posture.
    #[serde(default = "default_devforge_host")]
    pub host: String,
    /// Maximum seconds `Platform::ensure_devforge_started` waits for
    /// the REH child to respond on its TCP port before declaring boot
    /// failed.
    #[serde(default = "default_devforge_startup_timeout_secs")]
    pub startup_timeout_secs: u64,
    /// Milliseconds between successive TCP-connect probes during the
    /// startup health wait.
    #[serde(default = "default_devforge_health_poll_interval_ms")]
    pub health_poll_interval_ms: u64,
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
fn default_devforge_host() -> String {
    "127.0.0.1".to_string()
}
fn default_devforge_startup_timeout_secs() -> u64 {
    30
}
fn default_devforge_health_poll_interval_ms() -> u64 {
    250
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
            host: default_devforge_host(),
            startup_timeout_secs: default_devforge_startup_timeout_secs(),
            health_poll_interval_ms: default_devforge_health_poll_interval_ms(),
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

    /// Whether this entry is configured for `REH` mode.
    pub fn is_reh(&self) -> bool {
        self.mode == "reh"
    }

    /// Startup-timeout knob materialised as a [`Duration`].
    #[must_use]
    pub fn startup_timeout(&self) -> Duration {
        Duration::from_secs(self.startup_timeout_secs)
    }

    /// Health-poll-interval knob materialised as a [`Duration`].
    #[must_use]
    pub fn health_poll_interval(&self) -> Duration {
        Duration::from_millis(self.health_poll_interval_ms)
    }
}

/// `SurrealDB` — upstream's server build, installed inside the `DevPulse`
/// folder and run as a supervised subprocess (plan 0007 Part S, owner
/// decision 6). Its port is `[services.network.graph_api]`.
///
/// Paths are relative to the data dir unless absolute.
#[derive(Debug, Clone, Deserialize)]
pub struct SurrealServiceEntry {
    /// Whether this service is enabled.
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Whether boot fails if this service fails. `SurrealDB` is critical —
    /// the graph store depends on it — defaults to `true`.
    #[serde(default = "default_true")]
    pub critical: bool,
    /// The server build to run. A store migrates one way when a newer
    /// server opens it, so changing this is an update step (export first).
    #[serde(default = "default_surreal_version")]
    pub version: String,
    /// Where builds are installed: `{install_dir}/{version}/surreal(.exe)`,
    /// with upstream's LICENSE beside it.
    #[serde(default = "default_surreal_install_dir")]
    pub install_dir: String,
    /// The store.
    #[serde(default = "default_surreal_data_path")]
    pub data_path: String,
    /// An explicit server binary instead of the installed build; empty =
    /// the installed build. Nothing outside the `DevPulse` folder is searched.
    #[serde(default)]
    pub binary_path: String,
    /// The server's log level.
    #[serde(default = "default_surreal_log_level")]
    pub log_level: String,
    /// The root user the server is started with.
    #[serde(default = "default_surreal_root_user")]
    pub root_user: String,
    /// Where the root password is kept: generated on the first start, inside
    /// the folder (a copied folder still opens its store), never synced.
    #[serde(default = "default_surreal_credentials_path")]
    pub credentials_path: String,
    /// How far past the configured port to look for a free one.
    #[serde(default = "default_surreal_max_bumps")]
    pub max_bumps: u16,
}

impl Default for SurrealServiceEntry {
    fn default() -> Self {
        Self {
            enabled: true,
            critical: true,
            version: default_surreal_version(),
            install_dir: default_surreal_install_dir(),
            data_path: default_surreal_data_path(),
            binary_path: String::new(),
            log_level: default_surreal_log_level(),
            root_user: default_surreal_root_user(),
            credentials_path: default_surreal_credentials_path(),
            max_bumps: default_surreal_max_bumps(),
        }
    }
}

impl SurrealServiceEntry {
    /// The folder of the configured build.
    #[must_use]
    pub fn build_dir(&self, data_dir: &Path) -> PathBuf {
        under_data_dir(data_dir, &self.install_dir).join(&self.version)
    }

    /// The server binary: `binary_path` when set, otherwise the configured
    /// build's.
    #[must_use]
    pub fn binary(&self, data_dir: &Path) -> PathBuf {
        if self.binary_path.trim().is_empty() {
            self.build_dir(data_dir)
                .join(format!("surreal{}", std::env::consts::EXE_SUFFIX))
        } else {
            under_data_dir(data_dir, self.binary_path.trim())
        }
    }

    /// The credentials file.
    #[must_use]
    pub fn credentials(&self, data_dir: &Path) -> PathBuf {
        under_data_dir(data_dir, &self.credentials_path)
    }

    /// The store.
    #[must_use]
    pub fn store(&self, data_dir: &Path) -> PathBuf {
        under_data_dir(data_dir, &self.data_path)
    }
}

/// A configured path: absolute as given, otherwise under the data dir. The
/// configuration writes `/` on every platform; a relative path is joined
/// part by part, so it reads with the platform's own separator.
fn under_data_dir(data_dir: &Path, configured: &str) -> PathBuf {
    let path = Path::new(configured);
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        configured
            .split(['/', '\\'])
            .filter(|part| !part.is_empty())
            .fold(data_dir.to_path_buf(), |dir, part| dir.join(part))
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
    /// Platform-owned data, observable through the included kernel and engine.
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
            // Bundled and available on demand; no automatic startup or config toggle.
            (ServiceRole::AgentHub, DataScope::System) => Some((true, false)),
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
            (ServiceRole::Analytics, DataScope::User) => Some((
                self.services.user.analytics.enabled,
                self.services.user.analytics.critical,
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
///
/// `struct_excessive_bools` is allowed because the field names map 1:1
/// onto the [`ExecutionLane`] variants (compile-checked at the
/// `LanePresetConfig::resolve` call site). A `HashMap<ExecutionLane, bool>`
/// would lose that compile-time guarantee for "every lane has a default."
#[allow(clippy::struct_excessive_bools)]
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
fn default_surreal_version() -> String {
    "3.0.5".to_owned()
}
fn default_surreal_install_dir() -> String {
    "global/runtimes/surreal".to_owned()
}
fn default_surreal_data_path() -> String {
    "surreal/devpulse".to_owned()
}
fn default_surreal_log_level() -> String {
    "warn".to_owned()
}
fn default_surreal_root_user() -> String {
    "root".to_owned()
}
fn default_surreal_credentials_path() -> String {
    "system/surreal/credentials.toml".to_owned()
}
fn default_surreal_max_bumps() -> u16 {
    20
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
#[allow(clippy::unwrap_used, clippy::expect_used)]
mod signals_config_tests {
    use super::{DEFAULT_CONFIG, PlatformBootConfig, SignalsConfig};
    use crate::signals::SignalKind;
    use std::time::Duration;

    #[test]
    fn shipped_defaults_come_from_the_platform_config() {
        let shipped = SignalsConfig::shipped();
        assert_eq!(
            shipped.coalesce_window(SignalKind::Hardware),
            Duration::from_secs(1)
        );
        assert_eq!(
            shipped.sample_interval(SignalKind::Hardware),
            Some(Duration::from_secs(2))
        );
        assert_eq!(shipped.coalesce_window(SignalKind::Chat), Duration::ZERO);

        let boot: PlatformBootConfig = toml::from_str(DEFAULT_CONFIG).unwrap();
        assert_eq!(boot.signals, shipped);
    }

    #[test]
    fn an_override_without_signals_keeps_the_shipped_defaults() {
        let parsed: SignalsConfigHolder = toml::from_str("").unwrap();
        assert_eq!(parsed.signals, SignalsConfig::shipped());
    }

    #[test]
    fn an_override_can_retune_a_kind() {
        let parsed: SignalsConfigHolder =
            toml::from_str("[signals.coalesce_ms]\nhardware = 250\n").unwrap();
        assert_eq!(
            parsed.signals.coalesce_window(SignalKind::Hardware),
            Duration::from_millis(250)
        );
    }

    #[test]
    fn an_unknown_kind_fails_parsing() {
        let parsed =
            toml::from_str::<SignalsConfigHolder>("[signals.coalesce_ms]\nhardwear = 250\n");
        assert!(parsed.is_err());
    }

    /// Just the `signals` field, deserialized exactly as `PlatformBootConfig` does.
    #[derive(serde::Deserialize)]
    struct SignalsConfigHolder {
        #[serde(default = "SignalsConfig::shipped")]
        signals: SignalsConfig,
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod models_dir_resolver_tests {
    use super::ModelLoaderServiceEntry;
    use std::fs;
    use std::path::PathBuf;

    fn entry(models_dir: &str) -> ModelLoaderServiceEntry {
        ModelLoaderServiceEntry {
            models_dir: models_dir.to_string(),
            ..ModelLoaderServiceEntry::default()
        }
    }

    #[test]
    fn relative_configured_path_is_under_the_data_dir() {
        let data_dir = PathBuf::from("devpulse").join(".userdata");

        assert_eq!(
            entry("models").resolve_models_dir(&data_dir),
            data_dir.join("models")
        );
    }

    #[test]
    fn absolute_configured_path_is_used_as_given() {
        let elsewhere = std::env::temp_dir().join("dp-models-elsewhere");
        let data_dir = PathBuf::from("devpulse").join(".userdata");

        assert_eq!(
            entry(elsewhere.to_str().unwrap()).resolve_models_dir(&data_dir),
            elsewhere
        );
    }

    #[test]
    fn a_models_folder_in_the_checkout_does_not_win_over_the_config() {
        // The dev layout that used to be probed: <repo>/models beside
        // <repo>/.userdata. The configured folder under the data dir wins.
        let repo = std::env::temp_dir().join(format!("dp-models-checkout-{}", std::process::id()));
        fs::create_dir_all(repo.join("models")).unwrap();
        fs::create_dir_all(repo.join("interfaces")).unwrap();
        fs::write(repo.join("Cargo.toml"), "[workspace]\n").unwrap();
        let data_dir = repo.join(".userdata");

        let resolved = entry("models").resolve_models_dir(&data_dir);

        assert_eq!(resolved, data_dir.join("models"));
        fs::remove_dir_all(&repo).unwrap();
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod surreal_paths_tests {
    use super::{DEFAULT_CONFIG, PlatformBootConfig, SurrealServiceEntry};
    use std::path::PathBuf;

    #[test]
    fn the_shipped_config_names_the_build_and_keeps_the_store_where_it_was() {
        let boot: PlatformBootConfig = toml::from_str(DEFAULT_CONFIG).unwrap();
        let surreal = &boot.services.system.surreal;
        let data_dir = PathBuf::from("devpulse").join(".userdata");

        assert_eq!(surreal.version, "3.0.5");
        assert_eq!(
            surreal.binary(&data_dir),
            data_dir
                .join("global")
                .join("runtimes")
                .join("surreal")
                .join("3.0.5")
                .join(format!("surreal{}", std::env::consts::EXE_SUFFIX))
        );
        // The store the embedded crate has been writing to.
        assert_eq!(
            surreal.store(&data_dir),
            data_dir.join("surreal").join("devpulse")
        );
        // As shown in the window: one separator, the platform's own.
        assert_eq!(
            surreal.store(&data_dir).display().to_string(),
            data_dir
                .join("surreal")
                .join("devpulse")
                .display()
                .to_string()
        );
    }

    #[test]
    fn absolute_paths_are_used_as_given() {
        let elsewhere = std::env::temp_dir().join("dp-surreal-elsewhere");
        let entry = SurrealServiceEntry {
            install_dir: elsewhere.join("builds").to_str().unwrap().to_owned(),
            data_path: elsewhere.join("store").to_str().unwrap().to_owned(),
            ..SurrealServiceEntry::default()
        };
        let data_dir = PathBuf::from("devpulse").join(".userdata");

        assert_eq!(
            entry.build_dir(&data_dir),
            elsewhere.join("builds").join("3.0.5")
        );
        assert_eq!(entry.store(&data_dir), elsewhere.join("store"));
    }

    #[test]
    fn an_override_without_the_new_keys_keeps_the_defaults() {
        let entry: SurrealServiceEntry = toml::from_str("enabled = true\n").unwrap();
        assert_eq!(entry.version, SurrealServiceEntry::default().version);
        assert_eq!(entry.data_path, "surreal/devpulse");
    }
}
