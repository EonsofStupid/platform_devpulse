// orchestrator/src/infra/vision/vl.rs

//! VL Backend - Vision-Language model loading and inference
//!
//! Supports hot-swapping between different VL models (4B, 8B).
//! Uses Candle for GGUF inference with mmproj for vision.
//!
//! Device: GPU P0 priority (primary inference)

use anyhow::{anyhow, Result};
use candle_core::{Device, Tensor};
use candle_transformers::models::quantized_llama::ModelWeights;
use std::sync::{Arc, RwLock, Mutex};
use tokenizers::Tokenizer;
use tracing::instrument;

use crate::infra::catalog::models::{DeviceAllocation, ModelFamily, ModelRegistry, ModelSpec};
use shared::types::models::ModelLoadState;

/// Callback for load progress updates
pub type LoadProgressFn = Box<dyn Fn(u8, &str) + Send + Sync>;

/// Generation request for VL model
#[derive(Debug, Clone)]
pub struct VLGenerateRequest {
    pub prompt: String,
    pub max_tokens: u32,
    pub temperature: f32,
    pub top_p: f32,
    pub stop_sequences: Vec<String>,
}

impl Default for VLGenerateRequest {
    fn default() -> Self {
        Self {
            prompt: String::new(),
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 0.9,
            stop_sequences: vec![],
        }
    }
}

/// Generation response from VL model
#[derive(Debug, Clone)]
pub struct VLGenerateResponse {
    pub text: String,
    pub tokens_generated: u32,
    pub prompt_tokens: u32,
    pub finish_reason: VLFinishReason,
}

#[derive(Debug, Clone, PartialEq)]
pub enum VLFinishReason {
    Stop,
    Length,
    StopSequence,
}

/// Chat role for VL model
#[derive(Debug, Clone, PartialEq)]
pub enum VLRole {
    System,
    User,
    Assistant,
}

/// VL model instance - loaded and ready for inference
pub struct VLModel {
    /// Main LLM weights (Mutex for forward() which needs &mut)
    model: Mutex<ModelWeights>,
    /// Vision projector weights (mmproj) - used for image encoding in multimodal inference
    #[allow(dead_code)] // TODO: Wire to process_image() when vision pipeline is complete
    mmproj: Option<Mutex<ModelWeights>>,
    /// Tokenizer
    tokenizer: Tokenizer,
    /// Device model is loaded on
    device: Device,
    /// Model spec
    spec: ModelSpec,
    /// EOS token ID
    eos_token_id: u32,
}

impl VLModel {
    /// Generate text completion
    #[instrument(name = "vl.generate", skip(self), fields(prompt_len = request.prompt.len()))]
    pub fn generate(&self, request: VLGenerateRequest) -> Result<VLGenerateResponse> {
        let mut model = self.model.lock().unwrap();

        tracing::debug!("VL generating with {} chars prompt", request.prompt.len());

        // Tokenize prompt
        let encoding = self
            .tokenizer
            .encode(request.prompt.as_str(), true)
            .map_err(|e| anyhow!("Tokenization failed: {}", e))?;

        let prompt_tokens = encoding.get_ids().len() as u32;
        let mut tokens: Vec<u32> = encoding.get_ids().to_vec();

        tracing::debug!("Tokenized to {} tokens", prompt_tokens);

        // Generate tokens
        let mut output_tokens = Vec::new();
        let mut pos = 0usize;

        for _ in 0..request.max_tokens {
            // Build input tensor
            let input_token = if pos == 0 {
                // First pass: all tokens
                Tensor::new(&tokens[..], &self.device)?.unsqueeze(0)?
            } else {
                // Subsequent: just the new token (KV cache)
                Tensor::new(&[*tokens.last().unwrap()], &self.device)?.unsqueeze(0)?
            };

            // Forward pass
            let logits = model.forward(&input_token, pos)?;

            // Get last token logits
            let logits = logits.squeeze(0)?;
            let logits = if logits.dims().len() > 1 {
                logits.get(logits.dim(0)? - 1)?
            } else {
                logits
            };

            // Sample with temperature
            let next_token = self.sample_token(&logits, request.temperature, request.top_p)?;

            // Check for EOS
            if next_token == self.eos_token_id {
                return Ok(VLGenerateResponse {
                    text: self.decode_tokens(&output_tokens)?,
                    tokens_generated: output_tokens.len() as u32,
                    prompt_tokens,
                    finish_reason: VLFinishReason::Stop,
                });
            }

            output_tokens.push(next_token);
            tokens.push(next_token);
            pos = tokens.len() - 1;

            // Check stop sequences
            let current_text = self.decode_tokens(&output_tokens)?;
            for stop in &request.stop_sequences {
                if current_text.contains(stop) {
                    let trimmed = current_text.split(stop).next().unwrap_or(&current_text);
                    return Ok(VLGenerateResponse {
                        text: trimmed.to_string(),
                        tokens_generated: output_tokens.len() as u32,
                        prompt_tokens,
                        finish_reason: VLFinishReason::StopSequence,
                    });
                }
            }
        }

        Ok(VLGenerateResponse {
            text: self.decode_tokens(&output_tokens)?,
            tokens_generated: output_tokens.len() as u32,
            prompt_tokens,
            finish_reason: VLFinishReason::Length,
        })
    }

