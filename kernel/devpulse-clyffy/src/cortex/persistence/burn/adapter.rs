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
use rrd::{HotUpdateable, RRD};
use tokio::sync::{watch, Mutex};
use tokenizers::Tokenizer;

use super::embedder::{BurnEmbedder, EmbedderConfig};
use super::hot_update::BurnEmbedderSource;
use super::qwen3::Qwen3Config;
use super::tokenizer::{encode_texts, load_tokenizer};

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

    /// Tokenizer loaded alongside the model weights from `tokenizer.json`
    /// in the same directory as the safetensors file. `None` until first
    /// successful load; cleared by `unload_blocking`.
    tokenizer: ArcSwap<Option<Arc<Tokenizer>>>,

    /// RRD daemon — constructed on first successful encoder load. Owns
    /// the hot-update lifecycle (pause → swap → resume) and emits
    /// `rrd.lifecycle` tracing events that the engine's
    /// `RrdLifecycleTranslator` layer mirrors to the frontend.
    /// `None` until the first successful `load_blocking` call.
    daemon: Arc<Mutex<Option<RRD<BurnEmbedder<B>>>>>,
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
            tokenizer: ArcSwap::from_pointee(None),
            daemon: Arc::new(Mutex::new(None)),
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

    /// Snapshot the current RRD lifecycle state. `None` if the daemon
    /// has not been constructed yet (encoder never loaded).
    #[must_use]
    pub fn rrd_state(&self) -> Option<rrd::RRDState> {
        self.daemon
            .blocking_lock()
            .as_ref()
            .map(|d| d.subscribe().borrow().clone())
    }

    /// Subscribe to RRD lifecycle state changes. Returns a
    /// `watch::Receiver<RRDState>` — call `.borrow()` for current
    /// state or `.changed().await` for the next transition.
    /// Returns `None` if the daemon is not yet constructed.
    #[must_use]
    pub fn subscribe_rrd(&self) -> Option<watch::Receiver<rrd::RRDState>> {
        self.daemon
            .blocking_lock()
            .as_ref()
            .map(|d| d.subscribe())
    }

    /// Embed a batch of texts into L2-normalized dense vectors.
    ///
    /// Returns one `Vec<f32>` of length `hidden_size` per input text,
    /// in the same order as `texts`. Errors if the encoder or tokenizer
    /// is not loaded yet.
    ///
    /// This is a **blocking** call (Burn NdArray is synchronous CPU).
    /// Async callers must wrap with `tokio::task::spawn_blocking`.
    pub fn embed_text(&self, texts: &[&str]) -> anyhow::Result<Vec<Vec<f32>>> {
        let encoder = self
            .current()
            .ok_or_else(|| anyhow::anyhow!("embed_text: encoder not loaded"))?;
        let tok = self
            .tokenizer
            .load_full()
            .as_ref()
            .clone()
            .ok_or_else(|| anyhow::anyhow!("embed_text: tokenizer not loaded"))?;

        let (token_ids, attention_mask) =
            encode_texts::<B>(&tok, texts, &self.device)?;

        let pooled = encoder.forward_pooled(token_ids, attention_mask);
        let hidden = self.config.model.hidden_size;
        let flat: Vec<f32> = pooled
            .into_data()
            .into_vec::<f32>()
            .map_err(|e| anyhow::anyhow!("embed_text: tensor extraction failed: {e:?}"))?;

        Ok(flat.chunks(hidden).map(|c| c.to_vec()).collect())
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

        // Construct or replace the RRD daemon with the new live encoder.
        // Clone the Arc before storing so the daemon holds its own
        // independent reference — the ArcSwap slot holds a second Arc,
        // and the daemon holds a third. Both drop independently.
        //
        // `blocking_lock` is safe here: we're on a tokio blocking thread
        // (spawn_blocking), and no other code holds this mutex for more
        // than a few microseconds. The daemon also emits
        // `emit_rrd_lifecycle!("ready", ...)` inside `RRD::new`, which
        // the engine's `RrdLifecycleTranslator` tracing layer intercepts
        // and re-emits as `InternalEvent::RrdPhaseTransition` → frontend.
        *self.daemon.blocking_lock() = Some(RRD::new(live.clone()));

        // Atomic publish — concurrent readers see the new encoder
        // without locking. Old `Arc` (if any) drops on this thread.
        self.slot.store(Arc::new(Some(live)));

        // Load tokenizer from the same directory as the weights.
        // Qwen3 / Harrier ship `tokenizer.json` alongside the safetensors.
        let model_dir = path
            .parent()
            .ok_or_else(|| anyhow::anyhow!("burn load: safetensors path has no parent dir"))?;
        let tok = load_tokenizer(model_dir)
            .map_err(|e| anyhow::anyhow!("burn load: tokenizer: {e:#}"))?;
        self.tokenizer.store(Arc::new(Some(tok)));

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
        // Capture the current Arcs on this thread so their Drops run
        // here, not on a future reader thread.
        let _prev_encoder = self.slot.swap(Arc::new(None));
        let _prev_tokenizer = self.tokenizer.swap(Arc::new(None));
        // Drop the daemon on this thread too. Its Drop emits no
        // lifecycle events — the daemon doesn't know it's being
        // dropped. The devtool infers "unloaded" from the slot status.
        let _prev_daemon = self.daemon.blocking_lock().take();
        Ok(())
    }

    fn is_loaded(&self) -> bool {
        self.slot.load().as_ref().is_some()
    }

    fn embed_texts_blocking(&self, texts: &[&str]) -> anyhow::Result<Vec<Vec<f32>>> {
        self.embed_text(texts)
    }
}
