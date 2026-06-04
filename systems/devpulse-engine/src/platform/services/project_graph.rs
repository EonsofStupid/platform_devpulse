//! Per-project `SurrealDB` namespace manager.
//!
//! `SurrealDB` is ONE embedded instance — `SurrealLifecycle` opens
//! `kv-surrealkv` once at boot. Per-project graph state lives as
//! namespace `projects` / database `proj_<sanitized_project_id>`
//! inside that single connection.
//!
//! This manager mints the namespace lazily on `init_project()` (one
//! `init_namespace` call against the shared adapter), caches the
//! resulting `ScopedGraphHandle` keyed by project id, and hands the
//! handle back so callers never re-derive the namespace string.
//!
//! Symmetry with [`ProjectDbManager`]: both are lazy, both are
//! `Arc<…>` on `Platform`, both are dropped at shutdown.

use anyhow::{Context, Result};
use devpulse_clyffy::cortex::persistence::{ScopedGraphHandle, SurrealAdapter};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// `SurrealDB` namespace used for every project's graph database.
///
/// All projects share the namespace; isolation is at the database
/// layer (`proj_<id>`). Single-namespace shape keeps the cross-project
/// graph queries (`SELECT * FROM projects.*` style) tractable later.
pub const PROJECT_GRAPH_NAMESPACE: &str = "projects";

/// Manages per-project `SurrealDB` databases under [`PROJECT_GRAPH_NAMESPACE`].
///
/// Thread-safe via `RwLock<HashMap>`. Stored as `Arc<ProjectGraphManager>`
/// on `Platform`.
pub struct ProjectGraphManager {
    handles: RwLock<HashMap<String, Arc<ScopedGraphHandle>>>,
}

impl Default for ProjectGraphManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ProjectGraphManager {
    /// Construct an empty manager.
    #[must_use]
    pub fn new() -> Self {
        Self {
            handles: RwLock::new(HashMap::new()),
        }
    }

    /// Initialize the `SurrealDB` namespace/database for a project.
    ///
    /// Idempotent — `init_namespace` runs `DEFINE TABLE IF NOT EXISTS`
    /// style DDL so re-init on an existing project is safe. Seeds the
    /// `project_meta` table with the project identity.
    ///
    /// # Errors
    /// Returns error if `init_namespace` DDL fails.
    pub async fn init_project(
        &self,
        adapter: &Arc<SurrealAdapter>,
        project_id: &str,
        project_name: &str,
    ) -> Result<Arc<ScopedGraphHandle>> {
        let database = project_database(project_id);

        tracing::info!(
            project_id,
            ns = PROJECT_GRAPH_NAMESPACE,
            db = %database,
            "Initializing project graph namespace"
        );

        adapter
            .init_namespace(PROJECT_GRAPH_NAMESPACE, &database, PROJECT_GRAPH_SCHEMA)
            .await
            .with_context(|| {
                format!(
                    "Failed to initialize project graph namespace {PROJECT_GRAPH_NAMESPACE}/{database}"
                )
            })?;

        let seed_ddl = format!(
            "UPDATE project_meta:{project_id} SET \
                project_id = '{project_id}', \
                name = '{name}', \
                created_at = time::now() \
                WHERE created_at IS NONE; \
             CREATE project_meta:{project_id} SET \
                project_id = '{project_id}', \
                name = '{name}', \
                created_at = time::now() \
             RETURN NONE;",
            project_id = sql_escape(project_id),
            name = sql_escape(project_name),
        );
        // `RETURN NONE` + the conditional UPDATE/CREATE swallows
        // the "record exists" error on re-init; we only care that
        // after the call, project_meta:<id> is populated.
        let _ = adapter
            .execute_in_ns(PROJECT_GRAPH_NAMESPACE, &database, &seed_ddl)
            .await;

        let handle = Arc::new(adapter.scoped_handle(PROJECT_GRAPH_NAMESPACE, &database));
        self.handles
            .write()
            .await
            .insert(project_id.to_string(), Arc::clone(&handle));

        tracing::info!(project_id, "Project graph namespace ready");
        Ok(handle)
    }

