//! Loading state machine — tracks model lifecycle per slot.
//!
//! # State Transitions
//!
//! ```text
//! COLD ──load_to_ram──► WARM ──transfer_to_gpu──► LOADED ──prime──► PRIMED ──infer──► ACTIVE
//!  │                      │                          │                │                  │
//!  ▼                      ▼                          ▼                ▼                  ▼
//! 3-10s                50-500ms                   20-50ms          5-10ms            Immediate
//! ```
//!
//! **Key insight**: `Loaded` means weights are in VRAM, but first inference is still slow.
//! `Primed` means KV cache is allocated AND a dummy forward pass has warmed GPU caches.
//! Only `Primed` models deliver instant first-token latency.

use serde::{Deserialize, Serialize};

/// Memory footprint of a loaded model.
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
#[derive(specta::Type)]
pub struct MemoryFootprint {
    /// RAM consumed in bytes (e.g., mmap'd weights before GPU transfer).
    pub ram_bytes: u64,
    /// VRAM consumed in bytes (0 if CPU-only).
    pub vram_bytes: u64,
    /// KV cache allocation in bytes (separate from model weights).
    pub kv_cache_bytes: u64,
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

    /// KV cache in megabytes.
    #[must_use]
    pub fn kv_cache_mb(&self) -> u64 {
        self.kv_cache_bytes / (1024 * 1024)
    }

    /// Total GPU memory (weights + KV cache).
    #[must_use]
    pub fn total_gpu_mb(&self) -> u64 {
        self.vram_mb() + self.kv_cache_mb()
    }
}

/// Parameters for loading a model.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(specta::Type)]
pub struct LoadParams {
    /// Target device (`"cpu"`, `"cuda:0"`, etc.).
    pub device: String,
    /// Context length to allocate (may be less than model max).
    pub context_length: usize,
    /// Number of GPU layers (for partial offload). `None` = all layers on device.
    pub gpu_layers: Option<u32>,
    /// Whether to run priming pass after loading.
    pub auto_prime: bool,
    /// Optional backend variant hint, consumed by the per-capability
    /// dispatcher (e.g. `"siglip2-ort"` for the HD vision path,
    /// `None` for each capability's default).
    pub backend_variant: Option<String>,
}

impl Default for LoadParams {
    fn default() -> Self {
        Self {
            device: "cuda:0".to_string(),
            context_length: 4096,
            gpu_layers: None,
            auto_prime: true,
            backend_variant: None,
        }
    }
}

/// Priming configuration — controls warmup behavior.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(specta::Type)]
pub struct PrimingConfig {
    /// Sequence length for dummy forward pass.
    pub warmup_seq_len: usize,
    /// Number of warmup iterations (more = better cache warming).
    pub warmup_iterations: usize,
    /// Whether to capture CUDA graphs for fixed-size inference.
    pub capture_cuda_graphs: bool,
    /// Batch sizes to capture graphs for (if `capture_cuda_graphs` is true).
    pub cuda_graph_batch_sizes: Vec<usize>,
}

impl Default for PrimingConfig {
    fn default() -> Self {
        Self {
            warmup_seq_len: 16,
            warmup_iterations: 2,
            capture_cuda_graphs: false,
            cuda_graph_batch_sizes: vec![1],
        }
    }
}

/// Lifecycle state of a model in a slot.
///
/// # State Machine
///
/// ```text
/// NotLoaded → Loading → Warm → Loaded → Primed ↔ Active
///                ↓         ↓       ↓        ↓
///              Failed   Failed  Failed   Failed
/// ```
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[derive(specta::Type)]
pub enum ModelStatus {
    /// No model loaded. Ready to accept a load request.
    /// Latency to inference: 3-10 seconds (full load + prime).
    #[default]
    NotLoaded,

    /// Model is being loaded. Progress tracked by stage.
    Loading {
        /// Current loading stage.
        stage: LoadingStage,
        /// Progress percentage (0.0–100.0).
        progress_pct: f32,
    },

