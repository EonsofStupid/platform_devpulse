//! `ModelLoaderService` — the MANAGEMENT facade for model management.
//!
//! Post kernel-severance this is the management half of the former kernel
//! god-object: slot registry, model registry + discovery scan, hardware
//! auto-config, HuggingFace download, secrets, and assistant/keyword
//! config. It links NO inference backend.
//!
//! The inference half (load / warm / unload / swap / generate / embed /
//! rerank / encode / synthesize / transcribe / install-to-slot, plus the
//! Burn encoder adapter and the `BackendPool` / `VoicePool` runtime
//! state) was DROPPED — that work runs on headless Clyffy/GB10 and is
//! reached over the gb10-client wire from the desktop, not held here.
//!
//! # Concurrency: fine-grained interior locks
//!
//! | Group | Lock | Write when |
//! |-------|------|------------|
//! | `RegistryState` | `tokio::sync::RwLock` | scan |
//! | `ConfigState` | `tokio::sync::RwLock` | assign/config changes |
//! | `BootState` | none (`Arc`) | never (immutable after boot) |
//! | `HardwareMonitor` | `parking_lot::RwLock` | refresh (sub-ms) |
//!
//! Lock ordering (deadlock prevention): config → registry → hardware.
//!
//! Consumers implement [`ConfigBackend`] and [`LoaderEventSink`] to wire
//! into their own persistence and event systems.

use crate::platform::assistant::{AssistantConfig, KeywordActionEntry, VoiceCloneEntry};
use crate::platform::hardware::auto_config::{self, AutoConfig};
use crate::platform::hardware::metrics::{HardwareMetrics, HardwareMonitor};
use crate::platform::model_loader::models::download::DownloadManager;
use crate::platform::model_loader::models::registry::{ModelRegistry, ModelRegistryEntry};
use crate::platform::model_loader::models::secrets::Secrets;
use crate::platform::model_loader::slots::registry::SlotRegistry;
use crate::platform::model_loader::slots::types::{ModelCapability, Slot};
use crate::platform::model_loader::traits::config::ConfigBackend;
use crate::platform::model_loader::traits::errors::LoaderError;
use crate::platform::model_loader::traits::events::{LoaderEvent, LoaderEventSink};
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

// ── Sub-structs ──────────────────────────────────────────────────

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
    pub(crate) presets: Vec<crate::platform::hardware::presets::PresetBlueprint>,
}

// ── Service ──────────────────────────────────────────────────────

/// The management entry point. All fields are `Arc` — the service is `Clone`.
///
/// Lock ordering: `config` → `registry` → `hardware`.
#[derive(Clone)]
pub struct ModelLoaderService {
    pub(crate) registry: Arc<RwLock<RegistryState>>,
    pub(crate) config: Arc<RwLock<ConfigState>>,
    pub(crate) boot: Arc<BootState>,
    pub(crate) hardware: Arc<parking_lot::RwLock<HardwareMonitor>>,
    /// Per-slot first-query latch. An entry's presence means the first-query
    /// event has already fired for that `(slot, current assignment)` pair.
    /// [`Self::assign_model`] removes the entry so a model swap re-arms the
    /// trigger. Held under a short-lived `parking_lot::Mutex` — never
    /// crosses an `await`.
    pub(crate) first_query_seen: Arc<parking_lot::Mutex<HashSet<String>>>,
}

impl ModelLoaderService {
    fn refresh_cached_assignment_state(cfg: &mut ConfigState) {
        cfg.has_assignments = cfg
            .slots
            .list_slots()
            .iter()
            .any(|slot| slot.assigned_model.is_some());
    }

