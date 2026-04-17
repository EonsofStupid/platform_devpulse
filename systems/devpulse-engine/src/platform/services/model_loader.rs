//! Model Loader service — AI model management, slot assignment, inference.
//!
//! Wraps the self-enclosed `model-loader` crate as a platform service.
//! Uses `tokio::sync::Mutex` because `ModelLoaderService` methods take `&mut self`
//! and Tauri commands are concurrent.

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use super::model_loader_log::FileEventSink;
use crate::platform::integrations::config::{LibSqlConfig, MemoryConfig};
use devpulse_clyffy::model_loader::{
    HardwareMetrics, ModelLoaderService as Inner,
    ModelRegistryEntry, Slot, SlotStatus, VramBudget,
};
// Typed load-error surface — the single wire type for load-path failures.
// Every slot mutation method converts kernel-internal `LoaderError` or
// `anyhow::Error` into `LoadError` at this boundary so the Tauri command
// layer returns a discriminated union to the frontend instead of a string.
pub use devpulse_clyffy::model_loader::registry::LoadError;
// Re-export for downstream crates (desktop backend) that cannot depend on kernel directly.
pub use devpulse_clyffy::model_loader::ModelStatus as SlotModelStatus;
pub use devpulse_clyffy::model_loader::AudioSamples;
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
use tokio::sync::Mutex;

/// Model Loader service — managed by the platform boot pipeline.
///
/// Uses `Arc<Mutex<Inner>>` so that `scan_models()` can move a clone into
/// `spawn_blocking` — GGUF header parsing is synchronous filesystem I/O and
/// must not run on the async runtime thread (causes "Not Responding" freeze).
pub struct ModelLoaderService {
    inner: Arc<Mutex<Inner>>,
}

impl ModelLoaderService {
    /// Boot the model loader.
    ///
    /// Slots and presets are loaded from kernel SSOT:
    /// - `kernel/model-loader/config/slots.default.toml` → 8 baseline slots
    /// - `kernel/model-loader/config/presets.default.toml` → 6 tier presets
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
                tracing::info!("Model Loader using LibSQL persistence (assignments survive restarts)");
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

        // Initial model scan — populates the registry with every file
        // discoverable under models_dir. This MUST run before
        // restore_assignments so the restore path validates persisted
        // model ids against the fresh registry, not the stale snapshot
        // loaded from registry.json at Inner construction. scan_models
        // generates new UUIDs each run (discover_models creates them);
        // persisted assignments from a prior session are dead ids after
        // a rescan, so restore must see the new registry to clear them
        // and hand the slot back to auto_assign_bundled_slots below.
        match service.scan_models() {
            Ok(count) => {
                tracing::info!(models = count.len(), "Initial model scan complete");
            }
            Err(e) => {
                tracing::warn!(error = %e, "Initial model scan failed (non-fatal)");
            }
        }

        // Restore saved slot assignments. Any persisted id that no
        // longer resolves in the freshly-scanned registry is dropped
        // (restore_assignments deletes the dead config entry) so the
        // slot falls through to auto_assign_bundled_slots.
        if let Err(e) = service.restore_assignments() {
            tracing::warn!(error = %e, "Failed to restore model assignments (non-fatal)");
        }

        // Hydrate bundled slots against the scanned registry. This
        // wires slots whose source_tier = Bundled to their shipped
        // model files so downstream load_slot / synthesize / transcribe
        // calls can actually find them. User assignments persisted via
        // restore_assignments above win — this only fills gaps.
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

        // NOTE on Hot-slot auto-load: `load_slot` is async but `boot()`
        // runs inside spawn_blocking. Async work does not belong here.
        // The caller (`boot/model_loader.rs`) performs the Hot-slot
        // auto-load AFTER spawn_blocking returns, using the async
        // `ModelLoaderService` wrapper that does its own locking.

