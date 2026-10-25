// orchestrator/src/infra/core/registry.rs

//! Project Registry - Maps UUIDs to filesystem paths
//!
//! File: ~/.local/share/devpulse/registry.toml
//!
//! The registry is the SSOT for project identity. Projects are identified by
//! UUID, not path, so they can move without breaking references.
//!
//! Workflow:
//! 1. User opens a directory in DevPulse
//! 2. Check if .devpulse/project.toml exists -> get UUID -> lookup in registry
//! 3. If not found, create new project -> assign UUID -> register
//! 4. If path changed, update registry entry

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use shared::config::paths::get_paths;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use uuid::Uuid;

/// Registry entry for a single project
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryEntry {
    /// Human-readable project name
    pub name: String,
    /// Filesystem path to project root
    pub path: String,
    /// Project type (rust, python, node, etc.)
    #[serde(default = "default_project_type")]
    pub project_type: String,
    /// When this entry was last updated (ISO 8601)
    pub last_seen: String,
}

fn default_project_type() -> String {
    "generic".to_string()
}

/// The full registry structure (maps to registry.toml)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Registry {
    /// Map of project UUID -> entry
    #[serde(default)]
    pub projects: HashMap<String, RegistryEntry>,
}

impl Registry {
    /// Load registry from default path
    pub fn load() -> Result<Self> {
        let paths = get_paths();
        Self::load_from(&paths.registry_toml)
    }

    /// Load registry from specific path
    pub fn load_from(path: &PathBuf) -> Result<Self> {
        if !path.exists() {
            return Ok(Registry::default());
        }

        let content = std::fs::read_to_string(path)
            .with_context(|| format!("Failed to read registry at {:?}", path))?;

        toml::from_str(&content)
            .with_context(|| format!("Failed to parse registry TOML at {:?}", path))
    }

    /// Save registry to default path
    pub fn save(&self) -> Result<()> {
        let paths = get_paths();
        self.save_to(&paths.registry_toml)
    }

    /// Save registry to specific path
    pub fn save_to(&self, path: &PathBuf) -> Result<()> {
        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let content = toml::to_string_pretty(self)
            .context("Failed to serialize registry to TOML")?;

        std::fs::write(path, content)
            .with_context(|| format!("Failed to write registry to {:?}", path))
    }

    /// Register a new project (or update existing)
    pub fn register(
        &mut self,
        id: &Uuid,
        name: impl Into<String>,
        path: impl Into<String>,
        project_type: impl Into<String>,
    ) {
        let entry = RegistryEntry {
            name: name.into(),
            path: path.into(),
            project_type: project_type.into(),
            last_seen: chrono::Utc::now().to_rfc3339(),
        };
        self.projects.insert(id.to_string(), entry);
    }

    /// Unregister a project by UUID
    pub fn unregister(&mut self, id: &Uuid) -> Option<RegistryEntry> {
        self.projects.remove(&id.to_string())
    }

    /// Look up project by UUID
    pub fn get(&self, id: &Uuid) -> Option<&RegistryEntry> {
        self.projects.get(&id.to_string())
    }

    /// Find project by path
    pub fn find_by_path(&self, path: &str) -> Option<(Uuid, &RegistryEntry)> {
        for (id_str, entry) in &self.projects {
            if entry.path == path {
                if let Ok(id) = id_str.parse() {
                    return Some((id, entry));
                }
            }
        }
        None
    }

    /// Update the path for a project (when moved)
    pub fn update_path(&mut self, id: &Uuid, new_path: impl Into<String>) -> bool {
        if let Some(entry) = self.projects.get_mut(&id.to_string()) {
            entry.path = new_path.into();
            entry.last_seen = chrono::Utc::now().to_rfc3339();
            true
        } else {
            false
        }
    }

    /// Touch a project (update last_seen)
    pub fn touch(&mut self, id: &Uuid) -> bool {
        if let Some(entry) = self.projects.get_mut(&id.to_string()) {
            entry.last_seen = chrono::Utc::now().to_rfc3339();
            true
        } else {
            false
        }
    }

    /// List all registered projects
    pub fn list(&self) -> Vec<(Uuid, &RegistryEntry)> {
        self.projects
            .iter()
            .filter_map(|(id_str, entry)| {
                id_str.parse().ok().map(|id| (id, entry))
            })
            .collect()
    }

    /// Get count of registered projects
    pub fn count(&self) -> usize {
        self.projects.len()
    }
}

/// Per-project configuration (stored in {project}/.devpulse/project.toml)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    /// Project UUID (matches registry key)
    pub id: String,
    /// Human-readable name
    pub name: String,
    /// Project type
    #[serde(default = "default_project_type")]
    pub project_type: String,
    /// RRO collection name (derived: project_{uuid})
    #[serde(default)]
    pub collection_name: String,
    /// When this config was created
    pub created_at: String,
}

