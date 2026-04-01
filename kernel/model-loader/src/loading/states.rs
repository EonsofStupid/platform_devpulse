//! Loading state machine — tracks model lifecycle per slot.

use serde::{Deserialize, Serialize};

/// Memory footprint of a loaded model.
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct MemoryFootprint {
    /// RAM consumed in bytes.
    pub ram_bytes: u64,
    /// VRAM consumed in bytes (0 if CPU-only).
    pub vram_bytes: u64,
}

impl MemoryFootprint {
    /// RAM in megabytes.
    #[must_use]
    pub fn ram_mb(&self) -> u64 {
        self.ram_bytes / (1024 * 1024)
    }

    /// VRAM in megabytes.
    #[must_use]
    pub fn vram_mb(&self) -> u64 {
        self.vram_bytes / (1024 * 1024)
    }
}

/// Parameters for loading a model.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct LoadParams {
    /// Target device (`"cpu"`, `"cuda:0"`, etc.).
    pub device: String,
    /// Context length to allocate (may be less than model max).
    pub context_length: usize,
    /// Number of GPU layers (for partial offload). `None` = all layers on device.
    pub gpu_layers: Option<u32>,
}

/// Lifecycle state of a model in a slot.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum ModelStatus {
    /// No model loaded. Ready to accept a load request.
    NotLoaded,
    /// Model is being loaded. Progress tracked by stage.
    Loading {
        /// Current loading stage (verifying, allocating, weights, tokenizer, warmup).
        stage: LoadingStage,
        /// Progress percentage (0.0–100.0).
        progress_pct: f32,
    },
    /// Model is loaded and available for inference.
    Loaded {
        /// Memory consumed by the loaded model.
        footprint: MemoryFootprint,
    },
    /// Model load failed. Error preserved for display.
    Failed {
        /// Human-readable error description.
        error: String,
    },
    /// Model is being unloaded. VRAM/RAM being freed.
    Unloading,
}

/// Granular loading stages — visible in UI progress bars.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum LoadingStage {
    /// Checking file integrity and parsing header metadata.
    Verifying,
    /// Reserving VRAM/RAM, checking budget fit.
    Allocating,
    /// Reading and loading model weight tensors.
    LoadingWeights,
    /// Loading the tokenizer (from GGUF metadata or separate file).
    LoadingTokenizer,
    /// Optional warmup forward pass to fill caches.
    WarmingUp,
    /// Model is ready for inference.
    Ready,
}

/// Combined slot status for UI display.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct SlotStatus {
    /// The slot this status belongs to.
    pub slot_id: String,
    /// Current model lifecycle state.
    pub model_status: ModelStatus,
    /// If this slot is using a fallback (resolved slot ID).
    pub active_fallback: Option<String>,
    /// IDs of other slots sharing the same loaded model instance.
    pub shared_with: Vec<String>,
}

impl std::fmt::Display for LoadingStage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Verifying => write!(f, "Verifying"),
            Self::Allocating => write!(f, "Allocating"),
            Self::LoadingWeights => write!(f, "Loading Weights"),
            Self::LoadingTokenizer => write!(f, "Loading Tokenizer"),
            Self::WarmingUp => write!(f, "Warming Up"),
            Self::Ready => write!(f, "Ready"),
        }
    }
}

impl Default for ModelStatus {
    fn default() -> Self {
        Self::NotLoaded
    }
}
