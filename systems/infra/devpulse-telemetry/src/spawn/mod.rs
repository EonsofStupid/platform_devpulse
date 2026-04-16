//! Span-preserving replacements for `tokio::spawn` and `tokio::task::spawn_blocking`.
//!
//! Raw `tokio::spawn` is banned workspace-wide via `clippy.toml`
//! `disallowed-methods`. Consumers use [`spawn`] / [`spawn_blocking`] from
//! this module (re-exported via [`crate::prelude`]).
//!
//! The underlying issue: `tokio::spawn` does NOT automatically inherit
//! `tracing::Span::current()` — spans emitted inside the spawned task are
//! orphaned from the caller's trace. These wrappers capture `Span::current()`
//! at spawn time and attach it via [`tracing::Instrument`].

pub mod tokio;

pub use self::tokio::{spawn, spawn_blocking};
