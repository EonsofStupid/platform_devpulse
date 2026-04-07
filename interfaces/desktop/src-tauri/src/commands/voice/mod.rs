//! Voice Tauri commands — TTS, STT, voice profiles.
//!
//! All 11 commands required by the frontend voice domain.
//! Actual audio inference (Kokoro TTS, Whisper STT) requires the
//! voice inference sprint. Until then, commands return clear errors.

use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;
use crate::state::PlatformState;

// ── Types ─────────────────────────────────────────────────────

/// Voice information for the frontend.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VoiceInfo {
    /// Voice identifier.
    pub id: String,
    /// Display label.
    pub label: String,
    /// Gender: "male" | "female" | "neutral".
    pub gender: String,
    /// Sample text for preview.
    pub sample_text: String,
}

/// Voice profile — saved user configuration.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VoiceProfile {
    /// Profile identifier (UUID).
    pub id: String,
    /// Display name.
    pub name: String,
    /// TTS voice ID.
    pub tts_voice_id: String,
    /// STT model preference: "standard" | "high_quality" | "best".
    pub stt_quality: String,
    /// Whether this profile is currently active.
    pub active: bool,
}

/// Microphone test result.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MicTestResult {
    /// Whether the mic was detected.
    pub detected: bool,
    /// Peak amplitude (0.0 - 1.0).
    pub peak_amplitude: f32,
    /// Average amplitude.
    pub avg_amplitude: f32,
    /// Noise floor estimate.
    pub noise_floor: f32,
}

/// Voice subsystem status for the frontend.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VoiceStatusInfo {
    /// Whether the STT slot has a model loaded.
    pub stt_loaded: bool,
    /// Whether the TTS slot has a model loaded.
    pub tts_loaded: bool,
    /// Whether a microphone was detected (best-effort; actual detection requires audio sprint).
    pub mic_detected: bool,
    /// Currently active voice profile ID.
    pub active_profile: String,
    /// Currently active TTS voice ID.
    pub active_voice: String,
}

/// Get the current voice subsystem status.
///
/// Derives STT/TTS loaded state from model loader slot statuses.
/// Mic detection is best-effort until the audio sprint wires real device enumeration.
#[tauri::command]
#[specta::specta]
pub async fn get_voice_status(
    state: State<'_, PlatformState>,
) -> Result<VoiceStatusInfo, String> {
    let guard = state.platform.read().await;
    let platform = guard.as_ref().ok_or("Platform not ready")?;

    let (stt_loaded, tts_loaded) = if let Some(loader) = platform.model_loader() {
        use devpulse_engine::platform::services::model_loader::SlotModelStatus;
        let stt_status = loader.slot_status("voice.stt").await;
        let tts_status = loader.slot_status("voice.tts").await;
        let stt_via_slot = matches!(stt_status.model_status, SlotModelStatus::Loaded { .. });
        let tts_via_slot = matches!(tts_status.model_status, SlotModelStatus::Loaded { .. });
        // Also check VoicePool (ort-backed models report loaded there)
        let stt_via_voice = loader.voice_loaded("voice.stt").await;
        let tts_via_voice = loader.voice_loaded("voice.tts").await;
        (stt_via_slot || stt_via_voice, tts_via_slot || tts_via_voice)
    } else {
        (false, false)
    };

    Ok(VoiceStatusInfo {
        stt_loaded,
        tts_loaded,
        mic_detected: false, // Real detection requires audio sprint
        active_profile: "default".to_string(),
        active_voice: "af_heart".to_string(),
    })
}

// ── TTS Commands ──────────────────────────────────────────────

/// Speak text using TTS.
///
/// Synthesizes via the TTS model loaded in the voice.tts slot,
/// then plays the PCM audio through rodio.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state), fields(text_len = text.len()))]
pub async fn speak(
    state: State<'_, PlatformState>,
    text: String,
    voice: Option<String>,
    slot: Option<String>,
) -> Result<(), String> {
    let guard = state.platform.read().await;
    let platform = guard.as_ref().ok_or("Platform not ready")?;
    let loader = platform
        .model_loader()
        .ok_or("Model Loader not available")?;

    let slot_id = slot.as_deref().unwrap_or("voice.tts");
    let voice_name = voice.as_deref().unwrap_or("af_heart");

    let samples = loader
        .synthesize(slot_id, &text, voice_name)
        .await
        .map_err(|e| format!("TTS synthesis failed: {e}"))?;

    // Play audio via rodio on a blocking thread (rodio is sync)
    tokio::task::spawn_blocking(move || {
        use rodio::{OutputStream, Sink, Source};
        let (_stream, stream_handle) = OutputStream::try_default()
            .map_err(|e| format!("Audio output failed: {e}"))?;
        let sink = Sink::try_new(&stream_handle)
            .map_err(|e| format!("Audio sink failed: {e}"))?;

        let source = rodio::buffer::SamplesBuffer::new(
            samples.channels,
            samples.sample_rate,
            samples.data,
        );
        // Source trait methods — channels() and sample_rate() require trait in scope
        tracing::debug!(
            channels = source.channels(),
            sample_rate = source.sample_rate(),
            "Playing TTS audio via rodio"
        );
        sink.append(source);
        sink.sleep_until_end();
        Ok::<(), String>(())
    })
    .await
    .map_err(|e| format!("Audio playback thread failed: {e}"))??;

    Ok(())
}

