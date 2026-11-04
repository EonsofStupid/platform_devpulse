//! Voice Tauri commands — TTS, STT, voice profiles.
//!
//! All 11 commands required by the frontend voice domain.
//! Actual audio inference (Kokoro TTS, Whisper STT) requires the
//! voice inference sprint. Until then, commands return clear errors.
//!
//! # Cast lints
//!
//! This file does PCM audio-sample math: `i16` ↔ `f32` sample
//! conversions, `u32` sample-rate arithmetic, and `usize` frame-index
//! math. All casts are in the audio domain where the value range is
//! bounded by the format (e.g. `i16` samples in `[-32768, 32767]`).
//! Clippy's cast-truncation / sign-loss lints flag every one; they are
//! the intended representation changes for audio signal processing,
//! not accidental truncation. The file-level allow keeps the lint
//! active elsewhere in the workspace.

#![expect(
    clippy::cast_possible_truncation,
    clippy::cast_precision_loss,
    clippy::cast_sign_loss,
    reason = "PCM audio-sample math — i16 <-> f32 sample conversions, u32 sample-rate arithmetic, usize frame-index math. All casts bounded by format-defined ranges (see module-level `# Cast lints` doc)."
)]
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri command module — every Result-returning fn is a thin wrapper over `Platform` voice services / audio playback whose docs hold the canonical # Errors copy"
)]

use crate::state::PlatformState;
use devpulse_media::decode_audio_file_to_pcm;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::State;

/// Shared playback state — tracks whether TTS audio is currently playing.
/// Managed state in Tauri, shared between `speak`, `stop_speaking`, `is_speaking`.
#[derive(Debug)]
pub struct PlaybackState {
    /// Whether audio is currently playing.
    playing: Arc<AtomicBool>,
    /// Signal to stop playback early.
    stop_requested: Arc<AtomicBool>,
}

impl Default for PlaybackState {
    fn default() -> Self {
        Self::new()
    }
}

impl PlaybackState {
    /// Create a fresh playback state with no active audio.
    #[must_use]
    pub fn new() -> Self {
        Self {
            playing: Arc::new(AtomicBool::new(false)),
            stop_requested: Arc::new(AtomicBool::new(false)),
        }
    }
}

// ── Types ─────────────────────────────────────────────────────

/// Voice information for the frontend.
///
/// Mirrors [`model_loader::VoiceEntry`] — every field comes from the
/// voice registry TOML (`voices.default.toml`). Nothing here is hardcoded.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VoiceInfo {
    /// Voice identifier (e.g. `af_heart`).
    pub id: String,
    /// Human-friendly display label.
    pub label: String,
    /// Gender: `male`, `female`, or `neutral`.
    pub gender: String,
    /// BCP-47 language tag (`en-US`, `en-GB`, …).
    pub language: String,
    /// Which TTS backend owns this voice (`kokoro` | `piper`).
    pub engine: String,
    /// Freeform style descriptor (`warm`, `casual`, `professional`).
    pub style: String,
    /// Sample text played by the Preview button.
    pub sample_text: String,
    /// One-line blurb shown under the label in the picker.
    pub description: String,
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
    /// STT model preference: "standard" | "`high_quality`" | "best".
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
pub async fn get_voice_status(state: State<'_, PlatformState>) -> Result<VoiceStatusInfo, String> {
    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not ready")?;

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
    playback: State<'_, PlaybackState>,
    text: String,
    voice: Option<String>,
    slot: Option<String>,
    speed: Option<f32>,
) -> Result<(), String> {
    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not ready")?;
    let loader = platform
        .model_loader()
        .ok_or("Model Loader not available")?;

    let slot_id = slot.as_deref().unwrap_or("voice.tts");
    let voice_name = voice.as_deref().unwrap_or("af_heart");
    let tts_speed = speed.unwrap_or(1.0);
    tracing::info!(
        slot = %slot_id,
        voice = %voice_name,
        speed = %tts_speed,
        text_len = text.len(),
        "speak() starting"
    );

    let samples = loader
        .synthesize(slot_id, &text, voice_name)
        .await
        .map_err(|e| format!("TTS synthesis failed: {e}"))?;

    // Set playback state + clear stop flag
    playback.playing.store(true, Ordering::SeqCst);
    playback.stop_requested.store(false, Ordering::SeqCst);
    let stop_flag = Arc::clone(&playback.stop_requested);
    let playing_flag = Arc::clone(&playback.playing);

    // Play audio via rodio on a blocking thread
    devpulse_telemetry::spawn_blocking(move || {
        use rodio::Source;
        let source = playback_source(samples.channels, samples.sample_rate, samples.data)?;
        let device = open_speakers()?;
        let player = rodio::Player::connect_new(device.mixer());

        tracing::debug!(
            channels = source.channels().get(),
            sample_rate = source.sample_rate().get(),
            "Playing TTS audio via rodio"
        );
        player.set_speed(tts_speed);
        player.append(source);

        // Poll for stop request instead of blocking forever
        while !player.empty() {
            if stop_flag.load(Ordering::SeqCst) {
                tracing::info!("speak() — stop requested, halting playback");
                player.stop();
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(50));
        }

        playing_flag.store(false, Ordering::SeqCst);
        Ok::<(), String>(())
    })
    .await
    .map_err(|e| format!("Audio playback thread failed: {e}"))??;

    playback.playing.store(false, Ordering::SeqCst);
    Ok(())
}

