//! Model Loader service — AI model management, slot assignment, inference.
//!
//! Wraps the self-enclosed `model-loader` crate as a platform service.
//!
//! # Concurrency Model — `RwLock`, reads never block reads
//!
//! The kernel `Inner` type has a proper `&self` / `&mut self` split:
//!
//! - **Reads** (`hardware_metrics`, `list_slots`, `get_registry`,
//!   `auto_configure`, `slot_status`, `inference_handle`, `synthesize`,
//!   `transcribe`, `embed`, `rerank`, etc.) take `&self`.
//!   Wrapped in `spawn_blocking` + `RwLock::blocking_read()`.
//!   Multiple reads proceed concurrently — wizard, devtools, inference
//!   handles all work in parallel.
//!
//! - **Writes** (`load_slot`, `unload_slot`, `scan_models`, `assign_model`,
//!   `swap_model`, `delete_model`, config mutations) take `&mut self`.
//!   Wrapped in `spawn_blocking` + `RwLock::blocking_write()` (sync) or
//!   `RwLock::write().await` (async).
//!
//! This means the "Let's Go" wizard system check (reads hardware, reads
//! presets, reads registry) NEVER blocks on a concurrent model scan or
//! load operation. Only write operations serialize against each other.

use super::model_loader_log::FileEventSink;
use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use crate::platform::integrations::config::{LibSqlConfig, MemoryConfig};
use devpulse_clyffy::model_loader::{
    HardwareMetrics, ModelLoaderService as Inner, ModelRegistryEntry, Slot, SlotStatus, VramBudget,
};
// Typed load-error surface — the single wire type for load-path failures.
// Every slot mutation method converts kernel-internal `LoaderError` or
// `anyhow::Error` into `LoadError` at this boundary so the Tauri command
// layer returns a discriminated union to the frontend instead of a string.
pub use devpulse_clyffy::model_loader::registry::LoadError;
// Re-export for downstream crates (desktop backend) that cannot depend on kernel directly.
pub use devpulse_clyffy::model_loader::AudioSamples;
pub use devpulse_clyffy::model_loader::ModelStatus as SlotModelStatus;
// Auto-config + preset types — used in both signatures and Tauri return values.
pub use devpulse_clyffy::model_loader::{
    AutoConfig, BrainSwapPolicy, HardwareTier, SlotRecommendation,
};
// Wizard SSOT types — copy strings, tier display, semantic roles
pub use devpulse_clyffy::model_loader::{
    ActivateCopy, BrowseCopy, CompletionCopy, CustomizeCopy, GreetingCopy, HardwareCopy,
    ModelsCopy, ProfileCopy, ScanningCopy, StepTooltips, TierDisplay, TierRole, TooltipEntry,
    WizardCopy,
};
// Assistant config — identity, wake, voice brain, keywords, offload
pub use devpulse_clyffy::model_loader::{
    AssistantAction, AssistantConfig, IdentityConfig, KeywordActionEntry, OffloadConfig,
    TtsConfig, VoiceBrainConfig, VoiceCloneEntry, WakeConfig, WindowConfig,
};
// Voice registry — SSOT for TTS voice catalog
pub use devpulse_clyffy::model_loader::{VoiceEntry, VoiceRegistry};
use devpulse_clyffy::cortex::persistence::LibSqlAdapter;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Model Loader service — managed by the platform boot pipeline.
///
/// # Concurrency: `RwLock` — reads never block reads
///
/// The kernel `Inner` type now has proper `&self` / `&mut self` split:
/// - Read methods (`hardware_metrics`, `list_slots`, `get_registry`,
///   `auto_configure`, `list_all_presets`, `config_for_tier`,
///   `is_first_run`, `is_setup_complete`, `slot_status`, `inference_handle`,
///   `vram_budget_plan`, `synthesize`, `transcribe`, `embed`, `rerank`,
///   `encode_image`) take `&self` — use `read()`.
/// - Write methods (`load_slot`, `unload_slot`, `assign_model`,
///   `scan_models`, `swap_model`, `delete_model`, `download_model`,
///   `set_*` config mutations) take `&mut self` — use `write()`.
///
/// This means the wizard system check, hardware polling, devtools reads,
/// and inference handles all proceed concurrently. Only model load/unload
/// and config writes take exclusive access.
pub struct ModelLoaderService {
    inner: Arc<RwLock<Inner>>,
}

