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
#[derive(Debug, Clone, Serialize, specta::Type)]
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
        /// Canonical architecture the user attempted to load.
        arch: ArchId,
        /// File format the user attempted to load.
        format: ModelFormat,
        /// Why the known architecture could not be resolved.
        reason: UnsupportedReason,
        /// Ordered alternatives the UI can offer as follow-up actions.
        alternatives: Vec<Alternative>,
    },

    // ── Filesystem + model-asset failures ─────────────────────────
    /// A required file is missing from the model directory
    /// (`config.json`, `tokenizer.json`, shards, etc.).
    MissingFile {
        /// Which file is missing (key from the loader's expected set).
        which: String,
        /// Directory that was searched (as string — `PathBuf` doesn't
        /// cross specta cleanly).
        dir: String,
    },
    /// The model file is on disk but corrupt, truncated, or has an
    /// invalid header. UI should offer re-download or re-scan.
    ModelCorrupt {
        /// Path to the corrupt file.
        path: String,
        /// Whether the file can be re-downloaded from `HuggingFace`.
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
    /// `HuggingFace` download failed (network, auth, or server error).
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
    SlotNotFound {
        /// Slot identifier requested by the caller.
        slot_id: String,
    },
    /// Slot has no model assigned — cannot load.
    NoModelAssigned {
        /// Slot identifier that is still empty.
        slot_id: String,
    },
    /// Slot is already mid-load — cannot start another load.
    AlreadyLoading {
        /// Slot identifier already in the loading state.
        slot_id: String,
    },
    /// Slot is mid-swap. Inference / load must wait.
    SlotSwapping {
        /// Slot identifier currently being swapped.
        slot_id: String,
    },
    /// Model cannot serve the slot's required capability.
    IncompatibleModel {
        /// Model identifier that failed the capability check.
        model_id: String,
        /// Capability required by the slot.
        capability: String,
    },
    /// Persisted config data is corrupt — the service reset to defaults.
    ConfigCorrupt {
        /// Whether the loader recovered by resetting to defaults.
        recovered: bool,
    },

    // ── Backend failures ──────────────────────────────────────────
    /// The backend is installed but failed to instantiate the model.
    /// Covers corrupt weights, mismatched config, candle init errors,
    /// ORT session creation failures, etc.
    BackendInit {
        /// Backend that raised the initialization failure.
        backend: BackendId,
        /// Human-readable backend error detail.
        message: String,
    },
    /// Tokenizer failed to load or build. Usually means a bad
    /// `tokenizer.json` or a GGUF with incomplete embedded tokenizer
    /// metadata.
    TokenizerLoad {
        /// Human-readable tokenizer failure detail.
        message: String,
    },
    /// Inference call failed for a specific slot — user can retry, or
    /// surface to a "report this" affordance after repeated failures.
    InferenceFailed {
        /// Slot whose inference call failed.
        slot_id: String,
        /// Human-readable failure reason from the backend.
        reason: String,
    },

    // ── Infrastructure failures (IO / config / boot / HF API) ─────
    /// Filesystem IO failed at a specific path (mkdir, file read, scan
    /// walk). Usually permission-denied or path-no-longer-exists.
    IoFailed {
        /// Path the IO operation targeted (lossy UTF-8).
        path: String,
        /// Human-readable failure reason.
        reason: String,
    },
    /// Boot-time initialisation failed before the service can serve
    /// requests. Distinct from runtime failures — usually requires the
    /// app to restart with a fixed environment.
    BootFailed {
        /// Boot phase that failed.
        step: String,
        /// Human-readable failure reason.
        reason: String,
    },
    /// `ConfigBackend` trait operation failed (libsql write, memory-
    /// config invariant violation, etc.). Usually transient unless
    /// the backing store is itself corrupt.
    ConfigBackendFailed {
        /// Operation that failed (`get`, `set`, `list_by_prefix`, ...).
        operation: String,
        /// Config key targeted by the operation.
        key: String,
        /// Human-readable failure reason.
        reason: String,
    },
    /// `HuggingFace` HTTP API call failed. Distinct from `DownloadFailed`
    /// — this covers metadata APIs (search, repo info, file listing),
    /// not bulk file downloads. UI surface usually shows "try again".
    HuggingFaceApi {
        /// Human-readable failure reason.
        reason: String,
        /// Whether the failure was transient (network, rate-limit, 5xx)
        /// vs. hard (auth, 404).
        can_retry: bool,
    },

    // ── Catch-all ─────────────────────────────────────────────────
    /// Plumbing errors that don't fit the above (IO, generic backend
    /// crashes, unexpected failures from deeper in the stack). Keep
    /// this rare — prefer adding a specific variant when a new class
    /// of failure emerges.
    Other {
        /// Human-readable fallback message for uncategorized failures.
        message: String,
    },
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
        // Recover a typed LoadError that was wrapped, else capture the display.
        // (The kernel-internal `LoaderError` projection lives on Clyffy now; the
        // engine only sees anyhow errors carrying an already-typed LoadError.)
        match err.downcast::<LoadError>() {
            Ok(typed) => typed,
            Err(err) => Self::Other {
                message: format!("{err:#}"),
            },
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

/// Why a known architecture cannot be loaded in the requested format.
#[derive(Debug, Clone, Serialize, specta::Type)]
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
        /// Backend that would satisfy the request if enabled.
        backend: BackendId,
        /// Cargo feature that must be enabled for that backend.
        feature_flag: String,
    },
    /// The architecture's tier is `Planned` — no loader exists yet.
    PlannedSlot,
    /// The architecture is marked `Legacy` and the owner has opted
    /// out of legacy fallbacks in settings.
    LegacyDisabled,
    /// The chosen backend is wired for this `(arch, format)` pair on
    /// paper, but inspection of the file's tensor names shows the
    /// layout it carries is incompatible with the loader's expectations
    /// (e.g. fused-QKV GGUF passed to a split-QKV loader, embedder
    /// GGUF passed to a decoder loader). Pre-flight probe caught this
    /// before the loader panicked.
    TensorLayoutMismatch {
        /// Tensor names the backend was looking for (e.g. \
        /// `["blk.0.attn_q.weight", "blk.0.attn_qkv.weight"]`).
        expected_tensor_names: Vec<String>,
        /// First-block tensor names actually present in the file. Helps
        /// the user (or maintainer) identify the layout.
        found_first_block_tensors: Vec<String>,
    },
    /// The architecture is known and the file's tensor layout looks
    /// plausible, but this build's backend allow-list does NOT include
    /// this arch for the requested format. Distinct from
    /// `FormatNotWired` (which means no backend declares support at all)
    /// — here the backend refuses to dispatch because it cannot
    /// guarantee a correct load.
    BackendCannotLoadArch {
        /// Backend that refused the load.
        backend: BackendId,
        /// Optional suggestion for which backend (if any) is more
        /// likely to succeed with this arch. UI surfaces as
        /// "try via X backend".
        suggested_backend: Option<BackendId>,
    },
}

