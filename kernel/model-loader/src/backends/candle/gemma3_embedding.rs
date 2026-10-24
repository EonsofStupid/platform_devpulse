//! Gemma 3 text encoder for sentence-transformer embedders.
//!
//! Candle 0.9.2's [`candle_transformers::models::gemma3::Model`] is the
//! decoder-with-LM-head variant — it always applies `lm_head` at the end
//! of forward, returning logits over the vocab. Sentence-transformer
//! embedders such as `microsoft/harrier-oss-v1-270m` ship without an
//! `lm_head.weight` tensor and expect callers to consume *hidden states*
//! mean-pooled across the sequence.
//!
//! This module is a focused port of the upstream gemma3 implementation
//! (candle 0.9.2-alpha.2 source) modified to:
//!
//! - skip `lm_head` construction (no tied LM-head projection),
//! - return the full sequence of last hidden states (not the last token's
//!   logits), enabling caller-side mean pooling for embedding output,
//! - drop the autoregressive KV-cache (embedders process the entire
//!   sequence in one batch — caching across calls would be incorrect),
//! - drop final-logit softcapping (only meaningful for sampled logits).
//!
//! Causal attention is preserved because Microsoft Harrier's config sets
//! `use_bidirectional_attention: false`. If a future Gemma3-based
//! embedder ships with bi-directional attention, swap the attention mask
//! generation in [`prepare_attention_mask`] for an all-zeros tensor.
//!
//! The grouped-query attention helper [`candle_transformers::utils::repeat_kv`]
//! is reused as-is.
//!
//! # Cast lints
//!
//! Tensor dimensions (`usize`) round-trip through `f64` for `RoPE` inverse-
//! frequency math and `RMSNorm` scaling. Hidden / head sizes never exceed
//! `2^52`, so `cast_precision_loss` is theoretically possible but
//! impossible in practice. `needless_pass_by_value` allows the candle
//! convention of consuming a `VarBuilder` for sub-module construction —
//! every other candle-using module in this workspace follows the same
//! convention.

#![allow(
    clippy::cast_precision_loss,
    clippy::cast_sign_loss,
    clippy::cast_possible_wrap,
    clippy::cast_lossless,
    clippy::needless_pass_by_value
)]

use std::sync::Arc;

use candle_core::{DType, Device, Module, Result, Tensor, D};
use candle_nn::{linear_b as linear, Activation, Linear, VarBuilder};
use candle_transformers::utils::repeat_kv;

/// Gemma3 text encoder configuration.
///
/// Field names and types match the upstream
/// [`candle_transformers::models::gemma3::Config`] so a `HuggingFace`
/// `config.json` for a Gemma3 text encoder deserialises into either
/// type without modification.
#[derive(serde::Deserialize, Debug, Clone)]
pub struct Config {
    /// Whether the q/k/v projections include a bias term.
    pub attention_bias: bool,
    /// Per-head embedding dimension.
    pub head_dim: usize,
    /// Activation function used inside the MLP (Gemma defaults to `gelu_pytorch_tanh`).
    pub hidden_activation: Activation,
    /// Hidden state dimension (model width).
    pub hidden_size: usize,
    /// Intermediate dimension of the gated MLP.
    pub intermediate_size: usize,
    /// Number of attention heads (query heads).
    pub num_attention_heads: usize,
    /// Number of decoder layers.
    pub num_hidden_layers: usize,
    /// Number of key/value heads for grouped-query attention.
    pub num_key_value_heads: usize,
    /// Epsilon used inside `RMSNorm`.
    pub rms_norm_eps: f64,
    /// Base frequency used by `RoPE` on full-attention layers.
    pub rope_theta: f64,
    /// Base frequency used by `RoPE` on sliding-window layers.
    pub rope_local_base_freq: f64,
    /// Vocabulary size (input embedding rows).
    pub vocab_size: usize,
    /// Optional softcap applied to attention logits inside attention.
    pub attn_logit_softcapping: Option<f64>,
    /// Sliding-window length (only consulted on layers where the pattern
    /// flag selects sliding attention).
    pub sliding_window: usize,
    /// Sliding-window pattern divisor — `(layer_idx + 1) % pattern > 0`
    /// selects a sliding-window layer. Harrier-270m sets this to `1` so
    /// every layer uses full attention, which the port honours.
    pub sliding_window_pattern: usize,
    /// Maximum sequence length the model was trained for.
    pub max_position_embeddings: usize,
}