/// Synthesized audio as something rodio can play.
fn playback_source(
    channels: u16,
    sample_rate: u32,
    data: Vec<f32>,
) -> Result<rodio::buffer::SamplesBuffer, String> {
    let channels =
        std::num::NonZero::new(channels).ok_or("Synthesized audio reports no channels")?;
    let sample_rate =
        std::num::NonZero::new(sample_rate).ok_or("Synthesized audio reports no sample rate")?;
    Ok(rodio::buffer::SamplesBuffer::new(
        channels,
        sample_rate,
        data,
    ))
}

/// The default speakers, for one utterance. Playback stops when this is dropped.
fn open_speakers() -> Result<rodio::MixerDeviceSink, String> {
    let mut device = rodio::DeviceSinkBuilder::open_default_sink()
        .map_err(|e| format!("Audio output failed: {e}"))?;
    // Closing after each utterance is expected; don't print rodio's notice.
    device.log_on_drop(false);
    Ok(device)
}

/// Stop current speech.
#[tauri::command]
#[specta::specta]
pub async fn stop_speaking(playback: State<'_, PlaybackState>) -> Result<(), String> {
    if playback.playing.load(Ordering::SeqCst) {
        tracing::info!("stop_speaking() — signalling playback to halt");
        playback.stop_requested.store(true, Ordering::SeqCst);
    }
    Ok(())
}

/// Check if TTS is currently active.
#[tauri::command]
#[specta::specta]
pub async fn is_speaking(playback: State<'_, PlaybackState>) -> Result<bool, String> {
    Ok(playback.playing.load(Ordering::SeqCst))
}

/// List available TTS voices.
///
/// Reads the voice registry TOML (`voices.default.toml` plus any user
/// override at `{userdata}/config/voices.toml`) — nothing is hardcoded.
/// The `slot_id` parameter is accepted for API symmetry but not used:
/// the registry is global, not per-slot.
#[tauri::command]
#[specta::specta]
pub async fn list_voices(
    state: State<'_, PlatformState>,
    _slot_id: String,
) -> Result<Vec<VoiceInfo>, String> {
    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not ready")?;

    let userdata = platform.data_dir().clone();
    let registry =
        devpulse_engine::platform::services::model_loader::VoiceRegistry::load(&userdata)
            .map_err(|e| format!("Failed to load voice registry: {e}"))?;

    Ok(registry
        .all()
        .iter()
        .map(|v| VoiceInfo {
            id: v.id.clone(),
            label: v.label.clone(),
            gender: v.gender.clone(),
            language: v.language.clone(),
            engine: v.engine.clone(),
            style: v.style.clone(),
            sample_text: v.sample_text.clone(),
            description: v.description.clone(),
        })
        .collect())
}

