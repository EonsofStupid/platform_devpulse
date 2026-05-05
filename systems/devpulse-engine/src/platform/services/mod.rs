//! Service modules — one wrapper per database engine.
//!
//! Each service wraps a clyffy adapter with a uniform `Service` trait
//! for config-driven boot and health orchestration.

pub mod analytics;
pub mod cache;
pub mod graph;
pub mod manifest;
pub mod project_db;
pub mod relational;
pub mod rrd_translator;
pub mod status;
#[cfg(feature = "rro")]
pub mod vector;
// embedder + whisper modules DELETED — slot-managed by model loader (Layer 2).
pub mod audio;
pub mod devforge;
#[cfg(feature = "inference")]
pub mod model_loader;
#[cfg(feature = "inference")]
pub mod model_loader_log;
pub mod candle_config;
pub mod llama_cpp_embedded_config;
pub mod routing_config;
pub mod sherpa_streaming;
pub mod sidecars;
pub mod surreal;
pub mod surreal_config;
pub mod voice_stt_config;
pub mod voice_tts_config;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;

/// Identifies a service's role in the platform.
///
/// `Deserialize` is required by `InternalEvent::SidecarPhaseTransition`
/// — the broadcast bus carries `Serialize + Deserialize` payloads so
/// subscribers can round-trip events through OTLP/JSONL exports.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
pub enum ServiceRole {
    /// Relational service (`LibSQL`).
    Relational,
    /// Analytics service (`DuckDB`).
    Analytics,
    /// Graph service (`SurrealDB`).
    Graph,
    /// In-memory cache (`Moka`).
    Cache,
    /// Vector service (`RRO`).
    Vector,
    /// Grammar service (kernel-owned constrained decoding).
    Grammar,
    /// `DevForge` service (managed REH web server).
    DevForge,
    /// Model Loader service (AI model management, inference).
    ModelLoader,
    /// Ollama service (managed `ollama serve` child process).
    Ollama,
    /// Surreal service (managed `surreal start` child process).
    Surreal,
}

/// Lifecycle state of a platform service.
///
/// Enterprise boot state machine. Services transition through these states
/// during boot and runtime. The platform never lies about service state.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
pub enum ServiceState {
    /// Service constructed but boot not yet attempted.
    Created,
    /// Boot in progress — initializing engine, opening files, connecting.
    Booting,
    /// Boot completed and health check passed. Serving requests.
    Ready,
    /// Was ready, but health check failed. May recover on next ping.
    Degraded,
    /// Boot failed or unrecoverable error. Not serving.
    Failed,
}

/// Uniform interface for all platform services.
#[allow(async_fn_in_trait)]
pub trait Service: Send + Sync {
    /// Human-readable name for health checks and events.
    fn name(&self) -> &'static str;

    /// This service's role.
    fn role(&self) -> ServiceRole;

    /// Ping the service — health check. Must do real work.
    async fn ping(&self) -> Result<()>;

    /// Current lifecycle state of this service.
    fn state(&self) -> ServiceState;

