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
//! 2. That method runs preflight via [`DevForgePreflight`] and, on pass,
//!    resolves the REH tree via [`resolve_devforge_server_dir`] and
//!    calls [`DevForgeService::boot_reh`] with the live
//!    [`DevForgeServiceEntry`] and the platform's `internal_tx`
//!    broadcast sender.
//! 3. `boot_reh` allocates a free port if `entry.port == 0`, generates a
//!    random auth token, spawns `node out/server-main.js` with `--host`,
//!    `--port`, `--connection-token`, `--user-data-dir`, `--extensions-dir`.
//! 4. Health polling waits for the REH server to respond on the port
//!    (up to `entry.startup_timeout()`).
//! 5. On success the service is stored in `Platform::devforge` and its
//!    connection URL is returned.
//! 6. Subsequent `open_devforge_window` calls reuse the running service.
//!
//! Every phase transition emits on **both** observability layers
//! simultaneously via [`emit_lifecycle_dual!`] — structured `tracing`
//! event on the `sidecar.lifecycle` target AND a typed
//! `InternalEvent::SidecarPhaseTransition` on the broadcast bus. See
//! `feedback_dual_observability.md`.

use super::{lifecycle_phase, PreflightCheck, Preflightable, Service, ServiceRole, ServiceState};
use crate::emit_lifecycle_debug;
use crate::emit_lifecycle_dual;
use crate::platform::config::DevForgeServiceEntry;
use crate::platform::facade::events::InternalEvent;
use anyhow::{anyhow, Context, Result};
use devpulse_telemetry::prelude::BroadcastSender;
use rand::Rng;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;
use tokio::process::{Child, Command};

/// `DevForge` service — managed REH web server process.
pub struct DevForgeService {
    child: Mutex<Option<Child>>,
    host: String,
    port: u16,
    token: String,
    /// PID captured from `tokio::process::Child::id()` at spawn. We
    /// snapshot here because `child.id()` returns `None` once the
    /// child is reaped (or moved out of the Mutex on shutdown), and
    /// the frontend needs a stable PID for sysinfo lookups while the
    /// service is alive.
    pid: Option<u32>,
    /// Wall-clock instant the REH child became READY (post health
    /// check). Drives `uptime_secs()` for the layman dashboard.
    started_at: tokio::time::Instant,
    /// Cloned sender for the platform-internal `InternalEvent` bus.
    /// Held so `Service::shutdown` can emit `SHUTDOWN` events without
    /// requiring the caller to thread the sender through every verb.
    internal_tx: BroadcastSender<InternalEvent>,
}