#[derive(Debug, Clone)]
struct RmsNorm {
    weight: Tensor,
    eps: f64,
}

impl RmsNorm {
    fn new(dim: usize, eps: f64, vb: VarBuilder) -> Result<Self> {
        let weight = vb.get(dim, "weight")?;
        Ok(Self { weight, eps })
    }
}

impl Module for RmsNorm {
    fn forward(&self, x: &Tensor) -> Result<Tensor> {
        let x_dtype = x.dtype();
        let internal_dtype = match x_dtype {
            DType::F16 | DType::BF16 => DType::F32,
            d => d,
        };
        let hidden_size = x.dim(D::Minus1)?;
        let x = x.to_dtype(internal_dtype)?;
        let norm_x = (x.sqr()?.sum_keepdim(D::Minus1)? / hidden_size as f64)?;
        let x_normed = x.broadcast_div(&(norm_x + self.eps)?.sqrt()?)?;
        x_normed
            .to_dtype(x_dtype)?
            .broadcast_mul(&(&self.weight + 1.0)?)
    }
}

#[derive(Debug, Clone)]
struct RotaryEmbedding {
    sin: Tensor,
    cos: Tensor,
}

impl RotaryEmbedding {
    fn new(
        dtype: DType,
        cfg: &Config,
        dev: &Device,
        sliding_window: Option<usize>,
    ) -> Result<Self> {
        let dim = cfg.head_dim;
        let max_seq_len = cfg.max_position_embeddings;
        let rope_freq = if sliding_window.is_some() {
            cfg.rope_local_base_freq
        } else {
            cfg.rope_theta
        };
        let inv_freq: Vec<_> = (0..dim)
            .step_by(2)
            .map(|i| 1f32 / rope_freq.powf(i as f64 / dim as f64) as f32)
            .collect();
        let inv_freq_len = inv_freq.len();
        let inv_freq = Tensor::from_vec(inv_freq, (1, inv_freq_len), dev)?.to_dtype(dtype)?;
        let t = Tensor::arange(0u32, max_seq_len as u32, dev)?
            .to_dtype(dtype)?
            .reshape((max_seq_len, 1))?;
        let freqs = t.matmul(&inv_freq)?;
        Ok(Self {
            sin: freqs.sin()?,
            cos: freqs.cos()?,
        })
    }

    fn apply_rotary_emb_qkv(&self, q: &Tensor, k: &Tensor) -> Result<(Tensor, Tensor)> {
        let (_b_sz, _h, seq_len, _n_embd) = q.dims4()?;
        // Embedding loads always run from sequence start — no autoregressive
        // offset to thread through, so the cos/sin slice is simply [0..seq_len].
        let cos = self.cos.narrow(0, 0, seq_len)?;
        let sin = self.sin.narrow(0, 0, seq_len)?;
        let q_embed = candle_nn::rotary_emb::rope(&q.contiguous()?, &cos, &sin)?;
        let k_embed = candle_nn::rotary_emb::rope(&k.contiguous()?, &cos, &sin)?;
        Ok((q_embed, k_embed))
    }
}

#[derive(Debug, Clone)]
#[allow(clippy::upper_case_acronyms)]
struct MLP {
    gate_proj: Linear,
    up_proj: Linear,
    down_proj: Linear,
    act_fn: Activation,
}

impl MLP {
    fn new(cfg: &Config, vb: VarBuilder) -> Result<Self> {
        let hidden_sz = cfg.hidden_size;
        let intermediate_sz = cfg.intermediate_size;
        let gate_proj = linear(hidden_sz, intermediate_sz, false, vb.pp("gate_proj"))?;
        let up_proj = linear(hidden_sz, intermediate_sz, false, vb.pp("up_proj"))?;
        let down_proj = linear(intermediate_sz, hidden_sz, false, vb.pp("down_proj"))?;
        Ok(Self {
            gate_proj,
            up_proj,
            down_proj,
            act_fn: cfg.hidden_activation,
        })
    }
}

