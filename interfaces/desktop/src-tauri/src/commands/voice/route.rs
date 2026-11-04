//! Where speech goes: the saved connection you chose, else the compiled-in slot.
//!
//! The slot is the fallback only when nothing is chosen. A chosen connection that
//! was edited, was removed or fails is an error, never a quiet switch to the slot.

use super::settings;
use devpulse_engine::platform::Platform;
use devpulse_engine::platform::services::model_loader::AudioSamples;
use devpulse_media::decode_audio_bytes;

/// Audio to play, and how fast to play it.
pub(super) struct Spoken {
    /// The samples.
    pub audio: AudioSamples,
    /// A server has already applied the speed; the slot's audio has it applied here.
    pub playback_speed: f32,
}

/// Text to audio.
pub(super) async fn synthesize(
    platform: &Platform,
    slot: &str,
    text: &str,
    voice: &str,
    speed: f32,
) -> Result<Spoken, String> {
    let requested = ((speed - 1.0).abs() > f32::EPSILON).then_some(speed);
    let encoded = platform
        .providers()
        .speak_at_endpoint(text, voice, requested)
        .await
        .map_err(|e| format!("{e:#}"))?;
    if let Some(encoded) = encoded {
        let decoded = devpulse_telemetry::spawn_blocking(move || decode_audio_bytes(encoded))
            .await
            .map_err(|e| format!("Audio decode thread failed: {e}"))??;
        return Ok(Spoken {
            audio: AudioSamples {
                data: decoded.samples,
                sample_rate: decoded.sample_rate,
                channels: decoded.channels,
            },
            playback_speed: 1.0,
        });
    }
    let loader = platform
        .model_loader()
        .ok_or("Model Loader not available")?;
    let audio = loader
        .synthesize(slot, text, voice)
        .await
        .map_err(|e| e.to_string())?;
    Ok(Spoken {
        audio,
        playback_speed: speed,
    })
}

/// Audio to text. The saved language and beam reach a connection; the compiled-in
/// slot's backends take neither.
pub(super) async fn transcribe(
    platform: &Platform,
    slot: &str,
    audio: &AudioSamples,
) -> Result<String, String> {
    let hearing = settings::hearing(platform)?;
    let heard = platform
        .providers()
        .transcribe_at_endpoint(&audio.data, audio.sample_rate, audio.channels, &hearing)
        .await
        .map_err(|e| format!("{e:#}"))?;
    if let Some(text) = heard {
        return Ok(text);
    }
    let loader = platform
        .model_loader()
        .ok_or("Model Loader not available")?;
    loader
        .transcribe(slot, audio)
        .await
        .map_err(|e| e.to_string())
}