/// A suggested alternative path the user could take. The frontend
/// renders each as a one-click action.
#[derive(Debug, Clone, Serialize, specta::Type)]
pub struct Alternative {
    /// Category of follow-up action the UI should offer.
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
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, specta::Type)]
#[serde(rename_all = "kebab-case")]
pub enum AlternativeKind {
    /// Same repo, different file (most common — suggest GGUF when
    /// safetensors isn't supported).
    SwitchFormat,
    /// Same repo, different quant level (suggest `Q5_K_M` when `Q2` is
    /// too low quality, or vice versa for `VRAM` fit).
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
            Self::UnknownArchitecture { .. } | Self::UnsupportedArchitecture { .. } => {
                fmt_compatibility(self, f)
            }
            Self::MissingFile { .. }
            | Self::ModelCorrupt { .. }
            | Self::ModelFileMissing { .. } => fmt_filesystem(self, f),
            Self::VramInsufficient { .. }
            | Self::RamExhausted { .. }
            | Self::DiskFull { .. }
            | Self::NoGpuDriver => fmt_resource(self, f),
            Self::DownloadFailed {
                reason,
                can_retry,
                bytes_completed,
            } => write!(
                f,
                "Download failed: {reason} ({bytes_completed} bytes received{})",
                if *can_retry { ", retry available" } else { "" }
            ),
            Self::SlotNotFound { .. }
            | Self::NoModelAssigned { .. }
            | Self::AlreadyLoading { .. }
            | Self::SlotSwapping { .. }
            | Self::IncompatibleModel { .. }
            | Self::ConfigCorrupt { .. } => fmt_slot_state(self, f),
            Self::BackendInit { .. }
            | Self::TokenizerLoad { .. }
            | Self::InferenceFailed { .. } => fmt_backend(self, f),
            Self::IoFailed { .. }
            | Self::BootFailed { .. }
            | Self::ConfigBackendFailed { .. }
            | Self::HuggingFaceApi { .. } => fmt_infrastructure(self, f),
            Self::Other { message } => write!(f, "{message}"),
        }
    }
}

