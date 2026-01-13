// orchestrator/src/infra/core/services/mod.rs

//! Service orchestration - toggleable AI backends
//!
//! Three service kinds:
//! - Embedder: text → vector
//! - Reranker: query×doc → score  
//! - Llm: prompt → generation
//!
//! Each can be enabled/disabled independently via config.

pub mod descriptors;
mod loaders;
pub mod traits;

pub use descriptors::*;
pub use traits::*;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

// ═══════════════════════════════════════════════════════════════
// ServiceKind - The three pillars
// ═══════════════════════════════════════════════════════════════

/// Top-level service categories
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ServiceKind {
    /// Text → 1024-dim vector
    Embedder,
    /// Query×Doc → relevance score (0.0-1.0)
    Reranker,
    /// Prompt → generation with grammar
    Llm,
}

impl std::fmt::Display for ServiceKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceKind::Embedder => write!(f, "embedder"),
            ServiceKind::Reranker => write!(f, "reranker"),
            ServiceKind::Llm => write!(f, "llm"),
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ServiceState - Runtime toggle
// ═══════════════════════════════════════════════════════════════

/// Runtime state for a service
#[derive(Debug, Clone, Copy, Default)]
pub struct ServiceState {
    /// Config says this should be active
    pub enabled: bool,
    /// Model is actually loaded in memory
    pub loaded: bool,
}

// ═══════════════════════════════════════════════════════════════
// ServiceRegistry - Runtime container
// ═══════════════════════════════════════════════════════════════

/// Runtime registry holding all loaded services
pub struct ServiceRegistry {
    states: HashMap<ServiceKind, ServiceState>,
    embedder: Option<Arc<dyn EmbedderService>>,
    reranker: Option<Arc<dyn RerankerService>>,
    llm: Option<Arc<dyn LlmService>>,
}

impl ServiceRegistry {
    /// Create empty registry
    pub fn new() -> Self {
        Self {
            states: HashMap::new(),
            embedder: None,
            reranker: None,
            llm: None,
        }
    }

    /// Create registry from config, loading enabled services
    pub async fn from_config(config: &super::config::ServicesConfig) -> Result<Self> {
        let mut registry = Self::new();

        // Set initial states from config
        registry.states.insert(
            ServiceKind::Embedder,
            ServiceState {
                enabled: config.embedder_enabled,
                loaded: false,
            },
        );
        registry.states.insert(
            ServiceKind::Reranker,
            ServiceState {
                enabled: config.reranker_enabled,
                loaded: false,
            },
        );
        registry.states.insert(
            ServiceKind::Llm,
            ServiceState {
                enabled: config.llm_enabled,
                loaded: false,
            },
        );

        // Load enabled services
        if config.embedder_enabled {
            registry.load_embedder(config).await?;
        }
        if config.reranker_enabled {
            registry.load_reranker(config).await?;
        }
        if config.llm_enabled {
            registry.load_llm(config).await?;
        }

        Ok(registry)
    }

    // ─────────────────────────────────────────────────────────────
    // State queries
    // ─────────────────────────────────────────────────────────────

    /// Check if service is enabled in config
    pub fn is_enabled(&self, kind: ServiceKind) -> bool {
        self.states.get(&kind).map(|s| s.enabled).unwrap_or(false)
    }

    /// Check if service is actually loaded
    pub fn is_loaded(&self, kind: ServiceKind) -> bool {
        self.states.get(&kind).map(|s| s.loaded).unwrap_or(false)
    }

    /// Get all service states
    pub fn states(&self) -> &HashMap<ServiceKind, ServiceState> {
        &self.states
    }

    // ─────────────────────────────────────────────────────────────
    // Service accessors (return None if disabled)
    // ─────────────────────────────────────────────────────────────

    /// Get embedder if enabled
    pub fn embedder(&self) -> Option<&Arc<dyn EmbedderService>> {
        if self.is_enabled(ServiceKind::Embedder) {
            self.embedder.as_ref()
        } else {
            None
        }
    }

    /// Get reranker if enabled
    pub fn reranker(&self) -> Option<&Arc<dyn RerankerService>> {
        if self.is_enabled(ServiceKind::Reranker) {
            self.reranker.as_ref()
        } else {
            None
        }
    }

    /// Get LLM if enabled
    pub fn llm(&self) -> Option<&Arc<dyn LlmService>> {
        if self.is_enabled(ServiceKind::Llm) {
            self.llm.as_ref()
        } else {
            None
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Runtime toggles
    // ─────────────────────────────────────────────────────────────

    /// Enable or disable a service at runtime
    pub async fn set_enabled(
        &mut self,
        kind: ServiceKind,
        enabled: bool,
        config: &super::config::ServicesConfig,
    ) -> Result<()> {
        let was_loaded = self.is_loaded(kind);

        if enabled && !was_loaded {
            // Load the service if not already loaded
            match kind {
                ServiceKind::Embedder => self.load_embedder(config).await?,
                ServiceKind::Reranker => self.load_reranker(config).await?,
                ServiceKind::Llm => self.load_llm(config).await?,
            }
        }

        // Update state after loading
        let state = self.states.entry(kind).or_default();
        state.enabled = enabled;
        if enabled && !was_loaded {
            state.loaded = true;
        }
        Ok(())
    }

    /// Unload a service to free memory
    pub fn unload(&mut self, kind: ServiceKind) {
        match kind {
            ServiceKind::Embedder => self.embedder = None,
            ServiceKind::Reranker => self.reranker = None,
            ServiceKind::Llm => self.llm = None,
        }
        if let Some(state) = self.states.get_mut(&kind) {
            state.loaded = false;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Loaders (delegate to loaders.rs)
    // ─────────────────────────────────────────────────────────────

    async fn load_embedder(&mut self, config: &super::config::ServicesConfig) -> Result<()> {
        let embedder = loaders::load_embedder(config.clone()).await?;
        self.embedder = Some(Arc::new(embedder));
        if let Some(state) = self.states.get_mut(&ServiceKind::Embedder) {
            state.loaded = true;
        }
        Ok(())
    }

    async fn load_reranker(&mut self, config: &super::config::ServicesConfig) -> Result<()> {
        let reranker = loaders::load_reranker(config.clone()).await?;
        self.reranker = Some(Arc::new(reranker));
        if let Some(state) = self.states.get_mut(&ServiceKind::Reranker) {
            state.loaded = true;
        }
        Ok(())
    }

    async fn load_llm(&mut self, config: &super::config::ServicesConfig) -> Result<()> {
        let llm = loaders::load_llm(config.clone()).await?;
        self.llm = Some(Arc::new(llm));
        if let Some(state) = self.states.get_mut(&ServiceKind::Llm) {
            state.loaded = true;
        }
        Ok(())
    }
}

impl Default for ServiceRegistry {
    fn default() -> Self {
        Self::new()
    }
}
