//! Outlines-core boot stage — grammar-constrained decoding engine.
//!
//! Initializes the structured generation engine for grammar-constrained
//! model output. Synchronous, near-instant boot.

#[cfg(feature = "outlines")]
use crate::platform::boot::log::BootLog;
#[cfg(feature = "outlines")]
use crate::platform::config::GrammarServiceEntry;
#[cfg(feature = "outlines")]
use crate::platform::init::InitEvent;
#[cfg(feature = "outlines")]
use crate::platform::services::grammar::GrammarService;

#[cfg(feature = "outlines")]
use std::sync::Arc;
#[cfg(feature = "outlines")]
use std::time::Instant;

/// Boot the outlines-core grammar engine.
///
/// Returns `Some(service)` on success, `None` on failure or if disabled.
#[cfg(feature = "outlines")]
#[allow(clippy::cast_possible_truncation)]
pub fn boot(
    entry: &GrammarServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
) -> Option<Arc<GrammarService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("Grammar service"));
        boot_log.skip("Grammar service", "disabled in config");
        return None;
    }

    on_event(InitEvent::running("Grammar service", "Initializing outlines-core engine"));
    boot_log.running("Grammar service", "initializing...");
    let start = Instant::now();

    match GrammarService::boot() {
        Ok(store) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::info!(
                step = "Grammar service",
                status = "ready",
                latency_us = start.elapsed().as_micros() as u64,
                "outlines-core grammar engine booted"
            );
            on_event(InitEvent::ok_with_latency("Grammar service", start.elapsed()));
            boot_log.ok("Grammar service", &format!("outlines-core ready ({elapsed_ms}ms)"));
            Some(Arc::new(store))
        }
        Err(e) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::error!(step = "Grammar service", error = ?e, "outlines-core failed to boot");
            on_event(InitEvent::error("Grammar service", &format!("{e:#}")));
            boot_log.fail("Grammar service", &format!("{e:#} ({elapsed_ms}ms)"));
            None
        }
    }
}
