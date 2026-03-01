//! Moka in-memory cache adapter
//!
//! Provides a high-performance concurrent cache for hot data.
//! Wraps `moka::future::Cache` with TTL and idle-based eviction.

use crate::cortex::persistence::traits::{CacheAdapter, PersistenceAdapter};
use anyhow::Result;
use std::time::Duration;

/// Configuration for the Moka cache.
#[derive(Debug, Clone, Copy)]
pub struct MokaCacheConfig {
    /// Maximum number of entries.
    pub max_capacity: u64,
    /// Time-to-live for entries.
    pub time_to_live: Duration,
    /// Time-to-idle for entries (evict if not accessed).
    pub time_to_idle: Duration,
}

impl Default for MokaCacheConfig {
    fn default() -> Self {
        Self {
            max_capacity: 10_000,
            time_to_live: Duration::from_secs(300),
            time_to_idle: Duration::from_secs(60),
        }
    }
}

/// Moka in-memory cache adapter.
pub struct MokaAdapter {
    cache: moka::future::Cache<String, Vec<u8>>,
    max_capacity: u64,
}

impl MokaAdapter {
    /// Create a new Moka cache with the given configuration.
    pub fn new(config: MokaCacheConfig) -> Self {
        let cache = moka::future::Cache::builder()
            .max_capacity(config.max_capacity)
            .time_to_live(config.time_to_live)
            .time_to_idle(config.time_to_idle)
            .build();

        Self {
            cache,
            max_capacity: config.max_capacity,
        }
    }

    /// Create a cache with default settings.
    pub fn default_cache() -> Self {
        Self::new(MokaCacheConfig::default())
    }

    /// Health check — always succeeds for in-memory cache.
    ///
    /// # Errors
    /// Never fails for an in-memory cache; returns `Ok(())` unconditionally.
    pub fn ping(&self) -> Result<()> {
        Ok(())
    }
}

impl PersistenceAdapter for MokaAdapter {
    async fn set(&self, key: &str, value: &[u8]) -> Result<()> {
        self.cache.insert(key.to_string(), value.to_vec()).await;
        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        Ok(self.cache.get(key).await)
    }

    async fn delete(&self, key: &str) -> Result<bool> {
        let existed = self.cache.get(key).await.is_some();
        self.cache.invalidate(key).await;
        Ok(existed)
    }

    async fn exists(&self, key: &str) -> Result<bool> {
        Ok(self.cache.get(key).await.is_some())
    }
}

impl CacheAdapter for MokaAdapter {
    async fn invalidate_prefix(&self, prefix: &str) -> Result<u64> {
        // Moka doesn't support prefix scanning natively.
        // A future iteration can maintain a secondary index if needed.
        let _ = prefix;
        Ok(0)
    }

    fn stats(&self) -> (u64, u64) {
        (self.cache.entry_count(), self.max_capacity)
    }

    async fn clear(&self) {
        self.cache.invalidate_all();
    }

    fn entry_count(&self) -> u64 {
        self.cache.entry_count()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cortex::persistence::traits::PersistenceAdapter;

    #[tokio::test]
    async fn moka_set_get_delete() {
        let cache = MokaAdapter::default_cache();

        // Set
        cache.set("hello", b"world").await.expect("set failed");

        // Get
        let val = cache.get("hello").await.expect("get failed");
        assert_eq!(val, Some(b"world".to_vec()));

        // Delete
        let deleted = cache.delete("hello").await.expect("delete failed");
        assert!(deleted);

        // Verify deleted
        let val = cache.get("hello").await.expect("get failed");
        assert_eq!(val, None);
    }

    #[test]
    fn moka_ping_always_ok() {
        let cache = MokaAdapter::default_cache();
        assert!(cache.ping().is_ok());
    }

    #[tokio::test]
    async fn moka_stats() {
        let config = MokaCacheConfig {
            max_capacity: 100,
            ..MokaCacheConfig::default()
        };
        let cache = MokaAdapter::new(config);

        let (count, max) = cache.stats();
        assert_eq!(count, 0);
        assert_eq!(max, 100);
    }
}
