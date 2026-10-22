//! `DuckDB` adapter for analytics
//!
//! Handles: user analytics, AI metrics, telemetry, OLAP queries
//! Optimized for analytical workloads and columnar storage.

pub mod diagnostics;

use crate::cortex::persistence::traits::{AnalyticsAdapter, PersistenceAdapter, SqlRow, SqlValue};
use anyhow::{Context, Result};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;

/// `DuckDB` database adapter for analytics.
pub struct DuckDbAdapter {
    conn: Arc<Mutex<duckdb::Connection>>,
}

impl DuckDbAdapter {
    /// Open or create database at path with the default analytics schema.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub fn open(path: &Path) -> Result<Self> {
        Self::open_with_schema(path, ANALYTICS_SCHEMA)
    }

    /// Open or create database at path with a custom schema.
    ///
    /// The engine layer uses this to apply scope-specific schemas.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub fn open_with_schema(path: &Path, schema: &str) -> Result<Self> {
        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).context("Failed to create database directory")?;
        }

        let conn = duckdb::Connection::open(path).context("Failed to open DuckDB database")?;

        let adapter = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        adapter.init_schema_sync(schema)?;

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

        adapter.init_schema_sync(ANALYTICS_SCHEMA)?;
        Ok(adapter)
    }

    /// Initialize schema (sync because `DuckDB` is sync).
    fn init_schema_sync(&self, schema: &str) -> Result<()> {
        // We need to block on the mutex since this is called from sync context
        let conn = futures::executor::block_on(self.conn.lock());

        conn.execute_batch(schema)
            .context("Failed to initialize DuckDB schema")?;

        Ok(())
    }

    /// Graceful shutdown — acquire lock to ensure no queries are in flight.
    ///
    /// `DuckDB` checkpoints automatically on `Connection::drop`. Acquiring
    /// the mutex guarantees all in-flight queries complete before the
    /// connection is released. The actual file lock release happens when
    /// all `Arc` references drop (handled by `Platform::shutdown`).
    pub async fn close(&self) {
        let _conn = self.conn.lock().await;
    }

    /// Health check — executes `SELECT 1`.
    ///
    /// # Errors
    /// Returns error if the database is unreachable.
    pub async fn ping(&self) -> Result<()> {
        let conn = self.conn.lock().await;
        let mut stmt = conn
            .prepare("SELECT 1")
            .context("DuckDB ping prepare failed")?;
        let mut rows = stmt.query([]).context("DuckDB ping query failed")?;
        let _row = rows.next().context("DuckDB ping returned no rows")?;
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
    async fn analytics_query(&self, sql: &str) -> Result<Vec<SqlRow>> {
        let conn = self.conn.lock().await;

        let mut stmt = conn
            .prepare(sql)
            .context("Failed to prepare analytics query")?;

        // DuckDB crate v1.4+ panics on column_count() before execution.
        // Use query_map which executes first, then get count from Row's statement ref.
        let results = stmt
            .query_map([], |row| {
                let column_count = row.as_ref().column_count();
                let mut row_values: SqlRow = Vec::new();
                for i in 0..column_count {
                    if let Ok(v) = row.get::<_, i64>(i) {
                        row_values.push(SqlValue::Integer(v));
                    } else if let Ok(v) = row.get::<_, f64>(i) {
                        row_values.push(SqlValue::Real(v));
                    } else if let Ok(v) = row.get::<_, String>(i) {
                        row_values.push(SqlValue::Text(v));
                    } else if let Ok(v) = row.get::<_, Vec<u8>>(i) {
                        row_values.push(SqlValue::Blob(v));
                    } else {
                        row_values.push(SqlValue::Null);
                    }
                }
                Ok(row_values)
            })
            .context("Failed to execute analytics query")?
            .collect::<std::result::Result<Vec<_>, _>>()
            .context("Failed to collect analytics results")?;

        Ok(results)
    }

    /// Insert JSON objects as rows, each key a column. Values are bound with
    /// their own types (null as NULL, numbers as numbers), and the whole
    /// batch is one transaction: a row that does not fit fails the batch and
    /// none of it is kept.
    async fn append(&self, table: &str, data: &[serde_json::Value]) -> Result<u64> {
        if data.is_empty() {
            return Ok(0);
        }

        let mut conn = self.conn.lock().await;
        let tx = conn
            .transaction()
            .with_context(|| format!("begin the append to {table}"))?;

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

                let values: Vec<duckdb::types::Value> = map.values().map(bound).collect();
                let params: Vec<&dyn duckdb::ToSql> =
                    values.iter().map(|v| v as &dyn duckdb::ToSql).collect();

                tx.execute(&sql, params.as_slice())
                    .with_context(|| format!("Failed to append data to {table}"))?;
                count += 1;
            }
        }
        tx.commit()
            .with_context(|| format!("commit the append to {table}"))?;

        Ok(count)
    }
}

