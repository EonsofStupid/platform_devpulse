//! `LlamaCppBackend` — GGUF inference via llama.cpp FFI.
//!
//! Implements [`InferenceBackend`] so it plugs into the same
//! [`crate::backends::bridge::InferenceBridge`] and
//! [`crate::backends::pool::BackendPool`] infrastructure as
//! [`crate::backends::candle::CandleBackend`]. The router dispatches
//! here for `GGUF` files when the architecture isn't in Candle's
//! support list (e.g. Phi-4 reasoning, Phi-4 vision via mtmd, llama-3
//! variants without a Candle-native loader).
//!
//! # FFI lifetime invariant
//!
//! `LlamaModel` owns the weights; `LlamaContext<'a>` borrows the model.
//! Storing both in a single `'static` struct requires raw-pointer
//! storage with a hand-maintained drop order: context first, then
//! model. The `unsafe_code` workspace lint is allowed at the file
//! level because the FFI shape genuinely cannot be expressed without
//! the self-reference, and the safety contract is documented per-site.
//!
//! # Threading
//!
//! `LlamaModel` is `Send + Sync`. `LlamaContext` is `Send` only.
//! The struct lives on a single dedicated thread driven by
//! [`crate::backends::bridge::InferenceBridge::spawn_llamacpp`], so
//! the `unsafe impl Send` is a documented narrowing of the upstream
//! `Sync` constraint to "single-thread access only."

#![allow(unsafe_code)]

use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::models::registry::ModelMetadata;
use crate::traits::backend::InferenceBackend;
use anyhow::{Context, Result};
use std::num::NonZeroU32;
use std::path::Path;

use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::context::LlamaContext;
use llama_cpp_2::llama_backend::LlamaBackend;
use llama_cpp_2::llama_batch::LlamaBatch;
use llama_cpp_2::model::params::LlamaModelParams;
use llama_cpp_2::model::{AddBos, LlamaModel};
use llama_cpp_2::sampling::LlamaSampler;
use llama_cpp_2::token::LlamaToken;

/// Default context window when the caller's `context_length` is 0 or
/// would overflow `u32`. `4096` mirrors the upstream default and is
/// safe for every architecture in our wired set.
const DEFAULT_CTX: NonZeroU32 = match NonZeroU32::new(4096) {
    Some(v) => v,
    None => unreachable!(),
};

/// `GGUF` inference backend via llama.cpp.
pub struct LlamaCppBackend {
    backend: LlamaBackend,
    /// Owned model weights. `Box::into_raw` lets context borrow it as
    /// `'static`; we manually free in `unload`/`Drop` AFTER the context.
    model: Option<*mut LlamaModel>,
    /// Owned inference context (KV cache + sampling state). MUST drop
    /// before model — context internally holds a `&'a LlamaModel`
    /// pointer that becomes dangling once model is freed.
    ctx: Option<*mut LlamaContext<'static>>,
    metadata: ModelMetadata,
}

// SAFETY: `LlamaCppBackend` is only ever owned and used by the single
// inference thread spawned by `InferenceBridge::spawn_llamacpp`.
// Upstream marks `LlamaModel: Send + Sync` and `LlamaContext: Send`.
// We narrow to `Send` only — Sync would let two threads call
// `&mut LlamaContext` methods, violating llama.cpp's per-context
// contract.
unsafe impl Send for LlamaCppBackend {}

