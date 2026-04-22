//! Tokio spawn wrappers that preserve `tracing::Span::current()` AND
//! capture panics into the structured tracing pipeline.
//!
//! # What raw `tokio::spawn` lacks
//!
//! 1. **Span correlation.** A future spawned with raw `tokio::spawn` runs
//!    in a fresh span context. Events inside become orphaned trace roots.
//!    These wrappers capture `Span::current()` at spawn time and
//!    re-enter it inside the task.
//!
//! 2. **Panic visibility.** When a task panics, Tokio catches the unwind
//!    and marks the `JoinHandle` as panicked. The global `std::panic`
//!    hook fires (writing the session `crash-{ts}.json` in debug builds),
//!    but the panic is never emitted as a `tracing::error!` within the
//!    task's span context — so span-correlated viewers (`DuckDB` spans,
//!    `OTel` traces) show the panicked span as "never completed" with no
//!    cause. These wrappers catch the unwind, emit a structured
//!    `tracing::error!`, then `resume_unwind` so `JoinHandle::await`
//!    still sees the panic correctly.
//!
//! # Safety
//!
//! `AssertUnwindSafe` is used because `std::panic::UnwindSafe` isn't
//! implemented for `Future` by default. This is the exact pattern Tokio
//! itself uses internally to catch task panics; re-applying it at the
//! wrapper level is the same safety trade-off.

// SAFETY LOCK: this file is THE place in the workspace allowed to reference
// raw `tokio::spawn` / `tokio::task::spawn_blocking`. See ADR-002.
#![allow(clippy::disallowed_methods)]

use std::any::Any;
use std::future::Future;
use std::panic::AssertUnwindSafe;

use futures::future::FutureExt;
use tokio::task::JoinHandle;
use tracing::Instrument;

/// Span-preserving, panic-observing replacement for [`tokio::spawn`].
///
/// Captures `tracing::Span::current()` at spawn time so events inside the
/// task are parented under the caller's span rather than orphaned. On
/// panic, emits a structured `tracing::error!(target = "spawn_panic", ...)`
/// inside the span context, then `resume_unwind` so the `JoinHandle`
/// still reports the panic.
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
    let span = tracing::Span::current();
    tokio::spawn(async move {
        let task = future.instrument(span);
        match AssertUnwindSafe(task).catch_unwind().await {
            Ok(output) => output,
            Err(panic) => {
                emit_spawn_panic("spawn", &panic);
                std::panic::resume_unwind(panic);
            }
        }
    })
}

/// Span-preserving, panic-observing replacement for [`tokio::task::spawn_blocking`].
///
/// The blocking closure runs inside `Span::current().in_scope(...)` so any
/// `tracing::info!` / `debug!` / etc. calls inside the closure are scoped
/// to the caller's current span. On panic, emits a structured
/// `tracing::error!(target = "spawn_panic", ...)` then re-raises so the
/// `JoinHandle` still reports the panic.
pub fn spawn_blocking<F, R>(f: F) -> JoinHandle<R>
where
    F: FnOnce() -> R + Send + 'static,
    R: Send + 'static,
{
    let span = tracing::Span::current();
    tokio::task::spawn_blocking(move || {
        let guarded = AssertUnwindSafe(|| span.in_scope(f));
        match std::panic::catch_unwind(guarded) {
            Ok(output) => output,
            Err(panic) => {
                emit_spawn_panic("spawn_blocking", &panic);
                std::panic::resume_unwind(panic);
            }
        }
    })
}

/// Emit a `tracing::error!` describing a panicked spawned task.
///
/// The global `std::panic` hook has already fired by the time we reach
/// here (writing the session `crash-{ts}.json`); this emission adds
/// span-correlated context so `DuckDB` / `OTel` viewers can attribute the
/// failure to the specific parent span.
fn emit_spawn_panic(spawn_kind: &'static str, payload: &Box<dyn Any + Send>) {
    let message = extract_panic_message(payload);
    let thread = std::thread::current()
        .name()
        .unwrap_or("<unnamed>")
        .to_string();
    // `force_capture` ignores `RUST_BACKTRACE`; we want the backtrace
    // regardless so post-mortem is complete.
    let backtrace = std::backtrace::Backtrace::force_capture();
    tracing::error!(
        target: "spawn_panic",
        spawn_kind = spawn_kind,
        thread = %thread,
        panic = %message,
        backtrace = %backtrace,
        "spawned task panicked",
    );
}

/// Best-effort extraction of a panic payload into a human-readable string.
///
/// Matches the pattern used by the desktop panic hook so crash JSON and
/// tracing emissions use the same text.
fn extract_panic_message(payload: &Box<dyn Any + Send>) -> String {
    if let Some(s) = payload.downcast_ref::<&str>() {
        (*s).to_string()
    } else if let Some(s) = payload.downcast_ref::<String>() {
        s.clone()
    } else {
        "<non-string panic payload>".to_string()
    }
}

// ════════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn spawn_returns_future_output_on_success() {
        let handle = spawn(async { 42_u32 });
        assert_eq!(handle.await.unwrap(), 42);
    }

    #[tokio::test]
    async fn spawn_blocking_returns_closure_output_on_success() {
        let handle = spawn_blocking(|| 7_u32 + 35);
        assert_eq!(handle.await.unwrap(), 42);
    }

    #[tokio::test]
    async fn spawn_propagates_panic_through_join_handle() {
        // Suppress the default panic output for this test so the
        // captured JoinError is the only signal.
        let prev = std::panic::take_hook();
        std::panic::set_hook(Box::new(|_| {}));
        let handle = spawn(async {
            panic!("intentional test panic");
        });
        let result = handle.await;
        std::panic::set_hook(prev);

        let err = result.expect_err("expected join error");
        assert!(err.is_panic(), "JoinError must report panic");
    }

    #[tokio::test]
    async fn spawn_blocking_propagates_panic_through_join_handle() {
        let prev = std::panic::take_hook();
        std::panic::set_hook(Box::new(|_| {}));
        let handle = spawn_blocking(|| {
            panic!("intentional blocking panic");
        });
        let result = handle.await;
        std::panic::set_hook(prev);

        let err = result.expect_err("expected join error");
        assert!(err.is_panic(), "JoinError must report panic");
    }
}
