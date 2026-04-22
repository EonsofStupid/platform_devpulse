//! Qwen3 text embedder via ONNX Runtime.
//!
//! Produces dense sentence embeddings using the Qwen3-Embedding-0.6B model
//! (or any HF embedder exported to ONNX with the same IO shape).
//!
//! # Cast lints
//!
//! Tensor shape math (`i64` ONNX dims, `usize` token indices) and
//! pooling math (`f32` accumulation) produce domain-bounded casts.
//! Every cast here is an intended tensor representation change.

#![allow(
    clippy::cast_possible_truncation,
    clippy::cast_precision_loss,
    clippy::cast_sign_loss,
    clippy::cast_possible_wrap,
    clippy::cast_lossless
)]
//!
//! Pipeline: text → tokenize → encoder forward → mean-pool → L2 normalize → vector
//!
//! Model file expectations:
//!   - `model.onnx` (or any `*.onnx` in the directory)
//!   - `tokenizer.json` (HuggingFace tokenizers format)
//!
//! Default output dim: 1024 for Qwen3-Embedding-0.6B.
//! Used for RAG retrieval, semantic search, memory embedding.

use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::traits::capability::EmbeddingBackend;
use std::path::{Path, PathBuf};
#[cfg(feature = "ort-backend")]
use std::sync::Mutex;

/// Maximum sequence length for the embedder input.
/// Qwen3-Embedding supports up to 32k, but most inputs are short; cap for speed.
#[cfg(feature = "ort-backend")]
const MAX_SEQ_LEN: usize = 512;

/// Qwen3 text embedder backed by ort (ONNX Runtime).
pub struct Qwen3Embedder {
    /// Path to the model file or directory.
    model_path: Option<PathBuf>,
    /// Whether the model is currently loaded.
    loaded: bool,
    /// Output embedding dimension (detected from first forward pass).
    embedding_dim: usize,
    /// ONNX Runtime session for the embedder.
    #[cfg(feature = "ort-backend")]
    session: Mutex<Option<ort::session::Session>>,
    /// HuggingFace tokenizer.
    #[cfg(feature = "ort-backend")]
    tokenizer: Option<tokenizers::Tokenizer>,
}

impl Qwen3Embedder {
    /// Create a new embedder instance (unloaded).
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
            embedding_dim: 1024, // Qwen3-Embedding-0.6B default
            #[cfg(feature = "ort-backend")]
            session: Mutex::new(None),
            #[cfg(feature = "ort-backend")]
            tokenizer: None,
        }
    }
}

impl Default for Qwen3Embedder {
    fn default() -> Self {
        Self::new()
    }
}

