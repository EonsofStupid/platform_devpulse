//! Swap guard — tracks which slots are mid-swap to prevent inference races.
//!
//! When a model swap is in progress (unload → reassign → load), any inference
//! request to that slot gets a clean `LoaderError::SlotSwapping` instead of
//! hitting a missing model or corrupted state.
//!
//! Phase 2 (future): full hot-swap protocol that loads the new model before
//! unloading the old one for zero-downtime swaps.

use std::collections::HashSet;

/// Tracks which slots are currently mid-swap.
///
/// Inference requests check this before attempting to acquire a handle.
/// The guard is held for the entire `swap_model()` operation — the Mutex on
/// `ModelLoaderService` ensures no concurrent access, but `inference_handle()`
/// is `&self` (immutable) so it needs this separate flag.
#[derive(Debug, Default)]
pub struct SwapGuard {
    /// Slot IDs currently being swapped.
    swapping: HashSet<String>,
}

impl SwapGuard {
    /// Create an empty guard (no slots swapping).
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Mark a slot as mid-swap. Returns `false` if already swapping.
    pub fn begin(&mut self, slot_id: &str) -> bool {
        self.swapping.insert(slot_id.to_string())
    }

    /// Clear the swap flag for a slot. Call on success OR failure.
    pub fn end(&mut self, slot_id: &str) {
        self.swapping.remove(slot_id);
    }

    /// Check if a slot is currently mid-swap.
    #[must_use]
    pub fn is_swapping(&self, slot_id: &str) -> bool {
        self.swapping.contains(slot_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn begin_and_end() {
        let mut guard = SwapGuard::new();
        assert!(!guard.is_swapping("chat.brain"));

        assert!(guard.begin("chat.brain"));
        assert!(guard.is_swapping("chat.brain"));
        assert!(!guard.is_swapping("voice.tts"));

        // Double begin returns false
        assert!(!guard.begin("chat.brain"));

        guard.end("chat.brain");
        assert!(!guard.is_swapping("chat.brain"));
    }

    #[test]
    fn end_nonexistent_is_noop() {
        let mut guard = SwapGuard::new();
        guard.end("nonexistent.slot"); // Should not panic
    }
}
