// orchestrator/src/adapters/web/openai.rs

//! OpenAI-compatible API adapter
//!
//! Works with:
//! - OpenAI API
//! - LM Studio (OpenAI-compatible)
//! - Groq, DeepSeek, OpenRouter
//! - Any OpenAI-compatible endpoint

use super::{WebAdapter, WebAdapterConfig};
use crate::adapters::{InferParams, InferResponse, InferenceAdapter};
use anyhow::Result;
use async_trait::async_trait;
use shared::{AdapterKind, LlmProvider};
use std::time::Duration;

/// OpenAI-compatible adapter
pub struct OpenAIAdapter {
    config: WebAdapterConfig,
    client: reqwest::Client,
    llm_provider: LlmProvider,
    ready: bool,
}

impl OpenAIAdapter {
    /// Create new adapter with config
    pub fn new(config: WebAdapterConfig, provider: LlmProvider) -> Self {
        // LM Studio doesn't need API key
        let ready = matches!(provider, LlmProvider::LMStudio | LlmProvider::Ollama)
            || config.api_key.is_some();
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(config.timeout_secs))
            .build()
            .expect("Failed to create HTTP client");
        Self {
            config,
            client,
            llm_provider: provider,
            ready,
        }
    }

    /// Create with existing HTTP client
    pub fn with_client(config: WebAdapterConfig, provider: LlmProvider, client: reqwest::Client) -> Self {
        let ready = matches!(provider, LlmProvider::LMStudio | LlmProvider::Ollama)
            || config.api_key.is_some();
        Self {
            config,
            client,
            llm_provider: provider,
            ready,
        }
    }

    /// Create OpenAI adapter
    pub fn openai(api_key: &str, model: &str) -> Self {
        Self::new(WebAdapterConfig::openai(api_key, model), LlmProvider::OpenAI)
    }

    /// Create LM Studio adapter
    pub fn lmstudio(model: &str) -> Self {
        Self::new(WebAdapterConfig::lmstudio(model), LlmProvider::LMStudio)
    }

    /// Check if the endpoint is available (for local servers)
    pub async fn check_availability(&self) -> bool {
        self.client.get(format!("{}/models", self.config.endpoint))
            .timeout(Duration::from_secs(2))
            .send()
            .await
            .is_ok()
    }
}

impl WebAdapter for OpenAIAdapter {
    fn provider(&self) -> LlmProvider {
        self.llm_provider
    }
}

#[async_trait]
impl InferenceAdapter for OpenAIAdapter {
    async fn infer(&self, prompt: &str, params: &InferParams) -> Result<InferResponse> {
        // Build messages with optional system prompt
        let mut messages = Vec::new();
        if let Some(system) = &params.system {
            messages.push(serde_json::json!({
                "role": "system",
                "content": system
            }));
        }
        messages.push(serde_json::json!({
            "role": "user",
            "content": prompt
        }));

        let body = serde_json::json!({
            "model": self.config.model_id,
            "max_tokens": params.max_tokens,
            "temperature": params.temperature,
            "messages": messages,
        });

        let start = std::time::Instant::now();

        let mut request = self.client
            .post(format!("{}/chat/completions", self.config.endpoint))
            .header("content-type", "application/json")
            .json(&body);

        // Add auth header if API key is configured
        if let Some(api_key) = &self.config.api_key {
            request = request.header("Authorization", format!("Bearer {}", api_key));
        }

        let response = request.send().await?;

        let latency_ms = start.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("{} API error: {}", self.llm_provider.display_name(), error_text);
        }

        let data: serde_json::Value = response.json().await?;

        let text = data["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let prompt_tokens = data["usage"]["prompt_tokens"].as_u64().unwrap_or(0) as u32;
        let completion_tokens = data["usage"]["completion_tokens"].as_u64().unwrap_or(0) as u32;

        Ok(InferResponse {
            text,
            prompt_tokens,
            completion_tokens,
            latency_ms,
            model_id: self.config.model_id.clone(),
        })
    }

    async fn infer_stream(
        &self,
        prompt: &str,
        params: &InferParams,
        mut on_token: Box<dyn FnMut(String) + Send>,
    ) -> Result<InferResponse> {
        // TODO: Implement streaming with SSE
        let response = self.infer(prompt, params).await?;
        on_token(response.text.clone());
        Ok(response)
    }

    fn adapter_kind(&self) -> AdapterKind {
        AdapterKind::Web
    }

    fn is_ready(&self) -> bool {
        self.ready
    }

    fn name(&self) -> &str {
        self.llm_provider.display_name()
    }
}
