//! Shared helper functions
//!
//! Utilities used across multiple command modules.

use shared::types::models::ModelFamily;

/// Parse model family string to enum
///
/// Accepts various formats:
/// - "qwen3_vl", "qwen3vl", "vl"
/// - "qwen3_embed", "qwen3embed", "embed"
/// - "qwen3_rerank", "qwen3rerank", "rerank"
/// - "whisper", "kokoro"
pub fn parse_model_family(s: &str) -> Result<ModelFamily, String> {
    match s.to_lowercase().replace('-', "_").as_str() {
        "qwen3_vl" | "qwen3vl" | "vl" => Ok(ModelFamily::Qwen3VL),
        "qwen3_embed" | "qwen3embed" | "embed" => Ok(ModelFamily::Qwen3Embed),
        "qwen3_rerank" | "qwen3rerank" | "rerank" => Ok(ModelFamily::Qwen3Rerank),
        "whisper" => Ok(ModelFamily::Whisper),
        "kokoro" => Ok(ModelFamily::Kokoro),
        _ => Err(format!("Unknown model family: {}", s)),
    }
}
