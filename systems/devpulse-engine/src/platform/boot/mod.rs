//! Boot pipeline — staged initialization of all platform stores.
//!
//! Three phases:
//! 1. **Preflight** — validate config, create directory hierarchy
//! 2. **Store boots** — initialize each store independently
//! 3. **Validation** — verify critical stores booted, fail if not
//!
//! Non-critical store failures (analytics, cache, user stores) result in
//! degraded mode (store = None). Critical store failures (system relational,
//! system graph) cause boot to return an error.

pub mod graph;
pub mod preflight;
pub mod retry;

use crate::platform::config::{self, PlatformBootConfig, sanitize_path};
use crate::platform::init::InitEvent;
use crate::platform::services::analytics::{AnalyticsService, SYSTEM_ANALYTICS_SCHEMA};
use crate::platform::services::cache::CacheService;
use crate::platform::services::graph::GraphService;
use crate::platform::services::relational::{RelationalService, SYSTEM_SCHEMA, USER_SCHEMA};
#[cfg(feature = "rro")]
use crate::platform::services::vector::VectorService;
#[cfg(feature = "rro")]
use crate::platform::services::Service;
#[cfg(feature = "kokoros")]
use crate::platform::services::voice::VoiceService;
#[cfg(feature = "outlines")]
use crate::platform::services::grammar::GrammarService;

use anyhow::Result;
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

/// Collected store handles from a successful boot pipeline.
pub struct BootedServices {
    pub system_relational: Option<Arc<RelationalService>>,
    pub system_analytics: Option<Arc<AnalyticsService>>,
    pub system_graph: Option<Arc<GraphService>>,
    pub system_cache: Option<Arc<CacheService>>,
    pub user_relational: Option<Arc<RelationalService>>,
    pub user_graph: Option<Arc<GraphService>>,
    pub global_graph: Option<Arc<GraphService>>,
    #[cfg(feature = "rro")]
    pub vector: Option<Arc<VectorService>>,
    #[cfg(feature = "kokoros")]
    pub voice: Option<Arc<VoiceService>>,
    #[cfg(feature = "outlines")]
    pub grammar: Option<Arc<GrammarService>>,
}

