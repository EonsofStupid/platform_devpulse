//! Service modules — one wrapper per database engine.
//!
//! Each service wraps a clyffy adapter with a uniform `Service` trait
//! for config-driven boot and health orchestration.

pub mod analytics;
pub mod cache;
pub mod graph;
pub mod relational;
#[cfg(feature = "rro")]
pub mod vector;
#[cfg(feature = "kokoros")]
pub mod voice;
// Grammar service removed — llguidance integration is a future sprint
// #[cfg(feature = "outlines")]
// pub mod grammar;
#[cfg(feature = "candle")]
pub mod embedder;
#[cfg(feature = "candle")]
pub mod whisper;
#[cfg(feature = "inference")]
pub mod model_loader;
#[cfg(feature = "inference")]
pub mod model_loader_log;
pub mod devforge;

use anyhow::Result;
use serde::Serialize;
use specta::Type;

/// Identifies a service's role in the platform.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
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
    /// Grammar service (llguidance — constrained decoding). Future sprint.
    Grammar,
    /// Embedder service (Candle — dense text embedding).
    Embedder,
    /// Whisper service (Candle — speech-to-text).
    Whisper,
    /// DevForge service (managed VSCode process).
    DevForge,
    /// Model Loader service (AI model management, inference).
    ModelLoader,
}

/// Lifecycle state of a platform service.
///
/// Enterprise boot state machine. Services transition through these states
/// during boot and runtime. The platform never lies about service state.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
pub enum ServiceState {
    /// Service constructed but boot not yet attempted.
    Created,
    /// Boot in progress — initializing engine, opening files, connecting.
    Booting,
    /// Boot completed and health check passed. Serving requests.
    Ready,
    /// Was ready, but health check failed. May recover on next ping.
    Degraded,
    /// Boot failed or unrecoverable error. Not serving.
    Failed,
}

/// Uniform interface for all platform services.
#[allow(async_fn_in_trait)]
pub trait Service: Send + Sync {
    /// Human-readable name for health checks and events.
    fn name(&self) -> &'static str;

    /// This service's role.
    fn role(&self) -> ServiceRole;

    /// Ping the service — health check. Must do real work.
    async fn ping(&self) -> Result<()>;

    /// Current lifecycle state of this service.
    fn state(&self) -> ServiceState;

    /// Graceful shutdown — flush and release resources.
    ///
    /// Called during platform shutdown before process exit. Implementations
    /// should checkpoint WAL, flush buffers, and release file locks.
    /// Default is no-op for services that don't need explicit cleanup (e.g. Moka).
    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }
}
