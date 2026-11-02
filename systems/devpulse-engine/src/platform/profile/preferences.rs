//! Your settings — the `preferences` row that belongs to the profile.
//!
//! Defaults come from the table's column defaults; a missing row is
//! created and read back, so what is returned is always what is stored.

use anyhow::{Context, Result};
use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlValue};
use serde::{Deserialize, Serialize};
use specta::Type;
use uuid::Uuid;

/// The `preferences` row.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
#[expect(
    clippy::struct_excessive_bools,
    reason = "mirrors the `preferences` row 1:1 — each bool is an independent toggle in Settings"
)]
pub struct UserPreferences {
    /// Primary key.
    pub id: String,
    /// The owning profile.
    pub user_id: String,
    /// Active theme.
    pub theme: String,
    /// Context density mode.
    pub context_mode: String,
    /// Whether model reasoning is shown where supported.
    pub show_thinking: bool,
    /// Preferred programming languages (JSON list).
    pub preferred_languages: Option<String>,
    /// Editor tab width.
    pub tab_size: i64,
    /// Whether generated code uses semicolons by default.
    pub use_semicolons: bool,
    /// Default model temperature for freeform generation.
    pub default_temperature: f64,
    /// Explanation verbosity preset.
    pub verbosity: String,
    /// Whether product telemetry is allowed.
    pub allow_telemetry: bool,
    /// Whether screen capture features are enabled.
    pub screen_capture_enabled: bool,
}

/// A change to preferences. Only the fields given are written.
#[derive(Debug, Clone, Default, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserPreferencesInput {
    /// New theme.
    pub theme: Option<String>,
    /// New context density mode.
    pub context_mode: Option<String>,
    /// Whether model reasoning is shown.
    pub show_thinking: Option<bool>,
    /// New verbosity preset.
    pub verbosity: Option<String>,
    /// Default model temperature.
    pub default_temperature: Option<f64>,
    /// Whether product telemetry is allowed.
    pub allow_telemetry: Option<bool>,
    /// Whether screen capture features are enabled.
    pub screen_capture_enabled: Option<bool>,
}

const PREFS_SELECT: &str = "SELECT id, user_id, theme, context_mode, show_thinking, preferred_languages, \
     tab_size, use_semicolons, default_temperature, verbosity, allow_telemetry, screen_capture_enabled \
     FROM preferences WHERE user_id = ? LIMIT 1";

fn to_prefs(row: &[SqlValue]) -> Result<UserPreferences> {
    let text = |i: usize, name: &str| {
        row.get(i)
            .and_then(SqlValue::as_text)
            .map(str::to_owned)
            .with_context(|| format!("preferences.{name} is not text"))
    };
    let int = |i: usize, name: &str| {
        row.get(i)
            .and_then(SqlValue::as_integer)
            .with_context(|| format!("preferences.{name} is not a whole number"))
    };
    Ok(UserPreferences {
        id: text(0, "id")?,
        user_id: text(1, "user_id")?,
        theme: text(2, "theme")?,
        context_mode: text(3, "context_mode")?,
        show_thinking: int(4, "show_thinking")? != 0,
        preferred_languages: row.get(5).and_then(SqlValue::as_text).map(str::to_owned),
        tab_size: int(6, "tab_size")?,
        use_semicolons: int(7, "use_semicolons")? != 0,
        default_temperature: match row.get(8) {
            Some(SqlValue::Real(f)) => *f,
            #[allow(
                clippy::cast_precision_loss,
                reason = "a whole-number temperature read as a decimal"
            )]
            Some(SqlValue::Integer(i)) => *i as f64,
            other => anyhow::bail!("preferences.default_temperature is not a number: {other:?}"),
        },
        verbosity: text(9, "verbosity")?,
        allow_telemetry: int(10, "allow_telemetry")? != 0,
        screen_capture_enabled: int(11, "screen_capture_enabled")? != 0,
    })
}

/// The preferences of a profile, created with the column defaults the first
/// time.
///
/// # Errors
/// Returns an error if the row cannot be read or created.
pub async fn ensure(adapter: &dyn SqlAdapter, profile_id: &str) -> Result<UserPreferences> {
    let rows = adapter
        .query(PREFS_SELECT, &[profile_id.into()])
        .await
        .context("read preferences")?;
    if let Some(row) = rows.first() {
        return to_prefs(row);
    }
    adapter
        .execute(
            "INSERT INTO preferences (id, user_id) VALUES (?, ?)",
            &[format!("pref-{}", Uuid::new_v4()).into(), profile_id.into()],
        )
        .await
        .context("create the preferences row")?;
    let rows = adapter
        .query(PREFS_SELECT, &[profile_id.into()])
        .await
        .context("read preferences back")?;
    to_prefs(
        rows.first()
            .context("the preferences row was created but cannot be read back")?,
    )
}

/// Apply a change to the profile's preferences.
///
/// # Errors
/// Returns an error if the row cannot be read or written.
pub async fn update(
    adapter: &dyn SqlAdapter,
    profile_id: &str,
    patch: UpdateUserPreferencesInput,
) -> Result<UserPreferences> {
    let prefs = ensure(adapter, profile_id).await?;
    adapter
        .execute(
            "UPDATE preferences SET theme = ?, context_mode = ?, show_thinking = ?, verbosity = ?, \
             default_temperature = ?, allow_telemetry = ?, screen_capture_enabled = ?, \
             updated_at = unixepoch() WHERE id = ?",
            &[
                patch.theme.unwrap_or(prefs.theme).into(),
                patch.context_mode.unwrap_or(prefs.context_mode).into(),
                patch.show_thinking.unwrap_or(prefs.show_thinking).into(),
                patch.verbosity.unwrap_or(prefs.verbosity).into(),
                patch
                    .default_temperature
                    .unwrap_or(prefs.default_temperature)
                    .into(),
                patch
                    .allow_telemetry
                    .unwrap_or(prefs.allow_telemetry)
                    .into(),
                patch
                    .screen_capture_enabled
                    .unwrap_or(prefs.screen_capture_enabled)
                    .into(),
                prefs.id.as_str().into(),
            ],
        )
        .await
        .context("update preferences")?;
    ensure(adapter, profile_id).await
}
