//! Your AI providers — thin wrappers over the engine's providers service
//! (`devpulse_engine::platform::providers`), which checks every provider and
//! runs the vendor's own update and sign-in commands when you click, then
//! publishes the `providers` state. No logic here.

use crate::state::PlatformState;
use devpulse_engine::platform::providers::{ConnectionOption, SaveConnection, connection_options};
use devpulse_engine::platform::providers::{ProviderAction, ProviderId, ProvidersState};
use tauri::State;

/// The existing kernel registry's HTTP adapter options and editable URL suggestions.
#[tauri::command]
#[specta::specta]
pub fn provider_connection_options() -> Vec<ConnectionOption> {
    connection_options()
}

/// Save a connection; the credential stays backend-only and is never logged.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn provider_connection_save(
    request: SaveConnection,
    state: State<'_, PlatformState>,
) -> Result<ProvidersState, String> {
    platform(&state)?
        .providers()
        .save_connection(request)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Check the saved endpoint's model list using its own credential.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn provider_connection_check(
    id: String,
    state: State<'_, PlatformState>,
) -> Result<ProvidersState, String> {
    platform(&state)?
        .providers()
        .check_connection(&id)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Forget the selected saved connection and its private credential.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn provider_connection_remove(
    id: String,
    state: State<'_, PlatformState>,
) -> Result<ProvidersState, String> {
    platform(&state)?
        .providers()
        .remove_connection(&id)
        .await
        .map_err(|e| format!("{e:#}"))
}

fn platform(
    state: &PlatformState,
) -> Result<std::sync::Arc<devpulse_engine::platform::Platform>, String> {
    state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_owned())
}

/// The current providers state (the same value the `providers` signal carries).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn providers_state(state: State<'_, PlatformState>) -> Result<ProvidersState, String> {
    Ok(platform(&state)?.providers().state().await)
}

/// Look at every provider again.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn providers_check(state: State<'_, PlatformState>) -> Result<ProvidersState, String> {
    platform(&state)?
        .providers()
        .check()
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Ask one installed provider again whether you are signed in (its status
/// command only), while you sign in through the vendor's own tool.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn providers_check_signed_in(
    provider_id: ProviderId,
    state: State<'_, PlatformState>,
) -> Result<ProvidersState, String> {
    platform(&state)?
        .providers()
        .recheck_signed_in(provider_id)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Run one action (update, or open the vendor's sign-in) on an installed provider.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn providers_run_action(
    provider_id: ProviderId,
    action: ProviderAction,
    state: State<'_, PlatformState>,
) -> Result<ProvidersState, String> {
    platform(&state)?
        .providers()
        .run(provider_id, action)
        .await
        .map_err(|e| format!("{e:#}"))
}
