// orchestrator/src/infra/llm/mod.rs

//! LLM Module - Local and API-based inference
//!
//! ## Components
//! - `LlmBackend`: Local Candle inference (Qwen3-VL-4B GGUF)
//! - Provider management re-exported from `adapters::web`
//!
//! Device: GPU P1 priority (main inference model)
//! Format: GGUF quantized
//!
//! This is the main reasoning model for chat and rumination.

pub mod llmestimator;

// Re-export provider management from adapters::web
pub use crate::adapters::web::{
    // Trait
    LlmProviderAdapter,
    // Types
    ChatRequest, ChatResponse, ChatMessage, ChatRole,
    // Config & Manager
    ProviderConfig, ProviderManager,
    // Provider implementations
    AnthropicProvider, OpenAIProvider, OllamaProvider, LMStudioProvider,
};

use anyhow::{anyhow, Result};
use candle_core::{Device, Tensor};
use candle_transformers::models::quantized_llama::ModelWeights;
use std::path::PathBuf;
use std::sync::Mutex;
use tokenizers::Tokenizer;
use tracing::instrument;

use crate::infra::catalog::models::DeviceAllocation;
use crate::infra::core::config::{BuiltinGrammar, GrammarConfig};
use crate::infra::persistence::bus::EventBus;

/// Llm backend - GPU accelerated VL model via Candle
pub struct LlmBackend {
    model: Mutex<ModelWeights>,
    tokenizer: Tokenizer,
    device: Device,
    eos_token_id: u32,
    grammar_config: GrammarConfig, // Store config for defaults
    #[allow(dead_code)]
    bus: Option<EventBus>, // Reserved for future signal integration
}

/// Generation request
#[derive(Debug, Clone)]
pub struct GenerateRequest {
    pub prompt: String,
    pub max_tokens: u32,
    pub temperature: f32,
    pub top_p: f32,
    pub stop_sequences: Vec<String>,
    /// Grammar constraint for this generation (overrides config default)
    pub grammar: Option<BuiltinGrammar>,
}

impl Default for GenerateRequest {
    fn default() -> Self {
        Self {
            prompt: String::new(),
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 0.9,
            stop_sequences: vec![],
            grammar: None,
        }
    }
}

/// Generation response
#[derive(Debug, Clone)]
pub struct GenerateResponse {
    pub text: String,
    pub tokens_generated: u32,
    pub prompt_tokens: u32,
    pub finish_reason: FinishReason,
}

#[derive(Debug, Clone, PartialEq)]
pub enum FinishReason {
    Stop,
    Length,
    StopSequence,
}

impl LlmBackend {
    /// Load llm model from GGUF file
    #[instrument(name = "llm.load", skip_all, fields(path = %model_path.display()))]
    pub fn load(model_path: &PathBuf, grammar_config: GrammarConfig, bus: Option<EventBus>) -> Result<Self> {
        tracing::info!("Loading llm model from {:?}", model_path);

        if !model_path.exists() {
            return Err(anyhow!("Llm model not found: {:?}", model_path));
        }

        // Device: GPU priority
        let device = DeviceAllocation::GpuP1.to_device();
        tracing::info!("Llm using device: {:?}", device);

        // Load GGUF model via Candle
        let mut file = std::fs::File::open(model_path)?;
        let content = candle_core::quantized::gguf_file::Content::read(&mut file)?;
        let model = ModelWeights::from_gguf(content, &mut file, &device)?;

        // Load tokenizer from same directory
        let tokenizer_path = model_path
            .parent()
            .ok_or_else(|| anyhow!("No parent directory"))?
            .join("tokenizer.json");

        let tokenizer = if tokenizer_path.exists() {
            Tokenizer::from_file(&tokenizer_path)
                .map_err(|e| anyhow!("Failed to load tokenizer: {}", e))?
        } else {
            return Err(anyhow!("Tokenizer not found at {:?}", tokenizer_path));
        };

        // Get EOS token
        let eos_token_id = tokenizer.token_to_id("<|im_end|>").unwrap_or(151643);

        tracing::info!("Llm model loaded successfully");

        Ok(Self {
            model: Mutex::new(model),
            tokenizer,
            device,
            eos_token_id,
            grammar_config,
            bus,
        })
    }

    /// Generate a Mission Plan (reasoning step)
    /// Uses the MISSION_PLAN grammar to enforce structure
    pub fn generate_mission_plan(&self, objective: &str) -> Result<String> {
        let prompt = format!(
            "<|im_start|>system\nYou are a strategic planning AI. Create a mission plan for the following objective.\n<|im_end|>\n<|im_start|>user\n{}\n<|im_end|>\n<|im_start|>assistant\n",
            objective
        );

        let request = GenerateRequest {
            prompt,
            grammar: Some(BuiltinGrammar::MissionPlan),
            ..Default::default()
        };

        let response = self.generate(request)?;
        Ok(response.text)
    }

