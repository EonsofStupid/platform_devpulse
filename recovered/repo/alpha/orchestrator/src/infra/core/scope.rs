// orchestrator/src/infra/core/scope.rs

//! Collection and database scoping
//!
//! Defines how data is isolated between global and per-project contexts.
//!
//! ## Vector Collections (RRO/RRO)
//!
//! **Global** (shared across all projects):
//! - `global_memory` - Long-term user memories
//! - `global_external` - External knowledge base
//!
//! **Per-project** (isolated per project):
//! - `proj_{id}_code` - Source code chunks
//! - `proj_{id}_docs` - Documentation
//! - `proj_{id}_history` - Conversation history
//!
//! ## libSQL Databases
//!
//! **Global**: `~/.devpulse/global.db`
//! - User settings, preferences
//! - Model registry
//! - Global config
//!
//! **Per-project**: `~/.devpulse/projects/{id}/project.db`
//! - Chat sessions and history
//! - Project-specific context
//! - File metadata cache

use std::path::PathBuf;
use uuid::Uuid;

/// Data scope - global or per-project.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Scope {
    /// Global scope shared across all projects
    Global,
    /// Per-project scope isolated by project ID
    Project(Uuid),
}

impl Scope {
    /// Create project scope from UUID.
    pub fn project(id: Uuid) -> Self {
        Scope::Project(id)
    }

    /// Create project scope from string (parses UUID).
    pub fn project_from_str(id: &str) -> Option<Self> {
        Uuid::parse_str(id).ok().map(Scope::Project)
    }

    /// Check if this is global scope.
    pub fn is_global(&self) -> bool {
        matches!(self, Scope::Global)
    }

    /// Check if this is project scope.
    pub fn is_project(&self) -> bool {
        matches!(self, Scope::Project(_))
    }

    /// Get project ID if this is project scope.
    pub fn project_id(&self) -> Option<Uuid> {
        match self {
            Scope::Project(id) => Some(*id),
            Scope::Global => None,
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Vector collection naming
    // ─────────────────────────────────────────────────────────────

    /// Generate scoped collection name.
    pub fn collection(&self, base: &str) -> String {
        match self {
            Scope::Global => format!("global_{}", base),
            Scope::Project(id) => format!("proj_{}_{}", id.simple(), base),
        }
    }

    /// Code collection for this scope.
    pub fn code_collection(&self) -> String {
        self.collection("code")
    }

    /// Docs collection for this scope.
    pub fn docs_collection(&self) -> String {
        self.collection("docs")
    }

    /// History collection for this scope.
    pub fn history_collection(&self) -> String {
        self.collection("history")
    }

    /// Memory collection (typically global).
    pub fn memory_collection(&self) -> String {
        self.collection("memory")
    }

    /// External knowledge collection (typically global).
    pub fn external_collection(&self) -> String {
        self.collection("external")
    }

    // ─────────────────────────────────────────────────────────────
    // libSQL database paths
    // ─────────────────────────────────────────────────────────────

    /// Get libSQL database path for this scope.
    ///
    /// - Global: `{base}/global.db`
    /// - Project: `{base}/projects/{id}/project.db`
    pub fn db_path(&self, base_dir: &PathBuf) -> PathBuf {
        match self {
            Scope::Global => base_dir.join("global.db"),
            Scope::Project(id) => base_dir
                .join("projects")
                .join(id.to_string())
                .join("project.db"),
        }
    }

    /// Get project directory for this scope (None for global).
    pub fn project_dir(&self, base_dir: &PathBuf) -> Option<PathBuf> {
        match self {
            Scope::Global => None,
            Scope::Project(id) => Some(base_dir.join("projects").join(id.to_string())),
        }
    }
}

/// Collection base names (without scope prefix).
pub mod collections {
    pub const CODE: &str = "code";
    pub const DOCS: &str = "docs";
    pub const HISTORY: &str = "history";
    pub const MEMORY: &str = "memory";
    pub const EXTERNAL: &str = "external";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_global_collection_names() {
        let scope = Scope::Global;
        assert_eq!(scope.code_collection(), "global_code");
        assert_eq!(scope.memory_collection(), "global_memory");
    }

    #[test]
    fn test_project_collection_names() {
        let id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let scope = Scope::Project(id);
        assert_eq!(scope.code_collection(), "proj_550e8400e29b41d4a716446655440000_code");
    }

    #[test]
    fn test_db_paths() {
        let base = PathBuf::from("/data");

        assert_eq!(Scope::Global.db_path(&base), PathBuf::from("/data/global.db"));

        let id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let project = Scope::Project(id);
        assert_eq!(
            project.db_path(&base),
            PathBuf::from("/data/projects/550e8400-e29b-41d4-a716-446655440000/project.db")
        );
    }
}
