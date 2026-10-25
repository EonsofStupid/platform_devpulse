// orchestrator/src/infra/catalog/models.rs

//! Model configuration and loading infrastructure
//!
//! Flexible model registry supporting:
//! - Multiple model sizes (4B, 8B VL)
//! - Base, distilled, and tuned variants
//! - Memory estimation before loading
//! - Hot-swappable model updates
//!
//! Device allocation:
//! - Embedder: CPU forced (saves VRAM headroom)
//! - Reranker: GPU P2 priority (~0.6GB VRAM)
//! - VL Models: GPU P0 priority (variable VRAM)
//! - Llm: GPU P1 priority - Sprint 2

use anyhow::{anyhow, Result};
use candle_core::Device;
use serde::{Deserialize, Serialize};
use shared::config::paths::DevPulsePaths;
use shared::types::models::ModelLoadState;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

#[cfg(feature = "db")]
use crate::infra::persistence::sql::Database;

// ═══════════════════════════════════════════════════════════════
// ModelPaths - Simple path helper for model directories
// ═══════════════════════════════════════════════════════════════

/// Paths to model directories
#[derive(Debug, Clone)]
pub struct ModelPaths {
    /// Base models directory
    pub base_dir: PathBuf,
    /// Embedder model directory
    pub embedder_dir: PathBuf,
    /// Reranker model directory
    pub reranker_dir: PathBuf,
    /// VL 4B model directory
    pub vl_4b_dir: PathBuf,
    /// VL 8B model directory
    pub vl_8b_dir: PathBuf,
    /// Llm GGUF (4B VL instruct)
    pub llm_gguf: PathBuf,
}

impl ModelPaths {
    /// Create from SSOT paths
    pub fn from_paths(paths: &DevPulsePaths) -> Self {
        let base_dir = paths.models_dir.clone();
        Self::with_base_dir(base_dir)
    }

    /// Create with explicit base directory
    pub fn with_base_dir(base_dir: PathBuf) -> Self {
        Self {
            embedder_dir: base_dir.join("embedder"),
            reranker_dir: base_dir.join("reranker"),
            vl_4b_dir: base_dir.join("qwen3-vl-4b"),
            vl_8b_dir: base_dir.join("8vlb").join("qwen3-vl-8b"),
            llm_gguf: base_dir.join("llm").join("Qwen3-VL-4B-Instruct-Q4_K_M.gguf"),
            base_dir,
        }
    }

    /// Create with hardcoded dp_alpha path (for dev/testing)
    pub fn default_dp_alpha() -> Self {
        Self::with_base_dir(PathBuf::from(r"D:\localdev\dp_alpha\models"))
    }

    /// Verify embedder files exist
    pub fn verify_embedder(&self) -> Result<()> {
        let required = ["model.safetensors", "tokenizer.json", "config.json"];
        for file in required {
            let path = self.embedder_dir.join(file);
            if !path.exists() {
                return Err(anyhow!("Missing embedder file: {:?}", path));
            }
        }
        Ok(())
    }

    /// Verify reranker files exist
    pub fn verify_reranker(&self) -> Result<()> {
        let gguf = self.reranker_dir.join("Qwen3-Reranker-0.6B-q8_0.gguf");
        let tokenizer = self.reranker_dir.join("tokenizer.json");

        if !gguf.exists() {
            return Err(anyhow!("Missing reranker GGUF: {:?}", gguf));
        }
        if !tokenizer.exists() {
            return Err(anyhow!("Missing reranker tokenizer: {:?}", tokenizer));
        }
        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════
// Model Types
// ═══════════════════════════════════════════════════════════════

/// Model variant type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ModelVariant {
    /// Original base model
    Base,
    /// Distilled (smaller, faster)
    Distilled,
    /// Fine-tuned for specific tasks
    Tuned,
    /// Quantized variant (Q4, Q6, Q8, etc.)
    Quantized,
}

impl std::fmt::Display for ModelVariant {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ModelVariant::Base => write!(f, "base"),
            ModelVariant::Distilled => write!(f, "distilled"),
            ModelVariant::Tuned => write!(f, "tuned"),
            ModelVariant::Quantized => write!(f, "quantized"),
        }
    }
}

