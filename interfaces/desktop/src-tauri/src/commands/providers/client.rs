//! Per-vendor request construction + response classification.
//!
//! One shared `reqwest::Client` with timeouts. Each provider has a
//! request-builder that knows its non-standard auth header, base URL,
//! and (for Gemini) querystring placement. Response handling is
//! uniform — the caller gets either a parsed model list or a
//! classified `CommandError`.
//!
//! This module is the boundary the lane router (Sprint 7) will reuse:
//! when chat requests start flowing, the router builds them with the
//! same per-vendor patterns, and `classify_status` keeps making the
//! retry/back-off decisions the router consults.

use std::sync::OnceLock;
use std::time::Duration;

use devpulse_engine::ai_providers::{self, BillingModel, ProviderId, Transport};
use reqwest::{Client, RequestBuilder, Response, StatusCode};
use serde::Deserialize;

use super::dto::ProviderModelInfo;
use crate::commands::_util::{CommandError, ErrorKind};

/// Conservative timeouts — model listing is metadata-only and cheap.
/// Connect generous enough for cold remote endpoints, total tighter so
/// a hung server can't park the devtool.
const CONNECT_TIMEOUT: Duration = Duration::from_secs(5);
const TOTAL_TIMEOUT: Duration = Duration::from_secs(15);

/// Process-wide HTTP client. Built lazily so the cost is paid only when
/// the operator actually opens the API Providers devtool.
///
/// Falls back to the reqwest default `Client::new()` if the builder
/// rejects our settings (TLS backend init / DNS resolver failure);
/// devtool reachability is non-essential and we'd rather show a working
/// fallback client than poison the whole panel.
fn shared_client() -> &'static Client {
    static CLIENT: OnceLock<Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        Client::builder()
            .connect_timeout(CONNECT_TIMEOUT)
            .timeout(TOTAL_TIMEOUT)
            .user_agent(concat!("DevPulse/", env!("CARGO_PKG_VERSION")))
            .build()
            .unwrap_or_else(|err| {
                tracing::warn!(
                    error = %err,
                    "providers.client: builder failed, falling back to default reqwest Client"
                );
                Client::new()
            })
    })
}

/// Hit the provider's models endpoint and project the response.
///
/// `api_key` may be `None` for local providers (Ollama / LM Studio /
/// vLLM) — they don't require auth on default deployments.
///
/// # Errors
/// Every failure path produces a `CommandError` with the right kind so
/// the UI shows a precise reason and the lane router can act on it.
pub async fn fetch_models(
    provider: ProviderId,
    api_key: Option<&str>,
) -> Result<Vec<ProviderModelInfo>, CommandError> {
    let entry = ai_providers::find(provider)
        .ok_or_else(|| CommandError::not_configured(format!("Unknown provider: {provider:?}")))?;

    let request = build_request(provider, entry, api_key)?;
    let response = request.send().await.map_err(|e| network_error(&e))?;
    parse_response(provider, response).await
}

/// Build the vendor-specific request for `GET <models endpoint>`.
fn build_request(
    provider: ProviderId,
    entry: &ai_providers::AiProvider,
    api_key: Option<&str>,
) -> Result<RequestBuilder, CommandError> {
    // Fireworks is account-scoped — the endpoint requires an account_id
    // that we don't yet collect. Surface explicitly rather than calling
    // a 404-bound URL.
    if matches!(provider, ProviderId::Fireworks) {
        return Err(CommandError::not_implemented(
            "Fireworks needs the account-scoped endpoint \
             `/v1/accounts/{account_id}/models` — account_id flow lands \
             in a later sprint.",
        ));
    }

    let client = shared_client();

    // Gemini's API key goes in the querystring, not a header.
    if matches!(provider, ProviderId::GoogleGemini) {
        let key = require_key(api_key)?;
        let base = base_url(entry)?;
        let url = format!("{base}/models?key={key}");
        return Ok(client.get(url));
    }

    // Anthropic uses x-api-key + the version pin, not Bearer.
    if matches!(provider, ProviderId::AnthropicApi) {
        let key = require_key(api_key)?;
        let base = base_url(entry)?;
        let url = format!("{base}/models");
        return Ok(client
            .get(url)
            .header("x-api-key", key)
            .header("anthropic-version", "2023-06-01"));
    }

    // Local providers may or may not require a key; pass it through
    // as a Bearer if the operator supplied one (vLLM in api-key mode),
    // otherwise call without auth.
    let base = base_url(entry)?;
    let url = format!("{base}/models");
    let mut req = client.get(url);
    if let Some(key) = api_key {
        if !key.is_empty() {
            req = req.bearer_auth(key);
        }
    } else if matches!(entry.billing, BillingModel::PerToken) {
        // Cloud + API-key billed but no key supplied → pre-flight failure.
        return Err(CommandError::not_configured(format!(
            "No API key configured for {}",
            entry.display_name
        )));
    }
    Ok(req)
}

