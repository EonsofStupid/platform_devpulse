//! Platform facade — the sole public API for persistence, health, and config.
//!
//! This module is the translation layer between maestro (kernel) and Tauri (public).
//! Maestro types with kernel terminology are wrapped in engine-owned public types.
//! `ip_term!()` is applied at this boundary for all user-facing strings.
//!
//! # Architecture
//! ```text
//! Tauri → Platform (this) → Maestro PersistenceLayer (private)
//!              │
//!              ├── SystemHealth (public type)
//!              ├── InitEvent (public type)
//!              └── PlatformConfig (public type)
//! ```

pub mod config;
pub mod health;
pub mod init;

pub use config::{DatabaseConfig, PlatformConfig};
pub use health::{HealthStatus, SubsystemHealth, SystemHealth};
pub use init::{InitEvent, InitStatus};

use anyhow::Result;
use devpulse_maestro::cortex::persistence::{PersistenceConfig, PersistenceLayer, StoreKind};
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;

/// Platform facade — sole public API for persistence, health, config.
///
/// Wraps maestro internals. Tauri talks to this, never to maestro directly.
/// All user-facing strings pass through `ip_term!()` at this boundary.
pub struct Platform {
    persistence: Arc<RwLock<PersistenceLayer>>,
    boot_time: Instant,
    data_dir: PathBuf,
}

impl Platform {
    /// Boot the platform — initialize all databases.
    ///
    /// Calls the provided callback for each initialization step so the
    /// launcher UI can show real-time progress.
    ///
    /// # Errors
    /// Returns error if any database fails to initialize.
    pub async fn boot(
        data_dir: PathBuf,
        on_event: impl Fn(InitEvent),
    ) -> Result<Self> {
        let boot_time = Instant::now();
        let config = PersistenceConfig::new(&data_dir);
        let mut persistence = PersistenceLayer::new(config);

        // Step 1: Ensure directories
        on_event(InitEvent::running(
            crate::ip_term!("Trinity"),
            "Creating data directories",
        ));
        persistence.ensure_dirs()?;
        on_event(InitEvent::ok(
            crate::ip_term!("Trinity"),
            "Directories ready",
        ));

        // Step 2: LibSQL (relational store)
        on_event(InitEvent::running("Relational store", "Opening database"));
        let start = Instant::now();
        persistence.init_libsql().await?;
        on_event(InitEvent::ok_with_latency(
            "Relational store",
            start.elapsed(),
        ));

        // Step 3: DuckDB (analytics store)
        on_event(InitEvent::running("Analytics store", "Opening database"));
        let start = Instant::now();
        persistence.init_duckdb()?;
        on_event(InitEvent::ok_with_latency(
            "Analytics store",
            start.elapsed(),
        ));

        // Step 4: SurrealDB (graph store)
        on_event(InitEvent::running("Graph store", "Opening database"));
        let start = Instant::now();
        persistence.init_surreal().await?;
        on_event(InitEvent::ok_with_latency("Graph store", start.elapsed()));

        Ok(Self {
            persistence: Arc::new(RwLock::new(persistence)),
            boot_time,
            data_dir,
        })
    }

    /// Get system health by pinging all databases.
    ///
    /// Each subsystem is pinged independently. A failed ping results in
    /// `HealthStatus::Down` for that subsystem, not a propagated error.
    pub async fn health(&self) -> SystemHealth {
        let persistence = self.persistence.read().await;
        let mut subsystems = Vec::with_capacity(3);

        // LibSQL
        subsystems.push(ping_subsystem(&persistence, "Relational store", StoreKind::LibSql).await);

        // DuckDB
        subsystems.push(ping_subsystem(&persistence, "Analytics store", StoreKind::DuckDb).await);

        // SurrealDB
        subsystems.push(ping_subsystem(&persistence, "Graph store", StoreKind::Surreal).await);

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
            databases: DatabaseConfig::default(),
        }
    }

    /// Uptime in seconds since boot.
    pub fn uptime_secs(&self) -> u64 {
        self.boot_time.elapsed().as_secs()
    }
}

/// Ping a single subsystem and return its health.
async fn ping_subsystem(
    persistence: &PersistenceLayer,
    name: &str,
    kind: StoreKind,
) -> SubsystemHealth {
    if !persistence.is_initialized(kind) {
        return SubsystemHealth {
            name: name.to_string(),
            status: HealthStatus::Unknown,
            latency_ms: None,
            message: Some("Not initialized".to_string()),
        };
    }

    let start = Instant::now();
    let result = match kind {
        StoreKind::LibSql => persistence.ping_libsql().await,
        StoreKind::DuckDb => persistence.ping_duckdb().await,
        StoreKind::Surreal => persistence.ping_surreal().await,
    };
    #[allow(clippy::cast_possible_truncation)] // Ping latency will never exceed u64 ms
    let latency = start.elapsed().as_millis() as u64;

    match result {
        Ok(()) => SubsystemHealth {
            name: name.to_string(),
            status: HealthStatus::Healthy,
            latency_ms: Some(latency),
            message: None,
        },
        Err(e) => SubsystemHealth {
            name: name.to_string(),
            status: HealthStatus::Down,
            latency_ms: Some(latency),
            message: Some(e.to_string()),
        },
    }
}