/// Model family (architecture)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ModelFamily {
    /// Qwen3 embedding model
    Qwen3Embed,
    /// Qwen3 reranker
    Qwen3Rerank,
    /// Qwen3 VL (vision-language)
    Qwen3VL,
    /// Whisper STT
    Whisper,
    /// Kokoro TTS
    Kokoro,
}

impl std::fmt::Display for ModelFamily {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ModelFamily::Qwen3Embed => write!(f, "qwen3-embed"),
            ModelFamily::Qwen3Rerank => write!(f, "qwen3-rerank"),
            ModelFamily::Qwen3VL => write!(f, "qwen3-vl"),
            ModelFamily::Whisper => write!(f, "whisper"),
            ModelFamily::Kokoro => write!(f, "kokoro"),
        }
    }
}

/// Model size descriptor
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ModelSize {
    /// Parameter count in billions (e.g., 0.6, 4.0, 8.0)
    pub params_b: f32,
    /// Quantization level if applicable (e.g., "Q4_K", "Q6_K", "Q8_0", "F16")
    pub quant: Option<String>,
}

impl ModelSize {
    pub fn new(params_b: f32) -> Self {
        Self { params_b, quant: None }
    }

    pub fn with_quant(params_b: f32, quant: &str) -> Self {
        Self { params_b, quant: Some(quant.to_string()) }
    }

    /// Estimate VRAM usage in GB
    pub fn estimate_vram_gb(&self) -> f32 {
        let base_bytes_per_param = match &self.quant {
            Some(q) if q.contains("Q4") => 0.5,   // 4-bit: ~0.5 bytes/param
            Some(q) if q.contains("Q5") => 0.625, // 5-bit: ~0.625 bytes/param
            Some(q) if q.contains("Q6") => 0.75,  // 6-bit: ~0.75 bytes/param
            Some(q) if q.contains("Q8") => 1.0,   // 8-bit: 1 byte/param
            Some(q) if q.contains("F16") => 2.0,  // 16-bit: 2 bytes/param
            Some(q) if q.contains("F32") => 4.0,  // 32-bit: 4 bytes/param
            None => 2.0, // Default F16
            _ => 2.0,
        };

        // Add ~20% overhead for KV cache, activations
        let overhead_multiplier = 1.2;
        self.params_b * base_bytes_per_param * overhead_multiplier
    }
}

impl std::fmt::Display for ModelSize {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if let Some(quant) = &self.quant {
            write!(f, "{}B-{}", self.params_b, quant)
        } else {
            write!(f, "{}B", self.params_b)
        }
    }
}

/// Memory requirements for a model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryRequirements {
    /// Estimated VRAM in GB
    pub vram_gb: f32,
    /// Estimated RAM in GB (for CPU offload or full CPU inference)
    pub ram_gb: f32,
    /// Whether model can run on CPU only
    pub cpu_capable: bool,
    /// Minimum VRAM for partial offload
    pub min_vram_gb: Option<f32>,
}

impl MemoryRequirements {
    pub fn for_model(size: &ModelSize, has_vision: bool) -> Self {
        let base_vram = size.estimate_vram_gb();

        // Vision models need extra VRAM for image encoder
        let vision_overhead = if has_vision { 1.5 } else { 0.0 };
        let total_vram = base_vram + vision_overhead;

        Self {
            vram_gb: total_vram,
            ram_gb: total_vram * 1.5, // RAM needs more due to less efficiency
            cpu_capable: size.params_b <= 8.0, // Larger models too slow on CPU
            min_vram_gb: Some(total_vram * 0.3), // 30% for minimal offload
        }
    }

