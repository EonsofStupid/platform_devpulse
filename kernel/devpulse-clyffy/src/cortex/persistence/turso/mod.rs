//! Turso adapter for relational data — the `DevPulse` SSOT database.
//!
//! Handles: users, settings, projects, KV/config (chat lives in the engine
//! user schema). This is the queryable layer for UI and cross-project data.
//!
//! Turso is a pure-Rust, SQLite-file-compatible database (MVCC
//! `BEGIN CONCURRENT`, vector search). Owner decision 2026-07-01.
//!
//! # One connection per operation
//!
//! A Turso connection runs one operation at a time — overlapping use is a
//! `Misuse` error ("concurrent use forbidden"). The adapter therefore holds
//! the shared [`turso::Database`] (which pools connections internally) and
//! opens a connection for each operation via [`TursoAdapter::connect`].
//! Every connection gets a busy timeout, so a writer waiting on another
//! writer's WAL lock waits instead of failing — the standard SQLite-family
//! concurrency model.

use crate::cortex::persistence::traits::{PersistenceAdapter, SqlAdapter, SqlRow, SqlValue};
use anyhow::{bail, Context, Result};
use std::path::Path;
use std::time::Duration;

/// Connection settings for a Turso database. Values come from the service
/// configuration; [`Default`] carries the shipped suggestions.
#[derive(Debug, Clone, Copy)]
pub struct TursoOptions {
    /// How long an operation waits for a lock held by another connection
    /// before reporting busy.
    pub busy_timeout: Duration,
}

impl Default for TursoOptions {
    fn default() -> Self {
        Self {
            busy_timeout: Duration::from_millis(5_000),
        }
    }
}

/// Turso database adapter.
///
/// Cloning the inner [`turso::Database`] is cheap (atomic refcount bump).
pub struct TursoAdapter {
    db: turso::Database,
    options: TursoOptions,
}

impl TursoAdapter {
    /// Open or create the database at `path` with an explicit schema.
    ///
    /// Callers MUST supply a schema appropriate to the scope they're
    /// opening — there is no "default" schema the kernel imposes. The
    /// engine applies scope-specific schemas (`SYSTEM_SCHEMA` /
    /// `USER_SCHEMA`) at boot; tests supply their own minimal schema.
    ///
    /// # Errors
    /// Returns an error if the database cannot be opened or the schema fails to apply.
    #[tracing::instrument(skip(schema, options), fields(path = %path.display(), schema_len = schema.len()), err)]
    pub async fn open_with_schema(
        path: &Path,
        schema: &str,
        options: TursoOptions,
    ) -> Result<Self> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).context("Failed to create database directory")?;
        }

        let path_str = path
            .to_str()
            .with_context(|| format!("database path is not valid UTF-8: {}", path.display()))?;
        let db = turso::Builder::new_local(path_str)
            .build()
            .await
            .context("Failed to open Turso database")?;

        let adapter = Self { db, options };
        adapter.init_schema(schema).await?;
        Ok(adapter)
    }

    /// Apply the schema.
    async fn init_schema(&self, schema: &str) -> Result<()> {
        self.connect()?
            .execute_batch(schema)
            .await
            .context("Failed to initialize Turso schema")?;
        Ok(())
    }

    /// Open a connection for one operation (or one transaction). Callers
    /// that need the full Turso API (`.query(...)`, `.execute(...)`,
    /// `.prepare(...)`) use this; the connection returns to Turso's pool
    /// when dropped.
    ///
    /// # Errors
    /// Returns an error if Turso cannot open a connection.
    pub fn connect(&self) -> Result<turso::Connection> {
        let conn = self
            .db
            .connect()
            .context("Failed to open a Turso connection")?;
        conn.busy_timeout(self.options.busy_timeout)
            .context("Failed to set the Turso busy timeout")?;
        Ok(conn)
    }

    /// Graceful shutdown — checkpoint the WAL so the data is in the main
    /// database file and the next process opens a clean state.
    pub async fn close(&self) {
        tracing::debug!("Turso: checkpointing WAL");
        let checkpoint = match self.connect() {
            Ok(conn) => conn
                .execute("PRAGMA wal_checkpoint(TRUNCATE)", ())
                .await
                .map(|_| ())
                .map_err(anyhow::Error::from),
            Err(e) => Err(e),
        };
        if let Err(e) = checkpoint {
            tracing::warn!(error = %format!("{e:#}"), "Turso WAL checkpoint failed (non-fatal)");
        }
        tracing::debug!("Turso: closed");
    }

    /// Health check — runs `SELECT 1`.
    ///
    /// # Errors
    /// Returns an error if the database is unreachable.
    #[tracing::instrument(skip(self), err)]
    pub async fn ping(&self) -> Result<()> {
        // Hold the connection until the rows are consumed: a dropped
        // connection returns to the pool while the rows still read it.
        let conn = self.connect()?;
        let mut rows = conn
            .query("SELECT 1", ())
            .await
            .context("Turso ping failed")?;
        rows.next().await.context("Turso ping: read row")?;
        Ok(())
    }

    /// Execute one SQL statement with bound parameters (for example `turso::params![..]`).
    ///
    /// # Errors
    /// Returns an error if Turso rejects the statement.
    pub async fn execute_bound(
        &self,
        sql: &str,
        params: impl turso::IntoParams + Send,
    ) -> Result<u64> {
        self.connect()?
            .execute(sql, params)
            .await
            .with_context(|| format!("Turso execute failed: {sql}"))
    }
}

