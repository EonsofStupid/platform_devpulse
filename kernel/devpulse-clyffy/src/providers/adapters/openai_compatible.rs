//! OpenAI-compatible endpoint adapter — `GET /v1/models`.
//!
//! Recognizes any server implementing the OpenAI-compatible API: Ollama,
//! LM Studio, `vLLM`, `llama-server`, and configured remote services. The
//! models list is the handshake: a `200` with an `OpenAI` list body
//! (`{"data": [{"id": ...}]}`) is a verified endpoint.

use async_trait::async_trait;
use reqwest::StatusCode;
use serde::Deserialize;

use super::{EndpointCapabilities, EndpointProbe, EndpointProtocol, ProbeOutcome};

/// Probe for the OpenAI-compatible HTTP API.
#[derive(Debug, Clone, Copy, Default)]
pub struct OpenAiCompatibleProbe;

/// `GET /v1/models` response body — only the fields the handshake needs.
#[derive(Debug, Deserialize)]
struct ModelList {
    data: Vec<ModelEntry>,
}

#[derive(Debug, Deserialize)]
struct ModelEntry {
    id: String,
}

/// The models URL for a base URL. Accepts the base with or without a
/// trailing `/v1`, since servers are commonly configured either way.
fn models_url(base_url: &str) -> String {
    let base = base_url.trim().trim_end_matches('/');
    if base.ends_with("/v1") {
        format!("{base}/models")
    } else {
        format!("{base}/v1/models")
    }
}

/// Model ids from an `OpenAI` list body, or `None` if the body is not one.
fn parse_models(body: &str) -> Option<Vec<String>> {
    let list: ModelList = serde_json::from_str(body).ok()?;
    Some(list.data.into_iter().map(|m| m.id).collect())
}

#[async_trait]
impl EndpointProbe for OpenAiCompatibleProbe {
    fn protocol(&self) -> EndpointProtocol {
        EndpointProtocol::OpenAiCompatible
    }

    async fn probe(&self, http: &reqwest::Client, base_url: &str) -> ProbeOutcome {
        let url = models_url(base_url);
        let response = match http.get(&url).send().await {
            Ok(r) => r,
            Err(err) => {
                tracing::debug!(target: "onboarding.probe", %url, %err, "no answer");
                return ProbeOutcome::Unreachable;
            }
        };
        let status = response.status();
        if status == StatusCode::UNAUTHORIZED || status == StatusCode::FORBIDDEN {
            tracing::debug!(target: "onboarding.probe", %url, %status, "answered, credentials required");
            return ProbeOutcome::AuthRequired {
                protocol: EndpointProtocol::OpenAiCompatible,
            };
        }
        if !status.is_success() {
            tracing::debug!(target: "onboarding.probe", %url, %status, "answered, not OpenAI-compatible");
            return ProbeOutcome::NotRecognized;
        }
        let Ok(body) = response.text().await else {
            return ProbeOutcome::NotRecognized;
        };
        match parse_models(&body) {
            Some(models) => {
                tracing::debug!(target: "onboarding.probe", %url, models = models.len(), "verified");
                ProbeOutcome::Verified {
                    capabilities: EndpointCapabilities {
                        protocol: EndpointProtocol::OpenAiCompatible,
                        models,
                    },
                }
            }
            None => ProbeOutcome::NotRecognized,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn models_url_accepts_base_with_or_without_v1() {
        assert_eq!(models_url("http://h:11434"), "http://h:11434/v1/models");
        assert_eq!(models_url("http://h:11434/"), "http://h:11434/v1/models");
        assert_eq!(models_url("http://h:1234/v1"), "http://h:1234/v1/models");
        assert_eq!(models_url(" http://h:1234/v1/ "), "http://h:1234/v1/models");
    }

    #[test]
    fn parses_openai_list_body() {
        let body = r#"{"object":"list","data":[{"id":"qwen3:8b","object":"model"},{"id":"nomic-embed-text"}]}"#;
        assert_eq!(
            parse_models(body),
            Some(vec!["qwen3:8b".to_string(), "nomic-embed-text".to_string()])
        );
    }

    #[test]
    fn empty_list_is_still_a_valid_handshake() {
        assert_eq!(parse_models(r#"{"data":[]}"#), Some(vec![]));
    }

    #[test]
    fn rejects_bodies_that_are_not_an_openai_list() {
        assert_eq!(parse_models("<html>not an api</html>"), None);
        assert_eq!(parse_models(r#"{"models":[]}"#), None);
    }

    /// Live handshake against a real server. Set `DEVPULSE_LIVE_ENDPOINT`
    /// to its base URL and run with `--ignored`.
    #[tokio::test]
    #[ignore = "needs a live OpenAI-compatible server (DEVPULSE_LIVE_ENDPOINT)"]
    async fn live_handshake_verifies_a_real_server() {
        let Ok(base) = std::env::var("DEVPULSE_LIVE_ENDPOINT") else {
            return;
        };
        let http = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(5))
            .build()
            .unwrap_or_default();
        let outcome = OpenAiCompatibleProbe.probe(&http, &base).await;
        assert!(
            matches!(outcome, ProbeOutcome::Verified { .. }),
            "expected Verified from {base}, got {outcome:?}"
        );
    }
}
