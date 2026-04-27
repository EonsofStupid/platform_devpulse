//! Platform engine — the sole public API for persistence, health, and config.
//!
//! The engine owns every service lifecycle: boot, health, shutdown.
//! Clyffy (kernel) provides low-level adapters. The engine wraps them
//! into managed services with config-driven boot and health orchestration.
//! Tauri desktop is the thin facade that calls into this engine via IPC.
//!
//! # Architecture
//! ```text
//! Tauri (facade) -> Platform Engine (this) -> Services -> Clyffy adapters (private)
//!              |
//!              +-- SystemHealth (public type)
//!              +-- InitEvent (public type)
//!              +-- PlatformConfig (public type)
//! ```
//!
//! # Data Scopes
//! ```text
//! .userdata/
//! ├── system/     Kernel internals (LibSQL, DuckDB, SurrealDB)
//! ├── user/       User data (LibSQL, SurrealDB)
//! ├── global/     Cross-project knowledge (SurrealDB)
//! ├── projects/   Per-project data (SurrealDB, on demand)
//! └── logs/       Rotated log files
//! ```

mod boot;
pub mod config;
#[allow(missing_docs)]
pub mod facade;
pub mod health;
pub mod init;
#[cfg(feature = "inference")]
pub mod integrations;
pub mod metrics;
pub mod module;
pub mod reasoning;
pub mod services;
pub mod telemetry;

pub use config::{
    retrieval_param_meta, sanitize_path, DataScope, ExecutionLane, LaneToggle, LaneTraceConfig,
    PlatformBootConfig, PlatformConfig, RetrievalConfig, RetrievalParamMeta, RetrievalPreset,
};
pub use health::{HealthStatus, SubsystemHealth, SystemHealth};
pub use init::{InitEvent, InitStatus};
pub use metrics::ProcessMetrics;
pub use reasoning::{
    GrammarFailure, GrammarHandle, GrammarKind, GrammarSnapshot, GrammarStatus, RroDepth, RroState,
    RroStateHandle, RroStateSnapshot, RroStateTransition,
};
pub use services::candle_config::CandleConfig;
pub use services::llama_cpp_embedded_config::LlamaCppEmbeddedConfig;
pub use services::ollama::OllamaModel;
pub use services::sherpa_streaming::{
    SherpaCompileInfo, SherpaInstalledModel, SherpaSessionInfo, SherpaStreamingService,
};
pub use services::surreal::{SurrealConfigView, SurrealHealth, SurrealService, SurrealStatus};
pub use services::surreal_config::SurrealUserConfig;
pub use services::voice_stt_config::VoiceSttConfig;
pub use services::voice_tts_config::VoiceTtsConfig;
pub use services::status::{ServiceRuntimeState, ServiceStatusSnapshot};
pub use services::{Service, ServiceRole, ServiceState};

// ════════════════════════════════════════════════════════════════
// Kernel re-exports — the engine's *declared public kernel API*
// ════════════════════════════════════════════════════════════════
//
// Every type below is a deliberate public-surface contract. Types
// renamed at the boundary use `as` to translate kernel-internal short
// names into engine-public prefixed names (the canonical example is
// `EntryType` → `KnowledgeEntryType`).
//
// Adding a new re-export here is an API decision — annotate with an
// `IP-NOTE:` comment explaining either *why this is vocabulary-safe*
// or *what rename was applied*. Glob re-exports (`pub use foo::*;`)
// are NOT permitted; every kernel type that crosses must be named.
//
// See `feedback_ip_boundary_is_vocabulary_not_wrappers.md` for the rule.

// IP-NOTE: persistence adapter traits + raw SQL value types. All names
// are generic (Analytics / Cache / LibSql / Sql{Adapter,Row,Value}) —
// no kernel vocabulary, no rename needed.
pub use devpulse_clyffy::cortex::persistence::{
    AnalyticsAdapter, CacheAdapter, DuckDbAdapter, LibSqlAdapter, SqlAdapter, SqlRow, SqlValue,
};

// IP-NOTE: knowledge-library types. Kernel uses short names
// (`EntryType`, `Reaction`, …); engine prefixes them with `Knowledge`
// so consumers see `KnowledgeEntryType`. The verbs `record_reaction`
// / `select_entry` are also re-prefixed. This IS the translation
// pattern — vocabulary rename at the seam, not a struct wrapper.
pub use devpulse_clyffy::cortex::knowledge::{
    record_reaction as knowledge_record_reaction, select_entry as knowledge_select_entry,
    EntryType as KnowledgeEntryType, Reaction as KnowledgeReaction,
    SelectedEntry as KnowledgeSelectedEntry, SelectionParams as KnowledgeSelectionParams,
    Tier as KnowledgeTier,
};

// IP-NOTE: model-loader concepts the desktop UI surfaces directly
// (registry entries, source-tier classification, slot identity).
// All names describe industry-standard concepts, no rename needed.
#[cfg(feature = "inference")]
pub use devpulse_clyffy::model_loader::{ModelRegistryEntry, ModelSourceTier, Slot};

