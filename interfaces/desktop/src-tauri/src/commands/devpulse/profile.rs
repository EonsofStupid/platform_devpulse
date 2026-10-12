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
use devpulse_engine::platform::{SqlAdapter, SqlValue, TursoAdapter};
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
    /// Id of the hardware preset the user selected; `None` until one is chosen.
    pub hardware_profile: Option<String>,
    /// Whether onboarding has been completed for this profile.
    pub onboarding_complete: bool,
    /// Skill level inferred from the user's projects and GitHub; `None`
    /// until inferred. Never asked.
    pub expertise_level: Option<i64>,
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
#[expect(
    clippy::struct_excessive_bools,
    reason = "Wire-DTO that mirrors the `preferences` SQL row 1:1 — each bool is an independent operator toggle in the Settings UI (show_thinking, use_semicolons, allow_telemetry, screen_capture_enabled). Folding into bitflags would break the tauri-specta TS surface and the SQL column mapping."
)]
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
        id: row
            .first()
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string(),
        display_name: row.get(1).and_then(|v| v.as_text()).map(String::from),
        email: row.get(2).and_then(|v| v.as_text()).map(String::from),
        hardware_profile: row.get(3).and_then(|v| v.as_text()).map(String::from),
        onboarding_complete: row.get(4).and_then(SqlValue::as_integer).unwrap_or(0) != 0,
        expertise_level: row.get(5).and_then(SqlValue::as_integer),
        created_at: row.get(6).and_then(SqlValue::as_integer).unwrap_or(0),
        updated_at: row.get(7).and_then(SqlValue::as_integer).unwrap_or(0),
        last_active_at: row.get(8).and_then(SqlValue::as_integer),
    }
}

fn row_to_prefs(row: &[SqlValue]) -> UserPreferences {
    UserPreferences {
        id: row
            .first()
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string(),
        user_id: row
            .get(1)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string(),
        theme: row
            .get(2)
            .and_then(|v| v.as_text())
            .unwrap_or("dark")
            .to_string(),
        context_mode: row
            .get(3)
            .and_then(|v| v.as_text())
            .unwrap_or("normal")
            .to_string(),
        show_thinking: row.get(4).and_then(SqlValue::as_integer).unwrap_or(0) != 0,
        preferred_languages: row.get(5).and_then(|v| v.as_text()).map(String::from),
        tab_size: row.get(6).and_then(SqlValue::as_integer).unwrap_or(4),
        use_semicolons: row.get(7).and_then(SqlValue::as_integer).unwrap_or(1) != 0,
        default_temperature: row.get(8).and_then(SqlValue::as_real).unwrap_or(0.7),
        verbosity: row
            .get(9)
            .and_then(|v| v.as_text())
            .unwrap_or("balanced")
            .to_string(),
        allow_telemetry: row.get(10).and_then(SqlValue::as_integer).unwrap_or(1) != 0,
        screen_capture_enabled: row.get(11).and_then(SqlValue::as_integer).unwrap_or(0) != 0,
    }
}

const PROFILE_SELECT: &str = "SELECT id, display_name, email, hardware_profile, onboarding_complete, expertise_level, created_at, updated_at, last_active_at FROM profiles LIMIT 1";

const PREFS_SELECT: &str = "SELECT id, user_id, theme, context_mode, show_thinking, preferred_languages, tab_size, use_semicolons, default_temperature, verbosity, allow_telemetry, screen_capture_enabled FROM preferences WHERE user_id = ? LIMIT 1";

