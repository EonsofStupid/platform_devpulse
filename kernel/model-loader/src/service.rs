//! `ModelLoaderService` — the top-level API for model management.
//!
//! Consumers create this, register slots, and call methods.
//! All DevPulse-specific behavior lives in trait implementations (ConfigBackend,
//! LoaderEventSink) — this struct knows nothing about Tauri, libSQL, or Clyffy.

use crate::backends::BackendPool;
use crate::hardware::auto_config::{self, AutoConfig};
use crate::hardware::metrics::{self, HardwareMetrics};
use crate::hardware::vram;
use crate::loading::states::{ModelStatus, SlotStatus};
use crate::models::discovery;
use crate::models::registry::ModelRegistryEntry;
use crate::slots::fallback;
use crate::slots::registry::SlotRegistry;
use crate::slots::types::{ModelCapability, Slot};
use crate::traits::config::ConfigBackend;
use crate::traits::errors::LoaderError;
use crate::traits::events::{LoaderEvent, LoaderEventSink};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;

/// The main entry point. Consumers create this, register slots, and go.
pub struct ModelLoaderService {
    config: Box<dyn ConfigBackend>,
    events: Box<dyn LoaderEventSink>,
    slots: SlotRegistry,
    registry: Vec<ModelRegistryEntry>,
    models_dir: PathBuf,
    slot_statuses: HashMap<String, ModelStatus>,
    _backends: BackendPool,
}

impl ModelLoaderService {
    /// Create a new service instance.
    ///
    /// `models_dir` is where GGUF/SafeTensors files live (e.g. `~/.devpulse/models/`).
    pub fn new(
        config: Box<dyn ConfigBackend>,
        events: Box<dyn LoaderEventSink>,
        models_dir: PathBuf,
    ) -> anyhow::Result<Self> {
        // Ensure models directory exists
        if !models_dir.exists() {
            std::fs::create_dir_all(models_dir.join("gguf"))?;
            std::fs::create_dir_all(models_dir.join("safetensors"))?;
            tracing::info!(path = %models_dir.display(), "Created models directory");
        }

        Ok(Self {
            config,
            events,
            slots: SlotRegistry::new(),
            registry: Vec::new(),
            models_dir,
            slot_statuses: HashMap::new(),
            _backends: BackendPool::new(),
        })
    }

    // ── Slot Management ────────────────────────────────────────

    /// Register a single slot.
    pub fn register_slot(&mut self, slot: Slot) -> Result<(), LoaderError> {
        let id = slot.id.clone();
        self.slots.register_slot(slot)?;
        self.slot_statuses.insert(id, ModelStatus::NotLoaded);
        Ok(())
    }

    /// Register multiple slots.
    pub fn register_slots(&mut self, slots: Vec<Slot>) -> Result<(), LoaderError> {
        for slot in slots {
            self.register_slot(slot)?;
        }
        Ok(())
    }

    /// Get a slot by ID.
    #[must_use]
    pub fn get_slot(&self, id: &str) -> Option<&Slot> {
        self.slots.get_slot(id)
    }

    /// List all registered slots.
    #[must_use]
    pub fn list_slots(&self) -> Vec<&Slot> {
        self.slots.list_slots()
    }

    /// List slots by subsystem.
    #[must_use]
    pub fn list_slots_by_subsystem(&self, subsystem: &str) -> Vec<&Slot> {
        self.slots.list_slots_by_subsystem(subsystem)
    }

    // ── Registry ───────────────────────────────────────────────

    /// Scan the models directory for GGUF files. Emits discovery events.
    pub fn scan_models(&mut self) -> anyhow::Result<Vec<ModelRegistryEntry>> {
        self.events.emit(LoaderEvent::RegistryScanStarted);

        let entries = discovery::discover_models(&self.models_dir)?;
        for entry in &entries {
            self.events
                .emit(LoaderEvent::ModelDiscovered(entry.clone()));
        }

        let count = entries.len();
        self.registry = entries.clone();

        self.events
            .emit(LoaderEvent::RegistryScanComplete { models_found: count });

        tracing::info!(count, path = %self.models_dir.display(), "Model scan complete");
        Ok(entries)
    }

    /// Get the current model registry.
    #[must_use]
    pub fn get_registry(&self) -> &[ModelRegistryEntry] {
        &self.registry
    }