// IP-NOTE: architecture + backend compatibility registry. Public face
// of the matrix the UI consumes for `ModelCompatibilityCard`. Names
// describe model formats (gguf, safetensors), GPU backends (cuda,
// metal), and arch families (LLaMA, Mistral) — all industry terms,
// no kernel vocabulary, no rename needed.
#[cfg(feature = "inference")]
pub use devpulse_clyffy::model_loader::registry::backends::ModelFormat;
#[cfg(feature = "inference")]
pub use devpulse_clyffy::model_loader::registry::{
    classify_arch_from_gguf, classify_arch_from_hf_config, installed_backends,
    resolve_compatibility, Alternative, AlternativeKind, ArchFamily, ArchId, ArchitectureSpec,
    BackendId, BackendInfo, BackendMatrix, FormatSupport, LoadError, Resolution, SupportStatus,
    SupportTier, UnsupportedReason,
};

use anyhow::Result;
use arc_swap::ArcSwapOption;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

use services::analytics::AnalyticsService;
use services::cache::CacheService;
use services::devforge::{resolve_devforge_server_dir, DevForgeService};
use services::graph::GraphService;
use services::ollama::OllamaService;
#[cfg(feature = "candle")]
// EmbedderService removed — slot-managed by model loader
#[cfg(feature = "candle")]
// WhisperService removed — slot-managed by model loader
#[cfg(feature = "inference")]
use services::model_loader::ModelLoaderService;
use services::project_db::ProjectDbManager;
use services::relational::RelationalService;
#[cfg(feature = "rro")]
use services::vector::VectorService;
use telemetry::TelemetryHandle;

// ═══════════════════════════════════════════════════════════════
// Service enumeration macro — THE single point of service listing
// ═══════════════════════════════════════════════════════════════

/// Enumerate every service field on Platform, applying `$action!(field)`.
///
/// This is the **single enumeration point** for all service iteration.
/// Health, shutdown, and validation all expand this macro. Adding a new
/// service = add ONE line here. Everything else derives automatically.
///
/// The `$action` parameter is a macro that receives `self.field_name`.
/// Feature gates are handled inline — non-compiled services are skipped.
macro_rules! for_each_service {
    ($self:ident, $action:ident) => {
        // SurrealDB sidecar — runs FIRST in health checks (the graph
        // scopes below hold WS clients; sidecar health is the upstream
        // signal).
        $action!($self.surreal);
        // System scope (boot order)
        $action!($self.system_relational);
        $action!($self.system_analytics);
        $action!($self.system_graph);
        $action!($self.system_cache);
        // User scope
        $action!($self.user_relational);
        $action!($self.user_graph);
        // Global scope
        $action!($self.global_graph);
        // Feature-gated services
        #[cfg(feature = "rro")]
        $action!($self.vector);
        #[cfg(feature = "inference")]
        $action!($self.model_loader);
        // DevForge is NOT in this macro — it's lazy-started on user demand
        // and lives in `ArcSwapOption`. Health + shutdown touch it manually.
    };
}

/// Reverse enumeration for shutdown (last booted = first shutdown).
macro_rules! for_each_service_rev {
    ($self:ident, $action:ident) => {
        #[cfg(feature = "inference")]
        $action!($self.model_loader);
        #[cfg(feature = "rro")]
        $action!($self.vector);
        $action!($self.global_graph);
        $action!($self.user_graph);
        $action!($self.user_relational);
        $action!($self.system_cache);
        $action!($self.system_graph);
        $action!($self.system_analytics);
        $action!($self.system_relational);
        // Surreal sidecar shuts down LAST — after every client has had a
        // chance to close its WS connection.
        $action!($self.surreal);
    };
}

