//! Boot preflight — directory creation, path validation, stale lock cleanup.
//!
//! Runs BEFORE any store touches disk. Two responsibilities:
//! 1. Ensure the scoped directory hierarchy exists for all enabled stores.
//! 2. Clean stale LOCK files from previous crashed sessions so `SurrealKV` can open.
//!
//! LOCK file cleanup is safe because:
//! - Single-instance plugin prevents concurrent launches (Tauri mutex)
//! - xtask zombie cleanup already killed stale processes before boot
//! - If we reach preflight, no other `DevPulse` process should be alive

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
    if config.services.system.relational.enabled {
        if let Some(parent) = config.services.system.relational.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    if config.services.system.analytics.enabled {
        if let Some(parent) = config.services.system.analytics.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    if config.services.system.graph.enabled {
        if let Some(parent) = config.services.system.graph.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }

    // User scope
    if config.services.user.relational.enabled {
        if let Some(parent) = config.services.user.relational.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }
    if config.services.user.graph.enabled {
        if let Some(parent) = config.services.user.graph.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }

    // Global scope
    if config.services.global.graph.enabled {
        if let Some(parent) = config.services.global.graph.resolve_path(data_dir).parent() {
            std::fs::create_dir_all(parent)?;
        }
    }

    // Vector store (RRO)
    if config.services.system.vector.enabled {
        let vector_path = config.services.system.vector.resolve_path(data_dir);
        std::fs::create_dir_all(&vector_path)?;
    }

    // Projects dir (just the root — per-project dirs created on demand)
    std::fs::create_dir_all(data_dir.join("projects"))?;

    // Logs dir
    std::fs::create_dir_all(data_dir.join("logs"))?;

    // Clean stale LOCK files from SurrealKV
    // SurrealKV creates a LOCK file on open. On crash/kill, the LOCK persists.
    // On next boot, SurrealKV sees it and refuses to open (os error 33).
    // Since single-instance + zombie cleanup guarantee no other process is alive,
    // any remaining LOCK file is stale and safe to delete.
    if config.services.system.graph.enabled
        || config.services.user.graph.enabled
        || config.services.global.graph.enabled
    {
        // Consolidated SurrealDB path matches boot/graph.rs:49-52
        let surreal_dir = data_dir.join("surreal").join("devpulse");
        let lock_path = surreal_dir.join("LOCK");
        if lock_path.exists() {
            match std::fs::remove_file(&lock_path) {
                Ok(()) => {
                    tracing::info!(
                        path = %lock_path.display(),
                        "Cleaned stale SurrealKV LOCK file from previous session"
                    );
                }
                Err(e) => {
                    tracing::warn!(
                        path = %lock_path.display(),
                        error = %e,
                        "Failed to clean stale SurrealKV LOCK file — boot may fail"
                    );
                }
            }
        }

        // Remove legacy `surreal/reasoning/` directory from pre-consolidated boot.
        // The old code opened SurrealKV at `surreal/reasoning/` with the clyffy
        // default namespace. Consolidated boot uses `surreal/devpulse/` instead.
        // The stale directory has a LOCK file that never gets cleaned and the
        // sstables directory caused "Access is denied" (OS error 5) on Windows.
        let legacy_reasoning = data_dir.join("surreal").join("reasoning");
        if legacy_reasoning.exists() {
            match std::fs::remove_dir_all(&legacy_reasoning) {
                Ok(()) => {
                    tracing::info!(
                        path = %legacy_reasoning.display(),
                        "Removed legacy surreal/reasoning/ directory (pre-consolidated)"
                    );
                }
                Err(e) => {
                    tracing::warn!(
                        path = %legacy_reasoning.display(),
                        error = %e,
                        "Failed to remove legacy surreal/reasoning/ — manual cleanup needed"
                    );
                }
            }
        }
    }

    Ok(())
}
