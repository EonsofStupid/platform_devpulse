//! `LibSQL` adapter for relational data
//!
//! Handles: users, settings, projects, KV/config (chat lives in engine user schema)
//! This is the "clean" queryable layer for UI and cross-project data.

use crate::cortex::persistence::traits::{PersistenceAdapter, SqlAdapter, SqlRow, SqlValue};
use anyhow::{Context, Result};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

/// `LibSQL` database adapter.
pub struct LibSqlAdapter {
    #[allow(dead_code)] // Kept for potential reconnection
    db: Arc<libsql::Database>,
    conn: Arc<RwLock<libsql::Connection>>,
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
            conn: Arc::new(RwLock::new(conn)),
        };

        // Initialize with provided schema
        adapter.init_schema(schema).await?;

        Ok(adapter)
    }

    /// Initialize the database schema.
    async fn init_schema(&self, schema: &str) -> Result<()> {
        let conn = self.conn.read().await;
        conn.execute_batch(schema)
            .await
            .context("Failed to initialize LibSQL schema")?;
        Ok(())
    }

    /// Get a connection for queries
    pub async fn connection(&self) -> tokio::sync::RwLockReadGuard<'_, libsql::Connection> {
        self.conn.read().await
    }

    /// Graceful shutdown — checkpoint WAL and release the connection.
    ///
    /// `LibSQL` uses WAL mode by default. Checkpointing before close ensures
    /// all data is flushed to the main database file and file locks are
    /// released cleanly for the next process.
    pub async fn close(&self) {
        tracing::debug!("LibSQL: checkpointing WAL");
        let conn = self.conn.read().await;
        // TRUNCATE mode: checkpoint and then truncate the WAL file to zero bytes.
        // This is the cleanest state for the next process to open the database.
        if let Err(e) = conn.execute("PRAGMA wal_checkpoint(TRUNCATE)", ()).await {
            tracing::warn!(error = %e, "LibSQL WAL checkpoint failed (non-fatal)");
        }
        drop(conn);
        tracing::debug!("LibSQL: connection closed");
    }

    /// Health check — executes `SELECT 1`.
    ///
    /// # Errors
    /// Returns error if the database is unreachable.
    pub async fn ping(&self) -> Result<()> {
        let conn = self.conn.read().await;
        let mut rows = conn
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
        let conn = self.conn.read().await;
        let affected = conn
            .execute(sql, params)
            .await
            .with_context(|| format!("LibSQL execute failed: {sql}"))?;
        Ok(affected)
    }
}

impl PersistenceAdapter for LibSqlAdapter {
    async fn set(&self, key: &str, value: &[u8]) -> Result<()> {
        let conn = self.conn.read().await;
        conn.execute(
            "INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, unixepoch())",
            libsql::params![key, value],
        )
        .await
        .context("Failed to set value in LibSQL")?;
        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let conn = self.conn.read().await;
        let mut rows = conn
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
        let conn = self.conn.read().await;
        let affected = conn
            .execute("DELETE FROM kv_store WHERE key = ?", libsql::params![key])
            .await
            .context("Failed to delete from LibSQL")?;
        Ok(affected > 0)
    }

    async fn exists(&self, key: &str) -> Result<bool> {
        let conn = self.conn.read().await;
        let mut rows = conn
            .query(
                "SELECT 1 FROM kv_store WHERE key = ? LIMIT 1",
                libsql::params![key],
            )
            .await
            .context("Failed to check existence in LibSQL")?;
        Ok(rows.next().await?.is_some())
    }
}

impl SqlAdapter for LibSqlAdapter {
    async fn query(&self, sql: &str, params: &[&str]) -> Result<Vec<SqlRow>> {
        let conn = self.conn.read().await;

        // Convert params to libsql format
        let params: Vec<libsql::Value> = params
            .iter()
            .map(|s| libsql::Value::from((*s).to_string()))
            .collect();

        let mut rows = conn
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

    async fn execute(&self, sql: &str, params: &[&str]) -> Result<u64> {
        let conn = self.conn.read().await;

        let params: Vec<libsql::Value> = params
            .iter()
            .map(|s| libsql::Value::from((*s).to_string()))
            .collect();

        let affected = conn
            .execute(sql, params)
            .await
            .context("Failed to execute statement")?;
        Ok(affected)
    }

    async fn execute_batch(&self, sql: &str) -> Result<()> {
        let conn = self.conn.read().await;
        conn.execute_batch(sql)
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
