// orchestrator/src/infra/catalog/adapter.rs

//! Model Catalog Adapters - SSOT-aligned model source management
//!
//! Uses shared::AdapterKind and shared::LlmProvider exclusively.
//! No duplicate type definitions - all types flow from shared crate.
//!
//! Adapter types:
//! - Local (AdapterKind::Local): Scan folder for GGUF files, load with Candle
//! - Web (AdapterKind::Web + LlmProvider): Connect to API servers
//!
//! The adapter system lets you:
//! 1. Point at ANY source (folder, server, API)
//! 2. Discover available models
//! 3. Load and use them for inference

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use shared::{AdapterKind, LlmProvider};
use std::path::PathBuf;
use tokio::sync::RwLock;
use tracing::{info, warn};

use super::discovery::{discover_models, DiscoveredModel};

/// Adapter configuration
///
/// Uses SSOT types from shared crate.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdapterConfig {
    /// Adapter type (Local or Web)
    pub kind: AdapterKind,
    /// LLM provider (for Web adapters)
    pub provider: Option<LlmProvider>,
    /// For Local: folder path
    /// For Web: endpoint URL
    pub source: String,
    /// API key (for web providers that require it)
    pub api_key: Option<String>,
    /// Display name
    pub name: String,
    /// Is this a stub/test adapter?
    #[serde(default)]
    pub is_stub: bool,
}

impl AdapterConfig {
    /// Create local adapter config
    pub fn local(path: &str) -> Self {
        Self {
            kind: AdapterKind::Local,
            provider: None,
            source: path.to_string(),
            api_key: None,
            name: "Local Models".to_string(),
            is_stub: false,
        }
    }

    /// Create Ollama adapter config
    pub fn ollama(url: &str) -> Self {
        Self {
            kind: AdapterKind::Web,
            provider: Some(LlmProvider::Ollama),
            source: url.to_string(),
            api_key: None,
            name: "Ollama".to_string(),
            is_stub: false,
        }
    }

    /// Create LM Studio adapter config
    pub fn lmstudio(url: &str) -> Self {
        Self {
            kind: AdapterKind::Web,
            provider: Some(LlmProvider::LMStudio),
            source: url.to_string(),
            api_key: None,
            name: "LM Studio".to_string(),
            is_stub: false,
        }
    }

    /// Create OpenAI adapter config
    pub fn openai(api_key: &str) -> Self {
        Self {
            kind: AdapterKind::Web,
            provider: Some(LlmProvider::OpenAI),
            source: "https://api.openai.com/v1".to_string(),
            api_key: Some(api_key.to_string()),
            name: "OpenAI".to_string(),
            is_stub: false,
        }
    }

    /// Create stub adapter (for testing)
    pub fn stub() -> Self {
        Self {
            kind: AdapterKind::Local,
            provider: None,
            source: String::new(),
            api_key: None,
            name: "Stub (Testing)".to_string(),
            is_stub: true,
        }
    }

    /// Create web adapter from provider
    pub fn web(provider: LlmProvider, source: &str, api_key: Option<&str>) -> Self {
        Self {
            kind: AdapterKind::Web,
            provider: Some(provider),
            source: source.to_string(),
            api_key: api_key.map(String::from),
            name: provider.display_name().to_string(),
            is_stub: false,
        }
    }
}

/// Model info exposed to UI
///
/// Uses SSOT types from shared crate.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    /// Unique ID
    pub id: String,
    /// Display name
    pub name: String,
    /// Adapter type (Local or Web)
    pub kind: AdapterKind,
    /// LLM provider (for Web adapters)
    pub provider: Option<LlmProvider>,
    /// Source (path or URL)
    pub source: String,
    /// File path (for local models)
    pub path: Option<PathBuf>,
    /// mmproj path (for VL models)
    pub mmproj_path: Option<PathBuf>,
    /// Parameter count (billions)
    pub params_b: Option<f32>,
    /// Quantization level
    pub quantization: Option<String>,
    /// Model family
    pub family: Option<String>,
    /// Is VL model?
    pub is_vl: bool,
    /// Estimated VRAM (GB)
    pub vram_gb: f32,
    /// File size human readable
    pub size_human: String,
    /// Is this model currently available/loaded?
    pub available: bool,
}

impl From<DiscoveredModel> for ModelInfo {
    fn from(m: DiscoveredModel) -> Self {
        let size_human = m.size_human();
        let source = m
            .path
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        Self {
            id: m.id,
            name: m.name,
            kind: AdapterKind::Local,
            provider: None,
            source,
            path: Some(m.path),
            mmproj_path: m.mmproj_path,
            params_b: m.params_b,
            quantization: m.quantization,
            family: m.family,
            is_vl: m.is_vl,
            vram_gb: m.vram_estimate_gb,
            size_human,
            available: true,
        }
    }
}

