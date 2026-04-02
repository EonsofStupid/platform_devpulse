//! Service manifest — compile-time authority on what services exist.
//!
//! Every service in the platform has exactly ONE entry here. Boot order,
//! public name, scope, and feature gate are declared once. Health checks,
//! validation, xtask, and shutdown all derive from this manifest.
//!
//! # Contract
//! - Every `ServiceRole` variant MUST have at least one manifest entry.
//! - `meta()` uses exhaustive match — compiler fails if a role is missing.
//! - Adding a new service = add one entry here + implement `Service` trait.

use super::ServiceRole;
use crate::platform::config::DataScope;

/// Compile-time metadata for a platform service.
#[derive(Debug, Clone, Copy)]
pub struct ServiceMeta {
    /// Which service role this entry describes.
    pub role: ServiceRole,
    /// Which data scope this service belongs to.
    pub scope: DataScope,
    /// Boot stage number (1-indexed, sequential).
    pub stage: u8,
    /// Human-readable name for logs, health checks, UI (ip_term applied).
    pub public_name: &'static str,
    /// Cargo feature gate — `None` means always compiled in.
    pub feature_gate: Option<&'static str>,
}

/// The service manifest — one entry per bootable service.
///
/// Order matches boot sequence. This is the SSOT for "what services
/// exist in the platform and in what order they boot."
pub const SERVICE_MANIFEST: &[ServiceMeta] = &[
    // ── Stage 1: Preflight is not a service — it's a boot step ──
    ServiceMeta {
        role: ServiceRole::Relational,
        scope: DataScope::System,
        stage: 2,
        public_name: "System Database",
        feature_gate: None,
    },
    ServiceMeta {
        role: ServiceRole::Analytics,
        scope: DataScope::System,
        stage: 3,
        public_name: "Analytics Engine",
        feature_gate: None,
    },
    ServiceMeta {
        role: ServiceRole::Graph,
        scope: DataScope::System,
        stage: 4,
        public_name: "Knowledge Graph",
        feature_gate: None,
    },
    ServiceMeta {
        role: ServiceRole::Cache,
        scope: DataScope::System,
        stage: 5,
        public_name: "System Cache",
        feature_gate: None,
    },
    ServiceMeta {
        role: ServiceRole::Relational,
        scope: DataScope::User,
        stage: 6,
        public_name: "User Database",
        feature_gate: None,
    },
    ServiceMeta {
        role: ServiceRole::Graph,
        scope: DataScope::User,
        stage: 6,
        public_name: "User Knowledge",
        feature_gate: None,
    },
    ServiceMeta {
        role: ServiceRole::Graph,
        scope: DataScope::Global,
        stage: 6,
        public_name: "Shared Knowledge",
        feature_gate: None,
    },
    ServiceMeta {
        role: ServiceRole::Vector,
        scope: DataScope::System,
        stage: 7,
        public_name: "Vector Store",
        feature_gate: Some("rro"),
    },
    ServiceMeta {
        role: ServiceRole::Grammar,
        scope: DataScope::System,
        stage: 9,
        public_name: "Grammar Engine",
        feature_gate: None, // Skipped at runtime, not feature-gated
    },
    ServiceMeta {
        role: ServiceRole::Embedder,
        scope: DataScope::System,
        stage: 10,
        public_name: "Embedding Engine",
        feature_gate: Some("candle"),
    },
    ServiceMeta {
        role: ServiceRole::Whisper,
        scope: DataScope::System,
        stage: 11,
        public_name: "Speech Recognition",
        feature_gate: Some("candle"),
    },
    ServiceMeta {
        role: ServiceRole::ModelLoader,
        scope: DataScope::System,
        stage: 12,
        public_name: "Model Manager",
        feature_gate: Some("inference"),
    },
    ServiceMeta {
        role: ServiceRole::DevForge,
        scope: DataScope::System,
        stage: 13,
        public_name: "Code Editor",
        feature_gate: None,
    },
];

/// Total number of boot stages (including preflight + validation).
pub const BOOT_STAGE_COUNT: u8 = 13;

/// Number of services in the manifest (excluding preflight and validation).
pub const SERVICE_COUNT: usize = SERVICE_MANIFEST.len();

/// Look up the first manifest entry for a given role.
///
/// # Contract
/// Every `ServiceRole` variant MUST have at least one entry in the manifest.
/// This function uses exhaustive match — compiler error if a role is missing.
pub fn meta_for_role(role: ServiceRole) -> &'static ServiceMeta {
    let idx = match role {
        ServiceRole::Relational => 0,  // System relational (first entry)
        ServiceRole::Analytics => 1,
        ServiceRole::Graph => 2,       // System graph (first entry)
        ServiceRole::Cache => 3,
        ServiceRole::Vector => 7,
        ServiceRole::Grammar => 8,
        ServiceRole::Embedder => 9,
        ServiceRole::Whisper => 10,
        ServiceRole::ModelLoader => 11,
        ServiceRole::DevForge => 12,
    };
    &SERVICE_MANIFEST[idx]
}

/// Count how many services are enabled in the manifest (excludes feature-gated
/// services whose feature is not compiled in).
pub fn compiled_service_count() -> usize {
    let mut count = 0;
    for meta in SERVICE_MANIFEST {
        let compiled = match meta.feature_gate {
            None => true,
            Some("rro") => cfg!(feature = "rro"),
            Some("candle") => cfg!(feature = "candle"),
            Some("inference") => cfg!(feature = "inference"),
            Some(_) => false,
        };
        if compiled {
            count += 1;
        }
    }
    count
}
