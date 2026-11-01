//! Frontend-facing types for the API Providers devtool.
//!
//! All shapes derive `serde::Serialize` + `specta::Type` so they cross
//! the IPC boundary cleanly. Wire format is camelCase across the board
//! to match the rest of the bindings file.
//!
//! Boundary contract:
//! - `ProviderStatus` is what the Status tab renders (one row per
//!   visible provider in the SSOT registry).
//! - `ValidationResult` is the response from `validate_provider` —
//!   either the parsed model list or a classified failure.
//! - `ProviderModelInfo` is the projection of `/v1/models` items the UI shows.
//! - `ProviderErrorKind` is the wire-stable failure classification —
//!   the lane router (Sprint 7) reads this to decide retry vs back off.

use devpulse_engine::ai_providers::ProviderId;
use serde::Serialize;
use specta::Type;

use crate::commands::_util::ErrorKind;

/// Aggregated row for the Status tab grid — one per visible provider.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderStatus {
    /// Stable wire identifier from the SSOT registry.
    pub id: ProviderId,
    /// Layman-friendly vendor + product name (copied from the SSOT so
    /// the frontend doesn't need a second registry lookup).
    pub display_name: String,
    /// Configuration is present: a key for cloud APIs or an HTTP transport for
    /// local presets. This does not establish reachability or inference readiness.
    pub configured: bool,
    /// `true` when this entry needs an account-scoped flow that we
    /// haven't built yet (currently only Fireworks). UI shows the
    /// "needs account ID" notice instead of a key form.
    pub requires_account_setup: bool,
    /// Local billing classification. Local HTTP endpoints can still require keys.
    pub is_local: bool,
    /// Explicit API endpoint used by the current model-list observation.
    pub last_endpoint: Option<String>,
    /// Last completed model-list attempt for current credentials, in epoch ms.
    /// Cleared on a new check, credential mutation or application restart.
    pub last_validated_at_ms: Option<i64>,
    /// Last validation error (`None` if last attempt succeeded or no
    /// attempts have run). Surfaces verbatim so the UI can show "401
    /// `authentication_error`: Invalid API key" rather than just "fail".
    pub last_error: Option<String>,
    /// Model count from the current attempt; zero on failure, absent when unverified.
    pub model_count: Option<u32>,
}

/// Result of `validate_provider` — either parsed model list or failure.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ValidationResult {
    /// Provider that was validated.
    pub provider: ProviderId,
    /// Explicit API endpoint checked, independent of provider presets.
    pub endpoint: String,
    /// Model listing succeeded (possibly empty); this does not verify inference.
    pub ok: bool,
    /// Wall-clock latency in milliseconds. Useful in the devtool to spot
    /// slow regions / cold starts.
    pub latency_ms: u64,
    /// Parsed model list (empty when `ok = false`).
    pub models: Vec<ProviderModelInfo>,
    /// Classified failure (`None` when `ok = true`).
    pub error_kind: Option<ErrorKind>,
    /// Human-readable failure message (`None` when `ok = true`).
    pub error_message: Option<String>,
}

pub use devpulse_engine::ai_providers::models::ProviderModelInfo;
