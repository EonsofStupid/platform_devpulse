//! # Qwen3 transformer in Burn — RRO encoder authorship target
//!
//! Real Qwen3 architecture authored against the Burn ML framework, per
//! `scripts/docs/specs/cortex/rro/RRO.md` v2.0.0 §4.3 Encoder. Bootstrap
//! geometry is **Harrier 0.6B** (`microsoft/harrier-oss-v1-0.6b`); the
//! long-term target per spec §4.3 is the custom 0.5B model trained on
//! Burn for end-to-end framework alignment.
//!
//! ## Architecture (Harrier 0.6B `config.json`)
//!
//! - 28 transformer decoder layers, all full-attention
//! - `hidden_size` = 1024
//! - `num_attention_heads` = 16, `num_key_value_heads` = 8 (GQA 2:1)
//! - `head_dim` = 128
//! - `intermediate_size` = 3072
//! - `rms_norm_eps` = 1e-6
//! - `rope_theta` = `1_000_000`
//! - silu activation in `SwiGLU` MLP
//! - `tie_word_embeddings` = true (`lm_head` reuses input embedding — not
//!   authored here since the embedder pools final hidden states; there
//!   is no vocab projection in this slice)
//! - `vocab_size` = `151_936`
//! - `max_position_embeddings` = `32_768`
//!
//! ## Authorship constraint — no `burn::nn::*`, no `Param<T>`
//!
//! Per `HOT_UPDATE_PATTERN.md` §7.1: Burn 0.20.1's `Param<T>` wraps
//! every parameter in `Option<RwLock<Option<Uninitialized<T>>>>` for
//! lazy initialization. `Uninitialized<T>` holds a
//! `Box<dyn FnOnce(...) + Send>` (the init closure) and a
//! `std::cell::OnceCell<T>` (the cached materialized tensor). Both are
//! `!Sync`, so any struct that uses `nn::Linear` / `nn::Embedding` /
//! `nn::RmsNorm` is `!Sync` — which makes `ArcSwap<Arc<Encoder>>` fail
//! to compile against `HOT_UPDATE_PATTERN.md` §12 verification 1.
//!
//! Mitigation per H1: this file authors all parameters as **raw
//! `Tensor<B, ?>` fields** (`Qwen3Linear`, `Qwen3Embedding`,
//! `Qwen3RmsNorm` below). `Tensor<NdArray, ?>` is `Sync` (verified at
//! [burn/mod.rs] probe), so the resulting `Qwen3Model<NdArray>` is
//! `Sync` and ArcSwap-ready. Loss vs `nn::*`: no auto-Record
//! serialization helper — Phase B authors the safetensors loader by
//! filling these fields directly.
//!
//! ## Phase A boundary
//!
//! This file delivers the architecture + a forward pass with random-init
//! weights. Loading real Harrier safetensors is **Phase B** (separate
//! plan: HF tensor naming `model.embed_tokens.weight` ↔ this file's
//! `embed_tokens.weight` field). Tokenizer wiring is **Phase C**.

use burn::{
    config::Config,
    module::Module,
    prelude::Backend,
    tensor::{Distribution, Int, Tensor, activation},
};

// ─────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────

/// Configuration for [`Qwen3Model`]. Defaults match Harrier 0.6B.
#[derive(Config, Debug)]
pub struct Qwen3Config {
    /// Token vocabulary size (`151_936` for Harrier).
    #[config(default = 151_936)]
    pub vocab_size: usize,
    /// Hidden state dimension `H` (output embedding size).
    #[config(default = 1024)]
    pub hidden_size: usize,
    /// Number of decoder layers.
    #[config(default = 28)]
    pub num_hidden_layers: usize,
    /// Number of query heads.
    #[config(default = 16)]
    pub num_attention_heads: usize,
    /// Number of key/value heads (`< num_attention_heads` enables GQA).
    #[config(default = 8)]
    pub num_key_value_heads: usize,
    /// Per-head dimension. `num_attention_heads * head_dim == hidden_size`.
    #[config(default = 128)]
    pub head_dim: usize,
    /// `SwiGLU` intermediate dimension.
    #[config(default = 3072)]
    pub intermediate_size: usize,
    /// `RMSNorm` numerical-stability epsilon.
    #[config(default = 1.0e-6)]
    pub rms_norm_eps: f64,
    /// `RoPE` frequency base (`theta`).
    #[config(default = 1_000_000.0)]
    pub rope_theta: f64,
    /// Maximum supported position index. Determines `RoPE` cache size.
    #[config(default = 32768)]
    pub max_position_embeddings: usize,
}

