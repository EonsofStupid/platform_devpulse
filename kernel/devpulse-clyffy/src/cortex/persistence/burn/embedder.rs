//! # Burn embedder pipeline — last-token pool + L2 normalize
//!
//! Wraps [`Qwen3Model`] as the RRO encoder per
//! `scripts/docs/specs/cortex/rro/RRO.md` v2.0.0 §4.4 Embedder Pipeline:
//!
//! 1. Tokenize  *(Phase C — HF tokenizers crate)*
//! 2. Forward pass through encoder (Burn) ← here
//! 3. Last-token pool from final hidden state ← here
//! 4. L2 normalize → 1024-dim dense vector ← here
//! 5. Sparse encoding via BM25 (lexical, no model)  *(Phase D)*
//!
//! Phase A delivers steps 2-4. Steps 1 and 5 are gated to their own
//! plans (`~/.claude/plans/boring-burn-foundation.md` §8 Phase B/C/D).

use burn::{
    config::Config,
    module::Module,
    prelude::Backend,
    tensor::{Int, Tensor},
};

use super::qwen3::{Qwen3Config, Qwen3Model};

/// Configuration for [`BurnEmbedder`]. Wraps [`Qwen3Config`] + post-pool
/// normalization toggle.
#[derive(Config, Debug)]
pub struct EmbedderConfig {
    /// Underlying Qwen3 transformer geometry.
    pub model: Qwen3Config,
    /// Whether to L2-normalize the pooled vector. Spec §4.4 step 4 says
    /// yes. Off only for unit tests that want raw pooled output.
    #[config(default = true)]
    pub normalize: bool,
}

/// Burn-backed embedder: text → 1024-dim dense vector (with random-init
/// weights in Phase A; Phase B loads real Harrier weights).
#[derive(Module, Debug)]
pub struct BurnEmbedder<B: Backend> {
    model: Qwen3Model<B>,
    /// Carrying the bool keeps `forward_pooled` self-contained. The
    /// `#[module(skip)]` annotation replaces the prior `Ignored<T>`
    /// wrapper deprecated in Burn 0.21 — the Module derive macro now
    /// requires explicit opt-out for non-tensor scalar state.
    #[module(skip)]
    normalize: bool,
}

impl<B: Backend> BurnEmbedder<B> {
    /// Initialise the embedder from an [`EmbedderConfig`] on the given device.
    pub fn new(config: &EmbedderConfig, device: &B::Device) -> Self {
        Self {
            model: Qwen3Model::new(&config.model, device),
            normalize: config.normalize,
        }
    }

    /// Construct from an already-loaded [`Qwen3Model`] — used by the
    /// `HotUpdateable` load path which assembles the model directly
    /// from safetensors instead of going through the random-init
    /// `new` constructor.
    #[must_use]
    pub fn from_loaded(model: Qwen3Model<B>, normalize: bool) -> Self {
        Self { model, normalize }
    }

    /// Borrow the device the underlying weights live on. Used by
    /// `HotUpdateable::validate` to build the synthetic input batch
    /// without threading a device handle through the snapshot.
    #[must_use]
    pub fn model_device(&self) -> B::Device {
        self.model.device()
    }

    /// Output dimension (= `model.hidden_size`).
    pub fn dimension(&self, config: &Qwen3Config) -> usize {
        config.hidden_size
    }

    /// Embed a batch of token sequences into pooled, normalized vectors.
    ///
    /// - `token_ids`: `[B, S]` Int
    /// - `attention_mask`: `[B, S]` Int — 1 = real token, 0 = pad
    ///
    /// Returns `[B, hidden_size]`.
    pub fn forward_pooled(
        &self,
        token_ids: Tensor<B, 2, Int>,
        attention_mask: Tensor<B, 2, Int>,
    ) -> Tensor<B, 2> {
        let hidden = self.model.forward(token_ids, attention_mask.clone());
        let pooled = pool_last_token(hidden, attention_mask);
        if self.normalize {
            l2_normalize(pooled)
        } else {
            pooled
        }
    }
}

/// Pool the hidden state at the last unmasked position per row.
///
/// - `hidden`: `[B, S, H]`
/// - `attention_mask`: `[B, S]` Int — 1 = real token, 0 = pad
///
/// For each row `b`, returns `hidden[b, last_pos_b, :]` where
/// `last_pos_b = sum(mask[b]) - 1`. Output: `[B, H]`.
///
/// Public so Phase A tests can verify pooling correctness against a
/// known hidden state without spinning up a full forward pass.
pub fn pool_last_token<B: Backend>(
    hidden: Tensor<B, 3>,
    attention_mask: Tensor<B, 2, Int>,
) -> Tensor<B, 2> {
    let [batch, _seq, hidden_size] = hidden.dims();

    // last_pos[b] = sum(mask[b]) - 1, as Int [B, 1]
    let last_pos = attention_mask.sum_dim(1).sub_scalar(1); // [B, 1] Int

    // Broadcast last_pos to [B, 1, H] for gather along seq dim.
    let indices = last_pos
        .unsqueeze_dim::<3>(2)
        .expand([batch, 1, hidden_size]);

    // gather along dim=1 (seq): output [B, 1, H]
    let pooled = hidden.gather(1, indices);

    pooled.squeeze_dim::<2>(1)
}

/// L2-normalize each row to unit length. Rows whose norm is exactly 0
/// are left alone (no division by zero).
pub fn l2_normalize<B: Backend>(x: Tensor<B, 2>) -> Tensor<B, 2> {
    // norm[b] = sqrt(sum(x[b]^2)) → [B, 1]
    let norm = x.clone().powi_scalar(2).sum_dim(1).sqrt();
    // Clamp to avoid divide-by-zero on all-zero rows.
    let norm = norm.clamp_min(1.0e-12);
    x.div(norm)
}
