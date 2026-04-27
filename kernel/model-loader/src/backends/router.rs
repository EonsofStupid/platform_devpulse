//! Backend routing — decide which inference engine handles a model.

use crate::models::registry::{BackendType, ModelFormat, ModelRegistryEntry};

/// Select the appropriate backend for a model.
///
/// `GGUF` → Candle (if supported) or llama.cpp.
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
            if candle_supports_architecture(&entry.architecture) {
                BackendType::Candle
            } else {
                BackendType::LlamaCpp
            }
        }
        ModelFormat::SafeTensors => BackendType::Candle,
        ModelFormat::Onnx | ModelFormat::SherpaDir => BackendType::Ort,
    }
}

/// Check if Candle has a GGUF loader for this architecture.
///
/// This list must be verified against the pinned Candle revision.
#[must_use]
pub fn candle_supports_architecture(arch: &str) -> bool {
    matches!(
        arch,
        "llama"
            | "mistral"
            | "mixtral"
            | "qwen2"
            | "qwen3"
            | "phi2"
            | "phi3"
            | "gemma"
            | "gemma2"
            | "stablelm"
            | "starcoder"
    )
}
