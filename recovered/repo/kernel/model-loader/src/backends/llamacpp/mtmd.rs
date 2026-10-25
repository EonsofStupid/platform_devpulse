//! `LlamaCppMtmdBackend` — vision-language `GGUF` inference via
//! llama.cpp's mtmd (multimodal) module.
//!
//! Drives Phi-4-Vision-15B and any other vision-language `GGUF` model
//! that ships a paired `mmproj` projection file. The text path through
//! [`super::backend::LlamaCppBackend`] handles plain `chat.brain`
//! traffic; this module handles `chat.vision` requests where each
//! prompt is paired with an encoded image (`PNG`/`JPEG` bytes from a
//! screenshot or upload).
//!
//! # Two-file model contract
//!
//! Vision-language `GGUF` repos always ship two files:
//!   1. The main model — text decoder + vision tower bound into one
//!      `GGUF` (e.g. `Phi-4-reasoning-vision-15B-Q4_K_M.gguf`).
//!   2. The multimodal projection — a smaller `*.mmproj.gguf` that
//!      maps vision-tower features into the text decoder's embedding
//!      space.
//!
//! The loader rejects a load attempt that doesn't supply both. We
//! never silently degrade to text-only on a vision slot — the user
//! would lose the slot's primary capability without warning.
//!
//! # FFI lifetime invariant
//!
//! Same shape as [`super::backend::LlamaCppBackend`]: a model on the
//! heap whose stable address backs both a `LlamaContext<'static>` and
//! an `MtmdContext`. Drop order is contexts-first, model-second.

#![allow(unsafe_code)]

use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::models::registry::ModelMetadata;
use anyhow::{Context, Result};
use std::ffi::CString;
use std::num::NonZeroU32;
use std::path::{Path, PathBuf};

use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::context::LlamaContext;
use llama_cpp_2::llama_backend::LlamaBackend;
use llama_cpp_2::llama_batch::LlamaBatch;
use llama_cpp_2::model::params::LlamaModelParams;
use llama_cpp_2::model::{AddBos, LlamaModel};
use llama_cpp_2::mtmd::{
    mtmd_default_marker, MtmdBitmap, MtmdContext, MtmdContextParams, MtmdInputText,
};
use llama_cpp_2::sampling::LlamaSampler;
use llama_cpp_2::token::LlamaToken;

/// Default context window when the caller's `context_length` is 0 or
/// would overflow `u32`. Vision-language models default to a smaller
/// effective window than pure text — Phi-4-vision is documented at
/// 4 K, so we mirror the upstream default.
const DEFAULT_CTX: NonZeroU32 = match NonZeroU32::new(4096) {
    Some(v) => v,
    None => unreachable!(),
};

/// Vision-language `GGUF` backend backed by llama.cpp + mtmd.
pub struct LlamaCppMtmdBackend {
    backend: LlamaBackend,
    /// Heap-pinned text model. `Box::into_raw` lets the llama context
    /// and the mtmd context borrow it as `'static`; we manually free
    /// in `unload`/`Drop` AFTER both contexts are gone.
    model: Option<*mut LlamaModel>,
    /// Llama inference context. MUST drop before model.
    ctx: Option<*mut LlamaContext<'static>>,
    /// Mtmd context. Holds the mmproj projection. MUST drop before
    /// model — internally borrows `LlamaModel` for the text-decoder
    /// embedding shape.
    mtmd_ctx: Option<MtmdContext>,
    metadata: ModelMetadata,
    /// Path to the main `GGUF` (informational).
    model_path: Option<PathBuf>,
    /// Path to the paired `*.mmproj.gguf`.
    mmproj_path: Option<PathBuf>,
}

// SAFETY: lives on a single dedicated inference thread. Upstream
// marks `MtmdContext: Send + Sync`; `LlamaModel: Send + Sync`;
// `LlamaContext: Send`. We narrow to `Send` only — Sync would let
// two threads call `&mut LlamaContext` methods, breaking llama.cpp's
// per-context contract.
unsafe impl Send for LlamaCppMtmdBackend {}

impl LlamaCppMtmdBackend {
    /// Create a new unloaded backend.
    ///
    /// # Errors
    /// Returns an error if `LlamaBackend::init()` fails — typically a
    /// process-wide library initialisation issue.
    pub fn new() -> Result<Self> {
        let backend = LlamaBackend::init().context("Failed to initialize llama.cpp backend")?;
        tracing::info!("llama.cpp mtmd backend initialized");

        Ok(Self {
            backend,
            model: None,
            ctx: None,
            mtmd_ctx: None,
            metadata: ModelMetadata {
                architecture: String::new(),
                parameter_count: None,
                quant_level: None,
                context_length: 0,
                vocab_size: 0,
            },
            model_path: None,
            mmproj_path: None,
        })
    }

