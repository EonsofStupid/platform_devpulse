//! `LibSQL` adapter for relational data
//!
//! Handles: users, settings, projects, KV/config (chat lives in engine user schema)
//! This is the "clean" queryable layer for UI and cross-project data.
//!
//! # P0: Boot Never Freezes
//!
//! `libsql::Connection` is `Clone + Send + Sync` — internally `Arc<dyn Conn>`
//! with its own synchronization. Wrapping it in `tokio::sync::RwLock` serialized
//! every query behind a yield-on-acquire mutex and was a prime deadlock risk
//! whenever a slow query held the read guard while another task wanted to call
//! into the adapter. The RwLock is removed. Callers share the `Connection`
//! directly — libsql owns the per-statement locking inside.

use crate::cortex::persistence::traits::{PersistenceAdapter, SqlAdapter, SqlRow, SqlValue};
use anyhow::{Context, Result};
use std::path::Path;
use std::sync::Arc;

/// `LibSQL` database adapter.
///
/// Lock-free: `libsql::Connection` is internally `Arc<dyn Conn>` and handles
/// its own synchronization. Cloning the adapter or the inner connection is
/// cheap (atomic refcount bump).
pub struct LibSqlAdapter {
    #[allow(dead_code)] // Kept for potential reconnection
    db: Arc<libsql::Database>,
    conn: libsql::Connection,
}

impl LibSqlAdapter {
    /// Open or create database at path with the default core schema.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub async fn open(path: &Path) -> Result<Self> {
        Self::open_with_schema(path, CORE_SCHEMA).await
    }

    /// Open or create database at path with a custom schema.
    ///
    /// The engine layer uses this to apply scope-specific schemas
    /// (system vs user) instead of the default core schema.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    #[tracing::instrument(skip(schema), fields(path = %path.display(), schema_len = schema.len()), err)]
    pub async fn open_with_schema(path: &Path, schema: &str) -> Result<Self> {
        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).context("Failed to create database directory")?;
        }

        let db = libsql::Builder::new_local(path)
            .build()
            .await
            .context("Failed to open LibSQL database")?;

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
    /// Lock-free: returns a borrow of the shared `libsql::Connection`.
    /// Callers can `.query(...).await` / `.execute(...).await` directly.
    pub fn connection(&self) -> &libsql::Connection {
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

    /// Execute one SQL statement with bound parameters (for example `libsql::params![..]`).
    ///
    /// # Errors
    /// Returns an error if LibSQL rejects the statement.
    pub async fn execute_bound(
        &self,
        sql: &str,
        params: impl libsql::params::IntoParams + Send,
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
                libsql::params![key, value],
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
                libsql::params![key],
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
            .execute("DELETE FROM kv_store WHERE key = ?", libsql::params![key])
            .await
            .context("Failed to delete from LibSQL")?;
        Ok(affected > 0)
    }

    async fn exists(&self, key: &str) -> Result<bool> {
        let mut rows = self
            .conn
            .query(
                "SELECT 1 FROM kv_store WHERE key = ? LIMIT 1",
                libsql::params![key],
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
        let params: Vec<libsql::Value> = params
            .iter()
            .map(|s| libsql::Value::from((*s).to_string()))
            .collect();

        let mut rows = self
            .conn
            .query(sql, params)
            .await
            .context("Failed to execute query")?;

        let mut results = Vec::new();
        while let Some(row) = rows.next().await? {
            let mut row_values: SqlRow = Vec::new();
            // LibSQL doesn't expose column count easily, so we try columns until failure
            for i in 0..32 {
                match row.get_value(i) {
                    Ok(libsql::Value::Null) => row_values.push(SqlValue::Null),
                    Ok(libsql::Value::Integer(v)) => row_values.push(SqlValue::Integer(v)),
                    Ok(libsql::Value::Real(v)) => row_values.push(SqlValue::Real(v)),
                    Ok(libsql::Value::Text(v)) => row_values.push(SqlValue::Text(v)),
                    Ok(libsql::Value::Blob(v)) => row_values.push(SqlValue::Blob(v)),
                    Err(_) => break,
                }
            }
            results.push(row_values);
        }
        Ok(results)
    }

    #[tracing::instrument(skip(self, params), fields(sql_preview = %sql.chars().take(80).collect::<String>(), param_count = params.len()), err)]
    async fn execute(&self, sql: &str, params: &[&str]) -> Result<u64> {
        let params: Vec<libsql::Value> = params
            .iter()
            .map(|s| libsql::Value::from((*s).to_string()))
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

/// Core schema for `LibSQL`.
/// KV store for signal-based access + structured tables.
const CORE_SCHEMA: &str = r"
-- Key-value store for signal-based access
CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value BLOB NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_kv_updated ON kv_store(updated_at);

-- Projects registry
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    root_path TEXT NOT NULL UNIQUE,
    project_type TEXT NOT NULL DEFAULT 'generic',
    created_at INTEGER DEFAULT (unixepoch()),
    last_accessed INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(root_path);

-- Chat persistence lives in the engine user-scoped schema (`turns` / `sessions`).
-- The kernel `CORE_SCHEMA` intentionally does not duplicate those tables.

-- Platform config
CREATE TABLE IF NOT EXISTS platform_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_config_category ON platform_config(category);

-- User config
CREATE TABLE IF NOT EXISTS user_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);
";