/// Platform engine — sole public API for persistence, health, config.
///
/// Owns all service lifecycles. Tauri talks to this, never to clyffy directly.
/// All user-facing strings pass through `ip_term!()` at this boundary.
///
/// Services are organized by scope:
/// - `system_*`: Kernel internals, telemetry, FSM state
/// - `user_*`: User sessions, preferences, knowledge
/// - `global_*`: Cross-project shared knowledge graph
pub struct Platform {
    // ── SurrealDB sidecar ─────────────────────────────────────
    // Boot-time, not lazy: the graph scopes below hold WS clients
    // that depend on this process. Keep it first in the struct so
    // drop order shuts the clients down before killing the child.
    surreal: Option<Arc<SurrealService>>,
    // ── System scope ────────────────────────────────────────────
    system_relational: Option<Arc<RelationalService>>,
    system_analytics: Option<Arc<AnalyticsService>>,
    system_graph: Option<Arc<GraphService>>,
    system_cache: Option<Arc<CacheService>>,
    // ── User scope ──────────────────────────────────────────────
    user_relational: Option<Arc<RelationalService>>,
    user_graph: Option<Arc<GraphService>>,
    // ── Global scope ────────────────────────────────────────────
    global_graph: Option<Arc<GraphService>>,
    // ── Vector (RRO) ──────────────────────────────────────────
    #[cfg(feature = "rro")]
    vector: Option<Arc<VectorService>>,
    // Embedder + Whisper removed — slot-managed by model loader.
    // ── Model Loader (Inference) ──────────────────────────────
    #[cfg(feature = "inference")]
    model_loader: Option<Arc<ModelLoaderService>>,
    // ── DevForge (VSCode) — lazy, user-initiated ─────────────
    // NOT a boot-time service. First open of the code-editor window
    // calls `ensure_devforge_started()` which spawns the REH child
    // process and stores the Arc here. Lock-free reads via load_full.
    devforge: ArcSwapOption<DevForgeService>,
    // ── Ollama sidecar — lazy, user-initiated ────────────────
    // Devtool "Start" spawns `ollama serve` (or attaches if already
    // running) and stores the Arc here. Lock-free reads via load_full.
    ollama: ArcSwapOption<OllamaService>,
    // ── Sherpa streaming ASR — always constructed, state held here.
    // No child process — the service owns recognizers + session map
    // in-memory. Feature-gated behind `sherpa`; when that feature is
    // off, the handle is still present but every verb returns a
    // clear "feature not enabled" error.
    sherpa_streaming: Arc<SherpaStreamingService>,
    // ── Telemetry (lane tracing) ─────────────────────────────
    telemetry: Option<TelemetryHandle>,
    // ── Reasoning (RRO state machine) ────────────────────────
    // Always present — the handle is in-memory only. Kernel rumination
    // loop will drive transitions; the facade exposes snapshot + verbs.
    reasoning: RroStateHandle,
    // ── Grammar (structured-output constraint engine) ────────
    // Always present — in-memory facade for the kernel grammar engine.
    // Records enforcement / failure stats and exposes public toggle verbs.
    grammar: GrammarHandle,
    // ── Project scope ──────────────────────────────────────────
    /// Per-project databases, created on demand (not at boot).
    project_db: Arc<ProjectDbManager>,
    // ── Meta ────────────────────────────────────────────────────
    boot_config: PlatformBootConfig,
    boot_time: Instant,
    data_dir: PathBuf,
}

impl Platform {
    /// Boot the platform — initialize all enabled services from config.
    ///
    /// Runs a 3-phase pipeline:
    /// 1. Preflight — create directory hierarchy
    /// 2. Service boots — initialize each enabled service
    /// 3. Validation — verify critical services are ready
    ///
    /// Non-critical service failures result in degraded mode (service = None).
    /// Critical service failures (system relational, system graph) cause
    /// the entire boot to fail with an error.
    ///
    /// # Errors
    /// Returns error if:
    /// - Config loading or directory creation fails
    /// - A critical service (system relational, system graph) fails to boot
    pub async fn boot(
        data_dir: PathBuf,
        on_event: impl Fn(InitEvent) + Send + 'static,
        model_event_sink: Option<std::sync::Arc<dyn std::any::Any + Send + Sync>>,
    ) -> Result<Self> {
        let boot_time = Instant::now();
        let boot_config = PlatformBootConfig::load(&data_dir)?;

        let booted = boot::execute(&data_dir, &boot_config, &on_event, model_event_sink).await?;

        // Spawn telemetry handle after services boot.
        // Requires analytics service (DuckDB) for trace persistence.
        let telemetry = if boot_config.telemetry.enabled {
            booted.system_analytics.as_ref().map(|analytics| {
                let lane_config = boot_config.telemetry.lanes.to_lane_trace_config();
                tracing::info!(
                    preset = %boot_config.telemetry.lanes.preset,
                    persist = lane_config.persist_to_duckdb,
                    "Lane tracing enabled"
                );
                TelemetryHandle::spawn(lane_config, Arc::clone(analytics))
            })
        } else {
            tracing::info!("Lane tracing disabled");
            None
        };

        Ok(Self {
            surreal: booted.surreal,
            system_relational: booted.system_relational,
            system_analytics: booted.system_analytics,
            system_graph: booted.system_graph,
            system_cache: booted.system_cache,
            user_relational: booted.user_relational,
            user_graph: booted.user_graph,
            global_graph: booted.global_graph,
            #[cfg(feature = "rro")]
            vector: booted.vector,
            #[cfg(feature = "inference")]
            model_loader: booted.model_loader,
            devforge: ArcSwapOption::empty(),
            ollama: ArcSwapOption::empty(),
            sherpa_streaming: Arc::new(SherpaStreamingService::new(&data_dir)),
            project_db: Arc::new(ProjectDbManager::new()),
            telemetry,
            reasoning: RroStateHandle::new(),
            grammar: GrammarHandle::new(),
            boot_config,
            boot_time,
            data_dir,
        })
    }

