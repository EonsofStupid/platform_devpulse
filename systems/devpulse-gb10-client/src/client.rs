//! The Clyffy wire client — connection lifecycle + the capability-computed
//! handshake against a ClyffyOS (`clyffyd`) endpoint.

use std::time::Duration;

use clyffyos_wire::{EndpointCapability, LoadedSlotSummary, RegisteredEndpoint, SlotStatus};
use serde::{Deserialize, Serialize};

/// Wire shape of the live fleet's `GET /healthz` answer (`clyffy-brain`).
/// Tolerant by design — only `service` is required to identify the family;
/// everything else degrades to an honest empty.
#[derive(Debug, Deserialize)]
struct BrainHealth {
    /// Service family identifier, e.g. `"clyffy-brain"`.
    service: String,
    /// Daemon version string; empty when absent.
    #[serde(default)]
    version: String,
    /// The brain slot's live state, when advertised.
    #[serde(default)]
    brain: Option<BrainSlotHealth>,
}

/// The `brain` object inside [`BrainHealth`].
#[derive(Debug, Deserialize)]
struct BrainSlotHealth {
    /// Model id currently configured into the brain.
    #[serde(default)]
    configured: Option<String>,
    /// Lifecycle string — `"ready"`, `"loading"`, …
    #[serde(default)]
    state: Option<String>,
    /// One-line failure reason, when the last load failed.
    #[serde(default)]
    error: Option<String>,
}

/// Compute the sole contract type from a live health answer. `None` when the
/// service does not identify as a clyffy family member — an answering server
/// that is NOT a Clyffy is never fabricated into one.
fn map_brain_health(health: BrainHealth) -> Option<EndpointCapability> {
    if !health.service.starts_with("clyffy") {
        return None;
    }
    let slots = match health.brain {
        Some(brain) => {
            let status = match (brain.state.as_deref(), brain.error) {
                (_, Some(err)) if !err.is_empty() => SlotStatus::Failed(err),
                (Some("ready"), _) => SlotStatus::Ready,
                (Some("loading") | Some("warming"), _) => SlotStatus::Loading,
                (Some(other), _) => SlotStatus::Failed(format!("unrecognized state: {other}")),
                (None, _) => SlotStatus::Empty,
            };
            vec![LoadedSlotSummary {
                slot_id: "clyffy".to_string(),
                model_id: brain.configured.unwrap_or_default(),
                role: "chat".to_string(),
                status,
            }]
        }
        None => Vec::new(),
    };
    Some(EndpointCapability {
        kind: health.service,
        version: health.version,
        build_sha: String::new(),
        slots,
    })
}

/// Connection lifecycle from DevPulse's perspective. Drives the no-AI indicator
/// and every Tier-2 feature gate; the capability is always **computed** from the
/// endpoint, never assumed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(tag = "state", rename_all = "snake_case")]
pub enum ConnectionState {
    /// No endpoint reachable — DevPulse runs standalone (Tier-1, Turso only).
    Disconnected,
    /// A capability probe is in flight against `url`.
    Connecting {
        /// The endpoint URL being probed.
        url: String,
    },
    /// Connected; `capability` was computed from the endpoint handshake.
    Connected {
        /// The endpoint base URL.
        url: String,
        /// What the endpoint advertised it can serve (computed, never hardcoded).
        capability: EndpointCapability,
    },
}

impl ConnectionState {
    /// `true` when a Tier-2 (AI) capability is live. The no-AI indicator is shown
    /// while this is `false` and cleared when it flips `true`.
    #[must_use]
    pub fn tier2_available(&self) -> bool {
        matches!(self, ConnectionState::Connected { .. })
    }
}

/// Failure reaching a ClyffyOS endpoint.
#[derive(Debug, thiserror::Error)]
pub enum ClientError {
    /// HTTP transport failed — unreachable, timeout, or TLS. This is the expected
    /// result in the standalone case and is reported honestly, not hidden.
    #[error("transport: {0}")]
    Transport(String),
    /// The endpoint answered but its capability payload did not parse.
    #[error("bad capability payload: {0}")]
    Decode(String),
}

/// Thin async HTTP/JSON client to a ClyffyOS endpoint.
///
/// Endpoints are supplied by the caller — discovered via Bonjour or read from
/// DevPulse config. The client hardcodes no host, port, or path base.
#[derive(Debug, Clone)]
pub struct ClyffyClient {
    http: reqwest::Client,
}

impl ClyffyClient {
    /// Build a client with a bounded per-probe timeout.
    ///
    /// # Errors
    /// [`ClientError::Transport`] if the underlying HTTP client cannot be built.
    pub fn new(probe_timeout: Duration) -> Result<Self, ClientError> {
        let http = reqwest::Client::builder()
            .timeout(probe_timeout)
            .build()
            .map_err(|e| ClientError::Transport(e.to_string()))?;
        Ok(Self { http })
    }

