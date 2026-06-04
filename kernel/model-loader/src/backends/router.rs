//! Backend routing — decide which inference engine handles a model.
//!
//! Locked direction (`feedback_inference_runtime_direction.md`):
//! Focus = llama.cpp + Burn + vLLM. Backup = Candle (kept, never the
//! path new code reaches for). The router enforces that here:
//! every GGUF goes to llama.cpp by default; Candle is reached only
//! when llama.cpp can't handle the architecture; safetensors models
//! whose slot wants an embedding capability go to Burn (the RRO
//! encoder path), everything else to Candle.

use crate::models::registry::{BackendType, ModelFormat, ModelRegistryEntry};
use crate::slots::types::ModelCapability;

/// Select the appropriate backend for a model.
///
/// Routing rules:
///
/// - `GGUF` → llama.cpp by default; Candle for archs llama.cpp can't load.
/// - `SafeTensors` + embedding-family capability (`Embedding` /
///   `Reranking` / `VisionEmbedding`) → Burn (the Sync-clean Qwen3
///   encoder authored in `kernel/devpulse-clyffy`).
/// - `SafeTensors` everything else → Candle.
/// - `ONNX` / `SherpaDir` → ort (`SNAC`, `Kokoro`, `Whisper`).
///
/// `capability` is `None` for callers that don't have slot context
/// (manual diagnostic paths). Without it the embedding-family hint
/// can't fire and `SafeTensors` falls back to Candle — the safe
/// default since Candle works for any safetensors model.
pub fn select_backend(
    entry: &ModelRegistryEntry,
    override_backend: Option<BackendType>,
    capability: Option<ModelCapability>,
) -> BackendType {
    if let Some(forced) = override_backend {
        return forced;
    }

    match entry.format {
        ModelFormat::Gguf => {
            if llamacpp_supports_architecture(&entry.architecture) {
                BackendType::LlamaCpp
            } else {
                // Rare path — niche archs llama.cpp doesn't load.
                BackendType::Candle
            }
        }
        ModelFormat::SafeTensors => {
            if matches!(
                capability,
                Some(
                    ModelCapability::Embedding
                        | ModelCapability::Reranking
                        | ModelCapability::VisionEmbedding,
                )
            ) {
                BackendType::Burn
            } else {
                BackendType::Candle
            }
        }
        ModelFormat::Onnx | ModelFormat::SherpaDir => BackendType::Ort,
    }
}

/// Check if llama.cpp has a GGUF loader for this architecture.
///
/// llama.cpp's GGUF support is broad — every mainstream LLM family is
/// supported. This list is the inverse of "things llama.cpp can't load,
/// fall back to Candle." Add an entry here only after verifying upstream
/// llama.cpp lists the arch in its loader switch.
#[must_use]
pub fn llamacpp_supports_architecture(arch: &str) -> bool {
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

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::models::registry::ModelSource;
    use std::path::PathBuf;

    fn entry(format: ModelFormat, arch: &str) -> ModelRegistryEntry {
        ModelRegistryEntry {
            id: "test".to_string(),
            filename: "test".to_string(),
            path: PathBuf::from("/tmp/test"),
            format,
            architecture: arch.to_string(),
            parameter_count: None,
            quant_level: None,
            context_length: 0,
            size_bytes: 0,
            vram_estimate_mb: 0,
            supported_backends: vec![],
            compatible_capabilities: vec![],
            source: ModelSource::Local,
            discovered_at: 0,
        }
    }

    #[test]
    fn safetensors_with_embedding_capability_routes_to_burn() {
        let pick = select_backend(
            &entry(ModelFormat::SafeTensors, "qwen3"),
            None,
            Some(ModelCapability::Embedding),
        );
        assert_eq!(pick, BackendType::Burn);
    }

    #[test]
    fn safetensors_without_capability_hint_falls_back_to_candle() {
        let pick = select_backend(&entry(ModelFormat::SafeTensors, "qwen3"), None, None);
        assert_eq!(pick, BackendType::Candle);
    }

    #[test]
    fn safetensors_with_text_generation_routes_to_candle() {
        let pick = select_backend(
            &entry(ModelFormat::SafeTensors, "qwen3"),
            None,
            Some(ModelCapability::TextGeneration),
        );
        assert_eq!(pick, BackendType::Candle);
    }

    #[test]
    fn safetensors_with_vision_embedding_routes_to_burn() {
        let pick = select_backend(
            &entry(ModelFormat::SafeTensors, "siglip"),
            None,
            Some(ModelCapability::VisionEmbedding),
        );
        assert_eq!(pick, BackendType::Burn);
    }

    #[test]
    fn override_wins_over_capability_routing() {
        let pick = select_backend(
            &entry(ModelFormat::SafeTensors, "qwen3"),
            Some(BackendType::Candle),
            Some(ModelCapability::Embedding),
        );
        assert_eq!(pick, BackendType::Candle);
    }

    #[test]
    fn gguf_with_embedding_capability_still_goes_to_llamacpp() {
        // GGUF routing is format-driven, capability is irrelevant.
        let pick = select_backend(
            &entry(ModelFormat::Gguf, "llama"),
            None,
            Some(ModelCapability::Embedding),
        );
        assert_eq!(pick, BackendType::LlamaCpp);
    }
}
