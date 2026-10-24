//! Model Loader service — AI model management, slot assignment, inference.
//!
//! Thin passthrough over the kernel `ModelLoaderService`, which manages its
//! own fine-grained interior locks. This wrapper adds NO locks of its own.
//!
//! # Concurrency (delegated to kernel)
//!
//! The kernel splits state into 4 sub-structs with independent locks:
//! - **`InferenceState`** (write only during load/unload/warm/swap)
//! - **`RegistryState`** (write only during scan)
//! - **`ConfigState`** (write only during assign/config changes)
//! - **`BootState`** (immutable after boot, no lock)
//! - **`HardwareMonitor`** (`parking_lot` `RwLock` for cache reads)
//!
//! Reads of any sub-struct proceed concurrently with writes of any other.
//! Only loading a model into GPU/CPU memory takes the exclusive inference lock.

use super::model_loader_log::FileEventSink;
use super::{Service, ServiceRole, ServiceState};
use crate::platform::integrations::config::{MemoryConfig, TursoConfig};
use crate::signals::{ModelsReadiness, Signal, SignalSource, SignalVariant};
use anyhow::Result;
use devpulse_clyffy::cortex::persistence::TursoAdapter;
pub use devpulse_clyffy::model_loader::registry::LoadError;
pub use devpulse_clyffy::model_loader::wizard::analytics::emit_event as emit_analytics_event;
pub use devpulse_clyffy::model_loader::AudioSamples;
pub use devpulse_clyffy::model_loader::DownloadScope as ModelDownloadScope;
pub use devpulse_clyffy::model_loader::ModelStatus as SlotModelStatus;
pub use devpulse_clyffy::model_loader::{
    ActivateCopy, AnalyticsEvent, BrowseCopy, CompletionCopy, CustomizeCopy, GreetingCopy,
    HardwareCopy, ModelsCopy, ProfileCopy, RuntimePickerCopy, ScanningCopy, StepTooltips,
    TierDisplay, TierRole, TooltipEntry, WizardCopy,
};
pub use devpulse_clyffy::model_loader::{
    AssistantAction, AssistantConfig, IdentityConfig, KeywordActionEntry, OffloadConfig, TtsConfig,
    VoiceBrainConfig, VoiceCloneEntry, WakeConfig, WindowConfig,
};
pub use devpulse_clyffy::model_loader::{
    AutoConfig, BrainSwapPolicy, HardwareTier, SlotRecommendation,
};
use devpulse_clyffy::model_loader::{
    DownloadScope, HardwareMetrics, ModelLoaderService as Inner, ModelRegistryEntry, Slot,
    SlotStatus, VramBudget,
};
pub use devpulse_clyffy::model_loader::{RebindReason, RuntimeFingerprint};
pub use devpulse_clyffy::model_loader::{VoiceEntry, VoiceRegistry};
use std::sync::Arc;

/// Model Loader service — managed by the platform boot pipeline.
///
/// The kernel `Inner` owns all concurrency. This wrapper just holds an
/// `Arc<Inner>` and forwards calls. No outer `RwLock` exists. It also
/// owns models readiness and publishes it on the signal fabric.
pub struct ModelLoaderService {
    inner: Arc<Inner>,
    signals: crate::Engine,
}

