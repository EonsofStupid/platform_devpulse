//! Request-scoped endpoint Chat IPC; execution and persistence live below Tauri.
use super::ChatMessage;
use crate::state::PlatformState;
use devpulse_engine::platform::chat::TextTarget;
use tauri::{State, ipc::Channel};

/// Start a conversation bound to the selected saved endpoint revision and model.
/// # Errors
/// Returns engine validation and persistence errors.
#[tauri::command]
#[specta::specta]
pub async fn chat_endpoint_start(
    project_id: String,
    connection_id: String,
    revision: i64,
    model: String,
    state: State<'_, PlatformState>,
) -> Result<String, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    platform
        .chat()
        .ok_or("Chat is unavailable")?
        .start_endpoint(&project_id, &connection_id, revision, &model)
        .await
        .map_err(|e| format!("{e:#}"))
}
/// Read the selected conversation's routing identity without sending any network request.
/// # Errors
/// Returns engine scope and persistence errors.
#[tauri::command]
#[specta::specta]
pub async fn chat_endpoint_target(
    project_id: String,
    session_id: Option<String>,
    state: State<'_, PlatformState>,
) -> Result<Option<TextTarget>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    platform
        .chat()
        .ok_or("Chat is unavailable")?
        .endpoint_target(&project_id, session_id.as_deref())
        .await
        .map_err(|e| format!("{e:#}"))
}
/// Run one endpoint turn with a private channel for this request's text deltas.
/// # Errors
/// Returns scope, endpoint, cancellation and persistence errors.
#[tauri::command]
#[specta::specta]
pub async fn chat_endpoint_prompt(
    project_id: String,
    session_id: String,
    request_id: String,
    content: String,
    on_token: Channel<String>,
    state: State<'_, PlatformState>,
) -> Result<ChatMessage, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    platform
        .chat()
        .ok_or("Chat is unavailable")?
        .prompt_endpoint(&project_id, &session_id, &request_id, &content, |delta| {
            on_token.send(delta.to_owned()).map_err(anyhow::Error::from)
        })
        .await
        .map_err(|e| format!("{e:#}"))
}
/// Stop only the identified endpoint request in its owning conversation.
/// # Errors
/// Returns engine scope and coordination errors.
#[tauri::command]
#[specta::specta]
pub async fn chat_endpoint_cancel(
    project_id: String,
    session_id: String,
    request_id: String,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    platform
        .chat()
        .ok_or("Chat is unavailable")?
        .cancel_endpoint(&project_id, &session_id, &request_id)
        .await
        .map_err(|e| format!("{e:#}"))
}
