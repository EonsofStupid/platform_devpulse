//! Boot pipeline — sequential, gated initialization of all platform services.
//!
//! # Architecture
//! This file is the **orchestrator only**. Each service has its own boot file:
//! - [`relational`] — Turso (system + user)
//! - [`analytics`] — `DuckDB` (system + user)
//! - [`cache`] — Moka
//!
//! Tier-2 boot stages (graph/vector/model_loader/grammar) removed — those AI
//! services are Clyffy's on GB10, served over the gb10-client wire
//! (kernel-severance). DevPulse-local boot is Tier-1 only.
//!
//! # Boot Sequence
//!  1. **Preflight** — validate config, create directory hierarchy
//!  2. **System relational** (Turso) — CRITICAL
//!  3. **System analytics** (`DuckDB`) — CRITICAL
//!  4. **System cache** (Moka) — CRITICAL
//!  5. **User relational** (Turso) — CRITICAL
//!  6. **User analytics** (`DuckDB`)
//!  7. **Validation** — verify all critical services (config-driven)
//!
//! `DevForge` (VS Code REH) is **not** a boot-time service. It's lazy-started
//! on first `Platform::ensure_devforge_started()` call (user opens the code
//! editor window). Keeping it out of the boot pipeline means cold boot never
//! pays for Node REH health-polling.
//!
//! Most stages complete sequentially. Model Loader runs in parallel with the
//! Graph store via `tokio::join!` because they have zero shared dependency —
//! this saves 3-7s of boot time that was previously wasted blocking on
//! `SurrealDB` WAL recovery.
//! The boot log writes to file AND stderr in real time.
//!
//! # Validation Contract
//! `validate_critical()` receives a data-driven list of (name, booted, `is_critical`)
//! tuples. `is_critical` is read from `PlatformBootConfig::is_enabled_and_critical()`,
//! which reads the parsed TOML. No hardcoded list — if TOML says critical=true,
//! the service is validated. See `services/manifest.rs` for the compile-time
//! service manifest.
//!
//! # Failure Policy
//! - Critical service failure → boot returns `Err`, UI must not render
//! - Non-critical failure → degraded mode (service = None), boot continues
//! - Feature-gated service enabled but not compiled → immediate `bail!`

mod analytics;
mod cache;
pub mod log;
pub mod preflight;
mod relational;
pub mod retry;

use crate::platform::config::PlatformBootConfig;
use crate::platform::init::InitEvent;
use crate::platform::services::analytics::AnalyticsService;
use crate::platform::services::analytics::{SYSTEM_ANALYTICS_SCHEMA, USER_ANALYTICS_SCHEMA};
use crate::platform::services::cache::CacheService;
use crate::platform::services::relational::{RelationalService, SYSTEM_SCHEMA, USER_SCHEMA};

use anyhow::Result;
use log::BootLog;
use std::path::Path;
use std::sync::Arc;

/// Collected service handles from a successful boot pipeline.
pub struct BootedServices {
    pub system_relational: Option<Arc<RelationalService>>,
    pub system_analytics: Option<Arc<AnalyticsService>>,
    pub system_cache: Option<Arc<CacheService>>,
    pub user_relational: Option<Arc<RelationalService>>,
    pub user_analytics: Option<Arc<AnalyticsService>>,
    // Tier-2 (surreal/graph/vector/model_loader) removed — Clyffy serves
    // those from GB10 over the gb10-client wire (kernel-severance).
    // DevForge is lazy-started on first open, not a boot-time service.
}

/// Execute the full boot pipeline — sequential, gated, logged.
///
/// Opens a real-time boot log at `{data_dir}/logs/boot.log` that writes
/// every stage result to disk AND stderr as it happens. If the process
/// crashes mid-boot, everything up to that point is already on disk.
///
/// # Errors
/// Returns error if:
/// - Boot log cannot be created
/// - Preflight fails (directory creation)
/// - A critical service fails to boot
/// - A feature-gated service is enabled but not compiled in
pub async fn execute(
    data_dir: &Path,
    boot_config: &PlatformBootConfig,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    model_event_sink: Option<std::sync::Arc<dyn std::any::Any + Send + Sync>>,
) -> Result<BootedServices> {
    // ── Boot log: real-time sink to file + stderr ──────────────
    let boot_log = BootLog::open(data_dir)?;

    // ── Boot timeout from config ──────────────────────────────
    let timeout_dur = std::time::Duration::from_secs(boot_config.boot.timeout_secs);
    let result = tokio::time::timeout(
        timeout_dur,
        execute_inner(data_dir, boot_config, on_event, &boot_log, model_event_sink),
    )
    .await;

    match result {
        Ok(inner_result) => inner_result,
        Err(_elapsed) => {
            let total_ms = boot_log.elapsed_ms();
            boot_log.boot_failed(
                &format!("Boot timed out after {}s", boot_config.boot.timeout_secs),
                total_ms,
            );
            anyhow::bail!(
                "FATAL: Boot timed out after {}s (configured in [boot].timeout_secs)",
                boot_config.boot.timeout_secs
            );
        }
    }
}

