// engine/src/registry/projects.rs

//! Project registry - track codebases with libSQL persistence
//!
//! Non-AI feature that works immediately.
//! Persists to libSQL - survives restarts.

use crate::error::EngineError;
use orchestrator::infra::persistence::sql::Database;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::instrument;

/// A registered project
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub project_type: ProjectType,
    pub created_at: String,
    pub last_accessed: String,
}

/// Project type (detected from files)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ProjectType {
    Rust,
    Node,
    Python,
    Go,
    Mixed,
    Unknown,
}

impl std::fmt::Display for ProjectType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Rust => write!(f, "rust"),
            Self::Node => write!(f, "node"),
            Self::Python => write!(f, "python"),
            Self::Go => write!(f, "go"),
            Self::Mixed => write!(f, "mixed"),
            Self::Unknown => write!(f, "unknown"),
        }
    }
}

impl ProjectType {
    pub fn from_str(s: &str) -> Self {
        match s {
            "rust" => Self::Rust,
            "node" => Self::Node,
            "python" => Self::Python,
            "go" => Self::Go,
            "mixed" => Self::Mixed,
            _ => Self::Unknown,
        }
    }
}

/// Project registry with libSQL persistence
pub struct ProjectRegistry {
    /// In-memory cache (loaded from DB on init)
    cache: RwLock<Vec<Project>>,
    /// Selected project ID
    selected: RwLock<Option<String>>,
    /// Database handle
    db: Arc<Database>,
}

impl ProjectRegistry {
    /// Create new project registry, loading from database
    #[instrument(skip(db))]
    pub async fn new(db: Arc<Database>) -> Result<Self, EngineError> {
        let registry = Self {
            cache: RwLock::new(Vec::new()),
            selected: RwLock::new(None),
            db,
        };

        // Load existing projects from database
        registry.load_from_db().await?;

        tracing::info!("ProjectRegistry loaded {} projects", registry.cache.read().await.len());
        Ok(registry)
    }

    /// Load all projects from database into cache
    async fn load_from_db(&self) -> Result<(), EngineError> {
        let db_projects = self.db.list_projects().await
            .map_err(|e| EngineError::Database(e.to_string()))?;

        let mut cache = self.cache.write().await;
        cache.clear();

        for p in db_projects {
            cache.push(Project {
                id: p.id.to_string(),
                name: p.name,
                path: p.root_path,
                project_type: ProjectType::from_str(&p.project_type),
                created_at: p.created_at,
                last_accessed: p.last_accessed,
            });
        }

        Ok(())
    }

    /// List all projects (from cache)
    #[instrument(skip(self))]
    pub async fn list(&self) -> Vec<Project> {
        let cache = self.cache.read().await;
        let mut list = cache.clone();
        list.sort_by(|a, b| b.last_accessed.cmp(&a.last_accessed));
        list
    }

    /// Get a project by ID
    pub async fn get(&self, id: &str) -> Option<Project> {
        let cache = self.cache.read().await;
        cache.iter().find(|p| p.id == id).cloned()
    }

    /// Add a new project - persists to database
    #[instrument(skip(self))]
    pub async fn add(&self, path: &str) -> Result<Project, EngineError> {
        let path_obj = Path::new(path);

        // Validate path exists
        if !path_obj.exists() {
            return Err(EngineError::PathNotFound(path.to_string()));
        }

        // Validate it's a directory
        if !path_obj.is_dir() {
            return Err(EngineError::InvalidPath(format!(
                "Not a directory: {}",
                path
            )));
        }

        // Check if already registered
        if let Some(existing_id) = self.db.find_project_by_path(path).await
            .map_err(|e| EngineError::Database(e.to_string()))?
        {
            // Already exists - just touch it and return
            self.db.touch_project(&existing_id).await
                .map_err(|e| EngineError::Database(e.to_string()))?;

            // Reload cache and return the project
            self.load_from_db().await?;
            return self.get(&existing_id.to_string()).await
                .ok_or_else(|| EngineError::ProjectNotFound(existing_id.to_string()));
        }

        // Extract name from path
        let name = path_obj
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "Unknown".to_string());

        // Detect project type
        let project_type = Self::detect_type(path_obj);

        // Generate ID
        let id = uuid::Uuid::new_v4();

        // Persist to database
        self.db.create_project(&id, &name, path, &project_type.to_string()).await
            .map_err(|e| EngineError::Database(e.to_string()))?;

        // Reload cache
        self.load_from_db().await?;

        // Return the new project
        let project = self.get(&id.to_string()).await
            .ok_or_else(|| EngineError::Database("Failed to reload after insert".to_string()))?;

        tracing::info!("Project added: {} ({})", project.name, project.project_type);
        Ok(project)
    }

    /// Remove a project - deletes from database
    #[instrument(skip(self))]
    pub async fn remove(&self, id: &str) -> Result<(), EngineError> {
        let uuid = id.parse::<uuid::Uuid>()
            .map_err(|_| EngineError::ProjectNotFound(id.to_string()))?;

        self.db.delete_project(&uuid).await
            .map_err(|e| EngineError::Database(e.to_string()))?;

        // Reload cache
        self.load_from_db().await?;

        // Clear selection if this was selected
        let mut selected = self.selected.write().await;
        if selected.as_deref() == Some(id) {
            *selected = None;
        }

        tracing::info!("Project removed: {}", id);
        Ok(())
    }

    /// Select a project as active
    #[instrument(skip(self))]
    pub async fn select(&self, id: &str) -> Result<(), EngineError> {
        // Verify project exists
        if self.get(id).await.is_none() {
            return Err(EngineError::ProjectNotFound(id.to_string()));
        }

        // Touch in database
        let uuid = id.parse::<uuid::Uuid>()
            .map_err(|_| EngineError::ProjectNotFound(id.to_string()))?;

        self.db.touch_project(&uuid).await
            .map_err(|e| EngineError::Database(e.to_string()))?;

        // Reload cache to get updated last_accessed
        self.load_from_db().await?;

        // Set selection
        let mut selected = self.selected.write().await;
        *selected = Some(id.to_string());

        tracing::info!("Project selected: {}", id);
        Ok(())
    }

    /// Get selected project
    pub async fn selected(&self) -> Option<Project> {
        let selected = self.selected.read().await;
        match &*selected {
            Some(id) => self.get(id).await,
            None => None,
        }
    }

    /// Detect project type from directory contents
    fn detect_type(path: &Path) -> ProjectType {
        let has_cargo = path.join("Cargo.toml").exists();
        let has_package = path.join("package.json").exists();
        let has_pyproject = path.join("pyproject.toml").exists()
            || path.join("setup.py").exists()
            || path.join("requirements.txt").exists();
        let has_go = path.join("go.mod").exists();

        match (has_cargo, has_package, has_pyproject, has_go) {
            (true, false, false, false) => ProjectType::Rust,
            (false, true, false, false) => ProjectType::Node,
            (false, false, true, false) => ProjectType::Python,
            (false, false, false, true) => ProjectType::Go,
            (false, false, false, false) => ProjectType::Unknown,
            _ => ProjectType::Mixed,
        }
    }
}

#[cfg(test)]
mod tests {
    // Tests require database setup - will add integration tests
}