    /// Get system health by pinging all active services.
    ///
    /// Uses `for_each_service!` — the single enumeration point for all
    /// service iteration. Adding a new service = add ONE line to the macro.
    pub async fn health(&self) -> SystemHealth {
        let mut subsystems = Vec::new();

        // Single enumeration point — health, shutdown, and validation
        // all expand this same macro with different per-service actions.
        macro_rules! ping {
            ($field:expr) => {
                if let Some(s) = &$field {
                    subsystems.push(ping_service(s.as_ref()).await);
                }
            };
        }
        for_each_service!(self, ping);

        // DevForge is lazy-started, not in the macro. Only ping it if
        // the user has opened the code-editor window at least once.
        if let Some(s) = self.devforge.load_full() {
            subsystems.push(ping_service(s.as_ref()).await);
        }
        // Ollama sidecar is lazy-started via the devtool. Only ping it
        // if the user has clicked Start at least once.
        if let Some(s) = self.ollama.load_full() {
            subsystems.push(ping_service(s.as_ref()).await);
        }

        let status = if subsystems.iter().all(|s| s.status == HealthStatus::Healthy) {
            HealthStatus::Healthy
        } else if subsystems.iter().any(|s| s.status == HealthStatus::Down) {
            HealthStatus::Degraded
        } else {
            HealthStatus::Unknown
        };

        SystemHealth {
            status,
            uptime_secs: self.boot_time.elapsed().as_secs(),
            subsystems,
        }
    }

    /// Get platform configuration (public-safe).
    pub fn config(&self) -> PlatformConfig {
        PlatformConfig {
            data_dir: self.data_dir.display().to_string(),
            portable: self.boot_config.portable.enabled,
        }
    }

    /// Snapshot every service in [`SERVICE_MANIFEST`] with its static
    /// metadata + the three dynamic signals (compiled / config / runtime).
    ///
    /// This is the SOLE authoritative surface for "what services does
    /// the platform know about, and what state are they in right now".
    /// The devtools config tab consumes it verbatim — there is no
    /// hand-maintained `DatabaseConfig` mirror.
    pub async fn services_status(&self) -> Vec<ServiceStatusSnapshot> {
        use services::status::{feature_gate_compiled_in, manifest_entries, snapshot_from};

        let grammar_runtime_enabled = self.grammar.snapshot().await.enabled;

        let mut out = Vec::with_capacity(manifest_entries().count());
        for meta in manifest_entries() {
            let compiled = feature_gate_compiled_in(meta);
            let (config_enabled, config_critical) = self
                .boot_config
                .service_flags(meta.role, meta.scope)
                .unwrap_or((false, false));

            let runtime_state = if !compiled {
                ServiceRuntimeState::NotCompiled
            } else if !config_enabled {
                ServiceRuntimeState::ConfigDisabled
            } else {
                self.runtime_state_for(meta.role, meta.scope, grammar_runtime_enabled)
            };

            out.push(snapshot_from(
                meta,
                config_enabled,
                config_critical,
                runtime_state,
            ));
        }
        out
    }

    /// Dispatch from (role, scope) → live `ServiceRuntimeState` by reading
    /// the matching accessor on `self`. Caller must have already ruled
    /// out `NotCompiled` / `ConfigDisabled` before invoking.
    fn runtime_state_for(
        &self,
        role: ServiceRole,
        scope: config::DataScope,
        grammar_runtime_enabled: bool,
    ) -> ServiceRuntimeState {
        use config::DataScope;
        let present = match (role, scope) {
            (ServiceRole::Relational, DataScope::System) => self.system_relational.is_some(),
            (ServiceRole::Analytics, DataScope::System) => self.system_analytics.is_some(),
            (ServiceRole::Graph, DataScope::System) => self.system_graph.is_some(),
            (ServiceRole::Cache, DataScope::System) => self.system_cache.is_some(),
            (ServiceRole::Relational, DataScope::User) => self.user_relational.is_some(),
            (ServiceRole::Graph, DataScope::User) => self.user_graph.is_some(),
            (ServiceRole::Graph, DataScope::Global) => self.global_graph.is_some(),
            #[cfg(feature = "rro")]
            (ServiceRole::Vector, DataScope::System) => self.vector.is_some(),
            #[cfg(not(feature = "rro"))]
            (ServiceRole::Vector, DataScope::System) => return ServiceRuntimeState::NotCompiled,
            #[cfg(feature = "inference")]
            (ServiceRole::ModelLoader, DataScope::System) => self.model_loader.is_some(),
            #[cfg(not(feature = "inference"))]
            (ServiceRole::ModelLoader, DataScope::System) => {
                return ServiceRuntimeState::NotCompiled
            }
            (ServiceRole::DevForge, DataScope::System) => self.devforge.load_full().is_some(),
            (ServiceRole::Ollama, DataScope::System) => {
                self.ollama.load_full().is_some()
            }
            (ServiceRole::Surreal, DataScope::System) => self.surreal.is_some(),
            (ServiceRole::Grammar, DataScope::System) => grammar_runtime_enabled,
            // Any (role, scope) pair not in SERVICE_MANIFEST shouldn't
            // reach here — manifest→runtime dispatch covers every entry.
            _ => return ServiceRuntimeState::Unknown,
        };
        if present {
            ServiceRuntimeState::Running
        } else {
            ServiceRuntimeState::Stopped
        }
    }

