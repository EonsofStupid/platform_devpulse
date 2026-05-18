//! `HuggingFace` download manager — progress, cancel, checksum, auto-registry.

// `ModelRegistryEntry`, `LoaderEvent`, `LoaderEventSink`, and `std::path::Path`
// are only referenced by the cfg-gated `start_download` path and its event
// emissions. The struct shell, token storage, and the `list_repo_files`
// no-feature stub all stay accessible without `candle-backend`.
#[cfg(feature = "candle-backend")]
use crate::models::registry::ModelRegistryEntry;
#[cfg(feature = "candle-backend")]
use crate::traits::events::{LoaderEvent, LoaderEventSink};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
#[cfg(feature = "candle-backend")]
use std::path::Path;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

/// Handle to a running download, used for cancellation.
#[derive(Debug, Clone)]
pub struct DownloadHandle {
    /// Unique download identifier.
    pub id: String,
    /// `HuggingFace` repo ID.
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

/// Manages model downloads from `HuggingFace` Hub.
///
/// `models_dir` is held only when the `candle-backend` feature is
/// active — it's the destination root for `start_download`. Without
/// that feature there is no download path, so the field would be dead
/// code (the field-level cfg gate avoids `unused field` warnings
/// instead of suppressing them).
pub struct DownloadManager {
    #[cfg(feature = "candle-backend")]
    models_dir: PathBuf,
    active: HashMap<String, DownloadHandle>,
    /// Optional HF access token — threaded into every `ApiBuilder`.
    /// Loaded by `ModelLoaderService` from the secrets file at boot
    /// and refreshed whenever `set_hf_token` is called.
    hf_token: Option<String>,
}

impl DownloadManager {
    /// Create a new download manager.
    ///
    /// Two impls — one per feature state — keep API parity. Callers always
    /// pass `models_dir`; with `candle-backend` off the value is accepted
    /// for compatibility and dropped (no field to store it on).
    #[cfg(feature = "candle-backend")]
    #[must_use]
    pub fn new(models_dir: PathBuf) -> Self {
        Self {
            models_dir,
            active: HashMap::new(),
            hf_token: None,
        }
    }

    /// Create a new download manager. (No-feature variant — accepts
    /// `models_dir` for API parity with the `candle-backend` build but
    /// drops it; without the feature there is no download path that
    /// would consult it.)
    #[cfg(not(feature = "candle-backend"))]
    #[must_use]
    pub fn new(_models_dir: PathBuf) -> Self {
        Self {
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

    /// Start downloading a GGUF from `HuggingFace`.
    ///
    /// Downloads to `{models_dir}/gguf/{filename}`.
    /// Emits progress events via the event sink.
    /// Returns a handle for cancellation.
    ///
    /// # Errors
    /// Returns an error if the spawned blocking download task fails to
    /// be created — the actual download work runs in a background thread
    /// and reports failures via the event sink, not this Result.
    #[cfg(feature = "candle-backend")]
    pub fn start_download(
        &mut self,
        repo_id: &str,
        filename: &str,
        scope: &crate::models::DownloadScope,
        events: &Arc<dyn LoaderEventSink>,
        // Optional one-shot fired exactly once when the spawned download
        // thread terminates. `Ok(entry)` mirrors `DownloadComplete`,
        // `Err` mirrors `DownloadFailed`/`DownloadCancelled`. Used by
        // `install_to_slot` to chain scan → assign → load without a
        // separate event-bus subscription.
        on_complete: Option<tokio::sync::oneshot::Sender<anyhow::Result<ModelRegistryEntry>>>,
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

        // Layout: `<scope_root>/<owner>/<repo>/<file>`. `resolve_bundle_dir`
        // sanitises every component so a hostile `repo_id` cannot traverse
        // outside `models_dir`; legitimate HF repos pass through unchanged
        // because the sanitiser's keep-set matches HF's own repo-id alphabet.
        // Pre-existing downloads under the legacy `chat/`, `rag/`, `voice/`,
        // `vision/` flat directories remain loadable — `discover_models`
        // recurses, so it picks up either layout without migration.
        let dest_dir = crate::models::resolve_bundle_dir(&self.models_dir, scope, repo_id);
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
                    token.as_deref(),
                );

                match result {
                    Ok(entry) => {
                        events_clone.emit(LoaderEvent::DownloadComplete {
                            download_id: dl_id,
                            registry_entry: entry.clone(),
                        });
                        if let Some(tx) = on_complete {
                            // Receiver dropped (caller cancelled the
                            // install chain) is not an error here — the
                            // event already fired.
                            let _ = tx.send(Ok(entry));
                        }
                    }
                    Err(e) => {
                        if cancel.load(Ordering::Relaxed) {
                            events_clone
                                .emit(LoaderEvent::DownloadCancelled { download_id: dl_id });
                        } else {
                            events_clone.emit(LoaderEvent::DownloadFailed {
                                download_id: dl_id,
                                error: e.to_string(),
                            });
                        }
                        if let Some(tx) = on_complete {
                            let _ = tx.send(Err(anyhow::anyhow!("{e}")));
                        }
                    }
                }
            })?;

