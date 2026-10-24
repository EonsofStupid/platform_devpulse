//! Module lifecycle contract — the foundation every platform module implements.
//!
//! This trait is artifact #3 of the Module Charter (see
//! `scripts/docs/sprints/SPRINT-FOUNDATIONAL-REBUILD-MODULE-CHARTER.md`):
//! every capability, store, executor, integration, and runtime-primitive
//! satisfies [`ManagedModule`] to exist in the codebase.
//!
//! # The contract
//!
//! Every module is:
//!
//! - **identified** — stable `snake_case` ID, schema version, axis placement
//! - **lifecycle-complete** — `start`, `stop`, `restart`, `health` all available
//! - **log-exportable** — every module surfaces a way to ship its own telemetry
//! - **dependency-declaring** — dependencies are static so the boot orchestrator
//!   can resolve the graph up-front
//!
//! # Axis taxonomy
//!
//! Five axes, mirrored in the filesystem and config tree:
//!
//! | [`ModuleAxis`] | `config/platform/` folder | Purpose |
//! |---|---|---|
//! | [`ModuleAxis::Runtime`] | `runtime/` | Platform primitives (boot, portable, telemetry, network, windows) |
//! | [`ModuleAxis::Store`] | `stores/` | Persistent state backends (turso, duckdb, surrealdb, cache, `project_db`) |
//! | [`ModuleAxis::Executor`] | `runtimes/` | Process / model execution backends (candle, ollama, devforge) |
//! | [`ModuleAxis::Capability`] | `capabilities/` | Product-facing user verbs (chat, reasoning, voice) |
//! | [`ModuleAxis::Integration`] | `integrations/` | External providers (claude) |
//!
//! # Relationship to [`crate::platform::services::Service`]
//!
//! [`ManagedModule`] supersedes the older `Service` trait. The two coexist
//! during the foundational rebuild; `Service` is deleted on a per-module
//! basis as each is rebuilt to the charter shape. Per the pre-release
//! policy, no backwards-compat shim bridges the two — a rebuilt module
//! removes its `Service` impl in the same commit that adds its
//! `ManagedModule` impl.
//!
//! # IP boundary
//!
//! Implementations MUST NOT surface kernel-internal vocabulary in identity,
//! health reasons, error messages, or log exports. See
//! `.claude/rules/ip-protection.md`.

#![allow(clippy::module_name_repetitions)]

use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::{Path, PathBuf};
use thiserror::Error;

// ════════════════════════════════════════════════════════════════════
// ModuleId — stable identifier
// ════════════════════════════════════════════════════════════════════

/// Stable module identifier — `snake_case`, matches folder + TOML + struct name.
///
/// Constructed from a `&'static str` so IDs can be declared as `const`.
/// Two modules with the same `ModuleId` are by definition the same module;
/// charter preflight enforces uniqueness across the codebase.
///
/// # Example
/// ```ignore
/// const TURSO: ModuleId = ModuleId::new("turso");
/// ```
#[derive(
    Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize, Type,
)]
#[serde(transparent)]
pub struct ModuleId(pub &'static str);

impl ModuleId {
    /// Construct from a static string.
    ///
    /// Prefer declaring module IDs as `const ID: ModuleId = ModuleId::new("foo");`
    /// in the module's own file so the identifier is a single SSOT.
    #[must_use]
    pub const fn new(id: &'static str) -> Self {
        Self(id)
    }

    /// The raw string form of this ID.
    #[must_use]
    pub const fn as_str(&self) -> &'static str {
        self.0
    }
}

impl std::fmt::Display for ModuleId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.0)
    }
}

// ════════════════════════════════════════════════════════════════════
// ModuleAxis — the five-axis taxonomy
// ════════════════════════════════════════════════════════════════════

/// The five-axis taxonomy of the platform.
///
/// Every module belongs to exactly one axis. The axis determines which
/// folder the module's files live in, which category its TOML is grouped
/// under, and which side of the devtool navigation surfaces it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
pub enum ModuleAxis {
    /// Platform primitives — portable flags, boot gate, telemetry, network, Windows quirks.
    ///
    /// Folder: `config/platform/runtime/`.
    Runtime,

    /// Persistent state backends — turso, duckdb, surrealdb, cache, `project_db`.
    ///
    /// Folder: `config/platform/stores/`.
    Store,

    /// Process or model execution backends — candle, ollama (sidecar + embedded), devforge.
    ///
    /// Folder: `config/platform/runtimes/`.
    Executor,

