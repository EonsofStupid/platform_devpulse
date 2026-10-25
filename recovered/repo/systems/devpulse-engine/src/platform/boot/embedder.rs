//! Candle embedder boot stage — CPU burst dense embedding.
//!
//! Loads a BERT-family model from `.userdata/system/candle/embedder/`.
//! Model loading is synchronous (mmap'd safetensors), wrapped in `spawn_blocking`.

#[cfg(feature = "candle")]
use crate::platform::boot::log::BootLog;
#[cfg(feature = "candle")]
use crate::platform::config::EmbedderServiceEntry;
#[cfg(feature = "candle")]
use crate::platform::init::InitEvent;
#[cfg(feature = "candle")]
use crate::platform::services::embedder::EmbedderService;

#[cfg(feature = "candle")]
use std::path::Path;
#[cfg(feature = "candle")]
use std::sync::Arc;
#[cfg(feature = "candle")]
use std::time::Instant;

/// Boot the Candle embedder service.
///
/// Returns `Some(service)` on success, `None` on failure or if disabled.
#[cfg(feature = "candle")]
#[allow(clippy::cast_possible_truncation)]
pub async fn boot(
    data_dir: &Path,
    entry: &EmbedderServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
) -> Option<Arc<EmbedderService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("Embedder service"));
        boot_log.skip("Embedder service", "disabled in config");
        return None;
    }

    on_event(InitEvent::running("Embedder service", "Loading Candle model (CPU)"));
    boot_log.running("Embedder service", "loading model...");
    let start = Instant::now();

    let model_dir = entry.resolve_model_path(data_dir);

    // Model loading is synchronous (safetensors mmap) — offload to blocking thread
    let result = tokio::task::spawn_blocking(move || EmbedderService::boot(&model_dir))
        .await
        .map_err(|e| anyhow::anyhow!("Embedder spawn_blocking failed: {e}"));

    let result = match result {
        Ok(inner) => inner,
        Err(e) => Err(e),
    };

    match result {
        Ok(service) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            let dim = service.dimension();
            tracing::info!(
                step = "Embedder service",
                status = "ready",
                dimension = dim,
                latency_ms = elapsed_ms,
                "Candle embedder booted (CPU burst mode)"
            );
            on_event(InitEvent::ok_with_latency("Embedder service", start.elapsed()));
            boot_log.ok("Embedder service", &format!("Candle dim={dim} CPU ({elapsed_ms}ms)"));
            Some(Arc::new(service))
        }
        Err(e) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::error!(step = "Embedder service", error = ?e, "Candle embedder failed to boot");
            on_event(InitEvent::error("Embedder service", &format!("{e:#}")));
            boot_log.fail("Embedder service", &format!("{e:#} ({elapsed_ms}ms)"));
            None
        }
    }
}