        Ok(handle)
    }

    /// Cancel an active download.
    ///
    /// # Errors
    /// Returns an error if the `download_id` is not in the active set —
    /// either the download has already completed, was cancelled previously,
    /// or never existed.
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

    /// List every file in a `HuggingFace` repo — the full sibling set —
    /// so the UI can show a bundle confirmation before a user clicks
    /// "Download". Threaded through the stored HF token so private /
    /// gated repos resolve when the user has authenticated.
    ///
    /// Sizes come back `None` when the Hub response omits them (which
    /// is common for LFS-tracked `*.safetensors` listings). The caller
    /// treats `None` as "unknown" in the confirmation modal.
    ///
    /// # Errors
    /// Returns an error if `ApiBuilder::build` fails (typically a malformed
    /// HF token), if `Api::model(repo).info()` returns an HTTP error
    /// (network, 401/403/404, rate-limit, 5xx), or if the response cannot
    /// be parsed.
    #[cfg(feature = "candle-backend")]
    pub fn list_repo_files(&self, repo_id: &str) -> anyhow::Result<Vec<RepoFileEntry>> {
        let api = hf_hub::api::sync::ApiBuilder::new()
            .with_token(self.hf_token.clone())
            .with_progress(false)
            .with_retries(3)
            .build()
            .map_err(|e| anyhow::anyhow!("HF API init failed: {e}"))?;

        let repo = api.model(repo_id.to_string());
        let info = repo
            .info()
            .map_err(|e| anyhow::anyhow!("HF repo.info() failed for '{repo_id}': {e}"))?;

        Ok(info
            .siblings
            .into_iter()
            .map(|s| RepoFileEntry {
                name: s.rfilename,
                // hf_hub::Siblings doesn't expose size today (it's None in
                // the struct), but the Hub API returns it when queried
                // directly. Leaving as None until hf_hub exposes it.
                size: None,
            })
            .collect())
    }

    /// Stub for builds without the candle-backend feature — the HF
    /// hub dep is gated there, so listing is unavailable.
    #[cfg(not(feature = "candle-backend"))]
    pub fn list_repo_files(&self, _repo_id: &str) -> anyhow::Result<Vec<RepoFileEntry>> {
        anyhow::bail!("list_repo_files requires candle-backend feature")
    }
}

/// One entry in a `HuggingFace` repo's sibling list. Serializable so it
/// can cross the Tauri IPC boundary into the frontend's `RepoDownloadButton`
/// confirmation modal.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoFileEntry {
    /// File name relative to the repo root (e.g. `"model.safetensors"`).
    pub name: String,
    /// File size in bytes, when the Hub exposes it. `None` = unknown.
    pub size: Option<u64>,
}

