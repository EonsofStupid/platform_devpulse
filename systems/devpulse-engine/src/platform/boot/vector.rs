//! RRO (embedded Qdrant) boot stage — vector store.
//!
//! RRO's `QdrantInstance::start()` spawns a background thread and returns
//! immediately (~235µs). This does NOT mean the engine is queryable.
//! We MUST verify with a ping before reporting healthy.

#[cfg(feature = "rro")]
use crate::platform::boot::log::BootLog;
#[cfg(feature = "rro")]
use crate::platform::config::VectorServiceEntry;
#[cfg(feature = "rro")]
use crate::platform::init::InitEvent;
#[cfg(feature = "rro")]
use crate::platform::services::vector::VectorService;
#[cfg(feature = "rro")]
use crate::platform::services::Service;

#[cfg(feature = "rro")]
use std::path::Path;
#[cfg(feature = "rro")]
use std::sync::Arc;
#[cfg(feature = "rro")]
use std::time::Instant;

/// Boot the RRO vector store and verify it's queryable.
///
/// Returns `Some(service)` on success, `None` on failure or if disabled.
#[cfg(feature = "rro")]
#[allow(clippy::cast_possible_truncation)]
pub async fn boot(
    data_dir: &Path,
    entry: &VectorServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
) -> Option<Arc<VectorService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("Vector store"));
        boot_log.skip("Vector store", "disabled in config");
        return None;
    }

    on_event(InitEvent::running("Vector store", "Starting RRO engine"));
    boot_log.running("Vector store", "starting RRO engine...");
    let start = Instant::now();

    let storage_path = entry.resolve_path(data_dir);

    // RRO reads QDRANT__STORAGE__STORAGE_PATH env var at boot.
    // TODO: Replace with boot parameter once RRO fork API supports it.
    #[allow(deprecated)]
    std::env::set_var("QDRANT__STORAGE__STORAGE_PATH", &storage_path);

    let retrieval = entry.retrieval.to_retrieval_config();
    tracing::info!(
        preset = %retrieval.preset,
        top_k = retrieval.top_k,
        score_threshold = retrieval.score_threshold,
        rerank_top_n = retrieval.rerank_top_n,
        "Vector retrieval config resolved"
    );

    let store = match VectorService::boot(&storage_path, None, retrieval) {
        Ok(s) => Arc::new(s),
        Err(e) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::error!(step = "Vector store", error = ?e, "RRO failed to boot");
            on_event(InitEvent::error("Vector store", &format!("{e:#}")));
            boot_log.fail("Vector store", &format!("{e:#} ({elapsed_ms}ms)"));
            return None;
        }
    };

    // Post-boot verification: prove the engine is actually queryable.
    match store.ping().await {
        Ok(()) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::info!(
                step = "Vector store",
                status = "ready",
                latency_us = start.elapsed().as_micros() as u64,
                path = %storage_path.display(),
                "RRO vector engine booted and verified"
            );
            on_event(InitEvent::ok_with_latency("Vector store", start.elapsed()));
            boot_log.ok("Vector store", &format!("RRO verified {} ({elapsed_ms}ms)", storage_path.display()));
            Some(store)
        }
        Err(e) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::error!(
                step = "Vector store",
                error = ?e,
                "RRO started but engine is not queryable"
            );
            on_event(InitEvent::error("Vector store", &format!("Engine not ready: {e:#}")));
            boot_log.fail("Vector store", &format!("started but not queryable: {e:#} ({elapsed_ms}ms)"));
            None
        }
    }
}