/// Inner boot pipeline — called by `execute()` under a timeout guard.
///
/// Length: orchestrates ~6 sequential boot stages (preflight,
/// telemetry, libsql, surreal, ollama, model-loader). Splitting into
/// per-stage helpers fragments the linear flow and obscures the
/// timeout boundary `execute()` wraps it in. Each stage already owns
/// its own logic in a sibling module; this function is the conductor.
#[allow(clippy::too_many_lines)]
async fn execute_inner(
    data_dir: &Path,
    boot_config: &PlatformBootConfig,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
    #[allow(unused_variables)] model_event_sink: Option<
        std::sync::Arc<dyn std::any::Any + Send + Sync>,
    >,
) -> Result<BootedServices> {
    // ── Stage 1: Preflight — directory hierarchy ──────────────
    on_event(InitEvent::running("preflight", "Creating data directories"));
    {
        // Guard binding: dropped at the end of the block, which stops
        // the spinner. Underscore prefix tells the compiler the name
        // is intentionally unread (vs. `let _ = ...` which would drop
        // it immediately and skip the RAII window).
        let _spin = boot_log.running("preflight", "creating data directories...");
        preflight::ensure_scoped_dirs(data_dir, boot_config)?;
    }
    on_event(InitEvent::ok("preflight", "Directories ready"));
    boot_log.ok("preflight", "directories ready");

    // ── Stage 2: System relational (LibSQL) — CRITICAL ────────
    let spin = boot_log.running("System relational", "connecting LibSQL...");
    let system_relational = relational::boot(
        data_dir,
        &boot_config.services.system.relational,
        &boot_config.windows,
        SYSTEM_SCHEMA,
        "System relational",
        on_event,
        boot_log,
    )
    .await;

    // ── Stage 3: System analytics (DuckDB) ────────────────────
    drop(spin);
    let spin = boot_log.running("System analytics", "connecting DuckDB...");
    let system_analytics = analytics::boot(
        data_dir,
        &boot_config.services.system.analytics,
        &boot_config.windows,
        SYSTEM_ANALYTICS_SCHEMA,
        "System analytics",
        on_event,
        boot_log,
    )
    .await;

    drop(spin);

    // Stage 4 + 12 (Graph store + Model Loader) REMOVED — the Surreal graph
    // and the model loader are Clyffy's on GB10, served over the gb10-client
    // wire (kernel-severance). DevPulse-local boot is Tier-1 only.

    // ── Stage 5: System cache (Moka) ──────────────────────────
    let system_cache = cache::boot(&boot_config.services.system.cache, on_event, boot_log);

    // ── Stage 6: User relational (LibSQL) ─────────────────────
    let spin = boot_log.running("User relational", "connecting LibSQL...");
    let user_relational = relational::boot(
        data_dir,
        &boot_config.services.user.relational,
        &boot_config.windows,
        USER_SCHEMA,
        "User relational",
        on_event,
        boot_log,
    )
    .await;

    // Stage 6b (Knowledge library sync) REMOVED — the embedded knowledge
    // corpus + its sync logic live in the kernel, relocating to Clyffy on
    // GB10 (kernel-severance). Tips arrive over the gb10-client wire; a
    // Tier-1 reimplementation, if wanted, is its own later slice.

    // ── Stage 6c: User analytics (DuckDB) ─────────────────────
    // Booted after user relational so the directory hierarchy
    // (`{data_dir}/user/`) is already created. Non-critical: the
    // dashboard widgets render an empty state when this is None.
    let user_analytics = analytics::boot(
        data_dir,
        &boot_config.services.user.analytics,
        &boot_config.windows,
        USER_ANALYTICS_SCHEMA,
        "User analytics",
        on_event,
        boot_log,
    )
    .await;

    // Stage 7 (Vector store / RRO) REMOVED — the vector store is Clyffy's
    // on GB10, served over the gb10-client wire (kernel-severance).
    drop(spin);

    // Stage 9 (Grammar — system LibSQL row) REMOVED — grammar / constrained
    // decoding is Clyffy's on GB10 (kernel-severance). No local grammar row.

    // Stages 10-11 (Embedder, Whisper) REMOVED — slot-managed by model loader.
    // rag.embedder and voice.stt slots handle these capabilities through Layer 2.

    // DevForge REMOVED from boot pipeline — lazy-started by
    // `Platform::ensure_devforge_started()` when the user first opens the
    // code-editor window. Spawning a Node REH server and TCP-polling for
    // up to 30s never belonged in the hot path for platform boot.

    // ── Validate critical services ─────────────────
    // Config-driven: is_enabled_and_critical() reads from parsed TOML.
    // Identity-driven: the names used below are the InitEvent step_id
    // strings that the boot pipeline emits and the frontend resolves
    // through `resolveLabel`. One SSOT across Rust validation and TS UI.
    // The cross-check between these literals and BOOT_STEP_MANIFEST is
    // enforced by unit tests in platform::services::manifest.
    {
        use crate::platform::config::DataScope;
        use crate::platform::services::ServiceRole;

        // Tier-1 only. Tier-2 (Graph/Vector/Model Loader) validation removed —
        // those are Clyffy's on GB10 (kernel-severance).
        let checks: Vec<(&str, bool, bool)> = vec![
            (
                "System relational",
                system_relational.is_some(),
                boot_config.is_enabled_and_critical(ServiceRole::Relational, DataScope::System),
            ),
            (
                "System analytics",
                system_analytics.is_some(),
                boot_config.is_enabled_and_critical(ServiceRole::Analytics, DataScope::System),
            ),
            (
                "System cache",
                system_cache.is_some(),
                boot_config.is_enabled_and_critical(ServiceRole::Cache, DataScope::System),
            ),
            (
                "User relational",
                user_relational.is_some(),
                boot_config.is_enabled_and_critical(ServiceRole::Relational, DataScope::User),
            ),
            (
                "User analytics",
                user_analytics.is_some(),
                boot_config.is_enabled_and_critical(ServiceRole::Analytics, DataScope::User),
            ),
        ];
        // DevForge (Code Editor) is lazy-started on user open — not validated at boot.

        validate_critical(&checks, boot_config, boot_log)?;
    }

    // Check for ANY failures — not just critical ones.
    // SKIP is acceptable (disabled in config). FAIL is not.
    if boot_log.has_failures() {
        let total_ms = boot_log.elapsed_ms();
        let count = boot_log.failure_count();
        boot_log.boot_failed(
            &format!("{count} service(s) failed — boot incomplete"),
            total_ms,
        );
        anyhow::bail!(
            "Boot incomplete: {count} service(s) failed. Check .userdata/logs/boot.log for details."
        );
    }

    let total_ms = boot_log.elapsed_ms();
    boot_log.ready(total_ms);
    tracing::info!(
        total_ms,
        failures = boot_log.failure_count(),
        path = %boot_log.path().display(),
        "Boot complete — all services confirmed ({total_ms}ms)"
    );

    Ok(BootedServices {
        system_relational,
        system_analytics,
        system_cache,
        user_relational,
        user_analytics,
    })
}