/// Execute the actual bundle download (runs on a dedicated thread).
///
/// This fetches EVERY file required to run the primary file, not just the
/// primary file itself. For a `SafeTensors` model that means the index
/// (`model.safetensors.index.json`), every shard the index references,
/// plus config + tokenizer files. For a GGUF model it's usually just the
/// single file unless there's a multi-part GGUF.
///
/// All files land under `dest_dir`. The returned `ModelRegistryEntry`
/// points at the primary file. Download progress is aggregated: a single
/// `LoaderEvent::DownloadProgress` stream reports total bytes across the
/// entire bundle so the UI shows one bar, not one per companion file.
/// Resolve the sibling list for a HF repo and reduce it to the exact
/// bundle of files needed to run the primary filename. Falls back to
/// "primary only" if the repo-info call fails (private repo without
/// auth, network flake, etc.).
#[cfg(feature = "candle-backend")]
fn resolve_bundle_files(
    repo: &hf_hub::api::sync::ApiRepo,
    repo_id: &str,
    primary_filename: &str,
) -> Vec<String> {
    let bundle = match repo.info() {
        Ok(info) => {
            let all: Vec<String> = info.siblings.into_iter().map(|s| s.rfilename).collect();
            plan_bundle(primary_filename, &all)
        }
        Err(e) => {
            tracing::warn!(
                repo = %repo_id,
                error = %e,
                "repo.info() failed, downloading primary file only"
            );
            vec![primary_filename.to_string()]
        }
    };
    tracing::info!(
        repo = %repo_id,
        primary = %primary_filename,
        bundle_size = bundle.len(),
        "Resolved bundle",
    );
    for entry in &bundle {
        tracing::info!(repo = %repo_id, file = %entry, "Bundle entry");
    }
    bundle
}

/// Download a single bundle file from the HF repo, link or copy it to
/// the destination, and verify its sha256 against the LFS oid (when
/// known). Returns the final destination path on success. The caller
/// decides whether failure is fatal (primary file) or non-fatal
/// (optional companion).
#[cfg(feature = "candle-backend")]
fn download_one_bundle_file(
    repo: &hf_hub::api::sync::ApiRepo,
    file_name: &str,
    dest_dir: &Path,
    bridge: &Arc<std::sync::Mutex<AggregateProgress>>,
    lfs_oid_map: &std::collections::HashMap<String, String>,
    repo_id: &str,
) -> anyhow::Result<PathBuf> {
    let file_bridge = BundleFileProgress {
        inner: Arc::clone(bridge),
    };
    let cached_path = repo
        .download_with_progress(file_name, file_bridge)
        .map_err(|e| anyhow::anyhow!("{e}"))?;
    let dest = dest_dir.join(file_name);
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }
    if cached_path != dest {
        link_or_copy(&cached_path, &dest)?;
    }
    if let Some(expected_oid) = lfs_oid_map.get(file_name) {
        verify_or_retry(repo, file_name, &dest, expected_oid, bridge, repo_id)?;
    }
    Ok(dest)
}

/// Verify a freshly-downloaded file against its expected LFS sha256 oid.
/// On mismatch (or read failure), delete the file and re-download once.
/// A second mismatch returns an error — never let a corrupted file
/// pretend to be a valid model weight.
#[cfg(feature = "candle-backend")]
fn verify_or_retry(
    repo: &hf_hub::api::sync::ApiRepo,
    file_name: &str,
    dest: &Path,
    expected_oid: &str,
    bridge: &Arc<std::sync::Mutex<AggregateProgress>>,
    repo_id: &str,
) -> anyhow::Result<()> {
    // Treat both Ok(false) (hash mismatch) and Err(_) (read failed) as
    // "fail-deleted, must retry" — never trust an unverified artefact.
    if matches!(verify_sha256(dest, expected_oid), Ok(true)) {
        tracing::info!(repo = %repo_id, file = %file_name, "sha256 verified");
        return Ok(());
    }
    tracing::warn!(
        repo = %repo_id,
        file = %file_name,
        expected = %expected_oid,
        "Post-download sha256 MISMATCH — deleting and retrying once"
    );
    let _ = std::fs::remove_file(dest);
    let retry_bridge = BundleFileProgress {
        inner: Arc::clone(bridge),
    };
    let retry_path = repo
        .download_with_progress(file_name, retry_bridge)
        .map_err(|e| {
            anyhow::anyhow!("HF re-download failed after sha256 mismatch on {file_name}: {e}")
        })?;
    if retry_path != dest {
        link_or_copy(&retry_path, dest)?;
    }
    if matches!(verify_sha256(dest, expected_oid), Err(_) | Ok(false)) {
        anyhow::bail!(
            "sha256 mismatch on '{file_name}' from '{repo_id}' \
             after retry — file is corrupted (expected oid {expected_oid})"
        );
    }
    tracing::info!(repo = %repo_id, file = %file_name, "sha256 verified after retry");
    Ok(())
}

