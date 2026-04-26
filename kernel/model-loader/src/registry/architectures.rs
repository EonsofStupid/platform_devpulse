//! # Architecture catalog
//!
//! Enumerates every model architecture `DevPulse`'s Candle backend
//! knows how to load, plus the tier and format support for each.
//!
//! **SSOT rule:** adding a new architecture is a two-file change —
//! one row here, one branch in [`crate::backends::candle::backend`].
//! Nothing else needs touching because the resolver, the Tauri
//! command, and the frontend compatibility service all read from this
//! constant at runtime.
//!
//! # Tier semantics
//!
//! - [`SupportTier::Primary`] — first-class. Shown in the default UI.
//!   Recommended by the auto-configure flow.
//! - [`SupportTier::Secondary`] — works, but not the preferred choice.
//!   Only suggested as a fallback when Primary isn't available.
//! - [`SupportTier::Legacy`] — kept for compatibility with older
//!   deployments. The resolver surfaces a deprecation warning.
//! - [`SupportTier::Planned`] — slot reserved for an upcoming model.
//!   Resolver returns `Unsupported { status: Planned }` until the
//!   corresponding backend ships.

use serde::{Deserialize, Serialize};

/// Canonical architecture identifiers. String-valued so specta can
/// emit them as TypeScript union literals and the frontend gets
/// exhaustive matching without a runtime cast.
///
/// Both `Serialize` and `Deserialize` are derived because this type
/// is used in both directions across the Tauri boundary (returned
/// from `list_backend_matrix`, expected to be accepted as input by
/// future commands like `get_architecture_details(arch: ArchId)`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum ArchId {
    /// Qwen 3 dense decoder-only language models.
    Qwen3,
    /// Qwen 3 mixture-of-experts language models.
    Qwen3Moe,
    /// Qwen 3 vision-language models.
    Qwen3Vl,
    /// Reserved slot for the upcoming Qwen 3.5 family.
    Qwen35,
    /// Qwen 2.5 language models still supported as a fallback tier.
    Qwen25,
    /// Legacy Qwen 2 models kept for backward compatibility.
    Qwen2,
    /// Phi-3 dense language models. Also covers Phi-4 base / Phi-4-reasoning
    /// / Phi-4-reasoning-plus which ship as `phi3` under the hood.
    Phi3,
    /// Phi-3 mixture-of-experts variants such as 30B-A3B.
    Phi3Moe,
    /// Phi-4 vision-language with bundled `SigLIP` encoder. The `phi4-siglip`
    /// arch tag — distinct from Phi3 because the projection head and
    /// vision tower require a separate loader (llama.cpp FFI + mmproj).
    Phi4Vision,
    /// Phi-4 multimodal instruct (`phi4mm`). Vision + audio + text via a
    /// multi-graph ONNX bundle. Loaded through the ORT backend, not Candle.
    Phi4Mm,
    /// Llama-family and Llama-derived checkpoints.
    Llama,
    /// Mistral-family checkpoints.
    Mistral,
    /// Gemma-family checkpoints (Gemma 1 / 2, GGUF via llama fallback).
    Gemma,
    /// Gemma 3 text encoder. Used by sentence-transformer embedders such
    /// as Microsoft Harrier 270m. Distinct from `Gemma` because the
    /// embedding loader strips the LM head and pools last-hidden-state.
    Gemma3Text,
}

/// Architecture family. Drives grouping in the frontend matrix view
/// and lets the resolver suggest same-family alternatives.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum ArchFamily {
    /// Qwen-family architectures.
    Qwen,
    /// Phi-family architectures (Phi-3, Phi-4, Phi-4 vision, Phi-4 multimodal).
    Phi,
    /// Llama-family architectures.
    Llama,
    /// Mistral-family architectures.
    Mistral,
    /// Gemma-family architectures (Gemma 1/2/3 text + embedders).
    Gemma,
}

/// Relative priority for recommendation order.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum SupportTier {
    /// First-class path shown as the default recommendation.
    Primary,
    /// Supported fallback path when the primary tier is not available.
    Secondary,
    /// Deprecated but still loadable for existing model inventories.
    Legacy,
    /// Reserved entry that should render as coming soon, not loadable.
    Planned,
}