    /// Create a new management service instance.
    ///
    /// `models_dir` is where GGUF/SafeTensors files live.
    /// `subdirs` defines subdirectory names created under `models_dir`.
    /// `presets` is the cached preset catalog loaded at boot.
    ///
    /// # Errors
    /// Returns [`LoaderError::Io`] if `models_dir` does not exist and the
    /// per-subdir `create_dir_all` calls fail (typically permission denied
    /// or non-existent parent path). Failures inside the registry / secrets
    /// / assistant-config loaders are caught with a `tracing::warn!` and
    /// fall back to an empty default — the constructor itself succeeds in
    /// those cases.
    #[allow(clippy::case_sensitive_file_extension_comparisons)] // ".model" is a config-key suffix, not a file extension
    #[allow(clippy::needless_pass_by_value)] // owned `subdirs` is consumed via `&subdirs` borrow + iteration
    pub fn new(
        config: Box<dyn ConfigBackend>,
        events: Arc<dyn LoaderEventSink>,
        models_dir: PathBuf,
        subdirs: Vec<String>,
        presets: Vec<crate::platform::hardware::presets::PresetBlueprint>,
    ) -> Result<Self, LoaderError> {
        if !models_dir.exists() {
            for subdir in &subdirs {
                let target = models_dir.join(subdir);
                std::fs::create_dir_all(&target).map_err(|e| LoaderError::Io {
                    path: target.clone(),
                    reason: format!("create_dir_all failed: {e}"),
                })?;
                tracing::info!(
                    path = %target.display(),
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
            .map_or_else(|| models_dir.clone(), std::path::Path::to_path_buf);
        let assistant = AssistantConfig::load(&userdata_dir).unwrap_or_else(|e| {
            tracing::warn!(
                target: "assistant",
                error = %e,
                "Failed to load assistant config — using embedded defaults"
            );
            AssistantConfig::load_default().unwrap_or_default()
        });
        let has_assignments = config.list_by_prefix("slot.").map_or_else(
            |e| {
                tracing::warn!(error = %e, "Failed to preload slot assignment state");
                false
            },
            |entries| entries.iter().any(|(key, _)| key.ends_with(".model")),
        );
        let setup_complete = config.get("setup_complete").map_or_else(
            |e| {
                tracing::warn!(error = %e, "Failed to preload setup completion state");
                false
            },
            |value| value.as_deref() == Some("true"),
        );

        Ok(Self {
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
            first_query_seen: Arc::new(parking_lot::Mutex::new(HashSet::new())),
        })
    }

    // ── Slot registration (boot-time only) ────────────────────

    /// Register a single slot.
    ///
    /// # Errors
    /// Returns [`LoaderError::Internal`] if the slot id format is invalid
    /// (must be `subsystem.purpose`) or if a slot with that id is already
    /// registered.
    pub async fn register_slot(&self, slot: Slot) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        cfg.slots.register_slot(slot)
    }

    /// Register multiple slots.
    ///
    /// # Errors
    /// Stops at the first invalid or duplicate slot and returns
    /// [`LoaderError::Internal`]; slots registered before the failure
    /// remain registered.
    pub async fn register_slots(&self, slots: Vec<Slot>) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        for slot in slots {
            cfg.slots.register_slot(slot)?;
        }
        Ok(())
    }

    // ── Read-only queries (no blocking, no contention) ────────

    /// The on-disk directory where every downloaded model lives —
    /// `BootState::models_dir`. Read-only after boot; no lock needed.
    #[must_use]
    pub fn models_dir(&self) -> &std::path::Path {
        &self.boot.models_dir
    }

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
        cfg.slots
            .list_slots_by_subsystem(subsystem)
            .into_iter()
            .cloned()
            .collect()
    }

    /// Get the current model registry.
    pub async fn get_registry(&self) -> Vec<ModelRegistryEntry> {
        let reg = self.registry.read().await;
        reg.registry.all().to_vec()
    }

