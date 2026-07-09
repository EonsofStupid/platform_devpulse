//! Platform engine — the sole public API for persistence, health, and config.
//!
//! The engine owns every service lifecycle: boot, health, shutdown.
//! DevPulse's own store (`devpulse-store`: Turso + DuckDB + Moka) provides
//! the local adapters; the engine wraps them into managed services with
//! config-driven boot and health orchestration. AI services are Clyffy's,
//! served from GB10 over the wire. Tauri desktop is the thin facade.
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
//! ├── system/     System stores (Turso relational, DuckDB analytics, Moka cache)
//! ├── user/       User data (Turso relational, DuckDB analytics)
//! ├── projects/   Per-project data (Turso + DuckDB, on demand)
//! └── logs/       Rotated log files
//! ```

pub mod assistant;
mod boot;
pub mod community;
pub mod config;
#[allow(missing_docs)]
pub mod facade;
pub mod hardware;
pub mod health;
pub mod init;
pub mod interactions;
pub mod knowledge;
// There is no integrations bridge module — model events come from
// Clyffy over the gb10-client wire.
pub mod metrics;
// Model-loader MANAGEMENT layer (absorbed from the former kernel crate,
// 2026-07). DevPulse-local, links no inference backend.
pub mod model_loader;
pub mod model_registry;
pub mod module;
pub mod services;
pub mod telemetry;
pub mod wizard;

pub use assistant::{
    AssistantAction, AssistantConfig, IdentityConfig, KeywordActionEntry, OffloadConfig, TtsConfig,
    VoiceBrainConfig, VoiceCloneEntry, WakeConfig, WindowConfig,
};
pub use community::{
    is_community_enabled, most_recent_sync_at, query_feed, set_community_enabled, upsert_feed_item,
    FeedItem, FeedKind, DEFAULT_FEED_TTL_SECS,
};
pub use config::{
    retrieval_param_meta, sanitize_path, DataScope, ExecutionLane, LaneToggle, LaneTraceConfig,
    PlatformBootConfig, PlatformConfig, RetrievalConfig, RetrievalParamMeta, RetrievalPreset,
};
pub use hardware::{HardwareMetrics, HardwareTier};
pub use health::{HealthStatus, SubsystemHealth, SystemHealth};
pub use init::{InitEvent, InitStatus};
pub use interactions::{InteractionPhase, InteractionTemplate, InteractionTrigger};
pub use knowledge::{
    record_reaction as knowledge_record_reaction, select_entry as knowledge_select_entry,
    sync_remote_entries as knowledge_sync_remote_entries, EntryType as KnowledgeEntryType,
    KnowledgeEntry, KnowledgeManifest, Reaction as KnowledgeReaction,
    SelectionParams as KnowledgeSelectionParams, Tier as KnowledgeTier,
};
pub use metrics::ProcessMetrics;
// Model-loader MANAGEMENT surface — DevPulse-local model management types +
// the `ModelLoaderService` facade. No inference symbols cross here (those
// are Clyffy's over the wire). See `platform::model_loader`.
pub use model_loader::{
    BackendType, BuildMode, ConfigBackend, DownloadScope, HfFileInfo, HfSearchResult, LoaderError,
    LoaderEvent, LoaderEventSink, LoadingStage, MemoryConfig, ModelCapability, ModelLoaderService,
    ModelMetadata, ModelRegistry, ModelRegistryEntry, ModelSource, ModelSourceTier, ModelStatus,
    NullEventSink, PersistenceClass, Slot, SlotRegistry, TracingEventSink, VoiceEntry,
    VoiceRegistry,
};
pub use model_registry::{
    classify_arch_from_hf_config, installed_backends, resolve_compatibility, BackendMatrix,
    LoadError, ModelFormat, Resolution,
};
pub use services::candle_config::CandleConfig;
pub use services::llama_cpp_embedded_config::LlamaCppEmbeddedConfig;
pub use services::routing_config::{
    EscalationConfig, EscalationTier, EscalationTierId, InferenceProvider, LatencyConfig,
    RoutingConfig,
};
pub use services::sherpa_streaming::{
    SherpaCompileInfo, SherpaInstalledModel, SherpaSessionInfo, SherpaStreamingService,
};
pub use services::sidecars::ollama::OllamaModel;
pub use services::status::{ServiceRuntimeState, ServiceStatusSnapshot};
pub use services::voice_stt_config::VoiceSttConfig;
pub use services::voice_tts_config::VoiceTtsConfig;
pub use services::{Service, ServiceRole, ServiceState};
pub use wizard::{
    emit_event as emit_analytics_event, AnalyticsEvent, TierDisplay, TierRole, WizardCopy,
};

