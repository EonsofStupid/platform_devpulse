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
use crate::loading::swap::SwapGuard;
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
    /// Tracks slots mid-swap to block inference during transitions.
    swap_guard: SwapGuard,
}

impl ModelLoaderService {
    /// Create a new service instance.
    ///
    /// `models_dir` is where GGUF/SafeTensors files live (e.g. `~/.devpulse/models/`).
    /// `subdirs` defines the subdirectory names for model discovery (e.g. `["chat", "voice", "rag", "vision"]`).
    pub fn new(
        config: Box<dyn ConfigBackend>,
        events: Arc<dyn LoaderEventSink>,
        models_dir: PathBuf,
        subdirs: Vec<String>,
    ) -> anyhow::Result<Self> {
        // Ensure models directory exists — organized by purpose
        if !models_dir.exists() {
            for subdir in &subdirs {
                std::fs::create_dir_all(models_dir.join(subdir))?;
                tracing::info!(
                    path = %models_dir.join(subdir).display(),
                    "Created models/{subdir}/ directory"
                );
            }
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
            swap_guard: SwapGuard::new(),
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

        // Budget check: will this model fit alongside everything currently loaded?
        // Uses 10% headroom to avoid OOM at the boundary.
        let metrics = self.hardware.cached();
        let total_vram = metrics.gpu_vram_total_mb.unwrap_or(0);
        if total_vram > 0 {
            let pool_used = self.pool.total_memory().vram_mb();
            let model_vram = entry.vram_estimate_mb;
            let headroom = total_vram / 10; // 10% headroom
            let available = total_vram.saturating_sub(pool_used + headroom);

            if model_vram > available {
                // Check if this model is already loaded (shared instance — no new VRAM)
                if !self.pool.is_loaded(model_id) {
                    let mut suggestions = Vec::new();
                    // Suggest unloading the largest loaded model
                    for loaded_id in self.pool.loaded_model_ids() {
                        if let Some(mem) = self.pool.memory(&loaded_id) {
                            suggestions.push(crate::traits::errors::RecoverySuggestion::UnloadSlot {
                                slot_id: loaded_id.clone(),
                                frees_mb: mem.vram_mb(),
                            });
                        }
                    }
                    return Err(LoaderError::VramInsufficient {
                        needed_mb: model_vram,
                        available_mb: available,
                        suggestions,
                    });
                }
            }
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
    ///
    /// Retries release twice (500ms between attempts) then hard fails.
    /// No silent swallowing — every failure is logged and propagated.
    pub async fn unload_slot(&mut self, slot_id: &str) -> Result<(), LoaderError> {
        if !self.slots.contains(slot_id) {
            return Err(LoaderError::SlotNotFound {
                slot_id: slot_id.to_string(),
            });
        }

        self.slot_statuses
            .insert(slot_id.to_string(), ModelStatus::Unloading);

        // Remove our handle
        self.slot_handles.remove(slot_id);

        // Find which model this slot was using
        let model_id = self
            .slots
            .get_slot(slot_id)
            .and_then(|s| s.assigned_model.clone());

        if let Some(mid) = model_id {
            // Retry release twice then hard fail
            let mut last_error = None;
            for attempt in 1..=2 {
                match self.pool.release(&mid).await {
                    Some(freed) => {
                        self.events.emit(LoaderEvent::UnloadComplete {
                            slot_id: slot_id.to_string(),
                            freed,
                        });
                        tracing::info!(slot = %slot_id, model = %mid, "Model unloaded (last reference)");
                        self.slot_statuses
                            .insert(slot_id.to_string(), ModelStatus::NotLoaded);
                        return Ok(());
                    }
                    None => {
                        // release() returns None if ref_count > 0 (shared) OR model not found.
                        // If the model is shared, this is normal — handle was removed, job done.
                        if self.pool.is_loaded(&mid) {
                            tracing::info!(slot = %slot_id, model = %mid, "Slot handle released (shared instance still active)");
                            self.slot_statuses
                                .insert(slot_id.to_string(), ModelStatus::NotLoaded);
                            return Ok(());
                        }
                        // Model not in pool — shouldn't happen. Retry.
                        last_error = Some(format!(
                            "Attempt {attempt}/2: model '{mid}' not found in pool during unload of slot '{slot_id}'"
                        ));
                        tracing::warn!(slot = %slot_id, model = %mid, attempt, "Unload retry — model not in pool");
                        if attempt < 2 {
                            std::thread::sleep(std::time::Duration::from_millis(500));
                        }
                    }
                }
            }

            // Hard fail after 2 retries
            let error_msg = last_error.unwrap_or_else(|| format!("Unload failed for slot '{slot_id}'"));
            tracing::error!(slot = %slot_id, model = %mid, "{error_msg}");
            self.slot_statuses.insert(
                slot_id.to_string(),
                ModelStatus::Failed {
                    error: error_msg.clone(),
                },
            );
            return Err(LoaderError::Internal { message: error_msg });
        }

        self.slot_statuses
            .insert(slot_id.to_string(), ModelStatus::NotLoaded);

        Ok(())
    }

    /// Find all slots that are coupled to a parent slot.
    fn coupled_children(&self, parent_id: &str) -> Vec<String> {
        self.slots
            .list_slots()
            .into_iter()
            .filter(|s| {
                matches!(
                    &s.loading,
                    crate::slots::types::LoadingStrategy::Coupled { parent }
                        if parent == parent_id
                )
            })
            .map(|s| s.id.clone())
            .collect()
    }

    /// Load a slot and all its coupled children.
    ///
    /// 1. Load required slots first (`requires` field)
    /// 2. Load the requested slot
    /// 3. Load any slots with `Coupled { parent: slot_id }`
    pub async fn load_slot_with_deps(&mut self, slot_id: &str) -> Result<(), LoaderError> {
        let slot = self.slots.get_slot(slot_id).ok_or(LoaderError::SlotNotFound {
            slot_id: slot_id.to_string(),
        })?;

        // Load required dependencies first
        let requires = slot.requires.clone();
        for req_id in &requires {
            if !self.is_slot_loaded(req_id) {
                tracing::info!(slot = %slot_id, requires = %req_id, "Loading required dependency");
                // Use load_slot directly — don't recurse deps of deps (one level)
                self.load_slot(req_id).await?;
            }
        }

        // Load the slot itself
        self.load_slot(slot_id).await?;

        // Load coupled children
        let children = self.coupled_children(slot_id);
        for child_id in &children {
            if !self.is_slot_loaded(child_id) {
                tracing::info!(slot = %slot_id, coupled = %child_id, "Loading coupled child");
                self.load_slot(child_id).await?;
            }
        }

        Ok(())
    }

    /// Unload a slot and all its coupled children.
    ///
    /// Children unload first, then parent.
    pub async fn unload_slot_with_deps(&mut self, slot_id: &str) -> Result<(), LoaderError> {
        // Unload coupled children first
        let children = self.coupled_children(slot_id);
        for child_id in &children {
            if self.is_slot_loaded(child_id) {
                tracing::info!(slot = %slot_id, coupled = %child_id, "Unloading coupled child");
                self.unload_slot(child_id).await?;
            }
        }

        // Unload the slot itself
        self.unload_slot(slot_id).await
    }

    /// Check if a slot is currently loaded.
    #[must_use]
    pub fn is_slot_loaded(&self, slot_id: &str) -> bool {
        matches!(
            self.slot_statuses.get(slot_id),
            Some(ModelStatus::Loaded { .. })
        )
    }

    /// Get an inference handle for a slot, resolving fallback chain.
    ///
    /// Returns `Err(SlotSwapping)` if the slot is mid-swap. Returns `Ok(None)`
    /// if no model is loaded and no fallback is available.
    pub fn inference_handle(&self, slot_id: &str) -> Result<Option<InferenceHandle>, LoaderError> {
        // Block inference during swap — clean error, not a missing model
        if self.swap_guard.is_swapping(slot_id) {
            return Err(LoaderError::SlotSwapping {
                slot_id: slot_id.to_string(),
            });
        }

        // Direct handle
        if let Some(h) = self.slot_handles.get(slot_id) {
            return Ok(Some(h.clone()));
        }

        // Try fallback chain
        let loaded_set: HashSet<String> = self.slot_handles.keys().cloned().collect();
        if let Some(fallback_id) = fallback::resolve_fallback(&self.slots, slot_id, &loaded_set) {
            return Ok(self.slot_handles.get(&fallback_id).cloned());
        }

        Ok(None)
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

    // ── Swap (atomic unload → reassign → load) ─────────────────

    /// Atomically swap the model assigned to a slot.
    ///
    /// If the slot is currently loaded, unloads first. Then reassigns and loads
    /// the new model. The swap guard blocks inference to this slot for the entire
    /// duration — callers get `LoaderError::SlotSwapping` instead of a crash.
    ///
    /// On failure, the slot is left in an unloaded/failed state. We do NOT
    /// attempt to reload the old model — that's a different failure mode the
    /// user should handle explicitly.
    pub async fn swap_model(
        &mut self,
        slot_id: &str,
        new_model_id: &str,
    ) -> Result<(), LoaderError> {
        // Validate slot exists
        let slot = self.slots.get_slot(slot_id).ok_or(LoaderError::SlotNotFound {
            slot_id: slot_id.to_string(),
        })?;

        let old_model_id = slot.assigned_model.clone();

        // Don't swap to the same model
        if old_model_id.as_deref() == Some(new_model_id) {
            tracing::debug!(slot = %slot_id, model = %new_model_id, "Swap skipped — same model");
            return Ok(());
        }

        // Validate new model exists and is compatible (same check as assign_model)
        let entry = self
            .registry
            .get(new_model_id)
            .ok_or(LoaderError::Internal {
                message: format!("Model '{new_model_id}' not found in registry"),
            })?;

        if !entry.compatible_capabilities.contains(&slot.capability) {
            return Err(LoaderError::IncompatibleModel {
                model_id: new_model_id.to_string(),
                capability: slot.capability.to_string(),
            });
        }

        // Begin swap — block inference to this slot
        self.swap_guard.begin(slot_id);

        self.events.emit(LoaderEvent::SwapStarted {
            slot_id: slot_id.to_string(),
            from_model: old_model_id.clone(),
            to_model: new_model_id.to_string(),
        });

        tracing::info!(
            slot = %slot_id,
            from = ?old_model_id,
            to = %new_model_id,
            "Swap started"
        );

        // Step 1: Unload if currently loaded
        if self.is_slot_loaded(slot_id) {
            if let Err(e) = self.unload_slot(slot_id).await {
                let error_msg = format!("Swap failed during unload: {e}");
                self.swap_guard.end(slot_id);
                self.events.emit(LoaderEvent::SwapFailed {
                    slot_id: slot_id.to_string(),
                    error: error_msg.clone(),
                });
                return Err(LoaderError::Internal { message: error_msg });
            }
        }

        // Step 2: Reassign
        if let Err(e) = self.assign_model(slot_id, new_model_id) {
            let error_msg = format!("Swap failed during assignment: {e}");
            self.swap_guard.end(slot_id);
            self.events.emit(LoaderEvent::SwapFailed {
                slot_id: slot_id.to_string(),
                error: error_msg.clone(),
            });
            return Err(LoaderError::Internal { message: error_msg });
        }

        // Step 3: Load the new model
        if let Err(e) = self.load_slot(slot_id).await {
            let error_msg = format!("Swap failed during load: {e}");
            self.swap_guard.end(slot_id);
            self.events.emit(LoaderEvent::SwapFailed {
                slot_id: slot_id.to_string(),
                error: error_msg.clone(),
            });
            return Err(LoaderError::Internal { message: error_msg });
        }

        // Done — release the guard
        self.swap_guard.end(slot_id);

        self.events.emit(LoaderEvent::SwapComplete {
            slot_id: slot_id.to_string(),
            model_id: new_model_id.to_string(),
        });

        tracing::info!(slot = %slot_id, model = %new_model_id, "Swap complete");
        Ok(())
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

    // ── Search (HuggingFace) ──────────────────────────────────────

    /// Search HuggingFace for GGUF models.
    pub async fn search_huggingface(
        &self,
        query: &str,
        limit: u32,
    ) -> anyhow::Result<Vec<crate::models::search::HfSearchResult>> {
        crate::models::search::search_huggingface(query, limit).await
    }
}