    /// Uptime in seconds since boot.
    pub fn uptime_secs(&self) -> u64 {
        self.boot_time.elapsed().as_secs()
    }

    // ── System scope accessors ──────────────────────────────────

    /// Get the system relational service (if enabled and booted).
    pub fn relational(&self) -> Option<&Arc<RelationalService>> {
        self.system_relational.as_ref()
    }

    /// Get the system analytics service (if enabled and booted).
    pub fn analytics(&self) -> Option<&Arc<AnalyticsService>> {
        self.system_analytics.as_ref()
    }

    /// Get the system graph service (if enabled and booted).
    pub fn graph(&self) -> Option<&Arc<GraphService>> {
        self.system_graph.as_ref()
    }

    /// Get the system cache service (if enabled and booted).
    pub fn cache(&self) -> Option<&Arc<CacheService>> {
        self.system_cache.as_ref()
    }

    // ── Vector accessor ────────────────────────────────────────

    /// Get the vector service (if enabled and booted).
    #[cfg(feature = "rro")]
    pub fn vector(&self) -> Option<&Arc<VectorService>> {
        self.vector.as_ref()
    }

    // ── User scope accessors ────────────────────────────────────

    /// Get the user relational service (if enabled and booted).
    pub fn user_relational(&self) -> Option<&Arc<RelationalService>> {
        self.user_relational.as_ref()
    }

    /// Get the user graph service (if enabled and booted).
    pub fn user_graph(&self) -> Option<&Arc<GraphService>> {
        self.user_graph.as_ref()
    }

    // ── Global scope accessors ──────────────────────────────────

    /// Get the global graph service (if enabled and booted).
    pub fn global_graph(&self) -> Option<&Arc<GraphService>> {
        self.global_graph.as_ref()
    }

    // Embedder + Whisper accessors removed — slot-managed by model loader.

    // ── Model Loader accessor ──────────────────────────────────────

    /// Get the model loader service (if enabled and booted).
    #[cfg(feature = "inference")]
    pub fn model_loader(&self) -> Option<&Arc<ModelLoaderService>> {
        self.model_loader.as_ref()
    }

    /// Get the model download catalog from the boot config.
    pub fn model_loader_catalog(&self) -> &[config::CatalogEntry] {
        &self.boot_config.services.system.model_loader.catalog
    }

    // ── DevForge accessor + lazy starter ───────────────────────

    /// Read the current `DevForge` service without spawning it.
    ///
    /// Returns `None` until the user first opens the code-editor window.
    /// Lock-free atomic load via `ArcSwapOption::load_full()`.
    #[must_use]
    pub fn devforge(&self) -> Option<Arc<DevForgeService>> {
        self.devforge.load_full()
    }

    /// Lazy-start `DevForge` (VS Code REH) and return the running service.
    ///
    /// This is the **only** path that spawns the Node child process.
    /// First call resolves the server tree via
    /// [`resolve_devforge_server_dir`], spawns `node out/server-main.js`,
    /// waits for the TCP health check, stores the result, and returns it.
    /// Subsequent calls return the cached service — `load_full` is atomic.
    ///
    /// # Errors
    /// - `DevForge` is not in REH mode (standalone is deprecated)
    /// - No REH tree on disk — user hasn't fetched or bundled it
    /// - `node` binary missing from the server tree
    /// - Health poll fails within [`crate::platform::services::devforge`]'s
    ///   startup timeout
    pub async fn ensure_devforge_started(&self) -> Result<Arc<DevForgeService>> {
        if let Some(existing) = self.devforge.load_full() {
            return Ok(existing);
        }

        let entry = &self.boot_config.services.system.devforge;
        if !entry.enabled {
            anyhow::bail!(
                "DevForge is disabled in config. Set `enabled = true` under \
                 [services.system.devforge] to use the code editor."
            );
        }
        if !entry.is_reh() {
            anyhow::bail!(
                "DevForge standalone mode is no longer supported — set `mode = \"reh\"` \
                 under [services.system.devforge] in your platform config."
            );
        }

        let server_dir = resolve_devforge_server_dir(&self.data_dir).ok_or_else(|| {
            anyhow::anyhow!(
                "No DevForge server tree found. Run `cargo xtask fetch-devforge \
                 --target win32-x64` or clone into deps/code-oss-reh-web/."
            )
        })?;

        let user_data_dir = entry.resolve_user_data_dir(&self.data_dir);
        let extensions_dir = entry.resolve_extensions_dir(&self.data_dir);

        tracing::info!(
            server_dir = %server_dir.display(),
            "DevForge lazy-start — spawning REH child process"
        );

        let service = DevForgeService::boot_reh(
            &server_dir,
            &user_data_dir,
            Some(&extensions_dir),
            None, // workspace_path — restored by the Tauri command layer
            entry.port,
        )
        .await?;

        let arc = Arc::new(service);
        self.devforge.store(Some(Arc::clone(&arc)));
        Ok(arc)
    }

