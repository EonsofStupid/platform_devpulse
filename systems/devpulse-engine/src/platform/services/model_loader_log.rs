//! Model Loader log sink — colocated kitchen-sink log file.
//!
//! Writes ALL model-loader events to `{data_dir}/logs/model-loader.log`.
//! Catches every critical point: downloads, loads, failures, crashes, VRAM events.
//! This file is the forensic record — nothing is silently swallowed.

use devpulse_clyffy::model_loader::{LoaderEvent, LoaderEventSink};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

/// File-based event sink that logs every model-loader event to disk.
///
/// Also forwards to tracing for console output.
pub struct FileEventSink {
    path: PathBuf,
    writer: Mutex<Option<std::fs::File>>,
}

impl FileEventSink {
    /// Create a new file event sink at the given path.
    ///
    /// Creates parent directories if needed. If the file can't be opened,
    /// events are still forwarded to tracing (degraded mode, not silent).
    pub fn new(log_path: PathBuf) -> Self {
        if let Some(parent) = log_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let writer = match std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)
        {
            Ok(file) => {
                tracing::info!(path = %log_path.display(), "Model Loader log opened");
                Some(file)
            }
            Err(e) => {
                tracing::error!(
                    path = %log_path.display(),
                    error = %e,
                    "FAILED to open model-loader log — events will only go to tracing"
                );
                None
            }
        };

        Self {
            path: log_path,
            writer: Mutex::new(writer),
        }
    }

    /// Write a timestamped line to the log file.
    fn write_line(&self, level: &str, message: &str) {
        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
        let line = format!("[{timestamp}] [{level}] {message}\n");

        if let Ok(mut guard) = self.writer.lock() {
            if let Some(ref mut file) = *guard {
                let _ = file.write_all(line.as_bytes());
                let _ = file.flush();
            }
        }
    }

    /// Get the log file path (for health reporting).
    #[must_use]
    pub fn path(&self) -> &PathBuf {
        &self.path
    }
}