impl ModelLoaderService {
    /// Boot the model loader.
    ///
    /// Slots and presets are loaded from kernel SSOT:
    /// - `kernel/model-loader/config/slots.default.toml` — 8 baseline slots
    /// - `kernel/model-loader/config/presets.default.toml` — 6 tier presets
    ///
    /// Both files honour optional user overrides at
    /// `{data_dir}/config/slots.toml` and `{data_dir}/config/presets.toml`.
    /// The engine boot path is a thin wrapper around the kernel loaders —
    /// the engine carries no shadow definitions of its own.
    pub fn boot(
        data_dir: &std::path::Path,
        events: Option<Arc<dyn devpulse_clyffy::model_loader::LoaderEventSink>>,
        models_dir: std::path::PathBuf,
        subdirs: Vec<String>,
        libsql_adapter: Option<Arc<LibSqlAdapter>>,
    ) -> Result<Self> {
        let log_path = data_dir.join("logs").join("model-loader.log");
        let config: Box<dyn devpulse_clyffy::model_loader::ConfigBackend> =
            if let Some(adapter) = libsql_adapter {
                tracing::info!(
                    "Model Loader using LibSQL persistence (assignments survive restarts)"
                );
                Box::new(LibSqlConfig::new(adapter))
            } else {
                tracing::warn!("Model Loader using MemoryConfig (assignments lost on restart)");
                Box::new(MemoryConfig::new())
            };
        let events: Arc<dyn devpulse_clyffy::model_loader::LoaderEventSink> =
            events.unwrap_or_else(|| Arc::new(FileEventSink::new(log_path)));

        // ── Load kernel SSOT ──────────────────────────────────────
        let default_slots =
            devpulse_clyffy::model_loader::load_default_slots(data_dir).map_err(|e| {
                anyhow::anyhow!("Failed to load kernel slot SSOT: {e}")
            })?;
        let presets = devpulse_clyffy::model_loader::load_default_presets(data_dir)
            .map_err(|e| anyhow::anyhow!("Failed to load kernel preset SSOT: {e:?}"))?;
        tracing::info!(
            slots = default_slots.len(),
            presets = presets.len(),
            "Loaded kernel SSOT (slots + presets)"
        );

        let mut service = Inner::new(config, events, models_dir, subdirs, presets)?;

        // Register platform-specific slots
        service.register_slots(default_slots).map_err(|e| {
            anyhow::anyhow!("Failed to register default slots: {e}")
        })?;

        // Initial model scan — populates the registry before restore_assignments.
        match service.scan_models() {
            Ok(count) => {
                tracing::info!(models = count.len(), "Initial model scan complete");
            }
            Err(e) => {
                tracing::warn!(error = %e, "Initial model scan failed (non-fatal)");
            }
        }

        // Restore saved slot assignments.
        if let Err(e) = service.restore_assignments() {
            tracing::warn!(error = %e, "Failed to restore model assignments (non-fatal)");
        }

        // Hydrate bundled slots against the scanned registry.
        match service.auto_assign_bundled_slots() {
            Ok(hydrated) => {
                tracing::info!(
                    hydrated,
                    "Auto-assigned bundled slots to registry entries"
                );
            }
            Err(e) => {
                tracing::warn!(
                    error = %e,
                    "Bundled slot auto-assign failed (non-fatal) — \
                     voice/vision slots will require manual assignment \
                     via the devtool"
                );
            }
        }

        // NOTE: `load_slot` is async — Hot-slot auto-load happens AFTER
        // boot returns, via `auto_load_hot_slots()`.

        Ok(Self {
            inner: Arc::new(RwLock::new(service)),
        })
    }

    // ── Async kernel methods (use lock().await) ───────────────

