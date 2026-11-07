// shared/src/types/models.rs

//! Model types for API responses
//!
//! SSOT for model information sent to Lab UI.
//! Simpler than orchestrator's internal ModelSpec.

use serde::{Deserialize, Serialize};

/// Model family (architecture)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ModelFamily {
    /// Qwen3 embedding model
    Qwen3Embed,
    /// Qwen3 reranker
    Qwen3Rerank,
    /// Qwen3 VL (vision-language)
    Qwen3VL,
    /// Whisper STT
    Whisper,
    /// Kokoro TTS
    Kokoro,
}

impl std::fmt::Display for ModelFamily {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Qwen3Embed => write!(f, "qwen3-embed"),
            Self::Qwen3Rerank => write!(f, "qwen3-rerank"),
            Self::Qwen3VL => write!(f, "qwen3-vl"),
            Self::Whisper => write!(f, "whisper"),
            Self::Kokoro => write!(f, "kokoro"),
        }
    }
}

/// Model info for API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    /// Unique identifier (e.g., "qwen3-vl-8b-q6k")
    pub id: String,
    /// Human-readable name
    pub name: String,
    /// Model family
    pub family: ModelFamily,
    /// Parameter count in billions
    pub params_b: f32,
    /// Quantization (e.g., "Q6_K", "Q8_0")
    pub quantization: Option<String>,
    /// Estimated VRAM in GB
    pub vram_gb: f32,
    /// Whether files exist on disk
    pub available: bool,
    /// Whether this is the active model for its family
    pub is_active: bool,
}

/// Summary of all models by family
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelSummary {
    /// Active VL model (for chat)
    pub active_vl: Option<String>,
    /// Active embedding model
    pub active_embed: Option<String>,
    /// Active reranker model
    pub active_rerank: Option<String>,
    /// Total models available
    pub total_models: usize,
    /// Models missing required files
    pub missing_count: usize,
}

/// Model loading state for UI progress tracking
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "state", rename_all = "snake_case")]
pub enum ModelLoadState {
    /// Model not loaded
    Idle,
    /// Model is currently loading
    Loading {
        /// Progress percentage (0-100)
        progress_pct: u8,
        /// Current loading stage
        stage: String,
    },
    /// Model loaded successfully
    Loaded {
        /// VRAM usage in MB
        vram_mb: u64,
        /// Load time in milliseconds
        latency_ms: u64,
    },
    /// Model loading failed
    Failed {
        /// Error message
        error: String,
    },
}

impl Default for ModelLoadState {
    fn default() -> Self {
        Self::Idle
    }
}

/// Active model configuration for persistence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveModelConfig {
    /// Model family
    pub family: ModelFamily,
    /// Active model ID for this family
    pub model_id: String,
    /// When this was activated (Unix timestamp ms)
    pub activated_at: i64,
}