impl Qwen3Config {
    /// GQA group size: how many query heads share one KV head.
    pub fn n_kv_groups(&self) -> usize {
        self.num_attention_heads / self.num_key_value_heads
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Sync-clean primitives — raw-Tensor replacements for `burn::nn::*`
// ─────────────────────────────────────────────────────────────────────────

/// Linear projection without bias, authored from raw `Tensor<B, 2>`.
///
/// Replaces `burn::nn::Linear` so the containing module stays `Sync`
/// (see file-level docs). Forward computes `y = x @ W` for rank-3 input
/// `[B, S, in_features]` against weight `[in_features, out_features]`.
#[derive(Module, Debug)]
pub struct Qwen3Linear<B: Backend> {
    /// Weight matrix, shape `[in_features, out_features]`. Crate-private;
    /// reach via [`Self::new`] / [`Self::from_weight`].
    pub(crate) weight: Tensor<B, 2>,
}

impl<B: Backend> Qwen3Linear<B> {
    /// Construct from an already-loaded weight tensor. Used by the
    /// safetensors loader after the per-tensor transpose.
    pub(crate) fn from_weight(weight: Tensor<B, 2>) -> Self {
        Self { weight }
    }

    /// Initialise with `Normal(0, 1/sqrt(in_features))` — Xavier-style
    /// scaling that keeps activations finite at depth-28 random init.
    pub fn new(in_features: usize, out_features: usize, device: &B::Device) -> Self {
        // f64 precision loss on the `usize` widening is acceptable: in_features
        // for Qwen3 layers is at most `intermediate_size` (~3072 for Harrier
        // 0.6B), well under 2^52. The cast is exact for every realistic config.
        #[expect(
            clippy::cast_precision_loss,
            reason = "in_features bounded by intermediate_size ≪ 2^52 in every Qwen3 config"
        )]
        let stddev = 1.0 / (in_features as f64).sqrt();
        let weight = Tensor::random(
            [in_features, out_features],
            Distribution::Normal(0.0, stddev),
            device,
        );
        Self { weight }
    }

    /// Forward pass on rank-3 input. Reshape-matmul-reshape avoids the
    /// rank-mismatch issue with bare `Tensor::matmul` (which requires
    /// equal-rank operands).
    pub fn forward(&self, x: Tensor<B, 3>) -> Tensor<B, 3> {
        let [batch, seq, in_features] = x.dims();
        let [_, out_features] = self.weight.dims();
        let x_2d = x.reshape([batch * seq, in_features]);
        let y_2d = x_2d.matmul(self.weight.clone());
        y_2d.reshape([batch, seq, out_features])
    }
}

/// Token embedding lookup, authored from raw `Tensor<B, 2>`.
///
/// Replaces `burn::nn::Embedding`. Forward gathers rows from the weight
/// matrix indexed by token ids.
#[derive(Module, Debug)]
pub struct Qwen3Embedding<B: Backend> {
    /// Embedding matrix, shape `[vocab_size, hidden_size]`.
    /// Crate-private; reach via [`Self::new`] / [`Self::from_weight`].
    pub(crate) weight: Tensor<B, 2>,
}

