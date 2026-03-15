//! Platform engine — the sole public API for persistence, health, and config.
//!
//! The engine owns every service lifecycle: boot, health, shutdown.
//! Maestro (kernel) provides low-level adapters. The engine wraps them
//! into managed services with config-driven boot and health orchestration.
//! Tauri desktop is the thin facade that calls into this engine via IPC.
//!
//! # Architecture
//! ```text
//! Tauri (facade) -> Platform Engine (this) -> Services -> Maestro adapters (private)
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
pub mod health;
pub mod init;
pub mod server;
pub mod services;

pub use config::{
    DataScope, DatabaseConfig, PlatformBootConfig, PlatformConfig,
    sanitize_path,
};
pub use health::{HealthStatus, SubsystemHealth, SystemHealth};
pub use init::{InitEvent, InitStatus};
pub use services::{Service, ServiceRole};

// Re-export maestro persistence traits and types for Tauri command layer
pub use devpulse_maestro::cortex::persistence::{
    AnalyticsAdapter, CacheAdapter, SqlAdapter, SqlRow, SqlValue,
};

use anyhow::Result;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

use services::analytics::AnalyticsService;
use services::cache::CacheService;
use services::graph::GraphService;
use services::relational::RelationalService;
#[cfg(feature = "rro")]
use services::vector::VectorService;

/// Platform engine — sole public API for persistence, health, config.
///
/// Owns all service lifecycles. Tauri talks to this, never to maestro directly.
/// All user-facing strings pass through `ip_term!()` at this boundary.
///
/// Services are organized by scope:
/// - `system_*`: Kernel internals, telemetry, FSM state
/// - `user_*`: User sessions, preferences, knowledge
/// - `global_*`: Cross-project shared knowledge graph
pub struct Platform {
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
    ) -> Result<Self> {
        let boot_time = Instant::now();
        let boot_config = PlatformBootConfig::load(&data_dir)?;

        let booted = boot::execute(&data_dir, &boot_config, &on_event).await?;

        Ok(Self {
            system_relational: booted.system_relational,
            system_analytics: booted.system_analytics,
            system_graph: booted.system_graph,
            system_cache: booted.system_cache,
            user_relational: booted.user_relational,
            user_graph: booted.user_graph,
            global_graph: booted.global_graph,
            #[cfg(feature = "rro")]
            vector: booted.vector,
            boot_config,
            boot_time,
            data_dir,
        })
    }

    /// Get system health by pinging all enabled services.
    pub async fn health(&self) -> SystemHealth {
        let mut subsystems = Vec::with_capacity(7);

        if let Some(svc) = &self.system_relational {
            subsystems.push(ping_service(svc.as_ref()).await);
        }
        if let Some(svc) = &self.system_analytics {
            subsystems.push(ping_service(svc.as_ref()).await);
        }
        if let Some(svc) = &self.system_graph {
            subsystems.push(ping_service(svc.as_ref()).await);
        }
        if let Some(svc) = &self.system_cache {
            subsystems.push(ping_service(svc.as_ref()).await);
        }
        if let Some(svc) = &self.user_relational {
            subsystems.push(ping_service(svc.as_ref()).await);
        }
        if let Some(svc) = &self.user_graph {
            subsystems.push(ping_service(svc.as_ref()).await);
        }
        if let Some(svc) = &self.global_graph {
            subsystems.push(ping_service(svc.as_ref()).await);
        }
        #[cfg(feature = "rro")]
        if let Some(svc) = &self.vector {
            subsystems.push(ping_service(svc.as_ref()).await);
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

    /// Graceful shutdown — close all services in reverse boot order.
    ///
    /// Flushes WALs, checkpoints databases, and releases file locks so the
    /// next process can open them immediately (hot-reload, restart).
    /// Enforces a 5-second deadline — if exceeded, logs a warning and drops.
    #[allow(clippy::cast_possible_truncation)]
    pub async fn shutdown(&self) {
        let start = Instant::now();
        tracing::info!("Platform shutting down — closing services");
        let deadline = std::time::Duration::from_secs(5);

        // Reverse boot order: graph → analytics → cache → relational
        // Graph services share one SurrealKV — close system graph first (owns the adapter)
        Self::shutdown_service_with_deadline(self.global_graph.as_ref(), &deadline, start).await;
        Self::shutdown_service_with_deadline(self.user_graph.as_ref(), &deadline, start).await;
        Self::shutdown_service_with_deadline(self.system_graph.as_ref(), &deadline, start).await;
        Self::shutdown_service_with_deadline(self.system_analytics.as_ref(), &deadline, start).await;
        // Cache (Moka) is in-memory — no-op shutdown, but call for consistency
        Self::shutdown_service_with_deadline(self.system_cache.as_ref(), &deadline, start).await;
        Self::shutdown_service_with_deadline(self.user_relational.as_ref(), &deadline, start).await;
        Self::shutdown_service_with_deadline(self.system_relational.as_ref(), &deadline, start).await;

        let elapsed = start.elapsed();
        tracing::info!(
            elapsed_ms = elapsed.as_millis() as u64,
            "Platform shutdown complete"
        );
    }

    /// Shut down a single service, respecting the overall deadline.
    async fn shutdown_service_with_deadline<S: Service>(
        service: Option<&Arc<S>>,
        deadline: &std::time::Duration,
        start: Instant,
    ) {
        let Some(service) = service else { return };
        let elapsed = start.elapsed();
        if elapsed >= *deadline {
            tracing::warn!(
                service = service.name(),
                "Shutdown deadline exceeded — skipping"
            );
            return;
        }
        let remaining = *deadline - elapsed;
        match tokio::time::timeout(remaining, service.shutdown()).await {
            Ok(Ok(())) => {
                tracing::debug!(service = service.name(), "Service shutdown OK");
            }
            Ok(Err(e)) => {
                tracing::warn!(service = service.name(), error = %e, "Service shutdown error");
            }
            Err(_) => {
                tracing::warn!(service = service.name(), "Service shutdown timed out");
            }
        }
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
#[allow(clippy::cast_possible_truncation)] // Ping latency will never exceed u64 ms
async fn ping_service<S: Service>(svc: &S) -> SubsystemHealth {
    let start = Instant::now();
    let result = svc.ping().await;
    let latency = start.elapsed().as_millis() as u64;

    match result {
        Ok(()) => SubsystemHealth {
            name: svc.name().to_string(),
            status: HealthStatus::Healthy,
            latency_ms: Some(latency),
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
                status: HealthStatus::Down,
                latency_ms: Some(latency),
                message: Some(format!("{e:#}")),
            }
        }
    }
}