    /// Proactively load every slot marked `LoadingStrategy::Hot`.
    pub async fn auto_load_hot_slots(&self) -> usize {
        use devpulse_clyffy::model_loader::LoadingStrategy;

        // Snapshot Hot+assigned slots on blocking pool (sync read).
        let targets: Vec<String> = {
            let inner = self.inner.clone();
            tokio::task::spawn_blocking(move || {
                let guard = inner.blocking_read();
                guard
                    .list_slots()
                    .iter()
                    .filter(|s| {
                        matches!(s.loading, LoadingStrategy::Hot) && s.assigned_model.is_some()
                    })
                    .map(|s| s.id.clone())
                    .collect()
            })
            .await
            .expect("auto_load_hot_slots snapshot join")
        };

        // Load each — async because kernel load_slot is async.
        let mut loaded = 0usize;
        for slot_id in targets {
            let result = {
                let mut inner = self.inner.write().await;
                inner.load_slot(&slot_id).await
            };
            match result {
                Ok(()) => {
                    loaded += 1;
                    tracing::info!(slot = %slot_id, "Auto-loaded Hot slot");
                }
                Err(e) => {
                    tracing::warn!(
                        slot = %slot_id,
                        error = %e,
                        "Auto-load failed for Hot slot (non-fatal)"
                    );
                }
            }
        }
        loaded
    }

    /// Load a slot's assigned model into memory (async kernel method).
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn load_slot(&self, slot_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("load_slot");
        let mut inner = self.inner.write().await;
        inner.load_slot(slot_id).await.map_err(LoadError::from)
    }

    /// Unload a slot's model (async kernel method).
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn unload_slot(&self, slot_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("unload_slot");
        let mut inner = self.inner.write().await;
        inner.unload_slot(slot_id).await.map_err(LoadError::from)
    }

    /// Warm a slot — load weights to CPU RAM only, no GPU copy yet (async kernel method).
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn warm_slot(&self, slot_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("warm_slot");
        let mut inner = self.inner.write().await;
        inner.warm_slot(slot_id).await.map_err(LoadError::from)
    }

    /// Delete a model from disk and registry (async kernel method).
    #[tracing::instrument(skip(self), fields(model_id))]
    pub async fn delete_model(&self, model_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("delete_model");
        let mut inner = self.inner.write().await;
        inner.delete_model(model_id).await.map_err(LoadError::from)
    }

    /// Atomically swap the model on a slot (async kernel method).
    #[tracing::instrument(skip(self), fields(slot_id, new_model_id))]
    pub async fn swap_model(
        &self,
        slot_id: &str,
        new_model_id: &str,
    ) -> std::result::Result<(), LoadError> {
        tracing::info!("swap_model");
        let mut inner = self.inner.write().await;
        inner
            .swap_model(slot_id, new_model_id)
            .await
            .map_err(LoadError::from)
    }

    /// Search HuggingFace for GGUF models (stateless HTTP — no lock).
    pub async fn search_huggingface(
        &self,
        query: &str,
        limit: u32,
    ) -> Result<Vec<devpulse_clyffy::model_loader::HfSearchResult>> {
        devpulse_clyffy::model_loader::search_huggingface(query, limit).await
    }

    // ── Sync kernel methods (spawn_blocking + blocking_read/write) ──

