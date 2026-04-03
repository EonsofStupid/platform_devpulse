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
pub mod server;
pub mod services;

pub use config::{
    DataScope, DatabaseConfig, PlatformBootConfig, PlatformConfig,
    sanitize_path,
};
pub use health::{HealthStatus, SubsystemHealth, SystemHealth};
pub use init::{InitEvent, InitStatus};
pub use metrics::ProcessMetrics;
pub use services::{Service, ServiceRole, ServiceState};

// Re-export clyffy persistence traits and types for Tauri command layer
pub use devpulse_clyffy::cortex::persistence::{
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
// Grammar (llguidance) — future sprint
// #[cfg(feature = "outlines")]
// use services::grammar::GrammarService;
#[cfg(feature = "candle")]
use services::embedder::EmbedderService;
#[cfg(feature = "candle")]
use services::whisper::WhisperService;
#[cfg(feature = "inference")]
use services::model_loader::ModelLoaderService;
use services::devforge::DevForgeService;

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
        #[cfg(feature = "candle")]
        $action!($self.embedder);
        #[cfg(feature = "candle")]
        $action!($self.whisper);
        #[cfg(feature = "inference")]
        $action!($self.model_loader);
        // Non-critical
        $action!($self.devforge);
    };
}

/// Reverse enumeration for shutdown (last booted = first shutdown).
macro_rules! for_each_service_rev {
    ($self:ident, $action:ident) => {
        $action!($self.devforge);
        #[cfg(feature = "inference")]
        $action!($self.model_loader);
        #[cfg(feature = "candle")]
        $action!($self.whisper);
        #[cfg(feature = "candle")]
        $action!($self.embedder);
        #[cfg(feature = "rro")]
        $action!($self.vector);
        $action!($self.global_graph);
        $action!($self.user_graph);
        $action!($self.user_relational);
        $action!($self.system_cache);
        $action!($self.system_graph);
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
    // ── Grammar (llguidance) — future sprint ────────────────────
    // ── Embedder (Candle) ─────────────────────────────────────
    #[cfg(feature = "candle")]
    embedder: Option<Arc<EmbedderService>>,
    // ── Whisper (Candle) ──────────────────────────────────────
    #[cfg(feature = "candle")]
    whisper: Option<Arc<WhisperService>>,
    // ── Model Loader (Inference) ──────────────────────────────
    #[cfg(feature = "inference")]
    model_loader: Option<Arc<ModelLoaderService>>,
    // ── DevForge (VSCode) ─────────────────────────────────────
    devforge: Option<Arc<DevForgeService>>,
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
            #[cfg(feature = "candle")]
            embedder: booted.embedder,
            #[cfg(feature = "candle")]
            whisper: booted.whisper,
            #[cfg(feature = "inference")]
            model_loader: booted.model_loader,
            devforge: booted.devforge,
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


    // Grammar (llguidance) — getter added in future sprint

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

    // ── Candle scope accessors ──────────────────────────────────

    /// Get the embedder service (if enabled and booted).
    #[cfg(feature = "candle")]
    pub fn embedder(&self) -> Option<&Arc<EmbedderService>> {
        self.embedder.as_ref()
    }

    /// Get the whisper service (if enabled and booted).
    #[cfg(feature = "candle")]
    pub fn whisper(&self) -> Option<&Arc<WhisperService>> {
        self.whisper.as_ref()
    }

    // ── Model Loader accessor ──────────────────────────────────────

    /// Get the model loader service (if enabled and booted).
    #[cfg(feature = "inference")]
    pub fn model_loader(&self) -> Option<&Arc<ModelLoaderService>> {
        self.model_loader.as_ref()
    }

    // ── DevForge accessor ────────────────────────────────────────

    /// Get the DevForge service (if enabled and booted).
    pub fn devforge(&self) -> Option<&Arc<DevForgeService>> {
        self.devforge.as_ref()
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
        for_each_service_rev!(self, shutdown_one);

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
