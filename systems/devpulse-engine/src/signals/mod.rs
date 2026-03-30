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
//! - `SinkKind`: Routing destinations
//! - `SignalRouter`: Broadcast channel

mod header;
mod kinds;
mod payloads;
mod router;
mod signal;
mod variants;

// Re-export public API
pub use header::{SignalHeader, SignalSource};
pub use kinds::SinkKind;
pub use payloads::*;
pub use router::SignalRouter;
pub use signal::Signal;
pub use variants::SignalVariant;
