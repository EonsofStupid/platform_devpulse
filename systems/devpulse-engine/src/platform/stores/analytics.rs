//! Analytics store wrapper (`DuckDB`).

use super::{Store, StoreRole};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::DuckDbAdapter;
use std::path::Path;
use std::sync::Arc;

/// Analytics store backed by `DuckDB`.
pub struct AnalyticsStore {
    adapter: Arc<DuckDbAdapter>,
}

impl AnalyticsStore {
    /// Boot the analytics store from a database path.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub fn boot(path: &Path) -> Result<Self> {
        let adapter = DuckDbAdapter::open(path)?;
        Ok(Self {
            adapter: Arc::new(adapter),
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<DuckDbAdapter> {
        &self.adapter
    }
}

impl Store for AnalyticsStore {
    fn name(&self) -> &'static str {
        "Analytics store"
    }

    fn role(&self) -> StoreRole {
        StoreRole::Analytics
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn is_ready(&self) -> bool {
        true
    }
}