impl LoaderEventSink for FileEventSink {
    #[expect(
        clippy::too_many_lines,
        reason = "central file-log dispatch — one match arm per `LoaderEvent` variant. Decomposing by event family would fragment the readable variant → log-line mapping; each arm is 2-5 lines and the function does exactly one thing (dispatch)."
    )]
    fn emit(&self, event: LoaderEvent) {
        match &event {
            // ── Discovery ──────────────────────────────────────────
            LoaderEvent::RegistryScanStarted => {
                self.write_line("INFO", "Registry scan started");
                tracing::info!("[model-loader] Registry scan started");
            }
            LoaderEvent::RegistryScanComplete { models_found } => {
                self.write_line(
                    "INFO",
                    &format!("Registry scan complete: {models_found} models found"),
                );
                tracing::info!(models_found, "[model-loader] Registry scan complete");
            }
            LoaderEvent::ModelDiscovered(entry) => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Model discovered: {} ({}, {}MB, VRAM ~{}MB)",
                        entry.filename,
                        entry.architecture,
                        entry.size_bytes / (1024 * 1024),
                        entry.vram_estimate_mb,
                    ),
                );
                tracing::debug!(
                    filename = %entry.filename,
                    arch = %entry.architecture,
                    "[model-loader] Model discovered"
                );
            }

            // ── Downloads ──────────────────────────────────────────
            LoaderEvent::DownloadStarted {
                download_id,
                repo_id,
                filename,
                total_bytes,
            } => {
                self.write_line(
                    "INFO",
                    &format!("Download STARTED: {repo_id}/{filename} (id={download_id}, {total_bytes} bytes)"),
                );
                tracing::info!(
                    download_id = %download_id,
                    repo = %repo_id,
                    file = %filename,
                    "[model-loader] Download started"
                );
            }
            LoaderEvent::DownloadProgress {
                download_id,
                bytes_downloaded,
                total_bytes,
                speed_bps,
            } => {
                self.write_line(
                    "DEBUG",
                    &format!("Download progress: id={download_id} bytes={bytes_downloaded}/{total_bytes} speed={speed_bps}B/s"),
                );
            }
            LoaderEvent::DownloadComplete {
                download_id,
                registry_entry,
            } => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Download COMPLETE: id={download_id} file={} ({}MB)",
                        registry_entry.filename,
                        registry_entry.size_bytes / (1024 * 1024),
                    ),
                );
                tracing::info!(
                    download_id = %download_id,
                    filename = %registry_entry.filename,
                    "[model-loader] Download complete"
                );
            }
            LoaderEvent::DownloadFailed { download_id, error } => {
                self.write_line(
                    "ERROR",
                    &format!("Download FAILED: id={download_id} error={error}"),
                );
                tracing::error!(
                    download_id = %download_id,
                    error = %error,
                    "[model-loader] Download FAILED"
                );
            }
            LoaderEvent::DownloadCancelled { download_id } => {
                self.write_line("WARN", &format!("Download CANCELLED: id={download_id}"));
                tracing::warn!(download_id = %download_id, "[model-loader] Download cancelled");
            }

            // ── Loading ────────────────────────────────────────────
            LoaderEvent::LoadingStarted { slot_id, model_id } => {
                self.write_line(
                    "INFO",
                    &format!("Loading STARTED: slot={slot_id} model={model_id}"),
                );
                tracing::info!(slot = %slot_id, model = %model_id, "[model-loader] Loading started");
            }
            LoaderEvent::LoadingStage {
                slot_id,
                stage,
                progress_pct,
            } => {
                self.write_line(
                    "DEBUG",
                    &format!(
                        "Loading stage: slot={slot_id} stage={stage} progress={progress_pct:.0}%"
                    ),
                );
            }
            LoaderEvent::LoadingComplete { slot_id, memory } => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Loading COMPLETE: slot={slot_id} RAM={}MB VRAM={}MB",
                        memory.ram_mb(),
                        memory.vram_mb(),
                    ),
                );
                tracing::info!(
                    slot = %slot_id,
                    ram_mb = memory.ram_mb(),
                    vram_mb = memory.vram_mb(),
                    "[model-loader] Loading complete"
                );
            }
            LoaderEvent::LoadingFailed { slot_id, error } => {
                self.write_line(
                    "ERROR",
                    &format!("Loading FAILED: slot={slot_id} error={error}"),
                );
                tracing::error!(slot = %slot_id, error = %error, "[model-loader] Loading FAILED");
            }
            LoaderEvent::UnloadComplete { slot_id, freed } => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Unload complete: slot={slot_id} freed RAM={}MB VRAM={}MB",
                        freed.ram_mb(),
                        freed.vram_mb(),
                    ),
                );
                tracing::info!(slot = %slot_id, "[model-loader] Unload complete");
            }

            // ── VRAM ───────────────────────────────────────────────
            LoaderEvent::VramInsufficient {
                needed_mb,
                available_mb,
                suggestions,
            } => {
                self.write_line(
                    "WARN",
                    &format!(
                        "VRAM INSUFFICIENT: needed={needed_mb}MB available={available_mb}MB suggestions={}",
                        suggestions.join(", "),
                    ),
                );
                tracing::warn!(needed_mb, available_mb, "[model-loader] VRAM insufficient");
            }

            // ── Hardware ───────────────────────────────────────────
            LoaderEvent::HardwareMetricsUpdated(_metrics) => {
                // Debug-only, don't spam the log
            }

            // ── Slot assignments ───────────────────────────────────
            LoaderEvent::SlotAssigned { slot_id, model_id } => {
                self.write_line("INFO", &format!("Slot ASSIGNED: {slot_id} <- {model_id}"));
                tracing::info!(slot = %slot_id, model = %model_id, "[model-loader] Slot assigned");
            }
            LoaderEvent::SlotUnassigned { slot_id } => {
                self.write_line("INFO", &format!("Slot UNASSIGNED: {slot_id}"));
                tracing::info!(slot = %slot_id, "[model-loader] Slot unassigned");
            }

            // ── Swap ──────────────────────────────────────────────
            LoaderEvent::SwapStarted {
                slot_id,
                from_model,
                to_model,
            } => {
                self.write_line(
                    "INFO",
                    &format!("Swap STARTED: slot={slot_id} from={from_model:?} to={to_model}"),
                );
                tracing::info!(slot = %slot_id, from = ?from_model, to = %to_model, "[model-loader] Swap started");
            }
            LoaderEvent::SwapComplete { slot_id, model_id } => {
                self.write_line(
                    "INFO",
                    &format!("Swap COMPLETE: slot={slot_id} model={model_id}"),
                );
                tracing::info!(slot = %slot_id, model = %model_id, "[model-loader] Swap complete");
            }
            LoaderEvent::SwapFailed { slot_id, error } => {
                self.write_line(
                    "ERROR",
                    &format!("Swap FAILED: slot={slot_id} error={error}"),
                );
                tracing::error!(slot = %slot_id, error = %error, "[model-loader] Swap FAILED");
            }

            // ── Capability / runtime ───────────────────────────────
            LoaderEvent::CapabilityRebound {
                capability,
                from_runtime,
                to_runtime,
                reason,
            } => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Capability REBOUND: cap={capability} from={from_runtime:?} to={to_runtime} reason={reason:?}",
                    ),
                );
                tracing::info!(
                    capability = %capability,
                    from = ?from_runtime,
                    to = %to_runtime,
                    reason = ?reason,
                    "[model-loader] Capability rebound"
                );
            }
            LoaderEvent::RuntimeVersionChanged {
                runtime_id,
                old_fingerprint,
                new_fingerprint,
            } => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Runtime VERSION CHANGED: runtime={runtime_id} old={old_fingerprint:?} new={new_fingerprint:?}",
                    ),
                );
                tracing::info!(
                    runtime = %runtime_id,
                    "[model-loader] Runtime version changed"
                );
            }

            // ── Install (one-button download → assign → load) ─────
            LoaderEvent::InstallStarted {
                install_id,
                repo_id,
                primary_filename,
                slot_id,
            } => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Install STARTED: id={install_id} repo={repo_id} primary={primary_filename} slot={slot_id}",
                    ),
                );
                tracing::info!(
                    install_id = %install_id,
                    repo = %repo_id,
                    file = %primary_filename,
                    slot = %slot_id,
                    "[model-loader] Install started"
                );
            }
            LoaderEvent::InstallComplete {
                install_id,
                slot_id,
                model_id,
            } => {
                self.write_line(
                    "INFO",
                    &format!("Install COMPLETE: id={install_id} slot={slot_id} model={model_id}",),
                );
                tracing::info!(
                    install_id = %install_id,
                    slot = %slot_id,
                    model = %model_id,
                    "[model-loader] Install complete"
                );
            }
            LoaderEvent::InstallFailed {
                install_id,
                slot_id,
                error,
            } => {
                self.write_line(
                    "ERROR",
                    &format!("Install FAILED: id={install_id} slot={slot_id} error={error}",),
                );
                tracing::error!(
                    install_id = %install_id,
                    slot = %slot_id,
                    error = %error,
                    "[model-loader] Install FAILED"
                );
            }

            // ── Wizard cortex lifecycle ────────────────────────────
            //
            // Sink writes layman-friendly lines to the user-visible
            // model-loader log AND emits structured `tracing` on the
            // shared `wizard.lifecycle` target so the dual-observability
            // contract holds at THIS sink too. The same events also
            // surface through `TracingEventSink` (see
            // `kernel/model-loader/src/traits/events.rs`); this sink is
            // additive — file-backed for user-facing log review.
            LoaderEvent::WizardTileApplied { slot_id, model_id } => {
                let model_display = model_id.as_deref().unwrap_or("(resolving)");
                self.write_line(
                    "INFO",
                    &format!("Wizard tile applied: slot={slot_id} model={model_display}"),
                );
                tracing::info!(
                    target: "wizard.lifecycle",
                    slot_id = %slot_id,
                    model_id = ?model_id,
                    "[wizard] Tile applied"
                );
            }
            LoaderEvent::WizardSymlinkArmed {
                slot_id,
                link_path,
                target_path,
            } => {
                self.write_line(
                    "INFO",
                    &format!("Wizard slot armed: slot={slot_id} link={link_path} -> {target_path}"),
                );
                tracing::info!(
                    target: "wizard.lifecycle",
                    slot_id = %slot_id,
                    link_path = %link_path,
                    target_path = %target_path,
                    "[wizard] Symlink armed"
                );
            }
            LoaderEvent::WizardSymlinkFailed { slot_id, error } => {
                self.write_line(
                    "WARN",
                    &format!("Wizard slot symlink FAILED: slot={slot_id} error={error}"),
                );
                tracing::warn!(
                    target: "wizard.lifecycle",
                    slot_id = %slot_id,
                    error = %error,
                    "[wizard] Symlink FAILED"
                );
            }
            LoaderEvent::WizardCortexComplete {
                slots_saved,
                duration_ms,
            } => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Wizard cortex complete: {slots_saved} slot(s) saved in {duration_ms}ms"
                    ),
                );
                tracing::info!(
                    target: "wizard.lifecycle",
                    slots_saved,
                    duration_ms,
                    "[wizard] Cortex complete"
                );
            }

            // ── Intelligence pipeline ──────────────────────────────
            //
            // Layman-friendly log lines for the user-visible
            // model-loader log plus structured tracing on
            // `intel.pipeline` so the cortex devtool's live mirror
            // and post-hoc replay both have the same signal.
            LoaderEvent::IntelligenceClassifyStarted {
                project_slug,
                content_len,
            } => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Intel pipeline START: project={project_slug} content_len={content_len}"
                    ),
                );
                tracing::info!(
                    target: "intel.pipeline",
                    project_slug = %project_slug,
                    content_len,
                    "[intel] Chat turn entered pipeline"
                );
            }
            LoaderEvent::IntelligenceEmbedComplete {
                project_slug,
                dim,
                duration_ms,
            } => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Intel pipeline EMBED: project={project_slug} dim={dim} ms={duration_ms}"
                    ),
                );
                tracing::info!(
                    target: "intel.pipeline",
                    project_slug = %project_slug,
                    dim,
                    duration_ms,
                    "[intel] Embedding produced"
                );
            }
            LoaderEvent::IntelligenceMemorySaved {
                project_slug,
                memory_id,
            } => {
                self.write_line(
                    "INFO",
                    &format!("Intel pipeline SAVED: project={project_slug} memory_id={memory_id}"),
                );
                tracing::info!(
                    target: "intel.pipeline",
                    project_slug = %project_slug,
                    memory_id = %memory_id,
                    "[intel] Memory persisted"
                );
            }
            LoaderEvent::ReasoningEscalated {
                project_slug,
                backend,
            } => {
                self.write_line(
                    "INFO",
                    &format!("Reasoning escalated: project={project_slug} backend={backend}"),
                );
                tracing::info!(
                    target: "intel.pipeline",
                    project_slug = %project_slug,
                    backend = %backend,
                    "[intel] Reasoning escalated"
                );
            }
            LoaderEvent::ClaudeApiActivated { key_present } => {
                self.write_line(
                    "INFO",
                    &format!("Claude API key state changed: key_present={key_present}"),
                );
                tracing::info!(
                    target: "intel.pipeline",
                    key_present,
                    "[intel] Claude API state changed"
                );
            }
        }
    }
}
