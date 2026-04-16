//! Tokio spawn wrappers that preserve `tracing::Span::current()`.

// SAFETY LOCK: this file is THE place in the workspace allowed to reference
// raw `tokio::spawn` / `tokio::task::spawn_blocking`. See ADR-002.
#![allow(clippy::disallowed_methods)]

use std::future::Future;
use tokio::task::JoinHandle;
use tracing::Instrument;

/// Span-preserving replacement for [`tokio::spawn`].
///
/// The spawned future is instrumented with `tracing::Span::current()` captured
/// at spawn time. Spans emitted inside the task become descendants of the
/// caller's current span rather than orphaned trace roots.
///
/// ```ignore
/// use devpulse_telemetry::prelude::*;
///
/// #[tracing::instrument]
/// async fn parent() {
///     spawn(async {
///         tracing::info!("child work"); // parented under `parent`'s span
///     });
/// }
/// ```
pub fn spawn<F>(future: F) -> JoinHandle<F::Output>
where
    F: Future + Send + 'static,
    F::Output: Send + 'static,
{
    tokio::spawn(future.instrument(tracing::Span::current()))
}

/// Span-preserving replacement for [`tokio::task::spawn_blocking`].
///
/// The blocking closure runs inside `Span::current().in_scope(...)` so any
/// `tracing::info!` / `debug!` / etc. calls inside the closure are scoped to
/// the caller's current span.
pub fn spawn_blocking<F, R>(f: F) -> JoinHandle<R>
where
    F: FnOnce() -> R + Send + 'static,
    R: Send + 'static,
{
    let span = tracing::Span::current();
    tokio::task::spawn_blocking(move || span.in_scope(f))
}
