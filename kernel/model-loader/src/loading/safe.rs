//! Safe loading protocol — VRAM checks before loading.
//!
//! Phase 4+ implementation. Types defined here for Phase 1 compile.

use crate::hardware::metrics::HardwareMetrics;
use crate::models::registry::ModelRegistryEntry;
use crate::traits::errors::{LoaderError, RecoverySuggestion};

/// Check if a model can be safely loaded given current hardware state.
///
/// Returns `Ok(())` if the model fits, or `Err(LoaderError::VramInsufficient)`
/// with recovery suggestions if it doesn't.
pub fn check_vram_fit(
    entry: &ModelRegistryEntry,
    metrics: &HardwareMetrics,
    _loaded_slots: &[(String, u64)], // (slot_id, vram_mb) of currently loaded
) -> Result<(), LoaderError> {
    let free = metrics.free_vram_mb();
    let needed = entry.vram_estimate_mb;

    if needed > free && metrics.has_gpu() {
        let mut suggestions = Vec::new();

        // Suggest unloading other slots
        for (slot_id, vram) in _loaded_slots {
            suggestions.push(RecoverySuggestion::UnloadSlot {
                slot_id: slot_id.clone(),
                frees_mb: *vram,
            });
        }

        // Always offer CPU fallback
        suggestions.push(RecoverySuggestion::UseCpuFallback);

        return Err(LoaderError::VramInsufficient {
            needed_mb: needed,
            available_mb: free,
            suggestions,
        });
    }

    Ok(())
}
