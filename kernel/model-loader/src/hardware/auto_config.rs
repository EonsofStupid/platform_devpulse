//! Auto-configuration engine — smart defaults based on detected hardware.
//!
//! The "Set me up" path: detect hardware → recommend models → one-click setup.
//! Zero user decisions required for the 90% case.

use crate::hardware::metrics::HardwareMetrics;
use crate::slots::types::DevicePreference;
use serde::{Deserialize, Serialize};

/// Hardware tier — determines which models to recommend.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HardwareTier {
    /// 16 GB+ VRAM — can run 14B models comfortably.
    High,
    /// 8–15 GB VRAM — 4B models with room for minions.
    Medium,
    /// 4–7 GB VRAM — small models only.
    Low,
    /// Less than 4 GB VRAM — shared brain/minion, minimal config.
    Minimal,
    /// No GPU detected — CPU-only operation.
    CpuOnly,
}

/// Complete auto-configuration plan for a hardware tier.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoConfig {
    /// Detected hardware tier.
    pub tier: HardwareTier,
    /// Per-slot model recommendations.
    pub recommendations: Vec<SlotRecommendation>,
    /// Total VRAM needed if all recommendations are loaded.
    pub total_vram_needed_mb: u64,
    /// Total download size for models not yet on disk.
    pub total_download_size_mb: u64,
}

/// A single slot's recommended model.
#[derive(Debug, Clone, Serialize, Deserialize)]
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
        Some(vram) if vram >= 16_000 => HardwareTier::High,
        Some(vram) if vram >= 8_000 => HardwareTier::Medium,
        Some(vram) if vram >= 4_000 => HardwareTier::Low,
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
    let recs = recommendations_for_tier(tier, downloaded_filenames);
    let total_vram = recs.iter().map(|r| r.vram_estimate_mb).sum();
    let total_download: u64 = recs
        .iter()
        .filter(|r| !r.already_downloaded)
        .map(|r| r.model_size_mb)
        .sum();

    AutoConfig {
        tier,
        recommendations: recs,
        total_vram_needed_mb: total_vram,
        total_download_size_mb: total_download,
    }
}

/// Hardcoded recommendation table. Updatable later via config or remote manifest.
fn recommendations_for_tier(
    tier: HardwareTier,
    downloaded: &std::collections::HashSet<String>,
) -> Vec<SlotRecommendation> {
    match tier {
        HardwareTier::High => vec![
            rec("chat.brain", "bartowski/Qwen3-14B-GGUF", "Qwen3-14B-Q4_K_M.gguf", 8_100, 9_200, DevicePreference::Gpu, downloaded),
            rec("minion.shared", "Qwen/Qwen3-0.6B-GGUF", "qwen3-0.6b-q8_0.gguf", 700, 400, DevicePreference::GpuWithCpuFallback, downloaded),
            rec("rag.embedder", "nomic-ai/nomic-embed-text-v1.5-GGUF", "nomic-embed-text-v1.5.Q8_0.gguf", 300, 300, DevicePreference::Cpu, downloaded),
        ],
        HardwareTier::Medium => vec![
            rec("chat.brain", "bartowski/Qwen3-4B-GGUF", "Qwen3-4B-Q4_K_M.gguf", 2_600, 3_200, DevicePreference::Gpu, downloaded),
            rec("minion.shared", "Qwen/Qwen3-0.6B-GGUF", "qwen3-0.6b-q4_k_m.gguf", 500, 350, DevicePreference::GpuWithCpuFallback, downloaded),
            rec("rag.embedder", "nomic-ai/nomic-embed-text-v1.5-GGUF", "nomic-embed-text-v1.5.Q8_0.gguf", 300, 300, DevicePreference::Cpu, downloaded),
        ],
        HardwareTier::Low => vec![
            rec("chat.brain", "bartowski/Qwen3-1.7B-GGUF", "Qwen3-1.7B-Q4_K_M.gguf", 1_200, 1_500, DevicePreference::Gpu, downloaded),
            rec("minion.shared", "Qwen/Qwen3-0.6B-GGUF", "qwen3-0.6b-q4_k_m.gguf", 500, 350, DevicePreference::GpuWithCpuFallback, downloaded),
            rec("rag.embedder", "nomic-ai/nomic-embed-text-v1.5-GGUF", "nomic-embed-text-v1.5.Q8_0.gguf", 300, 300, DevicePreference::Cpu, downloaded),
        ],
        HardwareTier::Minimal | HardwareTier::CpuOnly => vec![
            rec("chat.brain", "Qwen/Qwen3-0.6B-GGUF", "qwen3-0.6b-q4_k_m.gguf", 500, 350, DevicePreference::Cpu, downloaded),
            // minion.shared points to same model as brain (handled by shared instance logic)
            rec("rag.embedder", "nomic-ai/nomic-embed-text-v1.5-GGUF", "nomic-embed-text-v1.5.Q8_0.gguf", 300, 300, DevicePreference::Cpu, downloaded),
        ],
    }
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

impl std::fmt::Display for HardwareTier {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::High => write!(f, "High (16GB+ VRAM)"),
            Self::Medium => write!(f, "Medium (8-15GB VRAM)"),
            Self::Low => write!(f, "Low (4-7GB VRAM)"),
            Self::Minimal => write!(f, "Minimal (<4GB VRAM)"),
            Self::CpuOnly => write!(f, "CPU Only"),
        }
    }
}
