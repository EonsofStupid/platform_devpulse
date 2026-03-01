//! Graph store wrapper (`SurrealDB`).

use super::{Store, StoreRole};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::SurrealAdapter;
use std::path::Path;
use std::sync::Arc;

/// Graph store backed by `SurrealDB`.
pub struct GraphStore {
    adapter: Arc<SurrealAdapter>,
}

impl GraphStore {
    /// Boot the graph store from a database path.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub async fn boot(path: &Path) -> Result<Self> {
        let adapter = SurrealAdapter::open(path).await?;
        Ok(Self {
            adapter: Arc::new(adapter),
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<SurrealAdapter> {
        &self.adapter
    }
}

impl Store for GraphStore {
    fn name(&self) -> &'static str {
        "Graph store"
    }

    fn role(&self) -> StoreRole {
        StoreRole::Graph
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn is_ready(&self) -> bool {
        true
    }
}