    /// Filter registry to models compatible with a specific capability.
    pub async fn models_for_capability(&self, cap: ModelCapability) -> Vec<ModelRegistryEntry> {
        let reg = self.registry.read().await;
        reg.registry
            .compatible_with_capability(cap)
            .into_iter()
            .cloned()
            .collect()
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

    /// Auto-configure based on detected hardware.
    pub async fn auto_configure(&self) -> AutoConfig {
        let downloaded = {
            let reg = self.registry.read().await;
            reg.registry.filenames()
        };
        let hw = self.hardware.read();
        auto_config::auto_configure(hw.cached(), &downloaded, &self.boot.presets)
    }

    /// Return every known hardware preset.
    pub async fn list_all_presets(&self) -> Vec<AutoConfig> {
        let reg = self.registry.read().await;
        let downloaded = reg.registry.filenames();
        auto_config::list_all_presets(&downloaded, &self.boot.presets)
    }

    /// Build the `AutoConfig` for a specific tier.
    pub async fn config_for_tier(
        &self,
        tier: crate::platform::hardware::HardwareTier,
    ) -> AutoConfig {
        let reg = self.registry.read().await;
        let downloaded = reg.registry.filenames();
        auto_config::config_for_tier(tier, &downloaded, &self.boot.presets)
    }

    /// Check if this is the first run.
    pub async fn is_first_run(&self) -> bool {
        let cfg = self.config.read().await;
        !cfg.has_assignments
    }

    /// Mark the setup wizard as complete.
    ///
    /// # Errors
    /// Returns [`LoaderError::ConfigBackend`] if the underlying
    /// `ConfigBackend::set` call fails (store write error or memory-config
    /// invariant violation).
    pub async fn mark_setup_complete(&self) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        cfg.config
            .set("setup_complete", "true")
            .map_err(|e| LoaderError::ConfigBackend {
                operation: "set".to_string(),
                key: "setup_complete".to_string(),
                reason: e.to_string(),
            })?;
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

    /// Voice custom directory (`{userdata}/voice/custom/`).
    pub fn voice_custom_dir(&self) -> PathBuf {
        self.boot
            .models_dir
            .parent()
            .map_or_else(
                || self.boot.models_dir.clone(),
                std::path::Path::to_path_buf,
            )
            .join("voice")
            .join("custom")
    }

    // ── Registry write (scan) — only registry lock ────────────

    /// Scan the models directory. Only locks the registry.
    ///
    /// The IO portion (filesystem walk + GGUF header parsing) runs inside
    /// [`tokio::task::block_in_place`] so the worker thread that's blocked
    /// on it doesn't starve other tasks on the runtime. **Multi-threaded
    /// runtime required** at every caller.
    ///
    /// # Errors
    /// Returns [`LoaderError::Io`] if the filesystem walk fails (permission
    /// denied, path no longer exists) or a GGUF/SafeTensors header fails to
    /// parse.
    pub async fn scan_models(&self) -> Result<Vec<ModelRegistryEntry>, LoaderError> {
        self.boot.events.emit(LoaderEvent::RegistryScanStarted);

        let mut reg = self.registry.write().await;
        let count =
            tokio::task::block_in_place(|| reg.registry.scan()).map_err(|e| LoaderError::Io {
                path: self.boot.models_dir.clone(),
                reason: format!("registry scan failed: {e:#}"),
            })?;

        for entry in reg.registry.all() {
            self.boot
                .events
                .emit(LoaderEvent::ModelDiscovered(entry.clone()));
        }

        self.boot.events.emit(LoaderEvent::RegistryScanComplete {
            models_found: count,
        });

        tracing::info!(count, path = %self.boot.models_dir.display(), "Model scan complete");
        Ok(reg.registry.all().to_vec())
    }

    // ── Config write — only config lock ───────────────────────

    /// Assign a model to a slot: validate capability, persist the config
    /// row, and lay down the load-bearing slot symlink.
    ///
    /// The pre-flight VRAM-budget gate that lived here was DROPPED with the
    /// inference state — VRAM occupancy is a live-runtime fact owned by
    /// Clyffy over the wire now, not a local `BackendPool` read.
    ///
    /// # Errors
    /// Returns [`LoaderError::Internal`] if `model_id` is not in the
    /// registry, [`LoaderError::SlotNotFound`] if `slot_id` is unknown,
    /// or [`LoaderError::IncompatibleModel`] if the model's capabilities
    /// don't match the slot's required capability. Persistence / symlink
    /// failures surface as [`LoaderError::ConfigBackend`] / the symlink
    /// error.
    #[tracing::instrument(skip(self), fields(slot_id, model_id))]
    pub async fn assign_model(&self, slot_id: &str, model_id: &str) -> Result<(), LoaderError> {
        // Phase 1: validate under read locks
        let reg = self.registry.read().await;
        let entry = reg.registry.get(model_id).ok_or(LoaderError::Internal {
            message: format!("Model '{model_id}' not found in registry"),
        })?;

        // Read slot capability for validation
        {
            let cfg = self.config.read().await;
            let slot = cfg
                .slots
                .get_slot(slot_id)
                .ok_or(LoaderError::SlotNotFound {
                    slot_id: slot_id.to_string(),
                })?;
            if !entry.compatible_capabilities.contains(&slot.capability) {
                return Err(LoaderError::IncompatibleModel {
                    model_id: model_id.to_string(),
                    capability: slot.capability.to_string(),
                });
            }
        }

        // Capture the bits we'll need after `reg` is dropped so the
        // symlink call below doesn't have to re-acquire the registry
        // read lock.
        let entry_format = entry.format;
        let entry_path = entry.path.clone();
        drop(reg);

        // Phase 2: write under config lock only
        let mut cfg = self.config.write().await;
        let config_key = format!("slot.{slot_id}.model");
        cfg.config
            .set(&config_key, model_id)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist assignment: {e}"),
            })?;

