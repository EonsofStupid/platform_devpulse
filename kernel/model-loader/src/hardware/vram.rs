//! VRAM budget planner — answers "do all my `auto_load` slots fit?"

use crate::loading::states::ModelStatus;
use serde::{Deserialize, Serialize};

/// Full VRAM budget calculation for all registered slots.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VramBudget {
    /// Total VRAM on the GPU in MB (0 if no GPU).
    pub total_vram_mb: u64,
    /// Currently used VRAM across all loaded models in MB.
    pub currently_used_mb: u64,
    /// VRAM needed by all `auto_load` slots not yet loaded.
    pub planned_load_mb: u64,
    /// Remaining VRAM after all planned loads. Negative = won't fit.
    pub remaining_after_plan_mb: i64,
    /// Per-slot breakdown.
    pub per_slot: Vec<SlotBudgetEntry>,
}

/// A single slot's contribution to the VRAM budget.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlotBudgetEntry {
    /// Slot identifier.
    pub slot_id: String,
    /// Assigned model name (for display).
    pub model_name: String,
    /// Estimated VRAM for this model in MB.
    pub vram_estimate_mb: u64,
    /// Current status of this slot in the budget.
    pub status: BudgetStatus,
    /// Other slot IDs sharing this model instance.
    pub shared_with: Vec<String>,
}

/// Where a slot sits in the VRAM budget.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BudgetStatus {
    /// Model is already loaded, VRAM already consumed.
    Loaded,
    /// Model is planned to load and fits in remaining VRAM.
    Planned,
    /// Model is planned but won't fit — needs user action.
    WontFit,
    /// Slot has no model assigned.
    Unassigned,
    /// Slot shares a model instance with another slot (no additional VRAM).
    SharedInstance,
}

impl std::fmt::Display for BudgetStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Loaded => write!(f, "loaded"),
            Self::Planned => write!(f, "planned"),
            Self::WontFit => write!(f, "wont_fit"),
            Self::Unassigned => write!(f, "unassigned"),
            Self::SharedInstance => write!(f, "shared_instance"),
        }
    }
}

impl VramBudget {
    /// Whether all planned loads fit in available VRAM.
    #[must_use]
    pub fn fits(&self) -> bool {
        self.remaining_after_plan_mb >= 0
    }

    /// Slots that won't fit.
    #[must_use]
    pub fn overflowing_slots(&self) -> Vec<&SlotBudgetEntry> {
        self.per_slot
            .iter()
            .filter(|s| s.status == BudgetStatus::WontFit)
            .collect()
    }
}

/// Compute VRAM budget from current slot states and hardware metrics.
pub fn compute_budget(
    slots: &[(String, Option<String>, u64, ModelStatus)], // (slot_id, model_id, vram_est_mb, status)
    total_vram_mb: u64,
    current_vram_used_mb: u64,
) -> VramBudget {
    let mut per_slot = Vec::new();
    let mut planned_total: u64 = 0;
    let mut loaded_total: u64 = 0;
    // Track which model_ids are already accounted for (shared instance dedup)
    let mut seen_models: std::collections::HashSet<String> = std::collections::HashSet::new();

    for (slot_id, model_id, vram_est, status) in slots {
        let is_loaded = matches!(status, ModelStatus::Loaded { .. });
        let model_key = model_id.clone().unwrap_or_default();

        // Check if another slot already loaded/planned this exact model
        let is_shared = !model_key.is_empty() && seen_models.contains(&model_key);

        if !model_key.is_empty() {
            seen_models.insert(model_key.clone());
        }

        let budget_status = if model_id.is_none() {
            BudgetStatus::Unassigned
        } else if is_shared {
            BudgetStatus::SharedInstance
        } else if is_loaded {
            loaded_total += vram_est;
            BudgetStatus::Loaded
        } else {
            // Check if it would fit
            let available = total_vram_mb.saturating_sub(current_vram_used_mb + planned_total);
            if *vram_est <= available {
                planned_total += vram_est;
                BudgetStatus::Planned
            } else {
                BudgetStatus::WontFit
            }
        };

        per_slot.push(SlotBudgetEntry {
            slot_id: slot_id.clone(),
            model_name: model_key,
            vram_estimate_mb: if is_shared { 0 } else { *vram_est },
            status: budget_status,
            shared_with: Vec::new(), // populated by caller with dedup info
        });
    }

    // VRAM byte counts in MB physically cannot exceed i64::MAX (would require
    // ~8 EiB of VRAM), but we defend with try_from to keep the cast lossless.
    let total_i64 = i64::try_from(total_vram_mb).unwrap_or(i64::MAX);
    let used_i64 = i64::try_from(current_vram_used_mb).unwrap_or(i64::MAX);
    let planned_i64 = i64::try_from(planned_total).unwrap_or(i64::MAX);
    let remaining = total_i64 - used_i64 - planned_i64;

    VramBudget {
        total_vram_mb,
        currently_used_mb: current_vram_used_mb,
        planned_load_mb: planned_total,
        remaining_after_plan_mb: remaining,
        per_slot,
    }
}