/// Execute the full boot pipeline.
///
/// # Phases
/// 1. Preflight: create scoped directory hierarchy
/// 2. Store boots: initialize each enabled store
/// 3. Validation: verify critical stores are ready
///
/// # Errors
/// Returns error if:
/// - Preflight fails (directory creation)
/// - A critical store (system relational, system graph) fails to boot
pub async fn execute(
    data_dir: &Path,
    boot_config: &PlatformBootConfig,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Result<BootedServices> {
    // ── Phase 1: Preflight ────────────────────────────────────
    on_event(InitEvent::running("data layer", "Creating data directories"));
    preflight::ensure_scoped_dirs(data_dir, boot_config)?;
    on_event(InitEvent::ok("data layer", "Directories ready"));

    // ── Phase 2: Boot stores ──────────────────────────────────

    // System relational (LibSQL) — CRITICAL
    let system_relational = boot_relational(
        data_dir,
        &boot_config.services.system.relational,
        &boot_config.windows,
        SYSTEM_SCHEMA,
        "System relational",
        on_event,
    ).await;

    // System analytics (DuckDB) — non-critical
    let system_analytics = boot_analytics(
        data_dir,
        &boot_config.services.system.analytics,
        &boot_config.windows,
        SYSTEM_ANALYTICS_SCHEMA,
        "System analytics",
        on_event,
    ).await;

    // Consolidated graph (SurrealDB) — system graph is CRITICAL
    let (system_graph, user_graph, global_graph) = graph::boot_consolidated(
        data_dir,
        boot_config,
        on_event,
    ).await;

    // System cache (Moka) — non-critical
    let system_cache = boot_cache(
        &boot_config.services.system.cache,
        on_event,
    );

    // User relational (LibSQL) — non-critical
    let user_relational = boot_relational(
        data_dir,
        &boot_config.services.user.relational,
        &boot_config.windows,
        USER_SCHEMA,
        "User relational",
        on_event,
    ).await;

    // Vector store (RRO) — non-critical, feature-gated
    #[cfg(feature = "rro")]
    let vector = boot_vector(
        data_dir,
        &boot_config.services.system.vector,
        on_event,
    ).await;
    #[cfg(not(feature = "rro"))]
    {
        if boot_config.services.system.vector.enabled {
            anyhow::bail!(
                "FATAL: Vector store (RRO) is enabled in config but the 'rro' feature is not compiled in. \
                 Add features = [\"rro\"] to devpulse-engine dependency in src-tauri/Cargo.toml."
            );
        }
    }

    // Voice service (Kokoros) — feature-gated
    #[cfg(feature = "kokoros")]
    let voice = boot_voice(
        data_dir,
        &boot_config.services.system.voice,
        on_event,
    ).await;
    #[cfg(not(feature = "kokoros"))]
    {
        if boot_config.services.system.voice.enabled {
            anyhow::bail!(
                "FATAL: Voice service (Kokoros) is enabled in config but the 'kokoros' feature is not compiled in. \
                 Add features = [\"kokoros\"] to devpulse-engine dependency in src-tauri/Cargo.toml."
            );
        }
    }

    // Grammar service (outlines-core) — feature-gated
    #[cfg(feature = "outlines")]
    let grammar = boot_grammar(
        &boot_config.services.system.grammar,
        on_event,
    );
    #[cfg(not(feature = "outlines"))]
    {
        if boot_config.services.system.grammar.enabled {
            anyhow::bail!(
                "FATAL: Grammar service (outlines-core) is enabled in config but the 'outlines' feature is not compiled in. \
                 Add features = [\"outlines\"] to devpulse-engine dependency in src-tauri/Cargo.toml."
            );
        }
    }

    // ── Phase 3: Validate ALL critical stores ──────────────────
    if system_relational.is_none() && boot_config.services.system.relational.enabled {
        anyhow::bail!(
            "FATAL: System relational (LibSQL) was enabled but failed to boot"
        );
    }
    if system_analytics.is_none() && boot_config.services.system.analytics.enabled && boot_config.services.system.analytics.critical {
        anyhow::bail!(
            "FATAL: System analytics (DuckDB) was enabled+critical but failed to boot"
        );
    }
    if system_graph.is_none() && boot_config.services.system.graph.enabled {
        anyhow::bail!(
            "FATAL: System graph (SurrealDB) was enabled but failed to boot"
        );
    }
    if system_cache.is_none() && boot_config.services.system.cache.enabled && boot_config.services.system.cache.critical {
        anyhow::bail!(
            "FATAL: System cache (Moka) was enabled+critical but failed to boot"
        );
    }
    if user_relational.is_none() && boot_config.services.user.relational.enabled && boot_config.services.user.relational.critical {
        anyhow::bail!(
            "FATAL: User relational (LibSQL) was enabled+critical but failed to boot"
        );
    }
    #[cfg(feature = "rro")]
    if vector.is_none() && boot_config.services.system.vector.enabled && boot_config.services.system.vector.critical {
        anyhow::bail!(
            "FATAL: Vector store (RRO/Qdrant) was enabled+critical but failed to boot"
        );
    }
    #[cfg(feature = "kokoros")]
    if voice.is_none() && boot_config.services.system.voice.enabled && boot_config.services.system.voice.critical {
        anyhow::bail!(
            "FATAL: Voice service (Kokoros) was enabled+critical but failed to boot"
        );
    }
    #[cfg(feature = "outlines")]
    if grammar.is_none() && boot_config.services.system.grammar.enabled && boot_config.services.system.grammar.critical {
        anyhow::bail!(
            "FATAL: Grammar service (outlines-core) was enabled+critical but failed to boot"
        );
    }

    Ok(BootedServices {
        system_relational,
        system_analytics,
        system_graph,
        system_cache,
        user_relational,
        user_graph,
        global_graph,
        #[cfg(feature = "rro")]
        vector,
        #[cfg(feature = "kokoros")]
        voice,
        #[cfg(feature = "outlines")]
        grammar,
    })
}

// ═══════════════════════════════════════════════════════════════
// Simple store boot helpers
// ═══════════════════════════════════════════════════════════════

/// Boot a relational (`LibSQL`) store with file-lock retry.
#[allow(clippy::cast_possible_truncation)]
async fn boot_relational(
    data_dir: &Path,
    entry: &config::ServiceEntry,
    win_config: &config::WindowsConfig,
    schema: &'static str,
    label: &'static str,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<Arc<RelationalService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped(label));
        return None;
    }
    on_event(InitEvent::running(label, "Opening database"));
    let start = Instant::now();
    let raw_path = entry.resolve_path(data_dir);
    let path = sanitize_path(&raw_path, win_config);
    let retry_cfg = entry.retry.to_retry_config();

    let result = retry::retry_on_lock_async(&retry_cfg, label, || {
        let p = path.clone();
        async move { RelationalService::boot(&p, schema, label).await }
    })
    .await;

    match result {
        Ok(store) => {
            tracing::info!(
                step = label,
                status = "ready",
                latency_us = start.elapsed().as_micros() as u64,
                path = %path.display(),
                "LibSQL store booted"
            );
            on_event(InitEvent::ok_with_latency(label, start.elapsed()));
            Some(Arc::new(store))
        }
        Err(e) => {
            tracing::error!(step = label, error = ?e, "LibSQL store failed to boot");
            on_event(InitEvent::error(label, &format!("{e:#}")));
            None
        }
    }
}

