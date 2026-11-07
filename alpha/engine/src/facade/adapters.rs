// engine/src/facade/adapters.rs

//! Adapter facade - manage LLM adapters
//!
//! Lists available adapters and switches between them.
//! Integrates with SecureVault for API key management.
//! Works even without AI ready (shows available options).
//!
//! Uses shared types (SSOT):
//! - AdapterKind: Local | Web | Memory
//! - LlmProvider: Anthropic, OpenAI, Ollama, etc.
//! - AdapterInfo: User-facing adapter information

use crate::error::EngineError;
use shared::{AdapterKind, AdapterInfo, SecureVault, LlmProvider};
use std::sync::{Arc, RwLock};
use tracing::instrument;

/// Active adapter state
///
/// Tracks what type of inference is currently active.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ActiveAdapter {
    /// Local inference (Candle)
    Local,
    /// Web adapter (API-based)
    Web(LlmProvider),
}

impl Default for ActiveAdapter {
    fn default() -> Self {
        Self::Local
    }
}

impl std::fmt::Display for ActiveAdapter {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Local => write!(f, "local"),
            Self::Web(adapter) => write!(f, "{}", adapter),
        }
    }
}

impl ActiveAdapter {
    /// Get the adapter kind
    pub fn adapter_kind(&self) -> AdapterKind {
        match self {
            Self::Local => AdapterKind::Local,
            Self::Web(_) => AdapterKind::Web,
        }
    }

    /// Get the web adapter (if applicable)
    pub fn provider(&self) -> Option<LlmProvider> {
        match self {
            Self::Local => None,
            Self::Web(p) => Some(*p),
        }
    }
}

/// Adapter facade
pub struct AdapterFacade {
    active: RwLock<ActiveAdapter>,
    vault: Arc<SecureVault>,
}

impl AdapterFacade {
    /// Create new adapter facade
    pub fn new() -> Self {
        Self {
            active: RwLock::new(ActiveAdapter::Local),
            vault: Arc::new(SecureVault::new()),
        }
    }

    /// Create with shared vault
    pub fn with_vault(vault: Arc<SecureVault>) -> Self {
        Self {
            active: RwLock::new(ActiveAdapter::Local),
            vault,
        }
    }

    /// List all available adapters with actual vault status
    #[instrument(skip(self))]
    pub fn list(&self) -> Vec<AdapterInfo> {
        let mut adapters = vec![
            // Local adapter (always available)
            AdapterInfo::local("Local (Qwen3-VL-4B)", true),
        ];

        // Web adapters
        for wp in [
            LlmProvider::Anthropic,
            LlmProvider::OpenAI,
            LlmProvider::Ollama,
            LlmProvider::LMStudio,
            LlmProvider::Groq,
            LlmProvider::OpenRouter,
            LlmProvider::DeepSeek,
            LlmProvider::Google,
        ] {
            let available = if wp.requires_api_key() {
                self.vault.has_key(wp.vault_key())
            } else {
                true // Ollama/LMStudio don't need API keys
            };
            adapters.push(AdapterInfo::web(wp, available));
        }

        adapters
    }

    /// Check if a adapter has an API key configured
    pub fn has_api_key(&self, adapter: &str) -> bool {
        self.vault.has_key(adapter)
    }

    /// Get active adapter
    pub fn active(&self) -> ActiveAdapter {
        self.active.read().unwrap().clone()
    }

    /// Set active adapter to local
    #[instrument(skip(self))]
    pub fn set_local(&self) -> Result<(), EngineError> {
        let mut active = self.active.write().unwrap();
        *active = ActiveAdapter::Local;
        tracing::info!("Adapter switched to: local");
        Ok(())
    }

    /// Set active adapter to a web adapter
    #[instrument(skip(self))]
    pub fn set_web(&self, adapter: LlmProvider) -> Result<(), EngineError> {
        let mut active = self.active.write().unwrap();
        *active = ActiveAdapter::Web(adapter);
        tracing::info!("Adapter switched to: {}", adapter);
        Ok(())
    }

    /// Set active adapter by string
    pub fn set_active_str(&self, kind: &str) -> Result<(), EngineError> {
        match kind.to_lowercase().as_str() {
            "local" => self.set_local(),
            s => {
                // Try to parse as LlmProvider
                let adapter: LlmProvider = s
                    .parse()
                    .map_err(|_| EngineError::AdapterNotAvailable(kind.to_string()))?;
                self.set_web(adapter)
            }
        }
    }

    /// Get the vault reference
    pub fn vault(&self) -> &SecureVault {
        &self.vault
    }
}

impl Default for AdapterFacade {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_adapters() {
        let facade = AdapterFacade::new();
        let adapters = facade.list();
        // Should have all 9 adapters (1 local + 8 web)
        assert!(adapters.len() >= 9);
        // Local should be first and ready
        assert_eq!(adapters[0].kind, AdapterKind::Local);
        assert!(adapters[0].available);
    }

    #[test]
    fn test_set_adapter() {
        let facade = AdapterFacade::new();
        facade.set_web(LlmProvider::Ollama).unwrap();
        assert_eq!(facade.active(), ActiveAdapter::Web(LlmProvider::Ollama));
    }

    #[test]
    fn test_set_adapter_by_string() {
        let facade = AdapterFacade::new();
        facade.set_active_str("anthropic").unwrap();
        assert_eq!(facade.active(), ActiveAdapter::Web(LlmProvider::Anthropic));

        facade.set_active_str("ollama").unwrap();
        assert_eq!(facade.active(), ActiveAdapter::Web(LlmProvider::Ollama));

        facade.set_active_str("lmstudio").unwrap();
        assert_eq!(facade.active(), ActiveAdapter::Web(LlmProvider::LMStudio));
    }

    #[test]
    fn test_default_adapter() {
        let facade = AdapterFacade::new();
        assert_eq!(facade.active(), ActiveAdapter::Local);
    }
}
