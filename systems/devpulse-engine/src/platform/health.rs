//! Health check types for the platform engine.
//!
//! These types are what Tauri and the frontend see.
//! No clyffy internals leak through these types.

use crate::platform::services::ServiceState;
use serde::Serialize;
use specta::Type;

/// Overall system health status.
#[derive(Debug, Clone, Serialize, Type)]
pub struct SystemHealth {
    /// Aggregate status across all subsystems.
    pub status: HealthStatus,
    /// Seconds since platform boot.
    pub uptime_secs: u64,
    /// Per-subsystem health details.
    pub subsystems: Vec<SubsystemHealth>,
}

/// Health of an individual subsystem (database, cache, etc.).
#[derive(Debug, Clone, Serialize, Type)]
pub struct SubsystemHealth {
    /// Public name for this subsystem (`ip_term!()` applied at creation).
    pub name: String,
    /// Lifecycle state — Created, Booting, Ready, Degraded, or Failed.
    pub state: ServiceState,
    /// Ping result status — Healthy if ping succeeded, Down if it failed.
    pub status: HealthStatus,
    /// Ping latency in microseconds. Microseconds prevent sub-millisecond
    /// operations from rounding to 0 and lying about their cost.
    pub latency_us: Option<u64>,
    /// Human-readable status message.
    pub message: Option<String>,
}

/// Health status enum.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
pub enum HealthStatus {
    /// Subsystem is operational.
    Healthy,
    /// Subsystem is operational but with degraded performance.
    Degraded,
    /// Subsystem is not operational.
    Down,
    /// Subsystem status is not known (not yet initialized).
    Unknown,
}
