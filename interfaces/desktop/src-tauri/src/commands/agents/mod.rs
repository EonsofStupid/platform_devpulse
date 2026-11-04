//! Agent threads — thin wrappers over the engine's agents service
//! (`devpulse_engine::platform::agents`): start a thread with one of your
//! agents, send a prompt (its events stream as [`crate::events::AgentStreamed`]),
//! stop a turn, answer a permission request, end the conversation. No logic
//! here.

use std::sync::Arc;

use devpulse_engine::platform::agents::{AgentThread, Agents, ProviderId};
use tauri::State;
use tauri_specta::Event;

use crate::state::PlatformState;

fn agents(state: &PlatformState) -> Result<Arc<Agents>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_owned())?;
    platform
        .agents()
        .cloned()
        .ok_or_else(|| "The user database is not open (see the boot log)".to_owned())
}

/// The agent threads of a project, latest first.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn agent_threads(
    project_id: String,
    state: State<'_, PlatformState>,
) -> Result<Vec<AgentThread>, String> {
    agents(&state)?
        .threads(&project_id)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Whether a conversation (a thread or an endpoint chat) gets your notes.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn conversation_notes(
    session_id: String,
    state: State<'_, PlatformState>,
) -> Result<bool, String> {
    Ok(agents(&state)?.notes(&session_id).await)
}

/// Say whether a conversation gets your notes.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn conversation_set_notes(
    session_id: String,
    notes: bool,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    agents(&state)?
        .set_notes(&session_id, notes)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Start a thread with one of your installed agents.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn agent_thread_start(
    project_id: String,
    provider_id: ProviderId,
    state: State<'_, PlatformState>,
) -> Result<AgentThread, String> {
    agents(&state)?
        .start_thread(&project_id, provider_id)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Send a prompt on a thread. Returns once the agent has the prompt; the
/// turn's events follow as `AgentStreamed`.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn agent_prompt(
    app: tauri::AppHandle,
    session_id: String,
    text: String,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    let mut events = agents(&state)?
        .prompt(&session_id, &text)
        .await
        .map_err(|e| format!("{e:#}"))?;
    devpulse_telemetry::spawn(async move {
        while let Some(event) = events.recv().await {
            let streamed = crate::events::AgentStreamed {
                session_id: session_id.clone(),
                event,
            };
            if let Err(e) = streamed.emit(&app) {
                tracing::warn!(target: "agents", error = %e, "a turn event did not reach the window");
            }
        }
    });
    Ok(())
}

/// Stop a thread's running turn.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn agent_cancel(
    session_id: String,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    agents(&state)?.cancel(&session_id).await;
    Ok(())
}

/// Answer a permission request (`choice` is one of its choice ids; none
/// refuses). Returns `false` when the request is no longer waiting.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn agent_answer(
    session_id: String,
    request: String,
    choice: Option<String>,
    state: State<'_, PlatformState>,
) -> Result<bool, String> {
    Ok(agents(&state)?.answer(&session_id, &request, choice).await)
}

/// End a thread's live conversation (its history stays).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn agent_close(
    session_id: String,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    agents(&state)?.close(&session_id).await;
    Ok(())
}
