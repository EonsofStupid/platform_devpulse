//! First-run intents — thin wrappers over the engine's onboarding workflow
//! (`devpulse_engine::platform::onboarding`), which checks every intent,
//! writes to Turso and publishes the `onboarding` state. No logic here.

use std::sync::Arc;

use crate::state::PlatformState;
use devpulse_engine::platform::onboarding::{Onboarding, OnboardingState};
use tauri::State;

fn workflow(state: &PlatformState) -> Result<Arc<Onboarding>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_owned())?;
    platform.onboarding().cloned().ok_or_else(|| {
        "First run is unavailable: the user database is not open (see the boot log)".to_owned()
    })
}

/// The current first-run state (the same value the `onboarding` signal carries).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_state(state: State<'_, PlatformState>) -> Result<OnboardingState, String> {
    workflow(&state)?
        .state()
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Continue to the next stage (after the last one, first run is finished).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_next(state: State<'_, PlatformState>) -> Result<OnboardingState, String> {
    workflow(&state)?.next().await.map_err(|e| format!("{e:#}"))
}

/// Go back one stage.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_back(state: State<'_, PlatformState>) -> Result<OnboardingState, String> {
    workflow(&state)?.back().await.map_err(|e| format!("{e:#}"))
}

/// "Set up later": leave first run; it can be reopened at any time.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_later(state: State<'_, PlatformState>) -> Result<OnboardingState, String> {
    workflow(&state)?
        .later()
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Reopen first run where you left it.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_reopen(state: State<'_, PlatformState>) -> Result<OnboardingState, String> {
    workflow(&state)?
        .reopen()
        .await
        .map_err(|e| format!("{e:#}"))
}
