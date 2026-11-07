// engine/src/types/model.rs

//! Model types - public-safe versions
//!
//! These wrap orchestrator's internal model types without exposing
//! file paths, internal IDs, or implementation details.
//!
//! Now uses SSOT types from shared crate - no translation needed.

use serde::{Deserialize, Serialize};
use shared::{AdapterKind, LlmProvider};

/// Discovered model info (public-safe)
///
/// Represents a model found by discovery scanning.
/// NO file paths or internal details exposed.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredModel {
    /// Model identifier
    pub id: String,
    /// Display name
    pub name: String,
    /// Adapter type (Local, Web)
    pub kind: AdapterKind,
    /// LLM provider (if kind is Web)
    pub provider: Option<LlmProvider>,
    /// Whether the model is ready to use
    pub available: bool,
    /// Model size in human-readable format (e.g., "7B", "13B")
    pub size: Option<String>,
    /// Quantization type (e.g., "Q4_K_M", "Q8_0")
    pub quantization: Option<String>,
}

impl DiscoveredModel {
    /// Create a local model entry
    pub fn local(id: impl Into<String>, name: impl Into<String>, available: bool) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            kind: AdapterKind::Local,
            provider: None,
            available,
            size: None,
            quantization: None,
        }
    }

    /// Create a web provider model entry
    pub fn web(provider: LlmProvider, name: impl Into<String>, available: bool) -> Self {
        Self {
            id: provider.name().to_string(),
            name: name.into(),
            kind: AdapterKind::Web,
            provider: Some(provider),
            available,
            size: None,
            quantization: None,
        }
    }

    /// Set size info
    pub fn with_size(mut self, size: impl Into<String>) -> Self {
        self.size = Some(size.into());
        self
    }

    /// Set quantization info
    pub fn with_quantization(mut self, quant: impl Into<String>) -> Self {
        self.quantization = Some(quant.into());
        self
    }
}

/// Active model info (public-safe)
///
/// Information about the currently loaded/active model.
/// NO internal paths or orchestrator types exposed.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    /// Model identifier
    pub id: String,
    /// Display name
    pub name: String,
    /// Adapter type
    pub kind: AdapterKind,
    /// LLM provider (if applicable)
    pub provider: Option<LlmProvider>,
    /// Whether model is loaded and ready
    pub ready: bool,
}

impl ModelInfo {
    /// Create from discovered model
    pub fn from_discovered(model: &DiscoveredModel, ready: bool) -> Self {
        Self {
            id: model.id.clone(),
            name: model.name.clone(),
            kind: model.kind,
            provider: model.provider,
            ready,
        }
    }
}

/// Convert from orchestrator's internal ModelInfo
///
/// Now simple since orchestrator uses SSOT types - just copy fields.
impl From<orchestrator::infra::catalog::adapter::ModelInfo> for DiscoveredModel {
    fn from(internal: orchestrator::infra::catalog::adapter::ModelInfo) -> Self {
        // Convert params_b (billions) to human-readable size or use size_human
        let size = if !internal.size_human.is_empty() && internal.size_human != "0 MB" {
            Some(internal.size_human)
        } else if let Some(params) = internal.params_b {
            Some(format!("{:.0}B", params))
        } else {
            None
        };

        Self {
            id: internal.id,
            name: internal.name,
            kind: internal.kind,
            provider: internal.provider,
            available: internal.available,
            size,
            quantization: internal.quantization,
        }
    }
}
