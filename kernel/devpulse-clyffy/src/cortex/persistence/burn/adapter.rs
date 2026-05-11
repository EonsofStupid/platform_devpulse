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

    /// Borrow the embedder geometry config. Carries `hidden_size`,
    /// `vocab_size`, `num_hidden_layers`, etc. — the same shape the
    /// loaded encoder will/does match. Used by the `cag::Embedder`
    /// trait impl (see `embedder_impl.rs`) to surface `dimension()`
    /// without re-parsing `config.json`.
    #[must_use]
    pub fn config(&self) -> &EmbedderConfig {
        &self.config
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
        // Derive hidden_size from the actual tensor output, not the boot-time
        // config — the adapter may load 270M or 0.6B depending on hardware tier
        // and each has a different hidden dimension.
        let [_batch, hidden] = pooled.dims();
        let flat: Vec<f32> = pooled
            .into_data()
            .into_vec::<f32>()
            .map_err(|e| anyhow::anyhow!("embed_text: tensor extraction failed: {e:?}"))?;

        Ok(flat.chunks(hidden).map(|c| c.to_vec()).collect())
    }
}

/// Read `config.json` from `model_dir` and build an [`EmbedderConfig`] from it.
///
/// Supports both Harrier 0.6B (28 layers, hidden 1024) and Harrier 270M (fewer
/// layers, smaller hidden dim). The loader reads actual tensor shapes from the
/// safetensors file, so any mismatch between `EmbedderConfig` and the file
/// surfaces as [`LoaderError::ShapeMismatch`] — using the real config.json
/// prevents that failure for models whose geometry differs from the boot default.
///
/// Falls back to `fallback` on any I/O or parse error (config.json absent in
/// dev sandboxes or custom model dirs) so the adapter stays usable.
fn load_geometry_from_config_json(model_dir: &Path, fallback: &EmbedderConfig) -> EmbedderConfig {
    let config_path = model_dir.join("config.json");
    let raw = match std::fs::read_to_string(&config_path) {
        Ok(s) => s,
        Err(e) => {
            tracing::warn!(
                path = %config_path.display(),
                error = %e,
                "config.json not found — using boot-time geometry defaults"
            );
            return fallback.clone();
        }
    };
    let json: serde_json::Value = match serde_json::from_str(&raw) {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!(error = %e, "config.json parse failed — using boot-time geometry defaults");
            return fallback.clone();
        }
    };

    let fb = &fallback.model;
    let get_usize = |key: &str, default: usize| -> usize {
        json.get(key)
            .and_then(|v| v.as_u64())
            .map(|v| v as usize)
            .unwrap_or(default)
    };
    let get_f64 = |key: &str, default: f64| -> f64 {
        json.get(key)
            .and_then(|v| v.as_f64())
            .unwrap_or(default)
    };

    let vocab_size = get_usize("vocab_size", fb.vocab_size);
    let hidden_size = get_usize("hidden_size", fb.hidden_size);
    let num_hidden_layers = get_usize("num_hidden_layers", fb.num_hidden_layers);
    let num_attention_heads = get_usize("num_attention_heads", fb.num_attention_heads);
    let num_key_value_heads = get_usize("num_key_value_heads", fb.num_key_value_heads);
    // head_dim is often absent from config.json; derive it when missing.
    let head_dim = get_usize(
        "head_dim",
        hidden_size / num_attention_heads.max(1),
    );
    let intermediate_size = get_usize("intermediate_size", fb.intermediate_size);
    let rms_norm_eps = get_f64("rms_norm_eps", fb.rms_norm_eps);
    let rope_theta = get_f64("rope_theta", fb.rope_theta);
    let max_position_embeddings = get_usize("max_position_embeddings", fb.max_position_embeddings);

    let mut model = super::qwen3::Qwen3Config::new();
    model.vocab_size = vocab_size;
    model.hidden_size = hidden_size;
    model.num_hidden_layers = num_hidden_layers;
    model.num_attention_heads = num_attention_heads;
    model.num_key_value_heads = num_key_value_heads;
    model.head_dim = head_dim;
    model.intermediate_size = intermediate_size;
    model.rms_norm_eps = rms_norm_eps;
    model.rope_theta = rope_theta;
    model.max_position_embeddings = max_position_embeddings;

    tracing::info!(
        hidden = hidden_size,
        layers = num_hidden_layers,
        heads = num_attention_heads,
        kv_heads = num_key_value_heads,
        head_dim,
        intermediate = intermediate_size,
        vocab = vocab_size,
        "Burn encoder: geometry resolved from config.json"
    );

    EmbedderConfig::new(model)
}

impl<B> BurnEncoderAdapter for CortexBurnAdapter<B>
where
    B: Backend,
    B::Device: Default + Clone + Send + Sync + 'static,
{
    fn load_blocking(&self, path: &Path) -> anyhow::Result<MemoryFootprint> {
        // Derive actual model geometry from config.json in the model directory.
        // This is critical for tier-adaptive loading: High-end gets Harrier 0.6B,
        // Floor gets Harrier 270M — each has different layer counts + hidden dims.
        // Falls back to the boot-time 0.6B defaults if config.json is absent.
        let model_dir = path
            .parent()
            .ok_or_else(|| anyhow::anyhow!("burn load: safetensors path has no parent dir"))?;
        let config = load_geometry_from_config_json(model_dir, &self.config);

        let source = BurnEmbedderSource {
            safetensors_path: path.to_path_buf(),
            config: config.clone(),
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
        let tok = load_tokenizer(model_dir)
            .map_err(|e| anyhow::anyhow!("burn load: tokenizer: {e:#}"))?;
        self.tokenizer.store(Arc::new(Some(tok)));

        // Memory footprint — rough estimate from the model config.
        // Per-parameter bytes = 2 (bf16 storage). On CPU this is selected
        // at runtime by `set_default_dtypes(FloatDType::BF16, …)` called
        // once at boot; on CUDA it's pinned by the `Cuda<bf16>` generic.
        // See the `EmbedderCpuBackend` / `EmbedderCudaBackend` aliases in
        // `super::mod.rs` for the per-backend mechanism. Total params for
        // a Qwen3-family model is dominated by:
        //   - embed_tokens: vocab × hidden
        //   - per layer: 4 × hidden × hidden (attn) +
        //                3 × hidden × intermediate (mlp) +
        //                2 × hidden (norm scales)
        //   - final norm: hidden
        // Use the actually-loaded geometry (from config.json), not the
        // boot-time 0.6B default, so footprint is correct for Harrier 270M.
        let cfg = &config.model;
        let per_layer = 4 * cfg.hidden_size * cfg.hidden_size
            + 3 * cfg.hidden_size * cfg.intermediate_size
            + 2 * cfg.hidden_size;
        let total_params = cfg.vocab_size * cfg.hidden_size
            + cfg.num_hidden_layers * per_layer
            + cfg.hidden_size;
        let bytes = total_params * 2;
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