        // Phase 2b: lay down the symlink — THIS is the load-bearing
        // artifact. Until the symlink lands at
        // `{userdata_dir}/slots/{slot_id}/model.<ext>`, the slot is
        // not actually armed. See [[engine-per-model-assignment]].
        let link_path = match crate::platform::model_loader::slots::symlink::assign(
            &cfg.userdata_dir,
            slot_id,
            entry_format,
            &entry_path,
        ) {
            Ok(link) => link,
            Err(e) => {
                tracing::warn!(
                    target: "wizard.lifecycle",
                    slot_id = %slot_id,
                    model_id = %model_id,
                    error = %e,
                    "Slot symlink assign failed"
                );
                self.boot.events.emit(LoaderEvent::WizardSymlinkFailed {
                    slot_id: slot_id.to_string(),
                    error: e.to_string(),
                });
                return Err(e);
            }
        };

        tracing::info!(
            target: "wizard.lifecycle",
            slot_id = %slot_id,
            model_id = %model_id,
            link_path = %link_path.display(),
            target_path = %entry_path.display(),
            "Slot symlink armed"
        );
        self.boot.events.emit(LoaderEvent::WizardSymlinkArmed {
            slot_id: slot_id.to_string(),
            link_path: link_path.display().to_string(),
            target_path: entry_path.display().to_string(),
        });

        if let Some(s) = cfg.slots.get_slot_mut(slot_id) {
            s.assigned_model = Some(model_id.to_string());
        }
        cfg.has_assignments = true;

        // Re-arm the first-query latch — a swap should re-fire the
        // first-query trigger so downstream can prove the new model is
        // actually callable end-to-end, not just assigned.
        self.first_query_seen.lock().remove(slot_id);

        self.boot.events.emit(LoaderEvent::SlotAssigned {
            slot_id: slot_id.to_string(),
            model_id: model_id.to_string(),
        });

