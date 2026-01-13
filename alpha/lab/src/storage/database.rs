// lab/src/storage/database.rs

//! Lab Database - libSQL wrapper for Lab-specific data
//!
//! Stores experiments, configurations, baselines.
//! File: ~/.devpulse/data/lab.db

use anyhow::Result;
use std::path::Path;
use std::sync::Arc;

// TODO: Sprint 2 - Replace with Lab's own implementation
use orchestrator::infra::libsql::Database;

/// Lab Database wrapper
///
/// Currently delegates to orchestrator::Database opened at Lab's path.
/// Sprint 2 will implement Lab-specific schema and methods.
pub struct LabDatabase {
    inner: Arc<Database>,
}

impl LabDatabase {
    /// Open Lab database
    pub async fn open(path: &Path) -> Result<Self> {
        let inner = Database::open(path).await?;
        Ok(Self {
            inner: Arc::new(inner),
        })
    }

    /// Get inner Database (for routes that need direct access)
    /// TODO: Remove this in Sprint 2 when Lab has own methods
    pub fn inner(&self) -> Arc<Database> {
        Arc::clone(&self.inner)
    }
}