impl Module for MLP {
    fn forward(&self, xs: &Tensor) -> Result<Tensor> {
        let lhs = xs.apply(&self.gate_proj)?.apply(&self.act_fn)?;
        let rhs = xs.apply(&self.up_proj)?;
        (lhs * rhs)?.apply(&self.down_proj)
    }
}

#[derive(Debug, Clone)]
struct Attention {
    q_proj: Linear,
    k_proj: Linear,
    v_proj: Linear,
    o_proj: Linear,
    q_norm: RmsNorm,
    k_norm: RmsNorm,
    num_heads: usize,
    num_kv_heads: usize,
    num_kv_groups: usize,
    head_dim: usize,
    attn_logit_softcapping: Option<f64>,
    rotary_emb: Arc<RotaryEmbedding>,
}

impl Attention {
    fn new(rotary_emb: Arc<RotaryEmbedding>, cfg: &Config, vb: VarBuilder) -> Result<Self> {
        let hidden_sz = cfg.hidden_size;
        let num_heads = cfg.num_attention_heads;
        let num_kv_heads = cfg.num_key_value_heads;
        let num_kv_groups = num_heads / num_kv_heads;
        let head_dim = cfg.head_dim;
        let bias = cfg.attention_bias;
        let q_proj = linear(hidden_sz, num_heads * head_dim, bias, vb.pp("q_proj"))?;
        let k_proj = linear(hidden_sz, num_kv_heads * head_dim, bias, vb.pp("k_proj"))?;
        let v_proj = linear(hidden_sz, num_kv_heads * head_dim, bias, vb.pp("v_proj"))?;
        let o_proj = linear(num_heads * head_dim, hidden_sz, bias, vb.pp("o_proj"))?;
        let q_norm = RmsNorm::new(head_dim, cfg.rms_norm_eps, vb.pp("q_norm"))?;
        let k_norm = RmsNorm::new(head_dim, cfg.rms_norm_eps, vb.pp("k_norm"))?;
        Ok(Self {
            q_proj,
            k_proj,
            v_proj,
            o_proj,
            q_norm,
            k_norm,
            num_heads,
            num_kv_heads,
            num_kv_groups,
            head_dim,
            attn_logit_softcapping: cfg.attn_logit_softcapping,
            rotary_emb,
        })
    }

    fn forward(&self, xs: &Tensor, attention_mask: Option<&Tensor>) -> Result<Tensor> {
        let (b_sz, q_len, _) = xs.dims3()?;

        let query_states = self.q_proj.forward(xs)?;
        let key_states = self.k_proj.forward(xs)?;
        let value_states = self.v_proj.forward(xs)?;

        let query_states = query_states
            .reshape((b_sz, q_len, self.num_heads, self.head_dim))?
            .transpose(1, 2)?;
        let key_states = key_states
            .reshape((b_sz, q_len, self.num_kv_heads, self.head_dim))?
            .transpose(1, 2)?;
        let value_states = value_states
            .reshape((b_sz, q_len, self.num_kv_heads, self.head_dim))?
            .transpose(1, 2)?;
        let query_states = self.q_norm.forward(&query_states)?;
        let key_states = self.k_norm.forward(&key_states)?;

        let (query_states, key_states) = self
            .rotary_emb
            .apply_rotary_emb_qkv(&query_states, &key_states)?;

        // Embedding loads don't autoregress so there's no kv-cache to
        // append into — every batch processes the full sequence fresh.
        let key_states = repeat_kv(key_states, self.num_kv_groups)?.contiguous()?;
        let value_states = repeat_kv(value_states, self.num_kv_groups)?.contiguous()?;

        let scale = 1f64 / f64::sqrt(self.head_dim as f64);
        let attn_weights = (query_states.matmul(&key_states.transpose(2, 3)?)? * scale)?;

        let attn_weights = match self.attn_logit_softcapping {
            None => attn_weights,
            Some(sc) => ((attn_weights / sc)?.tanh()? * sc)?,
        };

        let attn_weights = match attention_mask {
            None => attn_weights,
            Some(mask) => attn_weights.broadcast_add(mask)?,
        };
        let attn_weights = candle_nn::ops::softmax_last_dim(&attn_weights)?;
        let attn_output = attn_weights.matmul(&value_states)?;

        attn_output
            .transpose(1, 2)?
            .reshape((b_sz, q_len, ()))?
            .apply(&self.o_proj)
    }
}

