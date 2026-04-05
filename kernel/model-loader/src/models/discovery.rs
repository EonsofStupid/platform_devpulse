//! Model discovery — directory walking and GGUF header parsing.

use crate::models::registry::{
    BackendType, ModelFormat, ModelMetadata, ModelRegistryEntry, ModelSource,
};
use crate::slots::types::ModelCapability;
use std::path::Path;

/// Discover all models in the models directory — GGUF, ONNX, and Sherpa directories.
///
/// Walks ALL subdirectories recursively. Models organized by purpose:
/// `chat/`, `voice/`, `rag/`, `vision/`, `general/`.
///
/// After discovery, applies folder-aware capability hints: if a model is in
/// `voice/`, it gains Speech capabilities even if the architecture string is
/// unfamiliar. This supplements (not overrides) architecture-based inference.
pub fn discover_models(models_dir: &Path) -> anyhow::Result<Vec<ModelRegistryEntry>> {
    if !models_dir.exists() {
        tracing::debug!(path = %models_dir.display(), "Models directory does not exist");
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();

    // Walk everything recursively — discover by file type, not folder name
    walk_all(models_dir, &mut entries)?;

    // Post-process: folder-aware capability hints
    apply_folder_hints(models_dir, &mut entries);

    tracing::info!(
        count = entries.len(),
        path = %models_dir.display(),
        "Model discovery complete"
    );
    Ok(entries)
}

/// Recursively walk a directory, discovering GGUF files, ONNX files, and Sherpa model dirs.
/// Folder-aware hints are applied after walk completes (in `discover_models`).
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
                match parse_sherpa_dir_entry(&path) {
                    Ok(registry_entry) => {
                        tracing::debug!(dir = %path.display(), "Discovered Sherpa model directory");
                        entries.push(registry_entry);
                    }
                    Err(e) => {
                        tracing::warn!(dir = %path.display(), error = %e, "Failed to parse Sherpa dir — skipping");
                    }
                }
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
                _ => {}
            }
        }
    }

    Ok(())
}

/// Discover a single model file and set its source to HuggingFace.
/// Used after downloading a model from HF. Handles GGUF, SafeTensors, and ONNX.
pub fn discover_single(path: &Path, repo_id: &str) -> anyhow::Result<ModelRegistryEntry> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

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
#[cfg(feature = "candle-backend")]
fn parse_gguf_entry(path: &Path) -> anyhow::Result<ModelRegistryEntry> {
    use candle_core::quantized::gguf_file::Content;
    use std::io::BufReader;

    let file = std::fs::File::open(path)?;
    let file_size = file.metadata()?.len();
    let mut reader = BufReader::new(file);
    let content = Content::read(&mut reader)?;

    let metadata = extract_metadata(&content)?;
    let vram_estimate = estimate_vram_mb(&metadata, file_size);
    let capabilities = infer_capabilities(&metadata.architecture);
    let backends = infer_backends(&metadata.architecture);

    let filename = path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    let quant_level = infer_quant_from_filename(&filename);

    Ok(ModelRegistryEntry {
        id: uuid::Uuid::now_v7().to_string(),
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
        discovered_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as i64)
            .unwrap_or(0),
    })
}

/// Fallback parser when candle-backend feature is disabled.
#[cfg(not(feature = "candle-backend"))]
fn parse_gguf_entry(path: &Path) -> anyhow::Result<ModelRegistryEntry> {
    let file_size = std::fs::metadata(path)?.len();
    let filename = path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    let quant_level = infer_quant_from_filename(&filename);

    Ok(ModelRegistryEntry {
        id: uuid::Uuid::now_v7().to_string(),
        filename,
        path: path.to_path_buf(),
        format: ModelFormat::Gguf,
        architecture: "unknown".to_string(),
        parameter_count: None,
        quant_level,
        context_length: 0,
        size_bytes: file_size,
        vram_estimate_mb: file_size / (1024 * 1024),
        supported_backends: vec![BackendType::LlamaCpp],
        compatible_capabilities: vec![ModelCapability::TextGeneration],
        source: ModelSource::Local,
        discovered_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as i64)
            .unwrap_or(0),
    })
}

