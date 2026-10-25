//! `ChatSuggestEmbedder` — bridge from the model-loader's slot-bound
//! embed pool to the [`crate::connectome::cag::traits::Embedder`] trait.
//!
//! Behind the `model-loader` feature: pulling this in unconditionally
//! would force kernel-only builds to drag the inference toolchain. With
//! the gate, the bridge is only present when the engine is also
//! compiling against `model-loader` — which is the only configuration
//! that can construct it anyway.

use anyhow::Result;
use async_trait::async_trait;

use crate::connectome::cag::traits::Embedder;
use model_loader::ModelLoaderService;

/// 1024-dim Harrier 0.6B output. Hard-coded because the slot config
/// pins this — if the user swaps to a different embedder model the
/// engine should rebuild the bridge with the new dim from the slot
/// metadata, not silently lie about the output shape.
const HARRIER_06B_DIM: u32 = 1024;

/// Slot ID this bridge binds to. Must match
/// `kernel/model-loader/config/slots.default.toml`.
const SLOT_ID: &str = "chat.suggest";

/// `Embedder` impl that delegates to the model-loader's slot-bound
/// embed pool.
///
/// Holds a [`ModelLoaderService`] clone — the service is `#[derive(Clone)]`
/// over internal `Arc`s, so cloning is cheap and shares the underlying
/// pool with every other consumer (CAG pipeline, voice slot, etc.).
///
/// # Lifecycle
///
/// Construct once at platform boot after `chat.suggest` has loaded its
/// model. Hot-swap is supported by the model-loader's slot lifecycle:
/// when the user picks a different embedder for `chat.suggest`, the
/// pool's bound backend changes underneath us and the next `embed()`
/// call routes through the new backend automatically. No bridge
/// rebuild required.
pub struct ChatSuggestEmbedder {
    loader: ModelLoaderService,
    dim: u32,
}

impl ChatSuggestEmbedder {
    /// Build a bridge bound to the `chat.suggest` slot at the default
    /// dimensionality.
    ///
    /// Caller is responsible for ensuring the slot has been loaded —
    /// the bridge does not validate slot state at construction. First
    /// `embed()` call surfaces a slot-not-loaded error if the user
    /// tries to query before the model is ready.
    #[must_use]
    pub fn new(loader: ModelLoaderService) -> Self {
        Self {
            loader,
            dim: HARRIER_06B_DIM,
        }
    }

    /// Build a bridge with an explicit dimensionality override. Used by
    /// the engine when the user has swapped to a non-default embedder
    /// and the slot's metadata reports a different output dim.
    #[must_use]
    pub fn with_dim(loader: ModelLoaderService, dim: u32) -> Self {
        Self { loader, dim }
    }

    /// The slot id this bridge is bound to.
    #[must_use]
    pub fn slot_id() -> &'static str {
        SLOT_ID
    }
}

#[async_trait]
impl Embedder for ChatSuggestEmbedder {
    fn dimension(&self) -> u32 {
        self.dim
    }

    async fn embed(&self, text: &str) -> Result<Vec<f32>> {
        let texts = [text];
        let mut vecs = self
            .loader
            .embed(SLOT_ID, &texts)
            .await
            .map_err(|e| anyhow::anyhow!("chat.suggest embed failed: {e}"))?;
        vecs.pop()
            .ok_or_else(|| anyhow::anyhow!("chat.suggest returned empty vector batch"))
    }

    async fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        self.loader
            .embed(SLOT_ID, texts)
            .await
            .map_err(|e| anyhow::anyhow!("chat.suggest embed_batch failed: {e}"))
    }
}
