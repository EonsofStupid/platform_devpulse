//! The Clyffy wire client — connection lifecycle + the capability-computed
//! handshake against a ClyffyOS (`clyffyd`) endpoint.

use std::time::Duration;

use clyffyos_wire::{EndpointCapability, RegisteredEndpoint};
use serde::{Deserialize, Serialize};

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
    /// # Errors
    /// [`ClientError::Transport`] when the endpoint is unreachable (the standalone
    /// case), [`ClientError::Decode`] when the body is not a valid
    /// [`EndpointCapability`].
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
        resp.json::<EndpointCapability>()
            .await
            .map_err(|e| ClientError::Decode(e.to_string()))
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
