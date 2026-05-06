//! # `CortexBurnAdapter` — clyffy's `BurnEncoderAdapter` impl
//!
//! Implements `model_loader::backends::burn_adapter::BurnEncoderAdapter`
//! so the kernel slot loader's `BackendType::Burn` dispatch can reach
//! `BurnEmbedder<NdArray>` without model-loader importing clyffy
//! types directly.
//!
//! ## How the slot loader uses this
//!
//! 1. User clicks "Install Harrier into rag.embedder."
//! 2. `install_to_slot` chains download → scan → assign → load.
//! 3. `load_slot` resolves backend = `BackendType::Burn` (router
//!    routes safetensors + Embedding capability here).
//! 4. The match arm in `service.rs` calls
//!    `self.boot.burn_encoder_adapter.as_ref().load_blocking(path)`.
//! 5. This adapter calls `<BurnEmbedder<B> as
//!    rrd::HotUpdateable>::load(source)`, then `validate(snap)`,
//!    then stores the live `Arc<BurnEmbedder<B>>` in an internal
//!    `ArcSwap` slot.
//! 6. RRO services in clyffy that need to embed text read the live
//!    `Arc` via `current()`.
//!
//! ## Why ArcSwap + Option
//!
//! `ArcSwap<Option<Arc<BurnEmbedder<B>>>>` lets:
//! - Concurrent readers see the latest live encoder atomically.
//! - The `Option` distinguishes "never loaded" from "load failed
//!   mid-flight" — the latter rolls back to the previous live `Arc`,
//!   the former leaves `None`.
//! - The future RRD daemon swaps in new encoders by writing through
//!   this same slot.

#![cfg(any(feature = "burn-cpu", feature = "burn-cuda"))]

use std::path::Path;
use std::sync::Arc;

use arc_swap::ArcSwap;
use burn::prelude::Backend;
use model_loader::backends::burn_adapter::BurnEncoderAdapter;
use model_loader::loading::states::MemoryFootprint;
use rrd::HotUpdateable;

use super::embedder::{BurnEmbedder, EmbedderConfig};
use super::hot_update::BurnEmbedderSource;
use super::qwen3::Qwen3Config;

/// Concrete adapter — generic over the Burn backend so the engine
/// can choose `NdArray` (CPU) or `Cuda` (GPU) at boot. The slot
/// loader holds it as `Arc<dyn BurnEncoderAdapter>` so the generic
/// is erased at the model-loader boundary.
pub struct CortexBurnAdapter<B: Backend>
where
    B::Device: Default + Clone + Send + Sync + 'static,
{
    /// Geometry the loaded encoder must match. Cloned into each
    /// `BurnEmbedderSource` at load time. Authoritative until we
    /// support per-tier model variants whose geometry differs from
    /// Harrier 0.6B (then we'd select per-load).
    config: EmbedderConfig,

    /// Backend device. Cloned into each `BurnEmbedderSource`. CPU
    /// device is `Default`, CUDA device carries an index.
    device: B::Device,

    /// Live encoder slot. `None` until first successful load. Future
    /// hot-updates swap a new `Arc` in atomically without dropping
    /// reader references.
    slot: ArcSwap<Option<Arc<BurnEmbedder<B>>>>,
}