/// Boot an analytics (`DuckDB`) store with file-lock retry.
///
/// `DuckDB` uses an exclusive file lock. On Windows hot-reload, the previous
/// process may not have released its lock yet. Retry with exponential backoff.
/// `DuckDB`'s `boot()` is synchronous — wrapped in `spawn_blocking` for async retry.
#[allow(clippy::cast_possible_truncation)]
async fn boot_analytics(
    data_dir: &Path,
    entry: &config::ServiceEntry,
    win_config: &config::WindowsConfig,
    schema: &'static str,
    label: &'static str,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<Arc<AnalyticsService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped(label));
        return None;
    }
    on_event(InitEvent::running(label, "Opening database"));
    let start = Instant::now();
    let raw_path = entry.resolve_path(data_dir);
    let path = sanitize_path(&raw_path, win_config);
    let retry_cfg = entry.retry.to_retry_config();

    let result = retry::retry_on_lock_async(&retry_cfg, label, || {
        let p = path.clone();
        async move {
            tokio::task::spawn_blocking(move || AnalyticsService::boot(&p, schema, label))
                .await
                .map_err(|e| anyhow::anyhow!("DuckDB spawn_blocking failed: {e}"))?
        }
    })
    .await;

    match result {
        Ok(store) => {
            tracing::info!(
                step = label,
                status = "ready",
                latency_us = start.elapsed().as_micros() as u64,
                path = %path.display(),
                "DuckDB store booted"
            );
            on_event(InitEvent::ok_with_latency(label, start.elapsed()));
            Some(Arc::new(store))
        }
        Err(e) => {
            tracing::error!(step = label, error = ?e, "DuckDB store failed to boot");
            on_event(InitEvent::error(label, &format!("{e:#}")));
            None
        }
    }
}

/// Boot the in-memory cache (Moka).
#[allow(clippy::cast_possible_truncation)]
fn boot_cache(
    entry: &config::CacheServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<Arc<CacheService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("System cache"));
        return None;
    }
    on_event(InitEvent::running("System cache", "Initializing in-memory cache"));
    let start = Instant::now();
    let store = CacheService::boot(entry.to_moka_config());
    tracing::info!(
        step = "System cache",
        status = "ready",
        latency_us = start.elapsed().as_micros() as u64,
        "Moka cache booted"
    );
    on_event(InitEvent::ok_with_latency("System cache", start.elapsed()));
    Some(Arc::new(store))
}

