// orchestrator/src/infra/persistence/analytics.rs

//! DuckDB analytics - L4 ANALYTICS layer
//!
//! Used for telemetry and ROTI metrics.
//! Read-heavy, append-only analytics data.
//!
//! Handles concurrent access: if the DB file is locked by another process,
//! falls back to in-memory mode (read-only, no persistence).

use shared::config::paths::get_paths;
use shared::types::analytics::{HopStats, InferenceStats};
use std::sync::Mutex;

/// Stored event from DuckDB events table
#[derive(Debug, Clone, serde::Serialize)]
pub struct StoredEvent {
    pub id: u64,
    pub event_type: String,
    pub data: Option<String>,
    pub timestamp: String,
}

/// Analytics database handle (thread-safe wrapper)
pub struct Analytics {
    conn: Mutex<duckdb::Connection>,
    /// True if using in-memory fallback (another process has the file)
    is_fallback: bool,
}

impl Analytics {
    /// Open or create analytics database
    ///
    /// If the file is locked by another process (e.g., Lab running while Desktop starts),
    /// falls back to in-memory mode. Writes will be lost but reads will work.
    pub fn open() -> anyhow::Result<Self> {
        let paths = get_paths();
        let db_path = &paths.analytics_db;

        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        // Try to open the file - if locked, use in-memory fallback
        match duckdb::Connection::open(db_path) {
            Ok(conn) => {
                conn.execute_batch(SCHEMA)?;
                tracing::info!("Analytics: opened {}", db_path.display());
                Ok(Self {
                    conn: Mutex::new(conn),
                    is_fallback: false,
                })
            }
            Err(e) => {
                // File locked by another process - use in-memory
                tracing::warn!(
                    "Analytics: file locked ({}), using in-memory fallback. \
                     Another DevPulse process may be running.",
                    e
                );
                let conn = duckdb::Connection::open_in_memory()?;
                conn.execute_batch(SCHEMA)?;
                Ok(Self {
                    conn: Mutex::new(conn),
                    is_fallback: true,
                })
            }
        }
    }

    /// Open analytics at a specific path (for Lab's dedicated database)
    pub fn open_with_path(db_path: &std::path::Path) -> anyhow::Result<Self> {
        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        match duckdb::Connection::open(db_path) {
            Ok(conn) => {
                conn.execute_batch(SCHEMA)?;
                tracing::info!("Analytics: opened {}", db_path.display());
                Ok(Self {
                    conn: Mutex::new(conn),
                    is_fallback: false,
                })
            }
            Err(e) => {
                tracing::warn!(
                    "Analytics: file locked ({}), using in-memory fallback.",
                    e
                );
                let conn = duckdb::Connection::open_in_memory()?;
                conn.execute_batch(SCHEMA)?;
                Ok(Self {
                    conn: Mutex::new(conn),
                    is_fallback: true,
                })
            }
        }
    }

    /// Is this using the in-memory fallback? (data won't persist)
    pub fn is_fallback_mode(&self) -> bool {
        self.is_fallback
    }

