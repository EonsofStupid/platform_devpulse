// orchestrator/src/infra/core/services/loaders.rs

//! Service loaders - Factory functions for creating service instances
//!
//! These functions take config and return trait objects.
//! The actual implementations live in embedder.rs, reranker.rs, llm.rs

use super::traits::{EmbedderService, LlmService, RerankerService};
use super::descriptors::ModelFamily;
use crate::infra::core::config::ServicesConfig;
use crate::infra::embedding::embedder::EmbedderBackend;
use crate::infra::embedding::reranker::RerankerBackend;
use anyhow::{anyhow, Result};

/// Load embedder based on config
pub async fn load_embedder(config: ServicesConfig) -> Result<impl EmbedderService> {
    // Get the active model ID
    let model_id = config
        .embedder
        .as_ref()
        .map(|c| c.active.as_str())
        .unwrap_or("Qwen3Embed0_6B");

    // Get descriptor from registry
    let descriptor = config
        .models
        .get_embedder(model_id)
        .ok_or_else(|| anyhow!("Unknown embedder model: {}", model_id))?;

    // Resolve full path
    let full_path = config.models_dir.join(&descriptor.path);

    tracing::info!(
        "Loading embedder: {} (dim={}) from {:?}",
        model_id,
        descriptor.dimension,
        full_path
    );

    // Load the actual backend
    // For now, we only support Qwen3 embedder
    match descriptor.family {
        ModelFamily::Qwen3Embed => {
            let backend = EmbedderBackend::load(&full_path)?;
            Ok(Qwen3EmbedderWrapper {
                model_id: model_id.to_string(),
                backend,
            })
        }
        _ => Err(anyhow!(
            "Unsupported embedder family: {:?}",
            descriptor.family
        )),
    }
}

/// Load reranker based on config
pub async fn load_reranker(config: ServicesConfig) -> Result<impl RerankerService> {
    let model_id = config
        .reranker
        .as_ref()
        .map(|c| c.active.as_str())
        .unwrap_or("Qwen3Rerank0_6B");

    let descriptor = config
        .models
        .get_reranker(model_id)
        .ok_or_else(|| anyhow!("Unknown reranker model: {}", model_id))?;

    let full_path = config.models_dir.join(&descriptor.path);

    tracing::info!("Loading reranker: {} from {:?}", model_id, full_path);

    match descriptor.family {
        ModelFamily::Qwen3Rerank => {
            let backend = RerankerBackend::load(&full_path)?;
            Ok(Qwen3RerankerWrapper {
                model_id: model_id.to_string(),
                backend,
            })
        }
        _ => Err(anyhow!(
            "Unsupported reranker family: {:?}",
            descriptor.family
        )),
    }
}

/// Load LLM based on config
pub async fn load_llm(config: ServicesConfig) -> Result<impl LlmService> {
    let model_id = config
        .llm
        .as_ref()
        .map(|c| c.active.as_str())
        .unwrap_or("Qwen3VL4B_Q4KM");

    let descriptor = config
        .models
        .get_llm(model_id)
        .ok_or_else(|| anyhow!("Unknown LLM model: {}", model_id))?;

    let full_path = config.models_dir.join(&descriptor.path);

    tracing::info!(
        "Loading LLM: {} (vram={:.1}GB) from {:?}",
        model_id,
        descriptor.vram_gb,
        full_path
    );

    // Get grammar config from main config
    let grammar_config = config.llm.as_ref().map(|c| c.grammar.clone()).unwrap_or_default();

    // Load actual backend (no event bus for service loader)
    let backend = crate::infra::llm::LlmBackend::load(&full_path, grammar_config, None)?;

    Ok(RealLlmWrapper {
        model_id: model_id.to_string(),
        vram_gb: descriptor.vram_gb,
        supports_vision: descriptor.supports_vision,
        backend,
    })
}

// ═══════════════════════════════════════════════════════════════
// Wrapper implementations that adapt existing backends to traits
// ═══════════════════════════════════════════════════════════════

/// Qwen3 Embedder wrapper connecting trait to backend
struct Qwen3EmbedderWrapper {
    model_id: String,
    backend: EmbedderBackend,
}

impl EmbedderService for Qwen3EmbedderWrapper {
    fn model_id(&self) -> &str {
        &self.model_id
    }

    fn dimension(&self) -> usize {
        self.backend.dimension()
    }

    fn embed(&self, text: &str) -> Result<Vec<f32>> {
        self.backend.embed(text)
    }
}

/// Qwen3 Reranker wrapper connecting trait to backend
struct Qwen3RerankerWrapper {
    model_id: String,
    backend: RerankerBackend,
}

impl RerankerService for Qwen3RerankerWrapper {
    fn model_id(&self) -> &str {
        &self.model_id
    }

    fn score(&self, query: &str, document: &str) -> Result<f32> {
        self.backend.score(query, document)
    }

    fn score_with_instruction(&self, instruction: &str, query: &str, document: &str) -> Result<f32> {
        self.backend.score_with_instruction(instruction, query, document)
    }
}

/// Real LLM wrapper connecting trait to backend
struct RealLlmWrapper {
    model_id: String,
    vram_gb: f32,
    supports_vision: bool,
    backend: crate::infra::llm::LlmBackend,
}

#[async_trait::async_trait]
impl LlmService for RealLlmWrapper {
    fn model_id(&self) -> &str {
        &self.model_id
    }

    fn vram_gb(&self) -> f32 {
        self.vram_gb
    }

    fn supports_vision(&self) -> bool {
        self.supports_vision
    }

    async fn generate(
        &self,
        request: super::GenerateRequest,
    ) -> Result<super::GenerateResponse> {
        // Map service request to backend request
        // Note: Backend request has extra 'grammar' and 'top_p' fields we default
        let backend_req = crate::infra::llm::GenerateRequest {
            prompt: request.prompt,
            max_tokens: request.max_tokens,
            temperature: request.temperature,
            top_p: 0.9, // Default top_p - service trait doesn't expose this yet
            stop_sequences: request.stop_sequences,
            grammar: None, // Default for now, generic trait doesn't have grammar yet
        };

        // Run generation (blocking operation wrapped in spawn_blocking if needed, 
        // but Candle is often CPU-bound or mixed. LlmBackend uses Mutex, so it's thread-safe)
        // ideally we offload this if it blocks heavily.
        let response = self.backend.generate(backend_req)?;

        // Map backend response to service response
        Ok(super::GenerateResponse {
            text: response.text,
            tokens_used: response.tokens_generated,
            finish_reason: match response.finish_reason {
                crate::infra::llm::FinishReason::Stop => super::FinishReason::Stop,
                crate::infra::llm::FinishReason::Length => super::FinishReason::Length,
                crate::infra::llm::FinishReason::StopSequence => super::FinishReason::StopSequence,
            },
        })
    }
}
