//! OpenTelemetry context-propagating channel wrappers.
//!
//! Rust async channels (`flume`, `tokio::sync::broadcast`, `tokio::sync::mpsc`)
//! are opaque to the `tracing` subscriber. A span on the producer side has no
//! causal relationship with a span on the consumer side unless
//! `opentelemetry::Context` is carried explicitly inside the payload.
//!
//! This module defines [`Envelope<T>`] as the universal wire format and
//! provides two receiver unwrap shapes:
//!
//! - [`Traced<T>`] — flume/1:1 semantics. Consumer attaches the producer's
//!   context as the current `OTel` context via [`Traced::attach`], so spans
//!   created in the consumer scope become descendants of the producer's span.
//! - `LinkedTraced<T>` — broadcast/1:N fan-out semantics (P2b). Consumer
//!   retrieves the producer's context as a **link** to add to their own span,
//!   so N subscribers are not incorrectly modeled as N children.
//!
//! ## Doctrine
//!
//! Raw `flume::Sender` / `flume::Receiver` and `tokio::sync::broadcast::Sender`
//! / `tokio::sync::broadcast::Receiver` are banned workspace-wide via
//! `clippy.toml` `disallowed-types`. This module's submodules are the only
//! places in the workspace allowed to `#![allow(clippy::disallowed_types)]`.

pub mod broadcast;
pub mod envelope;
pub mod flume;

pub use self::broadcast::{
    BroadcastReceiver, BroadcastSender, LinkedTraced, channel as broadcast_channel,
};
pub use self::flume::{TracedReceiver, TracedSender, bounded, unbounded};
pub use envelope::{Envelope, Traced};