    /// Stop a running `DevForge` REH child process.
    ///
    /// Atomically swaps the `ArcSwapOption` to `None` and awaits
    /// `Service::shutdown` on the taken Arc. Idempotent — calling when
    /// no child is running is a no-op returning `Ok(())`.
    ///
    /// # Errors
    /// Returns the underlying shutdown error if the REH child could not
    /// be killed cleanly (e.g. `start_kill` returned an OS error) —
    /// note that `wait` failures are already swallowed inside
    /// `DevForgeService::shutdown`.
    pub async fn devforge_stop(&self) -> Result<()> {
        use crate::platform::services::Service as _;
        let taken = self.devforge.swap(None);
        if let Some(service) = taken {
            tracing::info!("DevForge stop requested — shutting REH child");
            service.shutdown().await?;
        } else {
            tracing::debug!("devforge_stop called but no child running");
        }
        Ok(())
    }

    /// Restart the `DevForge` REH child process.
    ///
    /// Equivalent to [`devforge_stop`](Self::devforge_stop) followed by
    /// [`ensure_devforge_started`](Self::ensure_devforge_started). Useful
    /// when the child's workspace changes or a config edit needs to take
    /// effect.
    ///
    /// # Errors
    /// Returns whichever of `stop` or `start` fails first. Start errors
    /// preserve the typed causes from `ensure_devforge_started`.
    pub async fn devforge_restart(&self) -> Result<Arc<DevForgeService>> {
        self.devforge_stop().await?;
        self.ensure_devforge_started().await
    }

    // ── Ollama sidecar accessor + lifecycle ────────────────────

    /// Read the current Ollama sidecar service without spawning it.
    ///
    /// Returns `None` until the user clicks Start in the devtool (or
    /// boot ran with `auto_start = true`). Lock-free atomic load.
    #[must_use]
    pub fn ollama(&self) -> Option<Arc<OllamaService>> {
        self.ollama.load_full()
    }

    /// Get the managed `SurrealDB` sidecar, if boot succeeded.
    #[must_use]
    pub fn surreal(&self) -> Option<&Arc<SurrealService>> {
        self.surreal.as_ref()
    }

    /// Read-only access to the `SurrealDB` sidecar config entry.
    #[must_use]
    pub fn boot_config_surreal(&self) -> &config::SurrealServiceEntry {
        &self.boot_config.services.system.surreal
    }

    /// Serialize-friendly sidecar status for the Tauri command layer.
    ///
    /// Returns [`SurrealStatus::stopped`] if the sidecar is
    /// absent (either disabled in config or its boot failed).
    #[must_use]
    pub fn surreal_status(&self) -> SurrealStatus {
        match &self.surreal {
            Some(svc) => svc.snapshot(),
            None => SurrealStatus::stopped(
                self.boot_config
                    .services
                    .network
                    .graph_api
                    .port,
            ),
        }
    }

    /// Live-probe the sidecar and convert to a serialize-friendly result.
    pub async fn surreal_health(&self) -> SurrealHealth {
        match &self.surreal {
            None => SurrealHealth::stopped(),
            Some(svc) => match svc.adapter().ping().await {
                Ok(()) => SurrealHealth::up(),
                Err(e) => SurrealHealth::down(&format!("{e:#}")),
            },
        }
    }

    /// Load the user-scope editable overlay for the `SurrealDB` sidecar.
    ///
    /// Never errors — returns defaults if the file is missing or
    /// malformed. The devtool mounts this as the starting point for
    /// its Config tab draft.
    #[must_use]
    pub fn surreal_user_config_load(&self) -> SurrealUserConfig {
        services::surreal_config::load(&self.data_dir)
    }

    /// Persist a user-scope overlay atomically.
    ///
    /// Returns the clamped, normalized version that was written so the
    /// devtool can reflect the post-save state.
    ///
    /// # Errors
    /// Returns an error if the file could not be written.
    pub fn surreal_user_config_save(
        &self,
        cfg: &SurrealUserConfig,
    ) -> Result<SurrealUserConfig> {
        services::surreal_config::save(&self.data_dir, cfg)
    }

    /// Read-only view into the Ollama sidecar boot config entry.
    ///
    /// Used by the devtool to render the Config tab. Writes go through
    /// a future `save_config` verb that persists to user TOML; this
    /// accessor does not allocate.
    #[must_use]
    pub fn boot_config_ollama(&self) -> &config::OllamaServiceEntry {
        &self.boot_config.services.system.ollama
    }

    // ── Voice TTS config (user scope) ──────────────────────────

    /// Load user-scope TTS preferences from
    /// `{data_dir}/user/voice_tts.toml`.
    ///
    /// Never returns an error — on parse / IO failure, returns the
    /// defaults so the devtool can still render.
    #[must_use]
    pub fn voice_tts_config_load(&self) -> VoiceTtsConfig {
        services::voice_tts_config::load(&self.data_dir)
    }

    /// Persist user-scope TTS preferences atomically. Returns the
    /// clamped config that was actually written (speed clamped to
    /// `[0.5, 2.0]`, empty voice replaced by the default).
    ///
    /// # Errors
    /// - Creating the `user/` directory fails.
    /// - Temp-file write or rename fails.
    pub fn voice_tts_config_save(&self, cfg: &VoiceTtsConfig) -> Result<VoiceTtsConfig> {
        services::voice_tts_config::save(&self.data_dir, cfg)
    }

