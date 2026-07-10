//! `LibSQL` adapter for relational data
//!
//! Handles: users, settings, projects, KV/config (chat lives in engine user schema)
//! This is the "clean" queryable layer for UI and cross-project data.
//!
//! # P0: Boot Never Freezes
//!
//! `turso::Connection` (0.4.x) FORBIDS concurrent statement execution — a
//! second statement while one is in flight fails with
//! "concurrent use forbidden" (observed 2026-07-09 breaking the chat
//! session list and startup KV reads racing each other). turso is not
//! libsql: there is no internal per-statement locking to lean on.
//!
//! The adapter therefore owns a `tokio::sync::Mutex` around the connection
//! and holds it strictly per statement, INSIDE each method: acquire → run →
//! fully consume rows → release. Guards never escape the adapter and never
//! cross a caller-owned await point — that caller-held-guard pattern is
//! what made the earlier adapter-level `RwLock` a deadlock risk, not
//! method-local locking. If per-statement serialization ever becomes a
//! measured bottleneck, the upgrade seam is a small multi-connection pool
//! (`db.connect()` per worker), not a shared unlocked connection.

use crate::traits::{PersistenceAdapter, SqlAdapter, SqlRow, SqlValue};
use anyhow::{Context, Result};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;

/// `LibSQL` database adapter.
///
/// Serialized: all statements funnel through a method-local
/// `tokio::sync::Mutex` acquire — see the module header for why turso
/// requires this. Cloning the adapter is not supported; share it via
/// `Arc` like every service does.
pub struct TursoAdapter {
    #[allow(dead_code)] // Kept for potential reconnection
    db: Arc<turso::Database>,
    conn: Mutex<turso::Connection>,
}

impl TursoAdapter {
    /// Open or create database at path with an explicit schema.
    ///
    /// Callers MUST supply a schema appropriate to the scope they're
    /// opening — there is no "default" schema the adapter imposes.
    /// The engine layer applies scope-specific schemas
    /// (`SYSTEM_SCHEMA` / `USER_SCHEMA`) at boot; tests supply their
    /// own minimal schema next to the test module.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    #[tracing::instrument(skip(schema), fields(path = %path.display(), schema_len = schema.len()), err)]
    pub async fn open_with_schema(path: &Path, schema: &str) -> Result<Self> {
        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).context("Failed to create database directory")?;
        }

        let db =
            turso::Builder::new_local(path.to_str().context("database path is not valid UTF-8")?)
                .build()
                .await
                .context("Failed to open turso database")?;

        let conn = db
            .connect()
            .context("Failed to connect to LibSQL database")?;

        let adapter = Self {
            db: Arc::new(db),
            conn: Mutex::new(conn),
        };

        // Initialize with provided schema
        adapter.init_schema(schema).await?;

        Ok(adapter)
    }

    /// Initialize the database schema.
    async fn init_schema(&self, schema: &str) -> Result<()> {
        self.conn
            .lock()
            .await
            .execute_batch(schema)
            .await
            .context("Failed to initialize LibSQL schema")?;
        Ok(())
    }

    /// Graceful shutdown — checkpoint WAL and release the connection.
    ///
    /// `LibSQL` uses WAL mode by default. Checkpointing before close ensures
    /// all data is flushed to the main database file and file locks are
    /// released cleanly for the next process.
    pub async fn close(&self) {
        tracing::debug!("LibSQL: checkpointing WAL");
        // TRUNCATE mode: checkpoint and then truncate the WAL file to zero bytes.
        // This is the cleanest state for the next process to open the database.
        if let Err(e) = self
            .conn
            .lock()
            .await
            .execute("PRAGMA wal_checkpoint(TRUNCATE)", ())
            .await
        {
            tracing::warn!(error = %e, "LibSQL WAL checkpoint failed (non-fatal)");
        }
        tracing::debug!("LibSQL: connection closed");
    }

    /// Health check — executes `SELECT 1`.
    ///
    /// # Errors
    /// Returns error if the database is unreachable.
    #[tracing::instrument(skip(self), err)]
    pub async fn ping(&self) -> Result<()> {
        let conn = self.conn.lock().await;
        let mut rows = conn
            .query("SELECT 1", ())
            .await
            .context("LibSQL ping failed")?;
        // Consume the single row to complete the query
        let _ = rows.next().await;
        Ok(())
    }

    /// Execute one SQL statement with bound parameters (for example `turso::params![..]`).
    ///
    /// # Errors
    /// Returns an error if `LibSQL` rejects the statement.
    pub async fn execute_bound(
        &self,
        sql: &str,
        params: impl turso::params::IntoParams + Send,
    ) -> Result<u64> {
        let affected = self
            .conn
            .lock()
            .await
            .execute(sql, params)
            .await
            .with_context(|| format!("LibSQL execute failed: {sql}"))?;
        Ok(affected)
    }
}

