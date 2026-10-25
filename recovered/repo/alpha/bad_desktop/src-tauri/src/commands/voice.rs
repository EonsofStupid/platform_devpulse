//! Voice commands - STT, TTS, and Voice Model Discovery
//!
//! Commands:
//! - get_voice_status: Check Whisper/Kokoro availability
//! - speak: TTS (returns WAV bytes)
//! - transcribe: STT (accepts WAV bytes)
//! - scan_voice_models: Scan a folder for Whisper/Kokoro models
//! - get_voice_discovery: Get current discovery result
//! - get_voice_setup_help: Get download instructions
//! - select_voice_model: Select a discovered voice model
//! - save_voice_model_path: Save voice model path to user config

use crate::audio::{samples_to_wav, wav_to_samples};
use crate::state::AppState;
use crate::types::{VoiceDiscoveryJson, VoiceStatus};
use tauri::State;

/// Get voice status
#[tauri::command]
pub async fn get_voice_status(state: State<'_, AppState>) -> Result<VoiceStatus, String> {
    let engine = state.engine().await?;
    let model_status = engine.voice.model_status();

    Ok(VoiceStatus {
        stt_ready: model_status.whisper_ready,
        tts_ready: model_status.kokoro_ready,
        stt_missing: model_status.whisper_missing.clone(),
        tts_missing: model_status.kokoro_missing.clone(),
    })
}

/// Speak text (TTS)
#[tauri::command]
pub async fn speak(text: String, state: State<'_, AppState>) -> Result<Vec<u8>, String> {
    let engine = state.engine().await?;
    let result = engine.voice.speak(&text).map_err(|e| e.to_string())?;

    let wav_bytes = samples_to_wav(&result.audio, result.sample_rate);
    Ok(wav_bytes)
}

/// Transcribe audio (STT)
#[tauri::command]
pub async fn transcribe(audio_bytes: Vec<u8>, state: State<'_, AppState>) -> Result<String, String> {
    let engine = state.engine().await?;
    let samples = wav_to_samples(&audio_bytes)?;
    engine.voice.transcribe(&samples).map_err(|e| e.to_string())
}

// ============== Voice Discovery Commands ==============

/// Scan a folder for Whisper/Kokoro voice models
///
/// Returns discovered models with their readiness status.
/// User browses to a folder, we scan it and show what we found.
#[tauri::command]
pub async fn scan_voice_models(
    path: String,
    state: State<'_, AppState>,
) -> Result<VoiceDiscoveryJson, String> {
    let engine = state.engine().await?;
    let path = std::path::Path::new(&path);

    let result = engine
        .voice_discovery
        .set_model_directory(path)
        .await
        .map_err(|e| e.to_string())?;

    Ok(VoiceDiscoveryJson::from(result))
}

/// Get current voice discovery result (if any)
#[tauri::command]
pub async fn get_voice_discovery(
    state: State<'_, AppState>,
) -> Result<Option<VoiceDiscoveryJson>, String> {
    let engine = state.engine().await?;

    let result = engine.voice_discovery.get_discovery().await;
    Ok(result.map(VoiceDiscoveryJson::from))
}

/// Get voice model download/setup instructions
#[tauri::command]
pub async fn get_voice_setup_help(state: State<'_, AppState>) -> Result<String, String> {
    let engine = state.engine().await?;
    Ok(engine.voice.download_instructions())
}

/// Select a discovered Whisper (STT) model
#[tauri::command]
pub async fn select_whisper_model(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let engine = state.engine().await?;

    engine
        .voice_discovery
        .select_whisper(&id)
        .await
        .map_err(|e| e.to_string())?;

    // TODO: Re-initialize voice facade with new selection
    Ok(())
}

/// Select a discovered Kokoro (TTS) model
#[tauri::command]
pub async fn select_kokoro_model(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let engine = state.engine().await?;

    engine
        .voice_discovery
        .select_kokoro(&id)
        .await
        .map_err(|e| e.to_string())?;

    // TODO: Re-initialize voice facade with new selection
    Ok(())
}

/// Save voice model path to user config and initialize voice
///
/// After user selects a folder with voice models, save it so it persists
/// across restarts.
#[tauri::command]
pub async fn save_voice_model_path(
    path: String,
    state: State<'_, AppState>,
) -> Result<VoiceStatus, String> {
    let engine = state.engine().await?;
    let db = engine.database();

    // Save to user config
    db.set_user_config("voice_model_path", &path, "voice")
        .await
        .map_err(|e| e.to_string())?;

    // Return current status (after path saved, next restart will init voice)
    let model_status = engine.voice.model_status();
    Ok(VoiceStatus {
        stt_ready: model_status.whisper_ready,
        tts_ready: model_status.kokoro_ready,
        stt_missing: model_status.whisper_missing.clone(),
        tts_missing: model_status.kokoro_missing.clone(),
    })
}

/// Reload voice models from currently configured path
///
/// Re-scans the voice model directory and reinitializes the voice backend.
/// Use this after downloading new models.
#[tauri::command]
pub async fn reload_voice(state: State<'_, AppState>) -> Result<VoiceStatus, String> {
    let engine = state.engine().await?;
    let db = engine.database();

    // Get saved path
    let path = db.get_user_config("voice_model_path")
        .await
        .map_err(|e| e.to_string())?
        .map(|e| e.value);

    let Some(path_str) = path else {
        return Err("No voice model path configured. Go to Settings -> Voice first.".to_string());
    };

    let voice_path = std::path::PathBuf::from(&path_str);
    if !voice_path.exists() {
        return Err(format!("Voice model path does not exist: {}", path_str));
    }

    // Re-scan and reinitialize
    let discovery_result = engine.voice_discovery
        .set_model_directory(&voice_path)
        .await
        .map_err(|e| e.to_string())?;

    // Find first ready whisper model
    if let Some(whisper) = discovery_result.whisper_models.iter().find(|m| m.ready) {
        println!("Voice reload: found ready Whisper at {:?}", whisper.path);
    }

    let model_status = engine.voice.model_status();
    Ok(VoiceStatus {
        stt_ready: model_status.whisper_ready,
        tts_ready: model_status.kokoro_ready,
        stt_missing: model_status.whisper_missing.clone(),
        tts_missing: model_status.kokoro_missing.clone(),
    })
}
