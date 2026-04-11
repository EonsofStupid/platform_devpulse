//! Candle backend — implements `InferenceBackend` for GGUF *and* SafeTensors models.
//!
//! Two loading paths:
//!
//! - **GGUF** (quantized): `candle_core::quantized` parser →
//!   `candle_transformers::models::quantized_llama::ModelWeights`. Covers Llama,
//!   Mistral, Qwen2/3 quantized, and the rest of the Llama-family GGUF exports.
//! - **SafeTensors** (full precision): HF-style model directory with `config.json`,
//!   `tokenizer.json`, and `model.safetensors` (single-file or sharded). Dispatches
//!   to `candle_transformers::models::qwen2::ModelForCausalLM`, which covers the
//!   Qwen2 / Qwen2.5 family. Qwen3 full-precision requires a candle-transformers
//!   upgrade (0.9+); use the GGUF route for quantized Qwen3 builds until then.
//!
//! Path selection is by extension: `*.gguf` → GGUF path, directory or
//! `*.safetensors` → SafeTensors path.

use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::models::registry::ModelMetadata;
use crate::traits::backend::InferenceBackend;
use candle_core::quantized::gguf_file::Content;
use candle_core::{DType, Device, Tensor};
use candle_nn::VarBuilder;
use candle_transformers::models::quantized_llama as qlm;
use candle_transformers::models::qwen2;
use std::io::BufReader;
use std::path::{Path, PathBuf};

/// Loaded model variant — GGUF quantized or SafeTensors full-precision.
enum LoadedWeights {
    /// Quantized Llama-family weights from a GGUF file.
    Gguf(qlm::ModelWeights),
    /// Full-precision Qwen3 weights from a HF SafeTensors directory.
    Qwen2Safetensors(qwen2::ModelForCausalLM),
}

/// Loaded model state — weights + tokenizer + metadata.
struct LoadedModel {
    weights: LoadedWeights,
    tokenizer: tokenizers::Tokenizer,
    metadata: ModelMetadata,
    footprint: MemoryFootprint,
    eos_token: u32,
}

/// Candle inference backend for GGUF quantized models.
pub struct CandleBackend {
    model: Option<LoadedModel>,
    device: Device,
}

impl CandleBackend {
    /// Create a new backend targeting a device.
    #[must_use]
    pub fn new(device: Device) -> Self {
        Self {
            model: None,
            device,
        }
    }

    /// Create a CPU-only backend.
    #[must_use]
    pub fn cpu() -> Self {
        Self::new(Device::Cpu)
    }

    /// Whether a model is currently loaded.
    #[must_use]
    pub fn is_loaded(&self) -> bool {
        self.model.is_some()
    }

    /// Run text generation with temperature sampling.
    ///
    /// Returns the full generated text. Calls `on_token` for each token
    /// as it's generated (for streaming).
    #[tracing::instrument(skip(self, on_token), fields(prompt_len = prompt.len(), max_new_tokens, temperature))]
    pub fn generate(
        &mut self,
        prompt: &str,
        max_new_tokens: u32,
        temperature: f32,
        on_token: impl Fn(u32, &str),
    ) -> anyhow::Result<String> {
        let model = self
            .model
            .as_mut()
            .ok_or_else(|| anyhow::anyhow!("No model loaded"))?;

        let tokens = model
            .tokenizer
            .encode(prompt, true)
            .map_err(|e| anyhow::anyhow!("Tokenizer encode failed: {e}"))?;

        let prompt_tokens: Vec<u32> = tokens.get_ids().to_vec();
        let mut all_tokens = prompt_tokens.clone();

        // Feed the prompt through the model. GGUF wants one token at a time with a
        // rank-1 input, SafeTensors Qwen3 wants a rank-2 [batch, seq] input and
        // returns logits only for the last position (narrowed inside forward()).
        let mut logits = forward_prefill(&mut model.weights, &prompt_tokens, &self.device)?;

        // Generate tokens
        let mut generated = Vec::new();
        for i in 0..max_new_tokens {
            let next_token = sample_token(&logits, temperature)?;

            if next_token == model.eos_token {
                break;
            }

            all_tokens.push(next_token);
            generated.push(next_token);

            // Decode the new token
            let text = model
                .tokenizer
                .decode(&[next_token], true)
                .unwrap_or_default();

            on_token(next_token, &text);

            // Forward pass for next token
            let pos = prompt_tokens.len() + i as usize;
            logits = forward_step(&mut model.weights, next_token, pos, &self.device)?;
        }

        // Decode all generated tokens
        let result = model
            .tokenizer
            .decode(&generated, true)
            .unwrap_or_default();

        Ok(result)
    }
}