/// Require an API key or return a `NotConfigured` error.
fn require_key(api_key: Option<&str>) -> Result<&str, CommandError> {
    api_key
        .filter(|k| !k.is_empty())
        .ok_or_else(|| CommandError::not_configured("API key required for this provider"))
}

/// Resolve the models-endpoint base URL from the SSOT transport list.
fn base_url(entry: &ai_providers::AiProvider) -> Result<&'static str, CommandError> {
    for transport in entry.transports {
        match transport {
            Transport::ApiKey { base_url } | Transport::OpenAiCompatible { base_url } => {
                return Ok(base_url);
            }
            Transport::LocalHttp { default_port } => {
                // LocalHttp is intentionally rare; for Ollama/LM Studio
                // we walk to the OpenAiCompatible transport (which all
                // local providers also expose). vLLM has only LocalHttp,
                // so we synthesize the URL from the default port.
                if entry
                    .transports
                    .iter()
                    .any(|t| matches!(t, Transport::OpenAiCompatible { .. }))
                {
                    continue;
                }
                let synthesized: &'static str =
                    Box::leak(format!("http://localhost:{default_port}/v1").into_boxed_str());
                return Ok(synthesized);
            }
            Transport::SubprocessMcp { .. } => {
                return Err(CommandError::not_implemented(format!(
                    "{} is a subprocess MCP path — model listing not applicable",
                    entry.display_name
                )));
            }
        }
    }
    Err(CommandError::not_configured(format!(
        "{} has no transport with a discoverable models endpoint",
        entry.display_name
    )))
}

/// Map a reqwest send-time failure to our classified shape.
fn network_error(e: &reqwest::Error) -> CommandError {
    // is_timeout / is_connect / other all bucket to Network — the
    // distinction between them is rarely actionable for the UI.
    CommandError::network(format!("Network call failed: {e}"))
}

/// Inspect the response status, parse the body on success, classify on failure.
async fn parse_response(
    provider: ProviderId,
    response: Response,
) -> Result<Vec<ProviderModelInfo>, CommandError> {
    let status = response.status();
    if status.is_success() {
        let body = response
            .text()
            .await
            .map_err(|e| CommandError::parse(format!("Could not read response body: {e}")))?;
        return parse_models(provider, &body);
    }

    let body = response.text().await.unwrap_or_default();
    Err(CommandError::with_context(
        classify_status(status, &body),
        format!("HTTP {status}"),
        truncate(&body, 280),
    ))
}

/// Classify a non-2xx response by status code + body shape.
///
/// Distinguishing `RateLimit` from `QuotaExhausted` matters for the
/// router: rate-limited calls retry with backoff, quota-exhausted
/// calls fail fast and surface to the operator.
pub fn classify_status(status: StatusCode, body: &str) -> ErrorKind {
    let body_lower = body.to_ascii_lowercase();
    match status.as_u16() {
        401 | 403 => ErrorKind::AuthFailed,
        429 => {
            if body_lower.contains("insufficient_quota")
                || body_lower.contains("billing_error")
                || body_lower.contains("quota")
            {
                ErrorKind::QuotaExhausted
            } else {
                ErrorKind::RateLimit
            }
        }
        _ => ErrorKind::Server,
    }
}