/// Pre-flight scan: for every bundle file already on disk, decide whether
/// it counts as resumable.
///
/// - Files with a known LFS sha256 are verified; mismatches and read
///   errors are deleted so the caller re-downloads from scratch.
/// - Files without an LFS oid (small companions / configs) skip on
///   existence + non-zero length — they're tiny enough that corruption
///   would be caught by downstream JSON / config parsers.
///
/// Returns the set of bundle filenames already present + verified.
#[cfg(feature = "candle-backend")]
fn pre_flight_disk_scan(
    bundle: &[String],
    dest_dir: &Path,
    lfs_oid_map: &std::collections::HashMap<String, String>,
    repo_id: &str,
) -> std::collections::HashSet<String> {
    let mut already_present: std::collections::HashSet<String> = std::collections::HashSet::new();
    for file_name in bundle {
        let dest = dest_dir.join(file_name);
        let Ok(meta) = std::fs::metadata(&dest) else { continue };
        if !meta.is_file() || meta.len() == 0 {
            continue;
        }
        let Some(expected_oid) = lfs_oid_map.get(file_name) else {
            // Non-LFS file (small JSON / config / tokenizer). No sha256
            // available — accept any non-zero file as already-present.
            already_present.insert(file_name.clone());
            tracing::info!(
                repo = %repo_id,
                file = %file_name,
                size = meta.len(),
                "Bundle entry already on disk (non-LFS, no sha256 to verify) — skipping"
            );
            continue;
        };
        match verify_sha256(&dest, expected_oid) {
            Ok(true) => {
                already_present.insert(file_name.clone());
                tracing::info!(
                    repo = %repo_id,
                    file = %file_name,
                    size = meta.len(),
                    "Bundle entry already on disk + sha256 verified — skipping"
                );
            }
            Ok(false) => {
                tracing::warn!(
                    repo = %repo_id,
                    file = %file_name,
                    size = meta.len(),
                    expected = %expected_oid,
                    "On-disk file FAILED sha256 — deleting and re-downloading"
                );
                let _ = std::fs::remove_file(&dest);
            }
            Err(e) => {
                tracing::warn!(
                    repo = %repo_id,
                    file = %file_name,
                    error = %e,
                    "sha256 read failed for on-disk file — deleting and re-downloading"
                );
                let _ = std::fs::remove_file(&dest);
            }
        }
    }
    already_present
}

