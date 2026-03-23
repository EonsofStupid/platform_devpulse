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
//! - [`grammar`] — outlines-core
//!
//! # Boot Sequence (strict order)
//! 1. **Preflight** — validate config, create directory hierarchy
//! 2. **System relational** (LibSQL) — CRITICAL — kernel state, boot records
//! 3. **System analytics** (DuckDB) — telemetry
//! 4. **Graph store** (SurrealDB) — CRITICAL — consolidated 3 namespaces + HTTP API
//! 5. **System cache** (Moka) — in-memory
//! 6. **User relational** (LibSQL) — sessions, preferences
//! 7. **Vector store** (RRO) — embeddings, retrieval
//! 8. **Voice service** (Kokoros) — TTS engine
//! 9. **Grammar service** (outlines-core) — structured generation
//! 10. **Validation** — verify all critical services booted
//!
//! Each stage completes and is health-checked BEFORE the next begins.
//! The boot log writes to file AND stderr in real time.
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
mod grammar;
mod embedder;
mod whisper;
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
#[cfg(feature = "outlines")]
use crate::platform::services::grammar::GrammarService;
#[cfg(feature = "candle")]
use crate::platform::services::embedder::EmbedderService;
#[cfg(feature = "candle")]
use crate::platform::services::whisper::WhisperService;
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
    #[cfg(feature = "outlines")]
    pub grammar: Option<Arc<GrammarService>>,
    #[cfg(feature = "candle")]
    pub embedder: Option<Arc<EmbedderService>>,
    #[cfg(feature = "candle")]
    pub whisper: Option<Arc<WhisperService>>,
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

    // ── Stage 9: Grammar service (outlines-core) — feature-gated
    #[cfg(feature = "outlines")]
    let grammar = grammar::boot(
        &boot_config.services.system.grammar,
        on_event,
        &boot_log,
    );
    #[cfg(not(feature = "outlines"))]
    {
        if boot_config.services.system.grammar.enabled {
            boot_log.fail("Grammar service", "enabled in config but 'outlines' feature not compiled");
            anyhow::bail!(
                "FATAL: Grammar service (outlines-core) is enabled in config but the 'outlines' feature is not compiled in. \
                 Add features = [\"outlines\"] to devpulse-engine dependency in src-tauri/Cargo.toml."
            );
        }
    }

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

    // ── Stage 12: DevForge (VSCode) ───────────────────────────
    let devforge = devforge::boot(
        data_dir,
        &boot_config.services.system.devforge,
        on_event,
        &boot_log,
    );

    // ── Stage 13: Validate critical services ──────────────────
    validate_critical(
        &system_relational,
        &system_analytics,
        &system_graph,
        &system_cache,
        &user_relational,
        boot_config,
        &boot_log,
    )?;

    #[cfg(feature = "rro")]
    if vector.is_none()
        && boot_config.services.system.vector.enabled
        && boot_config.services.system.vector.critical
    {
        boot_log.fail("Vector store", "enabled+critical but failed to boot");
        anyhow::bail!("FATAL: Vector store (RRO/Qdrant) was enabled+critical but failed to boot");
    }

    #[cfg(feature = "kokoros")]
    if voice.is_none()
        && boot_config.services.system.voice.enabled
        && boot_config.services.system.voice.critical
    {
        boot_log.fail("Voice service", "enabled+critical but failed to boot");
        anyhow::bail!("FATAL: Voice service (Kokoros) was enabled+critical but failed to boot");
    }

    #[cfg(feature = "outlines")]
    if grammar.is_none()
        && boot_config.services.system.grammar.enabled
        && boot_config.services.system.grammar.critical
    {
        boot_log.fail("Grammar service", "enabled+critical but failed to boot");
        anyhow::bail!("FATAL: Grammar service (outlines-core) was enabled+critical but failed to boot");
    }

    // All critical services passed — log the ready line
    let total_ms = boot_log.elapsed_ms();
    boot_log.ready(total_ms);
    tracing::info!(path = %boot_log.path().display(), total_ms, "boot.log written — all services confirmed");

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
        #[cfg(feature = "outlines")]
        grammar,
        #[cfg(feature = "candle")]
        embedder,
        #[cfg(feature = "candle")]
        whisper,
        devforge,
    })
}

/// Validate that all critical services booted successfully.
fn validate_critical(
    system_relational: &Option<Arc<RelationalService>>,
    system_analytics: &Option<Arc<AnalyticsService>>,
    system_graph: &Option<Arc<GraphService>>,
    system_cache: &Option<Arc<CacheService>>,
    user_relational: &Option<Arc<RelationalService>>,
    boot_config: &PlatformBootConfig,
    boot_log: &BootLog,
) -> Result<()> {
    if system_relational.is_none() && boot_config.services.system.relational.enabled {
        boot_log.fail("VALIDATION", "System relational (LibSQL) is critical but failed");
        anyhow::bail!("FATAL: System relational (LibSQL) was enabled but failed to boot");
    }
    if system_analytics.is_none()
        && boot_config.services.system.analytics.enabled
        && boot_config.services.system.analytics.critical
    {
        boot_log.fail("VALIDATION", "System analytics (DuckDB) is critical but failed");
        anyhow::bail!("FATAL: System analytics (DuckDB) was enabled+critical but failed to boot");
    }
    if system_graph.is_none() && boot_config.services.system.graph.enabled {
        boot_log.fail("VALIDATION", "System graph (SurrealDB) is critical but failed");
        anyhow::bail!("FATAL: System graph (SurrealDB) was enabled but failed to boot");
    }
    if system_cache.is_none()
        && boot_config.services.system.cache.enabled
        && boot_config.services.system.cache.critical
    {
        boot_log.fail("VALIDATION", "System cache (Moka) is critical but failed");
        anyhow::bail!("FATAL: System cache (Moka) was enabled+critical but failed to boot");
    }
    if user_relational.is_none()
        && boot_config.services.user.relational.enabled
        && boot_config.services.user.relational.critical
    {
        boot_log.fail("VALIDATION", "User relational (LibSQL) is critical but failed");
        anyhow::bail!("FATAL: User relational (LibSQL) was enabled+critical but failed to boot");
    }
    Ok(())
}