/// Preview a voice by synthesizing and playing its registry `sample_text`.
///
/// Looks up the voice in the registry — returns an error if the voice is
/// not registered, rather than playing a canned fallback line.
#[tauri::command]
#[specta::specta]
pub async fn preview_voice(
    state: State<'_, PlatformState>,
    playback: State<'_, PlaybackState>,
    voice: String,
    slot_id: String,
) -> Result<(), String> {
    let sample_text = {
        // P0: lock-free atomic load.
        let platform = state.platform.load_full().ok_or("Platform not ready")?;
        let userdata = platform.data_dir().clone();
        let registry =
            devpulse_engine::platform::services::model_loader::VoiceRegistry::load(&userdata)
                .map_err(|e| format!("Failed to load voice registry: {e}"))?;
        registry
            .find(&voice)
            .ok_or_else(|| format!("Voice '{voice}' not found in registry"))?
            .sample_text
            .clone()
    };
    speak(
        state,
        playback,
        sample_text,
        Some(voice),
        Some(slot_id),
        None,
    )
    .await
}

// ── STT Commands ──────────────────────────────────────────────

/// Test the microphone — capture 500ms and return amplitude stats.
#[tauri::command]
#[specta::specta]
pub async fn test_microphone(state: State<'_, PlatformState>) -> Result<MicTestResult, String> {
    let platform = state.platform.load_full().ok_or("Platform not ready")?;
    let routing = platform.routing_config_load().await;
    let buffer_ms = routing.latency.audio_buffer_ms;
    devpulse_telemetry::spawn_blocking(move || {
        let samples = capture_mic_samples(0.5, 16000, buffer_ms)?;
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
pub async fn transcribe_audio(state: State<'_, PlatformState>) -> Result<String, String> {
    use devpulse_engine::platform::services::model_loader::AudioSamples;

    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not ready")?;
    let routing = platform.routing_config_load().await;
    let buffer_ms = routing.latency.audio_buffer_ms;

    // Capture audio on a blocking thread (cpal/rodio is sync)
    let pcm_data =
        devpulse_telemetry::spawn_blocking(move || capture_mic_samples(3.0, 16000, buffer_ms))
            .await
            .map_err(|e| format!("Mic capture thread failed: {e}"))??;

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
///
/// `buffer_ms` is the user-configured cpal capture buffer length in
/// milliseconds, sourced from `routing.toml`'s
/// `latency.audio_buffer_ms` (clamped engine-side to `[50, 1000]`).
/// We translate it into a frame count at the device's native sample
/// rate and apply it as `cpal::BufferSize::Fixed`. Downstream cpal
/// hosts that cannot honor the requested size (WASAPI in shared mode,
/// some ALSA configurations) fall back internally; the user-visible
/// effect is the latency slider biasing the OS choice rather than
/// dictating it absolutely.
///
/// A hard floor of 64 frames is enforced at this seam — cpal rejects
/// buffers below that on most backends. When the engine-clamped value
/// produces fewer frames than 64 (only possible at extremely low
/// sample rates), the floor is logged so the adjustment is visible.
fn capture_mic_samples(
    duration_secs: f32,
    target_sample_rate: u32,
    buffer_ms: u32,
) -> Result<Vec<f32>, String> {
    use rodio::cpal::traits::{DeviceTrait, StreamTrait};
    use std::sync::{Arc, Mutex};

    // rodio doesn't expose input devices directly — use cpal
    let host = rodio::cpal::default_host();
    let device = rodio::cpal::traits::HostTrait::default_input_device(&host)
        .ok_or_else(|| "No microphone detected".to_string())?;

    let supported = device
        .default_input_config()
        .map_err(|e| format!("Failed to get mic config: {e}"))?;

    let sample_rate = supported.sample_rate();
    let channels = supported.channels() as usize;
    let total_samples = (duration_secs * sample_rate as f32) as usize * channels;

    // Translate user-config ms → cpal frame count at the device rate.
    // Engine save-time clamp keeps `buffer_ms` in `[50, 1000]`; that
    // converts to `[2_400, 48_000]` frames at 48 kHz which sits well
    // above cpal's 64-frame floor. The floor still runs as a defensive
    // bound (cpal rejects sub-64 on most backends) and emits when
    // adjusted so the discrepancy is observable.
    let raw_frames = u64::from(buffer_ms) * u64::from(sample_rate) / 1_000;
    let mut frames = u32::try_from(raw_frames).unwrap_or(u32::MAX);
    let mut floor_applied = false;
    if frames < 64 {
        frames = 64;
        floor_applied = true;
    }

    let mut stream_config: rodio::cpal::StreamConfig = supported.into();
    stream_config.buffer_size = rodio::cpal::BufferSize::Fixed(frames);

    tracing::info!(
        target: "audio.config",
        buffer_ms,
        buffer_frames = frames,
        sample_rate,
        channels,
        floor_applied,
        "mic capture stream opening with routing.latency.audio_buffer_ms"
    );

    let buffer: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::with_capacity(total_samples)));
    let buf_clone = buffer.clone();
    let done = Arc::new(std::sync::atomic::AtomicBool::new(false));
    let done_clone = done.clone();

    let stream = device
        .build_input_stream(
            stream_config,
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

    stream
        .play()
        .map_err(|e| format!("Failed to start mic capture: {e}"))?;

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

    let raw = buffer
        .lock()
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
    if sample_rate == target_sample_rate {
        Ok(mono)
    } else {
        let ratio = f64::from(target_sample_rate) / f64::from(sample_rate);
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
    }
}

// ── Profile Commands (persisted to preferences.json) ─────────

/// List saved voice profiles.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn list_voice_profiles(
    state: State<'_, PlatformState>,
) -> Result<Vec<VoiceProfile>, String> {
    tracing::info!("list_voice_profiles() called");
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let prefs_path = platform.config().data_dir.clone();
    let prefs_file = std::path::PathBuf::from(&prefs_path).join("preferences.json");

    let prefs: std::collections::HashMap<String, String> = if prefs_file.exists() {
        let content = std::fs::read_to_string(&prefs_file).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        std::collections::HashMap::new()
    };

    let active_id = prefs
        .get("voice:active_profile")
        .cloned()
        .unwrap_or_else(|| "default".to_string());

    let mut profiles: Vec<VoiceProfile> = prefs
        .iter()
        .filter(|(k, _)| k.starts_with("voice:profile:"))
        .filter_map(|(_, v)| serde_json::from_str::<VoiceProfile>(v).ok())
        .collect();

    // Always include a default profile
    if !profiles.iter().any(|p| p.id == "default") {
        profiles.push(VoiceProfile {
            id: "default".to_string(),
            name: "Default".to_string(),
            tts_voice_id: "af_heart".to_string(),
            stt_quality: "standard".to_string(),
            active: false,
        });
    }

    // Mark active
    for p in &mut profiles {
        p.active = p.id == active_id;
    }

    tracing::info!(count = profiles.len(), active = %active_id, "list_voice_profiles() returning");
    Ok(profiles)
}

/// Save a voice profile to preferences.json.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn save_voice_profile(
    state: State<'_, PlatformState>,
    profile: VoiceProfile,
) -> Result<(), String> {
    tracing::info!(profile_id = %profile.id, name = %profile.name, voice = %profile.tts_voice_id, "save_voice_profile()");
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let prefs_path = platform.config().data_dir.clone();
    let prefs_file = std::path::PathBuf::from(&prefs_path).join("preferences.json");

    let mut prefs: std::collections::HashMap<String, String> = if prefs_file.exists() {
        let content = std::fs::read_to_string(&prefs_file).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        std::collections::HashMap::new()
    };

    let key = format!("voice:profile:{}", profile.id);
    let json = serde_json::to_string(&profile).map_err(|e| e.to_string())?;
    prefs.insert(key, json);

    let out = serde_json::to_string_pretty(&prefs).map_err(|e| e.to_string())?;
    std::fs::write(&prefs_file, out).map_err(|e| e.to_string())?;
    tracing::info!(profile_id = %profile.id, "Voice profile saved");
    Ok(())
}

/// Delete a voice profile.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn delete_voice_profile(
    state: State<'_, PlatformState>,
    profile_id: String,
) -> Result<(), String> {
    tracing::info!(profile_id = %profile_id, "delete_voice_profile()");
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let prefs_path = platform.config().data_dir.clone();
    let prefs_file = std::path::PathBuf::from(&prefs_path).join("preferences.json");

    let mut prefs: std::collections::HashMap<String, String> = if prefs_file.exists() {
        let content = std::fs::read_to_string(&prefs_file).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        return Ok(());
    };

    let key = format!("voice:profile:{profile_id}");
    prefs.remove(&key);

    // If deleted profile was active, reset to default
    if prefs
        .get("voice:active_profile")
        .map(std::string::String::as_str)
        == Some(&profile_id)
    {
        prefs.insert("voice:active_profile".to_string(), "default".to_string());
    }

    let out = serde_json::to_string_pretty(&prefs).map_err(|e| e.to_string())?;
    std::fs::write(&prefs_file, out).map_err(|e| e.to_string())?;
    tracing::info!(profile_id = %profile_id, "Voice profile deleted");
    Ok(())
}

