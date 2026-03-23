//! DuckDB boot stage — system analytics store.
//!
//! DuckDB uses an exclusive file lock. On Windows hot-reload, the previous
//! process may not have released its lock yet. Uses the standard retry
//! utility with exponential backoff.
//!
//! DuckDB's `boot()` is synchronous — wrapped in `spawn_blocking` so the
//! async retry loop can await it.

use crate::platform::boot::log::BootLog;
use crate::platform::boot::retry;
use crate::platform::config::{sanitize_path, ServiceEntry, WindowsConfig};
use crate::platform::init::InitEvent;
use crate::platform::services::analytics::AnalyticsService;

use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

/// Boot the DuckDB analytics store.
///
/// Returns `Some(service)` on success, `None` on failure or if disabled.
#[allow(clippy::cast_possible_truncation)]
pub async fn boot(
    data_dir: &Path,
    entry: &ServiceEntry,
    win_config: &WindowsConfig,
    schema: &'static str,
    label: &'static str,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
) -> Option<Arc<AnalyticsService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped(label));
        boot_log.skip(label, "disabled in config");
        return None;
    }

    on_event(InitEvent::running(label, "Opening database"));
    boot_log.running(label, "opening database...");
    let start = Instant::now();

    let raw_path = entry.resolve_path(data_dir);
    let path = sanitize_path(&raw_path, win_config);
    let retry_cfg = entry.retry.to_retry_config();

    let result = retry::retry_on_lock_async(&retry_cfg, label, || {
        let p = path.clone();
        async move {
            tokio::task::spawn_blocking(move || AnalyticsService::boot(&p, schema, label))
                .await
                .map_err(|e| anyhow::anyhow!("DuckDB spawn_blocking failed: {e}"))?
        }
    })
    .await;

    match result {
        Ok(store) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::info!(
                step = label,
                status = "ready",
                latency_us = start.elapsed().as_micros() as u64,
                path = %path.display(),
                "DuckDB store booted"
            );
            on_event(InitEvent::ok_with_latency(label, start.elapsed()));
            boot_log.ok(label, &format!("DuckDB {} ({elapsed_ms}ms)", path.display()));
            Some(Arc::new(store))
        }
        Err(e) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::error!(step = label, error = ?e, "DuckDB store failed to boot");
            on_event(InitEvent::error(label, &format!("{e:#}")));
            boot_log.fail(label, &format!("{e:#} ({elapsed_ms}ms)"));
            None
        }
    }
}
