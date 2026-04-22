//! `LlamaCppBackend` — GGUF inference via llama.cpp FFI.
//!
//! Implements `InferenceBackend` so it plugs into the same `InferenceBridge`
//! and `BackendPool` infrastructure as `CandleBackend`. The router dispatches
//! here for GGUF files when the architecture isn't in Candle's support list.

use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::models::registry::ModelMetadata;
use crate::traits::backend::InferenceBackend;
use anyhow::{Context, Result};
use std::num::NonZeroU32;
use std::path::Path;

use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_backend::LlamaBackend;
use llama_cpp_2::llama_batch::LlamaBatch;
use llama_cpp_2::model::params::LlamaModelParams;
use llama_cpp_2::model::LlamaModel;

/// GGUF inference backend via llama.cpp.
///
/// NOT Sync — lives on a single dedicated thread via `InferenceBridge`.
/// `LlamaModel` is Send+Sync, `LlamaContext` is Send only.
pub struct LlamaCppBackend {
    backend: LlamaBackend,
    /// Model + context stored as opaque pointers. Both dropped together.
    /// Context borrows model, so model MUST outlive context.
    model: Option<*mut LlamaModel>,
    ctx: Option<*mut llama_cpp_2::context::LlamaContext<'static>>,
    metadata: ModelMetadata,
}

// SAFETY: LlamaCppBackend lives on a single dedicated thread (InferenceBridge).
// LlamaModel is Send+Sync. LlamaContext is Send. We never share across threads.
unsafe impl Send for LlamaCppBackend {}

impl LlamaCppBackend {
    /// Create a new unloaded backend.
    pub fn new() -> Result<Self> {
        let backend = LlamaBackend::init().context("Failed to initialize llama.cpp backend")?;
        tracing::info!("llama.cpp backend initialized");

        Ok(Self {
            backend,
            model: None,
            ctx: None,
            metadata: ModelMetadata {
                architecture: String::new(),
                parameter_count: None,
                quant_level: None,
                context_length: 0,
                vocab_size: 0,
            },
        })
    }

    fn model_ref(&self) -> Result<&LlamaModel> {
        self.model
            .map(|p| unsafe { &*p })
            .context("No model loaded")
    }

    fn ctx_ref(&self) -> Result<&llama_cpp_2::context::LlamaContext<'static>> {
        self.ctx
            .map(|p| unsafe { &*p })
            .context("No context available")
    }

    #[allow(clippy::mut_from_ref)]
    fn ctx_mut(&self) -> Result<&mut llama_cpp_2::context::LlamaContext<'static>> {
        self.ctx
            .map(|p| unsafe { &mut *p })
            .context("No context available")
    }
}

