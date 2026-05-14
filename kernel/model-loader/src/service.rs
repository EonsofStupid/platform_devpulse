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

use crate::assistant::{AssistantConfig, KeywordActionEntry, VoiceCloneEntry};
use crate::backends::bridge::InferenceHandle;
use crate::backends::router::select_backend;
use crate::backends::voice_pool::VoicePool;
use crate::backends::BackendPool;
use crate::hardware::auto_config::{self, AutoConfig};
use crate::hardware::metrics::{HardwareMetrics, HardwareMonitor};
use crate::hardware::vram;
use crate::loading::states::{LoadParams, LoadingStage, MemoryFootprint, ModelStatus, SlotStatus};
use crate::loading::swap::SwapGuard;
use crate::models::download::DownloadManager;
use crate::models::registry::BackendType;
use crate::models::registry::{ModelRegistry, ModelRegistryEntry};
use crate::models::secrets::Secrets;
use crate::slots::fallback;
use crate::slots::registry::SlotRegistry;
use crate::slots::types::{ModelCapability, Slot};
use crate::traits::config::ConfigBackend;
use crate::traits::errors::LoaderError;
use crate::traits::events::{LoaderEvent, LoaderEventSink, RebindReason, RuntimeFingerprint};
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
    /// Per-slot fingerprint of the runtime that fulfilled the last
    /// successful load. Used by the capability-event detection logic
    /// in `load_slot`/`warm_slot` to fire `CapabilityRebound` (when
    /// the `runtime_id` changes) or `RuntimeVersionChanged` (when the
    /// same runtime reports a different version) on the next load.
    pub(crate) runtime_fingerprints: HashMap<String, RuntimeFingerprint>,
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
    /// Optional Burn-encoder adapter wired by the engine at boot
    /// time. `None` when the consuming binary doesn't link the
    /// clyffy Burn implementation (test harnesses, headless tooling)
    /// — slots routed to `BackendType::Burn` then return a clear
    /// `Internal` error instead of compile-failing or silently
    /// falling back to Candle. The hosting binary is expected to
    /// supply the adapter when burn-cpu/burn-cuda is on.
    pub(crate) burn_encoder_adapter:
        Option<crate::backends::burn_adapter::BurnEncoderAdapterArc>,
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

/// Read-only context gathered at the start of a slot load. Computed
/// from `cfg` / `registry` / `inference` / `hardware` read locks; the
/// locks are released before the load proceeds so the heavy load itself
/// can take the inference write lock without lock-order conflicts.
struct LoadContext {
    model_id: String,
    model_path: PathBuf,
    capability: ModelCapability,
    backend: BackendType,
    params: LoadParams,
    /// Snapshot of `assistant.voice_clones` at the moment the load was
    /// scheduled. Always populated (cheap small `Vec` — typically empty
    /// or a handful of entries); the post-load hook only consumes it
    /// when `capability == ModelCapability::TextToSpeech`. Capturing the
    /// snapshot under the existing `cfg.read()` in `prepare_*_context`
    /// keeps the load atomic with the clone state — no separate lock
    /// cycle needed after the load completes.
    voice_clones: Vec<VoiceCloneEntry>,
}

/// Resolve the canonical `runtime_id` string for a load — the one
/// stamped on `LoaderEvent::CapabilityRebound` and used by the
/// frontend `DevtoolMeta` registry to look up the runtime devtool.
///
/// The mapping is per-(backend, capability) because a single
/// `BackendType` (notably `Ort`) hosts multiple distinct runtimes
/// across capability slots. Drives the `runtime_id` field of the
/// returned [`RuntimeFingerprint`].
fn runtime_id_for(
    backend: BackendType,
    capability: ModelCapability,
    params: &LoadParams,
    model_path: &std::path::Path,
) -> String {
    use ModelCapability::{
        Embedding, Reranking, SpeechToText, TextToSpeech, VisionEmbedding,
    };

    match (backend, capability) {
        (BackendType::Candle, _) => "candle".to_string(),
        (BackendType::LlamaCpp, _) => "llama-cpp-2".to_string(),
        (BackendType::Sherpa, _) => "sherpa-onnx".to_string(),
        (BackendType::Ort, TextToSpeech) => {
            // Voice pool's TTS dispatch picks Qwen3-TTS for
            // `.safetensors` files OR an explicit `qwen3-tts-candle`
            // backend variant. Mirror that decision tree here so the
            // fingerprint matches the actually-loaded engine.
            let ext = model_path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("");
            let variant = params.backend_variant.as_deref();
            if variant == Some("qwen3-tts-candle") || ext == "safetensors" {
                "qwen3-tts-candle".to_string()
            } else {
                "kokoro-onnx".to_string()
            }
        }
        (BackendType::Ort, SpeechToText) => "whisper-onnx".to_string(),
        (BackendType::Ort, Embedding) => "qwen3-embedder-onnx".to_string(),
        (BackendType::Ort, Reranking) => "qwen3-reranker-onnx".to_string(),
        (BackendType::Ort, VisionEmbedding) => {
            // SigLIP HD path is the ort-backed `siglip2-onnx-fixres`;
            // SD path falls through to candle.
            if params.backend_variant.as_deref() == Some("siglip2-onnx-fixres") {
                "siglip2-onnx-fixres".to_string()
            } else {
                "siglip-candle".to_string()
            }
        }
        // Future capabilities (`AudioDecoding`, `VisionLanguage`) fall
        // through to a stable fallback so unknown combos still produce
        // a non-empty id rather than panic.
        (b, c) => format!("{b:?}-{c:?}").to_lowercase(),
    }
}

