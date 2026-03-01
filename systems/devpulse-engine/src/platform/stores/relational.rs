//! Relational store wrapper (`LibSQL`).

use super::{Store, StoreRole};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::LibSqlAdapter;
use std::path::Path;
use std::sync::Arc;

/// Relational store backed by `LibSQL`.
pub struct RelationalStore {
    adapter: Arc<LibSqlAdapter>,
}

impl RelationalStore {
    /// Boot the relational store from a database path.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub async fn boot(path: &Path) -> Result<Self> {
        let adapter = LibSqlAdapter::open(path).await?;
        Ok(Self {
            adapter: Arc::new(adapter),
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<LibSqlAdapter> {
        &self.adapter
    }
}

impl Store for RelationalStore {
    fn name(&self) -> &'static str {
        "Relational store"
    }

    fn role(&self) -> StoreRole {
        StoreRole::Relational
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn is_ready(&self) -> bool {
        true
    }
}
