//! Platform facade — the sole public API for persistence, health, and config.
//!
//! This module is the translation layer between maestro (kernel) and Tauri (public).
//! Maestro types with kernel terminology are wrapped in engine-owned public types.
//! `ip_term!()` is applied at this boundary for all user-facing strings.
//!
//! # Architecture
//! ```text
//! Tauri -> Platform (this) -> Store wrappers -> Maestro adapters (private)
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

pub mod config;
pub mod health;
pub mod init;
pub mod stores;

pub use config::{
    DataScope, DatabaseConfig, PlatformBootConfig, PlatformConfig,
    sanitize_path,
};
pub use health::{HealthStatus, SubsystemHealth, SystemHealth};
pub use init::{InitEvent, InitStatus};
pub use stores::{Store, StoreRole};

// Re-export maestro persistence traits and types for Tauri command layer
pub use devpulse_maestro::cortex::persistence::{
    AnalyticsAdapter, CacheAdapter, SqlAdapter, SqlRow, SqlValue,
};

use anyhow::Result;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};

use stores::analytics::AnalyticsStore;
use stores::cache::CacheStore;
use stores::graph::GraphStore;
use stores::relational::RelationalStore;

/// Platform facade — sole public API for persistence, health, config.
///
/// Wraps maestro internals. Tauri talks to this, never to maestro directly.
/// All user-facing strings pass through `ip_term!()` at this boundary.
///
/// Stores are organized by scope:
/// - `system_*`: Kernel internals, telemetry, FSM state
/// - `user_*`: User sessions, preferences, knowledge
/// - `global_*`: Cross-project shared knowledge graph
pub struct Platform {
    // ── System scope ────────────────────────────────────────────
    system_relational: Option<Arc<RelationalStore>>,
    system_analytics: Option<Arc<AnalyticsStore>>,
    system_graph: Option<Arc<GraphStore>>,
    system_cache: Option<Arc<CacheStore>>,
    // ── User scope ──────────────────────────────────────────────
    user_relational: Option<Arc<RelationalStore>>,
    user_graph: Option<Arc<GraphStore>>,
    // ── Global scope ────────────────────────────────────────────
    global_graph: Option<Arc<GraphStore>>,
    // ── Meta ────────────────────────────────────────────────────
    boot_config: PlatformBootConfig,
    boot_time: Instant,
    data_dir: PathBuf,
}

impl Platform {
    /// Boot the platform — initialize all enabled stores from config.
    ///
    /// Each store is booted independently. A failed store results in
    /// a degraded state (store = None), NOT a crash. The callback
    /// receives real-time progress for every subsystem.
    ///
    /// # Errors
    /// Returns error only if config loading or directory creation fails.
    /// Individual store failures are reported via callback and result in None.
    pub async fn boot(
        data_dir: PathBuf,
        on_event: impl Fn(InitEvent) + Send + 'static,
    ) -> Result<Self> {
        let boot_time = Instant::now();
        let boot_config = PlatformBootConfig::load(&data_dir)?;

        // Step 1: Create scoped directory hierarchy
        on_event(InitEvent::running("data layer", "Creating data directories"));
        ensure_scoped_dirs(&data_dir, &boot_config)?;
        on_event(InitEvent::ok("data layer", "Directories ready"));

        // ── System scope stores ─────────────────────────────────

        let system_relational = boot_store_relational(
            &data_dir,
            &boot_config.stores.system.relational,
            &boot_config.windows,
            "System relational",
            &on_event,
        ).await;

        let system_analytics = boot_store_analytics(
            &data_dir,
            &boot_config.stores.system.analytics,
            &boot_config.windows,
            "System analytics",
            &on_event,
        );

        let system_graph = boot_store_graph(
            &data_dir,
            &boot_config.stores.system.graph,
            &boot_config.windows,
            "System graph",
            &on_event,
        ).await;

        let system_cache = if boot_config.stores.system.cache.enabled {
            on_event(InitEvent::running("System cache", "Initializing in-memory cache"));
            let start = Instant::now();
            let store = CacheStore::boot(boot_config.stores.system.cache.to_moka_config());
            tracing::info!(
                step = "System cache",
                status = "ready",
                latency_ms = start.elapsed().as_millis() as u64,
                "Moka cache booted"
            );
            on_event(InitEvent::ok_with_latency("System cache", start.elapsed()));
            Some(Arc::new(store))
        } else {
            on_event(InitEvent::skipped("System cache"));
            None
        };

        // ── User scope stores ───────────────────────────────────

        let user_relational = boot_store_relational(
            &data_dir,
            &boot_config.stores.user.relational,
            &boot_config.windows,
            "User relational",
            &on_event,
        ).await;

        let user_graph = boot_store_graph(
            &data_dir,
            &boot_config.stores.user.graph,
            &boot_config.windows,
            "User graph",
            &on_event,
        ).await;

        // ── Global scope stores ─────────────────────────────────

        let global_graph = boot_store_graph(
            &data_dir,
            &boot_config.stores.global.graph,
            &boot_config.windows,
            "Global graph",
            &on_event,
        ).await;

        // ── Vector store (RRO) — disabled until wired ───────────
        on_event(InitEvent::skipped("Vector store"));

        Ok(Self {
            system_relational,
            system_analytics,
            system_graph,
            system_cache,
            user_relational,
            user_graph,
            global_graph,
            boot_config,
            boot_time,
            data_dir,
        })
    }

