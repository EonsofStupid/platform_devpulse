//! # Surface Events
//!
//! What the user actually sees. Every `SurfaceEvent` was born as an
//! `InternalEvent`, translated by the registry, filtered by the whitelist,
//! and scrubbed by the redaction filter.
//!
//! Design rules:
//! - `headline` is mandatory and always layman-friendly.
//! - `detail` is optional — only populated at Intermediate+ levels.
//! - `progress` drives UI progress bars (model loading, processing).
//! - `minion` is set when Clyffy should attribute the message to a specific character.
//! - No raw scores, no model names, no file paths at Surface level.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::events::MinionId;

/// What the layman user sees in the main UI.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SurfaceEvent {
    /// Unique ID for deduplication and UI keying.
    pub id: Uuid,

    /// Monotonic timestamp (ms since facade start).
    /// NOT wall-clock — avoids timezone/NTP issues.
    pub timestamp_ms: u64,

    /// Coarse UI category — determines icon, color, placement.
    pub category: SurfaceCategory,

    /// The headline shown to the user.
    pub headline: String,

    /// Optional detail text. Only populated at Intermediate+ detail levels.
    pub detail: Option<String>,

    /// 0.0–1.0 progress for operations that have a known duration.
    /// `None` for instantaneous events.
    pub progress: Option<f32>,

    /// How important this event is.
    pub severity: Severity,

    /// Which minion character to attribute this to.
    /// `None` = generic system message, `Some(Clyffy)` = Clyffy speaks.
    pub minion: Option<MinionId>,

    /// Whether the user can dismiss this notification.
    pub dismissible: bool,

    /// Optional action the UI should take.
    pub action: Option<SurfaceAction>,
}

/// Coarse UI category — determines how the event renders.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SurfaceCategory {
    /// Shows spinner or thought animation.
    Thinking,
    /// Shows progress bar.
    Loading,
    /// Subtle indicator, usually not a toast.
    Observing,
    /// Brief status during prompt assembly.
    Translating,
    /// Alert-style, may require user action.
    Protecting,
    /// Educational moment — tooltip-eligible.
    Learning,
    /// System health, usually dismissible.
    SystemHealth,
    /// Completion / success.
    Complete,
}

/// How urgent is this event.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Severity {
    Info,
    Status,
    Notice,
    Warning,
    Error,
}

/// Optional action the UI should take when receiving this event.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SurfaceAction {
    ShowProgress {
        label: String,
    },
    UpdateProgress {
        progress: f32,
    },
    Dismiss {
        event_id: Uuid,
    },
    OfferLearning {
        topic: String,
        content: String,
    },
    RequestDecision {
        question: String,
        options: Vec<String>,
    },
    Navigate {
        target: String,
    },
}

impl SurfaceEvent {
    /// Simple status message from Clyffy.
    pub fn clyffy_status(headline: impl Into<String>) -> Self {
        Self {
            id: Uuid::now_v7(),
            timestamp_ms: 0,
            category: SurfaceCategory::Thinking,
            headline: headline.into(),
            detail: None,
            progress: None,
            severity: Severity::Status,
            minion: Some(MinionId::Clyffy),
            dismissible: true,
            action: None,
        }
    }

    /// Progress-tracked operation.
    pub fn loading(headline: impl Into<String>, progress: f32) -> Self {
        Self {
            id: Uuid::now_v7(),
            timestamp_ms: 0,
            category: SurfaceCategory::Loading,
            headline: headline.into(),
            detail: None,
            progress: Some(progress),
            severity: Severity::Status,
            minion: Some(MinionId::Clyffy),
            dismissible: false,
            action: None,
        }
    }

    /// Governance alert.
    pub fn protection_alert(headline: impl Into<String>, detail: impl Into<String>) -> Self {
        Self {
            id: Uuid::now_v7(),
            timestamp_ms: 0,
            category: SurfaceCategory::Protecting,
            headline: headline.into(),
            detail: Some(detail.into()),
            progress: None,
            severity: Severity::Warning,
            minion: Some(MinionId::Guardian),
            dismissible: false,
            action: None,
        }
    }
}

impl SurfaceCategory {
    /// Display name for redacted/hashed events.
    pub fn display_name(&self) -> &'static str {
        match self {
            Self::Thinking => "thinking",
            Self::Loading => "loading",
            Self::Observing => "observing",
            Self::Translating => "translating",
            Self::Protecting => "protecting",
            Self::Learning => "learning",
            Self::SystemHealth => "system",
            Self::Complete => "complete",
        }
    }
}
