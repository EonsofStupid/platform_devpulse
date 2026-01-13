// shared/src/config/paths.rs

//! SSOT for all DevPulse paths using OnceLock singleton pattern.
//!
//! All path access goes through `get_paths()` - never construct paths manually.
//! Uses `directories` crate for XDG-style cross-platform paths.
//!
//! Override: Set `DEVPULSE_BASE` env var to redirect all paths (for dev/testing).
//!
//! ## Global Layout (~/.local/share/devpulse/)
//! ```text
//! ~/.local/share/devpulse/
//! ├── config.toml          # Engine settings
//! ├── user.toml            # User identity, global prefs
//! ├── registry.toml        # Project registry (UUIDs → paths)
//! └── data/
//!     ├── devpulse.db      # libSQL (projects, decisions, messages, chunks)
//!     ├── rro/          # Vector storage (collection per project)
//!     ├── fjall/           # LSM-tree KV (parking_lot, signal_replay)
//!     └── analytics.duckdb # DuckDB metrics
//! ```
//!
//! ## Per-Project Layout ({project}/.devpulse/)
//! ```text
//! {project}/.devpulse/
//! ├── project.toml         # UUID, name, type, collection_name
//! ├── context.md           # Project context (like CLAUDE.md)
//! └── personas/            # Project-specific personas
//! ```

use directories::ProjectDirs;
use std::path::PathBuf;
use std::sync::OnceLock;

static PATHS: OnceLock<DevPulsePaths> = OnceLock::new();

/// Find the workspace root by walking up from current exe/dir looking for Cargo.toml.
fn find_workspace_root() -> Option<PathBuf> {
    // Try from current exe location first
    if let Ok(exe) = std::env::current_exe() {
        if let Some(root) = walk_up_for_cargo_toml(&exe) {
            return Some(root);
        }
    }

    // Try from CARGO_MANIFEST_DIR if set
    if let Ok(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR") {
        if let Some(root) = walk_up_for_cargo_toml(&PathBuf::from(manifest_dir)) {
            return Some(root);
        }
    }

    // Try from current working directory
    if let Ok(cwd) = std::env::current_dir() {
        if let Some(root) = walk_up_for_cargo_toml(&cwd) {
            return Some(root);
        }
    }

    None
}

/// Walk up directory tree looking for a directory containing Cargo.toml with [workspace].
fn walk_up_for_cargo_toml(start: &std::path::Path) -> Option<PathBuf> {
    let mut current = start.to_path_buf();

    // Handle file paths by starting from parent
    if current.is_file() {
        current = current.parent()?.to_path_buf();
    }

    loop {
        let cargo_toml = current.join("Cargo.toml");
        if cargo_toml.exists() {
            // Check if this is a workspace root (has [workspace] section)
            if let Ok(content) = std::fs::read_to_string(&cargo_toml) {
                if content.contains("[workspace]") {
                    return Some(current);
                }
            }
        }

        match current.parent() {
            Some(parent) => current = parent.to_path_buf(),
            None => return None,
        }
    }
}

/// All DevPulse paths - initialized once, immutable thereafter.
#[derive(Debug, Clone)]
pub struct DevPulsePaths {
    // ============== Base Directories ==============

    /// Base directory for all data (~/.local/share/devpulse)
    pub data_dir: PathBuf,

    /// Configuration directory (~/.config/devpulse)
    pub config_dir: PathBuf,

    /// Cache directory (~/.cache/devpulse)
    pub cache_dir: PathBuf,

    // ============== Global Config Files ==============

    /// Engine configuration (data_dir/config.toml)
    pub config_toml: PathBuf,

    /// User identity and preferences (data_dir/user.toml)
    pub user_toml: PathBuf,

    /// Project registry - maps UUIDs to paths (data_dir/registry.toml)
    pub registry_toml: PathBuf,

    // ============== Data Subdirectory ==============

    /// Database directory (data_dir/data)
    pub db_dir: PathBuf,

    /// Global libSQL database (db_dir/devpulse.db)
    /// Contains: projects, decisions, messages, chunks tables
    pub global_db: PathBuf,

    /// RRO storage directory (db_dir/rro)
    /// Collections named: project_{uuid}
    pub rro_dir: PathBuf,

    /// fjall LSM-tree directory (db_dir/fjall)
    /// Partitions: parking_lot, signal_replay
    pub fjall_dir: PathBuf,

    /// DuckDB analytics path (db_dir/analytics.duckdb)
    pub analytics_db: PathBuf,

    // ============== Other Global Directories ==============

    /// Models directory (data_dir/models)
    pub models_dir: PathBuf,

    /// Per-project data root (data_dir/projects)
    pub projects_dir: PathBuf,

    /// Logs directory (data_dir/logs)
    pub logs_dir: PathBuf,
}

impl DevPulsePaths {
    fn init() -> Self {
        // Check for explicit base override
        if let Ok(base) = std::env::var("DEVPULSE_BASE") {
            let base = PathBuf::from(base);
            return Self::from_base(base);
        }

        // Check for lab mode
        if std::env::var("DEVPULSE_LAB_MODE").is_ok() {
            return Self::lab_local();
        }

        // Check for cargo/dev environment indicators
        if std::env::var("CARGO_MANIFEST_DIR").is_ok() {
            return Self::lab_local();
        }

        // Production: use XDG standard paths
        Self::xdg_standard()
    }

