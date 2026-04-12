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
    /// Optional HF access token — threaded into every `ApiBuilder`.
    /// Loaded by `ModelLoaderService` from the secrets file at boot
    /// and refreshed whenever `set_hf_token` is called.
    hf_token: Option<String>,
}

impl DownloadManager {
    /// Create a new download manager.
    #[must_use]
    pub fn new(models_dir: PathBuf) -> Self {
        Self {
            models_dir,
            active: HashMap::new(),
            hf_token: None,
        }
    }

    /// Replace the active HF access token.
    ///
    /// Downloads started after this call will use the new token; in-flight
    /// downloads retain whatever token was live when they were spawned.
    pub fn set_hf_token(&mut self, token: Option<String>) {
        self.hf_token = token;
    }

    /// Snapshot of the current HF token (for forwarding into worker threads).
    #[must_use]
    pub fn hf_token(&self) -> Option<String> {
        self.hf_token.clone()
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

        // Route to purpose folder based on file extension and name heuristics.
        // GGUF text-gen → chat/, embedding → rag/, voice → voice/
        let subdir = infer_download_folder(filename);
        let dest_dir = self.models_dir.join(subdir);
        std::fs::create_dir_all(&dest_dir)?;

        let target_path = dest_dir.join(filename);
        let repo_id_owned = repo_id.to_string();
        let filename_owned = filename.to_string();
        let events_clone = events.clone();
        let dl_id = download_id.clone();
        let token = self.hf_token.clone();

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
                    token,
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

/// Execute the actual bundle download (runs on a dedicated thread).
///
/// This fetches EVERY file required to run the primary file, not just the
/// primary file itself. For a SafeTensors model that means the index
/// (`model.safetensors.index.json`), every shard the index references,
/// plus config + tokenizer files. For a GGUF model it's usually just the
/// single file unless there's a multi-part GGUF.
///
/// All files land under `dest_dir`. The returned `ModelRegistryEntry`
/// points at the primary file. Download progress is aggregated: a single
/// `LoaderEvent::DownloadProgress` stream reports total bytes across the
/// entire bundle so the UI shows one bar, not one per companion file.
#[cfg(feature = "candle-backend")]
fn execute_download(
    repo_id: &str,
    filename: &str,
    target_path: &Path,
    download_id: &str,
    cancel: &AtomicBool,
    events: &Arc<dyn LoaderEventSink>,
    token: Option<String>,
) -> anyhow::Result<ModelRegistryEntry> {
    tracing::info!(
        repo = %repo_id,
        file = %filename,
        has_token = token.is_some(),
        "Starting HuggingFace bundle download"
    );

    let api = hf_hub::api::sync::ApiBuilder::new()
        .with_token(token)
        .with_progress(false)
        .with_retries(3)
        .build()
        .map_err(|e| anyhow::anyhow!("HF API init failed: {e}"))?;

    let repo = api.model(repo_id.to_string());

    if cancel.load(Ordering::Relaxed) {
        anyhow::bail!("Download cancelled before start");
    }

    // Step 1: determine which files make up this model bundle. We list
    // the repo's siblings once and derive the exact file set from the
    // primary filename's format. If the repo info call fails (private
    // repo without auth, network flake), fall back to primary-only.
    let dest_dir = target_path
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."));
    let bundle = match repo.info() {
        Ok(info) => {
            let all: Vec<String> = info.siblings.into_iter().map(|s| s.rfilename).collect();
            plan_bundle(filename, &all)
        }
        Err(e) => {
            tracing::warn!(repo = %repo_id, error = %e, "repo.info() failed, downloading primary file only");
            vec![filename.to_string()]
        }
    };

    tracing::info!(
        repo = %repo_id,
        primary = %filename,
        bundle_size = bundle.len(),
        "Resolved bundle",
    );
    for entry in &bundle {
        tracing::info!(repo = %repo_id, file = %entry, "Bundle entry");
    }

    // Step 2: shared aggregated Progress bridge across every file in the
    // bundle. init() from each file appends its size to the running total
    // (so the user sees a single progress bar covering the whole bundle)
    // and update() increments the shared `current` counter.
    let bridge = Arc::new(std::sync::Mutex::new(AggregateProgress::new(
        download_id.to_string(),
        events.clone(),
    )));

    let mut primary_target: Option<PathBuf> = None;

    for file_name in &bundle {
        if cancel.load(Ordering::Relaxed) {
            anyhow::bail!("Download cancelled");
        }

        let file_bridge = BundleFileProgress {
            inner: Arc::clone(&bridge),
        };

        match repo.download_with_progress(file_name, file_bridge) {
            Ok(cached_path) => {
                let dest = dest_dir.join(file_name);
                if let Some(parent) = dest.parent() {
                    std::fs::create_dir_all(parent)?;
                }
                if cached_path != dest {
                    link_or_copy(&cached_path, &dest)?;
                }
                if file_name == filename {
                    primary_target = Some(dest);
                }
                tracing::info!(repo = %repo_id, file = %file_name, "Bundle file landed");
            }
            Err(e) => {
                // 404 on optional companion files is non-fatal — not every
                // model ships every config variant. Fail hard only for the
                // primary file.
                if file_name == filename {
                    return Err(anyhow::anyhow!("HF download failed for primary file: {e}"));
                }
                tracing::warn!(
                    repo = %repo_id,
                    file = %file_name,
                    error = %e,
                    "Optional companion file not available, skipping"
                );
            }
        }
    }

    let primary = primary_target.ok_or_else(|| {
        anyhow::anyhow!("Primary file '{filename}' was not downloaded from '{repo_id}'")
    })?;

    // Final 100% emit — some platforms swallow the last `update` tick.
    {
        let mut b = bridge.lock().expect("progress bridge mutex poisoned");
        b.finalise();
    }

    tracing::info!(
        repo = %repo_id,
        file = %filename,
        path = %primary.display(),
        "Bundle download complete"
    );

    // Build a registry entry pointing at the primary file.
    let entry = crate::models::discovery::discover_single(&primary, repo_id)?;
    Ok(entry)
}

/// Decide which files from a repo make up a complete model bundle for the
/// given primary filename.
///
/// Rules:
/// - SafeTensors single file (`model.safetensors`): primary + tokenizer
///   + config companions.
/// - SafeTensors sharded (`model-00001-of-00006.safetensors`): the index,
///   every shard the index references (we use the whole sibling list
///   filtered by the shard pattern), + companions.
/// - GGUF: the primary file only — GGUF is self-contained. If the repo
///   has a `tokenizer.json` we still grab it for Candle consumers.
/// - ONNX: the primary file + any `.onnx_data` sidecars + tokenizer.
/// - Unknown: primary file only.
///
/// The returned Vec is deduplicated and includes the primary file first.
#[cfg(feature = "candle-backend")]
fn plan_bundle(primary: &str, all: &[String]) -> Vec<String> {
    use std::collections::BTreeSet;

    let mut out: BTreeSet<String> = BTreeSet::new();
    out.insert(primary.to_string());

    // Common companion files every text-generation model needs. We add
    // them unconditionally — the download loop treats 404s as non-fatal
    // so a companion that doesn't exist simply gets skipped.
    const COMPANIONS: &[&str] = &[
        "config.json",
        "tokenizer.json",
        "tokenizer_config.json",
        "special_tokens_map.json",
        "generation_config.json",
        "added_tokens.json",
        "vocab.json",
        "merges.txt",
        "chat_template.json",
    ];

    let primary_lower = primary.to_lowercase();

    if primary_lower.ends_with(".safetensors") {
        // Multi-shard detection: filename contains `-of-` (e.g.
        // `model-00001-of-00006.safetensors`).
        let is_sharded = primary_lower.contains("-of-");
        if is_sharded {
            // Prefer the index file if it exists so Candle can read the
            // weight_map directly.
            if all.iter().any(|f| f == "model.safetensors.index.json") {
                out.insert("model.safetensors.index.json".into());
            }
            // Add every shard sibling that matches the shard pattern —
            // base = filename up to the first `-of-` suffix region.
            for sibling in all {
                let s = sibling.to_lowercase();
                if s.ends_with(".safetensors") && s.contains("-of-") {
                    out.insert(sibling.clone());
                }
            }
        }

        // Companions
        for c in COMPANIONS {
            if all.iter().any(|f| f == c) {
                out.insert((*c).to_string());
            }
        }
    } else if primary_lower.ends_with(".gguf") {
        // GGUF is self-contained. Still grab tokenizer.json / config.json
        // if they exist — Candle consumers benefit, llama.cpp ignores them.
        for c in &["tokenizer.json", "config.json"] {
            if all.iter().any(|f| f == *c) {
                out.insert((*c).to_string());
            }
        }
    } else if primary_lower.ends_with(".onnx") {
        // ONNX may have a .onnx_data sidecar holding the weights.
        let sidecar = format!("{primary}_data");
        if all.iter().any(|f| f == &sidecar) {
            out.insert(sidecar);
        }
        for c in COMPANIONS {
            if all.iter().any(|f| f == c) {
                out.insert((*c).to_string());
            }
        }
    }

    // Move primary to the front so the progress bar's first file is the
    // one the user actually picked.
    let mut result: Vec<String> = out.into_iter().collect();
    if let Some(idx) = result.iter().position(|f| f == primary) {
        let p = result.remove(idx);
        result.insert(0, p);
    }
    result
}

/// Aggregated progress across every file in a download bundle.
///
/// When a bundle has six shards + config.json + tokenizer.json, users see
/// ONE progress bar that covers the total byte count. `init()` from each
/// hf-hub file callback adds that file's size to `total`. `update()`
/// increments `current`. The whole thing is throttled to ~20 Hz to avoid
/// flooding the Tauri event bus.
#[cfg(feature = "candle-backend")]
struct AggregateProgress {
    download_id: String,
    events: Arc<dyn LoaderEventSink>,
    total: u64,
    current: u64,
    last_emit: std::time::Instant,
    window_start: std::time::Instant,
    window_bytes: u64,
}

#[cfg(feature = "candle-backend")]
impl AggregateProgress {
    fn new(download_id: String, events: Arc<dyn LoaderEventSink>) -> Self {
        let now = std::time::Instant::now();
        Self {
            download_id,
            events,
            total: 0,
            current: 0,
            last_emit: now,
            window_start: now,
            window_bytes: 0,
        }
    }

    fn add_file(&mut self, size: u64) {
        self.total = self.total.saturating_add(size);
        self.events.emit(LoaderEvent::DownloadProgress {
            download_id: self.download_id.clone(),
            bytes_downloaded: self.current,
            total_bytes: self.total,
            speed_bps: 0,
        });
    }

    fn add_bytes(&mut self, size: u64) {
        self.current = self.current.saturating_add(size);
        self.window_bytes = self.window_bytes.saturating_add(size);
        if self.last_emit.elapsed().as_millis() >= 50 {
            let window_secs = self.window_start.elapsed().as_secs_f64().max(0.001);
            let speed = (self.window_bytes as f64 / window_secs) as u64;
            self.events.emit(LoaderEvent::DownloadProgress {
                download_id: self.download_id.clone(),
                bytes_downloaded: self.current,
                total_bytes: self.total,
                speed_bps: speed,
            });
            let now = std::time::Instant::now();
            self.last_emit = now;
            self.window_start = now;
            self.window_bytes = 0;
        }
    }

    fn finalise(&mut self) {
        self.current = self.total;
        self.events.emit(LoaderEvent::DownloadProgress {
            download_id: self.download_id.clone(),
            bytes_downloaded: self.total,
            total_bytes: self.total,
            speed_bps: 0,
        });
    }
}

/// Per-file hf-hub `Progress` adapter that forwards into a shared
/// `AggregateProgress` behind a `Mutex`.
#[cfg(feature = "candle-backend")]
struct BundleFileProgress {
    inner: Arc<std::sync::Mutex<AggregateProgress>>,
}

#[cfg(feature = "candle-backend")]
impl hf_hub::api::Progress for BundleFileProgress {
    fn init(&mut self, size: usize, filename: &str) {
        if let Ok(mut guard) = self.inner.lock() {
            guard.add_file(size as u64);
        }
        tracing::info!(file = %filename, size_bytes = size, "bundle file init");
    }

    fn update(&mut self, size: usize) {
        if let Ok(mut guard) = self.inner.lock() {
            guard.add_bytes(size as u64);
        }
    }

    fn finish(&mut self) {
        // Per-file finish is a no-op — the aggregator only finalises once
        // at the end of the bundle loop.
    }
}

/// Link a file from `src` to `dst` without copying its bytes when possible.
///
/// Unix: plain `symlink`. Windows: try `symlink_file` (requires Developer
/// Mode / admin), fall back to `hard_link` (same volume only, no elevation
/// required), then finally fall back to a byte copy so the operation
/// always succeeds. Owner's directive: symlink by default, never force a
/// copy of a 20 GB model into `userdata/` when the source is right there.
#[cfg(feature = "candle-backend")]
fn link_or_copy(src: &Path, dst: &Path) -> anyhow::Result<()> {
    if let Some(parent) = dst.parent() {
        std::fs::create_dir_all(parent)?;
    }
    if dst.exists() {
        std::fs::remove_file(dst)?;
    }

    #[cfg(unix)]
    {
        match std::os::unix::fs::symlink(src, dst) {
            Ok(()) => return Ok(()),
            Err(e) => tracing::warn!(error = %e, "symlink failed, falling back to copy"),
        }
    }

    #[cfg(windows)]
    {
        match std::os::windows::fs::symlink_file(src, dst) {
            Ok(()) => return Ok(()),
            Err(e) => tracing::debug!(error = %e, "Windows symlink unavailable, trying hard link"),
        }
        match std::fs::hard_link(src, dst) {
            Ok(()) => return Ok(()),
            Err(e) => tracing::warn!(error = %e, "hard link failed, falling back to copy"),
        }
    }

    std::fs::copy(src, dst)?;
    Ok(())
}

/// Infer the purpose folder for a downloaded file based on filename.
///
/// Routes models into the correct subfolder so discovery folder-hints
/// can assign capabilities. This is the layman path — no config.json
/// needed, no manual folder creation.
fn infer_download_folder(filename: &str) -> &'static str {
    let lower = filename.to_lowercase();

    // Voice models
    if lower.contains("whisper") || lower.contains("kokoro") || lower.contains("tts")
        || lower.contains("stt") || lower.contains("piper") || lower.contains("snac")
        || lower.contains("orpheus")
    {
        return "voice";
    }

    // Embedding / RAG models
    if lower.contains("embed") || lower.contains("nomic") || lower.contains("bge")
        || lower.contains("rerank") || lower.contains("minilm") || lower.contains("e5-")
        || lower.contains("gte-")
    {
        return "rag";
    }

    // Vision models
    if lower.contains("siglip") || lower.contains("clip") || lower.contains("vision")
        || lower.contains("vit-")
    {
        return "vision";
    }

    // Default: chat/reasoning models
    "chat"
}

