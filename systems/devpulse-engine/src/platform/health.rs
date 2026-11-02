//! Health check types for the platform engine.
//!
//! These types are what Tauri and the frontend see.
//! Technical subsystem identities remain available for advanced presentation.

use crate::platform::services::ServiceState;
use crate::platform::services::manifest::ServiceGroup;
use crate::platform::services::status::{
    ServiceReadiness, ServiceRuntimeState, ServiceStatusSnapshot,
};
use serde::Serialize;
use specta::Type;

/// Overall system health status.
#[derive(Debug, Clone, Serialize, Type)]
pub struct SystemHealth {
    /// Aggregate status across all subsystems.
    pub status: HealthStatus,
    /// Seconds since platform boot.
    pub uptime_secs: u64,
    /// Per-subsystem health details.
    pub subsystems: Vec<SubsystemHealth>,
}

/// Health of an individual subsystem (database, cache, etc.).
#[derive(Debug, Clone, Serialize, Type)]
pub struct SubsystemHealth {
    /// Stable identity from the service manifest.
    pub service_id: String,
    /// Group declared by the manifest, never inferred from translated labels.
    pub group: ServiceGroup,
    /// Presentation label from the same manifest.
    pub name: String,
    /// Observed adapter lifecycle; absent when unavailable or unverified.
    pub state: Option<ServiceState>,
    /// Health derived from the inventory's readiness evidence.
    pub status: HealthStatus,
    /// Ping latency in microseconds. Microseconds prevent sub-millisecond
    /// operations from rounding to 0 and lying about their cost.
    pub latency_us: Option<u64>,
    /// Human-readable status message.
    pub message: Option<String>,
}

impl SystemHealth {
    /// Derive health from the same evidence as the service inventory.
    /// Optional dormant services are not failures; required missing services are.
    #[must_use]
    pub fn from_services(services: Vec<ServiceStatusSnapshot>, uptime_secs: u64) -> Self {
        let subsystems: Vec<_> = services
            .into_iter()
            .filter(|service| service.compiled_in && service.config_enabled)
            .filter(|service| {
                service.runtime_state != ServiceRuntimeState::Stopped || service.config_critical
            })
            .map(|service| {
                let status = match service.observation.readiness {
                    ServiceReadiness::Ready => HealthStatus::Healthy,
                    ServiceReadiness::NotReady => HealthStatus::Down,
                    ServiceReadiness::Unknown => HealthStatus::Unknown,
                };
                SubsystemHealth {
                    service_id: service.service_id,
                    group: service.group,
                    name: service.public_name,
                    state: service.observation.lifecycle,
                    status,
                    latency_us: service.observation.latency_us,
                    message: service
                        .observation
                        .issue
                        .map(|issue| issue.message)
                        .or_else(|| {
                            (service.runtime_state == ServiceRuntimeState::Stopped)
                                .then(|| "Required service has not started".into())
                        }),
                }
            })
            .collect();
        let status = if subsystems.is_empty() {
            HealthStatus::Unknown
        } else if subsystems
            .iter()
            .any(|service| service.status == HealthStatus::Down)
        {
            HealthStatus::Degraded
        } else if subsystems
            .iter()
            .all(|service| service.status == HealthStatus::Healthy)
        {
            HealthStatus::Healthy
        } else {
            HealthStatus::Unknown
        };
        Self {
            status,
            uptime_secs,
            subsystems,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::platform::services::{ServiceRole, manifest::meta_for_role, status::snapshot_from};

    #[test]
    fn empty_or_unverified_inventory_cannot_report_healthy() {
        assert_eq!(
            SystemHealth::from_services(vec![], 0).status,
            HealthStatus::Unknown
        );
        if let Some(meta) = meta_for_role(ServiceRole::AgentHub) {
            let snapshot = snapshot_from(meta, true, false, ServiceRuntimeState::Running);
            let health = SystemHealth::from_services(vec![snapshot], 0);
            assert_eq!(health.status, HealthStatus::Unknown);
            assert_eq!(health.subsystems[0].service_id, "system.agenthub");
            assert!(health.subsystems[0].state.is_none());
        } else {
            panic!("AgentHub must be registered");
        }
    }

    #[test]
    fn dormant_optional_services_and_required_missing_services_are_distinct() {
        let Some(meta) = meta_for_role(ServiceRole::AgentHub) else {
            panic!("AgentHub must be registered")
        };
        let dormant = snapshot_from(meta, true, false, ServiceRuntimeState::Stopped);
        assert!(
            SystemHealth::from_services(vec![dormant], 0)
                .subsystems
                .is_empty()
        );
        let required = snapshot_from(meta, true, true, ServiceRuntimeState::Stopped);
        let health = SystemHealth::from_services(vec![required], 0);
        assert_eq!(health.status, HealthStatus::Degraded);
        assert_eq!(health.subsystems[0].status, HealthStatus::Down);
    }
}

/// Health status enum.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
pub enum HealthStatus {
    /// Subsystem is operational.
    Healthy,
    /// Subsystem is operational but with degraded performance.
    Degraded,
    /// Subsystem is not operational.
    Down,
    /// Subsystem status is not known (not yet initialized).
    Unknown,
}
