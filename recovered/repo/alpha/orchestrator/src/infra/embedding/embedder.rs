// orchestrator/src/infra/embedding/embedder.rs

//! Embedder backend - Qwen3-Embedding via Candle
//!
//! Device: CPU forced (saves VRAM headroom for reranker + llm)
//! Format: Safetensors only
//! Output: 1024-dim L2-normalized vector
//!
//! This is the foundation for all 4 pillars:
//! - Vectors enable RRO search
//! - Search feeds reranker for Persona-Skewed scoring
//! - Embeddings enable MMR diversity calculation
//! - Focus Sphere uses vector similarity for decay

use anyhow::Result;
use candle_core::{DType, Device, Tensor, D};
use candle_nn::VarBuilder;
use candle_transformers::models::qwen3::{Config as Qwen3ModelConfig, Model as Qwen3Model};
use std::path::PathBuf;
use std::sync::Mutex;
use tokenizers::Tokenizer;
use tracing::instrument;

use crate::infra::catalog::models::{DeviceAllocation, ModelPaths, Qwen3Config};

/// Embedding dimensions for different models
pub mod dims {
    pub const QWEN3_EMBEDDING_0_6B: usize = 1024;
    pub const QWEN3_EMBEDDING_4B: usize = 2560;
    pub const QWEN3_EMBEDDING_8B: usize = 4096;
}

/// Embedder backend - CPU forced per device allocation strategy
///
/// Dual-mode embedding:
/// - `embed()` → Stateless, creates fresh model each call. Use for RRO seeding.
/// - `embed_stateful()` → Maintains KV cache across calls. Use for sub-agent observation
///   chains where accumulated context matters.
/// - `clear_cache()` → Reset stateful model when switching contexts.
///
/// Weights are memory-mapped so model creation is fast after first load.
pub struct EmbedderBackend {
    weights_path: PathBuf,
    config: Qwen3ModelConfig,
    /// Cached model for stateful embedding (sub-agent observation chains)
    stateful_model: Mutex<Option<Qwen3Model>>,
    tokenizer: Tokenizer,
    device: Device,
    dimension: usize,
}

impl EmbedderBackend {
    /// Load embedder from directory containing model.safetensors, tokenizer.json, config.json
    #[instrument(name = "embedder.load", skip_all, fields(dir = %embedder_dir.display()))]
    pub fn load(embedder_dir: &PathBuf) -> Result<Self> {
        // Device: CPU forced per locked decision (saves VRAM)
        let device = DeviceAllocation::CpuForced.to_device();
        tracing::info!("Loading embedder on {:?}", device);

        // Paths
        let weights_path = embedder_dir.join("model.safetensors");
        let config_path = embedder_dir.join("config.json");
        let tokenizer_path = embedder_dir.join("tokenizer.json");

        // Load config
        let qwen3_config = Qwen3Config::from_file(&config_path)?;
        let dimension = qwen3_config.hidden_size;

        tracing::info!(
            "Config loaded: hidden_size={}, layers={}, heads={}",
            qwen3_config.hidden_size,
            qwen3_config.num_hidden_layers,
            qwen3_config.num_attention_heads
        );

        // Build Qwen3 config directly
        let config = Qwen3ModelConfig {
            vocab_size: qwen3_config.vocab_size,
            hidden_size: qwen3_config.hidden_size,
            intermediate_size: qwen3_config.intermediate_size,
            num_hidden_layers: qwen3_config.num_hidden_layers,
            num_attention_heads: qwen3_config.num_attention_heads,
            num_key_value_heads: qwen3_config.num_key_value_heads,
            head_dim: qwen3_config.head_dim.unwrap_or(128),
            attention_bias: false,
            hidden_act: candle_nn::Activation::Silu,
            max_position_embeddings: qwen3_config.max_position_embeddings.unwrap_or(40960),
            max_window_layers: 28, // default for 0.6B model
            rms_norm_eps: qwen3_config.rms_norm_eps,
            rope_theta: qwen3_config.rope_theta,
            sliding_window: None,
            use_sliding_window: false,
            tie_word_embeddings: qwen3_config.tie_word_embeddings,
        };

        // Load weights via memory-mapped safetensors
        // Try BF16 version first (converted from FP8), then fall back to original
        let bf16_path = embedder_dir.join("model_bf16.safetensors");
        let weights_to_load = if bf16_path.exists() {
            tracing::info!("Found BF16 model, using {:?}", bf16_path);
            bf16_path
        } else {
            weights_path.clone()
        };

        // Validate weights can be loaded (fail-fast), but don't keep model in memory
        // Actual model creation happens lazily in build_fresh_model()
        tracing::info!("Validating weights at {:?}", weights_to_load);
        let _vb = unsafe {
            VarBuilder::from_mmaped_safetensors(&[&weights_to_load], DType::F32, &device)
                .map_err(|e| {
                    let err_str = e.to_string();
                    if err_str.contains("F8_E4M3") || err_str.contains("unsupported") {
                        anyhow::anyhow!(
                            "FP8 quantized model not supported by Candle.\n\n\
                            The model at {:?} is in FP8 format (F8_E4M3).\n\
                            To fix this, either:\n\
                            1. Convert to BF16: python scripts/convert_fp8_to_bf16.py {:?} {:?}\n\
                            2. Download a non-quantized version of the model\n\n\
                            Original error: {}",
                            weights_to_load,
                            embedder_dir,
                            embedder_dir.join("model_bf16.safetensors"),
                            e
                        )
                    } else {
                        anyhow::anyhow!("Failed to load weights: {}", e)
                    }
                })?
        };

        // Load tokenizer
        let tokenizer = Tokenizer::from_file(&tokenizer_path)
            .map_err(|e| anyhow::anyhow!("Failed to load tokenizer: {}", e))?;

        tracing::info!("Embedder loaded: dim={}", dimension);

        Ok(Self {
            weights_path: weights_to_load,
            config,
            stateful_model: Mutex::new(None),
            tokenizer,
            device,
            dimension,
        })
    }

