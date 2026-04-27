//! Event sink trait — consumers implement to receive loader lifecycle events.
//!
//! The model loader emits events for every state change: discovery, download,
//! loading, VRAM, hardware, and slot assignment. Consumers wire these into
//! their own persistence, UI, or logging systems.

use crate::hardware::metrics::HardwareMetrics;
use crate::loading::states::{LoadingStage, MemoryFootprint};
use crate::models::registry::ModelRegistryEntry;
use serde::{Deserialize, Serialize};

/// Identifies the engine fulfilling a capability slot at a moment in time.
///
/// The loader stamps a fingerprint on every successful load and caches
/// the previous one per slot. When the next load produces a different
/// `runtime_id`, the engine fires [`LoaderEvent::CapabilityRebound`] —
/// when only `crate_version` / `upstream_revision` / `model_revision`
/// differ, it fires [`LoaderEvent::RuntimeVersionChanged`] instead.
///
/// All four version fields are optional because they're discovered at
/// load time from heterogeneous sources (cargo metadata, vendored fork
/// SHA stamps, HuggingFace LFS oid). A missing field means "not known
/// for this runtime"; the loader still produces a stable fingerprint
/// because `runtime_id` alone is sufficient for rebind detection.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RuntimeFingerprint {
    /// Stable runtime handle — `"candle"`, `"llama-cpp-2"`, `"ort"`,
    /// `"sherpa-onnx-asr"`, `"qwen3-tts-candle"`, `"ollama-external"`,
    /// `"mistralrs"`, `"siglip2-onnx-fixres"`, … Matches the
    /// `runtime_id` field on the frontend `DevtoolMeta` registry.
    pub runtime_id: String,
    /// Cargo crate version of the runtime crate
    /// (`env!("CARGO_PKG_VERSION")` at runtime). `None` for runtimes
    /// that don't ship as a Rust crate (Ollama, system services).
    pub crate_version: Option<String>,
    /// Git commit SHA for vendored forks (`deps/moshi/`, `deps/ort/`,
    /// kokoros, …). `None` when the runtime is consumed unmodified.
    pub upstream_revision: Option<String>,
    /// SHA-256 of the model weights — already computed by the LFS
    /// download verifier for HuggingFace-sourced models. Lets the UI
    /// distinguish "same runtime, new model file" from "same model,
    /// new runtime version".
    pub model_revision: Option<String>,
}

/// Why a capability rebind happened — drives layman-language UI
/// copy in the runtime devtool's Activity tab.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RebindReason {
    /// First load of this slot in the current session — no prior
    /// runtime to compare against.
    InitialLoad,
    /// User explicitly swapped runtimes via the UI / preset apply.
    UserSwap,
    /// Engine fell back to an alternate runtime because the primary
    /// failed (OOM, missing weights, build feature off).
    Fallback,
    /// User accepted an upstream update — the new runtime is the
    /// same engine at a newer version.
    HotUpdate,
}

/// How the Model Loader communicates state changes.
///
/// `DevPulse` implements this with Tauri events + Clyffy narration.
/// Other apps use callbacks, channels, log sinks — whatever fits.
pub trait LoaderEventSink: Send + Sync {
    /// Emit a loader event.
    fn emit(&self, event: LoaderEvent);
}

