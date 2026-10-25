// desktop/src-tauri/src/commands/mod.rs

//! Tauri commands - thin wrappers that call Engine
//!
//! NO local types - use engine:: types
//! NO stubs - call real engine methods
//! Desktop → Engine only

use crate::AppState;
use tauri::{AppHandle, Manager, State};

// Re-export engine types for Tauri serialization
use engine::{
    AdapterInfo, ChatResponse, EngineStatus, Project, Session,
};
use shared::config::{Persona, PersonaSummary};

// ============================================================================
// Core
// ============================================================================

#[tauri::command]
pub async fn chat(
    message: String,
    session_id: String,
    state: State<'_, AppState>,
) -> Result<ChatResponse, String> {
    let engine = state.engine().await?;
    let sid = shared::types::ids::SessionId::from_str(&session_id)
        .map_err(|e| format!("Invalid session ID: {}", e))?;
    engine.chat_with_persona(&message, &sid).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_status(state: State<'_, AppState>) -> Result<EngineStatus, String> {
    let engine = state.engine().await?;
    Ok(engine.status().await)
}

// ============================================================================
// Adapters
// ============================================================================

#[tauri::command]
pub async fn list_adapters(state: State<'_, AppState>) -> Result<Vec<AdapterInfo>, String> {
    let engine = state.engine().await?;
    Ok(engine.adapters.list())
}

#[tauri::command]
pub async fn set_adapter(adapter: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine.set_active_adapter_str(&adapter).await
        .map_err(|e| e.to_string())
}

// ============================================================================
// Models
// ============================================================================

#[tauri::command]
pub async fn list_models(state: State<'_, AppState>) -> Result<Vec<engine::ModelInfo>, String> {
    let engine = state.engine().await?;
    Ok(engine.models.list())
}

#[tauri::command]
pub async fn set_model(model_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine.models.set_active(&model_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn scan_models(state: State<'_, AppState>) -> Result<Vec<engine::DiscoveredModel>, String> {
    let engine = state.engine().await?;
    engine.discovery.scan().await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn scan_ollama(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let engine = state.engine().await?;
    engine.discovery.scan_ollama().await
        .map_err(|e| e.to_string())
}

// ============================================================================
// Personas
// ============================================================================

#[tauri::command]
pub async fn get_personas(state: State<'_, AppState>) -> Result<Vec<PersonaSummary>, String> {
    let engine = state.engine().await?;
    engine.persona.list_summaries().await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_persona(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine.persona.set_active(&id).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_persona(
    name: String,
    instructions: String,
    state: State<'_, AppState>,
) -> Result<Persona, String> {
    let engine = state.engine().await?;
    engine.persona.create(&name, &instructions).await
        .map_err(|e| e.to_string())
}

// ============================================================================
// Projects
// ============================================================================

#[tauri::command]
pub async fn list_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let engine = state.engine().await?;
    Ok(engine.projects.list().await)
}

#[tauri::command]
pub async fn add_project(path: String, state: State<'_, AppState>) -> Result<Project, String> {
    let engine = state.engine().await?;
    engine.projects.add(&path).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_active_project(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine.projects.select(&id).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_project(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine.projects.remove(&id).await
        .map_err(|e| e.to_string())
}

// ============================================================================
// Sessions
// ============================================================================

#[tauri::command]
pub async fn list_sessions(state: State<'_, AppState>) -> Result<Vec<Session>, String> {
    let engine = state.engine().await?;
    Ok(engine.sessions.list(None).await)
}

#[tauri::command]
pub async fn create_session(
    project_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<Session, String> {
    let engine = state.engine().await?;
    engine.sessions.create(project_id).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_session(id: String, state: State<'_, AppState>) -> Result<Option<Session>, String> {
    let engine = state.engine().await?;
    Ok(engine.sessions.get(&id).await)
}

#[tauri::command]
pub async fn delete_session(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine.sessions.delete(&id).await
        .map_err(|e| e.to_string())
}

// ============================================================================
// Voice
// ============================================================================

#[tauri::command]
pub async fn voice_transcribe(
    _audio_path: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let engine = state.engine().await?;
    if !engine.voice.is_ready() {
        return Err("Voice not ready".to_string());
    }
    // TODO: Implement when voice STT is wired
    Err("Voice transcription not yet implemented".to_string())
}

#[tauri::command]
pub async fn voice_speak(
    text: String,
    state: State<'_, AppState>,
) -> Result<Vec<u8>, String> {
    let engine = state.engine().await?;
    engine.voice.speak(&text)
        .map(|result| result.audio)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn voice_stop(state: State<'_, AppState>) -> Result<(), String> {
    let _engine = state.engine().await?;
    // TODO: Implement voice stop
    Ok(())
}

// ============================================================================
// Window
// ============================================================================

#[tauri::command]
pub async fn open_chat_window(app: AppHandle) -> Result<(), String> {
    // Check if chat window exists
    if let Some(window) = app.get_webview_window("chat") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    } else {
        // Create new chat window
        tauri::WebviewWindowBuilder::new(
            &app,
            "chat",
            tauri::WebviewUrl::App("/chat".into()),
        )
        .title("DevPulse Chat")
        .inner_size(400.0, 600.0)
        .build()
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn open_app_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn close_window(label: String, app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn focus_window(label: String, app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ============================================================================
// Dev-only (stripped from release builds)
// ============================================================================

#[cfg(feature = "dev-tools")]
#[tauri::command]
pub async fn dev_list_internal_models(
    state: State<'_, AppState>,
) -> Result<Vec<engine::ModelInfo>, String> {
    let engine = state.engine().await?;
    Ok(engine.models.list_internal())
}

#[cfg(feature = "dev-tools")]
#[tauri::command]
pub async fn dev_system_diagnostics(
    state: State<'_, AppState>,
) -> Result<engine::SystemStatusSnapshot, String> {
    let engine = state.engine().await?;
    Ok(engine.system_status.snapshot())
}
