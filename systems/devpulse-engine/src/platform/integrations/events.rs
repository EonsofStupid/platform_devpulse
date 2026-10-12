//! Event bridge — routes model-loader events to the frontend.
//!
//! `EventBridge` implements `LoaderEventSink`. Event families already on the
//! signal fabric are published as typed signals (plan 0004 Part A); the
//! remaining families still go out as legacy string events until their
//! phase moves them. Each family has exactly one path at any time.

pub use devpulse_clyffy::model_loader::TracingEventSink;

use crate::signals::{Signal, SignalSource, SignalVariant};
use devpulse_clyffy::model_loader::{LoaderEvent, LoaderEventSink};
use serde_json::json;
use std::sync::Arc;

/// Type-erased Tauri emit callback. Extracted from the inline
/// `Arc<dyn Fn(&str, serde_json::Value) + Send + Sync>` so the field
/// type, the `new` constructor, and any downstream signature share one
/// definition (clippy `type_complexity` fires on the inline form, and
/// the doc value of a single named type beats a 4-bound closure
/// repeated three times).
pub type TauriEmitFn = Arc<dyn Fn(&str, serde_json::Value) + Send + Sync>;

/// Publishes a typed signal into the engine's signal fabric. The desktop
/// crate passes a closure over its managed `Engine` (`Engine::emit`).
pub type SignalPublishFn = Arc<dyn Fn(Signal) + Send + Sync>;

/// Event bridge from model-loader events to the frontend.
///
/// The `AppHandle` and `Engine` are reached through opaque callbacks so this
/// module doesn't depend on `tauri` directly (engine crate has no tauri dep).
pub struct EventBridge {
    emit_fn: TauriEmitFn,
    publish: SignalPublishFn,
}

impl EventBridge {
    /// Create a new event bridge: `emit_fn` for families still on legacy
    /// string events, `publish` for families on the signal fabric.
    #[must_use]
    pub fn new(emit_fn: TauriEmitFn, publish: SignalPublishFn) -> Self {
        Self { emit_fn, publish }
    }
}

