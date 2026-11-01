//! Per-vendor request construction + response classification.
//!
//! One shared `reqwest::Client` with timeouts. Each provider has a
//! request-builder that knows its non-standard auth header, base URL,
//! and authentication headers. Response handling is
//! uniform — the caller gets either a parsed model list or a
//! classified `ModelDiscoveryError`.
//!
//! This module is the boundary the lane router (Sprint 7) will reuse:
//! when chat requests start flowing, the router builds them with the
//! same per-vendor patterns, and `classify_status` keeps making the
//! retry/back-off decisions the router consults.

use std::sync::OnceLock;
use std::time::Duration;

use crate::providers::registry;
use crate::providers::types::{AiProvider, BillingModel, ProviderId};
use reqwest::{header::HeaderValue, Client, RequestBuilder, Response, StatusCode};
use serde::Deserialize;

mod types;
pub use types::{ModelDiscoveryError, ModelDiscoveryErrorKind, ProviderModelInfo};

/// Conservative timeouts — model listing is metadata-only and cheap.
/// Connect generous enough for cold remote endpoints, total tighter so
/// a hung server can't park the devtool.
const CONNECT_TIMEOUT: Duration = Duration::from_secs(5);
const TOTAL_TIMEOUT: Duration = Duration::from_secs(15);

/// Process-wide HTTP client. Built lazily so the cost is paid only when
/// the operator actually opens the API Providers devtool.
///
/// Initialization failure remains explicit; no fallback may discard deadlines
/// or forward custom authentication headers through redirects.
fn shared_client() -> Result<&'static Client, ModelDiscoveryError> {
    static CLIENT: OnceLock<Result<Client, String>> = OnceLock::new();
    CLIENT
        .get_or_init(|| {
            Client::builder()
                .connect_timeout(CONNECT_TIMEOUT)
                .timeout(TOTAL_TIMEOUT)
                .redirect(reqwest::redirect::Policy::none())
                .user_agent(concat!("DevPulse/", env!("CARGO_PKG_VERSION")))
                .build()
                .map_err(|error| format!("Provider HTTP client initialization failed: {error}"))
        })
        .as_ref()
        .map_err(|error| ModelDiscoveryError::new(ModelDiscoveryErrorKind::Internal, error.clone()))
}

/// Hit the provider's models endpoint and project the response.
///
/// `endpoint` is an explicit API base URL, including its version/path prefix.
/// Registry defaults are never used to select a server for this operation.
///
/// `api_key` may be `None` for local providers (Ollama / LM Studio /
/// vLLM) — they don't require auth on default deployments.
///
/// # Errors
/// Every failure path produces a `ModelDiscoveryError` with the right kind so
/// the UI shows a precise reason and the lane router can act on it.
pub async fn fetch_models(
    provider: ProviderId,
    endpoint: &str,
    api_key: Option<&str>,
) -> Result<Vec<ProviderModelInfo>, ModelDiscoveryError> {
    let entry = registry::find(provider).ok_or_else(|| {
        ModelDiscoveryError::new(
            ModelDiscoveryErrorKind::NotConfigured,
            format!("Unknown provider: {provider:?}"),
        )
    })?;

    let request = build_request(provider, entry, endpoint, api_key)?;
    let result = async {
        let response = request.send().await.map_err(|e| network_error(&e))?;
        parse_response(provider, response, api_key).await
    }
    .await;
    result.map_err(|mut error| {
        if let Some(key) = api_key.filter(|key| !key.is_empty()) {
            error.message = error.message.replace(key, "[redacted]");
            error.context = error
                .context
                .map(|context| context.replace(key, "[redacted]"));
        }
        error
    })
}

