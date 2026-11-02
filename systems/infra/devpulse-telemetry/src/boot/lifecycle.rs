//! Two-phase telemetry lifecycle: `prepare()` → `install_exporter()`.
//!
//! ## Phase 1: `prepare()` (before subscriber install)
//!
//! Creates a [`BufferingProcessor`] and builds the `OTel` layer. Returns a
//! [`TelemetrySetup`] whose layer must be composed into the global subscriber
//! by the caller (typically `logging::init()`). Does NOT install a subscriber.
//!
//! ## Phase 2: `install_exporter(handle, data_dir)` (from `boot_task()`)
//!
//! Builds the real OTLP JSONL file exporter, drains the buffer, returns a
//! [`TelemetryGuard`] that must be held for the app's lifetime and explicitly
//! `.shutdown()`-ed from Tauri's `RunEvent::Exit`.

use std::path::{Path, PathBuf};
use std::time::SystemTime;

use opentelemetry::trace::TracerProvider as _;
use opentelemetry_sdk::trace::{BatchSpanProcessor, SdkTracerProvider, Tracer};
use tracing_opentelemetry::OpenTelemetryLayer;
use tracing_subscriber::Registry;

/// Concrete type of the `OTel` tracing layer. Exposed as a type alias so
/// consumers (`logging.rs`) can accept it without knowing the generics.
pub type TelemetryLayer = OpenTelemetryLayer<Registry, Tracer>;

use super::buffering_processor::BufferingProcessor;
use crate::otel::exporter_file::FileSpanExporter;
use crate::otel::provider::build_provider;

/// Runtime-queryable facts about the telemetry pipeline.
///
/// Lives on the [`TelemetryGuard`] so Tauri IPC commands can report
/// exporter status, storage location, retention, and service identity
/// to the devtool UI without duplicate config.
#[derive(Debug, Clone)]
pub struct TelemetryInfo {
    /// Semver of the running binary. Surfaces as `OTel` `service.version`.
    pub service_version: String,
    /// Per-launch session id, e.g. `"session-20260419-124509"`.
    pub session_id: String,
    /// Absolute path to the directory holding `spans-*.otlp.jsonl` files.
    /// `None` while `prepare()` has been called but `install_exporter()` has not.
    pub telemetry_dir: Option<PathBuf>,
    /// How many session files to retain on next rotation.
    /// `None` before `install_exporter()` resolves retention.
    pub keep_sessions: Option<usize>,
    /// The current JSONL file being written. `None` before the exporter installs.
    pub current_session_file: Option<PathBuf>,
    /// `SystemTime` when [`prepare`] captured initial state. Used by the
    /// devtool to report "telemetry up for Xm Ys".
    pub started_at: SystemTime,
    /// `SystemTime` the exporter actually took over from the buffer.
    /// `None` before `install_exporter()`.
    pub exporter_installed_at: Option<SystemTime>,
}

/// Handle returned by [`prepare`]. Holds the buffering processor so that
/// [`install_exporter`] can drain it into the real processor.
pub struct TelemetryHandle {
    buffering: BufferingProcessor,
    provider: SdkTracerProvider,
    info: TelemetryInfo,
}

/// Result of [`prepare`]: a handle for later exporter installation, plus
/// the `OTel` layer to compose into the global tracing subscriber.
pub struct TelemetrySetup {
    /// Handle — pass to [`install_exporter`] after data dir is known.
    pub handle: TelemetryHandle,
    /// `OTel` layer — compose into the tracing subscriber via `.with(layer)`.
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
    info: TelemetryInfo,
}

impl TelemetryGuard {
    /// Read a snapshot of the current telemetry pipeline state.
    ///
    /// Used by Tauri IPC commands to feed the devtool status panels.
    /// Clone-cheap (strings + paths), no locks held past return.
    #[must_use]
    pub fn info(&self) -> TelemetryInfo {
        self.info.clone()
    }

    /// Explicitly shut down the tracer provider, flushing all pending spans.
    ///
    /// This is the ONLY correct way to tear down telemetry. Do NOT rely on
    /// `Drop` — it cannot run async flush logic.
    pub fn shutdown(mut self) {
        if let Some(provider) = self.provider.take()
            && let Err(e) = provider.shutdown()
        {
            tracing::error!("Telemetry shutdown error: {e:?}");
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

/// Phase 1: Build the `OTel` provider and layer WITHOUT installing a subscriber.
///
/// The returned [`TelemetrySetup`] contains:
/// - `handle` — pass to [`install_exporter`] after data dir resolves
/// - `layer` — compose into your subscriber via `.with(setup.layer)`
///
/// This function cannot fail. Spans emitted after the subscriber is installed
/// are buffered in memory until [`install_exporter`] wires the real file exporter.
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

    let info = TelemetryInfo {
        service_version: version.to_owned(),
        session_id: session_id.to_owned(),
        telemetry_dir: None,
        keep_sessions: None,
        current_session_file: None,
        started_at: SystemTime::now(),
        exporter_installed_at: None,
    };

    TelemetrySetup {
        handle: TelemetryHandle {
            buffering,
            provider,
            info,
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

    // Build the real file exporter + batch processor. Capture the path
    // BEFORE moving the exporter into the batch processor.
    let file_exporter = FileSpanExporter::new(telemetry_dir)?;
    let current_file = file_exporter.current_path().to_owned();
    let batch_processor = BatchSpanProcessor::builder(file_exporter).build();

    // Drain the boot-time buffer into the real processor.
    handle.buffering.install_inner(Box::new(batch_processor));

    // Upgrade the info snapshot now that the exporter is live.
    let info = TelemetryInfo {
        telemetry_dir: Some(telemetry_dir.to_owned()),
        keep_sessions: Some(keep_sessions),
        current_session_file: Some(current_file),
        exporter_installed_at: Some(SystemTime::now()),
        ..handle.info
    };

    Ok(TelemetryGuard {
        provider: Some(handle.provider),
        info,
    })
}
