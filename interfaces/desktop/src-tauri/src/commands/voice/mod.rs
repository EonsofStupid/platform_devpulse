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
        (
            matches!(stt_status.model_status, SlotModelStatus::Loaded { .. }),
            matches!(tts_status.model_status, SlotModelStatus::Loaded { .. }),
        )
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
#[tauri::command]
#[specta::specta]
pub async fn speak(
    _state: State<'_, PlatformState>,
    _text: String,
    _voice: Option<String>,
    _slot: Option<String>,
) -> Result<(), String> {
    Err("Voice TTS not yet available — voice inference sprint required".to_string())
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

/// Preview a voice by playing a sample.
#[tauri::command]
#[specta::specta]
pub async fn preview_voice(
    _state: State<'_, PlatformState>,
    _voice: String,
    _slot_id: String,
) -> Result<(), String> {
    Err("Voice preview not yet available — voice inference sprint required".to_string())
}

// ── STT Commands ──────────────────────────────────────────────

/// Test the microphone and return audio stats.
#[tauri::command]
#[specta::specta]
pub async fn test_microphone(
    _state: State<'_, PlatformState>,
) -> Result<MicTestResult, String> {
    Err("Microphone test not yet available — voice inference sprint required".to_string())
}

/// Transcribe audio from the microphone.
#[tauri::command]
#[specta::specta]
pub async fn transcribe_audio(
    _state: State<'_, PlatformState>,
) -> Result<String, String> {
    Err("Speech-to-text not yet available — voice inference sprint required".to_string())
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
