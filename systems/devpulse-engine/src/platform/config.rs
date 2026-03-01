//! Platform configuration types.
//!
//! Public-safe settings exposed through the facade.
//! No maestro types or kernel terminology leak through these types.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Public platform configuration.
///
/// This is what Tauri and the frontend see for settings display.
/// Wraps maestro's `PersistenceConfig` without exposing it.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct PlatformConfig {
    /// Root data directory path.
    pub data_dir: String,
    /// Database subsystem configuration.
    pub databases: DatabaseConfig,
}

/// Database subsystem configuration (public-safe names).
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct DatabaseConfig {
    /// Relational store enabled (`LibSQL`).
    pub relational_enabled: bool,
    /// Analytics store enabled (`DuckDB`).
    pub analytics_enabled: bool,
    /// Graph store enabled (`SurrealDB`).
    pub graph_enabled: bool,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            relational_enabled: true,
            analytics_enabled: true,
            graph_enabled: true,
        }
    }
}
