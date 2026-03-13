//! Store modules — one wrapper per database.
//!
//! Each store wraps a maestro adapter with a uniform `Store` trait
//! for config-driven boot and health orchestration.

pub mod analytics;
pub mod cache;
pub mod graph;
pub mod relational;
pub mod vector;

use anyhow::Result;

/// Identifies a store's role in the platform.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StoreRole {
    /// Relational store (`LibSQL`).
    Relational,
    /// Analytics store (`DuckDB`).
    Analytics,
    /// Graph store (`SurrealDB`).
    Graph,
    /// In-memory cache (`Moka`).
    Cache,
    /// Vector store (`RRO`).
    Vector,
}

/// Uniform interface for all platform stores.
#[allow(async_fn_in_trait)]
pub trait Store: Send + Sync {
    /// Human-readable name for health checks and events.
    fn name(&self) -> &'static str;

    /// This store's role.
    fn role(&self) -> StoreRole;

    /// Ping the store — health check.
    async fn ping(&self) -> Result<()>;

    /// Whether the store is ready to serve.
    fn is_ready(&self) -> bool;
}