/// A JSON value as `DuckDB` binds it: null as NULL, a boolean, an integer or
/// a float as itself, text as text, and an array or object as its JSON text
/// (which `DuckDB` casts to `JSON` or list columns).
fn bound(value: &serde_json::Value) -> duckdb::types::Value {
    use duckdb::types::Value as Bound;
    match value {
        serde_json::Value::Null => Bound::Null,
        serde_json::Value::Bool(b) => Bound::Boolean(*b),
        serde_json::Value::Number(n) => n
            .as_i64()
            .map(Bound::BigInt)
            .or_else(|| n.as_u64().map(Bound::UBigInt))
            .or_else(|| n.as_f64().map(Bound::Double))
            .unwrap_or(Bound::Null),
        serde_json::Value::String(s) => Bound::Text(s.clone()),
        other => Bound::Text(other.to_string()),
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
    total_model_calls INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_prompt_tokens INTEGER DEFAULT 0,
    total_completion_tokens INTEGER DEFAULT 0,
    total_cost_usd DOUBLE DEFAULT 0,
    avg_latency_ms DOUBLE DEFAULT 0,
    avg_roti_ratio DOUBLE DEFAULT 0,
    cache_hit_rate DOUBLE DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    governance_violations INTEGER DEFAULT 0,
    PRIMARY KEY (date)
);

-- Span traces — sink for the engine telemetry span_writer batch flush.
-- Schema mirrors the JSON record built in
-- `systems/devpulse-engine/src/platform/telemetry/span_writer.rs::flush`.
-- Every column is nullable except trace_id/span_id so partial OTel
-- exports (no parent, no fields) still land cleanly.
CREATE TABLE IF NOT EXISTS span_traces (
    trace_id VARCHAR NOT NULL,
    span_id VARCHAR NOT NULL,
    parent_span_id VARCHAR,
    name VARCHAR NOT NULL,
    target VARCHAR NOT NULL,
    level VARCHAR NOT NULL,
    duration_us BIGINT,
    fields_json JSON,
    created_at TIMESTAMP DEFAULT now()
);
";

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    const SCHEMA: &str = "CREATE TABLE spans (id BIGINT NOT NULL, parent BIGINT, \
                          name VARCHAR NOT NULL, fields VARCHAR);";

    fn adapter() -> DuckDbAdapter {
        let conn = duckdb::Connection::open_in_memory().expect("in-memory");
        let adapter = DuckDbAdapter {
            conn: Arc::new(Mutex::new(conn)),
        };
        adapter.init_schema_sync(SCHEMA).expect("schema");
        adapter
    }

    /// A null lands as NULL in a BIGINT column — it used to be bound as the
    /// text "null" and fail the insert (master plan M9).
    #[tokio::test]
    async fn null_and_numbers_bind_with_their_own_types() {
        let db = adapter();
        let rows = [
            serde_json::json!({"id": 1, "parent": null, "name": "root", "fields": null}),
            serde_json::json!({"id": 2, "parent": 1, "name": "child", "fields": "{\"a\":1}"}),
        ];
        assert_eq!(db.append("spans", &rows).await.expect("append"), 2);
        let roots = db
            .analytics_query("SELECT count(*) FROM spans WHERE parent IS NULL")
            .await
            .expect("query");
        assert_eq!(roots[0].first(), Some(&SqlValue::Integer(1)));
    }

    /// A row that does not fit fails the batch, and none of it is kept.
    #[tokio::test]
    async fn a_bad_row_fails_the_whole_batch() {
        let db = adapter();
        let rows = [
            serde_json::json!({"id": 1, "name": "fine"}),
            serde_json::json!({"id": "not a number", "name": "bad"}),
        ];
        assert!(db.append("spans", &rows).await.is_err());
        let count = db
            .analytics_query("SELECT count(*) FROM spans")
            .await
            .expect("query");
        assert_eq!(count[0].first(), Some(&SqlValue::Integer(0)));
    }
}
