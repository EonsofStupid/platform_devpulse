//! Initialization event types for startup progress.
//!
//! Emitted during `Platform::boot()` so the launcher UI can show
//! real-time progress for each database and subsystem.

use serde::Serialize;
use std::time::Duration;
use ts_rs::TS;

/// Event emitted during platform initialization.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct InitEvent {
    /// Step name (public-safe, `ip_term!()` already applied).
    pub step: String,
    /// Current status of this step.
    pub status: InitStatus,
    /// Human-readable message.
    pub message: Option<String>,
    /// How long this step took (populated on completion).
    pub latency_ms: Option<u64>,
}

/// Status of an initialization step.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS)]
#[ts(export)]
pub enum InitStatus {
    /// Step is currently executing.
    Running,
    /// Step completed successfully.
    Ok,
    /// Step failed.
    Error,
    /// Step was skipped (e.g., disabled in config).
    Skipped,
}

impl InitEvent {
    /// Create a "running" event.
    pub fn running(step: &str, message: &str) -> Self {
        Self {
            step: step.to_string(),
            status: InitStatus::Running,
            message: Some(message.to_string()),
            latency_ms: None,
        }
    }

    /// Create an "ok" event.
    pub fn ok(step: &str, message: &str) -> Self {
        Self {
            step: step.to_string(),
            status: InitStatus::Ok,
            message: Some(message.to_string()),
            latency_ms: None,
        }
    }

    /// Create an "ok" event with measured latency.
    #[allow(clippy::cast_possible_truncation)] // Duration of DB init will never exceed u64 ms
    pub fn ok_with_latency(step: &str, duration: Duration) -> Self {
        Self {
            step: step.to_string(),
            status: InitStatus::Ok,
            message: None,
            latency_ms: Some(duration.as_millis() as u64),
        }
    }

    /// Create an "error" event.
    pub fn error(step: &str, message: &str) -> Self {
        Self {
            step: step.to_string(),
            status: InitStatus::Error,
            message: Some(message.to_string()),
            latency_ms: None,
        }
    }

    /// Create a "skipped" event (store disabled in config).
    pub fn skipped(step: &str) -> Self {
        Self {
            step: step.to_string(),
            status: InitStatus::Skipped,
            message: Some("Disabled in config".to_string()),
            latency_ms: None,
        }
    }
}
