//! What the saved voice settings mean: the active profile, the voice to use and
//! how to transcribe. Profiles live in `preferences.json`; the default voice,
//! speed, language, beam and VAD in the kernel's voice settings.

use super::VoiceProfile;
use devpulse_engine::platform::Platform;
use devpulse_engine::platform::providers::SpeechHearing;
use std::collections::HashMap;
use std::path::PathBuf;

/// The preference holding the active profile's id.
pub(super) const ACTIVE_PROFILE_KEY: &str = "voice:active_profile";
/// The profile that always exists, and is active until another is chosen.
pub(super) const DEFAULT_PROFILE_ID: &str = "default";
/// What the default profile asks of speech-to-text until it is edited.
pub(super) const STANDARD_QUALITY: &str = "standard";

/// The preference holding one saved profile.
pub(super) fn profile_key(id: &str) -> String {
    format!("voice:profile:{id}")
}

fn preferences_file(platform: &Platform) -> PathBuf {
    PathBuf::from(&platform.config().data_dir).join("preferences.json")
}

/// The saved preferences; empty when there are none yet or they do not parse.
pub(super) fn read_preferences(platform: &Platform) -> Result<HashMap<String, String>, String> {
    let file = preferences_file(platform);
    if !file.exists() {
        return Ok(HashMap::new());
    }
    let content = std::fs::read_to_string(&file).map_err(|e| e.to_string())?;
    Ok(serde_json::from_str(&content).unwrap_or_default())
}

/// Replace the saved preferences.
pub(super) fn write_preferences(
    platform: &Platform,
    preferences: &HashMap<String, String>,
) -> Result<(), String> {
    let content = serde_json::to_string_pretty(preferences).map_err(|e| e.to_string())?;
    std::fs::write(preferences_file(platform), content).map_err(|e| e.to_string())
}

/// What the active profile asks for.
pub(super) struct ActiveProfile {
    /// Its id.
    pub id: String,
    /// The voice to speak with: the profile's, or else the saved default voice.
    pub voice: String,
    /// What it asks of speech-to-text.
    pub stt_quality: String,
}

/// Read the active profile; the default profile is the saved default voice.
pub(super) fn active_profile(platform: &Platform) -> Result<ActiveProfile, String> {
    let preferences = read_preferences(platform)?;
    let id = preferences
        .get(ACTIVE_PROFILE_KEY)
        .cloned()
        .unwrap_or_else(|| DEFAULT_PROFILE_ID.to_owned());
    let saved = preferences
        .get(&profile_key(&id))
        .and_then(|json| serde_json::from_str::<VoiceProfile>(json).ok());
    let (voice, stt_quality) = saved.map_or((None, None), |profile| {
        (
            Some(profile.tts_voice_id).filter(|voice| !voice.trim().is_empty()),
            Some(profile.stt_quality),
        )
    });
    Ok(ActiveProfile {
        id,
        voice: voice.unwrap_or_else(|| platform.voice_tts_config_load().default_voice),
        stt_quality: stt_quality.unwrap_or_else(|| STANDARD_QUALITY.to_owned()),
    })
}

/// How to transcribe: the saved language, and the beam the active profile asks for.
pub(super) fn hearing(platform: &Platform) -> Result<SpeechHearing, String> {
    let stt = platform.voice_stt_config_load();
    let quality = active_profile(platform)?.stt_quality;
    Ok(SpeechHearing {
        language: stt.language_hint().map(str::to_owned),
        beam_size: Some(stt.beam_size_for_quality(&quality)),
    })
}