#[derive(Debug, Clone)]
struct DecoderLayer {
    self_attn: Attention,
    mlp: MLP,
    input_layernorm: RmsNorm,
    pre_feedforward_layernorm: RmsNorm,
    post_feedforward_layernorm: RmsNorm,
    post_attention_layernorm: RmsNorm,
    sliding_window: Option<usize>,
}

impl DecoderLayer {
    fn new(cfg: &Config, vb: VarBuilder, sliding_window: Option<usize>) -> Result<Self> {
        let rotary_emb = Arc::new(RotaryEmbedding::new(
            vb.dtype(),
            cfg,
            vb.device(),
            sliding_window,
        )?);
        let self_attn = Attention::new(rotary_emb, cfg, vb.pp("self_attn"))?;
        let mlp = MLP::new(cfg, vb.pp("mlp"))?;
        let input_layernorm =
            RmsNorm::new(cfg.hidden_size, cfg.rms_norm_eps, vb.pp("input_layernorm"))?;
        let pre_feedforward_layernorm = RmsNorm::new(
            cfg.hidden_size,
            cfg.rms_norm_eps,
            vb.pp("pre_feedforward_layernorm"),
        )?;
        let post_feedforward_layernorm = RmsNorm::new(
            cfg.hidden_size,
            cfg.rms_norm_eps,
            vb.pp("post_feedforward_layernorm"),
        )?;
        let post_attention_layernorm = RmsNorm::new(
            cfg.hidden_size,
            cfg.rms_norm_eps,
            vb.pp("post_attention_layernorm"),
        )?;
        Ok(Self {
            self_attn,
            mlp,
            input_layernorm,
            pre_feedforward_layernorm,
            post_feedforward_layernorm,
            post_attention_layernorm,
            sliding_window,
        })
    }

    fn forward(&self, xs: &Tensor, attention_mask: Option<&Tensor>) -> Result<Tensor> {
        let residual = xs;
        let xs = self.input_layernorm.forward(xs)?;
        let xs = self.self_attn.forward(&xs, attention_mask)?;
        let xs = xs.apply(&self.post_attention_layernorm)?;
        let xs = (xs + residual)?;
        let residual = &xs;
        let xs = xs.apply(&self.pre_feedforward_layernorm)?;
        let xs = xs.apply(&self.mlp)?;
        let xs = xs.apply(&self.post_feedforward_layernorm)?;
        residual + xs
    }
}

/// Build a causal attention mask. Sliding-window variants apply when
/// `sliding_window` is `Some(w)` — out-of-window past tokens are masked
/// in addition to future tokens.
fn prepare_attention_mask(
    b_size: usize,
    tgt_len: usize,
    sliding_window: Option<usize>,
    dtype: DType,
    device: &Device,
) -> Result<Tensor> {
    let mask: Vec<_> = if let Some(sliding_window) = sliding_window {
        (0..tgt_len)
            .flat_map(|i| {
                (0..tgt_len).map(move |j| {
                    if i < j || j + sliding_window < i {
                        f32::NEG_INFINITY
                    } else {
                        0.
                    }
                })
            })
            .collect()
    } else {
        (0..tgt_len)
            .flat_map(|i| (0..tgt_len).map(move |j| if i < j { f32::NEG_INFINITY } else { 0f32 }))
            .collect()
    };
    let mask = Tensor::from_slice(&mask, (tgt_len, tgt_len), device)?;
    mask.expand((b_size, 1, tgt_len, tgt_len))?.to_dtype(dtype)
}

/// Gemma 3 text encoder for embedding output.
///
/// Drop-in replacement for [`candle_transformers::models::gemma3::Model`]
/// that returns hidden states instead of logits and skips the LM-head
/// construction so safetensors checkpoints without an `lm_head.weight`
/// (sentence-transformer embedders) load cleanly.
#[derive(Debug, Clone)]
pub struct Model {
    embed_tokens: candle_nn::Embedding,
    layers: Vec<DecoderLayer>,
    norm: RmsNorm,
    device: Device,
    dtype: DType,
    hidden_size: usize,
    sliding_window: usize,
}

