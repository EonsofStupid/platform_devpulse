//! Structured logging with file persistence + DuckDB span tracing + OTel.
//!
//! Four-layer subscriber:
//! 1. stderr (pretty, INFO) — developer console
//! 2. file (JSON, DEBUG) — session log persistence
//! 3. DuckDB span layer — completed spans → batched DuckDB writes
//! 4. OTel layer — spans → BufferingProcessor → OTLP JSONL file exporter
//!
//! The DuckDB layer's channel is created here (before boot).
//! The writer is spawned separately after analytics boots.
//! Spans buffer in the channel during boot startup.
//!
//! The OTel layer is provided by `devpulse_telemetry::boot::prepare()`.
//! Its `BufferingProcessor` holds spans in RAM until `install_exporter()`
//! wires the real file exporter after data_dir resolves.
//!
//! Log rotation: keeps last 3 session logs, deletes older ones.

use std::path::{Path, PathBuf};
use tokio::sync::mpsc;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::fmt;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

use devpulse_engine::platform::telemetry::{DuckDbLayer, SpanRecord, SPAN_CHANNEL_CAPACITY};

/// Result of logging initialization — holds guards and the span receiver
/// that must be connected to `SpanTraceWriter` after analytics boots.
pub struct LoggingHandle {
    /// File logging guard — must be held for app lifetime.
    pub file_guard: WorkerGuard,
    /// Receiver for completed spans — spawn `SpanTraceWriter` with this
    /// after DuckDB analytics service is available.
    pub span_rx: mpsc::Receiver<SpanRecord>,
}

/// Initialize all logging — stderr + file + DuckDB span layer + OTel layer.
/// Must be called once `data_dir` is known (in setup).
///
/// The `otel_layer` parameter comes from `devpulse_telemetry::boot::prepare()`.
/// Pass it here so all layers are composed into a single global subscriber.
///
/// Returns a `LoggingHandle` containing the file guard (must be held)
/// and the span receiver (must be connected to `SpanTraceWriter` after boot).
///
/// # Errors
/// Returns error if log directory or file creation fails.
pub fn init(
    data_dir: &Path,
    otel_layer: devpulse_telemetry::boot::TelemetryLayer,
) -> anyhow::Result<LoggingHandle> {
    let logs_dir = data_dir.join("logs");
    std::fs::create_dir_all(&logs_dir)?;

    let timestamp = chrono::Local::now().format("%Y-%m-%d-%H%M%S");
    let filename = format!("session-{timestamp}.jsonl");
    let file = std::fs::File::create(logs_dir.join(filename))?;
    let (non_blocking, guard) = tracing_appender::non_blocking(file);

    // Create the span channel — sender goes to Layer, receiver waits for analytics
    let (span_tx, span_rx) = mpsc::channel(SPAN_CHANNEL_CAPACITY);

    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,devpulse=debug"));

    // OTel layer MUST be first — OpenTelemetryLayer<Registry, Tracer>
    // implements Layer<Registry>, not Layer<Layered<..., Registry>>.
    // Placing it first ensures S = Registry at composition time.
    tracing_subscriber::registry()
        .with(otel_layer)
        .with(filter)
        .with(
            fmt::layer()
                .with_target(true)
                .with_thread_ids(false)
                .with_file(false)
                .compact(),
        )
        .with(
            fmt::layer()
                .json()
                .with_writer(non_blocking)
                .with_target(true)
                .with_thread_ids(true)
                .with_file(true)
                .with_line_number(true),
        )
        .with(DuckDbLayer::new(span_tx))
        .init();

    Ok(LoggingHandle {
        file_guard: guard,
        span_rx,
    })
}

/// Initialize stderr-only logging (fallback if `data_dir` isn't available yet).
pub fn init_stderr_only() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,devpulse=debug"));

    tracing_subscriber::registry()
        .with(filter)
        .with(
            fmt::layer()
                .with_target(true)
                .with_thread_ids(false)
                .with_file(false)
                .compact(),
        )
        .init();
}

/// Rotate logs — keep the last 3 session files, delete older ones.
///
/// # Errors
/// Returns error if the logs directory cannot be read.
pub fn rotate_logs(data_dir: &Path) -> anyhow::Result<()> {
    let logs_dir = data_dir.join("logs");
    if !logs_dir.exists() {
        return Ok(());
    }

    let mut sessions: Vec<PathBuf> = std::fs::read_dir(&logs_dir)?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("session-") && std::path::Path::new(&name).extension().is_some_and(|ext| ext.eq_ignore_ascii_case("jsonl")) {
                Some(entry.path())
            } else {
                None
            }
        })
        .collect();

    sessions.sort();

    let keep = 3;
    if sessions.len() > keep {
        let to_delete = sessions.len() - keep;
        for path in sessions.iter().take(to_delete) {
            let _ = std::fs::remove_file(path);
        }
    }

    // Rotate daily action JSONL files — keep last 3 calendar files.
    let mut action_files: Vec<PathBuf> = std::fs::read_dir(&logs_dir)?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("action-") && name.ends_with(".jsonl") {
                Some(entry.path())
            } else {
                None
            }
        })
        .collect();

    action_files.sort();
    if action_files.len() > keep {
        let to_delete = action_files.len() - keep;
        for path in action_files.iter().take(to_delete) {
            let _ = std::fs::remove_file(path);
        }
    }

    Ok(())
}
