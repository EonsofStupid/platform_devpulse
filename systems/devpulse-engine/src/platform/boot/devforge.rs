//! DevForge boot stage — spawn the REH web server as a platform service.
//!
//! Resolves the REH server directory (dev checkout or fetched release),
//! then boots `DevForgeService::boot_reh()`. The service owns the Node
//! child process and the connection URL for the Tauri WebviewWindow.

use crate::platform::boot::log::BootLog;
use crate::platform::config::DevForgeServiceEntry;
use crate::platform::init::InitEvent;
use crate::platform::services::devforge::DevForgeService;

use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

/// Boot the DevForge REH service.
///
/// Returns `Some(service)` on success, `None` on failure or if disabled.
#[allow(clippy::cast_possible_truncation)]
pub async fn boot(
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

    if !entry.is_reh() {
        on_event(InitEvent::skipped("DevForge service"));
        boot_log.skip("DevForge service", "standalone mode not supported — use mode = \"reh\"");
        return None;
    }

    on_event(InitEvent::running("DevForge service", "Spawning REH web server"));
    boot_log.running("DevForge service", "spawning REH server...");
    let start = Instant::now();

    // Resolve the REH server directory.
    // Dev mode: look for deps/code-oss-reh-web/ in the repo root.
    // The repo root is derived from CARGO_MANIFEST_DIR at compile time
    // (same pattern as paths.rs in the Tauri layer).
    let server_dir = resolve_reh_server_dir(data_dir);

    let Some(server_dir) = server_dir else {
        let msg = "No REH build found. Run `cargo xtask fetch-devforge --target win32-x64` \
                   or clone into deps/code-oss-reh-web/";
        on_event(InitEvent::error("DevForge service", msg));
        boot_log.fail("DevForge service", msg);
        return None;
    };

    let user_data_dir = entry.resolve_user_data_dir(data_dir);
    let extensions_dir = entry.resolve_extensions_dir(data_dir);

    match DevForgeService::boot_reh(
        &server_dir,
        &user_data_dir,
        Some(&extensions_dir),
        None, // workspace_path — TODO: restore from state.json
        entry.port,
    )
    .await
    {
        Ok(service) => {
            let elapsed_ms = start.elapsed().as_millis() as u64;
            let url = service.connection_url();
            tracing::info!(
                port = service.port(),
                elapsed_ms,
                "DevForge REH ready"
            );
            on_event(InitEvent::ok_with_latency("DevForge service", start.elapsed()));
            boot_log.ok(
                "DevForge service",
                &format!("REH on :{} ({elapsed_ms}ms) {url}", service.port()),
            );
            Some(Arc::new(service))
        }
        Err(e) => {
            let msg = format!("REH spawn failed: {e:#}");
            tracing::error!(error = %e, "DevForge boot failed");
            on_event(InitEvent::error("DevForge service", &msg));
            boot_log.fail("DevForge service", &msg);
            None
        }
    }
}

/// Resolve the REH server directory.
///
/// Lookup order:
/// 1. **Dev** (`debug_assertions`): `<repo>/deps/code-oss-reh-web/` — live
///    developer REH build. Repo root derived from `CARGO_MANIFEST_DIR`
///    (compile-time, same method `resolve_data_dir` in lib.rs uses).
/// 2. **Dev fallback**: `<repo>/interfaces/desktop/src-tauri/resources/
///    devforge/<platform>/` — fetched release tree on disk.
/// 3. **Release**: `<data_dir>/devforge/install/current/` — seed-copied
///    from Tauri bundled resources on first launch. The Tauri layer
///    (paths.rs) handles the seed-copy; this function just checks the
///    result.
///
/// Returns `None` if no valid REH tree is found.
fn resolve_reh_server_dir(data_dir: &Path) -> Option<std::path::PathBuf> {
    #[cfg(debug_assertions)]
    {
        // Derive repo root from CARGO_MANIFEST_DIR at compile time.
        // engine Cargo.toml lives at systems/devpulse-engine/ → parent
        // twice = repo root. NEVER derive from data_dir.parent() which
        // breaks in release mode.
        let manifest = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        if let Some(repo_root) = manifest
            .parent() // systems/
            .and_then(std::path::Path::parent) // repo root
        {
            // 1. Dev checkout
            let dev_reh = repo_root.join("deps").join("code-oss-reh-web");
            if dev_reh.join("out").join("server-main.js").is_file() {
                return Some(dev_reh);
            }

            // 2. Fetched release tree
            #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
            let platform = "win32-x64";
            #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
            let platform = "darwin-arm64";
            #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
            let platform = "darwin-x64";
            #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
            let platform = "linux-x64";

            let fetched = repo_root
                .join("interfaces")
                .join("desktop")
                .join("src-tauri")
                .join("resources")
                .join("devforge")
                .join(platform);
            if fetched.join("out").join("server-main.js").is_file() {
                return Some(fetched);
            }
        }
    }

    // 3. Release: seed-copied tree under data_dir
    let installed = data_dir.join("devforge").join("install").join("current");
    if installed.join("out").join("server-main.js").is_file() {
        return Some(installed);
    }

    None
}
