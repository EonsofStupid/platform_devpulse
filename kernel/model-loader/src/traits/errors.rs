//! Typed errors with recovery suggestions — every failure is actionable.

use std::path::PathBuf;

/// Every error carries enough context for the narration layer to generate
/// a layman-friendly message AND for the UI to offer recovery buttons.
#[derive(Debug, thiserror::Error)]
pub enum LoaderError {
    #[error("Not enough GPU memory: need {needed_mb} MB, only {available_mb} MB free")]
    VramInsufficient {
        needed_mb: u64,
        available_mb: u64,
        suggestions: Vec<RecoverySuggestion>,
    },

    #[error("Model file is corrupt or unreadable: {path}")]
    ModelCorrupt {
        path: PathBuf,
        can_redownload: bool,
    },

    #[error("Architecture '{arch}' is not supported by any available backend")]
    UnsupportedArchitecture {
        arch: String,
        suggested_models: Vec<String>,
    },

    #[error("GPU driver not found — falling back to CPU")]
    NoGpuDriver,

    #[error("Download failed: {reason}")]
    DownloadFailed {
        reason: String,
        can_retry: bool,
        bytes_completed: u64,
    },

    #[error("Disk space insufficient: need {needed_mb} MB, only {available_mb} MB free")]
    DiskFull { needed_mb: u64, available_mb: u64 },

    #[error("Model file missing: was at {path} but no longer exists")]
    ModelFileMissing {
        path: PathBuf,
        slot_id: Option<String>,
        can_redownload: bool,
    },

    #[error("Config data corrupt — resetting to defaults")]
    ConfigCorrupt { recovered: bool },

    #[error("Slot '{slot_id}' does not exist")]
    SlotNotFound { slot_id: String },

    #[error("Model '{model_id}' is not compatible with slot capability '{capability}'")]
    IncompatibleModel {
        model_id: String,
        capability: String,
    },

    #[error("System out of RAM: {used_mb}/{total_mb} MB")]
    RamExhausted { used_mb: u64, total_mb: u64 },

    #[error("No model assigned to slot '{slot_id}'")]
    NoModelAssigned { slot_id: String },

    #[error("Slot '{slot_id}' is already loading")]
    AlreadyLoading { slot_id: String },

    #[error("{message}")]
    Internal { message: String },
}

/// Actionable recovery suggestion — the UI renders these as buttons.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum RecoverySuggestion {
    /// Unload a specific slot to free VRAM.
    UnloadSlot { slot_id: String, frees_mb: u64 },
    /// Fall back to CPU execution (slower but works).
    UseCpuFallback,
    /// Use a smaller model that fits.
    UseSmallerModel { model_id: String, vram_mb: u64 },
    /// Re-download the model file.
    Redownload { repo_id: String, filename: String },
    /// Re-scan the models directory.
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
