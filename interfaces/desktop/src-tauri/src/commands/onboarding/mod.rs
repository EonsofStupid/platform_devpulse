//! First-run intents — thin wrappers over the engine's onboarding workflow
//! (`devpulse_engine::platform::onboarding`), which checks every intent,
//! writes to Turso and publishes the `onboarding` state. No logic here.

use std::sync::Arc;

use crate::state::PlatformState;
use devpulse_engine::platform::forms::{FormOutcome, FormView};
use devpulse_engine::platform::onboarding::scan::{self, FoundRepo};
use devpulse_engine::platform::onboarding::{you, Onboarding, OnboardingState};
use devpulse_engine::platform::projects::RegisterResult;
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

fn platform_parts(
    state: &PlatformState,
) -> Result<(Arc<devpulse_engine::platform::Platform>, Arc<Onboarding>), String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_owned())?;
    let onboarding = workflow(state)?;
    Ok((platform, onboarding))
}

/// The "You" form: its schema, your stored values, and suggestions found on
/// this machine (git identity, folders that hold repositories).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_you_form(state: State<'_, PlatformState>) -> Result<FormView, String> {
    let (platform, _) = platform_parts(&state)?;
    let db = crate::commands::devpulse::profile::user_db(&state).map_err(|e| format!("{e:#}"))?;
    you::view(db.as_ref(), platform.data_dir())
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Save the "You" form. Refused fields come back in the outcome, with
/// nothing written.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_you_submit(
    values: serde_json::Value,
    state: State<'_, PlatformState>,
) -> Result<FormOutcome, String> {
    let (_, onboarding) = platform_parts(&state)?;
    let db = crate::commands::devpulse::profile::user_db(&state).map_err(|e| format!("{e:#}"))?;
    you::submit(db.as_ref(), &onboarding, &values)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// The repositories in a folder, with their languages; `DevPulse` itself
/// first; the ones already registered marked. `None` when the folder does
/// not exist (an answer, not a failure).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_scan_projects(
    folder: String,
    state: State<'_, PlatformState>,
) -> Result<Option<Vec<FoundRepo>>, String> {
    let folder = folder.trim().to_owned();
    if !std::path::Path::new(&folder).is_dir() {
        return Ok(None);
    }
    // Live projects only: a folder you removed can be ticked and added again.
    let registered = crate::commands::projects::service(&state)?
        .registered_roots()
        .await
        .map_err(|e| format!("{e:#}"))?;
    devpulse_telemetry::spawn_blocking(move || {
        scan::scan(std::path::Path::new(&folder), &registered)
    })
    .await
    .map_err(|e| format!("scan stopped: {e}"))?
    .map(Some)
    .map_err(|e| format!("{e:#}"))
}

/// Register the repositories you ticked as projects, in place (nothing is
/// written inside them). Each folder gets its own outcome; a folder you
/// removed earlier comes back. When no project is active yet, the first one
/// becomes active.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_register_projects(
    paths: Vec<String>,
    state: State<'_, PlatformState>,
) -> Result<Vec<RegisterResult>, String> {
    Ok(crate::commands::projects::service(&state)?
        .register(paths)
        .await)
}
