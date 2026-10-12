//! Per-project relational store (Turso).
//!
//! Each managed project gets its own `project.db` inside the `DevPulse`
//! folder, at `{data_dir}/projects/{project_id}/project.db` — never inside
//! the project's own folder. Created on demand when a project is registered
//! — NOT during boot. Manages file index, RAG chunks, signals, codebase
//! patterns, conventions, and anti-drift enforcement.
//!
//! The `ProjectDbManager` holds open databases keyed by project ID.
//! Databases are opened lazily on first access and closed on project
//! removal or platform shutdown.

use super::relational::PROJECT_SCHEMA;
use crate::platform::db::{migrate, migrations};
use anyhow::{Context, Result};
use devpulse_clyffy::cortex::persistence::{SqlAdapter, TursoAdapter, TursoOptions};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Manages per-project Turso databases.
///
/// Thread-safe: `Arc<ProjectDbManager>` is stored in the `Platform`.
/// Interior mutability via `RwLock<HashMap>` for lazy opening.
pub struct ProjectDbManager {
    /// Open project databases, keyed by project ID (UUID string).
    dbs: RwLock<HashMap<String, Arc<TursoAdapter>>>,
    /// `{data_dir}/projects` — one folder per project.
    projects_dir: PathBuf,
    /// Connection options applied to every project database.
    options: TursoOptions,
}

impl ProjectDbManager {
    /// Create a new empty manager. `projects_dir` is `{data_dir}/projects`;
    /// `options` come from the user relational service configuration.
    pub fn new(projects_dir: PathBuf, options: TursoOptions) -> Self {
        Self {
            dbs: RwLock::new(HashMap::new()),
            projects_dir,
            options,
        }
    }

    /// The project's database file: `{data_dir}/projects/{project_id}/project.db`.
    pub fn db_path(&self, project_id: &str) -> PathBuf {
        self.projects_dir.join(project_id).join("project.db")
    }

    /// Open (creating if needed) a project's database and seed `project_meta`
    /// with its identity. Applies `PROJECT_SCHEMA` (file index, chunks,
    /// signals, patterns, drift log).
    ///
    /// Returns the adapter for immediate use. Also caches it by project ID.
    ///
    /// # Errors
    /// Returns error if directory creation, database open, or schema init fails.
    pub async fn init_project(
        &self,
        project_id: &str,
        project_name: &str,
    ) -> Result<Arc<TursoAdapter>> {
        let db_path = self.db_path(project_id);

        tracing::info!(
            project_id,
            path = %db_path.display(),
            "Initializing project database"
        );

        let adapter = TursoAdapter::open_with_schema(&db_path, PROJECT_SCHEMA, self.options)
            .await
            .with_context(|| {
                format!(
                    "Failed to initialize project database at {}",
                    db_path.display()
                )
            })?;
        migrate(&adapter, migrations::PROJECT)
            .await
            .with_context(|| format!("project {project_id}: schema migration"))?;

        // Seed project_meta with identity
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
            .to_string();

        let seeds = [
            ("name", project_name),
            ("uuid", project_id),
            ("created_at", &now),
            ("schema_version", "1.0.0"),
        ];

        for (key, value) in &seeds {
            adapter
                .execute(
                    "INSERT OR IGNORE INTO project_meta (key, value, updated_at) VALUES (?, ?, unixepoch())",
                    &[(*key).into(), (*value).into()],
                )
                .await
                .with_context(|| format!("Failed to seed project_meta key '{key}'"))?;
        }

        let adapter = Arc::new(adapter);
        self.dbs
            .write()
            .await
            .insert(project_id.to_string(), Arc::clone(&adapter));

        tracing::info!(project_id, "Project database ready");
        Ok(adapter)
    }

    /// Get an already-opened project database by ID.
    ///
    /// Returns `None` if the project hasn't been initialized yet.
    pub async fn get(&self, project_id: &str) -> Option<Arc<TursoAdapter>> {
        self.dbs.read().await.get(project_id).cloned()
    }

    /// Close and remove a project database from the manager.
    ///
    /// Checkpoints WAL before releasing. Does NOT delete the file.
    pub async fn close_project(&self, project_id: &str) {
        if let Some(adapter) = self.dbs.write().await.remove(project_id) {
            adapter.close().await;
            tracing::info!(project_id, "Project database closed");
        }
    }

    /// Shutdown all open project databases.
    pub async fn shutdown(&self) {
        let mut dbs = self.dbs.write().await;
        for (id, adapter) in dbs.drain() {
            adapter.close().await;
            tracing::debug!(project_id = %id, "Project database closed (shutdown)");
        }
    }

    /// List all currently open project IDs.
    pub async fn open_projects(&self) -> Vec<String> {
        self.dbs.read().await.keys().cloned().collect()
    }
}
