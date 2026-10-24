//! Qwen3 cross-encoder reranker via ONNX Runtime.
//!
//! Scores query-document pairs for relevance. Used as second-stage refinement
//! after initial vector search from the embedder.
//!
//! Input shape: `[query] [SEP] [document]` concatenated, tokenized together.
//! Output: single logit per pair, sigmoid → relevance score in [0, 1].
//!
//! Model file expectations (same layout as embedder):
//!   - `model.onnx`
//!   - `tokenizer.json`

use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::traits::capability::RerankerBackend;
use std::path::{Path, PathBuf};
#[cfg(feature = "ort-backend")]
use std::sync::Mutex;

/// Maximum combined query+document token length.
#[cfg(feature = "ort-backend")]
const MAX_SEQ_LEN: usize = 512;

/// Qwen3 cross-encoder reranker backed by ort.
pub struct Qwen3Reranker {
    /// Path to the model file or directory.
    model_path: Option<PathBuf>,
    /// Whether the model is loaded.
    loaded: bool,
    /// ONNX Runtime session.
    #[cfg(feature = "ort-backend")]
    session: Mutex<Option<ort::session::Session>>,
    /// `HuggingFace` tokenizer.
    #[cfg(feature = "ort-backend")]
    tokenizer: Option<tokenizers::Tokenizer>,
}

impl Qwen3Reranker {
    /// Create a new reranker instance (unloaded).
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
            #[cfg(feature = "ort-backend")]
            session: Mutex::new(None),
            #[cfg(feature = "ort-backend")]
            tokenizer: None,
        }
    }
}

impl Default for Qwen3Reranker {
    fn default() -> Self {
        Self::new()
    }
}

