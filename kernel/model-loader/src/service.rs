//! `ModelLoaderService` — the top-level API for model management.
//!
//! Consumers create this, register slots, and call methods.
//! All DevPulse-specific behavior lives in trait implementations (ConfigBackend,
//! LoaderEventSink) — this struct knows nothing about Tauri, libSQL, or Clyffy.

use crate::backends::bridge::InferenceHandle;
use crate::backends::BackendPool;
use crate::models::download::DownloadManager;
use crate::hardware::auto_config::{self, AutoConfig};
use crate::hardware::metrics::{HardwareMetrics, HardwareMonitor};
use crate::hardware::vram;
use crate::loading::states::{LoadParams, ModelStatus, SlotStatus};
use crate::models::registry::{ModelRegistry, ModelRegistryEntry};
use crate::slots::fallback;
use crate::slots::registry::SlotRegistry;
use crate::slots::types::{ModelCapability, Slot};
use crate::traits::config::ConfigBackend;
use crate::traits::errors::LoaderError;
use crate::traits::events::{LoaderEvent, LoaderEventSink};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::Arc;

/// The main entry point. Consumers create this, register slots, and go.
pub struct ModelLoaderService {
    config: Box<dyn ConfigBackend>,
    events: Arc<dyn LoaderEventSink>,
    slots: SlotRegistry,
    registry: ModelRegistry,
    models_dir: PathBuf,
    slot_statuses: HashMap<String, ModelStatus>,
    hardware: HardwareMonitor,
    pool: BackendPool,
    downloads: DownloadManager,
    /// slot_id → InferenceHandle (cloned from pool)
    slot_handles: HashMap<String, InferenceHandle>,
}

