//! Ollama sidecar service — managed `ollama serve` child process.
//!
//! Wraps the Ollama HTTP API on `<host>:<port>` (default `127.0.0.1:11434`).
//! If Ollama is already running on the configured port when boot is
//! requested, the service attaches in observe-only mode — no child
//! process is spawned and [`shutdown`](Service::shutdown) is a no-op.
//! Otherwise the service spawns `<binary_path> serve` with
//! `OLLAMA_HOST=<host>:<port>` and waits for HTTP health.
//!
//! # Lifecycle (lazy, user-initiated)
//!
//! 1. `Platform::ensure_ollama_sidecar_started()` probes the configured
//!    port. On success, returns an attached service (no child).
//! 2. On probe failure, resolves the binary, spawns it, and waits for
//!    `GET /api/version` to respond within [`STARTUP_TIMEOUT`].
//! 3. On `shutdown`, kills the spawned child (attached mode: no-op).

use super::{Service, ServiceRole, ServiceState};
use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;
use tokio::process::{Child, Command};

/// Maximum time to wait for Ollama to respond after spawning.
const STARTUP_TIMEOUT: Duration = Duration::from_secs(30);
/// Interval between HTTP probes during startup.
const HEALTH_POLL_INTERVAL: Duration = Duration::from_millis(500);
/// HTTP client per-request timeout.
const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);

/// A model reported by `GET /api/tags`.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OllamaModel {
    /// Tag-qualified model name, e.g. `llama3:8b-instruct-q4_K_M`.
    pub name: String,
    /// ISO-8601 timestamp reported by Ollama (may be empty).
    #[serde(default)]
    pub modified_at: String,
    /// On-disk size in bytes (may be 0 if Ollama omits it).
    #[serde(default)]
    pub size: u64,
    /// Blob digest (may be empty).
    #[serde(default)]
    pub digest: String,
}

#[derive(Debug, Deserialize)]
struct TagsResponse {
    #[serde(default)]
    models: Vec<OllamaModel>,
}

#[derive(Debug, Deserialize)]
struct VersionResponse {
    version: String,
}

/// Ollama sidecar service.
///
/// Owns the child process (when managed) and an HTTP client for talking
/// to the Ollama REST API. `child` is `None` when the service attached
/// to an externally-running Ollama instead of spawning a new one.
pub struct OllamaSidecarService {
    /// `Some` only when this service spawned the child.
    child: Mutex<Option<Child>>,
    host: String,
    port: u16,
    binary_path: Option<PathBuf>,
    http: reqwest::Client,
}

impl OllamaSidecarService {
    /// Boot the sidecar.
    ///
    /// First probes `GET /api/version` on the configured host:port. If
    /// that responds, attaches — no child is spawned. Otherwise spawns
    /// `<binary_path> serve` with `OLLAMA_HOST=<host>:<port>` and polls
    /// for health.
    ///
    /// # Errors
    /// - Nothing is listening and `binary_path` points to a file that
    ///   does not exist.
    /// - `tokio::process::Command::spawn` fails (binary not on PATH,
    ///   permission denied, etc.).
    /// - Spawned child does not respond within [`STARTUP_TIMEOUT`].
    pub async fn boot(host: &str, port: u16, binary_path: Option<PathBuf>) -> Result<Self> {
        let http = reqwest::Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .build()
            .context("build reqwest client")?;

        // Fast path: something is already listening — attach.
        if probe_version(&http, host, port).await.is_ok() {
            tracing::info!(%host, port, "Ollama already running — attaching (no spawn)");
            return Ok(Self {
                child: Mutex::new(None),
                host: host.to_string(),
                port,
                binary_path,
                http,
            });
        }

        // Slow path: spawn the child ourselves.
        let exe = resolve_binary(binary_path.as_deref())?;
        let mut cmd = Command::new(&exe);
        cmd.arg("serve")
            .env("OLLAMA_HOST", format!("{host}:{port}"))
            .kill_on_drop(true);

        #[cfg(windows)]
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW

        tracing::info!(%host, port, exe = %exe.display(), "Spawning Ollama sidecar");

        let child = cmd
            .spawn()
            .with_context(|| format!("failed to spawn {}", exe.display()))?;

        let service = Self {
            child: Mutex::new(Some(child)),
            host: host.to_string(),
            port,
            binary_path,
            http,
        };

        if let Err(err) = service.wait_for_health().await {
            service.force_kill();
            return Err(err);
        }

        Ok(service)
    }

