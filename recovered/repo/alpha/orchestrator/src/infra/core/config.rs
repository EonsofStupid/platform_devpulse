// orchestrator/src/infra/core/config.rs

//! DevPulse configuration - TOML-based settings
//!
//! Config lives at ~/.local/share/devpulse/config.toml
//! Override via DEVPULSE_CONFIG env var

use crate::infra::core::services::descriptors::{DeviceTarget, ModelRegistry};
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use shared::config::paths::get_paths;
use std::path::PathBuf;

// ═══════════════════════════════════════════════════════════════
// Top-level Config
// ═══════════════════════════════════════════════════════════════

/// Root configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevPulseConfig {
    /// Service toggles and model selection
    #[serde(default)]
    pub services: ServicesConfig,

    /// Path overrides
    #[serde(default)]
    pub paths: PathsConfig,
}

impl DevPulseConfig {
    /// Load config from default path
    pub fn load() -> Result<Self> {
        let paths = get_paths();
        Self::load_from(&paths.config_toml)
    }

    /// Load config from specific path
    pub fn load_from(path: &PathBuf) -> Result<Self> {
        if !path.exists() {
            tracing::info!("No config at {:?}, using defaults", path);
            let mut config = Self::default();
            let paths = get_paths();
            config.services.models_dir = paths.models_dir.clone();
            return Ok(config);
        }

        let content = std::fs::read_to_string(path)
            .with_context(|| format!("Failed to read config at {:?}", path))?;

        let mut config: DevPulseConfig = toml::from_str(&content)
            .with_context(|| format!("Failed to parse config TOML at {:?}", path))?;

        // Resolve models_dir
        // 1. Explicit override in config.paths.models_dir
        // 2. Default from system paths
        let paths = get_paths();
        config.services.models_dir = config
            .paths
            .models_dir
            .clone()
            .unwrap_or_else(|| paths.models_dir.clone());

        Ok(config)
    }

    /// Save config to default path
    pub fn save(&self) -> Result<()> {
        let paths = get_paths();
        self.save_to(&paths.config_toml)
    }

    /// Save config to specific path
    pub fn save_to(&self, path: &PathBuf) -> Result<()> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let content = toml::to_string_pretty(self).context("Failed to serialize config")?;

        std::fs::write(path, content)
            .with_context(|| format!("Failed to write config to {:?}", path))
    }

    /// Generate default config file content
    pub fn default_toml() -> String {
        let config = Self::default();
        toml::to_string_pretty(&config).unwrap()
    }
}

impl Default for DevPulseConfig {
    fn default() -> Self {
        Self {
            services: ServicesConfig::default(),
            paths: PathsConfig::default(),
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ServicesConfig - AI service toggles
// ═══════════════════════════════════════════════════════════════

/// Configuration for AI services
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServicesConfig {
    // Master toggles
    #[serde(default = "default_true")]
    pub embedder_enabled: bool,
    #[serde(default)]
    pub reranker_enabled: bool,
    #[serde(default)]
    pub llm_enabled: bool,

    // Service-specific config
    #[serde(default)]
    pub embedder: Option<EmbedderConfig>,
    #[serde(default)]
    pub reranker: Option<RerankerConfig>,
    #[serde(default)]
    pub llm: Option<LlmConfig>,
    #[serde(default)]
    pub hyde: Option<HydeConfig>,
    #[serde(default)]
    pub graph_rag: Option<GraphRagConfig>,

    // Model registry
    #[serde(default = "ModelRegistry::with_defaults")]
    pub models: ModelRegistry,

    // Models directory (resolved from paths or explicit)
    #[serde(skip)]
    pub models_dir: PathBuf,
}

fn default_true() -> bool {
    true
}

impl Default for ServicesConfig {
    fn default() -> Self {
        Self {
            embedder_enabled: true,
            reranker_enabled: false,
            llm_enabled: false,
            embedder: Some(EmbedderConfig::default()),
            reranker: Some(RerankerConfig::default()),
            llm: Some(LlmConfig::default()),
            hyde: Some(HydeConfig::default()),
            graph_rag: Some(GraphRagConfig::default()),
            models: ModelRegistry::with_defaults(),
            // models_dir is resolved dynamically, avoid hardcoding here
            models_dir: PathBuf::new(),
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Advanced Feature Configs
// ═══════════════════════════════════════════════════════════════

/// Tiered KV Cache Config (GPU -> RAM Offload)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KvCacheConfig {
    /// Enable tiered caching (offload to RAM)
    #[serde(default)]
    pub enabled: bool,
    /// Max RAM to use for offload (GB)
    #[serde(default = "default_ram_budget")]
    pub ram_budget_gb: f32,
    /// Block size for paging
    #[serde(default = "default_block_size")]
    pub block_size: usize,
}

fn default_ram_budget() -> f32 { 8.0 }
fn default_block_size() -> usize { 16 }

impl Default for KvCacheConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            ram_budget_gb: default_ram_budget(),
            block_size: default_block_size(),
        }
    }
}

/// HyDE (Hypothetical Document Embeddings) Config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HydeConfig {
    /// Enable HyDE for retrieval
    #[serde(default)]
    pub enabled: bool,
    /// Mode for hypothesis generation
    #[serde(default)]
    pub mode: HydeMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HydeMode {
    /// Generate a single detailed document
    SingleDetailed,
    /// Generate multiple diverse perspectives
    MultiPerspective,
}

impl Default for HydeMode {
    fn default() -> Self { Self::SingleDetailed }
}

impl Default for HydeConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            mode: HydeMode::default(),
        }
    }
}