impl InferenceBackend for CandleBackend {
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(path = %path.display(), device = %params.device, "Loading model via Candle");

        let device = if params.device == "cpu" {
            Device::Cpu
        } else {
            #[cfg(feature = "cuda")]
            {
                Device::new_cuda(0)?
            }
            #[cfg(not(feature = "cuda"))]
            {
                tracing::warn!("CUDA requested but not compiled — falling back to CPU");
                Device::Cpu
            }
        };
        self.device = device.clone();

        // Dispatch by file layout. GGUF is a single file; SafeTensors is a
        // directory (or a single .safetensors next to config.json + tokenizer.json).
        let is_gguf = path
            .extension()
            .and_then(|s| s.to_str())
            .map(|s| s.eq_ignore_ascii_case("gguf"))
            .unwrap_or(false);

        let loaded = if is_gguf {
            load_gguf(path, &device)?
        } else {
            load_safetensors(path, &device)?
        };

        tracing::info!(
            arch = %loaded.metadata.architecture,
            ctx = loaded.metadata.context_length,
            vocab = loaded.metadata.vocab_size,
            ram_mb = loaded.footprint.ram_mb(),
            vram_mb = loaded.footprint.vram_mb(),
            "Model loaded successfully"
        );

        let footprint = loaded.footprint;
        self.model = Some(loaded);
        Ok(footprint)
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        if self.model.is_some() {
            self.model = None;
            tracing::info!("Model unloaded");
        }
        Ok(())
    }

    fn forward(&self, _tokens: &[u32], _position: usize) -> anyhow::Result<Vec<f32>> {
        // NOTE: ModelWeights::forward takes &mut self, but InferenceBackend trait
        // has &self. The actual forward pass happens in generate() which has &mut self.
        // Direct forward() calls go through the flume bridge which serializes access.
        anyhow::bail!("Direct forward() not supported — use generate() via InferenceHandle")
    }

    fn tokenize(&self, text: &str) -> anyhow::Result<Vec<u32>> {
        let model = self
            .model
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No model loaded"))?;

        let encoding = model
            .tokenizer
            .encode(text, true)
            .map_err(|e| anyhow::anyhow!("Tokenizer encode failed: {e}"))?;

        Ok(encoding.get_ids().to_vec())
    }

    fn detokenize(&self, tokens: &[u32]) -> anyhow::Result<String> {
        let model = self
            .model
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No model loaded"))?;

        model
            .tokenizer
            .decode(tokens, true)
            .map_err(|e| anyhow::anyhow!("Tokenizer decode failed: {e}"))
    }

    fn memory_usage(&self) -> MemoryFootprint {
        self.model
            .as_ref()
            .map(|m| m.footprint)
            .unwrap_or_default()
    }

    fn metadata(&self) -> &ModelMetadata {
        static EMPTY: std::sync::LazyLock<ModelMetadata> = std::sync::LazyLock::new(|| ModelMetadata {
            architecture: String::new(),
            parameter_count: None,
            quant_level: None,
            context_length: 0,
            vocab_size: 0,
        });

        self.model
            .as_ref()
            .map(|m| &m.metadata)
            .unwrap_or(&EMPTY)
    }
}

/// Extract model metadata from GGUF content.
fn extract_model_metadata(content: &Content) -> anyhow::Result<ModelMetadata> {
    use candle_core::quantized::gguf_file::Value;

    let get_str = |key: &str| -> Option<String> {
        content.metadata.get(key).and_then(|v| match v {
            Value::String(s) => Some(s.clone()),
            _ => None,
        })
    };

    let get_u64 = |key: &str| -> Option<u64> {
        content.metadata.get(key).and_then(|v| match v {
            Value::U64(n) => Some(*n),
            Value::U32(n) => Some(u64::from(*n)),
            Value::I64(n) => Some(*n as u64),
            Value::I32(n) => Some(*n as u64),
            _ => None,
        })
    };

    let architecture = get_str("general.architecture").unwrap_or_else(|| "unknown".to_string());
    let context_key = format!("{architecture}.context_length");
    let context_length = get_u64(&context_key)
        .or_else(|| get_u64("general.context_length"))
        .unwrap_or(2048) as usize;
    let vocab_size = get_u64(&format!("{architecture}.vocab_size")).unwrap_or(0) as usize;
    let parameter_count = get_u64("general.parameter_count");

    Ok(ModelMetadata {
        architecture,
        parameter_count,
        quant_level: None,
        context_length,
        vocab_size,
    })
}

