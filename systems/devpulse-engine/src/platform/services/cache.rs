//! Cache service wrapper (`Moka`).

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_clyffy::cortex::persistence::{MokaAdapter, MokaCacheConfig};
use std::sync::Arc;

/// In-memory cache store backed by `Moka`.
pub struct CacheService {
    adapter: Arc<MokaAdapter>,
}

impl CacheService {
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

impl Service for CacheService {
    fn name(&self) -> &'static str {
        "Cache service"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Cache
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }
}
