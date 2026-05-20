//! `recommend_primary` — pick the best entry-point file for a slot.
//!
//! Given a Hugging Face repo's sibling list, the slot's required
//! capability, and the host's hardware tier, return the single
//! filename `install_to_slot` should hand to `start_download`. The
//! download manager's `plan_bundle` (`download.rs` §plan_bundle) then
//! auto-resolves shards + companions from that entry point — callers
//! only need to pick the *primary*.
//!
//! Rules are format-driven, not model-named. We never look at the
//! repo id or filename's brand string ("phi", "llama", etc.). That
//! keeps the recommender stable when new models ship — a Qwen-4
//! Q4_K_M GGUF is picked the same way as a Llama-3 Q4_K_M GGUF.
//!
//! ## Capability → preferred format
//!
//! | Capability | Preferred | Fallback |
//! |---|---|---|
//! | `TextGeneration` | GGUF (best quant for tier) | safetensors shard |
//! | `Embedding` / `Reranking` / `VisionEmbedding` | safetensors shard | onnx |
//! | `VisionLanguage` | safetensors shard | — |
//! | `SpeechToText` / `TextToSpeech` / `AudioDecoding` | onnx | bin |
//!
//! ## GGUF quant ranking by tier
//!
//! Higher tier → larger quant tolerated. Order is strict — `pick_gguf`
//! walks each tier's preference list in order and returns the first
//! filename that matches. If none match, it falls through to "any
//! GGUF" (alphabetic-first), which is better than failing the user's
//! one-button install.

use crate::hardware::auto_config::HardwareTier;
use crate::slots::types::ModelCapability;

/// Quant-suffix preference list per tier. Each tuple is `(suffix,
/// rank)` — `rank` is unused at the call site (suffixes are walked in
/// order) but kept in the source so the tier table reads as a ranked
/// preference, not an opaque list.
///
/// "F16" is the unquantized half-precision weight; "Q8_0" through
/// "Q2_K" are llama.cpp quants from highest to lowest fidelity.
fn gguf_quants_for_tier(tier: HardwareTier) -> &'static [&'static str] {
    match tier {
        HardwareTier::Ultra | HardwareTier::High => &[
            "F16", "Q8_0", "Q6_K", "Q5_K_M", "Q5_K_S", "Q4_K_M", "Q4_K_S", "Q4_0",
        ],
        HardwareTier::JessePrimary => &[
            "Q6_K", "Q5_K_M", "Q5_K_S", "Q8_0", "Q4_K_M", "Q4_K_S", "Q4_0", "F16",
        ],
        HardwareTier::Mid => &[
            "Q5_K_M", "Q4_K_M", "Q5_K_S", "Q4_K_S", "Q4_0", "Q6_K", "Q3_K_M",
        ],
        HardwareTier::Floor | HardwareTier::Minimal | HardwareTier::CpuOnly => &[
            "Q4_K_M", "Q4_K_S", "Q4_0", "Q3_K_M", "Q3_K_S", "Q2_K", "Q5_K_S",
        ],
    }
}

/// Walk `siblings` and return the first GGUF whose filename contains
/// (case-insensitive) one of the tier's preferred quant suffixes.
/// Falls through to any GGUF as a last resort.
fn pick_gguf<'a>(siblings: &'a [String], tier: HardwareTier) -> Option<&'a str> {
    let lower_pairs: Vec<(String, &str)> = siblings
        .iter()
        .map(|s| (s.to_lowercase(), s.as_str()))
        .collect();

    for quant in gguf_quants_for_tier(tier) {
        let needle = quant.to_lowercase();
        for (lower, original) in &lower_pairs {
            if lower.ends_with(".gguf") && lower.contains(&needle) {
                return Some(original);
            }
        }
    }

    // Final fallback: any GGUF. Better one-button install completes
    // with a quant we didn't rank than fails outright.
    lower_pairs
        .into_iter()
        .find(|(lower, _)| lower.ends_with(".gguf"))
        .map(|(_, original)| original)
}

/// Walk `siblings` and return the first safetensors entry point.
///
/// Preference order:
/// 1. First shard of a sharded set (`model-00001-of-NNNNN.safetensors`)
///    — passing any shard makes `plan_bundle` resolve the rest.
/// 2. The shard index (`model.safetensors.index.json`) — `plan_bundle`
///    treats this as primary and fans out to every referenced shard.
/// 3. Single `model.safetensors`.
/// 4. Any other `*.safetensors`.
fn pick_safetensors(siblings: &[String]) -> Option<&str> {
    // 1. Sharded — find shard "00001-of-NNNNN".
    let first_shard = siblings.iter().find(|s| {
        let lower = s.to_lowercase();
        lower.ends_with(".safetensors") && lower.contains("-00001-of-")
    });
    if let Some(s) = first_shard {
        return Some(s.as_str());
    }

    // 2. Shard index.
    if let Some(s) = siblings
        .iter()
        .find(|s| s.eq_ignore_ascii_case("model.safetensors.index.json"))
    {
        return Some(s.as_str());
    }

    // 3. Single canonical safetensors.
    if let Some(s) = siblings
        .iter()
        .find(|s| s.eq_ignore_ascii_case("model.safetensors"))
    {
        return Some(s.as_str());
    }

    // 4. Any other safetensors.
    siblings
        .iter()
        .find(|s| s.to_lowercase().ends_with(".safetensors"))
        .map(String::as_str)
}

