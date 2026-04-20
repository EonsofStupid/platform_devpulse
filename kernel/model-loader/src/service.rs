//! `ModelLoaderService` — the top-level API for model management.
//!
//! # Concurrency: fine-grained interior locks
//!
//! Four sub-structs, each with its own lock. Only the inference state
//! (GPU/CPU weight loading) ever takes an exclusive lock during heavy
//! operations. Everything else (scan, assign, config, hardware reads)
//! proceeds concurrently without blocking.
//!
//! | Group | Lock | Write when |
//! |-------|------|------------|
//! | `InferenceState` | `tokio::sync::RwLock` | load/unload/warm/swap |
//! | `RegistryState` | `tokio::sync::RwLock` | scan |
//! | `ConfigState` | `tokio::sync::RwLock` | assign/config changes |
//! | `BootState` | none (`Arc`) | never (immutable after boot) |
//! | `HardwareMonitor` | `parking_lot::RwLock` | refresh (sub-ms) |
//!
//! Lock ordering (deadlock prevention): config → registry → inference → hardware.
//!
//! Consumers implement [`traits::ConfigBackend`] and [`traits::LoaderEventSink`]
//! to wire into their own persistence and event systems.

use crate::backends::bridge::InferenceHandle;
use crate::backends::router::select_backend;
use crate::backends::voice_pool::VoicePool;
use crate::backends::BackendPool;
use crate::assistant::{AssistantConfig, KeywordActionEntry, VoiceCloneEntry};
use crate::models::download::DownloadManager;
use crate::models::registry::BackendType;
use crate::models::secrets::Secrets;
use crate::hardware::auto_config::{self, AutoConfig};
use crate::hardware::metrics::{HardwareMetrics, HardwareMonitor};
use crate::hardware::vram;
use crate::loading::states::{LoadParams, LoadingStage, MemoryFootprint, ModelStatus, SlotStatus};
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
use tokio::sync::RwLock;

// ── Sub-structs ──────────────────────────────────────────────────

/// Inference state — exclusive lock only during load/unload/warm/swap.
pub(crate) struct InferenceState {
    pub(crate) pool: BackendPool,
    pub(crate) voice_pool: VoicePool,
    pub(crate) slot_handles: HashMap<String, InferenceHandle>,
    pub(crate) swap_guard: SwapGuard,
    pub(crate) slot_statuses: HashMap<String, ModelStatus>,
}

/// Model registry — exclusive lock only during scan.
pub(crate) struct RegistryState {
    pub(crate) registry: ModelRegistry,
}

/// Slots + config + assistant + secrets + downloads.
pub(crate) struct ConfigState {
    pub(crate) slots: SlotRegistry,
    pub(crate) config: Box<dyn ConfigBackend>,
    pub(crate) assistant: AssistantConfig,
    pub(crate) secrets: Secrets,
    pub(crate) downloads: DownloadManager,
    pub(crate) userdata_dir: PathBuf,
    pub(crate) has_assignments: bool,
    pub(crate) setup_complete: bool,
}

/// Read-only after boot — no lock needed.
pub(crate) struct BootState {
    pub(crate) models_dir: PathBuf,
    pub(crate) events: Arc<dyn LoaderEventSink>,
    pub(crate) presets: Vec<crate::hardware::presets::PresetBlueprint>,
}

// ── Service ──────────────────────────────────────────────────────

/// The main entry point. All fields are `Arc` — the service is `Clone`.
///
/// Lock ordering: `config` → `registry` → `inference` → `hardware`.
#[derive(Clone)]
pub struct ModelLoaderService {
    pub(crate) inference: Arc<RwLock<InferenceState>>,
    pub(crate) registry: Arc<RwLock<RegistryState>>,
    pub(crate) config: Arc<RwLock<ConfigState>>,
    pub(crate) boot: Arc<BootState>,
    pub(crate) hardware: Arc<parking_lot::RwLock<HardwareMonitor>>,
}

impl ModelLoaderService {
    fn refresh_cached_assignment_state(cfg: &mut ConfigState) {
        cfg.has_assignments = cfg
            .slots
            .list_slots()
            .iter()
            .any(|slot| slot.assigned_model.is_some());
    }

    /// Create a new service instance.
    ///
    /// `models_dir` is where GGUF/SafeTensors files live.
    /// `subdirs` defines subdirectory names for model discovery.
    /// `presets` is the cached preset catalog loaded at boot.
    pub fn new(
        config: Box<dyn ConfigBackend>,
        events: Arc<dyn LoaderEventSink>,
        models_dir: PathBuf,
        subdirs: Vec<String>,
        presets: Vec<crate::hardware::presets::PresetBlueprint>,
    ) -> anyhow::Result<Self> {
        if !models_dir.exists() {
            for subdir in &subdirs {
                std::fs::create_dir_all(models_dir.join(subdir))?;
                tracing::info!(
                    path = %models_dir.join(subdir).display(),
                    "Created models/{subdir}/ directory"
                );
            }
        }

        let registry = ModelRegistry::load(models_dir.clone()).unwrap_or_else(|e| {
            tracing::warn!(error = %e, "Failed to load model registry — starting fresh");
            ModelRegistry::new(models_dir.clone())
        });

        let mut downloads = DownloadManager::new(models_dir.clone());

        let secrets = Secrets::load(&models_dir).unwrap_or_else(|e| {
            tracing::warn!(error = %e, "Failed to load secrets — continuing without stored HF token");
            Secrets::default()
        });
        downloads.set_hf_token(secrets.hf_token().map(String::from));

        let userdata_dir = models_dir
            .parent()
            .map(std::path::Path::to_path_buf)
            .unwrap_or_else(|| models_dir.clone());
        let assistant = AssistantConfig::load(&userdata_dir).unwrap_or_else(|e| {
            tracing::warn!(
                target: "assistant",
                error = %e,
                "Failed to load assistant config — using embedded defaults"
            );
            AssistantConfig::load_default().unwrap_or_default()
        });
        let has_assignments = config
            .list_by_prefix("slot.")
            .map(|entries| entries.iter().any(|(key, _)| key.ends_with(".model")))
            .unwrap_or_else(|e| {
                tracing::warn!(error = %e, "Failed to preload slot assignment state");
                false
            });
        let setup_complete = config
            .get("setup_complete")
            .map(|value| value.as_deref() == Some("true"))
            .unwrap_or_else(|e| {
                tracing::warn!(error = %e, "Failed to preload setup completion state");
                false
            });

        Ok(Self {
            inference: Arc::new(RwLock::new(InferenceState {
                pool: BackendPool::new(),
                voice_pool: VoicePool::new(),
                slot_handles: HashMap::new(),
                swap_guard: SwapGuard::new(),
                slot_statuses: HashMap::new(),
            })),
            registry: Arc::new(RwLock::new(RegistryState { registry })),
            config: Arc::new(RwLock::new(ConfigState {
                slots: SlotRegistry::new(),
                config,
                assistant,
                secrets,
                downloads,
                userdata_dir,
                has_assignments,
                setup_complete,
            })),
            boot: Arc::new(BootState {
                models_dir,
                events,
                presets,
            }),
            hardware: Arc::new(parking_lot::RwLock::new(HardwareMonitor::new())),
        })
    }