impl ModelLoaderService {
    /// Create a new service instance.
    ///
    /// `models_dir` is where GGUF/SafeTensors files live (e.g. `~/.devpulse/models/`).
    pub fn new(
        config: Box<dyn ConfigBackend>,
        events: Arc<dyn LoaderEventSink>,
        models_dir: PathBuf,
    ) -> anyhow::Result<Self> {
        // Ensure models directory exists
        if !models_dir.exists() {
            std::fs::create_dir_all(models_dir.join("gguf"))?;
            std::fs::create_dir_all(models_dir.join("safetensors"))?;
            tracing::info!(path = %models_dir.display(), "Created models directory");
        }

        // Try loading existing registry, fall back to empty
        let registry = ModelRegistry::load(models_dir.clone()).unwrap_or_else(|e| {
            tracing::warn!(error = %e, "Failed to load model registry — starting fresh");
            ModelRegistry::new(models_dir.clone())
        });

        let downloads = DownloadManager::new(models_dir.clone());

        Ok(Self {
            config,
            events,
            slots: SlotRegistry::new(),
            registry,
            models_dir,
            slot_statuses: HashMap::new(),
            hardware: HardwareMonitor::new(),
            pool: BackendPool::new(),
            downloads,
            slot_handles: HashMap::new(),
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

        let count = self.registry.scan()?;

        for entry in self.registry.all() {
            self.events
                .emit(LoaderEvent::ModelDiscovered(entry.clone()));
        }

        self.events
            .emit(LoaderEvent::RegistryScanComplete { models_found: count });

        tracing::info!(count, path = %self.models_dir.display(), "Model scan complete");
        Ok(self.registry.all().to_vec())
    }

    /// Get the current model registry.
    #[must_use]
    pub fn get_registry(&self) -> &[ModelRegistryEntry] {
        self.registry.all()
    }

    /// Filter registry to models compatible with a specific capability.
    #[must_use]
    pub fn models_for_capability(&self, cap: ModelCapability) -> Vec<&ModelRegistryEntry> {
        self.registry.compatible_with_capability(cap)
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
            .get(model_id)
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
        self.registry.get(model_id)
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
                let exists = self.registry.get(&model_id).is_some();
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

    /// Load the model assigned to a slot.
    ///
    /// Uses the `BackendPool` — if another slot already loaded the same model,
    /// this slot gets a shared handle (ref count bumped, no duplicate load).
    #[cfg(feature = "candle-backend")]
    pub async fn load_slot(&mut self, slot_id: &str) -> Result<(), LoaderError> {
        if !self.slots.contains(slot_id) {
            return Err(LoaderError::SlotNotFound {
                slot_id: slot_id.to_string(),
            });
        }

        let slot = self.slots.get_slot(slot_id).ok_or(LoaderError::SlotNotFound {
            slot_id: slot_id.to_string(),
        })?;

        let model_id = slot.assigned_model.clone().ok_or(LoaderError::NoModelAssigned {
            slot_id: slot_id.to_string(),
        })?;

        // Check if already loading
        if matches!(
            self.slot_statuses.get(slot_id),
            Some(ModelStatus::Loading { .. })
        ) {
            return Err(LoaderError::AlreadyLoading {
                slot_id: slot_id.to_string(),
            });
        }

        // Get model entry from registry
        let entry = self.registry.get(&model_id).ok_or(LoaderError::ModelFileMissing {
            path: std::path::PathBuf::new(),
            slot_id: Some(slot_id.to_string()),
            can_redownload: false,
        })?;

        // Verify file exists
        if !entry.path.exists() {
            return Err(LoaderError::ModelFileMissing {
                path: entry.path.clone(),
                slot_id: Some(slot_id.to_string()),
                can_redownload: matches!(entry.source, crate::models::registry::ModelSource::HuggingFace { .. }),
            });
        }

        let model_path = entry.path.clone();
        let device_str = match slot.preferred_device {
            crate::slots::types::DevicePreference::Gpu => "cuda:0".to_string(),
            crate::slots::types::DevicePreference::Cpu => "cpu".to_string(),
            crate::slots::types::DevicePreference::GpuWithCpuFallback => {
                if self.hardware.cached().has_gpu() {
                    "cuda:0".to_string()
                } else {
                    "cpu".to_string()
                }
            }
            crate::slots::types::DevicePreference::Any => {
                if self.hardware.cached().has_gpu() {
                    "cuda:0".to_string()
                } else {
                    "cpu".to_string()
                }
            }
        };

        // Emit loading started
        self.slot_statuses.insert(
            slot_id.to_string(),
            ModelStatus::Loading {
                stage: crate::loading::states::LoadingStage::Allocating,
                progress_pct: 10.0,
            },
        );
        self.events.emit(LoaderEvent::LoadingStarted {
            slot_id: slot_id.to_string(),
            model_id: model_id.clone(),
        });

        // Switch to fast polling during load
        self.hardware.enter_loading_mode();

        let params = LoadParams {
            device: device_str,
            context_length: entry.context_length,
            gpu_layers: None,
        };

        // Acquire from pool (handles shared instances automatically)
        match self.pool.acquire(&model_id, &model_path, params).await {
            Ok((handle, memory)) => {
                self.slot_handles.insert(slot_id.to_string(), handle);
                self.slot_statuses.insert(
                    slot_id.to_string(),
                    ModelStatus::Loaded { footprint: memory },
                );
                self.events.emit(LoaderEvent::LoadingComplete {
                    slot_id: slot_id.to_string(),
                    memory,
                });
                self.hardware.enter_normal_mode();

                tracing::info!(
                    slot = %slot_id,
                    model = %model_id,
                    ram_mb = memory.ram_mb(),
                    vram_mb = memory.vram_mb(),
                    "Slot loaded successfully"
                );
                Ok(())
            }
            Err(e) => {
                let error_msg = e.to_string();
                self.slot_statuses.insert(
                    slot_id.to_string(),
                    ModelStatus::Failed {
                        error: error_msg.clone(),
                    },
                );
                self.events.emit(LoaderEvent::LoadingFailed {
                    slot_id: slot_id.to_string(),
                    error: error_msg.clone(),
                });
                self.hardware.enter_normal_mode();

                tracing::error!(slot = %slot_id, error = %error_msg, "Slot loading failed");
                Err(LoaderError::Internal { message: error_msg })
            }
        }
    }

    /// Load slot — no-op when candle feature disabled.
    #[cfg(not(feature = "candle-backend"))]
    pub async fn load_slot(&mut self, slot_id: &str) -> Result<(), LoaderError> {
        Err(LoaderError::Internal {
            message: format!("Candle backend not compiled — cannot load slot '{slot_id}'"),
        })
    }

    /// Unload the model from a slot.
    pub async fn unload_slot(&mut self, slot_id: &str) -> Result<(), LoaderError> {
        if !self.slots.contains(slot_id) {
            return Err(LoaderError::SlotNotFound {
                slot_id: slot_id.to_string(),
            });
        }

        // Remove our handle
        self.slot_handles.remove(slot_id);

        // Find which model this slot was using
        let model_id = self
            .slots
            .get_slot(slot_id)
            .and_then(|s| s.assigned_model.clone());

        if let Some(mid) = model_id {
            // Release from pool — may unload if ref_count hits 0
            if let Some(freed) = self.pool.release(&mid).await {
                self.events.emit(LoaderEvent::UnloadComplete {
                    slot_id: slot_id.to_string(),
                    freed,
                });
                tracing::info!(slot = %slot_id, model = %mid, "Model unloaded (last reference)");
            } else {
                tracing::info!(slot = %slot_id, model = %mid, "Slot handle released (shared instance still active)");
            }
        }

        self.slot_statuses
            .insert(slot_id.to_string(), ModelStatus::NotLoaded);

        Ok(())
    }

    /// Get an inference handle for a slot, resolving fallback chain.
    #[must_use]
    pub fn inference_handle(&self, slot_id: &str) -> Option<InferenceHandle> {
        // Direct handle
        if let Some(h) = self.slot_handles.get(slot_id) {
            return Some(h.clone());
        }

        // Try fallback chain
        let loaded_set: HashSet<String> = self.slot_handles.keys().cloned().collect();
        if let Some(fallback_id) = fallback::resolve_fallback(&self.slots, slot_id, &loaded_set) {
            return self.slot_handles.get(&fallback_id).cloned();
        }

        None
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

    /// Get current hardware metrics. Uses cached value if within poll interval.
    pub fn hardware_metrics(&mut self) -> HardwareMetrics {
        self.hardware.metrics().clone()
    }

    /// Force a fresh hardware metrics collection regardless of cache age.
    pub fn hardware_metrics_fresh(&mut self) -> HardwareMetrics {
        self.hardware.refresh().clone()
    }

    /// Get the hardware monitor for direct access (polling mode changes, etc.).
    pub fn hardware_monitor(&mut self) -> &mut HardwareMonitor {
        &mut self.hardware
    }

    /// Compute VRAM budget plan for all slots.
    pub fn vram_budget_plan(&mut self) -> vram::VramBudget {
        let hw = self.hardware.metrics().clone();
        let slot_data: Vec<(String, Option<String>, u64, ModelStatus)> = self
            .slots
            .list_slots()
            .iter()
            .map(|s| {
                let vram_est = s
                    .assigned_model
                    .as_ref()
                    .and_then(|mid| self.registry.get(mid))
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
    pub fn auto_configure(&mut self) -> AutoConfig {
        let hw = self.hardware.metrics().clone();
        let downloaded = self.registry.filenames();
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

    /// Download a model from HuggingFace. Returns the download ID.
    #[cfg(feature = "candle-backend")]
    pub fn download_model(
        &mut self,
        repo_id: &str,
        filename: &str,
    ) -> Result<String, LoaderError> {
        let handle = self
            .downloads
            .start_download(repo_id, filename, &self.events)
            .map_err(|e| LoaderError::DownloadFailed {
                reason: e.to_string(),
                can_retry: true,
                bytes_completed: 0,
            })?;

        let id = handle.id.clone();
        tracing::info!(repo = %repo_id, file = %filename, download_id = %id, "Download started");
        Ok(id)
    }

    /// Download not available without candle feature.
    #[cfg(not(feature = "candle-backend"))]
    pub fn download_model(
        &mut self,
        _repo_id: &str,
        _filename: &str,
    ) -> Result<String, LoaderError> {
        Err(LoaderError::Internal {
            message: "Download requires candle-backend feature".to_string(),
        })
    }

    /// Cancel an active download.
    pub fn cancel_download(&mut self, download_id: &str) -> Result<(), LoaderError> {
        self.downloads
            .cancel(download_id)
            .map_err(|e| LoaderError::Internal {
                message: e.to_string(),
            })
    }
}
