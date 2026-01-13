// engine/src/types/config.rs

//! Configuration types - public-safe versions
//!
//! These wrap orchestrator's internal config without exposing implementation.

use serde::{Deserialize, Serialize};

/// User configuration entry (public-safe)
///
/// Simple key-value pair for user settings.
/// Internal storage details are hidden.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigEntry {
    /// Configuration key
    pub key: String,
    /// Configuration value
    pub value: String,
}

impl ConfigEntry {
    /// Create a new config entry
    pub fn new(key: impl Into<String>, value: impl Into<String>) -> Self {
        Self {
            key: key.into(),
            value: value.into(),
        }
    }
}

/// Convert from orchestrator's internal ConfigEntry
impl From<orchestrator::infra::persistence::sql::ConfigEntry> for ConfigEntry {
    fn from(internal: orchestrator::infra::persistence::sql::ConfigEntry) -> Self {
        Self {
            key: internal.key,
            value: internal.value,
        }
    }
}
