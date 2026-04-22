//! Moka cache boot stage — in-memory key-value cache.
//!
//! Moka is purely in-memory. No file I/O, no retry needed.
//! Boot is synchronous and near-instant (~1ms).

use crate::platform::boot::log::BootLog;
use crate::platform::config::CacheServiceEntry;
use crate::platform::init::InitEvent;
use crate::platform::services::cache::CacheService;

use std::sync::Arc;
use std::time::Instant;

/// Boot the Moka in-memory cache.
///
/// Returns `Some(service)` on success, `None` if disabled.
/// Moka cannot fail — it's a pure in-memory data structure.
#[allow(clippy::cast_possible_truncation)]
pub fn boot(
    entry: &CacheServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
) -> Option<Arc<CacheService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("System cache"));
        boot_log.skip("System cache", "disabled in config");
        return None;
    }

    on_event(InitEvent::running(
        "System cache",
        "Initializing in-memory cache",
    ));
    boot_log.running("System cache", "initializing...");
    let start = Instant::now();

    let store = CacheService::boot(entry.to_moka_config());
    let elapsed_ms = start.elapsed().as_millis() as u64;

    tracing::info!(
        step = "System cache",
        status = "ready",
        latency_us = start.elapsed().as_micros() as u64,
        max_capacity = entry.max_capacity,
        ttl_secs = entry.time_to_live_secs,
        "Moka cache booted"
    );
    on_event(InitEvent::ok_with_latency("System cache", start.elapsed()));
    boot_log.ok(
        "System cache",
        &format!(
            "Moka cap={} ttl={}s ({elapsed_ms}ms)",
            entry.max_capacity, entry.time_to_live_secs
        ),
    );

    Some(Arc::new(store))
}