    /// Get system health by pinging all enabled stores.
    pub async fn health(&self) -> SystemHealth {
        let mut subsystems = Vec::with_capacity(7);

        if let Some(store) = &self.system_relational {
            subsystems.push(ping_store(store.as_ref()).await);
        }
        if let Some(store) = &self.system_analytics {
            subsystems.push(ping_store(store.as_ref()).await);
        }
        if let Some(store) = &self.system_graph {
            subsystems.push(ping_store(store.as_ref()).await);
        }
        if let Some(store) = &self.system_cache {
            subsystems.push(ping_store(store.as_ref()).await);
        }
        if let Some(store) = &self.user_relational {
            subsystems.push(ping_store(store.as_ref()).await);
        }
        if let Some(store) = &self.user_graph {
            subsystems.push(ping_store(store.as_ref()).await);
        }
        if let Some(store) = &self.global_graph {
            subsystems.push(ping_store(store.as_ref()).await);
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
            databases: self.boot_config.to_database_config(),
        }
    }

    /// Uptime in seconds since boot.
    pub fn uptime_secs(&self) -> u64 {
        self.boot_time.elapsed().as_secs()
    }

    // ── System scope accessors ──────────────────────────────────

    /// Get the system relational store (if enabled and booted).
    pub fn relational(&self) -> Option<&Arc<RelationalStore>> {
        self.system_relational.as_ref()
    }

    /// Get the system analytics store (if enabled and booted).
    pub fn analytics(&self) -> Option<&Arc<AnalyticsStore>> {
        self.system_analytics.as_ref()
    }

    /// Get the system graph store (if enabled and booted).
    pub fn graph(&self) -> Option<&Arc<GraphStore>> {
        self.system_graph.as_ref()
    }

    /// Get the system cache store (if enabled and booted).
    pub fn cache(&self) -> Option<&Arc<CacheStore>> {
        self.system_cache.as_ref()
    }

    // ── User scope accessors ────────────────────────────────────

    /// Get the user relational store (if enabled and booted).
    pub fn user_relational(&self) -> Option<&Arc<RelationalStore>> {
        self.user_relational.as_ref()
    }

    /// Get the user graph store (if enabled and booted).
    pub fn user_graph(&self) -> Option<&Arc<GraphStore>> {
        self.user_graph.as_ref()
    }

    // ── Global scope accessors ──────────────────────────────────

