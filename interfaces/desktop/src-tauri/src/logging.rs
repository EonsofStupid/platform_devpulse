//! Structured logging with file persistence + `DuckDB` span tracing + `OTel`.
//!
//! Four-layer subscriber:
//! 1. stderr (pretty, INFO) — developer console
//! 2. file (JSON, DEBUG) — session log persistence
//! 3. `DuckDB` span layer — completed spans → batched `DuckDB` writes
//! 4. `OTel` layer — spans → `BufferingProcessor` → OTLP JSONL file exporter
//!
//! The `DuckDB` layer's channel is created here (before boot).
//! The writer is spawned separately after analytics boots.
//! Spans buffer in the channel during boot startup.
//!
//! The `OTel` layer is provided by `devpulse_telemetry::boot::prepare()`.
//! Its `BufferingProcessor` holds spans in RAM until `install_exporter()`
//! wires the real file exporter after `data_dir` resolves.
//!
//! Log rotation: keeps last 3 session logs, deletes older ones.
//!
//! # Panic hook
//!
//! `init()` installs a global `std::panic::set_hook` that:
//! 1. emits `tracing::error!(target = "panic", ...)` with location, message,
//!    thread name, and a forced backtrace — so every panic lands in the
//!    session JSONL alongside regular logs.
//! 2. writes a dedicated `{data_dir}/logs/crash-{ts}.json` file via direct
//!    `std::fs::write` (bypassing the tracing-appender background worker,
//!    which may not flush before the process dies). The JSON is structured
//!    so a post-mortem tool can index it.
//! 3. delegates to the previous hook so the default stderr printout is
//!    preserved (panic message still appears in the terminal).

use std::path::{Path, PathBuf};
use tokio::sync::mpsc;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::fmt;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

use devpulse_engine::platform::telemetry::{DuckDbLayer, SpanRecord, SPAN_CHANNEL_CAPACITY};

/// Result of logging initialization — holds non-blocking writer guards and
/// the span receiver that must be connected to `SpanTraceWriter` after
/// analytics boots.
///
/// Both guards MUST be held for the app's lifetime. Dropping either one
/// stops its background writer thread, causing the corresponding appender
/// to either drop writes silently (lossy default) or panic.
pub struct LoggingHandle {
    /// Session JSONL file writer guard — must be held for app lifetime.
    pub file_guard: WorkerGuard,
    /// Stderr writer guard — must be held for app lifetime.
    ///
    /// Wrapping stderr in `tracing_appender::non_blocking` prevents the
    /// writing thread (the Tauri IPC dispatch thread for sync commands,
    /// the tokio executor for async commands) from blocking when the
    /// stderr pipe is saturated. Chromium's `--enable-logging=stderr`
    /// flag (debug builds only) floods stderr and was the root cause
    /// of the multi-day IPC hang resolved in S0.
    pub stderr_guard: WorkerGuard,
    /// Receiver for completed spans — spawn `SpanTraceWriter` with this
    /// after `DuckDB` analytics service is available.
    pub span_rx: mpsc::Receiver<SpanRecord>,
}

