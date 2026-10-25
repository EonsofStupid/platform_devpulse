// orchestrator/src/infra/core/services/traits.rs

//! Service traits - Abstractions for AI backends
//!
//! Each trait defines the interface for a service kind.
//! Implementations are in their respective files (embedder.rs, reranker.rs, llm.rs)

use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

// ═══════════════════════════════════════════════════════════════
// EmbedderService
// ═══════════════════════════════════════════════════════════════

/// Embedder trait - any model producing dense vectors
///
/// Implementations:
/// - `Qwen3EmbedderBackend` (0.6B, 4B, 8B variants)
/// - Future: OpenAI, Cohere, custom models
#[async_trait]
pub trait EmbedderService: Send + Sync {
    /// Model identifier (e.g., "Qwen3Embed0_6B")
    fn model_id(&self) -> &str;

    /// Output vector dimension
    fn dimension(&self) -> usize;

    /// Embed single text
    fn embed(&self, text: &str) -> Result<Vec<f32>>;

    /// Embed batch of texts
    fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        // Default: sequential fallback
        texts.iter().map(|t| self.embed(t)).collect()
    }
}

// ═══════════════════════════════════════════════════════════════
// RerankerService
// ═══════════════════════════════════════════════════════════════

/// Reranker trait - scoring query-document relevance
///
/// Implementations:
/// - `Qwen3RerankerBackend` (0.6B thinking mode)
/// - Future: cross-encoders, other models
#[async_trait]
pub trait RerankerService: Send + Sync {
    /// Model identifier
    fn model_id(&self) -> &str;

    /// Score single document relevance to query
    /// Returns 0.0-1.0 (higher = more relevant)
    fn score(&self, query: &str, document: &str) -> Result<f32>;

    /// Score with custom instruction
    fn score_with_instruction(
        &self,
        instruction: &str,
        query: &str,
        document: &str,
    ) -> Result<f32>;

    /// Score multiple documents
    fn score_batch(&self, query: &str, documents: &[&str]) -> Result<Vec<f32>> {
        // Default: sequential fallback
        documents.iter().map(|d| self.score(query, d)).collect()
    }

    /// Rerank documents by relevance, returning (index, score) pairs sorted descending
    fn rerank(&self, query: &str, documents: &[&str]) -> Result<Vec<(usize, f32)>> {
        let mut scored: Vec<(usize, f32)> = self
            .score_batch(query, documents)?
            .into_iter()
            .enumerate()
            .collect();

        // Sort descending by score
        scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        Ok(scored)
    }
}

// ═══════════════════════════════════════════════════════════════
// LlmService
// ═══════════════════════════════════════════════════════════════

/// Generation request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateRequest {
    /// Input prompt
    pub prompt: String,
    /// Maximum tokens to generate
    pub max_tokens: u32,
    /// Sampling temperature (0.0 = deterministic, 1.0 = creative)
    pub temperature: f32,
    /// Optional GBNF grammar for structured output
    pub grammar: Option<String>,
    /// Stop sequences
    #[serde(default)]
    pub stop_sequences: Vec<String>,
}

impl Default for GenerateRequest {
    fn default() -> Self {
        Self {
            prompt: String::new(),
            max_tokens: 1024,
            temperature: 0.7,
            grammar: None,
            stop_sequences: vec![],
        }
    }
}

impl GenerateRequest {
    pub fn new(prompt: impl Into<String>) -> Self {
        Self {
            prompt: prompt.into(),
            ..Default::default()
        }
    }

    pub fn with_max_tokens(mut self, max_tokens: u32) -> Self {
        self.max_tokens = max_tokens;
        self
    }

    pub fn with_temperature(mut self, temperature: f32) -> Self {
        self.temperature = temperature;
        self
    }

    pub fn with_grammar(mut self, grammar: impl Into<String>) -> Self {
        self.grammar = Some(grammar.into());
        self
    }
}

/// Generation response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateResponse {
    /// Generated text
    pub text: String,
    /// Number of tokens used
    pub tokens_used: u32,
    /// Why generation stopped
    pub finish_reason: FinishReason,
}

/// Reason generation stopped
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FinishReason {
    /// Natural stop token
    Stop,
    /// Hit max_tokens limit
    Length,
    /// Grammar constraint forced stop
    Grammar,
    /// Hit stop sequence
    StopSequence,
}

/// LLM trait - text generation with optional grammar enforcement
///
/// Implementations:
/// - `Qwen3LlmBackend` (4B, 8B VL models via GGUF)
/// - Future: llama.cpp, vLLM, API backends
#[async_trait]
pub trait LlmService: Send + Sync {
    /// Model identifier
    fn model_id(&self) -> &str;

    /// Estimated VRAM usage in GB
    fn vram_gb(&self) -> f32;

    /// Does this model support vision?
    fn supports_vision(&self) -> bool;

    /// Generate text
    async fn generate(&self, request: GenerateRequest) -> Result<GenerateResponse>;

    /// Simple completion (convenience wrapper)
    async fn complete(&self, prompt: &str) -> Result<String> {
        let response = self.generate(GenerateRequest::new(prompt)).await?;
        Ok(response.text)
    }
}
