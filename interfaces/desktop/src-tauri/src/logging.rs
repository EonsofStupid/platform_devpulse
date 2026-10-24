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
//! Every file this module writes is in this boot's run folder
//! ([`crate::log_runs`]): `session.jsonl` and `crash.jsonl`. Which runs stay
//! is the retention policy's call, not this module's.
//!
//! # Panic hook
//!
//! `init()` installs a global `std::panic::set_hook` that:
//! 1. emits `tracing::error!(target = "panic", ...)` with location, message,
//!    thread name, and a forced backtrace — so every panic lands in the
//!    session JSONL alongside regular logs.
//! 2. appends one JSON line to the run's `crash.jsonl` synchronously
//!    (bypassing the tracing-appender background worker, which may not
//!    flush before the process dies), so every panic of the run is kept and
//!    a post-mortem tool can index them.
//! 3. delegates to the previous hook so the default stderr printout is
//!    preserved (panic message still appears in the terminal).

use std::path::{Path, PathBuf};
use tokio::sync::mpsc;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::fmt;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

use devpulse_engine::platform::services::rrd_translator::RrdLifecycleTranslator;

use crate::log_runs::{LogFile, Run};
use devpulse_engine::platform::telemetry::{DuckDbLayer, SpanRecord, SPAN_CHANNEL_CAPACITY};

/// Libraries held at INFO in the session JSONL whatever its level. In a
/// debug build their DEBUG/TRACE output was ~280 MB per boot: `surrealkv`'s
/// WAL recovery (~406k "Replayed batch" lines, ~247 MB), `turso_core`
/// (26–37 MB) and the ACP SDK (up to 6 MB), burying `DevPulse`'s own lines
/// (master plan M7, measured 2026-10-21).
const JSONL_QUIET_TARGETS: &str = "surrealkv=info,turso_core=info,agent_client_protocol=info";

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
/// Must be called once this boot's run folder exists (in setup).
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
    run: &Run,
    otel_layer: devpulse_telemetry::boot::TelemetryLayer,
) -> anyhow::Result<LoggingHandle> {
    use tracing_subscriber::filter::LevelFilter;
    use tracing_subscriber::Layer as _;

    let file = std::fs::File::create(run.file(LogFile::Session))?;
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

    // Faithful mode captures every span from every crate at TRACE level.
    // Default-on in debug builds so `cargo xtask run-dev` produces a JSONL
    // with every tauri internal span, every surrealdb query span, every
    // specta dispatch — not just our crates. Release still requires an
    // explicit `DEVPULSE_LOG_FAITHFUL=1` opt-in to keep release log
    // volume bounded.
    let faithful = std::env::var("DEVPULSE_LOG_FAITHFUL").is_ok() || cfg!(debug_assertions);
    let jsonl_filter = if faithful {
        EnvFilter::new(format!("trace,{JSONL_QUIET_TARGETS}"))
    } else {
        // Default JSONL is verbose-but-readable: all debug globally, trace
        // for devpulse crates. Users don't need DEVPULSE_LOG_FAITHFUL unless
        // they want third-party crates at trace level too.
        EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            EnvFilter::new(format!(
                "debug,devpulse=trace,devpulse_desktop_backend=trace,devpulse_clyffy=trace,{JSONL_QUIET_TARGETS}"
            ))
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
        // RRD lifecycle translator — bridges every `rrd.lifecycle`
        // tracing event into a typed `InternalEvent::RrdPhaseTransition`
        // on the engine bus per HOT_UPDATE_PATTERN.md §11. Registered
        // here in the lazy variant; the broadcast sender is installed
        // post-boot from `Platform::internal_tx()` (see lib.rs boot
        // task) — events emitted before installation are dropped,
        // which is fine because the daemon doesn't fire until after
        // boot completes anyway.
        .with(RrdLifecycleTranslator::new_lazy())
        .init();

    install_panic_hook(run.file(LogFile::Crash));

    Ok(LoggingHandle {
        file_guard,
        stderr_guard,
        span_rx,
    })
}

/// Install a global panic hook that routes panics into tracing AND the
/// run's `crash.jsonl`, one line per panic.
///
/// The file write uses synchronous `std::fs::write` (not tracing-appender)
/// because the process may exit before the async appender flushes its
/// buffer — a crash dump that arrives after the process dies is useless.
fn install_panic_hook(crash_path: PathBuf) {
    let prev = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        let ts_iso = chrono::Utc::now().to_rfc3339();

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

        // 2. Append the crash record synchronously. Bypasses the
        //    tracing-appender non-blocking worker — if the process is
        //    about to die, the async write may never complete.
        let crash_json = serde_json::json!({
            "timestamp": ts_iso,
            "location": location,
            "thread": thread,
            "message": message,
            "backtrace": backtrace_str,
        });
        if let Ok(mut file) = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&crash_path)
        {
            use std::io::Write as _;
            let _ = writeln!(file, "{crash_json}");
        }

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

/// Rotate the daily action logs (`action-YYYY-MM-DD.jsonl`), keeping the
/// last 3. Session logs live in run folders now and the retention policy
/// keeps them ([`crate::log_runs`]); the action logs move there in master
/// plan M8c, and this goes with them.
///
/// # Errors
/// Returns error if the logs directory cannot be read.
pub fn rotate_logs(data_dir: &Path) -> anyhow::Result<()> {
    let logs_dir = data_dir.join("logs");
    if !logs_dir.exists() {
        return Ok(());
    }
    let keep = 3;

    // Rotate daily action JSONL files — keep last 3 calendar files.
    let mut action_files: Vec<PathBuf> = std::fs::read_dir(&logs_dir)?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("action-")
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

    action_files.sort();
    if action_files.len() > keep {
        let to_delete = action_files.len() - keep;
        for path in action_files.iter().take(to_delete) {
            let _ = std::fs::remove_file(path);
        }
    }

    Ok(())
}
