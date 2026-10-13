//! First-run progress in Turso, on the profile row: the current stage,
//! whether first run is finished, and when you chose "Set up later".

use anyhow::{Context, Result};
use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlValue};

use super::flow::Stage;
use crate::platform::profile;

/// Stored first-run progress.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Progress {
    /// The stage id last stored; `None` before first run starts. Kept as
    /// text so a stage a newer flow removed is reported, not lost.
    pub stage_id: Option<String>,
    /// First run is finished.
    pub complete: bool,
    /// Unix time you chose "Set up later"; `None` when you didn't, or
    /// reopened first run since.
    pub later_at: Option<i64>,
}

/// Read progress (the profile is created the first time).
///
/// # Errors
/// Returns an error if the profile row cannot be read.
pub async fn load(db: &dyn SqlAdapter) -> Result<Progress> {
    let me = profile::ensure(db).await?;
    let rows = db
        .query(
            "SELECT onboarding_stage, onboarding_complete, onboarding_later_at FROM profiles WHERE id = ?",
            &[me.id.as_str().into()],
        )
        .await
        .context("read first-run progress")?;
    let row = rows.first().context("the profile row vanished")?;
    Ok(Progress {
        stage_id: row.first().and_then(SqlValue::as_text).map(str::to_owned),
        complete: row
            .get(1)
            .and_then(SqlValue::as_integer)
            .is_some_and(|v| v != 0),
        later_at: row.get(2).and_then(SqlValue::as_integer),
    })
}

async fn write(db: &dyn SqlAdapter, column_sql: &str, value: SqlValue) -> Result<()> {
    let me = profile::ensure(db).await?;
    db.execute(
        &format!("UPDATE profiles SET {column_sql} = ?, updated_at = unixepoch() WHERE id = ?"),
        &[value, me.id.as_str().into()],
    )
    .await
    .with_context(|| format!("store first-run progress ({column_sql})"))?;
    Ok(())
}

/// Store the current stage.
///
/// # Errors
/// Returns an error if the row cannot be written.
pub async fn set_stage(db: &dyn SqlAdapter, stage: Stage) -> Result<()> {
    write(db, "onboarding_stage", stage.id().into()).await
}

/// Store whether first run is finished.
///
/// # Errors
/// Returns an error if the row cannot be written.
pub async fn set_complete(db: &dyn SqlAdapter, complete: bool) -> Result<()> {
    write(db, "onboarding_complete", complete.into()).await
}

/// Store "Set up later" (now), or clear it when you reopen first run.
///
/// # Errors
/// Returns an error if the row cannot be written.
pub async fn set_later(db: &dyn SqlAdapter, later: bool) -> Result<()> {
    let value = if later {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .context("system clock before 1970")?
            .as_secs();
        SqlValue::Integer(i64::try_from(now).context("time out of range")?)
    } else {
        SqlValue::Null
    };
    write(db, "onboarding_later_at", value).await
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, reason = "test assertions")]

    use super::*;
    use crate::platform::profile::tests::user_db;

    #[tokio::test]
    async fn progress_round_trips_on_the_profile_row() {
        let (db, dir) = user_db("progress").await;
        let fresh = load(&db).await.expect("load");
        assert_eq!(
            fresh,
            Progress {
                stage_id: None,
                complete: false,
                later_at: None
            }
        );

        set_stage(&db, Stage::You).await.expect("stage");
        set_later(&db, true).await.expect("later");
        let p = load(&db).await.expect("load");
        assert_eq!(p.stage_id.as_deref(), Some("you"));
        assert!(p.later_at.is_some());

        set_later(&db, false).await.expect("reopen");
        set_complete(&db, true).await.expect("complete");
        let p = load(&db).await.expect("load");
        assert_eq!(p.later_at, None);
        assert!(p.complete);
        assert!(
            profile::read(&db)
                .await
                .expect("read")
                .expect("row")
                .onboarding_complete
        );

        db.close().await;
        drop(db);
        let _ = std::fs::remove_dir_all(dir);
    }
}