impl Model {
    /// Construct from a `VarBuilder` rooted at the safetensors / GGUF
    /// checkpoint. The encoder reads its weights from the `model.*`
    /// tensor namespace — same as upstream gemma3 — so existing exports
    /// load without any tensor-name remapping.
    ///
    /// # Errors
    /// Returns an error if any tensor lookup against the `VarBuilder`
    /// fails (missing weight, dtype mismatch, or shape mismatch).
    pub fn new(cfg: &Config, vb: VarBuilder) -> Result<Self> {
        let vb_m = vb.pp("model");
        let embed_tokens =
            candle_nn::embedding(cfg.vocab_size, cfg.hidden_size, vb_m.pp("embed_tokens"))?;
        let mut layers = Vec::with_capacity(cfg.num_hidden_layers);
        let vb_l = vb_m.pp("layers");
        for layer_idx in 0..cfg.num_hidden_layers {
            let sliding_window = (layer_idx + 1) % cfg.sliding_window_pattern > 0;
            let layer = DecoderLayer::new(
                cfg,
                vb_l.pp(layer_idx),
                sliding_window.then_some(cfg.sliding_window),
            )?;
            layers.push(layer);
        }
        let norm = RmsNorm::new(cfg.hidden_size, cfg.rms_norm_eps, vb_m.pp("norm"))?;
        Ok(Self {
            embed_tokens,
            layers,
            norm,
            device: vb.device().clone(),
            dtype: vb.dtype(),
            hidden_size: cfg.hidden_size,
            sliding_window: cfg.sliding_window,
        })
    }

    fn create_attention_masks(
        &self,
        batch_size: usize,
        seq_len: usize,
    ) -> Result<(Option<Tensor>, Option<Tensor>)> {
        if seq_len <= 1 {
            return Ok((None, None));
        }

        let mask = prepare_attention_mask(batch_size, seq_len, None, self.dtype, &self.device)?;
        let sliding_mask = prepare_attention_mask(
            batch_size,
            seq_len,
            Some(self.sliding_window),
            self.dtype,
            &self.device,
        )?;
        Ok((Some(mask), Some(sliding_mask)))
    }

    /// Run a forward pass and return the per-token hidden states after
    /// the final `RMSNorm`. Output shape: `(batch, seq_len, hidden_size)`.
    /// Callers that need a single embedding per sequence should apply
    /// [`mean_pool`] to this output (with the input attention mask).
    ///
    /// # Errors
    /// Returns an error if any tensor op fails — most commonly when
    /// `input_ids` is not a `(batch, seq_len)` shape, or when the input
    /// dtype is incompatible with the loaded weights.
    pub fn forward(&self, input_ids: &Tensor) -> Result<Tensor> {
        let (b_size, seq_len) = input_ids.dims2()?;
        let xs = self.embed_tokens.forward(input_ids)?;
        let mut xs = (xs * (self.hidden_size as f64).sqrt())?;

        let (attention_mask, sliding_attention_mask) =
            self.create_attention_masks(b_size, seq_len)?;

        for layer in &self.layers {
            let mask = if layer.sliding_window.is_some() {
                &sliding_attention_mask
            } else {
                &attention_mask
            };
            xs = layer.forward(&xs, mask.as_ref())?;
        }

        // Final RMSNorm — same as gemma3::Model — but no narrow + no
        // lm_head + no softcapping. Returns full-sequence hidden states
        // for caller-side pooling.
        xs.apply(&self.norm)
    }
}

/// Mean-pool a `(batch, seq_len, hidden)` hidden-state tensor across
/// the sequence dimension, masking out positions where
/// `attention_mask == 0`. Returns `(batch, hidden)`.
///
/// The mask must be the same shape as the input ids `(batch, seq_len)`
/// with `1` for real tokens and `0` for padding.
///
/// # Errors
/// Returns an error if `hidden` is not a 3-D tensor or if the mask
/// shape cannot be broadcast against it.
pub fn mean_pool(hidden: &Tensor, attention_mask: &Tensor) -> Result<Tensor> {
    let (b, seq_len, hidden_size) = hidden.dims3()?;
    let mask = attention_mask
        .to_dtype(hidden.dtype())?
        .reshape((b, seq_len, 1))?
        .broadcast_as((b, seq_len, hidden_size))?;
    let masked = (hidden * &mask)?;
    let summed = masked.sum(1)?;
    let counts = mask.sum(1)?.clamp(1f64, f64::INFINITY)?;
    summed.broadcast_div(&counts)
}
