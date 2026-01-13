// shared/src/types/adapter.rs

//! Adapter and adapter types - SSOT for inference sources
//!
//! AdapterKind: High-level category (Local, Web, Memory)
//! LlmProvider: Specific web API adapters (Anthropic, OpenAI, etc.)
//!
//! These are user-facing types. Orchestrator implements adapters internally.

use serde::{Deserialize, Serialize};

/// Adapter category - where inference happens
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AdapterKind {
    /// Local inference (Candle on your GPU/CPU)
    Local,

    /// Web APIs (use LlmProvider to specify which)
    Web,
}

impl AdapterKind {
    pub const fn name(&self) -> &'static str {
        match self {
            Self::Local => "local",
            Self::Web => "web",
        }
    }

    pub const fn description(&self) -> &'static str {
        match self {
            Self::Local => "Local inference (Candle)",
            Self::Web => "Remote API inference",
        }
    }
}

impl std::fmt::Display for AdapterKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name())
    }
}

/// LLM Provider - specific AI services (web-based)
///
/// Used with AdapterKind::Web to specify which provider.
/// Local inference uses AdapterKind::Local (no provider needed).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LlmProvider {
    /// Anthropic Claude API
    Anthropic,

    /// OpenAI API (GPT models)
    OpenAI,

    /// Local Ollama server (technically local but accessed via HTTP)
    Ollama,

    /// LM Studio API
    LMStudio,

    /// Groq API
    Groq,

    /// OpenRouter API (multi-adapter gateway)
    OpenRouter,

    /// DeepSeek API
    DeepSeek,

    /// Google Gemini API
    Google,
}

impl LlmProvider {
    pub const fn name(&self) -> &'static str {
        match self {
            Self::Anthropic => "anthropic",
            Self::OpenAI => "openai",
            Self::Ollama => "ollama",
            Self::LMStudio => "lmstudio",
            Self::Groq => "groq",
            Self::OpenRouter => "openrouter",
            Self::DeepSeek => "deepseek",
            Self::Google => "google",
        }
    }

    pub const fn display_name(&self) -> &'static str {
        match self {
            Self::Anthropic => "Claude",
            Self::OpenAI => "OpenAI",
            Self::Ollama => "Ollama",
            Self::LMStudio => "LM Studio",
            Self::Groq => "Groq",
            Self::OpenRouter => "OpenRouter",
            Self::DeepSeek => "DeepSeek",
            Self::Google => "Gemini",
        }
    }

    /// Whether this adapter requires an API key
    pub const fn requires_api_key(&self) -> bool {
        match self {
            Self::Ollama | Self::LMStudio => false,
            _ => true,
        }
    }

    /// Key name for SecureVault lookup
    pub const fn vault_key(&self) -> &'static str {
        self.name()
    }
}

impl std::fmt::Display for LlmProvider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name())
    }
}

impl std::str::FromStr for LlmProvider {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "anthropic" | "claude" => Ok(Self::Anthropic),
            "openai" | "gpt" => Ok(Self::OpenAI),
            "ollama" => Ok(Self::Ollama),
            "lmstudio" | "lm-studio" | "lm_studio" => Ok(Self::LMStudio),
            "groq" => Ok(Self::Groq),
            "openrouter" | "open-router" => Ok(Self::OpenRouter),
            "deepseek" | "deep-seek" => Ok(Self::DeepSeek),
            "google" | "gemini" => Ok(Self::Google),
            _ => Err(format!("Unknown adapter: {}", s)),
        }
    }
}

/// Adapter info for UI display
///
/// This is the user-facing adapter information.
/// Engine uses this to show available adapters to desktop.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdapterInfo {
    /// Adapter category
    pub kind: AdapterKind,

    /// Specific web adapter (None for Local/Memory)
    pub provider: Option<LlmProvider>,

    /// Display name
    pub name: String,

    /// Whether this adapter is currently available
    pub available: bool,

    /// Whether an API key is required
    pub requires_api_key: bool,
}

impl AdapterInfo {
    /// Create a local adapter entry
    pub fn local(name: impl Into<String>, available: bool) -> Self {
        Self {
            kind: AdapterKind::Local,
            provider: None,
            name: name.into(),
            available,
            requires_api_key: false,
        }
    }

    /// Create a web adapter entry
    pub fn web(adapter: LlmProvider, available: bool) -> Self {
        Self {
            kind: AdapterKind::Web,
            provider: Some(adapter),
            name: adapter.display_name().to_string(),
            available,
            requires_api_key: adapter.requires_api_key(),
        }
    }
}