/// Stop current speech.
#[tauri::command]
#[specta::specta]
pub async fn stop_speaking(
    _state: State<'_, PlatformState>,
) -> Result<(), String> {
    Ok(()) // No-op when nothing is speaking
}

/// Check if TTS is currently active.
#[tauri::command]
#[specta::specta]
pub async fn is_speaking(
    _state: State<'_, PlatformState>,
) -> Result<bool, String> {
    Ok(false)
}

/// List available TTS voices.
#[tauri::command]
#[specta::specta]
pub async fn list_voices(
    _state: State<'_, PlatformState>,
    _slot_id: String,
) -> Result<Vec<VoiceInfo>, String> {
    // Return built-in voice options (Kokoro voices)
    Ok(vec![
        VoiceInfo {
            id: "af_heart".to_string(),
            label: "Clyffy (Default)".to_string(),
            gender: "female".to_string(),
            sample_text: "Hi! I'm Clyffy, your AI assistant.".to_string(),
        },
        VoiceInfo {
            id: "af_star".to_string(),
            label: "Clyffy (Casual)".to_string(),
            gender: "female".to_string(),
            sample_text: "Hey there! What can I help with?".to_string(),
        },
        VoiceInfo {
            id: "am_adam".to_string(),
            label: "Leo (Male)".to_string(),
            gender: "male".to_string(),
            sample_text: "Hello, I'm here to help you out.".to_string(),
        },
    ])
}

/// Preview a voice by synthesizing and playing a sample phrase.
#[tauri::command]
#[specta::specta]
pub async fn preview_voice(
    state: State<'_, PlatformState>,
    voice: String,
    slot_id: String,
) -> Result<(), String> {
    // Use the same speak path with a canned sample
    let sample_text = match voice.as_str() {
        "af_heart" => "Hi! I'm Clyffy, your AI assistant.",
        "af_star" => "Hey there! What can I help with?",
        "am_adam" => "Hello, I'm here to help you out.",
        _ => "This is a voice preview.",
    };
    speak(state, sample_text.to_string(), Some(voice), Some(slot_id)).await
}

// ── STT Commands ──────────────────────────────────────────────

/// Test the microphone — capture 500ms and return amplitude stats.
#[tauri::command]
#[specta::specta]
pub async fn test_microphone(
    _state: State<'_, PlatformState>,
) -> Result<MicTestResult, String> {
    tokio::task::spawn_blocking(|| {
        let samples = capture_mic_samples(0.5, 16000)?;
        if samples.is_empty() {
            return Ok(MicTestResult {
                detected: false,
                peak_amplitude: 0.0,
                avg_amplitude: 0.0,
                noise_floor: 0.0,
            });
        }
        let peak = samples.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
        let avg = samples.iter().map(|s| s.abs()).sum::<f32>() / samples.len() as f32;
        // Noise floor: average of bottom 10% of absolute values
        let mut sorted: Vec<f32> = samples.iter().map(|s| s.abs()).collect();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let floor_count = (sorted.len() / 10).max(1);
        let noise_floor = sorted[..floor_count].iter().sum::<f32>() / floor_count as f32;

        Ok(MicTestResult {
            detected: true,
            peak_amplitude: peak,
            avg_amplitude: avg,
            noise_floor,
        })
    })
    .await
    .map_err(|e| format!("Mic test thread failed: {e}"))?
}

/// Transcribe audio from the microphone.
///
/// Captures ~3 seconds of audio from the default input device via rodio/cpal,
/// then runs it through the Whisper STT model loaded in voice.stt slot.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state))]
pub async fn transcribe_audio(
    state: State<'_, PlatformState>,
) -> Result<String, String> {
    use devpulse_engine::platform::services::model_loader::AudioSamples;

    // Capture audio on a blocking thread (cpal/rodio is sync)
    let pcm_data = tokio::task::spawn_blocking(|| {
        capture_mic_samples(3.0, 16000)
    })
    .await
    .map_err(|e| format!("Mic capture thread failed: {e}"))??;

    let guard = state.platform.read().await;
    let platform = guard.as_ref().ok_or("Platform not ready")?;
    let loader = platform
        .model_loader()
        .ok_or("Model Loader not available")?;

    let audio = AudioSamples {
        data: pcm_data,
        sample_rate: 16000,
        channels: 1,
    };

    loader
        .transcribe("voice.stt", &audio)
        .await
        .map_err(|e| format!("STT transcription failed: {e}"))
}

