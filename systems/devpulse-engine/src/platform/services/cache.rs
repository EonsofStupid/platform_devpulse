//! Cache store wrapper (`Moka`).

use super::{Store, StoreRole};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::{MokaAdapter, MokaCacheConfig};
use std::sync::Arc;

/// In-memory cache store backed by `Moka`.
pub struct CacheStore {
    adapter: Arc<MokaAdapter>,
}

impl CacheStore {
    /// Boot the cache store from configuration. Infallible.
    pub fn boot(config: MokaCacheConfig) -> Self {
        let adapter = MokaAdapter::new(config);
        Self {
            adapter: Arc::new(adapter),
        }
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<MokaAdapter> {
        &self.adapter
    }
}

impl Store for CacheStore {
    fn name(&self) -> &'static str {
        "Cache store"
    }

    fn role(&self) -> StoreRole {
        StoreRole::Cache
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping()
    }

    fn is_ready(&self) -> bool {
        true
    }
}