/// Adapter manager - handles multiple adapters
pub struct AdapterManager {
    /// Configured adapters
    adapters: RwLock<Vec<AdapterConfig>>,
    /// Active adapter index
    active_adapter: RwLock<usize>,
    /// Cached discovered models
    cached_models: RwLock<Vec<ModelInfo>>,
    /// Selected model ID
    selected_model: RwLock<Option<String>>,
}

impl AdapterManager {
    /// Create new adapter manager
    pub fn new() -> Self {
        Self {
            adapters: RwLock::new(vec![AdapterConfig::stub()]),
            active_adapter: RwLock::new(0),
            cached_models: RwLock::new(Vec::new()),
            selected_model: RwLock::new(None),
        }
    }

    /// Create with initial local adapter
    pub fn with_local(_path: &str) -> Self {
        let manager = Self::new();
        // Path will be set asynchronously via set_local_path()
        manager
    }

    /// Add an adapter
    pub async fn add_adapter(&self, config: AdapterConfig) -> Result<()> {
        let mut adapters = self.adapters.write().await;
        adapters.push(config);
        Ok(())
    }

    /// Set local adapter path (convenience method)
    pub async fn set_local_path(&self, path: &str) -> Result<()> {
        let mut adapters = self.adapters.write().await;

        // Find existing local adapter or add one
        let local_idx = adapters
            .iter()
            .position(|p| p.kind == AdapterKind::Local && !p.is_stub);

        let config = AdapterConfig::local(path);

        if let Some(idx) = local_idx {
            adapters[idx] = config;
        } else {
            adapters.push(config);
        }

        // Set as active
        let local_idx = adapters
            .iter()
            .position(|p| p.kind == AdapterKind::Local && !p.is_stub)
            .unwrap_or(0);
        drop(adapters);

        *self.active_adapter.write().await = local_idx;

        // Refresh models
        self.refresh_models().await?;

        Ok(())
    }

    /// Get active adapter config
    pub async fn active_config(&self) -> Option<AdapterConfig> {
        let adapters = self.adapters.read().await;
        let idx = *self.active_adapter.read().await;
        adapters.get(idx).cloned()
    }

    /// Set active adapter by kind and optional provider
    pub async fn set_active(&self, kind: AdapterKind, provider: Option<LlmProvider>) -> Result<()> {
        let adapters = self.adapters.read().await;
        let idx = adapters
            .iter()
            .position(|p| p.kind == kind && p.provider == provider)
            .ok_or_else(|| anyhow!("Adapter not found: {:?} / {:?}", kind, provider))?;
        drop(adapters);

        *self.active_adapter.write().await = idx;
        self.refresh_models().await?;
        Ok(())
    }

    /// Set active adapter by kind only (finds first match)
    pub async fn set_active_by_kind(&self, kind: AdapterKind) -> Result<()> {
        let adapters = self.adapters.read().await;
        let idx = adapters
            .iter()
            .position(|p| p.kind == kind && !p.is_stub)
            .ok_or_else(|| anyhow!("Adapter not found: {:?}", kind))?;
        drop(adapters);

        *self.active_adapter.write().await = idx;
        self.refresh_models().await?;
        Ok(())
    }

    /// Refresh/discover models from active adapter
    pub async fn refresh_models(&self) -> Result<Vec<ModelInfo>> {
        let config = self
            .active_config()
            .await
            .ok_or_else(|| anyhow!("No active adapter"))?;

        let models = if config.is_stub {
            self.stub_models()
        } else {
            match config.kind {
                AdapterKind::Local => self.discover_local(&config.source).await?,
                AdapterKind::Web => {
                    if let Some(provider) = config.provider {
                        self.discover_web(provider, &config.source).await?
                    } else {
                        Vec::new()
                    }
                }
            }
        };

        // Cache results
        *self.cached_models.write().await = models.clone();

        info!(
            kind = %config.kind,
            provider = ?config.provider,
            count = models.len(),
            "Discovered models"
        );

        Ok(models)
    }

    /// Get cached models (fast, no I/O)
    pub async fn models(&self) -> Vec<ModelInfo> {
        self.cached_models.read().await.clone()
    }

    /// Get VL models only
    pub async fn vl_models(&self) -> Vec<ModelInfo> {
        self.cached_models
            .read()
            .await
            .iter()
            .filter(|m| m.is_vl)
            .cloned()
            .collect()
    }

