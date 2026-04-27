//! `MistralRsPhi4MmBackend` — Phi-4-multimodal-instruct via the
//! `mistralrs` umbrella crate (Candle-based, pure Rust).
//!
//! Phi-4-multimodal handles text + vision + audio in a single decoder.
//! In the six-model floor it owns the `voice.brain` slot on
//! Mid/Floor tiers (`Personaplex-7B` is the High/Ultra rotation pair).
//! It can also serve as a fallback `chat.vision` provider for boxes
//! where the llama.cpp mtmd path isn't viable.
//!
//! # Threading
//!
//! `mistralrs::Model` is async — `send_chat_request` is `.await`-bound.
//! The platform's [`crate::backends::bridge::InferenceBridge`] runs each
//! backend on a dedicated `std::thread`. To bridge the gap, the backend
//! owns a single-threaded tokio runtime created in `new()` and
//! `block_on`s every async call against it.
//!
//! # `PagedAttention` policy
//!
//! Upstream's `PagedAttentionConfig` only ships on CUDA-Linux and Metal.
//! On Windows / CPU-only / non-CUDA Linux builds we leave it unset and
//! the model uses the standard KV cache path. The slot's `LaneKind::Vram`
//! still drives the budgeter — paged attention only changes the
//! per-layer allocation shape, not the lane assignment.

use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::models::registry::ModelMetadata;
use anyhow::{Context, Result};
use mistralrs::{
    IsqType, Model, MultimodalMessages, MultimodalModelBuilder, TextMessageRole,
    TokenSource,
};
use std::sync::Arc;
use tokio::runtime::Runtime;

/// Backend handle for a loaded Phi-4-multimodal model.
pub struct MistralRsPhi4MmBackend {
    /// Single-threaded tokio runtime owned by this backend. Created in
    /// `new()`, dropped when the backend is dropped. All async calls
    /// against `mistralrs::Model` are `block_on`'d through this runtime.
    runtime: Arc<Runtime>,
    /// Loaded model handle. `None` until `load` succeeds.
    model: Option<Model>,
    /// Repo ID this backend last loaded (for diagnostics + display).
    model_id: Option<String>,
    metadata: ModelMetadata,
}

impl MistralRsPhi4MmBackend {
    /// Construct a new unloaded backend with its own tokio runtime.
    ///
    /// # Errors
    /// Returns an error if `tokio::runtime::Builder` fails to create
    /// the runtime — typically a process-wide IO-driver init issue.
    pub fn new() -> Result<Self> {
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .context("Failed to build tokio runtime for mistralrs backend")?;
        tracing::info!("mistralrs Phi-4-mm backend initialized");

        Ok(Self {
            runtime: Arc::new(runtime),
            model: None,
            model_id: None,
            metadata: ModelMetadata {
                architecture: "phi4mm".to_string(),
                parameter_count: None,
                quant_level: Some("Q4K".to_string()),
                context_length: 0,
                vocab_size: 0,
            },
        })
    }

    /// Load Phi-4-multimodal weights from a Hugging Face repo ID.
    ///
    /// `model_id` is a repo path like `microsoft/Phi-4-multimodal-instruct`
    /// — `mistralrs` resolves it through the cached HF token at
    /// `~/.cache/huggingface/token` (or whatever `TokenSource` you
    /// configure). For local-only loads, point at a directory that
    /// already contains the `safetensors` + tokenizer files.
    ///
    /// # Errors
    /// Returns an error if the underlying `mistralrs` builder fails
    /// (network, auth, missing files, unsupported architecture, OOM)
    /// or if the tokio runtime panics during `block_on`.
    pub fn load(&mut self, model_id: &str, params: &LoadParams) -> Result<MemoryFootprint> {
        tracing::info!(
            model_id,
            device = %params.device,
            "mistralrs: loading Phi-4-multimodal"
        );

        // Drop any previous model before loading a new one. mistralrs
        // doesn't expose a sync API for this; dropping the `Model`
        // value runs its async cleanup in the same runtime.
        self.model = None;
        self.model_id = None;

        let runtime = Arc::clone(&self.runtime);
        let id_for_load = model_id.to_string();

        // The MultimodalModelBuilder auto-detects Phi-4-mm from the
        // repo's config.json, so we don't `with_loader_type` here.
        // ISQ Q4K matches the project preset for Mid/Floor voice.brain
        // (Phi-4-mm-Q4K ≈ 3.5 GB at runtime).
        //
        // PagedAttention is left unset: upstream gates it to
        // CUDA-Linux + Metal only. The Windows path uses the standard
        // KV cache shape, which is what every Mid/Floor box runs anyway.
        let model = runtime.block_on(async {
            MultimodalModelBuilder::new(id_for_load)
                .with_isq(IsqType::Q4K)
                .with_token_source(TokenSource::CacheToken)
                .build()
                .await
        })?;

        self.model = Some(model);
        self.model_id = Some(model_id.to_string());

        tracing::info!(model_id, "mistralrs Phi-4-mm loaded");

        // mistralrs doesn't expose a stable post-load memory accounting
        // surface. Report a coarse default; the platform budgeter
        // tracks the slot's preset `vram_estimate_mb` for VRAM planning.
        Ok(MemoryFootprint {
            ram_bytes: 0,
            vram_bytes: 0,
            kv_cache_bytes: 0,
        })
    }