/// Activate a voice profile.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn activate_voice_profile(
    state: State<'_, PlatformState>,
    profile_id: String,
) -> Result<(), String> {
    tracing::info!(profile_id = %profile_id, "activate_voice_profile()");
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let prefs_path = platform.config().data_dir.clone();
    let prefs_file = std::path::PathBuf::from(&prefs_path).join("preferences.json");

    let mut prefs: std::collections::HashMap<String, String> = if prefs_file.exists() {
        let content = std::fs::read_to_string(&prefs_file).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        std::collections::HashMap::new()
    };

    prefs.insert("voice:active_profile".to_string(), profile_id.clone());
    let out = serde_json::to_string_pretty(&prefs).map_err(|e| e.to_string())?;
    std::fs::write(&prefs_file, out).map_err(|e| e.to_string())?;
    tracing::info!(profile_id = %profile_id, "Voice profile activated");
    Ok(())
}

// ── Audio file upload + STS pipeline ──────────────────────────

/// Transcribe an audio file on disk (MP3, WAV, FLAC, Vorbis).
///
/// Decodes via rodio → mono 16 kHz PCM → voice.stt slot. Lets the user
/// upload any supported audio file and get back a transcript without
/// going through the microphone path.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state), fields(path))]
pub async fn transcribe_audio_file(
    state: State<'_, PlatformState>,
    path: String,
) -> Result<String, String> {
    use devpulse_engine::platform::services::model_loader::AudioSamples;

    let pcm = {
        let path = std::path::PathBuf::from(&path);
        devpulse_telemetry::spawn_blocking(move || decode_audio_file_to_pcm(&path, 16000))
            .await
            .map_err(|e| format!("Audio decode thread failed: {e}"))??
    };

    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not ready")?;
    let loader = platform
        .model_loader()
        .ok_or("Model Loader not available")?;

    let audio = AudioSamples {
        data: pcm,
        sample_rate: 16000,
        channels: 1,
    };

    loader
        .transcribe("voice.stt", &audio)
        .await
        .map_err(|e| format!("STT transcription failed: {e}"))
}