    /// Sample next token with temperature and top_p
    fn sample_token(&self, logits: &Tensor, temperature: f32, top_p: f32) -> Result<u32> {
        let logits = logits.to_dtype(candle_core::DType::F32)?;
        let logits: Vec<f32> = logits.to_vec1()?;

        // Apply temperature
        let logits: Vec<f32> = if temperature > 0.0 {
            logits.iter().map(|x| x / temperature).collect()
        } else {
            logits
        };

        // Softmax
        let max_logit = logits.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
        let exp_logits: Vec<f32> = logits.iter().map(|x| (x - max_logit).exp()).collect();
        let sum_exp: f32 = exp_logits.iter().sum();
        let probs: Vec<f32> = exp_logits.iter().map(|x| x / sum_exp).collect();

        // Top-p sampling
        let mut indexed_probs: Vec<(usize, f32)> =
            probs.iter().enumerate().map(|(i, &p)| (i, p)).collect();
        indexed_probs.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        let mut cumsum = 0.0;
        let mut cutoff_idx = indexed_probs.len();
        for (i, (_, p)) in indexed_probs.iter().enumerate() {
            cumsum += p;
            if cumsum >= top_p {
                cutoff_idx = i + 1;
                break;
            }
        }

        // Renormalize and sample
        let candidates: Vec<(usize, f32)> = indexed_probs[..cutoff_idx].to_vec();
        let total: f32 = candidates.iter().map(|(_, p)| p).sum();

        let mut rng_val: f32 = rand::random();
        rng_val *= total;

        let mut cumsum = 0.0;
        for (idx, p) in &candidates {
            cumsum += p;
            if cumsum >= rng_val {
                return Ok(*idx as u32);
            }
        }

        Ok(candidates.last().map(|(i, _)| *i as u32).unwrap_or(0))
    }

    /// Decode tokens to string
    fn decode_tokens(&self, tokens: &[u32]) -> Result<String> {
        self.tokenizer
            .decode(tokens, true)
            .map_err(|e| anyhow!("Token decode failed: {}", e))
    }

    /// Chat completion with Qwen3 format
    pub fn chat(&self, messages: &[(VLRole, String)], max_tokens: u32) -> Result<VLGenerateResponse> {
        // Format as Qwen3 chat template
        let mut prompt = String::new();

        for (role, content) in messages {
            match role {
                VLRole::System => {
                    prompt.push_str(&format!("<|im_start|>system\n{}<|im_end|>\n", content));
                }
                VLRole::User => {
                    prompt.push_str(&format!("<|im_start|>user\n{}<|im_end|>\n", content));
                }
                VLRole::Assistant => {
                    prompt.push_str(&format!("<|im_start|>assistant\n{}<|im_end|>\n", content));
                }
            }
        }

        // Add assistant prefix for generation
        prompt.push_str("<|im_start|>assistant\n");

        self.generate(VLGenerateRequest {
            prompt,
            max_tokens,
            temperature: 0.7,
            top_p: 0.9,
            stop_sequences: vec!["<|im_end|>".to_string()],
        })
    }

    /// Simple single-turn chat
    pub fn ask(&self, question: &str) -> Result<String> {
        let response = self.chat(
            &[
                (VLRole::System, "You are a helpful AI assistant.".to_string()),
                (VLRole::User, question.to_string()),
            ],
            1024,
        )?;
        Ok(response.text)
    }
}