    /// Filter registry to models compatible with a specific capability.
    #[must_use]
    pub fn models_for_capability(&self, cap: ModelCapability) -> Vec<&ModelRegistryEntry> {
        self.registry
            .iter()
            .filter(|e| e.compatible_capabilities.contains(&cap))
            .collect()
    }

    // ── Assignment ─────────────────────────────────────────────

    /// Assign a model to a slot. Validates compatibility and persists.
    pub fn assign_model(
        &mut self,
        slot_id: &str,
        model_id: &str,
    ) -> Result<(), LoaderError> {
        // Verify slot exists
        let slot = self.slots.get_slot(slot_id).ok_or(LoaderError::SlotNotFound {
            slot_id: slot_id.to_string(),
        })?;

        // Verify model exists in registry
        let entry = self
            .registry
            .iter()
            .find(|e| e.id == model_id)
            .ok_or(LoaderError::Internal {
                message: format!("Model '{model_id}' not found in registry"),
            })?;

        // Verify capability compatibility
        if !entry.compatible_capabilities.contains(&slot.capability) {
            return Err(LoaderError::IncompatibleModel {
                model_id: model_id.to_string(),
                capability: slot.capability.to_string(),
            });
        }

        // Persist assignment
        let config_key = format!("slot.{slot_id}.model");
        self.config
            .set(&config_key, model_id)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist assignment: {e}"),
            })?;

        // Update in-memory slot state
        if let Some(s) = self.slots.get_slot_mut(slot_id) {
            s.assigned_model = Some(model_id.to_string());
        }

        self.events.emit(LoaderEvent::SlotAssigned {
            slot_id: slot_id.to_string(),
            model_id: model_id.to_string(),
        });

        tracing::info!(slot = %slot_id, model = %model_id, "Model assigned to slot");
        Ok(())
    }

    /// Remove model assignment from a slot.
    pub fn unassign_slot(&mut self, slot_id: &str) -> Result<(), LoaderError> {
        if !self.slots.contains(slot_id) {
            return Err(LoaderError::SlotNotFound {
                slot_id: slot_id.to_string(),
            });
        }

        let config_key = format!("slot.{slot_id}.model");
        self.config
            .delete(&config_key)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to delete assignment: {e}"),
            })?;

        if let Some(s) = self.slots.get_slot_mut(slot_id) {
            s.assigned_model = None;
        }

        self.events.emit(LoaderEvent::SlotUnassigned {
            slot_id: slot_id.to_string(),
        });

        Ok(())
    }

    /// Get the assigned model for a slot.
    #[must_use]
    pub fn get_assignment(&self, slot_id: &str) -> Option<&ModelRegistryEntry> {
        let slot = self.slots.get_slot(slot_id)?;
        let model_id = slot.assigned_model.as_ref()?;
        self.registry.iter().find(|e| &e.id == model_id)
    }

    /// Restore slot assignments from persisted config.
    pub fn restore_assignments(&mut self) -> anyhow::Result<()> {
        let persisted = self.config.list_by_prefix("slot.")?;

        for (key, model_id) in persisted {
            // key format: slot.{slot_id}.model
            if !key.ends_with(".model") {
                continue;
            }
            let slot_id = key
                .strip_prefix("slot.")
                .and_then(|s| s.strip_suffix(".model"))
                .unwrap_or_default();

            if let Some(slot) = self.slots.get_slot_mut(slot_id) {
                // Verify model file still exists
                let exists = self.registry.iter().any(|e| e.id == model_id);
                if exists {
                    slot.assigned_model = Some(model_id);
                    tracing::info!(slot = %slot_id, "Restored model assignment");
                } else {
                    tracing::warn!(
                        slot = %slot_id,
                        model = %model_id,
                        "Assigned model no longer in registry — clearing"
                    );
                    let _ = self.config.delete(&key);
                }
            }
        }

        Ok(())
    }

    // ── Loading (Phase 4+) ─────────────────────────────────────

    /// Load the model assigned to a slot. Phase 4 implements the real backend.
    pub fn load_slot(&mut self, slot_id: &str) -> Result<(), LoaderError> {
        if !self.slots.contains(slot_id) {
            return Err(LoaderError::SlotNotFound {
                slot_id: slot_id.to_string(),
            });
        }

        let slot = self.slots.get_slot(slot_id).unwrap();
        if slot.assigned_model.is_none() {
            return Err(LoaderError::NoModelAssigned {
                slot_id: slot_id.to_string(),
            });
        }

        // Phase 4: real Candle loading via BackendPool + flume bridge
        Err(LoaderError::Internal {
            message: format!("Inference loading not yet implemented (Phase 4) for slot '{slot_id}'"),
        })
    }

    /// Unload the model from a slot.
    pub fn unload_slot(&mut self, slot_id: &str) -> Result<(), LoaderError> {
        if !self.slots.contains(slot_id) {
            return Err(LoaderError::SlotNotFound {
                slot_id: slot_id.to_string(),
            });
        }

        // Phase 4: real unloading via BackendPool
        Err(LoaderError::Internal {
            message: format!(
                "Inference unloading not yet implemented (Phase 4) for slot '{slot_id}'"
            ),
        })
    }

    /// Get the current status of a slot.
    #[must_use]
    pub fn slot_status(&self, slot_id: &str) -> SlotStatus {
        let model_status = self
            .slot_statuses
            .get(slot_id)
            .cloned()
            .unwrap_or(ModelStatus::NotLoaded);

        // Resolve fallback
        let loaded_set: HashSet<String> = self
            .slot_statuses
            .iter()
            .filter(|(_, s)| matches!(s, ModelStatus::Loaded { .. }))
            .map(|(id, _)| id.clone())
            .collect();

        let active_fallback = if !matches!(model_status, ModelStatus::Loaded { .. }) {
            fallback::resolve_fallback(&self.slots, slot_id, &loaded_set)
                .filter(|fb| fb != slot_id)
        } else {
            None
        };

        SlotStatus {
            slot_id: slot_id.to_string(),
            model_status,
            active_fallback,
            shared_with: Vec::new(), // Phase 4: populated by BackendPool
        }
    }

    // ── Hardware ───────────────────────────────────────────────

    /// Collect current hardware metrics.
    #[must_use]
    pub fn hardware_metrics(&self) -> HardwareMetrics {
        metrics::collect_hardware()
    }

    /// Compute VRAM budget plan for all slots.
    #[must_use]
    pub fn vram_budget_plan(&self) -> vram::VramBudget {
        let hw = self.hardware_metrics();
        let slot_data: Vec<(String, Option<String>, u64, ModelStatus)> = self
            .slots
            .list_slots()
            .iter()
            .map(|s| {
                let vram_est = s
                    .assigned_model
                    .as_ref()
                    .and_then(|mid| self.registry.iter().find(|e| &e.id == mid))
                    .map(|e| e.vram_estimate_mb)
                    .unwrap_or(0);

                let status = self
                    .slot_statuses
                    .get(&s.id)
                    .cloned()
                    .unwrap_or(ModelStatus::NotLoaded);

                (s.id.clone(), s.assigned_model.clone(), vram_est, status)
            })
            .collect();

        vram::compute_budget(
            &slot_data,
            hw.total_vram_mb(),
            hw.gpu_vram_used_mb.unwrap_or(0),
        )
    }

    /// Auto-configure based on detected hardware.
    #[must_use]
    pub fn auto_configure(&self) -> AutoConfig {
        let hw = self.hardware_metrics();
        let downloaded: HashSet<String> = self
            .registry
            .iter()
            .map(|e| e.filename.clone())
            .collect();
        auto_config::auto_configure(&hw, &downloaded)
    }

    /// Check if this is the first run (no slot assignments exist).
    pub fn is_first_run(&self) -> bool {
        self.config
            .list_by_prefix("slot.")
            .map(|v| v.is_empty())
            .unwrap_or(true)
    }

    // ── Download (Phase 5) ─────────────────────────────────────

    /// Download a model from HuggingFace. Phase 5 implements real download.
    pub fn download_model(
        &self,
        _repo_id: &str,
        _filename: &str,
    ) -> Result<String, LoaderError> {
        Err(LoaderError::Internal {
            message: "Download not yet implemented (Phase 5)".to_string(),
        })
    }

    /// Cancel an active download. Phase 5.
    pub fn cancel_download(&self, _download_id: &str) -> Result<(), LoaderError> {
        Err(LoaderError::Internal {
            message: "Download cancel not yet implemented (Phase 5)".to_string(),
        })
    }
}
