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
//! ├── system/     Kernel internals (Turso, DuckDB, SurrealDB)
//! ├── user/       User data (Turso, SurrealDB)
//! ├── global/     Cross-project knowledge (SurrealDB)
//! ├── projects/   Per-project data (SurrealDB, on demand)
//! └── logs/       Rotated log files
//! ```

pub mod agents;
mod boot;
pub mod config;
pub mod containers;
pub mod copy;
pub mod db;
#[allow(missing_docs)]
pub mod facade;
pub mod forms;
pub mod health;
pub mod init;
#[cfg(feature = "inference")]
pub mod integrations;
pub mod metrics;
pub mod module;
pub mod onboarding;
pub mod profile;
pub mod projects;
pub mod providers;
pub mod rooms;
pub mod services;
pub mod telemetry;

pub use config::{
    retrieval_param_meta, sanitize_path, DataScope, ExecutionLane, LaneToggle, LaneTraceConfig,
    PlatformBootConfig, PlatformConfig, RetrievalConfig, RetrievalParamMeta, RetrievalPreset,
};
pub use health::{HealthStatus, SubsystemHealth, SystemHealth};
pub use init::{InitEvent, InitStatus};
pub use metrics::ProcessMetrics;
pub use services::candle_config::CandleConfig;
pub use services::llama_server_config::LlamaServerConfig;
pub use services::routing_config::{
    EscalationConfig, EscalationTier, EscalationTierId, InferenceProvider, LatencyConfig,
    RoutingConfig,
};
pub use services::sherpa_streaming::{
    SherpaCompileInfo, SherpaInstalledModel, SherpaSessionInfo, SherpaStreamingService,
};
pub use services::sidecars::ollama::OllamaModel;
pub use services::status::{ServiceRuntimeState, ServiceStatusSnapshot};
pub use services::surreal::{SurrealConfigView, SurrealHealth, SurrealService, SurrealStatus};
pub use services::surreal_config::SurrealUserConfig;
pub use services::voice_stt_config::VoiceSttConfig;
pub use services::voice_tts_config::VoiceTtsConfig;
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
// are generic (Analytics / Cache / Turso / Sql{Adapter,Row,Value}) —
// no kernel vocabulary, no rename needed.
pub use devpulse_clyffy::cortex::persistence::{
    AnalyticsAdapter, CacheAdapter, DuckDbAdapter, SqlAdapter, SqlRow, SqlValue, TursoAdapter,
    TursoOptions,
};

// IP-NOTE: RRO state machine — public-vocabulary types + runtime handle.
// Names match `signals.registry.yaml` group `rro` exactly (registry-aligned
// public vocabulary, not kernel internals). The handle stores transition
// snapshots in a bounded ring and broadcasts them via context-propagating
// `BroadcastSender` (ADR-002). Authored under the kernel cortex SSOT at
// `kernel/devpulse-clyffy/src/cortex/reasoning/state.rs`.
pub use devpulse_clyffy::cortex::reasoning::{
    RroDepth, RroState, RroStateHandle, RroStateSnapshot, RroStateTransition, DEFAULT_PROXIMITY,
};

// IP-NOTE: LLM constrained-decoding runtime — `llguidance`-backed.
// Layman-friendly type names (`GrammarKind::JsonSchema`/`Regex`/`Enum`/
// `Custom`, `GrammarStatus::*`). The kernel owns the constraint engine;
// this is the read/control snapshot the devtool consumes. Distinct from
// the user-facing writing-grammar / spelling tool (Harper). Authored
// under the kernel cortex SSOT at
// `kernel/devpulse-clyffy/src/cortex/llguidance/handle.rs`.
pub use devpulse_clyffy::cortex::llguidance::{
    GrammarFailure, GrammarHandle, GrammarKind, GrammarSnapshot, GrammarStatus,
};