/// Whether the backend for this format is stable, experimental, or
/// not yet shipped. Used by the resolver to decide whether to surface
/// a compatibility warning alongside a successful plan.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum SupportStatus {
    /// Shipped and expected to work in routine use.
    Stable,
    /// Shipped behind cautionary messaging due to maturity risk.
    Experimental,
    /// Declared in the registry but not yet implemented.
    Planned,
    /// Explicitly unsupported for this backend/format pairing.
    Unsupported,
}

/// A single architecture row. Every field is `'static` so the catalog
/// can live in a `const` array with zero runtime allocation.
///
/// Serialize-only because the `&'static str` fields can't cleanly
/// round-trip through serde's `Deserialize` (would need `Cow<str>`).
/// This type flows one direction: kernel registry → Tauri command
/// return → frontend. Never accepted as an input.
#[derive(Debug, Clone, Copy, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct ArchitectureSpec {
    /// Canonical id used by the resolver.
    pub id: ArchId,
    /// Human display name for the matrix UI.
    pub display: &'static str,
    /// Family grouping.
    pub family: ArchFamily,
    /// Tier for recommendation ordering.
    pub tier: SupportTier,
    /// `[min, max]` context window bounds for this architecture.
    /// Used by the frontend to sanity-check user slot configurations.
    pub context_range: (u32, u32),
    /// Approximate VRAM cost per billion parameters in FP16. Used by
    /// the VRAM planner + wizard recommendation pass.
    pub min_vram_mb_per_b_params: u32,
    /// Whether this architecture should be included in the benchmark
    /// bench automatically (30B-A3B evaluation, etc.).
    pub requires_benchmark: bool,
    /// Short free-form note shown to the user in the detail panel.
    pub note: &'static str,
}

