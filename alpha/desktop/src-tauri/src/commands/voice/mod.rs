//! Voice commands - speech-to-text and text-to-speech
//!
//! Commands:
//! - voice_transcribe: Convert audio to text
//! - voice_speak: Convert text to audio
//! - voice_stop: Stop current audio

use crate::AppState;
use tauri::State;

#[derive(serde::Serialize)]
pub struct TranscriptionResult {
    pub text: String,
    pub confidence: f32,
}

#[derive(serde::Serialize)]
pub struct SpeakResult {
    pub audio_path: Option<String>,
    pub duration_ms: u32,
}

#[tauri::command]
pub async fn voice_transcribe(
    audio_data: Vec<u8>,
    _state: State<'_, AppState>,
) -> Result<TranscriptionResult, String> {
    // Stub - will wire to engine.voice.transcribe() later
    let _ = audio_data;
    Ok(TranscriptionResult {
        text: "Transcription not yet implemented".to_string(),
        confidence: 0.0,
    })
}

#[tauri::command]
pub async fn voice_speak(
    text: String,
    _state: State<'_, AppState>,
) -> Result<SpeakResult, String> {
    // Stub - will wire to engine.voice.speak() later
    let _ = text;
    Ok(SpeakResult {
        audio_path: None,
        duration_ms: 0,
    })
}

#[tauri::command]
pub async fn voice_stop(_state: State<'_, AppState>) -> Result<(), String> {
    // Stub - will wire to engine.voice.stop() later
    Ok(())
}