    /// Base URL for the Ollama HTTP API.
    #[must_use]
    pub fn base_url(&self) -> String {
        format!("http://{}:{}", self.host, self.port)
    }

    /// Host the service is bound to.
    #[must_use]
    pub fn host(&self) -> &str {
        &self.host
    }

    /// Port the service is listening on.
    #[must_use]
    pub fn port(&self) -> u16 {
        self.port
    }

    /// Binary path the service was booted with, if explicitly configured.
    #[must_use]
    pub fn binary_path(&self) -> Option<&Path> {
        self.binary_path.as_deref()
    }

    /// `true` if this service spawned the child. `false` if it attached
    /// to an externally-running Ollama.
    #[must_use]
    pub fn is_managed(&self) -> bool {
        self.child
            .lock()
            .ok()
            .and_then(|g| g.as_ref().map(|_| ()))
            .is_some()
    }

    /// Fetch the Ollama version string via `GET /api/version`.
    ///
    /// # Errors
    /// - HTTP request fails (network, connect refused).
    /// - Non-2xx response.
    /// - Response body cannot be decoded as `{ "version": "..." }`.
    pub async fn version(&self) -> Result<String> {
        let resp: VersionResponse = self
            .http
            .get(format!("{}/api/version", self.base_url()))
            .send()
            .await
            .context("GET /api/version")?
            .error_for_status()?
            .json()
            .await
            .context("parse version response")?;
        Ok(resp.version)
    }

    /// List installed models via `GET /api/tags`.
    ///
    /// # Errors
    /// - HTTP request fails.
    /// - Non-2xx response.
    /// - Response body cannot be decoded.
    pub async fn list_models(&self) -> Result<Vec<OllamaModel>> {
        let resp: TagsResponse = self
            .http
            .get(format!("{}/api/tags", self.base_url()))
            .send()
            .await
            .context("GET /api/tags")?
            .error_for_status()?
            .json()
            .await
            .context("parse tags response")?;
        Ok(resp.models)
    }

    /// Pull a model via `POST /api/pull` (non-streaming).
    ///
    /// Ollama streams NDJSON when `stream: true`; we pass `stream: false`
    /// so the call blocks until the single terminal JSON object arrives.
    /// Progress streaming is a follow-up.
    ///
    /// # Errors
    /// - HTTP request fails.
    /// - Non-2xx response (model not found in registry, network, etc.).
    pub async fn pull_model(&self, name: &str) -> Result<()> {
        let body = serde_json::json!({ "name": name, "stream": false });
        let resp = self
            .http
            .post(format!("{}/api/pull", self.base_url()))
            .json(&body)
            .send()
            .await
            .context("POST /api/pull")?
            .error_for_status()
            .context("pull_model non-2xx")?;
        // Body not needed — non-error status is success.
        let _ = resp.text().await;
        Ok(())
    }

    /// Delete a model via `DELETE /api/delete`.
    ///
    /// # Errors
    /// - HTTP request fails.
    /// - Non-2xx response (model absent, etc.).
    pub async fn delete_model(&self, name: &str) -> Result<()> {
        let body = serde_json::json!({ "name": name });
        self.http
            .delete(format!("{}/api/delete", self.base_url()))
            .json(&body)
            .send()
            .await
            .context("DELETE /api/delete")?
            .error_for_status()
            .context("delete_model non-2xx")?;
        Ok(())
    }

    async fn wait_for_health(&self) -> Result<()> {
        let deadline = tokio::time::Instant::now() + STARTUP_TIMEOUT;
        loop {
            if tokio::time::Instant::now() >= deadline {
                return Err(anyhow!(
                    "Ollama did not respond on {}:{} within {STARTUP_TIMEOUT:?}",
                    self.host,
                    self.port
                ));
            }
            if probe_version(&self.http, &self.host, self.port)
                .await
                .is_ok()
            {
                tracing::info!(port = self.port, "Ollama sidecar responding");
                return Ok(());
            }
            tokio::time::sleep(HEALTH_POLL_INTERVAL).await;
        }
    }

    fn force_kill(&self) {
        if let Ok(mut guard) = self.child.lock() {
            if let Some(ref mut child) = *guard {
                let _ = child.start_kill();
            }
        }
    }
}

