//! Ollama — `ollama serve` managed child process.
//!
//! Mirrors [`super::surreal::SurrealLifecycle`]: port allocation
//! (attach / bump), spawn / attach disposition, health poll, HTTP
//! client for the Ollama REST API. Lifted out of
//! `systems/devpulse-engine/src/platform/services/ollama.rs` so Ollama
//! sits alongside the other cortex resource adapters (surreal, libsql,
//! duckdb, rro, moka, whisper, kokoros, embedder).
//!
//! Kernel/engine split:
//! - `OllamaAdapter` (this file) — lifecycle, port resolution, raw API.
//! - `platform::services::ollama` — engine facade: `Service` trait
//!   impl, plumbing into boot + devtool, Tauri command glue.

use crate::cortex::persistence::port_alloc::{
    self, Disposition, PortAllocation, DEFAULT_MAX_BUMPS,
};
use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;
use tokio::process::{Child, Command};

const STARTUP_TIMEOUT: Duration = Duration::from_secs(30);
const HEALTH_POLL_INTERVAL: Duration = Duration::from_millis(500);
const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);

/// A model reported by `GET /api/tags`.
///
/// Crosses the Tauri IPC boundary verbatim — no engine-side wrapper.
/// `specta::Type` is gated on the optional `specta` feature so kernel-only
/// builds don't pull specta into their dep tree.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
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

/// Boot parameters.
#[derive(Debug, Clone)]
pub struct OllamaConfig {
    /// Bind host (Ollama uses `OLLAMA_HOST=<host>:<port>` env var).
    pub host: String,
    /// Configured port. May be bumped if taken by a foreign listener.
    pub port: u16,
    /// Max `+1` bumps. `None` → [`DEFAULT_MAX_BUMPS`].
    pub max_bumps: Option<u16>,
    /// Explicit binary path; empty string → PATH / standard install.
    pub binary_path: Option<PathBuf>,
}

/// Ollama adapter — owns the child (when managed) and HTTP client.
pub struct OllamaAdapter {
    /// `Some` only when this adapter spawned the child.
    child: Mutex<Option<Child>>,
    host: String,
    allocation: PortAllocation,
    binary_path: Option<PathBuf>,
    http: reqwest::Client,
}

impl OllamaAdapter {
    /// Boot the sidecar.
    ///
    /// # Errors
    /// - Port allocator exhausts bumps without finding a free or
    ///   attach-compatible port.
    /// - Binary resolution fails.
    /// - Spawn fails.
    /// - Health poll times out.
    pub async fn boot(cfg: OllamaConfig) -> Result<Self> {
        let http = reqwest::Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .build()
            .context("build reqwest client for ollama sidecar")?;

        let probe_http = http.clone();
        let probe_host = cfg.host.clone();
        let allocation = port_alloc::allocate(
            &cfg.host,
            cfg.port,
            cfg.max_bumps.unwrap_or(DEFAULT_MAX_BUMPS),
            move |port| {
                let http = probe_http.clone();
                let host = probe_host.clone();
                async move { probe_version(&http, &host, port).await.map(|_| ()) }
            },
        )
        .await?;

        match allocation.disposition {
            Disposition::Attach => {
                tracing::info!(
                    host = %cfg.host,
                    configured = allocation.configured,
                    actual = allocation.actual,
                    bumps = allocation.bumps,
                    "Ollama already running — attaching (no spawn)"
                );
                Ok(Self {
                    child: Mutex::new(None),
                    host: cfg.host,
                    allocation,
                    binary_path: cfg.binary_path,
                    http,
                })
            }
            Disposition::Spawn => {
                let exe = resolve_binary(cfg.binary_path.as_deref())?;
                let host_env = format!("{}:{}", cfg.host, allocation.actual);

                let mut cmd = Command::new(&exe);
                cmd.arg("serve")
                    .env("OLLAMA_HOST", &host_env)
                    .kill_on_drop(true);

                #[cfg(windows)]
                cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW

                tracing::info!(
                    host = %cfg.host,
                    configured = allocation.configured,
                    actual = allocation.actual,
                    bumps = allocation.bumps,
                    exe = %exe.display(),
                    "Spawning Ollama sidecar"
                );

                let child = cmd
                    .spawn()
                    .with_context(|| format!("failed to spawn {}", exe.display()))?;

                let adapter = Self {
                    child: Mutex::new(Some(child)),
                    host: cfg.host,
                    allocation,
                    binary_path: cfg.binary_path,
                    http,
                };

                if let Err(e) = adapter.wait_for_health().await {
                    adapter.force_kill();
                    return Err(e);
                }
                Ok(adapter)
            }
        }
    }

