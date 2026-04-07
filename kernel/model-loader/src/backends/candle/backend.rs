//! Candle backend — implements `InferenceBackend` for GGUF models.
//!
//! Uses `candle_core::quantized` for GGUF loading and
//! `candle_transformers::models::quantized_llama` for forward passes.
//! Covers Llama, Mistral, Qwen2/3, and other Llama-family architectures.

use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::models::registry::ModelMetadata;
use crate::traits::backend::InferenceBackend;
use candle_core::quantized::gguf_file::Content;
use candle_core::{Device, Tensor};
use candle_transformers::models::quantized_llama as qlm;
use std::io::BufReader;
use std::path::Path;

/// Loaded model state — weights + tokenizer + metadata.
struct LoadedModel {
    weights: qlm::ModelWeights,
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

        // Feed the prompt through the model
        let mut logits = Vec::new();
        for (i, &token) in prompt_tokens.iter().enumerate() {
            let input = Tensor::new(&[token], &self.device)?;
            let out = model.weights.forward(&input, i)?;
            if i == prompt_tokens.len() - 1 {
                logits = out.squeeze(0)?.to_vec1::<f32>()?;
            }
        }

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
            let input = Tensor::new(&[next_token], &self.device)?;
            let out = model.weights.forward(&input, pos)?;
            logits = out.squeeze(0)?.to_vec1::<f32>()?;
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
        tracing::info!(path = %path.display(), device = %params.device, "Loading GGUF model via Candle");

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

        // Parse GGUF
        let file = std::fs::File::open(path)?;
        let file_size = file.metadata()?.len();
        let mut reader = BufReader::new(file);
        let content = Content::read(&mut reader)?;

        // Extract metadata
        let metadata = extract_model_metadata(&content)?;
        tracing::info!(
            arch = %metadata.architecture,
            ctx = metadata.context_length,
            vocab = metadata.vocab_size,
            "GGUF metadata parsed"
        );

        // Load tokenizer from GGUF metadata
        let tokenizer = load_tokenizer_from_gguf(&content, path)?;

        // Build model weights
        let model_weights = qlm::ModelWeights::from_gguf(content, &mut reader, &device)?;

        // Detect EOS token
        let eos_token = detect_eos_token(&tokenizer);

        let footprint = MemoryFootprint {
            ram_bytes: if matches!(device, Device::Cpu) {
                file_size
            } else {
                0
            },
            vram_bytes: if !matches!(device, Device::Cpu) {
                file_size
            } else {
                0
            },
        };

        self.model = Some(LoadedModel {
            weights: model_weights,
            tokenizer,
            metadata,
            footprint,
            eos_token,
        });

        tracing::info!(
            ram_mb = footprint.ram_mb(),
            vram_mb = footprint.vram_mb(),
            "Model loaded successfully"
        );

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
