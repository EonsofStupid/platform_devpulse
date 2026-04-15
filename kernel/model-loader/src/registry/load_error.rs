//! # Typed load errors with actionable alternatives
//!
//! Replaces the old `anyhow::bail!("...")` strings in the load path
//! with a typed enum so the frontend can render specific UI for each
//! failure mode and surface the alternatives the resolver computed.
//!
//! Every variant carries the minimum data needed for a user-facing
//! error message — arch name, format, the specific alternative
//! candidates, etc. The frontend renders these exhaustively via
//! specta bindings.
//!
//! The old `anyhow::Error` plumbing is preserved for internal plumbing
//! (tracing spans, logging), but the boundary between the kernel and
//! the engine facade should return `Result<T, LoadError>` wherever
//! possible so the typed information makes it to the UI.

use super::architectures::ArchId;
use super::backends::{BackendId, ModelFormat};
use serde::Serialize;
use std::fmt;

/// The single public wire type for every load-path failure. Returned
/// across the Tauri command boundary, serialized by specta, matched
/// exhaustively by the frontend narration + error-surface layers.
///
/// # Why one type
///
/// Historically the kernel raised several different error types
/// (`LoaderError`, `anyhow::Error`, raw strings) and the frontend got
/// opaque `String` errors at the Tauri boundary. This discarded every
/// bit of actionable context — the UI couldn't show alternatives,
/// couldn't offer a retry, couldn't distinguish VRAM exhaustion from
/// a missing file.
///
/// `LoadError` is the funnel point. Internal kernel errors
/// ([`crate::traits::errors::LoaderError`], [`anyhow::Error`]) are
/// converted into `LoadError` at the engine facade boundary via
/// [`From<LoaderError>`] and [`LoadError::from_anyhow`]. From there
/// the frontend gets a typed discriminated union it can pattern-match
/// on to render specific UI for every failure mode.
///
/// # Error trait
///
/// Implements [`std::error::Error`] + [`std::fmt::Display`] so it
/// composes cleanly with `anyhow::Error::new(LoadError::...)` and
/// can be boxed into `Box<dyn Error>`. The `Display` rendering is
/// layman-friendly — the UI can call `err.to_string()` and get a
/// readable message, but should prefer matching on the variant to
/// render interactive affordances (alternatives, retry buttons).
#[derive(Debug, Clone, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum LoadError {
    // ── Compatibility failures (pre-download / pre-load gate) ──────

    /// The architecture is not in the registry at all. The frontend
    /// should show "unknown architecture, consider filing an issue".
    UnknownArchitecture {
        /// Raw `architectures[0]` string from config.json, or the
        /// GGUF `general.architecture` field.
        raw: String,
    },
    /// The architecture is known, but no backend in this build can
    /// load it in the requested format. The `alternatives` list is
    /// ordered by tier — present them in order.
    UnsupportedArchitecture {
        arch: ArchId,
        format: ModelFormat,
        reason: UnsupportedReason,
        alternatives: Vec<Alternative>,
    },

    // ── Filesystem + model-asset failures ─────────────────────────

    /// A required file is missing from the model directory
    /// (`config.json`, `tokenizer.json`, shards, etc.).
    MissingFile {
        /// Which file is missing (key from the loader's expected set).
        which: String,
        /// Directory that was searched (as string — PathBuf doesn't
        /// cross specta cleanly).
        dir: String,
    },
    /// The model file is on disk but corrupt, truncated, or has an
    /// invalid header. UI should offer re-download or re-scan.
    ModelCorrupt {
        /// Path to the corrupt file.
        path: String,
        /// Whether the file can be re-downloaded from HuggingFace.
        can_redownload: bool,
    },
    /// The registry referenced a file but it no longer exists on disk.
    ModelFileMissing {
        /// Path where the model was expected.
        path: String,
        /// Slot that referenced this model, if any.
        slot_id: Option<String>,
        /// Whether the file can be re-downloaded.
        can_redownload: bool,
    },

    // ── Resource failures (VRAM / RAM / disk) ─────────────────────

    /// Not enough GPU memory to load the requested model.
    VramInsufficient {
        /// VRAM required by the model (MB).
        needed_mb: u64,
        /// VRAM currently free (MB).
        available_mb: u64,
    },
    /// System RAM exhausted — model cannot be loaded even on CPU.
    RamExhausted {
        /// RAM currently used (MB).
        used_mb: u64,
        /// Total system RAM (MB).
        total_mb: u64,
    },
    /// No disk space for the download or extraction.
    DiskFull {
        /// Disk space required (MB).
        needed_mb: u64,
        /// Disk space available (MB).
        available_mb: u64,
    },
    /// No NVIDIA GPU driver found — UI should offer CPU fallback.
    NoGpuDriver,

    // ── Network / download failures ───────────────────────────────

    /// HuggingFace download failed (network, auth, or server error).
    DownloadFailed {
        /// Human-readable failure reason.
        reason: String,
        /// Whether retrying might succeed.
        can_retry: bool,
        /// Bytes successfully downloaded before failure (for resume).
        bytes_completed: u64,
    },

    // ── Slot / service state failures ─────────────────────────────

    /// Requested slot ID does not exist in the registry.
    SlotNotFound { slot_id: String },
    /// Slot has no model assigned — cannot load.
    NoModelAssigned { slot_id: String },
    /// Slot is already mid-load — cannot start another load.
    AlreadyLoading { slot_id: String },
    /// Slot is mid-swap. Inference / load must wait.
    SlotSwapping { slot_id: String },
    /// Model cannot serve the slot's required capability.
    IncompatibleModel {
        model_id: String,
        capability: String,
    },
    /// Persisted config data is corrupt — the service reset to defaults.
    ConfigCorrupt { recovered: bool },

    // ── Backend failures ──────────────────────────────────────────

    /// The backend is installed but failed to instantiate the model.
    /// Covers corrupt weights, mismatched config, candle init errors,
    /// ORT session creation failures, etc.
    BackendInit {
        backend: BackendId,
        message: String,
    },
    /// Tokenizer failed to load or build. Usually means a bad
    /// `tokenizer.json` or a GGUF with incomplete embedded tokenizer
    /// metadata.
    TokenizerLoad { message: String },

    // ── Catch-all ─────────────────────────────────────────────────

    /// Plumbing errors that don't fit the above (IO, generic backend
    /// crashes, unexpected failures from deeper in the stack). Keep
    /// this rare — prefer adding a specific variant when a new class
    /// of failure emerges.
    Other { message: String },
}