    /// Human-readable summary
    pub fn summary(&self) -> String {
        format!(
            "VRAM: {:.1}GB | RAM: {:.1}GB | CPU: {} | Min VRAM: {:.1}GB",
            self.vram_gb,
            self.ram_gb,
            if self.cpu_capable { "OK" } else { "NO" },
            self.min_vram_gb.unwrap_or(0.0)
        )
    }
}

/// Model specification - describes a specific model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelSpec {
    /// Unique identifier (e.g., "qwen3-vl-8b-q6k")
    pub id: String,
    /// Human-readable name
    pub name: String,
    /// Model family
    pub family: ModelFamily,
    /// Size info
    pub size: ModelSize,
    /// Variant type
    pub variant: ModelVariant,
    /// Memory requirements
    pub memory: MemoryRequirements,
    /// Required files (relative to model dir)
    pub files: Vec<String>,
    /// Optional multimodal projector file
    pub mmproj: Option<String>,
}

impl ModelSpec {
    /// Check if all required files exist at the given path
    pub fn verify_files(&self, model_dir: &Path) -> Result<()> {
        for file in &self.files {
            let path = model_dir.join(file);
            if !path.exists() {
                return Err(anyhow!("Missing file: {:?}", path));
            }
        }
        if let Some(mmproj) = &self.mmproj {
            let path = model_dir.join(mmproj);
            if !path.exists() {
                return Err(anyhow!("Missing mmproj: {:?}", path));
            }
        }
        Ok(())
    }

    /// Get main model file path
    pub fn model_path(&self, model_dir: &Path) -> PathBuf {
        model_dir.join(&self.files[0])
    }

    /// Get mmproj path if applicable
    pub fn mmproj_path(&self, model_dir: &Path) -> Option<PathBuf> {
        self.mmproj.as_ref().map(|f| model_dir.join(f))
    }
}

/// Model registry - tracks available models
#[derive(Debug, Default)]
pub struct ModelRegistry {
    /// All registered model specs
    specs: HashMap<String, ModelSpec>,
    /// Base directory for models
    base_dir: PathBuf,
    /// Currently active model per family
    active: HashMap<ModelFamily, String>,
    /// Current load state per family
    load_states: HashMap<ModelFamily, ModelLoadState>,
}

impl ModelRegistry {
    /// Create registry with default dp_alpha models path (dev/testing)
    pub fn new() -> Self {
        Self::with_base_dir(PathBuf::from(r"D:\localdev\dp_alpha\models"))
    }

    /// Create registry using SSOT paths
    pub fn new_from_paths(paths: &DevPulsePaths) -> Self {
        Self::with_base_dir(paths.models_dir.clone())
    }

    /// Create registry with custom base directory
    pub fn with_base_dir(base_dir: PathBuf) -> Self {
        let mut registry = Self {
            specs: HashMap::new(),
            base_dir,
            active: HashMap::new(),
            load_states: HashMap::new(),
        };
        registry.register_builtin_models();
        registry
    }