/// Load tokenizer for a GGUF model.
///
/// Resolution order (first hit wins):
///
/// 1. **Embedded GGUF metadata** — modern GGUFs (2024+, Qwen3, Llama3,
///    Phi-4, Mistral, etc.) carry the full tokenizer vocab + merges in
///    `tokenizer.ggml.tokens` / `tokenizer.ggml.merges`. We build a
///    real `tokenizers::Tokenizer` from that metadata directly, with
///    no disk or network dependency. This is the only path that works
///    out of the box for quantized GGUFs from bartowski / TheBloke /
///    etc., because those repackages almost never ship
///    `tokenizer.json` alongside the `.gguf` and usually strip the
///    `general.source.huggingface.repository` field.
/// 2. **`tokenizer.json` on disk** — if the user manually placed one
///    next to the GGUF, honour it. Useful for odd architectures we
///    don't know how to build from metadata yet.
/// 3. **HuggingFace Hub fetch** — if the GGUF has
///    `general.source.huggingface.repository` metadata, pull the
///    tokenizer from there. Requires network.
/// 4. **`general.name` as repo fallback** — last-ditch, assumes the
///    model name happens to be a valid HF repo id.
fn load_tokenizer_from_gguf(
    content: &Content,
    model_path: &Path,
) -> anyhow::Result<tokenizers::Tokenizer> {
    use candle_core::quantized::gguf_file::Value;

    // ── Path 1: build from embedded GGUF metadata ────────────
    if let Some(tokenizer) = try_build_tokenizer_from_gguf_metadata(content)? {
        return Ok(tokenizer);
    }

    // ── Path 2: tokenizer.json next to the GGUF file ─────────
    let dir = model_path.parent().unwrap_or(Path::new("."));
    let tokenizer_path = dir.join("tokenizer.json");
    if tokenizer_path.exists() {
        tracing::info!(path = %tokenizer_path.display(), "Loading tokenizer.json from model directory");
        return tokenizers::Tokenizer::from_file(&tokenizer_path)
            .map_err(|e| anyhow::anyhow!("Failed to load tokenizer.json: {e}"));
    }

    // ── Path 3: HF Hub via `general.source.huggingface.repository` ──
    if let Some(Value::String(repo)) = content.metadata.get("general.source.huggingface.repository")
    {
        tracing::info!(repo = %repo, "Fetching tokenizer from HuggingFace");
        let api = hf_hub::api::sync::ApiBuilder::new().build().map_err(|e| anyhow::anyhow!("{e}"))?;
        let repo_api = api.model(repo.clone());
        let tokenizer_file = repo_api.get("tokenizer.json")?;
        return tokenizers::Tokenizer::from_file(tokenizer_file)
            .map_err(|e| anyhow::anyhow!("Failed to load HF tokenizer: {e}"));
    }

    // ── Path 4: `general.name` as repo fallback ──────────────
    if let Some(Value::String(name)) = content.metadata.get("general.name") {
        tracing::info!(name = %name, "Trying model name as HF repo for tokenizer");
        let api = hf_hub::api::sync::ApiBuilder::new().build().map_err(|e| anyhow::anyhow!("{e}"))?;
        let repo_api = api.model(name.clone());
        if let Ok(tokenizer_file) = repo_api.get("tokenizer.json") {
            return tokenizers::Tokenizer::from_file(tokenizer_file)
                .map_err(|e| anyhow::anyhow!("Failed to load HF tokenizer: {e}"));
        }
    }

    anyhow::bail!(
        "No tokenizer found — GGUF has no embedded tokenizer metadata, no tokenizer.json \
         next to the file at {}, and no HuggingFace repo metadata to fall back on",
        model_path.display()
    )
}

