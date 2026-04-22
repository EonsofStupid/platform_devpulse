//! Slot registry — manages named slots with capabilities and strategies.

use crate::slots::types::{ModelCapability, Slot};
use crate::traits::errors::LoaderError;
use std::collections::HashMap;

/// Manages all registered slots. Consumers register their slots at startup.
///
/// The Model Loader doesn't know about Minions or CLYFFY — it just manages
/// named slots with capabilities and strategies.
#[derive(Debug, Default)]
pub struct SlotRegistry {
    slots: HashMap<String, Slot>,
}

impl SlotRegistry {
    /// Create an empty slot registry.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Register a single slot. Validates ID format.
    ///
    /// # Errors
    /// Returns error if slot ID format is invalid or slot already registered.
    pub fn register_slot(&mut self, slot: Slot) -> Result<(), LoaderError> {
        if !Slot::is_valid_id(&slot.id) {
            return Err(LoaderError::Internal {
                message: format!(
                    "Invalid slot ID '{}': must be 'subsystem.purpose' format",
                    slot.id
                ),
            });
        }
        if self.slots.contains_key(&slot.id) {
            return Err(LoaderError::Internal {
                message: format!("Slot '{}' is already registered", slot.id),
            });
        }
        self.slots.insert(slot.id.clone(), slot);
        Ok(())
    }

    /// Register multiple slots.
    pub fn register_slots(&mut self, slots: Vec<Slot>) -> Result<(), LoaderError> {
        for slot in slots {
            self.register_slot(slot)?;
        }
        Ok(())
    }

    /// Unregister a slot by ID.
    pub fn unregister_slot(&mut self, slot_id: &str) -> Result<Slot, LoaderError> {
        self.slots.remove(slot_id).ok_or(LoaderError::SlotNotFound {
            slot_id: slot_id.to_string(),
        })
    }

    /// Get a slot by ID.
    #[must_use]
    pub fn get_slot(&self, slot_id: &str) -> Option<&Slot> {
        self.slots.get(slot_id)
    }

    /// Get a mutable reference to a slot.
    pub fn get_slot_mut(&mut self, slot_id: &str) -> Option<&mut Slot> {
        self.slots.get_mut(slot_id)
    }

    /// All registered slots.
    #[must_use]
    pub fn list_slots(&self) -> Vec<&Slot> {
        self.slots.values().collect()
    }

    /// Slots belonging to a specific subsystem.
    #[must_use]
    pub fn list_slots_by_subsystem(&self, subsystem: &str) -> Vec<&Slot> {
        self.slots
            .values()
            .filter(|s| s.subsystem() == subsystem)
            .collect()
    }

    /// Slots that accept a specific capability.
    #[must_use]
    pub fn list_slots_by_capability(&self, cap: ModelCapability) -> Vec<&Slot> {
        self.slots
            .values()
            .filter(|s| s.capability == cap)
            .collect()
    }

    /// Number of registered slots.
    #[must_use]
    pub fn len(&self) -> usize {
        self.slots.len()
    }

    /// Whether the registry is empty.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.slots.is_empty()
    }

    /// All unique subsystem names.
    #[must_use]
    pub fn subsystems(&self) -> Vec<String> {
        let mut subs: Vec<String> = self
            .slots
            .values()
            .map(|s| s.subsystem().to_string())
            .collect();
        subs.sort();
        subs.dedup();
        subs
    }

    /// Check if a slot exists.
    #[must_use]
    pub fn contains(&self, slot_id: &str) -> bool {
        self.slots.contains_key(slot_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::slots::types::{DevicePreference, LoadingStrategy, ModelCapability};

    fn test_slot(id: &str, cap: ModelCapability) -> Slot {
        Slot {
            id: id.to_string(),
            label: id.to_string(),
            capability: cap,
            preferred_device: DevicePreference::Any,
            loading: LoadingStrategy::Hot,
            persistence_class: crate::slots::PersistenceClass::OnDemand,
            lane: crate::hardware::LaneKind::Vram,
            assigned_model: None,
            fallback: None,
            runtime: None,
            default_model: None,
            requires: Vec::new(),
            overrides: None,
            source_tier: crate::slots::ModelSourceTier::UserManaged,
            extensions: std::collections::HashMap::new(),
            builtin: false,
        }
    }

    #[test]
    fn register_and_list() {
        let mut reg = SlotRegistry::new();
        reg.register_slot(test_slot("chat.brain", ModelCapability::TextGeneration))
            .unwrap();
        reg.register_slot(test_slot("rag.embedder", ModelCapability::Embedding))
            .unwrap();

        assert_eq!(reg.len(), 2);
        assert!(reg.contains("chat.brain"));
        assert!(!reg.contains("nope.missing"));
    }

    #[test]
    fn filter_by_subsystem() {
        let mut reg = SlotRegistry::new();
        reg.register_slot(test_slot("minion.shared", ModelCapability::TextGeneration))
            .unwrap();
        reg.register_slot(test_slot(
            "minion.escalation",
            ModelCapability::TextGeneration,
        ))
        .unwrap();
        reg.register_slot(test_slot("rag.embedder", ModelCapability::Embedding))
            .unwrap();

        let minion_slots = reg.list_slots_by_subsystem("minion");
        assert_eq!(minion_slots.len(), 2);

        let rag_slots = reg.list_slots_by_subsystem("rag");
        assert_eq!(rag_slots.len(), 1);
    }

    #[test]
    fn filter_by_capability() {
        let mut reg = SlotRegistry::new();
        reg.register_slot(test_slot("chat.brain", ModelCapability::TextGeneration))
            .unwrap();
        reg.register_slot(test_slot("rag.embedder", ModelCapability::Embedding))
            .unwrap();
        reg.register_slot(test_slot("rag.reranker", ModelCapability::Reranking))
            .unwrap();

        let gen_slots = reg.list_slots_by_capability(ModelCapability::TextGeneration);
        assert_eq!(gen_slots.len(), 1);

        let embed_slots = reg.list_slots_by_capability(ModelCapability::Embedding);
        assert_eq!(embed_slots.len(), 1);
    }

    #[test]
    fn reject_invalid_id() {
        let mut reg = SlotRegistry::new();
        let result = reg.register_slot(test_slot("nope", ModelCapability::TextGeneration));
        assert!(result.is_err());
    }

    #[test]
    fn reject_duplicate() {
        let mut reg = SlotRegistry::new();
        reg.register_slot(test_slot("chat.brain", ModelCapability::TextGeneration))
            .unwrap();
        let result = reg.register_slot(test_slot("chat.brain", ModelCapability::TextGeneration));
        assert!(result.is_err());
    }
}