impl PersistenceAdapter for TursoAdapter {
    async fn set(&self, key: &str, value: &[u8]) -> Result<()> {
        self.connect()?
            .execute(
                "INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, unixepoch())",
                turso::params![key, value],
            )
            .await
            .context("Failed to set value in Turso")?;
        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        // Hold the connection until the rows are consumed: a dropped
        // connection returns to the pool while the rows still read it.
        let conn = self.connect()?;
        let mut rows = conn
            .query(
                "SELECT value FROM kv_store WHERE key = ?",
                turso::params![key],
            )
            .await
            .context("Failed to query Turso")?;

        let Some(row) = rows.next().await? else {
            return Ok(None);
        };
        match row.get_value(0)? {
            turso::Value::Blob(bytes) => Ok(Some(bytes)),
            other => bail!("kv_store.value for {key:?} is not a blob: {other:?}"),
        }
    }

    async fn delete(&self, key: &str) -> Result<bool> {
        let affected = self
            .connect()?
            .execute("DELETE FROM kv_store WHERE key = ?", turso::params![key])
            .await
            .context("Failed to delete from Turso")?;
        Ok(affected > 0)
    }

    async fn exists(&self, key: &str) -> Result<bool> {
        // Hold the connection until the rows are consumed: a dropped
        // connection returns to the pool while the rows still read it.
        let conn = self.connect()?;
        let mut rows = conn
            .query(
                "SELECT 1 FROM kv_store WHERE key = ? LIMIT 1",
                turso::params![key],
            )
            .await
            .context("Failed to check existence in Turso")?;
        Ok(rows.next().await?.is_some())
    }
}

/// Convert one Turso value into the adapter-neutral [`SqlValue`].
fn to_sql_value(value: turso::Value) -> SqlValue {
    match value {
        turso::Value::Null => SqlValue::Null,
        turso::Value::Integer(v) => SqlValue::Integer(v),
        turso::Value::Real(v) => SqlValue::Real(v),
        turso::Value::Text(v) => SqlValue::Text(v),
        turso::Value::Blob(v) => SqlValue::Blob(v),
    }
}

#[async_trait::async_trait]
impl SqlAdapter for TursoAdapter {
    #[tracing::instrument(skip(self, params), fields(sql_preview = %sql.chars().take(80).collect::<String>(), param_count = params.len()), err)]
    async fn query(&self, sql: &str, params: &[&str]) -> Result<Vec<SqlRow>> {
        let params: Vec<turso::Value> = params.iter().map(|s| turso::Value::from(*s)).collect();
        // Hold the connection until the rows are consumed: a dropped
        // connection returns to the pool while the rows still read it.
        let conn = self.connect()?;
        let mut rows = conn
            .query(sql, params)
            .await
            .context("Failed to execute query")?;

        let mut results = Vec::new();
        while let Some(row) = rows.next().await? {
            let row_values: SqlRow = (0..row.column_count())
                .map(|i| row.get_value(i).map(to_sql_value))
                .collect::<turso::Result<_>>()
                .context("Failed to read row")?;
            results.push(row_values);
        }
        Ok(results)
    }

    #[tracing::instrument(skip(self, params), fields(sql_preview = %sql.chars().take(80).collect::<String>(), param_count = params.len()), err)]
    async fn execute(&self, sql: &str, params: &[&str]) -> Result<u64> {
        let params: Vec<turso::Value> = params.iter().map(|s| turso::Value::from(*s)).collect();
        self.connect()?
            .execute(sql, params)
            .await
            .context("Failed to execute statement")
    }

    #[tracing::instrument(skip(self, sql), fields(sql_len = sql.len()), err)]
    async fn execute_batch(&self, sql: &str) -> Result<()> {
        self.connect()?
            .execute_batch(sql)
            .await
            .context("Failed to execute batch")
    }
}

