//! Event sink trait — consumers implement to receive loader lifecycle events.

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
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LoaderEvent {
    // ── Discovery ──────────────────────────────────────────
    /// Model directory scan started.
    RegistryScanStarted,
    /// Scan complete — found N models.
    RegistryScanComplete { models_found: usize },
    /// A model was discovered during scan.
    ModelDiscovered(ModelRegistryEntry),

    // ── Download ───────────────────────────────────────────
    /// Download started from HuggingFace.
    DownloadStarted {
        download_id: String,
        repo_id: String,
        filename: String,
        total_bytes: u64,
    },
    /// Download progress update.
    DownloadProgress {
        download_id: String,
        bytes_downloaded: u64,
        speed_bps: u64,
    },
    /// Download completed successfully.
    DownloadComplete {
        download_id: String,
        registry_entry: ModelRegistryEntry,
    },
    /// Download failed.
    DownloadFailed {
        download_id: String,
        error: String,
    },
    /// Download was cancelled by user.
    DownloadCancelled { download_id: String },

    // ── Loading ────────────────────────────────────────────
    /// Model loading started for a slot.
    LoadingStarted {
        slot_id: String,
        model_id: String,
    },
    /// Loading stage progress.
    LoadingStage {
        slot_id: String,
        stage: LoadingStage,
        progress_pct: f32,
    },
    /// Loading completed successfully.
    LoadingComplete {
        slot_id: String,
        memory: MemoryFootprint,
    },
    /// Loading failed.
    LoadingFailed {
        slot_id: String,
        error: String,
    },
    /// Model unloaded, memory freed.
    UnloadComplete {
        slot_id: String,
        freed: MemoryFootprint,
    },

    // ── VRAM ───────────────────────────────────────────────
    /// VRAM budget exceeded — load cannot proceed without action.
    VramInsufficient {
        needed_mb: u64,
        available_mb: u64,
        suggestions: Vec<String>,
    },

    // ── Hardware ───────────────────────────────────────────
    /// Hardware metrics updated (emitted on poll).
    HardwareMetricsUpdated(HardwareMetrics),

    // ── Slot ───────────────────────────────────────────────
    /// A model was assigned to a slot.
    SlotAssigned {
        slot_id: String,
        model_id: String,
    },
    /// A slot was unassigned.
    SlotUnassigned { slot_id: String },
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
            _ => {
                tracing::debug!("LoaderEvent: {event:?}");
            }
        }
    }
}
