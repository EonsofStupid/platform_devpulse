//! Event bridge — routes model-loader events to Tauri frontend.
//!
//! `TauriEventBridge` implements `LoaderEventSink` and emits Tauri events
//! so the frontend receives real-time loading progress, download status,
//! and slot changes. No more file-only logging.

pub use devpulse_clyffy::model_loader::TracingEventSink;

use devpulse_clyffy::model_loader::{LoaderEvent, LoaderEventSink};
use serde_json::json;
use std::sync::Arc;

/// Event bridge that emits model-loader events as Tauri events.
///
/// The `AppHandle` is stored as an opaque `Arc<dyn EmitFn>` so this module
/// doesn't depend on `tauri` directly (engine crate has no tauri dep).
/// The desktop crate passes a closure that captures the AppHandle.
pub struct EventBridge {
    emit_fn: Arc<dyn Fn(&str, serde_json::Value) + Send + Sync>,
}

impl EventBridge {
    /// Create a new event bridge with a Tauri emit function.
    pub fn new(emit_fn: Arc<dyn Fn(&str, serde_json::Value) + Send + Sync>) -> Self {
        Self { emit_fn }
    }
}

impl LoaderEventSink for EventBridge {
    fn emit(&self, event: LoaderEvent) {
        let (event_name, payload) = match &event {
            LoaderEvent::LoadingStarted { slot_id, model_id } => (
                "model:loading-started",
                json!({ "slot_id": slot_id, "model_id": model_id }),
            ),
            LoaderEvent::LoadingStage {
                slot_id,
                stage,
                progress_pct,
            } => (
                "model:loading-stage",
                json!({ "slot_id": slot_id, "stage": format!("{stage:?}"), "progress": progress_pct }),
            ),
            LoaderEvent::LoadingComplete { slot_id, memory } => (
                "model:loading-complete",
                json!({ "slot_id": slot_id, "ram_mb": memory.ram_mb(), "vram_mb": memory.vram_mb() }),
            ),
            LoaderEvent::LoadingFailed { slot_id, error } => (
                "model:loading-failed",
                json!({ "slot_id": slot_id, "error": error }),
            ),
            LoaderEvent::UnloadComplete { slot_id, freed } => (
                "model:unload-complete",
                json!({ "slot_id": slot_id, "freed_ram_mb": freed.ram_mb(), "freed_vram_mb": freed.vram_mb() }),
            ),
            LoaderEvent::DownloadStarted {
                download_id,
                repo_id,
                filename,
                total_bytes,
            } => (
                "model:download-started",
                json!({ "download_id": download_id, "repo_id": repo_id, "filename": filename, "totalBytes": total_bytes }),
            ),
            LoaderEvent::DownloadProgress {
                download_id,
                bytes_downloaded,
                total_bytes,
                speed_bps,
            } => (
                "model:download-progress",
                json!({ "download_id": download_id, "bytesDownloaded": bytes_downloaded, "totalBytes": total_bytes, "speedBps": speed_bps }),
            ),
            LoaderEvent::DownloadComplete {
                download_id,
                registry_entry,
            } => (
                "model:download-complete",
                json!({ "download_id": download_id, "model_id": registry_entry.id, "filename": registry_entry.filename }),
            ),
            LoaderEvent::DownloadFailed {
                download_id,
                error,
            } => (
                "model:download-failed",
                json!({ "download_id": download_id, "error": error }),
            ),
            LoaderEvent::SlotAssigned { slot_id, model_id } => (
                "model:slot-assigned",
                json!({ "slot_id": slot_id, "model_id": model_id }),
            ),
            LoaderEvent::SwapStarted {
                slot_id,
                from_model,
                to_model,
            } => (
                "model:swap-started",
                json!({ "slot_id": slot_id, "from_model": from_model, "to_model": to_model }),
            ),
            LoaderEvent::SwapComplete { slot_id, model_id } => (
                "model:swap-complete",
                json!({ "slot_id": slot_id, "model_id": model_id }),
            ),
            LoaderEvent::SwapFailed { slot_id, error } => (
                "model:swap-failed",
                json!({ "slot_id": slot_id, "error": error }),
            ),
            _ => {
                // Other events: log via tracing, don't emit to frontend
                tracing::debug!(event = ?event, "Model loader event (not bridged)");
                return;
            }
        };

        // Also log via tracing for the session log
        tracing::info!(event = event_name, %payload, "Model loader event → frontend");
        (self.emit_fn)(event_name, payload);
    }
}
