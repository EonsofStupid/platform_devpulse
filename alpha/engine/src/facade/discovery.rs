// engine/src/facade/discovery.rs

//! Discovery Facade - Adapter-based model discovery
//!
//! Exposes the adapter system to the frontend.
//! Scan ANY folder, discover models, select and load them.

use crate::error::EngineError;
use orchestrator::infra::catalog::discovery::{discover_models, DiscoveredModel};
use orchestrator::infra::catalog::adapter::{ModelInfo, AdapterConfig, AdapterKind, AdapterManager};
use std::path::Path;
use std::sync::Arc;
use tracing::instrument;

/// Discovery facade - adapter-based model management
pub struct DiscoveryFacade {
    adapter: Arc<AdapterManager>,
}

impl DiscoveryFacade {
    /// Create new discovery facade
    pub fn new() -> Self {
        Self {
            adapter: Arc::new(AdapterManager::new()),
        }
    }

    /// Create with initial local path
    pub fn with_local_path(_path: &str) -> Self {
        let facade = Self::new();
        // Path will be set asynchronously
        facade
    }

    /// Get adapter manager reference
    pub fn adapter(&self) -> &Arc<AdapterManager> {
        &self.adapter
    }

    // ==================== Path Management ====================

    /// Set model directory path
    #[instrument(skip(self))]
    pub async fn set_model_path(&self, path: &str) -> Result<(), EngineError> {
        self.adapter
            .set_local_path(path)
            .await
            .map_err(|e| EngineError::Orchestrator(e.to_string()))
    }

    /// Scan a directory for models (one-off, doesn't save path)
    #[instrument(skip(self))]
    pub fn scan_directory(&self, path: &str) -> Result<Vec<DiscoveredModel>, EngineError> {
        let path = Path::new(path);
        let result = discover_models(path)
            .map_err(|e| EngineError::Orchestrator(e.to_string()))?;
        Ok(result.models)
    }

    /// Check if path has models
    pub fn path_has_models(&self, path: &str) -> bool {
        orchestrator::infra::catalog::discovery::has_models(Path::new(path))
    }

    // ==================== Model Discovery ====================

    /// Refresh models from active adapter
    #[instrument(skip(self))]
    pub async fn refresh_models(&self) -> Result<Vec<ModelInfo>, EngineError> {
        self.adapter
            .refresh_models()
            .await
            .map_err(|e| EngineError::Orchestrator(e.to_string()))
    }

    /// Get all discovered models (cached, fast)
    pub async fn models(&self) -> Vec<ModelInfo> {
        self.adapter.models().await
    }

    /// Get VL models only
    pub async fn vl_models(&self) -> Vec<ModelInfo> {
        self.adapter.vl_models().await
    }

    /// Get text models only
    pub async fn text_models(&self) -> Vec<ModelInfo> {
        self.adapter.text_models().await
    }

    // ==================== Model Selection ====================

    /// Select a model for use
    #[instrument(skip(self))]
    pub async fn select_model(&self, id: &str) -> Result<ModelInfo, EngineError> {
        self.adapter
            .select_model(id)
            .await
            .map_err(|e| EngineError::NotFound(e.to_string()))
    }

    /// Get currently selected model
    pub async fn selected_model(&self) -> Option<ModelInfo> {
        self.adapter.selected_model().await
    }

    /// Get model by ID
    pub async fn get_model(&self, id: &str) -> Option<ModelInfo> {
        self.adapter.get_model(id).await
    }

    // ==================== Adapter Management ====================

    /// Add a adapter configuration
    pub async fn add_adapter(&self, config: AdapterConfig) -> Result<(), EngineError> {
        self.adapter
            .add_adapter(config)
            .await
            .map_err(|e| EngineError::Orchestrator(e.to_string()))
    }

    /// Set active adapter by kind
    pub async fn set_active_adapter(&self, kind: AdapterKind) -> Result<(), EngineError> {
        self.adapter
            .set_active(kind)
            .await
            .map_err(|e| EngineError::Orchestrator(e.to_string()))
    }

    /// Get active adapter config
    pub async fn active_adapter(&self) -> Option<AdapterConfig> {
        self.adapter.active_config().await
    }

    /// List all configured adapters
    pub async fn list_adapters(&self) -> Vec<AdapterConfig> {
        self.adapter.list_adapters().await
    }

    /// Check if any models are available
    pub async fn has_models(&self) -> bool {
        self.adapter.has_models().await
    }
}

impl Default for DiscoveryFacade {
    fn default() -> Self {
        Self::new()
    }
}
