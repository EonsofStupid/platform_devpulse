//! Turso boot stage — system and user relational stores.
//!
//! Each Turso instance gets:
//! 1. Path resolution from config
//! 2. Windows path sanitization
//! 3. File-lock retry with exponential backoff
//! 4. Schema application on first open
//! 5. Health ping to confirm queryability
//!
//! On failure: logs the error, reports to boot log, returns None.
//! The orchestrator decides whether None is fatal (critical flag).

use crate::platform::boot::log::BootLog;
use crate::platform::boot::retry;
use crate::platform::config::{ServiceEntry, WindowsConfig, sanitize_path};
use crate::platform::init::InitEvent;
use crate::platform::services::relational::{RelationalService, StoreSchema};

use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

/// Boot a Turso relational store.
///
/// Returns `Some(service)` on success, `None` on failure or if disabled.
/// Emits `InitEvent`s for the frontend status bar and writes to the boot log.
#[allow(clippy::cast_possible_truncation)]
pub async fn boot(
    data_dir: &Path,
    entry: &ServiceEntry,
    win_config: &WindowsConfig,
    store: StoreSchema,
    label: &'static str,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
) -> Option<Arc<RelationalService>> {
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
    let options = entry.turso_options();

    let result = retry::retry_on_lock_async(&retry_cfg, label, || {
        let p = path.clone();
        async move { RelationalService::boot(&p, store, label, options).await }
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
                "Turso store booted"
            );
            on_event(InitEvent::ok_with_latency(label, start.elapsed()));
            boot_log.ok(label, &format!("Turso {} ({elapsed_ms}ms)", path.display()));
            Some(Arc::new(store))
        }
        Err(e) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::error!(step = label, error = ?e, "Turso store failed to boot");
            on_event(InitEvent::error(label, &format!("{e:#}")));
            boot_log.fail(label, &format!("{e:#} ({elapsed_ms}ms)"));
            None
        }
    }
}
