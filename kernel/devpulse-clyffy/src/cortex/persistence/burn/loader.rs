//! # Safetensors → `Qwen3Model` loader
//!
//! Reads HuggingFace Qwen3-family safetensors files (Harrier 0.6B
//! at the floor tier, larger Qwen3 variants on higher tiers) into
//! the raw-`Tensor<B, ?>` `Qwen3Model` authored in `qwen3.rs`.
//!
//! ## Why a hand-rolled fill instead of `burn-store`
//!
//! The Sync-clean Qwen3 reauthor (`qwen3.rs`) replaced every
//! `nn::Linear` / `nn::Embedding` / `nn::RmsNorm` with raw `Tensor`
//! fields so `BurnEmbedder<B>` can live behind `ArcSwap` per
//! `HOT_UPDATE_PATTERN.md` §7.1 / §12. `burn-store::SafetensorsStore`
//! traverses through `Param<T>` records, which our raw-Tensor fields
//! don't go through. We get the same outcome with ~80 lines of
//! direct `safetensors` → `Tensor::from_data` mapping, and avoid the
//! `burn-store` API drift risk between point releases.
//!
//! ## Reference
//!
//! Pattern mirrors `tracel-ai/models/llama-burn/src/llama.rs`'s
//! `load_pretrained` — same HF naming convention, same per-layer
//! mapping, same Linear-weight transpose. Only the `nn::*` →
//! raw-`Tensor` field path differs.
//!
//! ## HF tensor naming → Burn field path
//!
//! | HF safetensors key                                        | Field on `Qwen3Model<B>`                       | Reshape |
//! |-----------------------------------------------------------|------------------------------------------------|---------|
//! | `model.embed_tokens.weight`                               | `embed_tokens.weight`                          | none |
//! | `model.layers.{i}.self_attn.{q,k,v,o}_proj.weight`        | `layers[i].attention.{q,k,v,o}_proj.weight`    | transpose |
//! | `model.layers.{i}.mlp.{gate,up,down}_proj.weight`         | `layers[i].mlp.{gate,up,down}_proj.weight`     | transpose |
//! | `model.layers.{i}.input_layernorm.weight`                 | `layers[i].input_norm.weight`                  | none |
//! | `model.layers.{i}.post_attention_layernorm.weight`        | `layers[i].post_attn_norm.weight`              | none |
//! | `model.norm.weight`                                       | `final_norm.weight`                            | none |
//!
//! ## Linear transpose, why
//!
//! HF Linear stores weight `[out_features, in_features]` (PyTorch
//! convention). Burn `nn::Linear` matches (and so does our
//! `Qwen3Linear` *as authored in qwen3.rs*). But our `Qwen3Linear`
//! actually uses `[in_features, out_features]` so `forward()` can do
//! `x @ W` without a transpose at every forward pass — the transpose
//! gets paid once at load time instead of every forward call. The
//! loader transposes HF weights to match.

use std::collections::HashMap;
use std::path::Path;

use burn::prelude::Backend;
use burn::tensor::{Tensor, TensorData};
use safetensors::tensor::{Dtype, TensorView};
use safetensors::SafeTensors;
use thiserror::Error;

use super::qwen3::{Qwen3Config, Qwen3Model};

/// Errors raised by the loader.
#[derive(Debug, Error)]
pub enum LoaderError {
    /// Failure opening or memory-mapping the safetensors file.
    #[error("io error opening {path}: {source}")]
    Io {
        /// Path that failed to open.
        path: String,
        /// Underlying I/O error.
        #[source]
        source: std::io::Error,
    },

    /// The blocking load task panicked or was cancelled. Surfaces
    /// `tokio::task::JoinError` from `spawn_blocking` — extremely
    /// rare in practice (the loader doesn't panic on user data;
    /// shape mismatches go through `ShapeMismatch`).
    #[error("blocking load task failed: {0}")]
    JoinError(String),