impl LoadError {
    /// Downcast an `anyhow::Error` into a `LoadError`. If the anyhow
    /// value was constructed via `anyhow::Error::new(LoadError::...)`
    /// or via the `From<LoaderError>` path, the original typed error
    /// is recovered. Otherwise the error's display form is captured
    /// in [`LoadError::Other`].
    ///
    /// This is the canonical boundary conversion: kernel code raises
    /// anyhow errors internally (tensor ops, IO, tracing spans), the
    /// service boundary downcasts them to typed `LoadError` for
    /// specta serialization to the frontend.
    #[must_use]
    pub fn from_anyhow(err: anyhow::Error) -> Self {
        // First try to recover a typed LoadError that was wrapped.
        match err.downcast::<LoadError>() {
            Ok(typed) => typed,
            Err(err) => {
                // Then try to recover a LoaderError (kernel internal)
                // and project it forward.
                match err.downcast::<crate::traits::errors::LoaderError>() {
                    Ok(loader_err) => Self::from(loader_err),
                    Err(err) => Self::Other {
                        message: format!("{err:#}"),
                    },
                }
            }
        }
    }

    /// Construct an `Other` variant from any display-able value.
    /// Shorthand for `LoadError::Other { message: format!("{x}") }`.
    #[must_use]
    pub fn other(message: impl Into<String>) -> Self {
        Self::Other {
            message: message.into(),
        }
    }
}