/// Walk `siblings` and return the first ONNX file. Prefers
/// `model.onnx` over arbitrary names so callers land on the
/// canonical entry point when one exists.
fn pick_onnx(siblings: &[String]) -> Option<&str> {
    if let Some(s) = siblings
        .iter()
        .find(|s| s.eq_ignore_ascii_case("model.onnx"))
    {
        return Some(s.as_str());
    }
    siblings
        .iter()
        .find(|s| s.to_lowercase().ends_with(".onnx"))
        .map(String::as_str)
}

/// Pick the primary filename to hand `install_to_slot` for the given
/// `(siblings, capability, tier)`.
///
/// Returns `None` only when the repo has zero compatible files for
/// the capability — UI surfaces that as "this repo doesn't ship a
/// model in a format we can run for this slot." In every other case
/// the recommender returns *something*, even if the quant didn't rank
/// — the user's one-button install completing with a fallback quant
/// beats the install failing outright.
#[must_use]
pub fn recommend_primary<'a>(
    siblings: &'a [String],
    capability: ModelCapability,
    tier: HardwareTier,
) -> Option<&'a str> {
    match capability {
        ModelCapability::TextGeneration => {
            pick_gguf(siblings, tier).or_else(|| pick_safetensors(siblings))
        }

        ModelCapability::Embedding
        | ModelCapability::Reranking
        | ModelCapability::VisionEmbedding => {
            pick_safetensors(siblings).or_else(|| pick_onnx(siblings))
        }

        ModelCapability::VisionLanguage => pick_safetensors(siblings),

        ModelCapability::SpeechToText
        | ModelCapability::TextToSpeech
        | ModelCapability::AudioDecoding => pick_onnx(siblings).or_else(|| {
            siblings
                .iter()
                .find(|s| s.to_lowercase().ends_with(".bin"))
                .map(String::as_str)
        }),
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    fn s(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| (*s).to_string()).collect()
    }

    #[test]
    fn high_tier_picks_q6_or_better_gguf() {
        let siblings = s(&[
            "model-Q4_K_M.gguf",
            "model-Q6_K.gguf",
            "model-Q8_0.gguf",
            "config.json",
        ]);
        let pick = recommend_primary(
            &siblings,
            ModelCapability::TextGeneration,
            HardwareTier::High,
        );
        assert_eq!(pick, Some("model-Q8_0.gguf"));
    }

    #[test]
    fn floor_tier_picks_smallest_safe_quant() {
        let siblings = s(&["model-Q4_K_M.gguf", "model-Q6_K.gguf", "model-Q8_0.gguf"]);
        let pick = recommend_primary(
            &siblings,
            ModelCapability::TextGeneration,
            HardwareTier::Floor,
        );
        assert_eq!(pick, Some("model-Q4_K_M.gguf"));
    }

    #[test]
    fn jesse_primary_prefers_q6_over_q8() {
        let siblings = s(&["model-Q4_K_M.gguf", "model-Q6_K.gguf", "model-Q8_0.gguf"]);
        let pick = recommend_primary(
            &siblings,
            ModelCapability::TextGeneration,
            HardwareTier::JessePrimary,
        );
        assert_eq!(pick, Some("model-Q6_K.gguf"));
    }

    #[test]
    fn unranked_quant_falls_back_to_any_gguf() {
        let siblings = s(&["model-IQ3_XXS.gguf", "config.json"]);
        let pick = recommend_primary(
            &siblings,
            ModelCapability::TextGeneration,
            HardwareTier::Floor,
        );
        assert_eq!(pick, Some("model-IQ3_XXS.gguf"));
    }

    #[test]
    fn embedding_picks_first_shard_over_index() {
        let siblings = s(&[
            "model-00001-of-00003.safetensors",
            "model-00002-of-00003.safetensors",
            "model-00003-of-00003.safetensors",
            "model.safetensors.index.json",
            "config.json",
        ]);
        let pick = recommend_primary(
            &siblings,
            ModelCapability::Embedding,
            HardwareTier::JessePrimary,
        );
        assert_eq!(pick, Some("model-00001-of-00003.safetensors"));
    }

    #[test]
    fn embedding_falls_back_to_onnx_when_no_safetensors() {
        let siblings = s(&["model.onnx", "tokenizer.json"]);
        let pick = recommend_primary(&siblings, ModelCapability::Embedding, HardwareTier::Floor);
        assert_eq!(pick, Some("model.onnx"));
    }

    #[test]
    fn tts_prefers_onnx() {
        let siblings = s(&["model.onnx", "voices.bin"]);
        let pick = recommend_primary(
            &siblings,
            ModelCapability::TextToSpeech,
            HardwareTier::Floor,
        );
        assert_eq!(pick, Some("model.onnx"));
    }

    #[test]
    fn empty_repo_returns_none() {
        let siblings: Vec<String> = vec![];
        let pick = recommend_primary(
            &siblings,
            ModelCapability::TextGeneration,
            HardwareTier::JessePrimary,
        );
        assert!(pick.is_none());
    }

    #[test]
    fn text_generation_falls_back_to_safetensors_when_no_gguf() {
        let siblings = s(&["model.safetensors", "config.json"]);
        let pick = recommend_primary(
            &siblings,
            ModelCapability::TextGeneration,
            HardwareTier::JessePrimary,
        );
        assert_eq!(pick, Some("model.safetensors"));
    }
}