impl LoaderEventSink for EventBridge {
    #[expect(
        clippy::too_many_lines,
        reason = "central event dispatch — one match arm per `LoaderEvent` variant. Decomposing by event family would obscure the readable variant → wire-payload mapping; each arm is 3-7 lines and lives next to the variant it handles."
    )]
    fn emit(&self, event: LoaderEvent) {
        // Families on the signal fabric.
        if let LoaderEvent::HardwareMetricsUpdated(metrics) = event {
            (self.publish)(Signal::new(SignalSource::System, SignalVariant::Hardware(metrics)));
            return;
        }

        // Legacy string events. Frontend wire payloads stay snake_case so
        // every Rust-originated event follows one predictable contract.
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
                json!({ "slot_id": slot_id, "stage": format!("{stage:?}"), "progress_pct": progress_pct }),
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
                json!({ "download_id": download_id, "repo_id": repo_id, "filename": filename, "total_bytes": total_bytes }),
            ),
            LoaderEvent::DownloadProgress {
                download_id,
                bytes_downloaded,
                total_bytes,
                speed_bps,
            } => (
                "model:download-progress",
                json!({ "download_id": download_id, "bytes_downloaded": bytes_downloaded, "total_bytes": total_bytes, "speed_bps": speed_bps }),
            ),
            LoaderEvent::DownloadComplete {
                download_id,
                registry_entry,
            } => (
                "model:download-complete",
                json!({ "download_id": download_id, "model_id": registry_entry.id, "filename": registry_entry.filename }),
            ),
            LoaderEvent::DownloadFailed { download_id, error } => (
                "model:download-failed",
                json!({ "download_id": download_id, "error": error }),
            ),
            LoaderEvent::DownloadCancelled { download_id } => (
                "model:download-cancelled",
                json!({ "download_id": download_id }),
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
            LoaderEvent::InstallStarted {
                install_id,
                repo_id,
                primary_filename,
                slot_id,
            } => (
                "model:install-started",
                json!({
                    "install_id": install_id,
                    "repo_id": repo_id,
                    "primary_filename": primary_filename,
                    "slot_id": slot_id,
                }),
            ),
            LoaderEvent::InstallComplete {
                install_id,
                slot_id,
                model_id,
            } => (
                "model:install-complete",
                json!({
                    "install_id": install_id,
                    "slot_id": slot_id,
                    "model_id": model_id,
                }),
            ),
            LoaderEvent::InstallFailed {
                install_id,
                slot_id,
                error,
            } => (
                "model:install-failed",
                json!({
                    "install_id": install_id,
                    "slot_id": slot_id,
                    "error": error,
                }),
            ),
            LoaderEvent::CapabilityRebound {
                capability,
                from_runtime,
                to_runtime,
                reason,
            } => (
                "model:capability-rebound",
                json!({
                    "capability": capability,
                    "from_runtime": from_runtime,
                    "to_runtime": to_runtime,
                    "reason": reason,
                }),
            ),
            LoaderEvent::RuntimeVersionChanged {
                runtime_id,
                old_fingerprint,
                new_fingerprint,
            } => (
                "model:runtime-version-changed",
                json!({
                    "runtime_id": runtime_id,
                    "old_fingerprint": old_fingerprint,
                    "new_fingerprint": new_fingerprint,
                }),
            ),
            // ── Wizard cortex lifecycle → frontend bridge ─────────
            //
            // Bridged so devtool surfaces (cortex devtool mirror,
            // ActivityHUD wizard channel) can render live state
            // without polling the loader. Matches the dual-
            // observability contract — kernel emits, sink fans out
            // to both tracing and the IPC channel.
            LoaderEvent::WizardTileApplied { slot_id, model_id } => (
                "model:wizard-tile-applied",
                json!({
                    "slot_id": slot_id,
                    "model_id": model_id,
                }),
            ),
            LoaderEvent::WizardSymlinkArmed {
                slot_id,
                link_path,
                target_path,
            } => (
                "model:wizard-symlink-armed",
                json!({
                    "slot_id": slot_id,
                    "link_path": link_path,
                    "target_path": target_path,
                }),
            ),
            LoaderEvent::WizardSymlinkFailed { slot_id, error } => (
                "model:wizard-symlink-failed",
                json!({
                    "slot_id": slot_id,
                    "error": error,
                }),
            ),
            LoaderEvent::WizardCortexComplete {
                slots_saved,
                duration_ms,
            } => (
                "model:wizard-cortex-complete",
                json!({
                    "slots_saved": slots_saved,
                    "duration_ms": duration_ms,
                }),
            ),
            // ── Intelligence pipeline → frontend bridge ───────────
            //
            // `intel:*` channel is the live mirror feed for
            // `/devtools/clyffy/memory/intelligence`. The view
            // listens for these three events in arrival order and
            // renders one card per memory the cortex pipeline
            // produced from a chat turn.
            LoaderEvent::IntelligenceClassifyStarted {
                project_slug,
                content_len,
            } => (
                "intel:classify-started",
                json!({
                    "project_slug": project_slug,
                    "content_len": content_len,
                }),
            ),
            LoaderEvent::IntelligenceEmbedComplete {
                project_slug,
                dim,
                duration_ms,
            } => (
                "intel:embed-complete",
                json!({
                    "project_slug": project_slug,
                    "dim": dim,
                    "duration_ms": duration_ms,
                }),
            ),
            LoaderEvent::IntelligenceMemorySaved {
                project_slug,
                memory_id,
            } => (
                "intel:memory-saved",
                json!({
                    "project_slug": project_slug,
                    "memory_id": memory_id,
                }),
            ),
            LoaderEvent::ReasoningEscalated {
                project_slug,
                backend,
            } => (
                "intel:reasoning-escalated",
                json!({
                    "project_slug": project_slug,
                    "backend": backend,
                }),
            ),
            LoaderEvent::ClaudeApiActivated { key_present } => (
                "intel:claude-activated",
                json!({
                    "key_present": key_present,
                }),
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