    /// Probe `GET {base_url}/v1/capability` and return the computed capability —
    /// the capability-computed handshake.
    ///
    /// Canonical route first. When the daemon answers `404`/`405` (route not
    /// implemented), the probe falls back to the live fleet's `GET /healthz`
    /// dialect (`clyffy-brain`, 2026-07) and COMPUTES the sole contract type
    /// from that answer — see [`Self::probe_healthz_dialect`]. Either way the
    /// capability is computed from what the endpoint actually said, never
    /// assumed.
    ///
    /// # Errors
    /// [`ClientError::Transport`] when the endpoint is unreachable (the standalone
    /// case) or answers a non-success status with no known fallback,
    /// [`ClientError::Decode`] when the body is not a valid
    /// [`EndpointCapability`] (or a recognizable Clyffy health payload).
    pub async fn probe_capability(
        &self,
        base_url: &str,
    ) -> Result<EndpointCapability, ClientError> {
        let base = base_url.trim_end_matches('/');
        let url = format!("{base}/v1/capability");
        let resp = self
            .http
            .get(url)
            .send()
            .await
            .map_err(|e| ClientError::Transport(e.to_string()))?;
        if resp.status().is_success() {
            return resp
                .json::<EndpointCapability>()
                .await
                .map_err(|e| ClientError::Decode(e.to_string()));
        }
        let status = resp.status();
        if status == reqwest::StatusCode::NOT_FOUND
            || status == reqwest::StatusCode::METHOD_NOT_ALLOWED
        {
            // Route absent on this daemon — try the live-fleet health dialect.
            return self.probe_healthz_dialect(base).await;
        }
        Err(ClientError::Transport(format!(
            "capability handshake answered HTTP {status}"
        )))
    }

    /// BRIDGE — the running Clyffy fleet (`clyffy-brain`) predates
    /// `GET /v1/capability` and advertises itself via `GET /healthz`:
    ///
    /// ```json
    /// { "status": "ok", "service": "clyffy-brain", "version": "0.0.0",
    ///   "brain": { "configured": "<model-id>", "state": "ready", "error": null },
    ///   "modes": ["advanced", "code", ...] }
    /// ```
    ///
    /// Anything whose `service` names a clyffy family member IS a Clyffy; its
    /// health body is mapped into the SOLE Tier-2 contract type
    /// ([`EndpointCapability`]) at this boundary — no parallel DTO leaks
    /// upward. Retire once the fleet serves `/v1/capability` natively
    /// (clyffyos-side follow-up).
    ///
    /// # Errors
    /// [`ClientError::Transport`] on unreachable/non-success,
    /// [`ClientError::Decode`] when the body is not a Clyffy health payload.
    async fn probe_healthz_dialect(&self, base: &str) -> Result<EndpointCapability, ClientError> {
        let resp = self
            .http
            .get(format!("{base}/healthz"))
            .send()
            .await
            .map_err(|e| ClientError::Transport(e.to_string()))?;
        if !resp.status().is_success() {
            return Err(ClientError::Transport(format!(
                "healthz dialect answered HTTP {}",
                resp.status()
            )));
        }
        let health = resp
            .json::<BrainHealth>()
            .await
            .map_err(|e| ClientError::Decode(e.to_string()))?;
        map_brain_health(health).ok_or_else(|| {
            ClientError::Decode("healthz answered but did not identify as a clyffy service".into())
        })
    }

    /// Probe an endpoint and fold the outcome into a [`ConnectionState`]. An
    /// unreachable endpoint yields [`ConnectionState::Disconnected`] — never a
    /// fabricated capability.
    pub async fn connect(&self, endpoint: &RegisteredEndpoint) -> ConnectionState {
        match self.probe_capability(&endpoint.url).await {
            Ok(capability) => ConnectionState::Connected {
                url: endpoint.url.clone(),
                capability,
            },
            Err(_) => ConnectionState::Disconnected,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Captured VERBATIM from the live fleet: `clyffy-brain` at
    /// 192.168.1.82:8787, `GET /healthz`, 2026-07-15.
    const LIVE_BRAIN_HEALTHZ: &str = r#"{"status":"ok","service":"clyffy-brain","version":"0.0.0","brain":{"configured":"qwen3-vl-235b-a22b-instruct-q4kxl","state":"ready","error":null},"backend":"ring:http://127.0.0.1:8091","models":{"valid":13,"total":18},"modes":["advanced","code","converse","img-video","research","speak","vision"]}"#;

    #[test]
    fn live_brain_healthz_maps_to_capability() {
        let health: BrainHealth = serde_json::from_str(LIVE_BRAIN_HEALTHZ).expect("parses");
        let cap = map_brain_health(health).expect("clyffy-brain identifies as clyffy");
        assert_eq!(cap.kind, "clyffy-brain");
        assert_eq!(cap.version, "0.0.0");
        assert_eq!(cap.slots.len(), 1);
        let slot = &cap.slots[0];
        assert_eq!(slot.slot_id, "clyffy");
        assert_eq!(slot.model_id, "qwen3-vl-235b-a22b-instruct-q4kxl");
        assert_eq!(slot.status, SlotStatus::Ready);
    }

    #[test]
    fn non_clyffy_service_is_never_fabricated() {
        let health: BrainHealth =
            serde_json::from_str(r#"{"service":"some-other-daemon","version":"1.0.0"}"#)
                .expect("parses");
        assert!(map_brain_health(health).is_none());
    }

    #[test]
    fn failed_brain_state_maps_to_failed_slot() {
        let health: BrainHealth = serde_json::from_str(
            r#"{"service":"clyffy-brain","version":"0.0.0","brain":{"configured":"m","state":"ready","error":"OOM loading weights"}}"#,
        )
        .expect("parses");
        let cap = map_brain_health(health).expect("still a clyffy");
        assert_eq!(
            cap.slots[0].status,
            SlotStatus::Failed("OOM loading weights".to_string())
        );
    }

    #[test]
    fn brainless_health_maps_to_empty_slots() {
        let health: BrainHealth =
            serde_json::from_str(r#"{"service":"clyffyd","version":"0.1.0"}"#).expect("parses");
        let cap = map_brain_health(health).expect("clyffyd is a clyffy");
        assert!(cap.slots.is_empty());
        assert_eq!(cap.kind, "clyffyd");
    }
}
