//! Session commands - chat session management
//!
//! Commands:
//! - list_sessions: Get all sessions
//! - create_session: Create new session
//! - get_session: Get session by ID
//! - delete_session: Delete session

use crate::AppState;
use tauri::State;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SessionInfo {
    pub id: String,
    pub title: Option<String>,
    pub created_at: String,
    pub message_count: u32,
}

#[tauri::command]
pub async fn list_sessions(_state: State<'_, AppState>) -> Result<Vec<SessionInfo>, String> {
    // Stub - will wire to engine.sessions.list() later
    Ok(vec![])
}

#[tauri::command]
pub async fn create_session(
    title: Option<String>,
    _state: State<'_, AppState>,
) -> Result<SessionInfo, String> {
    // Stub - will wire to engine.sessions.create() later
    Ok(SessionInfo {
        id: format!("sess_{}", chrono::Utc::now().timestamp()),
        title,
        created_at: chrono::Utc::now().to_rfc3339(),
        message_count: 0,
    })
}

#[tauri::command]
pub async fn get_session(
    session_id: String,
    _state: State<'_, AppState>,
) -> Result<SessionInfo, String> {
    // Stub - will wire to engine.sessions.get() later
    Ok(SessionInfo {
        id: session_id,
        title: None,
        created_at: chrono::Utc::now().to_rfc3339(),
        message_count: 0,
    })
}

#[tauri::command]
pub async fn delete_session(
    session_id: String,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    // Stub - will wire to engine.sessions.delete() later
    println!("Deleting session: {}", session_id);
    Ok(())
}