// Engineering judgment: this `impl` block is a ~40-function thin
// passthrough over `devpulse_clyffy::model_loader::ModelLoaderService`.
// Every public method here forwards to a kernel method whose docs hold
// the canonical `# Errors` semantics. Duplicating those sections on
// each wrapper would create documentation that drifts the moment the
// kernel error surface changes. We satisfy the workspace
// `missing_errors_doc` policy with a documented block-scope `#[expect]`
// per the workspace pattern (matches the per-site suppressions the
// strict-foundation-engineer added across xtask + clyffy in the same
// PR). Re-tighten by porting full doc sections per-method only when a
// wrapper diverges from the kernel by wrapping its own error type.
#[expect(
    clippy::missing_errors_doc,
    reason = "thin passthrough; canonical # Errors docs live on devpulse_clyffy::model_loader::ModelLoaderService::* methods these forward to"
)]
impl ModelLoaderService {
    /// Boot the model loader.
    pub fn boot(
        data_dir: &std::path::Path,
        signals: crate::Engine,
        events: Option<Arc<dyn devpulse_clyffy::model_loader::LoaderEventSink>>,
        models_dir: std::path::PathBuf,
        subdirs: Vec<String>,
        turso_adapter: Option<Arc<TursoAdapter>>,
        burn_encoder_adapter: Option<
            devpulse_clyffy::model_loader::backends::burn_adapter::BurnEncoderAdapterArc,
        >,
    ) -> Result<(Self, Vec<Slot>)> {
        let log_path = data_dir.join("logs").join("model-loader.log");
        let config: Box<dyn devpulse_clyffy::model_loader::ConfigBackend> = if let Some(adapter) =
            turso_adapter
        {
            tracing::info!("Model Loader using Turso persistence (assignments survive restarts)");
            Box::new(TursoConfig::new(adapter))
        } else {
            tracing::warn!("Model Loader using MemoryConfig (assignments lost on restart)");
            Box::new(MemoryConfig::new())
        };
        let events: Arc<dyn devpulse_clyffy::model_loader::LoaderEventSink> =
            events.unwrap_or_else(|| Arc::new(FileEventSink::new(log_path)));

        let default_slots = devpulse_clyffy::model_loader::load_default_slots(data_dir)
            .map_err(|e| anyhow::anyhow!("Failed to load kernel slot SSOT: {e}"))?;
        let presets = devpulse_clyffy::model_loader::load_default_presets(data_dir)
            .map_err(|e| anyhow::anyhow!("Failed to load kernel preset SSOT: {e:?}"))?;
        tracing::info!(
            slots = default_slots.len(),
            presets = presets.len(),
            burn_encoder_wired = burn_encoder_adapter.is_some(),
            "Loaded kernel SSOT (slots + presets)"
        );

        // `Inner::new()` returns a Clone-able service (all fields Arc).
        // We wrap in Arc for engine-side sharing but the kernel already
        // manages per-sub-struct locking internally. The kernel gets the
        // data dir itself — slot links, overrides and secrets live there.
        let service = Inner::new(
            config,
            events,
            data_dir.to_path_buf(),
            models_dir,
            subdirs,
            presets,
            burn_encoder_adapter,
        )?;

        Ok((
            Self {
                inner: Arc::new(service),
                signals,
            },
            default_slots,
        ))
    }

    /// Models readiness — the one place it is computed. Ready means setup
    /// is complete AND at least one model is registered AND at least one
    /// slot has a model assigned. Every window renders this value; none
    /// recomputes it.
    pub async fn readiness(&self) -> ModelsReadiness {
        let slots = self.list_slots().await;
        let model_count = self.get_registry().await.len();
        let assigned_count = slots.iter().filter(|s| s.assigned_model.is_some()).count();
        let setup_complete = self.is_setup_complete().await;
        ModelsReadiness {
            ready: setup_complete && model_count > 0 && assigned_count > 0,
            setup_complete,
            first_run: self.is_first_run().await,
            model_count: u32::try_from(model_count).unwrap_or(u32::MAX),
            slot_count: u32::try_from(slots.len()).unwrap_or(u32::MAX),
            assigned_count: u32::try_from(assigned_count).unwrap_or(u32::MAX),
        }
    }

    /// Publish the current readiness as a `models` state signal. Called
    /// after the background registry scan and after every slot or registry
    /// change. Returns what was published.
    pub async fn publish_readiness(&self) -> ModelsReadiness {
        let readiness = self.readiness().await;
        tracing::info!(?readiness, "models readiness published");
        self.signals.emit(Signal::new(
            SignalSource::System,
            SignalVariant::Models(readiness.clone()),
        ));
        readiness
    }

    /// Clone the underlying kernel service for embedder-bridge construction.
    ///
    /// The kernel `ModelLoaderService` is `#[derive(Clone)]` over internal
    /// `Arc`s, so the clone shares state with this wrapper — no extra
    /// pool, no extra lock acquisition. Used by the suggestion service
    /// builder to wire `ChatSuggestEmbedder` against the same loaded
    /// slots the engine already manages.
    #[must_use]
    pub fn kernel_clone(&self) -> Inner {
        (*self.inner).clone()
    }

