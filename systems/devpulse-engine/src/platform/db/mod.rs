//! Versioned schema migrations for `DevPulse`'s Turso databases.
//!
//! Each database scope (system, user, project) has a folder of numbered SQL
//! files under `systems/devpulse-engine/migrations/<scope>/NNNN_name.sql`.
//! `build.rs` finds them by convention (the `sqlx::migrate!` / refinery
//! `embed_migrations!` pattern) and embeds them in version order.
//!
//! On open, [`migrate`] applies every migration the database has not seen,
//! each inside one transaction together with its `schema_migrations` record,
//! so a database is never left half-migrated. A failing migration stops the
//! open with its version and name in the error. A database that has applied
//! a migration this build does not know (opened by a newer build) is refused
//! rather than guessed at.

pub mod editor;

use anyhow::{bail, Context, Result};
use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlValue, TursoAdapter};
use serde::Serialize;
use specta::Type;

/// One embedded migration.
#[derive(Debug, Clone, Copy)]
pub struct Migration {
    /// The `NNNN` from the file name.
    pub version: u32,
    /// The `name` from the file name (lowercase `snake_case`).
    pub name: &'static str,
    /// The SQL to apply.
    pub sql: &'static str,
}

/// The embedded migration lists: `SYSTEM`, `USER`, `PROJECT`.
pub mod migrations {
    use super::Migration;
    include!(concat!(env!("OUT_DIR"), "/migrations.rs"));
}

/// A migration recorded as applied in a database.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AppliedMigration {
    /// Migration version.
    pub version: u32,
    /// Migration name.
    pub name: String,
    /// Unix timestamp when it was applied.
    pub applied_at: i64,
}

/// A migration this build ships, and when the database applied it.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MigrationStatus {
    /// Migration version.
    pub version: u32,
    /// Migration name.
    pub name: String,
    /// Unix timestamp when it was applied; `None` while pending.
    pub applied_at: Option<i64>,
}

const HISTORY_TABLE: &str = "CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INTEGER PRIMARY KEY,
    name       TEXT    NOT NULL,
    applied_at INTEGER NOT NULL DEFAULT (unixepoch())
);";

/// Apply every pending migration in version order. Returns how many were
/// applied.
///
/// # Errors
/// Returns an error if the history cannot be read, the database has applied
/// a migration this build does not know, or a migration fails (it is rolled
/// back and named in the error).
pub async fn migrate(adapter: &TursoAdapter, migrations: &[Migration]) -> Result<usize> {
    adapter
        .execute_batch(HISTORY_TABLE)
        .await
        .context("create schema_migrations")?;
    let applied = history(adapter).await?;

    for done in &applied {
        let known = migrations
            .iter()
            .any(|m| m.version == done.version && m.name == done.name);
        if !known {
            bail!(
                "database has migration {:04}_{} applied, which this build does not know — \
                 it was opened by a newer or different build",
                done.version,
                done.name
            );
        }
    }

    let mut count = 0;
    for migration in migrations {
        if applied.iter().any(|done| done.version == migration.version) {
            continue;
        }
        apply(adapter, migration).await?;
        tracing::info!(
            target: "db.migrate",
            version = migration.version,
            name = migration.name,
            "migration applied"
        );
        count += 1;
    }
    Ok(count)
}

/// Run one migration and record it, in a single transaction.
async fn apply(adapter: &TursoAdapter, migration: &Migration) -> Result<()> {
    let label = format!("{:04}_{}", migration.version, migration.name);
    let conn = adapter.connect()?;
    // The name is validated as lowercase snake_case at build time, so it is
    // safe to embed in the batch.
    let batch = format!(
        "BEGIN;\n{sql}\n;\nINSERT INTO schema_migrations (version, name) VALUES ({version}, '{name}');\nCOMMIT;",
        sql = migration.sql,
        version = migration.version,
        name = migration.name,
    );
    if let Err(e) = conn.execute_batch(&batch).await {
        if let Err(rollback) = conn.execute_batch("ROLLBACK;").await {
            tracing::warn!(target: "db.migrate", migration = %label, error = %rollback, "rollback after failed migration also failed");
        }
        return Err(anyhow::Error::from(e).context(format!("migration {label} failed")));
    }
    Ok(())
}

/// Every migration this build ships for a database, with when it was applied.
///
/// # Errors
/// Returns an error if the history cannot be read.
pub async fn status(
    adapter: &TursoAdapter,
    migrations: &[Migration],
) -> Result<Vec<MigrationStatus>> {
    let applied = history(adapter).await?;
    Ok(migrations
        .iter()
        .map(|m| MigrationStatus {
            version: m.version,
            name: m.name.to_owned(),
            applied_at: applied
                .iter()
                .find(|a| a.version == m.version)
                .map(|a| a.applied_at),
        })
        .collect())
}

