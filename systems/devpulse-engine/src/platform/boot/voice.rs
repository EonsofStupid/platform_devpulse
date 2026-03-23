//! Kokoros TTS boot stage — voice synthesis engine.
//!
//! Loads the Kokoros model and voice samples from disk.
//! Model loading can take several seconds depending on disk speed.

#[cfg(feature = "kokoros")]
use crate::platform::boot::log::BootLog;
#[cfg(feature = "kokoros")]
use crate::platform::config::VoiceServiceEntry;
#[cfg(feature = "kokoros")]
use crate::platform::init::InitEvent;
#[cfg(feature = "kokoros")]
use crate::platform::services::voice::VoiceService;

#[cfg(feature = "kokoros")]
use std::path::Path;
#[cfg(feature = "kokoros")]
use std::sync::Arc;
#[cfg(feature = "kokoros")]
use std::time::Instant;

/// Boot the Kokoros voice synthesis engine.
///
/// Returns `Some(service)` on success, `None` on failure or if disabled.
#[cfg(feature = "kokoros")]
#[allow(clippy::cast_possible_truncation)]
pub async fn boot(
    data_dir: &Path,
    entry: &VoiceServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
) -> Option<Arc<VoiceService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("Voice service"));
        boot_log.skip("Voice service", "disabled in config");
        return None;
    }

    on_event(InitEvent::running("Voice service", "Loading Kokoros TTS engine"));
    boot_log.running("Voice service", "loading Kokoros model...");
    let start = Instant::now();

    let model_path = entry.resolve_model_path(data_dir);
    let voices_path = entry.resolve_voices_path(data_dir);

    match VoiceService::boot(&model_path, &voices_path).await {
        Ok(store) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::info!(
                step = "Voice service",
                status = "ready",
                latency_us = start.elapsed().as_micros() as u64,
                model_path = %model_path.display(),
                voices_path = %voices_path.display(),
                "Kokoros TTS engine booted"
            );
            on_event(InitEvent::ok_with_latency("Voice service", start.elapsed()));
            boot_log.ok("Voice service", &format!("Kokoros model loaded ({elapsed_ms}ms)"));
            Some(Arc::new(store))
        }
        Err(e) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::error!(step = "Voice service", error = ?e, "Kokoros failed to boot");
            on_event(InitEvent::error("Voice service", &format!("{e:#}")));
            boot_log.fail("Voice service", &format!("{e:#} ({elapsed_ms}ms)"));
            None
        }
    }
}
