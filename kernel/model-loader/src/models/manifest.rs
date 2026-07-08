//! `devpulse.json` — per-model manifest: the single source of truth for a
//! model's **identity**, **capability**, and **integrity** on this machine.
//!
//! Follows the same pattern Jan / Connectome / Ollama use: one machine-written
//! manifest per model directory declares "what this model is" independent
//! of filename, path, or how it got here. Presets bind to the stable
//! `canonical_id`; downstream code never matches on filename strings.
//!
//! When present in a model directory, this file is **authoritative** — it
//! overrides heuristic capability inference from architecture strings,
//! folder names, and filename patterns.
//!
//! The file is auto-generated at download time OR backfilled for imported
//! models via `cargo xtask model-manifest-backfill`.
//!
//! # Detection waterfall (used when `devpulse.json` is absent)
//!
//! 1. `config_sentence_transformers.json` → `model_type: "CrossEncoder"` = reranker
//! 2. `modules.json` with `Pooling` + `Normalize` = embedder
//! 3. `config.json` `architectures` suffix → `ForSequenceClassification` = reranker
//! 4. GGUF keys → `pooling_type` = embedding, `vision.block_count` = vision
//! 5. Architecture string match (existing `infer_capabilities`)
//! 6. Folder hints (`rag/` → embedding+reranking, `voice/` → STT+TTS)

use crate::slots::types::ModelCapability;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Manifest schema version. Bump when we change field semantics; older
/// manifests are still parseable (missing fields default) but the
/// backfill tool uses this to decide whether to re-author.
pub const MANIFEST_SCHEMA_VERSION: u32 = 1;

/// The manifest filename — co-located with model weights in the model dir.
pub const MANIFEST_FILENAME: &str = "devpulse.json";

