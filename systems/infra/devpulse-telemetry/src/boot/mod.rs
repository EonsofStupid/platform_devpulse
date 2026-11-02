//! Boot-order safety: `BufferingProcessor` + `prepare()` / `install_exporter()` lifecycle.
//!
//! The telemetry provider is created early via [`prepare`], which returns a
//! composable `OTel` layer and a [`TelemetryHandle`]. The caller installs the
//! layer as part of the global `tracing_subscriber::Registry` alongside other
//! layers (stderr, JSON file, `DuckDB`).
//!
//! At that point the data directory may not yet be resolved, so no file
//! exporter is wired. Spans emitted during boot are held in a bounded
//! in-memory buffer by [`BufferingProcessor`]. When `boot_task()` resolves the
//! data directory, [`install_exporter`] drains the buffer into the real
//! `BatchSpanProcessor` + file exporter.
//!
//! The returned [`TelemetryGuard`] must be held for the lifetime of the
//! application and explicitly `.shutdown()`-ed from Tauri's
//! `RunEvent::Exit` handler. Sync `Drop` is a no-op with a warning log
//! because it silently loses in-flight spans.

pub mod buffering_processor;
pub mod lifecycle;

pub use lifecycle::{
    TelemetryGuard, TelemetryHandle, TelemetryInfo, TelemetryLayer, TelemetrySetup,
    install_exporter, prepare,
};