    /// `safetensors::SafeTensors::deserialize` rejected the file
    /// (corrupt header, unknown layout, etc.).
    #[error("safetensors deserialize failed: {0}")]
    Safetensors(#[from] safetensors::SafeTensorError),

    /// Required HF tensor key is missing from the file. Indicates
    /// either a wrong-architecture file or a partial / corrupt
    /// download.
    #[error("required tensor key missing: {key}")]
    MissingTensor {
        /// HF key that wasn't found.
        key: String,
    },

    /// Tensor shape doesn't match the expected geometry from
    /// `Qwen3Config`. Indicates either the wrong model variant for
    /// the configured slot or a mismatched config.
    #[error("shape mismatch on {key}: expected {expected:?}, got {got:?}")]
    ShapeMismatch {
        /// HF key whose shape didn't match.
        key: String,
        /// Shape demanded by `Qwen3Config`.
        expected: Vec<usize>,
        /// Shape actually present in the file.
        got: Vec<usize>,
    },

    /// Unsupported dtype. We accept F32 and BF16 (the two dtypes
    /// HF Qwen3 weights actually ship in); F16 / I8 / Q4 etc. are
    /// not on the encoder's hot path and would need a separate
    /// dequantization step.
    #[error("unsupported dtype on {key}: {got:?} — only F32 and BF16 are supported")]
    UnsupportedDtype {
        /// HF key whose dtype isn't supported.
        key: String,
        /// Dtype actually present.
        got: Dtype,
    },
}

/// Load a Qwen3 model from a single safetensors file.
///
/// Memory-maps the file (zero copy until tensor materialization),
/// then walks the HF naming convention layer by layer and constructs
/// `Qwen3Model<B>` directly from `TensorData`. Random-init Module
/// construction is bypassed entirely.
///
/// **Synchronous and CPU-bound.** Callers in async contexts must
/// wrap in `tokio::task::spawn_blocking` — the `HotUpdateable::load`
/// impl in `hot_update.rs` does this. Calling directly from an async
/// task blocks the runtime for 1-3s on Harrier 0.6B / longer on
/// larger Qwen3 variants.
///
/// # Errors
///
/// - [`LoaderError::Io`] — file unreadable or unmappable.
/// - [`LoaderError::Safetensors`] — header malformed.
/// - [`LoaderError::MissingTensor`] — required HF key absent.
/// - [`LoaderError::ShapeMismatch`] — geometry disagreement.
/// - [`LoaderError::UnsupportedDtype`] — non-F32/BF16 on a tensor.
#[tracing::instrument(
    skip(cfg, device),
    fields(
        path = %path.display(),
        layers = cfg.num_hidden_layers,
        hidden = cfg.hidden_size,
    ),
)]
pub fn load_qwen3_from_safetensors<B: Backend>(
    path: &Path,
    cfg: &Qwen3Config,
    device: &B::Device,
) -> Result<Qwen3Model<B>, LoaderError> {
    // We deliberately read the whole file into a Vec<u8> instead of
    // memory-mapping. Mmap requires `unsafe` (the file might be
    // mutated under us by another process), and the crate-wide
    // `unsafe_code = "deny"` policy bans that without an explicit
    // allow. For Harrier 0.6B (~1.4 GB BF16) the read takes a few
    // hundred ms on NVMe and is amortized against the per-tensor
    // copies into Burn storage that follow. Sharded loading (for
    // multi-GB Qwen variants) will land alongside the
    // `model.safetensors.index.json` parser in a follow-up slice.
    let buf = std::fs::read(path).map_err(|source| LoaderError::Io {
        path: path.display().to_string(),
        source,
    })?;
    let st = SafeTensors::deserialize(&buf)?;

    // Build a name→TensorView lookup once so per-layer access is O(1).
    // `tensors()` yields owned `String` keys; we keep ownership of those
    // strings in the map rather than borrowing into the Vec<u8>.
    let lookup: HashMap<String, TensorView<'_>> = st.tensors().into_iter().collect();

    // Helpers — defined inline so they capture `&lookup` and `device`.
    let load_2d = |key: &str, expected: [usize; 2]| -> Result<Tensor<B, 2>, LoaderError> {
        let view = lookup
            .get(key)
            .ok_or_else(|| LoaderError::MissingTensor { key: key.to_string() })?;
        check_shape(key, expected.as_slice(), view.shape())?;
        let data = tensor_view_to_data(key, view)?;
        Ok(Tensor::<B, 2>::from_data(data, device))
    };
    let load_1d = |key: &str, expected: [usize; 1]| -> Result<Tensor<B, 1>, LoaderError> {
        let view = lookup
            .get(key)
            .ok_or_else(|| LoaderError::MissingTensor { key: key.to_string() })?;
        check_shape(key, expected.as_slice(), view.shape())?;
        let data = tensor_view_to_data(key, view)?;
        Ok(Tensor::<B, 1>::from_data(data, device))
    };

    // Embedding [vocab, hidden] — HF and Burn agree on layout, no transpose.
    let embed_weight = load_2d("model.embed_tokens.weight", [cfg.vocab_size, cfg.hidden_size])?;
    let embed_tokens = super::qwen3::Qwen3Embedding::from_weight(embed_weight);

    // Per-layer parameters.
    let q_dim = cfg.num_attention_heads * cfg.head_dim;
    let kv_dim = cfg.num_key_value_heads * cfg.head_dim;
    let mut layers = Vec::with_capacity(cfg.num_hidden_layers);
    for i in 0..cfg.num_hidden_layers {
        layers.push(load_decoder_layer::<B>(
            &lookup, i, cfg, q_dim, kv_dim, device,
        )?);
    }

    // Final RMSNorm.
    let final_norm_weight = load_1d("model.norm.weight", [cfg.hidden_size])?;
    let final_norm = super::qwen3::Qwen3RmsNorm::from_weight(final_norm_weight, cfg.rms_norm_eps);

    Ok(Qwen3Model::from_components(embed_tokens, layers, final_norm))
}