    /// Build a fresh model instance (no KV cache state)
    fn build_fresh_model(&self) -> Result<Qwen3Model> {
        let vb = unsafe {
            VarBuilder::from_mmaped_safetensors(&[&self.weights_path], DType::F32, &self.device)?
        };
        Ok(Qwen3Model::new(&self.config, vb)?)
    }

    /// Load from default dp_alpha paths
    pub fn from_config() -> Self {
        let paths = ModelPaths::default_dp_alpha();
        Self::load(&paths.embedder_dir).expect("Failed to load embedder from default path")
    }

    /// Get embedding dimension
    pub fn dimension(&self) -> usize {
        self.dimension
    }

    /// Get device
    pub fn device(&self) -> &Device {
        &self.device
    }

    /// Embed text to L2-normalized vector (STATELESS - fresh model each call)
    ///
    /// Use this for RRO seeding and independent embeddings.
    /// Each call gets a clean model with no KV cache state.
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        let mut model = self.build_fresh_model()?;
        self.embed_with_model(&mut model, text)
    }

    /// Embed text with STATEFUL model (maintains KV cache across calls)
    ///
    /// Use this for sub-agent observation chains where you want accumulated
    /// context. The model remembers previous tokens across calls.
    /// Call `clear_cache()` when switching to a new context.
    pub fn embed_stateful(&self, text: &str) -> Result<Vec<f32>> {
        let mut guard = self.stateful_model.lock().unwrap();

        // Lazy-init the stateful model
        if guard.is_none() {
            *guard = Some(self.build_fresh_model()?);
        }

        let model = guard.as_mut().unwrap();
        self.embed_with_model(model, text)
    }

    /// Clear the stateful model's KV cache by dropping and recreating it
    ///
    /// Call this when switching between sub-agent contexts or when you
    /// want to start fresh without accumulated state.
    pub fn clear_cache(&self) {
        let mut guard = self.stateful_model.lock().unwrap();
        *guard = None;
        tracing::debug!("Embedder cache cleared");
    }

    /// Internal: run embedding on a given model instance
    fn embed_with_model(&self, model: &mut Qwen3Model, text: &str) -> Result<Vec<f32>> {
        // Tokenize
        let encoding = self
            .tokenizer
            .encode(text, true)
            .map_err(|e| anyhow::anyhow!("Tokenization failed: {}", e))?;

        let input_ids = encoding.get_ids();

        // Truncate if needed (model max is 32k but be conservative)
        let max_len = 8192;
        let truncated: &[u32] = if input_ids.len() > max_len {
            &input_ids[..max_len]
        } else {
            input_ids
        };

        let input = Tensor::new(truncated, &self.device)?.unsqueeze(0)?;

        // Forward pass (Qwen3 forward: input, offset)
        let hidden_states = model.forward(&input, 0)?;

        // Mean pooling over sequence dimension
        let pooled = hidden_states.mean(D::Minus2)?;
        let pooled = pooled.squeeze(0)?;

        // L2 normalize
        let norm = pooled.sqr()?.sum_all()?.sqrt()?;
        let normalized = pooled.broadcast_div(&norm)?;

        // Convert to Vec<f32>
        Ok(normalized.to_vec1()?)
    }

    /// Batch embed multiple texts (sequential, STATELESS)
    pub fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        texts.iter().map(|t| self.embed(t)).collect()
    }

    /// Batch embed with STATEFUL model (maintains cache across the batch)
    pub fn embed_batch_stateful(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        texts.iter().map(|t| self.embed_stateful(t)).collect()
    }

    /// Check if model files are present
    pub fn verify_model(&self) -> ModelStatus {
        let paths = ModelPaths::default_dp_alpha();
        ModelStatus {
            model: paths.embedder_dir.join("model.safetensors").exists(),
            tokenizer: paths.embedder_dir.join("tokenizer.json").exists(),
            config: paths.embedder_dir.join("config.json").exists(),
        }
    }

    /// Get path helpers (for backwards compat with verify_models in chat)
    pub fn model_path(&self) -> PathBuf {
        ModelPaths::default_dp_alpha()
            .embedder_dir
            .join("model.safetensors")
    }

    pub fn tokenizer_path(&self) -> PathBuf {
        ModelPaths::default_dp_alpha()
            .embedder_dir
            .join("tokenizer.json")
    }

    pub fn config_path(&self) -> PathBuf {
        ModelPaths::default_dp_alpha()
            .embedder_dir
            .join("config.json")
    }
}