/// All events the Model Loader can emit.
///
/// Each variant carries the minimum data needed for the consumer to react.
/// Events are serializable so they can cross IPC boundaries (Tauri events,
/// WebSocket, log files).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LoaderEvent {
    // ── Discovery ──────────────────────────────────────────
    /// Model directory scan started.
    RegistryScanStarted,
    /// Scan complete — found N models.
    RegistryScanComplete {
        /// Number of models discovered in the scan.
        models_found: usize,
    },
    /// A model was discovered during scan.
    ModelDiscovered(ModelRegistryEntry),

    // ── Download ───────────────────────────────────────────
    /// Download started from `HuggingFace`.
    DownloadStarted {
        /// Unique download identifier (UUID v7).
        download_id: String,
        /// `HuggingFace` repository ID (e.g. `"bartowski/Qwen3-14B-GGUF"`).
        repo_id: String,
        /// Target filename (e.g. `"Qwen3-14B-Q4_K_M.gguf"`).
        filename: String,
        /// Total expected bytes (0 if unknown until download begins).
        total_bytes: u64,
    },
    /// Download progress update.
    DownloadProgress {
        /// Download identifier matching the `DownloadStarted` event.
        download_id: String,
        /// Bytes downloaded so far.
        bytes_downloaded: u64,
        /// Total expected bytes (from `DownloadStarted`).
        total_bytes: u64,
        /// Current download speed in bytes per second.
        speed_bps: u64,
    },
    /// Download completed successfully.
    DownloadComplete {
        /// Download identifier matching the `DownloadStarted` event.
        download_id: String,
        /// Registry entry for the newly downloaded model.
        registry_entry: ModelRegistryEntry,
    },
    /// Download failed.
    DownloadFailed {
        /// Download identifier matching the `DownloadStarted` event.
        download_id: String,
        /// Human-readable error description.
        error: String,
    },
    /// Download was cancelled by user.
    DownloadCancelled {
        /// Download identifier that was cancelled.
        download_id: String,
    },

    // ── Loading ────────────────────────────────────────────
    /// Model loading started for a slot.
    LoadingStarted {
        /// Slot being loaded (e.g. `"chat.brain"`).
        slot_id: String,
        /// Registry ID of the model being loaded.
        model_id: String,
    },
    /// Loading stage progress.
    LoadingStage {
        /// Slot being loaded.
        slot_id: String,
        /// Current loading stage.
        stage: LoadingStage,
        /// Progress percentage (0.0–100.0).
        progress_pct: f32,
    },
    /// Loading completed successfully.
    LoadingComplete {
        /// Slot that finished loading.
        slot_id: String,
        /// Memory consumed by the loaded model.
        memory: MemoryFootprint,
    },
    /// Loading failed.
    LoadingFailed {
        /// Slot that failed to load.
        slot_id: String,
        /// Human-readable error description.
        error: String,
    },
    /// Model unloaded, memory freed.
    UnloadComplete {
        /// Slot that was unloaded.
        slot_id: String,
        /// Memory freed by the unload.
        freed: MemoryFootprint,
    },

    // ── Swap ───────────────────────────────────────────────
    /// Atomic model swap started (unload → reassign → load).
    SwapStarted {
        /// Slot being swapped.
        slot_id: String,
        /// Registry ID of the model being replaced (None if slot was empty).
        from_model: Option<String>,
        /// Registry ID of the new model being loaded.
        to_model: String,
    },
    /// Swap completed successfully — new model is loaded and ready.
    SwapComplete {
        /// Slot that finished swapping.
        slot_id: String,
        /// Registry ID of the now-loaded model.
        model_id: String,
    },
    /// Swap failed — slot may be in an unloaded state.
    SwapFailed {
        /// Slot that failed to swap.
        slot_id: String,
        /// Human-readable error description.
        error: String,
    },

    // ── VRAM ───────────────────────────────────────────────
    /// VRAM budget exceeded — load cannot proceed without action.
    VramInsufficient {
        /// VRAM needed for the requested load (MB).
        needed_mb: u64,
        /// VRAM currently available (MB).
        available_mb: u64,
        /// Human-readable suggestions for freeing VRAM.
        suggestions: Vec<String>,
    },

    // ── Hardware ───────────────────────────────────────────
    /// Hardware metrics updated (emitted on poll).
    HardwareMetricsUpdated(HardwareMetrics),

    // ── Slot ───────────────────────────────────────────────
    /// A model was assigned to a slot.
    SlotAssigned {
        /// Slot that received the assignment.
        slot_id: String,
        /// Registry ID of the assigned model.
        model_id: String,
    },
    /// A slot was unassigned.
    SlotUnassigned {
        /// Slot that was cleared.
        slot_id: String,
    },

    // ── Capability / runtime ───────────────────────────────
    /// A capability slot is now fulfilled by a different runtime.
    ///
    /// Fired when the loader observes that the same `slot_id` (treated
    /// as the capability handle — `voice.stt`, `voice.tts`,
    /// `vision.embedder`, `chat.brain`) now resolves to a different
    /// `runtime_id` than the prior load. Frontend consumers of the
    /// capability channel rebind to the new runtime without restart.
    ///
    /// `from_runtime` is `None` on the very first load of a slot in
    /// the current session — `reason == InitialLoad` in that case.
    CapabilityRebound {
        /// Capability handle — slot id verbatim (`voice.stt`, …).
        capability: String,
        /// Previous runtime, if there was one.
        from_runtime: Option<String>,
        /// Newly active runtime.
        to_runtime: String,
        /// Why the rebind happened.
        reason: RebindReason,
    },
    /// A runtime's version changed without the runtime itself changing.
    ///
    /// Fired when the loader observes that the same `runtime_id` is
    /// now reporting a different `crate_version` / `upstream_revision`
    /// / `model_revision` than the prior load. Lets the UI surface
    /// "Sherpa-ONNX upgraded to 1.13.4" without conflating it with a
    /// runtime swap.
    RuntimeVersionChanged {
        /// Runtime that changed version.
        runtime_id: String,
        /// Fingerprint at the previous load. `None` on first load.
        old_fingerprint: Option<RuntimeFingerprint>,
        /// Fingerprint at the current load.
        new_fingerprint: RuntimeFingerprint,
    },
}

