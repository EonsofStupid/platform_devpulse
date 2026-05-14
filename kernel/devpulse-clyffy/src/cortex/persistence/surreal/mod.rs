//! Surreal — embedded SurrealKV store + WS-free protocol client.
//!
//! Two adjacent files cover the two genuinely-different mental models
//! of talking to `SurrealDB` 3.0 in embedded mode:
//!
//! - [`lifecycle`] owns the on-disk SurrealKV store: open, ping, drop-
//!   to-release. No child process, no port allocator. Returns a
//!   `SurrealLifecycle` whose live `Surreal<Db>` connection backs
//!   every namespace.
//! - [`client`] owns namespace-scoped query operations + the
//!   `ScopedGraphHandle` surface. Built from a `SurrealLifecycle`.
//!
//! Two files, one domain — distinct concerns, single namespace.

pub mod client;
pub mod intelligence_impl;
pub mod lifecycle;

pub use client::{ScopedGraphHandle, SurrealAdapter};
pub use lifecycle::{SurrealConfig, SurrealLifecycle};
