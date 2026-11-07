// orchestrator/src/adapters/web/provider.rs

//! Provider Provider - SecureVault-integrated provider management
//!
//! Manages LLM providers (Anthropic, OpenAI, Ollama, LMStudio).
//! Loads API keys from SecureVault with Zeroizing protection.
//!
//! ## Provider vs Adapter
//! - LlmProvider (shared): WHO we connect to (Anthropic, OpenAI, etc.)
//! - AdapterKind (shared): HOW we connect (Local, Web)
//! - ProviderManager: Manages available web providers

use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use shared::{LlmProvider, SecureVault, Zeroizing};
use std::sync::Arc;
use std::time::Duration;

// ============== Chat Types ==============

/// Chat message for provider API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: ChatRole,
    pub content: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChatRole {
    System,
    User,
    Assistant,
}

/// Chat completion request
#[derive(Debug, Clone)]
pub struct ChatRequest {
    pub messages: Vec<ChatMessage>,
    pub max_tokens: u32,
    pub temperature: f32,
    pub model: Option<String>,
    pub stream: bool,
}

impl Default for ChatRequest {
    fn default() -> Self {
        Self {
            messages: Vec::new(),
            max_tokens: 1024,
            temperature: 0.7,
            model: None,
            stream: false,
        }
    }
}

/// Chat completion response
#[derive(Debug, Clone, Serialize)]
pub struct ChatResponse {
    pub content: String,
    pub model: String,
    pub tokens_in: u32,
    pub tokens_out: u32,
    pub finish_reason: String,
    pub latency_ms: u64,
}

// ============== Provider Trait ==============

/// LLM Provider trait - unified interface for web providers
#[async_trait]
pub trait LlmProviderAdapter: Send + Sync {
    /// Get provider type
    fn provider(&self) -> LlmProvider;

    /// Get provider display name
    fn name(&self) -> &str;

    /// Check if provider is available/configured
    async fn is_available(&self) -> bool;

    /// Complete a chat request
    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse>;

    /// Get available models for this provider
    async fn list_models(&self) -> Result<Vec<String>>;
}

// ============== Provider Configuration ==============

/// Provider configuration loaded from vault
#[derive(Debug, Clone)]
pub struct ProviderConfig {
    pub provider: LlmProvider,
    pub api_key: Option<Zeroizing<String>>,
    pub base_url: Option<String>,
    pub default_model: Option<String>,
    pub timeout: Duration,
    pub max_retries: u32,
}

impl ProviderConfig {
    pub fn anthropic(api_key: Zeroizing<String>) -> Self {
        Self {
            provider: LlmProvider::Anthropic,
            api_key: Some(api_key),
            base_url: Some("https://api.anthropic.com".to_string()),
            default_model: Some("claude-sonnet-4-20250514".to_string()),
            timeout: Duration::from_secs(60),
            max_retries: 3,
        }
    }

    pub fn openai(api_key: Zeroizing<String>) -> Self {
        Self {
            provider: LlmProvider::OpenAI,
            api_key: Some(api_key),
            base_url: Some("https://api.openai.com/v1".to_string()),
            default_model: Some("gpt-4o".to_string()),
            timeout: Duration::from_secs(60),
            max_retries: 3,
        }
    }

    pub fn ollama(base_url: &str) -> Self {
        Self {
            provider: LlmProvider::Ollama,
            api_key: None,
            base_url: Some(base_url.to_string()),
            default_model: Some("llama3.2".to_string()),
            timeout: Duration::from_secs(120),
            max_retries: 1,
        }
    }

    pub fn lmstudio(base_url: &str) -> Self {
        Self {
            provider: LlmProvider::LMStudio,
            api_key: None,
            base_url: Some(base_url.to_string()),
            default_model: None,
            timeout: Duration::from_secs(120),
            max_retries: 1,
        }
    }
}

// ============== Provider Provider ==============

/// Provider provider - handles provider selection and routing
///
/// Active provider = None means use local inference (LlmBackend)
/// Active provider = Some(provider) means use web API
pub struct ProviderProvider {
    vault: Arc<SecureVault>,
    active_provider: tokio::sync::RwLock<Option<LlmProvider>>,
    providers: tokio::sync::RwLock<Vec<Arc<dyn LlmProviderAdapter>>>,
    http_client: reqwest::Client,
}