/// Result of a voice smoke test — closed-loop TTS→STT round-trip.
///
/// Runs without any bundled assets: synthesizes a fixed phrase via the
/// voice.tts slot, then feeds the PCM output straight into the voice.stt
/// slot. Reports per-stage success so the UI can pinpoint which side of
/// the pipeline is broken when a user hits "Run smoke test" in the Voice
/// Lab.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VoiceSmokeReport {
    /// Whether the TTS stage returned non-empty audio.
    pub tts_ok: bool,
    /// Whether the STT stage returned a non-empty transcript.
    pub stt_ok: bool,
    /// The phrase synthesized at the TTS stage (fixed, for reference).
    pub spoken: String,
    /// Transcript returned by the STT stage (empty if `stt_ok` is false).
    pub transcript: String,
    /// Total wall time for the round-trip in milliseconds.
    pub duration_ms: u64,
    /// Error from whichever stage failed first, if any.
    pub error: Option<String>,
}

/// Closed-loop voice smoke test: TTS → STT round-trip.
///
/// Synthesizes a fixed phrase via `voice.tts`, resamples to 16 kHz mono,
/// and feeds it into `voice.stt`. No audio is played and no files are
/// needed. Failure at any stage is captured in the report rather than
/// bubbled up, so the UI can show a two-green-check or a pinpoint error.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state))]
pub async fn voice_smoke_test(state: State<'_, PlatformState>) -> Result<VoiceSmokeReport, String> {
    use devpulse_engine::platform::services::model_loader::AudioSamples;

    let spoken = "Smoke test one two three.".to_string();
    let start = std::time::Instant::now();

    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not ready")?;
    let loader = platform
        .model_loader()
        .ok_or("Model Loader not available")?;

    // Stage 1: TTS
    let tts_samples = match loader.synthesize("voice.tts", &spoken, "af_heart").await {
        Ok(s) if !s.data.is_empty() => s,
        Ok(_) => {
            return Ok(VoiceSmokeReport {
                tts_ok: false,
                stt_ok: false,
                spoken,
                transcript: String::new(),
                duration_ms: start.elapsed().as_millis() as u64,
                error: Some("TTS returned zero samples".to_string()),
            });
        }
        Err(e) => {
            return Ok(VoiceSmokeReport {
                tts_ok: false,
                stt_ok: false,
                spoken,
                transcript: String::new(),
                duration_ms: start.elapsed().as_millis() as u64,
                error: Some(format!("TTS failed: {e}")),
            });
        }
    };

    // Resample to 16 kHz mono for Whisper. Downmix channels first, then
    // linear-interpolate to the target rate (same cheap path the file
    // decoder uses — good enough for a smoke test).
    let channels = tts_samples.channels as usize;
    let source_rate = tts_samples.sample_rate;
    let raw = tts_samples.data;
    let mono: Vec<f32> = if channels > 1 {
        raw.chunks(channels)
            .map(|chunk| chunk.iter().sum::<f32>() / channels as f32)
            .collect()
    } else {
        raw
    };
    let resampled = if source_rate == 16_000 {
        mono
    } else {
        let ratio = 16_000.0_f64 / f64::from(source_rate);
        let new_len = (mono.len() as f64 * ratio) as usize;
        let mut out = Vec::with_capacity(new_len);
        for i in 0..new_len {
            let src_pos = i as f64 / ratio;
            let idx = src_pos as usize;
            let frac = (src_pos - idx as f64) as f32;
            let sample = if idx + 1 < mono.len() {
                mono[idx] * (1.0 - frac) + mono[idx + 1] * frac
            } else if idx < mono.len() {
                mono[idx]
            } else {
                0.0
            };
            out.push(sample);
        }
        out
    };

    let stt_input = AudioSamples {
        data: resampled,
        sample_rate: 16_000,
        channels: 1,
    };

    // Stage 2: STT
    let transcript = match loader.transcribe("voice.stt", &stt_input).await {
        Ok(t) => t,
        Err(e) => {
            return Ok(VoiceSmokeReport {
                tts_ok: true,
                stt_ok: false,
                spoken,
                transcript: String::new(),
                duration_ms: start.elapsed().as_millis() as u64,
                error: Some(format!("STT failed: {e}")),
            });
        }
    };

    let stt_ok = !transcript.trim().is_empty();
    let error = if stt_ok {
        None
    } else {
        Some("STT returned empty transcript".to_string())
    };

    Ok(VoiceSmokeReport {
        tts_ok: true,
        stt_ok,
        spoken,
        transcript,
        duration_ms: start.elapsed().as_millis() as u64,
        error,
    })
}