/// Per-model manifest — the `devpulse.json` file.
///
/// Declares what a model IS so the slot system knows where it fits.
/// When present, `capabilities` replaces heuristic inference entirely,
/// AND `canonical_id` is the binding preset recommendations resolve
/// against — no more "preset says qwen3-30b, disk has qwen3.6-35b,
/// filename mismatch → phantom download prompt".
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelManifest {
    /// Schema version. Defaults to 1 for pre-versioned manifests loaded
    /// from disk; always set to [`MANIFEST_SCHEMA_VERSION`] on write.
    #[serde(default = "default_schema_version")]
    pub schema_version: u32,

    // ── Identity ──────────────────────────────────────────────────────
    /// Stable canonical id of the form `namespace/name` (e.g.
    /// `qwen/qwen3-4b-instruct`, `kyutai/moshi-v0.1-7b`). Presets bind
    /// to this; it never changes across renames, redownloads, or
    /// re-quantizations of the same logical model.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub canonical_id: Option<String>,

    /// Human-readable label (e.g. "Harrier 0.6B", "Qwen3 Embedding 0.6B").
    pub label: String,

    // ── Capability ────────────────────────────────────────────────────
    /// Role tag — what this model is for. Matches `HuggingFace` `pipeline_tag`
    /// semantics but uses `DevPulse` vocabulary.
    ///
    /// Values: `"reasoning"`, `"embedder"`, `"reranker"`, `"vision"`,
    /// `"vision-language"`, `"tts"`, `"stt"`, `"audio-codec"`, `"general"`.
    pub role: String,

    /// Explicit capability declarations. Overrides all heuristic inference.
    pub capabilities: Vec<ModelCapability>,

    /// Slot IDs this model is recommended for (e.g. `["rag.embedder", "rag.encoder"]`).
    /// Used by the setup banner to pre-populate suggestions.
    #[serde(default)]
    pub recommended_slots: Vec<String>,

    // ── Architecture / sizing ─────────────────────────────────────────
    /// Normalized architecture family tag for preset matching. One of:
    /// `"qwen3-dense"`, `"qwen3-moe"`, `"qwen3-vl"`, `"phi4"`, `"gemma3"`,
    /// `"whisper"`, `"kokoro"`, `"snac"`, `"moshi"`, `"siglip"`,
    /// `"nomic-embed"`, `"xlm-roberta"`, `"harrier"`, `"unknown"`. Derived
    /// at backfill/download time from GGUF metadata or HF `config.json`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub architecture: Option<String>,

    /// Parameter count in billions (e.g. 0.6, 4.0, 30.0, 35.0). Used by
    /// preset matching when `canonical_id` misses — "any qwen3-moe with
    /// params >= 30" fallback.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parameter_count_b: Option<f32>,

    /// Quantization variant if applicable (e.g. `"Q4_K_M"`, `"Q8_0"`,
    /// `"F16"`, `"BF16"`). `None` for full-precision safetensors.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub quant: Option<String>,

    /// Context length in tokens, when declared in metadata.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub context_length: Option<u64>,

    /// Best-effort VRAM estimate in MB, at typical quant + context.
    /// Used by the hardware tier budgeter. `None` = compute on demand.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub vram_estimate_mb: Option<u64>,

    // ── Integrity ─────────────────────────────────────────────────────
    /// Files that make up this model (weights + tokenizer + mmproj etc.)
    /// with per-file size and SHA-256. A model is considered "installed"
    /// only when every declared file exists on disk and — if the scanner
    /// is in verify mode — every sha256 matches.
    #[serde(default)]
    pub files: Vec<ManifestFile>,

    // ── Provenance ────────────────────────────────────────────────────
    /// `HuggingFace` `pipeline_tag` if known (e.g. `"feature-extraction"`, `"text-ranking"`).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pipeline_tag: Option<String>,

    /// `HuggingFace` repo ID if downloaded from HF (e.g. `"Qwen/Qwen3-4B-Instruct-GGUF"`).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hf_repo: Option<String>,

    /// `HuggingFace` revision (commit sha or tag) locked at download time.
    /// Lets us detect "this is an older snapshot than the slot preset
    /// expects" without re-hitting the hub.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hf_revision: Option<String>,

    /// Notes for the user (shown in devtools).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

/// A single file referenced by the manifest. Typically a model weight
/// (`.gguf`, `.safetensors`, `.onnx`, `.bin`) or a companion file
/// (`tokenizer.json`, `mmproj-*.gguf`, `config.json`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestFile {
    /// Path RELATIVE to the manifest's directory. No leading `./`.
    pub path: String,
    /// File size in bytes at manifest write time.
    pub size_bytes: u64,
    /// SHA-256 of the file contents. Hex lowercase.
    pub sha256: String,
    /// Role hint: `"weights"` (primary), `"tokenizer"`, `"mmproj"`,
    /// `"config"`, `"auxiliary"`. Free-form; consumers look for
    /// `"weights"` as the load target when multiple files exist.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
}

fn default_schema_version() -> u32 {
    MANIFEST_SCHEMA_VERSION
}

/// Try to load a `devpulse.json` manifest from a model directory.
///
/// Returns `None` if the file doesn't exist. Returns `Err` if the file
/// exists but is malformed (parse error should be surfaced, not silenced).
///
/// # Errors
/// Returns a `String` with a layman-readable description if the file
/// can't be read (permission denied, etc.) or the JSON fails to parse
/// against the [`ModelManifest`] schema.
pub fn load_manifest(model_dir: &Path) -> Result<Option<ModelManifest>, String> {
    let manifest_path = model_dir.join(MANIFEST_FILENAME);
    if !manifest_path.exists() {
        return Ok(None);
    }

    let content = std::fs::read_to_string(&manifest_path)
        .map_err(|e| format!("Failed to read {}: {e}", manifest_path.display()))?;

    let manifest: ModelManifest = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse {}: {e}", manifest_path.display()))?;

    tracing::info!(
        dir = %model_dir.display(),
        label = %manifest.label,
        role = %manifest.role,
        caps = ?manifest.capabilities,
        "devpulse.json manifest loaded"
    );

    Ok(Some(manifest))
}