/// Capture PCM audio from the default microphone.
///
/// Uses rodio's input stream (backed by cpal). Returns mono f32 samples
/// at the requested sample rate. Duration in seconds.
fn capture_mic_samples(duration_secs: f32, target_sample_rate: u32) -> Result<Vec<f32>, String> {
    use std::sync::{Arc, Mutex};

    // rodio doesn't expose input devices directly — use cpal
    let host = rodio::cpal::default_host();
    let device = rodio::cpal::traits::HostTrait::default_input_device(&host)
        .ok_or_else(|| "No microphone detected".to_string())?;

    use rodio::cpal::traits::DeviceTrait;
    let config = device
        .default_input_config()
        .map_err(|e| format!("Failed to get mic config: {e}"))?;

    let sample_rate = config.sample_rate().0;
    let channels = config.channels() as usize;
    let total_samples = (duration_secs * sample_rate as f32) as usize * channels;

    let buffer: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::with_capacity(total_samples)));
    let buf_clone = buffer.clone();
    let done = Arc::new(std::sync::atomic::AtomicBool::new(false));
    let done_clone = done.clone();

    use rodio::cpal::traits::StreamTrait;
    let stream = device
        .build_input_stream(
            &config.into(),
            move |data: &[f32], _: &rodio::cpal::InputCallbackInfo| {
                let Ok(mut buf) = buf_clone.lock() else {
                    tracing::error!("Mic buffer mutex poisoned — dropping audio frame");
                    return;
                };
                if buf.len() < total_samples {
                    buf.extend_from_slice(data);
                } else {
                    done_clone.store(true, std::sync::atomic::Ordering::Relaxed);
                }
            },
            |err| {
                tracing::error!(error = %err, "Mic capture error");
            },
            None,
        )
        .map_err(|e| format!("Failed to build input stream: {e}"))?;

    stream.play().map_err(|e| format!("Failed to start mic capture: {e}"))?;

    // Wait for capture to complete
    let start = std::time::Instant::now();
    let max_wait = std::time::Duration::from_secs_f32(duration_secs + 1.0);
    while !done.load(std::sync::atomic::Ordering::Relaxed) {
        if start.elapsed() > max_wait {
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(50));
    }

    drop(stream);

    let raw = buffer.lock()
        .map_err(|e| format!("Mic buffer mutex poisoned after capture: {e}"))?
        .clone();

    // Convert to mono if stereo
    let mono: Vec<f32> = if channels > 1 {
        raw.chunks(channels)
            .map(|chunk| chunk.iter().sum::<f32>() / channels as f32)
            .collect()
    } else {
        raw
    };

    // Resample to target rate if needed (simple linear interpolation)
    if sample_rate != target_sample_rate {
        let ratio = target_sample_rate as f64 / sample_rate as f64;
        let new_len = (mono.len() as f64 * ratio) as usize;
        let mut resampled = Vec::with_capacity(new_len);
        for i in 0..new_len {
            let src_pos = i as f64 / ratio;
            let idx = src_pos as usize;
            let frac = src_pos - idx as f64;
            let sample = if idx + 1 < mono.len() {
                mono[idx] * (1.0 - frac as f32) + mono[idx + 1] * frac as f32
            } else if idx < mono.len() {
                mono[idx]
            } else {
                0.0
            };
            resampled.push(sample);
        }
        Ok(resampled)
    } else {
        Ok(mono)
    }
}

// ── Profile Commands ──────────────────────────────────────────

/// List saved voice profiles.
#[tauri::command]
#[specta::specta]
pub async fn list_voice_profiles(
    _state: State<'_, PlatformState>,
) -> Result<Vec<VoiceProfile>, String> {
    // Return default profiles until persistence is wired
    Ok(vec![
        VoiceProfile {
            id: "default".to_string(),
            name: "Default".to_string(),
            tts_voice_id: "af_heart".to_string(),
            stt_quality: "standard".to_string(),
            active: true,
        },
    ])
}

/// Save a voice profile.
#[tauri::command]
#[specta::specta]
pub async fn save_voice_profile(
    _state: State<'_, PlatformState>,
    _profile: VoiceProfile,
) -> Result<(), String> {
    Err("Voice profile persistence not yet available — GlobalDb sprint required".to_string())
}

/// Delete a voice profile.
#[tauri::command]
#[specta::specta]
pub async fn delete_voice_profile(
    _state: State<'_, PlatformState>,
    _profile_id: String,
) -> Result<(), String> {
    Err("Voice profile persistence not yet available — GlobalDb sprint required".to_string())
}

/// Activate a voice profile.
#[tauri::command]
#[specta::specta]
pub async fn activate_voice_profile(
    _state: State<'_, PlatformState>,
    _profile_id: String,
) -> Result<(), String> {
    Err("Voice profile persistence not yet available — GlobalDb sprint required".to_string())
}