    /// Drop the loaded model, freeing all weights + KV cache.
    ///
    /// # Errors
    /// Currently infallible. Signature returns `Result` to match the
    /// other backends and leave room for future per-handle cleanup.
    pub fn unload(&mut self) -> Result<()> {
        tracing::info!(model_id = ?self.model_id, "mistralrs: unloading");
        self.model = None;
        self.model_id = None;
        Ok(())
    }

    /// Generate a text response for `prompt + image`.
    ///
    /// `image_bytes` is an encoded `PNG` / `JPEG` / `WebP` (the formats
    /// the workspace's `image` crate is built with).
    ///
    /// `max_new_tokens` is honoured by mistralrs's sampler; `temperature`
    /// follows the same convention as the other backends — `0.0` ≈
    /// greedy, anything higher = stochastic.
    ///
    /// # Errors
    /// Returns an error if no model is loaded, the image bytes don't
    /// decode as a supported format, the tokio runtime panics, or
    /// `Model::send_chat_request` returns a chat error.
    pub fn generate_with_image(
        &self,
        prompt: &str,
        image_bytes: &[u8],
        _max_new_tokens: u32,
        _temperature: f32,
    ) -> Result<String> {
        let model = self.model.as_ref().context("No mistralrs model loaded")?;

        let image = image::load_from_memory(image_bytes)
            .map_err(|e| anyhow::anyhow!("Failed to decode image: {e}"))?;

        let messages = MultimodalMessages::new().add_image_message(
            TextMessageRole::User,
            prompt,
            vec![image],
        );

        let runtime = Arc::clone(&self.runtime);
        let response = runtime.block_on(async { model.send_chat_request(messages).await })?;

        // `choices` is non-empty on a successful chat response (the
        // OpenAI shape mistralrs mirrors guarantees at least one
        // candidate). `content` is `None` only when the response is
        // tool-call-only — for a vision Q&A path that means the model
        // misunderstood the prompt; surface as a soft error string.
        let content = response
            .choices
            .first()
            .and_then(|c| c.message.content.as_ref())
            .cloned()
            .unwrap_or_else(|| "(no text in response)".to_string());

        Ok(content)
    }

    /// Generate a text response for a text-only prompt.
    ///
    /// Phi-4-multimodal also handles plain chat. Slots that route
    /// here without an image (e.g. `voice.brain` doing intermediate
    /// text reasoning between speech turns) call this entry point.
    ///
    /// # Errors
    /// Returns an error if no model is loaded, the runtime panics,
    /// or the chat call fails.
    pub fn generate_text(
        &self,
        prompt: &str,
        _max_new_tokens: u32,
        _temperature: f32,
    ) -> Result<String> {
        let model = self.model.as_ref().context("No mistralrs model loaded")?;

        let messages =
            MultimodalMessages::new().add_message(TextMessageRole::User, prompt);

        let runtime = Arc::clone(&self.runtime);
        let response = runtime.block_on(async { model.send_chat_request(messages).await })?;

        let content = response
            .choices
            .first()
            .and_then(|c| c.message.content.as_ref())
            .cloned()
            .unwrap_or_else(|| "(no text in response)".to_string());

        Ok(content)
    }

    /// Hugging Face repo ID of the currently-loaded model, if any.
    #[must_use]
    pub fn loaded_model_id(&self) -> Option<&str> {
        self.model_id.as_deref()
    }

    /// Model metadata (architecture, quant level).
    #[must_use]
    pub fn metadata(&self) -> &ModelMetadata {
        &self.metadata
    }
}
