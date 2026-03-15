//! Service modules — one wrapper per database engine.
//!
//! Each service wraps a maestro adapter with a uniform `Service` trait
//! for config-driven boot and health orchestration.

pub mod analytics;
pub mod cache;
pub mod graph;
pub mod relational;
#[cfg(feature = "rro")]
pub mod vector;
#[cfg(feature = "kokoros")]
pub mod voice;
#[cfg(feature = "outlines")]
pub mod grammar;

use anyhow::Result;

/// Identifies a service's role in the platform.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ServiceRole {
    /// Relational service (`LibSQL`).
    Relational,
    /// Analytics service (`DuckDB`).
    Analytics,
    /// Graph service (`SurrealDB`).
    Graph,
    /// In-memory cache (`Moka`).
    Cache,
    /// Vector service (`RRO`).
    Vector,
    /// Voice service (`Kokoros`).
    Voice,
    /// Grammar service (`outlines-core`).
    Grammar,
}

/// Uniform interface for all platform services.
#[allow(async_fn_in_trait)]
pub trait Service: Send + Sync {
    /// Human-readable name for health checks and events.
    fn name(&self) -> &'static str;

    /// This service's role.
    fn role(&self) -> ServiceRole;

    /// Ping the service — health check.
    async fn ping(&self) -> Result<()>;

    /// Whether the service is ready to serve.
    fn is_ready(&self) -> bool;

    /// Graceful shutdown — flush and release resources.
    ///
    /// Called during platform shutdown before process exit. Implementations
    /// should checkpoint WAL, flush buffers, and release file locks.
    /// Default is no-op for services that don't need explicit cleanup (e.g. Moka).
    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }
}
