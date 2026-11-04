//! Speech endpoints: list, read, choose and stop using the saved connection and
//! model that speech-to-text and text-to-speech run through. Thin wrappers over
//! the engine's facade (`devpulse_engine::platform::providers`). No logic here.

use crate::state::PlatformState;
use devpulse_engine::platform::providers::{SpeechBinding, SpeechEndpoints, SpeechRole};
use tauri::State;

fn platform(
    state: &PlatformState,
) -> Result<std::sync::Arc<devpulse_engine::platform::Platform>, String> {
    state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_owned())
}

/// Every speech binding and the adapters one may use.
///
/// # Errors
/// Returns storage errors or an unavailable user database.
#[tauri::command]
#[specta::specta]
pub async fn voice_endpoints_list(
    state: State<'_, PlatformState>,
) -> Result<SpeechEndpoints, String> {
    platform(&state)?
        .providers()
        .speech_endpoints()
        .await
        .map_err(|e| format!("{e:#}"))
}

/// One role's binding; `null` when nothing is chosen.
///
/// # Errors
/// Returns storage errors.
#[tauri::command]
#[specta::specta]
pub async fn voice_endpoint_get(
    role: SpeechRole,
    state: State<'_, PlatformState>,
) -> Result<Option<SpeechBinding>, String> {
    platform(&state)?
        .providers()
        .speech_endpoint(role)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Choose the saved connection, at this revision, and model one role uses.
///
/// # Errors
/// Refuses a removed or edited connection, an adapter without audio, an empty
/// model and a missing key; the prior choice stays in place.
#[tauri::command]
#[specta::specta]
pub async fn voice_endpoint_set(
    role: SpeechRole,
    connection_id: String,
    revision: i64,
    model: String,
    state: State<'_, PlatformState>,
) -> Result<SpeechEndpoints, String> {
    platform(&state)?
        .providers()
        .set_speech_endpoint(role, &connection_id, revision, &model)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Stop using a connection for one role.
///
/// # Errors
/// Returns storage errors or an unavailable user database.
#[tauri::command]
#[specta::specta]
pub async fn voice_endpoint_clear(
    role: SpeechRole,
    state: State<'_, PlatformState>,
) -> Result<SpeechEndpoints, String> {
    platform(&state)?
        .providers()
        .clear_speech_endpoint(role)
        .await
        .map_err(|e| format!("{e:#}"))
}