    /// Product-facing user capabilities — chat, reasoning, rosetta stone, translator, voice, model runtime.
    ///
    /// Folder: `config/platform/capabilities/`.
    Capability,

    /// External provider integrations — claude, future API adapters.
    ///
    /// Folder: `config/platform/integrations/`.
    Integration,
}

impl ModuleAxis {
    /// The `config/platform/` folder name for this axis.
    #[must_use]
    pub const fn folder(self) -> &'static str {
        match self {
            Self::Runtime => "runtime",
            Self::Store => "stores",
            Self::Executor => "runtimes",
            Self::Capability => "capabilities",
            Self::Integration => "integrations",
        }
    }

    /// Parse an axis from its folder name.
    ///
    /// Used by the config loader and charter preflight to derive the axis
    /// from filesystem layout (single source of truth).
    #[must_use]
    pub fn from_folder(name: &str) -> Option<Self> {
        Some(match name {
            "runtime" => Self::Runtime,
            "stores" => Self::Store,
            "runtimes" => Self::Executor,
            "capabilities" => Self::Capability,
            "integrations" => Self::Integration,
            _ => return None,
        })
    }
}

impl std::fmt::Display for ModuleAxis {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.folder())
    }
}

// ════════════════════════════════════════════════════════════════════
// StartMode — how a module enters the running state
// ════════════════════════════════════════════════════════════════════

/// How a module transitions from stopped to running.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
pub enum StartMode {
    /// Started during platform boot. Boot blocks until `health` returns [`ModuleHealth::Up`].
    ///
    /// Use for modules that every subsequent module depends on (core stores, telemetry).
    Eager,

    /// Started transparently on first use.
    ///
    /// Use for modules that are expensive to start but usable if cold (inference backends).
    Lazy,

    /// Started only by explicit user action (devtool "Start" button, command).
    ///
    /// Use for modules with significant resource cost where the user should opt in
    /// (`DevForge`, heavyweight models).
    OnDemand,
}

// ════════════════════════════════════════════════════════════════════
// ModuleStability — tier for UI gating and API promises
// ════════════════════════════════════════════════════════════════════

/// Stability tier. Matches `systems/devpulse-engine/ip/signals.registry.yaml` tiers.
///
/// Charter rule C8: experimental modules are hidden in non-dev builds
/// (`DEVPULSE_DEV=1` required to see them).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
pub enum ModuleStability {
    /// Subject to change without notice. Hidden in non-dev builds.
    Experimental,

    /// Usable and field-tested, but config schema may still evolve.
    Beta,

    /// Stable contract. Breaking config changes require schema version bump.
    Stable,
}

// ════════════════════════════════════════════════════════════════════
// ModuleIdentity — the stable public description
// ════════════════════════════════════════════════════════════════════

/// Stable public description of a module.
///
/// This is what surfaces in devtools, commands, logs, and telemetry.
/// Nothing inside `ModuleIdentity` may reference kernel-internal vocabulary.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ModuleIdentity {
    /// Stable `snake_case` identifier.
    pub id: ModuleId,

    /// Human-readable display name (e.g., `"Turso"`, `"Rosetta Stone"`).
    pub title: &'static str,

    /// One-line description, layman-phrased.
    pub description: &'static str,

    /// Config schema version. Bumped on breaking config changes.
    pub schema_version: u32,

    /// Stability tier.
    pub stability: ModuleStability,

    /// Axis placement (drives folder, devtool route, TOML group).
    pub axis: ModuleAxis,
}

// ════════════════════════════════════════════════════════════════════
// ModuleHealth — runtime state
// ════════════════════════════════════════════════════════════════════

/// Current health of a module.
///
/// Distinct from aggregate [`crate::platform::health::HealthStatus`] (which
/// is the platform-wide roll-up) and from the legacy `ServiceState`
/// (which [`ManagedModule`] replaces).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(tag = "state", rename_all = "snake_case")]
pub enum ModuleHealth {
    /// Transitioning from stopped toward running.
    Starting,

    /// Operational. Serving requests normally.
    Up,

    /// Operational but reporting a problem (slow, missing optional feature, etc.).
    Degraded {
        /// Layman-phrased reason.
        reason: String,
    },

    /// Not operational.
    Down {
        /// Layman-phrased reason.
        reason: String,
    },

    /// Stopped by explicit request. Not a failure.
    Stopped,
}

impl ModuleHealth {
    /// `true` iff this health state indicates the module can serve requests.
    #[must_use]
    pub const fn is_usable(&self) -> bool {
        matches!(self, Self::Up | Self::Degraded { .. })
    }
}

