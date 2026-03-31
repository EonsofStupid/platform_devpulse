//! Model registry — discovered models with metadata and capability inference.

use crate::slots::types::ModelCapability;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Format of the model file on disk.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ModelFormat {
    /// GGUF quantized format (Phase 1 — launch format).
    Gguf,
    /// SafeTensors format (Phase 2).
    SafeTensors,
}

/// Which inference backend can run this model.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum BackendType {
    /// Candle (canonical — Rust-native, llguidance integration).
    Candle,
    /// llama.cpp via FFI (secondary — broader architecture support).
    LlamaCpp,
}

/// Where the model was obtained.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ModelSource {
    /// Discovered on local disk.
    Local,
    /// Downloaded from HuggingFace Hub.
    HuggingFace {
        /// HuggingFace repository ID (e.g. `"bartowski/Qwen3-14B-GGUF"`).
        repo_id: String,
        /// Git revision or branch.
        revision: String,
    },
}

/// Metadata extracted from model file headers (GGUF metadata keys).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelMetadata {
    /// Architecture identifier (e.g. `"llama"`, `"qwen2"`, `"phi3"`).
    pub architecture: String,
    /// Total parameter count, if available.
    pub parameter_count: Option<u64>,
    /// Quantization level (e.g. `"Q4_K_M"`, `"Q8_0"`, `"F16"`).
    pub quant_level: Option<String>,
    /// Maximum context window in tokens.
    pub context_length: usize,
    /// Vocabulary size.
    pub vocab_size: usize,
}

/// A single model in the registry — fully described, ready for assignment.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRegistryEntry {
    /// Unique identifier (UUID v7).
    pub id: String,
    /// Filename on disk (e.g. `"qwen3-14b-instruct-q4_k_m.gguf"`).
    pub filename: String,
    /// Absolute path on disk.
    pub path: PathBuf,
    /// File format.
    pub format: ModelFormat,
    /// Architecture string from model metadata.
    pub architecture: String,
    /// Parameter count from metadata.
    pub parameter_count: Option<u64>,
    /// Quantization level from metadata or filename.
    pub quant_level: Option<String>,
    /// Maximum context window in tokens.
    pub context_length: usize,
    /// File size on disk in bytes.
    pub size_bytes: u64,
    /// Estimated VRAM when loaded (MB).
    pub vram_estimate_mb: u64,
    /// Which backends can load this model.
    pub supported_backends: Vec<BackendType>,
    /// Which slot capabilities this model can serve.
    pub compatible_capabilities: Vec<ModelCapability>,
    /// Where this model came from.
    pub source: ModelSource,
    /// When this model was discovered (epoch milliseconds).
    pub discovered_at: i64,
}

impl std::fmt::Display for ModelFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Gguf => write!(f, "GGUF"),
            Self::SafeTensors => write!(f, "SafeTensors"),
        }
    }
}

impl std::fmt::Display for BackendType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Candle => write!(f, "Candle"),
            Self::LlamaCpp => write!(f, "llama.cpp"),
        }
    }
}