impl<B: Backend> CortexBurnAdapter<B>
where
    B::Device: Default + Clone + Send + Sync + 'static,
{
    /// Construct an empty adapter — no encoder loaded yet. Engine
    /// boot supplies the geometry config (typically Harrier 0.6B
    /// dims) and device, then hands the adapter to
    /// `ModelLoaderService::new`.
    pub fn new(config: EmbedderConfig, device: B::Device) -> Self {
        Self {
            config,
            device,
            slot: ArcSwap::from_pointee(None),
        }
    }

    /// Convenience for the default Harrier 0.6B geometry. Matches
    /// the dims declared in `kernel/model-loader/config/presets.default.toml`.
    pub fn harrier_0_6b(device: B::Device) -> Self {
        let mut model = Qwen3Config::new();
        // Harrier 0.6B published geometry.
        model.vocab_size = 151_936;
        model.hidden_size = 1024;
        model.num_hidden_layers = 28;
        model.num_attention_heads = 16;
        model.num_key_value_heads = 8;
        model.head_dim = 64;
        model.intermediate_size = 3072;
        model.max_position_embeddings = 32_768;
        Self::new(EmbedderConfig::new(model), device)
    }

    /// Borrow the live encoder if loaded. Used by RRO services
    /// downstream that consume the encoder via forward passes.
    /// Returns `None` until the first successful load.
    #[must_use]
    pub fn current(&self) -> Option<Arc<BurnEmbedder<B>>> {
        self.slot.load_full().as_ref().clone()
    }
}

impl<B> BurnEncoderAdapter for CortexBurnAdapter<B>
where
    B: Backend,
    B::Device: Default + Clone + Send + Sync + 'static,
{
    fn load_blocking(&self, path: &Path) -> anyhow::Result<MemoryFootprint> {
        let source = BurnEmbedderSource {
            safetensors_path: path.to_path_buf(),
            config: self.config.clone(),
            device: self.device.clone(),
        };

        // The HotUpdateable trait methods are async, but the load
        // is genuinely sync work wrapped in async fn. Bridge with a
        // current-thread runtime so the kernel slot loader's
        // spawn_blocking thread (which is what calls us) gets sync
        // semantics. Building a tiny single-thread runtime per load
        // is cheap (~hundred microseconds) and avoids needing a
        // tokio handle on the calling thread.
        let runtime = tokio::runtime::Builder::new_current_thread()
            .build()
            .map_err(|e| anyhow::anyhow!("burn adapter runtime build failed: {e}"))?;

        let snap = runtime
            .block_on(<BurnEmbedder<B> as HotUpdateable>::load(&source))
            .map_err(|e| anyhow::anyhow!("burn load failed: {e:#}"))?;

        runtime
            .block_on(<BurnEmbedder<B> as HotUpdateable>::validate(&snap))
            .map_err(|e| anyhow::anyhow!("burn validate failed: {e:#}"))?;

        let live = <BurnEmbedder<B> as HotUpdateable>::into_live(snap);
        // Atomic publish — concurrent readers see the new encoder
        // without locking. Old `Arc` (if any) drops on this thread.
        self.slot.store(Arc::new(Some(live)));

        // Memory footprint — rough estimate from the model config.
        // Per-parameter bytes = 4 (F32 in Burn). Total params for a
        // Qwen3-family model is dominated by:
        //   - embed_tokens: vocab × hidden
        //   - per layer: 4 × hidden × hidden (attn) +
        //                3 × hidden × intermediate (mlp) +
        //                2 × hidden (norm scales)
        //   - final norm: hidden
        let cfg = &self.config.model;
        let per_layer = 4 * cfg.hidden_size * cfg.hidden_size
            + 3 * cfg.hidden_size * cfg.intermediate_size
            + 2 * cfg.hidden_size;
        let total_params = cfg.vocab_size * cfg.hidden_size
            + cfg.num_hidden_layers * per_layer
            + cfg.hidden_size;
        let bytes = total_params * 4;
        Ok(MemoryFootprint {
            ram_bytes: bytes as u64,
            vram_bytes: 0,
            // KV cache doesn't apply to embedders — they're encode-only,
            // no autoregressive generation. Leave at 0; the budget
            // checker treats this as "no per-request growth."
            kv_cache_bytes: 0,
        })
    }

    fn unload_blocking(&self) -> anyhow::Result<()> {
        // Capture the current Arc on this thread so its Drop runs
        // here, not on a future reader thread.
        let _previous = self.slot.swap(Arc::new(None));
        Ok(())
    }

    fn is_loaded(&self) -> bool {
        self.slot.load().as_ref().is_some()
    }
}
