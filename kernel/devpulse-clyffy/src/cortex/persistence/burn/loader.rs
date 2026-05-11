//! # Safetensors → `Qwen3Model` loader (streaming)
//!
//! Reads HuggingFace Qwen3-family safetensors files (Harrier 0.6B
//! at the floor tier, larger Qwen3 variants on higher tiers) into
//! the raw-`Tensor<B, ?>` `Qwen3Model` authored in `qwen3.rs`.
//!
//! ## Streaming-read design
//!
//! Reference: `huggingface/candle/candle-core/src/safetensors.rs`'s
//! `MmapedSafetensors`. Candle uses `memmap2::Mmap` (which is
//! `unsafe`) to keep peak memory at one tensor at a time. We hit the
//! same memory profile without `unsafe` by:
//!
//! 1. Reading the 8-byte length prefix + JSON header only into
//!    memory (typically <1 MB even for 1000-tensor models).
//! 2. Parsing via `safetensors::SafeTensors::read_metadata` which
//!    yields `(data_start_offset, Metadata)` without ever needing
//!    the data bytes.
//! 3. For each HF key the loader cares about, `File::seek` to the
//!    tensor's absolute offset and `read_exact` exactly its bytes.
//! 4. Convert that one tensor's bytes to `Vec<f32>` + drop the
//!    intermediate buffer immediately. The Burn `Tensor::from_data`
//!    consumes the `Vec` and the temporary disappears before the
//!    next tensor is read.
//!
//! For Harrier 0.6B BF16 (~1.4 GB on disk), peak transient memory
//! is ~600 MB (vocab embedding tensor at `[152K × 1024 × 4]` bytes
//! after BF16→F32 expansion) plus the cumulative Burn storage built
//! up so far. The full-buffer-read path this replaces sat at
//! ~4.2 GB peak.
//!
//! ## Reference
//!
//! Mirrors the per-tensor `seek + read_exact` pattern in Candle's
//! `safetensors::SliceSafetensors`-style readers and the equivalent
//! in `tracel-ai/models/llama-burn`'s `load_pretrained` (which
//! delegates to `burn-store::SafetensorsStore`). Our raw-`Tensor`
//! field path (chosen for `ArcSwap`-clean Sync per
//! `HOT_UPDATE_PATTERN.md` §7.1) precludes `burn-store`'s `Param`
//! traversal, so we replicate the streaming approach by hand here.
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

use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;

use burn::prelude::Backend;
use burn::tensor::{Tensor, TensorData};
use safetensors::tensor::Metadata;
use safetensors::Dtype;
use safetensors::SafeTensors;
use thiserror::Error;

use super::qwen3::{Qwen3Config, Qwen3Model};

/// Errors raised by the loader.
#[derive(Debug, Error)]
pub enum LoaderError {
    /// Failure opening or reading the safetensors file (header or
    /// per-tensor data bytes).
    #[error("io error on {path}: {source}")]
    Io {
        /// Path that failed.
        path: String,
        /// Underlying I/O error.
        #[source]
        source: std::io::Error,
    },

    /// `safetensors::SafeTensors::read_metadata` rejected the file
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

    /// The blocking load task panicked or was cancelled. Surfaces
    /// `tokio::task::JoinError` from `spawn_blocking` — extremely
    /// rare in practice (the loader doesn't panic on user data;
    /// shape mismatches go through `ShapeMismatch`).
    #[error("blocking load task failed: {0}")]
    JoinError(String),

    /// `HotUpdateable::validate` rejected the loaded snapshot. The
    /// `reason` is human-readable and dev-facing — surfaces in the
    /// RRD devtool's Logs tab as the daemon's
    /// `RRD_PHASE_VALIDATE_FAIL` detail.
    #[error("validate rejected snapshot: {reason}")]
    ValidationFailed {
        /// Why the snapshot failed validation (non-finite output,
        /// wrong dtype, dim mismatch from the synthetic forward).
        reason: String,
    },
}

/// Open the file, parse the safetensors header, return the file
/// handle plus the metadata + the absolute offset where the data
/// section begins. The file handle stays open for the per-tensor
/// `seek + read_exact` calls that follow.
fn open_and_parse_header(
    path: &Path,
) -> Result<(File, Metadata, u64), LoaderError> {
    let path_str = || path.display().to_string();

    let mut file = File::open(path).map_err(|source| LoaderError::Io {
        path: path_str(),
        source,
    })?;

    // First 8 bytes — little-endian u64 = JSON header length N.
    let mut len_buf = [0u8; 8];
    file.read_exact(&mut len_buf).map_err(|source| LoaderError::Io {
        path: path_str(),
        source,
    })?;
    let json_header_len = u64::from_le_bytes(len_buf) as usize;

    // Read the JSON header. Allocate one buffer holding both the
    // 8-byte length prefix and the JSON body so we can hand it off to
    // `SafeTensors::read_metadata` whole.
    let mut header_buf = vec![0u8; 8 + json_header_len];
    header_buf[..8].copy_from_slice(&len_buf);
    file.read_exact(&mut header_buf[8..])
        .map_err(|source| LoaderError::Io {
            path: path_str(),
            source,
        })?;

    // Parse — returns (n_bytes_read, Metadata). `n_bytes_read` equals
    // `8 + json_header_len` and is also the absolute offset where the
    // data section begins.
    let (data_start, metadata) = SafeTensors::read_metadata(&header_buf)?;
    Ok((file, metadata, data_start as u64))
}

