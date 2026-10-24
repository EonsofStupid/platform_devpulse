//! Your AI providers — thin wrappers over the engine's providers service
//! (`devpulse_engine::platform::providers`), which checks every provider and
//! runs the vendor's own update and sign-in commands when you click, then
//! publishes the `providers` state. No logic here.

use crate::state::PlatformState;
use devpulse_engine::platform::providers::{ProviderAction, ProviderId, ProvidersState};
use tauri::State;

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
