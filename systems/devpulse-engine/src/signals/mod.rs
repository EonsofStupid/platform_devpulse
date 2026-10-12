//! Signal system - the public API for signal-based communication.
//!
//! # Architecture
//!
//! Engine owns the signal types. Clyffy subscribes.
//!
//! ```text
//! Desktop -> Engine.emit(Signal) -> SignalRouter -> Clyffy.subscribe()
//!                                                -> Desktop.subscribe()
//!                                                -> Analytics sink
//! ```
//!
//! # Types
//!
//! - `Signal`: Complete broadcast packet (header + payload)
//! - `SignalHeader`: 4 atomic metadata fields
//! - `SignalSource`: Provenance enum
//! - `SignalVariant`: Typed payload enum
//! - `SignalKind`: Payload-free kind, generated from `SignalVariant`
//! - `SignalSpec`: Per-kind contract entry (delivery, audience, sinks, version);
//!   tuning (rates, sampling) is configuration — `SignalsConfig`
//! - `SinkKind`: Routing destinations
//! - `SignalRouter`: Broadcast channel + interest registry
//! - `StateStore`: Latest value per state kind, with a revision

mod header;
mod kinds;
mod payloads;
mod router;
mod signal;
mod spec;
mod state;
mod variants;

// Re-export public API
pub use header::{SignalHeader, SignalSource};
pub use kinds::SinkKind;
pub use payloads::*;
pub use router::SignalRouter;
pub use signal::Signal;
pub use spec::{Audience, Delivery, SignalSpec};
pub use state::{StateSnapshot, StateStore};
pub use variants::{SignalKind, SignalVariant};