impl<B: Backend> Qwen3Embedding<B> {
    /// Construct from an already-loaded weight tensor. Used by the
    /// safetensors loader.
    pub(crate) fn from_weight(weight: Tensor<B, 2>) -> Self {
        Self { weight }
    }

    /// Initialise with `Normal(0, 0.02)` — GPT-2-family default that
    /// keeps the random-init forward pass producing finite hidden states
    /// even before real Harrier weights load.
    pub fn new(vocab_size: usize, hidden_size: usize, device: &B::Device) -> Self {
        let weight = Tensor::random(
            [vocab_size, hidden_size],
            Distribution::Normal(0.0, 0.02),
            device,
        );
        Self { weight }
    }

    /// Forward gather: `indices: [B, S]` → output `[B, S, hidden_size]`.
    /// Implemented via flatten-select-reshape because Burn's `select`
    /// expects rank-1 indices.
    pub fn forward(&self, indices: Tensor<B, 2, Int>) -> Tensor<B, 3> {
        let [batch, seq] = indices.dims();
        let [_, hidden] = self.weight.dims();
        let flat = indices.reshape([batch * seq]);
        let gathered = self.weight.clone().select(0, flat); // [B*S, H]
        gathered.reshape([batch, seq, hidden])
    }
}

/// Root-mean-square layer norm, authored from raw `Tensor<B, 1>`.
///
/// Replaces `burn::nn::RmsNorm`. Computes
/// `x * rsqrt(mean(x², dim=-1) + eps) * weight` over the last dim.
/// Weight initialises to ones (`RMSNorm` convention).
#[derive(Module, Debug)]
pub struct Qwen3RmsNorm<B: Backend> {
    /// Per-feature scale, shape `[hidden_size]`. Crate-private;
    /// reach via [`Self::new`] / [`Self::from_weight`].
    pub(crate) weight: Tensor<B, 1>,
    /// Numerical-stability epsilon, stored on the Module so each
    /// instance carries its config (matches `nn::RmsNorm` shape).
    pub(crate) eps: f64,
}

impl<B: Backend> Qwen3RmsNorm<B> {
    /// Construct from an already-loaded scale tensor. Used by the
    /// safetensors loader.
    pub(crate) fn from_weight(weight: Tensor<B, 1>, eps: f64) -> Self {
        Self { weight, eps }
    }

    /// Initialise weight to ones (`RMSNorm` identity at init).
    pub fn new(hidden_size: usize, eps: f64, device: &B::Device) -> Self {
        let weight = Tensor::ones([hidden_size], device);
        Self { weight, eps }
    }

