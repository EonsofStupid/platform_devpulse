//! Two-phase telemetry lifecycle: `prepare()` → `install_exporter()`.
//!
//! ## Phase 1: `prepare()` (before subscriber install)
//!
//! Creates a [`BufferingProcessor`] and builds the OTel layer. Returns a
//! [`TelemetrySetup`] whose layer must be composed into the global subscriber
//! by the caller (typically `logging::init()`). Does NOT install a subscriber.
//!
//! ## Phase 2: `install_exporter(handle, data_dir)` (from `boot_task()`)
//!
//! Builds the real OTLP JSONL file exporter, drains the buffer, returns a
//! [`TelemetryGuard`] that must be held for the app's lifetime and explicitly
//! `.shutdown()`-ed from Tauri's `RunEvent::Exit`.

use std::path::Path;

use opentelemetry::trace::TracerProvider as _;
use opentelemetry_sdk::trace::{BatchSpanProcessor, SdkTracerProvider, Tracer};
use tracing_opentelemetry::OpenTelemetryLayer;
use tracing_subscriber::Registry;

/// Concrete type of the OTel tracing layer. Exposed as a type alias so
/// consumers (`logging.rs`) can accept it without knowing the generics.
pub type TelemetryLayer = OpenTelemetryLayer<Registry, Tracer>;

use super::buffering_processor::BufferingProcessor;
use crate::otel::exporter_file::FileSpanExporter;
use crate::otel::provider::build_provider;

/// Handle returned by [`prepare`]. Holds the buffering processor so that
/// [`install_exporter`] can drain it into the real processor.
pub struct TelemetryHandle {
    buffering: BufferingProcessor,
    provider: SdkTracerProvider,
}

/// Result of [`prepare`]: a handle for later exporter installation, plus
/// the OTel layer to compose into the global tracing subscriber.
pub struct TelemetrySetup {
    /// Handle — pass to [`install_exporter`] after data dir is known.
    pub handle: TelemetryHandle,
    /// OTel layer — compose into the tracing subscriber via `.with(layer)`.
    /// This layer is inert until [`install_exporter`] drains the buffer.
    pub layer: TelemetryLayer,
}

/// Guard that holds the [`SdkTracerProvider`]. Must be held for the app's lifetime.
///
/// ## Shutdown
///
/// Call `.shutdown()` explicitly from Tauri's `RunEvent::Exit` handler.
/// Sync `Drop` emits a warning if `shutdown()` was not called first —
/// sync drop silently loses in-flight spans.
pub struct TelemetryGuard {
    provider: Option<SdkTracerProvider>,
}

impl TelemetryGuard {
    /// Explicitly shut down the tracer provider, flushing all pending spans.
    ///
    /// This is the ONLY correct way to tear down telemetry. Do NOT rely on
    /// `Drop` — it cannot run async flush logic.
    pub fn shutdown(mut self) {
        if let Some(provider) = self.provider.take() {
            if let Err(e) = provider.shutdown() {
                tracing::error!("Telemetry shutdown error: {e:?}");
            }
        }
        // provider is None now — Drop won't warn.
    }
}

impl Drop for TelemetryGuard {
    fn drop(&mut self) {
        if self.provider.is_some() {
            tracing::warn!(
                "TelemetryGuard dropped without explicit shutdown() — \
                 in-flight spans may be lost. Call guard.shutdown() from \
                 Tauri RunEvent::Exit instead."
            );
        }
    }
}

/// Phase 1: Build the OTel provider and layer WITHOUT installing a subscriber.
///
/// The returned [`TelemetrySetup`] contains:
/// - `handle` — pass to [`install_exporter`] after data dir resolves
/// - `layer` — compose into your subscriber via `.with(setup.layer)`
///
/// This function cannot fail. Spans emitted after the subscriber is installed
/// are buffered in memory until [`install_exporter`] wires the real file exporter.
///
/// ```ignore
/// // In Tauri setup:
/// let setup = devpulse_telemetry::boot::prepare("0.1.0", "session-abc");
/// // ... resolve data_dir ...
/// // Install subscriber with OTel layer + other layers:
/// tracing_subscriber::registry()
///     .with(env_filter)
///     .with(stderr_layer)
///     .with(json_file_layer)
///     .with(duckdb_layer)
///     .with(setup.layer)   // <-- OTel layer composed here
///     .init();
/// // ... boot continues ...
/// let guard = devpulse_telemetry::boot::install_exporter(
///     setup.handle,
///     &data_dir.join("telemetry"),
///     3,
/// ).expect("telemetry exporter");
/// // ... app runs ...
/// guard.shutdown(); // from RunEvent::Exit
/// ```
#[must_use]
pub fn prepare(version: &str, session_id: &str) -> TelemetrySetup {
    let buffering = BufferingProcessor::new();

    // Build a provider with a clone of the buffering processor.
    // Both clones share the same Arc<Mutex<BufferState>> — install_inner()
    // on the TelemetryHandle's copy drains into the provider's copy.
    let provider = build_provider(buffering.clone(), version, session_id);

    // Build the tracing-opentelemetry layer from this provider's tracer.
    let tracer = provider.tracer("devpulse");
    let otel_layer = OpenTelemetryLayer::new(tracer);

    TelemetrySetup {
        handle: TelemetryHandle {
            buffering,
            provider,
        },
        layer: otel_layer,
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
    // Ensure directory exists before rotation or file creation.
    std::fs::create_dir_all(telemetry_dir)?;

    // Rotate old session files before creating a new one.
    // (rotate reads the directory, so it must exist first)
    let _ = FileSpanExporter::rotate(telemetry_dir, keep_sessions);

    // Build the real file exporter + batch processor.
    let file_exporter = FileSpanExporter::new(telemetry_dir)?;
    let batch_processor = BatchSpanProcessor::builder(file_exporter).build();

    // Drain the boot-time buffer into the real processor.
    handle.buffering.install_inner(Box::new(batch_processor));

    Ok(TelemetryGuard {
        provider: Some(handle.provider),
    })
}
