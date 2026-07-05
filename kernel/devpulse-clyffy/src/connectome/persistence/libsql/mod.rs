//! `LibSQL` adapter for relational data
//!
//! Handles: users, settings, projects, KV/config (chat lives in engine user schema)
//! This is the "clean" queryable layer for UI and cross-project data.
//!
//! # P0: Boot Never Freezes
//!
//! `turso::Connection` is `Clone + Send + Sync` — internally `Arc<dyn Conn>`
//! with its own synchronization. Wrapping it in `tokio::sync::RwLock` serialized
//! every query behind a yield-on-acquire mutex and was a prime deadlock risk
//! whenever a slow query held the read guard while another task wanted to call
//! into the adapter. The `RwLock` is removed. Callers share the `Connection`
//! directly — libsql owns the per-statement locking inside.

use crate::connectome::persistence::traits::{PersistenceAdapter, SqlAdapter, SqlRow, SqlValue};
use anyhow::{Context, Result};
use std::path::Path;
use std::sync::Arc;

/// `LibSQL` database adapter.
///
/// Lock-free: `turso::Connection` is internally `Arc<dyn Conn>` and handles
/// its own synchronization. Cloning the adapter or the inner connection is
/// cheap (atomic refcount bump).
pub struct LibSqlAdapter {
    #[allow(dead_code)] // Kept for potential reconnection
    db: Arc<turso::Database>,
    conn: turso::Connection,
}

impl LibSqlAdapter {
    /// Open or create database at path with an explicit schema.
    ///
    /// Callers MUST supply a schema appropriate to the scope they're
    /// opening — there is no "default" schema the kernel imposes.
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
            conn,
        };

        // Initialize with provided schema
        adapter.init_schema(schema).await?;

        Ok(adapter)
    }

    /// Initialize the database schema.
    async fn init_schema(&self, schema: &str) -> Result<()> {
        self.conn
            .execute_batch(schema)
            .await
            .context("Failed to initialize LibSQL schema")?;
        Ok(())
    }

    /// Get a reference to the underlying connection for queries.
    ///
    /// Lock-free: returns a borrow of the shared `turso::Connection`.
    /// Callers can `.query(...).await` / `.execute(...).await` directly.
    pub fn connection(&self) -> &turso::Connection {
        &self.conn
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
        let mut rows = self
            .conn
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
            .execute(sql, params)
            .await
            .with_context(|| format!("LibSQL execute failed: {sql}"))?;
        Ok(affected)
    }
}

impl PersistenceAdapter for LibSqlAdapter {
    async fn set(&self, key: &str, value: &[u8]) -> Result<()> {
        self.conn
            .execute(
                "INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, unixepoch())",
                turso::params![key, value],
            )
            .await
            .context("Failed to set value in LibSQL")?;
        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let mut rows = self
            .conn
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
            .execute("DELETE FROM kv_store WHERE key = ?", turso::params![key])
            .await
            .context("Failed to delete from LibSQL")?;
        Ok(affected > 0)
    }

    async fn exists(&self, key: &str) -> Result<bool> {
        let mut rows = self
            .conn
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
impl SqlAdapter for LibSqlAdapter {
    #[tracing::instrument(skip(self, params), fields(sql_preview = %sql.chars().take(80).collect::<String>(), param_count = params.len()), err)]
    async fn query(&self, sql: &str, params: &[&str]) -> Result<Vec<SqlRow>> {
        // Convert params to libsql format
        let params: Vec<turso::Value> = params
            .iter()
            .map(|s| turso::Value::from((*s).to_string()))
            .collect();

        let mut rows = self
            .conn
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
            .execute(sql, params)
            .await
            .context("Failed to execute statement")?;
        Ok(affected)
    }

    #[tracing::instrument(skip(self, sql), fields(sql_len = sql.len()), err)]
    async fn execute_batch(&self, sql: &str) -> Result<()> {
        self.conn
            .execute_batch(sql)
            .await
            .context("Failed to execute batch")?;
        Ok(())
    }
}

// Schema constants are NOT defined here. The kernel adapter is
// schema-agnostic: every caller supplies the schema appropriate to
// its scope (engine: `SYSTEM_SCHEMA` / `USER_SCHEMA`; tests:
// `MINIMAL_TEST_SCHEMA` in the cfg(test) module below).

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    /// Minimal schema for kernel-side smoke tests of the libsql
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

        let adapter = LibSqlAdapter::open_with_schema(&path, MINIMAL_TEST_SCHEMA)
            .await
            .expect("open_with_schema should succeed on a fresh path");

        // Tables exist + are queryable. `kv_store` is the canonical
        // signal-store table — every test schema variant carries it.
        let mut rows = adapter
            .connection()
            .query("SELECT count(*) FROM kv_store", ())
            .await
            .expect("query against MINIMAL_TEST_SCHEMA tables should succeed");
        let row = rows.next().await.unwrap().expect("at least one row");
        let count: i64 = row.get(0).unwrap();
        assert_eq!(count, 0);

        adapter.ping().await.expect("ping should succeed");

        // Cleanup — best-effort. WAL flush + drop happens above.
        adapter.close().await;
        drop(adapter);
        let _ = std::fs::remove_dir_all(path.parent().unwrap().parent().unwrap());
    }
}