/// The registry. One row per supported architecture. **Ordering here
/// is recommendation order** — the resolver walks this array when
/// suggesting alternatives, so Primary Qwen3 comes before legacy
/// Qwen2.
pub const ALL: &[ArchitectureSpec] = &[
    ArchitectureSpec {
        id: ArchId::Qwen3,
        display: "Qwen 3",
        family: ArchFamily::Qwen,
        tier: SupportTier::Primary,
        context_range: (8_192, 131_072),
        min_vram_mb_per_b_params: 2_100,
        requires_benchmark: false,
        note: "Primary chat architecture. Dense attention, safetensors \
               and GGUF first-class via candle 0.9.",
    },
    ArchitectureSpec {
        id: ArchId::Qwen3Moe,
        display: "Qwen 3 MoE",
        family: ArchFamily::Qwen,
        tier: SupportTier::Primary,
        context_range: (8_192, 131_072),
        min_vram_mb_per_b_params: 1_600,
        requires_benchmark: true,
        note: "Mixture-of-experts variant. Higher throughput per active \
               parameter than the dense version.",
    },
    ArchitectureSpec {
        id: ArchId::Qwen3Vl,
        display: "Qwen 3 VL",
        family: ArchFamily::Qwen,
        tier: SupportTier::Primary,
        context_range: (4_096, 32_768),
        min_vram_mb_per_b_params: 2_400,
        requires_benchmark: false,
        note: "Vision-language variant. Accepts image + text input. \
               Requires the qwen3-vl loader path (candle 0.9).",
    },
    ArchitectureSpec {
        id: ArchId::Qwen35,
        display: "Qwen 3.5",
        family: ArchFamily::Qwen,
        tier: SupportTier::Planned,
        context_range: (8_192, 131_072),
        min_vram_mb_per_b_params: 2_100,
        requires_benchmark: false,
        note: "Slot reserved. Resolver returns Planned until the \
               loader ships.",
    },
    ArchitectureSpec {
        id: ArchId::Phi3,
        display: "Phi-3",
        family: ArchFamily::Phi,
        tier: SupportTier::Primary,
        context_range: (4_096, 128_000),
        min_vram_mb_per_b_params: 2_200,
        requires_benchmark: false,
        note: "Dense Phi-3 (mini / medium / small). Safetensors and \
               GGUF first-class via candle 0.9.",
    },
    ArchitectureSpec {
        id: ArchId::Phi3Moe,
        display: "Phi-3 MoE (30B-A3B)",
        family: ArchFamily::Phi,
        tier: SupportTier::Primary,
        context_range: (4_096, 128_000),
        min_vram_mb_per_b_params: 1_400,
        requires_benchmark: true,
        note: "30B total, 3B active. The evaluation target for the \
               unified-brain vs split-config benchmark.",
    },
    ArchitectureSpec {
        id: ArchId::Phi4Vision,
        display: "Phi-4 Vision (phi4-siglip)",
        family: ArchFamily::Phi,
        tier: SupportTier::Primary,
        context_range: (4_096, 32_768),
        min_vram_mb_per_b_params: 2_400,
        requires_benchmark: false,
        note: "Phi-4 reasoning + bundled SigLIP vision tower. GGUF via \
               llama.cpp FFI; safetensors load is unsupported. Requires \
               an mmproj projection file alongside the main GGUF.",
    },
    ArchitectureSpec {
        id: ArchId::Phi4Mm,
        display: "Phi-4 Multimodal (phi4mm)",
        family: ArchFamily::Phi,
        tier: SupportTier::Primary,
        context_range: (4_096, 32_768),
        min_vram_mb_per_b_params: 1_800,
        requires_benchmark: false,
        note: "Phi-4 multimodal instruct — vision + audio (ASR) + text. \
               Microsoft ships an official ONNX export; loaded via ORT \
               with separate text/vision/audio session graphs.",
    },
    ArchitectureSpec {
        id: ArchId::Qwen25,
        display: "Qwen 2.5",
        family: ArchFamily::Qwen,
        tier: SupportTier::Secondary,
        context_range: (8_192, 131_072),
        min_vram_mb_per_b_params: 2_100,
        requires_benchmark: false,
        note: "Fallback for Qwen2.5 fine-tunes that haven't been \
               ported forward. Same loader as Qwen2.",
    },
    ArchitectureSpec {
        id: ArchId::Qwen2,
        display: "Qwen 2 (legacy)",
        family: ArchFamily::Qwen,
        tier: SupportTier::Legacy,
        context_range: (4_096, 32_768),
        min_vram_mb_per_b_params: 2_100,
        requires_benchmark: false,
        note: "Deprecated. Only loaded when an explicit Qwen2 repo is \
               requested. Resolver suggests Qwen3 as the replacement.",
    },
    ArchitectureSpec {
        id: ArchId::Llama,
        display: "Llama / Llama-derivative",
        family: ArchFamily::Llama,
        tier: SupportTier::Secondary,
        context_range: (4_096, 131_072),
        min_vram_mb_per_b_params: 2_100,
        requires_benchmark: false,
        note: "Generic llama-family fallback. Covers Llama 2/3 and \
               derivatives via the quantized_llama GGUF path.",
    },
    ArchitectureSpec {
        id: ArchId::Mistral,
        display: "Mistral",
        family: ArchFamily::Mistral,
        tier: SupportTier::Secondary,
        context_range: (4_096, 32_768),
        min_vram_mb_per_b_params: 2_100,
        requires_benchmark: false,
        note: "Loaded via the llama fallback path with metadata \
               rewriting. Works for GGUF; safetensors not yet wired.",
    },
    ArchitectureSpec {
        id: ArchId::Gemma,
        display: "Gemma",
        family: ArchFamily::Gemma,
        tier: SupportTier::Secondary,
        context_range: (8_192, 8_192),
        min_vram_mb_per_b_params: 2_100,
        requires_benchmark: false,
        note: "GGUF only via llama fallback. Safetensors loader is \
               planned.",
    },
    ArchitectureSpec {
        id: ArchId::Gemma3Text,
        display: "Gemma 3 Text Encoder",
        family: ArchFamily::Gemma,
        tier: SupportTier::Primary,
        context_range: (2_048, 8_192),
        min_vram_mb_per_b_params: 800,
        requires_benchmark: false,
        note: "Sentence-transformer embedder (LM head stripped). Used by \
               Microsoft Harrier 270m. Loaded via Candle with mean-pooled \
               last hidden state.",
    },
];