    /// Get the global graph store (if enabled and booted).
    pub fn global_graph(&self) -> Option<&Arc<GraphStore>> {
        self.global_graph.as_ref()
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
// Boot helpers — DRY store initialization with Windows hardening
// ═══════════════════════════════════════════════════════════════

/// Boot a relational (LibSQL) store with retry on file lock.
async fn boot_store_relational(
    data_dir: &Path,
    entry: &config::StoreEntry,
    win_config: &config::WindowsConfig,
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

    let result = retry_on_lock_async(win_config, label, || {
        let p = path.clone();
        async move { RelationalStore::boot(&p).await }
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

/// Boot an analytics (DuckDB) store.
fn boot_store_analytics(
    data_dir: &Path,
    entry: &config::StoreEntry,
    win_config: &config::WindowsConfig,
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
    let path = sanitize_path(&raw_path, win_config);

    match AnalyticsStore::boot(&path) {
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

/// Boot a graph (SurrealDB) store with stale data recovery.
async fn boot_store_graph(
    data_dir: &Path,
    entry: &config::GraphStoreEntry,
    win_config: &config::WindowsConfig,
    label: &'static str,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<Arc<GraphStore>> {
    if !entry.enabled {
        on_event(InitEvent::skipped(label));
        return None;
    }
    on_event(InitEvent::running(label, "Opening database"));
    let start = Instant::now();
    let raw_path = entry.resolve_path(data_dir);
    let path = sanitize_path(&raw_path, win_config);
    let namespace = entry.namespace.as_str();
    let database = entry.database.as_str();

    match GraphStore::boot(&path, namespace, database, label).await {
        Ok(store) => {
            tracing::info!(
                step = label,
                status = "ready",
                latency_ms = start.elapsed().as_millis() as u64,
                path = %path.display(),
                ns = namespace,
                db = database,
                "SurrealDB store booted"
            );
            on_event(InitEvent::ok_with_latency(label, start.elapsed()));
            Some(Arc::new(store))
        }
        Err(e) => {
            tracing::warn!(
                step = label,
                error = ?e,
                "SurrealDB failed — attempting recovery by clearing stale data"
            );
            // Recovery: clear stale SurrealKV data and retry
            if path.exists() {
                tracing::info!(path = %path.display(), "Removing stale SurrealKV data directory");
                match std::fs::remove_dir_all(&path) {
                    Ok(()) => tracing::info!("Stale data removed successfully"),
                    Err(rm_err) => tracing::warn!(
                        error = ?rm_err,
                        "Failed to remove stale data — Windows may still hold file locks"
                    ),
                }
                // Brief delay for Windows to release file handles
                tokio::time::sleep(std::time::Duration::from_millis(
                    win_config.file_lock_retry_delay_ms,
                )).await;
            }
            match GraphStore::boot(&path, namespace, database, label).await {
                Ok(store) => {
                    tracing::info!(
                        step = label,
                        status = "recovered",
                        latency_ms = start.elapsed().as_millis() as u64,
                        "SurrealDB store booted after data reset"
                    );
                    on_event(InitEvent::ok_with_latency(label, start.elapsed()));
                    Some(Arc::new(store))
                }
                Err(retry_err) => {
                    tracing::error!(
                        step = label,
                        error = ?retry_err,
                        "SurrealDB store failed even after data reset"
                    );
                    on_event(InitEvent::error(label, &format!("{retry_err:#}")));
                    None
                }
            }
        }
    }
}

/// Retry an async file operation on Windows sharing violations.
///
/// Windows can hold file locks briefly after a process exits or during
/// antivirus scans. This retries with exponential backoff.
async fn retry_on_lock_async<F, Fut, T>(
    config: &config::WindowsConfig,
    operation: &str,
    mut f: F,
) -> anyhow::Result<T>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = anyhow::Result<T>>,
{
    let mut last_err = None;
    for attempt in 0..config.file_lock_retries {
        match f().await {
            Ok(val) => return Ok(val),
            Err(e) => {
                let err_str = format!("{e:#}");
                let is_lock_error = err_str.contains("sharing violation")
                    || err_str.contains("being used by another process")
                    || err_str.contains("Access is denied")
                    || err_str.contains("os error 32")
                    || err_str.contains("os error 33");

                if is_lock_error && attempt + 1 < config.file_lock_retries {
                    let delay = u64::from(1u32 << attempt.min(3))
                        * config.file_lock_retry_delay_ms;
                    tracing::warn!(
                        operation,
                        attempt = attempt + 1,
                        max = config.file_lock_retries,
                        delay_ms = delay,
                        "File lock detected — retrying"
                    );
                    tokio::time::sleep(Duration::from_millis(delay)).await;
                    last_err = Some(e);
                } else {
                    return Err(e);
                }
            }
        }
    }
    Err(last_err.unwrap_or_else(|| anyhow::anyhow!("retry exhausted for {operation}")))
}

/// Ensure scoped directories exist for all enabled file-based stores.
fn ensure_scoped_dirs(data_dir: &std::path::Path, config: &PlatformBootConfig) -> Result<()> {
    // System scope
    if config.stores.system.relational.enabled {
        if let Some(parent) = config.stores.system.relational.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    if config.stores.system.analytics.enabled {
        if let Some(parent) = config.stores.system.analytics.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    if config.stores.system.graph.enabled {
        if let Some(parent) = config.stores.system.graph.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }

    // User scope
    if config.stores.user.relational.enabled {
        if let Some(parent) = config.stores.user.relational.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    if config.stores.user.graph.enabled {
        if let Some(parent) = config.stores.user.graph.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }

    // Global scope
    if config.stores.global.graph.enabled {
        if let Some(parent) = config.stores.global.graph.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }

    // Projects dir (just the root — per-project dirs created on demand)
    std::fs::create_dir_all(data_dir.join("projects"))?;

    // Logs dir
    std::fs::create_dir_all(data_dir.join("logs"))?;

    Ok(())
}

/// Ping a single store and return its health.
#[allow(clippy::cast_possible_truncation)] // Ping latency will never exceed u64 ms
async fn ping_store<S: Store>(store: &S) -> SubsystemHealth {
    let start = Instant::now();
    let result = store.ping().await;
    let latency = start.elapsed().as_millis() as u64;

    match result {
        Ok(()) => SubsystemHealth {
            name: store.name().to_string(),
            status: HealthStatus::Healthy,
            latency_ms: Some(latency),
            message: None,
        },
        Err(e) => {
            tracing::warn!(
                store = store.name(),
                error = ?e,
                "Health ping failed"
            );
            SubsystemHealth {
                name: store.name().to_string(),
                status: HealthStatus::Down,
                latency_ms: Some(latency),
                message: Some(format!("{e:#}")),
            }
        }
    }
}