/// Get or create the single user profile via the given adapter. The
/// only place a profile row is created.
#[tracing::instrument(skip_all, err)]
pub(crate) async fn ensure_profile(adapter: &TursoAdapter) -> Result<UserProfile> {
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
            // Explicit NULLs: databases created before user migration 0001 still
            // carry column defaults ('32g_engineer', 1) in their table definition.
            "INSERT INTO profiles (id, hardware_profile, expertise_level) VALUES (?, NULL, NULL)",
            &[profile_id.as_str().into()],
        )
        .await
        .context("insert default profile row")?;

    // Also create default preferences row
    let pref_id = format!("pref-{}", Uuid::new_v4());
    adapter
        .execute(
            "INSERT INTO preferences (id, user_id) VALUES (?, ?)",
            &[pref_id.as_str().into(), profile_id.as_str().into()],
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
async fn ensure_prefs(adapter: &TursoAdapter, profile_id: &str) -> Result<UserPreferences> {
    let rows = adapter
        .query(PREFS_SELECT, &[profile_id.into()])
        .await
        .context("query preferences table")?;

    if let Some(row) = rows.first() {
        return Ok(row_to_prefs(row));
    }

    let pref_id = format!("pref-{}", Uuid::new_v4());
    adapter
        .execute(
            "INSERT INTO preferences (id, user_id) VALUES (?, ?)",
            &[pref_id.as_str().into(), profile_id.into()],
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
///
/// Stays `async` to match the `.await?` idiom used by every other service
/// access in this crate. The body is lock-free today, but consistent
/// calling convention keeps the command-layer surface uniform.
#[allow(clippy::unused_async)]
async fn get_adapter(state: &State<'_, PlatformState>) -> Result<Arc<TursoAdapter>> {
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
    let adapter = get_adapter(&state)
        .await
        .context("fetch_user_profile: get adapter")?;
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
    state: State<'_, PlatformState>,
) -> std::result::Result<UserProfile, String> {
    inner_update_user_profile(display_name, email, state)
        .await
        .map_err(|e| format!("{e:#}"))
}

#[tracing::instrument(skip(state), err)]
async fn inner_update_user_profile(
    display_name: Option<String>,
    email: Option<String>,
    state: State<'_, PlatformState>,
) -> Result<UserProfile> {
    let adapter = get_adapter(&state)
        .await
        .context("update_user_profile: get adapter")?;
    let profile = ensure_profile(adapter.as_ref())
        .await
        .context("update_user_profile: ensure profile")?;

    // Resolve each field: caller-provided → existing → leave as-is.
    // Use NULLIF(?, '') so empty strings become NULL in the DB.
    let new_name = display_name.unwrap_or_else(|| profile.display_name.unwrap_or_default());
    let new_email_raw = email.unwrap_or_else(|| profile.email.clone().unwrap_or_default());

    adapter
        .execute(
            "UPDATE profiles SET display_name = NULLIF(?, ''), email = NULLIF(?, ''), updated_at = unixepoch() WHERE id = ?",
            &[new_name.as_str().into(), new_email_raw.as_str().into(), profile.id.as_str().into()],
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
async fn inner_fetch_user_preferences(state: State<'_, PlatformState>) -> Result<UserPreferences> {
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

/// Patch input for [`update_user_preferences`]. Every field is optional;
/// only the keys the caller supplies are written. Mirrors the
/// camelCase TS shape via tauri-specta.
#[derive(Debug, Clone, Default, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserPreferencesInput {
    /// New theme selection.
    pub theme: Option<String>,
    /// New context-density mode.
    pub context_mode: Option<String>,
    /// Whether model reasoning should be shown.
    pub show_thinking: Option<bool>,
    /// New explanation verbosity preset.
    pub verbosity: Option<String>,
    /// Default model temperature for freeform generation.
    pub default_temperature: Option<f64>,
    /// Whether product telemetry is allowed.
    pub allow_telemetry: Option<bool>,
    /// Whether screen capture features are enabled.
    pub screen_capture_enabled: Option<bool>,
}

/// Update user preferences. Only non-None fields in `patch` are written.
///
/// # Errors
/// Returns the formatted error string when the adapter cannot be
/// resolved, the profile / preferences row cannot be loaded, or the
/// `UPDATE preferences` statement fails.
#[tauri::command]
#[specta::specta]
pub async fn update_user_preferences(
    patch: UpdateUserPreferencesInput,
    state: State<'_, PlatformState>,
) -> std::result::Result<UserPreferences, String> {
    inner_update_user_preferences(patch, state)
        .await
        .map_err(|e| format!("{e:#}"))
}

#[tracing::instrument(skip(state), err)]
async fn inner_update_user_preferences(
    patch: UpdateUserPreferencesInput,
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

    let new_theme = patch.theme.unwrap_or(prefs.theme);
    let new_ctx = patch.context_mode.unwrap_or(prefs.context_mode);
    let new_verbosity = patch.verbosity.unwrap_or(prefs.verbosity);

    adapter
        .execute(
            "UPDATE preferences SET theme = ?, context_mode = ?, show_thinking = ?, verbosity = ?, default_temperature = ?, allow_telemetry = ?, screen_capture_enabled = ?, updated_at = unixepoch() WHERE id = ?",
            &[
                new_theme.into(),
                new_ctx.into(),
                patch.show_thinking.unwrap_or(prefs.show_thinking).into(),
                new_verbosity.into(),
                patch.default_temperature.unwrap_or(prefs.default_temperature).into(),
                patch.allow_telemetry.unwrap_or(prefs.allow_telemetry).into(),
                patch
                    .screen_capture_enabled
                    .unwrap_or(prefs.screen_capture_enabled)
                    .into(),
                prefs.id.as_str().into(),
            ],
        )
        .await
        .context("update_user_preferences: UPDATE preferences")?;

    ensure_prefs(adapter.as_ref(), &profile.id)
        .await
        .context("update_user_preferences: re-read prefs")
}