impl Service for OllamaSidecarService {
    fn name(&self) -> &'static str {
        "Ollama sidecar"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::OllamaSidecar
    }

    async fn ping(&self) -> Result<()> {
        self.version().await.map(|_| ())
    }

    fn state(&self) -> ServiceState {
        // Attached mode is also Ready — we are actively speaking to an
        // Ollama. Health is confirmed on each `ping`.
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        // Take the child out before awaiting — holding a std Mutex guard
        // across `.await` is UB-adjacent; same pattern as DevForge.
        let taken_child = {
            let mut guard = self
                .child
                .lock()
                .map_err(|e| anyhow!("Ollama child lock poisoned: {e}"))?;
            guard.take()
        };
        if let Some(mut child) = taken_child {
            tracing::info!("Ollama sidecar shutdown — killing child");
            let _ = child.start_kill();
            let _ = child.wait().await;
        } else {
            tracing::debug!(
                "Ollama sidecar shutdown: attached-mode, no child to kill"
            );
        }
        Ok(())
    }
}

/// Probe `GET /api/version` — used for attach detection and health polling.
async fn probe_version(http: &reqwest::Client, host: &str, port: u16) -> Result<()> {
    http.get(format!("http://{host}:{port}/api/version"))
        .send()
        .await?
        .error_for_status()?;
    Ok(())
}

/// Resolve the `ollama` binary path.
///
/// Lookup order:
/// 1. Configured `binary_path` (explicit user override). Non-empty but
///    missing → error, don't fall through silently.
/// 2. Platform-standard install locations (see [`standard_ollama_paths`]).
///    Ollama's installer adds its bin dir to user PATH, but shells that
///    launched before the install won't see it — a fresh Tauri process
///    spawned by DevPulse can end up in this state, so we probe the
///    known installer paths directly before giving up.
/// 3. Bare `ollama`/`ollama.exe` — lets the OS resolve against PATH.
fn resolve_binary(configured: Option<&Path>) -> Result<PathBuf> {
    if let Some(p) = configured {
        if !p.as_os_str().is_empty() {
            return if p.exists() {
                Ok(p.to_path_buf())
            } else {
                Err(anyhow!(
                    "configured ollama binary_path does not exist: {}",
                    p.display()
                ))
            };
        }
    }
    if let Some(found) = standard_ollama_paths().into_iter().find(|p| p.exists()) {
        tracing::info!(path = %found.display(), "resolved Ollama binary from standard path");
        return Ok(found);
    }
    #[cfg(windows)]
    let name = "ollama.exe";
    #[cfg(not(windows))]
    let name = "ollama";
    Ok(PathBuf::from(name))
}

/// Platform-standard install locations for the `ollama` binary, in
/// priority order. Non-existing paths are fine — the caller filters.
///
/// Sources:
/// - **Windows**: Ollama installer drops to `%LOCALAPPDATA%\Programs\Ollama\ollama.exe`
///   (per-user, no admin) — adds to user PATH but PATH only refreshes
///   for new shells, so spawned subprocesses before a reboot may miss it.
/// - **macOS**: official `.app` bundle ships `ollama` at
///   `/Applications/Ollama.app/Contents/Resources/ollama`; also common
///   Homebrew + manual install paths.
/// - **Linux**: official install script drops to `/usr/local/bin/ollama`;
///   distro packages use `/usr/bin/ollama`.
fn standard_ollama_paths() -> Vec<PathBuf> {
    let mut out = Vec::new();

    #[cfg(windows)]
    {
        if let Ok(local) = std::env::var("LOCALAPPDATA") {
            out.push(PathBuf::from(&local).join("Programs/Ollama/ollama.exe"));
            // Older installs occasionally use `%LOCALAPPDATA%\Ollama\bin\` —
            // harmless extra probe, unreachable paths are filtered at the call site.
            out.push(PathBuf::from(&local).join("Ollama/bin/ollama.exe"));
        }
        if let Ok(pf) = std::env::var("ProgramFiles") {
            out.push(PathBuf::from(pf).join("Ollama/ollama.exe"));
        }
    }

    #[cfg(target_os = "macos")]
    {
        out.push(PathBuf::from(
            "/Applications/Ollama.app/Contents/Resources/ollama",
        ));
        out.push(PathBuf::from("/usr/local/bin/ollama"));
        out.push(PathBuf::from("/opt/homebrew/bin/ollama"));
        if let Ok(home) = std::env::var("HOME") {
            out.push(PathBuf::from(&home).join(".ollama/bin/ollama"));
        }
    }

    #[cfg(target_os = "linux")]
    {
        out.push(PathBuf::from("/usr/local/bin/ollama"));
        out.push(PathBuf::from("/usr/bin/ollama"));
        if let Ok(home) = std::env::var("HOME") {
            out.push(PathBuf::from(&home).join(".local/bin/ollama"));
        }
    }

    out
}
