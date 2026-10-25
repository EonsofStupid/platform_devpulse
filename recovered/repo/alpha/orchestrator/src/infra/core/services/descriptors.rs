// orchestrator/src/infra/core/services/descriptors.rs

//! Model descriptors - Metadata for available models
//!
//! These structs describe models in config.toml without loading them.
//! The loaders use these to construct actual backends.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// ═══════════════════════════════════════════════════════════════
// ModelFamily - Architecture types
// ═══════════════════════════════════════════════════════════════

/// Model architecture family
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ModelFamily {
    /// Qwen3 embedding model
    Qwen3Embed,
    /// Qwen3 reranker (thinking mode)
    Qwen3Rerank,
    /// Qwen3 VL (vision-language)
    Qwen3VL,
    /// Qwen3 text-only
    Qwen3,
    /// Whisper speech-to-text
    Whisper,
    /// Kokoro text-to-speech
    Kokoro,
    /// SigLIP vision encoder
    SigLIP,
    /// Custom/other
    Custom,
}

impl std::fmt::Display for ModelFamily {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ModelFamily::Qwen3Embed => write!(f, "qwen3-embed"),
            ModelFamily::Qwen3Rerank => write!(f, "qwen3-rerank"),
            ModelFamily::Qwen3VL => write!(f, "qwen3-vl"),
            ModelFamily::Qwen3 => write!(f, "qwen3"),
            ModelFamily::Whisper => write!(f, "whisper"),
            ModelFamily::Kokoro => write!(f, "kokoro"),
            ModelFamily::SigLIP => write!(f, "siglip"),
            ModelFamily::Custom => write!(f, "custom"),
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ModelFormat - File formats
// ═══════════════════════════════════════════════════════════════

/// Model file format
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ModelFormat {
    /// HuggingFace safetensors
    Safetensors,
    /// GGUF quantized format
    Gguf,
    /// Legacy GGML
    Ggml,
    /// PyTorch .bin
    Pytorch,
    /// ONNX
    Onnx,
}

impl std::fmt::Display for ModelFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ModelFormat::Safetensors => write!(f, "safetensors"),
            ModelFormat::Gguf => write!(f, "gguf"),
            ModelFormat::Ggml => write!(f, "ggml"),
            ModelFormat::Pytorch => write!(f, "pytorch"),
            ModelFormat::Onnx => write!(f, "onnx"),
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// DeviceTarget - Where to run
// ═══════════════════════════════════════════════════════════════

/// Target device for model execution
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DeviceTarget {
    /// Force CPU (saves VRAM)
    Cpu,
    /// CUDA GPU with optional device index
    #[serde(rename = "cuda")]
    Cuda(u8),
    /// Apple Metal
    Metal,
    /// Auto-select best available
    Auto,
}

impl Default for DeviceTarget {
    fn default() -> Self {
        DeviceTarget::Auto
    }
}

impl std::fmt::Display for DeviceTarget {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DeviceTarget::Cpu => write!(f, "cpu"),
            DeviceTarget::Cuda(idx) => write!(f, "cuda:{}", idx),
            DeviceTarget::Metal => write!(f, "metal"),
            DeviceTarget::Auto => write!(f, "auto"),
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Model Descriptors
// ═══════════════════════════════════════════════════════════════

/// Describes an embedder model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbedderDescriptor {
    /// Unique identifier (e.g., "Qwen3Embed0_6B")
    pub id: String,
    /// Model architecture
    pub family: ModelFamily,
    /// Parameters in billions
    pub params_b: f32,
    /// Output dimension
    pub dimension: usize,
    /// Path relative to models_dir
    pub path: PathBuf,
    /// File format
    pub format: ModelFormat,
}

impl EmbedderDescriptor {
    /// Create descriptor for Qwen3-Embedding-0.6B
    pub fn qwen3_0_6b() -> Self {
        Self {
            id: "Qwen3Embed0_6B".to_string(),
            family: ModelFamily::Qwen3Embed,
            params_b: 0.6,
            dimension: 1024,
            path: PathBuf::from("embedder"),
            format: ModelFormat::Safetensors,
        }
    }

