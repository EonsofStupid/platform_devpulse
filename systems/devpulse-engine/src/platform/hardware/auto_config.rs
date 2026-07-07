//! Auto-configuration engine — smart defaults based on detected hardware.
//!
//! `SSOT`: `scripts/docs/specs/MODEL-PRESETS-SSOT.md`
//!
//! 7 presets:
//!   1. Floor (8GB) — Static, Qwen3-VL-4B brain
//!   2. Mid `ActiveIdle` (12GB) — Qwen3.5-9B active / 4B idle
//!   3. Jesse Primary (16GB) — Static Phi-4-reasoning-vision-15B GGUF + Qwen3-TTS-0.6B clone, Claude turbo escalation
//!   4. High (24GB) — Static, Qwen3-30B-A3B + PersonaPlex-7B voice
//!   5. Ultra (40GB+) — Static, Qwen3-VL-30B-A3B + PersonaPlex-7B voice
//!   6. Floor (Minimal) — Static Qwen3-VL-4B, CPU-mostly
//!   7. `CpuOnly` — Static Qwen3-VL-4B, CPU everywhere
//!
//! Backend routing by file format:
//!   .gguf → llama.cpp FFI
//!   .safetensors → Candle (Qwen3-TTS via `qwen3-tts` crate; mistral.rs for multimodal LMs)
//!   .onnx → ORT (sherpa-rs for STT, kokoro for legacy TTS)
//!   .bin (GGML) → sherpa-rs

use crate::platform::hardware::metrics::HardwareMetrics;
// `HardwareTier` is the engine's canonical hardware class (relocated to
// `platform/hardware/tier.rs`). Auto-config reuses it rather than defining
// a parallel copy — the duplicate that lived here was deleted during the
// kernel-severance reconciliation.
use crate::platform::hardware::HardwareTier;
use crate::platform::model_loader::slots::types::DevicePreference;
use serde::{Deserialize, Serialize};

/// Brain swap policy — how the brain model changes based on user activity.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(specta::Type)]
pub enum BrainSwapPolicy {
    /// Single model always loaded. Default for 8GB and 24GB+.
    Static,
    /// Active conversation: `LARGE_LLM`. Idle 5min: swap to `SMALL_LLM`.
    ActiveIdle {
        /// Model loaded when user is actively chatting.
        active_model: String,
        /// Model loaded when user is idle (frees VRAM for minions/tools).
        idle_model: String,
        /// Seconds of inactivity before swapping to idle model.
        idle_after_secs: u64,
    },
    /// API provider handles brain — no local LLM for chat.brain.
    ApiEnhanced,
}

/// Complete auto-configuration plan for a hardware tier.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(specta::Type)]
pub struct AutoConfig {
    /// Detected hardware tier.
    pub tier: HardwareTier,
    /// Preset name for display.
    pub preset_name: String,
    /// Brain swap policy.
    pub brain_policy: BrainSwapPolicy,
    /// Per-slot model recommendations.
    pub recommendations: Vec<SlotRecommendation>,
    /// Total VRAM needed if all GPU recommendations are loaded.
    pub total_vram_needed_mb: u64,
    /// Total download size for models not yet on disk.
    pub total_download_size_mb: u64,
}

/// A single slot's recommended model.
///
/// `display_name` and `display_tagline` are the customer-facing label
/// strings for the wizard. Both are optional; the preset author sets
/// them, and absent values get a deterministic UI-side fallback derived
/// from `model_repo_id`. The fields exist HERE rather than in the
/// wizard's TS map so swapping models per tier in
/// `presets.default.toml` immediately surfaces the new label without any
/// frontend edit — matches the agnostic/format-driven architecture the
/// recommender already uses for file picks.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(specta::Type)]
pub struct SlotRecommendation {
    /// Target slot ID.
    pub slot_id: String,
    /// `HuggingFace` repository ID.
    pub model_repo_id: String,
    /// Which file to download from the repo.
    pub model_filename: String,
    /// Download size in MB.
    pub model_size_mb: u64,
    /// Estimated VRAM when loaded in MB.
    pub vram_estimate_mb: u64,
    /// Whether this model is already in the local registry.
    pub already_downloaded: bool,
    /// Recommended device for this slot.
    pub device: DevicePreference,
    /// Customer-facing label (e.g. "Nemotron Nano 8B"). Preset-owned;
    /// `None` falls through to a UI-side derivation from
    /// `model_repo_id` (last path segment, GGUF/Instruct cleanup).
    #[serde(default)]
    pub display_name: Option<String>,
    /// One-line layman tagline (e.g. "NVIDIA's reasoning-tuned model.
    /// Runs through llama.cpp."). Preset-owned; `None` falls through
    /// to a UI-side derivation from the file format + backend choice.
    #[serde(default)]
    pub display_tagline: Option<String>,
}

