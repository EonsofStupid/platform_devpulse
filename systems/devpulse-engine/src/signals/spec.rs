//! `SignalSpec` — the contract entry every [`SignalKind`] must have.
//!
//! One `match` declares, per kind, the facts every consumer depends on: how
//! it is delivered (event or state), which windows may receive it, where the
//! platform routes it, and its wire version. The match is exhaustive: adding
//! a variant to `SignalVariant` without a spec here does not compile.
//!
//! Tuning — how often a kind is sampled or delivered — is configuration with
//! shipped default suggestions (`[signals]` in `config/platform/signals.toml`,
//! loaded as `SignalsConfig`), not code.

use serde::{Deserialize, Serialize};
use specta::Type;

use super::kinds::SinkKind;
use super::variants::SignalKind;

/// How a signal kind is delivered.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum Delivery {
    /// Something happened. Fanned out to current subscribers; a subscriber
    /// that falls behind may miss it.
    Event,
    /// The current value of something Rust owns. The latest value is kept
    /// and replayed to late subscribers; only the newest revision matters.
    State,
}

/// Which windows receive a signal kind that crosses to the UI.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum Audience {
    /// Every application window.
    All,
    /// Devtools windows only.
    Devtools,
    /// Never crosses the IPC boundary.
    Internal,
}

/// Contract entry for one signal kind.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct SignalSpec {
    /// Event or state.
    pub delivery: Delivery,
    /// Which windows receive it.
    pub audience: Audience,
    /// Routing destinations inside the platform.
    pub sinks: &'static [SinkKind],
    /// Wire contract version of the payload. Bumped on any incompatible
    /// payload change (`CloudEvents`: version in the type or schema).
    pub version: u16,
}

impl SignalKind {
    /// The contract entry for this kind.
    #[must_use]
    pub const fn spec(self) -> SignalSpec {
        match self {
            Self::Chat => SignalSpec {
                delivery: Delivery::Event,
                audience: Audience::All,
                sinks: &[SinkKind::Broadcast, SinkKind::Durable],
                version: 1,
            },
            Self::Analytics => SignalSpec {
                delivery: Delivery::Event,
                audience: Audience::Internal,
                sinks: &[SinkKind::Analytics],
                version: 1,
            },
            Self::Context => SignalSpec {
                delivery: Delivery::Event,
                audience: Audience::All,
                sinks: &[SinkKind::Broadcast, SinkKind::Cache],
                version: 1,
            },
            Self::Inference => SignalSpec {
                delivery: Delivery::Event,
                audience: Audience::Internal,
                sinks: &[SinkKind::Analytics, SinkKind::Cache],
                version: 1,
            },
            Self::System | Self::Resync => SignalSpec {
                delivery: Delivery::Event,
                audience: Audience::All,
                sinks: &[SinkKind::Broadcast],
                version: 1,
            },
            Self::Governance => SignalSpec {
                delivery: Delivery::Event,
                audience: Audience::All,
                sinks: &[SinkKind::Broadcast, SinkKind::Analytics],
                version: 1,
            },
            Self::Hardware | Self::Models | Self::Boot | Self::Onboarding | Self::Projects => {
                SignalSpec {
                    delivery: Delivery::State,
                    audience: Audience::All,
                    sinks: &[SinkKind::Broadcast],
                    version: 1,
                }
            }
        }
    }

    /// `true` when this kind crosses the IPC boundary to UI windows.
    #[must_use]
    pub fn reaches_ui(self) -> bool {
        let spec = self.spec();
        !matches!(spec.audience, Audience::Internal) && spec.sinks.contains(&SinkKind::Broadcast)
    }
}
