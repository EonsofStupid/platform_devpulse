//! Surreal lifecycle — managed `surreal start` child process (RocksDB backend).
//!
//! This adapter owns the lifecycle of the real SurrealDB server binary.
//! It resolves a port (attach / bump), spawns `surreal start`, waits for
//! HTTP health, and exposes the resolved URL + credentials to the
//! [`super::client::SurrealAdapter`] WS layer.
//!
//! # Lifecycle
//!
//! 1. Resolve the port via [`port_alloc::allocate_default`]. If the
//!    configured port is bound by an existing SurrealDB that responds
//!    to `/health`, ATTACH. If bound by a foreign listener, BUMP `+1`.
//! 2. If SPAWN: launch
//!    `surreal start --bind <host>:<port> rocksdb:<data_path>` with
//!    `SURREAL_USER`/`SURREAL_PASS` in the child env.
//! 3. Poll `GET /health` until it returns 2xx or we hit
//!    [`STARTUP_TIMEOUT`]. On timeout, kill the child and error.
//! 4. `shutdown()` kills the child when managed; no-op when attached.
//!
//! The WS client lives in [`super::client::SurrealAdapter`] and is built
//! from the resolved [`SurrealEndpoint`].

use crate::cortex::persistence::port_alloc::{
    self, Disposition, PortAllocation, DEFAULT_MAX_BUMPS,
};
use anyhow::{anyhow, Context, Result};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;
use tokio::process::{Child, Command};

/// Max time to wait for the child to respond on `/health` after spawn.
const STARTUP_TIMEOUT: Duration = Duration::from_secs(30);
/// Interval between `/health` probes while waiting for startup.
const HEALTH_POLL_INTERVAL: Duration = Duration::from_millis(500);
/// Per-request HTTP timeout (probe + identity).
const REQUEST_TIMEOUT: Duration = Duration::from_secs(5);

/// Resolved endpoint of a booted SurrealDB sidecar.
///
/// Consumed by [`super::surreal::SurrealAdapter::connect`] to build the
/// WS client. Also reported to the frontend devtool so the UI can
/// show `configured` vs `actual` port and render a bump badge.
#[derive(Debug, Clone)]
pub struct SurrealEndpoint {
    /// Bind host (e.g. `127.0.0.1`).
    pub host: String,
    /// Port allocation metadata — configured vs. actual, bump count,
    /// spawn-vs-attach disposition.
    pub allocation: PortAllocation,
    /// Root user that the sidecar was launched with (`SURREAL_USER`).
    pub root_user: String,
    /// Root password that the sidecar was launched with (`SURREAL_PASS`).
    pub root_password: String,
}

impl SurrealEndpoint {
    /// Actual port, after any `+1` bumps.
    #[must_use]
    pub fn port(&self) -> u16 {
        self.allocation.actual
    }

    /// HTTP base URL, e.g. `http://127.0.0.1:8823`.
    #[must_use]
    pub fn http_url(&self) -> String {
        format!("http://{}:{}", self.host, self.port())
    }

    /// WebSocket RPC URL, e.g. `ws://127.0.0.1:8823/rpc`.
    #[must_use]
    pub fn ws_url(&self) -> String {
        format!("ws://{}:{}/rpc", self.host, self.port())
    }
}

/// Boot parameters for the sidecar.
#[derive(Debug, Clone)]
pub struct SurrealConfig {
    /// Bind host (always `127.0.0.1` in dev; `0.0.0.0` is rejected).
    pub host: String,
    /// Configured port. May be bumped if taken by a foreign listener.
    pub port: u16,
    /// Max `+1` bumps when the configured port is busy.
    /// `None` → [`DEFAULT_MAX_BUMPS`].
    pub max_bumps: Option<u16>,
    /// Path to the `surreal` binary. Empty → resolve from PATH / standard
    /// install locations.
    pub binary_path: Option<PathBuf>,
    /// Absolute path for RocksDB storage.
    pub data_path: PathBuf,
    /// Root user passed via `SURREAL_USER`.
    pub root_user: String,
    /// Root password passed via `SURREAL_PASS`.
    pub root_password: String,
    /// `--log <level>` flag. Common: `error`, `warn`, `info`, `debug`.
    pub log_level: String,
}

/// Surreal lifecycle — owns the child process and resolved endpoint.
pub struct SurrealLifecycle {
    /// `Some` only when this adapter spawned the child. `None` means
    /// we attached to an externally-running SurrealDB and `shutdown`
    /// is a no-op.
    child: Mutex<Option<Child>>,
    endpoint: SurrealEndpoint,
    binary_path: Option<PathBuf>,
    http: reqwest::Client,
}

