//! Scoped Chat history, coordinated by the engine.
use super::ChatMessage;
use crate::state::PlatformState;
use tauri::State;

/// Read the selected conversation. No selection means a new, empty chat.
/// # Errors
/// Returns platform, scope or persistence errors from the engine.
#[tauri::command]
#[specta::specta]
pub async fn load_recent(
    state: State<'_, PlatformState>,
    project_id: String,
    session_id: Option<String>,
) -> Result<Vec<ChatMessage>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    platform
        .chat()
        .ok_or("Chat is unavailable")?
        .recent(&project_id, session_id.as_deref())
        .await
        .map_err(|e| format!("{e:#}"))
}