    // ── Slot registration (boot-time only) ────────────────────

    /// Register a single slot.
    pub async fn register_slot(&self, slot: Slot) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        cfg.slots.register_slot(slot)
    }

    /// Register multiple slots.
    pub async fn register_slots(&self, slots: Vec<Slot>) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        for slot in slots {
            cfg.slots.register_slot(slot)?;
        }
        Ok(())
    }

    // ── Read-only queries (no blocking, no contention) ────────

    /// List all registered slots.
    pub async fn list_slots(&self) -> Vec<Slot> {
        let cfg = self.config.read().await;
        cfg.slots.list_slots().into_iter().cloned().collect()
    }

    /// Get a slot by ID.
    pub async fn get_slot(&self, id: &str) -> Option<Slot> {
        let cfg = self.config.read().await;
        cfg.slots.get_slot(id).cloned()
    }

    /// List slots by subsystem.
    pub async fn list_slots_by_subsystem(&self, subsystem: &str) -> Vec<Slot> {
        let cfg = self.config.read().await;
        cfg.slots.list_slots_by_subsystem(subsystem).into_iter().cloned().collect()
    }

    /// Get the current model registry.
    pub async fn get_registry(&self) -> Vec<ModelRegistryEntry> {
        let reg = self.registry.read().await;
        reg.registry.all().to_vec()
    }

    /// Filter registry to models compatible with a specific capability.
    pub async fn models_for_capability(&self, cap: ModelCapability) -> Vec<ModelRegistryEntry> {
        let reg = self.registry.read().await;
        reg.registry.compatible_with_capability(cap).into_iter().cloned().collect()
    }

    /// Get the assigned model for a slot.
    pub async fn get_assignment(&self, slot_id: &str) -> Option<ModelRegistryEntry> {
        let cfg = self.config.read().await;
        let slot = cfg.slots.get_slot(slot_id)?;
        let model_id = slot.assigned_model.as_ref()?;
        let reg = self.registry.read().await;
        reg.registry.get(model_id).cloned()
    }

    /// Get hardware metrics — cached, sub-microsecond.
    pub fn hardware_metrics(&self) -> HardwareMetrics {
        self.hardware.read().cached().clone()
    }

    /// Force a fresh hardware metrics collection.
    pub fn hardware_refresh(&self) -> HardwareMetrics {
        self.hardware.write().refresh().clone()
    }

    /// Compute VRAM budget plan across all slots.
    pub async fn vram_budget_plan(&self) -> vram::VramBudget {
        let cfg = self.config.read().await;
        let reg = self.registry.read().await;
        let inf = self.inference.read().await;
        let hw = self.hardware.read();

        let slot_data: Vec<(String, Option<String>, u64, ModelStatus)> = cfg
            .slots
            .list_slots()
            .iter()
            .map(|s| {
                let vram_est = s
                    .assigned_model
                    .as_ref()
                    .and_then(|mid| reg.registry.get(mid))
                    .map(|e| e.vram_estimate_mb)
                    .unwrap_or(0);
                let status = inf
                    .slot_statuses
                    .get(&s.id)
                    .cloned()
                    .unwrap_or(ModelStatus::NotLoaded);
                (s.id.clone(), s.assigned_model.clone(), vram_est, status)
            })
            .collect();

        vram::compute_budget(
            &slot_data,
            hw.cached().total_vram_mb(),
            hw.cached().gpu_vram_used_mb.unwrap_or(0),
        )
    }

    /// Auto-configure based on detected hardware.
    pub fn auto_configure(&self) -> AutoConfig {
        let hw = self.hardware.read();
        let reg = self.registry.blocking_read();
        let downloaded = reg.registry.filenames();
        auto_config::auto_configure(hw.cached(), &downloaded, &self.boot.presets)
    }

    /// Return every known hardware preset.
    pub fn list_all_presets(&self) -> Vec<AutoConfig> {
        let reg = self.registry.blocking_read();
        let downloaded = reg.registry.filenames();
        auto_config::list_all_presets(&downloaded, &self.boot.presets)
    }

    /// Build the AutoConfig for a specific tier.
    pub fn config_for_tier(&self, tier: crate::hardware::HardwareTier) -> AutoConfig {
        let reg = self.registry.blocking_read();
        let downloaded = reg.registry.filenames();
        auto_config::config_for_tier(tier, &downloaded, &self.boot.presets)
    }

    /// Get the current slot status.
    pub async fn slot_status(&self, slot_id: &str) -> SlotStatus {
        let cfg = self.config.read().await;
        let inf = self.inference.read().await;

        let model_status = inf
            .slot_statuses
            .get(slot_id)
            .cloned()
            .unwrap_or(ModelStatus::NotLoaded);

        let loaded_set: HashSet<String> = inf
            .slot_statuses
            .iter()
            .filter(|(_, s)| matches!(s, ModelStatus::Loaded { .. }))
            .map(|(id, _)| id.clone())
            .collect();

        let active_fallback = if !matches!(model_status, ModelStatus::Loaded { .. }) {
            fallback::resolve_fallback(&cfg.slots, slot_id, &loaded_set)
                .filter(|fb| fb != slot_id)
        } else {
            None
        };

        SlotStatus {
            slot_id: slot_id.to_string(),
            model_status,
            active_fallback,
            shared_with: Vec::new(),
            last_inference_ms: None,
            avg_tokens_per_sec: None,
        }
    }

    /// Get an inference handle for a slot (resolves fallback chain).
    pub async fn inference_handle(&self, slot_id: &str) -> Result<Option<InferenceHandle>, LoaderError> {
        let inf = self.inference.read().await;
        let cfg = self.config.read().await;

        if inf.swap_guard.is_swapping(slot_id) {
            return Err(LoaderError::SlotSwapping {
                slot_id: slot_id.to_string(),
            });
        }

        if let Some(h) = inf.slot_handles.get(slot_id) {
            return Ok(Some(h.clone()));
        }

        let loaded_set: HashSet<String> = inf.slot_handles.keys().cloned().collect();
        if let Some(fallback_id) = fallback::resolve_fallback(&cfg.slots, slot_id, &loaded_set) {
            return Ok(inf.slot_handles.get(&fallback_id).cloned());
        }

        Ok(None)
    }

    /// Check if a slot is currently loaded.
    pub async fn is_slot_loaded(&self, slot_id: &str) -> bool {
        let inf = self.inference.read().await;
        matches!(
            inf.slot_statuses.get(slot_id),
            Some(ModelStatus::Loaded { .. })
        )
    }

    /// Check if this is the first run.
    pub async fn is_first_run(&self) -> bool {
        let cfg = self.config.read().await;
        !cfg.has_assignments
    }

    /// Mark the setup wizard as complete.
    pub async fn mark_setup_complete(&self) -> anyhow::Result<()> {
        let mut cfg = self.config.write().await;
        cfg.config.set("setup_complete", "true")?;
        cfg.setup_complete = true;
        Ok(())
    }

    /// Check if the setup wizard was previously completed.
    pub async fn is_setup_complete(&self) -> bool {
        let cfg = self.config.read().await;
        cfg.setup_complete
    }

    /// Snapshot the current assistant configuration.
    pub async fn get_assistant_config(&self) -> AssistantConfig {
        let cfg = self.config.read().await;
        cfg.assistant.clone()
    }

    /// Whether an HF token is currently stored.
    pub async fn has_hf_token(&self) -> bool {
        let cfg = self.config.read().await;
        cfg.secrets.has_hf_token()
    }

    /// Return the last `n` characters of the stored HF token.
    pub async fn hf_token_suffix(&self, n: usize) -> Option<String> {
        let cfg = self.config.read().await;
        cfg.secrets.hf_token().map(|t| {
            let chars: Vec<char> = t.chars().collect();
            let start = chars.len().saturating_sub(n);
            chars[start..].iter().collect()
        })
    }

    /// Voice custom directory.
    pub fn voice_custom_dir(&self) -> PathBuf {
        // userdata_dir is behind config lock but models_dir is boot state
        // voice custom is always {userdata}/voice/custom/ — derive from models_dir parent
        self.boot.models_dir
            .parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| self.boot.models_dir.clone())
            .join("voice")
            .join("custom")
    }

    // ── Registry write (scan) — only registry lock ────────────

    /// Scan the models directory. Only locks the registry.
    pub fn scan_models(&self) -> anyhow::Result<Vec<ModelRegistryEntry>> {
        self.boot.events.emit(LoaderEvent::RegistryScanStarted);

        let mut reg = self.registry.blocking_write();
        let count = reg.registry.scan()?;

        for entry in reg.registry.all() {
            self.boot.events.emit(LoaderEvent::ModelDiscovered(entry.clone()));
        }

        self.boot.events.emit(LoaderEvent::RegistryScanComplete { models_found: count });

        tracing::info!(count, path = %self.boot.models_dir.display(), "Model scan complete");
        Ok(reg.registry.all().to_vec())
    }

    // ── Config write — only config lock ───────────────────────

    /// Assign a model to a slot.
    #[tracing::instrument(skip(self), fields(slot_id, model_id))]
    pub async fn assign_model(
        &self,
        slot_id: &str,
        model_id: &str,
    ) -> Result<(), LoaderError> {
        // Phase 1: validate under read locks
        let reg = self.registry.read().await;
        let entry = reg.registry.get(model_id).ok_or(LoaderError::Internal {
            message: format!("Model '{model_id}' not found in registry"),
        })?;

        // Read slot capability for validation
        {
            let cfg = self.config.read().await;
            let slot = cfg.slots.get_slot(slot_id).ok_or(LoaderError::SlotNotFound {
                slot_id: slot_id.to_string(),
            })?;
            if !entry.compatible_capabilities.contains(&slot.capability) {
                return Err(LoaderError::IncompatibleModel {
                    model_id: model_id.to_string(),
                    capability: slot.capability.to_string(),
                });
            }
        }

        // Budget check (reads hardware + inference).
        // Extract total_vram from parking_lot guard BEFORE any await —
        // parking_lot guards are !Send and must not cross an await.
        let total_vram = {
            let hw = self.hardware.read();
            hw.cached().gpu_vram_total_mb.unwrap_or(0)
        };
        if total_vram > 0 {
            let inf = self.inference.read().await;
            let pool_used = inf.pool.total_memory().vram_mb();
            let model_vram = entry.vram_estimate_mb;
            let headroom = total_vram / 10;
            let available = total_vram.saturating_sub(pool_used + headroom);

            if model_vram > available && !inf.pool.is_loaded(model_id) {
                let mut suggestions = Vec::new();
                for loaded_id in inf.pool.loaded_model_ids() {
                    if let Some(mem) = inf.pool.memory(&loaded_id) {
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
        drop(reg);

        // Phase 2: write under config lock only
        let mut cfg = self.config.write().await;
        let config_key = format!("slot.{slot_id}.model");
        cfg.config
            .set(&config_key, model_id)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist assignment: {e}"),
            })?;

        if let Some(s) = cfg.slots.get_slot_mut(slot_id) {
            s.assigned_model = Some(model_id.to_string());
        }
        cfg.has_assignments = true;

        self.boot.events.emit(LoaderEvent::SlotAssigned {
            slot_id: slot_id.to_string(),
            model_id: model_id.to_string(),
        });

        tracing::info!(slot = %slot_id, model = %model_id, "Model assigned to slot");
        Ok(())
    }

    /// Remove model assignment from a slot.
    pub async fn unassign_slot(&self, slot_id: &str) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        if !cfg.slots.contains(slot_id) {
            return Err(LoaderError::SlotNotFound {
                slot_id: slot_id.to_string(),
            });
        }
        let config_key = format!("slot.{slot_id}.model");
        cfg.config
            .delete(&config_key)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to delete assignment: {e}"),
            })?;
        if let Some(s) = cfg.slots.get_slot_mut(slot_id) {
            s.assigned_model = None;
        }
        Self::refresh_cached_assignment_state(&mut cfg);
        self.boot.events.emit(LoaderEvent::SlotUnassigned {
            slot_id: slot_id.to_string(),
        });
        Ok(())
    }

    /// Restore slot assignments from persisted config.
    pub async fn restore_assignments(&self) -> anyhow::Result<()> {
        let mut cfg = self.config.write().await;
        let reg = self.registry.read().await;

        let persisted = cfg.config.list_by_prefix("slot.")?;
        for (key, model_id) in persisted {
            if !key.ends_with(".model") {
                continue;
            }
            let slot_id = key
                .strip_prefix("slot.")
                .and_then(|s| s.strip_suffix(".model"))
                .unwrap_or_default();

            if let Some(slot) = cfg.slots.get_slot_mut(slot_id) {
                match reg.registry.get(&model_id) {
                    None => {
                        tracing::warn!(slot = %slot_id, model = %model_id, "Stale assignment — clearing");
                        let _ = cfg.config.delete(&key);
                    }
                    Some(entry) => {
                        if entry.compatible_capabilities.contains(&slot.capability) {
                            slot.assigned_model = Some(model_id);
                            tracing::info!(slot = %slot_id, model = %entry.filename, "Restored assignment");
                        } else {
                            tracing::warn!(slot = %slot_id, model = %entry.filename, "Incompatible — clearing");
                            let _ = cfg.config.delete(&key);
                        }
                    }
                }
            }
        }

        Self::refresh_cached_assignment_state(&mut cfg);

        Ok(())
    }

    /// Auto-assign every slot whose `source_tier` is `Bundled`.
    pub async fn auto_assign_bundled_slots(&self) -> anyhow::Result<usize> {
        use crate::slots::ModelSourceTier;

        let mut cfg = self.config.write().await;
        let reg = self.registry.read().await;
        let mut hydrated = 0usize;

        let bundled: Vec<(String, String)> = cfg
            .slots
            .list_slots()
            .into_iter()
            .filter_map(|slot| {
                if slot.assigned_model.is_some() {
                    return None;
                }
                match &slot.source_tier {
                    ModelSourceTier::Bundled { bundled_path } => {
                        Some((slot.id.clone(), bundled_path.clone()))
                    }
                    ModelSourceTier::UserManaged => None,
                }
            })
            .collect();

        for (slot_id, bundled_path) in bundled {
            let filename = match std::path::Path::new(&bundled_path)
                .file_name()
                .and_then(|s| s.to_str())
            {
                Some(name) => name.to_string(),
                None => {
                    tracing::warn!(slot = %slot_id, path = %bundled_path, "No filename — skipping");
                    continue;
                }
            };

            let Some(entry) = reg.registry.get_by_filename(&filename) else {
                tracing::warn!(slot = %slot_id, bundled_path = %bundled_path, "Missing from registry — skipping");
                continue;
            };

            let model_id = entry.id.clone();
            if let Some(slot) = cfg.slots.get_slot_mut(&slot_id) {
                slot.assigned_model = Some(model_id.clone());
                tracing::info!(slot = %slot_id, model = %model_id, "Auto-assigned bundled model");
                let _ = cfg.config.set(&format!("slot.{slot_id}.model"), &model_id);
                hydrated += 1;
            }
        }

        Self::refresh_cached_assignment_state(&mut cfg);

        Ok(hydrated)
    }

    // ── Assistant config mutations — config lock only ──────────

    /// Rename the assistant.
    pub async fn set_assistant_name(&self, name: String) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.set_name(&dir, name).map_err(|e| LoaderError::Internal {
            message: format!("Failed to persist assistant name: {e}"),
        })
    }

    /// Replace the wake phrase.
    pub async fn set_wake_phrase(&self, phrase: String) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.set_wake_phrase(&dir, phrase).map_err(|e| LoaderError::Internal {
            message: format!("Failed to persist wake phrase: {e}"),
        })
    }

    /// Toggle 24/7 wake detection.
    pub async fn set_wake_enabled(&self, enabled: bool) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.set_wake_enabled(&dir, enabled).map_err(|e| LoaderError::Internal {
            message: format!("Failed to persist wake enabled: {e}"),
        })
    }

    /// Toggle the 24/7 Moshi voice brain.
    pub async fn set_voice_brain_24_7(&self, enabled: bool) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.set_voice_brain_24_7(&dir, enabled).map_err(|e| LoaderError::Internal {
            message: format!("Failed to persist voice brain: {e}"),
        })
    }

    /// Replace the TTS voice profile.
    pub async fn set_voice_profile(&self, profile: String) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.set_voice_profile(&dir, profile).map_err(|e| LoaderError::Internal {
            message: format!("Failed to persist voice profile: {e}"),
        })
    }

    /// Replace the chat routing mode.
    pub async fn set_routing_mode(&self, mode: String) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.set_routing_mode(&dir, mode).map_err(|e| LoaderError::Internal {
            message: format!("Failed to persist routing mode: {e}"),
        })
    }

    /// Register a new custom voice clone.
    pub async fn register_voice_clone(&self, entry: VoiceCloneEntry) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.register_voice_clone(&dir, entry).map_err(|e| LoaderError::Internal {
            message: format!("Failed to register voice clone: {e}"),
        })
    }

    /// Remove a registered voice clone by name.
    pub async fn remove_voice_clone(&self, name: &str) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.remove_voice_clone(&dir, name).map_err(|e| LoaderError::Internal {
            message: format!("Failed to remove voice clone: {e}"),
        })
    }

    /// Add or replace a keyword action.
    pub async fn add_keyword_action(&self, entry: KeywordActionEntry) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.add_keyword_action(&dir, entry).map_err(|e| LoaderError::Internal {
            message: format!("Failed to persist keyword action: {e}"),
        })
    }

    /// Remove a keyword action by phrase.
    pub async fn remove_keyword_action(&self, phrase: &str) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.remove_keyword_action(&dir, phrase).map_err(|e| LoaderError::Internal {
            message: format!("Failed to remove keyword action: {e}"),
        })
    }

    /// Replace an existing keyword action in place.
    pub async fn update_keyword_action(&self, phrase: &str, new_entry: KeywordActionEntry) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.update_keyword_action(&dir, phrase, new_entry).map_err(|e| LoaderError::Internal {
            message: format!("Failed to update keyword action: {e}"),
        })
    }

    /// Replace the window idle timeout.
    pub async fn set_idle_timeout(&self, secs: u32) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.set_idle_timeout(&dir, secs).map_err(|e| LoaderError::Internal {
            message: format!("Failed to persist idle timeout: {e}"),
        })
    }

    /// Replace the partial GPU offload layer count for chat.brain.
    pub async fn set_brain_ngl(&self, ngl: i32) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant.set_brain_ngl(&dir, ngl).map_err(|e| LoaderError::Internal {
            message: format!("Failed to persist brain ngl: {e}"),
        })
    }

    // ── Secrets mutations — config lock only ──────────────────

    /// Store or replace the HuggingFace access token.
    pub async fn set_hf_token(&self, token: Option<String>) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        cfg.secrets.set_hf_token(token);
        cfg.secrets.save(&self.boot.models_dir).map_err(|e| LoaderError::Internal {
            message: format!("Failed to persist HF token: {e}"),
        })?;
        let token_str = cfg.secrets.hf_token().map(String::from);
        let has_token = cfg.secrets.has_hf_token();
        cfg.downloads.set_hf_token(token_str);
        tracing::info!(has_token, "HF token updated");
        Ok(())
    }

    /// Clear the stored HF token.
    pub async fn clear_hf_token(&self) -> Result<(), LoaderError> {
        self.set_hf_token(None).await
    }

    // ── Download — config lock only ───────────────────────────

    /// Download a model from HuggingFace.
    #[cfg(feature = "candle-backend")]
    pub async fn download_model(&self, repo_id: &str, filename: &str) -> Result<String, LoaderError> {
        let mut cfg = self.config.write().await;
        let handle = cfg.downloads
            .start_download(repo_id, filename, &self.boot.events)
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
    pub async fn download_model(&self, _repo_id: &str, _filename: &str) -> Result<String, LoaderError> {
        Err(LoaderError::Internal {
            message: "Download requires candle-backend feature".to_string(),
        })
    }

    /// Cancel an active download.
    pub async fn cancel_download(&self, download_id: &str) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        cfg.downloads.cancel(download_id).map_err(|e| LoaderError::Internal {
            message: e.to_string(),
        })
    }

    // ── Inference state (the ONLY heavy write lock) ───────────

    /// Load the model assigned to a slot.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn load_slot(&self, slot_id: &str) -> Result<(), LoaderError> {
        // Phase 1: gather info under read locks
        let (model_id, model_path, capability, backend, params) = {
            let cfg = self.config.read().await;
            let reg = self.registry.read().await;
            let inf = self.inference.read().await;

            let slot = cfg.slots.get_slot(slot_id).ok_or(LoaderError::SlotNotFound {
                slot_id: slot_id.to_string(),
            })?;

            let model_id = slot.assigned_model.clone().ok_or(LoaderError::NoModelAssigned {
                slot_id: slot_id.to_string(),
            })?;

            if matches!(inf.slot_statuses.get(slot_id), Some(ModelStatus::Loading { .. })) {
                return Err(LoaderError::AlreadyLoading { slot_id: slot_id.to_string() });
            }

            let entry = reg.registry.get(&model_id).ok_or(LoaderError::ModelFileMissing {
                path: PathBuf::new(),
                slot_id: Some(slot_id.to_string()),
                can_redownload: false,
            })?;

            if !entry.path.exists() {
                return Err(LoaderError::ModelFileMissing {
                    path: entry.path.clone(),
                    slot_id: Some(slot_id.to_string()),
                    can_redownload: matches!(entry.source, crate::models::registry::ModelSource::HuggingFace { .. }),
                });
            }

            let model_path = entry.path.clone();
            let capability = slot.capability;
            let backend = slot.runtime.unwrap_or_else(|| select_backend(entry, None));
            let hw = self.hardware.read();

            let device_str = match slot.preferred_device {
                crate::slots::types::DevicePreference::Gpu => "cuda:0".to_string(),
                crate::slots::types::DevicePreference::Cpu => "cpu".to_string(),
                _ => {
                    if hw.cached().has_gpu() { "cuda:0".to_string() } else { "cpu".to_string() }
                }
            };

            let gpu_layers: Option<u32> = {
                let slot_hint = slot.extensions.get("llama_cpp_ngl").and_then(|s| s.parse::<i32>().ok());
                let assistant_hint = if slot_id == "chat.brain" { Some(cfg.assistant.offload.brain_ngl) } else { None };
                match slot_hint.or(assistant_hint) {
                    Some(n) if n >= 0 => Some(n as u32),
                    _ => None,
                }
            };

            let params = LoadParams {
                device: device_str.clone(),
                context_length: entry.context_length,
                gpu_layers,
                auto_prime: false,
            };

            (model_id, model_path, capability, backend, params)
        };
        // All read locks dropped.

        // Phase 2: acquire inference write lock — the ONLY exclusive lock
        let mut inf = self.inference.write().await;

        inf.slot_statuses.insert(
            slot_id.to_string(),
            ModelStatus::Loading {
                stage: LoadingStage::Allocating,
                progress_pct: 10.0,
            },
        );
        self.boot.events.emit(LoaderEvent::LoadingStarted {
            slot_id: slot_id.to_string(),
            model_id: model_id.clone(),
        });
        self.hardware.write().enter_loading_mode();

        let load_result = match backend {
            BackendType::Ort | BackendType::Sherpa => {
                inf.voice_pool.load(slot_id, &model_path, capability, params)
            }
            #[cfg(feature = "candle-backend")]
            BackendType::Candle | BackendType::LlamaCpp => {
                match inf.pool.acquire(&model_id, &model_path, params, backend).await {
                    Ok((handle, memory)) => {
                        inf.slot_handles.insert(slot_id.to_string(), handle);
                        Ok(memory)
                    }
                    Err(e) => Err(e),
                }
            }
            #[cfg(not(feature = "candle-backend"))]
            BackendType::Candle | BackendType::LlamaCpp => {
                Err(anyhow::anyhow!("Candle backend not compiled"))
            }
        };

        match load_result {
            Ok(memory) => {
                inf.slot_statuses.insert(slot_id.to_string(), ModelStatus::Loaded { footprint: memory });
                self.boot.events.emit(LoaderEvent::LoadingComplete { slot_id: slot_id.to_string(), memory });
                self.hardware.write().enter_normal_mode();
                tracing::info!(slot = %slot_id, model = %model_id, backend = ?backend, ram_mb = memory.ram_mb(), vram_mb = memory.vram_mb(), "Slot loaded");
                Ok(())
            }
            Err(e) => {
                let error_msg = e.to_string();
                inf.slot_statuses.insert(slot_id.to_string(), ModelStatus::Failed { error: error_msg.clone(), failed_at: LoadingStage::LoadingWeights });
                self.boot.events.emit(LoaderEvent::LoadingFailed { slot_id: slot_id.to_string(), error: error_msg.clone() });
                self.hardware.write().enter_normal_mode();
                tracing::error!(slot = %slot_id, error = %error_msg, "Slot loading failed");
                Err(LoaderError::Internal { message: error_msg })
            }
        }
    }

    /// Unload the model from a slot.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn unload_slot(&self, slot_id: &str) -> Result<(), LoaderError> {
        let model_id = {
            let cfg = self.config.read().await;
            if !cfg.slots.contains(slot_id) {
                return Err(LoaderError::SlotNotFound { slot_id: slot_id.to_string() });
            }
            cfg.slots.get_slot(slot_id).and_then(|s| s.assigned_model.clone())
        };

        let mut inf = self.inference.write().await;
        inf.slot_statuses.insert(slot_id.to_string(), ModelStatus::Unloading);
        inf.slot_handles.remove(slot_id);

        if let Some(mid) = model_id {
            for attempt in 1..=2 {
                match inf.pool.release(&mid).await {
                    Some(freed) => {
                        self.boot.events.emit(LoaderEvent::UnloadComplete { slot_id: slot_id.to_string(), freed });
                        tracing::info!(slot = %slot_id, model = %mid, "Model unloaded");
                        inf.slot_statuses.insert(slot_id.to_string(), ModelStatus::NotLoaded);
                        return Ok(());
                    }
                    None => {
                        if inf.pool.is_loaded(&mid) {
                            tracing::info!(slot = %slot_id, model = %mid, "Slot handle released (shared)");
                            inf.slot_statuses.insert(slot_id.to_string(), ModelStatus::NotLoaded);
                            return Ok(());
                        }
                        tracing::warn!(slot = %slot_id, model = %mid, attempt, "Unload retry");
                        if attempt < 2 {
                            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                        }
                    }
                }
            }
            let error_msg = format!("Unload failed for slot '{slot_id}' after 2 retries");
            tracing::error!(slot = %slot_id, "{error_msg}");
            inf.slot_statuses.insert(slot_id.to_string(), ModelStatus::Failed { error: error_msg.clone(), failed_at: LoadingStage::Verifying });
            return Err(LoaderError::Internal { message: error_msg });
        }

        inf.slot_statuses.insert(slot_id.to_string(), ModelStatus::NotLoaded);
        Ok(())
    }

    /// Warm a slot — load weights to CPU RAM only, no GPU.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn warm_slot(&self, slot_id: &str) -> Result<(), LoaderError> {
        // Phase 1: gather under read locks
        let (model_id, model_path, capability, backend, params) = {
            let cfg = self.config.read().await;
            let reg = self.registry.read().await;
            let inf = self.inference.read().await;

            let slot = cfg.slots.get_slot(slot_id).ok_or(LoaderError::SlotNotFound { slot_id: slot_id.to_string() })?;
            let model_id = slot.assigned_model.clone().ok_or(LoaderError::NoModelAssigned { slot_id: slot_id.to_string() })?;

            match inf.slot_statuses.get(slot_id) {
                Some(ModelStatus::Loaded { .. }) | Some(ModelStatus::Warm { .. }) => return Ok(()),
                Some(ModelStatus::Loading { .. }) => return Err(LoaderError::AlreadyLoading { slot_id: slot_id.to_string() }),
                _ => {}
            }

            let entry = reg.registry.get(&model_id).ok_or(LoaderError::ModelFileMissing { path: PathBuf::new(), slot_id: Some(slot_id.to_string()), can_redownload: false })?;
            if !entry.path.exists() {
                return Err(LoaderError::ModelFileMissing { path: entry.path.clone(), slot_id: Some(slot_id.to_string()), can_redownload: false });
            }

            let model_path = entry.path.clone();
            let capability = slot.capability;
            let backend = slot.runtime.unwrap_or_else(|| select_backend(entry, None));
            let params = LoadParams { device: "cpu".to_string(), context_length: entry.context_length, gpu_layers: Some(0), auto_prime: false };

            (model_id, model_path, capability, backend, params)
        };

        // Phase 2: inference write lock
        let mut inf = self.inference.write().await;
        inf.slot_statuses.insert(slot_id.to_string(), ModelStatus::Loading { stage: LoadingStage::Allocating, progress_pct: 5.0 });
        self.boot.events.emit(LoaderEvent::LoadingStarted { slot_id: slot_id.to_string(), model_id: model_id.clone() });

        let load_result = match backend {
            BackendType::Ort | BackendType::Sherpa => {
                inf.voice_pool.load(slot_id, &model_path, capability, params)
            }
            #[cfg(feature = "candle-backend")]
            BackendType::Candle | BackendType::LlamaCpp => {
                match inf.pool.acquire(&model_id, &model_path, params, backend).await {
                    Ok((handle, memory)) => { inf.slot_handles.insert(slot_id.to_string(), handle); Ok(memory) }
                    Err(e) => Err(e),
                }
            }
            #[cfg(not(feature = "candle-backend"))]
            BackendType::Candle | BackendType::LlamaCpp => Err(anyhow::anyhow!("Candle backend not compiled")),
        };

        match load_result {
            Ok(memory) => {
                let footprint = MemoryFootprint { ram_bytes: memory.ram_bytes, vram_bytes: 0, kv_cache_bytes: 0 };
                inf.slot_statuses.insert(slot_id.to_string(), ModelStatus::Warm { footprint });
                self.boot.events.emit(LoaderEvent::LoadingComplete { slot_id: slot_id.to_string(), memory: footprint });
                tracing::info!(slot = %slot_id, model = %model_id, ram_mb = footprint.ram_mb(), "Slot warmed");
                Ok(())
            }
            Err(e) => {
                let error_msg = e.to_string();
                inf.slot_statuses.insert(slot_id.to_string(), ModelStatus::Failed { error: error_msg.clone(), failed_at: LoadingStage::LoadingWeights });
                self.boot.events.emit(LoaderEvent::LoadingFailed { slot_id: slot_id.to_string(), error: error_msg.clone() });
                tracing::error!(slot = %slot_id, error = %error_msg, "Warm failed");
                Err(LoaderError::Internal { message: error_msg })
            }
        }
    }

    /// Atomically swap the model on a slot.
    #[tracing::instrument(skip(self), fields(slot_id, new_model_id))]
    pub async fn swap_model(&self, slot_id: &str, new_model_id: &str) -> Result<(), LoaderError> {
        // Validate
        {
            let cfg = self.config.read().await;
            let reg = self.registry.read().await;
            let slot = cfg.slots.get_slot(slot_id).ok_or(LoaderError::SlotNotFound { slot_id: slot_id.to_string() })?;
            if slot.assigned_model.as_deref() == Some(new_model_id) { return Ok(()); }
            let entry = reg.registry.get(new_model_id).ok_or(LoaderError::Internal { message: format!("Model '{new_model_id}' not found") })?;
            if !entry.compatible_capabilities.contains(&slot.capability) {
                return Err(LoaderError::IncompatibleModel { model_id: new_model_id.to_string(), capability: slot.capability.to_string() });
            }
        }

        // Begin swap guard
        { let mut inf = self.inference.write().await; inf.swap_guard.begin(slot_id); }

        self.boot.events.emit(LoaderEvent::SwapStarted { slot_id: slot_id.to_string(), from_model: None, to_model: new_model_id.to_string() });
        tracing::info!(slot = %slot_id, to = %new_model_id, "Swap started");

        if self.is_slot_loaded(slot_id).await {
            if let Err(e) = self.unload_slot(slot_id).await {
                let mut inf = self.inference.write().await;
                inf.swap_guard.end(slot_id);
                return Err(LoaderError::Internal { message: format!("Swap unload failed: {e}") });
            }
        }

        if let Err(e) = self.assign_model(slot_id, new_model_id).await {
            let mut inf = self.inference.write().await;
            inf.swap_guard.end(slot_id);
            return Err(LoaderError::Internal { message: format!("Swap assign failed: {e}") });
        }

        if let Err(e) = self.load_slot(slot_id).await {
            let mut inf = self.inference.write().await;
            inf.swap_guard.end(slot_id);
            return Err(LoaderError::Internal { message: format!("Swap load failed: {e}") });
        }

        { let mut inf = self.inference.write().await; inf.swap_guard.end(slot_id); }

        self.boot.events.emit(LoaderEvent::SwapComplete { slot_id: slot_id.to_string(), model_id: new_model_id.to_string() });
        tracing::info!(slot = %slot_id, model = %new_model_id, "Swap complete");
        Ok(())
    }

    /// Delete a model from disk and registry.
    #[tracing::instrument(skip(self), fields(model_id))]
    pub async fn delete_model(&self, model_id: &str) -> Result<(), LoaderError> {
        // Check not loaded
        { let inf = self.inference.read().await; if inf.pool.is_loaded(model_id) { return Err(LoaderError::Internal { message: format!("Model '{model_id}' is loaded — unload first") }); } }

        // Get info
        let (file_path, filename, slots_to_clear) = {
            let reg = self.registry.read().await;
            let cfg = self.config.read().await;
            let entry = reg.registry.get(model_id).ok_or(LoaderError::Internal { message: format!("Model '{model_id}' not found") })?;
            let file_path = entry.path.clone();
            let filename = entry.filename.clone();
            let slots_to_clear: Vec<String> = cfg.slots.list_slots().iter().filter(|s| s.assigned_model.as_deref() == Some(model_id)).map(|s| s.id.clone()).collect();
            (file_path, filename, slots_to_clear)
        };

        // Clear assignments
        for slot_id in &slots_to_clear {
            if let Err(e) = self.unassign_slot(slot_id).await {
                tracing::warn!(slot = %slot_id, error = %e, "Failed to unassign during delete");
            }
        }

        // Delete file
        if file_path.exists() {
            std::fs::remove_file(&file_path).map_err(|e| LoaderError::Internal { message: format!("Failed to delete: {e}") })?;
        }

        // Remove from registry
        { let mut reg = self.registry.write().await; reg.registry.remove(model_id); }

        tracing::info!(model_id = %model_id, filename = %filename, "Model deleted");
        Ok(())
    }

    /// Proactively load every slot marked Hot.
    pub async fn auto_load_hot_slots(&self) -> usize {
        use crate::slots::types::LoadingStrategy;

        let targets: Vec<String> = {
            let cfg = self.config.read().await;
            cfg.slots.list_slots().iter()
                .filter(|s| matches!(s.loading, LoadingStrategy::Hot) && s.assigned_model.is_some())
                .map(|s| s.id.clone())
                .collect()
        };

        let mut loaded = 0usize;
        for slot_id in targets {
            match self.load_slot(&slot_id).await {
                Ok(()) => { loaded += 1; tracing::info!(slot = %slot_id, "Auto-loaded Hot slot"); }
                Err(e) => { tracing::warn!(slot = %slot_id, error = %e, "Auto-load failed (non-fatal)"); }
            }
        }
        loaded
    }

    // ── Voice/Inference read-through — inference read lock ─────

    /// Synthesize speech.
    pub async fn synthesize(&self, slot_id: &str, text: &str, voice: &str) -> anyhow::Result<crate::backends::voice::AudioSamples> {
        let inf = self.inference.read().await;
        inf.voice_pool.synthesize(slot_id, text, voice)
    }

    /// Transcribe audio.
    pub async fn transcribe(&self, slot_id: &str, samples: &crate::backends::voice::AudioSamples) -> anyhow::Result<String> {
        let inf = self.inference.read().await;
        inf.voice_pool.transcribe(slot_id, samples)
    }

    /// Check if a voice model is loaded.
    pub async fn voice_loaded(&self, slot_id: &str) -> bool {
        let inf = self.inference.read().await;
        inf.voice_pool.is_loaded(slot_id)
    }

    /// Embed texts.
    pub async fn embed(&self, slot_id: &str, texts: &[&str]) -> anyhow::Result<Vec<Vec<f32>>> {
        let inf = self.inference.read().await;
        inf.voice_pool.embed(slot_id, texts)
    }

    /// Rerank documents.
    pub async fn rerank(&self, slot_id: &str, query: &str, documents: &[&str]) -> anyhow::Result<Vec<f32>> {
        let inf = self.inference.read().await;
        inf.voice_pool.rerank(slot_id, query, documents)
    }

    /// Encode image file.
    pub async fn encode_image(&self, slot_id: &str, path: &std::path::Path) -> anyhow::Result<Vec<f32>> {
        let inf = self.inference.read().await;
        inf.voice_pool.encode_image(slot_id, path)
    }

    /// Encode raw RGB.
    pub async fn encode_rgb(&self, slot_id: &str, rgb_bytes: &[u8], width: u32, height: u32) -> anyhow::Result<Vec<f32>> {
        let inf = self.inference.read().await;
        inf.voice_pool.encode_rgb(slot_id, rgb_bytes, width, height)
    }

    /// Search HuggingFace (stateless HTTP — no lock).
    pub async fn search_huggingface(&self, query: &str, limit: u32) -> anyhow::Result<Vec<crate::models::search::HfSearchResult>> {
        crate::models::search::search_huggingface(query, limit).await
    }
}