impl ProviderProvider {
    pub fn new(vault: Arc<SecureVault>) -> Self {
        let http_client = reqwest::Client::builder()
            .timeout(Duration::from_secs(60))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            vault,
            active_provider: tokio::sync::RwLock::new(None), // Default: local
            providers: tokio::sync::RwLock::new(Vec::new()),
            http_client,
        }
    }

    /// Initialize providers from vault configuration
    pub async fn initialize(&self) -> Result<()> {
        let mut providers = self.providers.write().await;
        providers.clear();

        // Anthropic
        if let Ok(key) = self.vault.get_key(LlmProvider::Anthropic.vault_key()) {
            let config = ProviderConfig::anthropic(key);
            let provider = AnthropicProvider::new(config, self.http_client.clone());
            providers.push(Arc::new(provider));
            tracing::info!("Anthropic provider initialized");
        }

        // OpenAI
        if let Ok(key) = self.vault.get_key(LlmProvider::OpenAI.vault_key()) {
            let config = ProviderConfig::openai(key);
            let provider = OpenAIProvider::new(config, self.http_client.clone());
            providers.push(Arc::new(provider));
            tracing::info!("OpenAI provider initialized");
        }

        // Ollama (check if running)
        let ollama_url = std::env::var("OLLAMA_HOST")
            .unwrap_or_else(|_| "http://localhost:11434".to_string());
        let ollama_config = ProviderConfig::ollama(&ollama_url);
        let ollama_provider = OllamaProvider::new(ollama_config, self.http_client.clone());
        if ollama_provider.is_available().await {
            providers.push(Arc::new(ollama_provider));
            tracing::info!("Ollama provider initialized");
        }

        // LMStudio (check if running)
        let lmstudio_url = std::env::var("LMSTUDIO_HOST")
            .unwrap_or_else(|_| "http://localhost:1234".to_string());
        let lmstudio_config = ProviderConfig::lmstudio(&lmstudio_url);
        let lmstudio_provider = LMStudioProvider::new(lmstudio_config, self.http_client.clone());
        if lmstudio_provider.is_available().await {
            providers.push(Arc::new(lmstudio_provider));
            tracing::info!("LMStudio provider initialized");
        }

        Ok(())
    }

    /// Set active provider (None = local inference)
    pub async fn set_active(&self, provider: Option<LlmProvider>) -> Result<()> {
        if let Some(p) = provider {
            let providers = self.providers.read().await;
            if !providers.iter().any(|x| x.provider() == p) {
                anyhow::bail!("Provider {:?} not available", p);
            }
        }
        *self.active_provider.write().await = provider;
        tracing::info!(provider = ?provider, "Active provider changed");
        Ok(())
    }

    /// Get active provider (None = local)
    pub async fn active(&self) -> Option<LlmProvider> {
        *self.active_provider.read().await
    }

    /// Check if using local inference
    pub async fn is_local(&self) -> bool {
        self.active_provider.read().await.is_none()
    }

    /// Get provider by type
    pub async fn get(&self, provider: LlmProvider) -> Option<Arc<dyn LlmProviderAdapter>> {
        let providers = self.providers.read().await;
        providers.iter().find(|p| p.provider() == provider).cloned()
    }

    /// List available providers
    pub async fn list_available(&self) -> Vec<LlmProvider> {
        let providers = self.providers.read().await;
        providers.iter().map(|p| p.provider()).collect()
    }

    /// Chat with active provider
    /// Returns Err if local is active (use LlmBackend instead)
    pub async fn chat(&self, request: ChatRequest) -> Result<ChatResponse> {
        let active = self.active().await
            .ok_or_else(|| anyhow::anyhow!("Local inference active - use LlmBackend"))?;

        let provider = self.get(active).await
            .ok_or_else(|| anyhow::anyhow!("Provider {:?} not available", active))?;

        provider.chat(request).await
    }
}

// ============== Provider Implementations ==============

/// Anthropic Claude provider
pub struct AnthropicProvider {
    config: ProviderConfig,
    client: reqwest::Client,
}

impl AnthropicProvider {
    pub fn new(config: ProviderConfig, client: reqwest::Client) -> Self {
        Self { config, client }
    }
}

#[async_trait]
impl LlmProviderAdapter for AnthropicProvider {
    fn provider(&self) -> LlmProvider {
        LlmProvider::Anthropic
    }

    fn name(&self) -> &str {
        "Anthropic Claude"
    }