// IP-NOTE: knowledge-library types. Kernel uses short names
// (`EntryType`, `Reaction`, …); engine prefixes them with `Knowledge`
// so consumers see `KnowledgeEntryType`. The verbs `record_reaction`
// / `select_entry` are also re-prefixed. This IS the translation
// pattern — vocabulary rename at the seam, not a struct wrapper.
pub use devpulse_clyffy::cortex::knowledge::{
    record_reaction as knowledge_record_reaction, select_entry as knowledge_select_entry,
    sync_remote_entries as knowledge_sync_remote_entries, EntryType as KnowledgeEntryType,
    KnowledgeEntry, KnowledgeManifest, Reaction as KnowledgeReaction,
    SelectedEntry as KnowledgeSelectedEntry, SelectionParams as KnowledgeSelectionParams,
    Tier as KnowledgeTier,
};

// IP-NOTE: community feed cache. `FeedItem` + `FeedKind` cross to TS via
// specta; verbs are layman-named (`upsert_feed_item`, `query_feed`,
// `most_recent_sync_at`) so the desktop Tauri command surface reads them
// without kernel-vocabulary translation. The actual HTTP fetch lives in
// `commands/community/` (desktop tier); kernel owns only the cache shape.
pub use devpulse_clyffy::cortex::community::{
    is_community_enabled, most_recent_sync_at, query_feed, set_community_enabled, upsert_feed_item,
    FeedItem, FeedKind, DEFAULT_FEED_LIMIT, DEFAULT_FEED_TTL_SECS,
};

// IP-NOTE: cortex governance graph (CORTEX.md §4) — operator-authored
// reasoning trees. `ThoughtRecord` / `thought_create` / `thought_load_branch`
// are generic enough to cross outward; no rename needed. Engine callers
// pass `graph.handle()` (the `&ScopedGraphHandle` returned by
// `GraphService::handle()`) and convert their `RroState` via
// `RroState::as_str()` at the seam.
pub use devpulse_clyffy::cortex::governance::{thought_create, thought_load_branch, ThoughtRecord};

// IP-NOTE: RRD encoder hot-swap return shape. `SwapStats` carries dim
// + elapsed_ms + phases_observed — generic enough to cross outward.
// The Tauri command `cortex_swap_encoder` returns this directly; the
// engine `ModelLoaderService::burn_swap_encoder` passthrough preserves
// the shape unchanged.
//
// Feature gate matches `devpulse-clyffy`'s `model-loader` cfg: the
// underlying `model_loader::backends::burn_adapter` module is only
// compiled when devpulse-clyffy is built with `model-loader` enabled
// (engine's `inference` feature → `devpulse-clyffy/model-loader`).
// Without the gate, `cargo check -p devpulse-engine` against default
// features fails with E0433 "could not find `model_loader` in
// `devpulse_clyffy`".
#[cfg(feature = "inference")]
pub use devpulse_clyffy::model_loader::backends::burn_adapter::SwapStats;

// IP-NOTE: chat-input type-time suggestion service. `Suggestion` carries
// a single recalled prompt + its score components; `SuggestionService`
// is the embed-and-rank service over the user-scoped `chat_prompt`
// corpus. Names describe industry-standard concepts (suggestion,
// service) — no kernel vocabulary, no rename needed. Tauri layer calls
// `Platform::ensure_suggest_service()` to obtain the service.
pub use devpulse_clyffy::cortex::suggest::{Suggestion, SuggestionService};

// IP-NOTE: intelligence layer surface — embedding-aware memory + RRO
// archive types, schema constant, and project routing helper. The
// trait `IntelligenceStore` is implemented for `SurrealAdapter` in
// the kernel; the engine re-exports the abstract types so the Tauri
// `commands::intelligence` module can build typed responses without
// reaching into the kernel directly. Names describe industry-standard
// concepts (memory, embedding, archive) — no kernel vocabulary leaks.
pub use devpulse_clyffy::cortex::intelligence::{
    slug_for_cwd, IntelligenceStore, MemoryKind, MemoryRecord, NeighborRef, RecallHit, RroRecord,
    EMBEDDING_DIM, MEMORY_SCHEMA,
};

// IP-NOTE: interaction templates — kernel-owned scripted exchanges
// (setup wizard, welcome-back, etc.). Re-exported so the desktop layer
// can load templates without crossing the IP boundary directly.
// Industry-standard concept (state-machine-driven UI walkthroughs); the
// vocabulary stays generic.
pub use devpulse_clyffy::interactions::{
    InteractionError, InteractionPhase, InteractionTemplate, InteractionTrigger,
};