impl ProjectConfig {
    /// Create new project config
    pub fn new(name: impl Into<String>, project_type: impl Into<String>) -> Self {
        let id = Uuid::new_v4();
        let name = name.into();

        Self {
            id: id.to_string(),
            name,
            project_type: project_type.into(),
            collection_name: format!("project_{}", id),
            created_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Get the UUID
    pub fn uuid(&self) -> Option<Uuid> {
        self.id.parse().ok()
    }

    /// Load from a project directory
    pub fn load_from_project(project_root: &Path) -> Result<Option<Self>> {
        let paths = get_paths();
        let config_path = paths.project_toml(project_root);

        if !config_path.exists() {
            return Ok(None);
        }

        let content = std::fs::read_to_string(&config_path)
            .with_context(|| format!("Failed to read project config at {:?}", config_path))?;

        let config: ProjectConfig = toml::from_str(&content)
            .with_context(|| format!("Failed to parse project config at {:?}", config_path))?;

        Ok(Some(config))
    }

    /// Save to a project directory
    pub fn save_to_project(&self, project_root: &Path) -> Result<()> {
        let paths = get_paths();
        let devpulse_dir = paths.project_devpulse_dir(project_root);

        // Ensure .devpulse directory exists
        std::fs::create_dir_all(&devpulse_dir)?;

        let config_path = devpulse_dir.join("project.toml");
        let content = toml::to_string_pretty(self)
            .context("Failed to serialize project config")?;

        std::fs::write(&config_path, content)
            .with_context(|| format!("Failed to write project config to {:?}", config_path))
    }
}

/// High-level project discovery and registration
pub struct ProjectManager {
    registry: Registry,
}

impl ProjectManager {
    /// Create a new project manager (loads registry)
    pub fn new() -> Result<Self> {
        let registry = Registry::load()?;
        Ok(Self { registry })
    }

    /// Open or create a project at the given path
    ///
    /// Returns (project_id, is_new)
    pub fn open_project(&mut self, project_root: &Path) -> Result<(Uuid, bool)> {
        let canonical_path = project_root
            .canonicalize()
            .unwrap_or_else(|_| project_root.to_path_buf());
        let path_str = canonical_path.to_string_lossy().to_string();

        // Check for existing project config in .devpulse/project.toml
        if let Some(config) = ProjectConfig::load_from_project(&canonical_path)? {
            if let Some(id) = config.uuid() {
                // Update registry path if changed
                if let Some(entry) = self.registry.get(&id) {
                    if entry.path != path_str {
                        tracing::info!("Project {} moved from {} to {}", id, entry.path, path_str);
                        self.registry.update_path(&id, &path_str);
                        self.registry.save()?;
                    }
                } else {
                    // Re-register if not in registry (maybe registry was cleared)
                    self.registry.register(&id, &config.name, &path_str, &config.project_type);
                    self.registry.save()?;
                }
                self.registry.touch(&id);
                return Ok((id, false));
            }
        }

        // Check if path is already registered (maybe project.toml was deleted)
        if let Some((id, _)) = self.registry.find_by_path(&path_str) {
            return Ok((id, false));
        }

        // New project - detect type and create config
        let project_type = detect_project_type(&canonical_path);
        let name = canonical_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "Unnamed Project".to_string());

        let config = ProjectConfig::new(&name, &project_type);
        let id = config.uuid().expect("New project should have valid UUID");

        // Save config to project
        config.save_to_project(&canonical_path)?;

        // Register in global registry
        self.registry.register(&id, &name, &path_str, &project_type);
        self.registry.save()?;

        tracing::info!("Created new project {} at {}", id, path_str);
        Ok((id, true))
    }

    /// Get registry reference
    pub fn registry(&self) -> &Registry {
        &self.registry
    }

    /// Get mutable registry reference
    pub fn registry_mut(&mut self) -> &mut Registry {
        &mut self.registry
    }

    /// Save registry changes
    pub fn save(&self) -> Result<()> {
        self.registry.save()
    }
}

/// Detect project type from directory contents
fn detect_project_type(path: &Path) -> String {
    // Check for Rust
    if path.join("Cargo.toml").exists() {
        return "rust".to_string();
    }

    // Check for Node.js
    if path.join("package.json").exists() {
        // Check for specific frameworks
        if path.join("next.config.js").exists() || path.join("next.config.mjs").exists() {
            return "nextjs".to_string();
        }
        if path.join("nuxt.config.js").exists() || path.join("nuxt.config.ts").exists() {
            return "nuxt".to_string();
        }
        return "node".to_string();
    }

    // Check for Python
    if path.join("pyproject.toml").exists()
        || path.join("setup.py").exists()
        || path.join("requirements.txt").exists()
    {
        return "python".to_string();
    }

    // Check for Go
    if path.join("go.mod").exists() {
        return "go".to_string();
    }

    // Check for Java/Kotlin
    if path.join("pom.xml").exists() || path.join("build.gradle").exists() {
        return "java".to_string();
    }

    // Check for .NET
    if path.join("*.csproj").exists() || path.join("*.sln").exists() {
        return "dotnet".to_string();
    }

    "generic".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_registry_roundtrip() {
        let dir = tempdir().unwrap();
        let registry_path = dir.path().join("registry.toml");

        let mut registry = Registry::default();
        let id = Uuid::new_v4();

        registry.register(&id, "Test Project", "/path/to/project", "rust");
        registry.save_to(&registry_path).unwrap();

        let loaded = Registry::load_from(&registry_path).unwrap();
        let entry = loaded.get(&id).unwrap();

        assert_eq!(entry.name, "Test Project");
        assert_eq!(entry.path, "/path/to/project");
        assert_eq!(entry.project_type, "rust");
    }

    #[test]
    fn test_find_by_path() {
        let mut registry = Registry::default();
        let id = Uuid::new_v4();

        registry.register(&id, "Test", "/my/project", "rust");

        let found = registry.find_by_path("/my/project");
        assert!(found.is_some());
        assert_eq!(found.unwrap().0, id);

        let not_found = registry.find_by_path("/other/path");
        assert!(not_found.is_none());
    }

    #[test]
    fn test_project_config() {
        let dir = tempdir().unwrap();
        let project_root = dir.path();

        let config = ProjectConfig::new("My Project", "rust");
        config.save_to_project(project_root).unwrap();

        let loaded = ProjectConfig::load_from_project(project_root)
            .unwrap()
            .unwrap();

        assert_eq!(loaded.name, "My Project");
        assert_eq!(loaded.project_type, "rust");
        assert!(loaded.collection_name.starts_with("project_"));
    }
}
