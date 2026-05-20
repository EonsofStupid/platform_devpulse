//! # `CortexBurnAdapter` ↔ `cag::Embedder` trait bridge
//!
//! Implements the kernel-internal [`Embedder`](crate::cortex::cag::Embedder)
//! trait directly on [`CortexBurnAdapter<B>`]. This is the seam that lets
//! the CAG pipeline (and any other consumer that holds `Arc<dyn
//! Embedder>`) reach the Burn-backed encoder uniformly with the
//! Candle / ONNX / suggest implementors.
//!
//! ## Why on the adapter, not on `BurnEmbedder`
//!
//! `BurnEmbedder<B>` is the weights-only Burn `Module` — a pure
//! `Tensor<B,2,Int> → Tensor<B,2>` transformation. It deliberately does
//! NOT carry a tokenizer because the `Module` derive treats every field
//! as a tracked parameter (`#[module(skip)]` notwithstanding — keeping
//! the Module pure is the simpler invariant).
//!
//! The `cag::Embedder` trait wants `text → Vec<f32>`. That's a
//! composition of (tokenize + forward + extract). `CortexBurnAdapter`
//! IS that composition — it already holds the tokenizer ArcSwap, the
//! RRD daemon, the geometry config, and the device. It is the DDD
//! aggregate root for the Burn-backed embedder pipeline.
//!
//! Adding a new wrapper struct (`EmbedderRunner<B>` etc.) would
//! duplicate the composition the adapter already encodes — a clear
//! violation of the no-duplicates principle. So the trait impl lives
//! here, on the existing adapter, in a sibling module so the impl
//! shows up at the same path as the struct it extends.
//!
//! ## Blocking discipline
//!
//! Burn's NdArray backend is synchronous CPU code; the forward pass
//! is a blocking compute. The trait's `async fn embed` returns a
//! Future that runs the work on whatever executor calls `.await`.
//! Callers wanting to keep an async runtime responsive MUST wrap the
//! call in `tokio::task::spawn_blocking` — this matches the existing
//! contract on [`CortexBurnAdapter::embed_text`] (`adapter.rs:159`,
//! "Async callers must wrap with `tokio::task::spawn_blocking`") and
//! the pattern used by [`super::super::suggest::embedder::ChatSuggestEmbedder`].

#![cfg(any(feature = "burn-cpu", feature = "burn-cuda"))]

use anyhow::Result;
use async_trait::async_trait;
use burn::prelude::Backend;

use super::adapter::CortexBurnAdapter;
use crate::cortex::cag::Embedder;

#[async_trait]
impl<B: Backend> Embedder for CortexBurnAdapter<B>
where
    B::Device: Default + Clone + Send + Sync + 'static,
{
    /// Output dimensionality reads from the loaded-or-boot-default
    /// geometry. Equal to `Qwen3Config::hidden_size`. Harrier 0.6B is
    /// 1024-d; Harrier 270M is smaller per its `config.json`.
    fn dimension(&self) -> u32 {
        self.config().model.hidden_size as u32
    }

    /// Embed a single text into a dense vector. Sync-blocking under
    /// the hood; the async signature matches the trait contract but
    /// the work runs on the calling thread. See module-level doc on
    /// blocking discipline.
    ///
    /// # Errors
    /// - Encoder not loaded (`load_blocking` not called yet).
    /// - Tokenizer not loaded (paired with the encoder, see
    ///   `tokenizer.rs`).
    /// - Tensor extraction failed (Burn `into_vec::<f32>` rejected
    ///   the tensor — typically a dtype mismatch between the loaded
    ///   model and the backend's `FloatElem`).
    async fn embed(&self, text: &str) -> Result<Vec<f32>> {
        let mut batch = self.embed_text(&[text])?;
        batch.pop().ok_or_else(|| {
            anyhow::anyhow!("CortexBurnAdapter::embed: empty batch from forward pass")
        })
    }

    /// Batch embed. Overrides the trait default (sequential
    /// `embed`) with one true batch through the Burn forward pass —
    /// the model amortizes attention compute across the batch
    /// dimension so a 32-row batch is much cheaper than 32 single
    /// calls.
    async fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        self.embed_text(texts)
    }
}