/// Build the vendor-specific request for `GET <models endpoint>`.
fn build_request(
    provider: ProviderId,
    entry: &AiProvider,
    endpoint: &str,
    api_key: Option<&str>,
) -> Result<RequestBuilder, ModelDiscoveryError> {
    // Fireworks is account-scoped — the endpoint requires an account_id
    // that we don't yet collect. Surface explicitly rather than calling
    // a 404-bound URL.
    if matches!(provider, ProviderId::Fireworks) {
        return Err(ModelDiscoveryError::new(
            ModelDiscoveryErrorKind::NotImplemented,
            "Fireworks needs the account-scoped endpoint \
             `/v1/accounts/{account_id}/models` — account_id flow lands \
             in a later sprint.",
        ));
    }

    if !entry.supports_api_key() {
        return Err(ModelDiscoveryError::new(
            ModelDiscoveryErrorKind::NotImplemented,
            "This provider uses its own sign-in program, not HTTP model discovery",
        ));
    }
    let base = normalize_endpoint(endpoint)?;
    let url = format!("{base}/models");
    let client = shared_client()?;

    // Gemini supports x-goog-api-key; credentials never belong in URLs.
    if matches!(provider, ProviderId::GoogleGemini) {
        let key = require_key(api_key)?;
        return Ok(client
            .get(url)
            .header("x-goog-api-key", secret_header(key)?));
    }

    // Anthropic uses x-api-key + the version pin, not Bearer.
    if matches!(provider, ProviderId::AnthropicApi) {
        let key = require_key(api_key)?;
        return Ok(client
            .get(url)
            .header("x-api-key", secret_header(key)?)
            .header("anthropic-version", "2023-06-01"));
    }

    // Local providers may or may not require a key; pass it through
    // as a Bearer if the operator supplied one (vLLM in api-key mode),
    // otherwise call without auth.
    let mut req = client.get(url);
    if let Some(key) = api_key.filter(|key| !key.trim().is_empty()) {
        req = req.header("authorization", secret_header(&format!("Bearer {key}"))?);
    } else if matches!(entry.billing, BillingModel::PerToken) {
        // Cloud + API-key billed but no key supplied → pre-flight failure.
        return Err(ModelDiscoveryError::new(
            ModelDiscoveryErrorKind::NotConfigured,
            format!("No API key configured for {}", entry.display_name),
        ));
    }
    Ok(req)
}

/// Require an API key or return a `NotConfigured` error.
fn require_key(api_key: Option<&str>) -> Result<&str, ModelDiscoveryError> {
    api_key.filter(|k| !k.trim().is_empty()).ok_or_else(|| {
        ModelDiscoveryError::new(
            ModelDiscoveryErrorKind::NotConfigured,
            "API key required for this provider",
        )
    })
}

fn secret_header(value: &str) -> Result<HeaderValue, ModelDiscoveryError> {
    let mut header = HeaderValue::from_str(value).map_err(|_| {
        ModelDiscoveryError::new(
            ModelDiscoveryErrorKind::NotConfigured,
            "API key is not valid for an HTTP header",
        )
    })?;
    header.set_sensitive(true);
    Ok(header)
}

/// Validate an explicit API base URL, including its version/path prefix.
/// Registry URLs are presets only and are never used as a fallback here.
///
/// # Errors
/// Rejects non-HTTP(S) URLs, missing hosts, and credentials/query/fragment data.
pub fn normalize_endpoint(endpoint: &str) -> Result<String, ModelDiscoveryError> {
    let invalid = || {
        ModelDiscoveryError::new(ModelDiscoveryErrorKind::NotConfigured,
        "Provide an HTTP(S) API base URL without embedded credentials, query parameters or a fragment")
    };
    let url = reqwest::Url::parse(endpoint.trim()).map_err(|_| invalid())?;
    if !matches!(url.scheme(), "http" | "https")
        || url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err(invalid());
    }
    Ok(url.as_str().trim_end_matches('/').to_owned())
}

/// Map a reqwest send-time failure to our classified shape.
fn network_error(e: &reqwest::Error) -> ModelDiscoveryError {
    // is_timeout / is_connect / other all bucket to Network — the
    // distinction between them is rarely actionable for the UI.
    ModelDiscoveryError::new(
        ModelDiscoveryErrorKind::Network,
        format!("Network call failed: {e}"),
    )
}

