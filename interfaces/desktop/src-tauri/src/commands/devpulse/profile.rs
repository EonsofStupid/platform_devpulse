//! Profile commands — user identity and preferences CRUD against `user.db`.

use crate::state::PlatformState;
use devpulse_engine::platform::{LibSqlAdapter, SqlAdapter, SqlValue};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;

/// User profile row from the `profiles` table.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub id: String,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub hardware_profile: String,
    pub onboarding_complete: bool,
    pub expertise_level: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub last_active_at: Option<i64>,
}

/// User preferences row from the `preferences` table.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UserPreferences {
    pub id: String,
    pub user_id: String,
    pub theme: String,
    pub context_mode: String,
    pub show_thinking: bool,
    pub preferred_languages: Option<String>,
    pub tab_size: i64,
    pub use_semicolons: bool,
    pub default_temperature: f64,
    pub verbosity: String,
    pub allow_telemetry: bool,
    pub screen_capture_enabled: bool,
}

// ── Internal helpers (take adapter, no State dependency) ────────

fn row_to_profile(row: &[SqlValue]) -> UserProfile {
    UserProfile {
        id: row.get(0).and_then(|v| v.as_text()).unwrap_or("").to_string(),
        display_name: row.get(1).and_then(|v| v.as_text()).map(String::from),
        email: row.get(2).and_then(|v| v.as_text()).map(String::from),
        hardware_profile: row.get(3).and_then(|v| v.as_text()).unwrap_or("32g_engineer").to_string(),
        onboarding_complete: row.get(4).and_then(SqlValue::as_integer).unwrap_or(0) != 0,
        expertise_level: row.get(5).and_then(SqlValue::as_integer).unwrap_or(1),
        created_at: row.get(6).and_then(SqlValue::as_integer).unwrap_or(0),
        updated_at: row.get(7).and_then(SqlValue::as_integer).unwrap_or(0),
        last_active_at: row.get(8).and_then(SqlValue::as_integer),
    }
}

fn row_to_prefs(row: &[SqlValue]) -> UserPreferences {
    UserPreferences {
        id: row.get(0).and_then(|v| v.as_text()).unwrap_or("").to_string(),
        user_id: row.get(1).and_then(|v| v.as_text()).unwrap_or("").to_string(),
        theme: row.get(2).and_then(|v| v.as_text()).unwrap_or("dark").to_string(),
        context_mode: row.get(3).and_then(|v| v.as_text()).unwrap_or("normal").to_string(),
        show_thinking: row.get(4).and_then(SqlValue::as_integer).unwrap_or(0) != 0,
        preferred_languages: row.get(5).and_then(|v| v.as_text()).map(String::from),
        tab_size: row.get(6).and_then(SqlValue::as_integer).unwrap_or(4),
        use_semicolons: row.get(7).and_then(SqlValue::as_integer).unwrap_or(1) != 0,
        default_temperature: row.get(8).and_then(SqlValue::as_real).unwrap_or(0.7),
        verbosity: row.get(9).and_then(|v| v.as_text()).unwrap_or("balanced").to_string(),
        allow_telemetry: row.get(10).and_then(SqlValue::as_integer).unwrap_or(1) != 0,
        screen_capture_enabled: row.get(11).and_then(SqlValue::as_integer).unwrap_or(0) != 0,
    }
}

const PROFILE_SELECT: &str = "SELECT id, display_name, email, hardware_profile, onboarding_complete, expertise_level, created_at, updated_at, last_active_at FROM profiles LIMIT 1";

const PREFS_SELECT: &str = "SELECT id, user_id, theme, context_mode, show_thinking, preferred_languages, tab_size, use_semicolons, default_temperature, verbosity, allow_telemetry, screen_capture_enabled FROM preferences WHERE user_id = ? LIMIT 1";

