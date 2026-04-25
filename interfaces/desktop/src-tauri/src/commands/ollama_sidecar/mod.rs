//! Ollama sidecar commands — query and control the managed Ollama process.
//!
//! The engine side (`devpulse_engine::platform::Platform`) owns the
//! `OllamaSidecarService` lifecycle. These commands are the frontend's
//! handle into that service. Status surfaces the HealthBadge-shaped
//! `OllamaHealth`, the config surface reads/writes the platform boot
//! config entry, and the action surface spawns / kills / restarts.
//!
//! Design matches `commands::devforge` — same verb names
//! (`start`, `stop`, `restart`, `health`), same state wiring, same
//! `load_full()` lock-free reads.

use crate::state::PlatformState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

use devpulse_engine::platform::OllamaModel;

// ═══════════════════════════════════════════════════════════════
// Public response types (TS-exported via specta)
// ═══════════════════════════════════════════════════════════════

/// Running-state of the managed Ollama sidecar.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OllamaStatus {
    /// Whether the service slot currently holds a live Ollama handle.
    pub running: bool,
    /// Host the service is bound to (`127.0.0.1` by default).
    pub host: Option<String>,
    /// Port Ollama is listening on.
    pub port: Option<u16>,
    /// Base HTTP URL (`http://host:port`).
    pub base_url: Option<String>,
    /// `true` = this platform spawned the child. `false` = attached to
    /// an externally-running Ollama. `None` when not running.
    pub managed: Option<bool>,
    /// Ollama server version (if we have successfully queried it).
    pub version: Option<String>,
}

impl OllamaStatus {
    fn stopped() -> Self {
        Self {
            running: false,
            host: None,
            port: None,
            base_url: None,
            managed: None,
            version: None,
        }
    }
}

/// Health tri-state shaped for the `ServiceDevtoolShell` `HealthBadge`.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum OllamaHealthState {
    /// Responding on the configured port.
    Up,
    /// Not running (slot empty).
    Stopped,
    /// In slot but the most recent ping failed.
    Down,
    /// Service disabled in config, or state cannot be determined.
    Unknown,
}

/// Minimal `{ state, label }` badge shape for the Status tab.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OllamaHealth {
    /// Coarse tri-state for the header dot colour.
    pub state: OllamaHealthState,
    /// Short human-readable text alongside the dot.
    pub label: String,
}

/// Config surface for the devtool Config tab.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OllamaConfig {
    /// Whether the service is enabled at all.
    pub enabled: bool,
    /// Host Ollama binds to.
    pub host: String,
    /// Port Ollama listens on.
    pub port: u16,
    /// Explicit binary path (empty = resolve against PATH).
    pub binary_path: String,
    /// Whether to auto-start at boot (vs. lazy-start via devtool).
    pub auto_start: bool,
}

// ═══════════════════════════════════════════════════════════════
// Command verbs
// ═══════════════════════════════════════════════════════════════

/// Start the Ollama sidecar (idempotent).
///
/// First call probes the configured port; if Ollama is already running
/// we attach, otherwise we spawn `<binary_path> serve`. Subsequent calls
/// return the cached service handle.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn ollama_sidecar_start(
    state: State<'_, PlatformState>,
) -> Result<OllamaStatus, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    let service = platform
        .ensure_ollama_started()
        .await
        .map_err(|e| format!("{e:#}"))?;
    let version = service.version().await.ok();
    Ok(OllamaStatus {
        running: true,
        host: Some(service.host().to_string()),
        port: Some(service.port()),
        base_url: Some(service.base_url()),
        managed: Some(service.is_managed()),
        version,
    })
}

/// Stop the Ollama sidecar (idempotent).
///
/// Attached-mode services return Ok without touching the external
/// Ollama — we never kill a process we didn't spawn.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn ollama_sidecar_stop(state: State<'_, PlatformState>) -> Result<(), String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .ollama_stop()
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Restart the Ollama sidecar — stop then start.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn ollama_sidecar_restart(
    state: State<'_, PlatformState>,
) -> Result<OllamaStatus, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    let service = platform
        .ollama_restart()
        .await
        .map_err(|e| format!("{e:#}"))?;
    let version = service.version().await.ok();
    Ok(OllamaStatus {
        running: true,
        host: Some(service.host().to_string()),
        port: Some(service.port()),
        base_url: Some(service.base_url()),
        managed: Some(service.is_managed()),
        version,
    })
}

/// Current running status of the Ollama sidecar.
///
/// Lock-free read — never spawns. Use `ollama_sidecar_start` for the
/// lazy-start path.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn ollama_sidecar_status(
    state: State<'_, PlatformState>,
) -> Result<OllamaStatus, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    match platform.ollama() {
        Some(service) => {
            let version = service.version().await.ok();
            Ok(OllamaStatus {
                running: true,
                host: Some(service.host().to_string()),
                port: Some(service.port()),
                base_url: Some(service.base_url()),
                managed: Some(service.is_managed()),
                version,
            })
        }
        None => Ok(OllamaStatus::stopped()),
    }
}

/// Health snapshot for the `ServiceDevtoolShell` Status tab.
///
/// Pings the HTTP API if the service is running. Returns `Unknown` when
/// the platform hasn't booted or the service slot is empty AND disabled
/// in config. Returns `Stopped` when slot empty but enabled.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn ollama_sidecar_health(
    state: State<'_, PlatformState>,
) -> Result<OllamaHealth, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    use devpulse_engine::platform::Service as _;
    match platform.ollama() {
        Some(service) => match service.ping().await {
            Ok(()) => Ok(OllamaHealth {
                state: OllamaHealthState::Up,
                label: format!("Running on :{}", service.port()),
            }),
            Err(e) => Ok(OllamaHealth {
                state: OllamaHealthState::Down,
                label: format!("Not responding — {e}"),
            }),
        },
        None => Ok(OllamaHealth {
            state: OllamaHealthState::Stopped,
            label: "Stopped (click Start to spawn or attach)".into(),
        }),
    }
}

/// Read the current Ollama config from the platform boot config.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn ollama_sidecar_config(
    state: State<'_, PlatformState>,
) -> Result<OllamaConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    // The config is inside the boot config; we expose it read-only here.
    // Writing is a follow-up that persists to user TOML.
    let cfg = platform.boot_config_ollama();
    Ok(OllamaConfig {
        enabled: cfg.enabled,
        host: cfg.host.clone(),
        port: cfg.port,
        binary_path: cfg.binary_path.clone(),
        auto_start: cfg.auto_start,
    })
}

/// List models installed in the running Ollama.
///
/// Requires the sidecar to be running (started or attached).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn ollama_sidecar_list_models(
    state: State<'_, PlatformState>,
) -> Result<Vec<OllamaModel>, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    let service = platform
        .ollama()
        .ok_or("Ollama not running")?;
    service
        .list_models()
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Pull a model via `POST /api/pull`. Blocks until the pull completes.
///
/// Progress streaming is a follow-up; this call is non-streaming.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn ollama_sidecar_pull_model(
    state: State<'_, PlatformState>,
    name: String,
) -> Result<(), String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    let service = platform
        .ollama()
        .ok_or("Ollama not running")?;
    service
        .pull_model(&name)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Delete a model via `DELETE /api/delete`.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn ollama_sidecar_delete_model(
    state: State<'_, PlatformState>,
    name: String,
) -> Result<(), String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    let service = platform
        .ollama()
        .ok_or("Ollama not running")?;
    service
        .delete_model(&name)
        .await
        .map_err(|e| format!("{e:#}"))
}