// ════════════════════════════════════════════════════════════════
// Boundary re-exports — the engine's *declared public API*
// ════════════════════════════════════════════════════════════════
//
// Every type below is a deliberate public-surface contract. Types
// renamed at the boundary use `as` to translate module-internal short
// names into engine-public prefixed names (the canonical example is
// `EntryType` → `KnowledgeEntryType`).
//
// Adding a new re-export here is an API decision — annotate with an
// `IP-NOTE:` comment explaining either *why this is vocabulary-safe*
// or *what rename was applied*. Glob re-exports (`pub use foo::*;`)
// are NOT permitted; every type that crosses must be named.
//
// See `feedback_ip_boundary_is_vocabulary_not_wrappers.md` for the rule.

// Persistence adapter traits + raw SQL value types, from the DevPulse-owned
// store crate. Turso (relational SSOT), DuckDB (analytics), Moka
// (cache) live behind these agnostic traits.
pub use devpulse_store::{
    AnalyticsAdapter, CacheAdapter, DuckDbAdapter, SqlAdapter, SqlRow, SqlValue, TursoAdapter,
};

use anyhow::Result;
use arc_swap::ArcSwapOption;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

use services::analytics::AnalyticsService;
use services::cache::CacheService;
use services::devforge::{resolve_devforge_server_dir, DevForgePreflight, DevForgeService};
// EmbedderService removed — slot-managed by model loader
// WhisperService removed — slot-managed by model loader
use services::project_analytics::ProjectAnalyticsManager;
use services::project_db::ProjectDbManager;
use services::relational::RelationalService;
use services::sidecars::ollama::OllamaService;
use services::{lifecycle_phase, PreflightRegistry};
use telemetry::TelemetryHandle;

use crate::platform::facade::events::InternalEvent;
use devpulse_telemetry::prelude::{broadcast_channel, BroadcastSender};

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
        // System scope (boot order)
        $action!($self.system_relational);
        $action!($self.system_analytics);
        $action!($self.system_cache);
        // User scope
        $action!($self.user_relational);
        $action!($self.user_analytics);
        // DevForge is NOT in this macro — it's lazy-started on user demand
        // and lives in `ArcSwapOption`. Health + shutdown touch it manually.
    };
}

/// Reverse enumeration for shutdown (last booted = first shutdown).
macro_rules! for_each_service_rev {
    ($self:ident, $action:ident) => {
        $action!($self.user_analytics);
        $action!($self.user_relational);
        $action!($self.system_cache);
        $action!($self.system_analytics);
        $action!($self.system_relational);
    };
}

/// Platform engine — sole public API for persistence, health, config.
///
/// Owns all service lifecycles. Tauri talks to this, never to clyffy directly.
/// All user-facing strings pass through `ip_term!()` at this boundary.
///
/// Services are organized by scope:
/// Capacity of the platform-internal `InternalEvent` broadcast channel.
///
/// Sized at `1024` to match `DEV_CHANNEL_CAPACITY` in
/// [`crate::platform::facade`] — once `FacadeHandle` is wired into
/// boot, the facade will subscribe to this channel and fan out to the
/// dev-side stream at 1:1 capacity.
const INTERNAL_EVENT_CAPACITY: usize = 1024;

/// - `system_*`: Engine internals, telemetry, FSM state
/// - `user_*`: User sessions, preferences, knowledge
/// - `global_*`: Cross-project shared knowledge graph
pub struct Platform {
    // ── System scope ────────────────────────────────────────────
    system_relational: Option<Arc<RelationalService>>,
    system_analytics: Option<Arc<AnalyticsService>>,
    system_cache: Option<Arc<CacheService>>,
    // ── User scope ──────────────────────────────────────────────
    user_relational: Option<Arc<RelationalService>>,
    user_analytics: Option<Arc<AnalyticsService>>,
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
    // ── Model-loader MANAGEMENT service ──────────────────────
    // DevPulse-local model management (slot registry, discovery, download,
    // hardware auto-config). Constructed at `Platform::new` with the
    // atomic-TOML `ConfigBackend`; `None` when disabled by config — see
    // `construct_model_loader`. The inference half is Clyffy's over the
    // wire, not held here.
    model_loader: Option<Arc<model_loader::ModelLoaderService>>,
    // ── Project scope ──────────────────────────────────────────
    /// Per-project Turso databases, created on demand (not at boot).
    project_db: Arc<ProjectDbManager>,
    /// Per-project `DuckDB` analytics, created on demand.
    project_analytics: Arc<ProjectAnalyticsManager>,
    // ── Internal event broadcast bus ─────────────────────────
    // `InternalEvent` stream every observability subscriber (facade
    // bridge, minions, surface-events whitelist, governance) listens
    // on. Services emit via `emit_lifecycle_dual!` which pushes here
    // alongside the `sidecar.lifecycle` tracing event. Owning the
    // sender on `Platform` (rather than passing it externally) keeps
    // the channel alive for the platform's lifetime — drop order is
    // safe because senders without listeners just get `SendError`s
    // that callsites already ignore via `let _ = ...`.
    internal_tx: BroadcastSender<InternalEvent>,
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

