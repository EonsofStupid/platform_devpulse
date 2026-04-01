//! Model discovery — directory walking and GGUF header parsing.

use crate::models::registry::{
    BackendType, ModelFormat, ModelMetadata, ModelRegistryEntry, ModelSource,
};
use crate::slots::types::ModelCapability;
use std::path::Path;

/// Discover all GGUF models in the models directory.
///
/// Walks `{models_dir}/gguf/` recursively, parses GGUF headers, builds registry entries.
pub fn discover_models(models_dir: &Path) -> anyhow::Result<Vec<ModelRegistryEntry>> {
    let gguf_dir = models_dir.join("gguf");
    if !gguf_dir.exists() {
        tracing::debug!(path = %gguf_dir.display(), "GGUF directory does not exist — no models to discover");
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();
    walk_gguf_dir(&gguf_dir, &mut entries)?;

    tracing::info!(count = entries.len(), path = %gguf_dir.display(), "Model discovery complete");
    Ok(entries)
}

/// Recursively walk a directory for .gguf files.
fn walk_gguf_dir(dir: &Path, entries: &mut Vec<ModelRegistryEntry>) -> anyhow::Result<()> {
    let read_dir = std::fs::read_dir(dir)?;

    for entry in read_dir {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            walk_gguf_dir(&path, entries)?;
        } else if path.extension().is_some_and(|ext| ext == "gguf") {
            match parse_gguf_entry(&path) {
                Ok(registry_entry) => {
                    tracing::debug!(file = %path.display(), arch = %registry_entry.architecture, "Discovered GGUF model");
                    entries.push(registry_entry);
                }
                Err(e) => {
                    tracing::warn!(file = %path.display(), error = %e, "Failed to parse GGUF file — skipping");
                }
            }
        }
    }

    Ok(())
}

/// Discover a single model file and set its source to HuggingFace.
/// Used after downloading a model from HF.
pub fn discover_single(path: &Path, repo_id: &str) -> anyhow::Result<ModelRegistryEntry> {
    let mut entry = parse_gguf_entry(path)?;
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
