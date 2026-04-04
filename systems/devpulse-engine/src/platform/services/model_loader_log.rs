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
    fn emit(&self, event: LoaderEvent) {
        match &event {
            // ── Discovery ──────────────────────────────────────────
            LoaderEvent::RegistryScanStarted => {
                self.write_line("INFO", "Registry scan started");
                tracing::info!("[model-loader] Registry scan started");
            }
            LoaderEvent::RegistryScanComplete { models_found } => {
                self.write_line("INFO", &format!("Registry scan complete: {models_found} models found"));
                tracing::info!(models_found, "[model-loader] Registry scan complete");
            }
            LoaderEvent::ModelDiscovered(entry) => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Model discovered: {} ({}, {}MB, VRAM ~{}MB)",
                        entry.filename, entry.architecture,
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
            LoaderEvent::DownloadStarted { download_id, repo_id, filename, total_bytes } => {
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
            LoaderEvent::DownloadProgress { download_id, bytes_downloaded, total_bytes, speed_bps } => {
                self.write_line(
                    "DEBUG",
                    &format!("Download progress: id={download_id} bytes={bytes_downloaded}/{total_bytes} speed={speed_bps}B/s"),
                );
            }
            LoaderEvent::DownloadComplete { download_id, registry_entry } => {
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
                self.write_line("ERROR", &format!("Download FAILED: id={download_id} error={error}"));
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
                self.write_line("INFO", &format!("Loading STARTED: slot={slot_id} model={model_id}"));
                tracing::info!(slot = %slot_id, model = %model_id, "[model-loader] Loading started");
            }
            LoaderEvent::LoadingStage { slot_id, stage, progress_pct } => {
                self.write_line(
                    "DEBUG",
                    &format!("Loading stage: slot={slot_id} stage={stage} progress={progress_pct:.0}%"),
                );
            }
            LoaderEvent::LoadingComplete { slot_id, memory } => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Loading COMPLETE: slot={slot_id} RAM={}MB VRAM={}MB",
                        memory.ram_mb(), memory.vram_mb(),
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
                self.write_line("ERROR", &format!("Loading FAILED: slot={slot_id} error={error}"));
                tracing::error!(slot = %slot_id, error = %error, "[model-loader] Loading FAILED");
            }
            LoaderEvent::UnloadComplete { slot_id, freed } => {
                self.write_line(
                    "INFO",
                    &format!(
                        "Unload complete: slot={slot_id} freed RAM={}MB VRAM={}MB",
                        freed.ram_mb(), freed.vram_mb(),
                    ),
                );
                tracing::info!(slot = %slot_id, "[model-loader] Unload complete");
            }

            // ── VRAM ───────────────────────────────────────────────
            LoaderEvent::VramInsufficient { needed_mb, available_mb, suggestions } => {
                self.write_line(
                    "WARN",
                    &format!(
                        "VRAM INSUFFICIENT: needed={needed_mb}MB available={available_mb}MB suggestions={}",
                        suggestions.join(", "),
                    ),
                );
                tracing::warn!(
                    needed_mb, available_mb,
                    "[model-loader] VRAM insufficient"
                );
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
            LoaderEvent::SwapStarted { slot_id, from_model, to_model } => {
                self.write_line(
                    "INFO",
                    &format!("Swap STARTED: slot={slot_id} from={from_model:?} to={to_model}"),
                );
                tracing::info!(slot = %slot_id, from = ?from_model, to = %to_model, "[model-loader] Swap started");
            }
            LoaderEvent::SwapComplete { slot_id, model_id } => {
                self.write_line("INFO", &format!("Swap COMPLETE: slot={slot_id} model={model_id}"));
                tracing::info!(slot = %slot_id, model = %model_id, "[model-loader] Swap complete");
            }
            LoaderEvent::SwapFailed { slot_id, error } => {
                self.write_line("ERROR", &format!("Swap FAILED: slot={slot_id} error={error}"));
                tracing::error!(slot = %slot_id, error = %error, "[model-loader] Swap FAILED");
            }
        }
    }
}