/// Boot the vector store (RRO — embedded Qdrant).
///
/// RRO's `QdrantInstance::start()` spawns a background thread and returns
/// immediately (~235µs). This does NOT mean the engine is ready. We must
/// verify the engine is actually queryable before reporting healthy.
#[cfg(feature = "rro")]
#[allow(clippy::cast_possible_truncation)]
async fn boot_vector(
    data_dir: &Path,
    entry: &config::VectorServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<Arc<VectorService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("Vector store"));
        return None;
    }
    on_event(InitEvent::running("Vector store", "Starting RRO engine"));
    let start = Instant::now();
    let storage_path = entry.resolve_path(data_dir);

    // RRO uses QDRANT__STORAGE__STORAGE_PATH env var for its data dir
    // TODO: Replace with boot parameter once RRO fork API is updated
    // SAFETY: set_var is deprecated due to thread safety concerns,
    // but RRO reads this at boot before any parallel access.
    #[allow(deprecated)]
    std::env::set_var("QDRANT__STORAGE__STORAGE_PATH", &storage_path);

    let store = match VectorService::boot(None) {
        Ok(s) => Arc::new(s),
        Err(e) => {
            tracing::error!(step = "Vector store", error = ?e, "RRO failed to boot");
            on_event(InitEvent::error("Vector store", &format!("{e:#}")));
            return None;
        }
    };

    // Post-boot verification: prove the engine is actually queryable.
    // QdrantInstance::start() returns in ~235µs because it spawns a thread.
    // The engine may not be ready yet. Ping verifies it.
    match store.ping().await {
        Ok(()) => {
            tracing::info!(
                step = "Vector store",
                status = "ready",
                latency_us = start.elapsed().as_micros() as u64,
                path = %storage_path.display(),
                "RRO vector engine booted and verified"
            );
            on_event(InitEvent::ok_with_latency("Vector store", start.elapsed()));
            Some(store)
        }
        Err(e) => {
            tracing::error!(
                step = "Vector store",
                error = ?e,
                "RRO started but engine is not queryable"
            );
            on_event(InitEvent::error("Vector store", &format!("Engine not ready: {e:#}")));
            None
        }
    }
}

/// Boot the voice service (Kokoros — embedded TTS).
#[cfg(feature = "kokoros")]
#[allow(clippy::cast_possible_truncation)]
async fn boot_voice(
    data_dir: &Path,
    entry: &config::VoiceServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<Arc<VoiceService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("Voice service"));
        return None;
    }
    on_event(InitEvent::running("Voice service", "Loading Kokoros TTS engine"));
    let start = Instant::now();
    let model_path = entry.resolve_model_path(data_dir);
    let voices_path = entry.resolve_voices_path(data_dir);

    match VoiceService::boot(&model_path, &voices_path).await {
        Ok(store) => {
            tracing::info!(
                step = "Voice service",
                status = "ready",
                latency_us = start.elapsed().as_micros() as u64,
                model_path = %model_path.display(),
                voices_path = %voices_path.display(),
                "Kokoros TTS engine booted"
            );
            on_event(InitEvent::ok_with_latency("Voice service", start.elapsed()));
            Some(Arc::new(store))
        }
        Err(e) => {
            tracing::error!(step = "Voice service", error = ?e, "Kokoros failed to boot");
            on_event(InitEvent::error("Voice service", &format!("{e:#}")));
            None
        }
    }
}

/// Boot the grammar service (outlines-core — structured generation).
#[cfg(feature = "outlines")]
#[allow(clippy::cast_possible_truncation)]
fn boot_grammar(
    entry: &config::GrammarServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<Arc<GrammarService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("Grammar service"));
        return None;
    }
    on_event(InitEvent::running("Grammar service", "Initializing outlines-core engine"));
    let start = Instant::now();

    match GrammarService::boot() {
        Ok(store) => {
            tracing::info!(
                step = "Grammar service",
                status = "ready",
                latency_us = start.elapsed().as_micros() as u64,
                "outlines-core grammar engine booted"
            );
            on_event(InitEvent::ok_with_latency("Grammar service", start.elapsed()));
            Some(Arc::new(store))
        }
        Err(e) => {
            tracing::error!(step = "Grammar service", error = ?e, "outlines-core failed to boot");
            on_event(InitEvent::error("Grammar service", &format!("{e:#}")));
            None
        }
    }
}