/// Classify a `HuggingFace` `config.json` into a canonical [`ArchId`].
///
/// Primary signal is the `architectures[0]` class name (case-sensitive,
/// matches the HF convention). Secondary signal is the lower-case
/// `model_type` field, used to disambiguate cases where
/// `architectures[0]` is ambiguous — notably Qwen 2.5 vs Qwen 2, which
/// share `Qwen2ForCausalLM`.
///
/// Returns `None` for architectures the registry doesn't know. The
/// caller should surface this as [`crate::registry::LoadError::UnknownArchitecture`].
///
/// # Arguments
///
/// - `arch_raw`   — `config.json["architectures"][0]` as a string.
///   Pass an empty string if the field is missing.
/// - `model_type` — optional `config.json["model_type"]` fallback.
///
/// # Examples
///
/// ```
/// use model_loader::registry::{classify_arch_from_hf_config, ArchId};
///
/// assert_eq!(
///     classify_arch_from_hf_config("Qwen3ForCausalLM", Some("qwen3")),
///     Some(ArchId::Qwen3)
/// );
/// assert_eq!(
///     classify_arch_from_hf_config("Qwen3MoeForCausalLM", None),
///     Some(ArchId::Qwen3Moe)
/// );
/// assert_eq!(
///     classify_arch_from_hf_config("Phi3ForCausalLM", Some("phi3")),
///     Some(ArchId::Phi3)
/// );
/// assert_eq!(
///     classify_arch_from_hf_config("Qwen2ForCausalLM", Some("qwen2.5")),
///     Some(ArchId::Qwen25)
/// );
/// assert_eq!(
///     classify_arch_from_hf_config("", Some("llama")),
///     Some(ArchId::Llama)
/// );
/// assert_eq!(classify_arch_from_hf_config("MysteryArch", None), None);
/// ```
#[must_use]
pub fn classify_arch_from_hf_config(arch_raw: &str, model_type: Option<&str>) -> Option<ArchId> {
    // Primary: architectures[0]
    if arch_raw.starts_with("Qwen3Moe") || arch_raw.contains("Qwen3MoeForCausalLM") {
        return Some(ArchId::Qwen3Moe);
    }
    if arch_raw.contains("Qwen3Vl") || arch_raw.contains("Qwen3VLForCausalLM") {
        return Some(ArchId::Qwen3Vl);
    }
    if arch_raw.starts_with("Qwen3") {
        return Some(ArchId::Qwen3);
    }
    // Phi-4 multimodal and Phi-4 vision must match before the generic
    // Phi3/Phi4 fallback because both arch strings start with "Phi4".
    if arch_raw.contains("Phi4MM")
        || arch_raw.contains("Phi4Mm")
        || arch_raw.contains("phi4mm")
    {
        return Some(ArchId::Phi4Mm);
    }
    if arch_raw.contains("Phi4Siglip")
        || arch_raw.contains("phi4-siglip")
        || arch_raw.contains("phi4_siglip")
    {
        return Some(ArchId::Phi4Vision);
    }
    if arch_raw.starts_with("Phi3") || arch_raw.starts_with("Phi4") {
        return Some(ArchId::Phi3);
    }
    // Gemma 3 text encoder (Harrier-270m). Must match before the generic
    // Gemma fallback because its arch string starts with "Gemma3".
    if arch_raw.starts_with("Gemma3") {
        return Some(ArchId::Gemma3Text);
    }
    if arch_raw.starts_with("Qwen2") {
        // Qwen2.5 shares `Qwen2ForCausalLM` with Qwen2 — disambiguate
        // via model_type. Production HF repos set model_type = "qwen2.5"
        // for the 2.5 family.
        if model_type == Some("qwen2.5") {
            return Some(ArchId::Qwen25);
        }
        return Some(ArchId::Qwen2);
    }
    if arch_raw.starts_with("Llama") {
        return Some(ArchId::Llama);
    }
    if arch_raw.starts_with("Mistral") {
        return Some(ArchId::Mistral);
    }
    if arch_raw.starts_with("Gemma") {
        return Some(ArchId::Gemma);
    }

    // Fallback: model_type
    match model_type? {
        "qwen3_moe" => Some(ArchId::Qwen3Moe),
        "qwen3" => Some(ArchId::Qwen3),
        "qwen3_vl" => Some(ArchId::Qwen3Vl),
        "phi4_mm" | "phi4mm" => Some(ArchId::Phi4Mm),
        "phi4-siglip" | "phi4_siglip" => Some(ArchId::Phi4Vision),
        "phi3" | "phi4" => Some(ArchId::Phi3),
        "qwen2.5" => Some(ArchId::Qwen25),
        "qwen2" | "qwen2_moe" => Some(ArchId::Qwen2),
        "llama" => Some(ArchId::Llama),
        "mistral" => Some(ArchId::Mistral),
        "gemma3_text" | "gemma3text" => Some(ArchId::Gemma3Text),
        "gemma" | "gemma2" => Some(ArchId::Gemma),
        _ => None,
    }
}

