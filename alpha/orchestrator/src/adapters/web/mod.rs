// orchestrator/src/adapters/web/mod.rs

//! Web adapters - HTTP API clients
//!
//! These adapters connect to remote API services:
//! - Anthropic (Claude)
//! - OpenAI (GPT)
//! - Ollama (local server, but HTTP-based)
//! - LM Studio (local server, OpenAI-compatible)
//! - Groq, OpenRouter, DeepSeek, Google

mod anthropic;
mod manager;
mod ollama;
mod openai;

pub use anthropic::AnthropicAdapter;
pub use ollama::OllamaAdapter;
pub use openai::OpenAIAdapter;

// Provider management (SecureVault-integrated)
pub use manager::{
    // Types
    ChatMessage, ChatRequest, ChatResponse, ChatRole,
    // Trait
    LlmProviderAdapter,
    // Config & Manager
    ProviderConfig, ProviderManager,
    // Provider implementations
    AnthropicProvider, OpenAIProvider, OllamaProvider, LMStudioProvider,
};

use shared::{AdapterKind, LlmProvider};

/// Trait for web-based LLM adapters
///
/// WebAdapter = HOW we connect (implementation pattern)
/// LlmProvider = WHO we connect to (Anthropic, OpenAI, etc.)
pub trait WebAdapter {
    fn adapter_kind(&self) -> AdapterKind {
        AdapterKind::Web
    }

    /// Which LLM provider this adapter connects to
    fn provider(&self) -> LlmProvider;
}

/// Common configuration for web adapters
#[derive(Debug, Clone)]
pub struct WebAdapterConfig {
    /// API endpoint URL
    pub endpoint: String,
    /// API key (from SecureVault)
    pub api_key: Option<String>,
    /// Model ID to use
    pub model_id: String,
    /// Request timeout in seconds
    pub timeout_secs: u64,
}

impl WebAdapterConfig {
    /// Create config for Anthropic
    pub fn anthropic(api_key: &str, model: &str) -> Self {
        Self {
            endpoint: "https://api.anthropic.com/v1".to_string(),
            api_key: Some(api_key.to_string()),
            model_id: model.to_string(),
            timeout_secs: 120,
        }
    }

    /// Create config for OpenAI
    pub fn openai(api_key: &str, model: &str) -> Self {
        Self {
            endpoint: "https://api.openai.com/v1".to_string(),
            api_key: Some(api_key.to_string()),
            model_id: model.to_string(),
            timeout_secs: 120,
        }
    }

    /// Create config for Ollama (local server)
    pub fn ollama(model: &str) -> Self {
        Self {
            endpoint: "http://localhost:11434".to_string(),
            api_key: None,
            model_id: model.to_string(),
            timeout_secs: 300, // Local models can be slow
        }
    }

    /// Create config for LM Studio (OpenAI-compatible)
    pub fn lmstudio(model: &str) -> Self {
        Self {
            endpoint: "http://localhost:1234/v1".to_string(),
            api_key: None,
            model_id: model.to_string(),
            timeout_secs: 300,
        }
    }
}