    /// Get hardware metrics — read lock, never blocks on writes.
    pub async fn hardware_metrics(&self) -> HardwareMetrics {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.hardware_metrics()
        })
        .await
        .expect("hardware_metrics join")
    }

    /// Force a fresh hardware metrics collection — write lock.
    pub async fn hardware_refresh(&self) -> HardwareMetrics {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard.hardware_refresh()
        })
        .await
        .expect("hardware_refresh join")
    }

    /// Scan models directory — recursive walk + GGUF header parsing.
    pub async fn scan_models(&self) -> Result<Vec<ModelRegistryEntry>> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard.scan_models().map_err(Into::into)
        })
        .await
        .map_err(|e| anyhow::anyhow!("scan_models join: {e}"))?
    }

    /// List all registered slots.
    pub async fn list_slots(&self) -> Vec<Slot> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.list_slots().into_iter().cloned().collect()
        })
        .await
        .expect("list_slots join")
    }

    /// Get status for a specific slot.
    pub async fn slot_status(&self, slot_id: &str) -> SlotStatus {
        let inner = self.inner.clone();
        let slot_id = slot_id.to_string();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.slot_status(&slot_id)
        })
        .await
        .expect("slot_status join")
    }

    /// Assign a model to a slot.
    #[tracing::instrument(skip(self), fields(slot_id, model_id))]
    pub async fn assign_model(
        &self,
        slot_id: &str,
        model_id: &str,
    ) -> std::result::Result<(), LoadError> {
        tracing::info!("assign_model");
        let inner = self.inner.clone();
        let slot_id = slot_id.to_string();
        let model_id = model_id.to_string();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .assign_model(&slot_id, &model_id)
                .map_err(LoadError::from)
        })
        .await
        .expect("assign_model join")
    }

    /// Check if this is the first run.
    pub async fn is_first_run(&self) -> bool {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.is_first_run()
        })
        .await
        .expect("is_first_run join")
    }

    /// Mark the setup wizard as complete. Persists to LibSQL.
    pub async fn mark_setup_complete(&self) -> Result<(), LoadError> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.mark_setup_complete().map_err(|e| LoadError::Other {
                message: format!("Failed to mark setup complete: {e}"),
            })
        })
        .await
        .expect("mark_setup_complete join")
    }

    /// Check if the setup wizard was previously completed.
    pub async fn is_setup_complete(&self) -> bool {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.is_setup_complete()
        })
        .await
        .expect("is_setup_complete join")
    }

    /// Auto-configure based on hardware — read lock, never blocks wizard.
    pub async fn auto_configure(&self) -> AutoConfig {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.auto_configure()
        })
        .await
        .expect("auto_configure join")
    }

    /// List every known hardware preset.
    pub async fn list_all_presets(&self) -> Vec<AutoConfig> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.list_all_presets()
        })
        .await
        .expect("list_all_presets join")
    }

    /// Build the `AutoConfig` for a specific tier.
    pub async fn config_for_tier(&self, tier: HardwareTier) -> AutoConfig {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.config_for_tier(tier)
        })
        .await
        .expect("config_for_tier join")
    }

    /// Start downloading a model from HuggingFace.
    pub async fn download_model(&self, repo_id: &str, filename: &str) -> Result<String> {
        let inner = self.inner.clone();
        let repo_id = repo_id.to_string();
        let filename = filename.to_string();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .download_model(&repo_id, &filename)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("download_model join: {e}"))?
    }

    /// Cancel an active download.
    pub async fn cancel_download(&self, download_id: &str) -> Result<()> {
        let inner = self.inner.clone();
        let download_id = download_id.to_string();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .cancel_download(&download_id)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("cancel_download join: {e}"))?
    }

    /// Persist or replace the stored HuggingFace token. `None` clears it.
    pub async fn set_hf_token(&self, token: Option<String>) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard.set_hf_token(token).map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("set_hf_token join: {e}"))?
    }

    /// Whether an HF token is currently stored.
    pub async fn has_hf_token(&self) -> bool {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.has_hf_token()
        })
        .await
        .expect("has_hf_token join")
    }

    /// Clear the stored HF token.
    pub async fn clear_hf_token(&self) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .clear_hf_token()
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("clear_hf_token join: {e}"))?
    }

    /// Return the last `n` characters of the stored HF token.
    pub async fn hf_token_suffix(&self, n: usize) -> Option<String> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.hf_token_suffix(n)
        })
        .await
        .expect("hf_token_suffix join")
    }

    // ── Assistant Config facade ────────────────────────────────

    /// Snapshot the current assistant configuration.
    pub async fn get_assistant_config(&self) -> AssistantConfig {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.get_assistant_config()
        })
        .await
        .expect("get_assistant_config join")
    }

    /// Rename the assistant.
    pub async fn set_assistant_name(&self, name: String) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .set_assistant_name(name)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("set_assistant_name join: {e}"))?
    }

    /// Replace the wake phrase.
    pub async fn set_wake_phrase(&self, phrase: String) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .set_wake_phrase(phrase)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("set_wake_phrase join: {e}"))?
    }

    /// Toggle 24/7 wake detection.
    pub async fn set_wake_enabled(&self, enabled: bool) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .set_wake_enabled(enabled)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("set_wake_enabled join: {e}"))?
    }

    /// Toggle the 24/7 Moshi voice brain.
    pub async fn set_voice_brain_24_7(&self, enabled: bool) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .set_voice_brain_24_7(enabled)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("set_voice_brain_24_7 join: {e}"))?
    }

    /// Replace the TTS voice profile.
    pub async fn set_voice_profile(&self, profile: String) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .set_voice_profile(profile)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("set_voice_profile join: {e}"))?
    }

    /// Replace the assistant routing mode.
    pub async fn set_routing_mode(&self, mode: String) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .set_routing_mode(mode)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("set_routing_mode join: {e}"))?
    }

    /// Register a new custom voice clone.
    pub async fn register_voice_clone(&self, entry: VoiceCloneEntry) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .register_voice_clone(entry)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("register_voice_clone join: {e}"))?
    }

    /// Remove a registered voice clone by name.
    pub async fn remove_voice_clone(&self, name: String) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .remove_voice_clone(&name)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("remove_voice_clone join: {e}"))?
    }

    /// Add or replace a keyword action.
    pub async fn add_keyword_action(&self, entry: KeywordActionEntry) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .add_keyword_action(entry)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("add_keyword_action join: {e}"))?
    }

    /// Remove a keyword action by phrase.
    pub async fn remove_keyword_action(&self, phrase: String) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .remove_keyword_action(&phrase)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("remove_keyword_action join: {e}"))?
    }

    /// Replace an existing keyword action in place.
    pub async fn update_keyword_action(
        &self,
        phrase: String,
        new_entry: KeywordActionEntry,
    ) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .update_keyword_action(&phrase, new_entry)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("update_keyword_action join: {e}"))?
    }

    /// Replace the window idle timeout in seconds.
    pub async fn set_idle_timeout(&self, secs: u32) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .set_idle_timeout(secs)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("set_idle_timeout join: {e}"))?
    }

    /// Replace the partial GPU offload layer count for `chat.brain`.
    pub async fn set_brain_ngl(&self, ngl: i32) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let mut guard = inner.blocking_write();
            guard
                .set_brain_ngl(ngl)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("set_brain_ngl join: {e}"))?
    }

    /// Absolute path to the custom voice clones directory.
    pub async fn voice_custom_dir(&self) -> std::path::PathBuf {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.voice_custom_dir()
        })
        .await
        .expect("voice_custom_dir join")
    }

    /// Get model registry (without scanning).
    pub async fn get_registry(&self) -> Vec<ModelRegistryEntry> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.get_registry().to_vec()
        })
        .await
        .expect("get_registry join")
    }

    /// Get an inference handle for a slot (resolves fallback chain).
    ///
    /// Returns a cloned handle — caller can use it without holding the lock.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn inference_handle(
        &self,
        slot_id: &str,
    ) -> Result<Option<devpulse_clyffy::model_loader::InferenceHandle>> {
        let inner = self.inner.clone();
        let slot_id = slot_id.to_string();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard
                .inference_handle(&slot_id)
                .map_err(|e| anyhow::anyhow!("{e}"))
        })
        .await
        .map_err(|e| anyhow::anyhow!("inference_handle join: {e}"))?
    }

    /// Compute VRAM budget plan across all slots.
    pub async fn vram_budget_plan(&self) -> VramBudget {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.vram_budget_plan()
        })
        .await
        .expect("vram_budget_plan join")
    }

    // ── Inference (sync but HEAVY — must be on blocking pool) ──

    /// Synthesize speech via the TTS model loaded in a slot.
    #[tracing::instrument(skip(self, text), fields(slot_id, voice, text_len = text.len()))]
    pub async fn synthesize(
        &self,
        slot_id: &str,
        text: &str,
        voice: &str,
    ) -> Result<devpulse_clyffy::model_loader::AudioSamples> {
        let inner = self.inner.clone();
        let slot_id = slot_id.to_string();
        let text = text.to_string();
        let voice = voice.to_string();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard
                .synthesize(&slot_id, &text, &voice)
                .map_err(Into::into)
        })
        .await
        .map_err(|e| anyhow::anyhow!("synthesize join: {e}"))?
    }

    /// Transcribe audio via the STT model loaded in a slot.
    #[tracing::instrument(skip(self, samples), fields(slot_id))]
    pub async fn transcribe(
        &self,
        slot_id: &str,
        samples: &devpulse_clyffy::model_loader::AudioSamples,
    ) -> Result<String> {
        let inner = self.inner.clone();
        let slot_id = slot_id.to_string();
        let samples = samples.clone();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.transcribe(&slot_id, &samples).map_err(Into::into)
        })
        .await
        .map_err(|e| anyhow::anyhow!("transcribe join: {e}"))?
    }

    /// Check if a voice model is loaded in a slot.
    pub async fn voice_loaded(&self, slot_id: &str) -> bool {
        let inner = self.inner.clone();
        let slot_id = slot_id.to_string();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.voice_loaded(&slot_id)
        })
        .await
        .expect("voice_loaded join")
    }

    /// Embed a batch of texts via the embedder model loaded in a slot.
    #[tracing::instrument(skip(self, texts), fields(slot_id, count = texts.len()))]
    pub async fn embed(&self, slot_id: &str, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        let inner = self.inner.clone();
        let slot_id = slot_id.to_string();
        let texts: Vec<String> = texts.iter().map(|t| t.to_string()).collect();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            let refs: Vec<&str> = texts.iter().map(String::as_str).collect();
            guard.embed(&slot_id, &refs).map_err(Into::into)
        })
        .await
        .map_err(|e| anyhow::anyhow!("embed join: {e}"))?
    }

    /// Rerank documents against a query via the reranker model loaded in a slot.
    #[tracing::instrument(skip(self, documents), fields(slot_id, count = documents.len()))]
    pub async fn rerank(
        &self,
        slot_id: &str,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<f32>> {
        let inner = self.inner.clone();
        let slot_id = slot_id.to_string();
        let query = query.to_string();
        let documents: Vec<String> = documents.iter().map(|d| d.to_string()).collect();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            let refs: Vec<&str> = documents.iter().map(String::as_str).collect();
            guard
                .rerank(&slot_id, &query, &refs)
                .map_err(Into::into)
        })
        .await
        .map_err(|e| anyhow::anyhow!("rerank join: {e}"))?
    }

    /// Encode an image file via the vision encoder loaded in a slot.
    #[tracing::instrument(skip(self), fields(slot_id, path))]
    pub async fn encode_image(
        &self,
        slot_id: &str,
        path: &std::path::Path,
    ) -> Result<Vec<f32>> {
        let inner = self.inner.clone();
        let slot_id = slot_id.to_string();
        let path = path.to_path_buf();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard.encode_image(&slot_id, &path).map_err(Into::into)
        })
        .await
        .map_err(|e| anyhow::anyhow!("encode_image join: {e}"))?
    }

    /// Encode raw RGB pixel data via the vision encoder loaded in a slot.
    #[tracing::instrument(skip(self, rgb_bytes), fields(slot_id, width, height))]
    pub async fn encode_rgb(
        &self,
        slot_id: &str,
        rgb_bytes: &[u8],
        width: u32,
        height: u32,
    ) -> Result<Vec<f32>> {
        let inner = self.inner.clone();
        let slot_id = slot_id.to_string();
        let rgb_bytes = rgb_bytes.to_vec();
        tokio::task::spawn_blocking(move || {
            let guard = inner.blocking_read();
            guard
                .encode_rgb(&slot_id, &rgb_bytes, width, height)
                .map_err(Into::into)
        })
        .await
        .map_err(|e| anyhow::anyhow!("encode_rgb join: {e}"))?
    }
}

impl Service for ModelLoaderService {
    fn name(&self) -> &'static str {
        "Model Loader"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::ModelLoader
    }

    async fn ping(&self) -> Result<()> {
        let inner = self.inner.clone();
        tokio::task::spawn_blocking(move || {
            let _guard = inner.blocking_read();
            Ok(())
        })
        .await
        .expect("ping join")
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        tracing::info!("Model Loader shutting down");
        Ok(())
    }
}