    /// Graceful shutdown — flush and release resources.
    ///
    /// Called during platform shutdown before process exit. Implementations
    /// should checkpoint WAL, flush buffers, and release file locks.
    /// Default is no-op for services that don't need explicit cleanup (e.g. Moka).
    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════
// Sidecar lifecycle event taxonomy
// ═══════════════════════════════════════════════════════════════

/// Tracing target every sidecar lifecycle event uses.
///
/// Subscribers (devtool log surface, hot-update orchestrator, OTEL
/// exporter, panic-reporter) filter on this single target. Promoting
/// this constant into [`devpulse-telemetry`]'s OTEL semconv module is
/// a follow-up; living here keeps Phase 1 self-contained.
pub const SIDECAR_LIFECYCLE_TARGET: &str = "sidecar.lifecycle";

/// Phase identifiers for sidecar lifecycle events.
///
/// The taxonomy is complete from day one — currently emitted phases
/// (`PREFLIGHT`, `SPAWNING`, `READY`, `SHUTDOWN`, `FAILED`) coexist
/// with reserved phases (`DEGRADED`, `FROZEN`, `SWAPPING`, `RESUMED`)
/// so the hot-update orchestrator (see `project_sidecar_hot_update.md`)
/// can extend without taxonomy churn. Subscribers should pattern-match
/// the full set rather than the currently emitted subset.
pub mod lifecycle_phase {
    /// Pre-launch checks running (`Preflightable::preflight`).
    pub const PREFLIGHT: &str = "preflight";
    /// Child process about to be spawned.
    pub const SPAWNING: &str = "spawning";
    /// Child responding to health checks; serving traffic.
    pub const READY: &str = "ready";
    /// Was ready, health temporarily failing.
    pub const DEGRADED: &str = "degraded";
    /// Hot-update reserved: child suspended (`SIGSTOP` / Job-Object suspend).
    pub const FROZEN: &str = "frozen";
    /// Hot-update reserved: binary swap in progress on disk.
    pub const SWAPPING: &str = "swapping";
    /// Hot-update reserved: child resumed after binary swap.
    pub const RESUMED: &str = "resumed";
    /// Child shutting down gracefully.
    pub const SHUTDOWN: &str = "shutdown";
    /// Boot failed or unrecoverable error.
    pub const FAILED: &str = "failed";
}

/// Emit a structured sidecar lifecycle event at INFO level.
///
/// Required structured fields: `service` (the [`ServiceRole`], rendered
/// `?role`), `phase` (one of [`lifecycle_phase`] constants). The caller
/// passes any additional fields after the phase using the standard
/// `tracing` field syntax (`field = expr`, `field = ?expr`, `field = %expr`).
///
/// # Example
///
/// ```ignore
/// emit_lifecycle!(ServiceRole::DevForge, lifecycle_phase::READY,
///     bind_addr = %addr,
///     startup_ms = elapsed.as_millis());
/// ```
#[macro_export]
macro_rules! emit_lifecycle {
    ($role:expr, $phase:expr $(, $($rest:tt)*)?) => {
        tracing::info!(
            target: $crate::platform::services::SIDECAR_LIFECYCLE_TARGET,
            service = ?$role,
            phase = $phase
            $(, $($rest)*)?
        );
    };
}

/// Emit a structured sidecar lifecycle event at DEBUG level.
///
/// Use for fine-grained intra-phase events (per-poll-attempt during
/// startup, per-check details inside a preflight pass) that release
/// builds skip. Same field contract as [`emit_lifecycle!`].
#[macro_export]
macro_rules! emit_lifecycle_debug {
    ($role:expr, $phase:expr $(, $($rest:tt)*)?) => {
        tracing::debug!(
            target: $crate::platform::services::SIDECAR_LIFECYCLE_TARGET,
            service = ?$role,
            phase = $phase
            $(, $($rest)*)?
        );
    };
}

/// Emit a sidecar lifecycle event on **BOTH** observability layers in lockstep.
///
/// Per `feedback_dual_observability.md`: a service is "observable" only
/// when it emits BOTH `tracing::*` lifecycle events AND typed
/// `InternalEvent` variants. Tracing alone is invisible to minions and
/// surface-events; `InternalEvent` alone has no log-tail or OTEL trail.
/// This macro enforces 1:1 emission at compile time — if you don't have
/// a `BroadcastSender<InternalEvent>` in scope, you can't emit, which is
/// the right enforcement for "this service isn't observability-integrated yet."
///
/// Required positional arguments:
/// - `$tx` — a `&BroadcastSender<InternalEvent>` (or owned, deref-coerces)
/// - `$role` — `ServiceRole` for the sidecar
/// - `$phase` — one of [`lifecycle_phase`] string constants
/// - `$detail` — `impl ToString` — single human-readable summary; goes to
///   BOTH the tracing `detail` field AND the `InternalEvent.detail` field
///
/// Trailing `key = expr` pairs become tracing-only structured fields
/// (the `InternalEvent` variant only has `detail`, by design — finer
/// shape would force every consumer to break on each new field).
///
/// # Example
///
/// ```ignore
/// emit_lifecycle_dual!(
///     internal_tx,
///     ServiceRole::DevForge,
///     lifecycle_phase::READY,
///     format!("ready at {bind_addr} after {ms} ms"),
///     bind_addr = %bind_addr,
///     pid = ?pid,
///     startup_ms = ms
/// );
/// ```
#[macro_export]
macro_rules! emit_lifecycle_dual {
    ($tx:expr, $role:expr, $phase:expr, $detail:expr $(, $($rest:tt)*)?) => {{
        let __detail_str = ($detail).to_string();
        $crate::emit_lifecycle!(
            $role,
            $phase,
            detail = %__detail_str
            $(, $($rest)*)?
        );
        let _ = $tx.send(
            $crate::platform::facade::events::InternalEvent::SidecarPhaseTransition {
                service: $role,
                phase: ($phase).to_string(),
                detail: __detail_str,
            },
        );
    }};
}

// ═══════════════════════════════════════════════════════════════
// RRD lifecycle taxonomy → moved to kernel/rrd crate
// ═══════════════════════════════════════════════════════════════
//
// `RRD_LIFECYCLE_TARGET`, `rrd_lifecycle_phase`, and the
// `emit_rrd_lifecycle!` macro now live in the `rrd` kernel crate
// (`kernel/rrd/src/lifecycle.rs`) per `HOT_UPDATE_PATTERN.md` §11
// — the daemon must not depend on the engine. The dual-emission
// rule (H12) is preserved structurally by the
// `RrdLifecycleTranslator` tracing layer in
// [`crate::platform::services::rrd_translator`], which mirrors
// every event on the `rrd.lifecycle` target into
// `InternalEvent::RrdPhaseTransition`.
//
// Engine code that wants to observe RRD lifecycle events should
// either (a) subscribe to `query_scoped_log("rrd.lifecycle", ...)`
// for the tracing trail, or (b) subscribe to the broadcast bus
// for `InternalEvent::RrdPhaseTransition` (translator output).

// ═══════════════════════════════════════════════════════════════
// Preflight contract — pre-launch checks for managed sidecars
// ═══════════════════════════════════════════════════════════════

/// Status of a single preflight check.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub enum PreflightStatus {
    /// Check passed — service is safe to launch on this dimension.
    Pass,
    /// Check passed with caveats — service can launch, operator should
    /// review the `detail` field.
    Warn,
    /// Check failed — service must NOT be launched. Boot aborts with
    /// the aggregated failure reasons.
    Fail,
}

