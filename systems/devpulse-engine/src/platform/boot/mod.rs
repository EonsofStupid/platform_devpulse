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
use crate::platform::stores::analytics::{AnalyticsStore, SYSTEM_ANALYTICS_SCHEMA};
use crate::platform::stores::cache::CacheStore;
use crate::platform::stores::graph::GraphStore;
use crate::platform::stores::relational::{RelationalStore, SYSTEM_SCHEMA, USER_SCHEMA};
#[cfg(feature = "rro")]
use crate::platform::stores::vector::VectorStore;

use anyhow::Result;
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

/// Collected store handles from a successful boot pipeline.
pub struct BootedStores {
    pub system_relational: Option<Arc<RelationalStore>>,
    pub system_analytics: Option<Arc<AnalyticsStore>>,
    pub system_graph: Option<Arc<GraphStore>>,
    pub system_cache: Option<Arc<CacheStore>>,
    pub user_relational: Option<Arc<RelationalStore>>,
    pub user_graph: Option<Arc<GraphStore>>,
    pub global_graph: Option<Arc<GraphStore>>,
    #[cfg(feature = "rro")]
    pub vector: Option<Arc<VectorStore>>,
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
) -> Result<BootedStores> {
    // ── Phase 1: Preflight ────────────────────────────────────
    on_event(InitEvent::running("data layer", "Creating data directories"));
    preflight::ensure_scoped_dirs(data_dir, boot_config)?;
    on_event(InitEvent::ok("data layer", "Directories ready"));

    // ── Phase 2: Boot stores ──────────────────────────────────

    // System relational (LibSQL) — CRITICAL
    let system_relational = boot_relational(
        data_dir,
        &boot_config.stores.system.relational,
        &boot_config.windows,
        SYSTEM_SCHEMA,
        "System relational",
        on_event,
    ).await;

    // System analytics (DuckDB) — non-critical
    let system_analytics = boot_analytics(
        data_dir,
        &boot_config.stores.system.analytics,
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
        &boot_config.stores.system.cache,
        on_event,
    );

    // User relational (LibSQL) — non-critical
    let user_relational = boot_relational(
        data_dir,
        &boot_config.stores.user.relational,
        &boot_config.windows,
        USER_SCHEMA,
        "User relational",
        on_event,
    ).await;

    // Vector store (RRO) — non-critical, feature-gated
    #[cfg(feature = "rro")]
    let vector = boot_vector(
        data_dir,
        &boot_config.stores.system.vector,
        on_event,
    );
    #[cfg(not(feature = "rro"))]
    on_event(InitEvent::skipped("Vector store"));

    // ── Phase 3: Validate critical stores ─────────────────────
    if system_relational.is_none() && boot_config.stores.system.relational.enabled {
        anyhow::bail!(
            "Critical store failed: System relational (LibSQL) was enabled but failed to boot"
        );
    }
    if system_graph.is_none() && boot_config.stores.system.graph.enabled {
        anyhow::bail!(
            "Critical store failed: System graph (SurrealDB) was enabled but failed to boot"
        );
    }

    Ok(BootedStores {
        system_relational,
        system_analytics,
        system_graph,
        system_cache,
        user_relational,
        user_graph,
        global_graph,
        #[cfg(feature = "rro")]
        vector,
    })
}

// ═══════════════════════════════════════════════════════════════
// Simple store boot helpers
// ═══════════════════════════════════════════════════════════════

/// Boot a relational (`LibSQL`) store with file-lock retry.
async fn boot_relational(
    data_dir: &Path,
    entry: &config::StoreEntry,
    win_config: &config::WindowsConfig,
    schema: &'static str,
    label: &'static str,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<Arc<RelationalStore>> {
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
        async move { RelationalStore::boot(&p, schema, label).await }
    })
    .await;

    match result {
        Ok(store) => {
            tracing::info!(
                step = label,
                status = "ready",
                latency_ms = start.elapsed().as_millis() as u64,
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
async fn boot_analytics(
    data_dir: &Path,
    entry: &config::StoreEntry,
    _win_config: &config::WindowsConfig,
    schema: &'static str,
    label: &'static str,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<Arc<AnalyticsStore>> {
    if !entry.enabled {
        on_event(InitEvent::skipped(label));
        return None;
    }
    on_event(InitEvent::running(label, "Opening database"));
    let start = Instant::now();
    let raw_path = entry.resolve_path(data_dir);
    let path = sanitize_path(&raw_path, _win_config);
    let retry_cfg = entry.retry.to_retry_config();

    let result = retry::retry_on_lock_async(&retry_cfg, label, || {
        let p = path.clone();
        async move {
            tokio::task::spawn_blocking(move || AnalyticsStore::boot(&p, schema, label))
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
                latency_ms = start.elapsed().as_millis() as u64,
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
fn boot_cache(
    entry: &config::CacheStoreEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<Arc<CacheStore>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("System cache"));
        return None;
    }
    on_event(InitEvent::running("System cache", "Initializing in-memory cache"));
    let start = Instant::now();
    let store = CacheStore::boot(entry.to_moka_config());
    tracing::info!(
        step = "System cache",
        status = "ready",
        latency_ms = start.elapsed().as_millis() as u64,
        "Moka cache booted"
    );
    on_event(InitEvent::ok_with_latency("System cache", start.elapsed()));
    Some(Arc::new(store))
}

/// Boot the vector store (RRO — embedded Qdrant).
#[cfg(feature = "rro")]
fn boot_vector(
    data_dir: &Path,
    entry: &config::VectorStoreEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<Arc<VectorStore>> {
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

    match VectorStore::boot(None) {
        Ok(store) => {
            tracing::info!(
                step = "Vector store",
                status = "ready",
                latency_ms = start.elapsed().as_millis() as u64,
                path = %storage_path.display(),
                "RRO vector engine booted"
            );
            on_event(InitEvent::ok_with_latency("Vector store", start.elapsed()));
            Some(Arc::new(store))
        }
        Err(e) => {
            tracing::error!(step = "Vector store", error = ?e, "RRO failed to boot");
            on_event(InitEvent::error("Vector store", &format!("{e:#}")));
            None
        }
    }
}
