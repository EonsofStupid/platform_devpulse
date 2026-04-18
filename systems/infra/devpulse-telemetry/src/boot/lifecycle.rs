//! Two-phase telemetry lifecycle: `init_early()` → `install_exporter()`.
//!
//! ## Phase 1: `init_early()` (line 1 of `main()`)
//!
//! Installs a [`BufferingProcessor`] that holds spans in RAM. Cannot fail.
//! Returns a [`TelemetryHandle`] used later to install the real exporter.
//!
//! ## Phase 2: `install_exporter(handle, data_dir)` (from `boot_task()`)
//!
//! Builds the real OTLP JSONL file exporter, drains the buffer, returns a
//! [`TelemetryGuard`] that must be held for the app's lifetime and explicitly
//! `.shutdown().await`-ed from Tauri's `RunEvent::Exit`.

use std::path::Path;

use opentelemetry::trace::TracerProvider as _;
use opentelemetry_sdk::trace::{BatchSpanProcessor, SdkTracerProvider};
use tracing_opentelemetry::OpenTelemetryLayer;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, Registry};

use super::buffering_processor::BufferingProcessor;
use crate::otel::exporter_file::FileSpanExporter;
use crate::otel::provider::build_provider;

/// Handle returned by [`init_early`]. Holds the buffering processor so that
/// [`install_exporter`] can drain it into the real processor.
pub struct TelemetryHandle {
    buffering: BufferingProcessor,
    provider: SdkTracerProvider,
}

/// Guard that holds the [`TracerProvider`]. Must be held for the app's lifetime.
///
/// ## Shutdown
///
/// Call `.shutdown()` explicitly from Tauri's `RunEvent::Exit` handler.
/// Sync `Drop` is a no-op with a warning log — sync drop silently loses
/// in-flight spans because the `BatchSpanProcessor` needs async time to flush.
pub struct TelemetryGuard {
    provider: SdkTracerProvider,
}

impl TelemetryGuard {
    /// Explicitly shut down the tracer provider, flushing all pending spans.
    ///
    /// This is the ONLY correct way to tear down telemetry. Do NOT rely on
    /// `Drop` — it cannot run async flush logic.
    pub fn shutdown(self) {
        if let Err(e) = self.provider.shutdown() {
            tracing::error!("Telemetry shutdown error: {e:?}");
        }
    }
}

impl Drop for TelemetryGuard {
    fn drop(&mut self) {
        tracing::warn!(
            "TelemetryGuard dropped without explicit shutdown() — \
             in-flight spans may be lost. Call guard.shutdown() from \
             Tauri RunEvent::Exit instead."
        );
    }
}

/// Phase 1: Install the telemetry subscriber with a buffering processor.
///
/// This MUST be the first line of `main()`. It cannot fail. Spans emitted
/// after this call are buffered in memory until [`install_exporter`] wires
/// the real file exporter.
///
/// ```ignore
/// fn main() {
///     let telemetry_handle = devpulse_telemetry::boot::init_early("0.1.0", "session-abc");
///     // ... progressive boot ...
///     let guard = devpulse_telemetry::boot::install_exporter(
///         telemetry_handle,
///         &data_dir.join("telemetry"),
///         3, // keep 3 session files
///     ).expect("telemetry exporter");
///     // ... app runs ...
///     guard.shutdown(); // from RunEvent::Exit
/// }
/// ```
#[must_use]
pub fn init_early(version: &str, session_id: &str) -> TelemetryHandle {
    let buffering = BufferingProcessor::new();

    // Build a provider with a clone of the buffering processor.
    // Both clones share the same Arc<Mutex<BufferState>> — install_inner()
    // on the TelemetryHandle's copy drains into the provider's copy.
    let provider = build_provider(buffering.clone(), version, session_id);

    // Build the tracing-opentelemetry layer from this provider's tracer.
    let tracer = provider.tracer("devpulse");
    let otel_layer = OpenTelemetryLayer::new(tracer);

    // Install the tracing subscriber: EnvFilter + OTel layer.
    // This is the global subscriber for the process — installed exactly once.
    // Additional layers (stderr pretty-print, JSON file, DuckDB) are added
    // by the existing logging.rs code which should layer on top via
    // tracing_subscriber::registry() — but since we're installing here,
    // logging.rs will need to be refactored in P4 to compose with this.
    //
    // For now, install a minimal subscriber: env filter + OTel.
    // P4 will compose all layers together.
    Registry::default()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(otel_layer)
        .init();

    TelemetryHandle {
        buffering,
        provider,
    }
}

/// Phase 2: Install the real file exporter and drain the boot-time buffer.
///
/// Creates the telemetry directory, opens a JSONL session file, rotates old
/// files, builds a `BatchSpanProcessor` around the file exporter, and drains
/// all buffered spans into it.
///
/// # Errors
///
/// Returns an error if the telemetry directory cannot be created or the
/// session file cannot be opened.
pub fn install_exporter(
    handle: TelemetryHandle,
    telemetry_dir: &Path,
    keep_sessions: usize,
) -> std::io::Result<TelemetryGuard> {
    // Rotate old session files before creating a new one.
    FileSpanExporter::rotate(telemetry_dir, keep_sessions)?;

    // Build the real file exporter + batch processor.
    let file_exporter = FileSpanExporter::new(telemetry_dir)?;
    let batch_processor = BatchSpanProcessor::builder(file_exporter).build();

    // Drain the boot-time buffer into the real processor.
    handle.buffering.install_inner(Box::new(batch_processor));

    Ok(TelemetryGuard {
        provider: handle.provider,
    })
}