/// Load one decoder layer at index `i`. Hoisted so the loop in
/// `load_qwen3_from_safetensors` stays single-screen.
fn load_decoder_layer<B: Backend>(
    lookup: &HashMap<String, TensorView<'_>>,
    i: usize,
    cfg: &Qwen3Config,
    q_dim: usize,
    kv_dim: usize,
    device: &B::Device,
) -> Result<super::qwen3::Qwen3DecoderLayer<B>, LoaderError> {
    let prefix = format!("model.layers.{i}");

    // Linear projections — HF stores [out, in], Qwen3Linear uses [in, out].
    // Transpose at load so forward() stays a clean `x @ W`.
    let q_proj = load_linear_transposed::<B>(
        lookup,
        &format!("{prefix}.self_attn.q_proj.weight"),
        cfg.hidden_size,
        q_dim,
        device,
    )?;
    let k_proj = load_linear_transposed::<B>(
        lookup,
        &format!("{prefix}.self_attn.k_proj.weight"),
        cfg.hidden_size,
        kv_dim,
        device,
    )?;
    let v_proj = load_linear_transposed::<B>(
        lookup,
        &format!("{prefix}.self_attn.v_proj.weight"),
        cfg.hidden_size,
        kv_dim,
        device,
    )?;
    let o_proj = load_linear_transposed::<B>(
        lookup,
        &format!("{prefix}.self_attn.o_proj.weight"),
        q_dim,
        cfg.hidden_size,
        device,
    )?;

    let gate_proj = load_linear_transposed::<B>(
        lookup,
        &format!("{prefix}.mlp.gate_proj.weight"),
        cfg.hidden_size,
        cfg.intermediate_size,
        device,
    )?;
    let up_proj = load_linear_transposed::<B>(
        lookup,
        &format!("{prefix}.mlp.up_proj.weight"),
        cfg.hidden_size,
        cfg.intermediate_size,
        device,
    )?;
    let down_proj = load_linear_transposed::<B>(
        lookup,
        &format!("{prefix}.mlp.down_proj.weight"),
        cfg.intermediate_size,
        cfg.hidden_size,
        device,
    )?;

    let input_norm_weight = load_1d_tensor::<B>(
        lookup,
        &format!("{prefix}.input_layernorm.weight"),
        cfg.hidden_size,
        device,
    )?;
    let post_attn_norm_weight = load_1d_tensor::<B>(
        lookup,
        &format!("{prefix}.post_attention_layernorm.weight"),
        cfg.hidden_size,
        device,
    )?;

    // RoPE has no learned parameters — re-init from cfg.
    let rope = super::qwen3::Qwen3Rope::new(
        cfg.max_position_embeddings,
        cfg.head_dim,
        cfg.rope_theta,
        device,
    );

    let attention = super::qwen3::Qwen3Attention::from_components(
        q_proj,
        k_proj,
        v_proj,
        o_proj,
        rope,
        cfg.num_attention_heads,
        cfg.num_key_value_heads,
        cfg.head_dim,
    );
    let mlp = super::qwen3::Qwen3Mlp::from_components(gate_proj, up_proj, down_proj);
    let input_norm =
        super::qwen3::Qwen3RmsNorm::from_weight(input_norm_weight, cfg.rms_norm_eps);
    let post_attn_norm =
        super::qwen3::Qwen3RmsNorm::from_weight(post_attn_norm_weight, cfg.rms_norm_eps);

    Ok(super::qwen3::Qwen3DecoderLayer::from_components(
        input_norm,
        attention,
        post_attn_norm,
        mlp,
    ))
}

