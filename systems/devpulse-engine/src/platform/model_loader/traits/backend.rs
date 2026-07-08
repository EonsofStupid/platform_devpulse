//! Inference backend trait — the abstraction boundary between model-loader
//! and actual inference engines (Candle, llama.cpp).

use crate::platform::model_loader::loading::states::{LoadParams, MemoryFootprint};
use crate::platform::model_loader::models::registry::ModelMetadata;
use std::path::Path;

/// The abstraction boundary. Everything above this is backend-agnostic.
///
/// Both Candle and llama.cpp implement this trait. The `BackendPool` owns
/// instances and routes requests through `flume` channels.
///
/// All methods are sync — the async bridge wraps them in a dedicated thread.
pub trait InferenceBackend: Send {
    /// Load model weights into memory. Returns actual memory consumed.
    ///
    /// # Errors
    /// Returns error if file is corrupt, architecture unsupported, or out of memory.
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint>;

    /// Unload model and free all associated memory.
    ///
    /// # Errors
    /// Returns error if the backend's internal teardown (KV cache release,
    /// device handle drop, file handle close) fails.
    fn unload(&mut self) -> anyhow::Result<()>;

    /// Run a single forward pass. Returns logits for next token position.
    ///
    /// `tokens` — input token IDs.
    /// `position` — the position index for the forward pass (for KV cache).
    ///
    /// # Errors
    /// Returns error if no model is loaded, `tokens` exceeds the context
    /// window, `position` is out of range for the KV cache, or the
    /// underlying tensor / GGML op fails.
    fn forward(&self, tokens: &[u32], position: usize) -> anyhow::Result<Vec<f32>>;

    /// Tokenize text into token IDs using this model's tokenizer.
    ///
    /// # Errors
    /// Returns error if no tokenizer is attached to the loaded model or the
    /// tokenizer rejects the input (invalid bytes, unsupported script).
    fn tokenize(&self, text: &str) -> anyhow::Result<Vec<u32>>;

    /// Convert token IDs back to text.
    ///
    /// # Errors
    /// Returns error if no tokenizer is attached or any token ID falls
    /// outside the model's vocabulary range.
    fn detokenize(&self, tokens: &[u32]) -> anyhow::Result<String>;

    /// Current memory footprint of the loaded model.
    fn memory_usage(&self) -> MemoryFootprint;

    /// Model metadata (architecture, quant level, context length, etc.).
    fn metadata(&self) -> &ModelMetadata;
}