impl DevForgeService {
    /// Boot the REH web server. Allocates a free port if `entry.port == 0`,
    /// generates a token, spawns `node.exe out/server-main.js`, and waits
    /// for the server to become healthy.
    ///
    /// The [`DevForgeServiceEntry`] supplies host, port, startup timeout,
    /// and health-poll interval — every runtime knob lives in the entry,
    /// none in code constants. The `internal_tx` sender drives the
    /// dual-observability emissions; pass `Platform::internal_tx().clone()`.
    ///
    /// # Errors
    /// - `server_dir` missing `out/server-main.js`
    /// - No bundled `node.exe` in `server_dir`
    /// - No free port available (when `entry.port == 0`)
    /// - Server doesn't respond within `entry.startup_timeout()`
    pub async fn boot_reh(
        entry: &DevForgeServiceEntry,
        server_dir: &Path,
        user_data_dir: &Path,
        extensions_dir: Option<&Path>,
        workspace_path: Option<&Path>,
        internal_tx: BroadcastSender<InternalEvent>,
    ) -> Result<Self> {
        // ── Validate the REH tree ────────────────────────────────
        let server_main = server_dir.join("out").join("server-main.js");
        if !server_main.exists() {
            let detail = format!("REH server-main.js not found at {}", server_main.display());
            emit_lifecycle_dual!(
                internal_tx,
                ServiceRole::DevForge,
                lifecycle_phase::FAILED,
                detail.clone()
            );
            return Err(anyhow!(detail));
        }

        let node_exe = resolve_node(server_dir)?;

        // ── Port: 0 = auto-pick a free port ─────────────────────
        let port = if entry.port == 0 {
            portpicker::pick_unused_port()
                .ok_or_else(|| anyhow!("No free TCP port for DevForge REH"))?
        } else {
            entry.port
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

        let mut cmd = build_reh_command(
            &node_exe,
            &server_main,
            entry,
            port,
            &token,
            user_data_dir,
            extensions_dir,
            workspace_path,
            server_dir,
        );

        let bind_addr = format!("{}:{}", entry.host, port);

        emit_lifecycle_dual!(
            internal_tx,
            ServiceRole::DevForge,
            lifecycle_phase::SPAWNING,
            format!("spawning REH at {bind_addr} from {}", server_dir.display()),
            server_dir = %server_dir.display(),
            bind_addr = %bind_addr
        );

        let child = cmd
            .spawn()
            .with_context(|| format!("Failed to spawn node at {}", node_exe.display()))?;

        let pid = child.id();

        // Spawn-relative time anchor — overwritten with the post-health
        // instant if the child becomes READY. We initialise here so
        // `uptime_secs()` returns sane values even if a caller reads
        // mid-boot (between spawn and ready).
        let started_at = tokio::time::Instant::now();

        let service = Self {
            child: Mutex::new(Some(child)),
            host: entry.host.clone(),
            port,
            token,
            pid,
            started_at,
            internal_tx: internal_tx.clone(),
        };

        // ── Wait for the server to start ─────────────────────────
        if let Err(err) = wait_for_health(
            &bind_addr,
            entry.startup_timeout(),
            entry.health_poll_interval(),
        )
        .await
        {
            let detail = format!("REH at {bind_addr} (pid={pid:?}) failed health check: {err}");
            emit_lifecycle_dual!(
                internal_tx,
                ServiceRole::DevForge,
                lifecycle_phase::FAILED,
                detail,
                bind_addr = %bind_addr,
                pid = ?pid
            );
            service.force_kill();
            return Err(err);
        }

        let elapsed_ms = started_at.elapsed().as_millis();
        emit_lifecycle_dual!(
            internal_tx,
            ServiceRole::DevForge,
            lifecycle_phase::READY,
            format!("ready at {bind_addr} (pid={pid:?}) after {elapsed_ms} ms"),
            bind_addr = %bind_addr,
            pid = ?pid,
            startup_ms = elapsed_ms
        );

        Ok(service)
    }

    /// The full URL (including token) for the `WebviewWindow` to load.
    pub fn connection_url(&self) -> String {
        format!("http://{}:{}/?tkn={}", self.host, self.port, self.token)
    }

    /// Host the REH server is bound to.
    #[must_use]
    pub fn host(&self) -> &str {
        &self.host
    }

    /// Port the REH server is listening on.
    pub fn port(&self) -> u16 {
        self.port
    }

    /// PID of the spawned `node.exe` (REH child). Snapshotted at boot
    /// so it remains queryable for sysinfo lookups even when the
    /// `tokio::process::Child` handle has already been reaped.
    #[must_use]
    pub fn pid(&self) -> Option<u32> {
        self.pid
    }

    /// Seconds since the REH child entered READY (post first health
    /// check). Used by the `/devforge` dashboard for layman uptime
    /// readout.
    #[must_use]
    pub fn uptime_secs(&self) -> u64 {
        self.started_at.elapsed().as_secs()
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
        let addr = format!("{}:{}", self.host, self.port);
        tokio::net::TcpStream::connect(&addr)
            .await
            .with_context(|| format!("DevForge REH not responding on {addr}"))?;
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
            let bind_addr = format!("{}:{}", self.host, self.port);
            emit_lifecycle_dual!(
                self.internal_tx,
                ServiceRole::DevForge,
                lifecycle_phase::SHUTDOWN,
                format!("shutting down REH at {bind_addr}"),
                bind_addr = %bind_addr
            );
            let _ = child.start_kill();
            let _ = child.wait().await;
        }
        Ok(())
    }
}

