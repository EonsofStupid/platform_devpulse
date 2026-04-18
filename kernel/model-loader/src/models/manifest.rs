//! `devpulse.json` — per-model manifest declaring capabilities and slot hints.
//!
//! When present in a model directory, this file is **authoritative** — it
//! overrides heuristic capability inference from architecture strings,
//! folder names, and filename patterns.
//!
//! The file is auto-generated at download time from HuggingFace `pipeline_tag`
//! and sentence-transformers metadata. It can also be hand-written for
//! locally imported models.
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

/// Per-model manifest — the `devpulse.json` file.
///
/// Declares what a model IS so the slot system knows where it fits.
/// When present, `capabilities` replaces heuristic inference entirely.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelManifest {
    /// Human-readable label (e.g. "Harrier 0.6B", "Qwen3 Embedding 0.6B").
    pub label: String,

    /// Role tag — what this model is for. Matches HuggingFace `pipeline_tag`
    /// semantics but uses DevPulse vocabulary.
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

    /// HuggingFace `pipeline_tag` if known (e.g. `"feature-extraction"`, `"text-ranking"`).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pipeline_tag: Option<String>,

    /// HuggingFace repo ID if downloaded from HF.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hf_repo: Option<String>,

    /// Notes for the user (shown in devtools).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

/// The manifest filename.
pub const MANIFEST_FILENAME: &str = "devpulse.json";

/// Try to load a `devpulse.json` manifest from a model directory.
///
/// Returns `None` if the file doesn't exist. Returns `Err` if the file
/// exists but is malformed (parse error should be surfaced, not silenced).
pub fn load_manifest(model_dir: &Path) -> Result<Option<ModelManifest>, String> {
    let manifest_path = model_dir.join(MANIFEST_FILENAME);
    if !manifest_path.exists() {
        return Ok(None);
    }

    let content = std::fs::read_to_string(&manifest_path).map_err(|e| {
        format!(
            "Failed to read {}: {e}",
            manifest_path.display()
        )
    })?;

    let manifest: ModelManifest = serde_json::from_str(&content).map_err(|e| {
        format!(
            "Failed to parse {}: {e}",
            manifest_path.display()
        )
    })?;

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
