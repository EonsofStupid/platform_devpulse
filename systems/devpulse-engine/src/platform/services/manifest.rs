//! Service manifest — compile-time authority on what services exist.
//!
//! Every service in the platform has exactly ONE entry here. Boot order,
//! public name, scope, feature gate, and UI classification are declared
//! once. Health checks, validation, xtask, frontend classification, and
//! shutdown all derive from this manifest.
//!
//! # Two manifests, one SSOT
//!
//! - [`SERVICE_MANIFEST`] — services the boot pipeline validates as
//!   critical/non-critical. Each entry has a role, scope, stage, and
//!   optional `step_id` linking it to a [`BOOT_STEP_MANIFEST`] entry.
//! - [`BOOT_STEP_MANIFEST`] — every literal string that may be emitted
//!   by `InitEvent::running/ok/error/skipped` from `platform/boot/*`,
//!   plus its UI grouping and feature gate. Includes meta-steps such
//!   as `preflight`, `SurrealDB HTTP`, etc. that are not validated
//!   services but ARE surfaced in the UI.
//!
//! The unit tests in this file enforce that every `ServiceMeta`'s
//! `step_id` is present in `BOOT_STEP_MANIFEST` with matching `group`,
//! and that all step ids are unique.
//!
//! # Contract
//! - Every `ServiceRole` variant MUST have at least one manifest entry.
//! - `meta_for_role()` uses exhaustive match — compiler fails if a role is missing.
//! - Adding a new service = add one entry here + implement `Service` trait.
//! - Adding a new emitted step = add one entry to [`BOOT_STEP_MANIFEST`].

use super::ServiceRole;
use crate::platform::config::DataScope;

// ═══════════════════════════════════════════════════════════════
// UI grouping — shared with frontend via xtask codegen
// ═══════════════════════════════════════════════════════════════

/// UI grouping bucket for a boot step.
///
/// The TypeScript-literal form (`as_ts_literal`) must stay aligned with
/// `SubsystemGroupKind` in `interfaces/desktop/src/lib/layouts/app/StatusBar.types.ts`.
/// `cargo xtask generate-ts-manifest` emits the TS source from this enum.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ServiceGroup {
    /// Data stores: Turso, `DuckDB`, `Moka`.
    Stores,
    /// Graph services: `SurrealDB` namespaces + HTTP sidecar.
    Graph,
    /// AI capability surface: Model Loader, Vector store.
    Ai,
    /// Platform plumbing: preflight, Grammar service, etc.
    System,
}