    /// Forward over `[B, S, H]`: normalize each token's hidden vector
    /// to unit RMS, then per-feature scale by `weight`.
    pub fn forward(&self, x: Tensor<B, 3>) -> Tensor<B, 3> {
        // variance = mean(x^2, dim=-1, keepdim=true) → [B, S, 1]
        let variance = x.clone().powi_scalar(2).mean_dim(2);
        // scale = 1 / sqrt(variance + eps) → [B, S, 1]
        let scale = variance.add_scalar(self.eps).sqrt().recip();
        // Broadcast multiply: [B, S, H] * [B, S, 1] → [B, S, H]
        let normalized = x.mul(scale);
        // Promote weight [H] → [1, 1, H] for broadcast against [B, S, H].
        let weight = self.weight.clone().unsqueeze::<3>();
        normalized.mul(weight)
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Rotary positional embedding (RoPE)
// ─────────────────────────────────────────────────────────────────────────

/// Precomputed cos/sin `RoPE` tables.
///
/// Tables are constant for a given `(max_pos, head_dim, theta)` triple, so
/// they're stored as plain tensors inside the Module. Apply via
/// [`Qwen3Rope::apply`] to query/key tensors before the attention dot
/// product.
#[derive(Module, Debug)]
pub struct Qwen3Rope<B: Backend> {
    /// `[max_pos, head_dim/2]`
    cos: Tensor<B, 2>,
    /// `[max_pos, head_dim/2]`
    sin: Tensor<B, 2>,
}

impl<B: Backend> Qwen3Rope<B> {
    /// Build the `RoPE` cache for `max_pos` positions and `head_dim` per-head
    /// dimensions, with frequency base `theta`.
    ///
    /// # Panics
    ///
    /// Panics if `head_dim` is odd. `RoPE` rotates pairs of features, so the
    /// per-head dimension must be even for the rotation matrix to fit.
    pub fn new(max_pos: usize, head_dim: usize, theta: f64, device: &B::Device) -> Self {
        assert!(head_dim.is_multiple_of(2), "head_dim must be even for RoPE");
        let half = head_dim / 2;

        // inv_freq[i] = 1 / theta^(2i / head_dim) for i in 0..half
        // f64 precision loss on `usize → f64` is acceptable: head_dim is
        // bounded by 256 in every realistic Qwen3 config (Harrier uses 128);
        // `i` ranges over 0..half ≤ 128. Both fit exactly in f64's mantissa.
        #[expect(
            clippy::cast_precision_loss,
            reason = "i and head_dim both ≪ 2^52 — head_dim ≤ 256 in every realistic Qwen3 config"
        )]
        let inv_freq_data: Vec<f32> = (0..half)
            .map(|i| (1.0 / theta.powf(2.0 * (i as f64) / (head_dim as f64))) as f32)
            .collect();
        let inv_freq: Tensor<B, 1> = Tensor::from_floats(inv_freq_data.as_slice(), device);

        // `max_pos` is bounded by `max_position_embeddings` (≤ 32_768 in every
        // realistic Qwen3 config); `p` ranges 0..max_pos. Both fit exactly in
        // f32's 23-bit mantissa (max representable integer is 2^24 = 16_777_216).
        #[expect(
            clippy::cast_precision_loss,
            reason = "p ≤ max_position_embeddings ≤ 32_768 ≪ 2^24 — exact in f32"
        )]
        let positions_data: Vec<f32> = (0..max_pos).map(|p| p as f32).collect();
        let positions: Tensor<B, 1> = Tensor::from_floats(positions_data.as_slice(), device);

        // freqs[p, i] = positions[p] * inv_freq[i] → [max_pos, half]
        let positions = positions.reshape([max_pos, 1]);
        let inv_freq = inv_freq.reshape([1, half]);
        let freqs = positions.matmul(inv_freq);

        let cos = freqs.clone().cos();
        let sin = freqs.sin();

        Self { cos, sin }
    }

    /// Apply rotary embedding to `x` of shape `[B, n_heads, S, head_dim]`.
    ///
    /// Phase A assumes contiguous positions `0..seq_len` (no KV cache,
    /// no incremental decode). Phase C+ may add a `position_ids` arg.
    pub fn apply(&self, x: Tensor<B, 4>) -> Tensor<B, 4> {
        let [batch, n_heads, seq, head_dim] = x.dims();
        let half = head_dim / 2;

        // Slice per-position cos/sin out of the cache, broadcast to the
        // full [B, n_heads, S, half] shape via reshape.
        let cos = self
            .cos
            .clone()
            .slice([0..seq, 0..half])
            .reshape([1, 1, seq, half]);
        let sin = self
            .sin
            .clone()
            .slice([0..seq, 0..half])
            .reshape([1, 1, seq, half]);

        // Split last dim into two halves: x1 = x[..., :half], x2 = x[..., half:].
        let x1 = x.clone().slice([0..batch, 0..n_heads, 0..seq, 0..half]);
        let x2 = x.slice([0..batch, 0..n_heads, 0..seq, half..head_dim]);

        // Rotation: (x1 * cos - x2 * sin, x2 * cos + x1 * sin).
        let rotated_1 = x1.clone().mul(cos.clone()) - x2.clone().mul(sin.clone());
        let rotated_2 = x2.mul(cos) + x1.mul(sin);

        Tensor::cat(vec![rotated_1, rotated_2], 3)
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Attention (Grouped-Query)
// ─────────────────────────────────────────────────────────────────────────

/// Grouped-query attention block (Qwen3 flavour).
///
/// Fields are crate-private — the random-init `Self::new` and the
/// safetensors loader's [`Self::from_components`] are the only two
/// construction paths. External callers invariant-check via those
/// constructors, never by reaching in.
#[derive(Module, Debug)]
pub struct Qwen3Attention<B: Backend> {
    pub(crate) q_proj: Qwen3Linear<B>,
    pub(crate) k_proj: Qwen3Linear<B>,
    pub(crate) v_proj: Qwen3Linear<B>,
    pub(crate) o_proj: Qwen3Linear<B>,
    pub(crate) rope: Qwen3Rope<B>,
    pub(crate) n_q_heads: usize,
    pub(crate) n_kv_heads: usize,
    pub(crate) head_dim: usize,
    pub(crate) n_kv_groups: usize,
    pub(crate) scale: f64,
}

/// Loader-side bundle of the four learnt projections + `RoPE` cache + the
/// derived geometry needed to construct a [`Qwen3Attention`]. Authored as
/// a struct so [`Qwen3Attention::from_components`] takes one parameter
/// instead of the eight individual fields (clippy `too_many_arguments`).
pub(crate) struct Qwen3AttentionParts<B: Backend> {
    pub(crate) q_proj: Qwen3Linear<B>,
    pub(crate) k_proj: Qwen3Linear<B>,
    pub(crate) v_proj: Qwen3Linear<B>,
    pub(crate) o_proj: Qwen3Linear<B>,
    pub(crate) rope: Qwen3Rope<B>,
    pub(crate) n_q_heads: usize,
    pub(crate) n_kv_heads: usize,
    pub(crate) head_dim: usize,
}

impl<B: Backend> Qwen3Attention<B> {
    /// Construct from already-loaded projection matrices + the
    /// derived geometry. Used by the safetensors loader. The
    /// `n_kv_groups` and `scale` are derived from the geometry args
    /// instead of taken as parameters so the loader can't mismatch
    /// them.
    pub(crate) fn from_components(parts: Qwen3AttentionParts<B>) -> Self {
        let Qwen3AttentionParts {
            q_proj,
            k_proj,
            v_proj,
            o_proj,
            rope,
            n_q_heads,
            n_kv_heads,
            head_dim,
        } = parts;
        // `head_dim` is bounded by 256 in every realistic Qwen3 config
        // (Harrier 0.6B uses 128). Exact in f64.
        #[expect(
            clippy::cast_precision_loss,
            reason = "head_dim ≤ 256 in every realistic Qwen3 config ≪ 2^52"
        )]
        let scale = 1.0 / (head_dim as f64).sqrt();
        Self {
            q_proj,
            k_proj,
            v_proj,
            o_proj,
            rope,
            n_q_heads,
            n_kv_heads,
            head_dim,
            n_kv_groups: n_q_heads / n_kv_heads,
            scale,
        }
    }

    /// Initialise from a [`Qwen3Config`] on the given device.
    pub fn new(config: &Qwen3Config, device: &B::Device) -> Self {
        let q_dim = config.num_attention_heads * config.head_dim;
        let kv_dim = config.num_key_value_heads * config.head_dim;

        let q_proj = Qwen3Linear::new(config.hidden_size, q_dim, device);
        let k_proj = Qwen3Linear::new(config.hidden_size, kv_dim, device);
        let v_proj = Qwen3Linear::new(config.hidden_size, kv_dim, device);
        let o_proj = Qwen3Linear::new(q_dim, config.hidden_size, device);

        let rope = Qwen3Rope::new(
            config.max_position_embeddings,
            config.head_dim,
            config.rope_theta,
            device,
        );

        // `head_dim` is bounded by 256 in every realistic Qwen3 config
        // (Harrier 0.6B uses 128). Exact in f64.
        #[expect(
            clippy::cast_precision_loss,
            reason = "head_dim ≤ 256 in every realistic Qwen3 config ≪ 2^52"
        )]
        let scale = 1.0 / (config.head_dim as f64).sqrt();
        Self {
            q_proj,
            k_proj,
            v_proj,
            o_proj,
            rope,
            n_q_heads: config.num_attention_heads,
            n_kv_heads: config.num_key_value_heads,
            head_dim: config.head_dim,
            n_kv_groups: config.n_kv_groups(),
            scale,
        }
    }

    /// Forward.
    ///
    /// - `hidden`: `[B, S, H]`
    /// - `attention_mask`: `[B, S]` — 1 = real token, 0 = pad. Currently
    ///   used only as additive mask for padded keys (no causal mask —
    ///   Qwen3 used as encoder for embedding, bidirectional context).
    ///
    /// Returns `[B, S, H]`.
    pub fn forward(&self, hidden: Tensor<B, 3>, attention_mask: Tensor<B, 2, Int>) -> Tensor<B, 3> {
        let [batch, seq, _hidden_size] = hidden.dims();

        // Project to Q, K, V.
        let q = self.q_proj.forward(hidden.clone()); // [B, S, n_q*D]
        let k = self.k_proj.forward(hidden.clone()); // [B, S, n_kv*D]
        let v = self.v_proj.forward(hidden); // [B, S, n_kv*D]

        // Reshape to head-major: [B, S, n_h, D] → [B, n_h, S, D].
        let q = q
            .reshape([batch, seq, self.n_q_heads, self.head_dim])
            .swap_dims(1, 2);
        let k = k
            .reshape([batch, seq, self.n_kv_heads, self.head_dim])
            .swap_dims(1, 2);
        let v = v
            .reshape([batch, seq, self.n_kv_heads, self.head_dim])
            .swap_dims(1, 2);

        // Apply RoPE to q and k.
        let q = self.rope.apply(q);
        let k = self.rope.apply(k);

        // Repeat KV heads to match Q heads (GQA): [B, n_kv, S, D] →
        // [B, n_q, S, D] by repeating each KV head `n_kv_groups` times
        // along the heads dim.
        let k = repeat_kv_heads(k, self.n_kv_groups);
        let v = repeat_kv_heads(v, self.n_kv_groups);

        // Scaled dot product: scores = Q @ K^T / sqrt(D) → [B, n_q, S, S]
        let scores = q.matmul(k.swap_dims(2, 3)).mul_scalar(self.scale);

        // Additive mask from attention_mask: pad positions (mask==0) get
        // a large negative bias so softmax assigns ~0 weight.
        // mask: [B, S] → [B, 1, 1, S] additive in {0, -1e9}.
        let neg_inf: f32 = -1.0e9;
        let mask_f = attention_mask.float(); // [B, S]
        let bias = mask_f
            .clone()
            .sub_scalar(1.0) // 0 → -1, 1 → 0
            .mul_scalar(f64::from(-neg_inf)) // -1 → neg_inf, 0 → 0  ⇒  mask==0 → neg_inf
            .reshape([batch, 1, 1, seq]);
        let scores = scores + bias;

        let attn = activation::softmax(scores, 3);

        // Weighted sum: attn @ V → [B, n_q, S, D]
        let out = attn.matmul(v);

        // Merge heads: [B, n_q, S, D] → [B, S, n_q*D]
        let out = out
            .swap_dims(1, 2)
            .reshape([batch, seq, self.n_q_heads * self.head_dim]);

        self.o_proj.forward(out)
    }
}

