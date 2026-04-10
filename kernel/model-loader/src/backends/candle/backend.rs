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

/// Load tokenizer from GGUF metadata or fallback to HuggingFace Hub.
fn load_tokenizer_from_gguf(
    content: &Content,
    model_path: &Path,
) -> anyhow::Result<tokenizers::Tokenizer> {
    use candle_core::quantized::gguf_file::Value;

    // Try loading from GGUF tokenizer.ggml.tokens metadata
    let tokens = content.metadata.get("tokenizer.ggml.tokens");
    let model_type = content.metadata.get("tokenizer.ggml.model");

    if let (Some(Value::Array(tokens_arr)), Some(Value::String(model_str))) = (tokens, model_type) {
        tracing::debug!(
            model_type = %model_str,
            token_count = tokens_arr.len(),
            "Found embedded tokenizer in GGUF"
        );
    }

    // Try loading a tokenizer.json next to the GGUF file
    let dir = model_path.parent().unwrap_or(Path::new("."));
    let tokenizer_path = dir.join("tokenizer.json");
    if tokenizer_path.exists() {
        tracing::info!(path = %tokenizer_path.display(), "Loading tokenizer.json from model directory");
        return tokenizers::Tokenizer::from_file(&tokenizer_path)
            .map_err(|e| anyhow::anyhow!("Failed to load tokenizer.json: {e}"));
    }

    // Try to get the repo ID from GGUF metadata to fetch tokenizer from HF
    if let Some(Value::String(repo)) = content.metadata.get("general.source.huggingface.repository")
    {
        tracing::info!(repo = %repo, "Fetching tokenizer from HuggingFace");
        let api = hf_hub::api::sync::ApiBuilder::new().build().map_err(|e| anyhow::anyhow!("{e}"))?;
        let repo_api = api.model(repo.clone());
        let tokenizer_file = repo_api.get("tokenizer.json")?;
        return tokenizers::Tokenizer::from_file(tokenizer_file)
            .map_err(|e| anyhow::anyhow!("Failed to load HF tokenizer: {e}"));
    }

    // Last resort: try general.name as a repo fallback
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
        "No tokenizer found — place a tokenizer.json next to the GGUF file or ensure the model has HF metadata"
    )
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

/// GGUF loading path — parses the file, builds quantized Llama weights, attaches
/// a tokenizer either from GGUF metadata or `tokenizer.json` on disk.
fn load_gguf(path: &Path, device: &Device) -> anyhow::Result<LoadedModel> {
    let file = std::fs::File::open(path)?;
    let file_size = file.metadata()?.len();
    let mut reader = BufReader::new(file);
    let content = Content::read(&mut reader)?;

    let metadata = extract_model_metadata(&content)?;
    tracing::info!(
        arch = %metadata.architecture,
        ctx = metadata.context_length,
        "GGUF metadata parsed"
    );

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