    /// Record a telemetry event
    pub fn record_event(
        &self,
        event_type: &str,
        data: &serde_json::Value,
    ) -> anyhow::Result<()> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        conn.execute(
            "INSERT INTO events (event_type, data, timestamp) VALUES (?, ?, NOW())",
            duckdb::params![event_type, data.to_string()],
        )?;
        Ok(())
    }

    /// Record model inference metrics
    pub fn record_inference(
        &self,
        model_id: &str,
        tokens_in: u32,
        tokens_out: u32,
        latency_ms: u32,
    ) -> anyhow::Result<()> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        conn.execute(
            "INSERT INTO inference_metrics (model_id, tokens_in, tokens_out, latency_ms, timestamp) VALUES (?, ?, ?, ?, NOW())",
            duckdb::params![model_id, tokens_in, tokens_out, latency_ms],
        )?;
        Ok(())
    }

    /// Record hop metrics
    pub fn record_hop(
        &self,
        session_id: &str,
        hop_number: u8,
        confidence: f32,
        latency_ms: u32,
    ) -> anyhow::Result<()> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        conn.execute(
            "INSERT INTO hop_metrics (session_id, hop_number, confidence, latency_ms, timestamp) VALUES (?, ?, ?, ?, NOW())",
            duckdb::params![session_id, hop_number, confidence, latency_ms],
        )?;
        Ok(())
    }

    // ============== Query Methods ==============

    /// Get inference stats summary
    pub fn get_inference_stats(&self) -> anyhow::Result<InferenceStats> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let mut stmt = conn.prepare(
            r#"
            SELECT
                COUNT(*) as total_inferences,
                COALESCE(SUM(tokens_in), 0) as total_tokens_in,
                COALESCE(SUM(tokens_out), 0) as total_tokens_out,
                COALESCE(AVG(latency_ms), 0) as avg_latency_ms
            FROM inference_metrics
            "#,
        )?;

        let mut rows = stmt.query([])?;
        if let Some(row) = rows.next()? {
            Ok(InferenceStats {
                total_inferences: row.get::<_, i64>(0)? as u64,
                total_tokens_in: row.get::<_, i64>(1)? as u64,
                total_tokens_out: row.get::<_, i64>(2)? as u64,
                avg_latency_ms: row.get::<_, f64>(3)? as f32,
            })
        } else {
            Ok(InferenceStats::default())
        }
    }

    /// Get recent events count
    pub fn get_event_count(&self) -> anyhow::Result<u64> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM events")?;
        let mut rows = stmt.query([])?;
        if let Some(row) = rows.next()? {
            Ok(row.get::<_, i64>(0)? as u64)
        } else {
            Ok(0)
        }
    }

    /// Get recent events for Lab signal history
    /// Returns events in reverse chronological order (newest first)
    pub fn get_events(&self, limit: u32, event_type_filter: Option<&str>) -> anyhow::Result<Vec<StoredEvent>> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;

        let (sql, params): (&str, Vec<Box<dyn duckdb::ToSql>>) = match event_type_filter {
            Some(filter) => (
                "SELECT id, event_type, data, timestamp FROM events WHERE event_type = ? ORDER BY timestamp DESC LIMIT ?",
                vec![Box::new(filter.to_string()), Box::new(limit as i64)],
            ),
            None => (
                "SELECT id, event_type, data, timestamp FROM events ORDER BY timestamp DESC LIMIT ?",
                vec![Box::new(limit as i64)],
            ),
        };

        let mut stmt = conn.prepare(sql)?;
        let params_ref: Vec<&dyn duckdb::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        let mut rows = stmt.query(params_ref.as_slice())?;

        let mut events = Vec::new();
        while let Some(row) = rows.next()? {
            events.push(StoredEvent {
                id: row.get::<_, i64>(0)? as u64,
                event_type: row.get(1)?,
                data: row.get::<_, Option<String>>(2)?,
                timestamp: row.get(3)?,
            });
        }
        Ok(events)
    }

    /// Get hop metrics summary
    pub fn get_hop_stats(&self) -> anyhow::Result<HopStats> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let mut stmt = conn.prepare(
            r#"
            SELECT
                COUNT(*) as total_hops,
                COALESCE(AVG(confidence), 0) as avg_confidence,
                COALESCE(AVG(latency_ms), 0) as avg_latency_ms
            FROM hop_metrics
            "#,
        )?;

        let mut rows = stmt.query([])?;
        if let Some(row) = rows.next()? {
            Ok(HopStats {
                total_hops: row.get::<_, i64>(0)? as u64,
                avg_confidence: row.get::<_, f64>(1)? as f32,
                avg_latency_ms: row.get::<_, f64>(2)? as f32,
            })
        } else {
            Ok(HopStats::default())
        }
    }
}

/// Analytics schema
const SCHEMA: &str = r#"
-- Events table (generic telemetry)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    event_type VARCHAR NOT NULL,
    data VARCHAR,
    timestamp TIMESTAMP NOT NULL
);

-- Inference metrics
CREATE TABLE IF NOT EXISTS inference_metrics (
    id INTEGER PRIMARY KEY,
    model_id VARCHAR NOT NULL,
    tokens_in INTEGER NOT NULL,
    tokens_out INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

-- Hop metrics
CREATE TABLE IF NOT EXISTS hop_metrics (
    id INTEGER PRIMARY KEY,
    session_id VARCHAR NOT NULL,
    hop_number INTEGER NOT NULL,
    confidence REAL NOT NULL,
    latency_ms INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL
);
"#;