/// Detect hardware tier from metrics.
#[must_use]
pub fn detect_tier(metrics: &HardwareMetrics) -> HardwareTier {
    match metrics.gpu_vram_total_mb {
        Some(vram) if vram >= 40_000 => HardwareTier::Ultra,
        Some(vram) if vram >= 24_000 => HardwareTier::High,
        Some(vram) if vram >= 16_000 => HardwareTier::JessePrimary,
        Some(vram) if vram >= 10_000 => HardwareTier::Mid,
        Some(vram) if vram >= 8_000 => HardwareTier::Floor,
        Some(_) => HardwareTier::Minimal,
        None => HardwareTier::CpuOnly,
    }
}

/// Generate auto-configuration for the currently-detected hardware tier.
///
/// `metrics` — live hardware metrics used to compute the tier.
/// `downloaded_filenames` — set of filenames already in the local registry;
/// used to mark recommendations as `already_downloaded`.
/// `presets` — every preset the kernel knows about, typically pre-loaded at
/// boot via [`crate::platform::hardware::load_default_presets`] and cached in the
/// model loader service. If no preset exists for the detected tier, the
/// function returns an empty `AutoConfig` for that tier rather than
/// panicking — the caller can surface a warning in the UI.
#[must_use]
pub fn auto_configure<S: std::hash::BuildHasher>(
    metrics: &HardwareMetrics,
    downloaded_filenames: &std::collections::HashSet<String, S>,
    presets: &[crate::platform::hardware::presets::PresetBlueprint],
) -> AutoConfig {
    let tier = detect_tier(metrics);
    config_for_tier(tier, downloaded_filenames, presets)
}

/// Build an `AutoConfig` for any tier — regardless of the currently-detected
/// hardware. The wizard uses this to present every preset in a picker so the
/// owner can override the auto-detection (e.g. force API-only on a 24 GB box).
///
/// This is a pure function of `tier`, the download set, and the cached
/// preset catalog; it does not touch the live `HardwareMetrics`.
#[must_use]
pub fn config_for_tier<S: std::hash::BuildHasher>(
    tier: HardwareTier,
    downloaded_filenames: &std::collections::HashSet<String, S>,
    presets: &[crate::platform::hardware::presets::PresetBlueprint],
) -> AutoConfig {
    match presets.iter().find(|bp| bp.tier == tier).cloned() {
        Some(blueprint) => blueprint.into_auto_config(downloaded_filenames),
        None => AutoConfig {
            tier,
            preset_name: format!("{tier:?} — no preset defined"),
            brain_policy: BrainSwapPolicy::Static,
            recommendations: Vec::new(),
            total_vram_needed_mb: 0,
            total_download_size_mb: 0,
        },
    }
}

/// Materialise every preset into an [`AutoConfig`], in kernel display order.
/// Used by the wizard preset picker so the owner can switch off the
/// auto-detected default and pick any other tier manually.
#[must_use]
pub fn list_all_presets<S: std::hash::BuildHasher>(
    downloaded_filenames: &std::collections::HashSet<String, S>,
    presets: &[crate::platform::hardware::presets::PresetBlueprint],
) -> Vec<AutoConfig> {
    presets
        .iter()
        .cloned()
        .map(|bp| bp.into_auto_config(downloaded_filenames))
        .collect()
}

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::expect_used)] // tests panic on auto-config / preset failures by design
mod tests {
    use super::*;

    fn metrics_with_vram(vram_mb: Option<u64>) -> HardwareMetrics {
        HardwareMetrics {
            cpu_cores: 8,
            cpu_name: "Test CPU".to_string(),
            ram_total_mb: 32_000,
            ram_available_mb: 16_000,
            gpu_name: vram_mb.map(|_| "Test GPU".to_string()),
            gpu_vram_total_mb: vram_mb,
            gpu_vram_free_mb: vram_mb,
            ..Default::default()
        }
    }

    #[test]
    fn tier_ultra() {
        assert_eq!(
            detect_tier(&metrics_with_vram(Some(48_000))),
            HardwareTier::Ultra
        );
        assert_eq!(
            detect_tier(&metrics_with_vram(Some(40_000))),
            HardwareTier::Ultra
        );
    }

    #[test]
    fn tier_high() {
        assert_eq!(
            detect_tier(&metrics_with_vram(Some(24_000))),
            HardwareTier::High
        );
        // 32 GB still falls into High (under the 40 GB Ultra floor).
        assert_eq!(
            detect_tier(&metrics_with_vram(Some(32_000))),
            HardwareTier::High
        );
    }