        tracing::info!(slot = %slot_id, model = %model_id, "Model assigned to slot (symlink armed)");
        Ok(())
    }

    /// Remove model assignment from a slot.
    ///
    /// # Errors
    /// Returns [`LoaderError::SlotNotFound`] if `slot_id` is unknown,
    /// or [`LoaderError::Internal`] if the persisted config delete fails.
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

        // Tear down the symlink alongside the config write so callers don't
        // see a stale model.<ext> after unassign returns.
        crate::platform::model_loader::slots::symlink::unassign(&cfg.userdata_dir, slot_id)?;

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
    ///
    /// # Errors
    /// Returns [`LoaderError::ConfigBackend`] if `list_by_prefix` fails on
    /// the backing config store. Per-key cleanup of stale or incompatible
    /// assignments fail-soft with `tracing::warn!` and never propagate.
    pub async fn restore_assignments(&self) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let reg = self.registry.read().await;

        let persisted =
            cfg.config
                .list_by_prefix("slot.")
                .map_err(|e| LoaderError::ConfigBackend {
                    operation: "list_by_prefix".to_string(),
                    key: "slot.*".to_string(),
                    reason: e.to_string(),
                })?;
        // Snapshot the path field once so the reconcile branch below can
        // call into the symlink layer without re-borrowing `cfg`.
        let userdata_dir = cfg.userdata_dir.clone();

        for (key, model_id) in persisted {
            // `.model` here is the config-key suffix `slot.<id>.model`,
            // not a file extension — case-sensitive comparison is correct.
            #[allow(clippy::case_sensitive_file_extension_comparisons)]
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
                            // Reconcile the symlink — config metadata
                            // survives restarts trivially, but the symlink
                            // on disk could have been wiped. Re-arming here
                            // keeps the runtime contract intact without
                            // forcing the customer to re-hit Save.
                            let symlink_target =
                                crate::platform::model_loader::slots::symlink::symlink_path(
                                    &userdata_dir,
                                    slot_id,
                                    entry.format,
                                );
                            if !symlink_target.exists() {
                                if let Err(e) =
                                    crate::platform::model_loader::slots::symlink::assign(
                                        &userdata_dir,
                                        slot_id,
                                        entry.format,
                                        &entry.path,
                                    )
                                {
                                    tracing::warn!(
                                        slot = %slot_id,
                                        error = %e,
                                        "Symlink reconcile failed — slot will report \
                                         ModelFileMissing until customer re-Saves"
                                    );
                                }
                            }
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
    ///
    /// # Errors
    /// Currently the body fail-softs every per-slot operation
    /// (`tracing::warn!` + skip), so this method does not propagate
    /// errors. The fallible signature is preserved for forward-compat.
    pub async fn auto_assign_bundled_slots(&self) -> Result<usize, LoaderError> {
        use crate::platform::model_loader::slots::ModelSourceTier;

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
            let Some(filename) = std::path::Path::new(&bundled_path)
                .file_name()
                .and_then(|s| s.to_str())
                .map(str::to_string)
            else {
                tracing::warn!(slot = %slot_id, path = %bundled_path, "No filename — skipping");
                continue;
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
    ///
    /// # Errors
    /// Returns [`LoaderError::Internal`] if persisting the assistant
    /// config to its TOML file fails.
    pub async fn set_assistant_name(&self, name: String) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .set_name(&dir, name)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist assistant name: {e}"),
            })
    }

    /// Replace the wake phrase.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] on assistant config persist failure.
    pub async fn set_wake_phrase(&self, phrase: String) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .set_wake_phrase(&dir, phrase)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist wake phrase: {e}"),
            })
    }

    /// Toggle 24/7 wake detection.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] on assistant config persist failure.
    pub async fn set_wake_enabled(&self, enabled: bool) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .set_wake_enabled(&dir, enabled)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist wake enabled: {e}"),
            })
    }

    /// Toggle the 24/7 voice brain.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] on assistant config persist failure.
    pub async fn set_voice_brain_24_7(&self, enabled: bool) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .set_voice_brain_24_7(&dir, enabled)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist voice brain: {e}"),
            })
    }

    /// Replace the TTS voice profile.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] on assistant config persist failure.
    pub async fn set_voice_profile(&self, profile: String) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .set_voice_profile(&dir, profile)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist voice profile: {e}"),
            })
    }

    /// Replace the chat routing mode.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] on assistant config persist failure.
    pub async fn set_routing_mode(&self, mode: String) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .set_routing_mode(&dir, &mode)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist routing mode: {e}"),
            })
    }

    /// Register a new custom voice clone and persist `assistant.toml`.
    ///
    /// The live-TTS-pool refresh that used to follow this persist was
    /// DROPPED with the inference state — the loaded `voice.tts` backend
    /// is Clyffy's now, so the fresh snapshot is pushed over the wire by
    /// the desktop, not here. The persisted config is picked up at the
    /// next (wire) load.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] on assistant config persist failure.
    pub async fn register_voice_clone(&self, entry: VoiceCloneEntry) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .register_voice_clone(&dir, entry)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to register voice clone: {e}"),
            })
    }

    /// Remove a registered voice clone by name and persist `assistant.toml`.
    ///
    /// As with [`Self::register_voice_clone`], the live-TTS-pool refresh is
    /// the wire client's job post-severance.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] if `name` isn't registered or the
    /// assistant config persist fails.
    pub async fn remove_voice_clone(&self, name: &str) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .remove_voice_clone(&dir, name)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to remove voice clone: {e}"),
            })
    }

    /// Add or replace a keyword action.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] on assistant config persist failure.
    pub async fn add_keyword_action(&self, entry: KeywordActionEntry) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .add_keyword_action(&dir, entry)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist keyword action: {e}"),
            })
    }

    /// Remove a keyword action by phrase.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] if `phrase` isn't registered or the
    /// assistant config persist fails.
    pub async fn remove_keyword_action(&self, phrase: &str) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .remove_keyword_action(&dir, phrase)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to remove keyword action: {e}"),
            })
    }

    /// Replace an existing keyword action in place.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] if `phrase` isn't registered or the
    /// assistant config persist fails.
    pub async fn update_keyword_action(
        &self,
        phrase: &str,
        new_entry: KeywordActionEntry,
    ) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .update_keyword_action(&dir, phrase, new_entry)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to update keyword action: {e}"),
            })
    }

    /// Replace the window idle timeout.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] on assistant config persist failure.
    pub async fn set_idle_timeout(&self, secs: u32) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .set_idle_timeout(&dir, secs)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist idle timeout: {e}"),
            })
    }

    /// Replace the partial GPU offload layer count for chat.brain.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] on assistant config persist failure.
    pub async fn set_brain_ngl(&self, ngl: i32) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        let dir = cfg.userdata_dir.clone();
        cfg.assistant
            .set_brain_ngl(&dir, ngl)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist brain ngl: {e}"),
            })
    }

    // ── Secrets mutations — config lock only ──────────────────

    /// Store or replace the `HuggingFace` access token.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] if the secrets store can't be written.
    pub async fn set_hf_token(&self, token: Option<String>) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        cfg.secrets.set_hf_token(token);
        cfg.secrets
            .save(&self.boot.models_dir)
            .map_err(|e| LoaderError::Internal {
                message: format!("Failed to persist HF token: {e}"),
            })?;
        let token_str = cfg.secrets.hf_token().map(String::from);
        let has_token = cfg.secrets.has_hf_token();
        cfg.downloads.set_hf_token(token_str);
        tracing::info!(has_token, "HF token updated");
        Ok(())
    }

    /// Clear the stored HF token.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] on secrets-store persist failure.
    pub async fn clear_hf_token(&self) -> Result<(), LoaderError> {
        self.set_hf_token(None).await
    }

    // ── Download — config lock only ───────────────────────────

    /// Download a model from `HuggingFace`.
    ///
    /// # Errors
    /// Returns [`LoaderError::DownloadFailed`] (with `can_retry = true`)
    /// if the underlying download manager can't initialise the transfer.
    /// Per-byte transfer failures surface later via the event sink.
    pub async fn download_model(
        &self,
        repo_id: &str,
        filename: &str,
        scope: &crate::platform::model_loader::models::DownloadScope,
    ) -> Result<String, LoaderError> {
        let mut cfg = self.config.write().await;
        let handle = cfg
            .downloads
            .start_download(repo_id, filename, scope, &self.boot.events, None)
            .map_err(|e| LoaderError::DownloadFailed {
                reason: e.to_string(),
                can_retry: true,
                bytes_completed: 0,
            })?;
        let id = handle.id.clone();
        tracing::info!(repo = %repo_id, file = %filename, scope = ?scope, download_id = %id, "Download started");
        Ok(id)
    }

    /// Cancel an active download.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] if `download_id` is not in the active set.
    pub async fn cancel_download(&self, download_id: &str) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        cfg.downloads
            .cancel(download_id)
            .map_err(|e| LoaderError::Internal {
                message: e.to_string(),
            })
    }

    /// List every file in a `HuggingFace` repo — the bundle-confirmation
    /// surface. Private / gated repos resolve only when an HF token is
    /// stored via [`Self::set_hf_token`].
    ///
    /// # Errors
    /// [`LoaderError::Internal`] if the HF info call fails (network /
    /// auth / 404) or the response can't be parsed.
    pub async fn list_repo_files(
        &self,
        repo_id: &str,
    ) -> Result<Vec<crate::platform::model_loader::models::download::RepoFileEntry>, LoaderError>
    {
        let cfg = self.config.read().await;
        cfg.downloads
            .list_repo_files(repo_id)
            .map_err(|e| LoaderError::Internal {
                message: e.to_string(),
            })
    }
}

