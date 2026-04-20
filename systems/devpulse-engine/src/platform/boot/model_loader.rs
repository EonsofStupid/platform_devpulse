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

    on_event(InitEvent::running("Model Loader", "Initializing model management"));
    boot_log.running("Model Loader", "booting...");
    let start = Instant::now();

    let mut models_dir = entry.resolve_models_dir(data_dir);

    // Dev mode: prefer the repo-root `models/` folder over `.userdata/models/`.
    // This is where the developer keeps full HuggingFace checkpoints (safetensors,
    // ONNX, GGUF) organized by model family. The portable `.userdata/` copy is
    // for release builds. Repo root derived from CARGO_MANIFEST_DIR at compile
    // time — same pattern as DevForge resolver in boot/devforge.rs.
    #[cfg(debug_assertions)]
    {
        let manifest = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        if let Some(repo_root) = manifest.parent().and_then(std::path::Path::parent) {
            let dev_models = repo_root.join("models");
            if dev_models.is_dir() {
                tracing::info!(
                    dev_models = %dev_models.display(),
                    "Dev mode: using repo-root models/ instead of .userdata/models/"
                );
                models_dir = dev_models;
            }
        }
    }

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

            // Background: scan + restore + auto-assign + hot-slot hydration.
            // These take 20-45s on first run and MUST NOT block boot.
            // Progress is observable via platform:models-status events and
            // RegistryScanStarted / ModelDiscovered / RegistryScanComplete
            // events on the event sink.
            let bg_service = service_arc.clone();
            tokio::spawn(
                async move {
                    tracing::info!("Model Loader: background finalize starting");
                    if let Err(e) = bg_service.finalize_registry().await {
                        tracing::warn!(error = %e, "Model Loader background finalize failed (non-fatal)");
                    }
                    let hot_loaded = bg_service.auto_load_hot_slots().await;
                    tracing::info!(
                        hot_loaded,
                        "Model Loader: background finalize complete"
                    );
                }
                .instrument(tracing::info_span!("model_loader.bg_finalize")),
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