    /// Create descriptor for Qwen3-Embedding-4B
    pub fn qwen3_4b() -> Self {
        Self {
            id: "Qwen3Embed4B".to_string(),
            family: ModelFamily::Qwen3Embed,
            params_b: 4.0,
            dimension: 2560,
            path: PathBuf::from("embedder-4b"),
            format: ModelFormat::Safetensors,
        }
    }
}

/// Describes a reranker model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RerankerDescriptor {
    /// Unique identifier
    pub id: String,
    /// Model architecture
    pub family: ModelFamily,
    /// Parameters in billions
    pub params_b: f32,
    /// Path relative to models_dir
    pub path: PathBuf,
    /// File format
    pub format: ModelFormat,
    /// Quantization level (e.g., "Q8_0")
    pub quant: Option<String>,
}

impl RerankerDescriptor {
    /// Create descriptor for Qwen3-Reranker-0.6B Q8
    pub fn qwen3_0_6b_q8() -> Self {
        Self {
            id: "Qwen3Rerank0_6B".to_string(),
            family: ModelFamily::Qwen3Rerank,
            params_b: 0.6,
            path: PathBuf::from("reranker"),
            format: ModelFormat::Gguf,
            quant: Some("Q8_0".to_string()),
        }
    }
}

/// Describes an LLM
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmDescriptor {
    /// Unique identifier
    pub id: String,
    /// Model architecture
    pub family: ModelFamily,
    /// Parameters in billions
    pub params_b: f32,
    /// Path relative to models_dir (to GGUF file or directory)
    pub path: PathBuf,
    /// File format
    pub format: ModelFormat,
    /// Quantization level
    pub quant: Option<String>,
    /// Estimated VRAM usage in GB
    pub vram_gb: f32,
    /// Supports image input?
    #[serde(default)]
    pub supports_vision: bool,
}

impl LlmDescriptor {
    /// Create descriptor for Qwen3-VL-4B Q4_K_M
    pub fn qwen3_vl_4b_q4km() -> Self {
        Self {
            id: "Qwen3VL4B_Q4KM".to_string(),
            family: ModelFamily::Qwen3VL,
            params_b: 4.0,
            path: PathBuf::from("llm/Qwen3-VL-4B-Instruct-Q4_K_M.gguf"),
            format: ModelFormat::Gguf,
            quant: Some("Q4_K_M".to_string()),
            vram_gb: 3.5,
            supports_vision: true,
        }
    }

    /// Create descriptor for Qwen3-VL-8B Q4_K_M
    pub fn qwen3_vl_8b_q4km() -> Self {
        Self {
            id: "Qwen3VL8B_Q4KM".to_string(),
            family: ModelFamily::Qwen3VL,
            params_b: 8.0,
            path: PathBuf::from("8vlb/qwen3-vl-8b/model.gguf"),
            format: ModelFormat::Gguf,
            quant: Some("Q4_K_M".to_string()),
            vram_gb: 6.5,
            supports_vision: true,
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ModelRegistry - All known models
// ═══════════════════════════════════════════════════════════════

/// All registered models from config
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ModelRegistry {
    #[serde(default)]
    pub embedders: std::collections::HashMap<String, EmbedderDescriptor>,
    #[serde(default)]
    pub rerankers: std::collections::HashMap<String, RerankerDescriptor>,
    #[serde(default)]
    pub llms: std::collections::HashMap<String, LlmDescriptor>,
}

impl ModelRegistry {
    /// Create registry with default models
    pub fn with_defaults() -> Self {
        let mut registry = Self::default();

        // Embedders
        let e1 = EmbedderDescriptor::qwen3_0_6b();
        registry.embedders.insert(e1.id.clone(), e1);
        let e2 = EmbedderDescriptor::qwen3_4b();
        registry.embedders.insert(e2.id.clone(), e2);

        // Rerankers
        let r1 = RerankerDescriptor::qwen3_0_6b_q8();
        registry.rerankers.insert(r1.id.clone(), r1);

        // LLMs
        let l1 = LlmDescriptor::qwen3_vl_4b_q4km();
        registry.llms.insert(l1.id.clone(), l1);
        let l2 = LlmDescriptor::qwen3_vl_8b_q4km();
        registry.llms.insert(l2.id.clone(), l2);

        registry
    }

    /// Get embedder by ID
    pub fn get_embedder(&self, id: &str) -> Option<&EmbedderDescriptor> {
        self.embedders.get(id)
    }

    /// Get reranker by ID
    pub fn get_reranker(&self, id: &str) -> Option<&RerankerDescriptor> {
        self.rerankers.get(id)
    }

    /// Get LLM by ID
    pub fn get_llm(&self, id: &str) -> Option<&LlmDescriptor> {
        self.llms.get(id)
    }
}