/// Attempt to build a `tokenizers::Tokenizer` straight from the
/// embedded GGUF metadata fields under `tokenizer.ggml.*`.
///
/// Returns `Ok(None)` if the GGUF doesn't carry enough metadata to
/// build a tokenizer (e.g. `tokenizer.ggml.tokens` missing), so the
/// caller can fall through to the disk / HF paths. Returns
/// `Ok(Some(t))` on a successful build. Returns `Err` only if the
/// metadata is present but malformed.
///
/// Supports the `tokenizer.ggml.model = "gpt2"` family (byte-level
/// BPE) which covers every modern Qwen, Llama-3, Phi-4, Mistral,
/// Gemma, and similar model. For the older SentencePiece-flavored
/// `"llama"` variant the function returns `Ok(None)` so the caller
/// can try the disk / HF fallback — we don't currently have a
/// first-party path for building a SentencePiece tokenizer out of
/// GGUF metadata.
fn try_build_tokenizer_from_gguf_metadata(
    content: &Content,
) -> anyhow::Result<Option<tokenizers::Tokenizer>> {
    use candle_core::quantized::gguf_file::Value;
    use tokenizers::decoders::byte_level::ByteLevel as ByteLevelDecoder;
    use tokenizers::models::bpe::{Vocab, BPE};
    use tokenizers::pre_tokenizers::byte_level::ByteLevel;
    use tokenizers::processors::byte_level::ByteLevel as ByteLevelProcessor;
    use tokenizers::{AddedToken, Tokenizer};

    let model_type = match content.metadata.get("tokenizer.ggml.model") {
        Some(Value::String(s)) => s.as_str(),
        _ => return Ok(None),
    };

    let tokens_value = match content.metadata.get("tokenizer.ggml.tokens") {
        Some(Value::Array(arr)) => arr,
        _ => return Ok(None),
    };

    // Non-GPT2 variants (classic llama SentencePiece, rwkv, bert,
    // etc.) need their own model-specific builders that we haven't
    // written yet. Fall through so the caller can try disk / HF.
    if model_type != "gpt2" {
        tracing::warn!(
            model_type = %model_type,
            "GGUF embedded tokenizer uses a non-gpt2 model — build-from-metadata \
             unsupported, falling back to disk / HF path"
        );
        return Ok(None);
    }

    // Vocab: Vec<Value::String> → tokenizers::models::bpe::Vocab
    // (which is `AHashMap<String, u32>` — using the re-exported type
    // alias avoids adding `ahash` as a direct dependency).
    let mut vocab: Vocab = Vocab::with_capacity(tokens_value.len());
    for (idx, tok) in tokens_value.iter().enumerate() {
        let Value::String(s) = tok else {
            anyhow::bail!(
                "tokenizer.ggml.tokens[{idx}] is not a string — expected Value::String"
            );
        };
        vocab.insert(s.clone(), idx as u32);
    }
    let vocab_size = vocab.len();

    // Merges: each merge is a single string "a b" where the space
    // separates the two pieces being merged. Convert to (String, String).
    let merges: Vec<(String, String)> = match content.metadata.get("tokenizer.ggml.merges") {
        Some(Value::Array(merges_value)) => {
            let mut out = Vec::with_capacity(merges_value.len());
            for (idx, m) in merges_value.iter().enumerate() {
                let Value::String(s) = m else {
                    anyhow::bail!(
                        "tokenizer.ggml.merges[{idx}] is not a string — expected Value::String"
                    );
                };
                // Split on the FIRST space only — token pieces can contain
                // multiple characters but the merge itself is two pieces
                // joined by exactly one space.
                if let Some((left, right)) = s.split_once(' ') {
                    out.push((left.to_string(), right.to_string()));
                } else {
                    // A merge entry with no space is malformed; skip it
                    // instead of failing the whole load.
                    tracing::warn!(
                        idx,
                        merge = %s,
                        "tokenizer.ggml.merges entry has no space separator — skipping"
                    );
                }
            }
            out
        }
        _ => Vec::new(),
    };

    let bpe = BPE::builder()
        .vocab_and_merges(vocab, merges)
        .build()
        .map_err(|e| anyhow::anyhow!("Failed to build BPE from GGUF metadata: {e}"))?;

    let mut tokenizer = Tokenizer::new(bpe);
    // Byte-level pre-tokenizer + processor + decoder is the canonical
    // GPT-2 / modern-BPE pipeline. `add_prefix_space=false` matches
    // what bartowski GGUFs expect — adding a leading space breaks
    // alignment on quantized Qwen3 / Llama3 weights.
    tokenizer.with_pre_tokenizer(Some(ByteLevel::new(false, true, true)));
    tokenizer.with_decoder(Some(ByteLevelDecoder::default()));
    tokenizer.with_post_processor(Some(ByteLevelProcessor::new(false, false, false)));

    // Register special tokens from metadata so the model's stop-token
    // logic works. We only need the well-known ids here — the full
    // added_tokens array lives separately in some GGUFs but isn't
    // required for a working encode/decode round trip.
    //
    // tokenizer.ggml.{bos,eos,unknown,padding}_token_id fields are
    // all u32. Silently skip any that are absent.
    let special_ids = [
        "tokenizer.ggml.bos_token_id",
        "tokenizer.ggml.eos_token_id",
        "tokenizer.ggml.unknown_token_id",
        "tokenizer.ggml.padding_token_id",
        "tokenizer.ggml.separator_token_id",
    ];
    let mut added = Vec::new();
    for key in &special_ids {
        if let Some(Value::U32(id)) = content.metadata.get(*key) {
            if let Some((token_str, _)) = tokenizer
                .get_vocab(true)
                .iter()
                .find(|(_, i)| **i == *id)
                .map(|(s, i)| (s.clone(), *i))
            {
                added.push(AddedToken::from(token_str, true));
            }
        }
    }
    if !added.is_empty() {
        tokenizer.add_special_tokens(&added);
    }

    tracing::info!(
        model_type,
        vocab_size,
        special_tokens = added.len(),
        "Built tokenizer from embedded GGUF metadata"
    );

    Ok(Some(tokenizer))
}

