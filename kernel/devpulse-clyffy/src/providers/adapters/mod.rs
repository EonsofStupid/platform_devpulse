//! Provider protocol adapters — identify configured endpoints by a live handshake.
//!
//! One adapter per protocol. Adding a protocol = one file in this folder +
//! one entry in [`registry`].

mod openai_compatible;

pub use openai_compatible::OpenAiCompatibleProbe;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

/// Wire protocol an endpoint speaks.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "snake_case")]
pub enum EndpointProtocol {
    /// The OpenAI-compatible HTTP API (`/v1/models`, `/v1/chat/completions`,
    /// `/v1/embeddings`) — Ollama, LM Studio, `vLLM`, `llama-server`, and
    /// configured remote services.
    OpenAiCompatible,
}

/// What a verified endpoint advertised during the handshake.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct EndpointCapabilities {
    /// The protocol it answered in.
    pub protocol: EndpointProtocol,
    /// Model identifiers it listed, in the order it listed them.
    pub models: Vec<String>,
}

/// The result of probing one base URL — reported exactly as it happened.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(tag = "outcome", rename_all = "snake_case")]
pub enum ProbeOutcome {
    /// It answered and was recognized.
    Verified {
        /// What it advertised.
        capabilities: EndpointCapabilities,
    },
    /// It answered as a known protocol but needs credentials before it
    /// reveals what it serves.
    AuthRequired {
        /// The protocol it answered in.
        protocol: EndpointProtocol,
    },
    /// Something answered, but not as any known protocol.
    NotRecognized,
    /// Nothing answered (refused, timed out, or the host did not resolve).
    Unreachable,
}

/// A protocol adapter that identifies an endpoint by a live handshake.
#[async_trait]
pub trait EndpointProbe: Send + Sync {
    /// The protocol this probe recognizes.
    fn protocol(&self) -> EndpointProtocol;

    /// Probe `base_url` and report the outcome exactly as it happened.
    async fn probe(&self, http: &reqwest::Client, base_url: &str) -> ProbeOutcome;
}

/// Every registered probe, in the order they are tried.
#[must_use]
pub fn registry() -> Vec<Box<dyn EndpointProbe>> {
    vec![Box::new(OpenAiCompatibleProbe)]
}

/// Identify `base_url` by trying each registered probe in order.
///
/// Returns the first `Verified` or `AuthRequired` outcome. `Unreachable`
/// from the first probe stops early — a host that does not answer one
/// probe will not answer the next. If every probe gets an answer it does
/// not recognize, the result is `NotRecognized`.
pub async fn identify(http: &reqwest::Client, base_url: &str) -> ProbeOutcome {
    let mut answered = false;
    for probe in registry() {
        match probe.probe(http, base_url).await {
            outcome @ (ProbeOutcome::Verified { .. } | ProbeOutcome::AuthRequired { .. }) => {
                return outcome;
            }
            ProbeOutcome::Unreachable if !answered => return ProbeOutcome::Unreachable,
            ProbeOutcome::Unreachable => {}
            ProbeOutcome::NotRecognized => answered = true,
        }
    }
    if answered {
        ProbeOutcome::NotRecognized
    } else {
        ProbeOutcome::Unreachable
    }
}
