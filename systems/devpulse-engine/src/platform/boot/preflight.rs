//! Boot preflight — directory creation and path validation.
//!
//! Runs BEFORE any store touches disk. Ensures the scoped directory
//! hierarchy exists for all enabled file-based stores.

use crate::platform::config::PlatformBootConfig;
use anyhow::Result;
use std::path::Path;

/// Create scoped directories for all enabled file-based stores.
///
/// Directory structure:
/// ```text
/// {data_dir}/
/// ├── system/{libsql,duckdb,surreal,rro}/
/// ├── user/{libsql,surreal}/
/// ├── global/surreal/
/// ├── projects/          (root only — per-project dirs on demand)
/// └── logs/
/// ```
///
/// # Errors
/// Returns error if any directory cannot be created.
pub fn ensure_scoped_dirs(data_dir: &Path, config: &PlatformBootConfig) -> Result<()> {
    // System scope
    if config.stores.system.relational.enabled {
        if let Some(parent) = config.stores.system.relational.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    if config.stores.system.analytics.enabled {
        if let Some(parent) = config.stores.system.analytics.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    if config.stores.system.graph.enabled {
        if let Some(parent) = config.stores.system.graph.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }

    // User scope
    if config.stores.user.relational.enabled {
        if let Some(parent) = config.stores.user.relational.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    if config.stores.user.graph.enabled {
        if let Some(parent) = config.stores.user.graph.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }

    // Global scope
    if config.stores.global.graph.enabled {
        if let Some(parent) = config.stores.global.graph.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }

    // Vector store (RRO)
    if config.stores.system.vector.enabled {
        let vector_path = config.stores.system.vector.resolve_path(data_dir);
        std::fs::create_dir_all(&vector_path)?;
    }

    // Projects dir (just the root — per-project dirs created on demand)
    std::fs::create_dir_all(data_dir.join("projects"))?;

    // Logs dir
    std::fs::create_dir_all(data_dir.join("logs"))?;

    Ok(())
}
