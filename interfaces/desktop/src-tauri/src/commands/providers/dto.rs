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
//! - `ModelInfo` is the projection of `/v1/models` items the UI shows.
//! - `ProviderErrorKind` is the wire-stable failure classification —
//!   the lane router (Sprint 7) reads this to decide retry vs back off.

use devpulse_engine::ai_providers::ProviderId;
use serde::Serialize;
use specta::Type;

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
    /// authentication_error: Invalid API key" rather than just "fail".
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
    pub models: Vec<ModelInfo>,
    /// Classified failure (`None` when `ok = true`).
    pub error_kind: Option<ProviderErrorKind>,
    /// Human-readable failure message (`None` when `ok = true`).
    pub error_message: Option<String>,
}

/// One row from a `/v1/models` response — projected to what the UI shows.
///
/// Vendor responses include more (created_at, owned_by, capabilities,
/// pricing) but those vary. We surface only the model id; per-vendor
/// detail panels can re-fetch when they need richer metadata.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    /// Vendor model identifier — what callers pass as `model:` in chat
    /// requests (e.g. "gpt-4o", "claude-sonnet-4-20250514", "llama3:70b").
    pub id: String,
    /// Optional owner label — OpenAI returns "openai"/"system", Hugging
    /// Face returns the namespace, Ollama returns the digest. UI shows
    /// it as a subtitle when present.
    pub owned_by: Option<String>,
}

/// Wire-stable classification of provider call failures.
///
/// Sprint 7's lane router reads this to decide retry policy:
/// `RateLimit` → back off and retry, `QuotaExhausted` → fail fast,
/// `AuthFailed` → fail and surface to operator, `Network`/`Server` →
/// retry with jitter.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderErrorKind {
    /// 401 / 403 — the stored API key is wrong or revoked.
    AuthFailed,
    /// 429 with `rate_limit_exceeded` semantics — temporary, retry with
    /// jitter / back off.
    RateLimit,
    /// 429 with `insufficient_quota` (OpenAI) or `billing_error`
    /// (Anthropic) — the account is out of credit. Don't retry.
    QuotaExhausted,
    /// Connection refused / DNS / TLS / read timeout — the request
    /// never reached the vendor's app layer.
    Network,
    /// 5xx from the vendor — they ack'd but failed. Retry with jitter.
    Server,
    /// Body parse / shape mismatch — vendor returned 200 but we couldn't
    /// project it. Logs the raw body for diagnosis.
    Parse,
    /// Pre-flight failure: no key in the vault, missing account_id, etc.
    /// Never reached the network.
    NotConfigured,
    /// Implementation gap (currently Fireworks `/v1/accounts/...`). The
    /// devtool surfaces this as an explicit "coming soon" state rather
    /// than pretending the provider doesn't exist.
    NotImplemented,
}