/// Poll until the REH server responds on `addr` or `timeout` elapses.
///
/// Free function (no `&self`) so the caller owns the `host:port`
/// formatting and the [`DevForgeService`] does not need to hold the
/// poll cadence on itself. Each connect attempt is emitted at `DEBUG`
/// level on the `sidecar.lifecycle` target — intra-phase debug events
/// are tracing-only by design (the `InternalEvent` layer carries phase
/// transitions, not poll attempts).
async fn wait_for_health(addr: &str, timeout: Duration, poll: Duration) -> Result<()> {
    let deadline = tokio::time::Instant::now() + timeout;
    let mut attempt: u32 = 0;

    loop {
        if tokio::time::Instant::now() >= deadline {
            return Err(anyhow!(
                "DevForge REH did not respond at {addr} within {timeout:?}"
            ));
        }

        attempt += 1;
        emit_lifecycle_debug!(
            ServiceRole::DevForge,
            lifecycle_phase::SPAWNING,
            bind_addr = %addr,
            attempt = attempt
        );

        if tokio::net::TcpStream::connect(addr).await.is_ok() {
            return Ok(());
        }

        tokio::time::sleep(poll).await;
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

/// Build the `tokio::process::Command` that launches the REH server.
///
/// Extracted from `DevForgeService::boot_reh` so that function stays
/// under the workspace `clippy::too_many_lines` budget (100 lines).
/// All side effects (kill-on-drop, Windows no-console flag,
/// current-dir) are applied here so the caller only deals with the
/// finished `Command`.
#[allow(clippy::too_many_arguments)]
fn build_reh_command(
    node_exe: &Path,
    server_main: &Path,
    entry: &DevForgeServiceEntry,
    port: u16,
    token: &str,
    user_data_dir: &Path,
    extensions_dir: Option<&Path>,
    workspace_path: Option<&Path>,
    server_dir: &Path,
) -> Command {
    let mut cmd = Command::new(node_exe);
    cmd.arg(server_main)
        .arg("--host")
        .arg(&entry.host)
        .arg("--port")
        .arg(port.to_string())
        .arg("--connection-token")
        .arg(token)
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

    cmd
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

// ═══════════════════════════════════════════════════════════════
// Preflight contract — pre-launch checks for DevForge
// ═══════════════════════════════════════════════════════════════

/// Stateless preflight view-struct for `DevForge`.
///
/// The service does not exist yet at preflight time — it has not been
/// spawned. This struct holds borrowed config + paths, runs every
/// pre-launch probe `DevForge` needs, and returns one [`PreflightCheck`]
/// per probe via the [`Preflightable`] contract.
///
/// Probes:
/// - `reh.tree` — REH server directory resolvable + `out/server-main.js`
///   present.
/// - `user_data.writable` — `--user-data-dir` is creatable.
/// - `extensions.writable` — `--extensions-dir` is creatable.
/// - `port.free` — when `entry.port != 0`, the requested `host:port`
///   is bindable; when `entry.port == 0`, this passes with a note
///   (auto-pick happens at boot).
pub struct DevForgePreflight<'a> {
    /// Borrowed config — `&boot_config.services.system.devforge`.
    pub entry: &'a DevForgeServiceEntry,
    /// Borrowed platform data directory.
    pub data_dir: &'a Path,
}

impl Preflightable for DevForgePreflight<'_> {
    fn role(&self) -> ServiceRole {
        ServiceRole::DevForge
    }

    async fn preflight(&self) -> Vec<PreflightCheck> {
        let mut checks = Vec::with_capacity(4);

        // ── reh.tree ─────────────────────────────────────────────
        match resolve_devforge_server_dir(self.data_dir) {
            Some(dir) => {
                let main_js = dir.join("out").join("server-main.js");
                if main_js.is_file() {
                    checks.push(PreflightCheck::pass(
                        ServiceRole::DevForge,
                        "reh.tree",
                        format!("REH tree resolved at {}", dir.display()),
                    ));
                } else {
                    checks.push(PreflightCheck::fail(
                        ServiceRole::DevForge,
                        "reh.tree",
                        format!(
                            "REH tree at {} is missing out/server-main.js",
                            dir.display()
                        ),
                    ));
                }
            }
            None => {
                checks.push(PreflightCheck::fail(
                    ServiceRole::DevForge,
                    "reh.tree",
                    "no REH tree found — run `cargo xtask fetch-devforge` \
                     or clone deps/code-oss-reh-web/"
                        .to_string(),
                ));
            }
        }

        // ── user_data.writable ───────────────────────────────────
        let user_data = self.entry.resolve_user_data_dir(self.data_dir);
        match std::fs::create_dir_all(&user_data) {
            Ok(()) => checks.push(PreflightCheck::pass(
                ServiceRole::DevForge,
                "user_data.writable",
                format!("user-data dir ready at {}", user_data.display()),
            )),
            Err(e) => checks.push(PreflightCheck::fail(
                ServiceRole::DevForge,
                "user_data.writable",
                format!("create_dir_all failed at {}: {e}", user_data.display()),
            )),
        }

        // ── extensions.writable ──────────────────────────────────
        let extensions = self.entry.resolve_extensions_dir(self.data_dir);
        match std::fs::create_dir_all(&extensions) {
            Ok(()) => checks.push(PreflightCheck::pass(
                ServiceRole::DevForge,
                "extensions.writable",
                format!("extensions dir ready at {}", extensions.display()),
            )),
            Err(e) => checks.push(PreflightCheck::fail(
                ServiceRole::DevForge,
                "extensions.writable",
                format!("create_dir_all failed at {}: {e}", extensions.display()),
            )),
        }

        // ── port.free ────────────────────────────────────────────
        if self.entry.port == 0 {
            checks.push(PreflightCheck::pass(
                ServiceRole::DevForge,
                "port.free",
                format!("auto-pick at boot — host {} unrestricted", self.entry.host),
            ));
        } else {
            let addr = format!("{}:{}", self.entry.host, self.entry.port);
            match tokio::net::TcpListener::bind(&addr).await {
                Ok(listener) => {
                    drop(listener);
                    checks.push(PreflightCheck::pass(
                        ServiceRole::DevForge,
                        "port.free",
                        format!("{addr} bindable"),
                    ));
                }
                Err(e) => checks.push(PreflightCheck::fail(
                    ServiceRole::DevForge,
                    "port.free",
                    format!("{addr} not bindable: {e}"),
                )),
            }
        }

        checks
    }
}