    /// Fast path: register slots only. Instant in-memory operation.
    ///
    /// This MUST complete before boot returns so other services can query
    /// slot metadata. No filesystem I/O here.
    #[tracing::instrument(skip_all, fields(count = default_slots.len()), err)]
    pub async fn register_slots_only(&self, default_slots: Vec<Slot>) -> Result<()> {
        tracing::info!("register_slots_only");
        self.inner
            .register_slots(default_slots)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to register default slots: {e}"))
    }

    /// Slow path: scan models directory, restore assignments, auto-assign
    /// bundled slots. Runs in a DETACHED background task — never awaited
    /// by the boot pipeline.
    ///
    /// The kernel `scan_models` is async and uses
    /// [`tokio::task::block_in_place`] internally for the IO-heavy
    /// filesystem walk + GGUF header parsing, so the runtime keeps
    /// servicing IPC commands, window events, hardware polls, and the
    /// frontend spinner animation while the scan progresses.
    ///
    /// Scan progress is observable via `RegistryScanStarted` /
    /// `ModelDiscovered` / `RegistryScanComplete` events on the event sink.
    #[tracing::instrument(skip_all, err)]
    pub async fn finalize_registry(&self) -> Result<()> {
        tracing::info!("finalize_registry: scan");
        match self.inner.scan_models().await {
            Ok(entries) => {
                tracing::info!(models = entries.len(), "finalize_registry: scan complete");
            }
            Err(e) => tracing::warn!(error = %e, "finalize_registry: scan failed (non-fatal)"),
        }

        tracing::info!("finalize_registry: restoring persisted assignments");
        if let Err(e) = self.inner.restore_assignments().await {
            tracing::warn!(error = %e, "finalize_registry: restore_assignments failed (non-fatal)");
        }

        tracing::info!("finalize_registry: auto-assigning bundled slots");
        match self.inner.auto_assign_bundled_slots().await {
            Ok(hydrated) => tracing::info!(hydrated, "finalize_registry: bundled slots assigned"),
            Err(e) => {
                tracing::warn!(error = %e, "finalize_registry: bundled auto-assign failed (non-fatal)");
            }
        }

        Ok(())
    }

    // ── Load/unload/warm/swap/delete — inference lock ─────────
    //
    // Note: `auto_load_hot_slots` facade was REMOVED on 2026-04-20. Boot no
    // longer triggers background loads. Every `load_slot` call below is
    // driven by a user action (Tauri command invoked from a button click).

