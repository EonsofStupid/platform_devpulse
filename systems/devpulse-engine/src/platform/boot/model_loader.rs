//! Model Loader boot stage — AI model management service.
//!
//! Creates the model loader service, registers default DevPulse slots,
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

/// Boot the Model Loader service.
///
/// Returns `Some(service)` on success, `None` on failure or if disabled.
#[cfg(feature = "inference")]
#[allow(clippy::cast_possible_truncation)]
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

    on_event(InitEvent::running("Model Loader", "Initializing model management"));
    boot_log.running("Model Loader", "booting...");
    let start = Instant::now();

    let models_dir = entry.resolve_models_dir(data_dir);
    let subdirs = entry.subdir_names();

    // Boot is sync (file I/O, GGUF parsing) — offload to blocking thread.
    // Slots + presets come from kernel SSOT loaded inside ModelLoaderService::boot,
    // not from the engine-side TOML shadow (which has been removed).
    let data_dir_owned = data_dir.to_path_buf();
    let result = tokio::task::spawn_blocking(move || {
        ModelLoaderService::boot(&data_dir_owned, event_sink, models_dir, subdirs, libsql_adapter)
    })
    .await
    .map_err(|e| anyhow::anyhow!("Model Loader spawn_blocking failed: {e}"));

    let result = match result {
        Ok(inner) => inner,
        Err(e) => Err(e),
    };

    match result {
        Ok(service) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            // Slot count comes from the booted service so the log line stays
            // honest about what was actually registered (could differ from the
            // baseline default if a user override in slots.toml adds/removes
            // rows).
            let slot_count = service.list_slots().await.len();

            // Proactively load every Hot-strategy slot that has a model
            // assigned. Runs AFTER the sync boot path returns so we can
            // await the async load_slot calls on the inner service.
            let hot_loaded = service.auto_load_hot_slots().await;
            tracing::info!(
                step = "Model Loader",
                slots = slot_count,
                hot_loaded,
                latency_ms = elapsed_ms,
                "Model Loader booted and Hot slots hydrated"
            );
            on_event(InitEvent::ok_with_latency("Model Loader", start.elapsed()));
            boot_log.ok(
                "Model Loader",
                &format!("{slot_count} slots ({hot_loaded} hot, {elapsed_ms}ms)"),
            );
            Some(Arc::new(service))
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