    /// Register built-in model definitions
    fn register_builtin_models(&mut self) {
        // Qwen3-VL 8B Q6_K
        self.register(ModelSpec {
            id: "qwen3-vl-8b-q6k".to_string(),
            name: "Qwen3-VL 8B (Q6_K)".to_string(),
            family: ModelFamily::Qwen3VL,
            size: ModelSize::with_quant(8.0, "Q6_K"),
            variant: ModelVariant::Quantized,
            memory: MemoryRequirements::for_model(
                &ModelSize::with_quant(8.0, "Q6_K"),
                true,
            ),
            files: vec!["8vlb/qwen3-vl-8b/Qwen3-VL-8B-Instruct-Q6_K.gguf".to_string()],
            mmproj: Some("8vlb/qwen3-vl-8b/mmproj-Qwen3-VL-8B-Instruct-F16.gguf".to_string()),
        });

        // Qwen3-VL 4B Q6_K (placeholder - update when available)
        self.register(ModelSpec {
            id: "qwen3-vl-4b-q6k".to_string(),
            name: "Qwen3-VL 4B (Q6_K)".to_string(),
            family: ModelFamily::Qwen3VL,
            size: ModelSize::with_quant(4.0, "Q6_K"),
            variant: ModelVariant::Quantized,
            memory: MemoryRequirements::for_model(
                &ModelSize::with_quant(4.0, "Q6_K"),
                true,
            ),
            files: vec!["qwen3-vl-4b/Qwen3-VL-4B-Instruct-Q6_K.gguf".to_string()],
            mmproj: Some("qwen3-vl-4b/mmproj-Qwen3-VL-4B-Instruct-F16.gguf".to_string()),
        });

        // Qwen3 Embedding 0.6B
        self.register(ModelSpec {
            id: "qwen3-embed-0.6b".to_string(),
            name: "Qwen3-Embedding 0.6B".to_string(),
            family: ModelFamily::Qwen3Embed,
            size: ModelSize::new(0.6),
            variant: ModelVariant::Base,
            memory: MemoryRequirements::for_model(&ModelSize::new(0.6), false),
            files: vec![
                "embedder/model.safetensors".to_string(),
                "embedder/tokenizer.json".to_string(),
                "embedder/config.json".to_string(),
            ],
            mmproj: None,
        });

        // Qwen3 Reranker 0.6B Q8
        self.register(ModelSpec {
            id: "qwen3-rerank-0.6b-q8".to_string(),
            name: "Qwen3-Reranker 0.6B (Q8_0)".to_string(),
            family: ModelFamily::Qwen3Rerank,
            size: ModelSize::with_quant(0.6, "Q8_0"),
            variant: ModelVariant::Quantized,
            memory: MemoryRequirements::for_model(
                &ModelSize::with_quant(0.6, "Q8_0"),
                false,
            ),
            files: vec![
                "reranker/Qwen3-Reranker-0.6B-q8_0.gguf".to_string(),
                "reranker/tokenizer.json".to_string(),
            ],
            mmproj: None,
        });
    }

    /// Register a model spec
    pub fn register(&mut self, spec: ModelSpec) {
        self.specs.insert(spec.id.clone(), spec);
    }

    /// Register a tuned/distilled variant
    pub fn register_variant(&mut self, base_id: &str, new_id: &str, variant: ModelVariant, files: Vec<String>) -> Result<()> {
        let base = self.specs.get(base_id)
            .ok_or_else(|| anyhow!("Base model not found: {}", base_id))?
            .clone();

        let spec = ModelSpec {
            id: new_id.to_string(),
            name: format!("{} ({})", base.name, variant),
            variant,
            files,
            ..base
        };

        self.register(spec);
        Ok(())
    }

    /// Get a model spec by ID
    pub fn get(&self, id: &str) -> Option<&ModelSpec> {
        self.specs.get(id)
    }

    /// List all models of a family
    pub fn list_family(&self, family: ModelFamily) -> Vec<&ModelSpec> {
        self.specs.values()
            .filter(|s| s.family == family)
            .collect()
    }

    /// List all registered models
    pub fn list_all(&self) -> Vec<&ModelSpec> {
        self.specs.values().collect()
    }

    /// Get full path for a model
    pub fn model_dir(&self, id: &str) -> Option<PathBuf> {
        self.specs.get(id).map(|_| self.base_dir.clone())
    }

    /// Verify a model exists on disk
    pub fn verify(&self, id: &str) -> Result<()> {
        let spec = self.get(id).ok_or_else(|| anyhow!("Unknown model: {}", id))?;
        spec.verify_files(&self.base_dir)
    }

    /// Set active model for a family
    pub fn set_active(&mut self, family: ModelFamily, id: &str) -> Result<()> {
        let spec = self.get(id).ok_or_else(|| anyhow!("Unknown model: {}", id))?;
        if spec.family != family {
            return Err(anyhow!("Model {} is not a {:?}", id, family));
        }
        self.active.insert(family, id.to_string());
        Ok(())
    }