    /// Get an already-initialized handle by project id.
    pub async fn get(&self, project_id: &str) -> Option<Arc<ScopedGraphHandle>> {
        self.handles.read().await.get(project_id).cloned()
    }

    /// Drop the cached handle for a project. Does NOT delete the
    /// underlying `SurrealDB` data — graph data persists until an
    /// explicit `REMOVE DATABASE` against the namespace.
    pub async fn forget(&self, project_id: &str) {
        if self.handles.write().await.remove(project_id).is_some() {
            tracing::info!(project_id, "Project graph handle dropped");
        }
    }

    /// List currently cached project ids.
    pub async fn open_projects(&self) -> Vec<String> {
        self.handles.read().await.keys().cloned().collect()
    }

    /// Drop every cached handle at platform shutdown.
    pub async fn shutdown(&self) {
        self.handles.write().await.clear();
    }
}

/// `SurrealDB` database name for a project — `proj_<sanitized>`.
///
/// Sanitization keeps `[a-zA-Z0-9_]` characters; anything else is
/// replaced with `_`. Surreal identifiers are stricter than UUIDs
/// (hyphens require backtick quoting), so the `proj_` prefix +
/// sanitized id is unambiguous and quote-free.
#[must_use]
pub fn project_database(project_id: &str) -> String {
    let mut out = String::with_capacity("proj_".len() + project_id.len());
    out.push_str("proj_");
    for ch in project_id.chars() {
        if ch.is_ascii_alphanumeric() || ch == '_' {
            out.push(ch);
        } else {
            out.push('_');
        }
    }
    out
}

/// Escape single quotes for embedding into a `SurQL` string literal.
fn sql_escape(input: &str) -> String {
    input.replace('\'', "\\'")
}

/// Minimal per-project graph schema.
///
/// Tables are scoped to one project's database. Schema is intentionally
/// thin at this layer — domain-specific tables (`file_index_graph`,
/// `signal_edges`, `drift_log_graph`, etc.) land as schema migrations on
/// top of this baseline.
pub const PROJECT_GRAPH_SCHEMA: &str = r"
-- Project identity record. One row per project (id = project uuid).
DEFINE TABLE IF NOT EXISTS project_meta SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS project_id ON project_meta TYPE string;
DEFINE FIELD IF NOT EXISTS name ON project_meta TYPE string;
DEFINE FIELD IF NOT EXISTS created_at ON project_meta TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS project_meta_uuid ON project_meta FIELDS project_id UNIQUE;

-- Signal-routed key-value store (mirrors libsql kv_store shape).
DEFINE TABLE IF NOT EXISTS kv SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS key ON kv TYPE string;
DEFINE FIELD IF NOT EXISTS value ON kv TYPE bytes;
DEFINE FIELD IF NOT EXISTS updated_at ON kv TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS kv_key ON kv FIELDS key UNIQUE;

-- Symbol graph — node per file/symbol, edge per call/import/reference.
-- Domain code populates these via the indexing pipeline.
DEFINE TABLE IF NOT EXISTS symbol SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS qualified_name ON symbol TYPE string;
DEFINE FIELD IF NOT EXISTS kind ON symbol TYPE string;
DEFINE FIELD IF NOT EXISTS file ON symbol TYPE string;
DEFINE INDEX IF NOT EXISTS symbol_qname ON symbol FIELDS qualified_name UNIQUE;

DEFINE TABLE IF NOT EXISTS calls SCHEMAFULL TYPE RELATION FROM symbol TO symbol;
DEFINE TABLE IF NOT EXISTS imports SCHEMAFULL TYPE RELATION FROM symbol TO symbol;
DEFINE TABLE IF NOT EXISTS references SCHEMAFULL TYPE RELATION FROM symbol TO symbol;
";
