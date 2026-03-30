//! Candle-based dense embedder — CPU burst mode.
//!
//! Loads a BERT-family model (e.g. `all-MiniLM-L6-v2`, `bge-small-en-v1.5`)
//! from a local safetensors file + tokenizer.json. Runs inference on CPU.
//!
//! CPU burst mode: the model stays loaded in memory, embeddings are generated
//! on demand. No GPU required. Suitable for indexing and query-time encoding.
//!
//! Model files expected at:
//! ```text
//! {model_dir}/
//! ├── config.json           # HuggingFace model config
//! ├── tokenizer.json        # HuggingFace tokenizer
//! └── model.safetensors     # Model weights
//! ```

use anyhow::{Context, Result};
use candle_core::{Device, Tensor};
use candle_nn;
use candle_transformers::models::bert::{BertModel, Config as BertConfig, DTYPE};
use std::path::Path;
use tokenizers::Tokenizer;

/// Candle-based dense text embedder.
///
/// Holds the model and tokenizer in memory. Thread-safe via `Send + Sync`
/// (candle tensors are immutable after creation, tokenizer is `Send + Sync`).
pub struct CandleEmbedder {
    model: BertModel,
    tokenizer: Tokenizer,
    device: Device,
    dimension: u32,
    normalize: bool,
}

impl CandleEmbedder {
    /// Load a BERT-family embedding model from a local directory.
    ///
    /// Expects `config.json`, `tokenizer.json`, and `model.safetensors` in `model_dir`.
    /// Runs on CPU — no CUDA/Metal required.
    ///
    /// # Errors
    /// Returns error if any model file is missing, corrupt, or incompatible.
    pub fn load(model_dir: &Path) -> Result<Self> {
        let device = Device::Cpu;

        // Load config
        let config_path = model_dir.join("config.json");
        let config_data = std::fs::read_to_string(&config_path)
            .with_context(|| format!("Missing config.json at {}", config_path.display()))?;
        let config: BertConfig = serde_json::from_str(&config_data)
            .context("Failed to parse config.json as BertConfig")?;

        let dimension = config.hidden_size as u32;

        // Load tokenizer
        let tokenizer_path = model_dir.join("tokenizer.json");
        let tokenizer = Tokenizer::from_file(&tokenizer_path)
            .map_err(|e| anyhow::anyhow!("Failed to load tokenizer.json: {e}"))?;

        // Load model weights
        let weights_path = model_dir.join("model.safetensors");
        let vb = candle_nn::VarBuilder::from_pth(&weights_path, DTYPE, &device)
            .with_context(|| format!("Failed to load model.safetensors at {}", weights_path.display()))?;
        let model = BertModel::load(vb, &config)
            .context("Failed to construct BertModel from weights")?;

        tracing::info!(
            model_dir = %model_dir.display(),
            dimension,
            "Candle embedder loaded (CPU burst mode)"
        );

        Ok(Self {
            model,
            tokenizer,
            device,
            dimension,
            normalize: true,
        })
    }

    /// Output dimension of embedding vectors.
    pub fn dimension(&self) -> u32 {
        self.dimension
    }

    /// Embed a single text into a dense vector.
    ///
    /// Tokenizes → forward pass → mean pooling over token embeddings → L2 normalize.
    ///
    /// # Errors
    /// Returns error if tokenization or inference fails.
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        let encoding = self.tokenizer
            .encode(text, true)
            .map_err(|e| anyhow::anyhow!("Tokenization failed: {e}"))?;

        let token_ids = encoding.get_ids();
        let attention_mask = encoding.get_attention_mask();

        let token_ids = Tensor::new(token_ids, &self.device)?.unsqueeze(0)?;
        let attention_mask_tensor = Tensor::new(attention_mask, &self.device)?.unsqueeze(0)?;
        let token_type_ids = token_ids.zeros_like()?;

        // Forward pass
        let embeddings = self.model.forward(&token_ids, &token_type_ids, Some(&attention_mask_tensor))?;

        // Mean pooling: mask padding tokens, average over sequence length
        let mask = attention_mask_tensor
            .unsqueeze(2)?
            .to_dtype(embeddings.dtype())?;
        let masked = embeddings.broadcast_mul(&mask)?;
        let sum = masked.sum(1)?;
        let count = mask.sum(1)?.clamp(1e-9, f64::MAX)?;
        let mean_pooled = sum.broadcast_div(&count)?;

        // Extract as flat vec
        let mut embedding: Vec<f32> = mean_pooled.squeeze(0)?.to_vec1()?;

        // L2 normalize
        if self.normalize {
            let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
            if norm > 0.0 {
                embedding.iter_mut().for_each(|x| *x /= norm);
            }
        }

        Ok(embedding)
    }

    /// Batch embed multiple texts.
    ///
    /// Currently sequential — batch tokenization + padding is a future optimization.
    pub fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        texts.iter().map(|t| self.embed(t)).collect()
    }

    /// Health check — run a trivial embedding to verify the model is functional.
    pub fn ping(&self) -> Result<()> {
        let _ = self.embed("health check")?;
        Ok(())
    }
}