// IP-NOTE: capability-bucket inference for downloadable model
// filenames. Wraps the keyword SSOT in `model_loader::download` —
// surfaced to the Tauri layer for the model-downloader UI's
// "this filename → chat / rag / voice / vision" preview and for
// the intelligence devtool's Debug tab. Industry-standard concept
// (capability classification), no kernel vocabulary.
#[cfg(feature = "candle")]
pub use devpulse_clyffy::model_loader::infer_download_folder;

// IP-NOTE: model-loader concepts the desktop UI surfaces directly
// (registry entries, source-tier classification, slot identity, hardware).
// All names describe industry-standard concepts, no rename needed.
// Plain types — linked through `model-loader-core`, no inference backend.
pub use devpulse_clyffy::model_loader::{
    HardwareMetrics, ModelRegistryEntry, ModelSourceTier, Slot,
};

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
use services::devforge::{resolve_devforge_server_dir, DevForgePreflight, DevForgeService};
use services::graph::GraphService;
// EmbedderService removed — slot-managed by model loader
// WhisperService removed — slot-managed by model loader
#[cfg(feature = "inference")]
use services::model_loader::ModelLoaderService;
use services::project_analytics::ProjectAnalyticsManager;
use services::project_db::ProjectDbManager;
use services::project_graph::ProjectGraphManager;
#[cfg(feature = "rro")]
use services::project_vector::ProjectVectorManager;
use services::relational::RelationalService;
use services::sidecars::ollama::OllamaService;
#[cfg(feature = "rro")]
use services::vector::VectorService;
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
        $action!($self.user_analytics);
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
        $action!($self.user_analytics);
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
/// Capacity of the platform-internal `InternalEvent` broadcast channel.
///
/// Sized at `1024` to match `DEV_CHANNEL_CAPACITY` in
/// [`crate::platform::facade`] — once `FacadeHandle` is wired into
/// boot, the facade will subscribe to this channel and fan out to the
/// dev-side stream at 1:1 capacity.
const INTERNAL_EVENT_CAPACITY: usize = 1024;

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
    /// First run (needs the user database).
    onboarding: Option<Arc<onboarding::Onboarding>>,
    /// Your projects and the active one (needs the user database).
    projects: Option<Arc<projects::Projects>>,
    /// Containers for your projects (needs the user database).
    containers: Option<Arc<containers::Containers>>,
    /// Your AI providers (subscriptions, desktop apps), checked from boot.
    providers: Arc<providers::Providers>,
    /// Your threads with your agents (needs the user database).
    agents: Option<Arc<agents::Agents>>,
    /// Your rooms: agents seated in roles (needs the user database).
    rooms: Option<Arc<rooms::Rooms>>,
    user_analytics: Option<Arc<AnalyticsService>>,
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
    // ── Suggestion service (chat-input intellisense) ─────────
    // Lazy-constructed on first call to `ensure_suggest_service` —
    // both `model_loader` and `user_graph` must be ready before the
    // bridge can wire to the `chat.suggest` slot. Gated behind
    // `inference` because the bridge depends on the kernel embedder
    // pool; non-inference builds expose `suggest_service()` returning
    // `None` and `ensure_suggest_service()` returning a clear error.
    #[cfg(feature = "inference")]
    suggest: ArcSwapOption<devpulse_clyffy::cortex::suggest::SuggestionService>,
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
    /// Per-project Turso databases, created on demand (not at boot).
    project_db: Arc<ProjectDbManager>,
    /// Per-project `DuckDB` analytics, created on demand.
    project_analytics: Arc<ProjectAnalyticsManager>,
    /// Per-project `SurrealDB` namespace handles, minted on demand inside
    /// the shared embedded instance.
    project_graph: Arc<ProjectGraphManager>,
    /// Per-project Qdrant collection registry, created on demand inside
    /// the shared embedded RRO instance.
    #[cfg(feature = "rro")]
    project_vector: Arc<ProjectVectorManager>,
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

