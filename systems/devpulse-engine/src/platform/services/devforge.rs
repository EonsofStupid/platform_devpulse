//! `DevForge` service — managed REH (Remote Extension Host) web server.
//!
//! Spawns a Node process running the VS Code REH server. The process is
//! killed when the platform shuts down. Full extension support via
//! client/server architecture.
//!
//! # Lifecycle (lazy, user-initiated)
//!
//! 1. `Platform::ensure_devforge_started()` is called the first time the
//!    user opens the code-editor window (Tauri command
//!    `open_devforge_window`). Boot does NOT start this service.
//! 2. That method resolves the REH tree via [`resolve_reh_server_dir`] and
//!    calls [`DevForgeService::boot_reh`].
//! 3. `boot_reh` allocates a free port, generates a random auth token,
//!    and spawns `node.exe out/server-main.js` with `--host`, `--port`,
//!    `--connection-token`, `--user-data-dir`, `--extensions-dir`.
//! 4. Health polling waits for the REH server to respond on the port
//!    (up to [`STARTUP_TIMEOUT`]).
//! 5. On success the service is stored in `Platform::devforge` and its
//!    connection URL is returned.
//! 6. Subsequent `open_devforge_window` calls reuse the running service.

use super::{Service, ServiceRole, ServiceState};
use anyhow::{anyhow, Context, Result};
use rand::Rng;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;
use tokio::process::{Child, Command};

/// Maximum time to wait for the REH server to respond.
const STARTUP_TIMEOUT: Duration = Duration::from_secs(30);
/// Interval between TCP connect attempts during startup.
const HEALTH_POLL_INTERVAL: Duration = Duration::from_millis(250);

/// `DevForge` service — managed REH web server process.
pub struct DevForgeService {
    child: Mutex<Option<Child>>,
    port: u16,
    token: String,
}

impl DevForgeService {
    /// Boot the REH web server. Allocates a free port, generates a token,
    /// spawns `node.exe out/server-main.js`, and waits for the server to
    /// become healthy.
    ///
    /// # Errors
    /// - `server_dir` missing `out/server-main.js`
    /// - No bundled `node.exe` in `server_dir`
    /// - No free port available
    /// - Server doesn't respond within [`STARTUP_TIMEOUT`]
    pub async fn boot_reh(
        server_dir: &Path,
        user_data_dir: &Path,
        extensions_dir: Option<&Path>,
        workspace_path: Option<&Path>,
        requested_port: u16,
    ) -> Result<Self> {
        // ── Validate the REH tree ────────────────────────────────
        let server_main = server_dir.join("out").join("server-main.js");
        if !server_main.exists() {
            return Err(anyhow!(
                "REH server-main.js not found at {}",
                server_main.display()
            ));
        }

        let node_exe = resolve_node(server_dir)?;

        // ── Port: 0 = auto-pick a free port ─────────────────────
        let port = if requested_port == 0 {
            portpicker::pick_unused_port()
                .ok_or_else(|| anyhow!("No free TCP port for DevForge REH"))?
        } else {
            requested_port
        };

        // ── Random auth token (32 hex chars) ─────────────────────
        let token = generate_token();

        // ── Ensure user-data + extensions dirs exist ─────────────
        std::fs::create_dir_all(user_data_dir)
            .with_context(|| format!("create {}", user_data_dir.display()))?;
        if let Some(ext_dir) = extensions_dir {
            std::fs::create_dir_all(ext_dir)
                .with_context(|| format!("create {}", ext_dir.display()))?;
        }

        // ── Build command ────────────────────────────────────────
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
            .arg(user_data_dir);

        if let Some(ext_dir) = extensions_dir {
            cmd.arg("--extensions-dir").arg(ext_dir);
        }

        if let Some(ws) = workspace_path {
            cmd.arg("--folder-uri").arg(folder_uri(ws));
        }

        cmd.current_dir(server_dir);
        cmd.kill_on_drop(true);

        #[cfg(windows)]
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW

        tracing::info!(
            server_dir = %server_dir.display(),
            port,
            "Spawning DevForge REH server"
        );

        let child = cmd
            .spawn()
            .with_context(|| format!("Failed to spawn node at {}", node_exe.display()))?;

        let service = Self {
            child: Mutex::new(Some(child)),
            port,
            token,
        };

        // ── Wait for the server to start ─────────────────────────
        if let Err(err) = service.wait_for_health().await {
            service.force_kill();
            return Err(err);
        }

        Ok(service)
    }

    /// The full URL (including token) for the `WebviewWindow` to load.
    pub fn connection_url(&self) -> String {
        format!("http://127.0.0.1:{}/?tkn={}", self.port, self.token)
    }

    /// Port the REH server is listening on.
    pub fn port(&self) -> u16 {
        self.port
    }