/// GraphRAG Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphRagConfig {
    /// Enable GraphRAG engine
    #[serde(default)]
    pub enabled: bool,
    /// Store path (relative to data_dir)
    #[serde(default = "default_graph_store")]
    pub store_path: PathBuf,
}

fn default_graph_store() -> PathBuf { PathBuf::from("knowledge_graph") }

impl Default for GraphRagConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            store_path: default_graph_store(),
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Per-Service Config
// ═══════════════════════════════════════════════════════════════

/// Embedder-specific configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbedderConfig {
    /// Which embedder model to use (must exist in models.embedders)
    #[serde(default = "default_embedder")]
    pub active: String,
    /// Target device
    #[serde(default)]
    pub device: DeviceTarget,
}

fn default_embedder() -> String {
    "Qwen3Embed0_6B".to_string()
}

impl Default for EmbedderConfig {
    fn default() -> Self {
        Self {
            active: default_embedder(),
            device: DeviceTarget::Cpu,
        }
    }
}

/// Reranker-specific configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RerankerConfig {
    /// Which reranker model to use
    #[serde(default = "default_reranker")]
    pub active: String,
    /// Target device
    #[serde(default)]
    pub device: DeviceTarget,
}

fn default_reranker() -> String {
    "Qwen3Rerank0_6B".to_string()
}

impl Default for RerankerConfig {
    fn default() -> Self {
        Self {
            active: default_reranker(),
            device: DeviceTarget::Cpu,
        }
    }
}

/// LLM-specific configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    /// Which LLM to use
    #[serde(default = "default_llm")]
    pub active: String,
    /// Target device
    #[serde(default = "default_llm_device")]
    pub device: DeviceTarget,
    /// Default max tokens for generation
    #[serde(default = "default_max_tokens")]
    pub max_tokens: u32,
    /// Default temperature
    #[serde(default = "default_temperature")]
    pub temperature: f32,
    /// Default token limit
    #[serde(default = "default_top_p")]
    pub top_p: f32,
    /// Grammar constraints
    #[serde(default)]
    pub grammar: GrammarConfig,
    /// Tiered KV Cache configuration
    #[serde(default)]
    pub kv_cache: KvCacheConfig,
}

fn default_llm() -> String {
    "Qwen3VL4B_Q4KM".to_string()
}

fn default_llm_device() -> DeviceTarget {
    DeviceTarget::Cuda(0)
}

fn default_max_tokens() -> u32 {
    1024
}

fn default_temperature() -> f32 {
    0.7
}

fn default_top_p() -> f32 {
    0.9
}

impl Default for LlmConfig {
    fn default() -> Self {
        Self {
            active: default_llm(),
            device: default_llm_device(),
            max_tokens: default_max_tokens(),
            temperature: default_temperature(),
            top_p: default_top_p(),
            grammar: GrammarConfig::default(),
            kv_cache: KvCacheConfig::default(),
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Grammar Config
// ═══════════════════════════════════════════════════════════════

/// Configuration for grammar-constrained generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrammarConfig {
    /// Enable grammar constraints
    #[serde(default)]
    pub enabled: bool,
    /// Backend to use for grammar enforcement
    #[serde(default)]
    pub backend: GrammarBackend,
    /// Built-in grammar to use (if any)
    #[serde(default)]
    pub builtin: Option<BuiltinGrammar>,
    /// Path to custom .gbnf file
    pub custom_path: Option<PathBuf>,
}

impl Default for GrammarConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            backend: GrammarBackend::Outlines, // Default to outlines-core
            builtin: None,
            custom_path: None,
        }
    }
}

/// Grammar enforcement backend
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum GrammarBackend {
    /// No grammar (free generation)
    None,
    /// Outlines (fst-based, highly efficient)
    Outlines,
    /// LlamaCpp (native GBNF, legacy)
    LlamaCpp,
}

impl Default for GrammarBackend {
    fn default() -> Self {
        Self::Outlines
    }
}

/// Built-in grammars provided by the system
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum BuiltinGrammar {
    /// Mission Plan (JSON structure for reasoning)
    MissionPlan,
    /// Generic JSON Object
    JsonObject,
    /// Direction (for Rumination)
    Direction,
}

// ═══════════════════════════════════════════════════════════════
// PathsConfig - Directory overrides
// ═══════════════════════════════════════════════════════════════

/// Path configuration overrides
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathsConfig {
    /// Override models directory
    pub models_dir: Option<PathBuf>,
    /// Override data directory
    pub data_dir: Option<PathBuf>,
}

impl Default for PathsConfig {
    fn default() -> Self {
        Self {
            models_dir: None, // Will default to get_paths().models_dir if None
            data_dir: None,
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config_toml() {
        let toml = DevPulseConfig::default_toml();
        println!("Default config:\n{}", toml);

        // Should parse back
        let parsed: DevPulseConfig = toml::from_str(&toml).unwrap();
        assert!(parsed.services.embedder_enabled);
        assert!(!parsed.services.reranker_enabled);
        assert!(!parsed.services.llm_enabled);
    }

    #[test]
    fn test_parse_minimal_config() {
        let toml = r#"
[services]
embedder_enabled = true
reranker_enabled = true
llm_enabled = false
"#;
        let config: DevPulseConfig = toml::from_str(toml).unwrap();
        assert!(config.services.embedder_enabled);
        assert!(config.services.reranker_enabled);
        assert!(!config.services.llm_enabled);
    }
}