/// Classify a GGUF `general.architecture` field into a canonical
/// [`ArchId`]. Mirrors [`classify_arch_from_hf_config`] but accepts
/// the lower-case arch naming convention used by llama.cpp / GGUF.
///
/// Returns `None` for architectures the registry doesn't know.
///
/// # Examples
///
/// ```
/// use model_loader::registry::{classify_arch_from_gguf, ArchId};
///
/// assert_eq!(classify_arch_from_gguf("qwen3"), Some(ArchId::Qwen3));
/// assert_eq!(classify_arch_from_gguf("phi3"), Some(ArchId::Phi3));
/// assert_eq!(classify_arch_from_gguf("qwen2"), Some(ArchId::Qwen2));
/// assert_eq!(classify_arch_from_gguf("llama"), Some(ArchId::Llama));
/// assert_eq!(classify_arch_from_gguf("mystery"), None);
/// ```
#[must_use]
pub fn classify_arch_from_gguf(arch_raw: &str) -> Option<ArchId> {
    match arch_raw {
        "qwen3" => Some(ArchId::Qwen3),
        "qwen3_moe" | "qwen3moe" => Some(ArchId::Qwen3Moe),
        "qwen3_vl" | "qwen3vl" => Some(ArchId::Qwen3Vl),
        "phi4_mm" | "phi4mm" => Some(ArchId::Phi4Mm),
        "phi4-siglip" | "phi4_siglip" => Some(ArchId::Phi4Vision),
        "phi3" | "phi4" => Some(ArchId::Phi3),
        "phi3_moe" | "phi3moe" => Some(ArchId::Phi3Moe),
        "qwen2.5" => Some(ArchId::Qwen25),
        "qwen2" | "qwen2_moe" | "qwen2moe" => Some(ArchId::Qwen2),
        "llama" => Some(ArchId::Llama),
        "mistral" => Some(ArchId::Mistral),
        "gemma3_text" | "gemma3text" => Some(ArchId::Gemma3Text),
        "gemma" | "gemma2" => Some(ArchId::Gemma),
        _ => None,
    }
}

/// Legacy alias retained during the migration. Prefer
/// [`classify_arch_from_hf_config`] in new code. This name will be
/// removed once no consumers reference it.
#[must_use]
#[deprecated(
    since = "0.9.0",
    note = "renamed to classify_arch_from_hf_config; also see classify_arch_from_gguf for the GGUF path"
)]
pub fn classify_safetensors_arch(arch_raw: &str, model_type: Option<&str>) -> Option<ArchId> {
    classify_arch_from_hf_config(arch_raw, model_type)
}

/// Look up an architecture spec by id. Returns `None` for unknown ids.
///
/// # Examples
///
/// ```
/// use model_loader::registry::{architectures::get, ArchId, SupportTier};
///
/// let qwen3 = get(ArchId::Qwen3).expect("Qwen3 must be in the registry");
/// assert_eq!(qwen3.tier, SupportTier::Primary);
/// assert_eq!(qwen3.display, "Qwen 3");
/// ```
#[must_use]
pub fn get(id: ArchId) -> Option<&'static ArchitectureSpec> {
    ALL.iter().find(|spec| spec.id == id)
}

// ── Tests ─────────────────────────────────────────────────────────

#[cfg(test)]
#[allow(clippy::unwrap_used)] // tests panic on registry-lookup misses by design
mod tests {
    use super::*;

    // ── HF config classifier ───────────────────────────────────────

