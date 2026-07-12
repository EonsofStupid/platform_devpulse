//! Per-project `DuckDB` analytics manager.
//!
//! Mirrors [`super::project_db::ProjectDbManager`] but for the OLAP
//! columnar store. Each project gets its own `analytics.duckdb` at
//! `{project_root}/.userdata/analytics.duckdb` — created lazily when
//! the project is initialized, opened with a project-scoped schema.
//!
//! Per-project (not global) so OLAP queries don't have to filter on
//! `project_id` on every read, and so dropping a project = deleting
//! one file. The system / user analytics stores
//! ([`super::analytics::AnalyticsService`]) remain global.
//!
//! # Why no JSON columns
//!
//! Per the locked diagnostic (memory `project_duckdb_json_heap_corruption`),
//! `DuckDB` `JSON` columns abort the host process with
//! `STATUS_HEAP_CORRUPTION` when `DuckDB` initializes inside a binary
//! holding Candle / llama.cpp / mistral.rs / ort. We store payloads as
//! `VARCHAR` and parse with `json_extract(col, '$.path')` on read.

use anyhow::{Context, Result};
use devpulse_clyffy::cortex::persistence::DuckDbAdapter;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Manages per-project `DuckDB` analytics stores.
///
/// Stored as `Arc<ProjectAnalyticsManager>` on `Platform`.
pub struct ProjectAnalyticsManager {
    dbs: RwLock<HashMap<String, Arc<DuckDbAdapter>>>,
}

impl Default for ProjectAnalyticsManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ProjectAnalyticsManager {
    /// Construct an empty manager.
    #[must_use]
    pub fn new() -> Self {
        Self {
            dbs: RwLock::new(HashMap::new()),
        }
    }

    /// Initialize the per-project analytics database.
    ///
    /// Creates `{project_root}/.userdata/analytics.duckdb` if absent,
    /// applies [`PROJECT_ANALYTICS_SCHEMA`], caches the adapter by
    /// project id.
    ///
    /// # Errors
    /// Returns error if file creation, `DuckDB` open, or schema init fails.
    pub async fn init_project(
        &self,
        project_id: &str,
        project_root: &Path,
    ) -> Result<Arc<DuckDbAdapter>> {
        let db_path = Self::db_path(project_root);

        tracing::info!(
            project_id,
            path = %db_path.display(),
            "Initializing project analytics database"
        );

        // DuckDbAdapter::open_with_schema is synchronous — spawn_blocking
        // keeps the boot path off the tokio reactor for the duration of
        // the file open + schema replay. Routed through
        // devpulse_telemetry::spawn_blocking per workspace policy
        // (raw tokio::task::spawn_blocking is `disallowed-methods`).
        let path_buf = db_path.clone();
        let adapter = devpulse_telemetry::spawn_blocking(move || {
            DuckDbAdapter::open_with_schema(&path_buf, PROJECT_ANALYTICS_SCHEMA)
        })
        .await
        .context("DuckDB open task panicked")?
        .with_context(|| {
            format!(
                "Failed to initialize project analytics database at {}",
                db_path.display()
            )
        })?;

        let adapter = Arc::new(adapter);
        self.dbs
            .write()
            .await
            .insert(project_id.to_string(), Arc::clone(&adapter));

        tracing::info!(project_id, "Project analytics database ready");
        Ok(adapter)
    }

    /// Get an already-opened adapter by project id.
    pub async fn get(&self, project_id: &str) -> Option<Arc<DuckDbAdapter>> {
        self.dbs.read().await.get(project_id).cloned()
    }

    /// Close + remove the cached adapter for one project. Does NOT
    /// delete the file on disk.
    pub async fn close_project(&self, project_id: &str) {
        if let Some(adapter) = self.dbs.write().await.remove(project_id) {
            adapter.close().await;
            tracing::info!(project_id, "Project analytics database closed");
        }
    }

    /// Shutdown — close every cached adapter.
    pub async fn shutdown(&self) {
        let mut dbs = self.dbs.write().await;
        for (id, adapter) in dbs.drain() {
            adapter.close().await;
            tracing::debug!(project_id = %id, "Project analytics closed (shutdown)");
        }
    }

    /// Open project ids currently held in the cache.
    pub async fn open_projects(&self) -> Vec<String> {
        self.dbs.read().await.keys().cloned().collect()
    }

    /// Canonical path: `{project_root}/.userdata/analytics.duckdb`.
    fn db_path(project_root: &Path) -> PathBuf {
        project_root.join(".userdata").join("analytics.duckdb")
    }
}

/// Per-project OLAP schema. VARCHAR over JSON per the heap-corruption
/// gate; downstream readers use `json_extract(col, '$.path')`.
pub const PROJECT_ANALYTICS_SCHEMA: &str = r"
CREATE TABLE IF NOT EXISTS kv_store (
    key VARCHAR PRIMARY KEY,
    value BLOB NOT NULL,
    updated_at TIMESTAMP DEFAULT now()
);

-- Per-project model call telemetry.
CREATE TABLE IF NOT EXISTS model_calls (
    id VARCHAR NOT NULL,
    session_id VARCHAR,
    slot_id VARCHAR,
    model VARCHAR NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    cost_usd DOUBLE DEFAULT 0,
    fields_json VARCHAR,
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (id)
);

-- Indexing pipeline telemetry — per-file ingestion events.
CREATE TABLE IF NOT EXISTS index_events (
    id UUID DEFAULT gen_random_uuid(),
    file_path VARCHAR NOT NULL,
    event_kind VARCHAR NOT NULL,
    bytes_processed BIGINT,
    chunks_emitted INTEGER,
    embedding_ms INTEGER,
    fields_json VARCHAR,
    created_at TIMESTAMP DEFAULT now()
);

-- Retrieval telemetry — per-query lane / span trace.
CREATE TABLE IF NOT EXISTS retrieval_events (
    id UUID DEFAULT gen_random_uuid(),
    query_id VARCHAR NOT NULL,
    lane VARCHAR NOT NULL,
    top_k INTEGER NOT NULL,
    score_threshold DOUBLE,
    matched_count INTEGER,
    latency_ms INTEGER NOT NULL,
    fields_json VARCHAR,
    created_at TIMESTAMP DEFAULT now()
);

-- Daily rollups — populated by analytics aggregator job.
CREATE TABLE IF NOT EXISTS daily_stats (
    date DATE PRIMARY KEY,
    total_model_calls INTEGER DEFAULT 0,
    total_prompt_tokens BIGINT DEFAULT 0,
    total_completion_tokens BIGINT DEFAULT 0,
    total_cost_usd DOUBLE DEFAULT 0,
    avg_latency_ms DOUBLE DEFAULT 0,
    files_indexed INTEGER DEFAULT 0,
    chunks_emitted INTEGER DEFAULT 0,
    retrieval_queries INTEGER DEFAULT 0
);
";