/// Get or create the single user profile via the given adapter.
async fn ensure_profile(adapter: &LibSqlAdapter) -> Result<UserProfile, String> {
    let rows = adapter
        .query(PROFILE_SELECT, &[])
        .await
        .map_err(|e| format!("Failed to query profiles: {e}"))?;

    if let Some(row) = rows.first() {
        return Ok(row_to_profile(row));
    }

    // No profile — create default
    let profile_id = format!("prof-{}", Uuid::new_v4());
    adapter
        .execute(
            "INSERT INTO profiles (id, display_name, expertise_level) VALUES (?, 'Developer', 1)",
            &[profile_id.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to create default profile: {e}"))?;

    // Also create default preferences row
    let pref_id = format!("pref-{}", Uuid::new_v4());
    adapter
        .execute(
            "INSERT INTO preferences (id, user_id) VALUES (?, ?)",
            &[pref_id.as_str(), profile_id.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to create default preferences: {e}"))?;

    // Re-read
    let rows = adapter
        .query(PROFILE_SELECT, &[])
        .await
        .map_err(|e| format!("Failed to re-read profile: {e}"))?;

    rows.first()
        .map(|r| row_to_profile(r))
        .ok_or_else(|| "Profile insert succeeded but re-read returned nothing".to_string())
}

/// Get or create preferences for the given profile.
async fn ensure_prefs(adapter: &LibSqlAdapter, profile_id: &str) -> Result<UserPreferences, String> {
    let rows = adapter
        .query(PREFS_SELECT, &[profile_id])
        .await
        .map_err(|e| format!("Failed to query preferences: {e}"))?;

    if let Some(row) = rows.first() {
        return Ok(row_to_prefs(row));
    }

    let pref_id = format!("pref-{}", Uuid::new_v4());
    adapter
        .execute(
            "INSERT INTO preferences (id, user_id) VALUES (?, ?)",
            &[pref_id.as_str(), profile_id],
        )
        .await
        .map_err(|e| format!("Failed to create default preferences: {e}"))?;

    Ok(UserPreferences {
        id: pref_id,
        user_id: profile_id.to_string(),
        theme: "dark".to_string(),
        context_mode: "normal".to_string(),
        show_thinking: false,
        preferred_languages: None,
        tab_size: 4,
        use_semicolons: true,
        default_temperature: 0.7,
        verbosity: "balanced".to_string(),
        allow_telemetry: true,
        screen_capture_enabled: false,
    })
}

/// Get the adapter from platform state.
async fn get_adapter(state: &State<'_, PlatformState>) -> Result<Arc<LibSqlAdapter>, String> {
    let lock = state.platform.read().await;
    let platform = lock.as_ref().ok_or("Platform is still booting")?;
    let svc = platform.user_relational().ok_or("User relational service not available")?;
    Ok(Arc::clone(svc.adapter()))
}

// ── Public Tauri commands ──────────────────────────────────────

/// Fetch the current user profile. Creates a default if none exists.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn fetch_user_profile(
    state: State<'_, PlatformState>,
) -> Result<UserProfile, String> {
    let adapter = get_adapter(&state).await?;
    ensure_profile(adapter.as_ref()).await
}

/// Update the user profile. Only non-None fields are written.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn update_user_profile(
    display_name: Option<String>,
    email: Option<String>,
    expertise_level: Option<i64>,
    state: State<'_, PlatformState>,
) -> Result<UserProfile, String> {
    let adapter = get_adapter(&state).await?;
    let profile = ensure_profile(adapter.as_ref()).await?;

    // Resolve each field: caller-provided → existing → leave as-is.
    // Use NULLIF(?, '') so empty strings become NULL in the DB.
    let new_name = display_name.unwrap_or_else(|| profile.display_name.unwrap_or_default());
    let new_email_raw = email.unwrap_or_else(|| profile.email.clone().unwrap_or_default());
    let new_level = expertise_level.unwrap_or(profile.expertise_level);
    let level_str = new_level.to_string();

    adapter
        .execute(
            "UPDATE profiles SET display_name = NULLIF(?, ''), email = NULLIF(?, ''), expertise_level = ?, updated_at = unixepoch() WHERE id = ?",
            &[new_name.as_str(), new_email_raw.as_str(), level_str.as_str(), profile.id.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to update profile: {e}"))?;

    // Re-read
    ensure_profile(adapter.as_ref()).await
}

/// Fetch user preferences. Creates defaults if none exist.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn fetch_user_preferences(
    state: State<'_, PlatformState>,
) -> Result<UserPreferences, String> {
    let adapter = get_adapter(&state).await?;
    let profile = ensure_profile(adapter.as_ref()).await?;
    ensure_prefs(adapter.as_ref(), &profile.id).await
}

/// Update user preferences. Only non-None fields are written.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn update_user_preferences(
    theme: Option<String>,
    context_mode: Option<String>,
    show_thinking: Option<bool>,
    verbosity: Option<String>,
    default_temperature: Option<f64>,
    allow_telemetry: Option<bool>,
    screen_capture_enabled: Option<bool>,
    state: State<'_, PlatformState>,
) -> Result<UserPreferences, String> {
    let adapter = get_adapter(&state).await?;
    let profile = ensure_profile(adapter.as_ref()).await?;
    let prefs = ensure_prefs(adapter.as_ref(), &profile.id).await?;

    let new_theme = theme.unwrap_or(prefs.theme);
    let new_ctx = context_mode.unwrap_or(prefs.context_mode);
    let new_thinking = if show_thinking.unwrap_or(prefs.show_thinking) { "1" } else { "0" };
    let new_verbosity = verbosity.unwrap_or(prefs.verbosity);
    let new_temp = default_temperature.unwrap_or(prefs.default_temperature).to_string();
    let new_telemetry = if allow_telemetry.unwrap_or(prefs.allow_telemetry) { "1" } else { "0" };
    let new_capture = if screen_capture_enabled.unwrap_or(prefs.screen_capture_enabled) { "1" } else { "0" };

    adapter
        .execute(
            "UPDATE preferences SET theme = ?, context_mode = ?, show_thinking = ?, verbosity = ?, default_temperature = ?, allow_telemetry = ?, screen_capture_enabled = ?, updated_at = unixepoch() WHERE id = ?",
            &[new_theme.as_str(), new_ctx.as_str(), new_thinking, new_verbosity.as_str(), new_temp.as_str(), new_telemetry, new_capture, prefs.id.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to update preferences: {e}"))?;

    ensure_prefs(adapter.as_ref(), &profile.id).await
}
