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
    /// `true` when the operator has stored a key (cloud) or the local
    /// server is reachable (local). Drives the "configured" pill.
    pub configured: bool,
    /// `true` when this entry needs an account-scoped flow that we
    /// haven't built yet (currently only Fireworks). UI shows the
    /// "needs account ID" notice instead of a key form.
    pub requires_account_setup: bool,
    /// `true` for `Transport::LocalHttp` providers (Ollama, LM Studio,
    /// vLLM). The UI hides the API-key form for these.
    pub is_local: bool,
    /// Last successful validation as epoch milliseconds (`None` if never
    /// validated this process). Cleared on restart — the cache is in
    /// memory only.
    pub last_validated_at_ms: Option<i64>,
    /// Last validation error (`None` if last attempt succeeded or no
    /// attempts have run). Surfaces verbatim so the UI can show "401
    /// `authentication_error`: Invalid API key" rather than just "fail".
    pub last_error: Option<String>,
    /// Number of models returned by the most recent successful validation
    /// (`None` if never validated).
    pub model_count: Option<u32>,
}

/// Result of `validate_provider` — either parsed model list or failure.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ValidationResult {
    /// Provider that was validated.
    pub provider: ProviderId,
    /// `true` when the call succeeded and `models` is populated.
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

/// One row from a `/v1/models` response — projected to what the UI shows.
///
/// Vendor responses include more (`created_at`, `owned_by`, capabilities,
/// pricing) but those vary. We surface only the model id; per-vendor
/// detail panels can re-fetch when they need richer metadata.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderModelInfo {
    /// Vendor model identifier — what callers pass as `model:` in chat
    /// requests (e.g. "gpt-4o", "claude-sonnet-4-20250514", "llama3:70b").
    pub id: String,
    /// Optional owner label — `OpenAI` returns "openai"/"system", Hugging
    /// Face returns the namespace, Ollama returns the digest. UI shows
    /// it as a subtitle when present.
    pub owned_by: Option<String>,
}

// Provider call failures use the unified `commands::_util::ErrorKind`
// classification. The earlier `ProviderErrorKind` enum was deleted in
// the F-1 foundation pass — every variant maps to the same-named
// variant on `ErrorKind` (AuthFailed / RateLimit / QuotaExhausted /
// Network / Server / Parse / NotConfigured / NotImplemented).