/// Inspect the response status, parse the body on success, classify on failure.
async fn parse_response(
    provider: ProviderId,
    response: Response,
    api_key: Option<&str>,
) -> Result<Vec<ProviderModelInfo>, ModelDiscoveryError> {
    let status = response.status();
    if status.is_success() {
        let body = response.text().await.map_err(|e| {
            ModelDiscoveryError::new(
                ModelDiscoveryErrorKind::Parse,
                format!("Could not read response body: {e}"),
            )
        })?;
        return parse_models(provider, &body);
    }

    let body = response.text().await.unwrap_or_default();
    let kind = classify_status(status, &body);
    let body = match api_key.filter(|key| !key.is_empty()) {
        Some(key) => body.replace(key, "[redacted]"),
        None => body,
    };
    Err(ModelDiscoveryError::with_context(
        kind,
        format!("HTTP {status}"),
        truncate(&body, 280),
    ))
}

/// Classify a non-2xx response by status code + body shape.
///
/// Distinguishing `RateLimit` from `QuotaExhausted` matters for the
/// router: rate-limited calls retry with backoff, quota-exhausted
/// calls fail fast and surface to the operator.
#[must_use]
pub fn classify_status(status: StatusCode, body: &str) -> ModelDiscoveryErrorKind {
    let body_lower = body.to_ascii_lowercase();
    match status.as_u16() {
        401 | 403 => ModelDiscoveryErrorKind::AuthFailed,
        429 => {
            if body_lower.contains("insufficient_quota")
                || body_lower.contains("billing_error")
                || body_lower.contains("quota")
            {
                ModelDiscoveryErrorKind::QuotaExhausted
            } else {
                ModelDiscoveryErrorKind::RateLimit
            }
        }
        _ => ModelDiscoveryErrorKind::Server,
    }
}

/// Project the vendor-specific JSON shape into the normalized model list.
///
/// Three shapes covered:
/// 1. OpenAI-compatible: `{"data": [{"id": ..., "owned_by": ...}]}`
/// 2. Anthropic: `{"data": [{"id": ..., "display_name": ..., "type": "model"}]}`
/// 3. Gemini: `{"models": [{"name": "models/..."}]}`
fn parse_models(
    provider: ProviderId,
    body: &str,
) -> Result<Vec<ProviderModelInfo>, ModelDiscoveryError> {
    if matches!(provider, ProviderId::GoogleGemini) {
        let parsed: GeminiModels = serde_json::from_str(body).map_err(|e| {
            ModelDiscoveryError::new(
                ModelDiscoveryErrorKind::Parse,
                format!("Gemini /models parse failed: {e}"),
            )
        })?;
        return Ok(parsed
            .models
            .into_iter()
            .map(|m| ProviderModelInfo {
                id: m
                    .name
                    .strip_prefix("models/")
                    .unwrap_or(&m.name)
                    .to_string(),
                owned_by: None,
            })
            .collect());
    }

    let parsed: OaiCompatModels = serde_json::from_str(body).map_err(|e| {
        ModelDiscoveryError::new(
            ModelDiscoveryErrorKind::Parse,
            format!("/models parse failed: {e}"),
        )
    })?;
    Ok(parsed
        .data
        .into_iter()
        .map(|m| ProviderModelInfo {
            id: m.id,
            owned_by: m.owned_by,
        })
        .collect())
}

fn truncate(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        s.to_string()
    } else {
        format!("{}…", s.chars().take(max).collect::<String>())
    }
}

// ── Per-vendor wire shapes ──────────────────────────────────────────

#[derive(Deserialize)]
struct OaiCompatModels {
    data: Vec<OaiCompatModel>,
}

#[derive(Deserialize)]
struct OaiCompatModel {
    id: String,
    #[serde(default)]
    owned_by: Option<String>,
}

#[derive(Deserialize)]
struct GeminiModels {
    models: Vec<GeminiModel>,
}

#[derive(Deserialize)]
struct GeminiModel {
    name: String,
}

#[cfg(test)]
mod tests;