/// Project the vendor-specific JSON shape into the normalized model list.
///
/// Three shapes covered:
/// 1. OpenAI-compatible: `{"data": [{"id": ..., "owned_by": ...}]}`
/// 2. Anthropic: `{"data": [{"id": ..., "display_name": ..., "type": "model"}]}`
/// 3. Gemini: `{"models": [{"name": "models/..."}]}`
fn parse_models(provider: ProviderId, body: &str) -> Result<Vec<ProviderModelInfo>, CommandError> {
    if matches!(provider, ProviderId::GoogleGemini) {
        let parsed: GeminiModels = serde_json::from_str(body)
            .map_err(|e| CommandError::parse(format!("Gemini /models parse failed: {e}")))?;
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

    let parsed: OaiCompatModels = serde_json::from_str(body)
        .map_err(|e| CommandError::parse(format!("/models parse failed: {e}")))?;
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
    if s.len() <= max {
        s.to_string()
    } else {
        format!("{}…", &s[..max])
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
mod tests {
    use super::*;

    #[test]
    fn classify_401_is_auth_failed() {
        assert_eq!(
            classify_status(StatusCode::UNAUTHORIZED, ""),
            ErrorKind::AuthFailed
        );
        assert_eq!(
            classify_status(StatusCode::FORBIDDEN, ""),
            ErrorKind::AuthFailed
        );
    }

    #[test]
    fn classify_429_rate_limit_vs_quota() {
        let body_rate = r#"{"error":{"type":"rate_limit_exceeded"}}"#;
        let body_quota = r#"{"error":{"type":"insufficient_quota"}}"#;
        let body_billing = r#"{"error":{"type":"billing_error","message":"out of credit"}}"#;
        assert_eq!(
            classify_status(StatusCode::TOO_MANY_REQUESTS, body_rate),
            ErrorKind::RateLimit
        );
        assert_eq!(
            classify_status(StatusCode::TOO_MANY_REQUESTS, body_quota),
            ErrorKind::QuotaExhausted
        );
        assert_eq!(
            classify_status(StatusCode::TOO_MANY_REQUESTS, body_billing),
            ErrorKind::QuotaExhausted
        );
    }

    #[test]
    fn classify_5xx_is_server() {
        assert_eq!(
            classify_status(StatusCode::INTERNAL_SERVER_ERROR, ""),
            ErrorKind::Server
        );
        assert_eq!(
            classify_status(StatusCode::BAD_GATEWAY, ""),
            ErrorKind::Server
        );
    }

    #[test]
    fn parse_oai_compat_models() {
        let body = r#"{"object":"list","data":[
            {"id":"gpt-4o","object":"model","owned_by":"openai"},
            {"id":"gpt-4o-mini","object":"model","owned_by":"openai"}
        ]}"#;
        let out = parse_models(ProviderId::OpenAi, body).unwrap();
        assert_eq!(out.len(), 2);
        assert_eq!(out[0].id, "gpt-4o");
        assert_eq!(out[0].owned_by.as_deref(), Some("openai"));
    }

    #[test]
    fn parse_gemini_strips_models_prefix() {
        let body = r#"{"models":[
            {"name":"models/gemini-1.5-flash"},
            {"name":"models/gemini-1.5-pro"}
        ]}"#;
        let out = parse_models(ProviderId::GoogleGemini, body).unwrap();
        assert_eq!(out[0].id, "gemini-1.5-flash");
        assert_eq!(out[1].id, "gemini-1.5-pro");
    }

    #[test]
    fn parse_failure_classified_as_parse() {
        let err = parse_models(ProviderId::OpenAi, "this is not json").unwrap_err();
        assert_eq!(err.kind, ErrorKind::Parse);
    }

    #[test]
    fn fireworks_returns_not_implemented() {
        let entry = ai_providers::find(ProviderId::Fireworks).unwrap();
        let err = build_request(ProviderId::Fireworks, entry, Some("dummy")).unwrap_err();
        assert_eq!(err.kind, ErrorKind::NotImplemented);
    }

    #[test]
    fn missing_key_for_cloud_returns_not_configured() {
        let entry = ai_providers::find(ProviderId::OpenAi).unwrap();
        let err = build_request(ProviderId::OpenAi, entry, None).unwrap_err();
        assert_eq!(err.kind, ErrorKind::NotConfigured);
    }

    #[test]
    fn missing_key_for_anthropic_returns_not_configured() {
        let entry = ai_providers::find(ProviderId::AnthropicApi).unwrap();
        let err = build_request(ProviderId::AnthropicApi, entry, None).unwrap_err();
        assert_eq!(err.kind, ErrorKind::NotConfigured);
    }

    #[test]
    fn missing_key_for_gemini_returns_not_configured() {
        let entry = ai_providers::find(ProviderId::GoogleGemini).unwrap();
        let err = build_request(ProviderId::GoogleGemini, entry, None).unwrap_err();
        assert_eq!(err.kind, ErrorKind::NotConfigured);
    }

    #[test]
    fn local_provider_without_key_is_ok() {
        let entry = ai_providers::find(ProviderId::Ollama).unwrap();
        // Should NOT fail pre-flight — local providers don't need a key.
        let _ = build_request(ProviderId::Ollama, entry, None).expect("Ollama needs no key");
    }
}