/// Read one tensor's raw bytes from the file and convert to F32
/// `TensorData`. Issues exactly one `seek` + `read_exact` per call,
/// so peak transient memory is bounded by this tensor alone.
fn read_tensor_data(
    file: &mut File,
    metadata: &Metadata,
    data_start: u64,
    key: &str,
) -> Result<TensorData, LoaderError> {
    // `Metadata::info` returns `Option<&TensorInfo>`. Newer crate
    // versions may rename this; treating it as a method keeps the
    // call site single-line and the error path uniform.
    let info = metadata
        .info(key)
        .ok_or_else(|| LoaderError::MissingTensor { key: key.to_string() })?;

    let (start, end) = info.data_offsets;
    let absolute = data_start + start as u64;
    let length = end - start;

    file.seek(SeekFrom::Start(absolute))
        .map_err(|source| LoaderError::Io {
            path: format!("(seek for {key})"),
            source,
        })?;

    let mut raw = vec![0u8; length];
    file.read_exact(&mut raw).map_err(|source| LoaderError::Io {
        path: format!("(read for {key})"),
        source,
    })?;

    let f32_buf: Vec<f32> = match info.dtype {
        Dtype::F32 => raw
            .chunks_exact(4)
            .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
            .collect(),
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
            });
        }
    };

    // Burn 0.21 — `TensorData::shape` is a typed `Shape`, not `Vec<usize>`.
    // `Shape: From<Vec<usize>>` so the bare-Vec form still works via Into,
    // but the explicit `Shape::from(...)` makes the typed seam visible at the
    // call site — Burn's tensor surface is now strict about shape types
    // (release notes 2026-05-07).
    Ok(TensorData::new(
        f32_buf,
        burn::tensor::Shape::from(info.shape.clone()),
    ))
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

/// Look up the shape of a tensor in the metadata without reading
/// its data. Used by every helper to validate geometry before
/// committing to the `seek + read_exact`.
fn lookup_shape<'a>(metadata: &'a Metadata, key: &str) -> Result<&'a [usize], LoaderError> {
    metadata
        .info(key)
        .map(|info| info.shape.as_slice())
        .ok_or_else(|| LoaderError::MissingTensor { key: key.to_string() })
}

/// Load a 2-D tensor with no transpose — embedding weights, etc.
fn load_2d<B: Backend>(
    file: &mut File,
    metadata: &Metadata,
    data_start: u64,
    key: &str,
    expected: [usize; 2],
    device: &B::Device,
) -> Result<Tensor<B, 2>, LoaderError> {
    check_shape(key, &expected, lookup_shape(metadata, key)?)?;
    let data = read_tensor_data(file, metadata, data_start, key)?;
    Ok(Tensor::<B, 2>::from_data(data, device))
}

/// Load a 1-D tensor — RMSNorm scales.
fn load_1d<B: Backend>(
    file: &mut File,
    metadata: &Metadata,
    data_start: u64,
    key: &str,
    expected: usize,
    device: &B::Device,
) -> Result<Tensor<B, 1>, LoaderError> {
    check_shape(key, &[expected], lookup_shape(metadata, key)?)?;
    let data = read_tensor_data(file, metadata, data_start, key)?;
    Ok(Tensor::<B, 1>::from_data(data, device))
}

/// Load a HF-shaped Linear weight `[out, in]` and produce a
/// `Qwen3Linear` whose `weight` is `[in, out]` — transpose at load
/// so forward() stays a clean `x @ W`.
fn load_linear_transposed<B: Backend>(
    file: &mut File,
    metadata: &Metadata,
    data_start: u64,
    key: &str,
    in_features: usize,
    out_features: usize,
    device: &B::Device,
) -> Result<super::qwen3::Qwen3Linear<B>, LoaderError> {
    let hf_weight = load_2d::<B>(
        file,
        metadata,
        data_start,
        key,
        [out_features, in_features],
        device,
    )?;
    Ok(super::qwen3::Qwen3Linear::from_weight(hf_weight.swap_dims(0, 1)))
}

