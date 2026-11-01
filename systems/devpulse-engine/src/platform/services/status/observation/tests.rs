use super::*;
use crate::platform::services::ServiceRole;

struct Probe {
    state: ServiceState,
    outcome: u8,
}

impl Service for Probe {
    fn name(&self) -> &'static str {
        "test-service"
    }
    fn role(&self) -> ServiceRole {
        ServiceRole::Cache
    }
    fn state(&self) -> ServiceState {
        self.state
    }
    async fn ping(&self) -> anyhow::Result<()> {
        match self.outcome {
            0 => Ok(()),
            1 => anyhow::bail!("connection rejected"),
            _ => std::future::pending().await,
        }
    }
}

#[tokio::test]
async fn presence_and_a_successful_ping_do_not_override_unready_lifecycle() {
    assert_eq!(
        ServiceObservation::unobserved(ServiceRuntimeState::Running).readiness,
        ServiceReadiness::Unknown
    );
    let observed = ServiceObservation::probe(
        &Probe {
            state: ServiceState::Booting,
            outcome: 0,
        },
        Duration::from_secs(1),
    )
    .await;
    assert_eq!(observed.readiness, ServiceReadiness::NotReady);
    assert!(matches!(
        observed.issue,
        Some(ServiceIssue {
            code: ServiceIssueCode::LifecycleNotReady,
            ..
        })
    ));
}

#[tokio::test]
async fn real_probe_success_failure_and_timeout_remain_distinct() {
    for (outcome, expected) in [
        (0, None),
        (1, Some(ServiceIssueCode::ProbeFailed)),
        (2, Some(ServiceIssueCode::ProbeTimedOut)),
    ] {
        let observed = ServiceObservation::probe(
            &Probe {
                state: ServiceState::Ready,
                outcome,
            },
            Duration::from_millis(10),
        )
        .await;
        assert_eq!(observed.issue.map(|issue| issue.code), expected);
        assert_eq!(
            observed.readiness,
            if outcome == 0 {
                ServiceReadiness::Ready
            } else {
                ServiceReadiness::NotReady
            }
        );
        assert_eq!(observed.evidence, ObservationEvidence::ServiceProbe);
        assert!(observed.latency_us.is_some());
        assert!(observed.observed_at_ms > 0);
    }
}

#[test]
fn handshake_does_not_claim_factory_or_provider_readiness() {
    let (state, observation) =
        ServiceObservation::agenthub(devpulse_agenthub::client::RuntimeStatus {
            state: devpulse_agenthub::client::RuntimeState::Connected,
            message: None,
        });
    assert_eq!(state, ServiceRuntimeState::Running);
    assert_eq!(observation.readiness, ServiceReadiness::Unknown);
    assert_eq!(observation.evidence, ObservationEvidence::ProtocolHandshake);
}

#[test]
fn unavailable_services_never_report_ready() {
    for state in [
        ServiceRuntimeState::Stopped,
        ServiceRuntimeState::ConfigDisabled,
        ServiceRuntimeState::NotCompiled,
        ServiceRuntimeState::Failed,
        ServiceRuntimeState::Starting,
        ServiceRuntimeState::Stopping,
    ] {
        assert_eq!(
            ServiceObservation::unobserved(state).readiness,
            ServiceReadiness::NotReady
        );
    }
}
