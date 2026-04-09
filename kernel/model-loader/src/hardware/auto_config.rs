//! Auto-configuration engine — smart defaults based on detected hardware.
//!
//! SSOT: `scripts/docs/specs/MODEL-PRESETS-SSOT.md`
//!
//! 7 presets:
//!   1. Floor (8GB) — Static, Qwen3-VL-4B brain
//!   2. Mid ActiveIdle (12GB) — Qwen3.5-9B active / 4B idle
//!   3. Jesse Primary (16GB) — Phi-4-reasoning-vision-15B active / 4B idle
//!   4. High (24GB) — Static, Qwen3-14B or Phi-4 15B
//!   5. Lab Ceiling (Multi-GPU) — Static, 27B+ brain
//!   6. Phi Slot Collapse (12GB+) — Test preset, Phi-4-multimodal collapses STT+vision
//!   7. API-Enhanced (Any VRAM) — Cloud brain, local preprocessing
//!
//! Backend routing by file format:
//!   .gguf → llama.cpp FFI
//!   .safetensors → Candle
//!   .onnx → ORT (sherpa-rs for STT, kokoro for TTS)
//!   .bin (GGML) → sherpa-rs

use crate::hardware::metrics::HardwareMetrics;
use crate::slots::types::DevicePreference;
use serde::{Deserialize, Serialize};

/// Hardware tier — maps to a default preset.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum HardwareTier {
    /// 24 GB+ VRAM — Preset 4 (High). Static, 14B+ brain.
    High,
    /// 16 GB VRAM — Preset 3 (Jesse Primary). ActiveIdle, 15B/4B swap.
    JessePrimary,
    /// 12 GB VRAM — Preset 2 (Mid). ActiveIdle, 9B/4B swap.
    Mid,
    /// 8 GB VRAM — Preset 1 (Floor). Static, 4B brain.
    Floor,
    /// < 8 GB or no GPU — Preset 7 (API-Enhanced) if API key, else Floor on CPU.
    Minimal,
    /// No GPU detected — CPU-only or API.
    CpuOnly,
}

/// Brain swap policy — how the brain model changes based on user activity.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum BrainSwapPolicy {
    /// Single model always loaded. Default for 8GB and 24GB+.
    Static,
    /// Active conversation: LARGE_LLM. Idle 5min: swap to SMALL_LLM.
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
#[cfg_attr(feature = "specta", derive(specta::Type))]
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
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct SlotRecommendation {
    /// Target slot ID.
    pub slot_id: String,
    /// HuggingFace repository ID.
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
}

/// Detect hardware tier from metrics.
#[must_use]
pub fn detect_tier(metrics: &HardwareMetrics) -> HardwareTier {
    match metrics.gpu_vram_total_mb {
        Some(vram) if vram >= 24_000 => HardwareTier::High,
        Some(vram) if vram >= 16_000 => HardwareTier::JessePrimary,
        Some(vram) if vram >= 12_000 => HardwareTier::Mid,
        Some(vram) if vram >= 8_000 => HardwareTier::Floor,
        Some(_) => HardwareTier::Minimal,
        None => HardwareTier::CpuOnly,
    }
}

/// Generate auto-configuration for a hardware tier.
///
/// `downloaded_filenames` — set of filenames already in the local registry.
/// Used to mark recommendations as `already_downloaded`.
pub fn auto_configure(
    metrics: &HardwareMetrics,
    downloaded_filenames: &std::collections::HashSet<String>,
) -> AutoConfig {
    let tier = detect_tier(metrics);
    let (preset_name, brain_policy, recs) = preset_for_tier(tier, downloaded_filenames);
    let total_vram = recs.iter().map(|r| r.vram_estimate_mb).sum();
    let total_download: u64 = recs
        .iter()
        .filter(|r| !r.already_downloaded)
        .map(|r| r.model_size_mb)
        .sum();

    AutoConfig {
        tier,
        preset_name,
        brain_policy,
        recommendations: recs,
        total_vram_needed_mb: total_vram,
        total_download_size_mb: total_download,
    }
}