impl RerankerBackend for Qwen3Reranker {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "Qwen3 Reranker",
            "Loading reranker model"
        );

        if !path.exists() {
            anyhow::bail!("Reranker model not found: {}", path.display());
        }

        #[cfg(feature = "ort-backend")]
        {
            // Resolve model file + tokenizer
            let (model_file, tokenizer_path) = if path.is_dir() {
                let model = find_onnx_file(path)?;
                let tok = path.join("tokenizer.json");
                if !tok.exists() {
                    anyhow::bail!("tokenizer.json not found in {}", path.display());
                }
                (model, tok)
            } else {
                let parent = path
                    .parent()
                    .ok_or_else(|| anyhow::anyhow!("Reranker model has no parent directory"))?;
                let tok = parent.join("tokenizer.json");
                if !tok.exists() {
                    anyhow::bail!("tokenizer.json not found next to {}", path.display());
                }
                (path.to_path_buf(), tok)
            };

            let tokenizer = tokenizers::Tokenizer::from_file(&tokenizer_path)
                .map_err(|e| anyhow::anyhow!("Failed to load tokenizer: {e}"))?;

            let session = ort::session::Session::builder()
                .map_err(|e| anyhow::anyhow!("Failed to create ort session builder: {e}"))?
                .commit_from_file(&model_file)
                .map_err(|e| anyhow::anyhow!("Failed to load reranker ONNX: {e}"))?;

            *self
                .session
                .lock()
                .map_err(|e| anyhow::anyhow!("Reranker session mutex poisoned: {e}"))? =
                Some(session);
            self.tokenizer = Some(tokenizer);
            self.model_path = Some(model_file.clone());
            self.loaded = true;

            let file_size = std::fs::metadata(&model_file).map(|m| m.len()).unwrap_or(0);

            tracing::info!(
                component = "Qwen3 Reranker",
                size_mb = file_size / 1_048_576,
                "Reranker loaded"
            );

            Ok(MemoryFootprint {
                ram_bytes: file_size,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            })
        }

        #[cfg(not(feature = "ort-backend"))]
        {
            anyhow::bail!("Qwen3 Reranker requires ort-backend feature — not compiled")
        }
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        #[cfg(feature = "ort-backend")]
        {
            *self
                .session
                .lock()
                .map_err(|e| anyhow::anyhow!("Reranker session mutex poisoned: {e}"))? = None;
            self.tokenizer = None;
        }
        self.model_path = None;
        self.loaded = false;
        tracing::info!(component = "Qwen3 Reranker", "Reranker unloaded");
        Ok(())
    }

    #[cfg(feature = "ort-backend")]
    #[tracing::instrument(skip(self, documents), fields(n = documents.len()))]
    fn rerank(&self, query: &str, documents: &[&str]) -> anyhow::Result<Vec<f32>> {
        if !self.loaded {
            anyhow::bail!("Reranker not loaded");
        }
        if documents.is_empty() {
            return Ok(Vec::new());
        }

        let tokenizer = self
            .tokenizer
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Tokenizer not loaded"))?;

        let mut guard = self
            .session
            .lock()
            .map_err(|e| anyhow::anyhow!("Reranker session mutex poisoned: {e}"))?;
        let session = guard
            .as_mut()
            .ok_or_else(|| anyhow::anyhow!("Reranker session not initialized"))?;

        let mut scores = Vec::with_capacity(documents.len());

        for doc in documents {
            // Cross-encoder input: concatenate query + SEP + document
            // HuggingFace tokenizers handle pair encoding natively
            let encoding = tokenizer
                .encode((query.to_string(), (*doc).to_string()), true)
                .map_err(|e| anyhow::anyhow!("Tokenizer pair encode failed: {e}"))?;

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
                anyhow::bail!("Empty token sequence for query/doc pair");
            }

            let input_ids = ndarray::Array2::<i64>::from_shape_vec((1, seq_len), ids)
                .map_err(|e| anyhow::anyhow!("Failed to build input_ids tensor: {e}"))?;
            let attention_mask = ndarray::Array2::<i64>::from_shape_vec((1, seq_len), mask)
                .map_err(|e| anyhow::anyhow!("Failed to build attention_mask tensor: {e}"))?;

            let v_ids = ort::value::Value::from_array(input_ids)
                .map_err(|e| anyhow::anyhow!("Failed to create ort Value for input_ids: {e}"))?;
            let v_mask = ort::value::Value::from_array(attention_mask).map_err(|e| {
                anyhow::anyhow!("Failed to create ort Value for attention_mask: {e}")
            })?;

            let outputs = session
                .run(ort::inputs![
                    "input_ids" => v_ids,
                    "attention_mask" => v_mask,
                ])
                .map_err(|e| anyhow::anyhow!("Reranker inference failed: {e}"))?;

            // Cross-encoder output is typically [1, 1] or [1] — a single logit
            let output_value = &outputs[0];
            let (_shape, data) = output_value
                .try_extract_tensor::<f32>()
                .map_err(|e| anyhow::anyhow!("Failed to extract reranker output: {e}"))?;

            // First element is the relevance logit. Apply sigmoid to get [0, 1] score.
            let logit = data.first().copied().unwrap_or(0.0);
            let score = sigmoid(logit);
            scores.push(score);
        }

        Ok(scores)
    }

    #[cfg(not(feature = "ort-backend"))]
    fn rerank(&self, _query: &str, _documents: &[&str]) -> anyhow::Result<Vec<f32>> {
        anyhow::bail!("Qwen3 Reranker requires ort-backend feature — not compiled")
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

/// Standard sigmoid — maps logit to probability in [0, 1].
#[cfg(feature = "ort-backend")]
#[inline]
fn sigmoid(x: f32) -> f32 {
    1.0 / (1.0 + (-x).exp())
}

/// Find the first non-encoder/decoder `*.onnx` file in a directory.
#[cfg(feature = "ort-backend")]
fn find_onnx_file(dir: &Path) -> anyhow::Result<PathBuf> {
    let entries = std::fs::read_dir(dir)
        .map_err(|e| anyhow::anyhow!("Failed to read directory {}: {e}", dir.display()))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("onnx") {
            let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
            if !stem.contains("encoder") && !stem.contains("decoder") {
                return Ok(path);
            }
        }
    }

    anyhow::bail!("No single-piece .onnx file found in {}", dir.display())
}