    /// Bind host (e.g. `127.0.0.1`).
    #[must_use]
    pub fn host(&self) -> &str {
        &self.host
    }

    /// Resolved port (after any `+1` bumps).
    #[must_use]
    pub fn port(&self) -> u16 {
        self.allocation.actual
    }

    /// Full port allocation metadata (configured, actual, bumps, disposition).
    #[must_use]
    pub fn allocation(&self) -> PortAllocation {
        self.allocation
    }

    /// HTTP base URL (`http://host:port`).
    #[must_use]
    pub fn base_url(&self) -> String {
        format!("http://{}:{}", self.host, self.port())
    }

    /// Binary path the adapter was booted with, if explicitly set.
    #[must_use]
    pub fn binary_path(&self) -> Option<&Path> {
        self.binary_path.as_deref()
    }

    /// `true` when this adapter spawned the child. `false` when attached.
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
    /// HTTP failure / non-2xx / decode failure.
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
    /// HTTP failure / non-2xx / decode failure.
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
    /// Blocks until the terminal NDJSON object arrives. Streaming
    /// progress is a follow-up.
    ///
    /// # Errors
    /// HTTP failure / non-2xx.
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
        let _ = resp.text().await;
        Ok(())
    }

    /// Delete a model via `DELETE /api/delete`.
    ///
    /// # Errors
    /// HTTP failure / non-2xx.
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

    /// Health probe via `GET /api/version`.
    ///
    /// # Errors
    /// HTTP failure / non-2xx.
    pub async fn ping(&self) -> Result<()> {
        self.version().await.map(|_| ())
    }

    /// Graceful shutdown — kill the spawned child if any.
    ///
    /// # Errors
    /// Returns an error if the internal lock is poisoned.
    pub async fn shutdown(&self) -> Result<()> {
        let taken = {
            let mut guard = self
                .child
                .lock()
                .map_err(|e| anyhow!("Ollama child lock poisoned: {e}"))?;
            guard.take()
        };
        if let Some(mut child) = taken {
            tracing::info!("Ollama sidecar shutdown — killing child");
            let _ = child.start_kill();
            let _ = child.wait().await;
        } else {
            tracing::debug!("Ollama sidecar shutdown: attached-mode, no child to kill");
        }
        Ok(())
    }

    async fn wait_for_health(&self) -> Result<()> {
        let deadline = tokio::time::Instant::now() + STARTUP_TIMEOUT;
        loop {
            if tokio::time::Instant::now() >= deadline {
                return Err(anyhow!(
                    "Ollama did not respond on {}:{} within {STARTUP_TIMEOUT:?}",
                    self.host,
                    self.port()
                ));
            }
            if probe_version(&self.http, &self.host, self.port())
                .await
                .is_ok()
            {
                tracing::info!(port = self.port(), "Ollama sidecar responding");
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

/// `GET /api/version` probe — used for both identity and health.
async fn probe_version(http: &reqwest::Client, host: &str, port: u16) -> Result<()> {
    http.get(format!("http://{host}:{port}/api/version"))
        .send()
        .await?
        .error_for_status()?;
    Ok(())
}

/// Resolve the `ollama` binary. See [`super::surreal::lifecycle`] for
/// the parallel SurrealDB version — same pattern, different install
/// paths.
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

fn standard_ollama_paths() -> Vec<PathBuf> {
    let mut out = Vec::new();

    #[cfg(windows)]
    {
        if let Ok(local) = std::env::var("LOCALAPPDATA") {
            out.push(PathBuf::from(&local).join("Programs/Ollama/ollama.exe"));
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
