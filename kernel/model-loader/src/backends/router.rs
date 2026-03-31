//! Backend routing — decide Candle vs llama.cpp for a given model.

use crate::models::registry::{BackendType, ModelFormat, ModelRegistryEntry};

/// Select the appropriate backend for a model.
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
