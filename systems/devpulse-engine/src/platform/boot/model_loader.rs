//! Model Loader boot stage — AI model management service.
//!
//! Creates the model loader service, registers default `DevPulse` slots,
//! restores saved assignments, and scans the models directory.

#[cfg(feature = "inference")]
use crate::platform::boot::log::BootLog;
#[cfg(feature = "inference")]
use crate::platform::config::ModelLoaderServiceEntry;
#[cfg(feature = "inference")]
use crate::platform::init::InitEvent;
#[cfg(feature = "inference")]
use crate::platform::services::model_loader::ModelLoaderService;

#[cfg(feature = "inference")]
use std::path::Path;
#[cfg(feature = "inference")]
use std::sync::Arc;
#[cfg(feature = "inference")]
use std::time::Instant;
#[cfg(feature = "inference")]
use tracing::Instrument as _;

/// Boot the Model Loader service.
///
/// Returns `Some(service)` on success, `None` on failure or if disabled.
#[cfg(feature = "inference")]
#[allow(clippy::cast_possible_truncation)]
#[tracing::instrument(skip_all, fields(enabled = entry.enabled))]
pub async fn boot(
    data_dir: &Path,
    entry: &ModelLoaderServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
    event_sink: Option<std::sync::Arc<dyn devpulse_clyffy::model_loader::LoaderEventSink>>,
    libsql_adapter: Option<std::sync::Arc<devpulse_clyffy::cortex::persistence::LibSqlAdapter>>,
) -> Option<Arc<ModelLoaderService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("Model Loader"));
        boot_log.skip("Model Loader", "disabled in config");
        return None;
    }

    on_event(InitEvent::running(
        "Model Loader",
        "Initializing model management",
    ));
    boot_log.running("Model Loader", "booting...");
    let start = Instant::now();

    // Single resolution — first-hit-wins chain handles both dev
    // (repo-root `models/`) and release (sibling-of-exe `models/`)
    // without a cfg branch. See
    // `platform::config::legacy::resolve_models_dir_chain` for the
    // rule order.
    let models_dir = entry.resolve_models_dir(data_dir);
    tracing::info!(
        models_dir = %models_dir.display(),
        "Model Loader: resolved models directory"
    );

    let subdirs = entry.subdir_names();

    // Boot is sync (file I/O, GGUF parsing) — offload to blocking thread.
    // Slots + presets come from kernel SSOT loaded inside ModelLoaderService::boot,
    // not from the engine-side TOML shadow (which has been removed).
    let data_dir_owned = data_dir.to_path_buf();
    let result = devpulse_telemetry::spawn_blocking(move || {
        ModelLoaderService::boot(
            &data_dir_owned,
            event_sink,
            models_dir,
            subdirs,
            libsql_adapter,
        )
    })
    .await
    .map_err(|e| anyhow::anyhow!("Model Loader spawn_blocking failed: {e}"));

    let result = match result {
        Ok(inner) => inner,
        Err(e) => Err(e),
    };

    match result {
        Ok((service, default_slots)) => {
            // Fast path: register slots synchronously. This is instant
            // (in-memory) and MUST complete before boot returns so other
            // services can query slot metadata.
            if let Err(e) = service.register_slots_only(default_slots).await {
                let elapsed_ms = start.elapsed().as_millis() as u64;
                tracing::error!(step = "Model Loader", error = ?e, "Model Loader slot registration failed");
                on_event(InitEvent::error("Model Loader", &format!("{e:#}")));
                boot_log.fail("Model Loader", &format!("{e:#} ({elapsed_ms}ms)"));
                return None;
            }

            let slot_count = service.list_slots().await.len();
            let elapsed_ms = start.elapsed().as_millis() as u64;

            // Wrap the service in Arc NOW so we can spawn background work
            // with a clone while returning the service to the boot pipeline.
            let service_arc = Arc::new(service);

            // Background: scan registry only. DOES NOT auto-load models.
            //
            // Owner decision (2026-04-20): model loading is a deliberate user
            // action, never automatic. The user sees detected models as text
            // suggestions in the wizard / devtools and picks which to load.
            // Hot-slot auto-hydration was ripped out — it was causing models
            // to start without consent.
            //
            // What STILL happens here:
            //   - `finalize_registry()` scans the models directory and emits
            //     per-file `ModelDiscovered` events so the wizard can show
            //     what's on disk. Pure filesystem read — no GPU, no RAM load.
            //   - `restore_assignments()` re-reads persisted slot→model-id
            //     choices from libSQL. The slots are marked "assigned" but
            //     NOT "loaded" — inference stays cold until the user clicks
            //     Apply/Load in the UI.
            //
            // What NO LONGER happens here:
            //   - `auto_load_hot_slots()` → REMOVED. User triggers loads
            //     explicitly via the model card UI.
            let bg_service = service_arc.clone();
            devpulse_telemetry::spawn(
                async move {
                    tracing::info!("Model Loader: background registry scan starting (no auto-load)");
                    if let Err(e) = bg_service.finalize_registry().await {
                        tracing::warn!(error = %e, "Model Loader background registry scan failed (non-fatal)");
                    }
                    tracing::info!("Model Loader: registry scan complete — slots stay cold until user Apply");
                }
                .instrument(tracing::info_span!("model_loader.bg_scan")),
            );

            tracing::info!(
                step = "Model Loader",
                slots = slot_count,
                latency_ms = elapsed_ms,
                "Model Loader booted (scan running in background)"
            );
            on_event(InitEvent::ok_with_latency("Model Loader", start.elapsed()));
            boot_log.ok(
                "Model Loader",
                &format!("{slot_count} slots ({elapsed_ms}ms, scan bg)"),
            );
            Some(service_arc)
        }
        Err(e) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::error!(step = "Model Loader", error = ?e, "Model Loader failed to boot");
            on_event(InitEvent::error("Model Loader", &format!("{e:#}")));
            boot_log.fail("Model Loader", &format!("{e:#} ({elapsed_ms}ms)"));
            None
        }
    }
}