impl LlamaCppBackend {
    /// Create a new unloaded backend with a fresh `LlamaBackend` handle.
    ///
    /// # Errors
    /// Returns an error if `LlamaBackend::init()` fails — typically a
    /// process-wide library initialisation issue (already-initialised,
    /// missing shared library).
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
        // SAFETY: pointer is set in `load`, cleared in `unload`/`Drop`.
        // The reference's lifetime is bounded by `&self`, so it can't
        // outlive the struct.
        self.model
            .map(|p| unsafe { &*p })
            .context("No model loaded")
    }

    fn ctx_ref(&self) -> Result<&LlamaContext<'static>> {
        // SAFETY: same lifetime bounding as `model_ref`.
        self.ctx.map(|p| unsafe { &*p }).context("No context available")
    }

    #[allow(clippy::mut_from_ref)]
    fn ctx_mut(&self) -> Result<&mut LlamaContext<'static>> {
        // SAFETY: the inference thread owns this backend and accesses
        // it serially; no two `ctx_mut` references can coexist on the
        // same call stack because each is scoped to its caller.
        self.ctx
            .map(|p| unsafe { &mut *p })
            .context("No context available")
    }

    fn drop_handles(&mut self) {
        // Context first — it borrows model.
        if let Some(ctx_ptr) = self.ctx.take() {
            // SAFETY: `ctx_ptr` came from `Box::into_raw` in `load`.
            // Dropping the Box runs `LlamaContext::drop`, which calls
            // `llama_free` on the underlying handle.
            unsafe {
                drop(Box::from_raw(ctx_ptr));
            }
        }
        if let Some(model_ptr) = self.model.take() {
            // SAFETY: same — `model_ptr` came from `Box::into_raw`.
            unsafe {
                drop(Box::from_raw(model_ptr));
            }
        }
    }

    /// Run a streaming text-generation pass.
    ///
    /// Mirrors the shape of [`crate::backends::candle::CandleBackend::generate`]:
    /// tokenizes `prompt`, decodes it as a single prefill batch, then
    /// loops sampler→accept→decode until either `max_new_tokens` is
    /// reached or the model emits an EOG token. Each emitted token is
    /// piped to `on_token` as `(token_id, text_piece)`.
    ///
    /// `temperature == 0.0` selects greedy sampling. Any non-zero
    /// temperature wires a `temp + dist(seed=time)` chain, matching
    /// the upstream simple-generate examples.
    ///
    /// # Errors
    /// Returns an error if the model or context isn't loaded, the
    /// tokenizer rejects the prompt, the prefill batch overflows the
    /// configured context window, or any `decode` call fails.
    pub fn generate(
        &mut self,
        prompt: &str,
        max_new_tokens: u32,
        temperature: f32,
        on_token: impl Fn(u32, &str),
    ) -> Result<String> {
        // Tokenize prompt
        let model = self.model_ref()?;
        let prompt_tokens = model
            .str_to_token(prompt, AddBos::Always)
            .map_err(|e| anyhow::anyhow!("llama.cpp tokenize prompt failed: {e}"))?;

        if prompt_tokens.is_empty() {
            anyhow::bail!("Tokenizer produced zero tokens for the prompt");
        }

        let n_ctx = self.ctx_ref()?.n_ctx() as usize;
        if prompt_tokens.len() >= n_ctx {
            anyhow::bail!(
                "Prompt tokens ({}) exceed context window ({n_ctx})",
                prompt_tokens.len()
            );
        }

        // Prefill batch — request logits only on the last token so
        // sampling has the next-token distribution available.
        let prefill_capacity = prompt_tokens.len().max(1);
        let mut batch = LlamaBatch::new(prefill_capacity, 1);
        let last_idx = prompt_tokens.len() - 1;
        for (i, token) in prompt_tokens.iter().enumerate() {
            let pos = i32::try_from(i)
                .map_err(|_| anyhow::anyhow!("prompt index {i} exceeds i32"))?;
            batch
                .add(*token, pos, &[0], i == last_idx)
                .context("Failed to add prompt token to batch")?;
        }

        let ctx = self.ctx_mut()?;
        ctx.decode(&mut batch)
            .map_err(|e| anyhow::anyhow!("llama.cpp prefill decode failed: {e}"))?;

        // Sampler chain. Greedy when temperature == 0; otherwise
        // distribution sampling at the requested temperature.
        let mut sampler = if temperature <= 0.0 {
            LlamaSampler::chain_simple([LlamaSampler::greedy()])
        } else {
            let seed = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos() as u32)
                .unwrap_or(0);
            LlamaSampler::chain_simple([LlamaSampler::temp(temperature), LlamaSampler::dist(seed)])
        };

        // Decoder for streaming UTF-8 piece reconstruction. llama.cpp
        // emits multi-byte UTF-8 across token boundaries, so we hold
        // a stateful encoding_rs decoder for the whole loop.
        let mut decoder = encoding_rs::UTF_8.new_decoder();

        let mut output_text = String::new();
        let mut next_pos = i32::try_from(prompt_tokens.len())
            .map_err(|_| anyhow::anyhow!("prompt length exceeds i32"))?;

        for _ in 0..max_new_tokens {
            // Sample next token from the logits at the last decoded
            // position. `LlamaBatch::add` always wires logits to slot
            // `0` for the marked position, so we sample at index 0.
            let next_token = sampler.sample(self.ctx_ref()?, 0);
            sampler.accept(next_token);

            if self.model_ref()?.is_eog_token(next_token) {
                break;
            }

            // Render this token to text. The `false` `special` flag
            // hides control / chat-template tokens (e.g. `<|im_end|>`)
            // from the streamed user-visible output; flip to `true` if a
            // future surface needs to see those boundaries verbatim.
            let piece = self
                .model_ref()?
                .token_to_piece(next_token, &mut decoder, false, None)
                .map_err(|e| anyhow::anyhow!("llama.cpp detokenize failed: {e}"))?;
            output_text.push_str(&piece);
            // LlamaToken IDs are u32 in semantic intent (0..n_vocab);
            // the underlying i32 only goes negative for sentinel "no
            // token" values, which sampler.sample never emits for a
            // ready context.
            #[allow(clippy::cast_sign_loss)]
            let token_id_u32 = next_token.0 as u32;
            on_token(token_id_u32, &piece);

            // Decode the new token into the KV cache so the next
            // sampler.sample() sees an up-to-date logit distribution.
            let mut step = LlamaBatch::new(1, 1);
            step.add(next_token, next_pos, &[0], true)
                .context("Failed to add generated token to batch")?;
            self.ctx_mut()?
                .decode(&mut step)
                .map_err(|e| anyhow::anyhow!("llama.cpp step decode failed: {e}"))?;
            next_pos += 1;
        }

        Ok(output_text)
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

        // Drop any existing handles before loading new ones.
        self.drop_handles();

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

        // Extract metadata. The current `meta_val_str` returns
        // `Result<String, _>` directly — no caller-supplied buffer.
        let n_params = model.n_params();
        let ctx_train = model.n_ctx_train() as usize;

        let arch = model
            .meta_val_str("general.architecture")
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

        // Create context. The default ctx fallback is a const-time
        // `NonZeroU32` so any zero literal would be a compile error.
        let n_ctx = u32::try_from(params.context_length)
            .ok()
            .and_then(NonZeroU32::new)
            .unwrap_or(DEFAULT_CTX);

        let ctx_params = LlamaContextParams::default().with_n_ctx(Some(n_ctx));

        let file_size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);

        // Heap-allocate the model first so its address is stable. Then
        // promote a borrow off the raw pointer to `'static` BEFORE
        // creating the context. The context naturally inherits that
        // `'static` lifetime, so no `transmute` is needed.
        //
        // SAFETY: `model_ptr` is valid until `drop_handles` frees it,
        // and we maintain the invariant that `ctx_ptr` is dropped
        // first — so any `&'static LlamaModel` we derive here is only
        // dereferenced while the underlying box is alive.
        let model_box = Box::new(model);
        let model_ptr = Box::into_raw(model_box);
        let model_static: &'static LlamaModel = unsafe { &*model_ptr };

        let ctx = model_static
            .new_context(&self.backend, ctx_params)
            .map_err(|e| anyhow::anyhow!("llama.cpp context creation failed: {e}"))?;

        let ctx_box = Box::new(ctx);
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
        tracing::info!(arch = %self.metadata.architecture, "llama.cpp: unloading");
        self.drop_handles();
        Ok(())
    }

    fn forward(&self, tokens: &[u32], _position: usize) -> Result<Vec<f32>> {
        // The bridge does not currently consume raw logits from
        // llama.cpp — generation goes through `LlamaCppBackend::generate`
        // which owns its own decode/sample loop. This is a no-op stub
        // matching the existing trait contract; populate when a caller
        // actually needs raw forward access.
        let _ = tokens;
        Ok(Vec::new())
    }

    fn tokenize(&self, text: &str) -> Result<Vec<u32>> {
        let model = self.model_ref()?;
        tracing::debug!(text_len = text.len(), "llama.cpp: tokenizing");

        let tokens = model
            .str_to_token(text, AddBos::Always)
            .map_err(|e| anyhow::anyhow!("llama.cpp tokenize failed: {e}"))?;

        // Sign loss is benign — token IDs from `str_to_token` are
        // always non-negative (negative values are llama.cpp error
        // sentinels which `str_to_token` never returns on success).
        #[allow(clippy::cast_sign_loss)]
        let ids: Vec<u32> = tokens.iter().map(|t| t.0 as u32).collect();
        Ok(ids)
    }

    fn detokenize(&self, tokens: &[u32]) -> Result<String> {
        let model = self.model_ref()?;
        let mut output = String::new();
        let mut decoder = encoding_rs::UTF_8.new_decoder();

        for &t in tokens {
            // Vocab sizes never exceed i32::MAX (~2.1B); a wrap here
            // would mean we received a value the model can't refer to,
            // and `token_to_piece` will surface that as an error below.
            #[allow(clippy::cast_possible_wrap)]
            let token = LlamaToken(t as i32);
            match model.token_to_piece(token, &mut decoder, false, None) {
                Ok(piece) => output.push_str(&piece),
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
        self.drop_handles();
    }
}