// ════════════════════════════════════════════════════════════════════
// ModuleError — lifecycle failure type
// ════════════════════════════════════════════════════════════════════

/// Lifecycle error returned by every [`ManagedModule`] method.
///
/// Every variant carries the [`ModuleId`] that failed so aggregators can
/// attribute correctly. `#[source]` is used for error chaining so
/// `{:#}` formatting walks the cause chain.
#[derive(Debug, Error)]
pub enum ModuleError {
    /// Config failed validation — missing field, bad value, schema mismatch.
    #[error("module `{module}` config invalid: {reason}")]
    ConfigInvalid {
        /// The module whose config failed.
        module: ModuleId,
        /// Layman-phrased reason.
        reason: String,
    },

    /// Start failed — service could not initialize.
    #[error("module `{module}` failed to start: {source}")]
    StartFailed {
        /// The module that failed.
        module: ModuleId,
        /// Underlying cause.
        #[source]
        source: anyhow::Error,
    },

    /// Stop failed — service would not release resources cleanly.
    #[error("module `{module}` failed to stop: {source}")]
    StopFailed {
        /// The module that failed.
        module: ModuleId,
        /// Underlying cause.
        #[source]
        source: anyhow::Error,
    },

    /// Restart failed (default restart implementation covers both stop and start).
    #[error("module `{module}` failed to restart: {source}")]
    RestartFailed {
        /// The module that failed.
        module: ModuleId,
        /// Underlying cause.
        #[source]
        source: anyhow::Error,
    },

    /// Health check failed (usually transient).
    #[error("module `{module}` health check failed: {source}")]
    HealthCheckFailed {
        /// The module that failed.
        module: ModuleId,
        /// Underlying cause.
        #[source]
        source: anyhow::Error,
    },

    /// A required dependency is not yet running.
    #[error("module `{module}` cannot start — dependency `{dependency}` is not ready")]
    DependencyMissing {
        /// The module that failed.
        module: ModuleId,
        /// The missing dependency.
        dependency: ModuleId,
    },

    /// Log export failed.
    #[error("module `{module}` log export failed: {source}")]
    LogExportFailed {
        /// The module that failed.
        module: ModuleId,
        /// Underlying cause.
        #[source]
        source: anyhow::Error,
    },

    /// I/O error at the module boundary.
    #[error("module `{module}` I/O error: {source}")]
    Io {
        /// The module that failed.
        module: ModuleId,
        /// Underlying cause.
        #[source]
        source: std::io::Error,
    },
}

impl ModuleError {
    /// The module ID attributed to this error.
    #[must_use]
    pub const fn module(&self) -> ModuleId {
        match self {
            Self::ConfigInvalid { module, .. }
            | Self::StartFailed { module, .. }
            | Self::StopFailed { module, .. }
            | Self::RestartFailed { module, .. }
            | Self::HealthCheckFailed { module, .. }
            | Self::DependencyMissing { module, .. }
            | Self::LogExportFailed { module, .. }
            | Self::Io { module, .. } => *module,
        }
    }
}

// ════════════════════════════════════════════════════════════════════
// ManagedModule — the lifecycle trait
// ════════════════════════════════════════════════════════════════════

