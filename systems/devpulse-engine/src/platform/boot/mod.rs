//! Boot pipeline — sequential, gated initialization of all platform services.
//!
//! # Architecture
//! This file is the **orchestrator only**. Each service has its own boot file:
//! - [`relational`] — LibSQL (system + user)
//! - [`analytics`] — DuckDB
//! - [`graph`] — SurrealDB (consolidated: system + user + global namespaces)
//! - [`cache`] — Moka
//! - [`vector`] — RRO (embedded Qdrant)
//! - [`voice`] — Kokoros TTS
//! - [`embedder`] — Candle dense embedding
//! - [`whisper`] — Candle speech-to-text
//! - [`model_loader`] — AI model management + inference
//! - grammar — kernel-owned constrained decoding service (facade stage pending)
//!
//! # Boot Sequence
//!  1. **Preflight** — validate config, create directory hierarchy
//!  2. **System relational** (LibSQL) — CRITICAL
//!  3. **System analytics** (DuckDB) — CRITICAL
//!  4. **Graph store** (SurrealDB) — CRITICAL ─┐
//!     **Model Loader** — feature-gated ────────┘ PARALLEL (zero shared dependency)
//!  5. **System cache** (Moka) — CRITICAL
//!  6. **User relational** (LibSQL) — CRITICAL
//!  7. **Vector store** (RRO) — feature-gated
//!  9. **Grammar** — kernel persists `grammar_service` row to system LibSQL
//! 10. **Validation** — verify all critical services (config-driven)
//!
//! DevForge (VS Code REH) is **not** a boot-time service. It's lazy-started
//! on first `Platform::ensure_devforge_started()` call (user opens the code
//! editor window). Keeping it out of the boot pipeline means cold boot never
//! pays for Node REH health-polling.
//!
//! Most stages complete sequentially. Model Loader runs in parallel with the
//! Graph store via `tokio::join!` because they have zero shared dependency —
//! this saves 3-7s of boot time that was previously wasted blocking on
//! SurrealDB WAL recovery.
//! The boot log writes to file AND stderr in real time.
//!
//! # Validation Contract
//! `validate_critical()` receives a data-driven list of (name, booted, is_critical)
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
pub mod graph;
pub mod log;
pub mod preflight;
mod relational;
pub mod retry;
mod vector;
mod model_loader;

use crate::platform::config::PlatformBootConfig;
use crate::platform::init::InitEvent;
use crate::platform::services::analytics::AnalyticsService;
use crate::platform::services::cache::CacheService;
use crate::platform::services::graph::GraphService;
use crate::platform::services::relational::{RelationalService, SYSTEM_SCHEMA, USER_SCHEMA};
use crate::platform::services::analytics::SYSTEM_ANALYTICS_SCHEMA;
#[cfg(feature = "rro")]
use crate::platform::services::vector::VectorService;
#[cfg(feature = "candle")]
// EmbedderService removed — slot-managed by model loader
#[cfg(feature = "candle")]
// WhisperService removed — slot-managed by model loader
#[cfg(feature = "inference")]
use crate::platform::services::model_loader::ModelLoaderService;
use devpulse_clyffy::cortex::grammar::sync_grammar_service_from_config;

use anyhow::Result;
use log::BootLog;
use std::path::Path;
use std::sync::Arc;