/// The migrations recorded as applied, in version order. Empty when the
/// database has never been migrated.
///
/// # Errors
/// Returns an error if the history table exists but cannot be read.
pub async fn history(adapter: &TursoAdapter) -> Result<Vec<AppliedMigration>> {
    let exists = adapter
        .query(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
            &[],
        )
        .await
        .context("look up schema_migrations")?;
    if exists.is_empty() {
        return Ok(Vec::new());
    }
    let rows = adapter
        .query(
            "SELECT version, name, applied_at FROM schema_migrations ORDER BY version",
            &[],
        )
        .await
        .context("read schema_migrations")?;
    rows.into_iter()
        .map(|row| match row.as_slice() {
            [SqlValue::Integer(version), SqlValue::Text(name), SqlValue::Integer(applied_at)] => {
                Ok(AppliedMigration {
                    version: u32::try_from(*version).context("migration version out of range")?,
                    name: name.clone(),
                    applied_at: *applied_at,
                })
            }
            other => bail!("unexpected schema_migrations row: {other:?}"),
        })
        .collect()
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use devpulse_clyffy::cortex::persistence::TursoOptions;

    const BASE: &str = "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, label TEXT);";

    async fn open(tag: &str) -> (TursoAdapter, std::path::PathBuf) {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let dir = std::env::temp_dir().join(format!("devpulse-migrate-{tag}-{nanos}"));
        let adapter =
            TursoAdapter::open_with_schema(&dir.join("t.db"), BASE, TursoOptions::default())
                .await
                .expect("open");
        (adapter, dir)
    }

    const M1: Migration = Migration {
        version: 1,
        name: "add_items",
        sql: "INSERT INTO items (label) VALUES ('one');",
    };
    const M2: Migration = Migration {
        version: 2,
        name: "rename_items",
        sql: "UPDATE items SET label = 'uno' WHERE label = 'one';",
    };

    #[tokio::test]
    async fn applies_in_order_once_and_records_history() {
        let (adapter, dir) = open("order").await;
        assert_eq!(migrate(&adapter, &[M1, M2]).await.expect("migrate"), 2);
        assert_eq!(migrate(&adapter, &[M1, M2]).await.expect("re-run"), 0);

        let rows = adapter
            .query("SELECT label FROM items", &[])
            .await
            .expect("items");
        assert_eq!(rows, vec![vec![SqlValue::Text("uno".into())]]);
        let applied: Vec<_> = history(&adapter)
            .await
            .expect("history")
            .into_iter()
            .map(|m| (m.version, m.name))
            .collect();
        assert_eq!(
            applied,
            vec![(1, "add_items".into()), (2, "rename_items".into())]
        );
        let shipped = status(&adapter, &[M1, M2]).await.expect("status");
        assert!(shipped.iter().all(|m| m.applied_at.is_some()));

        adapter.close().await;
        drop(adapter);
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn failed_migration_rolls_back_and_names_itself() {
        let (adapter, dir) = open("fail").await;
        let broken = Migration {
            version: 1,
            name: "broken",
            sql: "INSERT INTO items (label) VALUES ('half'); INSERT INTO missing_table VALUES (1);",
        };
        let err = migrate(&adapter, &[broken]).await.expect_err("must fail");
        assert!(
            format!("{err:#}").contains("0001_broken"),
            "error names the migration: {err:#}"
        );

        let rows = adapter
            .query("SELECT count(*) FROM items", &[])
            .await
            .expect("count");
        assert_eq!(rows, vec![vec![SqlValue::Integer(0)]], "no partial change");
        assert!(
            history(&adapter).await.expect("history").is_empty(),
            "nothing recorded"
        );

        adapter.close().await;
        drop(adapter);
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn refuses_a_database_migrated_by_an_unknown_build() {
        let (adapter, dir) = open("unknown").await;
        migrate(&adapter, &[M1, M2])
            .await
            .expect("newer build migrates");
        let err = migrate(&adapter, &[M1])
            .await
            .expect_err("older build must refuse");
        assert!(format!("{err:#}").contains("0002_rename_items"), "{err:#}");

        adapter.close().await;
        drop(adapter);
        let _ = std::fs::remove_dir_all(dir);
    }

    #[test]
    fn embedded_user_migrations_are_ordered() {
        let versions: Vec<u32> = migrations::USER.iter().map(|m| m.version).collect();
        let mut sorted = versions.clone();
        sorted.sort_unstable();
        sorted.dedup();
        assert_eq!(versions, sorted);
        assert!(migrations::USER
            .iter()
            .any(|m| m.name == "clear_seeded_profile_values"));
    }
}
