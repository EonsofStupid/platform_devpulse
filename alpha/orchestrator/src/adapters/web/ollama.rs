// orchestrator/src/adapters/web/ollama.rs

//! Ollama local server adapter
//!
//! Connects to a locally running Ollama server.
//! Uses native Ollama API (not OpenAI-compatible).
//! No API key required - availability checked at runtime.

use super::{WebAdapter, WebAdapterConfig};
use crate::adapters::{InferParams, InferResponse, InferenceAdapter};
use anyhow::Result;
use async_trait::async_trait;
use shared::{AdapterKind, LlmProvider};
use std::time::Duration;

/// Ollama adapter (native API)
pub struct OllamaAdapter {
    config: WebAdapterConfig,
    client: reqwest::Client,
    ready: bool,
}

impl OllamaAdapter {
    /// Create new adapter with config
    pub fn new(config: WebAdapterConfig) -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(config.timeout_secs))
            .build()
            .expect("Failed to create HTTP client");
        Self {
            config,
            client,
            ready: true, // Ollama availability checked at call time
        }
    }

    /// Create with default endpoint and model
    pub fn with_model(model: &str) -> Self {
        Self::new(WebAdapterConfig::ollama(model))
    }

    /// Create with existing HTTP client
    pub fn with_client(config: WebAdapterConfig, client: reqwest::Client) -> Self {
        Self {
            config,
            client,
            ready: true,
        }
    }

    /// Check if Ollama server is running
    pub async fn check_availability(&self) -> bool {
        self.client.get(format!("{}/api/version", self.config.endpoint))
            .timeout(Duration::from_secs(2))
            .send()
            .await
            .is_ok()
    }

    /// List available models from Ollama
    pub async fn list_models(&self) -> Result<Vec<String>> {
        let response = self.client
            .get(format!("{}/api/tags", self.config.endpoint))
            .timeout(Duration::from_secs(5))
            .send()
            .await?;

        if !response.status().is_success() {
            return Ok(Vec::new());
        }

        let data: serde_json::Value = response.json().await?;

        let models = data["models"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|m| m["name"].as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default();

        Ok(models)
    }
}

impl WebAdapter for OllamaAdapter {
    fn provider(&self) -> LlmProvider {
        LlmProvider::Ollama
    }
}

#[async_trait]
impl InferenceAdapter for OllamaAdapter {
    async fn infer(&self, prompt: &str, params: &InferParams) -> Result<InferResponse> {
        // Build chat messages
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
            "messages": messages,
            "stream": false,
            "options": {
                "num_predict": params.max_tokens,
                "temperature": params.temperature,
            }
        });

        let start = std::time::Instant::now();

        let response = self.client
            .post(format!("{}/api/chat", self.config.endpoint))
            .json(&body)
            .send()
            .await?;

        let latency_ms = start.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Ollama API error: {}", error_text);
        }

        let data: serde_json::Value = response.json().await?;

        let text = data["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let prompt_tokens = data["prompt_eval_count"].as_u64().unwrap_or(0) as u32;
        let completion_tokens = data["eval_count"].as_u64().unwrap_or(0) as u32;

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
        // TODO: Implement streaming
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
        "Ollama"
    }
}
