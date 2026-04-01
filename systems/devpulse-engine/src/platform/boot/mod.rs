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
//! - [`devforge`] — Managed VSCode (code-oss)
//! - grammar — llguidance (future sprint, currently skipped)
//!
//! # Boot Sequence (14 stages, strict order)
//!  1. **Preflight** — validate config, create directory hierarchy
//!  2. **System relational** (LibSQL) — CRITICAL
//!  3. **System analytics** (DuckDB) — CRITICAL
//!  4. **Graph store** (SurrealDB) — CRITICAL (system + user + global)
//!  5. **System cache** (Moka) — CRITICAL
//!  6. **User relational** (LibSQL) — CRITICAL
//!  7. **Vector store** (RRO) — feature-gated
//!  8. **Voice service** (Kokoros) — feature-gated
//!  9. **Grammar** (llguidance) — SKIPPED (future sprint)
//! 10. **Embedder** (Candle) — feature-gated
//! 11. **Whisper** (Candle) — feature-gated
//! 12. **Model Loader** — feature-gated (inference)
//! 13. **DevForge** (VSCode) — non-critical
//! 14. **Validation** — verify all critical services (config-driven)
//!
//! Each stage completes and is health-checked BEFORE the next begins.
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
mod voice;
mod embedder;
mod whisper;
mod model_loader;
mod devforge;