impl InferenceBackend for LlamaCppBackend {
    fn load(&mut self, path: &Path, params: LoadParams) -> Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            device = %params.device,
            gpu_layers = ?params.gpu_layers,
            ctx_len = params.context_length,
            "llama.cpp: loading GGUF model"
        );

        // Unload previous if any
        self.unload()?;

        let n_gpu_layers = params
            .gpu_layers
            .unwrap_or(if params.device.starts_with("cuda") {
                99
            } else {
                0
            });

        let model_params = LlamaModelParams::default().with_n_gpu_layers(n_gpu_layers);

        let path_str = path
            .to_str()
            .context("Model path contains non-UTF8 characters")?;

        let model = LlamaModel::load_from_file(&self.backend, path_str, &model_params)
            .map_err(|e| anyhow::anyhow!("llama.cpp model load failed: {e}"))?;

        // Extract metadata
        let n_params = model.n_params() as u64;
        let ctx_train = model.n_ctx_train() as usize;

        let mut arch_buf = vec![0u8; 256];
        let arch = model
            .meta_val_str("general.architecture", &mut arch_buf)
            .map(|s| s.to_string())
            .unwrap_or_else(|_| "unknown".to_string());

        self.metadata = ModelMetadata {
            architecture: arch.clone(),
            parameter_count: Some(n_params),
            quant_level: None,
            context_length: ctx_train,
            vocab_size: 0,
        };

        tracing::info!(
            arch = %arch,
            params = n_params,
            ctx_train,
            n_gpu_layers,
            "llama.cpp: model loaded"
        );

        // Create context
        let n_ctx = NonZeroU32::new(params.context_length as u32)
            .unwrap_or(NonZeroU32::new(4096).expect("non-zero"));

        let ctx_params = LlamaContextParams::default().with_n_ctx(Some(n_ctx));

        let ctx = model
            .new_context(&self.backend, ctx_params)
            .map_err(|e| anyhow::anyhow!("llama.cpp context creation failed: {e}"))?;

        let file_size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);

        // Store as heap-allocated pointers — model must outlive context.
        // We drop ctx first, then model (see Drop impl).
        let model_box = Box::new(model);
        let model_ptr = Box::into_raw(model_box);

        // SAFETY: ctx borrows model, but we ensure model outlives ctx by
        // dropping ctx first in unload() and Drop.
        let ctx_static: llama_cpp_2::context::LlamaContext<'static> =
            unsafe { std::mem::transmute(ctx) };
        let ctx_box = Box::new(ctx_static);
        let ctx_ptr = Box::into_raw(ctx_box);

        self.model = Some(model_ptr);
        self.ctx = Some(ctx_ptr);

        tracing::info!("llama.cpp: context created, backend ready");

        Ok(MemoryFootprint {
            vram_bytes: if n_gpu_layers > 0 { file_size } else { 0 },
            ram_bytes: if n_gpu_layers == 0 { file_size } else { 0 },
            kv_cache_bytes: 0,
        })
    }

    fn unload(&mut self) -> Result<()> {
        // Drop context FIRST (borrows model), then model.
        if let Some(ctx_ptr) = self.ctx.take() {
            tracing::info!(arch = %self.metadata.architecture, "llama.cpp: dropping context");
            unsafe {
                drop(Box::from_raw(ctx_ptr));
            }
        }
        if let Some(model_ptr) = self.model.take() {
            tracing::info!("llama.cpp: dropping model");
            unsafe {
                drop(Box::from_raw(model_ptr));
            }
        }
        Ok(())
    }

    fn forward(&self, tokens: &[u32], _position: usize) -> Result<Vec<f32>> {
        let _ctx = self.ctx_mut()?;

        let llama_tokens: Vec<llama_cpp_2::token::LlamaToken> = tokens
            .iter()
            .map(|&t| llama_cpp_2::token::LlamaToken(t as i32))
            .collect();

        let mut batch = LlamaBatch::new(tokens.len(), 1);
        let last_idx = llama_tokens.len().saturating_sub(1);
        for (i, &token) in llama_tokens.iter().enumerate() {
            batch
                .add(token, i as i32, &[0], i == last_idx)
                .context("Failed to add token to batch")?;
        }

        _ctx.decode(&mut batch)
            .map_err(|e| anyhow::anyhow!("llama.cpp decode failed: {e}"))?;

        // Logits extraction via sampler is the primary path (see generate
        // in bridge.rs). Return empty here — forward() is for raw logit
        // access which the bridge doesn't use directly.
        Ok(Vec::new())
    }

    fn tokenize(&self, text: &str) -> Result<Vec<u32>> {
        let model = self.model_ref()?;
        tracing::debug!(text_len = text.len(), "llama.cpp: tokenizing");

        let tokens = model
            .str_to_token(text, llama_cpp_2::model::AddBos::Always)
            .map_err(|e| anyhow::anyhow!("llama.cpp tokenize failed: {e}"))?;

        Ok(tokens.iter().map(|t| t.0 as u32).collect())
    }

    fn detokenize(&self, tokens: &[u32]) -> Result<String> {
        let model = self.model_ref()?;
        let mut output = String::new();
        let mut buf = Vec::new();

        for &t in tokens {
            let token = llama_cpp_2::token::LlamaToken(t as i32);
            match model.token_to_piece(token, &mut buf, false, None) {
                Ok(piece) => output.push_str(piece),
                Err(e) => {
                    tracing::warn!(token = t, error = %e, "llama.cpp: detokenize failed for token");
                }
            }
        }

        Ok(output)
    }

    fn memory_usage(&self) -> MemoryFootprint {
        MemoryFootprint::default()
    }

    fn metadata(&self) -> &ModelMetadata {
        &self.metadata
    }
}

impl Drop for LlamaCppBackend {
    fn drop(&mut self) {
        // Context MUST be dropped before model (lifetime dependency).
        if let Some(ctx_ptr) = self.ctx.take() {
            unsafe {
                drop(Box::from_raw(ctx_ptr));
            }
        }
        if let Some(model_ptr) = self.model.take() {
            unsafe {
                drop(Box::from_raw(model_ptr));
            }
        }
    }
}