/// Render compatibility-class variants (`UnknownArchitecture`,
/// `UnsupportedArchitecture`).
fn fmt_compatibility(err: &LoadError, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match err {
        LoadError::UnknownArchitecture { raw } => write!(
            f,
            "Unknown architecture `{raw}`. The registry doesn't know how to \
             classify this model. Consider filing an issue to add it."
        ),
        LoadError::UnsupportedArchitecture {
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
        _ => Ok(()),
    }
}

/// Render filesystem-class variants (`MissingFile`, `ModelCorrupt`,
/// `ModelFileMissing`).
fn fmt_filesystem(err: &LoadError, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match err {
        LoadError::MissingFile { which, dir } => {
            write!(f, "Required file `{which}` not found in {dir}")
        }
        LoadError::ModelCorrupt {
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
        LoadError::ModelFileMissing {
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
        _ => Ok(()),
    }
}

/// Render resource-class variants (`VramInsufficient`, `RamExhausted`,
/// `DiskFull`, `NoGpuDriver`).
fn fmt_resource(err: &LoadError, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match err {
        LoadError::VramInsufficient {
            needed_mb,
            available_mb,
        } => write!(
            f,
            "Not enough GPU memory: need {needed_mb} MB, only {available_mb} MB free"
        ),
        LoadError::RamExhausted { used_mb, total_mb } => {
            write!(f, "System out of RAM: {used_mb}/{total_mb} MB")
        }
        LoadError::DiskFull {
            needed_mb,
            available_mb,
        } => write!(
            f,
            "Disk space insufficient: need {needed_mb} MB, only {available_mb} MB free"
        ),
        LoadError::NoGpuDriver => write!(f, "GPU driver not found — falling back to CPU"),
        _ => Ok(()),
    }
}

/// Render slot-state-class variants (`SlotNotFound`, `NoModelAssigned`,
/// `AlreadyLoading`, `SlotSwapping`, `IncompatibleModel`,
/// `ConfigCorrupt`).
fn fmt_slot_state(err: &LoadError, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match err {
        LoadError::SlotNotFound { slot_id } => write!(f, "Slot '{slot_id}' does not exist"),
        LoadError::NoModelAssigned { slot_id } => {
            write!(f, "No model assigned to slot '{slot_id}'")
        }
        LoadError::AlreadyLoading { slot_id } => {
            write!(f, "Slot '{slot_id}' is already loading")
        }
        LoadError::SlotSwapping { slot_id } => write!(
            f,
            "Slot '{slot_id}' is swapping models — try again in a moment"
        ),
        LoadError::IncompatibleModel {
            model_id,
            capability,
        } => write!(
            f,
            "Model '{model_id}' is not compatible with slot capability '{capability}'"
        ),
        LoadError::ConfigCorrupt { recovered } => write!(
            f,
            "Config data corrupt{}",
            if *recovered {
                " — recovered to defaults"
            } else {
                " — recovery failed"
            }
        ),
        _ => Ok(()),
    }
}

/// Render backend-class variants (`BackendInit`, `TokenizerLoad`,
/// `InferenceFailed`).
fn fmt_backend(err: &LoadError, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match err {
        LoadError::BackendInit { backend, message } => {
            write!(f, "Backend {backend:?} failed to init: {message}")
        }
        LoadError::TokenizerLoad { message } => write!(f, "Tokenizer load failed: {message}"),
        LoadError::InferenceFailed { slot_id, reason } => {
            write!(f, "Inference failed for slot '{slot_id}': {reason}")
        }
        _ => Ok(()),
    }
}

/// Render infrastructure-class variants (`IoFailed`, `BootFailed`,
/// `ConfigBackendFailed`, `HuggingFaceApi`).
fn fmt_infrastructure(err: &LoadError, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match err {
        LoadError::IoFailed { path, reason } => {
            write!(f, "Filesystem IO failed at {path}: {reason}")
        }
        LoadError::BootFailed { step, reason } => {
            write!(f, "Model loader boot failed during {step}: {reason}")
        }
        LoadError::ConfigBackendFailed {
            operation,
            key,
            reason,
        } => write!(
            f,
            "Config backend {operation} failed for key '{key}': {reason}"
        ),
        LoadError::HuggingFaceApi { reason, can_retry } => write!(
            f,
            "HuggingFace API call failed: {reason}{}",
            if *can_retry { " (retry available)" } else { "" }
        ),
        _ => Ok(()),
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
            Self::TensorLayoutMismatch {
                expected_tensor_names,
                found_first_block_tensors,
            } => write!(
                f,
                "tensor layout mismatch: expected one of [{}], found [{}]",
                expected_tensor_names.join(", "),
                found_first_block_tensors.join(", ")
            ),
            Self::BackendCannotLoadArch {
                backend,
                suggested_backend,
            } => {
                write!(f, "backend {backend:?} cannot load this architecture")?;
                if let Some(s) = suggested_backend {
                    write!(f, " (try {s:?} instead)")?;
                }
                Ok(())
            }
        }
    }
}

impl std::error::Error for LoadError {}