impl SurrealLifecycle {
    /// Boot the sidecar.
    ///
    /// # Errors
    /// - Port allocator exhausts `max_bumps` without finding a free or
    ///   attach-compatible port.
    /// - Binary resolution fails (no explicit path, nothing on PATH,
    ///   nothing in standard install locations).
    /// - `tokio::process::Command::spawn` fails.
    /// - Health poll times out within [`STARTUP_TIMEOUT`].
    pub async fn boot(cfg: SurrealConfig) -> Result<Self> {
        let http = reqwest::Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .build()
            .context("build reqwest client for surreal sidecar")?;

        // Port allocator — attach if SurrealDB is already there, bump past
        // foreign listeners otherwise.
        let probe_http = http.clone();
        let probe_host = cfg.host.clone();
        let allocation = port_alloc::allocate(
            &cfg.host,
            cfg.port,
            cfg.max_bumps.unwrap_or(DEFAULT_MAX_BUMPS),
            move |port| {
                let http = probe_http.clone();
                let host = probe_host.clone();
                async move { identity_probe(&http, &host, port).await }
            },
        )
        .await?;

        let endpoint = SurrealEndpoint {
            host: cfg.host.clone(),
            allocation,
            root_user: cfg.root_user.clone(),
            root_password: cfg.root_password.clone(),
        };

        match allocation.disposition {
            Disposition::Attach => {
                tracing::info!(
                    host = %cfg.host,
                    configured = allocation.configured,
                    actual = allocation.actual,
                    bumps = allocation.bumps,
                    "SurrealDB already running — attaching (no spawn)"
                );
                Ok(Self {
                    child: Mutex::new(None),
                    endpoint,
                    binary_path: cfg.binary_path,
                    http,
                })
            }
            Disposition::Spawn => {
                let exe = resolve_binary(cfg.binary_path.as_deref())?;

                // Ensure the data directory exists before surreal tries to use it.
                if let Some(parent) = cfg.data_path.parent() {
                    std::fs::create_dir_all(parent).with_context(|| {
                        format!(
                            "create SurrealDB data parent dir {}",
                            parent.display()
                        )
                    })?;
                }
                std::fs::create_dir_all(&cfg.data_path).with_context(|| {
                    format!("create SurrealDB data dir {}", cfg.data_path.display())
                })?;

                let data_arg = format!("rocksdb:{}", cfg.data_path.display());
                let bind_arg = format!("{}:{}", cfg.host, allocation.actual);

                let mut cmd = Command::new(&exe);
                cmd.arg("start")
                    .arg("--bind")
                    .arg(&bind_arg)
                    .arg("--log")
                    .arg(&cfg.log_level)
                    .arg(&data_arg)
                    .env("SURREAL_USER", &cfg.root_user)
                    .env("SURREAL_PASS", &cfg.root_password)
                    .kill_on_drop(true);

                #[cfg(windows)]
                // CREATE_NO_WINDOW — suppress the console flash on Windows.
                cmd.creation_flags(0x0800_0000);

                tracing::info!(
                    host = %cfg.host,
                    configured = allocation.configured,
                    actual = allocation.actual,
                    bumps = allocation.bumps,
                    exe = %exe.display(),
                    data = %cfg.data_path.display(),
                    "Spawning Surreal"
                );

                let child = cmd
                    .spawn()
                    .with_context(|| format!("failed to spawn {}", exe.display()))?;

                let adapter = Self {
                    child: Mutex::new(Some(child)),
                    endpoint,
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

    /// Resolved endpoint (URL, port, credentials, allocation metadata).
    #[must_use]
    pub fn endpoint(&self) -> &SurrealEndpoint {
        &self.endpoint
    }

    /// Binary path this adapter was booted with, if explicitly configured.
    #[must_use]
    pub fn binary_path(&self) -> Option<&Path> {
        self.binary_path.as_deref()
    }

    /// `true` when this adapter owns a child process. `false` when we
    /// attached to an externally-running SurrealDB.
    #[must_use]
    pub fn is_managed(&self) -> bool {
        self.child
            .lock()
            .ok()
            .and_then(|g| g.as_ref().map(|_| ()))
            .is_some()
    }

    /// Probe `GET /health` against the resolved endpoint.
    ///
    /// # Errors
    /// Propagates HTTP or non-2xx errors.
    pub async fn ping(&self) -> Result<()> {
        let url = format!("{}/health", self.endpoint.http_url());
        self.http
            .get(&url)
            .send()
            .await
            .with_context(|| format!("GET {url}"))?
            .error_for_status()
            .with_context(|| format!("{url} non-2xx"))?;
        Ok(())
    }

    /// Graceful shutdown — kill the spawned child (if any).
    ///
    /// No-op when attached.
    ///
    /// # Errors
    /// Returns an error if the internal lock is poisoned.
    pub async fn shutdown(&self) -> Result<()> {
        let taken = {
            let mut guard = self
                .child
                .lock()
                .map_err(|e| anyhow!("SurrealDB child lock poisoned: {e}"))?;
            guard.take()
        };
        if let Some(mut child) = taken {
            tracing::info!("Surreal shutdown — killing child");
            let _ = child.start_kill();
            let _ = child.wait().await;
        } else {
            tracing::debug!("Surreal shutdown: attached-mode, no child to kill");
        }
        Ok(())
    }

    async fn wait_for_health(&self) -> Result<()> {
        let deadline = tokio::time::Instant::now() + STARTUP_TIMEOUT;
        loop {
            if tokio::time::Instant::now() >= deadline {
                return Err(anyhow!(
                    "SurrealDB did not respond on {}:{} within {:?}",
                    self.endpoint.host,
                    self.endpoint.port(),
                    STARTUP_TIMEOUT,
                ));
            }
            if self.ping().await.is_ok() {
                tracing::info!(
                    port = self.endpoint.port(),
                    "Surreal is healthy"
                );
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

/// Identity probe for the port allocator.
///
/// Returns `Ok(())` iff `GET /health` on `host:port` responds with 2xx
/// AND the `/version` endpoint identifies as SurrealDB. Anything else
/// → port is foreign, bump.
async fn identity_probe(http: &reqwest::Client, host: &str, port: u16) -> Result<()> {
    // `/health` alone isn't enough — lots of services return 200 on /health.
    // `/version` on the real SurrealDB returns a string like "surrealdb-2.x.x".
    let health_url = format!("http://{host}:{port}/health");
    http.get(&health_url)
        .send()
        .await
        .with_context(|| format!("identity probe GET {health_url}"))?
        .error_for_status()
        .with_context(|| format!("identity probe {health_url} non-2xx"))?;

    let version_url = format!("http://{host}:{port}/version");
    let body = http
        .get(&version_url)
        .send()
        .await
        .with_context(|| format!("identity probe GET {version_url}"))?
        .error_for_status()
        .with_context(|| format!("identity probe {version_url} non-2xx"))?
        .text()
        .await
        .with_context(|| format!("identity probe {version_url} body"))?;

    if body.to_ascii_lowercase().contains("surreal") {
        Ok(())
    } else {
        Err(anyhow!(
            "port {host}:{port} answered /version with non-Surreal body: {body:?}"
        ))
    }
}

/// Resolve the `surreal` binary path.
///
/// Priority:
/// 1. Explicit `binary_path` (error if set-but-missing — never silently fall through).
/// 2. Platform-standard install paths ([`standard_surreal_paths`]).
/// 3. Bare `surreal`/`surreal.exe` — PATH resolves.
fn resolve_binary(configured: Option<&Path>) -> Result<PathBuf> {
    if let Some(p) = configured {
        if !p.as_os_str().is_empty() {
            return if p.exists() {
                Ok(p.to_path_buf())
            } else {
                Err(anyhow!(
                    "configured surreal binary_path does not exist: {}",
                    p.display()
                ))
            };
        }
    }
    if let Some(found) = standard_surreal_paths().into_iter().find(|p| p.exists()) {
        tracing::info!(path = %found.display(), "resolved surreal binary from standard path");
        return Ok(found);
    }
    #[cfg(windows)]
    let name = "surreal.exe";
    #[cfg(not(windows))]
    let name = "surreal";
    Ok(PathBuf::from(name))
}

/// Platform-standard install locations for the `surreal` binary.
///
/// Includes the sidecar bundle dir the Tauri build drops into
/// (`interfaces/desktop/src-tauri/binaries/` at dev time, alongside
/// the app exe at release time) so running the app with the vendored
/// binary Just Works.
fn standard_surreal_paths() -> Vec<PathBuf> {
    let mut out = Vec::new();

    // Tauri sidecar bundle — next to the running executable.
    // Tauri renames `surreal-<triple>(.exe)` to `surreal(.exe)` next to the
    // app binary at package time, so this is the canonical release location.
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            #[cfg(windows)]
            out.push(dir.join("surreal.exe"));
            #[cfg(not(windows))]
            out.push(dir.join("surreal"));
        }
    }

    #[cfg(windows)]
    {
        if let Ok(local) = std::env::var("LOCALAPPDATA") {
            out.push(PathBuf::from(&local).join("Programs/SurrealDB/surreal.exe"));
        }
        if let Ok(pf) = std::env::var("ProgramFiles") {
            out.push(PathBuf::from(pf).join("SurrealDB/surreal.exe"));
        }
    }

    #[cfg(target_os = "macos")]
    {
        out.push(PathBuf::from("/usr/local/bin/surreal"));
        out.push(PathBuf::from("/opt/homebrew/bin/surreal"));
        if let Ok(home) = std::env::var("HOME") {
            out.push(PathBuf::from(&home).join(".surrealdb/surreal"));
        }
    }

    #[cfg(target_os = "linux")]
    {
        out.push(PathBuf::from("/usr/local/bin/surreal"));
        out.push(PathBuf::from("/usr/bin/surreal"));
        if let Ok(home) = std::env::var("HOME") {
            out.push(PathBuf::from(&home).join(".surrealdb/surreal"));
        }
    }

    out
}