    // ── Voice STT config (user scope) ──────────────────────────

    /// Load user-scope STT preferences.
    #[must_use]
    pub fn voice_stt_config_load(&self) -> VoiceSttConfig {
        services::voice_stt_config::load(&self.data_dir)
    }

    /// Persist user-scope STT preferences atomically. Returns the
    /// clamped config.
    ///
    /// # Errors
    /// - Creating the `user/` directory fails.
    /// - Temp-file write or rename fails.
    pub fn voice_stt_config_save(&self, cfg: &VoiceSttConfig) -> Result<VoiceSttConfig> {
        services::voice_stt_config::save(&self.data_dir, cfg)
    }

    /// Directory where rotated session logs live
    /// (`{data_dir}/logs/session-*.jsonl`). Used by the shared
    /// `commands::sys::session_logs` tail helper.
    #[must_use]
    pub fn logs_dir(&self) -> PathBuf {
        self.data_dir.join("logs")
    }

    // ── Sherpa streaming ASR accessor ──────────────────────────

    /// Get the Sherpa streaming ASR service. Always present — feature
    /// gate is per-method, not per-service.
    #[must_use]
    pub fn sherpa_streaming(&self) -> &Arc<SherpaStreamingService> {
        &self.sherpa_streaming
    }

    // ── Candle runtime config (user scope) ────────────────────

    /// Load persisted Candle runtime preferences.
    #[must_use]
    pub fn candle_config_load(&self) -> CandleConfig {
        services::candle_config::load(&self.data_dir)
    }

    /// Persist Candle runtime preferences atomically. Returns the
    /// clamped value.
    ///
    /// # Errors
    /// - Creating the `user/` directory fails.
    /// - Temp-file write or rename fails.
    pub fn candle_config_save(&self, cfg: &CandleConfig) -> Result<CandleConfig> {
        services::candle_config::save(&self.data_dir, cfg)
    }

    // ── llama.cpp (embedded) config (user scope) ──────────────

    /// Load persisted llama.cpp-embedded runtime preferences.
    #[must_use]
    pub fn llama_cpp_embedded_config_load(&self) -> LlamaCppEmbeddedConfig {
        services::llama_cpp_embedded_config::load(&self.data_dir)
    }

    /// Persist llama.cpp-embedded runtime preferences atomically.
    /// Returns the clamped value.
    ///
    /// # Errors
    /// - Creating the `user/` directory fails.
    /// - Temp-file write or rename fails.
    pub fn llama_cpp_embedded_config_save(
        &self,
        cfg: &LlamaCppEmbeddedConfig,
    ) -> Result<LlamaCppEmbeddedConfig> {
        services::llama_cpp_embedded_config::save(&self.data_dir, cfg)
    }

    /// Lazy-start Ollama and return the running service.
    ///
    /// First call reads the config entry, probes the port, and either
    /// attaches (if Ollama is already running) or spawns
    /// `<binary_path> serve` and waits for health. Subsequent calls
    /// return the cached service.
    ///
    /// # Errors
    /// - Ollama is disabled in config.
    /// - Binary is not on PATH and no valid `binary_path` is configured,
    ///   and nothing is already listening on the configured port.
    /// - Spawned child fails health poll within the service timeout.
    pub async fn ensure_ollama_started(&self) -> Result<Arc<OllamaService>> {
        if let Some(existing) = self.ollama.load_full() {
            return Ok(existing);
        }

        let entry = &self.boot_config.services.system.ollama;
        if !entry.enabled {
            anyhow::bail!(
                "Ollama sidecar is disabled in config. Set `enabled = true` under \
                 [services.system.ollama] to use this service."
            );
        }

        let service = OllamaService::boot(
            &entry.host,
            entry.port,
            entry.resolved_binary(),
        )
        .await?;

        let arc = Arc::new(service);
        self.ollama.store(Some(Arc::clone(&arc)));
        Ok(arc)
    }

    /// Stop a running Ollama sidecar.
    ///
    /// Atomically swaps the slot to `None` and awaits `Service::shutdown`
    /// on the taken Arc. Attached-mode services return `Ok(())` without
    /// touching the external Ollama. Idempotent.
    ///
    /// # Errors
    /// Returns the underlying shutdown error if the managed child could
    /// not be killed cleanly.
    pub async fn ollama_stop(&self) -> Result<()> {
        use crate::platform::services::Service as _;
        let taken = self.ollama.swap(None);
        if let Some(service) = taken {
            tracing::info!("Ollama sidecar stop requested");
            service.shutdown().await?;
        } else {
            tracing::debug!("ollama_stop called but nothing running");
        }
        Ok(())
    }

