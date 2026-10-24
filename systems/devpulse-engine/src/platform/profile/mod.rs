//! Your profile — the single person this `DevPulse` install belongs to.
//!
//! The engine owns the profile row in the user Turso database: who you are
//! (name, email), where your projects live, and first-run progress (read and
//! written by [`crate::platform::onboarding`]). Commands and the UI go
//! through here; nothing else writes the row.
//!
//! [`preferences`] holds the settings row that belongs to the profile.

pub mod preferences;

use anyhow::{Context, Result};
use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlValue};
use serde::{Deserialize, Serialize};
use specta::Type;
use uuid::Uuid;

/// The profile row from the `profiles` table.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    /// Primary key.
    pub id: String,
    /// Your name, shown across the app; `None` until you give it.
    pub display_name: Option<String>,
    /// Your email; `None` until you give it.
    pub email: Option<String>,
    /// Id of the hardware preset you selected; `None` until one is chosen.
    pub hardware_profile: Option<String>,
    /// Whether first run is finished.
    pub onboarding_complete: bool,
    /// Skill level inferred from your projects and GitHub; `None` until
    /// inferred. Never asked.
    pub expertise_level: Option<i64>,
    /// The folder your projects live in; `None` until you choose it.
    pub projects_root: Option<String>,
    /// Unix timestamp when the row was created.
    pub created_at: i64,
    /// Unix timestamp when the row was last updated.
    pub updated_at: i64,
    /// Unix timestamp of the last active session, if recorded.
    pub last_active_at: Option<i64>,
}

const PROFILE_SELECT: &str =
    "SELECT id, display_name, email, hardware_profile, onboarding_complete, \
     expertise_level, projects_root, created_at, updated_at, last_active_at FROM profiles LIMIT 1";

fn text(row: &[SqlValue], i: usize) -> Option<String> {
    row.get(i).and_then(SqlValue::as_text).map(str::to_owned)
}

fn int(row: &[SqlValue], i: usize) -> Option<i64> {
    row.get(i).and_then(SqlValue::as_integer)
}

fn to_profile(row: &[SqlValue]) -> Result<UserProfile> {
    Ok(UserProfile {
        id: text(row, 0).context("profile row without an id")?,
        display_name: text(row, 1),
        email: text(row, 2),
        hardware_profile: text(row, 3),
        onboarding_complete: int(row, 4).is_some_and(|v| v != 0),
        expertise_level: int(row, 5),
        projects_root: text(row, 6),
        created_at: int(row, 7).context("profile row without created_at")?,
        updated_at: int(row, 8).context("profile row without updated_at")?,
        last_active_at: int(row, 9),
    })
}

/// Read the profile without creating one.
///
/// # Errors
/// Returns an error if the row cannot be read.
pub async fn read(adapter: &dyn SqlAdapter) -> Result<Option<UserProfile>> {
    let rows = adapter
        .query(PROFILE_SELECT, &[])
        .await
        .context("read profiles")?;
    rows.first().map(|r| to_profile(r)).transpose()
}

/// The profile, created with its preferences row the first time.
///
/// # Errors
/// Returns an error if the row cannot be read or created.
pub async fn ensure(adapter: &dyn SqlAdapter) -> Result<UserProfile> {
    if let Some(profile) = read(adapter).await? {
        return Ok(profile);
    }
    let profile_id = format!("prof-{}", Uuid::new_v4());
    adapter
        .execute(
            // Explicit NULLs: databases created before user migration 0001
            // still carry the old column defaults ('32g_engineer', 1) in
            // their table definition.
            "INSERT INTO profiles (id, hardware_profile, expertise_level) VALUES (?, NULL, NULL)",
            &[profile_id.as_str().into()],
        )
        .await
        .context("create the profile row")?;
    preferences::ensure(adapter, &profile_id).await?;
    read(adapter)
        .await?
        .context("the profile row was created but cannot be read back")
}

/// Change your name and email. `None` leaves a field as it is; an empty
/// string clears it.
///
/// # Errors
/// Returns an error if the row cannot be written.
pub async fn update_identity(
    adapter: &dyn SqlAdapter,
    display_name: Option<String>,
    email: Option<String>,
) -> Result<UserProfile> {
    let profile = ensure(adapter).await?;
    let cleared = |v: String| (!v.trim().is_empty()).then(|| v.trim().to_owned());
    let name = display_name.map_or(profile.display_name, cleared);
    let email = email.map_or(profile.email, cleared);
    adapter
        .execute(
            "UPDATE profiles SET display_name = ?, email = ?, updated_at = unixepoch() WHERE id = ?",
            &[name.into(), email.into(), profile.id.as_str().into()],
        )
        .await
        .context("update name and email")?;
    ensure(adapter).await
}

/// Set the folder your projects live in.
///
/// # Errors
/// Returns an error if the row cannot be written.
pub async fn set_projects_root(adapter: &dyn SqlAdapter, path: &str) -> Result<UserProfile> {
    let profile = ensure(adapter).await?;
    adapter
        .execute(
            "UPDATE profiles SET projects_root = ?, updated_at = unixepoch() WHERE id = ?",
            &[path.into(), profile.id.as_str().into()],
        )
        .await
        .context("update the projects folder")?;
    ensure(adapter).await
}

#[cfg(test)]
pub(crate) mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use crate::platform::db::{migrate, migrations};
    use crate::platform::services::relational::USER_SCHEMA;
    use devpulse_clyffy::cortex::persistence::{TursoAdapter, TursoOptions};

    /// A user database built exactly as boot builds it: base schema, then
    /// every user migration.
    pub(crate) async fn user_db(tag: &str) -> (TursoAdapter, std::path::PathBuf) {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let dir = std::env::temp_dir().join(format!("devpulse-profile-{tag}-{nanos}"));
        let adapter = TursoAdapter::open_with_schema(
            &dir.join("user.db"),
            USER_SCHEMA,
            TursoOptions::default(),
        )
        .await
        .expect("open");
        migrate(&adapter, migrations::USER).await.expect("migrate");
        (adapter, dir)
    }

    #[tokio::test]
    async fn profile_is_created_once_with_preferences_and_edits_in_place() {
        let (db, dir) = user_db("ensure").await;
        assert!(read(&db).await.expect("read").is_none());

        let me = ensure(&db).await.expect("ensure");
        assert_eq!(me.display_name, None);
        assert_eq!(me.hardware_profile, None);
        assert_eq!(me.expertise_level, None);
        assert!(!me.onboarding_complete);
        assert_eq!(ensure(&db).await.expect("again").id, me.id, "one profile");

        let prefs = preferences::ensure(&db, &me.id).await.expect("prefs");
        assert_eq!(prefs.user_id, me.id);

        let me = update_identity(&db, Some("  Ada  ".into()), Some("ada@example.com".into()))
            .await
            .expect("identity");
        assert_eq!(me.display_name.as_deref(), Some("Ada"));
        let me = update_identity(&db, None, Some(String::new()))
            .await
            .expect("clear email");
        assert_eq!(
            me.display_name.as_deref(),
            Some("Ada"),
            "None keeps the name"
        );
        assert_eq!(me.email, None, "empty clears the email");

        let me = set_projects_root(&db, "D:/code").await.expect("root");
        assert_eq!(me.projects_root.as_deref(), Some("D:/code"));

        db.close().await;
        drop(db);
        let _ = std::fs::remove_dir_all(dir);
    }
}