/// Repeat each KV head `n_groups` times along the heads dim.
///
/// `[B, n_kv, S, D]` → `[B, n_kv * n_groups, S, D]`. Each KV head appears
/// `n_groups` consecutive times so it lines up with the corresponding
/// Q-head block when GQA is `n_q_heads / n_kv_heads = n_groups`.
fn repeat_kv_heads<B: Backend>(t: Tensor<B, 4>, n_groups: usize) -> Tensor<B, 4> {
    if n_groups == 1 {
        return t;
    }
    let [batch, n_kv, seq, head_dim] = t.dims();
    // Insert a group dim and expand: [B, n_kv, 1, S, D] → [B, n_kv, G, S, D]
    // → [B, n_kv*G, S, D].
    t.reshape([batch, n_kv, 1, seq, head_dim])
        .repeat_dim(2, n_groups)
        .reshape([batch, n_kv * n_groups, seq, head_dim])
}

// ─────────────────────────────────────────────────────────────────────────
// MLP (SwiGLU)
// ─────────────────────────────────────────────────────────────────────────

/// `SwiGLU` MLP block (`down(silu(gate(x)) * up(x))`).
///
/// Field names match the `SwiGLU` formula component roles (`gate`, `up`,
/// `down`) rather than echoing the HF safetensors postfix `_proj`. The
/// loader translates HF keys (`mlp.gate_proj.weight`) to these field
/// names by hand; the rename keeps the in-process surface clippy-clean
/// (`struct_field_names`) without disturbing the on-disk contract.
///
/// Fields are crate-private; construct via `Self::new` (random init)
/// or [`Self::from_components`] (loaded from safetensors).
#[derive(Module, Debug)]
pub struct Qwen3Mlp<B: Backend> {
    pub(crate) gate: Qwen3Linear<B>,
    pub(crate) up: Qwen3Linear<B>,
    pub(crate) down: Qwen3Linear<B>,
}