impl ServiceGroup {
    /// TypeScript-literal form. Must match `SubsystemGroupKind` in the frontend.
    pub const fn as_ts_literal(self) -> &'static str {
        match self {
            Self::Stores => "stores",
            Self::Graph => "graph",
            Self::Ai => "ai",
            Self::System => "system",
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ServiceMeta — bootable services
// ═══════════════════════════════════════════════════════════════

/// Compile-time metadata for a platform service.
#[derive(Debug, Clone, Copy)]
pub struct ServiceMeta {
    /// Which service role this entry describes.
    pub role: ServiceRole,
    /// Which data scope this service belongs to.
    pub scope: DataScope,
    /// Boot stage number (1-indexed, sequential).
    pub stage: u8,
    /// Human-readable name for logs, health checks, Rust-side error messages.
    pub public_name: &'static str,
    /// Cargo feature gate — `None` means always compiled in.
    pub feature_gate: Option<&'static str>,
    /// `InitEvent` `step_id` this service emits during boot.
    /// `None` for services lazy-started outside the boot pipeline
    /// (e.g. `DevForge`). Services with a `step_id` MUST have a matching
    /// entry in [`BOOT_STEP_MANIFEST`] — enforced by unit test.
    pub step_id: Option<&'static str>,
    /// UI grouping for the status bar / boot overlay.
    pub group: ServiceGroup,
}

/// The service manifest — one entry per bootable service.
///
/// Order matches boot sequence. This is the SSOT for "what services
/// exist in the platform and in what order they boot."
pub const SERVICE_MANIFEST: &[ServiceMeta] = &[
    // ── Stage 1: Preflight is not a service — it's a boot step ──
    ServiceMeta {
        role: ServiceRole::Surreal,
        scope: DataScope::System,
        stage: 2,
        public_name: "SurrealDB Sidecar",
        feature_gate: None,
        step_id: Some("SurrealDB sidecar"),
        group: ServiceGroup::Graph,
    },
    ServiceMeta {
        role: ServiceRole::Relational,
        scope: DataScope::System,
        stage: 2,
        public_name: "System Database",
        feature_gate: None,
        step_id: Some("System relational"),
        group: ServiceGroup::Stores,
    },
    ServiceMeta {
        role: ServiceRole::Analytics,
        scope: DataScope::System,
        stage: 3,
        public_name: "Analytics Engine",
        feature_gate: None,
        step_id: Some("System analytics"),
        group: ServiceGroup::Stores,
    },
    ServiceMeta {
        role: ServiceRole::Graph,
        scope: DataScope::System,
        stage: 4,
        public_name: "Knowledge Graph",
        feature_gate: None,
        step_id: Some("Graph store"),
        group: ServiceGroup::Graph,
    },
    ServiceMeta {
        role: ServiceRole::Cache,
        scope: DataScope::System,
        stage: 5,
        public_name: "System Cache",
        feature_gate: None,
        step_id: Some("System cache"),
        group: ServiceGroup::Stores,
    },
    ServiceMeta {
        role: ServiceRole::Relational,
        scope: DataScope::User,
        stage: 6,
        public_name: "User Database",
        feature_gate: None,
        step_id: Some("User relational"),
        group: ServiceGroup::Stores,
    },
    ServiceMeta {
        role: ServiceRole::Analytics,
        scope: DataScope::User,
        stage: 6,
        public_name: "User Analytics",
        feature_gate: None,
        step_id: Some("User analytics"),
        group: ServiceGroup::Stores,
    },
    ServiceMeta {
        role: ServiceRole::Graph,
        scope: DataScope::User,
        stage: 6,
        public_name: "User Knowledge",
        feature_gate: None,
        step_id: Some("User graph namespace"),
        group: ServiceGroup::Graph,
    },
    ServiceMeta {
        role: ServiceRole::Graph,
        scope: DataScope::Global,
        stage: 6,
        public_name: "Shared Knowledge",
        feature_gate: None,
        step_id: Some("Global graph namespace"),
        group: ServiceGroup::Graph,
    },
    ServiceMeta {
        role: ServiceRole::Vector,
        scope: DataScope::System,
        stage: 7,
        public_name: "Vector Store",
        feature_gate: Some("rro"),
        step_id: Some("Vector store"),
        group: ServiceGroup::Ai,
    },
    ServiceMeta {
        role: ServiceRole::Grammar,
        scope: DataScope::System,
        stage: 9,
        public_name: "Grammar Engine",
        feature_gate: None, // Skipped at runtime, not feature-gated
        step_id: Some("Grammar service"),
        group: ServiceGroup::System,
    },
    // Stages 10-11 (Embedder, Whisper) DELETED — slot-managed by model loader.
    ServiceMeta {
        role: ServiceRole::ModelLoader,
        scope: DataScope::System,
        stage: 12,
        public_name: "Model Manager",
        feature_gate: Some("inference"),
        step_id: Some("Model Loader"),
        group: ServiceGroup::Ai,
    },
    ServiceMeta {
        role: ServiceRole::DevForge,
        scope: DataScope::System,
        stage: 13,
        public_name: "Code Editor",
        feature_gate: None,
        // DevForge is lazy-started by `ensure_devforge_started`, not by the
        // boot pipeline. No InitEvent is emitted for it during boot.
        step_id: None,
        group: ServiceGroup::System,
    },
    ServiceMeta {
        role: ServiceRole::Ollama,
        scope: DataScope::System,
        stage: 14,
        public_name: "Ollama Sidecar",
        feature_gate: None,
        // Ollama is lazy-started by `ensure_ollama_started` from the
        // devtool. No InitEvent emitted during boot.
        step_id: None,
        group: ServiceGroup::System,
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
        ServiceRole::Surreal => 0,
        ServiceRole::Relational => 1, // System relational (first entry)
        ServiceRole::Analytics => 2,
        ServiceRole::Graph => 3, // System graph (first entry)
        ServiceRole::Cache => 4,
        ServiceRole::Vector => 8,
        ServiceRole::Grammar => 9,
        ServiceRole::ModelLoader => 10,
        ServiceRole::DevForge => 11,
        ServiceRole::Ollama => 12,
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

// ═══════════════════════════════════════════════════════════════
// BootStepMeta — every InitEvent step_id the boot pipeline emits
// ═══════════════════════════════════════════════════════════════

/// A single step emitted by the boot pipeline via `InitEvent`.
///
/// Every literal string passed to `on_event(InitEvent::running/ok/error/skipped(...))`
/// in `platform/boot/*` MUST appear here. This is the SSOT for:
///   - UI classification (stores/graph/ai/system grouping)
///   - Feature gating (which steps may appear)
///   - Service mapping (which steps correspond to a validated service)
///
/// Enforced by the unit tests at the bottom of this file.
#[derive(Debug, Clone, Copy)]
pub struct BootStepMeta {
    /// Literal string passed to `InitEvent` — SSOT identity.
    pub step_id: &'static str,
    /// UI grouping for the status bar / boot overlay.
    pub group: ServiceGroup,
    /// Cargo feature gate. `None` = always emitted.
    pub feature_gate: Option<&'static str>,
    /// If this step corresponds to a service validated at boot end,
    /// the (role, scope) pair. `None` for meta-steps such as
    /// `preflight`, `SurrealDB HTTP`, `Knowledge sync`.
    pub service_ref: Option<(ServiceRole, DataScope)>,
}

/// Every `InitEvent::step` string the boot pipeline may emit.
///
/// Ordering roughly follows boot sequence for readability, but lookups
/// go through [`boot_step_for`] so order is not load-bearing.
pub const BOOT_STEP_MANIFEST: &[BootStepMeta] = &[
    BootStepMeta {
        step_id: "preflight",
        group: ServiceGroup::System,
        feature_gate: None,
        service_ref: None,
    },
    BootStepMeta {
        step_id: "System relational",
        group: ServiceGroup::Stores,
        feature_gate: None,
        service_ref: Some((ServiceRole::Relational, DataScope::System)),
    },
    BootStepMeta {
        step_id: "System analytics",
        group: ServiceGroup::Stores,
        feature_gate: None,
        service_ref: Some((ServiceRole::Analytics, DataScope::System)),
    },
    BootStepMeta {
        step_id: "System cache",
        group: ServiceGroup::Stores,
        feature_gate: None,
        service_ref: Some((ServiceRole::Cache, DataScope::System)),
    },
    BootStepMeta {
        step_id: "User relational",
        group: ServiceGroup::Stores,
        feature_gate: None,
        service_ref: Some((ServiceRole::Relational, DataScope::User)),
    },
    BootStepMeta {
        step_id: "User analytics",
        group: ServiceGroup::Stores,
        feature_gate: None,
        service_ref: Some((ServiceRole::Analytics, DataScope::User)),
    },
    BootStepMeta {
        step_id: "Graph store",
        group: ServiceGroup::Graph,
        feature_gate: None,
        service_ref: Some((ServiceRole::Graph, DataScope::System)),
    },
    BootStepMeta {
        step_id: "User graph namespace",
        group: ServiceGroup::Graph,
        feature_gate: None,
        service_ref: Some((ServiceRole::Graph, DataScope::User)),
    },
    BootStepMeta {
        step_id: "Global graph namespace",
        group: ServiceGroup::Graph,
        feature_gate: None,
        service_ref: Some((ServiceRole::Graph, DataScope::Global)),
    },
    BootStepMeta {
        step_id: "SurrealDB sidecar",
        group: ServiceGroup::Graph,
        feature_gate: None,
        service_ref: Some((ServiceRole::Surreal, DataScope::System)),
    },
    BootStepMeta {
        // HTTP endpoint exposed by the sidecar — not a validated service on its own.
        step_id: "SurrealDB HTTP",
        group: ServiceGroup::Graph,
        feature_gate: None,
        service_ref: None,
    },
    BootStepMeta {
        step_id: "Model Loader",
        group: ServiceGroup::Ai,
        feature_gate: Some("inference"),
        service_ref: Some((ServiceRole::ModelLoader, DataScope::System)),
    },
    BootStepMeta {
        step_id: "Vector store",
        group: ServiceGroup::Ai,
        feature_gate: Some("rro"),
        service_ref: Some((ServiceRole::Vector, DataScope::System)),
    },
    BootStepMeta {
        step_id: "Grammar service",
        group: ServiceGroup::System,
        feature_gate: None,
        service_ref: Some((ServiceRole::Grammar, DataScope::System)),
    },
];

/// Look up a boot step by its `InitEvent` `step_id` string.
pub fn boot_step_for(step_id: &str) -> Option<&'static BootStepMeta> {
    BOOT_STEP_MANIFEST.iter().find(|s| s.step_id == step_id)
}

// ═══════════════════════════════════════════════════════════════
// Tests — SSOT cross-consistency
// ═══════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn every_service_meta_step_id_is_in_boot_step_manifest() {
        for svc in SERVICE_MANIFEST {
            let Some(step_id) = svc.step_id else { continue };
            let step = boot_step_for(step_id).unwrap_or_else(|| {
                panic!(
                    "ServiceMeta step_id `{step_id}` (role={:?}, scope={:?}) is not in BOOT_STEP_MANIFEST",
                    svc.role, svc.scope
                )
            });
            assert_eq!(
                step.group, svc.group,
                "group mismatch for step_id `{step_id}`: service={:?}, boot_step={:?}",
                svc.group, step.group
            );
            assert_eq!(
                step.feature_gate, svc.feature_gate,
                "feature_gate mismatch for step_id `{step_id}`"
            );
            assert_eq!(
                step.service_ref,
                Some((svc.role, svc.scope)),
                "service_ref mismatch for step_id `{step_id}`"
            );
        }
    }

    #[test]
    fn every_manifest_entry_has_config_flags() {
        // Every `(role, scope)` in SERVICE_MANIFEST must round-trip through
        // `PlatformBootConfig::service_flags`. Drift here is the mistake
        // this test catches: a new `ServiceMeta` was added without a
        // matching arm in `service_flags`, and the devtool would silently
        // report `config_enabled=false` forever.
        use crate::platform::config::PlatformBootConfig;
        let cfg = PlatformBootConfig::default();
        for svc in SERVICE_MANIFEST {
            assert!(
                cfg.service_flags(svc.role, svc.scope).is_some(),
                "SERVICE_MANIFEST entry (role={:?}, scope={:?}) has no \
                 arm in PlatformBootConfig::service_flags — \
                 services_status() would report it as ConfigDisabled forever",
                svc.role,
                svc.scope,
            );
        }
    }

    #[test]
    fn boot_step_ids_are_unique() {
        let mut seen = HashSet::new();
        for step in BOOT_STEP_MANIFEST {
            assert!(
                seen.insert(step.step_id),
                "duplicate step_id in BOOT_STEP_MANIFEST: `{}`",
                step.step_id
            );
        }
    }

    #[test]
    fn service_group_ts_literals_are_stable() {
        // The frontend SubsystemGroupKind type depends on these exact strings.
        assert_eq!(ServiceGroup::Stores.as_ts_literal(), "stores");
        assert_eq!(ServiceGroup::Graph.as_ts_literal(), "graph");
        assert_eq!(ServiceGroup::Ai.as_ts_literal(), "ai");
        assert_eq!(ServiceGroup::System.as_ts_literal(), "system");
    }

    /// Cross-file SSOT enforcement — the TypeScript mirror of
    /// `BOOT_STEP_MANIFEST` must contain exactly the same (step_id, group)
    /// pairs. If a Rust entry is added without mirroring to TS (or vice
    /// versa), this test fails at `cargo test` time.
    #[test]
    fn ts_manifest_matches_rust_manifest() {
        let ts_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../interfaces/desktop/src/lib/sys/generated/service-manifest.ts");
        let src = std::fs::read_to_string(&ts_path).unwrap_or_else(|e| {
            panic!(
                "could not read TS manifest at {} — has the file been deleted? {e}",
                ts_path.display()
            )
        });

        // Scan only the `BOOT_STEP_MANIFEST` array block. We assume every
        // entry is one object literal per line with `step_id:` and `group:`
        // keys in that order — which is the file's convention, enforced
        // by this test's own parsing brittleness.
        let mut ts_pairs: Vec<(String, String)> = Vec::new();
        let start = src
            .find("BOOT_STEP_MANIFEST: readonly BootStepMeta[] = Object.freeze([")
            .expect("marker start not found in TS manifest — file shape changed");
        let tail = &src[start..];
        let end = tail
            .find("]) as readonly")
            .expect("marker end not found in TS manifest — file shape changed");
        let block = &tail[..end];

        for line in block.lines() {
            let Some(sid_start) = line.find("step_id: \"") else {
                continue;
            };
            let rest = &line[sid_start + "step_id: \"".len()..];
            let Some(sid_end) = rest.find('"') else {
                continue;
            };
            let step_id = rest[..sid_end].to_string();

            let after = &rest[sid_end + 1..];
            let Some(grp_start) = after.find("group: \"") else {
                continue;
            };
            let grest = &after[grp_start + "group: \"".len()..];
            let Some(grp_end) = grest.find('"') else {
                continue;
            };
            let group = grest[..grp_end].to_string();

            ts_pairs.push((step_id, group));
        }

        let rust_pairs: Vec<(String, String)> = BOOT_STEP_MANIFEST
            .iter()
            .map(|s| (s.step_id.to_string(), s.group.as_ts_literal().to_string()))
            .collect();

        assert_eq!(
            ts_pairs.len(),
            rust_pairs.len(),
            "boot-step entry count drift: ts={}, rust={}\n  ts={:?}\n  rust={:?}",
            ts_pairs.len(),
            rust_pairs.len(),
            ts_pairs,
            rust_pairs,
        );
        for (i, (rust, ts)) in rust_pairs.iter().zip(ts_pairs.iter()).enumerate() {
            assert_eq!(
                rust, ts,
                "boot-step entry #{i} differs between Rust and TS manifests\n  \
                 rust: step_id={}, group={}\n  \
                 ts:   step_id={}, group={}",
                rust.0, rust.1, ts.0, ts.1,
            );
        }
    }
}