// ── Tests ────────────────────────────────────────────────────────

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::expect_used)] // tests panic on service-construction / lookup failures by design
mod tests {
    use super::*;
    use crate::platform::hardware::lanes::LaneKind;
    use crate::platform::model_loader::models::{
        BackendType, ModelFormat, ModelRegistryEntry, ModelSource,
    };
    use crate::platform::model_loader::slots::{
        DevicePreference, LoadingStrategy, ModelCapability, ModelSourceTier, PersistenceClass,
    };
    use crate::platform::model_loader::traits::config::MemoryConfig;
    use crate::platform::model_loader::traits::events::NullEventSink;

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
            kv_cache: crate::platform::model_loader::slots::KvCacheConfig::default(),
            builtin: true,
        }
    }

    fn fresh_service() -> ModelLoaderService {
        let tmp = std::env::temp_dir().join(format!("devpulse-ml-test-{}", uuid::Uuid::now_v7()));
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
        {
            let mut reg = service.registry.write().await;
            reg.registry.add(entry);
        }

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
        {
            let mut reg = service.registry.write().await;
            reg.registry.add(entry);
        }

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
        {
            let mut reg = service.registry.write().await;
            reg.registry.add(entry);
        }

        let hydrated = service.auto_assign_bundled_slots().await.unwrap();
        assert_eq!(hydrated, 0);

        let slots = service.list_slots().await;
        let slot = slots.iter().find(|s| s.id == "chat.brain").unwrap();
        assert!(slot.assigned_model.is_none());
    }
}
