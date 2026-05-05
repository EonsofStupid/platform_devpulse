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
//! - hidden_size = 1024
//! - num_attention_heads = 16, num_key_value_heads = 8 (GQA 2:1)
//! - head_dim = 128
//! - intermediate_size = 3072
//! - rms_norm_eps = 1e-6
//! - rope_theta = 1_000_000
//! - silu activation in SwiGLU MLP
//! - tie_word_embeddings = true (lm_head reuses input embedding — not
//!   authored here since the embedder pools final hidden states; there
//!   is no vocab projection in this slice)
//! - vocab_size = 151_936
//! - max_position_embeddings = 32_768
//!
//! ## Phase A boundary
//!
//! This file delivers the architecture + a forward pass with random-init
//! weights. Loading real Harrier safetensors is **Phase B** (separate
//! plan: HF tensor naming `model.embed_tokens.weight` ↔ Burn module
//! record paths). Tokenizer wiring is **Phase C**.

use burn::{
    config::Config,
    module::Module,
    nn::{Embedding, EmbeddingConfig, Linear, LinearConfig, RmsNorm, RmsNormConfig},
    prelude::Backend,
    tensor::{activation, Int, Tensor},
};

// ─────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────

/// Configuration for [`Qwen3Model`]. Defaults match Harrier 0.6B.
#[derive(Config, Debug)]
pub struct Qwen3Config {
    /// Token vocabulary size (151_936 for Harrier).
    #[config(default = 151936)]
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
    /// SwiGLU intermediate dimension.
    #[config(default = 3072)]
    pub intermediate_size: usize,
    /// RMSNorm numerical-stability epsilon.
    #[config(default = 1.0e-6)]
    pub rms_norm_eps: f64,
    /// RoPE frequency base (`theta`).
    #[config(default = 1_000_000.0)]
    pub rope_theta: f64,
    /// Maximum supported position index. Determines RoPE cache size.
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
// Rotary positional embedding (RoPE)
// ─────────────────────────────────────────────────────────────────────────

/// Precomputed cos/sin RoPE tables.
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
    /// Build the RoPE cache for `max_pos` positions and `head_dim` per-head
    /// dimensions, with frequency base `theta`.
    pub fn new(max_pos: usize, head_dim: usize, theta: f64, device: &B::Device) -> Self {
        assert!(head_dim % 2 == 0, "head_dim must be even for RoPE");
        let half = head_dim / 2;

        // inv_freq[i] = 1 / theta^(2i / head_dim) for i in 0..half
        let inv_freq_data: Vec<f32> = (0..half)
            .map(|i| (1.0 / theta.powf(2.0 * (i as f64) / (head_dim as f64))) as f32)
            .collect();
        let inv_freq: Tensor<B, 1> = Tensor::from_floats(inv_freq_data.as_slice(), device);

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
#[derive(Module, Debug)]
pub struct Qwen3Attention<B: Backend> {
    q_proj: Linear<B>,
    k_proj: Linear<B>,
    v_proj: Linear<B>,
    o_proj: Linear<B>,
    rope: Qwen3Rope<B>,
    n_q_heads: usize,
    n_kv_heads: usize,
    head_dim: usize,
    n_kv_groups: usize,
    scale: f64,
}

impl<B: Backend> Qwen3Attention<B> {
    /// Initialise from a [`Qwen3Config`] on the given device.
    pub fn new(config: &Qwen3Config, device: &B::Device) -> Self {
        let q_dim = config.num_attention_heads * config.head_dim;
        let kv_dim = config.num_key_value_heads * config.head_dim;

        let q_proj = LinearConfig::new(config.hidden_size, q_dim)
            .with_bias(false)
            .init(device);
        let k_proj = LinearConfig::new(config.hidden_size, kv_dim)
            .with_bias(false)
            .init(device);
        let v_proj = LinearConfig::new(config.hidden_size, kv_dim)
            .with_bias(false)
            .init(device);
        let o_proj = LinearConfig::new(q_dim, config.hidden_size)
            .with_bias(false)
            .init(device);

        let rope = Qwen3Rope::new(
            config.max_position_embeddings,
            config.head_dim,
            config.rope_theta,
            device,
        );

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
            scale: 1.0 / (config.head_dim as f64).sqrt(),
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
    pub fn forward(
        &self,
        hidden: Tensor<B, 3>,
        attention_mask: Tensor<B, 2, Int>,
    ) -> Tensor<B, 3> {
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
            .mul_scalar(-neg_inf as f64) // -1 → neg_inf, 0 → 0  ⇒  mask==0 → neg_inf
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

/// SwiGLU MLP block (`down(silu(gate(x)) * up(x))`).
#[derive(Module, Debug)]
pub struct Qwen3Mlp<B: Backend> {
    gate_proj: Linear<B>,
    up_proj: Linear<B>,
    down_proj: Linear<B>,
}

impl<B: Backend> Qwen3Mlp<B> {
    /// Initialise from a [`Qwen3Config`] on the given device.
    pub fn new(config: &Qwen3Config, device: &B::Device) -> Self {
        let gate_proj = LinearConfig::new(config.hidden_size, config.intermediate_size)
            .with_bias(false)
            .init(device);
        let up_proj = LinearConfig::new(config.hidden_size, config.intermediate_size)
            .with_bias(false)
            .init(device);
        let down_proj = LinearConfig::new(config.intermediate_size, config.hidden_size)
            .with_bias(false)
            .init(device);
        Self {
            gate_proj,
            up_proj,
            down_proj,
        }
    }

    /// Forward pass: SwiGLU on `[B, S, H]` input, returns `[B, S, H]`.
    pub fn forward(&self, x: Tensor<B, 3>) -> Tensor<B, 3> {
        let gate = activation::silu(self.gate_proj.forward(x.clone()));
        let up = self.up_proj.forward(x);
        self.down_proj.forward(gate.mul(up))
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Decoder layer
// ─────────────────────────────────────────────────────────────────────────

/// One Qwen3 decoder layer: pre-LN attention + pre-LN MLP, both residual.
#[derive(Module, Debug)]
pub struct Qwen3DecoderLayer<B: Backend> {
    input_norm: RmsNorm<B>,
    attention: Qwen3Attention<B>,
    post_attn_norm: RmsNorm<B>,
    mlp: Qwen3Mlp<B>,
}

impl<B: Backend> Qwen3DecoderLayer<B> {
    /// Initialise from a [`Qwen3Config`] on the given device.
    pub fn new(config: &Qwen3Config, device: &B::Device) -> Self {
        let input_norm = RmsNormConfig::new(config.hidden_size)
            .with_epsilon(config.rms_norm_eps)
            .init(device);
        let post_attn_norm = RmsNormConfig::new(config.hidden_size)
            .with_epsilon(config.rms_norm_eps)
            .init(device);
        Self {
            input_norm,
            attention: Qwen3Attention::new(config, device),
            post_attn_norm,
            mlp: Qwen3Mlp::new(config, device),
        }
    }

    /// Forward pass through this decoder layer.
    pub fn forward(
        &self,
        hidden: Tensor<B, 3>,
        attention_mask: Tensor<B, 2, Int>,
    ) -> Tensor<B, 3> {
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

/// Full Qwen3 transformer: embedding → N decoder layers → final RMSNorm.
#[derive(Module, Debug)]
pub struct Qwen3Model<B: Backend> {
    embed_tokens: Embedding<B>,
    layers: Vec<Qwen3DecoderLayer<B>>,
    final_norm: RmsNorm<B>,
}

impl<B: Backend> Qwen3Model<B> {
    /// Initialise the full transformer from a [`Qwen3Config`].
    pub fn new(config: &Qwen3Config, device: &B::Device) -> Self {
        let embed_tokens = EmbeddingConfig::new(config.vocab_size, config.hidden_size).init(device);

        let mut layers = Vec::with_capacity(config.num_hidden_layers);
        for _ in 0..config.num_hidden_layers {
            layers.push(Qwen3DecoderLayer::new(config, device));
        }

        let final_norm = RmsNormConfig::new(config.hidden_size)
            .with_epsilon(config.rms_norm_eps)
            .init(device);

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
    /// the last decoder layer + final RMSNorm.
    pub fn forward(
        &self,
        token_ids: Tensor<B, 2, Int>,
        attention_mask: Tensor<B, 2, Int>,
    ) -> Tensor<B, 3> {
        let mut hidden = self.embed_tokens.forward(token_ids);
        for layer in &self.layers {
            hidden = layer.forward(hidden, attention_mask.clone());
        }
        self.final_norm.forward(hidden)
    }
}