/// Extract metadata from parsed GGUF content.
#[cfg(feature = "candle-backend")]
fn extract_metadata(content: &candle_core::quantized::gguf_file::Content) -> anyhow::Result<ModelMetadata> {
    use candle_core::quantized::gguf_file::Value;

    let get_str = |key: &str| -> Option<String> {
        content.metadata.get(key).and_then(|v| match v {
            Value::String(s) => Some(s.clone()),
            _ => None,
        })
    };

    let get_u64 = |key: &str| -> Option<u64> {
        content.metadata.get(key).and_then(|v| match v {
            Value::U64(n) => Some(*n),
            Value::U32(n) => Some(u64::from(*n)),
            Value::I64(n) => Some(*n as u64),
            Value::I32(n) => Some(*n as u64),
            _ => None,
        })
    };

    let architecture = get_str("general.architecture")
        .unwrap_or_else(|| "unknown".to_string());

    let context_key = format!("{architecture}.context_length");
    let context_length = get_u64(&context_key)
        .or_else(|| get_u64("general.context_length"))
        .unwrap_or(2048) as usize;

    let vocab_size = get_u64(&format!("{architecture}.vocab_size"))
        .unwrap_or(0) as usize;

    let parameter_count = get_u64("general.parameter_count");

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

    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss, clippy::cast_precision_loss)]
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
        | "gemma2" | "stablelm" | "starcoder" | "gpt2" | "gptneox" | "falcon" | "mpt"
        | "bloom" => {
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
#[must_use]
pub fn infer_backends(architecture: &str) -> Vec<BackendType> {
    let mut backends = vec![BackendType::LlamaCpp]; // llama.cpp supports almost everything

    if crate::backends::router::candle_supports_architecture(architecture) {
        backends.insert(0, BackendType::Candle); // Candle preferred when supported
    }

    backends
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
        "q2_k", "q3_k_s", "q3_k_m", "q3_k_l", "q4_0", "q4_1", "q4_k_s", "q4_k_m",
        "q5_0", "q5_1", "q5_k_s", "q5_k_m", "q6_k", "q8_0", "f16", "f32",
        "iq1_s", "iq1_m", "iq2_xxs", "iq2_xs", "iq2_s", "iq2_m", "iq3_xxs", "iq3_xs",
        "iq3_s", "iq3_m", "iq4_xs", "iq4_nl",
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

/// Parse a Sherpa model directory into a registry entry.
fn parse_sherpa_dir_entry(dir: &Path) -> anyhow::Result<ModelRegistryEntry> {
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

    Ok(ModelRegistryEntry {
        id: uuid::Uuid::now_v7().to_string(),
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
    })
}

/// Parse a SafeTensors file into a registry entry.
///
/// SafeTensors files don't embed architecture metadata like GGUF headers do.
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
        id: uuid::Uuid::now_v7().to_string(),
        filename,
        path: path.to_path_buf(),
        format: ModelFormat::SafeTensors,
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

/// Read config.json from a model directory for architecture metadata.
/// Returns (architecture, context_length, parameter_count).
fn read_config_json(dir: &Path) -> (String, usize, Option<u64>) {
    let config_path = dir.join("config.json");
    if !config_path.exists() {
        return ("unknown".to_string(), 0, None);
    }

    let content = match std::fs::read_to_string(&config_path) {
        Ok(c) => c,
        Err(_) => return ("unknown".to_string(), 0, None),
    };

    // Parse as generic JSON — we only need a few fields
    let json: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return ("unknown".to_string(), 0, None),
    };

    let architecture = json
        .get("model_type")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();

    let context_length = json
        .get("max_position_embeddings")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as usize;

    let parameter_count = json
        .get("num_parameters")
        .and_then(|v| v.as_u64());

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
    } else if filename.contains("embed") || filename.contains("siglip") {
        vec![ModelCapability::Embedding]
    } else {
        // Unknown ONNX — log and assume generic
        tracing::debug!(file = %filename, "Unknown ONNX model capability — not auto-assigned");
        Vec::new()
    };

    Ok(ModelRegistryEntry {
        id: uuid::Uuid::now_v7().to_string(),
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
                .filter_map(|e| e.ok())
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
        let relative = match entry.path.strip_prefix(models_dir) {
            Ok(rel) => rel,
            Err(_) => continue,
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

#[cfg(test)]
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