    fn model_ref(&self) -> Result<&LlamaModel> {
        // SAFETY: pointer set in `load`, cleared in `drop_handles`.
        // The borrow's lifetime is bounded by `&self`.
        self.model
            .map(|p| unsafe { &*p })
            .context("No model loaded")
    }

    fn ctx_ref(&self) -> Result<&LlamaContext<'static>> {
        // SAFETY: same lifetime bounding as `model_ref`.
        self.ctx
            .map(|p| unsafe { &*p })
            .context("No context available")
    }

    #[allow(clippy::mut_from_ref)]
    fn ctx_mut(&self) -> Result<&mut LlamaContext<'static>> {
        // SAFETY: serialised access from a single inference thread.
        self.ctx
            .map(|p| unsafe { &mut *p })
            .context("No context available")
    }

    fn mtmd_ref(&self) -> Result<&MtmdContext> {
        self.mtmd_ctx.as_ref().context("No mtmd context available")
    }

    fn drop_handles(&mut self) {
        // Mtmd context first — borrows model.
        self.mtmd_ctx = None;
        // Llama context next — also borrows model.
        if let Some(ctx_ptr) = self.ctx.take() {
            // SAFETY: pointer came from `Box::into_raw` in `load`.
            unsafe {
                drop(Box::from_raw(ctx_ptr));
            }
        }
        // Model last.
        if let Some(model_ptr) = self.model.take() {
            // SAFETY: pointer came from `Box::into_raw` in `load`.
            unsafe {
                drop(Box::from_raw(model_ptr));
            }
        }
        self.model_path = None;
        self.mmproj_path = None;
    }

    /// Load the main `GGUF` plus its paired `*.mmproj.gguf`.
    ///
    /// Both files MUST exist — a vision-language slot has no useful
    /// text-only fallback, and silently degrading would mean the
    /// caller never sees vision answers at all.
    ///
    /// # Errors
    /// Returns an error if either file is missing, the model fails to
    /// load through llama.cpp, the mmproj fails to initialise the
    /// mtmd context, or context creation fails.
    // Matches the by-value `LoadParams` convention from the
    // `InferenceBackend` trait so call sites can pass either path
    // (text or vision) the same shape.
    #[allow(clippy::needless_pass_by_value)]
    pub fn load_with_mmproj(
        &mut self,
        model_path: &Path,
        mmproj_path: &Path,
        params: LoadParams,
    ) -> Result<MemoryFootprint> {
        tracing::info!(
            model = %model_path.display(),
            mmproj = %mmproj_path.display(),
            device = %params.device,
            gpu_layers = ?params.gpu_layers,
            ctx_len = params.context_length,
            "llama.cpp mtmd: loading vision-language GGUF"
        );

        if !model_path.exists() {
            anyhow::bail!("Main GGUF not found: {}", model_path.display());
        }
        if !mmproj_path.exists() {
            anyhow::bail!(
                "Paired mmproj not found: {} — vision slots require both files",
                mmproj_path.display()
            );
        }

        self.drop_handles();

        let n_gpu_layers = params
            .gpu_layers
            .unwrap_or(if params.device.starts_with("cuda") {
                99
            } else {
                0
            });

        let model_params = LlamaModelParams::default().with_n_gpu_layers(n_gpu_layers);
        let model_path_str = model_path
            .to_str()
            .context("Model path contains non-UTF8 characters")?;
        let mmproj_path_str = mmproj_path
            .to_str()
            .context("Mmproj path contains non-UTF8 characters")?;

        let model = LlamaModel::load_from_file(&self.backend, model_path_str, &model_params)
            .map_err(|e| anyhow::anyhow!("llama.cpp model load failed: {e}"))?;

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

        // Promote the model to a stable heap address before borrowing
        // it for either context. `model_static` lives until
        // `drop_handles` runs.
        let model_box = Box::new(model);
        let model_ptr = Box::into_raw(model_box);
        // SAFETY: `model_ptr` is valid until `drop_handles`. Both the
        // llama context and the mtmd context borrow this reference;
        // both are dropped before the model.
        let model_static: &'static LlamaModel = unsafe { &*model_ptr };

        // Llama context.
        let n_ctx = u32::try_from(params.context_length)
            .ok()
            .and_then(NonZeroU32::new)
            .unwrap_or(DEFAULT_CTX);
        let ctx_params = LlamaContextParams::default().with_n_ctx(Some(n_ctx));
        let ctx = model_static
            .new_context(&self.backend, ctx_params)
            .map_err(|e| anyhow::anyhow!("llama.cpp context creation failed: {e}"))?;
        let ctx_ptr = Box::into_raw(Box::new(ctx));

        // Mtmd context. `use_gpu` follows the llama context's
        // gpu-layer choice — running mmproj on CPU while the text
        // decoder is on GPU costs a per-token H2D copy of the image
        // tower output, which dominates the per-step latency.
        let mtmd_params = MtmdContextParams {
            use_gpu: n_gpu_layers > 0,
            print_timings: false,
            n_threads: 4,
            media_marker: CString::new(mtmd_default_marker())
                .context("default media marker contained an interior nul byte")?,
        };
        let mtmd_ctx = MtmdContext::init_from_file(mmproj_path_str, model_static, &mtmd_params)
            .map_err(|e| anyhow::anyhow!("mtmd context init failed: {e}"))?;

        if !mtmd_ctx.support_vision() {
            // The mmproj loaded fine, but its capabilities don't
            // include vision. Audio-only mmproj would land here too,
            // and a vision slot can't run on it.
            self.drop_handles();
            // SAFETY: `model_ptr` was set above; if drop_handles ran
            // it would have cleared it — re-clear to be defensive.
            // (No-op if already cleared.)
            anyhow::bail!(
                "Mmproj at {} does not declare vision support — vision slot cannot use it",
                mmproj_path.display()
            );
        }

        let model_size = std::fs::metadata(model_path).map(|m| m.len()).unwrap_or(0);
        let mmproj_size = std::fs::metadata(mmproj_path).map(|m| m.len()).unwrap_or(0);
        let total_size = model_size + mmproj_size;

        self.model = Some(model_ptr);
        self.ctx = Some(ctx_ptr);
        self.mtmd_ctx = Some(mtmd_ctx);
        self.model_path = Some(model_path.to_path_buf());
        self.mmproj_path = Some(mmproj_path.to_path_buf());

        tracing::info!(
            arch = %arch,
            params = n_params,
            ctx_train,
            n_gpu_layers,
            model_size,
            mmproj_size,
            "llama.cpp mtmd: model + mmproj loaded"
        );

        Ok(MemoryFootprint {
            vram_bytes: if n_gpu_layers > 0 { total_size } else { 0 },
            ram_bytes: if n_gpu_layers == 0 { total_size } else { 0 },
            kv_cache_bytes: 0,
        })
    }

    /// Unload the loaded model + mmproj and free all FFI handles.
    ///
    /// # Errors
    /// Currently infallible. Signature returns `Result` for symmetry
    /// with [`super::backend::LlamaCppBackend::unload`] and to leave
    /// room for future per-handle cleanup that may surface failures.
    pub fn unload(&mut self) -> Result<()> {
        tracing::info!(arch = %self.metadata.architecture, "llama.cpp mtmd: unloading");
        self.drop_handles();
        Ok(())
    }

    /// Generate text given a prompt + image bytes.
    ///
    /// `prompt` MUST contain the media marker (default: `<__media__>`)
    /// at the position where the image should be embedded. Typical
    /// chat-template shape:
    ///
    /// ```text
    /// <|user|>\n<__media__>\nWhat is in this image?<|end|>\n<|assistant|>\n
    /// ```
    ///
    /// `image_bytes` is an encoded `PNG` or `JPEG` (raw RGB is not
    /// accepted here — use `MtmdBitmap::from_image_data` directly if
    /// you need that path).
    ///
    /// # Errors
    /// Returns an error if no model is loaded, the bitmap cannot be
    /// decoded, the marker count doesn't match the bitmap count, the
    /// chunk-eval helper fails, the prompt overflows the context, or
    /// any sampler/decode call fails.
    pub fn generate_with_image(
        &mut self,
        prompt: &str,
        image_bytes: &[u8],
        max_new_tokens: u32,
        temperature: f32,
        on_token: impl Fn(u32, &str),
    ) -> Result<String> {
        let mtmd = self.mtmd_ref()?;

        // Decode the image into an mtmd bitmap. `from_buffer` accepts
        // any encoded format llama.cpp's bundled stb_image build can
        // read (PNG, JPEG, BMP, GIF, PSD, TGA).
        let bitmap = MtmdBitmap::from_buffer(mtmd, image_bytes)
            .map_err(|e| anyhow::anyhow!("Failed to decode image: {e}"))?;

        let input_text = MtmdInputText {
            text: prompt.to_string(),
            add_special: true,
            parse_special: true,
        };

        let chunks = mtmd
            .tokenize(input_text, &[&bitmap])
            .map_err(|e| anyhow::anyhow!("mtmd tokenize failed: {e}"))?;

        // Evaluate the prompt + image into the llama context's KV
        // cache. The helper alternates `llama_decode` for text chunks
        // and `mtmd_encode` + `llama_decode` for image chunks. Returns
        // the new `n_past` we resume sampling from.
        //
        // SAFETY: `eval_chunks` documents itself as not thread-safe;
        // we serialise access via the bridge's single-thread contract.
        let n_batch = self.ctx_ref()?.n_batch();
        let n_batch_i32 = i32::try_from(n_batch).unwrap_or(i32::MAX);
        let n_past = chunks
            .eval_chunks(mtmd, self.ctx_ref()?, 0, 0, n_batch_i32, true)
            .map_err(|e| anyhow::anyhow!("mtmd eval_chunks failed: {e}"))?;

        // Sampler chain — same shape as the text-only path.
        let mut sampler = if temperature <= 0.0 {
            LlamaSampler::chain_simple([LlamaSampler::greedy()])
        } else {
            let seed = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos() as u32)
                .unwrap_or(0);
            LlamaSampler::chain_simple([LlamaSampler::temp(temperature), LlamaSampler::dist(seed)])
        };

        let mut decoder = encoding_rs::UTF_8.new_decoder();
        let mut output_text = String::new();
        let mut next_pos = n_past;

        for _ in 0..max_new_tokens {
            // Sample the next token from the logits at the last
            // position decoded by `eval_chunks` (or by the prior loop
            // iteration's per-token decode).
            let next_token = sampler.sample(self.ctx_ref()?, 0);
            sampler.accept(next_token);

            if self.model_ref()?.is_eog_token(next_token) {
                break;
            }

            let piece = self
                .model_ref()?
                .token_to_piece(next_token, &mut decoder, false, None)
                .map_err(|e| anyhow::anyhow!("llama.cpp detokenize failed: {e}"))?;
            output_text.push_str(&piece);

            // Token IDs from a sampler with a ready context are
            // always non-negative; the underlying i32 only goes
            // negative for sentinel "no token" values.
            #[allow(clippy::cast_sign_loss)]
            let token_id_u32 = next_token.0 as u32;
            on_token(token_id_u32, &piece);

            // Decode the new token so the next sampler.sample() sees
            // an up-to-date logit distribution.
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

    /// Path of the currently-loaded main `GGUF`, if any.
    #[must_use]
    pub fn loaded_model_path(&self) -> Option<&Path> {
        self.model_path.as_deref()
    }

    /// Path of the currently-loaded `*.mmproj.gguf`, if any.
    #[must_use]
    pub fn loaded_mmproj_path(&self) -> Option<&Path> {
        self.mmproj_path.as_deref()
    }

    /// Tokenize a token-ID slice back to text using the model's vocab.
    ///
    /// # Errors
    /// Returns an error if no model is loaded or any token ID falls
    /// outside the model's vocabulary range. Per-token decode failures
    /// are logged and skipped (mirrors the text backend).
    pub fn detokenize(&self, tokens: &[u32]) -> Result<String> {
        let model = self.model_ref()?;
        let mut output = String::new();
        let mut decoder = encoding_rs::UTF_8.new_decoder();

        for &t in tokens {
            // Vocab sizes never exceed i32::MAX (~2.1B); a wrap here
            // would mean we received a value the model can't refer
            // to, and `token_to_piece` will surface that as an error.
            #[allow(clippy::cast_possible_wrap)]
            let token = LlamaToken(t as i32);
            match model.token_to_piece(token, &mut decoder, false, None) {
                Ok(piece) => output.push_str(&piece),
                Err(e) => {
                    tracing::warn!(token = t, error = %e, "llama.cpp mtmd: detokenize failed");
                }
            }
        }

        Ok(output)
    }

    /// Tokenize a plain text prompt into token IDs.
    ///
    /// # Errors
    /// Returns an error if no model is loaded or the tokenizer rejects
    /// the input.
    pub fn tokenize(&self, text: &str) -> Result<Vec<u32>> {
        let model = self.model_ref()?;
        let tokens = model
            .str_to_token(text, AddBos::Always)
            .map_err(|e| anyhow::anyhow!("llama.cpp tokenize failed: {e}"))?;

        // Sign loss is benign — `str_to_token` only returns negative
        // values as error sentinels which it reports via `Err` instead.
        #[allow(clippy::cast_sign_loss)]
        let ids: Vec<u32> = tokens.iter().map(|t| t.0 as u32).collect();
        Ok(ids)
    }

    /// Model metadata (architecture, parameter count, context length).
    #[must_use]
    pub fn metadata(&self) -> &ModelMetadata {
        &self.metadata
    }
}

impl Drop for LlamaCppMtmdBackend {
    fn drop(&mut self) {
        self.drop_handles();
    }
}
