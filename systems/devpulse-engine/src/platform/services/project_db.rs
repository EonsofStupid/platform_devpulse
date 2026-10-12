//! Per-project relational store (Turso).
//!
//! Each managed project gets its own `project.db` at
//! `{project_root}/.userdata/project.db`. Created on demand when a project
//! is registered — NOT during boot. Manages file index, RAG chunks,
//! signals, codebase patterns, conventions, and anti-drift enforcement.
//!
//! The `ProjectDbManager` holds open connections keyed by project ID.
//! Connections are created lazily on first access and closed on project
//! removal or platform shutdown.

use super::relational::PROJECT_SCHEMA;
use anyhow::{Context, Result};
use devpulse_clyffy::cortex::persistence::{SqlAdapter, TursoAdapter, TursoOptions};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Manages per-project Turso databases.
///
/// Thread-safe: `Arc<ProjectDbManager>` is stored in the `Platform`.
/// Interior mutability via `RwLock<HashMap>` for lazy connection creation.
pub struct ProjectDbManager {
    /// Open project databases, keyed by project ID (UUID string).
    dbs: RwLock<HashMap<String, Arc<TursoAdapter>>>,
    /// Connection options applied to every project database.
    options: TursoOptions,
}

impl ProjectDbManager {
    /// Create a new empty manager; `options` come from the user relational
    /// service configuration.
    pub fn new(options: TursoOptions) -> Self {
        Self {
            dbs: RwLock::new(HashMap::new()),
            options,
        }
    }

    /// Initialize a project database at `{project_root}/.userdata/project.db`.
    ///
    /// Creates the `.userdata/` directory and database file if they don't exist.
    /// Applies `PROJECT_SCHEMA` (file index, chunks, signals, patterns, drift log).
    /// Seeds `project_meta` with the project's identity.
    ///
    /// Returns the adapter for immediate use. Also caches it by project ID.
    ///
    /// # Errors
    /// Returns error if directory creation, database open, or schema init fails.
    pub async fn init_project(
        &self,
        project_id: &str,
        project_root: &Path,
        project_name: &str,
    ) -> Result<Arc<TursoAdapter>> {
        let db_path = Self::db_path(project_root);

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
                    &[*key, *value],
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

    /// Open an existing project database (e.g. on app restart).
    ///
    /// Unlike `init_project`, this does NOT seed `project_meta` — it assumes
    /// the database already exists and has been seeded.
    ///
    /// # Errors
    /// Returns error if the database file doesn't exist or can't be opened.
    pub async fn open_existing(
        &self,
        project_id: &str,
        project_root: &Path,
    ) -> Result<Arc<TursoAdapter>> {
        let db_path = Self::db_path(project_root);

        if !db_path.exists() {
            anyhow::bail!("Project database does not exist at {}", db_path.display());
        }

        let adapter = TursoAdapter::open_with_schema(&db_path, PROJECT_SCHEMA, self.options)
            .await
            .with_context(|| format!("Failed to open project database at {}", db_path.display()))?;

        let adapter = Arc::new(adapter);
        self.dbs
            .write()
            .await
            .insert(project_id.to_string(), Arc::clone(&adapter));

        Ok(adapter)
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

    /// Canonical path: `{project_root}/.userdata/project.db`
    fn db_path(project_root: &Path) -> PathBuf {
        project_root.join(".userdata").join("project.db")
    }
}