/// Result of a full STS (speech-to-speech) pipeline run.
///
/// The pipeline: uploaded audio → STT (transcript) → brain (reply) → TTS (audio).
/// Returns both the transcript and the reply text so the UI can display
/// the conversation turn. The TTS audio is played directly through the
/// default output device — it is not returned over IPC.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct StsPipelineResult {
    /// Transcript produced by the STT stage.
    pub transcript: String,
    /// Reply text produced by the brain stage.
    pub reply: String,
    /// TTS voice used to synthesize the reply.
    pub voice: String,
}

/// Run the full speech-to-speech pipeline.
///
/// Stages:
/// 1. **STT** — transcribe `audio_path` via voice.stt slot
/// 2. **Brain** — generate a reply via `brain_slot` (defaults to `chat.brain`)
/// 3. **TTS** — synthesize the reply via voice.tts slot with `voice`
/// 4. **Playback** — play through the default output device
///
/// Errors from any stage are returned with enough context that the UI can
/// show which stage failed.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state), fields(audio_path, brain_slot, voice))]
pub async fn run_sts_pipeline(
    state: State<'_, PlatformState>,
    audio_path: String,
    brain_slot: Option<String>,
    voice: Option<String>,
    max_tokens: Option<u32>,
) -> Result<StsPipelineResult, String> {
    use devpulse_engine::platform::integrations::InferenceResponse;
    use devpulse_engine::platform::services::model_loader::AudioSamples;
    use devpulse_engine::platform::telemetry::TraceContext;

    let brain_slot_id = brain_slot.unwrap_or_else(|| "chat.brain".to_string());
    let voice_name = voice.unwrap_or_else(|| "af_heart".to_string());
    let max_tokens = max_tokens.unwrap_or(256);

    // Stage 1: STT — decode + transcribe
    let pcm = {
        let path = std::path::PathBuf::from(&audio_path);
        devpulse_telemetry::spawn_blocking(move || decode_audio_file_to_pcm(&path, 16000))
            .await
            .map_err(|e| format!("STS stage 1 (decode) thread failed: {e}"))??
    };

    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not ready")?;
    let loader = platform
        .model_loader()
        .ok_or("Model Loader not available")?;

    let samples = AudioSamples {
        data: pcm,
        sample_rate: 16000,
        channels: 1,
    };

    let transcript = loader
        .transcribe("voice.stt", &samples)
        .await
        .map_err(|e| format!("STS stage 1 (STT) failed: {e}"))?;
    tracing::info!(transcript_len = transcript.len(), "STS stage 1 complete");

    // Stage 2: Brain — chain transcript into inference
    let handle = loader
        .inference_handle(&brain_slot_id)
        .await
        .map_err(|e| format!("STS stage 2 (brain lookup) failed: {e}"))?
        .ok_or_else(|| format!("STS stage 2: no model loaded in brain slot '{brain_slot_id}'"))?;

    let trace_ctx = TraceContext::new();
    let token_rx = handle
        .generate(
            transcript.clone(),
            max_tokens,
            0.7,
            trace_ctx.trace_id.clone(),
        )
        .await
        .map_err(|e| format!("STS stage 2 (generate) failed: {e:#}"))?;

    let mut reply = String::new();
    while let Ok(traced) = token_rx.recv_async().await {
        match traced.value {
            InferenceResponse::Token { text, .. } => reply.push_str(&text),
            InferenceResponse::Done(text) => {
                reply = text;
                break;
            }
            InferenceResponse::Error(e) => {
                return Err(format!("STS stage 2 (generate) error: {e}"));
            }
        }
    }
    tracing::info!(reply_len = reply.len(), "STS stage 2 complete");

    // Stage 3: TTS — synthesize the reply
    let tts_samples = loader
        .synthesize("voice.tts", &reply, &voice_name)
        .await
        .map_err(|e| format!("STS stage 3 (TTS) failed: {e}"))?;
    tracing::info!(
        samples = tts_samples.data.len(),
        "STS stage 3 complete — playing audio"
    );

    // Stage 4: Playback — reuse the same rodio path as speak()
    devpulse_telemetry::spawn_blocking(move || {
        let source = playback_source(
            tts_samples.channels,
            tts_samples.sample_rate,
            tts_samples.data,
        )?;
        let device = open_speakers()?;
        let player = rodio::Player::connect_new(device.mixer());
        player.append(source);
        player.sleep_until_end();
        Ok::<(), String>(())
    })
    .await
    .map_err(|e| format!("STS stage 4 (playback thread) failed: {e}"))??;

    Ok(StsPipelineResult {
        transcript,
        reply,
        voice: voice_name,
    })
}

