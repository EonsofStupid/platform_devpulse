//! Event sink trait — consumers implement to receive loader lifecycle events.
//!
//! The model loader emits events for every state change: discovery, download,
//! loading, VRAM, hardware, and slot assignment. Consumers wire these into
//! their own persistence, UI, or logging systems.

use crate::hardware::metrics::HardwareMetrics;
use crate::loading::states::{LoadingStage, MemoryFootprint};
use crate::models::registry::ModelRegistryEntry;
use serde::{Deserialize, Serialize};

/// How the Model Loader communicates state changes.
///
/// DevPulse implements this with Tauri events + Clyffy narration.
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
    /// Download started from HuggingFace.
    DownloadStarted {
        /// Unique download identifier (UUID v7).
        download_id: String,
        /// HuggingFace repository ID (e.g. `"bartowski/Qwen3-14B-GGUF"`).
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
            LoaderEvent::SwapStarted { slot_id, from_model, to_model } => {
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
            _ => {
                tracing::debug!("LoaderEvent: {event:?}");
            }
        }
    }
}
