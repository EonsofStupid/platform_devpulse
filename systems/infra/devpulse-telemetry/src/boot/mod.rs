//! Boot-order safety: `BufferingProcessor` + `init_early()` / `install_exporter()` lifecycle.
//!
//! The telemetry provider is installed at the very first line of `main()` via
//! [`init_early`]. At that point the data directory is not yet resolved, so no
//! file exporter can be wired. Spans emitted during boot are held in a bounded
//! in-memory buffer by [`BufferingProcessor`]. When `boot_task()` resolves the
//! data directory, [`install_exporter`] drains the buffer into the real
//! `BatchSpanProcessor` + file exporter.
//!
//! The returned [`TelemetryGuard`] must be held for the lifetime of the
//! application and explicitly `.shutdown().await`-ed from Tauri's
//! `RunEvent::Exit` handler. Sync `Drop` is a no-op with a warning log
//! because it silently loses in-flight spans.

pub mod buffering_processor;
pub mod lifecycle;

pub use lifecycle::{init_early, install_exporter, TelemetryGuard, TelemetryHandle};