/// Detect the EOS token ID from the tokenizer.
fn detect_eos_token(tokenizer: &tokenizers::Tokenizer) -> u32 {
    // Check added tokens for common EOS names
    let eos_names = ["</s>", "<|endoftext|>", "<|im_end|>", "<eos>", "<|end|>"];

    if let Some(vocab) = tokenizer.get_vocab(true).into_iter().next() {
        // get_vocab returns a HashMap<String, u32>
        drop(vocab);
    }

    let vocab = tokenizer.get_vocab(true);
    for name in &eos_names {
        if let Some(&id) = vocab.get(*name) {
            return id;
        }
    }

    // Fallback: use token ID 2 (common default)
    2
}

/// Sample next token from logits using temperature.
fn sample_token(logits: &[f32], temperature: f32) -> anyhow::Result<u32> {
    if logits.is_empty() {
        anyhow::bail!("Empty logits — cannot sample");
    }

    if temperature <= 0.0 {
        // Greedy: argmax
        let (idx, _) = logits
            .iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
            .ok_or_else(|| anyhow::anyhow!("Greedy argmax failed — logits empty after filter"))?;
        return Ok(idx as u32);
    }

    // Temperature sampling with softmax
    let max_logit = logits
        .iter()
        .copied()
        .fold(f32::NEG_INFINITY, f32::max);

    let scaled: Vec<f32> = logits
        .iter()
        .map(|&l| ((l - max_logit) / temperature).exp())
        .collect();

    let sum: f32 = scaled.iter().sum();
    let probs: Vec<f32> = scaled.iter().map(|&s| s / sum).collect();

    // Multinomial sampling
    let mut rng_val: f32 = simple_random();
    for (idx, &p) in probs.iter().enumerate() {
        rng_val -= p;
        if rng_val <= 0.0 {
            return Ok(idx as u32);
        }
    }

    // Fallback to last token
    Ok((probs.len() - 1) as u32)
}

/// Prefill: push the full prompt through the model and return the logits at the
/// last position as a Vec<f32>. Handles both GGUF (rank-1 stepwise) and Qwen3
/// SafeTensors (rank-2 full-sequence) paths.
fn forward_prefill(
    weights: &mut LoadedWeights,
    prompt_tokens: &[u32],
    device: &Device,
) -> anyhow::Result<Vec<f32>> {
    match weights {
        LoadedWeights::Gguf(model) => {
            let mut logits = Vec::new();
            for (i, &tok) in prompt_tokens.iter().enumerate() {
                let input = Tensor::new(&[tok], device)?;
                let out = model.forward(&input, i)?;
                if i == prompt_tokens.len() - 1 {
                    logits = out.squeeze(0)?.to_vec1::<f32>()?;
                }
            }
            Ok(logits)
        }
        LoadedWeights::Qwen2Safetensors(model) => {
            let input = Tensor::new(prompt_tokens, device)?.unsqueeze(0)?;
            let out = model.forward(&input, 0)?;
            // [batch=1, seq=1, vocab] — squeeze both batch and seq dims.
            let logits = out.squeeze(0)?.squeeze(0)?.to_vec1::<f32>()?;
            Ok(logits)
        }
    }
}

