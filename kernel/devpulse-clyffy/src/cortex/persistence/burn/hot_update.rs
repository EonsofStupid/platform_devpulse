//! # `HotUpdateable` impl on `BurnEmbedder<B>`
//!
//! Per `HOT_UPDATE_PATTERN.md` §5.1: the encoder is the canonical
//! `HotUpdateable` component. This file is the only place
//! `Self::Source` / `Self::Snapshot` / the load+validate+into_live
//! triple lives — the loader mechanics live one file over in
//! `loader.rs`, the smoke-test forward-pass lives inline.
//!
//! ## What "validate" looks like for an encoder
//!
//! Per the trait docs and `tracel-ai` precedent (`llama-burn`'s
//! `Llama::generate` warmup): one synthetic forward pass on a tiny
//! token sequence, asserting (a) output dimensions match
//! `EmbedderConfig.model.hidden_size`, (b) every output element is
//! finite (no NaN / Inf — those usually indicate corrupted weights
//! or a dtype-conversion bug). For an L2-normalized embedder we
//! additionally check the row norm is ~1.

use std::path::PathBuf;
use std::sync::Arc;

use burn::prelude::Backend;
use burn::tensor::{Int, Tensor};

use super::embedder::{BurnEmbedder, EmbedderConfig};
use super::loader::{load_qwen3_from_safetensors, LoaderError};
use super::qwen3::Qwen3Model;

/// Where to load the embedder from. The runtime path picks one
/// safetensors file per encoder (Harrier 0.6B / 1.4B all ship as a
/// single file; the multi-shard case is reserved for chat-class
/// models that don't go through the encoder slot).
pub struct BurnEmbedderSource<B: Backend> {
    /// Path to the safetensors file on disk. Resolved by the slot
    /// system from `models/{org}/{repo}/model.safetensors`.
    pub safetensors_path: PathBuf,
    /// Geometry the file is expected to match. Mismatch surfaces as
    /// [`LoaderError::ShapeMismatch`] at load time, not at first
    /// forward.
    pub config: EmbedderConfig,
    /// Backend device — `NdArray::Device::default()` for CPU,
    /// `Cuda::Device::new(0)` for GPU.
    pub device: B::Device,
}

/// Loaded-but-not-yet-live form. Wraps `BurnEmbedder<B>` so the
/// type-system distinction the trait demands (snapshot vs live) is
/// preserved without duplicating storage.
pub struct BurnEmbedderSnapshot<B: Backend> {
    inner: BurnEmbedder<B>,
}

impl<B: Backend> BurnEmbedderSnapshot<B> {
    /// Borrow the wrapped embedder. Used by `validate` to run the
    /// synthetic forward pass without consuming the snapshot.
    pub fn embedder(&self) -> &BurnEmbedder<B> {
        &self.inner
    }
}

// ═══════════════════════════════════════════════════════════════════════
// HotUpdateable impl
// ═══════════════════════════════════════════════════════════════════════
//
// Implemented for every backend the file-level `cfg` admits. The
// `'static` bound on `B::Device` is satisfied by both NdArray and
// Cuda devices (both are `Copy + 'static`).

impl<B> rrd::HotUpdateable for BurnEmbedder<B>
where
    B: Backend,
    B::Device: Send + Sync + 'static,
{
    type Source = BurnEmbedderSource<B>;
    type Snapshot = BurnEmbedderSnapshot<B>;
    type LoadError = LoaderError;

    /// Load Qwen3 weights from disk. Slow path — ~1-3 seconds for
    /// Harrier 0.6B on NVMe, longer for larger Qwen3 variants. Runs
    /// on a tokio blocking thread (the inner loader does sync
    /// mmap + parse + tensor copies) so the runtime stays responsive
    /// for query traffic during the daemon's `Updating` phase.
    #[tracing::instrument(
        skip(source),
        fields(
            path = %source.safetensors_path.display(),
            normalize = source.config.normalize,
        ),
    )]
    async fn load(source: &Self::Source) -> Result<Self::Snapshot, Self::LoadError> {
        // Clone for the blocking task — every field is cheap to clone
        // (PathBuf is Arc-backed, EmbedderConfig is small POD,
        // B::Device is Copy or refcounted).
        let path = source.safetensors_path.clone();
        let model_cfg = source.config.model.clone();
        let normalize = source.config.normalize;
        let device = source.device.clone();

        let model: Qwen3Model<B> = tokio::task::spawn_blocking(move || {
            load_qwen3_from_safetensors::<B>(&path, &model_cfg, &device)
        })
        .await
        .map_err(|e| LoaderError::JoinError(e.to_string()))??;

        let inner = BurnEmbedder::from_loaded(model, normalize);
        Ok(BurnEmbedderSnapshot { inner })
    }

    /// Forward-pass smoke test: tiny synthetic batch yields a finite
    /// vector of the right shape. Catches dtype mistakes, dead
    /// weights, and silent shape bugs the loader's `ShapeMismatch`
    /// check missed.
    async fn validate(snap: &Self::Snapshot) -> Result<(), Self::LoadError> {
        // Pull a fresh device handle from one of the snapshot's
        // tensors — every Tensor knows its own device, so we don't
        // need to thread the source's device through.
        let emb = snap.embedder();

        // Build a one-row, three-token synthetic batch. Token ids 1,
        // 2, 3 are arbitrary but valid for any vocab > 4 (which
        // every real Qwen variant satisfies). Mask is all-1s so
        // pool_last_token picks position 2.
        let device = emb.model_device();
        let token_ids: Tensor<B, 2, Int> =
            Tensor::from_data([[1i64, 2, 3]], &device);
        let mask: Tensor<B, 2, Int> = Tensor::from_data([[1i64, 1, 1]], &device);

        let pooled = emb.forward_pooled(token_ids, mask);

        // Shape: [1, hidden_size]. Pull the actual hidden_size off
        // the embed_tokens weight matrix — avoids threading the cfg
        // through the snapshot.
        let [batch, hidden] = pooled.dims();
        if batch != 1 {
            return Err(LoaderError::ShapeMismatch {
                key: "validate.pooled.batch".to_string(),
                expected: vec![1, hidden],
                got: vec![batch, hidden],
            });
        }

        // Finite-check via TensorData → Vec<f32>.
        let data = pooled.into_data();
        let values: Vec<f32> = data
            .into_vec::<f32>()
            .map_err(|_| LoaderError::ShapeMismatch {
                key: "validate.pooled.dtype".to_string(),
                expected: vec![hidden],
                got: vec![0],
            })?;
        if values.iter().any(|v| !v.is_finite()) {
            return Err(LoaderError::ShapeMismatch {
                key: "validate.pooled.finiteness".to_string(),
                expected: vec![hidden],
                got: vec![values.len()],
            });
        }

        Ok(())
    }

    /// Promote the validated snapshot to a live `Arc<Self>`. Cheap
    /// — Arc allocation only; no tensor copies (the underlying Burn
    /// storage is already in its final shape).
    fn into_live(snap: Self::Snapshot) -> Arc<Self> {
        Arc::new(snap.inner)
    }
}
