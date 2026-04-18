//! Prelude — re-exports the foundational primitives 99% of callers need.
//!
//! ```ignore
//! use devpulse_telemetry::prelude::*;
//!
//! // Instead of `tokio::spawn` (banned by clippy workspace-wide):
//! spawn(async { /* inherits parent span */ }).await.unwrap();
//!
//! // Instead of raw `flume::unbounded` (banned by clippy workspace-wide):
//! let (tx, rx) = unbounded::<MyMessage>();
//! tx.send(MyMessage::new())?;
//! let traced = rx.recv_async().await?;
//! let (payload, _cx) = traced.attach();
//! ```

pub use crate::channel::{
    bounded, broadcast_channel, unbounded, BroadcastReceiver, BroadcastSender, Envelope,
    LinkedTraced, Traced, TracedReceiver, TracedSender,
};
pub use crate::spawn::{spawn, spawn_blocking};

/// Re-export of [`tracing::Instrument`] so consumers can `.instrument(...)`
/// ad-hoc futures without a separate `use tracing::Instrument;`.
pub use tracing::Instrument;
