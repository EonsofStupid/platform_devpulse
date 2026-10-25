// orchestrator/src/adapters/web/anthropic.rs

//! Anthropic Claude API adapter
//!
//! Full implementation with HTTP client for Claude API.

use super::{WebAdapter, WebAdapterConfig};
use crate::adapters::{InferParams, InferResponse, InferenceAdapter};
use anyhow::Result;
use async_trait::async_trait;
use shared::{AdapterKind, LlmProvider};
use std::time::Duration;

/// Anthropic Claude adapter
pub struct AnthropicAdapter {
    config: WebAdapterConfig,
    client: reqwest::Client,
    ready: bool,
}

impl AnthropicAdapter {
    /// Create new adapter with config
    pub fn new(config: WebAdapterConfig) -> Self {
        let ready = config.api_key.is_some();
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(config.timeout_secs))
            .build()
            .expect("Failed to create HTTP client");
        Self { config, client, ready }
    }

    /// Create with API key and model
    pub fn with_key(api_key: &str, model: &str) -> Self {
        Self::new(WebAdapterConfig::anthropic(api_key, model))
    }

    /// Create with existing HTTP client (for connection pooling)
    pub fn with_client(config: WebAdapterConfig, client: reqwest::Client) -> Self {
        let ready = config.api_key.is_some();
        Self { config, client, ready }
    }
}

impl WebAdapter for AnthropicAdapter {
    fn provider(&self) -> LlmProvider {
        LlmProvider::Anthropic
    }
}

#[async_trait]
impl InferenceAdapter for AnthropicAdapter {
    async fn infer(&self, prompt: &str, params: &InferParams) -> Result<InferResponse> {
        let api_key = self.config.api_key.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Anthropic API key not configured"))?;

        // Build messages array
        let messages = vec![serde_json::json!({
            "role": "user",
            "content": prompt
        })];

        let mut body = serde_json::json!({
            "model": self.config.model_id,
            "max_tokens": params.max_tokens,
            "messages": messages,
        });

        // Add system prompt if provided
        if let Some(system) = &params.system {
            body["system"] = serde_json::Value::String(system.clone());
        }

        let start = std::time::Instant::now();

        let response = self.client
            .post(format!("{}/messages", self.config.endpoint))
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&body)
            .send()
            .await?;

        let latency_ms = start.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Anthropic API error: {}", error_text);
        }

        let data: serde_json::Value = response.json().await?;

        let text = data["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let prompt_tokens = data["usage"]["input_tokens"].as_u64().unwrap_or(0) as u32;
        let completion_tokens = data["usage"]["output_tokens"].as_u64().unwrap_or(0) as u32;

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
        // For now, fall back to non-streaming
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
        "Anthropic Claude"
    }
}