/// The lifecycle contract every platform module implements.
///
/// # Method semantics
///
/// - [`identity`](Self::identity) — cheap, synchronous; returns the module's
///   stable description.
/// - [`config_version`](Self::config_version) — reports the module's current
///   config schema version. Default reads [`ModuleIdentity::schema_version`].
/// - [`start`](Self::start) — **idempotent**. Calling on an already-`Up`
///   module returns `Ok(())`.
/// - [`stop`](Self::stop) — **idempotent**. Calling on an already-`Stopped`
///   module returns `Ok(())`.
/// - [`restart`](Self::restart) — default is `stop().await?; start().await?;`.
///   Override for atomic restart (swap-and-drain patterns).
/// - [`health`](Self::health) — does real work (ping, probe). Callers may
///   invoke frequently; implementers should cache aggressively but not lie.
/// - [`export_logs`](Self::export_logs) — writes a bundle to `dest` and
///   returns the artifact path. Modules with no dedicated log stream return
///   [`ModuleError::LogExportFailed`] with a clear reason.
/// - [`dependencies`](Self::dependencies) — returns IDs of modules that
///   must be `Up` before `start` can succeed. The boot orchestrator reads
///   this to build the dependency graph; it never calls `start` on a
///   module whose dependencies aren't `Up`.
///
/// # Idempotency
///
/// Lifecycle methods are idempotent by contract. The devtool surfaces
/// "Start" / "Stop" / "Restart" as one-shot buttons; accidental double-click
/// must not produce errors.
///
/// # Concurrency
///
/// `Send + Sync + 'static` so modules can be held in
/// `Arc<dyn ManagedModule>` registries and shared across tasks.
///
/// # IP boundary
///
/// Error messages, health reasons, and log exports pass through the engine's
/// translator layer before reaching any public surface. No kernel vocabulary
/// leaks from a `ManagedModule` implementation.
#[allow(async_fn_in_trait)]
pub trait ManagedModule: Send + Sync + 'static {
    /// Stable identity for this module.
    fn identity(&self) -> &ModuleIdentity;

    /// Config schema version this module currently supports.
    ///
    /// Default reads [`ModuleIdentity::schema_version`]. Override only if the
    /// running module reports a different runtime version (e.g., after
    /// live migration).
    fn config_version(&self) -> u32 {
        self.identity().schema_version
    }

    /// Start the module. Idempotent.
    ///
    /// # Errors
    /// - [`ModuleError::ConfigInvalid`] — config failed validation.
    /// - [`ModuleError::DependencyMissing`] — a required dependency isn't ready.
    /// - [`ModuleError::StartFailed`] — initialization failed.
    async fn start(&self) -> Result<(), ModuleError>;

    /// Stop the module. Idempotent.
    ///
    /// # Errors
    /// - [`ModuleError::StopFailed`] — resource release failed.
    async fn stop(&self) -> Result<(), ModuleError>;

    /// Restart the module.
    ///
    /// Default implementation is `stop` followed by `start`. Override for
    /// atomic restart.
    ///
    /// # Errors
    /// - [`ModuleError::RestartFailed`] — wrapped failure from stop or start.
    async fn restart(&self) -> Result<(), ModuleError> {
        self.stop().await?;
        self.start().await?;
        Ok(())
    }

    /// Current health. Does real work (ping, probe).
    async fn health(&self) -> ModuleHealth;

    /// Export this module's logs to a destination directory.
    ///
    /// Returns the path of the exported artifact (usually a `.jsonl` or
    /// `.zip` under `dest`). Modules with no dedicated log stream return
    /// [`ModuleError::LogExportFailed`] with a clear reason.
    ///
    /// # Errors
    /// - [`ModuleError::LogExportFailed`] — export pipeline failed.
    /// - [`ModuleError::Io`] — writing to `dest` failed.
    async fn export_logs(&self, dest: &Path) -> Result<PathBuf, ModuleError>;

    /// Modules that must be [`ModuleHealth::Up`] before [`start`](Self::start)
    /// can succeed.
    ///
    /// Default is no dependencies. Override to declare a fixed list — the
    /// boot orchestrator uses this to build the dependency graph.
    fn dependencies(&self) -> &[ModuleId] {
        &[]
    }
}

// ════════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn module_id_round_trip() {
        const TURSO: ModuleId = ModuleId::new("turso");
        assert_eq!(TURSO.as_str(), "turso");
        assert_eq!(format!("{TURSO}"), "turso");
    }

    #[test]
    fn axis_folder_round_trip() {
        for axis in [
            ModuleAxis::Runtime,
            ModuleAxis::Store,
            ModuleAxis::Executor,
            ModuleAxis::Capability,
            ModuleAxis::Integration,
        ] {
            let folder = axis.folder();
            assert_eq!(ModuleAxis::from_folder(folder), Some(axis));
        }
    }

    #[test]
    fn axis_folder_rejects_unknown() {
        assert_eq!(ModuleAxis::from_folder("system"), None);
        assert_eq!(ModuleAxis::from_folder("services"), None);
        assert_eq!(ModuleAxis::from_folder(""), None);
    }

    #[test]
    fn module_health_is_usable() {
        assert!(ModuleHealth::Up.is_usable());
        assert!(ModuleHealth::Degraded {
            reason: "slow".into()
        }
        .is_usable());
        assert!(!ModuleHealth::Starting.is_usable());
        assert!(!ModuleHealth::Down {
            reason: "crashed".into()
        }
        .is_usable());
        assert!(!ModuleHealth::Stopped.is_usable());
    }

    #[test]
    fn module_error_attributes_module_id() {
        const FOO: ModuleId = ModuleId::new("foo");
        let err = ModuleError::ConfigInvalid {
            module: FOO,
            reason: "missing port".into(),
        };
        assert_eq!(err.module(), FOO);
    }
}