/// VL Backend - manages VL model loading and switching
pub struct VLBackend {
    /// Currently loaded model (if any)
    current: RwLock<Option<VLModel>>,
    /// Model registry reference
    registry: Arc<RwLock<ModelRegistry>>,
    /// Progress callback
    on_progress: RwLock<Option<LoadProgressFn>>,
}

impl VLBackend {
    /// Create new VL backend
    pub fn new(registry: Arc<RwLock<ModelRegistry>>) -> Self {
        Self {
            current: RwLock::new(None),
            registry,
            on_progress: RwLock::new(None),
        }
    }

    /// Set progress callback
    pub fn set_progress_callback(&self, callback: LoadProgressFn) {
        *self.on_progress.write().unwrap() = Some(callback);
    }

    /// Report progress
    fn report_progress(&self, pct: u8, stage: &str) {
        if let Some(cb) = self.on_progress.read().unwrap().as_ref() {
            cb(pct, stage);
        }
    }

    /// Load a VL model by ID
    #[instrument(name = "vl.load", skip(self), fields(model_id = %model_id))]
    pub fn load(&self, model_id: &str) -> Result<()> {
        // Get spec from registry
        let (spec, base_dir) = {
            let registry = self.registry.read().unwrap();
            let spec = registry
                .get(model_id)
                .ok_or_else(|| anyhow!("Unknown model: {}", model_id))?
                .clone();

            if spec.family != ModelFamily::Qwen3VL {
                return Err(anyhow!("Model {} is not a VL model", model_id));
            }

            (spec, registry.base_dir().to_path_buf())
        };

        self.report_progress(0, "Validating files");
        tracing::info!(model = %spec.name, "Loading VL model");

        // Verify files exist
        spec.verify_files(&base_dir)?;
        self.report_progress(10, "Files validated");

        // Unload current model first (drop to free VRAM)
        {
            let mut current = self.current.write().unwrap();
            if current.is_some() {
                tracing::info!("Unloading current VL model");
                *current = None;
            }
        }
        self.report_progress(15, "Previous model unloaded");

        // Device selection - GPU P0 for VL
        let device = DeviceAllocation::Gpu { priority: 0 }.to_device();
        tracing::info!(device = ?device, "Using device");

        // Load main model GGUF
        self.report_progress(20, "Loading main model");
        let model_path = spec.model_path(&base_dir);
        tracing::debug!(path = %model_path.display(), "Loading GGUF");

        let mut file = std::fs::File::open(&model_path)?;
        let content = candle_core::quantized::gguf_file::Content::read(&mut file)?;
        let model = ModelWeights::from_gguf(content, &mut file, &device)?;
        self.report_progress(60, "Main model loaded");

        // Load mmproj if present
        let mmproj = if let Some(mmproj_path) = spec.mmproj_path(&base_dir) {
            self.report_progress(65, "Loading vision projector");
            tracing::debug!(path = %mmproj_path.display(), "Loading mmproj");

            let mut mmproj_file = std::fs::File::open(&mmproj_path)?;
            let mmproj_content = candle_core::quantized::gguf_file::Content::read(&mut mmproj_file)?;
            let mmproj_weights = ModelWeights::from_gguf(mmproj_content, &mut mmproj_file, &device)?;
            self.report_progress(80, "Vision projector loaded");
            Some(mmproj_weights)
        } else {
            None
        };

        // Load tokenizer
        self.report_progress(85, "Loading tokenizer");
        let tokenizer_path = model_path
            .parent()
            .ok_or_else(|| anyhow!("No parent directory"))?
            .join("tokenizer.json");

        let tokenizer = if tokenizer_path.exists() {
            Tokenizer::from_file(&tokenizer_path)
                .map_err(|e| anyhow!("Failed to load tokenizer: {}", e))?
        } else {
            // Try parent's parent (for nested structures like 8vlb/qwen3-vl-8b/)
            let alt_path = base_dir.join("tokenizer.json");
            if alt_path.exists() {
                Tokenizer::from_file(&alt_path)
                    .map_err(|e| anyhow!("Failed to load tokenizer: {}", e))?
            } else {
                return Err(anyhow!("Tokenizer not found at {:?} or {:?}", tokenizer_path, alt_path));
            }
        };

        // Get EOS token
        let eos_token_id = tokenizer.token_to_id("<|im_end|>").unwrap_or(151643);
        self.report_progress(90, "Tokenizer loaded");

        // Store loaded model (wrap in Mutex for thread-safe inference)
        let vl_model = VLModel {
            model: Mutex::new(model),
            mmproj: mmproj.map(Mutex::new),
            tokenizer,
            device,
            spec: spec.clone(),
            eos_token_id,
        };

        *self.current.write().unwrap() = Some(vl_model);

        // Update registry active
        {
            let mut registry = self.registry.write().unwrap();
            registry.set_active(ModelFamily::Qwen3VL, model_id)?;
            registry.set_load_state(
                ModelFamily::Qwen3VL,
                ModelLoadState::Loaded {
                    vram_mb: (spec.memory.vram_gb * 1024.0) as u64,
                    latency_ms: 0,
                },
            );
        }

        self.report_progress(100, "Ready");
        tracing::info!(model = %spec.name, "VL model loaded successfully");

        Ok(())
    }

