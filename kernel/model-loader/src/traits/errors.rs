//! Typed errors with recovery suggestions — every failure is actionable.
//!
//! Every error variant carries enough context for:
//! 1. The narration layer to generate a layman-friendly message
//! 2. The UI to render recovery action buttons
//! 3. The log sink to write a forensic record

use std::path::PathBuf;

/// Every error carries enough context for the narration layer to generate
/// a layman-friendly message AND for the UI to offer recovery buttons.
#[derive(Debug, thiserror::Error)]
pub enum LoaderError {
    /// Not enough GPU memory to load the requested model.
    #[error("Not enough GPU memory: need {needed_mb} MB, only {available_mb} MB free")]
    VramInsufficient {
        /// VRAM required by the model (MB).
        needed_mb: u64,
        /// VRAM currently free (MB).
        available_mb: u64,
        /// Actionable recovery options.
        suggestions: Vec<RecoverySuggestion>,
    },

    /// Model file on disk is corrupt, truncated, or has invalid headers.
    #[error("Model file is corrupt or unreadable: {path}")]
    ModelCorrupt {
        /// Path to the corrupt model file.
        path: PathBuf,
        /// Whether the model can be re-downloaded from HuggingFace.
        can_redownload: bool,
    },

    /// The model's architecture is not supported by any compiled backend.
    #[error("Architecture '{arch}' is not supported by any available backend")]
    UnsupportedArchitecture {
        /// Architecture string from the GGUF header (e.g. `"rwkv"`).
        arch: String,
        /// Alternative models with supported architectures.
        suggested_models: Vec<String>,
    },

    /// No NVIDIA GPU driver found — system is CPU-only.
    #[error("GPU driver not found — falling back to CPU")]
    NoGpuDriver,

    /// HuggingFace download failed (network, auth, or server error).
    #[error("Download failed: {reason}")]
    DownloadFailed {
        /// Human-readable failure reason.
        reason: String,
        /// Whether retrying might succeed.
        can_retry: bool,
        /// Bytes successfully downloaded before failure (for resume).
        bytes_completed: u64,
    },

    /// Disk space insufficient for the download or model extraction.
    #[error("Disk space insufficient: need {needed_mb} MB, only {available_mb} MB free")]
    DiskFull {
        /// Disk space required (MB).
        needed_mb: u64,
        /// Disk space available (MB).
        available_mb: u64,
    },

    /// Model file was in the registry but no longer exists on disk.
    #[error("Model file missing: was at {path} but no longer exists")]
    ModelFileMissing {
        /// Path where the model was expected.
        path: PathBuf,
        /// Slot that referenced this model (if any).
        slot_id: Option<String>,
        /// Whether the model can be re-downloaded from HuggingFace.
        can_redownload: bool,
    },

    /// Persisted config data is corrupt — reset to defaults.
    #[error("Config data corrupt — resetting to defaults")]
    ConfigCorrupt {
        /// Whether the config was successfully recovered to defaults.
        recovered: bool,
    },

    /// Requested slot ID does not exist in the registry.
    #[error("Slot '{slot_id}' does not exist")]
    SlotNotFound {
        /// The slot ID that was not found.
        slot_id: String,
    },

    /// Model cannot serve the slot's required capability.
    #[error("Model '{model_id}' is not compatible with slot capability '{capability}'")]
    IncompatibleModel {
        /// Registry ID of the incompatible model.
        model_id: String,
        /// Capability the slot requires.
        capability: String,
    },

    /// System RAM exhausted — model cannot be loaded even on CPU.
    #[error("System out of RAM: {used_mb}/{total_mb} MB")]
    RamExhausted {
        /// RAM currently used (MB).
        used_mb: u64,
        /// Total system RAM (MB).
        total_mb: u64,
    },

    /// Slot has no model assigned — cannot load.
    #[error("No model assigned to slot '{slot_id}'")]
    NoModelAssigned {
        /// Slot that has no model.
        slot_id: String,
    },

    /// Slot is already in a loading state — cannot start another load.
    #[error("Slot '{slot_id}' is already loading")]
    AlreadyLoading {
        /// Slot that is busy loading.
        slot_id: String,
    },

    /// Slot is mid-swap (unload → reassign → load). Inference must wait.
    #[error("Slot '{slot_id}' is swapping models — try again in a moment")]
    SlotSwapping {
        /// Slot that is mid-swap.
        slot_id: String,
    },

    /// Internal error — catch-all for unexpected failures.
    #[error("{message}")]
    Internal {
        /// Error description.
        message: String,
    },
}

/// Actionable recovery suggestion — the UI renders these as buttons.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum RecoverySuggestion {
    /// Unload a specific slot to free VRAM.
    UnloadSlot {
        /// Slot ID to unload.
        slot_id: String,
        /// VRAM that would be freed (MB).
        frees_mb: u64,
    },
    /// Fall back to CPU execution (slower but works).
    UseCpuFallback,
    /// Use a smaller model that fits in available VRAM.
    UseSmallerModel {
        /// Registry ID of the smaller model.
        model_id: String,
        /// VRAM the smaller model needs (MB).
        vram_mb: u64,
    },
    /// Re-download the model file from HuggingFace.
    Redownload {
        /// HuggingFace repository ID.
        repo_id: String,
        /// Filename to download.
        filename: String,
    },
    /// Re-scan the models directory to discover new/changed files.
    RescanModels,
}

impl LoaderError {
    /// Extract recovery suggestions if any.
    #[must_use]
    pub fn suggestions(&self) -> Vec<RecoverySuggestion> {
        match self {
            Self::VramInsufficient { suggestions, .. } => suggestions.clone(),
            Self::ModelCorrupt {
                can_redownload: true,
                ..
            } => vec![RecoverySuggestion::RescanModels],
            Self::ModelFileMissing {
                can_redownload: true,
                ..
            } => vec![RecoverySuggestion::RescanModels],
            Self::DownloadFailed {
                can_retry: true, ..
            } => vec![RecoverySuggestion::RescanModels],
            Self::NoGpuDriver => vec![RecoverySuggestion::UseCpuFallback],
            _ => Vec::new(),
        }
    }
}

// No manual From<LoaderError> for anyhow::Error needed —
// thiserror's #[derive(Error)] + std::error::Error gives us the blanket impl.