/// Initialize all logging — stderr + file + `DuckDB` span layer + `OTel` layer.
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
    let (file_writer, file_guard) = tracing_appender::non_blocking(file);

    // Wrap stderr in the same non-blocking appender as the session file.
    // Without this, any thread writing to `tracing` blocks on a saturated
    // stderr pipe — on Windows with Chromium's `--enable-logging=stderr`,
    // that thread is usually the Tauri IPC dispatch thread, and the whole
    // frontend freezes. The background worker drains into stderr
    // asynchronously; lossy drop on channel overflow is acceptable for
    // the developer terminal (the JSONL layer is the authoritative sink).
    let (stderr_writer, stderr_guard) = tracing_appender::non_blocking(std::io::stderr());

    // Create the span channel — sender goes to Layer, receiver waits for analytics
    let (span_tx, span_rx) = mpsc::channel(SPAN_CHANNEL_CAPACITY);

    // Two independent filters so stderr stays readable while the JSONL
    // captures EVERYTHING faithfully for post-mortem. RUST_LOG controls
    // stderr. DEVPULSE_LOG_FAITHFUL=1 promotes the JSONL to full trace.
    let stderr_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,devpulse=debug"));

    let faithful = std::env::var("DEVPULSE_LOG_FAITHFUL").is_ok();
    let jsonl_filter = if faithful {
        EnvFilter::new("trace")
    } else {
        // Default JSONL is verbose-but-readable: all debug globally, trace
        // for devpulse crates. Users don't need DEVPULSE_LOG_FAITHFUL unless
        // they want third-party crates at trace level too.
        EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            EnvFilter::new(
                "debug,devpulse=trace,devpulse_desktop_backend=trace,devpulse_clyffy=trace",
            )
        })
    };

    if faithful {
        eprintln!("[logging] DEVPULSE_LOG_FAITHFUL=1 — JSONL captures at TRACE level (every crate, every span)");
    }

    // Per-layer filters so each sink gets what it needs:
    //   - stderr: RUST_LOG or info,devpulse=debug  (human-readable terminal)
    //   - JSONL:  verbose (or TRACE in faithful mode)  (post-mortem capture)
    //   - OTel:   DEBUG ceiling  (prevents TRACE flood to OTLP exporter)
    //   - DuckDb: DEBUG ceiling  (spans only; TRACE events would inflate the channel)
    //
    // OTel layer MUST be first — OpenTelemetryLayer<Registry, Tracer>
    // implements Layer<Registry>, not Layer<Layered<..., Registry>>.
    // Placing it first ensures S = Registry at composition time.
    use tracing_subscriber::filter::LevelFilter;
    use tracing_subscriber::Layer as _;

    let otel_ceiling = LevelFilter::DEBUG;
    let duckdb_ceiling = LevelFilter::DEBUG;

    tracing_subscriber::registry()
        .with(otel_layer.with_filter(otel_ceiling))
        .with(
            fmt::layer()
                .with_writer(stderr_writer)
                .with_target(true)
                .with_thread_ids(false)
                .with_file(false)
                .compact()
                .with_filter(stderr_filter),
        )
        .with(
            fmt::layer()
                .json()
                .with_writer(file_writer)
                .with_target(true)
                .with_thread_ids(true)
                .with_file(true)
                .with_line_number(true)
                .with_filter(jsonl_filter),
        )
        .with(DuckDbLayer::new(span_tx).with_filter(duckdb_ceiling))
        .init();

    install_panic_hook(&logs_dir);

    Ok(LoggingHandle {
        file_guard,
        stderr_guard,
        span_rx,
    })
}

/// Install a global panic hook that routes panics into tracing AND a
/// dedicated `crash-{ts}.json` file.
///
/// The file write uses synchronous `std::fs::write` (not tracing-appender)
/// because the process may exit before the async appender flushes its
/// buffer — a crash dump that arrives after the process dies is useless.
fn install_panic_hook(logs_dir: &Path) {
    let logs_dir = logs_dir.to_path_buf();
    let prev = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        let timestamp_raw = chrono::Local::now();
        let ts_file = timestamp_raw.format("%Y-%m-%d-%H%M%S").to_string();
        let ts_iso = timestamp_raw.to_rfc3339();

        let location = info.location().map_or_else(
            || "<unknown>".to_string(),
            |l| format!("{}:{}:{}", l.file(), l.line(), l.column()),
        );

        let payload = info.payload();
        let message = if let Some(s) = payload.downcast_ref::<&str>() {
            (*s).to_string()
        } else if let Some(s) = payload.downcast_ref::<String>() {
            s.clone()
        } else {
            "<non-string panic payload>".to_string()
        };

        let thread = std::thread::current()
            .name()
            .unwrap_or("<unnamed>")
            .to_string();

        let backtrace = std::backtrace::Backtrace::force_capture();
        let backtrace_str = backtrace.to_string();

        // 1. Emit through tracing so the panic lands in the session JSONL
        //    alongside regular logs.
        tracing::error!(
            target: "panic",
            location = %location,
            thread = %thread,
            panic = %message,
            backtrace = %backtrace_str,
            "Rust panic"
        );

        // 2. Write a dedicated crash JSON synchronously. Bypasses the
        //    tracing-appender non-blocking worker — if the process is
        //    about to die, the async write may never complete.
        let crash_path = logs_dir.join(format!("crash-{ts_file}.json"));
        let crash_json = serde_json::json!({
            "timestamp": ts_iso,
            "location": location,
            "thread": thread,
            "message": message,
            "backtrace": backtrace_str,
        });
        let serialized =
            serde_json::to_string_pretty(&crash_json).unwrap_or_else(|_| crash_json.to_string());
        let _ = std::fs::write(&crash_path, serialized);

        // 3. Delegate to the previous hook (default: prints to stderr).
        prev(info);
    }));
}

/// Initialize stderr-only logging (fallback if `data_dir` isn't available yet).
pub fn init_stderr_only() {
    let filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,devpulse=debug"));

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
            if name.starts_with("session-")
                && std::path::Path::new(&name)
                    .extension()
                    .is_some_and(|ext| ext.eq_ignore_ascii_case("jsonl"))
            {
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
