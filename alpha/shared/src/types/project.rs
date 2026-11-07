use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use strum::{Display, EnumIter, EnumString, IntoStaticStr, VariantNames};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Defines the DNA of a project.
/// This enum drives:
/// 1. Which scaffolding template to use (Factory)
/// 2. Which icon to show in UI
/// 3. Which specialized analyzers to run
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
#[derive(Serialize, Deserialize)]
#[derive(EnumString, Display, EnumIter, IntoStaticStr, VariantNames)]
#[strum(serialize_all = "snake_case")]
pub enum ProjectType {
    /// Rust Cargo project
    Rust,
    /// Python Virtualenv/Poetry project
    PythonPipeline,
    /// Node.js / NPM project
    NodeWeb,
    /// Generic/Unknown
    Generic,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectRecord {
    pub id: Uuid,
    pub name: String,
    pub root_path: PathBuf,
    pub project_type: ProjectType,     // Strong Enum
    pub collection_name: String,
    pub created_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
}
