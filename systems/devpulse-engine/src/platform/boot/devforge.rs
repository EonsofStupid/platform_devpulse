//! DevForge boot stage — managed VSCode process.
//!
//! Spawns a VSCode/code-oss instance as a child process.
//! Expected binary at `deps/code-oss/` or configured path.

use crate::platform::boot::log::BootLog;
use crate::platform::config::DevForgeServiceEntry;
use crate::platform::init::InitEvent;
use crate::platform::services::devforge::DevForgeService;

use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

/// Boot the DevForge (VSCode) service.
///
/// Returns `Some(service)` on success, `None` on failure or if disabled.
#[allow(clippy::cast_possible_truncation)]
pub fn boot(
    data_dir: &Path,
    entry: &DevForgeServiceEntry,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
) -> Option<Arc<DevForgeService>> {
    if !entry.enabled {
        on_event(InitEvent::skipped("DevForge service"));
        boot_log.skip("DevForge service", "disabled in config");
        return None;
    }

    on_event(InitEvent::running("DevForge service", "Spawning VSCode process"));
    boot_log.running("DevForge service", "spawning process...");
    let start = Instant::now();

    let binary_path = entry.resolve_binary_path(data_dir);
    let workspace_path = entry.resolve_workspace_path(data_dir);

    match DevForgeService::boot(&binary_path, &workspace_path, entry.port) {
        Ok(service) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::info!(
                step = "DevForge service",
                status = "ready",
                port = entry.port,
                latency_ms = elapsed_ms,
                "DevForge process spawned"
            );
            on_event(InitEvent::ok_with_latency("DevForge service", start.elapsed()));
            boot_log.ok("DevForge service", &format!("VSCode on :{} ({elapsed_ms}ms)", entry.port));
            Some(Arc::new(service))
        }
        Err(e) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            tracing::error!(step = "DevForge service", error = ?e, "DevForge failed to boot");
            on_event(InitEvent::error("DevForge service", &format!("{e:#}")));
            boot_log.fail("DevForge service", &format!("{e:#} ({elapsed_ms}ms)"));
            None
        }
    }
}