        Ok(Self {
            inner: Arc::new(Mutex::new(service)),
        })
    }

    /// Proactively load every slot marked `LoadingStrategy::Hot` that
    /// has a model assigned (either via persistence or via the bundled
    /// auto-assign pass in `boot`). Called by the boot caller AFTER
    /// [`ModelLoaderService::boot`] returns, because the inner
    /// `load_slot` is async and `boot` runs inside `spawn_blocking`.
    ///
    /// Iterates all registered slots, filters to the Hot set, and
    /// calls `load_slot` on each. Failures are logged and the loop
    /// continues — boot must not fail just because one bundled file
    /// is corrupt.
    ///
    /// Returns the number of slots that successfully transitioned to
    /// loaded state.
    pub async fn auto_load_hot_slots(&self) -> usize {
        use devpulse_clyffy::model_loader::LoadingStrategy;

        // Snapshot the set of Hot + assigned slots first so we don't
        // hold the lock across an await on load_slot.
        let targets: Vec<String> = {
            let inner = self.inner.lock().await;
            inner
                .list_slots()
                .iter()
                .filter(|s| {
                    matches!(s.loading, LoadingStrategy::Hot)
                        && s.assigned_model.is_some()
                })
                .map(|s| s.id.clone())
                .collect()
        };

        let mut loaded = 0usize;
        for slot_id in targets {
            let result = {
                let mut inner = self.inner.lock().await;
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

    /// Get hardware metrics.
    pub async fn hardware_metrics(&self) -> HardwareMetrics {
        let mut inner = self.inner.lock().await;
        inner.hardware_metrics()
    }

    /// Scan models directory.
    ///
    /// Acquires the async lock first, then runs the blocking filesystem I/O
    /// (GGUF header parsing) while holding it. Using `lock().await` instead
    /// of `spawn_blocking` + `blocking_lock()` prevents deadlocks when other
    /// async methods (list_slots, get_registry) contend on the same Mutex.
    /// The scan takes 1-3 seconds — acceptable on the Tauri async runtime.
    pub async fn scan_models(&self) -> Result<Vec<ModelRegistryEntry>> {
        let mut guard = self.inner.lock().await;
        guard.scan_models().map_err(Into::into)
    }

    /// List all registered slots.
    pub async fn list_slots(&self) -> Vec<Slot> {
        let inner = self.inner.lock().await;
        inner.list_slots().into_iter().cloned().collect()
    }

    /// Get status for a specific slot.
    pub async fn slot_status(&self, slot_id: &str) -> SlotStatus {
        let inner = self.inner.lock().await;
        inner.slot_status(slot_id)
    }

    /// Assign a model to a slot.
    ///
    /// Returns a typed [`LoadError`] on failure. Possible variants:
    /// `SlotNotFound`, `IncompatibleModel`, `ConfigCorrupt`.
    #[tracing::instrument(skip(self), fields(slot_id, model_id))]
    pub async fn assign_model(
        &self,
        slot_id: &str,
        model_id: &str,
    ) -> std::result::Result<(), LoadError> {
        tracing::info!("assign_model");
        let mut inner = self.inner.lock().await;
        inner
            .assign_model(slot_id, model_id)
            .map_err(LoadError::from)
    }

    /// Load a slot's assigned model into memory.
    ///
    /// Returns a typed [`LoadError`] on failure. This is the main
    /// load-path surface: errors here cover every failure mode in
    /// the pipeline — compatibility (`UnknownArchitecture`,
    /// `UnsupportedArchitecture`), filesystem (`ModelFileMissing`,
    /// `ModelCorrupt`, `MissingFile`), resources (`VramInsufficient`,
    /// `RamExhausted`), backend initialisation (`BackendInit`,
    /// `TokenizerLoad`), and slot state (`SlotNotFound`,
    /// `NoModelAssigned`, `AlreadyLoading`).
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn load_slot(&self, slot_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("load_slot");
        let mut inner = self.inner.lock().await;
        inner.load_slot(slot_id).await.map_err(LoadError::from)
    }

    /// Unload a slot's model. Typed errors cover slot state issues.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn unload_slot(&self, slot_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("unload_slot");
        let mut inner = self.inner.lock().await;
        inner.unload_slot(slot_id).await.map_err(LoadError::from)
    }

    /// Warm a slot — load weights to CPU RAM only, no GPU copy yet.
    /// Used for progressive hydration during boot. Typed errors
    /// match [`load_slot`](Self::load_slot).
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn warm_slot(&self, slot_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("warm_slot");
        let mut inner = self.inner.lock().await;
        inner.warm_slot(slot_id).await.map_err(LoadError::from)
    }

    /// Delete a model from disk and registry. Clears slot assignments.
    #[tracing::instrument(skip(self), fields(model_id))]
    pub async fn delete_model(&self, model_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("delete_model");
        let mut inner = self.inner.lock().await;
        inner.delete_model(model_id).await.map_err(LoadError::from)
    }

    /// Check if this is the first run.
    pub async fn is_first_run(&self) -> bool {
        let inner = self.inner.lock().await;
        inner.is_first_run()
    }

    /// Mark the setup wizard as complete. Persists to LibSQL.
    pub async fn mark_setup_complete(&self) -> Result<(), LoadError> {
        let inner = self.inner.lock().await;
        inner
            .mark_setup_complete()
            .map_err(|e| LoadError::Other { message: format!("Failed to mark setup complete: {e}") })
    }

    /// Check if the setup wizard was previously completed.
    pub async fn is_setup_complete(&self) -> bool {
        let inner = self.inner.lock().await;
        inner.is_setup_complete()
    }

    /// Auto-configure based on hardware.
    pub async fn auto_configure(&self) -> AutoConfig {
        let mut inner = self.inner.lock().await;
        inner.auto_configure()
    }

    /// List every known hardware preset — used by the wizard preset picker.
    pub async fn list_all_presets(&self) -> Vec<AutoConfig> {
        let inner = self.inner.lock().await;
        inner.list_all_presets()
    }

    /// Build the `AutoConfig` for a specific tier when the owner manually
    /// selects a non-default preset in the picker.
    pub async fn config_for_tier(&self, tier: HardwareTier) -> AutoConfig {
        let inner = self.inner.lock().await;
        inner.config_for_tier(tier)
    }

    /// Start downloading a model from HuggingFace.
    pub async fn download_model(&self, repo_id: &str, filename: &str) -> Result<String> {
        let mut inner = self.inner.lock().await;
        inner.download_model(repo_id, filename).map_err(|e| {
            anyhow::anyhow!("{e}")
        })
    }

    /// Cancel an active download.
    pub async fn cancel_download(&self, download_id: &str) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.cancel_download(download_id).map_err(|e| {
            anyhow::anyhow!("{e}")
        })
    }

    /// Persist or replace the stored HuggingFace token. `None` clears it.
    pub async fn set_hf_token(&self, token: Option<String>) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.set_hf_token(token).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Whether an HF token is currently stored.
    pub async fn has_hf_token(&self) -> bool {
        let inner = self.inner.lock().await;
        inner.has_hf_token()
    }

    /// Clear the stored HF token.
    pub async fn clear_hf_token(&self) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.clear_hf_token().map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Return the last `n` characters of the stored HF token, for
    /// the devtool "masked pill" display. `None` if no token stored.
    pub async fn hf_token_suffix(&self, n: usize) -> Option<String> {
        let inner = self.inner.lock().await;
        inner.hf_token_suffix(n)
    }

    // ── Assistant Config facade ────────────────────────────────

    /// Snapshot the current assistant configuration.
    pub async fn get_assistant_config(&self) -> AssistantConfig {
        let inner = self.inner.lock().await;
        inner.get_assistant_config()
    }

    /// Rename the assistant.
    pub async fn set_assistant_name(&self, name: String) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.set_assistant_name(name).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Replace the wake phrase.
    pub async fn set_wake_phrase(&self, phrase: String) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.set_wake_phrase(phrase).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Toggle 24/7 wake detection.
    pub async fn set_wake_enabled(&self, enabled: bool) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.set_wake_enabled(enabled).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Toggle the 24/7 Moshi voice brain.
    pub async fn set_voice_brain_24_7(&self, enabled: bool) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.set_voice_brain_24_7(enabled).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Replace the TTS voice profile.
    pub async fn set_voice_profile(&self, profile: String) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.set_voice_profile(profile).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Register a new custom voice clone.
    pub async fn register_voice_clone(&self, entry: VoiceCloneEntry) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.register_voice_clone(entry).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Remove a registered voice clone by name.
    pub async fn remove_voice_clone(&self, name: String) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.remove_voice_clone(&name).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Add or replace a keyword action.
    pub async fn add_keyword_action(&self, entry: KeywordActionEntry) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.add_keyword_action(entry).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Remove a keyword action by phrase.
    pub async fn remove_keyword_action(&self, phrase: String) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.remove_keyword_action(&phrase).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Replace an existing keyword action in place.
    pub async fn update_keyword_action(
        &self,
        phrase: String,
        new_entry: KeywordActionEntry,
    ) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner
            .update_keyword_action(&phrase, new_entry)
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Replace the window idle timeout in seconds.
    pub async fn set_idle_timeout(&self, secs: u32) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.set_idle_timeout(secs).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Replace the partial GPU offload layer count for `chat.brain`.
    pub async fn set_brain_ngl(&self, ngl: i32) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.set_brain_ngl(ngl).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Absolute path to the custom voice clones directory. Used by
    /// `upload_voice_sample` to place incoming MP3 files on disk.
    pub async fn voice_custom_dir(&self) -> std::path::PathBuf {
        let inner = self.inner.lock().await;
        inner.voice_custom_dir()
    }

    /// Get model registry (without scanning).
    pub async fn get_registry(&self) -> Vec<ModelRegistryEntry> {
        let inner = self.inner.lock().await;
        inner.get_registry().to_vec()
    }

    /// Atomically swap the model on a slot (unload → reassign → load).
    ///
    /// Blocks inference to the slot for the entire duration via SwapGuard.
    /// Returns a typed [`LoadError`] — swaps can fail at any step
    /// (assign, unload, load) and the variant reflects where.
    #[tracing::instrument(skip(self), fields(slot_id, new_model_id))]
    pub async fn swap_model(
        &self,
        slot_id: &str,
        new_model_id: &str,
    ) -> std::result::Result<(), LoadError> {
        tracing::info!("swap_model");
        let mut inner = self.inner.lock().await;
        inner
            .swap_model(slot_id, new_model_id)
            .await
            .map_err(LoadError::from)
    }

    /// Get an inference handle for a slot (resolves fallback chain).
    ///
    /// Returns a cloned handle — caller can use it without holding the Mutex.
    /// This is critical: generation is long-running, we must NOT hold the lock.
    /// Returns `Err` if the slot is mid-swap.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn inference_handle(
        &self,
        slot_id: &str,
    ) -> Result<Option<devpulse_clyffy::model_loader::InferenceHandle>> {
        let inner = self.inner.lock().await;
        inner.inference_handle(slot_id).map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Compute VRAM budget plan across all slots.
    pub async fn vram_budget_plan(&self) -> VramBudget {
        let mut inner = self.inner.lock().await;
        inner.vram_budget_plan()
    }

    /// Search HuggingFace for GGUF models.
    ///
    /// Does NOT hold the Mutex — search is a stateless HTTP call.
    /// Holding the lock across a 15s network timeout would freeze
    /// every other model loader command.
    pub async fn search_huggingface(
        &self,
        query: &str,
        limit: u32,
    ) -> Result<Vec<devpulse_clyffy::model_loader::HfSearchResult>> {
        devpulse_clyffy::model_loader::search_huggingface(query, limit).await
    }

    /// Synthesize speech via the TTS model loaded in a slot.
    #[tracing::instrument(skip(self, text), fields(slot_id, voice, text_len = text.len()))]
    pub async fn synthesize(
        &self,
        slot_id: &str,
        text: &str,
        voice: &str,
    ) -> Result<devpulse_clyffy::model_loader::AudioSamples> {
        let inner = self.inner.lock().await;
        inner.synthesize(slot_id, text, voice).map_err(Into::into)
    }

    /// Transcribe audio via the STT model loaded in a slot.
    #[tracing::instrument(skip(self, samples), fields(slot_id))]
    pub async fn transcribe(
        &self,
        slot_id: &str,
        samples: &devpulse_clyffy::model_loader::AudioSamples,
    ) -> Result<String> {
        let inner = self.inner.lock().await;
        inner.transcribe(slot_id, samples).map_err(Into::into)
    }

    /// Check if a voice model is loaded in a slot.
    pub async fn voice_loaded(&self, slot_id: &str) -> bool {
        let inner = self.inner.lock().await;
        inner.voice_loaded(slot_id)
    }

    /// Embed a batch of texts via the embedder model loaded in a slot.
    #[tracing::instrument(skip(self, texts), fields(slot_id, count = texts.len()))]
    pub async fn embed(&self, slot_id: &str, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        let inner = self.inner.lock().await;
        inner.embed(slot_id, texts).map_err(Into::into)
    }

    /// Rerank documents against a query via the reranker model loaded in a slot.
    #[tracing::instrument(skip(self, documents), fields(slot_id, count = documents.len()))]
    pub async fn rerank(
        &self,
        slot_id: &str,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<f32>> {
        let inner = self.inner.lock().await;
        inner.rerank(slot_id, query, documents).map_err(Into::into)
    }

    /// Encode an image file via the vision encoder loaded in a slot.
    #[tracing::instrument(skip(self), fields(slot_id, path))]
    pub async fn encode_image(
        &self,
        slot_id: &str,
        path: &std::path::Path,
    ) -> Result<Vec<f32>> {
        let inner = self.inner.lock().await;
        inner.encode_image(slot_id, path).map_err(Into::into)
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
        let inner = self.inner.lock().await;
        inner
            .encode_rgb(slot_id, rgb_bytes, width, height)
            .map_err(Into::into)
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
        // Verify we can access the inner service
        let _inner = self.inner.lock().await;
        Ok(())
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        tracing::info!("Model Loader shutting down");
        // Future: unload all models, flush pool
        Ok(())
    }
}
