//! Rooms — thin wrappers over the engine's rooms service
//! (`devpulse_engine::platform::rooms`): your library, open a room with your
//! agents seated, ask it (its events stream as
//! [`crate::events::RoomStreamed`]), stop it, answer a permission request,
//! end its conversations. No logic here.

use std::sync::Arc;

use devpulse_engine::platform::rooms::{Assignment, Library, RoomThread, Rooms};
use tauri::State;
use tauri_specta::Event;

use crate::state::PlatformState;

fn rooms(state: &PlatformState) -> Result<Arc<Rooms>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_owned())?;
    platform
        .rooms()
        .cloned()
        .ok_or_else(|| "The user database is not open (see the boot log)".to_owned())
}

/// Your library: roles, rooms and personas, and the files that did not
/// pass.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn room_library(state: State<'_, PlatformState>) -> Result<Library, String> {
    Ok(rooms(&state)?.library())
}

/// The rooms of a project, latest first.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn room_threads(
    project_id: String,
    state: State<'_, PlatformState>,
) -> Result<Vec<RoomThread>, String> {
    rooms(&state)?
        .threads(&project_id)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Open a room of your library with your agents seated.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn room_start(
    project_id: String,
    room_id: String,
    seating: Vec<Assignment>,
    state: State<'_, PlatformState>,
) -> Result<RoomThread, String> {
    rooms(&state)?
        .start(&project_id, &room_id, seating)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Ask a room. Returns once the room has the question; its events follow as
/// `RoomStreamed`.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn room_ask(
    app: tauri::AppHandle,
    session_id: String,
    text: String,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    let mut events = rooms(&state)?
        .ask(&session_id, &text)
        .await
        .map_err(|e| format!("{e:#}"))?;
    devpulse_telemetry::spawn(async move {
        while let Some(event) = events.recv().await {
            let streamed = crate::events::RoomStreamed {
                session_id: session_id.clone(),
                event,
            };
            if let Err(e) = streamed.emit(&app) {
                tracing::warn!(target: "rooms", error = %e, "a room event did not reach the window");
            }
        }
    });
    Ok(())
}

/// Stop a room that is answering.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn room_cancel(
    session_id: String,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    rooms(&state)?.cancel(&session_id).await;
    Ok(())
}

/// Answer a permission request of a place that may use tools (`choice` is
/// one of its choice ids; none refuses). Returns `false` when it is no
/// longer waiting.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn room_answer(
    session_id: String,
    place: String,
    request: String,
    choice: Option<String>,
    state: State<'_, PlatformState>,
) -> Result<bool, String> {
    Ok(rooms(&state)?
        .answer(&session_id, &place, &request, choice)
        .await)
}

/// End a room's live conversations (its history stays).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn room_close(session_id: String, state: State<'_, PlatformState>) -> Result<(), String> {
    rooms(&state)?.close(&session_id).await;
    Ok(())
}