/// Validate that all critical services booted successfully.
///
/// Config-driven: receives `(name, booted, is_critical)` tuples built from
/// `PlatformBootConfig::is_enabled_and_critical()`. No hardcoded list —
/// every service that TOML marks as critical gets validated automatically.
///
/// When `boot_config.boot.require_all_critical` is true (default), any critical
/// service failure is fatal. When false, boot continues in degraded mode.
fn validate_critical(
    checks: &[(&str, bool, bool)],
    boot_config: &PlatformBootConfig,
    boot_log: &BootLog,
) -> Result<()> {
    let strict = boot_config.boot.require_all_critical;
    let mut failures: Vec<&str> = Vec::new();

    for &(name, booted, is_critical) in checks {
        if !booted && is_critical {
            boot_log.fail(
                "VALIDATION",
                &format!("{name} is critical but failed to boot"),
            );
            failures.push(name);
        }
    }

    if !failures.is_empty() {
        let total_ms = boot_log.elapsed_ms();
        if strict {
            boot_log.boot_failed(
                &format!(
                    "{} critical service(s) failed: {}",
                    failures.len(),
                    failures.join(", ")
                ),
                total_ms,
            );
            anyhow::bail!(
                "FATAL: {} critical service(s) failed to boot: {}. \
                 Set [boot].require_all_critical = false to allow degraded mode.",
                failures.len(),
                failures.join(", ")
            );
        }
        tracing::warn!(
            failures = failures.join(", "),
            "Critical services failed but require_all_critical=false — degraded mode"
        );
    }

    Ok(())
}