        // Construct the platform-internal `InternalEvent` channel before
        // services boot so service emissions (preflight, ready, failed,
        // shutdown) all land on the same bus. The receiver count is
        // zero until subscribers attach — early sends just return
        // `SendError`, which callsites ignore.
        let (internal_tx, _) = broadcast_channel::<InternalEvent>(INTERNAL_EVENT_CAPACITY);

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

        // Read the persisted routing config at boot. Even fields with
        // no current consumer (audio_buffer_ms / vad_silence_ms /
        // stream_chunk_size) are logged at INFO so it's verifiable in
        // boot.log that the engine sees the persisted truth — the
        // values are real config waiting on a real consumer, not
        // write-to-nowhere preferences.
        let routing_at_boot = services::routing_config::load(&data_dir);
        tracing::info!(
            target: "routing.config",
            response_source = routing_at_boot.latency.response_source.as_str(),
            enabled_tier_count = routing_at_boot.escalation.enabled_tiers().count(),
            audio_buffer_ms = routing_at_boot.latency.audio_buffer_ms,
            vad_silence_ms = routing_at_boot.latency.vad_silence_ms,
            stream_chunk_size = routing_at_boot.latency.stream_chunk_size,
            "routing config loaded at boot"
        );

        // Model-loader MANAGEMENT service (DevPulse-local) —
        // see `construct_model_loader`.
        let model_loader = Self::construct_model_loader(&boot_config, &data_dir);