/// Outcome of a single preflight check.
///
/// Each check is one discrete probe (e.g. "REH tree present", "user
/// data dir writable", "configured port free") so the registry can
/// surface granular results to devtools and tracing without losing
/// fidelity to a single boolean.
#[derive(Debug, Clone, Serialize)]
pub struct PreflightCheck {
    /// Which sidecar this check belongs to.
    pub service: ServiceRole,
    /// Stable identifier for the probe (e.g. `"reh.tree"`,
    /// `"user_data.writable"`, `"port.free"`). Convention: lowercase
    /// dotted segments scoped to the service.
    pub name: String,
    /// Outcome of the probe.
    pub status: PreflightStatus,
    /// Human-readable detail — path, error message, or context. Always
    /// populated, even on `Pass`, so logs are self-explanatory.
    pub detail: String,
}

impl PreflightCheck {
    /// Construct a passing check.
    #[must_use]
    pub fn pass(
        service: ServiceRole,
        name: impl Into<String>,
        detail: impl Into<String>,
    ) -> Self {
        Self {
            service,
            name: name.into(),
            status: PreflightStatus::Pass,
            detail: detail.into(),
        }
    }

    /// Construct a check with caveats.
    #[must_use]
    pub fn warn(
        service: ServiceRole,
        name: impl Into<String>,
        detail: impl Into<String>,
    ) -> Self {
        Self {
            service,
            name: name.into(),
            status: PreflightStatus::Warn,
            detail: detail.into(),
        }
    }

    /// Construct a failing check.
    #[must_use]
    pub fn fail(
        service: ServiceRole,
        name: impl Into<String>,
        detail: impl Into<String>,
    ) -> Self {
        Self {
            service,
            name: name.into(),
            status: PreflightStatus::Fail,
            detail: detail.into(),
        }
    }
}

/// Pre-launch check contract for managed sidecars.
///
/// Implemented on a stateless view-struct (the service itself does not
/// exist yet at preflight time — it has not been spawned). The view
/// holds borrowed config + paths, runs every probe relevant to that
/// service, and returns one [`PreflightCheck`] per probe.
///
/// Adoption is incremental — a service is not required to implement
/// this trait. Services that do gain pre-launch validation through
/// [`PreflightRegistry`].
#[allow(async_fn_in_trait)]
pub trait Preflightable {
    /// Which service this preflight covers.
    fn role(&self) -> ServiceRole;

    /// Run every probe and return the granular results.
    ///
    /// Implementations should be side-effect-free aside from creating
    /// directories the service is about to require (e.g.
    /// `create_dir_all` on its user-data path), and should not perform
    /// long-running work — preflight runs synchronously inside the
    /// boot path.
    async fn preflight(&self) -> Vec<PreflightCheck>;
}

/// Aggregator for preflight results across one or more sidecars.
///
/// The registry is generic over [`Preflightable`] — no `dyn`, no
/// `Box`. Callers instantiate the per-service preflight view-struct
/// from config + data_dir, hand it to [`PreflightRegistry::run`], and
/// inspect [`PreflightRegistry::checks`] / [`PreflightRegistry::has_fail`]
/// before deciding whether to continue boot.
#[derive(Debug, Default)]
pub struct PreflightRegistry {
    checks: Vec<PreflightCheck>,
}

impl PreflightRegistry {
    /// Construct an empty registry.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Run a [`Preflightable`] and accumulate its results.
    pub async fn run<P: Preflightable>(&mut self, p: &P) {
        self.checks.extend(p.preflight().await);
    }

    /// All accumulated checks across every `run` call so far.
    #[must_use]
    pub fn checks(&self) -> &[PreflightCheck] {
        &self.checks
    }

    /// `true` if any accumulated check has status [`PreflightStatus::Fail`].
    #[must_use]
    pub fn has_fail(&self) -> bool {
        self.checks
            .iter()
            .any(|c| c.status == PreflightStatus::Fail)
    }

    /// Iterator over only the failing checks — useful for building
    /// aggregated boot-error messages.
    pub fn fails(&self) -> impl Iterator<Item = &PreflightCheck> {
        self.checks
            .iter()
            .filter(|c| c.status == PreflightStatus::Fail)
    }
}
