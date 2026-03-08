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

pub mod config;
pub mod health;
pub mod init;
pub mod stores;

pub use config::{DatabaseConfig, PlatformBootConfig, PlatformConfig};
pub use health::{HealthStatus, SubsystemHealth, SystemHealth};
pub use init::{InitEvent, InitStatus};
pub use stores::{Store, StoreRole};

// Re-export maestro persistence traits and types for Tauri command layer
pub use devpulse_maestro::cortex::persistence::{
    AnalyticsAdapter, CacheAdapter, SqlAdapter, SqlRow, SqlValue,
};

use anyhow::Result;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

use stores::analytics::AnalyticsStore;
use stores::cache::CacheStore;
use stores::graph::GraphStore;
use stores::relational::RelationalStore;

/// Platform facade — sole public API for persistence, health, config.
///
/// Wraps maestro internals. Tauri talks to this, never to maestro directly.
/// All user-facing strings pass through `ip_term!()` at this boundary.
pub struct Platform {
    relational: Option<Arc<RelationalStore>>,
    analytics: Option<Arc<AnalyticsStore>>,
    graph: Option<Arc<GraphStore>>,
    cache: Option<Arc<CacheStore>>,
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

        // Step 1: Ensure directories for file-based stores
        on_event(InitEvent::running(
            crate::ip_term!("Trinity"),
            "Creating data directories",
        ));
        ensure_store_dirs(&data_dir, &boot_config)?;
        on_event(InitEvent::ok(
            crate::ip_term!("Trinity"),
            "Directories ready",
        ));

        // Step 2: Relational store (LibSQL) — resilient boot
        let relational = if boot_config.stores.relational.enabled {
            on_event(InitEvent::running("Relational store", "Opening database"));
            let start = Instant::now();
            let path = boot_config.stores.relational.resolve_path(&data_dir);
            match RelationalStore::boot(&path).await {
                Ok(store) => {
                    tracing::info!(
                        step = "Relational store",
                        status = "ready",
                        latency_ms = start.elapsed().as_millis() as u64,
                        "LibSQL store booted"
                    );
                    on_event(InitEvent::ok_with_latency("Relational store", start.elapsed()));
                    Some(Arc::new(store))
                }
                Err(e) => {
                    tracing::error!(
                        step = "Relational store",
                        error = ?e,
                        "LibSQL store failed to boot"
                    );
                    on_event(InitEvent::error("Relational store", &format!("{e:#}")));
                    None
                }
            }
        } else {
            on_event(InitEvent::skipped("Relational store"));
            None
        };

        // Step 3: Analytics store (DuckDB) — resilient boot
        let analytics = if boot_config.stores.analytics.enabled {
            on_event(InitEvent::running("Analytics store", "Opening database"));
            let start = Instant::now();
            let path = boot_config.stores.analytics.resolve_path(&data_dir);
            match AnalyticsStore::boot(&path) {
                Ok(store) => {
                    tracing::info!(
                        step = "Analytics store",
                        status = "ready",
                        latency_ms = start.elapsed().as_millis() as u64,
                        "DuckDB store booted"
                    );
                    on_event(InitEvent::ok_with_latency("Analytics store", start.elapsed()));
                    Some(Arc::new(store))
                }
                Err(e) => {
                    tracing::error!(
                        step = "Analytics store",
                        error = ?e,
                        "DuckDB store failed to boot"
                    );
                    on_event(InitEvent::error("Analytics store", &format!("{e:#}")));
                    None
                }
            }
        } else {
            on_event(InitEvent::skipped("Analytics store"));
            None
        };