// Schema constants are NOT defined here. The adapter is schema-agnostic:
// every caller supplies the schema for its scope (engine: `SYSTEM_SCHEMA` /
// `USER_SCHEMA`; tests: `MINIMAL_TEST_SCHEMA` below).

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    /// Minimal schema for adapter smoke tests — the kv + config + projects
    /// shape, without implying any production schema.
    const MINIMAL_TEST_SCHEMA: &str = r"
CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value BLOB NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    root_path TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS platform_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT NOT NULL
);
";

    /// A unique throwaway path under the OS temp dir.
    fn unique_test_path() -> std::path::PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        std::env::temp_dir()
            .join(format!("devpulse-turso-test-{nanos}"))
            .join("nested")
            .join("test.db")
    }

    #[tokio::test]
    async fn open_with_schema_creates_dir_and_runs_ddl() {
        let path = unique_test_path();
        let root = path.parent().unwrap().parent().unwrap().to_path_buf();
        let _ = std::fs::remove_dir_all(&root);

        let adapter =
            TursoAdapter::open_with_schema(&path, MINIMAL_TEST_SCHEMA, TursoOptions::default())
                .await
                .expect("open_with_schema should succeed on a fresh path");

        let conn = adapter.connect().expect("connect");
        let mut rows = conn
            .query("SELECT count(*) FROM kv_store", ())
            .await
            .expect("query against MINIMAL_TEST_SCHEMA tables should succeed");
        let row = rows.next().await.unwrap().expect("at least one row");
        assert_eq!(row.get_value(0).unwrap(), turso::Value::Integer(0));

        adapter.ping().await.expect("ping should succeed");

        adapter.close().await;
        drop(adapter);
        let _ = std::fs::remove_dir_all(&root);
    }

    #[tokio::test]
    async fn kv_roundtrip_and_full_width_rows() {
        let path = unique_test_path();
        let root = path.parent().unwrap().parent().unwrap().to_path_buf();
        let _ = std::fs::remove_dir_all(&root);
        let adapter =
            TursoAdapter::open_with_schema(&path, MINIMAL_TEST_SCHEMA, TursoOptions::default())
                .await
                .expect("open");

        adapter.set("k", b"value").await.expect("set");
        assert_eq!(
            adapter.get("k").await.expect("get"),
            Some(b"value".to_vec())
        );
        assert!(adapter.exists("k").await.expect("exists"));
        assert!(adapter.delete("k").await.expect("delete"));
        assert_eq!(adapter.get("k").await.expect("get after delete"), None);

        // Every column comes back, however wide the row is.
        let wide = (0..40)
            .map(|i| format!("{i} AS c{i}"))
            .collect::<Vec<_>>()
            .join(", ");
        let rows = adapter
            .query(&format!("SELECT {wide}"), &[])
            .await
            .expect("wide select");
        assert_eq!(rows.first().map(Vec::len), Some(40));

        adapter.close().await;
        drop(adapter);
        let _ = std::fs::remove_dir_all(&root);
    }

    /// Reproduces the live failure: many tasks reading and writing through
    /// one adapter at the same time must never hit "concurrent use forbidden".
    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    async fn overlapping_operations_share_one_adapter() {
        let path = unique_test_path();
        let root = path.parent().unwrap().parent().unwrap().to_path_buf();
        let _ = std::fs::remove_dir_all(&root);
        let adapter = std::sync::Arc::new(
            TursoAdapter::open_with_schema(&path, MINIMAL_TEST_SCHEMA, TursoOptions::default())
                .await
                .expect("open"),
        );

        let mut tasks = tokio::task::JoinSet::new();
        for i in 0..32 {
            let adapter = adapter.clone();
            tasks.spawn(async move {
                let key = format!("k{i}");
                adapter.set(&key, key.as_bytes()).await?;
                let rows = adapter
                    .query("SELECT key, value FROM kv_store", &[])
                    .await?;
                anyhow::ensure!(!rows.is_empty(), "no rows after write");
                anyhow::ensure!(
                    adapter.get(&key).await? == Some(key.into_bytes()),
                    "readback"
                );
                Ok::<(), anyhow::Error>(())
            });
        }
        while let Some(joined) = tasks.join_next().await {
            joined
                .expect("task panicked")
                .expect("overlapping operation failed");
        }
        let rows = adapter
            .query("SELECT count(*) FROM kv_store", &[])
            .await
            .expect("count");
        assert_eq!(
            rows.first().and_then(|r| r.first()),
            Some(&SqlValue::Integer(32))
        );

        adapter.close().await;
        drop(adapter);
        let _ = std::fs::remove_dir_all(&root);
    }
}