    /// Get active model for a family
    pub fn get_active(&self, family: ModelFamily) -> Option<&ModelSpec> {
        self.active.get(&family).and_then(|id| self.specs.get(id))
    }

    /// Get active model ID for a family
    pub fn get_active_id(&self, family: ModelFamily) -> Option<&String> {
        self.active.get(&family)
    }

    // ============== Load State Tracking ==============

    /// Get load state for a family
    pub fn get_load_state(&self, family: ModelFamily) -> ModelLoadState {
        self.load_states.get(&family).cloned().unwrap_or_default()
    }

    /// Set load state for a family
    pub fn set_load_state(&mut self, family: ModelFamily, state: ModelLoadState) {
        self.load_states.insert(family, state);
    }

    /// Get all load states
    pub fn get_all_load_states(&self) -> HashMap<ModelFamily, ModelLoadState> {
        self.load_states.clone()
    }

    // ============== Persistence (requires db feature) ==============

    /// Load persisted active models from database
    #[cfg(feature = "db")]
    pub async fn load_persisted_actives(&mut self, db: &Database) -> Result<()> {
        let actives = db.get_all_active_models().await?;

        for (family_str, model_id) in actives {
            if let Some(family) = parse_model_family(&family_str) {
                // Verify the model exists in registry
                if self.specs.contains_key(&model_id) {
                    self.active.insert(family, model_id.clone());
                    tracing::info!(
                        family = %family_str,
                        model_id = %model_id,
                        "Restored active model from database"
                    );
                } else {
                    tracing::warn!(
                        family = %family_str,
                        model_id = %model_id,
                        "Persisted model not found in registry, skipping"
                    );
                }
            }
        }

        Ok(())
    }

    /// Persist active model selection for a family
    #[cfg(feature = "db")]
    pub async fn persist_active(&self, db: &Database, family: ModelFamily) -> Result<()> {
        if let Some(model_id) = self.active.get(&family) {
            db.set_active_model(&family.to_string(), model_id).await?;
            tracing::debug!(
                family = %family,
                model_id = %model_id,
                "Persisted active model selection"
            );
        }
        Ok(())
    }

    /// Set active model and persist to database
    #[cfg(feature = "db")]
    pub async fn set_active_and_persist(
        &mut self,
        family: ModelFamily,
        id: &str,
        db: &Database,
    ) -> Result<()> {
        self.set_active(family, id)?;
        self.persist_active(db, family).await?;
        Ok(())
    }

    /// Get base directory for models
    pub fn base_dir(&self) -> &Path {
        &self.base_dir
    }

    /// Print memory summary for all models
    pub fn print_memory_summary(&self) {
        println!("\n=== Model Memory Requirements ===\n");
        for spec in self.list_all() {
            let status = if self.verify(&spec.id).is_ok() { "OK" } else { "MISSING" };
            println!("{} [{}]", spec.name, status);
            println!("  ID: {}", spec.id);
            println!("  Size: {}", spec.size);
            println!("  {}", spec.memory.summary());
            println!();
        }
    }
}

/// Qwen3 model architecture config (from config.json)
#[derive(Debug, Clone, Deserialize)]
pub struct Qwen3Config {
    pub hidden_size: usize,
    pub num_hidden_layers: usize,
    pub num_attention_heads: usize,
    pub num_key_value_heads: usize,
    pub intermediate_size: usize,
    pub vocab_size: usize,
    pub head_dim: Option<usize>,
    pub max_position_embeddings: Option<usize>,
    #[serde(default = "default_rms_norm_eps")]
    pub rms_norm_eps: f64,
    #[serde(default = "default_rope_theta")]
    pub rope_theta: f64,
    #[serde(default)]
    pub tie_word_embeddings: bool,
}

fn default_rms_norm_eps() -> f64 { 1e-6 }
fn default_rope_theta() -> f64 { 1_000_000.0 }

