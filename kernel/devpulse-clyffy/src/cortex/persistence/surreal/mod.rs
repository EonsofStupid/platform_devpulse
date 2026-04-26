//! Surreal — managed `surreal start` child process + WS protocol client.
//!
//! Two adjacent files cover the two genuinely-different mental models
//! of talking to `SurrealDB`:
//!
//! - [`lifecycle`] owns the OS-level child: port allocator, spawn, health
//!   poll, kill-on-shutdown. Returns a [`SurrealEndpoint`] that's good
//!   for either an attached or a managed run.
//! - [`client`] owns the WebSocket protocol client + scoped namespace
//!   handles. Built from a `SurrealEndpoint`.
//!
//! Two files, one domain — distinct concerns, single namespace.

pub mod client;
pub mod lifecycle;

pub use client::{ScopedGraphHandle, SurrealAdapter};
pub use lifecycle::{SurrealConfig, SurrealEndpoint, SurrealLifecycle};