/// Single-token decode step. Same dispatch as `forward_prefill`.
fn forward_step(
    weights: &mut LoadedWeights,
    token: u32,
    position: usize,
    device: &Device,
) -> anyhow::Result<Vec<f32>> {
    match weights {
        LoadedWeights::Gguf(model) => {
            let input = Tensor::new(&[token], device)?;
            let out = model.forward(&input, position)?;
            Ok(out.squeeze(0)?.to_vec1::<f32>()?)
        }
        LoadedWeights::Qwen2Safetensors(model) => {
            let input = Tensor::new(&[token], device)?.unsqueeze(0)?;
            let out = model.forward(&input, position)?;
            Ok(out.squeeze(0)?.squeeze(0)?.to_vec1::<f32>()?)
        }
    }
}

/// Rewrite `<arch>.*` metadata keys to `llama.*` so Candle's quantized
/// llama loader can consume the GGUF without a per-architecture code
/// path. See the block comment inside `load_gguf` for the full story.
///
/// - `arch == "llama"` is a no-op (fast path).
/// - `arch == "unknown"` is a no-op (we don't know the source prefix).
/// - Otherwise every key starting with `<arch>.` is moved to the
///   corresponding `llama.<suffix>` key. Pre-existing `llama.*` keys
///   win — if the GGUF already has both for some reason, the original
///   llama entry is preserved.
/// - `general.architecture` is rewritten to `"llama"` so the loader's
///   final sanity check (if any) sees a consistent declared arch.
fn rewrite_arch_metadata_to_llama(
    metadata: &mut std::collections::HashMap<String, candle_core::quantized::gguf_file::Value>,
    arch: &str,
) {
    use candle_core::quantized::gguf_file::Value;

    if arch == "llama" || arch == "unknown" || arch.is_empty() {
        return;
    }

    let prefix = format!("{arch}.");
    let source_keys: Vec<String> = metadata
        .keys()
        .filter(|k| k.starts_with(&prefix))
        .cloned()
        .collect();

    let mut rewritten = 0usize;
    for key in source_keys {
        let suffix = &key[prefix.len()..];
        let target = format!("llama.{suffix}");
        if metadata.contains_key(&target) {
            // A pre-existing llama.<suffix> wins — don't clobber it.
            continue;
        }
        if let Some(value) = metadata.remove(&key) {
            metadata.insert(target, value);
            rewritten += 1;
        }
    }

    // Candle's loader doesn't actually check general.architecture
    // against a literal "llama", but keep it honest for downstream
    // metadata consumers.
    metadata.insert(
        "general.architecture".to_string(),
        Value::String("llama".to_string()),
    );

    // Backfill any derived fields that Candle's quantized llama loader
    // hard-requires but that a Qwen-style GGUF doesn't store
    // explicitly. These are the exact same defaults llama.cpp computes
    // at runtime when the metadata is missing.
    synthesize_missing_llama_fields(metadata);

    tracing::info!(
        source_arch = %arch,
        rewritten,
        "Rewrote GGUF metadata keys to llama.* prefix for Candle compatibility"
    );
}

