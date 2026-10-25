//! Whisper ASR boot stage — CPU burst speech-to-text.
//!
//! Loads a Whisper model from `.userdata/system/candle/whisper/`.
//! Model loading is synchronous (mmap'd safetensors), wrapped in `spawn_blocking`.

#[cfg(feature = "candle")]
use crate::platform::boot::log::BootLog;
#[cfg(feature = "candle")]
use crate::platform::config::WhisperServiceEntry;
#[cfg(feature = "candle")]
use crate::platform::init::InitEvent;
#[cfg(feature = "candle")]
use crate::platform::services::whisper::WhisperService;

#[cfg(feature = "candle")]
use std::path::Path;
#[cfg(feature = "candle")]
use std::sync::Arc;
#[cfg(feature = "candle")]
use std::time::Instant;

/// Boot the Whisper ASR service.
///
/// Returns `Some(service)` on success, `None` on failure or if disabled.
#[cfg(feature = "candle")]
#[allow(clippy::cast_possible_truncation)]
pub async fn boot(
    data_dir: &Path,
    entry: &WhisperServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
) -> Option<Arc<WhisperService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("Whisper service"));
        boot_log.skip("Whisper service", "disabled in config");
        return None;
    }

    on_event(InitEvent::running("Whisper service", "Loading Whisper model (CPU)"));
    boot_log.running("Whisper service", "loading model...");
    let start = Instant::now();

    let model_dir = entry.resolve_model_path(data_dir);

    let result = tokio::task::spawn_blocking(move || WhisperService::boot(&model_dir))
        .await
        .map_err(|e| anyhow::anyhow!("Whisper spawn_blocking failed: {e}"));

    let result = match result {
        Ok(inner) => inner,
        Err(e) => Err(e),
    };

    match result {
        Ok(service) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::info!(
                step = "Whisper service",
                status = "ready",
                latency_ms = elapsed_ms,
                "Whisper ASR booted (CPU burst mode)"
            );
            on_event(InitEvent::ok_with_latency("Whisper service", start.elapsed()));
            boot_log.ok("Whisper service", &format!("Whisper ASR CPU ({elapsed_ms}ms)"));
            Some(Arc::new(service))
        }
        Err(e) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::error!(step = "Whisper service", error = ?e, "Whisper ASR failed to boot");
            on_event(InitEvent::error("Whisper service", &format!("{e:#}")));
            boot_log.fail("Whisper service", &format!("{e:#} ({elapsed_ms}ms)"));
            None
        }
    }
}