    /// Unload current model
    pub fn unload(&self) {
        let mut current = self.current.write().unwrap();
        if let Some(model) = current.take() {
            tracing::info!(model = %model.spec.name, "Unloading VL model");
            // Model dropped here, VRAM freed
        }

        let mut registry = self.registry.write().unwrap();
        registry.set_load_state(ModelFamily::Qwen3VL, ModelLoadState::Idle);
    }

    /// Check if a model is loaded
    pub fn is_loaded(&self) -> bool {
        self.current.read().unwrap().is_some()
    }

    /// Get currently loaded model spec
    pub fn current_spec(&self) -> Option<ModelSpec> {
        self.current.read().unwrap().as_ref().map(|m| m.spec.clone())
    }

    /// Get current model ID
    pub fn current_id(&self) -> Option<String> {
        self.current.read().unwrap().as_ref().map(|m| m.spec.id.clone())
    }

    /// Switch to a different model (unload current, load new)
    #[instrument(name = "vl.switch", skip(self), fields(to = %model_id))]
    pub fn switch(&self, model_id: &str) -> Result<()> {
        // Check if already loaded
        if let Some(current) = self.current_id() {
            if current == model_id {
                tracing::info!("Model {} already loaded", model_id);
                return Ok(());
            }
        }

        // Update load state
        {
            let mut registry = self.registry.write().unwrap();
            registry.set_load_state(
                ModelFamily::Qwen3VL,
                ModelLoadState::Loading {
                    progress_pct: 0,
                    stage: "Starting".to_string(),
                },
            );
        }

        // Load new model (this will unload current first)
        self.load(model_id)
    }

    /// List available VL models
    pub fn list_available(&self) -> Vec<ModelSpec> {
        let registry = self.registry.read().unwrap();
        registry
            .list_family(ModelFamily::Qwen3VL)
            .into_iter()
            .cloned()
            .collect()
    }

    // ============== Inference Methods ==============

    /// Generate text using the loaded VL model
    #[instrument(name = "vl.backend.generate", skip(self))]
    pub fn generate(&self, request: VLGenerateRequest) -> Result<VLGenerateResponse> {
        let current = self.current.read().unwrap();
        let model = current
            .as_ref()
            .ok_or_else(|| anyhow!("No VL model loaded"))?;
        model.generate(request)
    }

    /// Chat with the loaded VL model
    #[instrument(name = "vl.backend.chat", skip(self, messages))]
    pub fn chat(&self, messages: &[(VLRole, String)], max_tokens: u32) -> Result<VLGenerateResponse> {
        let current = self.current.read().unwrap();
        let model = current
            .as_ref()
            .ok_or_else(|| anyhow!("No VL model loaded"))?;
        model.chat(messages, max_tokens)
    }

    /// Simple single-turn chat
    #[instrument(name = "vl.backend.ask", skip(self))]
    pub fn ask(&self, question: &str) -> Result<String> {
        let current = self.current.read().unwrap();
        let model = current
            .as_ref()
            .ok_or_else(|| anyhow!("No VL model loaded"))?;
        model.ask(question)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vl_backend_creation() {
        let registry = Arc::new(RwLock::new(ModelRegistry::new()));
        let backend = VLBackend::new(registry);
        assert!(!backend.is_loaded());
    }

    #[test]
    fn test_list_available() {
        let registry = Arc::new(RwLock::new(ModelRegistry::new()));
        let backend = VLBackend::new(registry);
        let models = backend.list_available();
        assert!(!models.is_empty());
    }
}