/// Infer capabilities from sentence-transformers metadata files.
///
/// This is the secondary detection path when `devpulse.json` is absent.
/// Checks for `config_sentence_transformers.json` and `modules.json`.
pub fn infer_from_sentence_transformers(model_dir: &Path) -> Option<Vec<ModelCapability>> {
    // Check for CrossEncoder (reranker) in config_sentence_transformers.json
    let st_config_path = model_dir.join("config_sentence_transformers.json");
    if st_config_path.exists() {
        if let Ok(content) = std::fs::read_to_string(&st_config_path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                // CrossEncoder = reranker
                if json.get("model_type").and_then(|v| v.as_str()) == Some("CrossEncoder") {
                    tracing::debug!(
                        dir = %model_dir.display(),
                        "sentence-transformers CrossEncoder detected → Reranking"
                    );
                    return Some(vec![ModelCapability::Reranking]);
                }
            }
        }
    }

    // Check for Pooling + Normalize in modules.json (= embedding model)
    let modules_path = model_dir.join("modules.json");
    if modules_path.exists() {
        if let Ok(content) = std::fs::read_to_string(&modules_path) {
            if let Ok(modules) = serde_json::from_str::<Vec<serde_json::Value>>(&content) {
                let has_pooling = modules.iter().any(|m| {
                    m.get("type")
                        .and_then(|t| t.as_str())
                        .is_some_and(|t| t.contains("Pooling"))
                });
                if has_pooling {
                    tracing::debug!(
                        dir = %model_dir.display(),
                        "sentence-transformers Pooling detected → Embedding"
                    );
                    return Some(vec![ModelCapability::Embedding]);
                }
            }
        }
    }

    None
}