    /// Get text models only
    pub async fn text_models(&self) -> Vec<ModelInfo> {
        self.cached_models
            .read()
            .await
            .iter()
            .filter(|m| !m.is_vl)
            .cloned()
            .collect()
    }

    /// Select a model by ID
    pub async fn select_model(&self, id: &str) -> Result<ModelInfo> {
        let models = self.cached_models.read().await;
        let model = models
            .iter()
            .find(|m| m.id == id)
            .ok_or_else(|| anyhow!("Model not found: {}", id))?
            .clone();
        drop(models);

        *self.selected_model.write().await = Some(id.to_string());
        info!(id = %id, name = %model.name, "Selected model");

        Ok(model)
    }

    /// Get selected model
    pub async fn selected_model(&self) -> Option<ModelInfo> {
        let selected_id = self.selected_model.read().await.clone()?;
        let models = self.cached_models.read().await;
        models.iter().find(|m| m.id == selected_id).cloned()
    }

    /// Get model by ID
    pub async fn get_model(&self, id: &str) -> Option<ModelInfo> {
        let models = self.cached_models.read().await;
        models.iter().find(|m| m.id == id).cloned()
    }

    // ==================== Adapter-specific discovery ====================

    /// Discover models from local folder
    async fn discover_local(&self, path: &str) -> Result<Vec<ModelInfo>> {
        let path = PathBuf::from(path);

        if !path.exists() {
            return Err(anyhow!("Path does not exist: {:?}", path));
        }

        let result = discover_models(&path)?;

        let models: Vec<ModelInfo> = result.models.into_iter().map(ModelInfo::from).collect();

        Ok(models)
    }

    /// Discover models from web provider
    async fn discover_web(&self, provider: LlmProvider, url: &str) -> Result<Vec<ModelInfo>> {
        match provider {
            LlmProvider::Ollama => self.discover_ollama(url).await,
            LlmProvider::LMStudio => self.discover_lmstudio(url).await,
            _ => {
                // Most web providers don't have discovery - they have fixed model lists
                warn!(
                    provider = %provider,
                    "Web provider discovery not implemented, returning empty"
                );
                Ok(Vec::new())
            }
        }
    }

    /// Discover models from Ollama server
    async fn discover_ollama(&self, _url: &str) -> Result<Vec<ModelInfo>> {
        // TODO: Implement Ollama API call
        // GET http://{url}/api/tags
        warn!("Ollama discovery not yet implemented");
        Ok(Vec::new())
    }

    /// Discover models from LM Studio
    async fn discover_lmstudio(&self, _url: &str) -> Result<Vec<ModelInfo>> {
        // TODO: Implement LM Studio API call
        // GET http://{url}/v1/models
        warn!("LM Studio discovery not yet implemented");
        Ok(Vec::new())
    }

    /// Generate stub models for testing
    fn stub_models(&self) -> Vec<ModelInfo> {
        vec![ModelInfo {
            id: "stub-model".to_string(),
            name: "Stub Model (Testing)".to_string(),
            kind: AdapterKind::Local,
            provider: None,
            source: String::new(),
            path: None,
            mmproj_path: None,
            params_b: Some(0.0),
            quantization: None,
            family: Some("stub".to_string()),
            is_vl: false,
            vram_gb: 0.0,
            size_human: "0 MB".to_string(),
            available: true,
        }]
    }

    /// List all configured adapters
    pub async fn list_adapters(&self) -> Vec<AdapterConfig> {
        self.adapters.read().await.clone()
    }

    /// Check if any models are available
    pub async fn has_models(&self) -> bool {
        !self.cached_models.read().await.is_empty()
    }
}

impl Default for AdapterManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_stub_adapter() {
        let manager = AdapterManager::new();
        let models = manager.refresh_models().await.unwrap();
        assert_eq!(models.len(), 1);
        assert_eq!(models[0].id, "stub-model");
    }

    #[tokio::test]
    async fn test_set_local_path() {
        let manager = AdapterManager::new();
        // This will fail if path doesn't exist, which is fine for test
        let result = manager.set_local_path("C:\\nonexistent").await;
        assert!(result.is_err());
    }

    #[test]
    fn test_adapter_config_constructors() {
        let local = AdapterConfig::local("/models");
        assert_eq!(local.kind, AdapterKind::Local);
        assert!(local.provider.is_none());
        assert!(!local.is_stub);

        let ollama = AdapterConfig::ollama("http://localhost:11434");
        assert_eq!(ollama.kind, AdapterKind::Web);
        assert_eq!(ollama.provider, Some(LlmProvider::Ollama));

        let stub = AdapterConfig::stub();
        assert!(stub.is_stub);
    }
}
