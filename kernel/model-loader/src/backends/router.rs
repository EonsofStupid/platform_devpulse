//! Backend routing — decide which inference engine handles a model.
//!
//! Locked direction (`feedback_inference_runtime_direction.md`):
//! Focus = llama.cpp + Burn + vLLM. Backup = Candle (kept, never the
//! path new code reaches for). The router enforces that here:
//! every GGUF goes to llama.cpp by default; Candle is reached only
//! when llama.cpp can't handle the architecture.

use crate::models::registry::{BackendType, ModelFormat, ModelRegistryEntry};

/// Select the appropriate backend for a model.
///
/// `GGUF` → llama.cpp (default), Candle only for archs llama.cpp can't load.
/// `SafeTensors` → Candle.
/// `ONNX` → ort (`SNAC`, `Kokoro`).
/// `SherpaDir` → ort (`Whisper` dirs contain ONNX encoder/decoder).
pub fn select_backend(
    entry: &ModelRegistryEntry,
    override_backend: Option<BackendType>,
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
        ModelFormat::SafeTensors => BackendType::Candle,
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