    /// Load the assigned model for a slot into memory.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn load_slot(&self, slot_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("load_slot");
        self.inner.load_slot(slot_id).await.map_err(LoadError::from)
    }

    /// Unload the currently loaded model for a slot.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn unload_slot(&self, slot_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("unload_slot");
        self.inner
            .unload_slot(slot_id)
            .await
            .map_err(LoadError::from)
    }

    /// Warm a slot by loading weights without fully activating inference.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn warm_slot(&self, slot_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("warm_slot");
        self.inner.warm_slot(slot_id).await.map_err(LoadError::from)
    }

    /// Delete a model from disk and remove it from the registry.
    #[tracing::instrument(skip(self), fields(model_id))]
    pub async fn delete_model(&self, model_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("delete_model");
        self.inner
            .delete_model(model_id)
            .await
            .map_err(LoadError::from)
    }

    /// Atomically replace the assigned model on a slot.
    #[tracing::instrument(skip(self), fields(slot_id, new_model_id))]
    pub async fn swap_model(
        &self,
        slot_id: &str,
        new_model_id: &str,
    ) -> std::result::Result<(), LoadError> {
        tracing::info!("swap_model");
        self.inner
            .swap_model(slot_id, new_model_id)
            .await
            .map_err(LoadError::from)
    }

    // ── HF search (stateless HTTP) ────────────────────────────

    /// Search Hugging Face for models matching the given query.
    pub async fn search_huggingface(
        &self,
        query: &str,
        limit: u32,
    ) -> Result<Vec<devpulse_clyffy::model_loader::HfSearchResult>, LoadError> {
        self.inner
            .search_huggingface(query, limit)
            .await
            .map_err(LoadError::from)
    }

    // ── Hardware (parking_lot, sub-microsecond) ───────────────

    /// Return the cached hardware metrics snapshot.
    ///
    /// Stays `async` because live-probe work (polling GPU counters, temperature
    /// sensors, nvml queries) will be wired into the inner implementation
    /// without changing this contract. Callers stay at `.await?` so the
    /// command-layer surface doesn't churn when that lands.
    #[allow(clippy::unused_async)]
    pub async fn hardware_metrics(&self) -> HardwareMetrics {
        self.inner.hardware_metrics()
    }

    /// Force a fresh hardware metrics refresh.
    ///
    /// See [`hardware_metrics`](Self::hardware_metrics) — the `async`
    /// signature is a forward-compat contract for real hardware probing.
    #[allow(clippy::unused_async)]
    pub async fn hardware_refresh(&self) -> HardwareMetrics {
        self.inner.hardware_refresh()
    }

    /// Start the kernel hardware sampler: one collection every `period`
    /// while `active` is `true` (some window is watching hardware), each
    /// published through the loader's event sink.
    pub fn spawn_hardware_sampler(
        &self,
        period: std::time::Duration,
        active: tokio::sync::watch::Receiver<bool>,
    ) {
        self.inner.spawn_hardware_sampler(period, active);
    }

    // ── Registry write (scan) ────────────────────────────────

    /// Scan the models directory and return the updated registry entries.
    ///
    /// The kernel `scan_models` is async — its CPU/IO heavy section
    /// (filesystem walk + GGUF header parsing) runs inside
    /// [`tokio::task::block_in_place`] so the multi-threaded runtime
    /// keeps servicing IPC commands, hardware polls, and the frontend
    /// spinner.
    pub async fn scan_models(&self) -> Result<Vec<ModelRegistryEntry>, LoadError> {
        self.inner.scan_models().await.map_err(LoadError::from)
    }

    // ── Reads (concurrent, never block) ──────────────────────

    /// List every registered slot with its current assignment metadata.
    pub async fn list_slots(&self) -> Vec<Slot> {
        self.inner.list_slots().await
    }

    /// Return runtime status information for a single slot.
    pub async fn slot_status(&self, slot_id: &str) -> SlotStatus {
        self.inner.slot_status(slot_id).await
    }

    /// Persist a model assignment for the given slot.
    #[tracing::instrument(skip(self), fields(slot_id, model_id))]
    pub async fn assign_model(
        &self,
        slot_id: &str,
        model_id: &str,
    ) -> std::result::Result<(), LoadError> {
        tracing::info!("assign_model");
        self.inner
            .assign_model(slot_id, model_id)
            .await
            .map_err(LoadError::from)
    }

    /// Clear the persisted assignment on the given slot — leaves the
    /// underlying model loaded (if any), but removes the slot's binding
    /// so subsequent inference routes hard-fail until a new
    /// `assign_model` lands. Pairs with `unload_slot` when callers want
    /// to fully retract a slot (load → reassign happens elsewhere).
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn unassign_slot(&self, slot_id: &str) -> std::result::Result<(), LoadError> {
        tracing::info!("unassign_slot");
        self.inner
            .unassign_slot(slot_id)
            .await
            .map_err(LoadError::from)
    }

    /// Return whether the loader has any persisted slot assignments yet.
    pub async fn is_first_run(&self) -> bool {
        self.inner.is_first_run().await
    }

    /// Persist the setup-complete flag after onboarding succeeds.
    pub async fn mark_setup_complete(&self) -> Result<(), LoadError> {
        self.inner
            .mark_setup_complete()
            .await
            .map_err(|e| LoadError::Other {
                message: format!("Failed to mark setup complete: {e}"),
            })
    }

    /// Return whether the setup-complete flag has been persisted.
    pub async fn is_setup_complete(&self) -> bool {
        self.inner.is_setup_complete().await
    }

    /// Build the recommended configuration for the detected hardware.
    pub async fn auto_configure(&self) -> AutoConfig {
        self.inner.auto_configure().await
    }

    /// List every known hardware preset with download metadata.
    pub async fn list_all_presets(&self) -> Vec<AutoConfig> {
        self.inner.list_all_presets().await
    }

    /// Build the preset-backed configuration for a specific hardware tier.
    pub async fn config_for_tier(&self, tier: HardwareTier) -> AutoConfig {
        self.inner.config_for_tier(tier).await
    }

    // ── Downloads (config lock) ──────────────────────────────

    /// Start a model download and return its download identifier.
    ///
    /// `scope` decides where the bundle lands on disk:
    ///   - [`DownloadScope::Global`] — shared `<models_dir>/<owner>/<repo>/`
    ///   - [`DownloadScope::Project(id)`] — per-project subtree
    ///
    /// See `devpulse-clyffy::model_loader::scope` for the full layout
    /// contract and path-safety rules.
    pub async fn download_model(
        &self,
        repo_id: &str,
        filename: &str,
        scope: &DownloadScope,
    ) -> Result<String> {
        self.inner
            .download_model(repo_id, filename, scope)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// On-disk directory where downloaded models live. UI shows this
    /// so a layman can drop existing model bundles in by hand or
    /// symlink them in without touching the wizard.
    #[must_use]
    pub fn models_dir(&self) -> std::path::PathBuf {
        self.inner.models_dir().to_path_buf()
    }

    /// Recommend the primary entry-point filename inside `repo_id`
    /// for the slot `slot_id`. Uses tier-aware format heuristics so
    /// the UI hands this directly to `install_to_slot`; the user
    /// never picks a quant or a shard manually.
    pub async fn recommend_primary_for_slot(
        &self,
        repo_id: &str,
        slot_id: &str,
    ) -> Result<Option<String>> {
        self.inner
            .recommend_primary_for_slot(repo_id, slot_id)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// One-button install — composes `download_model`, `scan_models`,
    /// `assign_model`, and `load_slot` into one atomic verb. Returns
    /// the install identifier as soon as the download starts; the
    /// chain runs in a detached task and surfaces progress via the
    /// `InstallStarted` / `InstallComplete` / `InstallFailed` events.
    ///
    /// `scope` decides where the bundle lands — see
    /// [`download_model`](Self::download_model) for the layout contract.
    pub async fn install_to_slot(
        &self,
        repo_id: &str,
        primary_filename: &str,
        slot_id: &str,
        scope: &DownloadScope,
    ) -> Result<String> {
        self.inner
            .install_to_slot(repo_id, primary_filename, slot_id, scope)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Cancel an active download by identifier.
    pub async fn cancel_download(&self, download_id: &str) -> Result<()> {
        self.inner
            .cancel_download(download_id)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// List every file in a `HuggingFace` repo, threaded through any
    /// stored HF token. Used by the frontend `RepoDownloadButton` to
    /// render a bundle confirmation modal before a user commits to a
    /// download.
    pub async fn list_repo_files(
        &self,
        repo_id: &str,
    ) -> Result<Vec<devpulse_clyffy::model_loader::models::download::RepoFileEntry>> {
        self.inner
            .list_repo_files(repo_id)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    // ── HF token (config lock) ───────────────────────────────

    /// Persist or clear the stored Hugging Face token.
    pub async fn set_hf_token(&self, token: Option<String>) -> Result<()> {
        self.inner
            .set_hf_token(token)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Return whether a Hugging Face token is currently stored.
    pub async fn has_hf_token(&self) -> bool {
        self.inner.has_hf_token().await
    }

    /// Remove the stored Hugging Face token.
    pub async fn clear_hf_token(&self) -> Result<()> {
        self.inner
            .clear_hf_token()
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Return the last `n` characters of the stored Hugging Face token.
    pub async fn hf_token_suffix(&self, n: usize) -> Option<String> {
        self.inner.hf_token_suffix(n).await
    }

    // ── Assistant config (config lock) ───────────────────────

    /// Snapshot the persisted assistant configuration.
    pub async fn get_assistant_config(&self) -> AssistantConfig {
        self.inner.get_assistant_config().await
    }

    /// Persist a new assistant display name.
    pub async fn set_assistant_name(&self, name: String) -> Result<()> {
        self.inner
            .set_assistant_name(name)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Persist a new wake phrase.
    pub async fn set_wake_phrase(&self, phrase: String) -> Result<()> {
        self.inner
            .set_wake_phrase(phrase)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Enable or disable wake phrase detection.
    pub async fn set_wake_enabled(&self, enabled: bool) -> Result<()> {
        self.inner
            .set_wake_enabled(enabled)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Enable or disable the always-on voice brain mode.
    pub async fn set_voice_brain_24_7(&self, enabled: bool) -> Result<()> {
        self.inner
            .set_voice_brain_24_7(enabled)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Persist the selected TTS voice profile.
    pub async fn set_voice_profile(&self, profile: String) -> Result<()> {
        self.inner
            .set_voice_profile(profile)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Persist the active routing mode.
    #[tracing::instrument(skip(self), fields(mode = %mode), err)]
    pub async fn set_routing_mode(&self, mode: String) -> Result<()> {
        tracing::info!("set_routing_mode");
        self.inner
            .set_routing_mode(mode)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Snapshot every slot's currently-cached runtime fingerprint.
    ///
    /// Used by the frontend `capabilityChannel` store on mount to
    /// hydrate "what's loaded right now" before the first
    /// `LoaderEvent::CapabilityRebound` event streams in.
    pub async fn list_runtime_fingerprints(
        &self,
    ) -> std::collections::HashMap<String, RuntimeFingerprint> {
        self.inner.list_runtime_fingerprints().await
    }

    /// Register a custom voice clone entry.
    pub async fn register_voice_clone(&self, entry: VoiceCloneEntry) -> Result<()> {
        self.inner
            .register_voice_clone(entry)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Remove a custom voice clone by name.
    pub async fn remove_voice_clone(&self, name: String) -> Result<()> {
        self.inner
            .remove_voice_clone(&name)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Add a keyword-triggered assistant action.
    pub async fn add_keyword_action(&self, entry: KeywordActionEntry) -> Result<()> {
        self.inner
            .add_keyword_action(entry)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Remove a keyword-triggered action by phrase.
    pub async fn remove_keyword_action(&self, phrase: String) -> Result<()> {
        self.inner
            .remove_keyword_action(&phrase)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Update an existing keyword-triggered action in place.
    pub async fn update_keyword_action(
        &self,
        phrase: String,
        new_entry: KeywordActionEntry,
    ) -> Result<()> {
        self.inner
            .update_keyword_action(&phrase, new_entry)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Persist the idle timeout used by the assistant window behavior.
    pub async fn set_idle_timeout(&self, secs: u32) -> Result<()> {
        self.inner
            .set_idle_timeout(secs)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Persist the partial GPU offload hint for the chat brain.
    pub async fn set_brain_ngl(&self, ngl: i32) -> Result<()> {
        self.inner
            .set_brain_ngl(ngl)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Return the directory used for custom voice assets.
    pub fn voice_custom_dir(&self) -> std::path::PathBuf {
        self.inner.voice_custom_dir()
    }

    /// Return the current model registry without triggering a scan.
    pub async fn get_registry(&self) -> Vec<ModelRegistryEntry> {
        self.inner.get_registry().await
    }

    // ── Inference reads ──────────────────────────────────────

    /// Return the active inference handle for a slot, if one exists.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn inference_handle(
        &self,
        slot_id: &str,
    ) -> Result<Option<devpulse_clyffy::model_loader::InferenceHandle>> {
        self.inner
            .inference_handle(slot_id)
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))
    }

    /// Compute the current VRAM budget plan across registered slots.
    pub async fn vram_budget_plan(&self) -> VramBudget {
        self.inner.vram_budget_plan().await
    }

    // ── Heavy inference calls (voice_pool reads) ──────────────

    /// Synthesize audio samples from text through the TTS slot.
    #[tracing::instrument(skip(self, text), fields(slot_id, voice, text_len = text.len()))]
    pub async fn synthesize(
        &self,
        slot_id: &str,
        text: &str,
        voice: &str,
    ) -> Result<devpulse_clyffy::model_loader::AudioSamples, LoadError> {
        self.inner
            .synthesize(slot_id, text, voice)
            .await
            .map_err(LoadError::from)
    }

    /// Transcribe audio samples through the STT slot.
    #[tracing::instrument(skip(self, samples), fields(slot_id))]
    pub async fn transcribe(
        &self,
        slot_id: &str,
        samples: &devpulse_clyffy::model_loader::AudioSamples,
    ) -> Result<String, LoadError> {
        self.inner
            .transcribe(slot_id, samples)
            .await
            .map_err(LoadError::from)
    }

    /// Return whether a voice-capable slot currently has a loaded model.
    pub async fn voice_loaded(&self, slot_id: &str) -> bool {
        self.inner.voice_loaded(slot_id).await
    }

    /// Embed a batch of texts through the embedding slot.
    #[tracing::instrument(skip(self, texts), fields(slot_id, count = texts.len()))]
    pub async fn embed(&self, slot_id: &str, texts: &[&str]) -> Result<Vec<Vec<f32>>, LoadError> {
        self.inner
            .embed(slot_id, texts)
            .await
            .map_err(LoadError::from)
    }

    /// `true` when the Burn encoder is wired AND its weights are loaded.
    /// Used by Tauri command surfaces to gate inference-trigger UI without
    /// having to interpret slot status structs.
    #[must_use]
    pub fn burn_is_loaded(&self) -> bool {
        self.inner.burn_is_loaded()
    }

    /// Embed a batch of texts through the Burn encoder (no slot dispatch).
    ///
    /// The Burn encoder must be loaded via `load_slot` on `rag.embedder`
    /// before calling. Returns one L2-normalized vector per input string.
    #[tracing::instrument(skip(self, texts), fields(count = texts.len()))]
    pub async fn burn_embed(&self, texts: Vec<String>) -> anyhow::Result<Vec<Vec<f32>>> {
        self.inner.burn_embed(texts).await
    }

    /// Hot-swap the Burn encoder weights to the safetensors file at
    /// `weights_path`. Drives the kernel RRD daemon through one full
    /// pause → drain → load → validate → swap → resume cycle and
    /// returns the structured `SwapStats` for the devtool `SwapDialog`.
    ///
    /// First-load goes through `load_slot` on `rag.embedder`; only the
    /// second-and-later path uses this entry point (the daemon must
    /// already exist).
    #[tracing::instrument(skip(self), fields(path = %weights_path.display()))]
    pub async fn burn_swap_encoder(
        &self,
        weights_path: std::path::PathBuf,
    ) -> anyhow::Result<devpulse_clyffy::model_loader::backends::burn_adapter::SwapStats> {
        self.inner.burn_swap_encoder(weights_path).await
    }

    /// Score documents against a query through the reranker slot.
    #[tracing::instrument(skip(self, documents), fields(slot_id, count = documents.len()))]
    pub async fn rerank(
        &self,
        slot_id: &str,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<f32>, LoadError> {
        self.inner
            .rerank(slot_id, query, documents)
            .await
            .map_err(LoadError::from)
    }

    /// Encode an image file into an embedding through the vision slot.
    #[tracing::instrument(skip(self), fields(slot_id, path))]
    pub async fn encode_image(
        &self,
        slot_id: &str,
        path: &std::path::Path,
    ) -> Result<Vec<f32>, LoadError> {
        self.inner
            .encode_image(slot_id, path)
            .await
            .map_err(LoadError::from)
    }

    /// Encode raw RGB bytes into an embedding through the vision slot.
    #[tracing::instrument(skip(self, rgb_bytes), fields(slot_id, width, height))]
    pub async fn encode_rgb(
        &self,
        slot_id: &str,
        rgb_bytes: &[u8],
        width: u32,
        height: u32,
    ) -> Result<Vec<f32>, LoadError> {
        self.inner
            .encode_rgb(slot_id, rgb_bytes, width, height)
            .await
            .map_err(LoadError::from)
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
        Ok(())
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        tracing::info!("Model Loader shutting down");
        Ok(())
    }
}