    /// Restart the Ollama sidecar.
    ///
    /// Equivalent to [`ollama_stop`](Self::ollama_stop)
    /// followed by
    /// [`ensure_ollama_started`](Self::ensure_ollama_started).
    ///
    /// # Errors
    /// Returns whichever of `stop` or `start` fails first.
    pub async fn ollama_restart(&self) -> Result<Arc<OllamaService>> {
        self.ollama_stop().await?;
        self.ensure_ollama_started().await
    }

    // ── Project scope accessor ──────────────────────────────────

    /// Get the per-project database manager.
    ///
    /// Not a boot-time service — project databases are created on demand
    /// when a project is registered and opened lazily on access.
    pub fn project_db(&self) -> &Arc<ProjectDbManager> {
        &self.project_db
    }

    // ── Telemetry accessor ──────────────────────────────────────

    /// Get the telemetry handle (if enabled and analytics booted).
    ///
    /// Not a `Service` — no lifecycle, no ping. The handle's background
    /// writer shuts down naturally when the `Platform` drops.
    pub fn telemetry(&self) -> Option<&TelemetryHandle> {
        self.telemetry.as_ref()
    }

    // ── Reasoning accessor (RRO state machine) ──────────────────

    /// Get the RRO state handle.
    ///
    /// Always present — the handle is in-memory, independent of persistence
    /// services. The kernel rumination loop drives transitions; the façade
    /// exposes snapshot + public verbs (gather/purge/fork).
    pub fn reasoning(&self) -> &RroStateHandle {
        &self.reasoning
    }

    // ── Grammar accessor (structured-output constraint engine) ──

    /// Get the grammar handle.
    ///
    /// Always present — in-memory facade, independent of persistence services.
    /// The kernel grammar engine drives enforcement / failure counters through
    /// `record_enforcement` / `record_failure`; the façade exposes snapshot +
    /// public verbs (`set_kind` / `enable` / `disable`) and a broadcast
    /// subscription for live UI updates.
    pub fn grammar(&self) -> &GrammarHandle {
        &self.grammar
    }

    /// Graceful shutdown — close all services in reverse boot order.
    ///
    /// Uses `for_each_service_rev!` — the same enumeration point as health,
    /// but in reverse. Flushes WALs, checkpoints databases, releases file
    /// locks within a 5-second deadline.
    #[allow(clippy::cast_possible_truncation)]
    pub async fn shutdown(&self) {
        let start = Instant::now();
        tracing::info!("Platform shutting down — closing services");
        let deadline = std::time::Duration::from_secs(5);

        macro_rules! shutdown_one {
            ($field:expr) => {
                if let Some(s) = &$field {
                    let elapsed = start.elapsed();
                    if elapsed >= deadline {
                        tracing::warn!(
                            service = s.name(),
                            "Shutdown deadline exceeded — skipping remaining"
                        );
                    } else {
                        let remaining = deadline - elapsed;
                        match tokio::time::timeout(remaining, s.shutdown()).await {
                            Ok(Ok(())) => {
                                tracing::debug!(service = s.name(), "Service shutdown OK");
                            }
                            Ok(Err(e)) => {
                                tracing::warn!(service = s.name(), error = %e, "Service shutdown error");
                            }
                            Err(_) => {
                                tracing::warn!(service = s.name(), "Service shutdown timed out");
                            }
                        }
                    }
                }
            };
        }

        // DevForge first (it's the user-facing tool, shut it down before
        // infrastructure so the REH child doesn't see sockets vanish).
        // Wrapped as Some(_) so the macro's `if let Some(s) = &$field`
        // pattern matches the loaded Arc.
        let devforge_guard = self.devforge.swap(None);
        shutdown_one!(devforge_guard);

        for_each_service_rev!(self, shutdown_one);

        // Project databases are not in the macro — they're on-demand, not boot-time.
        self.project_db.shutdown().await;

        let elapsed = start.elapsed();
        tracing::info!(
            elapsed_ms = elapsed.as_millis() as u64,
            "Platform shutdown complete"
        );
    }

    /// Get the data directory.
    pub fn data_dir(&self) -> &PathBuf {
        &self.data_dir
    }

    /// Get the boot config.
    pub fn boot_config(&self) -> &PlatformBootConfig {
        &self.boot_config
    }
}

// ═══════════════════════════════════════════════════════════════
// Health check utility
// ═══════════════════════════════════════════════════════════════

/// Ping a single service and return its health.
#[allow(clippy::cast_possible_truncation)]
async fn ping_service<S: Service>(svc: &S) -> SubsystemHealth {
    let start = Instant::now();
    let result = svc.ping().await;
    let latency_us = start.elapsed().as_micros() as u64;

    match result {
        Ok(()) => SubsystemHealth {
            name: svc.name().to_string(),
            state: svc.state(),
            status: HealthStatus::Healthy,
            latency_us: Some(latency_us),
            message: None,
        },
        Err(e) => {
            tracing::warn!(
                service = svc.name(),
                error = ?e,
                "Health ping failed"
            );
            SubsystemHealth {
                name: svc.name().to_string(),
                state: svc.state(),
                status: HealthStatus::Down,
                latency_us: Some(latency_us),
                message: Some(format!("{e:#}")),
            }
        }
    }
}