use crate::platform::config::PlatformBootConfig;
use crate::platform::init::InitEvent;
use crate::platform::services::analytics::AnalyticsService;
use crate::platform::services::cache::CacheService;
use crate::platform::services::graph::GraphService;
use crate::platform::services::relational::{RelationalService, SYSTEM_SCHEMA, USER_SCHEMA};
use crate::platform::services::analytics::SYSTEM_ANALYTICS_SCHEMA;
#[cfg(feature = "rro")]
use crate::platform::services::vector::VectorService;
#[cfg(feature = "kokoros")]
use crate::platform::services::voice::VoiceService;
#[cfg(feature = "candle")]
use crate::platform::services::embedder::EmbedderService;
#[cfg(feature = "candle")]
use crate::platform::services::whisper::WhisperService;
#[cfg(feature = "inference")]
use crate::platform::services::model_loader::ModelLoaderService;
use crate::platform::services::devforge::DevForgeService;

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
    #[cfg(feature = "kokoros")]
    pub voice: Option<Arc<VoiceService>>,
    #[cfg(feature = "candle")]
    pub embedder: Option<Arc<EmbedderService>>,
    #[cfg(feature = "candle")]
    pub whisper: Option<Arc<WhisperService>>,
    #[cfg(feature = "inference")]
    pub model_loader: Option<Arc<ModelLoaderService>>,
    pub devforge: Option<Arc<DevForgeService>>,
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
) -> Result<BootedServices> {
    // ── Boot log: real-time sink to file + stderr ──────────────
    let boot_log = BootLog::open(data_dir)?;

    // ── Boot timeout from config ──────────────────────────────
    let timeout_dur = std::time::Duration::from_secs(boot_config.boot.timeout_secs);
    let result = tokio::time::timeout(timeout_dur, execute_inner(data_dir, boot_config, on_event, &boot_log)).await;

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
) -> Result<BootedServices> {
    // ── Stage 1: Preflight — directory hierarchy ──────────────
    on_event(InitEvent::running("preflight", "Creating data directories"));
    boot_log.running("preflight", "creating data directories...");
    preflight::ensure_scoped_dirs(data_dir, boot_config)?;
    on_event(InitEvent::ok("preflight", "Directories ready"));
    boot_log.ok("preflight", "directories ready");

    // ── Stage 2: System relational (LibSQL) — CRITICAL ────────
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
    let system_analytics = analytics::boot(
        data_dir,
        &boot_config.services.system.analytics,
        &boot_config.windows,
        SYSTEM_ANALYTICS_SCHEMA,
        "System analytics",
        on_event,
        &boot_log,
    ).await;

    // ── Stage 4: Graph store (SurrealDB) — CRITICAL ───────────
    let (system_graph, user_graph, global_graph) = graph::boot_consolidated(
        data_dir,
        boot_config,
        on_event,
        &boot_log,
    ).await;

    // ── Stage 5: System cache (Moka) ──────────────────────────
    let system_cache = cache::boot(
        &boot_config.services.system.cache,
        on_event,
        &boot_log,
    );

    // ── Stage 6: User relational (LibSQL) ─────────────────────
    let user_relational = relational::boot(
        data_dir,
        &boot_config.services.user.relational,
        &boot_config.windows,
        USER_SCHEMA,
        "User relational",
        on_event,
        &boot_log,
    ).await;

    // ── Stage 7: Vector store (RRO) — feature-gated ──────────
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

    // ── Stage 8: Voice service (Kokoros) — feature-gated ──────
    #[cfg(feature = "kokoros")]
    let voice = voice::boot(
        data_dir,
        &boot_config.services.system.voice,
        on_event,
        &boot_log,
    ).await;
    #[cfg(not(feature = "kokoros"))]
    {
        if boot_config.services.system.voice.enabled {
            boot_log.fail("Voice service", "enabled in config but 'kokoros' feature not compiled");
            anyhow::bail!(
                "FATAL: Voice service (Kokoros) is enabled in config but the 'kokoros' feature is not compiled in. \
                 Add features = [\"kokoros\"] to devpulse-engine dependency in src-tauri/Cargo.toml."
            );
        }
    }

    // ── Stage 9: Grammar (llguidance) — future sprint, skipped ──
    on_event(InitEvent::skipped("Grammar service"));
    boot_log.skip("Grammar service", "llguidance not yet wired — future sprint");

    // ── Stage 10: Embedder (Candle) — feature-gated ─────────
    #[cfg(feature = "candle")]
    let embedder = embedder::boot(
        data_dir,
        &boot_config.services.system.embedder,
        on_event,
        &boot_log,
    ).await;
    #[cfg(not(feature = "candle"))]
    {
        if boot_config.services.system.embedder.enabled {
            boot_log.fail("Embedder service", "enabled in config but 'candle' feature not compiled");
            anyhow::bail!(
                "FATAL: Embedder service is enabled in config but the 'candle' feature is not compiled in. \
                 Add features = [\"candle\"] to devpulse-engine dependency in src-tauri/Cargo.toml."
            );
        }
    }

    // ── Stage 11: Whisper ASR (Candle) — feature-gated ────────
    #[cfg(feature = "candle")]
    let whisper = whisper::boot(
        data_dir,
        &boot_config.services.system.whisper,
        on_event,
        &boot_log,
    ).await;
    #[cfg(not(feature = "candle"))]
    {
        if boot_config.services.system.whisper.enabled {
            boot_log.fail("Whisper service", "enabled in config but 'candle' feature not compiled");
            anyhow::bail!(
                "FATAL: Whisper service is enabled in config but the 'candle' feature is not compiled in. \
                 Add features = [\"candle\"] to devpulse-engine dependency in src-tauri/Cargo.toml."
            );
        }
    }

    // ── Stage 12: Model Loader (Inference) — feature-gated ──────
    #[cfg(feature = "inference")]
    let model_loader_svc = model_loader::boot(
        data_dir,
        &boot_config.services.system.model_loader,
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

    // ── Stage 13: DevForge (VSCode) ───────────────────────────
    let devforge = devforge::boot(
        data_dir,
        &boot_config.services.system.devforge,
        on_event,
        &boot_log,
    );

    // ── Stage 14: Validate critical services ─────────────────
    // Config-driven: is_enabled_and_critical() reads from parsed TOML.
    // No hardcoded list — if TOML says critical=true, it's validated.
    {
        use crate::platform::config::DataScope;
        use crate::platform::services::ServiceRole;

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
        #[cfg(feature = "kokoros")]
        checks.push(("Voice Engine", voice.is_some(), boot_config.is_enabled_and_critical(ServiceRole::Voice, DataScope::System)));
        #[cfg(feature = "candle")]
        checks.push(("Embedding Engine", embedder.is_some(), boot_config.is_enabled_and_critical(ServiceRole::Embedder, DataScope::System)));
        #[cfg(feature = "candle")]
        checks.push(("Speech Recognition", whisper.is_some(), boot_config.is_enabled_and_critical(ServiceRole::Whisper, DataScope::System)));
        #[cfg(feature = "inference")]
        checks.push(("Model Manager", model_loader_svc.is_some(), boot_config.is_enabled_and_critical(ServiceRole::ModelLoader, DataScope::System)));
        checks.push(("Code Editor", devforge.is_some(), boot_config.is_enabled_and_critical(ServiceRole::DevForge, DataScope::System)));

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
        #[cfg(feature = "kokoros")]
        voice,
        #[cfg(feature = "candle")]
        embedder,
        #[cfg(feature = "candle")]
        whisper,
        #[cfg(feature = "inference")]
        model_loader: model_loader_svc,
        devforge,
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