    #[test]
    fn tier_jesse_primary() {
        assert_eq!(
            detect_tier(&metrics_with_vram(Some(16_000))),
            HardwareTier::JessePrimary
        );
    }

    #[test]
    fn tier_mid() {
        assert_eq!(
            detect_tier(&metrics_with_vram(Some(12_000))),
            HardwareTier::Mid
        );
    }

    #[test]
    fn tier_mid_10gb() {
        // RTX 3080 (10 GB) should get Mid, not Floor
        assert_eq!(
            detect_tier(&metrics_with_vram(Some(10_000))),
            HardwareTier::Mid
        );
        assert_eq!(
            detect_tier(&metrics_with_vram(Some(10_240))),
            HardwareTier::Mid
        );
    }

    #[test]
    fn tier_floor_8gb() {
        assert_eq!(
            detect_tier(&metrics_with_vram(Some(8_000))),
            HardwareTier::Floor
        );
    }

    #[test]
    fn tier_minimal() {
        assert_eq!(
            detect_tier(&metrics_with_vram(Some(4_000))),
            HardwareTier::Minimal
        );
    }

    #[test]
    fn tier_cpu_only() {
        assert_eq!(detect_tier(&metrics_with_vram(None)), HardwareTier::CpuOnly);
    }

    /// Load presets from the kernel SSOT TOML for every test that needs
    /// to exercise the auto-configure path. The embedded default is always
    /// present, so the `/nonexistent` userdata path is fine — it skips the
    /// user override branch and reads only the embedded catalog.
    fn load_presets() -> Vec<crate::platform::hardware::presets::PresetBlueprint> {
        crate::platform::hardware::presets::load_default_presets(std::path::Path::new("/nonexistent"))
            .expect("embedded presets.default.toml must load")
    }

    #[test]
    fn floor_preset_has_every_required_slot() {
        let hw = metrics_with_vram(Some(8_000));
        let dl = std::collections::HashSet::new();
        let presets = load_presets();
        let config = auto_configure(&hw, &dl, &presets);

        assert_eq!(config.tier, HardwareTier::Floor);
        assert_eq!(config.preset_name, "Floor (8GB)");
        // 5 tier-specific (chat.brain, minion.shared, voice.brain via
        // mistral.rs phi4mm, plus rag.embedder + rag.encoder overriding
        // the common.slots default with the smaller harrier-270m) + 8
        // common (rag.reranker, minion.embedder, minion.encoder,
        // vision.embedder, voice.stt, voice.tts, voice.wake,
        // chat.suggest — rag.embedder/rag.encoder are overridden so
        // excluded) = 13.
        assert_eq!(config.recommendations.len(), 13);

        let slots: Vec<&str> = config
            .recommendations
            .iter()
            .map(|r| r.slot_id.as_str())
            .collect();
        assert!(slots.contains(&"chat.brain"));
        assert!(slots.contains(&"minion.shared"));
        assert!(slots.contains(&"voice.brain"));
        assert!(slots.contains(&"rag.embedder"));
        assert!(slots.contains(&"rag.encoder"));
        assert!(slots.contains(&"rag.reranker"));
        assert!(slots.contains(&"vision.embedder"));
        assert!(slots.contains(&"voice.stt"));
        assert!(slots.contains(&"voice.wake"));
        assert!(slots.contains(&"voice.tts"));
    }

    #[test]
    fn mid_has_active_idle_policy() {
        let hw = metrics_with_vram(Some(12_000));
        let dl = std::collections::HashSet::new();
        let presets = load_presets();
        let config = auto_configure(&hw, &dl, &presets);

        assert_eq!(config.tier, HardwareTier::Mid);
        assert!(matches!(
            config.brain_policy,
            BrainSwapPolicy::ActiveIdle { .. }
        ));
    }

    #[test]
    fn floor_brain_is_4b_minimum() {
        let hw = metrics_with_vram(Some(8_000));
        let dl = std::collections::HashSet::new();
        let presets = load_presets();
        let config = auto_configure(&hw, &dl, &presets);

        let brain = config
            .recommendations
            .iter()
            .find(|r| r.slot_id == "chat.brain")
            .unwrap();
        assert!(
            brain.model_filename.contains("4B"),
            "Brain must be 4B minimum, got {}",
            brain.model_filename
        );
    }

    #[test]
    fn already_downloaded_reduces_download_size() {
        let hw = metrics_with_vram(Some(12_000));
        let mut dl = std::collections::HashSet::new();
        dl.insert("Qwen3.5-9B-Q4_K_M.gguf".to_string());
        let presets = load_presets();

        let config = auto_configure(&hw, &dl, &presets);

        let brain = config
            .recommendations
            .iter()
            .find(|r| r.slot_id == "chat.brain")
            .unwrap();
        assert!(brain.already_downloaded);
    }
}
