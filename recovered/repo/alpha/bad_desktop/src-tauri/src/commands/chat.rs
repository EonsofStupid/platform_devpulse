//! Chat commands - conversation with assistant
//!
//! Commands:
//! - chat: Send message, get response
//! - get_chat_history: Retrieve conversation history

use crate::state::AppState;
use crate::types::{ChatResult, HistoryMessage};
use tauri::State;

/// Chat with the assistant
#[tauri::command]
pub async fn chat(message: String, state: State<'_, AppState>) -> Result<ChatResult, String> {
    let engine = state.engine().await?;
    let session_id = state.get_or_create_session(engine).await?;
    let response = engine
        .chat
        .send(&message, &session_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ChatResult {
        message: response.message,
        tokens_used: response.tokens_used,
        is_stub: response.is_stub,
    })
}

/// Get chat history for current session
#[tauri::command]
pub async fn get_chat_history(
    limit: Option<u32>,
    state: State<'_, AppState>,
) -> Result<Vec<HistoryMessage>, String> {
    let engine = state.engine().await?;
    let session_id = state.get_or_create_session(engine).await?;

    let messages = engine
        .get_chat_history(&session_id, limit.unwrap_or(100))
        .await
        .map_err(|e| e.to_string())?;

    Ok(messages
        .into_iter()
        .map(|m| HistoryMessage {
            role: match m.role {
                engine::facade::Role::User => "user".to_string(),
                engine::facade::Role::Assistant => "assistant".to_string(),
                engine::facade::Role::System => "system".to_string(),
            },
            content: m.content,
            timestamp: m.timestamp,
        })
        .collect())
}
