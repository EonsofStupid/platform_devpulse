//! Profile commands — user identity and preferences CRUD against `user.db`.
//!
//! # Error handling (Phase 0b)
//!
//! Internally every helper returns `anyhow::Result<T>` and uses `.context(...)`
//! at each fallible step so the cause chain survives. At the Tauri command
//! boundary we convert to `Result<T, String>` via `format!("{e:#}")` — the
//! `#` alternate formatter walks `.source()` and prints the full chain.
//! Frontend sees the same `Result<T, string>` type as before.

use crate::state::PlatformState;
use anyhow::{Context, Result};
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
    /// Primary key for the profile row.
    pub id: String,
    /// Optional display name shown across the desktop app.
    pub display_name: Option<String>,
    /// Optional email associated with the local profile.
    pub email: Option<String>,
    /// Hardware profile identifier chosen for onboarding defaults.
    pub hardware_profile: String,
    /// Whether onboarding has been completed for this profile.
    pub onboarding_complete: bool,
    /// Numeric expertise level used for adaptive UX.
    pub expertise_level: i64,
    /// Unix timestamp when the profile row was created.
    pub created_at: i64,
    /// Unix timestamp when the profile row was last updated.
    pub updated_at: i64,
    /// Unix timestamp for the last active session, if recorded.
    pub last_active_at: Option<i64>,
}

/// User preferences row from the `preferences` table.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UserPreferences {
    /// Primary key for the preferences row.
    pub id: String,
    /// Foreign key pointing at the owning profile row.
    pub user_id: String,
    /// Active theme selection.
    pub theme: String,
    /// Preferred context density mode for the UI.
    pub context_mode: String,
    /// Whether model reasoning should be shown in supported surfaces.
    pub show_thinking: bool,
    /// Optional serialized list of preferred programming languages.
    pub preferred_languages: Option<String>,
    /// Preferred editor tab width.
    pub tab_size: i64,
    /// Whether generated code should default to semicolons.
    pub use_semicolons: bool,
    /// Default model temperature for freeform generation.
    pub default_temperature: f64,
    /// Preferred explanation verbosity preset.
    pub verbosity: String,
    /// Whether product telemetry is allowed.
    pub allow_telemetry: bool,
    /// Whether screen capture features are enabled.
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
#[tracing::instrument(skip_all, err)]
async fn ensure_profile(adapter: &LibSqlAdapter) -> Result<UserProfile> {
    let rows = adapter
        .query(PROFILE_SELECT, &[])
        .await
        .context("query profiles table")?;

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
        .context("insert default profile row")?;

    // Also create default preferences row
    let pref_id = format!("pref-{}", Uuid::new_v4());
    adapter
        .execute(
            "INSERT INTO preferences (id, user_id) VALUES (?, ?)",
            &[pref_id.as_str(), profile_id.as_str()],
        )
        .await
        .context("insert default preferences row")?;

    // Re-read
    let rows = adapter
        .query(PROFILE_SELECT, &[])
        .await
        .context("re-read profile after insert")?;

    rows.first()
        .map(|r| row_to_profile(r))
        .context("profile insert succeeded but re-read returned nothing")
}

/// Get or create preferences for the given profile.
#[tracing::instrument(skip(adapter), fields(profile_id), err)]
async fn ensure_prefs(adapter: &LibSqlAdapter, profile_id: &str) -> Result<UserPreferences> {
    let rows = adapter
        .query(PREFS_SELECT, &[profile_id])
        .await
        .context("query preferences table")?;

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
        .context("insert default preferences row")?;

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
async fn get_adapter(state: &State<'_, PlatformState>) -> Result<Arc<LibSqlAdapter>> {
    // P0: lock-free atomic load. No await, no RwLock.
    let platform = state
        .platform
        .load_full()
        .context("platform is still booting")?;
    let svc = platform
        .user_relational()
        .context("user relational service not available")?;
    Ok(Arc::clone(svc.adapter()))
}

// ── Public Tauri commands ──────────────────────────────────────

/// Fetch the current user profile. Creates a default if none exists.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn fetch_user_profile(
    state: State<'_, PlatformState>,
) -> std::result::Result<UserProfile, String> {
    inner_fetch_user_profile(state)
        .await
        .map_err(|e| format!("{e:#}"))
}

#[tracing::instrument(skip_all, err)]
async fn inner_fetch_user_profile(state: State<'_, PlatformState>) -> Result<UserProfile> {
    let adapter = get_adapter(&state).await.context("fetch_user_profile: get adapter")?;
    ensure_profile(adapter.as_ref())
        .await
        .context("fetch_user_profile: ensure profile")
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
) -> std::result::Result<UserProfile, String> {
    inner_update_user_profile(display_name, email, expertise_level, state)
        .await
        .map_err(|e| format!("{e:#}"))
}

#[tracing::instrument(skip(state), err)]
async fn inner_update_user_profile(
    display_name: Option<String>,
    email: Option<String>,
    expertise_level: Option<i64>,
    state: State<'_, PlatformState>,
) -> Result<UserProfile> {
    let adapter = get_adapter(&state).await.context("update_user_profile: get adapter")?;
    let profile = ensure_profile(adapter.as_ref())
        .await
        .context("update_user_profile: ensure profile")?;

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
        .context("update_user_profile: UPDATE profiles")?;

    // Re-read
    ensure_profile(adapter.as_ref())
        .await
        .context("update_user_profile: re-read profile")
}

/// Fetch user preferences. Creates defaults if none exist.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn fetch_user_preferences(
    state: State<'_, PlatformState>,
) -> std::result::Result<UserPreferences, String> {
    inner_fetch_user_preferences(state)
        .await
        .map_err(|e| format!("{e:#}"))
}

#[tracing::instrument(skip_all, err)]
async fn inner_fetch_user_preferences(
    state: State<'_, PlatformState>,
) -> Result<UserPreferences> {
    let adapter = get_adapter(&state)
        .await
        .context("fetch_user_preferences: get adapter")?;
    let profile = ensure_profile(adapter.as_ref())
        .await
        .context("fetch_user_preferences: ensure profile")?;
    ensure_prefs(adapter.as_ref(), &profile.id)
        .await
        .context("fetch_user_preferences: ensure prefs")
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
) -> std::result::Result<UserPreferences, String> {
    inner_update_user_preferences(
        theme,
        context_mode,
        show_thinking,
        verbosity,
        default_temperature,
        allow_telemetry,
        screen_capture_enabled,
        state,
    )
    .await
    .map_err(|e| format!("{e:#}"))
}

#[tracing::instrument(skip(state), err)]
#[allow(clippy::too_many_arguments)]
async fn inner_update_user_preferences(
    theme: Option<String>,
    context_mode: Option<String>,
    show_thinking: Option<bool>,
    verbosity: Option<String>,
    default_temperature: Option<f64>,
    allow_telemetry: Option<bool>,
    screen_capture_enabled: Option<bool>,
    state: State<'_, PlatformState>,
) -> Result<UserPreferences> {
    let adapter = get_adapter(&state)
        .await
        .context("update_user_preferences: get adapter")?;
    let profile = ensure_profile(adapter.as_ref())
        .await
        .context("update_user_preferences: ensure profile")?;
    let prefs = ensure_prefs(adapter.as_ref(), &profile.id)
        .await
        .context("update_user_preferences: ensure prefs")?;

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
        .context("update_user_preferences: UPDATE preferences")?;

    ensure_prefs(adapter.as_ref(), &profile.id)
        .await
        .context("update_user_preferences: re-read prefs")
}
