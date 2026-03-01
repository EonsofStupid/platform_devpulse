//! Health check types for the platform facade.
//!
//! These types are what Tauri and the frontend see.
//! No maestro internals leak through these types.

use serde::Serialize;
use ts_rs::TS;

/// Overall system health status.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct SystemHealth {
    /// Aggregate status across all subsystems.
    pub status: HealthStatus,
    /// Seconds since platform boot.
    pub uptime_secs: u64,
    /// Per-subsystem health details.
    pub subsystems: Vec<SubsystemHealth>,
}

/// Health of an individual subsystem (database, cache, etc.).
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct SubsystemHealth {
    /// Public name for this subsystem (`ip_term!()` applied at creation).
    pub name: String,
    /// Current status.
    pub status: HealthStatus,
    /// Ping latency in milliseconds (if available).
    pub latency_ms: Option<u64>,
    /// Human-readable status message.
    pub message: Option<String>,
}

/// Health status enum.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS)]
#[ts(export)]
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
