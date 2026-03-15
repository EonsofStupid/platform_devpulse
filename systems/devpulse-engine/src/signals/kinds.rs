//! Sink kinds - where signals get routed.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Destination for signal routing.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SinkKind {
    /// Broadcast to all subscribers (Desktop, UI updates)
    Broadcast,
    /// Cache layer (moka, fast access)
    Cache,
    /// Durable storage (libsql)
    Durable,
    /// Vector service (embedding search)
    Vector,
    /// Parking lot (deferred processing)
    Parking,
    /// Analytics pipeline (`DuckDB`)
    Analytics,
}

impl SinkKind {
    /// Get all sink kinds for iteration.
    pub fn all() -> &'static [SinkKind] {
        &[
            SinkKind::Broadcast,
            SinkKind::Cache,
            SinkKind::Durable,
            SinkKind::Vector,
            SinkKind::Parking,
            SinkKind::Analytics,
        ]
    }
}
