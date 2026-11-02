//! First-run intents — thin wrappers over the engine's onboarding workflow
//! (`devpulse_engine::platform::onboarding`), which checks every intent,
//! writes to Turso and publishes the `onboarding` state. No logic here.
//!
//! Every command returns [`CommandError`] (plan 0001 A4). A workflow refusal
//! (first run is not open, a stage still needs something) arrives as
//! `internal` carrying the engine's words; typed refusals with copy are a
//! later step (plan 0001, "Found while reading").

use std::sync::Arc;

use crate::commands::_util::CommandError;
use crate::state::PlatformState;
use devpulse_engine::platform::Platform;
use devpulse_engine::platform::forms::{FormOutcome, FormView};
use devpulse_engine::platform::onboarding::scan::{self, FoundRepo};
use devpulse_engine::platform::onboarding::{Onboarding, OnboardingState, you};
use devpulse_engine::platform::projects::RegisterResult;
use tauri::State;

/// The platform, once boot has published it. Before that nothing was asked
/// of the engine, so it is a pre-flight failure (`not-configured`).
fn platform(state: &PlatformState) -> Result<Arc<Platform>, CommandError> {
    state
        .platform
        .load_full()
        .ok_or_else(|| CommandError::not_configured("Platform is still booting"))
}

fn workflow(state: &PlatformState) -> Result<Arc<Onboarding>, CommandError> {
    platform(state)?.onboarding().cloned().ok_or_else(|| {
        CommandError::internal(
            "First run is unavailable: the user database is not open (see the boot log)",
        )
    })
}

/// The current first-run state (the same value the `onboarding` signal carries).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_state(
    state: State<'_, PlatformState>,
) -> Result<OnboardingState, CommandError> {
    Ok(workflow(&state)?.state().await?)
}

/// Continue to the next stage (after the last one, first run is finished).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_next(
    state: State<'_, PlatformState>,
) -> Result<OnboardingState, CommandError> {
    Ok(workflow(&state)?.next().await?)
}

/// Go back one stage.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_back(
    state: State<'_, PlatformState>,
) -> Result<OnboardingState, CommandError> {
    Ok(workflow(&state)?.back().await?)
}

/// "Set up later": leave first run; it can be reopened at any time.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_later(
    state: State<'_, PlatformState>,
) -> Result<OnboardingState, CommandError> {
    Ok(workflow(&state)?.later().await?)
}

/// Reopen first run where you left it.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_reopen(
    state: State<'_, PlatformState>,
) -> Result<OnboardingState, CommandError> {
    Ok(workflow(&state)?.reopen().await?)
}

/// The "You" form: its schema, your stored values, and suggestions found on
/// this machine (git identity, folders that hold repositories).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_you_form(
    state: State<'_, PlatformState>,
) -> Result<FormView, CommandError> {
    let platform = platform(&state)?;
    let db = crate::commands::devpulse::profile::user_db(&state)?;
    Ok(you::view(db.as_ref(), platform.data_dir()).await?)
}

/// Save the "You" form. Refused fields come back in the outcome, with
/// nothing written.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn onboarding_you_submit(
    values: serde_json::Value,
    state: State<'_, PlatformState>,
) -> Result<FormOutcome, CommandError> {
    let onboarding = workflow(&state)?;
    let db = crate::commands::devpulse::profile::user_db(&state)?;
    Ok(you::submit(db.as_ref(), &onboarding, &values).await?)
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
) -> Result<Option<Vec<FoundRepo>>, CommandError> {
    let folder = folder.trim().to_owned();
    if !std::path::Path::new(&folder).is_dir() {
        return Ok(None);
    }
    // Live projects only: a folder you removed can be ticked and added again.
    let registered = crate::commands::projects::service(&state)
        .map_err(CommandError::internal)?
        .registered_roots()
        .await?;
    let found = devpulse_telemetry::spawn_blocking(move || {
        scan::scan(std::path::Path::new(&folder), &registered)
    })
    .await
    .map_err(|e| CommandError::internal(format!("scan stopped: {e}")))??;
    Ok(Some(found))
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
) -> Result<Vec<RegisterResult>, CommandError> {
    Ok(crate::commands::projects::service(&state)
        .map_err(CommandError::internal)?
        .register(paths)
        .await)
}