/// Embedding result (for batch operations)
#[derive(Debug, Clone)]
pub struct EmbeddingResult {
    /// The embedding vector (1024 dims for Qwen3-Embedding-0.6B)
    pub vector: Vec<f32>,
    /// Number of tokens in input
    pub token_count: usize,
}

/// Status of embedder model files
#[derive(Debug, Clone)]
pub struct ModelStatus {
    pub model: bool,
    pub tokenizer: bool,
    pub config: bool,
}

impl std::fmt::Display for ModelStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Model: {}, Tokenizer: {}, Config: {}",
            if self.model { "OK" } else { "MISSING" },
            if self.tokenizer { "OK" } else { "MISSING" },
            if self.config { "OK" } else { "MISSING" },
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore] // Requires model files
    fn test_embedder_produces_1024_dims() {
        let paths = ModelPaths::default_dp_alpha();
        let embedder = EmbedderBackend::load(&paths.embedder_dir).unwrap();

        let vec = embedder.embed("Hello, world!").unwrap();
        assert_eq!(vec.len(), 1024, "Must produce 1024 dims");

        // Verify L2 normalized
        let mag: f32 = vec.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((mag - 1.0).abs() < 0.01, "Must be L2 normalized");
    }

    #[test]
    #[ignore] // Requires model files
    fn test_embedder_batch() {
        let paths = ModelPaths::default_dp_alpha();
        let embedder = EmbedderBackend::load(&paths.embedder_dir).unwrap();

        let texts = vec!["Hello", "World", "Rust"];
        let vecs = embedder.embed_batch(&texts).unwrap();

        assert_eq!(vecs.len(), 3);
        for vec in vecs {
            assert_eq!(vec.len(), 1024);
        }
    }
}