/// Load a HF-shaped Linear weight `[out, in]` and produce a
/// `Qwen3Linear` whose `weight: Tensor<B, 2>` is `[in, out]`.
fn load_linear_transposed<B: Backend>(
    lookup: &HashMap<String, TensorView<'_>>,
    key: &str,
    in_features: usize,
    out_features: usize,
    device: &B::Device,
) -> Result<super::qwen3::Qwen3Linear<B>, LoaderError> {
    let view = lookup
        .get(key)
        .ok_or_else(|| LoaderError::MissingTensor { key: key.to_string() })?;
    // HF shape is [out, in]; verify before any work.
    check_shape(key, &[out_features, in_features], view.shape())?;
    let data = tensor_view_to_data(key, view)?;
    let hf_weight = Tensor::<B, 2>::from_data(data, device);
    // Transpose [out, in] → [in, out] for our forward(x @ W).
    Ok(super::qwen3::Qwen3Linear::from_weight(hf_weight.swap_dims(0, 1)))
}

/// Load a 1-D HF tensor (RMSNorm scale) directly.
fn load_1d_tensor<B: Backend>(
    lookup: &HashMap<String, TensorView<'_>>,
    key: &str,
    expected: usize,
    device: &B::Device,
) -> Result<Tensor<B, 1>, LoaderError> {
    let view = lookup
        .get(key)
        .ok_or_else(|| LoaderError::MissingTensor { key: key.to_string() })?;
    check_shape(key, &[expected], view.shape())?;
    let data = tensor_view_to_data(key, view)?;
    Ok(Tensor::<B, 1>::from_data(data, device))
}

/// Common shape-check helper. Returns `ShapeMismatch` with the full
/// HF key in the error so the user can find the bad tensor in a
/// 200-tensor file.
fn check_shape(key: &str, expected: &[usize], got: &[usize]) -> Result<(), LoaderError> {
    if expected != got {
        return Err(LoaderError::ShapeMismatch {
            key: key.to_string(),
            expected: expected.to_vec(),
            got: got.to_vec(),
        });
    }
    Ok(())
}

/// Convert a `TensorView` into Burn's `TensorData` (always F32).
/// BF16 tensors are upcast to F32 — Burn's NdArray backend doesn't
/// have native BF16 storage, and the precision loss is a non-issue
/// for the embedder forward pass (which is already f32 internally).
fn tensor_view_to_data(key: &str, view: &TensorView<'_>) -> Result<TensorData, LoaderError> {
    let shape: Vec<usize> = view.shape().to_vec();
    let raw = view.data();
    let f32_buf: Vec<f32> = match view.dtype() {
        Dtype::F32 => {
            // Safe direct interpretation — HF safetensors files store
            // F32 in little-endian, which matches every supported
            // host. Copy via from_le_bytes to be portable.
            raw.chunks_exact(4)
                .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
                .collect()
        }
        Dtype::BF16 => raw
            .chunks_exact(2)
            .map(|b| {
                // BF16 = top 16 bits of an F32. Reconstruct by zero-
                // extending into the low bits.
                let bits = (u16::from_le_bytes([b[0], b[1]]) as u32) << 16;
                f32::from_bits(bits)
            })
            .collect(),
        other => {
            return Err(LoaderError::UnsupportedDtype {
                key: key.to_string(),
                got: other,
            })
        }
    };
    Ok(TensorData::new(f32_buf, shape))
}