impl PersistenceAdapter for TursoAdapter {
    async fn set(&self, key: &str, value: &[u8]) -> Result<()> {
        self.conn
            .lock()
            .await
            .execute(
                "INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, unixepoch())",
                turso::params![key, value],
            )
            .await
            .context("Failed to set value in LibSQL")?;
        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let conn = self.conn.lock().await;
        let mut rows = conn
            .query(
                "SELECT value FROM kv_store WHERE key = ?",
                turso::params![key],
            )
            .await
            .context("Failed to query LibSQL")?;

        if let Some(row) = rows.next().await? {
            let value: Vec<u8> = row.get(0)?;
            Ok(Some(value))
        } else {
            Ok(None)
        }
    }

    async fn delete(&self, key: &str) -> Result<bool> {
        let affected = self
            .conn
            .lock()
            .await
            .execute("DELETE FROM kv_store WHERE key = ?", turso::params![key])
            .await
            .context("Failed to delete from LibSQL")?;
        Ok(affected > 0)
    }

    async fn exists(&self, key: &str) -> Result<bool> {
        let conn = self.conn.lock().await;
        let mut rows = conn
            .query(
                "SELECT 1 FROM kv_store WHERE key = ? LIMIT 1",
                turso::params![key],
            )
            .await
            .context("Failed to check existence in LibSQL")?;
        Ok(rows.next().await?.is_some())
    }
}

#[async_trait::async_trait]
impl SqlAdapter for TursoAdapter {
    #[tracing::instrument(skip(self, params), fields(sql_preview = %sql.chars().take(80).collect::<String>(), param_count = params.len()), err)]
    async fn query(&self, sql: &str, params: &[&str]) -> Result<Vec<SqlRow>> {
        // Convert params to libsql format
        let params: Vec<turso::Value> = params
            .iter()
            .map(|s| turso::Value::from((*s).to_string()))
            .collect();

        // The guard spans row consumption too — `Rows` streams from the
        // connection, so releasing early would readmit the concurrent-use
        // race mid-iteration.
        let conn = self.conn.lock().await;
        let mut rows = conn
            .query(sql, params)
            .await
            .context("Failed to execute query")?;

        let mut results = Vec::new();
        while let Some(row) = rows.next().await? {
            // turso's `Row::get_value` panics on an out-of-bounds column index
            // — turso 0.4.4 `rows.rs:51` does a raw `self.values[index]` with no
            // bounds check, unlike libsql which returned `Err` past the last
            // column. Probing a fixed `0..32` therefore PANICS on the first
            // out-of-range column and unwinds the whole caller (this crashed boot
            // inside `knowledge::sync`). Bound the loop by the actual column count.
            let col_count = row.column_count();
            let mut row_values: SqlRow = Vec::with_capacity(col_count);
            for i in 0..col_count {
                match row.get_value(i)? {
                    turso::Value::Null => row_values.push(SqlValue::Null),
                    turso::Value::Integer(v) => row_values.push(SqlValue::Integer(v)),
                    turso::Value::Real(v) => row_values.push(SqlValue::Real(v)),
                    turso::Value::Text(v) => row_values.push(SqlValue::Text(v)),
                    turso::Value::Blob(v) => row_values.push(SqlValue::Blob(v)),
                }
            }
            results.push(row_values);
        }
        Ok(results)
    }