    #[test]
    fn hf_classifies_qwen3_from_architectures() {
        assert_eq!(
            classify_arch_from_hf_config("Qwen3ForCausalLM", Some("qwen3")),
            Some(ArchId::Qwen3)
        );
    }

    #[test]
    fn hf_classifies_qwen3_moe_before_qwen3() {
        // Qwen3Moe* must win — order matters because "Qwen3Moe..."
        // also starts with "Qwen3".
        assert_eq!(
            classify_arch_from_hf_config("Qwen3MoeForCausalLM", None),
            Some(ArchId::Qwen3Moe)
        );
    }

    #[test]
    fn hf_classifies_qwen3_vl() {
        assert_eq!(
            classify_arch_from_hf_config("Qwen3VLForCausalLM", None),
            Some(ArchId::Qwen3Vl)
        );
    }

    #[test]
    fn hf_classifies_phi3() {
        assert_eq!(
            classify_arch_from_hf_config("Phi3ForCausalLM", None),
            Some(ArchId::Phi3)
        );
    }

    #[test]
    fn hf_disambiguates_qwen25_from_qwen2_via_model_type() {
        // Both use `Qwen2ForCausalLM`; the model_type field decides.
        assert_eq!(
            classify_arch_from_hf_config("Qwen2ForCausalLM", Some("qwen2.5")),
            Some(ArchId::Qwen25)
        );
        assert_eq!(
            classify_arch_from_hf_config("Qwen2ForCausalLM", Some("qwen2")),
            Some(ArchId::Qwen2)
        );
        assert_eq!(
            classify_arch_from_hf_config("Qwen2ForCausalLM", None),
            Some(ArchId::Qwen2)
        );
    }

    #[test]
    fn hf_falls_back_to_model_type_when_architectures_missing() {
        assert_eq!(
            classify_arch_from_hf_config("", Some("llama")),
            Some(ArchId::Llama)
        );
        assert_eq!(
            classify_arch_from_hf_config("", Some("gemma2")),
            Some(ArchId::Gemma)
        );
    }

    #[test]
    fn hf_returns_none_for_unknown_arch() {
        assert_eq!(classify_arch_from_hf_config("MysteryArch", None), None);
        assert_eq!(classify_arch_from_hf_config("", None), None);
        assert_eq!(
            classify_arch_from_hf_config("", Some("some_future_arch")),
            None
        );
    }

    // ── GGUF classifier ────────────────────────────────────────────

    #[test]
    fn gguf_classifies_qwen3_variants() {
        assert_eq!(classify_arch_from_gguf("qwen3"), Some(ArchId::Qwen3));
        assert_eq!(classify_arch_from_gguf("qwen3_moe"), Some(ArchId::Qwen3Moe));
        assert_eq!(classify_arch_from_gguf("qwen3moe"), Some(ArchId::Qwen3Moe));
    }

    #[test]
    fn gguf_classifies_phi3() {
        assert_eq!(classify_arch_from_gguf("phi3"), Some(ArchId::Phi3));
        assert_eq!(classify_arch_from_gguf("phi3_moe"), Some(ArchId::Phi3Moe));
    }

    #[test]
    fn gguf_returns_none_for_unknown() {
        assert_eq!(classify_arch_from_gguf("mystery_arch"), None);
        assert_eq!(classify_arch_from_gguf(""), None);
    }

    // ── Registry integrity ─────────────────────────────────────────

    #[test]
    fn registry_has_every_archid_variant() {
        // Every ArchId variant must have a corresponding row in ALL.
        // Catches someone adding a new variant without registering it.
        let ids = [
            ArchId::Qwen3,
            ArchId::Qwen3Moe,
            ArchId::Qwen3Vl,
            ArchId::Qwen35,
            ArchId::Qwen25,
            ArchId::Qwen2,
            ArchId::Phi3,
            ArchId::Phi3Moe,
            ArchId::Phi4Vision,
            ArchId::Phi4Mm,
            ArchId::Llama,
            ArchId::Mistral,
            ArchId::Gemma,
            ArchId::Gemma3Text,
        ];
        for id in ids {
            assert!(
                get(id).is_some(),
                "ArchId variant {id:?} has no row in architectures::ALL"
            );
        }
    }