    /// Weights loaded in RAM but not on GPU.
    /// Use `activate_slot()` to promote to Loaded.
    /// Latency to inference: 50-500ms (GPU transfer + prime).
    Warm {
        /// Memory consumed (RAM only, `vram_bytes` = 0).
        footprint: MemoryFootprint,
    },

    /// Weights transferred to GPU, but NOT primed.
    /// First inference will be slow (~50-200ms) due to:
    /// - KV cache allocation
    /// - CUDA kernel JIT compilation
    /// - GPU cache line population
    ///
    /// Latency to inference: 20-50ms.
    Loaded {
        /// Memory consumed (`vram_bytes` = model weights).
        footprint: MemoryFootprint,
    },

    /// **Fully ready for instant inference.**
    /// - Weights in VRAM ✓
    /// - KV cache pre-allocated ✓
    /// - Dummy forward pass completed ✓
    /// - GPU caches warm ✓
    /// - (Optional) CUDA graphs captured ✓
    ///
    /// Latency to first token: 5-10ms.
    Primed {
        /// Memory consumed (includes KV cache).
        footprint: MemoryFootprint,
        /// Max KV cache entries allocated.
        kv_cache_capacity: usize,
        /// Whether CUDA graphs were captured.
        cuda_graphs_ready: bool,
    },

    /// Actively processing inference request(s).
    /// Transitions back to Primed when requests complete.
    Active {
        /// Memory consumed.
        footprint: MemoryFootprint,
        /// Number of concurrent inference requests.
        active_requests: usize,
        /// Tokens generated in current batch.
        tokens_generated: u64,
    },

    /// Model load or prime failed. Error preserved for display.
    Failed {
        /// Human-readable error description.
        error: String,
        /// Which stage failed.
        failed_at: LoadingStage,
    },

    /// Model is being unloaded. VRAM/RAM being freed.
    Unloading,
}

/// Granular loading stages — visible in UI progress bars.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[derive(specta::Type)]
pub enum LoadingStage {
    /// Checking file integrity and parsing header metadata.
    Verifying,
    /// Reserving VRAM/RAM, checking budget fit.
    Allocating,
    /// Reading and loading model weight tensors.
    LoadingWeights,
    /// Loading the tokenizer (from GGUF metadata or separate file).
    LoadingTokenizer,
    /// Transferring weights from RAM to GPU.
    TransferringToGpu,
    /// Allocating KV cache.
    AllocatingKvCache,
    /// Running dummy forward pass to warm GPU caches.
    Priming,
    /// Capturing CUDA graphs (optional optimization).
    CapturingCudaGraphs,
    /// Model is ready for inference.
    Ready,
}

/// Combined slot status for UI display.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(specta::Type)]
pub struct SlotStatus {
    /// The slot this status belongs to.
    pub slot_id: String,
    /// Current model lifecycle state.
    pub model_status: ModelStatus,
    /// If this slot is using a fallback (resolved slot ID).
    pub active_fallback: Option<String>,
    /// IDs of other slots sharing the same loaded model instance.
    pub shared_with: Vec<String>,
    /// Latency of last inference (for monitoring).
    pub last_inference_ms: Option<f32>,
    /// Average tokens per second (for monitoring).
    pub avg_tokens_per_sec: Option<f32>,
}

impl SlotStatus {
    /// Is this slot ready for instant inference?
    #[must_use]
    pub fn is_instant_ready(&self) -> bool {
        matches!(
            self.model_status,
            ModelStatus::Primed { .. } | ModelStatus::Active { .. }
        )
    }

    /// Is this slot loaded but not primed (first inference will be slow)?
    #[must_use]
    pub fn is_loaded_not_primed(&self) -> bool {
        matches!(self.model_status, ModelStatus::Loaded { .. })
    }