/// Fill in `llama.*` metadata fields that Candle's quantized llama
/// loader requires but that some GGUF sources (Qwen, Mistral
/// derivatives) omit because they're derivable from the ones that
/// are present.
///
/// Currently handles:
///
/// - `llama.rope.dimension_count` — synthesised as
///   `embedding_length / attention.head_count`, which is the same
///   formula llama.cpp falls back to when the field is absent.
/// - `llama.attention.layer_norm_rms_epsilon` — synthesised as
///   `1e-6`, the Qwen / Llama-3 default when unspecified.
/// - `llama.rope.freq_base` — synthesised as `10000.0` (standard
///   rotary base) when the source GGUF omits it.
///
/// Pre-existing values always win — this function only adds keys that
/// are currently missing.
fn synthesize_missing_llama_fields(
    metadata: &mut std::collections::HashMap<String, candle_core::quantized::gguf_file::Value>,
) {
    use candle_core::quantized::gguf_file::Value;

    let get_u32 = |m: &std::collections::HashMap<String, Value>, key: &str| -> Option<u32> {
        match m.get(key)? {
            Value::U32(n) => Some(*n),
            Value::U64(n) => Some(*n as u32),
            Value::I32(n) => Some(*n as u32),
            Value::I64(n) => Some(*n as u32),
            _ => None,
        }
    };

    // rope.dimension_count = embedding_length / head_count
    if !metadata.contains_key("llama.rope.dimension_count") {
        if let (Some(embed), Some(heads)) = (
            get_u32(metadata, "llama.embedding_length"),
            get_u32(metadata, "llama.attention.head_count"),
        ) {
            if heads > 0 {
                let dim = embed / heads;
                metadata.insert(
                    "llama.rope.dimension_count".to_string(),
                    Value::U32(dim),
                );
                tracing::info!(
                    embedding_length = embed,
                    head_count = heads,
                    rope_dim = dim,
                    "Synthesised missing llama.rope.dimension_count"
                );
            }
        }
    }

    // RMS norm epsilon — Qwen3 / Llama-3 default is 1e-6. Candle's
    // loader uses `to_f32()` so the Value type must be F32.
    if !metadata.contains_key("llama.attention.layer_norm_rms_epsilon") {
        metadata.insert(
            "llama.attention.layer_norm_rms_epsilon".to_string(),
            Value::F32(1e-6),
        );
        tracing::info!("Synthesised llama.attention.layer_norm_rms_epsilon = 1e-6");
    }

    // Rotary base frequency — Candle reads this as optional but if the
    // source GGUF has something non-default (Qwen3 uses 1_000_000 at
    // long context) we should honour it. If it's missing entirely,
    // 10_000 is the Llama default.
    if !metadata.contains_key("llama.rope.freq_base") {
        metadata.insert(
            "llama.rope.freq_base".to_string(),
            Value::F32(10_000.0),
        );
        tracing::info!("Synthesised llama.rope.freq_base = 10000");
    }
}

/// GGUF loading path — parses the file, builds quantized Llama weights, attaches
/// a tokenizer either from GGUF metadata or `tokenizer.json` on disk.
fn load_gguf(path: &Path, device: &Device) -> anyhow::Result<LoadedModel> {
    let file = std::fs::File::open(path)?;
    let file_size = file.metadata()?.len();
    let mut reader = BufReader::new(file);
    let mut content = Content::read(&mut reader)?;

    let metadata = extract_model_metadata(&content)?;
    tracing::info!(
        arch = %metadata.architecture,
        ctx = metadata.context_length,
        "GGUF metadata parsed"
    );

    // Candle's quantized llama loader hardcodes the `llama.*` metadata
    // prefix — it reads `llama.attention.head_count`, `llama.block_count`,
    // etc. Modern GGUFs quantized as `qwen3`, `qwen2`, `mistral`,
    // `phi3`, etc. store the exact same fields under their own arch
    // prefix, and at the weight level the models are llama-layout-
    // compatible. Renaming the metadata keys from `<arch>.*` to
    // `llama.*` before handing the Content to `from_gguf` lets the
    // loader consume them without a separate per-arch code path.
    //
    // This is the same trick the llama.cpp community uses for loading
    // newer quantized models through older server builds. It does NOT
    // change the tensor data — only the string keys in the metadata
    // map. If the tensor layout actually diverges (e.g. some future
    // Qwen variant with a different attention shape), the weights
    // won't load anyway and this rewrite doesn't change that outcome.
    rewrite_arch_metadata_to_llama(&mut content.metadata, &metadata.architecture);

    let tokenizer = load_tokenizer_from_gguf(&content, path)?;
    let model_weights = qlm::ModelWeights::from_gguf(content, &mut reader, device)?;
    let eos_token = detect_eos_token(&tokenizer);

    let footprint = make_footprint(device, file_size);

    Ok(LoadedModel {
        weights: LoadedWeights::Gguf(model_weights),
        tokenizer,
        metadata,
        footprint,
        eos_token,
    })
}