    #[test]
    fn hf_classifies_phi4_mm_before_phi4_fallback() {
        // Phi4MM* must win — it also starts with "Phi4" so order matters.
        assert_eq!(
            classify_arch_from_hf_config("Phi4MMForCausalLM", None),
            Some(ArchId::Phi4Mm)
        );
        assert_eq!(
            classify_arch_from_hf_config("", Some("phi4mm")),
            Some(ArchId::Phi4Mm)
        );
    }

    #[test]
    fn hf_classifies_phi4_siglip_before_phi4_fallback() {
        assert_eq!(
            classify_arch_from_hf_config("Phi4SiglipForCausalLM", None),
            Some(ArchId::Phi4Vision)
        );
        assert_eq!(
            classify_arch_from_hf_config("", Some("phi4-siglip")),
            Some(ArchId::Phi4Vision)
        );
    }

    #[test]
    fn hf_phi4_base_still_routes_to_phi3_loader() {
        // Phi-4 / Phi-4-reasoning / Phi-4-reasoning-plus all ship as
        // `phi3` arch under the hood — the classifier collapses them
        // into Phi3 because the loader path is identical.
        assert_eq!(
            classify_arch_from_hf_config("Phi4ForCausalLM", None),
            Some(ArchId::Phi3)
        );
        assert_eq!(
            classify_arch_from_hf_config("", Some("phi4")),
            Some(ArchId::Phi3)
        );
    }

    #[test]
    fn hf_classifies_gemma3_text_before_gemma_fallback() {
        assert_eq!(
            classify_arch_from_hf_config("Gemma3TextModel", None),
            Some(ArchId::Gemma3Text)
        );
        assert_eq!(
            classify_arch_from_hf_config("", Some("gemma3_text")),
            Some(ArchId::Gemma3Text)
        );
        // Plain Gemma must still route to ArchId::Gemma.
        assert_eq!(
            classify_arch_from_hf_config("GemmaForCausalLM", None),
            Some(ArchId::Gemma)
        );
    }

    #[test]
    fn gguf_classifies_phi4_variants() {
        assert_eq!(classify_arch_from_gguf("phi4mm"), Some(ArchId::Phi4Mm));
        assert_eq!(classify_arch_from_gguf("phi4_mm"), Some(ArchId::Phi4Mm));
        assert_eq!(
            classify_arch_from_gguf("phi4-siglip"),
            Some(ArchId::Phi4Vision)
        );
        assert_eq!(classify_arch_from_gguf("phi4"), Some(ArchId::Phi3));
    }

    #[test]
    fn gguf_classifies_gemma3_text() {
        assert_eq!(
            classify_arch_from_gguf("gemma3_text"),
            Some(ArchId::Gemma3Text)
        );
        // Plain gemma still goes to the generic Gemma row.
        assert_eq!(classify_arch_from_gguf("gemma"), Some(ArchId::Gemma));
        assert_eq!(classify_arch_from_gguf("gemma2"), Some(ArchId::Gemma));
    }

    #[test]
    fn registry_primary_tier_includes_qwen3_and_phi3() {
        let primary_ids: Vec<_> = ALL
            .iter()
            .filter(|s| s.tier == SupportTier::Primary)
            .map(|s| s.id)
            .collect();
        assert!(primary_ids.contains(&ArchId::Qwen3));
        assert!(primary_ids.contains(&ArchId::Qwen3Moe));
        assert!(primary_ids.contains(&ArchId::Phi3));
        assert!(primary_ids.contains(&ArchId::Phi3Moe));
    }

    #[test]
    fn registry_qwen2_is_legacy() {
        let qwen2 = get(ArchId::Qwen2).unwrap();
        assert_eq!(qwen2.tier, SupportTier::Legacy);
    }

    #[test]
    fn registry_qwen35_is_planned() {
        let qwen35 = get(ArchId::Qwen35).unwrap();
        assert_eq!(qwen35.tier, SupportTier::Planned);
    }

    #[test]
    fn registry_phi3_moe_requires_benchmark() {
        let phi3_moe = get(ArchId::Phi3Moe).unwrap();
        assert!(
            phi3_moe.requires_benchmark,
            "Phi-3 MoE must be flagged for benchmark — it's the evaluation target"
        );
    }
}