/// Compute a runtime fingerprint at load completion.
///
/// Pre-release scope: `crate_version` is the umbrella `model-loader`
/// crate version (single Cargo workspace, all runtime crates move
/// together). `upstream_revision` and `model_revision` are left
/// `None` until Phase 5 wires per-runtime build-time SHA stamps
/// + the LFS oid persisted on the registry entry.
fn compute_runtime_fingerprint(runtime_id: String) -> RuntimeFingerprint {
    RuntimeFingerprint {
        runtime_id,
        crate_version: Some(env!("CARGO_PKG_VERSION").to_string()),
        upstream_revision: None,
        model_revision: None,
    }
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
        presets: Vec<crate::hardware::presets::PresetBlueprint>,
        burn_encoder_adapter: Option<crate::backends::burn_adapter::BurnEncoderAdapterArc>,
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
        let has_assignments = config
            .list_by_prefix("slot.")
            .map_or_else(
                |e| {
                    tracing::warn!(error = %e, "Failed to preload slot assignment state");
                    false
                },
                |entries| entries.iter().any(|(key, _)| key.ends_with(".model")),
            );
        let setup_complete = config
            .get("setup_complete")
            .map_or_else(
                |e| {
                    tracing::warn!(error = %e, "Failed to preload setup completion state");
                    false
                },
                |value| value.as_deref() == Some("true"),
            );

        Ok(Self {
            inference: Arc::new(RwLock::new(InferenceState {
                pool: BackendPool::new(),
                voice_pool: VoicePool::new(),
                slot_handles: HashMap::new(),
                swap_guard: SwapGuard::new(),
                slot_statuses: HashMap::new(),
                runtime_fingerprints: HashMap::new(),
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
                burn_encoder_adapter,
            }),
            hardware: Arc::new(parking_lot::RwLock::new(HardwareMonitor::new())),
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
    /// `BootState::models_dir`. UI surfaces this so a layman can point
    /// their file-explorer at it (or symlink existing model bundles
    /// into it without touching the registry CLI). Read-only after
    /// boot; no lock needed.
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
                    .map_or(0, |e| e.vram_estimate_mb);
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
    ///
    /// The tokio registry guard is scoped so it drops *before* the
    /// `parking_lot::RwLockReadGuard` for `hardware` is acquired. The
    /// parking-lot guard is `!Send`; if it lived across the registry
    /// `.await` the resulting future would be `!Send` and Tauri command
    /// futures (which require `Send`) would refuse to spawn it.
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
    pub async fn config_for_tier(&self, tier: crate::hardware::HardwareTier) -> AutoConfig {
        let reg = self.registry.read().await;
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

        let active_fallback = if matches!(model_status, ModelStatus::Loaded { .. }) {
            None
        } else {
            fallback::resolve_fallback(&cfg.slots, slot_id, &loaded_set).filter(|fb| fb != slot_id)
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
    ///
    /// # Errors
    /// Returns [`LoaderError::SlotSwapping`] if the slot is mid-swap and
    /// inference must wait. The returned `Ok(None)` indicates no handle
    /// is currently loaded for the slot or any of its fallbacks — that
    /// is not an error.
    pub async fn inference_handle(
        &self,
        slot_id: &str,
    ) -> Result<Option<InferenceHandle>, LoaderError> {
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

    /// Embed a batch of texts using the wired Burn encoder.
    ///
    /// Returns one L2-normalized dense vector (`Vec<f32>`) per input
    /// string, in order. The forward pass is CPU-bound (NdArray backend);
    /// this method offloads it to a Tokio blocking thread so the async
    /// runtime stays responsive.
    ///
    /// # Errors
    ///
    /// - No Burn encoder adapter wired at boot (`burn` feature off).
    /// - Encoder or tokenizer not yet loaded (call `load_slot` first).
    /// - Empty `texts` vec.
    /// - Tokenizer or forward-pass failure.
    /// Embed a batch of texts using the wired Burn encoder.
    ///
    /// Distinct from the slot-routed [`embed`] method — this calls
    /// the Burn encoder adapter directly (no slot dispatch). The
    /// encoder and its tokenizer must be loaded via `load_slot` on
    /// `rag.embedder` before calling.
    ///
    /// # Errors
    ///
    /// - No Burn encoder adapter wired (burn feature off or boot skipped).
    /// - Encoder or tokenizer not yet loaded.
    /// - Empty `texts` vec.
    /// - Forward pass or tokenizer failure.
    pub async fn burn_embed(&self, texts: Vec<String>) -> anyhow::Result<Vec<Vec<f32>>> {
        let adapter = self
            .boot
            .burn_encoder_adapter
            .clone()
            .ok_or_else(|| anyhow::anyhow!("burn_embed: no Burn encoder adapter wired (burn feature off?)"))?;

        tokio::task::spawn_blocking(move || {
            let refs: Vec<&str> = texts.iter().map(String::as_str).collect();
            adapter.embed_texts_blocking(&refs)
        })
        .await
        .map_err(|e| anyhow::anyhow!("burn_embed join error: {e}"))?
    }

    /// Hot-swap the live Burn encoder weights to the safetensors file
    /// at `weights_path`. Drives the kernel adapter through one full
    /// RRD pause → drain → load → validate → swap → resume cycle and
    /// returns the structured [`SwapStats`] for callers (the devtool
    /// SwapDialog flow).
    ///
    /// Async — internally offloads the synchronous adapter call to
    /// `spawn_blocking` so the calling task stays responsive while
    /// the daemon holds its maintenance window (typically 1-3 seconds
    /// for Harrier 0.6B on NVMe).
    ///
    /// # Errors
    ///
    /// - No Burn encoder adapter wired (burn feature off or boot skipped).
    /// - First-load not yet performed (daemon not constructed yet).
    /// - Source file missing / unreadable / wrong format.
    /// - Validate forward returned non-finite output (live unchanged).
    pub async fn burn_swap_encoder(
        &self,
        weights_path: std::path::PathBuf,
    ) -> anyhow::Result<crate::backends::burn_adapter::SwapStats> {
        let adapter = self
            .boot
            .burn_encoder_adapter
            .clone()
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "burn_swap_encoder: no Burn encoder adapter wired (burn feature off?)"
                )
            })?;

        tokio::task::spawn_blocking(move || adapter.swap_blocking(&weights_path))
            .await
            .map_err(|e| anyhow::anyhow!("burn_swap_encoder join error: {e}"))?
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
    /// `ConfigBackend::set` call fails (libsql write error or memory-config
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

    /// Voice custom directory.
    pub fn voice_custom_dir(&self) -> PathBuf {
        // userdata_dir is behind config lock but models_dir is boot state
        // voice custom is always {userdata}/voice/custom/ — derive from models_dir parent
        self.boot
            .models_dir
            .parent()
            .map_or_else(|| self.boot.models_dir.clone(), std::path::Path::to_path_buf)
            .join("voice")
            .join("custom")
    }

    // ── Registry write (scan) — only registry lock ────────────

    /// Scan the models directory. Only locks the registry.
    ///
    /// The IO portion (filesystem walk + GGUF header parsing) runs inside
    /// [`tokio::task::block_in_place`] so the worker thread that's blocked
    /// on it doesn't starve other tasks on the runtime — `block_in_place`
    /// asks the multi-threaded scheduler to migrate other tasks to free
    /// workers. **Multi-threaded runtime required** at every caller (Tauri
    /// uses the default multi-thread runtime; tests use
    /// `#[tokio::test(flavor = "multi_thread")]`).
    ///
    /// # Errors
    /// Returns [`LoaderError::Io`] if the filesystem walk fails (permission
    /// denied, path no longer exists) or a GGUF/SafeTensors header fails to
    /// parse. The underlying `Registry::scan` keeps an internal
    /// `anyhow::Error` for ergonomics; this method wraps it at the
    /// boundary so callers see a typed loader error.
    pub async fn scan_models(&self) -> Result<Vec<ModelRegistryEntry>, LoaderError> {
        self.boot.events.emit(LoaderEvent::RegistryScanStarted);

        let mut reg = self.registry.write().await;
        let count = tokio::task::block_in_place(|| reg.registry.scan()).map_err(|e| {
            LoaderError::Io {
                path: self.boot.models_dir.clone(),
                reason: format!("registry scan failed: {e:#}"),
            }
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

    /// Assign a model to a slot.
    ///
    /// # Errors
    /// Returns [`LoaderError::Internal`] if `model_id` is not in the
    /// registry, [`LoaderError::SlotNotFound`] if `slot_id` is unknown,
    /// or [`LoaderError::IncompatibleModel`] if the model's capabilities
    /// don't match the slot's required capability. Persistence failures
    /// surface as [`LoaderError::ConfigBackend`].
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
    /// errors. The fallible signature is preserved for forward-compat:
    /// future hardening (e.g. promoting `cfg.config.set` failures from
    /// "log and skip" to "abort and surface") will return a
    /// [`LoaderError`] without a signature change.
    pub async fn auto_assign_bundled_slots(&self) -> Result<usize, LoaderError> {
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
    /// config to its TOML file fails (typically `{userdata}/assistant.toml`
    /// IO error).
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

    /// Toggle the 24/7 Moshi voice brain.
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

    /// Register a new custom voice clone, persist `assistant.toml`, and
    /// push the fresh snapshot into the live `voice.tts` backend so the
    /// next `synthesize("custom:<name>", ...)` call sees the new entry
    /// without requiring a slot reload.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] on assistant config persist failure
    /// (typically when the user-data dir isn't writable). The post-persist
    /// pool refresh is best-effort — if the TTS slot isn't loaded yet,
    /// the snapshot will be applied at the next load via the same hook
    /// in [`Self::load_slot`] / [`Self::warm_slot`].
    pub async fn register_voice_clone(&self, entry: VoiceCloneEntry) -> Result<(), LoaderError> {
        let snapshot = {
            let mut cfg = self.config.write().await;
            let dir = cfg.userdata_dir.clone();
            cfg.assistant
                .register_voice_clone(&dir, entry)
                .map_err(|e| LoaderError::Internal {
                    message: format!("Failed to register voice clone: {e}"),
                })?;
            cfg.assistant.voice_clones.clone()
        };
        self.refresh_voice_clones_with_snapshot(snapshot).await;
        Ok(())
    }

    /// Remove a registered voice clone by name, persist `assistant.toml`,
    /// and refresh the live `voice.tts` backend snapshot.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] if `name` isn't registered or the
    /// assistant config persist fails.
    pub async fn remove_voice_clone(&self, name: &str) -> Result<(), LoaderError> {
        let snapshot = {
            let mut cfg = self.config.write().await;
            let dir = cfg.userdata_dir.clone();
            cfg.assistant
                .remove_voice_clone(&dir, name)
                .map_err(|e| LoaderError::Internal {
                    message: format!("Failed to remove voice clone: {e}"),
                })?;
            cfg.assistant.voice_clones.clone()
        };
        self.refresh_voice_clones_with_snapshot(snapshot).await;
        Ok(())
    }

    /// Snapshot every slot's currently-cached runtime fingerprint.
    ///
    /// Returns a `(slot_id → fingerprint)` map for the slots that
    /// have a model loaded right now. The frontend
    /// `capabilityChannel` uses this on mount to hydrate state
    /// before the first `LoaderEvent::CapabilityRebound` arrives —
    /// without it, the UI would show "no runtime" for already-loaded
    /// slots until the next reload.
    ///
    /// Acquires only `inference.read()`; safe to call from any Tauri
    /// command without lock-order concerns.
    pub async fn list_runtime_fingerprints(&self) -> HashMap<String, RuntimeFingerprint> {
        let inf = self.inference.read().await;
        inf.runtime_fingerprints.clone()
    }

    /// Re-push the current `assistant.voice_clones` snapshot into the
    /// loaded `voice.tts` backend. Useful when the TTS slot is reloaded
    /// out-of-band (e.g. swapped to a different model) and the engine
    /// wants to ensure clone state is current without going through
    /// `register_voice_clone` / `remove_voice_clone` again.
    ///
    /// No-op when no TTS session is loaded.
    pub async fn refresh_voice_clones(&self) {
        let snapshot = {
            let cfg = self.config.read().await;
            cfg.assistant.voice_clones.clone()
        };
        self.refresh_voice_clones_with_snapshot(snapshot).await;
    }

    /// Compare the new runtime fingerprint to the previously cached
    /// one for this slot and emit the appropriate capability event.
    ///
    /// - First load of a slot in this session → `CapabilityRebound`
    ///   with `from_runtime: None` and `reason: InitialLoad`.
    /// - Same `runtime_id`, different version fields →
    ///   `RuntimeVersionChanged`.
    /// - Different `runtime_id` → `CapabilityRebound` with
    ///   `from_runtime: Some(prev)` and `reason: UserSwap`.
    /// - Identical fingerprint → no event (silent reload).
    ///
    /// Always inserts the new fingerprint into `runtime_fingerprints`
    /// regardless of which arm fires, so the next load has a baseline
    /// to compare against.
    fn dispatch_runtime_events(
        &self,
        inf: &mut InferenceState,
        slot_id: &str,
        new_fingerprint: RuntimeFingerprint,
    ) {
        let prev = inf.runtime_fingerprints.get(slot_id).cloned();
        match prev {
            None => {
                self.boot.events.emit(LoaderEvent::CapabilityRebound {
                    capability: slot_id.to_string(),
                    from_runtime: None,
                    to_runtime: new_fingerprint.runtime_id.clone(),
                    reason: RebindReason::InitialLoad,
                });
            }
            Some(prev_fp) if prev_fp.runtime_id != new_fingerprint.runtime_id => {
                self.boot.events.emit(LoaderEvent::CapabilityRebound {
                    capability: slot_id.to_string(),
                    from_runtime: Some(prev_fp.runtime_id),
                    to_runtime: new_fingerprint.runtime_id.clone(),
                    reason: RebindReason::UserSwap,
                });
            }
            Some(prev_fp) if prev_fp != new_fingerprint => {
                self.boot.events.emit(LoaderEvent::RuntimeVersionChanged {
                    runtime_id: new_fingerprint.runtime_id.clone(),
                    old_fingerprint: Some(prev_fp),
                    new_fingerprint: new_fingerprint.clone(),
                });
            }
            Some(_) => {
                // Identical fingerprint — silent reload (e.g. same
                // model, same runtime, same version). No event.
            }
        }
        inf.runtime_fingerprints
            .insert(slot_id.to_string(), new_fingerprint);
    }

    /// Inner refresh hook — accepts a pre-fetched snapshot to avoid
    /// re-acquiring the config lock when the caller already has one.
    /// Lock order honoured: takes only `inference.read()`, never config.
    async fn refresh_voice_clones_with_snapshot(&self, clones: Vec<VoiceCloneEntry>) {
        let inf = self.inference.read().await;
        let count = clones.len();
        let refreshed = inf.voice_pool.refresh_voice_clones("voice.tts", clones);
        if refreshed {
            tracing::info!(
                slot = "voice.tts",
                voice_clones = count,
                "voice-clone snapshot refreshed in TTS backend"
            );
        } else {
            tracing::debug!(
                slot = "voice.tts",
                voice_clones = count,
                "voice.tts not loaded; snapshot will apply on next load"
            );
        }
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
    /// [`LoaderError::Internal`] if the secrets store can't be written
    /// (typically when `{models_dir}/secrets.toml` isn't writable).
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
    /// if the underlying download manager can't initialise the transfer
    /// — typically a network failure or an invalid repo id. Per-byte
    /// transfer failures surface later via the event sink, not this
    /// `Result`.
    #[cfg(feature = "candle-backend")]
    pub async fn download_model(
        &self,
        repo_id: &str,
        filename: &str,
        scope: &crate::models::DownloadScope,
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

    /// Download not available without candle feature.
    ///
    /// # Errors
    /// Always returns [`LoaderError::Internal`] — this stub exists only
    /// so callers compile against a uniform `download_model` API. Build
    /// with `--features candle-backend` to enable real downloads.
    #[cfg(not(feature = "candle-backend"))]
    pub async fn download_model(
        &self,
        _repo_id: &str,
        _filename: &str,
        _scope: &crate::models::DownloadScope,
    ) -> Result<String, LoaderError> {
        Err(LoaderError::Internal {
            message: "Download requires candle-backend feature".to_string(),
        })
    }

    /// Recommend the primary entry-point filename inside `repo_id`
    /// for the slot `slot_id`. Resolves the repo's sibling list,
    /// reads the slot's required capability, reads the live hardware
    /// tier, and walks the tier-aware preference list in
    /// [`crate::models::recommender`].
    ///
    /// Returns `None` only when the repo has zero files in a format
    /// the slot can run — UI surfaces that as "this repo doesn't ship
    /// a model in a format we can run for this slot." Use this as
    /// the input to `install_to_slot`.
    ///
    /// # Errors
    /// - [`LoaderError::SlotNotFound`] — `slot_id` is not registered.
    /// - [`LoaderError::Internal`] — `list_repo_files` failed
    ///   (network, 401/403/404, malformed token). The kernel doesn't
    ///   own retry policy here; surface and let the UI offer retry.
    #[cfg(feature = "candle-backend")]
    pub async fn recommend_primary_for_slot(
        &self,
        repo_id: &str,
        slot_id: &str,
    ) -> Result<Option<String>, LoaderError> {
        // Capability lives on the slot; tier comes from the live
        // hardware monitor. Both are cheap to read.
        let capability = {
            let cfg = self.config.read().await;
            let slot = cfg
                .slots
                .get_slot(slot_id)
                .ok_or(LoaderError::SlotNotFound {
                    slot_id: slot_id.to_string(),
                })?;
            slot.capability
        };
        let tier = {
            let hw = self.hardware.read();
            crate::hardware::auto_config::detect_tier(hw.cached())
        };

        // Sibling list — the only step that touches the network.
        // `list_repo_files` is sync; wrap in `block_in_place` so the
        // tokio runtime keeps servicing other tasks during the HF
        // round-trip.
        let cfg = self.config.read().await;
        let siblings_raw = tokio::task::block_in_place(|| cfg.downloads.list_repo_files(repo_id))
            .map_err(|e| LoaderError::Internal {
                message: format!("list_repo_files failed: {e:#}"),
            })?;
        drop(cfg);

        let siblings: Vec<String> = siblings_raw.into_iter().map(|f| f.name).collect();
        Ok(
            crate::models::recommender::recommend_primary(&siblings, capability, tier)
                .map(str::to_string),
        )
    }

    /// Stub for builds without the candle-backend feature.
    ///
    /// # Errors
    /// Always returns [`LoaderError::Internal`] — build with
    /// `--features candle-backend` to enable.
    #[cfg(not(feature = "candle-backend"))]
    pub async fn recommend_primary_for_slot(
        &self,
        _repo_id: &str,
        _slot_id: &str,
    ) -> Result<Option<String>, LoaderError> {
        Err(LoaderError::Internal {
            message: "recommend_primary_for_slot requires candle-backend feature".to_string(),
        })
    }

    /// Atomic install — download → scan → assign → load — composed from
    /// the four kernel verbs that already exist independently.
    ///
    /// Returns the `install_id` immediately after the download starts;
    /// the chain runs in a detached `tokio::spawn`. Progress observable
    /// via `LoaderEvent::InstallStarted`, `DownloadProgress`,
    /// `LoadingStage`, and the terminal
    /// `InstallComplete`/`InstallFailed`.
    ///
    /// `primary_filename` is the entry point inside the repo. The
    /// download manager auto-resolves shards + companions via
    /// `plan_bundle()` (`download.rs` §plan_bundle), so callers pass
    /// only one filename even for sharded safetensors models.
    ///
    /// Slot validation runs synchronously before the download starts —
    /// callers get `SlotNotFound` / `IncompatibleModel` (capability
    /// mismatch deferred to `assign_model` inside the chain) before
    /// any bytes hit the network.
    ///
    /// # Errors
    /// - [`LoaderError::SlotNotFound`] — `slot_id` is not in the slot
    ///   registry.
    /// - [`LoaderError::DownloadFailed`] — `start_download` rejected
    ///   the request (network init failure, malformed repo id).
    /// - [`LoaderError::Internal`] — feature `candle-backend` is off
    ///   so downloads cannot run.
    ///
    /// Failures *during* the chain (network drop, capability mismatch
    /// at assign time, runtime can't fit the model) surface as
    /// `LoaderEvent::InstallFailed` on the event sink — they cannot
    /// reach this `Result` because the chain runs after the function
    /// returns.
    #[cfg(feature = "candle-backend")]
    #[tracing::instrument(skip(self), fields(repo_id, primary_filename, slot_id))]
    pub async fn install_to_slot(
        &self,
        repo_id: &str,
        primary_filename: &str,
        slot_id: &str,
        scope: &crate::models::DownloadScope,
    ) -> Result<String, LoaderError> {
        // Pre-flight: slot must exist. Cheap read-lock — no need to
        // hold it across the download spawn.
        {
            let cfg = self.config.read().await;
            if cfg.slots.get_slot(slot_id).is_none() {
                return Err(LoaderError::SlotNotFound {
                    slot_id: slot_id.to_string(),
                });
            }
        }

        let install_id = uuid::Uuid::now_v7().to_string();
        let (tx, rx) = tokio::sync::oneshot::channel();

        // Spawn the download under the config write-lock that
        // start_download requires. The completion oneshot fires from
        // the spawned download thread (download.rs §start_download).
        {
            let mut cfg = self.config.write().await;
            cfg.downloads
                .start_download(repo_id, primary_filename, scope, &self.boot.events, Some(tx))
                .map_err(|e| LoaderError::DownloadFailed {
                    reason: e.to_string(),
                    can_retry: true,
                    bytes_completed: 0,
                })?;
        }

        self.boot.events.emit(LoaderEvent::InstallStarted {
            install_id: install_id.clone(),
            repo_id: repo_id.to_string(),
            primary_filename: primary_filename.to_string(),
            slot_id: slot_id.to_string(),
        });
        tracing::info!(
            install_id = %install_id,
            repo = %repo_id,
            file = %primary_filename,
            slot = %slot_id,
            scope = ?scope,
            "Install chain started"
        );

        // Detached chain — Service is Clone (every field is Arc), so
        // a cheap clone is the right move; no `Arc<Self>` plumbing.
        let svc = self.clone();
        let install_id_for_task = install_id.clone();
        let slot_id_owned = slot_id.to_string();
        tokio::spawn(async move {
            run_install_chain(svc, install_id_for_task, slot_id_owned, rx).await;
        });

        Ok(install_id)
    }

    /// Stub for builds without the candle-backend feature — the HF
    /// download path is gated there so the install chain can't run.
    ///
    /// # Errors
    /// Always returns [`LoaderError::Internal`] — build with
    /// `--features candle-backend` to enable.
    #[cfg(not(feature = "candle-backend"))]
    pub async fn install_to_slot(
        &self,
        _repo_id: &str,
        _primary_filename: &str,
        _slot_id: &str,
        _scope: &crate::models::DownloadScope,
    ) -> Result<String, LoaderError> {
        Err(LoaderError::Internal {
            message: "install_to_slot requires candle-backend feature".to_string(),
        })
    }

    /// Cancel an active download.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] if `download_id` is not in the active
    /// set (already completed, never existed, or previously cancelled).
    pub async fn cancel_download(&self, download_id: &str) -> Result<(), LoaderError> {
        let mut cfg = self.config.write().await;
        cfg.downloads
            .cancel(download_id)
            .map_err(|e| LoaderError::Internal {
                message: e.to_string(),
            })
    }

    /// List every file in a `HuggingFace` repo. Used by the
    /// `RepoDownloadButton` on the frontend to render a bundle
    /// confirmation before a user commits to a download.
    ///
    /// Private / gated repos resolve only when an HF token is stored
    /// via `set_hf_token`. Without the candle-backend feature the
    /// underlying `hf_hub` dep is gated and this returns an error.
    ///
    /// # Errors
    /// [`LoaderError::Internal`] if the HF info call fails (network /
    /// auth / 404), if the response can't be parsed, or if the feature
    /// gate is off.
    pub async fn list_repo_files(
        &self,
        repo_id: &str,
    ) -> Result<Vec<crate::models::download::RepoFileEntry>, LoaderError> {
        let cfg = self.config.read().await;
        cfg.downloads
            .list_repo_files(repo_id)
            .map_err(|e| LoaderError::Internal {
                message: e.to_string(),
            })
    }

    // ── Inference state (the ONLY heavy write lock) ───────────

    /// Gather all the read-only context needed to start a load: slot
    /// metadata, registry entry, device selection, GPU-offload hint,
    /// load params. Returns errors for slot/model lookup failures so the
    /// load surface can short-circuit before taking any write lock.
    async fn prepare_load_context(&self, slot_id: &str) -> Result<LoadContext, LoaderError> {
        let cfg = self.config.read().await;
        let reg = self.registry.read().await;
        let inf = self.inference.read().await;

        let slot = cfg
            .slots
            .get_slot(slot_id)
            .ok_or(LoaderError::SlotNotFound {
                slot_id: slot_id.to_string(),
            })?;

        let model_id = slot
            .assigned_model
            .clone()
            .ok_or(LoaderError::NoModelAssigned {
                slot_id: slot_id.to_string(),
            })?;

        if matches!(
            inf.slot_statuses.get(slot_id),
            Some(ModelStatus::Loading { .. })
        ) {
            return Err(LoaderError::AlreadyLoading {
                slot_id: slot_id.to_string(),
            });
        }

        let entry = reg
            .registry
            .get(&model_id)
            .ok_or(LoaderError::ModelFileMissing {
                path: PathBuf::new(),
                slot_id: Some(slot_id.to_string()),
                can_redownload: false,
            })?;

        if !entry.path.exists() {
            return Err(LoaderError::ModelFileMissing {
                path: entry.path.clone(),
                slot_id: Some(slot_id.to_string()),
                can_redownload: matches!(
                    entry.source,
                    crate::models::registry::ModelSource::HuggingFace { .. }
                ),
            });
        }

        let model_path = entry.path.clone();
        let capability = slot.capability;
        let backend = slot
            .runtime
            .unwrap_or_else(|| select_backend(entry, None, Some(capability)));
        let hw = self.hardware.read();

        let device_str = match slot.preferred_device {
            crate::slots::types::DevicePreference::Gpu => "cuda:0".to_string(),
            crate::slots::types::DevicePreference::Cpu => "cpu".to_string(),
            _ => {
                if hw.cached().has_gpu() {
                    "cuda:0".to_string()
                } else {
                    "cpu".to_string()
                }
            }
        };

        let gpu_layers: Option<u32> = {
            let slot_hint = slot
                .extensions
                .get("llama_cpp_ngl")
                .and_then(|s| s.parse::<i32>().ok());
            let assistant_hint = if slot_id == "chat.brain" {
                Some(cfg.assistant.offload.brain_ngl)
            } else {
                None
            };
            match slot_hint.or(assistant_hint) {
                // Negative ngl is the "auto" sentinel; clamp to None.
                // Positive `i32` fits in `u32` losslessly — sign-loss
                // cannot happen because `n >= 0` is the match guard.
                #[allow(clippy::cast_sign_loss)]
                Some(n) if n >= 0 => Some(n as u32),
                _ => None,
            }
        };

        let params = LoadParams {
            device: device_str,
            context_length: entry.context_length,
            gpu_layers,
            auto_prime: false,
            backend_variant: None,
        };

        let voice_clones = cfg.assistant.voice_clones.clone();

        Ok(LoadContext {
            model_id,
            model_path,
            capability,
            backend,
            params,
            voice_clones,
        })
    }

    /// Gather the warm-load context. Returns `Ok(None)` if the slot is
    /// already in a Loaded or Warm state (warming is idempotent), or
    /// `Ok(Some(_))` to proceed. Errors are slot/model lookup failures.
    /// Always pins to CPU with `gpu_layers = Some(0)` — warming is
    /// explicitly the "weights in RAM, no GPU" path.
    async fn prepare_warm_context(
        &self,
        slot_id: &str,
    ) -> Result<Option<LoadContext>, LoaderError> {
        let cfg = self.config.read().await;
        let reg = self.registry.read().await;
        let inf = self.inference.read().await;

        let slot = cfg
            .slots
            .get_slot(slot_id)
            .ok_or(LoaderError::SlotNotFound {
                slot_id: slot_id.to_string(),
            })?;
        let model_id = slot
            .assigned_model
            .clone()
            .ok_or(LoaderError::NoModelAssigned {
                slot_id: slot_id.to_string(),
            })?;

        match inf.slot_statuses.get(slot_id) {
            Some(ModelStatus::Loaded { .. } | ModelStatus::Warm { .. }) => return Ok(None),
            Some(ModelStatus::Loading { .. }) => {
                return Err(LoaderError::AlreadyLoading {
                    slot_id: slot_id.to_string(),
                });
            }
            _ => {}
        }

        let entry = reg
            .registry
            .get(&model_id)
            .ok_or(LoaderError::ModelFileMissing {
                path: PathBuf::new(),
                slot_id: Some(slot_id.to_string()),
                can_redownload: false,
            })?;
        if !entry.path.exists() {
            return Err(LoaderError::ModelFileMissing {
                path: entry.path.clone(),
                slot_id: Some(slot_id.to_string()),
                can_redownload: false,
            });
        }

        let model_path = entry.path.clone();
        let capability = slot.capability;
        let backend = slot
            .runtime
            .unwrap_or_else(|| select_backend(entry, None, Some(capability)));
        let params = LoadParams {
            device: "cpu".to_string(),
            context_length: entry.context_length,
            gpu_layers: Some(0),
            auto_prime: false,
            backend_variant: None,
        };

        let voice_clones = cfg.assistant.voice_clones.clone();

        Ok(Some(LoadContext {
            model_id,
            model_path,
            capability,
            backend,
            params,
            voice_clones,
        }))
    }

    /// Load the model assigned to a slot.
    ///
    /// # Errors
    /// Returns [`LoaderError::SlotNotFound`] if `slot_id` is unknown,
    /// [`LoaderError::NoModelAssigned`] if the slot has no assigned
    /// model, [`LoaderError::AlreadyLoading`] / [`LoaderError::SlotSwapping`]
    /// if the slot is busy, [`LoaderError::ModelFileMissing`] if the
    /// assigned model's file is gone from disk, or one of the resource
    /// failures ([`LoaderError::VramInsufficient`] / [`LoaderError::RamExhausted`])
    /// when the runtime can't fit the model.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn load_slot(&self, slot_id: &str) -> Result<(), LoaderError> {
        // Phase 1: gather info under read locks.
        let LoadContext {
            model_id,
            model_path,
            capability,
            backend,
            params,
            voice_clones,
        } = self.prepare_load_context(slot_id).await?;

        // Compute the runtime fingerprint *before* moving `params`
        // into the load call. Cheap (one match arm + env! macro);
        // lets the post-load dispatch fire the right capability
        // event without a second `LoadParams` allocation.
        let new_fingerprint =
            compute_runtime_fingerprint(runtime_id_for(backend, capability, &params, &model_path));

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
                inf.voice_pool
                    .load(slot_id, &model_path, capability, params)
            }
            #[cfg(feature = "candle-backend")]
            BackendType::Candle | BackendType::LlamaCpp => {
                match inf
                    .pool
                    .acquire(&model_id, &model_path, params, backend)
                    .await
                {
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
            BackendType::Burn => match self.boot.burn_encoder_adapter.as_ref() {
                Some(adapter) => {
                    // Adapter's `load_blocking` may sit for 1-3 seconds
                    // (safetensors parse + per-tensor copies). Wrap in
                    // spawn_blocking so the runtime keeps servicing
                    // other tasks while the encoder loads. Adapter
                    // clones cheaply (it's an Arc internally).
                    let adapter = adapter.clone();
                    let path = model_path.to_path_buf();
                    tokio::task::spawn_blocking(move || adapter.load_blocking(&path))
                        .await
                        .unwrap_or_else(|e| Err(anyhow::anyhow!("burn load join error: {e}")))
                }
                None => Err(anyhow::anyhow!(
                    "BackendType::Burn selected for slot '{slot_id}' but no \
                     BurnEncoderAdapter is wired — engine boot must supply \
                     `Some(adapter)` to ModelLoaderService::new when burn-cpu \
                     or burn-cuda is enabled"
                )),
            },
        };

        match load_result {
            Ok(memory) => {
                inf.slot_statuses.insert(
                    slot_id.to_string(),
                    ModelStatus::Loaded { footprint: memory },
                );
                self.boot.events.emit(LoaderEvent::LoadingComplete {
                    slot_id: slot_id.to_string(),
                    memory,
                });
                self.hardware.write().enter_normal_mode();
                if capability == ModelCapability::TextToSpeech {
                    inf.voice_pool.refresh_voice_clones(slot_id, voice_clones);
                }
                self.dispatch_runtime_events(&mut inf, slot_id, new_fingerprint);
                tracing::info!(slot = %slot_id, model = %model_id, backend = ?backend, ram_mb = memory.ram_mb(), vram_mb = memory.vram_mb(), "Slot loaded");
                Ok(())
            }
            Err(e) => {
                let error_msg = e.to_string();
                inf.slot_statuses.insert(
                    slot_id.to_string(),
                    ModelStatus::Failed {
                        error: error_msg.clone(),
                        failed_at: LoadingStage::LoadingWeights,
                    },
                );
                self.boot.events.emit(LoaderEvent::LoadingFailed {
                    slot_id: slot_id.to_string(),
                    error: error_msg.clone(),
                });
                self.hardware.write().enter_normal_mode();
                tracing::error!(slot = %slot_id, error = %error_msg, "Slot loading failed");
                Err(LoaderError::Internal { message: error_msg })
            }
        }
    }

    /// Unload the model from a slot.
    ///
    /// # Errors
    /// Returns [`LoaderError::SlotNotFound`] if `slot_id` is unknown.
    /// Unloading a slot that has no loaded model is a no-op (Ok).
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn unload_slot(&self, slot_id: &str) -> Result<(), LoaderError> {
        let model_id = {
            let cfg = self.config.read().await;
            if !cfg.slots.contains(slot_id) {
                return Err(LoaderError::SlotNotFound {
                    slot_id: slot_id.to_string(),
                });
            }
            cfg.slots
                .get_slot(slot_id)
                .and_then(|s| s.assigned_model.clone())
        };

        let mut inf = self.inference.write().await;
        inf.slot_statuses
            .insert(slot_id.to_string(), ModelStatus::Unloading);
        inf.slot_handles.remove(slot_id);
        // Drop the cached runtime fingerprint so the next load fires
        // `CapabilityRebound { reason: InitialLoad }` instead of a
        // spurious version-changed event.
        inf.runtime_fingerprints.remove(slot_id);

        if let Some(mid) = model_id {
            for attempt in 1..=2 {
                if let Some(freed) = inf.pool.release(&mid).await {
                    self.boot.events.emit(LoaderEvent::UnloadComplete {
                        slot_id: slot_id.to_string(),
                        freed,
                    });
                    tracing::info!(slot = %slot_id, model = %mid, "Model unloaded");
                    inf.slot_statuses
                        .insert(slot_id.to_string(), ModelStatus::NotLoaded);
                    return Ok(());
                }
                // pool.release returned None — either still shared (in
                // which case slot handle was the only ref and is now gone)
                // or the model genuinely isn't loaded any more. Both are
                // success paths; only "still loaded but couldn't release"
                // counts as failure and falls through to the retry sleep.
                if inf.pool.is_loaded(&mid) {
                    tracing::info!(slot = %slot_id, model = %mid, "Slot handle released (shared)");
                    inf.slot_statuses
                        .insert(slot_id.to_string(), ModelStatus::NotLoaded);
                    return Ok(());
                }
                tracing::warn!(slot = %slot_id, model = %mid, attempt, "Unload retry");
                if attempt < 2 {
                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                }
            }
            let error_msg = format!("Unload failed for slot '{slot_id}' after 2 retries");
            tracing::error!(slot = %slot_id, "{error_msg}");
            inf.slot_statuses.insert(
                slot_id.to_string(),
                ModelStatus::Failed {
                    error: error_msg.clone(),
                    failed_at: LoadingStage::Verifying,
                },
            );
            return Err(LoaderError::Internal { message: error_msg });
        }

        inf.slot_statuses
            .insert(slot_id.to_string(), ModelStatus::NotLoaded);
        Ok(())
    }

    /// Warm a slot — load weights to CPU RAM only, no GPU.
    ///
    /// # Errors
    /// Same failure modes as [`Self::load_slot`] except VRAM-related ones
    /// (warming explicitly stays on CPU, so VRAM exhaustion isn't possible).
    /// [`LoaderError::RamExhausted`] is the dominant resource failure.
    #[tracing::instrument(skip(self), fields(slot_id))]
    pub async fn warm_slot(&self, slot_id: &str) -> Result<(), LoaderError> {
        // Phase 1: gather under read locks. Returns `Ok(None)` if the slot
        // is already Loaded/Warm (warming is idempotent — no work to do).
        let Some(LoadContext {
            model_id,
            model_path,
            capability,
            backend,
            params,
            voice_clones,
        }) = self.prepare_warm_context(slot_id).await?
        else {
            return Ok(());
        };

        // Same fingerprint pre-compute as `load_slot` — see that
        // method for the rationale (avoids params clone).
        let new_fingerprint =
            compute_runtime_fingerprint(runtime_id_for(backend, capability, &params, &model_path));

        // Phase 2: inference write lock
        let mut inf = self.inference.write().await;
        inf.slot_statuses.insert(
            slot_id.to_string(),
            ModelStatus::Loading {
                stage: LoadingStage::Allocating,
                progress_pct: 5.0,
            },
        );
        self.boot.events.emit(LoaderEvent::LoadingStarted {
            slot_id: slot_id.to_string(),
            model_id: model_id.clone(),
        });

        let load_result = match backend {
            BackendType::Ort | BackendType::Sherpa => {
                inf.voice_pool
                    .load(slot_id, &model_path, capability, params)
            }
            #[cfg(feature = "candle-backend")]
            BackendType::Candle | BackendType::LlamaCpp => {
                match inf
                    .pool
                    .acquire(&model_id, &model_path, params, backend)
                    .await
                {
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
            BackendType::Burn => match self.boot.burn_encoder_adapter.as_ref() {
                Some(adapter) => {
                    // Adapter's `load_blocking` may sit for 1-3 seconds
                    // (safetensors parse + per-tensor copies). Wrap in
                    // spawn_blocking so the runtime keeps servicing
                    // other tasks while the encoder loads. Adapter
                    // clones cheaply (it's an Arc internally).
                    let adapter = adapter.clone();
                    let path = model_path.to_path_buf();
                    tokio::task::spawn_blocking(move || adapter.load_blocking(&path))
                        .await
                        .unwrap_or_else(|e| Err(anyhow::anyhow!("burn load join error: {e}")))
                }
                None => Err(anyhow::anyhow!(
                    "BackendType::Burn selected for slot '{slot_id}' but no \
                     BurnEncoderAdapter is wired — engine boot must supply \
                     `Some(adapter)` to ModelLoaderService::new when burn-cpu \
                     or burn-cuda is enabled"
                )),
            },
        };

        match load_result {
            Ok(memory) => {
                let footprint = MemoryFootprint {
                    ram_bytes: memory.ram_bytes,
                    vram_bytes: 0,
                    kv_cache_bytes: 0,
                };
                inf.slot_statuses
                    .insert(slot_id.to_string(), ModelStatus::Warm { footprint });
                self.boot.events.emit(LoaderEvent::LoadingComplete {
                    slot_id: slot_id.to_string(),
                    memory: footprint,
                });
                if capability == ModelCapability::TextToSpeech {
                    inf.voice_pool.refresh_voice_clones(slot_id, voice_clones);
                }
                self.dispatch_runtime_events(&mut inf, slot_id, new_fingerprint);
                tracing::info!(slot = %slot_id, model = %model_id, ram_mb = footprint.ram_mb(), "Slot warmed");
                Ok(())
            }
            Err(e) => {
                let error_msg = e.to_string();
                inf.slot_statuses.insert(
                    slot_id.to_string(),
                    ModelStatus::Failed {
                        error: error_msg.clone(),
                        failed_at: LoadingStage::LoadingWeights,
                    },
                );
                self.boot.events.emit(LoaderEvent::LoadingFailed {
                    slot_id: slot_id.to_string(),
                    error: error_msg.clone(),
                });
                tracing::error!(slot = %slot_id, error = %error_msg, "Warm failed");
                Err(LoaderError::Internal { message: error_msg })
            }
        }
    }

    /// Atomically swap the model on a slot.
    ///
    /// # Errors
    /// Returns [`LoaderError::SlotNotFound`] if `slot_id` is unknown,
    /// [`LoaderError::Internal`] if `new_model_id` is not in the registry
    /// or is incompatible with the slot's capability, or any of the
    /// load-path errors ([`LoaderError::AlreadyLoading`],
    /// [`LoaderError::SlotSwapping`], [`LoaderError::VramInsufficient`],
    /// [`LoaderError::RamExhausted`], [`LoaderError::ModelFileMissing`])
    /// raised by the underlying load that completes the swap.
    #[tracing::instrument(skip(self), fields(slot_id, new_model_id))]
    pub async fn swap_model(&self, slot_id: &str, new_model_id: &str) -> Result<(), LoaderError> {
        // Validate
        {
            let cfg = self.config.read().await;
            let reg = self.registry.read().await;
            let slot = cfg
                .slots
                .get_slot(slot_id)
                .ok_or(LoaderError::SlotNotFound {
                    slot_id: slot_id.to_string(),
                })?;
            if slot.assigned_model.as_deref() == Some(new_model_id) {
                return Ok(());
            }
            let entry = reg
                .registry
                .get(new_model_id)
                .ok_or(LoaderError::Internal {
                    message: format!("Model '{new_model_id}' not found"),
                })?;
            if !entry.compatible_capabilities.contains(&slot.capability) {
                return Err(LoaderError::IncompatibleModel {
                    model_id: new_model_id.to_string(),
                    capability: slot.capability.to_string(),
                });
            }
        }

        // Begin swap guard
        {
            let mut inf = self.inference.write().await;
            inf.swap_guard.begin(slot_id);
        }

        self.boot.events.emit(LoaderEvent::SwapStarted {
            slot_id: slot_id.to_string(),
            from_model: None,
            to_model: new_model_id.to_string(),
        });
        tracing::info!(slot = %slot_id, to = %new_model_id, "Swap started");

        if self.is_slot_loaded(slot_id).await {
            if let Err(e) = self.unload_slot(slot_id).await {
                let mut inf = self.inference.write().await;
                inf.swap_guard.end(slot_id);
                return Err(LoaderError::Internal {
                    message: format!("Swap unload failed: {e}"),
                });
            }
        }

        if let Err(e) = self.assign_model(slot_id, new_model_id).await {
            let mut inf = self.inference.write().await;
            inf.swap_guard.end(slot_id);
            return Err(LoaderError::Internal {
                message: format!("Swap assign failed: {e}"),
            });
        }

        if let Err(e) = self.load_slot(slot_id).await {
            let mut inf = self.inference.write().await;
            inf.swap_guard.end(slot_id);
            return Err(LoaderError::Internal {
                message: format!("Swap load failed: {e}"),
            });
        }

        {
            let mut inf = self.inference.write().await;
            inf.swap_guard.end(slot_id);
        }

        self.boot.events.emit(LoaderEvent::SwapComplete {
            slot_id: slot_id.to_string(),
            model_id: new_model_id.to_string(),
        });
        tracing::info!(slot = %slot_id, model = %new_model_id, "Swap complete");
        Ok(())
    }

    /// Delete a model from disk and registry.
    ///
    /// # Errors
    /// Returns [`LoaderError::Internal`] if `model_id` isn't in the
    /// registry, or if the on-disk file delete fails (typically a
    /// permissions or in-use error). Best-effort slot unassignment
    /// failures fail-soft with `tracing::warn!` and never propagate.
    #[tracing::instrument(skip(self), fields(model_id))]
    pub async fn delete_model(&self, model_id: &str) -> Result<(), LoaderError> {
        // Check not loaded
        {
            let inf = self.inference.read().await;
            if inf.pool.is_loaded(model_id) {
                return Err(LoaderError::Internal {
                    message: format!("Model '{model_id}' is loaded — unload first"),
                });
            }
        }

        // Get info
        let (file_path, filename, slots_to_clear) = {
            let reg = self.registry.read().await;
            let cfg = self.config.read().await;
            let entry = reg.registry.get(model_id).ok_or(LoaderError::Internal {
                message: format!("Model '{model_id}' not found"),
            })?;
            let file_path = entry.path.clone();
            let filename = entry.filename.clone();
            let slots_to_clear: Vec<String> = cfg
                .slots
                .list_slots()
                .iter()
                .filter(|s| s.assigned_model.as_deref() == Some(model_id))
                .map(|s| s.id.clone())
                .collect();
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
            std::fs::remove_file(&file_path).map_err(|e| LoaderError::Internal {
                message: format!("Failed to delete: {e}"),
            })?;
        }

        // Remove from registry
        {
            let mut reg = self.registry.write().await;
            reg.registry.remove(model_id);
        }

        tracing::info!(model_id = %model_id, filename = %filename, "Model deleted");
        Ok(())
    }

    // ── Voice/Inference read-through — inference read lock ─────
    //
    // Note: `auto_load_hot_slots` was REMOVED on 2026-04-20. Owner directive:
    // models only load via explicit user Apply. The `LoadingStrategy::Hot`
    // variant is retained in the type system as an inert hint — nothing in
    // kernel or engine auto-loads based on it any more.

    /// Synthesize speech.
    ///
    /// # Errors
    /// Returns [`LoaderError::Inference`] if the voice slot is not loaded
    /// or the underlying TTS backend (Kokoro / Piper) fails to synthesize.
    pub async fn synthesize(
        &self,
        slot_id: &str,
        text: &str,
        voice: &str,
    ) -> Result<crate::backends::voice::AudioSamples, LoaderError> {
        let inf = self.inference.read().await;
        inf.voice_pool
            .synthesize(slot_id, text, voice)
            .map_err(|e| LoaderError::Inference {
                slot_id: slot_id.to_string(),
                reason: format!("synthesize failed: {e:#}"),
            })
    }

    /// Transcribe audio.
    ///
    /// # Errors
    /// Returns [`LoaderError::Inference`] if the voice slot is not loaded
    /// or the underlying ASR backend (Whisper) fails to transcribe.
    pub async fn transcribe(
        &self,
        slot_id: &str,
        samples: &crate::backends::voice::AudioSamples,
    ) -> Result<String, LoaderError> {
        let inf = self.inference.read().await;
        inf.voice_pool
            .transcribe(slot_id, samples)
            .map_err(|e| LoaderError::Inference {
                slot_id: slot_id.to_string(),
                reason: format!("transcribe failed: {e:#}"),
            })
    }

    /// Check if a voice model is loaded.
    pub async fn voice_loaded(&self, slot_id: &str) -> bool {
        let inf = self.inference.read().await;
        inf.voice_pool.is_loaded(slot_id)
    }

    /// Embed texts.
    ///
    /// # Errors
    /// Returns [`LoaderError::Inference`] if the embedding slot is not
    /// loaded or the underlying embedder fails on any input text.
    pub async fn embed(
        &self,
        slot_id: &str,
        texts: &[&str],
    ) -> Result<Vec<Vec<f32>>, LoaderError> {
        let inf = self.inference.read().await;
        inf.voice_pool
            .embed(slot_id, texts)
            .map_err(|e| LoaderError::Inference {
                slot_id: slot_id.to_string(),
                reason: format!("embed failed: {e:#}"),
            })
    }

    /// Rerank documents.
    ///
    /// # Errors
    /// Returns [`LoaderError::Inference`] if the reranker slot is not
    /// loaded or scoring fails on any document.
    pub async fn rerank(
        &self,
        slot_id: &str,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<f32>, LoaderError> {
        let inf = self.inference.read().await;
        inf.voice_pool
            .rerank(slot_id, query, documents)
            .map_err(|e| LoaderError::Inference {
                slot_id: slot_id.to_string(),
                reason: format!("rerank failed: {e:#}"),
            })
    }

    /// Encode image file.
    ///
    /// # Errors
    /// Returns [`LoaderError::Inference`] if the image encoder slot is not
    /// loaded, the file cannot be read or decoded, or encoding fails.
    pub async fn encode_image(
        &self,
        slot_id: &str,
        path: &std::path::Path,
    ) -> Result<Vec<f32>, LoaderError> {
        let inf = self.inference.read().await;
        inf.voice_pool
            .encode_image(slot_id, path)
            .map_err(|e| LoaderError::Inference {
                slot_id: slot_id.to_string(),
                reason: format!("encode_image failed: {e:#}"),
            })
    }

    /// Encode raw RGB.
    ///
    /// # Errors
    /// Returns [`LoaderError::Inference`] if the image encoder slot is not
    /// loaded or encoding fails on the supplied RGB buffer.
    pub async fn encode_rgb(
        &self,
        slot_id: &str,
        rgb_bytes: &[u8],
        width: u32,
        height: u32,
    ) -> Result<Vec<f32>, LoaderError> {
        let inf = self.inference.read().await;
        inf.voice_pool
            .encode_rgb(slot_id, rgb_bytes, width, height)
            .map_err(|e| LoaderError::Inference {
                slot_id: slot_id.to_string(),
                reason: format!("encode_rgb failed: {e:#}"),
            })
    }

    /// Search `HuggingFace` (stateless HTTP — no lock).
    ///
    /// # Errors
    /// Returns [`LoaderError::HuggingFace`] if the HTTP request fails
    /// (network, timeout, 401/403/404/5xx). `can_retry` is set on transient
    /// failures (network, 5xx, rate-limit).
    pub async fn search_huggingface(
        &self,
        query: &str,
        limit: u32,
    ) -> Result<Vec<crate::models::search::HfSearchResult>, LoaderError> {
        crate::models::search::search_huggingface(query, limit)
            .await
            .map_err(|e| LoaderError::HuggingFace {
                reason: format!("{e:#}"),
                can_retry: true,
            })
    }
}

// ── Install chain runner ─────────────────────────────────────────
//
// Free fn instead of an inherent method so the spawned task captures
// only the cheap `ModelLoaderService` Clone (every field is Arc, so a
// clone is just refcount bumps) and the oneshot receiver — no need to
// thread `Arc<Self>` through `install_to_slot`.

#[cfg(feature = "candle-backend")]
async fn run_install_chain(
    svc: ModelLoaderService,
    install_id: String,
    slot_id: String,
    rx: tokio::sync::oneshot::Receiver<anyhow::Result<ModelRegistryEntry>>,
) {
    // Stage 1 — wait for the download thread to terminate. Receiver
    // closing without a send means the download thread panicked
    // before it could fire either branch; treat it as a failure with
    // an explicit phase tag.
    let entry = match rx.await {
        Ok(Ok(entry)) => entry,
        Ok(Err(e)) => {
            return emit_install_failed(&svc, &install_id, &slot_id, format!("download: {e}"));
        }
        Err(_) => {
            return emit_install_failed(
                &svc,
                &install_id,
                &slot_id,
                "download: completion channel dropped before result".to_string(),
            );
        }
    };

    let model_id = entry.id.clone();

    // Stage 2 — refresh the registry so `assign_model` sees the new
    // entry. The download thread already constructed the
    // `ModelRegistryEntry` in-memory and emitted `DownloadComplete`,
    // but the on-disk registry only catches up via `scan_models`.
    if let Err(e) = svc.scan_models().await {
        return emit_install_failed(&svc, &install_id, &slot_id, format!("scan: {e:#}"));
    }

    // Stage 3 — assign. Capability mismatches surface here.
    if let Err(e) = svc.assign_model(&slot_id, &model_id).await {
        return emit_install_failed(&svc, &install_id, &slot_id, format!("assign: {e:#}"));
    }

    // Stage 4 — load. Routes through `select_backend` per format.
    if let Err(e) = svc.load_slot(&slot_id).await {
        return emit_install_failed(&svc, &install_id, &slot_id, format!("load: {e:#}"));
    }

    svc.boot.events.emit(LoaderEvent::InstallComplete {
        install_id: install_id.clone(),
        slot_id: slot_id.clone(),
        model_id: model_id.clone(),
    });
    tracing::info!(
        install_id = %install_id,
        slot = %slot_id,
        model = %model_id,
        "Install chain complete"
    );
}

#[cfg(feature = "candle-backend")]
fn emit_install_failed(
    svc: &ModelLoaderService,
    install_id: &str,
    slot_id: &str,
    error: String,
) {
    tracing::warn!(
        install_id = %install_id,
        slot = %slot_id,
        error = %error,
        "Install chain failed"
    );
    svc.boot.events.emit(LoaderEvent::InstallFailed {
        install_id: install_id.to_string(),
        slot_id: slot_id.to_string(),
        error,
    });
}

// ── Tests ────────────────────────────────────────────────────────

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::expect_used)] // tests panic on service-construction / lookup failures by design
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
            kv_cache: crate::slots::KvCacheConfig::default(),
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
            None, // no burn adapter in tests — Burn dispatch returns a clear error
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