    #[tracing::instrument(skip(self, params), fields(sql_preview = %sql.chars().take(80).collect::<String>(), param_count = params.len()), err)]
    async fn execute(&self, sql: &str, params: &[&str]) -> Result<u64> {
        let params: Vec<turso::Value> = params
            .iter()
            .map(|s| turso::Value::from((*s).to_string()))
            .collect();

        let affected = self
            .conn
            .lock()
            .await
            .execute(sql, params)
            .await
            .context("Failed to execute statement")?;
        Ok(affected)
    }

    #[tracing::instrument(skip(self, sql), fields(sql_len = sql.len()), err)]
    async fn execute_batch(&self, sql: &str) -> Result<()> {
        self.conn
            .lock()
            .await
            .execute_batch(sql)
            .await
            .context("Failed to execute batch")?;
        Ok(())
    }
}

// Schema constants are NOT defined here. The adapter is
// schema-agnostic: every caller supplies the schema appropriate to
// its scope (engine: `SYSTEM_SCHEMA` / `USER_SCHEMA`; tests:
// `MINIMAL_TEST_SCHEMA` in the cfg(test) module below).

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    /// Minimal schema for in-crate smoke tests of the libsql
    /// adapter. Replaces the prior `CORE_SCHEMA` which was
    /// referenced only by the now-deleted no-schema `open()`
    /// shortcut and the orphan `PersistenceLayer` wrapper. Keeps
    /// the kv + config + projects shape tests want without
    /// implying any "default" production schema.
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

    /// Build a unique throwaway path under the OS temp dir.
    /// Stays stdlib-only so the test doesn't drag in `tempfile`.
    fn unique_test_path() -> std::path::PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        std::env::temp_dir()
            .join(format!("devpulse-libsql-test-{nanos}"))
            .join("nested")
            .join("test.db")
    }

    #[tokio::test]
    async fn open_with_schema_creates_dir_and_runs_ddl() {
        let path = unique_test_path();
        // Best-effort cleanup at start so a prior crashed run doesn't poison this one.
        let _ = std::fs::remove_dir_all(path.parent().unwrap().parent().unwrap());

        let adapter = TursoAdapter::open_with_schema(&path, MINIMAL_TEST_SCHEMA)
            .await
            .expect("open_with_schema should succeed on a fresh path");

        // Tables exist + are queryable through the serialized adapter API.
        // `kv_store` is the canonical signal-store table — every test schema
        // variant carries it.
        let rows = adapter
            .query("SELECT count(*) FROM kv_store", &[])
            .await
            .expect("query against MINIMAL_TEST_SCHEMA tables should succeed");
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0][0], SqlValue::Integer(0));

        adapter.ping().await.expect("ping should succeed");

        // Cleanup — best-effort. WAL flush + drop happens above.
        adapter.close().await;
        drop(adapter);
        let _ = std::fs::remove_dir_all(path.parent().unwrap().parent().unwrap());
    }

    /// Regression: turso forbids concurrent statement use on one
    /// connection. Fire a burst of parallel reads+writes through the
    /// adapter — with method-local serialization every one must succeed;
    /// without it this reproduces "concurrent use forbidden".
    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    async fn concurrent_ops_are_serialized_not_rejected() {
        let path = unique_test_path();
        let _ = std::fs::remove_dir_all(path.parent().unwrap().parent().unwrap());

        let adapter = std::sync::Arc::new(
            TursoAdapter::open_with_schema(&path, MINIMAL_TEST_SCHEMA)
                .await
                .expect("open_with_schema should succeed on a fresh path"),
        );

        let mut tasks = tokio::task::JoinSet::new();
        for i in 0..16u32 {
            let a = adapter.clone();
            tasks.spawn(async move {
                let key = format!("k{i}");
                a.set(&key, b"v").await?;
                let got = a.get(&key).await?;
                anyhow::ensure!(got.as_deref() == Some(b"v".as_slice()), "readback mismatch");
                a.query("SELECT count(*) FROM kv_store", &[]).await?;
                Ok::<(), anyhow::Error>(())
            });
        }
        while let Some(res) = tasks.join_next().await {
            res.expect("task must not panic")
                .expect("no operation may fail with concurrent use forbidden");
        }

        adapter.close().await;
        drop(adapter);
        let _ = std::fs::remove_dir_all(path.parent().unwrap().parent().unwrap());
    }
}
