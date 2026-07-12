//! Public service status snapshot — the unified surface the devtools renders.
//!
//! Every entry is derived from the SSOT [`SERVICE_MANIFEST`] at the
//! moment `Platform::services_status()` is called. There is NO parallel
//! `DatabaseConfig`-style mirror: adding a service means adding one
//! `ServiceMeta` entry + the corresponding `ServiceEntry` in config.
//! The UI picks it up with zero churn.
//!
//! # Three signals per service
//! - `compiled_in`    — was the cargo `feature_gate` active for this build?
//! - `config_enabled` — is `[services.<scope>.<role>].enabled` true in TOML?
//! - `runtime_state`  — is the service Arc actually present right now?
//!
//! The UI renders whichever of these is the source of the current
//! state so the user sees exactly why something is or isn't live.
//!
//! The frontend mirror of `ServiceRuntimeState` is code-generated via
//! `tauri-specta` into `interfaces/desktop/src/lib/sys/generated/bindings.ts`.
//! No hand-maintained enum mirror — `cargo xtask regen-bindings`
//! updates the TS.

use serde::Serialize;
use specta::Type;

use super::manifest::{ServiceMeta, SERVICE_MANIFEST};
use super::ServiceRole;
use crate::platform::config::DataScope;

/// Whether a service is actually alive right now.
///
/// Complements the static `compiled_in` / `config_enabled` fields —
/// this is the dynamic signal that can change after boot (`DevForge`
/// lazy-start, `Ollama` sidecar start/stop, grammar toggle).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum ServiceRuntimeState {
    /// Cargo feature not compiled in. Not available in this build.
    NotCompiled,
    /// Compiled in, but `enabled = false` in config.
    ConfigDisabled,
    /// Compiled + config-enabled, but the service Arc is currently absent
    /// (lazy service not yet started, or boot skipped it).
    Stopped,
    /// Service Arc is present — it booted and hasn't been torn down.
    Running,
    /// Runtime state cannot be reported (e.g. no accessor on Platform).
    /// Caller should rely on `compiled_in` / `config_enabled` instead.
    Unknown,
}

/// Public, TS-exported snapshot of one entry in [`SERVICE_MANIFEST`]
/// at a single point in time.
#[derive(Debug, Clone, Serialize, Type)]
pub struct ServiceStatusSnapshot {
    /// Role identifier — maps to [`ServiceRole`].
    pub role: ServiceRole,
    /// Scope bucket — maps to [`DataScope`].
    pub scope: DataScope,
    /// Boot stage number from the manifest.
    pub stage: u8,
    /// Public name ("Vector Store", "Grammar Engine", …).
    pub public_name: String,
    /// UI grouping literal — matches `ServiceGroup::as_ts_literal`.
    pub group: String,
    /// Cargo feature that gates this service. `None` = always compiled.
    pub feature_gate: Option<String>,
    /// `InitEvent` `step_id` (absent for lazy services).
    pub step_id: Option<String>,
    /// Was the feature compiled into this build?
    pub compiled_in: bool,
    /// `enabled = true` in the TOML config?
    pub config_enabled: bool,
    /// `critical = true` in the TOML config?
    pub config_critical: bool,
    /// Dynamic runtime liveness — see [`ServiceRuntimeState`].
    pub runtime_state: ServiceRuntimeState,
}

/// Evaluate the cargo-feature gate on `meta` against the features this
/// build was compiled with. Keep the `match` exhaustive on every gate
/// name that appears in [`SERVICE_MANIFEST`] — `Some(_)` catch-all
/// returns `false` so a new feature string can't silently fall through.
#[must_use]
pub fn feature_gate_compiled_in(meta: &ServiceMeta) -> bool {
    match meta.feature_gate {
        None => true,
        Some("rro") => cfg!(feature = "rro"),
        Some("candle") => cfg!(feature = "candle"),
        Some("inference") => cfg!(feature = "inference"),
        Some("llguidance") => cfg!(feature = "llguidance"),
        Some("sherpa") => cfg!(feature = "sherpa"),
        // Unknown gate string — drift protection: surface as not-compiled
        // so the devtool shows something rather than lying about truthy state.
        Some(_) => false,
    }
}

/// Iterator over all manifest entries. Exposed so `Platform` can zip
/// metadata with its runtime accessors in one place.
pub fn manifest_entries() -> impl Iterator<Item = &'static ServiceMeta> {
    SERVICE_MANIFEST.iter()
}

/// Ergonomic converter — materializes a `ServiceStatusSnapshot` from a
/// manifest entry plus the three dynamic signals the caller resolved.
#[must_use]
pub fn snapshot_from(
    meta: &ServiceMeta,
    config_enabled: bool,
    config_critical: bool,
    runtime_state: ServiceRuntimeState,
) -> ServiceStatusSnapshot {
    let group_literal = meta.group.as_ts_literal();
    ServiceStatusSnapshot {
        role: meta.role,
        scope: meta.scope,
        stage: meta.stage,
        public_name: meta.public_name.to_string(),
        group: group_literal.to_string(),
        feature_gate: meta.feature_gate.map(ToString::to_string),
        step_id: meta.step_id.map(ToString::to_string),
        compiled_in: feature_gate_compiled_in(meta),
        config_enabled,
        config_critical,
        runtime_state,
    }
}