/// Load a Qwen3 model from a single safetensors file using the
/// streaming-read pattern (header parse → per-tensor seek + read).
///
/// **Synchronous and CPU-bound.** Callers in async contexts must
/// wrap in `tokio::task::spawn_blocking` — the `HotUpdateable::load`
/// impl in `hot_update.rs` does this. Calling directly from an async
/// task blocks the runtime for 1-3s on Harrier 0.6B / longer on
/// larger Qwen3 variants.
///
/// # Errors
///
/// - [`LoaderError::Io`] — file unreadable / partial / seek failure.
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
    let (mut file, metadata, data_start) = open_and_parse_header(path)?;

    // Embedding [vocab, hidden] — HF and Burn agree on layout, no transpose.
    let embed_weight = load_2d::<B>(
        &mut file,
        &metadata,
        data_start,
        "model.embed_tokens.weight",
        [cfg.vocab_size, cfg.hidden_size],
        device,
    )?;
    let embed_tokens = super::qwen3::Qwen3Embedding::from_weight(embed_weight);

    // Per-layer parameters.
    let q_dim = cfg.num_attention_heads * cfg.head_dim;
    let kv_dim = cfg.num_key_value_heads * cfg.head_dim;
    let mut layers = Vec::with_capacity(cfg.num_hidden_layers);
    for i in 0..cfg.num_hidden_layers {
        layers.push(load_decoder_layer::<B>(
            &mut file,
            &metadata,
            data_start,
            i,
            cfg,
            q_dim,
            kv_dim,
            device,
        )?);
    }

    // Final RMSNorm.
    let final_norm_weight = load_1d::<B>(
        &mut file,
        &metadata,
        data_start,
        "model.norm.weight",
        cfg.hidden_size,
        device,
    )?;
    let final_norm = super::qwen3::Qwen3RmsNorm::from_weight(final_norm_weight, cfg.rms_norm_eps);

    Ok(Qwen3Model::from_components(embed_tokens, layers, final_norm))
}

/// Load one decoder layer at index `i`. Hoisted so the loop in
/// `load_qwen3_from_safetensors` stays single-screen.
#[allow(clippy::too_many_arguments)] // hoisted helper — every arg threads through; would defeat the helper to bundle them
#[tracing::instrument(skip(file, metadata, cfg, device), fields(layer = i))]
fn load_decoder_layer<B: Backend>(
    file: &mut File,
    metadata: &Metadata,
    data_start: u64,
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
        file,
        metadata,
        data_start,
        &format!("{prefix}.self_attn.q_proj.weight"),
        cfg.hidden_size,
        q_dim,
        device,
    )?;
    let k_proj = load_linear_transposed::<B>(
        file,
        metadata,
        data_start,
        &format!("{prefix}.self_attn.k_proj.weight"),
        cfg.hidden_size,
        kv_dim,
        device,
    )?;
    let v_proj = load_linear_transposed::<B>(
        file,
        metadata,
        data_start,
        &format!("{prefix}.self_attn.v_proj.weight"),
        cfg.hidden_size,
        kv_dim,
        device,
    )?;
    let o_proj = load_linear_transposed::<B>(
        file,
        metadata,
        data_start,
        &format!("{prefix}.self_attn.o_proj.weight"),
        q_dim,
        cfg.hidden_size,
        device,
    )?;

    let gate_proj = load_linear_transposed::<B>(
        file,
        metadata,
        data_start,
        &format!("{prefix}.mlp.gate_proj.weight"),
        cfg.hidden_size,
        cfg.intermediate_size,
        device,
    )?;
    let up_proj = load_linear_transposed::<B>(
        file,
        metadata,
        data_start,
        &format!("{prefix}.mlp.up_proj.weight"),
        cfg.hidden_size,
        cfg.intermediate_size,
        device,
    )?;
    let down_proj = load_linear_transposed::<B>(
        file,
        metadata,
        data_start,
        &format!("{prefix}.mlp.down_proj.weight"),
        cfg.intermediate_size,
        cfg.hidden_size,
        device,
    )?;

    let input_norm_weight = load_1d::<B>(
        file,
        metadata,
        data_start,
        &format!("{prefix}.input_layernorm.weight"),
        cfg.hidden_size,
        device,
    )?;
    let post_attn_norm_weight = load_1d::<B>(
        file,
        metadata,
        data_start,
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
    let input_norm = super::qwen3::Qwen3RmsNorm::from_weight(input_norm_weight, cfg.rms_norm_eps);
    let post_attn_norm =
        super::qwen3::Qwen3RmsNorm::from_weight(post_attn_norm_weight, cfg.rms_norm_eps);

    Ok(super::qwen3::Qwen3DecoderLayer::from_components(
        input_norm,
        attention,
        post_attn_norm,
        mlp,
    ))
}