/// What lives in the user database.
#[derive(Default)]
struct UserWorkflows {
    onboarding: Option<Arc<onboarding::Onboarding>>,
    projects: Option<Arc<projects::Projects>>,
    containers: Option<Arc<containers::Containers>>,
    agents: Option<Arc<agents::Agents>>,
    rooms: Option<Arc<rooms::Rooms>>,
}

/// Start what lives in the user database: first run, your projects, and
/// containers for them. Without the user database there is nothing to start;
/// any one failing is logged with its reason and leaves that one
/// unavailable, never the app.
async fn start_user_workflows(
    user: Option<&Arc<RelationalService>>,
    user_graph: Option<Arc<GraphService>>,
    data_dir: &std::path::Path,
    signals: &crate::Engine,
    providers: &Arc<providers::Providers>,
) -> UserWorkflows {
    let Some(user) = user else {
        return UserWorkflows::default();
    };
    let onboarding = match onboarding::Onboarding::start(
        Arc::clone(user.adapter()),
        data_dir,
        signals.clone(),
    )
    .await
    {
        Ok(o) => {
            let o = Arc::new(o);
            o.spawn_detection(data_dir.to_path_buf());
            Some(o)
        }
        Err(e) => {
            tracing::error!(target: "onboarding", error = %format!("{e:#}"), "first run could not start");
            None
        }
    };
    // The graph mirror is the user graph, best-effort.
    let projects = match projects::Projects::start(
        Arc::clone(user.adapter()),
        user_graph,
        signals.clone(),
    )
    .await
    {
        Ok(p) => Some(Arc::new(p)),
        Err(e) => {
            tracing::error!(target: "projects", error = %format!("{e:#}"), "projects could not start");
            None
        }
    };
    let containers = match containers::Containers::start(
        Arc::clone(user.adapter()),
        data_dir.to_path_buf(),
        signals.clone(),
    )
    .await
    {
        Ok(c) => Some(c),
        Err(e) => {
            tracing::error!(target: "containers", error = %format!("{e:#}"), "containers could not start");
            None
        }
    };
    let agents = Some(Arc::new(agents::Agents::new(
        Arc::clone(user.adapter()),
        data_dir.to_path_buf(),
        Arc::clone(providers),
        projects.clone(),
    )));
    let rooms = agents.as_ref().map(|agents| {
        Arc::new(rooms::Rooms::new(
            Arc::clone(user.adapter()),
            data_dir.to_path_buf(),
            Arc::clone(agents),
        ))
    });
    UserWorkflows {
        onboarding,
        projects,
        containers,
        agents,
        rooms,
    }
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
        signals: crate::Engine,
    ) -> Result<Self> {
        let boot_time = Instant::now();
        let boot_config = PlatformBootConfig::load(&data_dir)?;

        // Construct the platform-internal `InternalEvent` channel before
        // services boot so service emissions (preflight, ready, failed,
        // shutdown) all land on the same bus. The receiver count is
        // zero until subscribers attach — early sends just return
        // `SendError`, which callsites ignore.
        let (internal_tx, _) = broadcast_channel::<InternalEvent>(INTERNAL_EVENT_CAPACITY);

        let user_signals = signals.clone();
        // Your AI providers need no database: they are checked from boot.
        let providers = providers::Providers::start(data_dir.clone(), signals.clone());
        let booted = boot::execute(
            &data_dir,
            &boot_config,
            &on_event,
            model_event_sink,
            signals,
        )
        .await?;

        let user_workflows = start_user_workflows(
            booted.user_relational.as_ref(),
            booted.user_graph.clone(),
            &data_dir,
            &user_signals,
            &providers,
        )
        .await;

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

        Ok(Self {
            surreal: booted.surreal,
            system_relational: booted.system_relational,
            system_analytics: booted.system_analytics,
            system_graph: booted.system_graph,
            system_cache: booted.system_cache,
            user_relational: booted.user_relational,
            onboarding: user_workflows.onboarding,
            projects: user_workflows.projects,
            containers: user_workflows.containers,
            agents: user_workflows.agents,
            rooms: user_workflows.rooms,
            providers,
            user_analytics: booted.user_analytics,
            user_graph: booted.user_graph,
            global_graph: booted.global_graph,
            #[cfg(feature = "rro")]
            vector: booted.vector,
            #[cfg(feature = "inference")]
            model_loader: booted.model_loader,
            #[cfg(feature = "inference")]
            suggest: ArcSwapOption::empty(),
            devforge: ArcSwapOption::empty(),
            ollama: ArcSwapOption::empty(),
            sherpa_streaming: Arc::new(SherpaStreamingService::new(&data_dir)),
            project_db: Arc::new(ProjectDbManager::new(
                data_dir.join("projects"),
                boot_config.services.user.relational.turso_options(),
            )),
            project_analytics: Arc::new(ProjectAnalyticsManager::new(data_dir.join("projects"))),
            project_graph: Arc::new(ProjectGraphManager::new()),
            #[cfg(feature = "rro")]
            project_vector: Arc::new(ProjectVectorManager::new()),
            telemetry,
            reasoning: RroStateHandle::new(),
            grammar: GrammarHandle::new(),
            internal_tx,
            boot_config,
            boot_time,
            data_dir,
        })
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
            (ServiceRole::Analytics, DataScope::User) => self.user_analytics.is_some(),
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
            (ServiceRole::Ollama, DataScope::System) => self.ollama.load_full().is_some(),
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

    /// Get the system analytics service (Clyffy AI behavior telemetry).
    ///
    /// Holds AI-side metrics: LLM calls, layer budgets, governance,
    /// retrieval / lane / span traces, council performance, vision
    /// pipeline, platform telemetry. User-perceived metrics live on
    /// [`Platform::user_analytics`] in a separate `DuckDB` file.
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

    /// First run (when the user database is open).
    pub fn onboarding(&self) -> Option<&Arc<onboarding::Onboarding>> {
        self.onboarding.as_ref()
    }

    /// Your projects and the active one (when the user database is open).
    pub fn projects(&self) -> Option<&Arc<projects::Projects>> {
        self.projects.as_ref()
    }

    /// Containers for your projects (when the user database is open).
    pub fn containers(&self) -> Option<&Arc<containers::Containers>> {
        self.containers.as_ref()
    }

    /// Your AI providers.
    pub fn providers(&self) -> &Arc<providers::Providers> {
        &self.providers
    }

    /// Your threads with your agents (when the user database is open).
    pub fn agents(&self) -> Option<&Arc<agents::Agents>> {
        self.agents.as_ref()
    }

    /// Your rooms (when the user database is open).
    pub fn rooms(&self) -> Option<&Arc<rooms::Rooms>> {
        self.rooms.as_ref()
    }

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

    // ── Suggestion service accessor + lazy builder ─────────────────

    /// Get the chat-input suggestion service if it has been built.
    ///
    /// Returns `None` until [`Self::ensure_suggest_service`] succeeds
    /// once. The accessor is non-blocking and lock-free
    /// (`ArcSwapOption::load_full`).
    #[cfg(feature = "inference")]
    #[must_use]
    pub fn suggest_service(
        &self,
    ) -> Option<Arc<devpulse_clyffy::cortex::suggest::SuggestionService>> {
        self.suggest.load_full()
    }

    /// Build the suggestion service on first call; return the cached
    /// `Arc` on every subsequent call.
    ///
    /// Construction wires:
    /// - [`devpulse_clyffy::cortex::suggest::ChatSuggestEmbedder`] over the
    ///   `chat.suggest` slot via the kernel `ModelLoaderService`.
    /// - The embedder is cast to `Arc<dyn Embedder>` (`#[async_trait]`
    ///   on the trait makes this `dyn`-compatible).
    /// - The user graph's `SurrealAdapter` + namespace pair so the
    ///   service writes/reads the `chat_prompt` table inside
    ///   `USER_GRAPH_SCHEMA`.
    ///
    /// # Errors
    /// - `model_loader` is not booted (no embedder source).
    /// - `user_graph` is not booted (no storage target).
    #[cfg(feature = "inference")]
    #[expect(
        clippy::unused_async,
        reason = "callers in interfaces/desktop/src-tauri/src/commands/chat/suggest.rs `.await?` this; keeping the signature async is forward-compatible with a future construction step that becomes async (e.g. graph adapter warm-up) without breaking every call site"
    )]
    pub async fn ensure_suggest_service(
        &self,
    ) -> Result<Arc<devpulse_clyffy::cortex::suggest::SuggestionService>, String> {
        if let Some(svc) = self.suggest.load_full() {
            return Ok(svc);
        }

        let loader = self
            .model_loader
            .as_ref()
            .ok_or_else(|| "model_loader not booted".to_string())?;
        let graph = self
            .user_graph
            .as_ref()
            .ok_or_else(|| "user_graph not booted".to_string())?;

        let kernel_loader = loader.kernel_clone();
        let bridge = devpulse_clyffy::cortex::suggest::ChatSuggestEmbedder::new(kernel_loader);
        let embedder: Arc<dyn devpulse_clyffy::cortex::cag::traits::Embedder> = Arc::new(bridge);

        let adapter = Arc::clone(graph.adapter());
        let namespace = graph.handle().namespace().to_string();
        let database = graph.handle().database().to_string();

        tracing::info!(
            namespace = %namespace,
            database = %database,
            "constructing suggestion service (chat.suggest -> user graph)"
        );

        let svc = Arc::new(devpulse_clyffy::cortex::suggest::SuggestionService::new(
            embedder, adapter, namespace, database,
        ));
        self.suggest.store(Some(Arc::clone(&svc)));
        Ok(svc)
    }

    /// `inference`-disabled fallback for callers that compile without
    /// the feature. Always `None`.
    #[cfg(not(feature = "inference"))]
    #[must_use]
    pub fn suggest_service(
        &self,
    ) -> Option<Arc<devpulse_clyffy::cortex::suggest::SuggestionService>> {
        None
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
            None => SurrealStatus::stopped(),
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
    pub fn surreal_user_config_save(&self, cfg: &SurrealUserConfig) -> Result<SurrealUserConfig> {
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

    // ── Routing config (user scope) ────────────────────────────

    /// Load user-scope routing preferences from
    /// `{data_dir}/user/routing.toml`, reconciling
    /// `latency.response_source` with the kernel `assistant.routing.mode`
    /// SSOT so the surface always reflects what the chat dispatcher
    /// will actually use at dispatch time.
    ///
    /// Never returns an error — on parse / IO failure, returns the
    /// defaults so the wizard / settings surface always renders. When
    /// the inference feature is compiled out (or the loader isn't
    /// available yet), the persisted file value is returned verbatim.
    #[cfg_attr(
        not(feature = "inference"),
        expect(
            clippy::unused_async,
            reason = "async needed when feature=inference is on (loader.get_assistant_config().await); kept async on every build so the Tauri command signature is uniform"
        )
    )]
    pub async fn routing_config_load(&self) -> RoutingConfig {
        // Reconcile against the kernel SSOT so the UI never disagrees
        // with the dispatcher. The kernel write-through inside
        // `routing_config_save` keeps these aligned on every write;
        // the reconcile-on-read here covers the case where the kernel
        // mode was changed via another path (legacy
        // `set_inference_provider` command, direct assistant.toml edit)
        // before the routing.toml surface existed. The binding is `mut`
        // only on builds where the reconciliation actually mutates it
        // (inference feature compiled in); the non-inference path keeps
        // the file value verbatim.
        #[cfg(feature = "inference")]
        let mut cfg = services::routing_config::load(&self.data_dir);
        #[cfg(not(feature = "inference"))]
        let cfg = services::routing_config::load(&self.data_dir);

        #[cfg(feature = "inference")]
        if let Some(loader) = self.model_loader.as_ref() {
            let assistant = loader.get_assistant_config().await;
            let raw_mode = serde_json::to_value(&assistant.routing.mode)
                .ok()
                .and_then(|v| v.as_str().map(str::to_string))
                .unwrap_or_else(|| "local_first".to_string());
            cfg.latency.response_source = InferenceProvider::from_wire(&raw_mode);
        }

        cfg
    }

    /// Persist user-scope routing preferences atomically and write
    /// through to the kernel `assistant.routing.mode` SSOT so the
    /// existing chat dispatcher (`commands::cloud::inner_get_inference_provider`)
    /// is gated by this surface.
    ///
    /// Emits BOTH a `tracing::info!` event on the `routing.config`
    /// target AND an `InternalEvent::RoutingConfigChanged` on the
    /// internal broadcast bus — per `feedback_dual_observability.md`,
    /// persistence surfaces are observable on both layers in lockstep.
    ///
    /// # Errors
    /// - Creating the `user/` directory fails.
    /// - Temp-file write or rename fails.
    /// - Write-through to the kernel routing mode fails (when the
    ///   inference feature is compiled in and the model loader is
    ///   available).
    #[cfg_attr(
        not(feature = "inference"),
        expect(
            clippy::unused_async,
            reason = "async needed when feature=inference is on (loader.set_routing_mode().await); kept async on every build so the Tauri command signature is uniform"
        )
    )]
    pub async fn routing_config_save(&self, cfg: &RoutingConfig) -> Result<RoutingConfig> {
        let saved = services::routing_config::save(&self.data_dir, cfg)?;

        // Write-through: the kernel `assistant.routing.mode` is the SSOT
        // the existing `inner_get_inference_provider` chat dispatcher
        // reads at dispatch time. Update it in lockstep so the wizard's
        // saved `latency.response_source` actually gates which Claude
        // lane is allowed. Without this write-through, the routing.toml
        // surface would be a parallel store that no consumer reads.
        #[cfg(feature = "inference")]
        if let Some(loader) = self.model_loader.as_ref() {
            loader
                .set_routing_mode(saved.latency.response_source.as_str().to_string())
                .await?;
        }

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

    // ── llama-server settings (user scope) ─────────────────────

    /// Your llama-server settings, or the defaults (what the devtool shows).
    #[must_use]
    pub fn llama_server_config_load(&self) -> LlamaServerConfig {
        services::llama_server_config::load(&self.data_dir)
    }

    /// Your saved llama-server settings; `None` when you have saved none,
    /// so the server keeps its defaults.
    #[must_use]
    pub fn llama_server_config_saved(&self) -> Option<LlamaServerConfig> {
        services::llama_server_config::load_saved(&self.data_dir)
    }

    /// Persist llama-server settings atomically. Returns the clamped value.
    ///
    /// # Errors
    /// - Creating the `user/` directory fails.
    /// - Temp-file write or rename fails.
    pub fn llama_server_config_save(&self, cfg: &LlamaServerConfig) -> Result<LlamaServerConfig> {
        services::llama_server_config::save(&self.data_dir, cfg)
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

    /// Get the per-project graph manager (`SurrealDB` namespaces inside
    /// the shared embedded instance).
    pub fn project_graph(&self) -> &Arc<ProjectGraphManager> {
        &self.project_graph
    }

    /// Get the per-project vector collection manager (Qdrant collections
    /// inside the shared embedded RRO instance).
    #[cfg(feature = "rro")]
    pub fn project_vector(&self) -> &Arc<ProjectVectorManager> {
        &self.project_vector
    }

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
        let surreal_adapter = self.system_graph.as_ref().map(|svc| svc.adapter().clone());

        let cx = services::project_init::ProjectInitContext {
            project_db: &self.project_db,
            project_analytics: &self.project_analytics,
            project_graph: &self.project_graph,
            surreal_adapter: surreal_adapter.as_ref(),
            #[cfg(feature = "rro")]
            project_vector: &self.project_vector,
            #[cfg(feature = "rro")]
            vector: self.vector.as_ref(),
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

        // Project-scope managers are not in the macro — they're
        // on-demand, not boot-time. Order mirrors init: tear down
        // graph + vector handles first (in-memory only), then the
        // file-owning Turso / DuckDB adapters.
        self.project_graph.shutdown().await;
        #[cfg(feature = "rro")]
        self.project_vector.shutdown().await;
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
