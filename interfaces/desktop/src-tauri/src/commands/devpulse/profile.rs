//! Profile commands — thin wrappers over the engine's profile
//! (`devpulse_engine::platform::profile`), which owns the `profiles` and
//! `preferences` rows in the user Turso database.

use std::sync::Arc;

use crate::state::PlatformState;
use anyhow::{Context, Result};
use devpulse_engine::platform::profile::{
    self,
    preferences::{self, UpdateUserPreferencesInput, UserPreferences},
    UserProfile,
};
use devpulse_engine::platform::TursoAdapter;
use tauri::State;

/// The user database adapter.
pub(crate) fn user_db(state: &PlatformState) -> Result<Arc<TursoAdapter>> {
    let platform = state
        .platform
        .load_full()
        .context("platform is still booting")?;
    let svc = platform
        .user_relational()
        .context("user relational service not available")?;
    Ok(Arc::clone(svc.adapter()))
}

/// Fetch your profile. Creates it the first time.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn fetch_user_profile(state: State<'_, PlatformState>) -> Result<UserProfile, String> {
    let db = user_db(&state).map_err(|e| format!("{e:#}"))?;
    profile::ensure(db.as_ref())
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Change your name and email. `None` leaves a field; an empty string clears it.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn update_user_profile(
    display_name: Option<String>,
    email: Option<String>,
    state: State<'_, PlatformState>,
) -> Result<UserProfile, String> {
    let db = user_db(&state).map_err(|e| format!("{e:#}"))?;
    profile::update_identity(db.as_ref(), display_name, email)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Fetch your preferences. Creates them with the defaults the first time.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn fetch_user_preferences(
    state: State<'_, PlatformState>,
) -> Result<UserPreferences, String> {
    let db = user_db(&state).map_err(|e| format!("{e:#}"))?;
    let me = profile::ensure(db.as_ref())
        .await
        .map_err(|e| format!("{e:#}"))?;
    preferences::ensure(db.as_ref(), &me.id)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Change your preferences. Only the fields given are written.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn update_user_preferences(
    patch: UpdateUserPreferencesInput,
    state: State<'_, PlatformState>,
) -> Result<UserPreferences, String> {
    let db = user_db(&state).map_err(|e| format!("{e:#}"))?;
    let me = profile::ensure(db.as_ref())
        .await
        .map_err(|e| format!("{e:#}"))?;
    preferences::update(db.as_ref(), &me.id, patch)
        .await
        .map_err(|e| format!("{e:#}"))
}