/// Convert the kernel-internal thiserror-based `LoaderError` into the
/// public wire type. Lossy on `PathBuf` (converted to
/// `String::from_utf8_lossy`) and on `suggestions` (flattened to a
/// structured alternatives list where possible, dropped otherwise).
impl From<crate::traits::errors::LoaderError> for LoadError {
    fn from(e: crate::traits::errors::LoaderError) -> Self {
        use crate::traits::errors::LoaderError as L;
        match e {
            L::VramInsufficient {
                needed_mb,
                available_mb,
                suggestions: _,
            } => Self::VramInsufficient {
                needed_mb,
                available_mb,
            },
            L::ModelCorrupt {
                path,
                can_redownload,
            } => Self::ModelCorrupt {
                path: path.to_string_lossy().into_owned(),
                can_redownload,
            },
            L::UnsupportedArchitecture {
                arch,
                suggested_models: _,
            } => Self::UnknownArchitecture { raw: arch },
            L::NoGpuDriver => Self::NoGpuDriver,
            L::DownloadFailed {
                reason,
                can_retry,
                bytes_completed,
            } => Self::DownloadFailed {
                reason,
                can_retry,
                bytes_completed,
            },
            L::DiskFull {
                needed_mb,
                available_mb,
            } => Self::DiskFull {
                needed_mb,
                available_mb,
            },
            L::ModelFileMissing {
                path,
                slot_id,
                can_redownload,
            } => Self::ModelFileMissing {
                path: path.to_string_lossy().into_owned(),
                slot_id,
                can_redownload,
            },
            L::ConfigCorrupt { recovered } => Self::ConfigCorrupt { recovered },
            L::SlotNotFound { slot_id } => Self::SlotNotFound { slot_id },
            L::IncompatibleModel {
                model_id,
                capability,
            } => Self::IncompatibleModel {
                model_id,
                capability,
            },
            L::RamExhausted { used_mb, total_mb } => Self::RamExhausted { used_mb, total_mb },
            L::NoModelAssigned { slot_id } => Self::NoModelAssigned { slot_id },
            L::AlreadyLoading { slot_id } => Self::AlreadyLoading { slot_id },
            L::SlotSwapping { slot_id } => Self::SlotSwapping { slot_id },
            L::Internal { message } => Self::Other { message },
        }
    }
}

/// Why a known architecture cannot be loaded in the requested format.
#[derive(Debug, Clone, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum UnsupportedReason {
    /// The registry has no backend that declares support for this
    /// `(arch, format)` combination.
    FormatNotWired {
        /// Human-readable explanation, e.g. "Qwen3 VL safetensors \
        /// loader is planned but not shipped in this build".
        detail: String,
    },
    /// A backend declares support but its Cargo feature is off in
    /// this build.
    BackendNotInstalled {
        backend: BackendId,
        feature_flag: String,
    },
    /// The architecture's tier is `Planned` — no loader exists yet.
    PlannedSlot,
    /// The architecture is marked `Legacy` and the owner has opted
    /// out of legacy fallbacks in settings.
    LegacyDisabled,
}

/// A suggested alternative path the user could take. The frontend
/// renders each as a one-click action.
#[derive(Debug, Clone, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct Alternative {
    pub kind: AlternativeKind,
    /// Same repo id if the alternative is a sibling file; `None` if
    /// the frontend should search for a different repo.
    pub repo_id: Option<String>,
    /// Specific filename to target if the alternative is a sibling.
    pub filename: Option<String>,
    /// Human-readable explanation, e.g. "GGUF version in the same \
    /// repo has an arch-native loader".
    pub reason: String,
}

/// Categorical hint for how the frontend should render the
/// alternative suggestion.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum AlternativeKind {
    /// Same repo, different file (most common — suggest GGUF when
    /// safetensors isn't supported).
    SwitchFormat,
    /// Same repo, different quant level (suggest Q5_K_M when Q2 is
    /// too low quality, or vice versa for VRAM fit).
    SwitchQuant,
    /// Different repo entirely (Qwen3 as replacement for Qwen2).
    SwitchModel,
    /// Update the build to pick up a newer backend feature.
    UpgradeBuild,
}

// ── std::error::Error integration ─────────────────────────────────