/// Infer capabilities from `config.json` architecture suffix.
///
/// `ForSequenceClassification` → likely reranker.
/// `ForCausalLM` → text generation (already handled by architecture match).
/// Bare `Model` → likely embedding base model.
pub fn infer_from_config_json_architectures(model_dir: &Path) -> Option<Vec<ModelCapability>> {
    let config_path = model_dir.join("config.json");
    if !config_path.exists() {
        return None;
    }

    let content = std::fs::read_to_string(&config_path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;

    let architectures = json.get("architectures")?.as_array()?;
    for arch in architectures {
        let arch_str = arch.as_str()?;
        if arch_str.contains("ForSequenceClassification") {
            tracing::debug!(
                dir = %model_dir.display(),
                arch = %arch_str,
                "ForSequenceClassification detected → Reranking"
            );
            return Some(vec![ModelCapability::Reranking]);
        }
    }

    None
}

/// Write `devpulse.json` into `model_dir`. Pretty-prints the JSON and
/// forces `schema_version` to the current [`MANIFEST_SCHEMA_VERSION`]
/// so older writes can never produce stale version tags.
///
/// # Errors
/// Returns a `String` if JSON serialization fails (effectively impossible
/// — every field has a serde impl) or if the file write fails (permission
/// denied, disk full, parent doesn't exist).
pub fn save_manifest(model_dir: &Path, mut manifest: ModelManifest) -> Result<(), String> {
    manifest.schema_version = MANIFEST_SCHEMA_VERSION;
    let path = model_dir.join(MANIFEST_FILENAME);
    let body = serde_json::to_string_pretty(&manifest)
        .map_err(|e| format!("serializing manifest for {}: {e}", model_dir.display()))?;
    std::fs::write(&path, body).map_err(|e| format!("writing {}: {e}", path.display()))?;
    tracing::info!(
        path = %path.display(),
        canonical_id = ?manifest.canonical_id,
        "devpulse.json written"
    );
    Ok(())
}

/// Resolve the primary weights file for a manifest — the one the loader
/// should hand to llama.cpp / Candle / ORT.
///
/// Preference order:
///
/// 1. First file with `role = "weights"`.
/// 2. First file whose path ends in `.gguf`, `.safetensors`, or `.onnx`.
/// 3. First file in the list.
///
/// Returns the relative path as declared in the manifest, or `None` if
/// the manifest has no files.
#[must_use]
pub fn primary_weights_path(manifest: &ModelManifest) -> Option<&str> {
    manifest
        .files
        .iter()
        .find(|f| f.role.as_deref() == Some("weights"))
        .or_else(|| {
            manifest.files.iter().find(|f| {
                // `p` is already `to_ascii_lowercase()`'d above, so case is
                // normalised — the lint's case-sensitive concern doesn't apply.
                #[allow(clippy::case_sensitive_file_extension_comparisons)]
                {
                    let p = f.path.to_ascii_lowercase();
                    p.ends_with(".gguf") || p.ends_with(".safetensors") || p.ends_with(".onnx")
                }
            })
        })
        .or_else(|| manifest.files.first())
        .map(|f| f.path.as_str())
}

#[cfg(test)]
#[allow(clippy::unwrap_used)] // tests panic on manifest parse / IO failures by design
mod tests {
    use super::*;

    #[test]
    fn schema_version_defaults_to_current() {
        let json = r#"{"label":"x","role":"general","capabilities":[]}"#;
        let m: ModelManifest = serde_json::from_str(json).unwrap();
        assert_eq!(m.schema_version, MANIFEST_SCHEMA_VERSION);
        assert!(m.canonical_id.is_none());
        assert!(m.files.is_empty());
    }

    #[test]
    fn extended_fields_round_trip() {
        let m = ModelManifest {
            schema_version: MANIFEST_SCHEMA_VERSION,
            canonical_id: Some("qwen/qwen3-4b-instruct".to_string()),
            label: "Qwen3 4B Instruct".to_string(),
            role: "reasoning".to_string(),
            capabilities: vec![ModelCapability::TextGeneration],
            recommended_slots: vec!["chat.fast".to_string()],
            architecture: Some("qwen3-dense".to_string()),
            parameter_count_b: Some(4.0),
            quant: Some("Q4_K_M".to_string()),
            context_length: Some(32_768),
            vram_estimate_mb: Some(2700),
            files: vec![ManifestFile {
                path: "Qwen3-4B-Instruct-Q4_K_M.gguf".to_string(),
                size_bytes: 2_500_000_000,
                sha256: "deadbeef".repeat(8),
                role: Some("weights".to_string()),
            }],
            pipeline_tag: Some("text-generation".to_string()),
            hf_repo: Some("Qwen/Qwen3-4B-Instruct-GGUF".to_string()),
            hf_revision: None,
            notes: None,
        };
        let s = serde_json::to_string_pretty(&m).unwrap();
        let r: ModelManifest = serde_json::from_str(&s).unwrap();
        assert_eq!(r.canonical_id.as_deref(), Some("qwen/qwen3-4b-instruct"));
        assert_eq!(r.parameter_count_b, Some(4.0));
        assert_eq!(r.quant.as_deref(), Some("Q4_K_M"));
        assert_eq!(r.files.len(), 1);
        assert_eq!(
            primary_weights_path(&r),
            Some("Qwen3-4B-Instruct-Q4_K_M.gguf")
        );
    }

    #[test]
    fn primary_weights_prefers_role_weights() {
        let m = ModelManifest {
            schema_version: 1,
            canonical_id: None,
            label: "x".into(),
            role: "general".into(),
            capabilities: vec![],
            recommended_slots: vec![],
            architecture: None,
            parameter_count_b: None,
            quant: None,
            context_length: None,
            vram_estimate_mb: None,
            files: vec![
                ManifestFile {
                    path: "tokenizer.json".into(),
                    size_bytes: 100,
                    sha256: "a".into(),
                    role: Some("tokenizer".into()),
                },
                ManifestFile {
                    path: "model.safetensors".into(),
                    size_bytes: 1000,
                    sha256: "b".into(),
                    role: Some("weights".into()),
                },
            ],
            pipeline_tag: None,
            hf_repo: None,
            hf_revision: None,
            notes: None,
        };
        assert_eq!(primary_weights_path(&m), Some("model.safetensors"));
    }

    #[test]
    fn primary_weights_falls_back_to_extension() {
        let m = ModelManifest {
            schema_version: 1,
            canonical_id: None,
            label: "x".into(),
            role: "general".into(),
            capabilities: vec![],
            recommended_slots: vec![],
            architecture: None,
            parameter_count_b: None,
            quant: None,
            context_length: None,
            vram_estimate_mb: None,
            files: vec![
                ManifestFile {
                    path: "README.md".into(),
                    size_bytes: 100,
                    sha256: "a".into(),
                    role: None,
                },
                ManifestFile {
                    path: "weights.gguf".into(),
                    size_bytes: 1000,
                    sha256: "b".into(),
                    role: None,
                },
            ],
            pipeline_tag: None,
            hf_repo: None,
            hf_revision: None,
            notes: None,
        };
        assert_eq!(primary_weights_path(&m), Some("weights.gguf"));
    }
}
