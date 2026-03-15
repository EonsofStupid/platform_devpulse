//! Structured logging with file persistence.
//!
//! Single-phase init: stderr (pretty, INFO) + file (JSON, DEBUG) together.
//! Log rotation: keeps last 3 session logs, deletes older ones.

use std::path::{Path, PathBuf};
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::fmt;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

/// Initialize all logging — stderr + file in one shot.
/// Must be called once `data_dir` is known (in setup).
/// Returns a guard that must be held for the app lifetime.
///
/// # Errors
/// Returns error if log directory or file creation fails.
pub fn init(data_dir: &Path) -> anyhow::Result<WorkerGuard> {
    let logs_dir = data_dir.join("logs");
    std::fs::create_dir_all(&logs_dir)?;

    let timestamp = chrono::Local::now().format("%Y-%m-%d-%H%M%S");
    let filename = format!("session-{timestamp}.jsonl");
    let file = std::fs::File::create(logs_dir.join(filename))?;
    let (non_blocking, guard) = tracing_appender::non_blocking(file);

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
        .with(
            fmt::layer()
                .json()
                .with_writer(non_blocking)
                .with_target(true)
                .with_thread_ids(true)
                .with_file(true)
                .with_line_number(true),
        )
        .init();

    Ok(guard)
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
            if name.starts_with("session-") && name.ends_with(".jsonl") {
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

    Ok(())
}