    /// Generate text completion
    pub fn generate(&self, request: GenerateRequest) -> Result<GenerateResponse> {
        let mut model = self.model.lock().unwrap();

        tracing::debug!("Generating with {} chars prompt", request.prompt.len());

        // Tokenize prompt
        let encoding = self
            .tokenizer
            .encode(request.prompt.as_str(), true)
            .map_err(|e| anyhow!("Tokenization failed: {}", e))?;

        let prompt_tokens = encoding.get_ids().len() as u32;
        let mut tokens: Vec<u32> = encoding.get_ids().to_vec();

        tracing::debug!("Tokenized to {} tokens", prompt_tokens);

        // TODO: Emit start signal via Toon when signal integration is complete

        // TODO: Initialize grammar/FSM state if request.grammar is set

        // Generate tokens
        let mut output_tokens = Vec::new();
        let mut pos = 0usize;

        for _token_idx in 0..request.max_tokens {
            // Build input tensor - just the last token for KV cache efficiency
            let input_token = if pos == 0 {
                // First pass: all tokens
                Tensor::new(&tokens[..], &self.device)?.unsqueeze(0)?
            } else {
                // Subsequent: just the new token
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

            // Apply grammar constraints if enabled and specified
            if self.grammar_config.enabled {
                let effective_grammar = request.grammar.as_ref()
                    .or(self.grammar_config.builtin.as_ref());
                if let Some(grammar) = effective_grammar {
                    let mut logits_vec: Vec<f32> = logits.to_vec1()?;
                    self.apply_grammar_mask(&mut logits_vec, grammar);
                    // Note: In production, reconstruct tensor from masked logits
                    tracing::debug!("Applied grammar {:?}", grammar);
                }
            }

            // Sample with temperature
            let next_token = self.sample_token(&logits, request.temperature, request.top_p)?;

            output_tokens.push(next_token);
            tokens.push(next_token);
            pos = tokens.len() - 1;

            // Decode incrementally (simplified)
            // Real impl would handle partial UTF-8 but simple decode works for now
            let current_full_text = self.decode_tokens(&output_tokens)?;

            // Check for EOS
            if next_token == self.eos_token_id {
                return Ok(GenerateResponse {
                    text: current_full_text,
                    tokens_generated: output_tokens.len() as u32,
                    prompt_tokens,
                    finish_reason: FinishReason::Stop,
                });
            }

            // Check stop sequences
            for stop in &request.stop_sequences {
                if current_full_text.contains(stop) {
                    let trimmed = current_full_text.split(stop).next().unwrap_or(&current_full_text).to_string();
                    return Ok(GenerateResponse {
                        text: trimmed,
                        tokens_generated: output_tokens.len() as u32,
                        prompt_tokens,
                        finish_reason: FinishReason::StopSequence,
                    });
                }
            }
        }

        let current_full_text = self.decode_tokens(&output_tokens)?;

        Ok(GenerateResponse {
            text: current_full_text,
            tokens_generated: output_tokens.len() as u32,
            prompt_tokens,
            finish_reason: FinishReason::Length,
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

    /// Apply grammar constraints to logits (mask invalid tokens)
    fn apply_grammar_mask(&self, _logits: &mut [f32], grammar: &BuiltinGrammar) {
        // Get allowed tokens for current grammar state
        let allowed_tokens: Vec<u32> = match grammar {
            BuiltinGrammar::MissionPlan => {
                // Mission plan must start with "## " for headers
                // This is a simplified constraint - real impl would use FSM
                vec![
                    self.tokenizer.token_to_id("#").unwrap_or(0),
                    self.tokenizer.token_to_id("##").unwrap_or(0),
                ]
            }
            BuiltinGrammar::JsonObject => {
                // JSON must start with { or [
                vec![
                    self.tokenizer.token_to_id("{").unwrap_or(0),
                    self.tokenizer.token_to_id("[").unwrap_or(0),
                ]
            }
            BuiltinGrammar::Direction => {
                // Direction tokens for rumination
                vec![
                    self.tokenizer.token_to_id("forward").unwrap_or(0),
                    self.tokenizer.token_to_id("back").unwrap_or(0),
                    self.tokenizer.token_to_id("expand").unwrap_or(0),
                ]
            }
        };

        // If we have constraints and they're not empty, apply mask
        if !allowed_tokens.is_empty() && allowed_tokens.iter().any(|&t| t != 0) {
            // This is position-sensitive - only apply at start
            // Full implementation would track FSM state
            tracing::debug!("Grammar {:?} constraints available (simplified)", grammar);
        }
    }

    /// Chat completion with Qwen3 format
    pub fn chat(&self, messages: &[(Role, String)], max_tokens: u32) -> Result<GenerateResponse> {
        // Format as Qwen3 chat template
        let mut prompt = String::new();

        for (role, content) in messages {
            match role {
                Role::System => {
                    prompt.push_str(&format!("<|im_start|>system\n{}<|im_end|>\n", content));
                }
                Role::User => {
                    prompt.push_str(&format!("<|im_start|>user\n{}<|im_end|>\n", content));
                }
                Role::Assistant => {
                    prompt.push_str(&format!("<|im_start|>assistant\n{}<|im_end|>\n", content));
                }
            }
        }

        // Add assistant prefix for generation
        prompt.push_str("<|im_start|>assistant\n");

        self.generate(GenerateRequest {
            prompt,
            max_tokens,
            temperature: 0.7,
            top_p: 0.9,
            stop_sequences: vec!["<|im_end|>".to_string()],
            ..Default::default()
        })
    }

    /// Simple single-turn chat
    pub fn ask(&self, question: &str) -> Result<String> {
        let response = self.chat(
            &[
                (Role::System, "You are a helpful AI assistant.".to_string()),
                (Role::User, question.to_string()),
            ],
            1024,
        )?;
        Ok(response.text)
    }
}

/// Chat role
#[derive(Debug, Clone, PartialEq)]
pub enum Role {
    System,
    User,
    Assistant,
}