    async fn is_available(&self) -> bool {
        self.config.api_key.is_some()
    }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse> {
        let api_key = self.config.api_key.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Anthropic API key not configured"))?;

        let model = request.model
            .or_else(|| self.config.default_model.clone())
            .unwrap_or_else(|| "claude-sonnet-4-20250514".to_string());

        // Build Anthropic API request
        let messages: Vec<serde_json::Value> = request.messages.iter()
            .filter(|m| m.role != ChatRole::System)
            .map(|m| serde_json::json!({
                "role": match m.role {
                    ChatRole::User => "user",
                    ChatRole::Assistant => "assistant",
                    ChatRole::System => "user", // filtered above
                },
                "content": m.content
            }))
            .collect();

        let system = request.messages.iter()
            .find(|m| m.role == ChatRole::System)
            .map(|m| m.content.clone());

        let mut body = serde_json::json!({
            "model": model,
            "max_tokens": request.max_tokens,
            "messages": messages,
        });

        if let Some(sys) = system {
            body["system"] = serde_json::Value::String(sys);
        }

        let start = std::time::Instant::now();

        let response = self.client
            .post(format!("{}/v1/messages", self.config.base_url.as_deref().unwrap_or("https://api.anthropic.com")))
            .header("x-api-key", api_key.as_str())
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&body)
            .timeout(self.config.timeout)
            .send()
            .await?;

        let latency_ms = start.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Anthropic API error: {}", error_text);
        }

        let data: serde_json::Value = response.json().await?;

        let content = data["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let tokens_in = data["usage"]["input_tokens"].as_u64().unwrap_or(0) as u32;
        let tokens_out = data["usage"]["output_tokens"].as_u64().unwrap_or(0) as u32;
        let finish_reason = data["stop_reason"].as_str().unwrap_or("unknown").to_string();

        Ok(ChatResponse {
            content,
            model,
            tokens_in,
            tokens_out,
            finish_reason,
            latency_ms,
        })
    }

    async fn list_models(&self) -> Result<Vec<String>> {
        Ok(vec![
            "claude-sonnet-4-20250514".to_string(),
            "claude-opus-4-20250514".to_string(),
            "claude-3-5-haiku-20241022".to_string(),
        ])
    }
}

/// OpenAI provider
pub struct OpenAIProvider {
    config: ProviderConfig,
    client: reqwest::Client,
}

impl OpenAIProvider {
    pub fn new(config: ProviderConfig, client: reqwest::Client) -> Self {
        Self { config, client }
    }
}

#[async_trait]
impl LlmProviderAdapter for OpenAIProvider {
    fn provider(&self) -> LlmProvider {
        LlmProvider::OpenAI
    }

    fn name(&self) -> &str {
        "OpenAI"
    }

    async fn is_available(&self) -> bool {
        self.config.api_key.is_some()
    }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse> {
        let api_key = self.config.api_key.as_ref()
            .ok_or_else(|| anyhow::anyhow!("OpenAI API key not configured"))?;

        let model = request.model
            .or_else(|| self.config.default_model.clone())
            .unwrap_or_else(|| "gpt-4o".to_string());

        let messages: Vec<serde_json::Value> = request.messages.iter()
            .map(|m| serde_json::json!({
                "role": match m.role {
                    ChatRole::System => "system",
                    ChatRole::User => "user",
                    ChatRole::Assistant => "assistant",
                },
                "content": m.content
            }))
            .collect();

        let body = serde_json::json!({
            "model": model,
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "messages": messages,
        });

        let start = std::time::Instant::now();

        let response = self.client
            .post(format!("{}/chat/completions", self.config.base_url.as_deref().unwrap_or("https://api.openai.com/v1")))
            .header("Authorization", format!("Bearer {}", api_key.as_str()))
            .header("content-type", "application/json")
            .json(&body)
            .timeout(self.config.timeout)
            .send()
            .await?;

        let latency_ms = start.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("OpenAI API error: {}", error_text);
        }

        let data: serde_json::Value = response.json().await?;

        let content = data["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let tokens_in = data["usage"]["prompt_tokens"].as_u64().unwrap_or(0) as u32;
        let tokens_out = data["usage"]["completion_tokens"].as_u64().unwrap_or(0) as u32;
        let finish_reason = data["choices"][0]["finish_reason"]
            .as_str()
            .unwrap_or("unknown")
            .to_string();

        Ok(ChatResponse {
            content,
            model,
            tokens_in,
            tokens_out,
            finish_reason,
            latency_ms,
        })
    }

    async fn list_models(&self) -> Result<Vec<String>> {
        Ok(vec![
            "gpt-4o".to_string(),
            "gpt-4o-mini".to_string(),
            "gpt-4-turbo".to_string(),
            "o1-preview".to_string(),
        ])
    }
}

/// Ollama local server provider
pub struct OllamaProvider {
    config: ProviderConfig,
    client: reqwest::Client,
}

impl OllamaProvider {
    pub fn new(config: ProviderConfig, client: reqwest::Client) -> Self {
        Self { config, client }
    }
}

#[async_trait]
impl LlmProviderAdapter for OllamaProvider {
    fn provider(&self) -> LlmProvider {
        LlmProvider::Ollama
    }