/// Collected service handles from a successful boot pipeline.
pub struct BootedServices {
    pub system_relational: Option<Arc<RelationalService>>,
    pub system_analytics: Option<Arc<AnalyticsService>>,
    pub system_graph: Option<Arc<GraphService>>,
    pub system_cache: Option<Arc<CacheService>>,
    pub user_relational: Option<Arc<RelationalService>>,
    pub user_graph: Option<Arc<GraphService>>,
    pub global_graph: Option<Arc<GraphService>>,
    #[cfg(feature = "rro")]
    pub vector: Option<Arc<VectorService>>,
    // Embedder + Whisper removed — slot-managed by model loader.
    #[cfg(feature = "inference")]
    pub model_loader: Option<Arc<ModelLoaderService>>,
    // DevForge removed from boot pipeline — lazy-started on first open.
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
    let result = tokio::time::timeout(timeout_dur, execute_inner(data_dir, boot_config, on_event, &boot_log, model_event_sink)).await;

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
async fn execute_inner(
    data_dir: &Path,
    boot_config: &PlatformBootConfig,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
    #[allow(unused_variables)]
    model_event_sink: Option<std::sync::Arc<dyn std::any::Any + Send + Sync>>,
) -> Result<BootedServices> {
    // ── Stage 1: Preflight — directory hierarchy ──────────────
    on_event(InitEvent::running("preflight", "Creating data directories"));
    {
        let _spin = boot_log.running("preflight", "creating data directories...");
        preflight::ensure_scoped_dirs(data_dir, boot_config)?;
    }
    on_event(InitEvent::ok("preflight", "Directories ready"));
    boot_log.ok("preflight", "directories ready");

    // ── Stage 2: System relational (LibSQL) — CRITICAL ────────
    let _spin = boot_log.running("System relational", "connecting LibSQL...");
    let system_relational = relational::boot(
        data_dir,
        &boot_config.services.system.relational,
        &boot_config.windows,
        SYSTEM_SCHEMA,
        "System relational",
        on_event,
        &boot_log,
    ).await;

    // ── Stage 3: System analytics (DuckDB) ────────────────────
    drop(_spin);
    let _spin = boot_log.running("System analytics", "connecting DuckDB...");
    let system_analytics = analytics::boot(
        data_dir,
        &boot_config.services.system.analytics,
        &boot_config.windows,
        SYSTEM_ANALYTICS_SCHEMA,
        "System analytics",
        on_event,
        &boot_log,
    ).await;

    drop(_spin);

    // ── Prepare Model Loader event sink early (needed for parallel boot) ──
    #[cfg(feature = "inference")]
    let loader_event_sink: Option<std::sync::Arc<dyn devpulse_clyffy::model_loader::LoaderEventSink>> =
        model_event_sink.and_then(|any| {
            any.downcast::<crate::platform::integrations::events::EventBridge>()
                .ok()
                .map(|bridge| bridge as std::sync::Arc<dyn devpulse_clyffy::model_loader::LoaderEventSink>)
        });

    // ── Stage 4 + 12: Graph store AND Model Loader in PARALLEL ───
    // Model Loader has ZERO dependency on SurrealDB (or any other service).
    // Running them concurrently saves 3-7s of boot time that was wasted
    // waiting for SurrealDB WAL recovery before model scanning could begin.
    //
    // tokio::join! runs both futures on the same task — no Send/'static
    // requirement. Both share &on_event and &boot_log safely.
    // ── Stage 4 + 12: Graph + Model Loader in parallel ─────────
    let _spin = boot_log.running("Graph + Model Loader", "initializing in parallel...");
    #[cfg(feature = "inference")]
    let ((system_graph, user_graph, global_graph), model_loader_svc) = tokio::join!(
        graph::boot_consolidated(data_dir, boot_config, on_event, &boot_log),
        model_loader::boot(
            data_dir,
            &boot_config.services.system.model_loader,
            on_event,
            &boot_log,
            loader_event_sink,
            system_relational.as_ref().map(|svc| svc.adapter().clone()),
        )
    );

    #[cfg(not(feature = "inference"))]
    let (system_graph, user_graph, global_graph) = graph::boot_consolidated(
        data_dir,
        boot_config,
        on_event,
        &boot_log,
    ).await;

    #[cfg(not(feature = "inference"))]
    {
        if boot_config.services.system.model_loader.enabled {
            boot_log.fail("Model Loader", "enabled in config but 'inference' feature not compiled");
            anyhow::bail!(
                "FATAL: Model Loader is enabled in config but the 'inference' feature is not compiled in. \
                 Add features = [\"inference\"] to devpulse-engine dependency in src-tauri/Cargo.toml."
            );
        }
    }

    drop(_spin);

    // ── Stage 5: System cache (Moka) ──────────────────────────
    let system_cache = cache::boot(
        &boot_config.services.system.cache,
        on_event,
        &boot_log,
    );

    // ── Stage 6: User relational (LibSQL) ─────────────────────
    let _spin = boot_log.running("User relational", "connecting LibSQL...");
    let user_relational = relational::boot(
        data_dir,
        &boot_config.services.user.relational,
        &boot_config.windows,
        USER_SCHEMA,
        "User relational",
        on_event,
        &boot_log,
    ).await;

    // ── Stage 6b: Knowledge library sync ──────────────────────
    // Syncs embedded JSON artifacts into user libSQL. Fast path
    // skips if manifest version matches stored version.
    if let Some(ref user_svc) = user_relational {
        let _kspin = boot_log.running("Knowledge sync", "syncing knowledge library...");
        match devpulse_clyffy::cortex::knowledge::sync_to_libsql(user_svc.adapter().as_ref()).await {
            Ok(count) => {
                if count > 0 {
                    tracing::info!(upserted = count, "Knowledge library synced");
                    boot_log.ok("Knowledge sync", &format!("synced {count} entries"));
                } else {
                    boot_log.ok("Knowledge sync", "up to date");
                }
            }
            Err(e) => {
                // Non-critical — knowledge tips are nice-to-have, not blocking
                tracing::warn!(error = %e, "Knowledge sync failed — tips unavailable this session");
                boot_log.skip("Knowledge sync", &format!("non-critical: {e}"));
            }
        }
    }

    // ── Stage 7: Vector store (RRO) — feature-gated ──────────
    drop(_spin);
    let _spin = boot_log.running("Vector store", "verifying RRO...");
    #[cfg(feature = "rro")]
    let vector = vector::boot(
        data_dir,
        &boot_config.services.system.vector,
        on_event,
        &boot_log,
    ).await;
    #[cfg(not(feature = "rro"))]
    {
        if boot_config.services.system.vector.enabled {
            boot_log.fail("Vector store", "enabled in config but 'rro' feature not compiled");
            anyhow::bail!(
                "FATAL: Vector store (RRO) is enabled in config but the 'rro' feature is not compiled in. \
                 Add features = [\"rro\"] to devpulse-engine dependency in src-tauri/Cargo.toml."
            );
        }
    }

    drop(_spin);

    // ── Stage 9: Grammar — system LibSQL row (kernel-owned contract) ───
    match &system_relational {
        Some(svc) => {
            on_event(InitEvent::running(
                "Grammar service",
                "Synchronizing system grammar row",
            ));
            match sync_grammar_service_from_config(svc.adapter().as_ref(), &boot_config.services.system.grammar)
                .await
            {
                Ok(()) => {
                    on_event(InitEvent::ok(
                        "Grammar service",
                        "system grammar_service row synchronized",
                    ));
                    boot_log.ok(
                        "Grammar service",
                        "system grammar_service row synchronized",
                    );
                }
                Err(e) => {
                    let msg = format!("{e:#}");
                    if boot_config.services.system.grammar.critical {
                        on_event(InitEvent::error("Grammar service", &msg));
                        boot_log.fail("Grammar service", &msg);
                        return Err(e);
                    }
                    tracing::warn!(error = %e, "Grammar service row sync failed (non-critical)");
                    on_event(InitEvent::skipped_with_message(
                        "Grammar service",
                        "row sync failed — continuing (grammar not critical)",
                    ));
                    boot_log.skip("Grammar service", "row sync failed — continuing");
                }
            }
        }
        None => {
            on_event(InitEvent::skipped_with_message(
                "Grammar service",
                "system relational store unavailable",
            ));
            boot_log.skip(
                "Grammar service",
                "system relational unavailable — grammar row not written",
            );
        }
    }

    // Stages 10-11 (Embedder, Whisper) REMOVED — slot-managed by model loader.
    // rag.embedder and voice.stt slots handle these capabilities through Layer 2.

    // DevForge REMOVED from boot pipeline — lazy-started by
    // `Platform::ensure_devforge_started()` when the user first opens the
    // code-editor window. Spawning a Node REH server and TCP-polling for
    // up to 30s never belonged in the hot path for platform boot.

    // ── Validate critical services ─────────────────
    // Config-driven: is_enabled_and_critical() reads from parsed TOML.
    // No hardcoded list — if TOML says critical=true, it's validated.
    {
        use crate::platform::config::DataScope;
        use crate::platform::services::ServiceRole;

        // `mut` is required when `rro` / `inference` features compile in
        // the `checks.push(...)` lines below. Default build has neither,
        // so we allow the unused-mut warning instead of reshuffling.
        #[allow(unused_mut)]
        let mut checks: Vec<(&str, bool, bool)> = vec![
            ("System Database",  system_relational.is_some(), boot_config.is_enabled_and_critical(ServiceRole::Relational, DataScope::System)),
            ("Analytics Engine", system_analytics.is_some(),  boot_config.is_enabled_and_critical(ServiceRole::Analytics, DataScope::System)),
            ("Knowledge Graph",  system_graph.is_some(),      boot_config.is_enabled_and_critical(ServiceRole::Graph, DataScope::System)),
            ("System Cache",     system_cache.is_some(),      boot_config.is_enabled_and_critical(ServiceRole::Cache, DataScope::System)),
            ("User Database",    user_relational.is_some(),   boot_config.is_enabled_and_critical(ServiceRole::Relational, DataScope::User)),
            ("User Knowledge",   user_graph.is_some(),        boot_config.is_enabled_and_critical(ServiceRole::Graph, DataScope::User)),
            ("Shared Knowledge", global_graph.is_some(),      boot_config.is_enabled_and_critical(ServiceRole::Graph, DataScope::Global)),
        ];
        #[cfg(feature = "rro")]
        checks.push(("Vector Store", vector.is_some(), boot_config.is_enabled_and_critical(ServiceRole::Vector, DataScope::System)));
        // Embedder + Whisper removed — slot-managed by model loader (Layer 2).
        #[cfg(feature = "inference")]
        checks.push(("Model Manager", model_loader_svc.is_some(), boot_config.is_enabled_and_critical(ServiceRole::ModelLoader, DataScope::System)));
        // DevForge (Code Editor) is lazy-started on user open — not validated at boot.

        validate_critical(&checks, boot_config, &boot_log)?;
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
        system_graph,
        system_cache,
        user_relational,
        user_graph,
        global_graph,
        #[cfg(feature = "rro")]
        vector,
        #[cfg(feature = "inference")]
        model_loader: model_loader_svc,
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
            boot_log.fail("VALIDATION", &format!("{name} is critical but failed to boot"));
            failures.push(name);
        }
    }

    if !failures.is_empty() {
        let total_ms = boot_log.elapsed_ms();
        if strict {
            boot_log.boot_failed(
                &format!("{} critical service(s) failed: {}", failures.len(), failures.join(", ")),
                total_ms,
            );
            anyhow::bail!(
                "FATAL: {} critical service(s) failed to boot: {}. \
                 Set [boot].require_all_critical = false to allow degraded mode.",
                failures.len(),
                failures.join(", ")
            );
        } else {
            tracing::warn!(
                failures = failures.join(", "),
                "Critical services failed but require_all_critical=false — degraded mode"
            );
        }
    }

    Ok(())
}
