// orchestrator/src/adapters/memory/mod.rs

//! Memory adapters - in-memory caching and hot data
//!
//! These adapters provide fast access to frequently-used data:
//! - Moka cache (LRU with TTL)
//! - Session state
//! - Hot embeddings
//!
//! NOTE: Memory adapters are STORAGE backends, not inference sources.
//! They don't use shared::AdapterKind (which is for inference).

mod moka;

pub use self::moka::MokaAdapter;

/// Storage backend kind (internal to orchestrator)
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StorageKind {
    /// In-memory cache (moka)
    Memory,
    // Future: Postgres, Fjall, etc.
}

/// Marker trait for memory/cache adapters
pub trait MemoryAdapter {
    fn storage_kind(&self) -> StorageKind {
        StorageKind::Memory
    }
}