// ── Tests ────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hardware::lanes::LaneKind;
    use crate::models::{BackendType, ModelFormat, ModelRegistryEntry, ModelSource};
    use crate::slots::{
        DevicePreference, LoadingStrategy, ModelCapability, ModelSourceTier, PersistenceClass,
    };
    use crate::traits::config::MemoryConfig;
    use crate::traits::events::NullEventSink;

    fn fake_entry(filename: &str, models_dir: &std::path::Path) -> ModelRegistryEntry {
        ModelRegistryEntry {
            id: format!("test-{filename}"),
            filename: filename.to_string(),
            path: models_dir.join(filename),
            format: ModelFormat::Onnx,
            architecture: "test".to_string(),
            parameter_count: None,
            quant_level: None,
            context_length: 0,
            size_bytes: 0,
            vram_estimate_mb: 0,
            supported_backends: vec![BackendType::Ort],
            compatible_capabilities: vec![ModelCapability::TextToSpeech],
            source: ModelSource::Local,
            discovered_at: 0,
        }
    }

    fn bundled_slot(id: &str, bundled_path: &str) -> Slot {
        Slot {
            id: id.to_string(),
            label: id.to_string(),
            capability: ModelCapability::TextToSpeech,
            preferred_device: DevicePreference::Cpu,
            loading: LoadingStrategy::Hot,
            persistence_class: PersistenceClass::OnDemand,
            lane: LaneKind::Cpu,
            assigned_model: None,
            fallback: None,
            runtime: Some(BackendType::Ort),
            default_model: None,
            requires: Vec::new(),
            overrides: None,
            source_tier: ModelSourceTier::Bundled {
                bundled_path: bundled_path.to_string(),
            },
            extensions: std::collections::HashMap::new(),
            builtin: true,
        }
    }

    fn fresh_service() -> ModelLoaderService {
        let tmp = std::env::temp_dir().join(format!(
            "devpulse-ml-test-{}",
            uuid::Uuid::now_v7()
        ));
        ModelLoaderService::new(
            Box::new(MemoryConfig::new()),
            Arc::new(NullEventSink),
            tmp,
            vec!["voice".to_string()],
            Vec::new(),
        )
        .expect("ModelLoaderService::new must succeed with MemoryConfig")
    }

    #[tokio::test]
    async fn bundled_slot_hydrates_from_registry() {
        let service = fresh_service();
        let slot = bundled_slot("voice.tts", "voice/kokoro-v1.0.int8.onnx");
        service.register_slot(slot).await.unwrap();

        let entry = fake_entry("kokoro-v1.0.int8.onnx", &service.boot.models_dir);
        let expected_id = entry.id.clone();
        { let mut reg = service.registry.write().await; reg.registry.add(entry); }

        let hydrated = service.auto_assign_bundled_slots().await.unwrap();
        assert_eq!(hydrated, 1);

        let slots = service.list_slots().await;
        let slot = slots.iter().find(|s| s.id == "voice.tts").unwrap();
        assert_eq!(slot.assigned_model.as_deref(), Some(expected_id.as_str()));
    }

    #[tokio::test]
    async fn bundled_hydrate_respects_user_assignment() {
        let service = fresh_service();
        let mut slot = bundled_slot("voice.tts", "voice/kokoro-v1.0.int8.onnx");
        slot.assigned_model = Some("user-picked-model".to_string());
        service.register_slot(slot).await.unwrap();

        let entry = fake_entry("kokoro-v1.0.int8.onnx", &service.boot.models_dir);
        { let mut reg = service.registry.write().await; reg.registry.add(entry); }

        let hydrated = service.auto_assign_bundled_slots().await.unwrap();
        assert_eq!(hydrated, 0);

        let slots = service.list_slots().await;
        let slot = slots.iter().find(|s| s.id == "voice.tts").unwrap();
        assert_eq!(slot.assigned_model.as_deref(), Some("user-picked-model"));
    }

    #[tokio::test]
    async fn bundled_hydrate_skips_missing_files() {
        let service = fresh_service();
        let slot = bundled_slot("voice.tts", "voice/kokoro-v1.0.int8.onnx");
        service.register_slot(slot).await.unwrap();

        let hydrated = service.auto_assign_bundled_slots().await.unwrap();
        assert_eq!(hydrated, 0);

        let slots = service.list_slots().await;
        let slot = slots.iter().find(|s| s.id == "voice.tts").unwrap();
        assert!(slot.assigned_model.is_none());
    }

    #[tokio::test]
    async fn user_managed_slots_are_not_auto_hydrated() {
        let service = fresh_service();
        let mut slot = bundled_slot("chat.brain", "chat/qwen3-4b.gguf");
        slot.source_tier = ModelSourceTier::UserManaged;
        service.register_slot(slot).await.unwrap();

        let entry = fake_entry("qwen3-4b.gguf", &service.boot.models_dir);
        { let mut reg = service.registry.write().await; reg.registry.add(entry); }

        let hydrated = service.auto_assign_bundled_slots().await.unwrap();
        assert_eq!(hydrated, 0);

        let slots = service.list_slots().await;
        let slot = slots.iter().find(|s| s.id == "chat.brain").unwrap();
        assert!(slot.assigned_model.is_none());
    }
}
