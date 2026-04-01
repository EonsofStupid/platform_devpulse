//! Model registry — discovered models with metadata and capability inference.

use crate::slots::types::ModelCapability;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Format of the model file on disk.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum ModelFormat {
    /// GGUF quantized format (Phase 1 — launch format).
    Gguf,
    /// SafeTensors format (Phase 2).
    SafeTensors,
}

/// Which inference backend can run this model.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum BackendType {
    /// Candle (canonical — Rust-native, llguidance integration).
    Candle,
    /// llama.cpp via FFI (secondary — broader architecture support).
    LlamaCpp,
}

/// Where the model was obtained.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum ModelSource {
    /// Discovered on local disk.
    Local,
    /// Downloaded from HuggingFace Hub.
    HuggingFace {
        /// HuggingFace repository ID (e.g. `"bartowski/Qwen3-14B-GGUF"`).
        repo_id: String,
        /// Git revision or branch.
        revision: String,
    },
}

/// Metadata extracted from model file headers (GGUF metadata keys).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct ModelMetadata {
    /// Architecture identifier (e.g. `"llama"`, `"qwen2"`, `"phi3"`).
    pub architecture: String,
    /// Total parameter count, if available.
    pub parameter_count: Option<u64>,
    /// Quantization level (e.g. `"Q4_K_M"`, `"Q8_0"`, `"F16"`).
    pub quant_level: Option<String>,
    /// Maximum context window in tokens.
    pub context_length: usize,
    /// Vocabulary size.
    pub vocab_size: usize,
}

/// A single model in the registry — fully described, ready for assignment.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct ModelRegistryEntry {
    /// Unique identifier (UUID v7).
    pub id: String,
    /// Filename on disk (e.g. `"qwen3-14b-instruct-q4_k_m.gguf"`).
    pub filename: String,
    /// Absolute path on disk.
    pub path: PathBuf,
    /// File format.
    pub format: ModelFormat,
    /// Architecture string from model metadata.
    pub architecture: String,
    /// Parameter count from metadata.
    pub parameter_count: Option<u64>,
    /// Quantization level from metadata or filename.
    pub quant_level: Option<String>,
    /// Maximum context window in tokens.
    pub context_length: usize,
    /// File size on disk in bytes.
    pub size_bytes: u64,
    /// Estimated VRAM when loaded (MB).
    pub vram_estimate_mb: u64,
    /// Which backends can load this model.
    pub supported_backends: Vec<BackendType>,
    /// Which slot capabilities this model can serve.
    pub compatible_capabilities: Vec<ModelCapability>,
    /// Where this model came from.
    pub source: ModelSource,
    /// When this model was discovered (epoch milliseconds).
    pub discovered_at: i64,
}

impl std::fmt::Display for ModelFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Gguf => write!(f, "GGUF"),
            Self::SafeTensors => write!(f, "SafeTensors"),
        }
    }
}

impl std::fmt::Display for BackendType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Candle => write!(f, "Candle"),
            Self::LlamaCpp => write!(f, "llama.cpp"),
        }
    }
}

/// Manages the collection of discovered models with persistence.
#[derive(Debug)]
pub struct ModelRegistry {
    entries: Vec<ModelRegistryEntry>,
    models_dir: PathBuf,
}

impl ModelRegistry {
    /// Create a new registry for a models directory.
    #[must_use]
    pub fn new(models_dir: PathBuf) -> Self {
        Self {
            entries: Vec::new(),
            models_dir,
        }
    }

    /// Scan the models directory and rebuild the registry.
    pub fn scan(&mut self) -> anyhow::Result<usize> {
        let discovered = crate::models::discovery::discover_models(&self.models_dir)?;
        let count = discovered.len();
        self.entries = discovered;
        self.save()?;
        Ok(count)
    }

    /// Add a single entry (e.g. after download).
    pub fn add(&mut self, entry: ModelRegistryEntry) {
        // Avoid duplicates by path
        self.entries.retain(|e| e.path != entry.path);
        self.entries.push(entry);
    }

    /// Remove an entry by ID.
    pub fn remove(&mut self, id: &str) -> Option<ModelRegistryEntry> {
        if let Some(idx) = self.entries.iter().position(|e| e.id == id) {
            Some(self.entries.remove(idx))
        } else {
            None
        }
    }

    /// Find entry by ID.
    #[must_use]
    pub fn get(&self, id: &str) -> Option<&ModelRegistryEntry> {
        self.entries.iter().find(|e| e.id == id)
    }

    /// Find entry by filename.
    #[must_use]
    pub fn get_by_filename(&self, filename: &str) -> Option<&ModelRegistryEntry> {
        self.entries.iter().find(|e| e.filename == filename)
    }

    /// All entries.
    #[must_use]
    pub fn all(&self) -> &[ModelRegistryEntry] {
        &self.entries
    }

    /// Number of models in registry.
    #[must_use]
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Whether registry is empty.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Filter by capability.
    #[must_use]
    pub fn compatible_with_capability(&self, cap: ModelCapability) -> Vec<&ModelRegistryEntry> {
        self.entries
            .iter()
            .filter(|e| e.compatible_capabilities.contains(&cap))
            .collect()
    }

    /// Filter by backend support.
    #[must_use]
    pub fn compatible_with_backend(&self, backend: BackendType) -> Vec<&ModelRegistryEntry> {
        self.entries
            .iter()
            .filter(|e| e.supported_backends.contains(&backend))
            .collect()
    }

    /// All unique filenames (for auto-config dedup).
    #[must_use]
    pub fn filenames(&self) -> std::collections::HashSet<String> {
        self.entries.iter().map(|e| e.filename.clone()).collect()
    }

    /// Persist registry to `{models_dir}/registry.json`.
    pub fn save(&self) -> anyhow::Result<()> {
        let path = self.models_dir.join("registry.json");
        let json = serde_json::to_string_pretty(&self.entries)?;
        std::fs::write(&path, json)?;
        tracing::debug!(path = %path.display(), count = self.entries.len(), "Registry saved");
        Ok(())
    }

    /// Load registry from `{models_dir}/registry.json`.
    pub fn load(models_dir: PathBuf) -> anyhow::Result<Self> {
        let path = models_dir.join("registry.json");
        if !path.exists() {
            return Ok(Self::new(models_dir));
        }

        let json = std::fs::read_to_string(&path)?;
        let entries: Vec<ModelRegistryEntry> = serde_json::from_str(&json).unwrap_or_else(|e| {
            tracing::warn!(error = %e, "Registry JSON corrupt — starting fresh");
            Vec::new()
        });

        // Validate: remove entries whose files no longer exist
        let valid: Vec<ModelRegistryEntry> = entries
            .into_iter()
            .filter(|e| {
                if e.path.exists() {
                    true
                } else {
                    tracing::warn!(file = %e.path.display(), "Model file missing — removing from registry");
                    false
                }
            })
            .collect();

        Ok(Self {
            entries: valid,
            models_dir,
        })
    }
}