        Ok(Self {
            system_relational: booted.system_relational,
            system_analytics: booted.system_analytics,
            system_cache: booted.system_cache,
            user_relational: booted.user_relational,
            user_analytics: booted.user_analytics,
            model_loader,
            devforge: ArcSwapOption::empty(),
            ollama: ArcSwapOption::empty(),
            sherpa_streaming: Arc::new(SherpaStreamingService::new(&data_dir)),
            project_db: Arc::new(ProjectDbManager::new()),
            project_analytics: Arc::new(ProjectAnalyticsManager::new()),
            telemetry,
            internal_tx,
            boot_config,
            boot_time,
            data_dir,
        })
    }

    /// Construct the DevPulse-local model-loader MANAGEMENT
    /// service. Persisted via an atomic-TOML `ConfigBackend` under
    /// `{data_dir}/user/` (slot assignments / setup flags), matching the
    /// platform config convention; Turso stays the SSOT for real data, this is
    /// settings-like slot state. Inference is Clyffy's over the wire —
    /// management-only here. Returns `None` when disabled by config or when
    /// construction fails (management commands then report unavailable).
    fn construct_model_loader(
        boot_config: &PlatformBootConfig,
        data_dir: &std::path::Path,
    ) -> Option<Arc<model_loader::ModelLoaderService>> {
        let ml_entry = &boot_config.services.system.model_loader;
        if !ml_entry.enabled {
            tracing::info!(
                target: "model_loader.lifecycle",
                "Model-loader disabled by config (services.system.model_loader.enabled = false)"
            );
            return None;
        }
        let userdata_dir = data_dir.join("user");
        let models_dir = ml_entry.resolve_models_dir(data_dir);
        let subdirs = ml_entry.subdir_names();
        let presets = crate::platform::hardware::load_default_presets(&userdata_dir)
            .unwrap_or_else(|e| {
                tracing::warn!(
                    target: "model_loader.lifecycle",
                    error = %e,
                    "hardware presets load failed — continuing with none"
                );
                Vec::new()
            });
        let config: Box<dyn model_loader::ConfigBackend> =
            match model_loader::FileConfigBackend::load(&userdata_dir) {
                Ok(backend) => Box::new(backend),
                Err(e) => {
                    tracing::warn!(
                        target: "model_loader.lifecycle",
                        error = %e,
                        "model-loader config file unreadable — falling back to in-memory \
                         (assignments won't persist this session)"
                    );
                    Box::new(model_loader::MemoryConfig::new())
                }
            };
        let events: Arc<dyn model_loader::LoaderEventSink> =
            Arc::new(model_loader::TracingEventSink);
        match model_loader::ModelLoaderService::new(config, events, models_dir, subdirs, presets) {
            Ok(service) => {
                tracing::info!(
                    target: "model_loader.lifecycle",
                    "Model-loader management service constructed (atomic-TOML config)"
                );
                Some(Arc::new(service))
            }
            Err(e) => {
                tracing::error!(
                    target: "model_loader.lifecycle",
                    error = %e,
                    "Model-loader management construction FAILED — \
                     management commands will report unavailable"
                );
                None
            }
        }
    }

    /// Borrow the platform-internal `InternalEvent` broadcast sender.
    ///
    /// Subscribers (facade bridge, minions, surface-events whitelist,
    /// governance reactors) call `internal_tx().subscribe()` to receive
    /// the event stream. Services emit via [`emit_lifecycle_dual!`]
    /// which pushes here in lockstep with the `sidecar.lifecycle`
    /// tracing event — see `feedback_dual_observability.md`.
    #[must_use]
    pub fn internal_tx(&self) -> &BroadcastSender<InternalEvent> {
        &self.internal_tx
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
    #[expect(
        clippy::unused_async,
        reason = "kept async so the Tauri command signature stays uniform; Tier-2 runtime probes (grammar) move to the gb10-client (kernel-severance)"
    )]
    pub async fn services_status(&self) -> Vec<ServiceStatusSnapshot> {
        use services::status::{feature_gate_compiled_in, manifest_entries, snapshot_from};

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
                self.runtime_state_for(meta.role, meta.scope)
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
    ) -> ServiceRuntimeState {
        use config::DataScope;
        let present = match (role, scope) {
            (ServiceRole::Relational, DataScope::System) => self.system_relational.is_some(),
            (ServiceRole::Analytics, DataScope::System) => self.system_analytics.is_some(),
            (ServiceRole::Cache, DataScope::System) => self.system_cache.is_some(),
            (ServiceRole::Relational, DataScope::User) => self.user_relational.is_some(),
            (ServiceRole::Analytics, DataScope::User) => self.user_analytics.is_some(),
            (ServiceRole::DevForge, DataScope::System) => self.devforge.load_full().is_some(),
            (ServiceRole::Ollama, DataScope::System) => self.ollama.load_full().is_some(),
            // Tier-2 roles (Graph/Vector/ModelLoader/Surreal/Grammar) are
            // Clyffy's, served from GB10 — not local. Any manifest role
            // without a local accessor reports Unknown until the manifest
            // drops them from the enum.
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

    /// Get the system analytics service (Clyffy AI behavior telemetry).
    ///
    /// Holds AI-side metrics: LLM calls, layer budgets, governance,
    /// retrieval / lane / span traces, council performance, vision
    /// pipeline, platform telemetry. User-perceived metrics live on
    /// [`Platform::user_analytics`] in a separate `DuckDB` file.
    pub fn analytics(&self) -> Option<&Arc<AnalyticsService>> {
        self.system_analytics.as_ref()
    }

    /// Get the system cache service (if enabled and booted).
    pub fn cache(&self) -> Option<&Arc<CacheService>> {
        self.system_cache.as_ref()
    }

    // ── User scope accessors ────────────────────────────────────

    /// Get the user relational service (if enabled and booted).
    pub fn user_relational(&self) -> Option<&Arc<RelationalService>> {
        self.user_relational.as_ref()
    }

    /// Get the user analytics service (if enabled and booted).
    ///
    /// Holds user-perceived metrics: ROTI, perceived turn timing,
    /// daily rollups, mood timeline, teaching moments. Separate from
    /// [`Platform::analytics`] (system / Clyffy AI behavior store).
    pub fn user_analytics(&self) -> Option<&Arc<AnalyticsService>> {
        self.user_analytics.as_ref()
    }

    // ── Model-loader MANAGEMENT accessors ──────────────────────

    /// Get the model-loader MANAGEMENT service (if constructed at boot).
    ///
    /// Returns `None` when the service is disabled by config or failed to
    /// construct (see `construct_model_loader`). This is the DevPulse-local
    /// management surface only — inference (load/generate/embed/…) is
    /// Clyffy's over the gb10-client wire, not served through this handle.
    #[must_use]
    pub fn model_loader(&self) -> Option<&Arc<model_loader::ModelLoaderService>> {
        self.model_loader.as_ref()
    }

    /// The model download catalog — engine-level presentation data
    /// (`[services.system.model_loader.catalog]`) the model browser renders
    /// against each slot id. Pure boot-config data; always available.
    #[must_use]
    pub fn model_loader_catalog(&self) -> &[config::CatalogEntry] {
        &self.boot_config.services.system.model_loader.catalog
    }

    // There are no graph / vector / suggestion accessors — those AI services
    // are Clyffy's, served from GB10 over the gb10-client wire.
    // DevPulse-local keeps only the Tier-1 stores (Turso relational + DuckDB
    // analytics + Moka cache) plus the model-loader MANAGEMENT service above.

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

        // ── Preflight ─────────────────────────────────────────────
        // Run the modular preflight registry before touching any process
        // resources. Failures here abort the launch with a granular,
        // human-readable explanation instead of a partially-spawned
        // child + fail-late error path.
        let preflight_input = DevForgePreflight {
            entry,
            data_dir: &self.data_dir,
        };
        let mut registry = PreflightRegistry::new();
        registry.run(&preflight_input).await;

        let n_checks = registry.checks().len();
        let n_fails = registry.fails().count();
        crate::emit_lifecycle_dual!(
            self.internal_tx,
            ServiceRole::DevForge,
            lifecycle_phase::PREFLIGHT,
            format!("preflight ran {n_checks} checks, {n_fails} failed"),
            checks_run = n_checks,
            fails = n_fails
        );
        for c in registry.checks() {
            crate::emit_lifecycle_debug!(
                ServiceRole::DevForge,
                lifecycle_phase::PREFLIGHT,
                check = %c.name,
                status = ?c.status,
                detail = %c.detail
            );
        }

        if registry.has_fail() {
            let msgs: Vec<String> = registry
                .fails()
                .map(|c| format!("{}: {}", c.name, c.detail))
                .collect();
            let detail = format!("DevForge preflight failed:\n  - {}", msgs.join("\n  - "));
            crate::emit_lifecycle_dual!(
                self.internal_tx,
                ServiceRole::DevForge,
                lifecycle_phase::FAILED,
                detail.clone()
            );
            anyhow::bail!("{detail}");
        }

        // ── Boot ──────────────────────────────────────────────────
        // Preflight has already verified the REH tree resolves; an
        // intervening removal between preflight and now is a TOCTOU
        // race we surface explicitly rather than swallowing.
        let server_dir = resolve_devforge_server_dir(&self.data_dir).ok_or_else(|| {
            anyhow::anyhow!(
                "DevForge preflight passed but server tree resolution failed at \
                 boot — likely a TOCTOU race; retry the launch."
            )
        })?;
        let user_data_dir = entry.resolve_user_data_dir(&self.data_dir);
        let extensions_dir = entry.resolve_extensions_dir(&self.data_dir);

        let service = DevForgeService::boot_reh(
            entry,
            &server_dir,
            &user_data_dir,
            Some(&extensions_dir),
            None, // workspace_path — restored by the Tauri command layer
            self.internal_tx.clone(),
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

    // There are no SurrealDB sidecar accessors — the graph store is
    // Clyffy's, on GB10. DevPulse-local is Turso + DuckDB only.

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

    // ── Routing config (user scope) ────────────────────────────

    /// Load user-scope routing preferences from
    /// `{data_dir}/user/routing.toml`. The dispatch SSOT
    /// (`assistant.routing.mode` — which lane actually serves) is
    /// Clyffy's; the gb10-client reconciles against it, so this
    /// returns the persisted preference verbatim.
    ///
    /// Never returns an error — on parse / IO failure, returns the
    /// defaults so the wizard / settings surface always renders.
    #[expect(
        clippy::unused_async,
        reason = "kept async so the Tauri command signature stays uniform; routing reconciliation against Clyffy moved to the gb10-client (kernel-severance)"
    )]
    pub async fn routing_config_load(&self) -> RoutingConfig {
        // Routing preference is DevPulse-local persistence. The dispatch
        // SSOT (which lane actually serves) is Clyffy's on GB10 and is
        // reconciled by the gb10-client — no local loader read here.
        services::routing_config::load(&self.data_dir)
    }

    /// Persist user-scope routing preferences atomically. Write-through
    /// to the dispatch SSOT (Clyffy's `assistant.routing.mode`, read by
    /// `commands::cloud::inner_get_inference_provider` at dispatch time)
    /// is the gb10-client's job.
    ///
    /// Emits BOTH a `tracing::info!` event on the `routing.config`
    /// target AND an `InternalEvent::RoutingConfigChanged` on the
    /// internal broadcast bus — per `feedback_dual_observability.md`,
    /// persistence surfaces are observable on both layers in lockstep.
    ///
    /// # Errors
    /// - Creating the `user/` directory fails.
    /// - Temp-file write or rename fails.
    #[expect(
        clippy::unused_async,
        reason = "kept async so the Tauri command signature stays uniform; routing write-through to Clyffy moved to the gb10-client (kernel-severance)"
    )]
    pub async fn routing_config_save(&self, cfg: &RoutingConfig) -> Result<RoutingConfig> {
        let saved = services::routing_config::save(&self.data_dir, cfg)?;

        // The dispatch SSOT (`assistant.routing.mode`, Clyffy's on GB10)
        // is what `inner_get_inference_provider` reads at dispatch time;
        // the gb10-client writes it through in lockstep so the wizard's
        // saved `latency.response_source` actually gates which Claude
        // lane is allowed. The local save above is DevPulse's persistence
        // of the user preference.

        let enabled_tier_count: u32 = saved
            .escalation
            .enabled_tiers()
            .count()
            .try_into()
            .unwrap_or(u32::MAX);

        // Tracing leg of the dual-emit pair. Target is `routing.config`
        // so subscribers can filter the same way they filter
        // `sidecar.lifecycle`.
        tracing::info!(
            target: "routing.config",
            response_source = saved.latency.response_source.as_str(),
            enabled_tier_count,
            audio_buffer_ms = saved.latency.audio_buffer_ms,
            vad_silence_ms = saved.latency.vad_silence_ms,
            stream_chunk_size = saved.latency.stream_chunk_size,
            "routing config persisted"
        );

        // InternalEvent leg of the dual-emit pair. SendError when no
        // subscribers attached is benign — the broadcast bus is best-
        // effort and consumers are responsible for keeping up.
        let _ = self.internal_tx.send(InternalEvent::RoutingConfigChanged {
            response_source: saved.latency.response_source,
            enabled_tier_count,
            audio_buffer_ms: saved.latency.audio_buffer_ms,
            vad_silence_ms: saved.latency.vad_silence_ms,
            stream_chunk_size: saved.latency.stream_chunk_size,
        });

        Ok(saved)
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

        let service = OllamaService::boot(&entry.host, entry.port, entry.resolved_binary()).await?;

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

    /// Get the per-project analytics manager (`DuckDB`).
    pub fn project_analytics(&self) -> &Arc<ProjectAnalyticsManager> {
        &self.project_analytics
    }

    // There are no project_graph / project_vector accessors — per-project
    // graph + vector stores are Clyffy's on GB10.

    /// Atomically initialize every per-project store for one project.
    ///
    /// Delegates to [`services::project_init::init_project_full`] with
    /// the platform's own manager refs + the shared `SurrealDB` adapter
    /// borrowed from the system graph service. Idempotent — safe to
    /// call on every project boot.
    ///
    /// # Errors
    /// Returns the first store-init failure. Stores that did succeed
    /// before the failure stay cached on their managers.
    pub async fn init_project_full(
        &self,
        config: &services::project_init::ProjectInitConfig,
    ) -> anyhow::Result<services::project_init::ProjectScope> {
        let cx = services::project_init::ProjectInitContext {
            project_db: &self.project_db,
            project_analytics: &self.project_analytics,
        };

        services::project_init::init_project_full(cx, config).await
    }

    // ── Telemetry accessor ──────────────────────────────────────

    /// Get the telemetry handle (if enabled and analytics booted).
    ///
    /// Not a `Service` — no lifecycle, no ping. The handle's background
    /// writer shuts down naturally when the `Platform` drops.
    pub fn telemetry(&self) -> Option<&TelemetryHandle> {
        self.telemetry.as_ref()
    }

    // There are no reasoning (RRO) or grammar (constrained decoding)
    // accessors — both are Clyffy's on GB10, surfaced through the
    // gb10-client wire, not held on the local Platform.

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

        // Project-scope managers are not in the macro — they're on-demand,
        // not boot-time. Tear down the file-owning Turso / DuckDB adapters
        // (graph + vector are Clyffy's on GB10).
        self.project_analytics.shutdown().await;
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
