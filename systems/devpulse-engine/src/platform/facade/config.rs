//! # Facade Configuration
//!
//! Controls what crosses the facade boundary at each detail level.
//! Design principle: **deny by default, whitelist explicitly**.
//!
//! The config is runtime-mutable via `Arc<RwLock<WhitelistConfig>>`.
//! Connectome settings UI writes new configs; the bridge reads on
//! every event. No restart required for config changes.

use std::collections::HashSet;

use serde::{Deserialize, Serialize};

use super::events::EventCategory;

/// How much detail to expose through the facade.
///
/// Each level is a superset of the one above it:
/// Surface ⊂ Intermediate ⊂ Internal ⊂ Debug
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum DetailLevel {
    Surface,
    Intermediate,
    Internal,
    Debug,
}

/// What to strip from events before they cross the facade.
///
/// Layered: each level includes all protections of the one above.
/// None ⊂ Pii ⊂ Ip ⊂ Full
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum RedactionLevel {
    None,
    Pii,
    Ip,
    Full,
}

/// The main facade configuration. Runtime-mutable.
///
/// Categories are **denied by default**. To surface an event category
/// at a given detail level, it must be in `allowed_categories`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhitelistConfig {
    pub level: DetailLevel,
    pub allowed_categories: HashSet<EventCategory>,
    pub redaction: RedactionLevel,
    pub show_timing: bool,
    pub show_scores: bool,
    pub show_model_names: bool,
    pub show_file_paths: bool,
    pub max_events_per_sec: u32,
}

impl WhitelistConfig {
    /// Preset for layman users (main UI).
    pub fn surface() -> Self {
        let mut allowed = HashSet::new();
        allowed.insert(EventCategory::ModelLifecycle);
        allowed.insert(EventCategory::MinionSignal);
        allowed.insert(EventCategory::CostarAssembly);
        allowed.insert(EventCategory::GovernanceDecision);
        allowed.insert(EventCategory::ResourceArbiter);

        Self {
            level: DetailLevel::Surface,
            allowed_categories: allowed,
            redaction: RedactionLevel::Ip,
            show_timing: false,
            show_scores: false,
            show_model_names: false,
            show_file_paths: false,
            max_events_per_sec: 5,
        }
    }

    /// Preset for power users.
    pub fn intermediate() -> Self {
        let mut allowed = HashSet::new();
        allowed.insert(EventCategory::ModelLifecycle);
        allowed.insert(EventCategory::MinionSignal);
        allowed.insert(EventCategory::RuminationTrace);
        allowed.insert(EventCategory::CostarAssembly);
        allowed.insert(EventCategory::GovernanceDecision);
        allowed.insert(EventCategory::ResourceArbiter);
        allowed.insert(EventCategory::InferenceMetrics);

        Self {
            level: DetailLevel::Intermediate,
            allowed_categories: allowed,
            redaction: RedactionLevel::Pii,
            show_timing: true,
            show_scores: false,
            show_model_names: true,
            show_file_paths: true,
            max_events_per_sec: 20,
        }
    }

    /// Preset for dev tools (Connectome, Lab).
    pub fn internal() -> Self {
        let allowed: HashSet<EventCategory> = [
            EventCategory::ModelLifecycle,
            EventCategory::MinionSignal,
            EventCategory::RuminationTrace,
            EventCategory::CostarAssembly,
            EventCategory::GovernanceDecision,
            EventCategory::SignalRouting,
            EventCategory::ResourceArbiter,
            EventCategory::InferenceMetrics,
        ]
        .into_iter()
        .collect();

        Self {
            level: DetailLevel::Internal,
            allowed_categories: allowed,
            redaction: RedactionLevel::None,
            show_timing: true,
            show_scores: true,
            show_model_names: true,
            show_file_paths: true,
            max_events_per_sec: 100,
        }
    }

    /// Preset for Lab debug mode. Everything, no limits.
    pub fn debug() -> Self {
        let mut config = Self::internal();
        config.level = DetailLevel::Debug;
        config.max_events_per_sec = u32::MAX;
        config
    }

    /// Check if a category is allowed through.
    #[inline]
    pub fn allows(&self, category: EventCategory) -> bool {
        self.allowed_categories.contains(&category)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn surface_excludes_signal_routing() {
        let config = WhitelistConfig::surface();
        assert!(!config.allows(EventCategory::SignalRouting));
        assert!(!config.allows(EventCategory::InferenceMetrics));
        assert!(!config.allows(EventCategory::RuminationTrace));
    }

    #[test]
    fn internal_includes_everything() {
        let config = WhitelistConfig::internal();
        assert!(config.allows(EventCategory::SignalRouting));
        assert!(config.allows(EventCategory::InferenceMetrics));
        assert!(config.allows(EventCategory::RuminationTrace));
    }

    #[test]
    fn detail_levels_are_ordered() {
        assert!(DetailLevel::Surface < DetailLevel::Intermediate);
        assert!(DetailLevel::Intermediate < DetailLevel::Internal);
        assert!(DetailLevel::Internal < DetailLevel::Debug);
    }
}