/// Returns (preset_name, brain_policy, recommendations) for a tier.
fn preset_for_tier(
    tier: HardwareTier,
    dl: &std::collections::HashSet<String>,
) -> (String, BrainSwapPolicy, Vec<SlotRecommendation>) {
    let mut recs = Vec::new();

    let (name, policy) = match tier {
        // ── Preset 4: High (24GB+) — Static, 14B brain ──────────
        HardwareTier::High => {
            recs.push(rec("chat.brain", "bartowski/Qwen3-14B-GGUF", "Qwen3-14B-Q4_K_M.gguf", 8_100, 9_200, DevicePreference::Gpu, dl));
            recs.push(rec("minion.shared", "Qwen/Qwen3-0.6B-GGUF", "qwen3-0.6b-q8_0.gguf", 700, 400, DevicePreference::Gpu, dl));
            ("High (24GB)".into(), BrainSwapPolicy::Static)
        }

        // ── Preset 3: Jesse Primary (16GB) — ActiveIdle, Phi-4 15B / 4B ──
        HardwareTier::JessePrimary => {
            recs.push(rec("chat.brain", "microsoft/Phi-4-reasoning-vision-15B-GGUF", "Phi-4-reasoning-vision-15B-Q4_K_M.gguf", 9_500, 10_000, DevicePreference::Gpu, dl));
            recs.push(rec("minion.shared", "Qwen/Qwen3-0.6B-GGUF", "qwen3-0.6b-q4_k_m.gguf", 500, 350, DevicePreference::Gpu, dl));
            ("Jesse Primary (16GB)".into(), BrainSwapPolicy::ActiveIdle {
                active_model: "Phi-4-reasoning-vision-15B-Q4_K_M.gguf".into(),
                idle_model: "Qwen3-VL-4B-Q4_K_M.gguf".into(),
                idle_after_secs: 300,
            })
        }

        // ── Preset 2: Mid (12GB) — ActiveIdle, Qwen3.5-9B / 4B ──
        HardwareTier::Mid => {
            recs.push(rec("chat.brain", "bartowski/Qwen3.5-9B-GGUF", "Qwen3.5-9B-Q4_K_M.gguf", 5_300, 5_800, DevicePreference::Gpu, dl));
            recs.push(rec("minion.shared", "Qwen/Qwen3-0.6B-GGUF", "qwen3-0.6b-q4_k_m.gguf", 500, 350, DevicePreference::Gpu, dl));
            ("Mid ActiveIdle (12GB)".into(), BrainSwapPolicy::ActiveIdle {
                active_model: "Qwen3.5-9B-Q4_K_M.gguf".into(),
                idle_model: "Qwen3-VL-4B-Q4_K_M.gguf".into(),
                idle_after_secs: 300,
            })
        }

        // ── Preset 1: Floor (8GB) — Static, Qwen3-VL-4B ────────
        HardwareTier::Floor => {
            recs.push(rec("chat.brain", "bartowski/Qwen3-VL-4B-GGUF", "Qwen3-VL-4B-Q4_K_M.gguf", 2_600, 3_200, DevicePreference::Gpu, dl));
            recs.push(rec("minion.shared", "Qwen/Qwen3-0.6B-GGUF", "qwen3-0.6b-q4_k_m.gguf", 500, 350, DevicePreference::GpuWithCpuFallback, dl));
            ("Floor (8GB)".into(), BrainSwapPolicy::Static)
        }

        // ── Preset 1 on CPU or Preset 7 (API) ───────────────────
        HardwareTier::Minimal | HardwareTier::CpuOnly => {
            recs.push(rec("chat.brain", "bartowski/Qwen3-VL-4B-GGUF", "Qwen3-VL-4B-Q4_K_M.gguf", 2_600, 3_200, DevicePreference::Cpu, dl));
            recs.push(rec("minion.shared", "Qwen/Qwen3-0.6B-GGUF", "qwen3-0.6b-q4_k_m.gguf", 500, 350, DevicePreference::Cpu, dl));
            ("Floor — CPU Mode".into(), BrainSwapPolicy::Static)
        }
    };

    // ── Common slots — EVERY preset gets these ───────────────────
    // RAG: embedding + reranking
    recs.push(rec("rag.embedder", "Qwen/Qwen3-Embedding-0.6B", "model.safetensors", 420, 0, DevicePreference::Cpu, dl));
    recs.push(rec("rag.reranker", "Qwen/Qwen3-Reranker-0.6B", "model.safetensors", 420, 0, DevicePreference::Cpu, dl));

    // Vision
    recs.push(rec("vision.embedder", "google/siglip2-so400m-patch14-384", "model.safetensors", 390, 0, DevicePreference::Cpu, dl));

    // Voice: STT (Whisper via sherpa-rs) + TTS (Qwen3-TTS)
    recs.push(rec("voice.stt", "ggerganov/whisper.cpp", "ggml-small.bin", 466, 0, DevicePreference::Cpu, dl));
    recs.push(rec("voice.tts", "Qwen/Qwen3-TTS-0.6B", "model.safetensors", 600, 0, DevicePreference::Cpu, dl));

    (name, policy, recs)
}