/// Blanket impl for Arc — allows `Arc<dyn LoaderEventSink>` to be used directly.
impl<T: LoaderEventSink + ?Sized> LoaderEventSink for std::sync::Arc<T> {
    fn emit(&self, event: LoaderEvent) {
        (**self).emit(event);
    }
}

/// No-op event sink for testing or headless operation.
#[derive(Debug, Default)]
pub struct NullEventSink;

impl LoaderEventSink for NullEventSink {
    fn emit(&self, _event: LoaderEvent) {
        // Intentionally empty — events discarded.
    }
}

/// Logging event sink — writes events to tracing.
#[derive(Debug, Default)]
pub struct TracingEventSink;

impl LoaderEventSink for TracingEventSink {
    fn emit(&self, event: LoaderEvent) {
        match &event {
            LoaderEvent::LoadingStarted { slot_id, model_id } => {
                tracing::info!(slot = %slot_id, model = %model_id, "Model loading started");
            }
            LoaderEvent::LoadingComplete { slot_id, memory } => {
                tracing::info!(
                    slot = %slot_id,
                    ram_mb = memory.ram_mb(),
                    vram_mb = memory.vram_mb(),
                    "Model loading complete"
                );
            }
            LoaderEvent::LoadingFailed { slot_id, error } => {
                tracing::error!(slot = %slot_id, error = %error, "Model loading failed");
            }
            LoaderEvent::VramInsufficient {
                needed_mb,
                available_mb,
                ..
            } => {
                tracing::warn!(
                    needed_mb,
                    available_mb,
                    "VRAM insufficient for requested load"
                );
            }
            LoaderEvent::SwapStarted {
                slot_id,
                from_model,
                to_model,
            } => {
                tracing::info!(
                    slot = %slot_id,
                    from = ?from_model,
                    to = %to_model,
                    "Model swap started"
                );
            }
            LoaderEvent::SwapComplete { slot_id, model_id } => {
                tracing::info!(slot = %slot_id, model = %model_id, "Model swap complete");
            }
            LoaderEvent::SwapFailed { slot_id, error } => {
                tracing::error!(slot = %slot_id, error = %error, "Model swap failed");
            }
            LoaderEvent::CapabilityRebound {
                capability,
                from_runtime,
                to_runtime,
                reason,
            } => {
                tracing::info!(
                    capability = %capability,
                    from = ?from_runtime,
                    to = %to_runtime,
                    reason = ?reason,
                    "Capability rebound to new runtime"
                );
            }
            LoaderEvent::RuntimeVersionChanged {
                runtime_id,
                old_fingerprint,
                new_fingerprint,
            } => {
                tracing::info!(
                    runtime = %runtime_id,
                    old_crate_version = ?old_fingerprint.as_ref().and_then(|f| f.crate_version.as_ref()),
                    new_crate_version = ?new_fingerprint.crate_version,
                    old_upstream = ?old_fingerprint.as_ref().and_then(|f| f.upstream_revision.as_ref()),
                    new_upstream = ?new_fingerprint.upstream_revision,
                    "Runtime version changed"
                );
            }
            _ => {
                tracing::debug!("LoaderEvent: {event:?}");
            }
        }
    }
}
