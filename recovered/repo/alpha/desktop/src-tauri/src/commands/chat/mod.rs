//! Chat commands - conversation with assistant
//!
//! Commands:
//! - chat: Send message, get response

use crate::AppState;
use tauri::State;

#[derive(serde::Serialize)]
pub struct ChatResponse {
    pub text: String,
}

#[tauri::command]
pub async fn chat(
    message: String,
    _state: State<'_, AppState>,
) -> Result<ChatResponse, String> {
    // Echo for now - will wire to engine later
    Ok(ChatResponse {
        text: format!("Echo: {}", message),
    })
}