fn rec(
    slot_id: &str,
    repo_id: &str,
    filename: &str,
    size_mb: u64,
    vram_mb: u64,
    device: DevicePreference,
    downloaded: &std::collections::HashSet<String>,
) -> SlotRecommendation {
    SlotRecommendation {
        slot_id: slot_id.to_string(),
        model_repo_id: repo_id.to_string(),
        model_filename: filename.to_string(),
        model_size_mb: size_mb,
        vram_estimate_mb: vram_mb,
        already_downloaded: downloaded.contains(filename),
        device,
    }
}

#[cfg(test)]
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
    fn tier_high() {
        assert_eq!(detect_tier(&metrics_with_vram(Some(24_000))), HardwareTier::High);
    }

    #[test]
    fn tier_jesse_primary() {
        assert_eq!(detect_tier(&metrics_with_vram(Some(16_000))), HardwareTier::JessePrimary);
    }

    #[test]
    fn tier_mid() {
        assert_eq!(detect_tier(&metrics_with_vram(Some(12_000))), HardwareTier::Mid);
    }

    #[test]
    fn tier_floor() {
        assert_eq!(detect_tier(&metrics_with_vram(Some(10_000))), HardwareTier::Floor);
    }

    #[test]
    fn tier_floor_8gb() {
        assert_eq!(detect_tier(&metrics_with_vram(Some(8_000))), HardwareTier::Floor);
    }

    #[test]
    fn tier_minimal() {
        assert_eq!(detect_tier(&metrics_with_vram(Some(4_000))), HardwareTier::Minimal);
    }

    #[test]
    fn tier_cpu_only() {
        assert_eq!(detect_tier(&metrics_with_vram(None)), HardwareTier::CpuOnly);
    }

    #[test]
    fn floor_has_all_9_slots() {
        let hw = metrics_with_vram(Some(8_000));
        let dl = std::collections::HashSet::new();
        let config = auto_configure(&hw, &dl);

        assert_eq!(config.tier, HardwareTier::Floor);
        assert_eq!(config.preset_name, "Floor (8GB)");
        assert_eq!(config.recommendations.len(), 9);

        // Verify all required slots present
        let slots: Vec<&str> = config.recommendations.iter().map(|r| r.slot_id.as_str()).collect();
        assert!(slots.contains(&"chat.brain"));
        assert!(slots.contains(&"minion.shared"));
        assert!(slots.contains(&"rag.embedder"));
        assert!(slots.contains(&"rag.reranker"));
        assert!(slots.contains(&"vision.embedder"));
        assert!(slots.contains(&"voice.stt"));
        assert!(slots.contains(&"voice.tts"));
    }

    #[test]
    fn mid_has_active_idle_policy() {
        let hw = metrics_with_vram(Some(12_000));
        let dl = std::collections::HashSet::new();
        let config = auto_configure(&hw, &dl);

        assert_eq!(config.tier, HardwareTier::Mid);
        assert!(matches!(config.brain_policy, BrainSwapPolicy::ActiveIdle { .. }));
    }

    #[test]
    fn floor_brain_is_4b_minimum() {
        let hw = metrics_with_vram(Some(8_000));
        let dl = std::collections::HashSet::new();
        let config = auto_configure(&hw, &dl);

        let brain = config.recommendations.iter().find(|r| r.slot_id == "chat.brain").unwrap();
        assert!(brain.model_filename.contains("4B"), "Brain must be 4B minimum, got {}", brain.model_filename);
    }

    #[test]
    fn already_downloaded_reduces_download_size() {
        let hw = metrics_with_vram(Some(12_000));
        let mut dl = std::collections::HashSet::new();
        dl.insert("Qwen3.5-9B-Q4_K_M.gguf".to_string());

        let config = auto_configure(&hw, &dl);

        let brain = config.recommendations.iter().find(|r| r.slot_id == "chat.brain").unwrap();
        assert!(brain.already_downloaded);
    }
}

impl std::fmt::Display for HardwareTier {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::High => write!(f, "High (24GB+ VRAM)"),
            Self::JessePrimary => write!(f, "Jesse Primary (16GB VRAM)"),
            Self::Mid => write!(f, "Mid (12GB VRAM)"),
            Self::Floor => write!(f, "Floor (8GB VRAM)"),
            Self::Minimal => write!(f, "Minimal (<8GB VRAM)"),
            Self::CpuOnly => write!(f, "CPU Only"),
        }
    }
}