        // Step 4: Graph store (SurrealDB) — resilient boot with stale data recovery
        let graph = if boot_config.stores.graph.enabled {
            on_event(InitEvent::running("Graph store", "Opening database"));
            let start = Instant::now();
            let path = boot_config.stores.graph.resolve_path(&data_dir);
            match GraphStore::boot(&path).await {
                Ok(store) => {
                    tracing::info!(
                        step = "Graph store",
                        status = "ready",
                        latency_ms = start.elapsed().as_millis() as u64,
                        "SurrealDB store booted"
                    );
                    on_event(InitEvent::ok_with_latency("Graph store", start.elapsed()));
                    Some(Arc::new(store))
                }
                Err(e) => {
                    tracing::warn!(
                        step = "Graph store",
                        error = ?e,
                        "SurrealDB failed — attempting recovery by clearing stale data"
                    );
                    // Recovery: clear stale SurrealKV data and retry
                    if path.exists() {
                        tracing::info!(
                            path = %path.display(),
                            "Removing stale SurrealKV data directory"
                        );
                        match std::fs::remove_dir_all(&path) {
                            Ok(()) => tracing::info!("Stale data removed successfully"),
                            Err(rm_err) => tracing::warn!(
                                error = ?rm_err,
                                "Failed to remove stale data — Windows may still hold file locks"
                            ),
                        }
                        // Brief delay for Windows to release file handles
                        tokio::time::sleep(std::time::Duration::from_millis(200)).await;
                    }
                    match GraphStore::boot(&path).await {
                        Ok(store) => {
                            tracing::info!(
                                step = "Graph store",
                                status = "recovered",
                                latency_ms = start.elapsed().as_millis() as u64,
                                "SurrealDB store booted after data reset"
                            );
                            on_event(InitEvent::ok_with_latency("Graph store", start.elapsed()));
                            Some(Arc::new(store))
                        }
                        Err(retry_err) => {
                            tracing::error!(
                                step = "Graph store",
                                error = ?retry_err,
                                "SurrealDB store failed even after data reset"
                            );
                            on_event(InitEvent::error("Graph store", &format!("{retry_err:#}")));
                            None
                        }
                    }
                }
            }
        } else {
            on_event(InitEvent::skipped("Graph store"));
            None
        };

        // Step 5: Cache store (Moka) — resilient boot
        let cache = if boot_config.stores.cache.enabled {
            on_event(InitEvent::running("Cache store", "Initializing in-memory cache"));
            let start = Instant::now();
            let store = CacheStore::boot(boot_config.stores.cache.to_moka_config());
            tracing::info!(
                step = "Cache store",
                status = "ready",
                latency_ms = start.elapsed().as_millis() as u64,
                "Moka cache booted"
            );
            on_event(InitEvent::ok_with_latency("Cache store", start.elapsed()));
            Some(Arc::new(store))
        } else {
            on_event(InitEvent::skipped("Cache store"));
            None
        };

        Ok(Self {
            relational,
            analytics,
            graph,
            cache,
            boot_config,
            boot_time,
            data_dir,
        })
    }

    /// Get system health by pinging all enabled stores.
    ///
    /// Each store is pinged independently. A failed ping results in
    /// `HealthStatus::Down` for that store, not a propagated error.
    pub async fn health(&self) -> SystemHealth {
        let mut subsystems = Vec::with_capacity(4);

        if let Some(store) = &self.relational {
            subsystems.push(ping_store(store.as_ref()).await);
        }
        if let Some(store) = &self.analytics {
            subsystems.push(ping_store(store.as_ref()).await);
        }
        if let Some(store) = &self.graph {
            subsystems.push(ping_store(store.as_ref()).await);
        }
        if let Some(store) = &self.cache {
            subsystems.push(ping_store(store.as_ref()).await);
        }

        // Aggregate status
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
            databases: self.boot_config.to_database_config(),
        }
    }

    /// Uptime in seconds since boot.
    pub fn uptime_secs(&self) -> u64 {
        self.boot_time.elapsed().as_secs()
    }

    /// Get the relational store (if enabled and booted).
    pub fn relational(&self) -> Option<&Arc<RelationalStore>> {
        self.relational.as_ref()
    }

    /// Get the analytics store (if enabled and booted).
    pub fn analytics(&self) -> Option<&Arc<AnalyticsStore>> {
        self.analytics.as_ref()
    }

    /// Get the graph store (if enabled and booted).
    pub fn graph(&self) -> Option<&Arc<GraphStore>> {
        self.graph.as_ref()
    }

    /// Get the cache store (if enabled and booted).
    pub fn cache(&self) -> Option<&Arc<CacheStore>> {
        self.cache.as_ref()
    }
}

/// Ensure directories exist for all enabled file-based stores.
fn ensure_store_dirs(data_dir: &std::path::Path, config: &PlatformBootConfig) -> Result<()> {
    if config.stores.relational.enabled {
        if let Some(parent) = config.stores.relational.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    if config.stores.analytics.enabled {
        if let Some(parent) = config.stores.analytics.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    if config.stores.graph.enabled {
        if let Some(parent) = config.stores.graph.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    // Moka is in-memory — no directory needed
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