    fn name(&self) -> &str {
        "Ollama"
    }

    async fn is_available(&self) -> bool {
        let url = self.config.base_url.as_deref().unwrap_or("http://localhost:11434");
        self.client.get(format!("{}/api/version", url))
            .timeout(Duration::from_secs(2))
            .send()
            .await
            .is_ok()
    }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse> {
        let url = self.config.base_url.as_deref().unwrap_or("http://localhost:11434");

        let model = request.model
            .or_else(|| self.config.default_model.clone())
            .unwrap_or_else(|| "llama3.2".to_string());

        let messages: Vec<serde_json::Value> = request.messages.iter()
            .map(|m| serde_json::json!({
                "role": match m.role {
                    ChatRole::System => "system",
                    ChatRole::User => "user",
                    ChatRole::Assistant => "assistant",
                },
                "content": m.content
            }))
            .collect();

        let body = serde_json::json!({
            "model": model,
            "messages": messages,
            "stream": false,
            "options": {
                "num_predict": request.max_tokens,
                "temperature": request.temperature,
            }
        });

        let start = std::time::Instant::now();

        let response = self.client
            .post(format!("{}/api/chat", url))
            .json(&body)
            .timeout(self.config.timeout)
            .send()
            .await?;

        let latency_ms = start.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Ollama API error: {}", error_text);
        }

        let data: serde_json::Value = response.json().await?;

        let content = data["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let tokens_in = data["prompt_eval_count"].as_u64().unwrap_or(0) as u32;
        let tokens_out = data["eval_count"].as_u64().unwrap_or(0) as u32;

        Ok(ChatResponse {
            content,
            model,
            tokens_in,
            tokens_out,
            finish_reason: "stop".to_string(),
            latency_ms,
        })
    }

    async fn list_models(&self) -> Result<Vec<String>> {
        let url = self.config.base_url.as_deref().unwrap_or("http://localhost:11434");

        let response = self.client
            .get(format!("{}/api/tags", url))
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

/// LMStudio provider (OpenAI-compatible API)
pub struct LMStudioProvider {
    config: ProviderConfig,
    client: reqwest::Client,
}

impl LMStudioProvider {
    pub fn new(config: ProviderConfig, client: reqwest::Client) -> Self {
        Self { config, client }
    }
}

#[async_trait]
impl LlmProviderAdapter for LMStudioProvider {
    fn provider(&self) -> LlmProvider {
        LlmProvider::LMStudio
    }

    fn name(&self) -> &str {
        "LM Studio"
    }

    async fn is_available(&self) -> bool {
        let url = self.config.base_url.as_deref().unwrap_or("http://localhost:1234");
        self.client.get(format!("{}/v1/models", url))
            .timeout(Duration::from_secs(2))
            .send()
            .await
            .is_ok()
    }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse> {
        let url = self.config.base_url.as_deref().unwrap_or("http://localhost:1234");

        let messages: Vec<serde_json::Value> = request.messages.iter()
            .map(|m| serde_json::json!({
                "role": match m.role {
                    ChatRole::System => "system",
                    ChatRole::User => "user",
                    ChatRole::Assistant => "assistant",
                },
                "content": m.content
            }))
            .collect();

        let mut body = serde_json::json!({
            "messages": messages,
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
        });

        if let Some(model) = &request.model {
            body["model"] = serde_json::Value::String(model.clone());
        }

        let start = std::time::Instant::now();

        let response = self.client
            .post(format!("{}/v1/chat/completions", url))
            .json(&body)
            .timeout(self.config.timeout)
            .send()
            .await?;

        let latency_ms = start.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("LMStudio API error: {}", error_text);
        }

        let data: serde_json::Value = response.json().await?;

        let content = data["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let model = data["model"]
            .as_str()
            .unwrap_or("unknown")
            .to_string();

        let tokens_in = data["usage"]["prompt_tokens"].as_u64().unwrap_or(0) as u32;
        let tokens_out = data["usage"]["completion_tokens"].as_u64().unwrap_or(0) as u32;

        Ok(ChatResponse {
            content,
            model,
            tokens_in,
            tokens_out,
            finish_reason: "stop".to_string(),
            latency_ms,
        })
    }

    async fn list_models(&self) -> Result<Vec<String>> {
        let url = self.config.base_url.as_deref().unwrap_or("http://localhost:1234");

        let response = self.client
            .get(format!("{}/v1/models", url))
            .timeout(Duration::from_secs(5))
            .send()
            .await?;

        if !response.status().is_success() {
            return Ok(Vec::new());
        }

        let data: serde_json::Value = response.json().await?;

        let models = data["data"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|m| m["id"].as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default();

        Ok(models)
    }
}