impl fmt::Display for LoadError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            // Compatibility
            Self::UnknownArchitecture { raw } => write!(
                f,
                "Unknown architecture `{raw}`. The registry doesn't know how to \
                 classify this model. Consider filing an issue to add it."
            ),
            Self::UnsupportedArchitecture {
                arch,
                format,
                reason,
                alternatives,
            } => {
                write!(
                    f,
                    "{arch:?} in {format:?} format is not loadable in this build: {reason}"
                )?;
                if !alternatives.is_empty() {
                    write!(f, " ({} alternative(s) available)", alternatives.len())?;
                }
                Ok(())
            }

            // Filesystem
            Self::MissingFile { which, dir } => {
                write!(f, "Required file `{which}` not found in {dir}")
            }
            Self::ModelCorrupt {
                path,
                can_redownload,
            } => write!(
                f,
                "Model file is corrupt or unreadable: {path}{}",
                if *can_redownload {
                    " (re-download available)"
                } else {
                    ""
                }
            ),
            Self::ModelFileMissing {
                path,
                slot_id,
                can_redownload,
            } => write!(
                f,
                "Model file missing: was at {path}{}{}",
                slot_id
                    .as_ref()
                    .map(|s| format!(" (slot {s})"))
                    .unwrap_or_default(),
                if *can_redownload {
                    " (re-download available)"
                } else {
                    ""
                }
            ),

            // Resources
            Self::VramInsufficient {
                needed_mb,
                available_mb,
            } => write!(
                f,
                "Not enough GPU memory: need {needed_mb} MB, only {available_mb} MB free"
            ),
            Self::RamExhausted { used_mb, total_mb } => {
                write!(f, "System out of RAM: {used_mb}/{total_mb} MB")
            }
            Self::DiskFull {
                needed_mb,
                available_mb,
            } => write!(
                f,
                "Disk space insufficient: need {needed_mb} MB, only {available_mb} MB free"
            ),
            Self::NoGpuDriver => write!(
                f,
                "GPU driver not found — falling back to CPU"
            ),

            // Network
            Self::DownloadFailed {
                reason,
                can_retry,
                bytes_completed,
            } => write!(
                f,
                "Download failed: {reason} ({bytes_completed} bytes received{})",
                if *can_retry { ", retry available" } else { "" }
            ),

            // Slot state
            Self::SlotNotFound { slot_id } => write!(f, "Slot '{slot_id}' does not exist"),
            Self::NoModelAssigned { slot_id } => {
                write!(f, "No model assigned to slot '{slot_id}'")
            }
            Self::AlreadyLoading { slot_id } => {
                write!(f, "Slot '{slot_id}' is already loading")
            }
            Self::SlotSwapping { slot_id } => write!(
                f,
                "Slot '{slot_id}' is swapping models — try again in a moment"
            ),
            Self::IncompatibleModel {
                model_id,
                capability,
            } => write!(
                f,
                "Model '{model_id}' is not compatible with slot capability '{capability}'"
            ),
            Self::ConfigCorrupt { recovered } => write!(
                f,
                "Config data corrupt{}",
                if *recovered {
                    " — recovered to defaults"
                } else {
                    " — recovery failed"
                }
            ),

            // Backend
            Self::BackendInit { backend, message } => {
                write!(f, "Backend {backend:?} failed to init: {message}")
            }
            Self::TokenizerLoad { message } => write!(f, "Tokenizer load failed: {message}"),

            // Catch-all
            Self::Other { message } => write!(f, "{message}"),
        }
    }
}

impl fmt::Display for UnsupportedReason {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::FormatNotWired { detail } => write!(f, "{detail}"),
            Self::BackendNotInstalled {
                backend,
                feature_flag,
            } => write!(
                f,
                "backend {backend:?} is declared but its Cargo feature `{feature_flag}` is \
                 disabled in this build"
            ),
            Self::PlannedSlot => write!(
                f,
                "this architecture has a registry slot but no loader has shipped yet"
            ),
            Self::LegacyDisabled => write!(
                f,
                "this architecture is legacy and the legacy loader is disabled in settings"
            ),
        }
    }
}

impl std::error::Error for LoadError {}
