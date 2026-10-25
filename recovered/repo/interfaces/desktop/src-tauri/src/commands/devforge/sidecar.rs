//! DevForge sidecar — REH web server process lifecycle.
//!
//! [`RehManager`] owns a [`tokio::process::Child`] for the `node.exe`
//! running the VS Code REH web server. It handles:
//!
//! - Free port allocation (via `portpicker`)
//! - Random connection token generation (via `rand`)
//! - Spawning `out/server-main.js` with the right CLI flags
//! - Health check polling against `http://127.0.0.1:<port>/`
//! - Graceful shutdown (Child::kill — Node server has no graceful SIGTERM
//!   handling on Windows anyway)

use anyhow::{anyhow, Context, Result};
use rand::Rng;
use std::path::{Path, PathBuf};
use std::time::Duration;
use tokio::process::{Child, Command};
use tokio::time::{sleep, Instant};

use super::types::{RehConfig, RehStatus};

/// Maximum time to wait for the server to respond to a health check.
const STARTUP_TIMEOUT: Duration = Duration::from_secs(30);

/// Interval between health check attempts during startup.
const HEALTH_POLL_INTERVAL: Duration = Duration::from_millis(250);

/// Owns a running REH server process.
///
/// Dropping the manager does **not** kill the child — callers must invoke
/// [`RehManager::stop`] explicitly (or rely on app-exit cleanup in `lib.rs`).
/// This mirrors the existing pattern for tauri-plugin-shell children.
pub struct RehManager {
    child: Child,
    port: u16,
    token: String,
}

impl RehManager {
    /// Spawn a new REH web server and wait for it to become healthy.
    ///
    /// # Errors
    /// - `server_dir` does not contain `out/server-main.js`
    /// - No free port can be allocated
    /// - `node.exe` cannot be spawned
    /// - Server does not respond to health checks within [`STARTUP_TIMEOUT`]
    pub async fn spawn(config: &RehConfig) -> Result<Self> {
        // ── Validate the build layout ────────────────────────────────
        let server_main = config.server_dir.join("out").join("server-main.js");
        if !server_main.exists() {
            return Err(anyhow!(
                "REH server main script not found at {}",
                server_main.display()
            ));
        }

        let node_exe = resolve_node(&config.server_dir)?;

        // ── Allocate a free port ─────────────────────────────────────
        let port = portpicker::pick_unused_port()
            .ok_or_else(|| anyhow!("No free TCP port available for REH server"))?;

        // ── Generate a connection token (hex-encoded 16 bytes) ───────
        let token = generate_token();

        // ── Build the command line ───────────────────────────────────
        let mut cmd = Command::new(&node_exe);
        cmd.arg(&server_main)
            .arg("--host")
            .arg("127.0.0.1")
            .arg("--port")
            .arg(port.to_string())
            .arg("--connection-token")
            .arg(&token)
            .arg("--accept-server-license-terms")
            .arg("--user-data-dir")
            .arg(&config.user_data_dir);

        if let Some(ws) = &config.workspace_path {
            cmd.arg("--folder-uri").arg(folder_uri(ws));
        }

        if let Some(ext_dir) = &config.extensions_dir {
            cmd.arg("--extensions-dir").arg(ext_dir);
        }

        cmd.current_dir(&config.server_dir);
        cmd.kill_on_drop(true);

        // On Windows, hide the console window that Node would otherwise pop.
        // `creation_flags` is an inherent method on `tokio::process::Command`
        // on Windows — no trait import needed.
        #[cfg(windows)]
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW

        tracing::info!(
            server_dir = %config.server_dir.display(),
            port,
            "Spawning REH web server"
        );

        let child = cmd
            .spawn()
            .with_context(|| format!("Failed to spawn {}", node_exe.display()))?;

        let mut manager = Self { child, port, token };

        // ── Wait for the server to start serving HTTP ────────────────
        if let Err(err) = manager.wait_for_health().await {
            // Kill the child so we don't leak a process.
            let _ = manager.child.kill().await;
            return Err(err);
        }

        Ok(manager)
    }

    /// Poll the server until it responds or the startup timeout elapses.
    async fn wait_for_health(&self) -> Result<()> {
        let url = format!("http://127.0.0.1:{}/", self.port);
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(2))
            .build()
            .context("Failed to build reqwest client for REH health check")?;

        let deadline = Instant::now() + STARTUP_TIMEOUT;
        loop {
            if Instant::now() >= deadline {
                return Err(anyhow!(
                    "REH server did not respond within {:?}",
                    STARTUP_TIMEOUT
                ));
            }

            match client.get(&url).send().await {
                Ok(resp) => {
                    // Any HTTP response means the server is alive. VS Code's
                    // REH layer typically returns 403 on the root without a
                    // valid token, which is still "healthy" for our purposes.
                    let status = resp.status();
                    tracing::info!(%status, port = self.port, "REH server responded");
                    return Ok(());
                }
                Err(err) => {
                    tracing::debug!(%err, port = self.port, "REH health check pending");
                }
            }

            sleep(HEALTH_POLL_INTERVAL).await;
        }
    }

    /// Gracefully stop the running REH process.
    ///
    /// # Errors
    /// Returns an error if the child process cannot be killed or awaited.
    pub async fn stop(mut self) -> Result<()> {
        tracing::info!(port = self.port, "Stopping REH web server");
        self.child
            .kill()
            .await
            .context("Failed to kill REH child process")?;
        // Reap the exit status so we don't leave a zombie on Unix.
        let _ = self.child.wait().await;
        Ok(())
    }

    /// Build a [`RehStatus`] snapshot from the current manager state.
    #[must_use]
    pub fn status(&self) -> RehStatus {
        RehStatus {
            running: true,
            port: Some(self.port),
            url: Some(self.connection_url()),
            pid: self.child.id(),
        }
    }

    /// The full URL (including token) a browser/webview should load.
    #[must_use]
    pub fn connection_url(&self) -> String {
        format!("http://127.0.0.1:{}/?tkn={}", self.port, self.token)
    }
}

/// Resolve the Node interpreter that ships with the REH build.
///
/// REH bundles its own `node.exe` at the server root. Falling back to
/// `PATH` `node` would risk version mismatches with the server's native
/// modules, so we hard-fail if the bundled binary is missing.
fn resolve_node(server_dir: &PathBuf) -> Result<PathBuf> {
    #[cfg(windows)]
    let candidate = server_dir.join("node.exe");
    #[cfg(not(windows))]
    let candidate = server_dir.join("node");

    if candidate.exists() {
        Ok(candidate)
    } else {
        Err(anyhow!(
            "REH bundled node binary not found at {}",
            candidate.display()
        ))
    }
}

/// Generate a 32-character hex token from 16 random bytes.
fn generate_token() -> String {
    let mut bytes = [0u8; 16];
    rand::thread_rng().fill(&mut bytes);
    let mut s = String::with_capacity(32);
    for b in bytes {
        use std::fmt::Write as _;
        let _ = write!(&mut s, "{b:02x}");
    }
    s
}

/// Convert a filesystem path into the `file://` URI the REH server expects
/// for `--folder-uri`.
fn folder_uri(path: &Path) -> String {
    // Normalize Windows backslashes to forward slashes and add a file:// prefix.
    // We don't use the `url` crate here to avoid pulling in another dep.
    let s = path.to_string_lossy().replace('\\', "/");
    if s.starts_with('/') {
        format!("file://{s}")
    } else {
        // Windows drive letter — file:///C:/...
        format!("file:///{s}")
    }
}