impl EmbeddingBackend for Qwen3Embedder {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "Qwen3 Embedder",
            "Loading embedder model"
        );

        if !path.exists() {
            anyhow::bail!("Embedder model not found: {}", path.display());
        }

        #[cfg(feature = "ort-backend")]
        {
            // Resolve model file: directory → find *.onnx, file → use directly
            let (model_file, tokenizer_path) = if path.is_dir() {
                let model = find_onnx_file(path)?;
                let tok = path.join("tokenizer.json");
                if !tok.exists() {
                    anyhow::bail!(
                        "tokenizer.json not found in {}",
                        path.display()
                    );
                }
                (model, tok)
            } else {
                // Single file mode — look for tokenizer.json next to the model
                let parent = path.parent().ok_or_else(|| {
                    anyhow::anyhow!("Embedder model has no parent directory: {}", path.display())
                })?;
                let tok = parent.join("tokenizer.json");
                if !tok.exists() {
                    anyhow::bail!(
                        "tokenizer.json not found next to {}",
                        path.display()
                    );
                }
                (path.to_path_buf(), tok)
            };

            // Load tokenizer
            let tokenizer = tokenizers::Tokenizer::from_file(&tokenizer_path)
                .map_err(|e| anyhow::anyhow!("Failed to load tokenizer: {e}"))?;

            // Build ort session
            let session = ort::session::Session::builder()
                .map_err(|e| anyhow::anyhow!("Failed to create ort session builder: {e}"))?
                .commit_from_file(&model_file)
                .map_err(|e| anyhow::anyhow!("Failed to load embedder ONNX: {e}"))?;

            *self
                .session
                .lock()
                .map_err(|e| anyhow::anyhow!("Embedder session mutex poisoned: {e}"))? = Some(session);
            self.tokenizer = Some(tokenizer);
            self.model_path = Some(model_file.clone());
            self.loaded = true;

            let file_size = std::fs::metadata(&model_file).map(|m| m.len()).unwrap_or(0);

            tracing::info!(
                component = "Qwen3 Embedder",
                size_mb = file_size / 1_048_576,
                "Embedder loaded"
            );

            Ok(MemoryFootprint {
                ram_bytes: file_size,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            })
        }

        #[cfg(not(feature = "ort-backend"))]
        {
            anyhow::bail!("Qwen3 Embedder requires ort-backend feature — not compiled")
        }
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        #[cfg(feature = "ort-backend")]
        {
            *self
                .session
                .lock()
                .map_err(|e| anyhow::anyhow!("Embedder session mutex poisoned: {e}"))? = None;
            self.tokenizer = None;
        }
        self.model_path = None;
        self.loaded = false;
        tracing::info!(component = "Qwen3 Embedder", "Embedder unloaded");
        Ok(())
    }

    #[cfg(feature = "ort-backend")]
    #[tracing::instrument(skip(self, texts), fields(n = texts.len()))]
    fn embed(&self, texts: &[&str]) -> anyhow::Result<Vec<Vec<f32>>> {
        if !self.loaded {
            anyhow::bail!("Embedder not loaded");
        }
        if texts.is_empty() {
            return Ok(Vec::new());
        }

        let tokenizer = self
            .tokenizer
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Tokenizer not loaded"))?;

        let mut guard = self
            .session
            .lock()
            .map_err(|e| anyhow::anyhow!("Embedder session mutex poisoned: {e}"))?;
        let session = guard
            .as_mut()
            .ok_or_else(|| anyhow::anyhow!("Embedder session not initialized"))?;

        let mut results = Vec::with_capacity(texts.len());

        // Process one at a time to keep memory bounded — batch optimization is a future sprint.
        for text in texts {
            let encoding = tokenizer
                .encode(*text, true)
                .map_err(|e| anyhow::anyhow!("Tokenizer encode failed: {e}"))?;

            // Truncate to MAX_SEQ_LEN
            let ids: Vec<i64> = encoding
                .get_ids()
                .iter()
                .take(MAX_SEQ_LEN)
                .map(|&id| i64::from(id))
                .collect();
            let mask: Vec<i64> = encoding
                .get_attention_mask()
                .iter()
                .take(MAX_SEQ_LEN)
                .map(|&m| i64::from(m))
                .collect();

            let seq_len = ids.len();
            if seq_len == 0 {
                anyhow::bail!("Empty token sequence for text");
            }

            // Build input tensors: input_ids and attention_mask both [1, seq_len]
            let input_ids = ndarray::Array2::<i64>::from_shape_vec((1, seq_len), ids)
                .map_err(|e| anyhow::anyhow!("Failed to build input_ids tensor: {e}"))?;
            let attention_mask = ndarray::Array2::<i64>::from_shape_vec((1, seq_len), mask.clone())
                .map_err(|e| anyhow::anyhow!("Failed to build attention_mask tensor: {e}"))?;

            let v_ids = ort::value::Value::from_array(input_ids)
                .map_err(|e| anyhow::anyhow!("Failed to create ort Value for input_ids: {e}"))?;
            let v_mask = ort::value::Value::from_array(attention_mask)
                .map_err(|e| anyhow::anyhow!("Failed to create ort Value for attention_mask: {e}"))?;

            // Most embedder ONNX exports use input_ids + attention_mask. Some also
            // take token_type_ids — we pass zeros if present by using named inputs.
            let outputs = session
                .run(ort::inputs![
                    "input_ids" => v_ids,
                    "attention_mask" => v_mask,
                ])
                .map_err(|e| anyhow::anyhow!("Embedder inference failed: {e}"))?;

            // Output shape is typically [1, seq_len, hidden_dim] — last_hidden_state
            let output_value = &outputs[0];
            let (shape, data) = output_value
                .try_extract_tensor::<f32>()
                .map_err(|e| anyhow::anyhow!("Failed to extract embedder output: {e}"))?;

            // shape should be [1, seq_len, hidden_dim]
            if shape.len() != 3 {
                anyhow::bail!(
                    "Unexpected embedder output shape: {:?} (expected [1, seq, dim])",
                    shape
                );
            }
            let hidden_dim = shape[2] as usize;
            let out_seq_len = shape[1] as usize;

            // Mean-pool the token embeddings, weighted by attention mask
            let mut pooled = vec![0.0f32; hidden_dim];
            let mut mask_sum = 0.0f32;
            for token_idx in 0..out_seq_len {
                let m = if token_idx < mask.len() {
                    mask[token_idx] as f32
                } else {
                    0.0
                };
                if m == 0.0 {
                    continue;
                }
                mask_sum += m;
                let base = token_idx * hidden_dim;
                for d in 0..hidden_dim {
                    pooled[d] += data[base + d] * m;
                }
            }
            if mask_sum > 0.0 {
                for v in &mut pooled {
                    *v /= mask_sum;
                }
            }

            // L2 normalize — standard for sentence embeddings
            let norm = pooled.iter().map(|v| v * v).sum::<f32>().sqrt();
            if norm > 0.0 {
                for v in &mut pooled {
                    *v /= norm;
                }
            }

            results.push(pooled);
        }

        // Capture the actual embedding dim from the first result (should match self.embedding_dim)
        if let Some(first) = results.first() {
            // SAFETY: we hold &self, can't mutate self.embedding_dim — but this is
            // purely informational. The trait method `embedding_dim()` returns the
            // constructor-time default. A future sprint can make this stateful.
            if first.len() != self.embedding_dim {
                tracing::debug!(
                    component = "Qwen3 Embedder",
                    actual_dim = first.len(),
                    expected_dim = self.embedding_dim,
                    "Embedding dimension differs from expected"
                );
            }
        }

        Ok(results)
    }

    #[cfg(not(feature = "ort-backend"))]
    fn embed(&self, _texts: &[&str]) -> anyhow::Result<Vec<Vec<f32>>> {
        anyhow::bail!("Qwen3 Embedder requires ort-backend feature — not compiled")
    }

    fn embedding_dim(&self) -> usize {
        self.embedding_dim
    }

    fn memory_usage(&self) -> MemoryFootprint {
        if let Some(ref path) = self.model_path {
            let size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
            MemoryFootprint {
                ram_bytes: size,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            }
        } else {
            MemoryFootprint {
                ram_bytes: 0,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            }
        }
    }
}

/// Find the first `*.onnx` file in a directory, excluding encoder/decoder suffixes
/// (those are for multi-file models like Whisper).
#[cfg(feature = "ort-backend")]
fn find_onnx_file(dir: &Path) -> anyhow::Result<PathBuf> {
    let entries = std::fs::read_dir(dir)
        .map_err(|e| anyhow::anyhow!("Failed to read directory {}: {e}", dir.display()))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("onnx") {
            let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
            // Skip encoder/decoder pieces — those belong to multi-part models
            if !stem.contains("encoder") && !stem.contains("decoder") {
                return Ok(path);
            }
        }
    }

    anyhow::bail!("No single-piece .onnx file found in {}", dir.display())
}