impl Qwen3Config {
    pub fn from_file(path: &Path) -> Result<Self> {
        let content = std::fs::read_to_string(path)?;
        Ok(serde_json::from_str(&content)?)
    }
}

/// Parse a model family string to enum
pub fn parse_model_family(s: &str) -> Option<ModelFamily> {
    match s.to_lowercase().replace('-', "_").as_str() {
        "qwen3_vl" | "qwen3vl" | "vl" => Some(ModelFamily::Qwen3VL),
        "qwen3_embed" | "qwen3embed" | "embed" => Some(ModelFamily::Qwen3Embed),
        "qwen3_rerank" | "qwen3rerank" | "rerank" => Some(ModelFamily::Qwen3Rerank),
        "whisper" => Some(ModelFamily::Whisper),
        "kokoro" => Some(ModelFamily::Kokoro),
        _ => None,
    }
}

/// Device allocation strategy
#[derive(Debug, Clone, Copy)]
pub enum DeviceAllocation {
    /// Force CPU (embedder - saves VRAM)
    CpuForced,
    /// GPU with priority (lower = higher priority)
    Gpu { priority: u8 },
    /// GPU P1 for llm (main reasoning)
    GpuP1,
    /// GPU P2 for reranker
    GpuP2,
}

impl DeviceAllocation {
    pub fn to_device(&self) -> Device {
        match self {
            DeviceAllocation::CpuForced => Device::Cpu,
            DeviceAllocation::Gpu { .. } | DeviceAllocation::GpuP1 | DeviceAllocation::GpuP2 => {
                Device::cuda_if_available(0).unwrap_or(Device::Cpu)
            }
        }
    }

    pub fn device_name(&self) -> &'static str {
        match self {
            DeviceAllocation::CpuForced => "CPU (forced)",
            DeviceAllocation::GpuP1 => "GPU P1 (llm)",
            DeviceAllocation::GpuP2 => "GPU P2 (reranker)",
            DeviceAllocation::Gpu { priority } => match priority {
                0 => "GPU P0 (VL)",
                1 => "GPU P1 (llm)",
                2 => "GPU P2 (reranker)",
                _ => "GPU",
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_registry() {
        let registry = ModelRegistry::new();

        // Check built-in models registered
        assert!(registry.get("qwen3-vl-8b-q6k").is_some());
        assert!(registry.get("qwen3-vl-4b-q6k").is_some());
        assert!(registry.get("qwen3-embed-0.6b").is_some());
        assert!(registry.get("qwen3-rerank-0.6b-q8").is_some());
    }

    #[test]
    fn test_memory_estimation() {
        let size_8b_q6 = ModelSize::with_quant(8.0, "Q6_K");
        let vram = size_8b_q6.estimate_vram_gb();
        // 8B * 0.75 bytes * 1.2 overhead = 7.2 GB
        assert!(vram > 6.0 && vram < 9.0);

        let size_4b_q6 = ModelSize::with_quant(4.0, "Q6_K");
        let vram_4b = size_4b_q6.estimate_vram_gb();
        assert!(vram_4b < vram); // 4B should be less than 8B
    }

    #[test]
    fn test_vl_memory_overhead() {
        let size = ModelSize::with_quant(8.0, "Q6_K");
        let reqs_text = MemoryRequirements::for_model(&size, false);
        let reqs_vl = MemoryRequirements::for_model(&size, true);

        // VL should need more VRAM due to vision encoder
        assert!(reqs_vl.vram_gb > reqs_text.vram_gb);
    }

    #[test]
    fn test_register_variant() {
        let mut registry = ModelRegistry::new();

        // Register a distilled variant
        registry.register_variant(
            "qwen3-vl-8b-q6k",
            "qwen3-vl-8b-distilled",
            ModelVariant::Distilled,
            vec!["distilled/model.gguf".to_string()],
        ).unwrap();

        let distilled = registry.get("qwen3-vl-8b-distilled").unwrap();
        assert_eq!(distilled.variant, ModelVariant::Distilled);
    }
}
