//! Observations are facts, not a second registry or an activation mechanism.

use std::time::{Duration, Instant};

use serde::Serialize;
use specta::Type;

use super::ServiceRuntimeState;
use crate::platform::services::{Service, ServiceState};

/// Availability of the service contract, not of every downstream capability.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum ServiceReadiness {
    /// A real service check succeeded and lifecycle permits work.
    Ready,
    /// The service is unavailable, failed or still starting/stopping.
    NotReady,
    /// No operation-level readiness evidence is available.
    Unknown,
}

/// What was actually checked. A process handshake does not prove inference.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum ObservationEvidence {
    /// Configuration/presence only, no successful service check.
    None,
    /// The existing service adapter performed its health operation.
    ServiceProbe,
    /// Supervisor reports a completed protocol handshake and a connected peer.
    ProtocolHandshake,
}

/// Machine-readable reason, separate from the human-readable detail.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum ServiceIssueCode {
    /// No operation-level health check is wired for this service.
    Unverified,
    /// The service adapter's health operation failed.
    ProbeFailed,
    /// The health operation did not complete within its deadline.
    ProbeTimedOut,
    /// Service lifecycle is not ready despite a successful health operation.
    LifecycleNotReady,
    /// Supervised process startup, transport or cleanup failed.
    RuntimeFailed,
}

/// Explicit diagnosis for UI and control-plane consumers.
#[derive(Debug, Clone, Serialize, Type)]
pub struct ServiceIssue {
    /// Stable reason for programmatic consumers.
    pub code: ServiceIssueCode,
    /// Actual failure or explanation; never used as an identity.
    pub message: String,
}

/// A point-in-time observation. It does not grant permission to execute work.
#[derive(Debug, Clone, Serialize, Type)]
pub struct ServiceObservation {
    /// Existing adapter lifecycle, when an adapter is present.
    pub lifecycle: Option<ServiceState>,
    /// Separately verified availability.
    pub readiness: ServiceReadiness,
    /// Source of the observation.
    pub evidence: ObservationEvidence,
    /// When this snapshot was observed, Unix milliseconds (not a lease).
    pub observed_at_ms: i64,
    /// Time taken by this health probe; absent when no probe ran.
    pub latency_us: Option<u64>,
    /// Structured failure or explanation.
    pub issue: Option<ServiceIssue>,
}

impl ServiceObservation {
    /// Adapt supervisor facts without treating a handshake as operation readiness.
    #[must_use]
    pub fn agenthub(
        status: devpulse_agenthub::client::RuntimeStatus,
    ) -> (ServiceRuntimeState, Self) {
        use devpulse_agenthub::client::RuntimeState;
        let state = match status.state {
            RuntimeState::Stopped => ServiceRuntimeState::Stopped,
            RuntimeState::Starting => ServiceRuntimeState::Starting,
            RuntimeState::Connected => ServiceRuntimeState::Running,
            RuntimeState::Stopping => ServiceRuntimeState::Stopping,
            RuntimeState::Failed => ServiceRuntimeState::Failed,
        };
        let mut observation = Self::unobserved(state);
        observation.lifecycle = match status.state {
            RuntimeState::Starting => Some(ServiceState::Booting),
            RuntimeState::Failed => Some(ServiceState::Failed),
            _ => None,
        };
        if status.state == RuntimeState::Connected {
            observation.evidence = ObservationEvidence::ProtocolHandshake;
            observation.issue = Some(ServiceIssue {
                code: ServiceIssueCode::Unverified,
                message: "Process protocol connected; ticket and provider capabilities are not verified by this handshake.".into(),
            });
        } else if let Some(message) = status.message {
            observation.issue = Some(ServiceIssue {
                code: ServiceIssueCode::RuntimeFailed,
                message,
            });
        }
        (state, observation)
    }

    /// Presence and configuration alone never establish readiness.
    #[must_use]
    pub fn unobserved(state: ServiceRuntimeState) -> Self {
        Self {
            lifecycle: None,
            readiness: match state {
                ServiceRuntimeState::Running | ServiceRuntimeState::Unknown => {
                    ServiceReadiness::Unknown
                }
                _ => ServiceReadiness::NotReady,
            },
            evidence: ObservationEvidence::None,
            observed_at_ms: chrono::Utc::now().timestamp_millis(),
            latency_us: None,
            issue: None,
        }
    }

    /// Mark a present runtime whose capability check is not yet implemented.
    #[must_use]
    pub fn unverified(message: &str) -> Self {
        let mut observation = Self::unobserved(ServiceRuntimeState::Running);
        observation.issue = Some(ServiceIssue {
            code: ServiceIssueCode::Unverified,
            message: message.into(),
        });
        observation
    }

    /// Probe an existing adapter with a deadline; never construct or start it.
    pub async fn probe<S: Service>(service: &S, budget: Duration) -> Self {
        let start = Instant::now();
        let result = tokio::time::timeout(budget, service.ping()).await;
        let lifecycle = service.state();
        let (readiness, issue) = match result {
            Ok(Ok(())) if lifecycle == ServiceState::Ready => (ServiceReadiness::Ready, None),
            Ok(Ok(())) => (
                ServiceReadiness::NotReady,
                Some(ServiceIssue {
                    code: ServiceIssueCode::LifecycleNotReady,
                    message: format!("Service lifecycle is {lifecycle:?}"),
                }),
            ),
            Ok(Err(error)) => (
                ServiceReadiness::NotReady,
                Some(ServiceIssue {
                    code: ServiceIssueCode::ProbeFailed,
                    message: format!("{error:#}"),
                }),
            ),
            Err(_) => (
                ServiceReadiness::NotReady,
                Some(ServiceIssue {
                    code: ServiceIssueCode::ProbeTimedOut,
                    message: format!("Service check exceeded {} ms", budget.as_millis()),
                }),
            ),
        };
        Self {
            lifecycle: Some(lifecycle),
            readiness,
            evidence: ObservationEvidence::ServiceProbe,
            observed_at_ms: chrono::Utc::now().timestamp_millis(),
            latency_us: Some(u64::try_from(start.elapsed().as_micros()).unwrap_or(u64::MAX)),
            issue,
        }
    }
}

#[cfg(test)]
mod tests;
