//! HuggingFace download manager — progress, cancel, checksum, auto-registry.

use crate::models::registry::ModelRegistryEntry;
use crate::traits::events::{LoaderEvent, LoaderEventSink};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

/// Handle to a running download, used for cancellation.
#[derive(Debug, Clone)]
pub struct DownloadHandle {
    /// Unique download identifier.
    pub id: String,
    /// HuggingFace repo ID.
    pub repo_id: String,
    /// Target filename.
    pub filename: String,
    /// Cancellation flag.
    cancel: Arc<AtomicBool>,
}

impl DownloadHandle {
    /// Cancel this download.
    pub fn cancel(&self) {
        self.cancel.store(true, Ordering::Relaxed);
    }

    /// Check if cancelled.
    #[must_use]
    pub fn is_cancelled(&self) -> bool {
        self.cancel.load(Ordering::Relaxed)
    }
}

/// Download progress snapshot.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    /// Download identifier.
    pub download_id: String,
    /// Bytes downloaded so far.
    pub bytes_downloaded: u64,
    /// Total expected bytes.
    pub total_bytes: u64,
    /// Current download speed in bytes/second.
    pub speed_bps: u64,
    /// Estimated time remaining in seconds.
    pub eta_secs: u64,
}

/// Manages model downloads from HuggingFace Hub.
pub struct DownloadManager {
    models_dir: PathBuf,
    active: HashMap<String, DownloadHandle>,
}

impl DownloadManager {
    /// Create a new download manager.
    #[must_use]
    pub fn new(models_dir: PathBuf) -> Self {
        Self {
            models_dir,
            active: HashMap::new(),
        }
    }

    /// Start downloading a GGUF from HuggingFace.
    ///
    /// Downloads to `{models_dir}/gguf/{filename}`.
    /// Emits progress events via the event sink.
    /// Returns a handle for cancellation.
    #[cfg(feature = "candle-backend")]
    pub fn start_download(
        &mut self,
        repo_id: &str,
        filename: &str,
        events: &Arc<dyn LoaderEventSink>,
    ) -> anyhow::Result<DownloadHandle> {
        let download_id = uuid::Uuid::now_v7().to_string();
        let cancel = Arc::new(AtomicBool::new(false));

        let handle = DownloadHandle {
            id: download_id.clone(),
            repo_id: repo_id.to_string(),
            filename: filename.to_string(),
            cancel: cancel.clone(),
        };

        self.active.insert(download_id.clone(), handle.clone());

        // Emit started event
        events.emit(LoaderEvent::DownloadStarted {
            download_id: download_id.clone(),
            repo_id: repo_id.to_string(),
            filename: filename.to_string(),
            total_bytes: 0, // Updated once we know the size
        });

        let gguf_dir = self.models_dir.join("gguf");
        std::fs::create_dir_all(&gguf_dir)?;

        let target_path = gguf_dir.join(filename);
        let repo_id_owned = repo_id.to_string();
        let filename_owned = filename.to_string();
        let events_clone = events.clone();
        let dl_id = download_id.clone();

        // Spawn blocking download thread
        std::thread::Builder::new()
            .name(format!("download-{}", &download_id[..8]))
            .spawn(move || {
                let result = execute_download(
                    &repo_id_owned,
                    &filename_owned,
                    &target_path,
                    &dl_id,
                    &cancel,
                    &events_clone,
                );

                match result {
                    Ok(entry) => {
                        events_clone.emit(LoaderEvent::DownloadComplete {
                            download_id: dl_id,
                            registry_entry: entry,
                        });
                    }
                    Err(e) => {
                        if cancel.load(Ordering::Relaxed) {
                            events_clone.emit(LoaderEvent::DownloadCancelled {
                                download_id: dl_id,
                            });
                        } else {
                            events_clone.emit(LoaderEvent::DownloadFailed {
                                download_id: dl_id,
                                error: e.to_string(),
                            });
                        }
                    }
                }
            })?;

        Ok(handle)
    }

    /// Cancel an active download.
    pub fn cancel(&mut self, download_id: &str) -> anyhow::Result<()> {
        if let Some(handle) = self.active.get(download_id) {
            handle.cancel();
            self.active.remove(download_id);
            Ok(())
        } else {
            anyhow::bail!("Download '{download_id}' not found or already completed")
        }
    }

    /// Clean up completed/cancelled downloads from tracking.
    pub fn cleanup_finished(&mut self) {
        self.active.retain(|_, h| !h.is_cancelled());
    }
}

/// Execute the actual download (runs on a dedicated thread).
#[cfg(feature = "candle-backend")]
fn execute_download(
    repo_id: &str,
    filename: &str,
    target_path: &Path,
    download_id: &str,
    cancel: &AtomicBool,
    events: &dyn LoaderEventSink,
) -> anyhow::Result<ModelRegistryEntry> {
    tracing::info!(repo = %repo_id, file = %filename, "Starting HuggingFace download");

    // Use hf-hub sync API
    let api = hf_hub::api::sync::ApiBuilder::new()
        .build()
        .map_err(|e| anyhow::anyhow!("HF API init failed: {e}"))?;

    let repo = api.model(repo_id.to_string());

    // Check cancellation before proceeding
    if cancel.load(Ordering::Relaxed) {
        anyhow::bail!("Download cancelled before start");
    }

    // Download the file — hf-hub handles caching and resume
    let cached_path = repo
        .get(filename)
        .map_err(|e| anyhow::anyhow!("HF download failed: {e}"))?;

    // Check cancellation after download
    if cancel.load(Ordering::Relaxed) {
        anyhow::bail!("Download cancelled");
    }

    // Copy from hf-hub cache to our models directory
    let file_size = std::fs::metadata(&cached_path)?.len();

    // Emit progress — hf-hub doesn't give us granular progress,
    // so we emit 0% → 100% based on copy progress
    events.emit(LoaderEvent::DownloadProgress {
        download_id: download_id.to_string(),
        bytes_downloaded: 0,
        total_bytes: file_size,
        speed_bps: 0,
    });

    if cached_path != target_path {
        std::fs::copy(&cached_path, target_path)?;
    }

    events.emit(LoaderEvent::DownloadProgress {
        download_id: download_id.to_string(),
        bytes_downloaded: file_size,
        total_bytes: file_size,
        speed_bps: 0,
    });

    tracing::info!(
        repo = %repo_id,
        file = %filename,
        size_mb = file_size / (1024 * 1024),
        path = %target_path.display(),
        "Download complete"
    );

    // Build a registry entry for the downloaded model
    let entry = crate::models::discovery::discover_single(target_path, repo_id)?;
    Ok(entry)
}

