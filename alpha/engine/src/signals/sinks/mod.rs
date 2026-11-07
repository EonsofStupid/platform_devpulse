// engine/src/signals/sinks/mod.rs

//! Sink handlers for signal processing
//!
//! Each sink handler is responsible for persisting signal data
//! to its designated storage backend.

mod analytics;
mod cache;
mod durable;
mod parking;
mod vector;

pub use analytics::AnalyticsSink;
pub use cache::CacheSink;
pub use durable::DurableSink;
pub use parking::ParkingSink;
pub use vector::VectorSink;

use crate::Signal;

/// Trait for signal sink handlers
#[async_trait::async_trait]
pub trait SignalSink: Send + Sync {
    /// Process a signal for this sink
    async fn process(&self, signal: &Signal);

    /// Sink name for logging
    fn name(&self) -> &'static str;
}
