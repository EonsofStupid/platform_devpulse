//! `DuckDB` adapter for analytics
//!
//! Handles: user analytics, AI metrics, telemetry, OLAP queries
//! Optimized for analytical workloads and columnar storage.

use crate::cortex::persistence::traits::{AnalyticsAdapter, PersistenceAdapter};
use anyhow::{Context, Result};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;

/// `DuckDB` database adapter for analytics.
pub struct DuckDbAdapter {
    conn: Arc<Mutex<duckdb::Connection>>,
}

impl DuckDbAdapter {
    /// Open or create database at path.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub fn open(path: &Path) -> Result<Self> {
        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).context("Failed to create database directory")?;
        }

        let conn = duckdb::Connection::open(path).context("Failed to open DuckDB database")?;

        let adapter = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        // Initialize analytics schema (blocking, DuckDB is sync)
        adapter.init_schema_sync()?;

        Ok(adapter)
    }

    /// Open in-memory database for testing.
    ///
    /// # Errors
    /// Returns error if the in-memory database cannot be created or schema initialization fails.
    pub fn open_in_memory() -> Result<Self> {
        let conn =
            duckdb::Connection::open_in_memory().context("Failed to open in-memory DuckDB")?;

        let adapter = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        adapter.init_schema_sync()?;
        Ok(adapter)
    }

    /// Initialize schema (sync because `DuckDB` is sync).
    fn init_schema_sync(&self) -> Result<()> {
        // We need to block on the mutex since this is called from sync context
        let conn = futures::executor::block_on(self.conn.lock());

        conn.execute_batch(ANALYTICS_SCHEMA)
            .context("Failed to initialize DuckDB schema")?;

        Ok(())
    }
}

impl PersistenceAdapter for DuckDbAdapter {
    async fn set(&self, key: &str, value: &[u8]) -> Result<()> {
        let conn = self.conn.lock().await;

        conn.execute(
            "INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, now())",
            duckdb::params![key, value],
        )
        .context("Failed to set value in DuckDB")?;

        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let conn = self.conn.lock().await;

        let mut stmt = conn
            .prepare("SELECT value FROM kv_store WHERE key = ?")
            .context("Failed to prepare query")?;

        let mut rows = stmt
            .query(duckdb::params![key])
            .context("Failed to execute query")?;

        if let Some(row) = rows.next()? {
            let value: Vec<u8> = row.get(0)?;
            Ok(Some(value))
        } else {
            Ok(None)
        }
    }

    async fn delete(&self, key: &str) -> Result<bool> {
        let conn = self.conn.lock().await;

        let affected = conn
            .execute("DELETE FROM kv_store WHERE key = ?", duckdb::params![key])
            .context("Failed to delete from DuckDB")?;

        Ok(affected > 0)
    }

    async fn exists(&self, key: &str) -> Result<bool> {
        let conn = self.conn.lock().await;

        let mut stmt = conn
            .prepare("SELECT 1 FROM kv_store WHERE key = ? LIMIT 1")
            .context("Failed to prepare query")?;

        let mut rows = stmt
            .query(duckdb::params![key])
            .context("Failed to execute query")?;

        Ok(rows.next()?.is_some())
    }
}

impl AnalyticsAdapter for DuckDbAdapter {
    async fn analytics_query(&self, sql: &str) -> Result<Vec<Vec<String>>> {
        let conn = self.conn.lock().await;

        let mut stmt = conn
            .prepare(sql)
            .context("Failed to prepare analytics query")?;

        let column_count = stmt.column_count();

        let mut rows = stmt
            .query([])
            .context("Failed to execute analytics query")?;

        let mut results = Vec::new();
        while let Some(row) = rows.next()? {
            let mut row_values = Vec::new();
            for i in 0..column_count {
                // Try to get as string, fallback to debug format
                let val: String = row.get::<_, String>(i).unwrap_or_else(|_| {
                    row.get::<_, i64>(i)
                        .map(|v| v.to_string())
                        .unwrap_or_default()
                });
                row_values.push(val);
            }
            results.push(row_values);
        }

        Ok(results)
    }

    async fn append(&self, table: &str, data: &[serde_json::Value]) -> Result<u64> {
        if data.is_empty() {
            return Ok(0);
        }

        let conn = self.conn.lock().await;

        // For each JSON object, insert into the table
        let mut count = 0u64;
        for item in data {
            if let serde_json::Value::Object(map) = item {
                let columns: Vec<&str> = map.keys().map(std::string::String::as_str).collect();
                let placeholders: Vec<&str> = (0..columns.len()).map(|_| "?").collect();

                let sql = format!(
                    "INSERT INTO {} ({}) VALUES ({})",
                    table,
                    columns.join(", "),
                    placeholders.join(", ")
                );

                // Convert values to strings for simplicity
                let values: Vec<String> = map
                    .values()
                    .map(|v| match v {
                        serde_json::Value::String(s) => s.clone(),
                        other => other.to_string(),
                    })
                    .collect();

                let params: Vec<&dyn duckdb::ToSql> =
                    values.iter().map(|s| s as &dyn duckdb::ToSql).collect();

                conn.execute(&sql, params.as_slice())
                    .context("Failed to append data")?;
                count += 1;
            }
        }

        Ok(count)
    }
}

/// Analytics schema for `DuckDB`.
const ANALYTICS_SCHEMA: &str = r"
-- Key-value store for signal-based access
CREATE TABLE IF NOT EXISTS kv_store (
    key VARCHAR PRIMARY KEY,
    value BLOB NOT NULL,
    updated_at TIMESTAMP DEFAULT now()
);

-- User activity metrics
CREATE TABLE IF NOT EXISTS user_metrics (
    id UUID DEFAULT gen_random_uuid(),
    session_id VARCHAR NOT NULL,
    event_type VARCHAR NOT NULL,
    event_data JSON,
    created_at TIMESTAMP DEFAULT now()
);

-- AI inference metrics
CREATE TABLE IF NOT EXISTS ai_metrics (
    id UUID DEFAULT gen_random_uuid(),
    trace_id VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Signal processing metrics
CREATE TABLE IF NOT EXISTS signal_metrics (
    id UUID DEFAULT gen_random_uuid(),
    signal_kind VARCHAR NOT NULL,
    processing_tier VARCHAR NOT NULL,
    latency_ms INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Daily aggregates (materialized for fast dashboards)
CREATE TABLE IF NOT EXISTS daily_stats (
    date DATE,
    total_signals INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    avg_latency_ms DOUBLE DEFAULT 0,
    PRIMARY KEY (date)
);
";
