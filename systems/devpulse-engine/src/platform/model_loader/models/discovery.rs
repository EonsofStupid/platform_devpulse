//! Model discovery — directory walking and GGUF header parsing.
//!
//! # Cast lints
//!
//! GGUF header fields (`u64` offsets, `u32` counts, `u8` quantization
//! codes) cross byte boundaries during parsing. Every cast here matches
//! a documented GGUF field width, never arbitrary numeric conversion.

#![allow(
    clippy::cast_possible_truncation,
    clippy::cast_precision_loss,
    clippy::cast_sign_loss,
    clippy::cast_possible_wrap,
    clippy::cast_lossless
)]

use crate::platform::model_loader::models::registry::{
    BackendType, ModelFormat, ModelMetadata, ModelRegistryEntry, ModelSource,
};
use crate::platform::model_loader::slots::types::ModelCapability;
use std::path::Path;

/// Discover all models in the models directory — GGUF, ONNX, and Sherpa directories.
///
/// Walks ALL subdirectories recursively. Models organized by purpose:
/// `chat/`, `voice/`, `rag/`, `vision/`, `general/`.
///
/// After discovery, applies folder-aware capability hints: if a model is in
/// `voice/`, it gains Speech capabilities even if the architecture string is
/// unfamiliar. This supplements (not overrides) architecture-based inference.
///
/// # Errors
/// Returns an error if the directory walk fails (permission denied,
/// path no longer exists during traversal). Per-file parse failures
/// fail-soft with a `tracing::warn!` and skip the file.
pub fn discover_models(models_dir: &Path) -> anyhow::Result<Vec<ModelRegistryEntry>> {
    if !models_dir.exists() {
        tracing::debug!(path = %models_dir.display(), "Models directory does not exist");
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();

    // Walk everything recursively — discover by file type, not folder name
    walk_all(models_dir, &mut entries)?;

    // Filter out safetensor shards — keep only the first shard or non-shard files.
    // Shards like `model-00002-of-00005.safetensors` are parts of the same model.
    filter_safetensor_shards(&mut entries);

    // Deduplicate by canonical path — same model discovered via symlink or copy
    deduplicate_by_path(&mut entries);

    // Post-process: manifest-first capability resolution.
    // Waterfall: devpulse.json → sentence-transformers → config.json arch → folder hints.
    apply_manifest_capabilities(&mut entries);

    // Folder hints only ADD capabilities — they run last as a safety net
    // for models with no manifest and no sentence-transformers files.
    apply_folder_hints(models_dir, &mut entries);

    // Filename hints are the deepest fallback — files at the new
    // scope-resolved layout (`<owner>/<repo>/<file>`) sit outside the
    // legacy purpose folders, so `apply_folder_hints` produces nothing.
    // The filename keyword set is the SSOT in `download::infer_download_folder`.
    apply_filename_hints(&mut entries);

    tracing::info!(
        count = entries.len(),
        path = %models_dir.display(),
        "Model discovery complete"
    );
    Ok(entries)
}

/// Recursively walk a directory, discovering GGUF files, ONNX files, and Sherpa model dirs.
/// Folder-aware hints are applied after walk completes (in `discover_models`).
///
/// # Errors
/// Returns an error if the recursive descent fails on a sub-directory
/// it can't read. The top-level `read_dir` failure is downgraded to a
/// `tracing::debug!` and `Ok(())` (missing dirs aren't fatal). Per-file
/// parse failures fail-soft.
fn walk_all(dir: &Path, entries: &mut Vec<ModelRegistryEntry>) -> anyhow::Result<()> {
    let read_dir = match std::fs::read_dir(dir) {
        Ok(rd) => rd,
        Err(e) => {
            tracing::debug!(path = %dir.display(), error = %e, "Cannot read directory — skipping");
            return Ok(());
        }
    };

    for entry in read_dir {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            // Check if this directory is a Sherpa model dir (contains tokens.txt)
            if is_sherpa_model_dir(&path) {
                let registry_entry = parse_sherpa_dir_entry(&path);
                tracing::debug!(dir = %path.display(), "Discovered Sherpa model directory");
                entries.push(registry_entry);
            } else {
                // Recurse into subdirectories
                walk_all(&path, entries)?;
            }
        } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            match ext {
                "gguf" => match parse_gguf_entry(&path) {
                    Ok(registry_entry) => {
                        tracing::debug!(file = %path.display(), arch = %registry_entry.architecture, "Discovered GGUF model");
                        entries.push(registry_entry);
                    }
                    Err(e) => {
                        tracing::warn!(file = %path.display(), error = %e, "Failed to parse GGUF file — skipping");
                    }
                },
                "safetensors" => match parse_safetensors_entry(&path) {
                    Ok(registry_entry) => {
                        tracing::debug!(file = %path.display(), "Discovered SafeTensors model");
                        entries.push(registry_entry);
                    }
                    Err(e) => {
                        tracing::warn!(file = %path.display(), error = %e, "Failed to parse SafeTensors file — skipping");
                    }
                },
                "onnx" => match parse_onnx_entry(&path) {
                    Ok(registry_entry) => {
                        tracing::debug!(file = %path.display(), "Discovered ONNX model");
                        entries.push(registry_entry);
                    }
                    Err(e) => {
                        tracing::warn!(file = %path.display(), error = %e, "Failed to parse ONNX file — skipping");
                    }
                },
                "bin" => {
                    // Whisper GGML `.bin` format — only register if filename
                    // matches a known Whisper pattern (e.g. `ggml-small.bin`).
                    let filename = path.file_name().and_then(|f| f.to_str()).unwrap_or("");
                    if filename.starts_with("ggml-") && filename.contains("whisper")
                        || filename.starts_with("ggml-tiny")
                        || filename.starts_with("ggml-base")
                        || filename.starts_with("ggml-small")
                        || filename.starts_with("ggml-medium")
                        || filename.starts_with("ggml-large")
                    {
                        match parse_whisper_bin_entry(&path) {
                            Ok(registry_entry) => {
                                tracing::debug!(file = %path.display(), "Discovered Whisper GGML model");
                                entries.push(registry_entry);
                            }
                            Err(e) => {
                                tracing::warn!(file = %path.display(), error = %e, "Failed to parse Whisper .bin — skipping");
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    }

    Ok(())
}

/// Discover models in the Hugging Face Hub cache.
///
/// Walks `<cache_dir>/models--<owner>--<repo>/snapshots/<revision>/` for every
/// repo cached locally. Each repo's snapshot directory contains symlinks to
/// the blob store keyed by the original filename, so the existing file-type
/// parsers (`gguf` / `safetensors` / `onnx` / Whisper `.bin` / Sherpa dirs)
/// apply unchanged. The returned entries carry `ModelSource::HuggingFace`
/// with the parsed `repo_id` + `revision` so downstream lookups (already-
/// downloaded checks, slot install paths) can short-circuit before issuing
/// any HTTP request.
///
/// If `cache_dir` does not exist, returns an empty vec — a fresh box with no
/// HF cache is a normal state, not an error.
///
/// # Errors
///
/// Returns an error only if the top-level `<cache_dir>` read fails for
/// reasons other than "missing" (permission denied, etc.). Per-repo parse
/// failures fail-soft with a `tracing::warn!` and skip the entry.
pub fn discover_hf_cache(cache_dir: &Path) -> anyhow::Result<Vec<ModelRegistryEntry>> {
    if !cache_dir.exists() {
        tracing::debug!(
            path = %cache_dir.display(),
            "HF cache directory does not exist — skipping"
        );
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();
    let read_dir = std::fs::read_dir(cache_dir)?;

    for entry in read_dir {
        let entry = match entry {
            Ok(e) => e,
            Err(e) => {
                tracing::warn!(error = %e, "Skipping unreadable HF cache entry");
                continue;
            }
        };
        let repo_dir = entry.path();
        if !repo_dir.is_dir() {
            continue;
        }

        let Some(dir_name) = repo_dir.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        // HF cache repos are named `models--<owner>--<repo>`. Datasets and
        // spaces use different prefixes and are not relevant to the model
        // registry — skip them silently.
        let Some(owner_repo) = dir_name.strip_prefix("models--") else {
            continue;
        };
        // Convert `<owner>--<repo>` back to `<owner>/<repo>` — HF uses `--`
        // because filesystems don't allow `/` in directory names.
        let repo_id = owner_repo.replacen("--", "/", 1);

        // Resolve the active revision: `refs/main` is a text file containing
        // the snapshot's revision hash. Fall back to "main" if absent.
        let revision = std::fs::read_to_string(repo_dir.join("refs").join("main"))
            .ok()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "main".to_string());

        // Snapshots can have multiple revision dirs (the active one in
        // `refs/main` plus historical pulls). Walk the active revision's
        // snapshot dir; companion files in older snapshots are reachable
        // via the blob store via the symlinks anyway.
        let snapshot_dir = repo_dir.join("snapshots").join(&revision);
        if snapshot_dir.is_dir() {
            walk_hf_snapshot(&snapshot_dir, &repo_id, &revision, &mut entries);
        } else {
            // Some revisions may not have a snapshot dir if the download
            // was interrupted before linking. Try any snapshot subdirectory
            // as a best-effort fallback so the user sees what's actually
            // resolvable on disk.
            let Ok(snap_iter) = std::fs::read_dir(repo_dir.join("snapshots")) else {
                continue;
            };
            let Some(any_snap) = snap_iter
                .filter_map(Result::ok)
                .find(|e| e.path().is_dir())
                .map(|e| e.path())
            else {
                continue;
            };
            walk_hf_snapshot(&any_snap, &repo_id, &revision, &mut entries);
        }
    }

    filter_safetensor_shards(&mut entries);
    deduplicate_by_path(&mut entries);
    apply_manifest_capabilities(&mut entries);

    apply_filename_hints(&mut entries);

    tracing::info!(
        count = entries.len(),
        path = %cache_dir.display(),
        "HF cache discovery complete"
    );
    Ok(entries)
}

/// Default HF cache location: `$HF_HUB_CACHE` if set, otherwise
/// `$HF_HOME/hub` if set, otherwise `~/.cache/huggingface/hub`. Matches
/// the [hf-hub crate's resolution order](https://github.com/huggingface/hf-hub)
/// so anything the downloader writes lands where the discovery scan reads.
///
/// Home directory resolution avoids the `dirs` crate to keep model-loader's
/// dependency surface minimal: `USERPROFILE` is the Windows convention,
/// `HOME` the Unix one. Both are set by every shell that boots a user
/// process; falling through both means no home dir and the function
/// returns `None`.
#[must_use]
pub fn default_hf_cache_dir() -> Option<std::path::PathBuf> {
    if let Some(p) = std::env::var_os("HF_HUB_CACHE") {
        return Some(std::path::PathBuf::from(p));
    }
    if let Some(p) = std::env::var_os("HF_HOME") {
        return Some(std::path::PathBuf::from(p).join("hub"));
    }
    std::env::var_os("USERPROFILE")
        .or_else(|| std::env::var_os("HOME"))
        .map(|h| {
            std::path::PathBuf::from(h)
                .join(".cache")
                .join("huggingface")
                .join("hub")
        })
}

/// Walk a single HF snapshot directory and append registry entries.
///
/// Snapshot entries are symlinks to the blob store. We parse them as
/// regular files — the canonical path resolution inside the registry
/// will collapse symlinks for dedup. The HF `repo_id` + `revision` are
/// applied as `ModelSource::HuggingFace` so downstream code knows the
/// origin without re-parsing the cache layout.
fn walk_hf_snapshot(
    snapshot_dir: &Path,
    repo_id: &str,
    revision: &str,
    entries: &mut Vec<ModelRegistryEntry>,
) {
    let Ok(read_dir) = std::fs::read_dir(snapshot_dir) else {
        return;
    };
    let source = ModelSource::HuggingFace {
        repo_id: repo_id.to_string(),
        revision: revision.to_string(),
    };
    for entry in read_dir.filter_map(Result::ok) {
        let path = entry.path();
        if path.is_dir() {
            // Some HF repos cache nested files (e.g. `onnx/model.onnx`).
            // Recurse so those are also picked up. A separate `walk_all`
            // invocation would also work but this keeps the HF source
            // metadata attached.
            walk_hf_snapshot_recursive(&path, repo_id, revision, entries);
            continue;
        }
        let Some(ext) = path.extension().and_then(|e| e.to_str()) else {
            continue;
        };
        let parsed = match ext {
            "gguf" => parse_gguf_entry(&path).ok(),
            "safetensors" => parse_safetensors_entry(&path).ok(),
            "onnx" => parse_onnx_entry(&path).ok(),
            "bin" => {
                let filename = path.file_name().and_then(|f| f.to_str()).unwrap_or("");
                let is_whisper = filename.starts_with("ggml-")
                    && (filename.contains("whisper")
                        || filename.starts_with("ggml-tiny")
                        || filename.starts_with("ggml-base")
                        || filename.starts_with("ggml-small")
                        || filename.starts_with("ggml-medium")
                        || filename.starts_with("ggml-large"));
                if is_whisper {
                    parse_whisper_bin_entry(&path).ok()
                } else {
                    None
                }
            }
            _ => None,
        };
        if let Some(mut e) = parsed {
            e.source = source.clone();
            tracing::debug!(
                file = %path.display(),
                repo = %repo_id,
                "Discovered HF cache model"
            );
            entries.push(e);
        }
    }
}

/// Recursive companion to [`walk_hf_snapshot`] for nested directories
/// (e.g. `onnx/model.onnx`). Preserves the HF source metadata for every
/// file it picks up. Sherpa-style directories (containing `tokens.txt`)
/// register as a single `SherpaDir` entry.
fn walk_hf_snapshot_recursive(
    dir: &Path,
    repo_id: &str,
    revision: &str,
    entries: &mut Vec<ModelRegistryEntry>,
) {
    if is_sherpa_model_dir(dir) {
        let mut entry = parse_sherpa_dir_entry(dir);
        entry.source = ModelSource::HuggingFace {
            repo_id: repo_id.to_string(),
            revision: revision.to_string(),
        };
        entries.push(entry);
        return;
    }
    walk_hf_snapshot(dir, repo_id, revision, entries);
}

/// Discover a single model file and set its source to `HuggingFace`.
/// Used after downloading a model from HF. Handles GGUF, `SafeTensors`, and ONNX.
///
/// # Errors
/// Returns an error if `path` has an unsupported extension, or if the
/// underlying parse function (GGUF / safetensors / ONNX) fails on the
/// file's header.
pub fn discover_single(path: &Path, repo_id: &str) -> anyhow::Result<ModelRegistryEntry> {
    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");

    let mut entry = match ext {
        "gguf" => parse_gguf_entry(path)?,
        "safetensors" => parse_safetensors_entry(path)?,
        "onnx" => parse_onnx_entry(path)?,
        _ => anyhow::bail!("Unsupported model format: .{ext}"),
    };

    entry.source = ModelSource::HuggingFace {
        repo_id: repo_id.to_string(),
        revision: "main".to_string(),
    };
    Ok(entry)
}

/// Parse a single GGUF file into a registry entry.
///
/// Header metadata is read via the pure-Rust `ggus` crate — no candle /
/// ggml / llama.cpp linkage (kernel-severance: the engine is management
/// only). If the header can't be parsed (truncated / corrupt / an
/// unexpectedly large metadata region beyond the bounded prefix), the
/// entry is still registered with filename-derived metadata so a bad
/// header never hides an on-disk model from the slot picker.
fn parse_gguf_entry(path: &Path) -> anyhow::Result<ModelRegistryEntry> {
    let file_size = std::fs::metadata(path)?.len();
    let filename = path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    let metadata = read_gguf_metadata(path).unwrap_or_else(|e| {
        tracing::warn!(
            file = %path.display(),
            error = %e,
            "GGUF header parse failed — registering with filename-only metadata"
        );
        ModelMetadata {
            architecture: "unknown".to_string(),
            parameter_count: None,
            quant_level: None,
            context_length: 0,
            vocab_size: 0,
        }
    });

    let vram_estimate = estimate_vram_mb(&metadata, file_size);
    let capabilities = infer_capabilities(&metadata.architecture);
    let backends = infer_backends(&metadata.architecture);
    let quant_level = infer_quant_from_filename(&filename);

    Ok(ModelRegistryEntry {
        id: stable_id_for_path(path),
        filename,
        path: path.to_path_buf(),
        format: ModelFormat::Gguf,
        architecture: metadata.architecture.clone(),
        parameter_count: metadata.parameter_count,
        quant_level,
        context_length: metadata.context_length,
        size_bytes: file_size,
        vram_estimate_mb: vram_estimate,
        supported_backends: backends,
        compatible_capabilities: capabilities,
        source: ModelSource::Local,
        discovered_at: now_epoch_ms(),
    })
}

/// Read GGUF header metadata (architecture, context length, vocab size,
/// parameter count) via the pure-Rust `ggus` crate.
///
/// GGUF lays out its magic + version + a metadata KV table + a tensor-info
/// table at the FRONT of the file, ahead of the (potentially multi-GB)
/// tensor data blob. We read a bounded prefix — large enough to cover the
/// header region of any realistic model (a 256K-token tokenizer array plus
/// tens of thousands of tensor-info records still fits comfortably),
/// small enough that weights never enter RAM — and hand it to
/// [`ggus::GGuf`], which parses only that metadata region. No `unsafe`, no
/// mmap, no ML-backend linkage.
///
/// # Errors
/// Returns an error if the file can't be opened / read, or if `ggus`
/// rejects the header bytes (bad magic, unsupported version, or a
/// metadata region larger than [`GGUF_HEADER_PREFIX_CAP`]).
fn read_gguf_metadata(path: &Path) -> anyhow::Result<ModelMetadata> {
    use ggus::{GGuf, GGufMetaMapExt};
    use std::io::Read;

    /// Upper bound on the header prefix we read to parse metadata. 16 MiB
    /// covers the header of every realistic GGUF while never touching the
    /// tensor-data blob.
    const GGUF_HEADER_PREFIX_CAP: u64 = 16 * 1024 * 1024;

    let file = std::fs::File::open(path)?;
    let mut buf = Vec::new();
    file.take(GGUF_HEADER_PREFIX_CAP).read_to_end(&mut buf)?;

    let gguf = GGuf::new(&buf).map_err(|e| anyhow::anyhow!("GGUF header parse: {e:?}"))?;

    let architecture = gguf
        .general_architecture()
        .map(str::to_string)
        .unwrap_or_else(|_| "unknown".to_string());

    // `llm_context_length()` resolves the arch-prefixed
    // `<arch>.context_length` key for us.
    let context_length = gguf.llm_context_length().unwrap_or(0);

    let vocab_size = gguf
        .get_usize(&format!("{architecture}.vocab_size"))
        .unwrap_or(0);

    let parameter_count = gguf
        .get_usize("general.parameter_count")
        .ok()
        .and_then(|n| u64::try_from(n).ok());

    Ok(ModelMetadata {
        architecture,
        parameter_count,
        quant_level: None, // Inferred from filename instead
        context_length,
        vocab_size,
    })
}

/// Estimate VRAM in MB from model metadata and file size.
///
/// GGUF file size is a reasonable lower bound — the weights ARE the file.
/// Add overhead for KV cache and activations.
pub fn estimate_vram_mb(metadata: &ModelMetadata, file_size_bytes: u64) -> u64 {
    let file_mb = file_size_bytes / (1024 * 1024);

    // Rough overhead multiplier based on context length:
    // KV cache grows with context. A 4096 context model needs ~10% overhead,
    // an 8192 model ~15%, 32K+ ~25%.
    let overhead = match metadata.context_length {
        0..=4096 => 1.10,
        4097..=8192 => 1.15,
        8193..=16384 => 1.20,
        _ => 1.25,
    };

    #[allow(
        clippy::cast_possible_truncation,
        clippy::cast_sign_loss,
        clippy::cast_precision_loss
    )]
    let estimate = (file_mb as f64 * overhead) as u64;

    // Minimum 100MB — even tiny models need some overhead
    estimate.max(100)
}

/// Infer model capabilities from architecture string.
#[must_use]
pub fn infer_capabilities(architecture: &str) -> Vec<ModelCapability> {
    match architecture {
        // Text generation architectures
        "llama" | "mistral" | "mixtral" | "qwen2" | "qwen3" | "phi2" | "phi3" | "gemma"
        | "gemma2" | "stablelm" | "starcoder" | "gpt2" | "gptneox" | "falcon" | "mpt" | "bloom" => {
            vec![ModelCapability::TextGeneration]
        }
        // Embedding architectures
        "bert" | "nomic-bert" | "jina-bert-v2" => {
            vec![ModelCapability::Embedding]
        }
        // Vision architectures
        "clip" | "siglip" => {
            vec![ModelCapability::VisionEmbedding]
        }
        // Whisper
        "whisper" => {
            vec![ModelCapability::SpeechToText]
        }
        // Unknown — assume text generation (most common)
        _ => {
            tracing::debug!(arch = %architecture, "Unknown architecture — assuming TextGeneration");
            vec![ModelCapability::TextGeneration]
        }
    }
}

/// Infer supported backends from architecture.
///
/// Order = preference. llama.cpp first per locked direction
/// (`feedback_inference_runtime_direction.md`); Candle stays in the list
/// as a secondary fallback for archs both runtimes can load.
///
/// This is advisory METADATA only — post-severance the engine links no
/// inference backend, so the returned set describes which backend *could*
/// serve a model on Clyffy, never a local capability.
#[must_use]
pub fn infer_backends(architecture: &str) -> Vec<BackendType> {
    let mut backends = vec![BackendType::LlamaCpp]; // primary — supports almost everything

    if llamacpp_supports_architecture(architecture) {
        // Same arch list — Candle remains a viable secondary for these.
        backends.push(BackendType::Candle);
    }

    backends
}

/// Whether llama.cpp has a GGUF loader for this architecture.
///
/// Pure arch-name match — the management-side equivalent of the severed
/// `backends::router::llamacpp_supports_architecture` (the router itself
/// is inference and stays on Clyffy). Kept here so `infer_backends` can
/// tag advisory backend metadata without linking any backend. Add an
/// entry only after verifying upstream llama.cpp lists the arch.
fn llamacpp_supports_architecture(arch: &str) -> bool {
    matches!(
        arch,
        "llama"
            | "mistral"
            | "mixtral"
            | "qwen2"
            | "qwen3"
            | "phi2"
            | "phi3"
            | "phi4"
            | "gemma"
            | "gemma2"
            | "gemma3"
            | "stablelm"
            | "starcoder"
            | "starcoder2"
            | "deepseek"
            | "deepseek2"
            | "command-r"
            | "dbrx"
            | "olmo"
    )
}

/// Public accessor for quant inference — used by search module.
#[must_use]
pub fn infer_quant_from_filename_pub(filename: &str) -> Option<String> {
    infer_quant_from_filename(filename)
}

/// Infer quantization level from filename conventions.
///
/// Common patterns: `q4_k_m`, `q8_0`, `f16`, `q5_k_s`, etc.
fn infer_quant_from_filename(filename: &str) -> Option<String> {
    let lower = filename.to_lowercase();

    // Common GGUF quant patterns
    let patterns = [
        "q2_k", "q3_k_s", "q3_k_m", "q3_k_l", "q4_0", "q4_1", "q4_k_s", "q4_k_m", "q5_0", "q5_1",
        "q5_k_s", "q5_k_m", "q6_k", "q8_0", "f16", "f32", "iq1_s", "iq1_m", "iq2_xxs", "iq2_xs",
        "iq2_s", "iq2_m", "iq3_xxs", "iq3_xs", "iq3_s", "iq3_m", "iq4_xs", "iq4_nl",
    ];

    for pat in &patterns {
        if lower.contains(pat) {
            return Some(pat.to_uppercase());
        }
    }

    None
}

/// Check if a directory is a Sherpa model directory (contains tokens.txt).
fn is_sherpa_model_dir(dir: &Path) -> bool {
    dir.join("tokens.txt").exists()
}

/// Parse a Sherpa model directory into a registry entry. Infallible —
/// every field has a sensible default and `dir_size_bytes` is itself
/// fail-soft, so the function returns `ModelRegistryEntry` directly.
fn parse_sherpa_dir_entry(dir: &Path) -> ModelRegistryEntry {
    let dir_name = dir
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    // Infer capability from directory name
    let capabilities = if dir_name.contains("whisper") {
        vec![ModelCapability::SpeechToText]
    } else if dir_name.contains("kokoro") || dir_name.contains("tts") {
        vec![ModelCapability::TextToSpeech]
    } else {
        vec![ModelCapability::SpeechToText] // Default for Sherpa dirs
    };

    // Sum directory size
    let size = dir_size_bytes(dir);

    ModelRegistryEntry {
        id: stable_id_for_path(dir),
        filename: dir_name,
        path: dir.to_path_buf(),
        format: ModelFormat::SherpaDir,
        architecture: "sherpa".to_string(),
        parameter_count: None,
        quant_level: None,
        context_length: 0,
        size_bytes: size,
        vram_estimate_mb: size / (1024 * 1024),
        supported_backends: vec![BackendType::Sherpa],
        compatible_capabilities: capabilities,
        source: ModelSource::Local,
        discovered_at: now_epoch_ms(),
    }
}

/// Parse a `SafeTensors` file into a registry entry.
///
/// `SafeTensors` files don't embed architecture metadata like GGUF headers do.
/// We infer architecture from the filename and companion `config.json` if present.
fn parse_safetensors_entry(path: &Path) -> anyhow::Result<ModelRegistryEntry> {
    let file_size = std::fs::metadata(path)?.len();
    let filename = path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    // Try to read config.json from the same directory for architecture info
    let (architecture, context_length, parameter_count) = if let Some(parent) = path.parent() {
        read_config_json(parent)
    } else {
        ("unknown".to_string(), 0, None)
    };

    let capabilities = infer_capabilities(&architecture);
    let backends = vec![BackendType::Candle]; // SafeTensors → Candle only

    Ok(ModelRegistryEntry {
        id: stable_id_for_path(path),
        filename,
        path: path.to_path_buf(),
        format: ModelFormat::Safetensors,
        architecture,
        parameter_count,
        quant_level: Some("F16".to_string()), // SafeTensors are typically f16/bf16
        context_length,
        size_bytes: file_size,
        vram_estimate_mb: file_size / (1024 * 1024), // SafeTensors ≈ 1:1 file:VRAM
        supported_backends: backends,
        compatible_capabilities: capabilities,
        source: ModelSource::Local,
        discovered_at: now_epoch_ms(),
    })
}

/// Read `config.json` from a model directory for architecture metadata.
/// Returns `(architecture, context_length, parameter_count)`.
fn read_config_json(dir: &Path) -> (String, usize, Option<u64>) {
    let config_path = dir.join("config.json");
    if !config_path.exists() {
        return ("unknown".to_string(), 0, None);
    }

    let Ok(content) = std::fs::read_to_string(&config_path) else {
        return ("unknown".to_string(), 0, None);
    };

    // Parse as generic JSON — we only need a few fields
    let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) else {
        return ("unknown".to_string(), 0, None);
    };

    let architecture = json
        .get("model_type")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();

    let context_length = json
        .get("max_position_embeddings")
        .and_then(serde_json::Value::as_u64)
        .unwrap_or(0) as usize;

    let parameter_count = json
        .get("num_parameters")
        .and_then(serde_json::Value::as_u64);

    (architecture, context_length, parameter_count)
}

/// Parse an ONNX file into a registry entry.
fn parse_onnx_entry(path: &Path) -> anyhow::Result<ModelRegistryEntry> {
    let file_size = std::fs::metadata(path)?.len();
    let filename = path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    // Infer capability from filename
    let capabilities = if filename.contains("snac") {
        vec![ModelCapability::AudioDecoding]
    } else if filename.contains("whisper") {
        vec![ModelCapability::SpeechToText]
    } else if filename.contains("kokoro") || filename.contains("tts") || filename.contains("piper")
    {
        vec![ModelCapability::TextToSpeech]
    } else if filename.contains("siglip") || filename.contains("vision") || filename.contains("vit")
    {
        vec![ModelCapability::VisionEmbedding]
    } else if filename.contains("embed") {
        vec![ModelCapability::Embedding]
    } else {
        // Unknown ONNX — log and assume generic
        tracing::debug!(file = %filename, "Unknown ONNX model capability — not auto-assigned");
        Vec::new()
    };

    Ok(ModelRegistryEntry {
        id: stable_id_for_path(path),
        filename,
        path: path.to_path_buf(),
        format: ModelFormat::Onnx,
        architecture: "onnx".to_string(),
        parameter_count: None,
        quant_level: None,
        context_length: 0,
        size_bytes: file_size,
        vram_estimate_mb: file_size / (1024 * 1024),
        supported_backends: vec![BackendType::Ort],
        compatible_capabilities: capabilities,
        source: ModelSource::Local,
        discovered_at: now_epoch_ms(),
    })
}

/// Recursively compute directory size in bytes.
fn dir_size_bytes(path: &Path) -> u64 {
    std::fs::read_dir(path)
        .map(|entries| {
            entries
                .filter_map(Result::ok)
                .map(|e| {
                    let p = e.path();
                    if p.is_dir() {
                        dir_size_bytes(&p)
                    } else {
                        std::fs::metadata(&p).map(|m| m.len()).unwrap_or(0)
                    }
                })
                .sum()
        })
        .unwrap_or(0)
}

/// Current epoch milliseconds.
fn now_epoch_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// Apply filename-based capability hints to discovered entries that
/// neither carry a manifest nor sit under a legacy purpose folder.
///
/// Reads through [`crate::platform::model_loader::models::download::infer_download_folder`] —
/// that function owns the keyword SSOT (whisper / kokoro / embed /
/// rerank / siglip / vit / …). Discovery hits this as the deepest
/// fallback so a model under the new scope-resolved layout
/// `<owner>/<repo>/<file>` still picks up the right capability shape
/// for its slot routing.
///
/// Like folder hints, this is additive — it never strips capabilities
/// inferred by architecture parsing or manifest declarations.
fn apply_filename_hints(entries: &mut [ModelRegistryEntry]) {
    for entry in entries.iter_mut() {
        if !entry.compatible_capabilities.is_empty() {
            continue;
        }
        let bucket = crate::platform::model_loader::models::download::infer_download_folder(&entry.filename);
        let hints: &[ModelCapability] = match bucket {
            "voice" => &[ModelCapability::SpeechToText, ModelCapability::TextToSpeech],
            "rag" => &[ModelCapability::Embedding, ModelCapability::Reranking],
            "vision" => &[ModelCapability::VisionEmbedding],
            _ => &[ModelCapability::TextGeneration],
        };
        for cap in hints {
            entry.compatible_capabilities.push(*cap);
        }
        tracing::debug!(
            file = %entry.filename,
            bucket,
            caps = ?entry.compatible_capabilities,
            "Filename hint applied (no manifest, no purpose folder)"
        );
    }
}

/// Apply folder-aware capability hints to discovered models.
///
/// If a model sits under a known purpose directory (relative to `models_dir`),
/// supplement its inferred capabilities. This ensures manually placed models
/// show up as compatible for the right slots even if the architecture string
/// is unfamiliar (e.g., a custom ONNX file in `voice/`).
///
/// Hints ADD capabilities — they never remove what architecture parsing inferred.
fn apply_folder_hints(models_dir: &Path, entries: &mut [ModelRegistryEntry]) {
    for entry in entries.iter_mut() {
        // Get the path relative to models_dir
        let Ok(relative) = entry.path.strip_prefix(models_dir) else {
            continue;
        };

        // First component of relative path is the purpose folder
        let folder = match relative.components().next() {
            Some(std::path::Component::Normal(name)) => name.to_string_lossy(),
            _ => continue,
        };

        let hints: &[ModelCapability] = match folder.as_ref() {
            "chat" | "general" => &[ModelCapability::TextGeneration],
            "voice" => &[ModelCapability::SpeechToText, ModelCapability::TextToSpeech],
            "rag" => &[ModelCapability::Embedding, ModelCapability::Reranking],
            "vision" => &[ModelCapability::VisionEmbedding],
            _ => continue,
        };

        let mut added = false;
        for cap in hints {
            if !entry.compatible_capabilities.contains(cap) {
                entry.compatible_capabilities.push(*cap);
                added = true;
            }
        }

        if added {
            tracing::debug!(
                file = %entry.filename,
                folder = %folder,
                caps = ?entry.compatible_capabilities,
                "Folder hint applied"
            );
        }
    }
}

/// Parse a Whisper GGML `.bin` file into a registry entry.
///
/// Whisper GGML models are standalone binary files (e.g. `ggml-small.bin`).
/// They run through Sherpa or Candle's Whisper implementation.
fn parse_whisper_bin_entry(path: &Path) -> anyhow::Result<ModelRegistryEntry> {
    let file_size = std::fs::metadata(path)?.len();
    let filename = path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    // Infer size variant from filename
    let variant = if filename.contains("tiny") {
        "tiny"
    } else if filename.contains("base") {
        "base"
    } else if filename.contains("small") {
        "small"
    } else if filename.contains("medium") {
        "medium"
    } else if filename.contains("large") {
        "large"
    } else {
        "unknown"
    };

    Ok(ModelRegistryEntry {
        id: stable_id_for_path(path),
        filename,
        path: path.to_path_buf(),
        format: ModelFormat::Gguf, // Closest format marker for GGML
        architecture: format!("whisper-{variant}"),
        parameter_count: None,
        quant_level: None,
        context_length: 0,
        size_bytes: file_size,
        vram_estimate_mb: file_size / (1024 * 1024),
        supported_backends: vec![BackendType::Sherpa],
        compatible_capabilities: vec![ModelCapability::SpeechToText],
        source: ModelSource::Local,
        discovered_at: now_epoch_ms(),
    })
}

/// Filter out safetensor shards, keeping only the first shard per model.
///
/// Pattern: `model-NNNNN-of-NNNNN.safetensors` — keep only `00001`,
/// which represents the "model is here" entry. Skip shards 00002+.
fn filter_safetensor_shards(entries: &mut Vec<ModelRegistryEntry>) {
    entries.retain(|entry| {
        if entry.format != ModelFormat::Safetensors {
            return true;
        }

        let filename = &entry.filename;

        // Check for shard pattern: `model-XXXXX-of-YYYYY.safetensors`
        if let Some(dash_of) = filename.find("-of-") {
            // Find the shard number before "-of-"
            let prefix = &filename[..dash_of];
            if let Some(last_dash) = prefix.rfind('-') {
                let shard_str = &prefix[last_dash + 1..];
                if let Ok(shard_num) = shard_str.parse::<u32>() {
                    if shard_num > 1 {
                        tracing::debug!(
                            file = %filename,
                            shard = shard_num,
                            "Filtering out safetensor shard (keeping only shard 1)"
                        );
                        return false;
                    }
                }
            }
        }

        true
    });
}

/// Deduplicate registry entries by normalized path string.
///
/// If the same file appears via symlink and direct path, keep only one entry.
/// Uses `normalize_path` instead of raw `canonicalize()` because Windows
/// `canonicalize()` returns `\\?\`-prefixed UNC paths that don't match
/// non-canonical paths, causing duplicates.
fn deduplicate_by_path(entries: &mut Vec<ModelRegistryEntry>) {
    let mut seen = std::collections::HashSet::new();
    entries.retain(|entry| {
        let normalized = normalize_path(&entry.path);
        seen.insert(normalized)
    });
}

/// Build a stable `UUIDv5` from a file path so the same file on disk
/// always gets the same registry id across rescans, reboots, and
/// rebuilds. Persisted slot assignments reference registry entries by
/// id — if the id churned on every scan (which it did when discovery
/// used `Uuid::now_v7()`), every restored assignment would be dead on
/// arrival.
///
/// Uses [`normalize_path`] so symlink vs real-path, backslash vs
/// forward-slash, and drive-letter case all collapse to the same name,
/// which feeds into `Uuid::new_v5` with the URL namespace. Two scans of
/// the same file produce byte-identical UUIDs. Renaming the file
/// (correctly) yields a fresh UUID because the name is the identity.
pub(crate) fn stable_id_for_path(path: &std::path::Path) -> String {
    let name = normalize_path(path);
    uuid::Uuid::new_v5(&uuid::Uuid::NAMESPACE_URL, name.as_bytes()).to_string()
}

/// Normalize a path for deduplication on Windows.
///
/// - Resolves symlinks via `canonicalize()` (falls back to original on error)
/// - Strips `\\?\` UNC prefix that Windows `canonicalize()` adds
/// - Converts all backslashes to forward slashes
/// - Lowercases the drive letter (`C:` → `c:`)
fn normalize_path(path: &std::path::Path) -> String {
    let canonical = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
    let mut s = canonical.to_string_lossy().to_string();

    // Strip \\?\ prefix that Windows canonicalize adds
    if s.starts_with(r"\\?\") {
        s = s[4..].to_string();
    }

    // Forward slashes only
    s = s.replace('\\', "/");

    // Lowercase drive letter: C: → c:
    if s.len() >= 2 && s.as_bytes()[1] == b':' {
        let mut chars: Vec<char> = s.chars().collect();
        chars[0] = chars[0].to_ascii_lowercase();
        s = chars.into_iter().collect();
    }

    s
}

/// Apply manifest-first capability resolution to all discovered models.
///
/// For each entry, checks the model's parent directory for `devpulse.json`.
/// If found, capabilities are REPLACED (not supplemented). If absent, tries
/// sentence-transformers detection, then config.json architecture suffix.
///
/// This runs BEFORE folder hints so manifests always win.
fn apply_manifest_capabilities(entries: &mut [ModelRegistryEntry]) {
    use crate::platform::model_loader::models::manifest;

    for entry in entries.iter_mut() {
        let Some(model_dir) = entry.path.parent() else {
            continue;
        };

        // 1. devpulse.json manifest — authoritative, replaces everything
        match manifest::load_manifest(model_dir) {
            Ok(Some(m)) => {
                tracing::info!(
                    file = %entry.filename,
                    role = %m.role,
                    caps = ?m.capabilities,
                    "Manifest override — capabilities replaced"
                );
                entry.compatible_capabilities = m.capabilities;
                continue; // Manifest is authoritative — skip fallbacks
            }
            Ok(None) => {} // No manifest — fall through to heuristics
            Err(e) => {
                tracing::warn!(
                    file = %entry.filename,
                    error = %e,
                    "Malformed devpulse.json — falling back to heuristic"
                );
            }
        }

        // 2. sentence-transformers detection (CrossEncoder = reranker, Pooling = embedder)
        if let Some(caps) = manifest::infer_from_sentence_transformers(model_dir) {
            tracing::info!(
                file = %entry.filename,
                caps = ?caps,
                "sentence-transformers detection — capabilities replaced"
            );
            entry.compatible_capabilities = caps;
            continue;
        }

        // 3. config.json architecture suffix (ForSequenceClassification = reranker)
        if let Some(caps) = manifest::infer_from_config_json_architectures(model_dir) {
            tracing::info!(
                file = %entry.filename,
                caps = ?caps,
                "config.json architecture suffix — capabilities replaced"
            );
            entry.compatible_capabilities = caps;
        }

        // 4. Existing heuristic from infer_capabilities() already applied at parse time.
        //    Folder hints run after this function.
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)] // tests panic on registry IO failures by design
mod tests {
    use super::*;

    #[test]
    fn quant_from_filename() {
        assert_eq!(
            infer_quant_from_filename("Qwen3-14B-Q4_K_M.gguf"),
            Some("Q4_K_M".to_string())
        );
        assert_eq!(
            infer_quant_from_filename("model-q8_0.gguf"),
            Some("Q8_0".to_string())
        );
        assert_eq!(
            infer_quant_from_filename("model-f16.gguf"),
            Some("F16".to_string())
        );
        assert_eq!(infer_quant_from_filename("mystery.gguf"), None);
    }

    #[test]
    fn capabilities_text_gen() {
        let caps = infer_capabilities("llama");
        assert!(caps.contains(&ModelCapability::TextGeneration));
    }

    #[test]
    fn capabilities_embedding() {
        let caps = infer_capabilities("bert");
        assert!(caps.contains(&ModelCapability::Embedding));
    }

    #[test]
    fn capabilities_unknown_defaults_to_textgen() {
        let caps = infer_capabilities("some_new_arch");
        assert!(caps.contains(&ModelCapability::TextGeneration));
    }

    #[test]
    fn vram_estimate_has_overhead() {
        let meta = ModelMetadata {
            architecture: "llama".to_string(),
            parameter_count: None,
            quant_level: None,
            context_length: 8192,
            vocab_size: 32000,
        };
        let file_size = 4_000_000_000; // ~4GB file
        let estimate = estimate_vram_mb(&meta, file_size);
        // 4GB file with 8192 context → ~15% overhead → ~4.4GB → 4400MB
        assert!(estimate > 4000);
        assert!(estimate < 5000);
    }

    #[test]
    fn discover_empty_dir() {
        let tmp = std::env::temp_dir().join("model_loader_test_empty");
        let _ = std::fs::create_dir_all(tmp.join("gguf"));
        let result = discover_models(&tmp).unwrap();
        assert!(result.is_empty());
        let _ = std::fs::remove_dir_all(&tmp);
    }

    #[test]
    fn discover_nonexistent_dir() {
        let result = discover_models(Path::new("/nonexistent/path"));
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }
}