// ═══════════════════════════════════════════════════════════════
// Kokoros (TTS) — user-scope config persistence
// ═══════════════════════════════════════════════════════════════

use model_loader::runtimes::{voice_stt::VoiceSttConfig, voice_tts::VoiceTtsConfig};

/// Load the persisted TTS config (default voice + default speed).
///
/// Reads `{data_dir}/user/voice_tts.toml`. Returns defaults when the
/// file is missing or malformed — never errors for parse failures.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn voice_tts_load_config(
    state: State<'_, PlatformState>,
) -> Result<VoiceTtsConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    Ok(platform.voice_tts_config_load())
}

/// Persist TTS config atomically. Returns the clamped config that was
/// actually written (speed clamped to `[0.5, 2.0]`, empty voice
/// replaced by the default `af_heart`).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn voice_tts_save_config(
    state: State<'_, PlatformState>,
    cfg: VoiceTtsConfig,
) -> Result<VoiceTtsConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .voice_tts_config_save(&cfg)
        .map_err(|e| format!("{e:#}"))
}

/// Load the persisted STT config (language + beam + VAD).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn voice_stt_load_config(
    state: State<'_, PlatformState>,
) -> Result<VoiceSttConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    Ok(platform.voice_stt_config_load())
}

/// Persist STT config atomically. Returns the clamped config.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn voice_stt_save_config(
    state: State<'_, PlatformState>,
    cfg: VoiceSttConfig,
) -> Result<VoiceSttConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .voice_stt_config_save(&cfg)
        .map_err(|e| format!("{e:#}"))
}