#[cfg(feature = "candle-backend")]
fn execute_download(
    repo_id: &str,
    filename: &str,
    target_path: &Path,
    download_id: &str,
    cancel: &AtomicBool,
    events: &Arc<dyn LoaderEventSink>,
    token: Option<&str>,
) -> anyhow::Result<ModelRegistryEntry> {
    tracing::info!(
        repo = %repo_id,
        file = %filename,
        has_token = token.is_some(),
        "Starting HuggingFace bundle download"
    );

    let api = hf_hub::api::sync::ApiBuilder::new()
        .with_token(token.map(String::from))
        .with_progress(false)
        .with_retries(3)
        .build()
        .map_err(|e| anyhow::anyhow!("HF API init failed: {e}"))?;

    let repo = api.model(repo_id.to_string());

    if cancel.load(Ordering::Relaxed) {
        anyhow::bail!("Download cancelled before start");
    }

    // Step 1: determine which files make up this model bundle. Resolve
    // the sibling list once, derive the exact file set from the primary
    // filename's format, and log the bundle for diagnostics.
    let dest_dir = target_path
        .parent()
        .map_or_else(|| PathBuf::from("."), Path::to_path_buf);
    let bundle = resolve_bundle_files(&repo, repo_id, filename);

    // Step 2: fetch the LFS oid map for this repo. The HF tree-listing
    // endpoint returns per-file `lfs.oid` (SHA-256 of the file contents)
    // for every LFS-tracked file. We use this to verify integrity of
    // every downloaded file — corrupted downloads get re-fetched once
    // and then fail hard. Map missing entries means the file is too
    // small for LFS (configs, tokenizers under 10 MB) so verification
    // falls back to "downloaded successfully" — those files are tiny
    // enough that corruption is exceptionally rare and would be caught
    // by the JSON parsers downstream.
    let lfs_oid_map = fetch_lfs_oid_map(repo_id, token).unwrap_or_else(|e| {
        tracing::warn!(
            repo = %repo_id,
            error = %e,
            "LFS oid map fetch failed — sha256 verification will be skipped for this download"
        );
        std::collections::HashMap::new()
    });
    tracing::info!(
        repo = %repo_id,
        lfs_files = lfs_oid_map.len(),
        "Fetched LFS oid map for sha256 verification"
    );

    // Step 3: pre-flight disk scan. For each bundle entry, check if
    // the destination file already exists. If yes AND we have an
    // expected LFS sha256, verify it before skipping — corrupted
    // resume artefacts get re-downloaded instead of silently used.
    // Files without an LFS oid skip on existence + non-zero length
    // (small companions, JSON configs).
    let already_present = pre_flight_disk_scan(&bundle, &dest_dir, &lfs_oid_map, repo_id);
    let skip_count = already_present.len();
    if skip_count > 0 {
        tracing::info!(
            repo = %repo_id,
            already_present = skip_count,
            total = bundle.len(),
            remaining = bundle.len() - skip_count,
            "Resuming partial bundle"
        );
    }

    // Step 3: shared aggregated Progress bridge across every file in
    // the bundle. init() from each file appends its size to the
    // running total (so the user sees a single progress bar covering
    // the whole bundle) and update() increments the shared `current`
    // counter.
    let bridge = Arc::new(std::sync::Mutex::new(AggregateProgress::new(
        download_id.to_string(),
        events.clone(),
    )));

    let mut primary_target: Option<PathBuf> = None;

    for file_name in &bundle {
        if cancel.load(Ordering::Relaxed) {
            anyhow::bail!("Download cancelled");
        }

        // Skip entries that are already on disk. Primary-file case
        // still needs a dest path for the registry entry downstream,
        // so we populate `primary_target` without touching the network.
        if already_present.contains(file_name) {
            let dest = dest_dir.join(file_name);
            if file_name == filename {
                primary_target = Some(dest);
            }
            continue;
        }

        match download_one_bundle_file(
            &repo,
            file_name,
            &dest_dir,
            &bridge,
            &lfs_oid_map,
            repo_id,
        ) {
            Ok(dest) => {
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

    finalise_bundle_download(&bridge, primary_target, repo_id, filename)
}

/// Final flush + registry-entry construction at the end of a bundle
/// download. Drains any remaining progress ticks, validates the primary
/// file actually arrived, and builds the `ModelRegistryEntry` that the
/// caller persists.
#[cfg(feature = "candle-backend")]
fn finalise_bundle_download(
    bridge: &Arc<std::sync::Mutex<AggregateProgress>>,
    primary_target: Option<PathBuf>,
    repo_id: &str,
    primary_filename: &str,
) -> anyhow::Result<ModelRegistryEntry> {
    let primary = primary_target.ok_or_else(|| {
        anyhow::anyhow!("Primary file '{primary_filename}' was not downloaded from '{repo_id}'")
    })?;

    // Final 100% emit — some platforms swallow the last `update` tick.
    // Mutex poison-recovery: if the spawned download thread panicked while
    // holding the bridge lock, the inner progress state is still valid
    // (we just want the final flush). Recover via `into_inner()` rather
    // than abort.
    {
        let mut b = bridge
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        b.finalise();
    }

    tracing::info!(
        repo = %repo_id,
        file = %primary_filename,
        path = %primary.display(),
        "Bundle download complete"
    );

    crate::models::discovery::discover_single(&primary, repo_id)
}

/// Decide which files from a repo make up a complete model bundle for the
/// given primary filename.
///
/// Rules:
/// - `SafeTensors` single file (`model.safetensors`): primary + tokenizer
///   + config companions.
/// - `SafeTensors` sharded (`model-00001-of-00006.safetensors`): the index,
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

    let mut out: BTreeSet<String> = BTreeSet::new();
    out.insert(primary.to_string());

    let primary_lower = primary.to_lowercase();
    // Normalise extension for the format-specific match below.
    // `Path::extension()` returns the part after the last `.`, lower-cased
    // here so we don't have to worry about `.SafeTensors` / `.GGUF`.
    let ext = std::path::Path::new(primary)
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase);

    match ext.as_deref() {
        Some("safetensors") => {
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
        }
        Some("gguf") => {
            // GGUF is self-contained. Still grab tokenizer.json / config.json
            // if they exist — Candle consumers benefit, llama.cpp ignores them.
            for c in &["tokenizer.json", "config.json"] {
                if all.iter().any(|f| f == *c) {
                    out.insert((*c).to_string());
                }
            }
        }
        Some("onnx") => {
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
        // Unknown / no extension — primary file only.
        _ => {}
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
            // Bytes/second is always non-negative, and `window_bytes` for a
            // 50ms-or-greater window stays well below `f64`'s 2^52 mantissa
            // limit (would require petabyte/sec download rates to exceed).
            #[allow(clippy::cast_precision_loss, clippy::cast_sign_loss)]
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
/// Routes models into the legacy `chat/`/`rag/`/`voice/`/`vision/` flat
/// subdirs so the discovery folder-hint pass can assign capabilities
/// without a `devpulse.json` manifest. Layman path — no config.json
/// needed, no manual folder creation.
///
/// ## Status as of `DownloadScope` introduction
///
/// New downloads go through [`crate::models::resolve_bundle_dir`] which
/// produces `<scope_root>/<owner>/<repo>/<file>`. This helper is no
/// longer on the live download path — discovery still walks the legacy
/// trees recursively, so already-on-disk files in `chat/`/`rag/`/etc.
/// stay loadable.
///
/// The function is kept (not deleted) for two reasons:
///   1. **Legacy migration tooling** — `cargo xtask model-manifest-backfill`
///      and any future "consolidate-legacy-tree" operation use this
///      mapping to confirm where a stray file *would have* landed.
///   2. **Canonical keyword set** — the keyword groups here are the
///      single source of truth for the four capability buckets the
///      discovery hint resolver scans against. Re-deriving the same
///      list in two places is the bug we avoid by keeping it here.
///
/// Cfg-gated to `candle-backend` so a build without download support
/// doesn't ship the helper at all.
///
/// ## Consumers
///
/// - [`crate::models::discovery::apply_filename_hints`] — fallback for
///   files at the new scope-resolved layout (`<owner>/<repo>/<file>`)
///   that sit outside the legacy `chat/`/`rag/`/`voice/`/`vision/`
///   purpose folders. Without this fallback, a downloaded Whisper
///   model under `microsoft/whisper-large/` would discover with zero
///   capability hints because its parent folder is the HF owner, not
///   a purpose bucket.
/// - The `infer_download_folder_*` unit tests below.
/// - Future legacy-tree migration tooling
///   (`cargo xtask model-manifest-backfill`) — same keyword set.
#[cfg(feature = "candle-backend")]
pub fn infer_download_folder(filename: &str) -> &'static str {
    let lower = filename.to_lowercase();

    // Voice models
    if lower.contains("whisper")
        || lower.contains("kokoro")
        || lower.contains("tts")
        || lower.contains("stt")
        || lower.contains("piper")
        || lower.contains("snac")
        || lower.contains("orpheus")
    {
        return "voice";
    }

    // Embedding / RAG models
    if lower.contains("embed")
        || lower.contains("nomic")
        || lower.contains("bge")
        || lower.contains("rerank")
        || lower.contains("minilm")
        || lower.contains("e5-")
        || lower.contains("gte-")
    {
        return "rag";
    }

    // Vision models
    if lower.contains("siglip")
        || lower.contains("clip")
        || lower.contains("vision")
        || lower.contains("vit-")
    {
        return "vision";
    }

    // Default: chat/reasoning models
    "chat"
}

// ── HF LFS oid integrity verification ────────────────────────────────

/// One entry in the `HuggingFace` `/api/models/{repo}/tree/main` response.
///
/// Only the fields we actually consume are decoded; HF returns more
/// (`type`, `oid` git sha1, `xetHash`, `size`) but we ignore them.
#[cfg(feature = "candle-backend")]
#[derive(Debug, serde::Deserialize)]
struct HfTreeEntry {
    /// File path within the repo (e.g. `model-00001-of-00003.safetensors`).
    path: String,
    /// LFS metadata block — present for files tracked by Git LFS, absent
    /// for tiny inline files (configs, tokenizer.json under ~10 MB).
    lfs: Option<HfLfsInfo>,
}

/// LFS metadata inside an [`HfTreeEntry`]. The `oid` field is the
/// SHA-256 of the file contents, which is the integrity anchor we use.
#[cfg(feature = "candle-backend")]
#[derive(Debug, serde::Deserialize)]
struct HfLfsInfo {
    /// SHA-256 hex digest of the file contents.
    oid: String,
}

/// Fetch the per-file LFS oid map for a `HuggingFace` repo.
///
/// Returns a `filename -> sha256` map for every LFS-tracked file in the
/// repo's main branch. Non-LFS files (small inline configs, tokenizer
/// JSON under ~10 MB) don't appear in the map — verification falls back
/// to "downloaded successfully" for those because the JSON parsers
/// downstream will reject malformed bytes anyway.
#[cfg(feature = "candle-backend")]
fn fetch_lfs_oid_map(
    repo_id: &str,
    token: Option<&str>,
) -> anyhow::Result<HashMap<String, String>> {
    let url = format!("https://huggingface.co/api/models/{repo_id}/tree/main");
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()?;
    let mut request = client.get(&url);
    if let Some(t) = token {
        request = request.header("Authorization", format!("Bearer {t}"));
    }
    let response = request.send()?.error_for_status()?;
    let entries: Vec<HfTreeEntry> = response.json()?;
    let mut map = HashMap::new();
    for entry in entries {
        if let Some(lfs) = entry.lfs {
            map.insert(entry.path, lfs.oid);
        }
    }
    Ok(map)
}

/// Compute the SHA-256 of a file on disk and compare against the
/// expected hex digest. Returns `Ok(true)` on match, `Ok(false)` on
/// mismatch, `Err` on IO failure.
///
/// Streamed in 8 KB chunks so a 30 GB safetensors file doesn't load
/// the whole thing into RAM. Comparison is case-insensitive — HF
/// returns lower-case hex, but defensive parsing is cheap.
#[cfg(feature = "candle-backend")]
fn verify_sha256(path: &Path, expected_hex: &str) -> anyhow::Result<bool> {
    use sha2::{Digest, Sha256};
    use std::io::Read;

    let mut file = std::fs::File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 8192];
    loop {
        let n = file.read(&mut buf)?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    let actual = format!("{:x}", hasher.finalize());
    Ok(actual.eq_ignore_ascii_case(expected_hex))
}

#[cfg(test)]
#[cfg(feature = "candle-backend")]
mod folder_inference_tests {
    //! Lock the legacy filename → folder mapping in place. The live
    //! download path no longer routes through `infer_download_folder`
    //! (see `start_download` + `crate::models::resolve_bundle_dir`),
    //! but the mapping is the canonical answer to "what bucket WOULD
    //! this filename have landed in under the pre-Scope layout?" —
    //! consumed by anything that has to consolidate or migrate the
    //! legacy `<models_dir>/{chat,rag,voice,vision}/` trees.
    //!
    //! These tests are the live consumer: they pin the mapping so a
    //! future edit that re-purposes the keyword groups (or that
    //! removes the function outright when the tooling lands in a
    //! shared crate) is caught at CI time, not at migration time.

    use super::infer_download_folder;

    #[test]
    fn voice_keywords_route_to_voice() {
        for f in [
            "whisper-small.gguf",
            "kokoro-en.bin",
            "model-tts.safetensors",
            "stt-streaming.onnx",
            "piper-medium.onnx",
            "snac-en.bin",
            "orpheus-voice.gguf",
        ] {
            assert_eq!(infer_download_folder(f), "voice", "file: {f}");
        }
    }

    #[test]
    fn rag_keywords_route_to_rag() {
        for f in [
            "bge-small-en.safetensors",
            "nomic-embed.bin",
            "all-minilm-l6.safetensors",
            "e5-large.safetensors",
            "gte-base.safetensors",
            "rerank-bge-v2.safetensors",
            "text-embed-002.bin",
        ] {
            assert_eq!(infer_download_folder(f), "rag", "file: {f}");
        }
    }

    #[test]
    fn vision_keywords_route_to_vision() {
        for f in [
            "siglip2-so400m.safetensors",
            "clip-vit-large.bin",
            "vit-base-patch16.safetensors",
            "vision-encoder.onnx",
        ] {
            assert_eq!(infer_download_folder(f), "vision", "file: {f}");
        }
    }

    #[test]
    fn unknown_keywords_default_to_chat() {
        for f in [
            "qwen3-30b-a3b.gguf",
            "phi-4-reasoning-15b.gguf",
            "model.safetensors",
            "llama3-8b-q4_k_m.gguf",
        ] {
            assert_eq!(infer_download_folder(f), "chat", "file: {f}");
        }
    }

    #[test]
    fn matching_is_case_insensitive() {
        assert_eq!(infer_download_folder("WHISPER-large.GGUF"), "voice");
        assert_eq!(infer_download_folder("BGE-Reranker.BIN"), "rag");
        assert_eq!(infer_download_folder("SigLIP2.safetensors"), "vision");
    }
}

#[cfg(test)]
#[cfg(feature = "candle-backend")]
#[allow(clippy::unwrap_used)] // tests panic on file write / hash compute failure by design
mod sha256_tests {
    use super::verify_sha256;
    use std::io::Write;

    /// Round-trip: write known bytes, check sha256 matches the known
    /// digest. Confirms the streaming hasher and hex format are correct.
    #[test]
    fn verify_sha256_matches_known_digest() {
        // Known: sha256("hello world\n") =
        //   a948904f2f0f479b8f8197694b30184b0d2ed1c1cd2a1ec0fb85d299a192a447
        let dir = std::env::temp_dir().join("model_loader_sha256_test");
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("hello.txt");
        {
            let mut f = std::fs::File::create(&path).unwrap();
            f.write_all(b"hello world\n").unwrap();
        }
        let expected = "a948904f2f0f479b8f8197694b30184b0d2ed1c1cd2a1ec0fb85d299a192a447";
        assert!(verify_sha256(&path, expected).unwrap());
        assert!(!verify_sha256(&path, "0000000000000000000000000000000000000000000000000000000000000000").unwrap());
        assert!(verify_sha256(&path, &expected.to_uppercase()).unwrap());
        let _ = std::fs::remove_file(&path);
    }
}