impl<B: Backend> Qwen3Mlp<B> {
    /// Construct from already-loaded projection matrices. Used by
    /// the safetensors loader.
    pub(crate) fn from_components(
        gate: Qwen3Linear<B>,
        up: Qwen3Linear<B>,
        down: Qwen3Linear<B>,
    ) -> Self {
        Self { gate, up, down }
    }

    /// Initialise from a [`Qwen3Config`] on the given device.
    pub fn new(config: &Qwen3Config, device: &B::Device) -> Self {
        let gate = Qwen3Linear::new(config.hidden_size, config.intermediate_size, device);
        let up = Qwen3Linear::new(config.hidden_size, config.intermediate_size, device);
        let down = Qwen3Linear::new(config.intermediate_size, config.hidden_size, device);
        Self { gate, up, down }
    }

    /// Forward pass: `SwiGLU` on `[B, S, H]` input, returns `[B, S, H]`.
    pub fn forward(&self, x: Tensor<B, 3>) -> Tensor<B, 3> {
        let gate = activation::silu(self.gate.forward(x.clone()));
        let up = self.up.forward(x);
        self.down.forward(gate.mul(up))
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Decoder layer
// ─────────────────────────────────────────────────────────────────────────

/// One Qwen3 decoder layer: pre-LN attention + pre-LN MLP, both residual.
///
/// Fields are crate-private; construct via `Self::new` (random init)
/// or [`Self::from_components`] (loaded from safetensors).
#[derive(Module, Debug)]
pub struct Qwen3DecoderLayer<B: Backend> {
    pub(crate) input_norm: Qwen3RmsNorm<B>,
    pub(crate) attention: Qwen3Attention<B>,
    pub(crate) post_attn_norm: Qwen3RmsNorm<B>,
    pub(crate) mlp: Qwen3Mlp<B>,
}

impl<B: Backend> Qwen3DecoderLayer<B> {
    /// Construct from already-loaded sub-modules. Used by the
    /// safetensors loader.
    pub(crate) fn from_components(
        input_norm: Qwen3RmsNorm<B>,
        attention: Qwen3Attention<B>,
        post_attn_norm: Qwen3RmsNorm<B>,
        mlp: Qwen3Mlp<B>,
    ) -> Self {
        Self {
            input_norm,
            attention,
            post_attn_norm,
            mlp,
        }
    }

    /// Initialise from a [`Qwen3Config`] on the given device.
    pub fn new(config: &Qwen3Config, device: &B::Device) -> Self {
        let input_norm = Qwen3RmsNorm::new(config.hidden_size, config.rms_norm_eps, device);
        let post_attn_norm = Qwen3RmsNorm::new(config.hidden_size, config.rms_norm_eps, device);
        Self {
            input_norm,
            attention: Qwen3Attention::new(config, device),
            post_attn_norm,
            mlp: Qwen3Mlp::new(config, device),
        }
    }

    /// Forward pass through this decoder layer.
    pub fn forward(&self, hidden: Tensor<B, 3>, attention_mask: Tensor<B, 2, Int>) -> Tensor<B, 3> {
        // Pre-LN attention.
        let normed = self.input_norm.forward(hidden.clone());
        let attn_out = self.attention.forward(normed, attention_mask);
        let hidden = hidden + attn_out;

        // Pre-LN MLP.
        let normed = self.post_attn_norm.forward(hidden.clone());
        let mlp_out = self.mlp.forward(normed);
        hidden + mlp_out
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Full model
// ─────────────────────────────────────────────────────────────────────────

/// Full Qwen3 transformer: embedding → N decoder layers → final `RMSNorm`.
#[derive(Module, Debug)]
pub struct Qwen3Model<B: Backend> {
    pub(crate) embed_tokens: Qwen3Embedding<B>,
    pub(crate) layers: Vec<Qwen3DecoderLayer<B>>,
    pub(crate) final_norm: Qwen3RmsNorm<B>,
}

impl<B: Backend> Qwen3Model<B> {
    /// Construct from already-loaded components. Used by the
    /// safetensors loader. The loader builds the full layer stack
    /// in-place; this constructor just plugs the assembled pieces
    /// into the Module shell.
    pub(crate) fn from_components(
        embed_tokens: Qwen3Embedding<B>,
        layers: Vec<Qwen3DecoderLayer<B>>,
        final_norm: Qwen3RmsNorm<B>,
    ) -> Self {
        Self {
            embed_tokens,
            layers,
            final_norm,
        }
    }

    /// Borrow the device the loaded weights live on. Used by
    /// `BurnEmbedder::model_device` so the validate path can
    /// build a synthetic input tensor without threading the source's
    /// device through the snapshot.
    pub(crate) fn device(&self) -> B::Device {
        self.embed_tokens.weight.device()
    }

    /// Initialise the full transformer from a [`Qwen3Config`].
    pub fn new(config: &Qwen3Config, device: &B::Device) -> Self {
        let embed_tokens = Qwen3Embedding::new(config.vocab_size, config.hidden_size, device);

        let mut layers = Vec::with_capacity(config.num_hidden_layers);
        for _ in 0..config.num_hidden_layers {
            layers.push(Qwen3DecoderLayer::new(config, device));
        }

        let final_norm = Qwen3RmsNorm::new(config.hidden_size, config.rms_norm_eps, device);

        Self {
            embed_tokens,
            layers,
            final_norm,
        }
    }

    /// Forward.
    ///
    /// - `token_ids`: `[B, S]` Int — token ids in `[0, vocab_size)`.
    /// - `attention_mask`: `[B, S]` Int — 1 = real token, 0 = pad.
    ///
    /// Returns `[B, S, hidden_size]` — final hidden states after
    /// the last decoder layer + final `RMSNorm`.
    pub fn forward(
        &self,
        token_ids: Tensor<B, 2, Int>,
        attention_mask: &Tensor<B, 2, Int>,
    ) -> Tensor<B, 3> {
        let mut hidden = self.embed_tokens.forward(token_ids);
        for layer in &self.layers {
            hidden = layer.forward(hidden, attention_mask.clone());
        }
        self.final_norm.forward(hidden)
    }
}