    /// Estimated latency to first token based on current state.
    #[must_use]
    pub fn estimated_latency_ms(&self) -> u32 {
        match &self.model_status {
            ModelStatus::NotLoaded => 5000,      // Full load
            ModelStatus::Loading { .. } => 3000, // Still loading
            ModelStatus::Warm { .. } => 300,     // GPU transfer + prime
            ModelStatus::Loaded { .. } => 50,    // Just prime
            ModelStatus::Primed { .. } => 10,    // Instant
            ModelStatus::Active { .. } => 5,     // Already running
            // Failed and Unloading are both terminal-from-inference's-POV.
            ModelStatus::Failed { .. } | ModelStatus::Unloading => u32::MAX,
        }
    }
}

impl std::fmt::Display for LoadingStage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Verifying => write!(f, "Verifying"),
            Self::Allocating => write!(f, "Allocating"),
            Self::LoadingWeights => write!(f, "Loading Weights"),
            Self::LoadingTokenizer => write!(f, "Loading Tokenizer"),
            Self::TransferringToGpu => write!(f, "Transferring to GPU"),
            Self::AllocatingKvCache => write!(f, "Allocating KV Cache"),
            Self::Priming => write!(f, "Warming Up"),
            Self::CapturingCudaGraphs => write!(f, "Optimizing"),
            Self::Ready => write!(f, "Ready"),
        }
    }
}

impl std::fmt::Display for ModelStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NotLoaded => write!(f, "not_loaded"),
            Self::Loading { stage, .. } => write!(f, "loading:{stage}"),
            Self::Warm { .. } => write!(f, "warm"),
            Self::Loaded { .. } => write!(f, "loaded"),
            Self::Primed { .. } => write!(f, "primed"),
            Self::Active {
                active_requests, ..
            } => write!(f, "active:{active_requests}"),
            Self::Failed { .. } => write!(f, "failed"),
            Self::Unloading => write!(f, "unloading"),
        }
    }
}

impl ModelStatus {
    /// User-friendly status for UI display.
    #[must_use]
    pub fn display_label(&self) -> &'static str {
        match self {
            Self::NotLoaded => "Not Loaded",
            Self::Loading { .. } => "Loading...",
            Self::Warm { .. } => "Standby (RAM)",
            Self::Loaded { .. } => "Ready (GPU)",
            Self::Primed { .. } => "Ready (Instant)",
            Self::Active { .. } => "Processing",
            Self::Failed { .. } => "Error",
            Self::Unloading => "Unloading...",
        }
    }

    /// Status indicator color for UI.
    #[must_use]
    pub fn status_color(&self) -> &'static str {
        match self {
            // Idle / no model running — neutral grey for both lifecycle ends.
            Self::NotLoaded | Self::Unloading => "gray",
            Self::Loading { .. } => "blue",
            Self::Warm { .. } => "yellow",
            Self::Loaded { .. } => "orange",
            // Ready or running — both signal "good to go" in green.
            Self::Primed { .. } | Self::Active { .. } => "green",
            Self::Failed { .. } => "red",
        }
    }

    /// Can this state accept inference requests?
    #[must_use]
    pub fn can_infer(&self) -> bool {
        matches!(
            self,
            Self::Loaded { .. } | Self::Primed { .. } | Self::Active { .. }
        )
    }

    /// Is this state using GPU VRAM?
    #[must_use]
    pub fn uses_vram(&self) -> bool {
        matches!(
            self,
            Self::Loaded { .. } | Self::Primed { .. } | Self::Active { .. }
        )
    }

    /// Get memory footprint if available.
    #[must_use]
    pub fn footprint(&self) -> Option<MemoryFootprint> {
        match self {
            Self::Warm { footprint }
            | Self::Loaded { footprint }
            | Self::Primed { footprint, .. }
            | Self::Active { footprint, .. } => Some(*footprint),
            _ => None,
        }
    }
}