    /// Lab mode paths: uses target/lab relative to workspace root.
    /// Keeps all dev data isolated from production.
    pub fn lab_local() -> Self {
        // Find workspace root by looking for Cargo.toml
        let lab_base = find_workspace_root()
            .map(|root| root.join("target").join("lab"))
            .unwrap_or_else(|| {
                // Fallback to current dir if workspace not found
                std::env::current_dir()
                    .unwrap_or_else(|_| PathBuf::from("."))
                    .join("target")
                    .join("lab")
            });

        Self::from_base(lab_base)
    }

    /// Production mode paths: XDG-compliant cross-platform paths.
    pub fn xdg_standard() -> Self {
        let proj_dirs = ProjectDirs::from("com", "devpulse", "DevPulse")
            .expect("Failed to determine platform directories");

        let data_dir = proj_dirs.data_dir().to_path_buf();
        let config_dir = proj_dirs.config_dir().to_path_buf();
        let cache_dir = proj_dirs.cache_dir().to_path_buf();

        Self::from_dirs(data_dir, config_dir, cache_dir)
    }

    fn from_base(base: PathBuf) -> Self {
        let data_dir = base.join("data");
        let config_dir = base.join("config");
        let cache_dir = base.join("cache");
        Self::from_dirs(data_dir, config_dir, cache_dir)
    }

    fn from_dirs(data_dir: PathBuf, config_dir: PathBuf, cache_dir: PathBuf) -> Self {
        // Data subdirectory (data_dir/data/) contains all databases
        let db_dir = data_dir.join("data");
        let models_dir = data_dir.join("models");
        let projects_dir = data_dir.join("projects");
        let logs_dir = data_dir.join("logs");

        // Database paths
        let rro_dir = db_dir.join("rro");
        let fjall_dir = db_dir.join("fjall");
        let global_db = db_dir.join("devpulse.db");
        let analytics_db = db_dir.join("analytics.duckdb");

        // Config files live at root of data_dir
        let config_toml = data_dir.join("config.toml");
        let user_toml = data_dir.join("user.toml");
        let registry_toml = data_dir.join("registry.toml");

        Self {
            // Base directories
            data_dir,
            config_dir,
            cache_dir,

            // Config files
            config_toml,
            user_toml,
            registry_toml,

            // Data subdirectory
            db_dir,
            global_db,
            rro_dir,
            fjall_dir,
            analytics_db,

            // Other directories
            models_dir,
            projects_dir,
            logs_dir,
        }
    }

    /// Get the per-project database path
    pub fn project_db(&self, project_id: &str) -> PathBuf {
        self.projects_dir.join(project_id).join("project.db")
    }

    /// Get the per-project .devpulse directory
    pub fn project_devpulse_dir(&self, project_root: &std::path::Path) -> PathBuf {
        project_root.join(".devpulse")
    }

    /// Get the per-project config file path
    pub fn project_toml(&self, project_root: &std::path::Path) -> PathBuf {
        self.project_devpulse_dir(project_root).join("project.toml")
    }

    /// Get the per-project context file (like CLAUDE.md)
    pub fn project_context_md(&self, project_root: &std::path::Path) -> PathBuf {
        self.project_devpulse_dir(project_root).join("context.md")
    }

    /// Get the per-project personas directory
    pub fn project_personas_dir(&self, project_root: &std::path::Path) -> PathBuf {
        self.project_devpulse_dir(project_root).join("personas")
    }

    /// Get the RRO collection name for a project UUID
    /// Convention: project_{uuid} (not path-based, since projects can move)
    pub fn rro_collection_name(project_id: &uuid::Uuid) -> String {
        format!("project_{}", project_id)
    }

    /// Get the fjall partition path for parking lot
    pub fn fjall_parking_lot(&self) -> PathBuf {
        self.fjall_dir.join("parking_lot")
    }

    /// Get the fjall partition path for signal replay
    pub fn fjall_signal_replay(&self) -> PathBuf {
        self.fjall_dir.join("signal_replay")
    }

    /// Ensure all required directories exist
    pub fn ensure_dirs(&self) -> std::io::Result<()> {
        std::fs::create_dir_all(&self.data_dir)?;
        std::fs::create_dir_all(&self.config_dir)?;
        std::fs::create_dir_all(&self.cache_dir)?;
        std::fs::create_dir_all(&self.db_dir)?;
        std::fs::create_dir_all(&self.models_dir)?;
        std::fs::create_dir_all(&self.projects_dir)?;
        std::fs::create_dir_all(&self.logs_dir)?;
        std::fs::create_dir_all(&self.rro_dir)?;
        std::fs::create_dir_all(&self.fjall_dir)?;
        Ok(())
    }
}

/// Get the singleton paths instance.
/// Initializes on first call, returns cached reference thereafter.
pub fn get_paths() -> &'static DevPulsePaths {
    PATHS.get_or_init(DevPulsePaths::init)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn paths_are_consistent() {
        let paths = get_paths();
        assert!(paths.global_db.starts_with(&paths.db_dir));
        assert!(paths.rro_dir.starts_with(&paths.db_dir));
        assert!(paths.analytics_db.starts_with(&paths.db_dir));
    }

    #[test]
    fn project_db_path() {
        let paths = get_paths();
        let proj_db = paths.project_db("test-project-123");
        assert!(proj_db.ends_with("project.db"));
        assert!(proj_db.to_string_lossy().contains("test-project-123"));
    }
}