    /// Poll until the server responds on its port or timeout elapses.
    async fn wait_for_health(&self) -> Result<()> {
        let addr = format!("127.0.0.1:{}", self.port);
        let deadline = tokio::time::Instant::now() + STARTUP_TIMEOUT;

        loop {
            if tokio::time::Instant::now() >= deadline {
                return Err(anyhow!(
                    "DevForge REH did not respond within {STARTUP_TIMEOUT:?}"
                ));
            }

            match tokio::net::TcpStream::connect(&addr).await {
                Ok(_) => {
                    tracing::info!(port = self.port, "DevForge REH responding");
                    return Ok(());
                }
                Err(_) => {
                    tokio::time::sleep(HEALTH_POLL_INTERVAL).await;
                }
            }
        }
    }

    /// Kill the child process without waiting.
    fn force_kill(&self) {
        if let Ok(mut guard) = self.child.lock() {
            if let Some(ref mut child) = *guard {
                let _ = child.start_kill();
            }
        }
    }
}

impl Service for DevForgeService {
    fn name(&self) -> &'static str {
        "DevForge service"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::DevForge
    }

    async fn ping(&self) -> Result<()> {
        let addr = format!("127.0.0.1:{}", self.port);
        tokio::net::TcpStream::connect(&addr)
            .await
            .with_context(|| format!("DevForge REH not responding on :{}", self.port))?;
        Ok(())
    }

    fn state(&self) -> ServiceState {
        let guard = self.child.lock().ok();
        match guard.and_then(|g| g.as_ref().map(|_| ())) {
            Some(()) => ServiceState::Ready,
            None => ServiceState::Failed,
        }
    }

    async fn shutdown(&self) -> Result<()> {
        // Take the child out of the Mutex before awaiting. Holding a
        // `std::sync::MutexGuard` across `.await` is UB-adjacent on
        // async runtimes: the task may be re-scheduled to a different
        // worker thread mid-await and the guard released in the wrong
        // thread. Extract, drop the guard, then await safely.
        //
        // This also resolves the `clippy::await_holding_lock` finding
        // from the S0 structural audit (AUDIT-2026-04-21.md, finding #3).
        let taken_child = {
            let mut guard = self
                .child
                .lock()
                .map_err(|e| anyhow!("Lock poisoned: {e}"))?;
            guard.take()
        };
        if let Some(mut child) = taken_child {
            tracing::info!(port = self.port, "Shutting down DevForge REH");
            let _ = child.start_kill();
            let _ = child.wait().await;
        }
        Ok(())
    }
}

/// Resolve the Node interpreter bundled with the REH tree.
fn resolve_node(server_dir: &Path) -> Result<PathBuf> {
    #[cfg(windows)]
    let candidate = server_dir.join("node.exe");
    #[cfg(not(windows))]
    let candidate = server_dir.join("node");

    if candidate.exists() {
        Ok(candidate)
    } else {
        Err(anyhow!(
            "REH bundled node not found at {}",
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

/// Convert a filesystem path into the `file://` URI the REH server expects.
fn folder_uri(path: &Path) -> String {
    let s = path.to_string_lossy().replace('\\', "/");
    if s.starts_with('/') {
        format!("file://{s}")
    } else {
        format!("file:///{s}")
    }
}

/// Resolve the `DevForge` server directory — the tree containing
/// `out/server-main.js` that the Node runtime executes.
///
/// Lookup order:
/// 1. **Dev** (`debug_assertions`): `<repo>/interfaces/desktop/src-tauri/
///    resources/devforge/<platform>/` — fetched release tree (preferred
///    because it ships native modules).
/// 2. **Dev fallback**: `<repo>/deps/code-oss-reh-web/` — local dev checkout.
/// 3. **Release**: `<data_dir>/devforge/install/current/` — seed-copied
///    from Tauri bundled resources on first launch.
///
/// Repo root is derived from `CARGO_MANIFEST_DIR` at compile time (the
/// devpulse-engine crate lives at `systems/devpulse-engine/`, so `.parent()`
/// twice yields the repo root). NEVER derive from `data_dir.parent()` — that
/// silently breaks in release builds.
///
/// Returns `None` if no valid `DevForge` tree is found.
#[must_use]
pub fn resolve_devforge_server_dir(data_dir: &Path) -> Option<PathBuf> {
    #[cfg(debug_assertions)]
    {
        let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        if let Some(repo_root) = manifest
            .parent() // systems/
            .and_then(Path::parent)
        // repo root
        {
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

            let dev_reh = repo_root.join("deps").join("code-oss-reh-web");
            if dev_reh.join("out").join("server-main.js").is_file() {
                return Some(dev_reh);
            }
        }
    }

    let installed = data_dir.join("devforge").join("install").join("current");
    if installed.join("out").join("server-main.js").is_file() {
        return Some(installed);
    }

    None
}
