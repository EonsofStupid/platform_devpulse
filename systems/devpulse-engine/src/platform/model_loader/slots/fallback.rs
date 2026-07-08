//! Fallback chain resolution — walk slot fallbacks until a loaded slot is found.

use crate::platform::model_loader::slots::registry::SlotRegistry;
use std::collections::HashSet;

/// Maximum fallback chain depth to prevent cycles.
const MAX_FALLBACK_DEPTH: usize = 5;

/// Resolve the fallback chain for a slot.
///
/// Starting from `slot_id`, walk the `fallback` pointers until:
/// 1. We find a slot whose ID is in `loaded_slots` → return that slot ID
/// 2. We hit a slot with no fallback → return `None`
/// 3. We exceed max depth (cycle protection) → return `None`
///
/// The starting slot itself is checked first — if it's loaded, return it.
#[must_use]
pub fn resolve_fallback<S: std::hash::BuildHasher>(
    registry: &SlotRegistry,
    slot_id: &str,
    loaded_slots: &HashSet<String, S>,
) -> Option<String> {
    // If the requested slot itself is loaded, use it directly.
    if loaded_slots.contains(slot_id) {
        return Some(slot_id.to_string());
    }

    let mut current = slot_id.to_string();
    let mut visited = HashSet::new();

    for _ in 0..MAX_FALLBACK_DEPTH {
        let slot = registry.get_slot(&current)?;

        let fallback_id = slot.fallback.as_ref()?;

        // Cycle detection
        if !visited.insert(fallback_id.clone()) {
            tracing::warn!(
                slot = %slot_id,
                cycle_at = %fallback_id,
                "Cycle detected in fallback chain"
            );
            return None;
        }

        // Check if fallback slot is loaded
        if loaded_slots.contains(fallback_id) {
            return Some(fallback_id.clone());
        }

        // Continue walking the chain
        current = fallback_id.clone();
    }

    tracing::warn!(
        slot = %slot_id,
        max_depth = MAX_FALLBACK_DEPTH,
        "Fallback chain exceeded max depth"
    );
    None
}

#[cfg(test)]
#[allow(clippy::unwrap_used)] // tests panic on registration / setup failure by design
mod tests {
    use super::*;
    use crate::platform::model_loader::slots::registry::SlotRegistry;
    use crate::platform::model_loader::slots::types::*;

    fn slot(id: &str, fallback: Option<&str>) -> Slot {
        Slot {
            id: id.to_string(),
            label: id.to_string(),
            capability: ModelCapability::TextGeneration,
            preferred_device: DevicePreference::Any,
            loading: LoadingStrategy::Hot,
            persistence_class: crate::platform::model_loader::slots::PersistenceClass::OnDemand,
            lane: crate::platform::hardware::LaneKind::Vram,
            assigned_model: None,
            fallback: fallback.map(String::from),
            runtime: None,
            default_model: None,
            requires: Vec::new(),
            overrides: None,
            source_tier: crate::platform::model_loader::slots::ModelSourceTier::UserManaged,
            extensions: std::collections::HashMap::new(),
            kv_cache: crate::platform::model_loader::slots::KvCacheConfig::default(),
            builtin: false,
        }
    }

    #[test]
    fn direct_loaded() {
        let mut reg = SlotRegistry::new();
        reg.register_slot(slot("chat.brain", None)).unwrap();

        let loaded: HashSet<String> = ["chat.brain".to_string()].into();
        assert_eq!(
            resolve_fallback(&reg, "chat.brain", &loaded),
            Some("chat.brain".to_string())
        );
    }

    #[test]
    fn one_hop_fallback() {
        let mut reg = SlotRegistry::new();
        reg.register_slot(slot("minion.escalation", Some("chat.brain")))
            .unwrap();
        reg.register_slot(slot("chat.brain", None)).unwrap();

        let loaded: HashSet<String> = ["chat.brain".to_string()].into();
        assert_eq!(
            resolve_fallback(&reg, "minion.escalation", &loaded),
            Some("chat.brain".to_string())
        );
    }

    #[test]
    fn nothing_loaded() {
        let mut reg = SlotRegistry::new();
        reg.register_slot(slot("minion.escalation", Some("chat.brain")))
            .unwrap();
        reg.register_slot(slot("chat.brain", None)).unwrap();

        let loaded: HashSet<String> = HashSet::new();
        assert_eq!(resolve_fallback(&reg, "minion.escalation", &loaded), None);
    }

    #[test]
    fn no_fallback_not_loaded() {
        let mut reg = SlotRegistry::new();
        reg.register_slot(slot("rag.embedder", None)).unwrap();

        let loaded: HashSet<String> = HashSet::new();
        assert_eq!(resolve_fallback(&reg, "rag.embedder", &loaded), None);
    }

    #[test]
    fn slot_not_registered() {
        let reg = SlotRegistry::new();
        let loaded: HashSet<String> = HashSet::new();
        assert_eq!(resolve_fallback(&reg, "nope.missing", &loaded), None);
    }
}