/// SafeTensors loading path — expects a HuggingFace-style directory with
/// `config.json`, `tokenizer.json`, and one or more `*.safetensors` files.
/// Currently only the Qwen3 architecture is supported.
fn load_safetensors(path: &Path, device: &Device) -> anyhow::Result<LoadedModel> {
    let model_dir = if path.is_dir() {
        path.to_path_buf()
    } else {
        path.parent()
            .ok_or_else(|| anyhow::anyhow!("SafeTensors path has no parent: {}", path.display()))?
            .to_path_buf()
    };

    let config_path = model_dir.join("config.json");
    if !config_path.exists() {
        anyhow::bail!("config.json not found in {}", model_dir.display());
    }
    let tokenizer_path = model_dir.join("tokenizer.json");
    if !tokenizer_path.exists() {
        anyhow::bail!("tokenizer.json not found in {}", model_dir.display());
    }

    let config_bytes = std::fs::read(&config_path)
        .map_err(|e| anyhow::anyhow!("Failed to read config.json: {e}"))?;
    let config_json: serde_json::Value = serde_json::from_slice(&config_bytes)
        .map_err(|e| anyhow::anyhow!("Failed to parse config.json: {e}"))?;

    // Architecture gate — only Qwen2 / Qwen2.5 are wired (candle 0.8 has no qwen3).
    let arch = config_json
        .get("architectures")
        .and_then(|a| a.as_array())
        .and_then(|a| a.first())
        .and_then(|v| v.as_str())
        .unwrap_or("");
    if !arch.starts_with("Qwen2") {
        anyhow::bail!(
            "SafeTensors architecture `{arch}` is not yet supported — only Qwen2* \
             is wired (candle-transformers 0.8). Use a GGUF build or upgrade candle."
        );
    }

    let qwen2_config: qwen2::Config = serde_json::from_value(config_json.clone())
        .map_err(|e| anyhow::anyhow!("Failed to parse Qwen2 config.json: {e}"))?;

    let tokenizer = tokenizers::Tokenizer::from_file(&tokenizer_path)
        .map_err(|e| anyhow::anyhow!("Failed to load tokenizer.json: {e}"))?;

    let safetensor_files = find_safetensor_shards(&model_dir)?;
    if safetensor_files.is_empty() {
        anyhow::bail!("No .safetensors files found in {}", model_dir.display());
    }
    let total_size: u64 = safetensor_files
        .iter()
        .filter_map(|p| std::fs::metadata(p).ok().map(|m| m.len()))
        .sum();

    // SAFETY: candle's mmap API is unsafe because the backing files must not
    // be mutated concurrently. Model directories are read-only at runtime.
    #[allow(unsafe_code)]
    let vb = unsafe {
        VarBuilder::from_mmaped_safetensors(&safetensor_files, DType::F32, device)
            .map_err(|e| anyhow::anyhow!("Failed to mmap safetensors: {e}"))?
    };

    let model = qwen2::ModelForCausalLM::new(&qwen2_config, vb)
        .map_err(|e| anyhow::anyhow!("Failed to build Qwen2 model: {e}"))?;

    let eos_token = detect_eos_token(&tokenizer);

    let metadata = ModelMetadata {
        architecture: arch.to_string(),
        parameter_count: None,
        quant_level: Some("fp32".to_string()),
        context_length: qwen2_config.max_position_embeddings,
        vocab_size: qwen2_config.vocab_size,
    };

    let footprint = make_footprint(device, total_size);

    Ok(LoadedModel {
        weights: LoadedWeights::Qwen2Safetensors(model),
        tokenizer,
        metadata,
        footprint,
        eos_token,
    })
}

/// Find all `*.safetensors` shards in a model directory. Used for both single-file
/// and sharded HF exports.
fn find_safetensor_shards(dir: &Path) -> anyhow::Result<Vec<PathBuf>> {
    let mut files = Vec::new();
    let entries = std::fs::read_dir(dir)
        .map_err(|e| anyhow::anyhow!("Failed to read directory {}: {e}", dir.display()))?;
    for entry in entries.flatten() {
        let p = entry.path();
        if p.extension().and_then(|s| s.to_str()) == Some("safetensors") {
            files.push(p);
        }
    }
    files.sort();
    Ok(files)
}

/// Build a `MemoryFootprint` attributing the loaded bytes to RAM (CPU) or VRAM (GPU).
fn make_footprint(device: &Device, bytes: u64) -> MemoryFootprint {
    if matches!(device, Device::Cpu) {
        MemoryFootprint {
            ram_bytes: bytes,
            vram_bytes: 0,
            kv_cache_bytes: 0,
        }
    } else {
        MemoryFootprint {
            ram_bytes: 0,
            vram_bytes: bytes,
            kv_cache_bytes: 0,
        }
    }
}

/// Simple pseudo-random float in [0, 1) using thread-local state.
/// Not cryptographic — fine for sampling.
fn simple_random() -> f32 {
    use std::cell::Cell;
    thread_local! {
        static STATE: Cell<u64> = Cell::new(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos() as u64
        );
    }
    STATE.with(|s| {
        let mut x = s.get();
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        s.set(x);
        (x as f32) / (u64::MAX as f32)
    })
}
