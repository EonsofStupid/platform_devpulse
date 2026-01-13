// orchestrator/src/adapters/memory/moka.rs

//! Moka cache adapter
//!
//! High-performance concurrent cache with:
//! - LRU eviction
//! - TTL support
//! - Async-ready

use super::{MemoryAdapter, StorageKind};
use crate::adapters::StorageAdapter;
use anyhow::Result;
use async_trait::async_trait;
use std::sync::Arc;

/// Moka cache adapter for hot data
pub struct MokaAdapter {
    cache: Arc<moka::future::Cache<String, Vec<u8>>>,
}

impl MokaAdapter {
    /// Create new adapter with default config
    pub fn new() -> Self {
        let cache = moka::future::Cache::builder()
            .max_capacity(10_000)
            .time_to_live(std::time::Duration::from_secs(3600)) // 1 hour TTL
            .build();
        Self {
            cache: Arc::new(cache),
        }
    }

    /// Create with custom capacity
    pub fn with_capacity(max_entries: u64) -> Self {
        let cache = moka::future::Cache::builder()
            .max_capacity(max_entries)
            .time_to_live(std::time::Duration::from_secs(3600))
            .build();
        Self {
            cache: Arc::new(cache),
        }
    }

    /// Get cache stats
    pub fn stats(&self) -> CacheStats {
        CacheStats {
            entry_count: self.cache.entry_count(),
            weighted_size: self.cache.weighted_size(),
        }
    }

    /// Invalidate all entries
    pub fn clear(&self) {
        self.cache.invalidate_all();
    }
}

impl Default for MokaAdapter {
    fn default() -> Self {
        Self::new()
    }
}

impl MemoryAdapter for MokaAdapter {}

#[async_trait]
impl StorageAdapter for MokaAdapter {
    async fn store(&self, key: &str, value: &[u8]) -> Result<()> {
        self.cache.insert(key.to_string(), value.to_vec()).await;
        Ok(())
    }

    async fn load(&self, key: &str) -> Result<Option<Vec<u8>>> {
        Ok(self.cache.get(key).await)
    }

    async fn delete(&self, key: &str) -> Result<bool> {
        self.cache.invalidate(key).await;
        Ok(true)
    }

    async fn exists(&self, key: &str) -> Result<bool> {
        Ok(self.cache.contains_key(key))
    }

    fn storage_kind(&self) -> StorageKind {
        StorageKind::Memory
    }
}

/// Cache statistics
#[derive(Debug, Clone)]
pub struct CacheStats {
    pub entry_count: u64,
    pub weighted_size: u64,
}
