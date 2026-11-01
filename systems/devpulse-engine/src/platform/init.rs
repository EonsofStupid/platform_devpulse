//! Initialization event types for startup progress.
//!
//! Emitted during `Platform::boot()` so the launcher UI can show
//! real-time progress for each database and subsystem.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::time::Duration;

/// Event emitted during platform initialization.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct InitEvent {
    /// Stable step identity; the UI selects a simple or advanced label.
    pub step: String,
    /// Current status of this step.
    pub status: InitStatus,
    /// Human-readable message.
    pub message: Option<String>,
    /// How long this step took in microseconds (populated on completion).
    /// Microseconds prevent sub-millisecond operations from reporting 0.
    pub latency_us: Option<u64>,
}

/// Status of an initialization step.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
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
            latency_us: None,
        }
    }

    /// Create an "ok" event.
    pub fn ok(step: &str, message: &str) -> Self {
        Self {
            step: step.to_string(),
            status: InitStatus::Ok,
            message: Some(message.to_string()),
            latency_us: None,
        }
    }

    /// Create an "ok" event with measured latency in microseconds.
    #[allow(clippy::cast_possible_truncation)]
    pub fn ok_with_latency(step: &str, duration: Duration) -> Self {
        Self {
            step: step.to_string(),
            status: InitStatus::Ok,
            message: None,
            latency_us: Some(duration.as_micros() as u64),
        }
    }

    /// Create an "error" event.
    pub fn error(step: &str, message: &str) -> Self {
        Self {
            step: step.to_string(),
            status: InitStatus::Error,
            message: Some(message.to_string()),
            latency_us: None,
        }
    }

    /// Create a "skipped" event (store disabled in config).
    pub fn skipped(step: &str) -> Self {
        Self::skipped_with_message(step, "Disabled in config")
    }

    /// Create a "skipped" event with an explicit reason (dependency missing, deferred work, etc.).
    pub fn skipped_with_message(step: &str, message: &str) -> Self {
        Self {
            step: step.to_string(),
            status: InitStatus::Skipped,
            message: Some(message.to_string()),
            latency_us: None,
        }
    }
}
