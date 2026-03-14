//! Graph store wrapper (`SurrealDB`).

use super::{Store, StoreRole};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::SurrealAdapter;
use std::path::Path;
use std::sync::Arc;

/// Graph store backed by `SurrealDB`.
pub struct GraphStore {
    adapter: Arc<SurrealAdapter>,
    /// Scoped name for health checks (e.g., "System graph", "User graph").
    label: &'static str,
}

impl GraphStore {
    /// Boot the graph store with explicit namespace and database.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub async fn boot(path: &Path, namespace: &str, database: &str, label: &'static str) -> Result<Self> {
        let adapter = SurrealAdapter::open_with_ns(path, namespace, database).await?;
        Ok(Self {
            adapter: Arc::new(adapter),
            label,
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<SurrealAdapter> {
        &self.adapter
    }
}

impl Store for GraphStore {
    fn name(&self) -> &'static str {
        self.label
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
