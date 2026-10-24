//! Surreal service — engine facade over the Surreal server (plan 0007 Part S).
//!
//! The engine facade wraps [`SurrealLifecycle`] — upstream's server build in
//! a supervised subprocess — with the platform `Service` trait and exposes
//! serde-friendly status / health structs for the Tauri command layer, and
//! keeps the server's root password ([`root_password`]).
//!
//! # Boot-time, not lazy
//!
//! Surreal is a critical boot-time dependency — every graph namespace
//! connects through it. The boot pipeline constructs this service; the
//! devtool reads its status; shutdown stops the server gracefully.

use crate::platform::services::{Service, ServiceRole, ServiceState};
use anyhow::{Context, Result};
use devpulse_clyffy::cortex::persistence::surreal::{SurrealConfig, SurrealLifecycle};
use devpulse_clyffy::cortex::persistence::RuntimeState;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::{Path, PathBuf};
use std::sync::Arc;

/// The credentials file's shape.
#[derive(Debug, Serialize, Deserialize)]
struct Credentials {
    password: String,
}

/// The Surreal root password kept at `path`: read it, or generate and keep
/// it the first time. The file lives inside the `DevPulse` folder, so a
/// copied folder still opens its store; it is never synced.
///
/// # Errors
/// Returns an error if the file cannot be read, parsed or written.
pub fn root_password(path: &Path) -> Result<String> {
    match std::fs::read_to_string(path) {
        Ok(text) => {
            let creds: Credentials = toml::from_str(&text)
                .with_context(|| format!("read the Surreal credentials {}", path.display()))?;
            Ok(creds.password)
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            let password = format!(
                "{}{}",
                uuid::Uuid::new_v4().simple(),
                uuid::Uuid::new_v4().simple()
            );
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent)
                    .with_context(|| format!("create {}", parent.display()))?;
            }
            let body = format!(
                "# The Surreal server's root password, generated on its first start\n\
                 # (plan 0007 Part S). Kept inside the DevPulse folder; never synced.\n{}",
                toml::to_string(&Credentials {
                    password: password.clone()
                })?
            );
            std::fs::write(path, body)
                .with_context(|| format!("keep the Surreal credentials {}", path.display()))?;
            Ok(password)
        }
        Err(e) => Err(e).with_context(|| format!("read {}", path.display())),
    }
}

/// Engine-level service wrapping the kernel's Surreal server lifecycle.
pub struct SurrealService {
    adapter: Arc<SurrealLifecycle>,
}

impl SurrealService {
    /// Boot the service — starts the Surreal server on the configured store
    /// and waits until it answers.
    ///
    /// # Errors
    /// Propagates any failure from [`SurrealLifecycle::boot`] (binary not
    /// installed, store folder, a server that exits or never answers).
    pub async fn boot(cfg: SurrealConfig) -> Result<Self> {
        let adapter = SurrealLifecycle::boot(cfg).await?;
        Ok(Self {
            adapter: Arc::new(adapter),
        })
    }

    /// Underlying lifecycle (the graph boot step connects its scopes
    /// through it).
    #[must_use]
    pub fn adapter(&self) -> &Arc<SurrealLifecycle> {
        &self.adapter
    }

    /// Serde-friendly status snapshot for the Tauri command layer: the live
    /// process, its port, its build and its restarts.
    #[must_use]
    pub fn snapshot(&self) -> SurrealStatus {
        let lifecycle = &self.adapter;
        let pid = lifecycle.pid();
        let allocation = lifecycle.allocation();
        let (state, state_detail) = describe(&lifecycle.state());
        SurrealStatus {
            running: pid.is_some(),
            managed: lifecycle.is_managed(),
            backend: format!("{} (server)", lifecycle.engine()),
            data_path: lifecycle.data_path().to_string_lossy().into_owned(),
            state: state.into(),
            state_detail,
            pid,
            binary: lifecycle.binary().to_string_lossy().into_owned(),
            version: lifecycle.version().map(str::to_owned),
            endpoint: lifecycle.endpoint(),
            configured_port: allocation.map(|a| a.configured),
            actual_port: allocation.map(|a| a.actual),
            restarts: lifecycle.restarts(),
            ready_since: lifecycle
                .ready_since()
                .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339()),
        }
    }
}

/// The server's state as the window names it, and its detail (why it
/// failed, or which restart this is).
fn describe(state: &RuntimeState) -> (&'static str, Option<String>) {
    match state {
        RuntimeState::Starting => ("starting", None),
        RuntimeState::Ready => ("ready", None),
        RuntimeState::Restarting { attempt } => (
            "restarting",
            Some(format!("restart {attempt} after a crash")),
        ),
        RuntimeState::Stopped => ("stopped", None),
        RuntimeState::Failed { reason } => ("failed", Some(reason.clone())),
    }
}

impl Service for SurrealService {
    fn name(&self) -> &'static str {
        "SurrealDB"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Surreal
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn state(&self) -> ServiceState {
        match self.adapter.state() {
            RuntimeState::Starting => ServiceState::Booting,
            RuntimeState::Ready => ServiceState::Ready,
            RuntimeState::Restarting { .. } => ServiceState::Degraded,
            RuntimeState::Stopped | RuntimeState::Failed { .. } => ServiceState::Failed,
        }
    }

    async fn shutdown(&self) -> Result<()> {
        self.adapter.shutdown().await
    }
}

// ═══════════════════════════════════════════════════════════════
// Public DTOs for the Tauri command layer
// ═══════════════════════════════════════════════════════════════

/// Runtime status of the Surreal server — what the devtool renders (plan
/// 0007 S7): the live process, the port it got, the build it runs, its
/// restarts, and where the bytes live.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SurrealStatus {
    /// The server process is alive.
    pub running: bool,
    /// `DevPulse` started and owns the server (always: it never attaches to
    /// one it did not start).
    pub managed: bool,
    /// Storage engine, e.g. `"surrealkv (server)"`.
    pub backend: String,
    /// The store folder.
    pub data_path: String,
    /// `starting` / `ready` / `restarting` / `stopped` / `failed`;
    /// `not started` when boot skipped or failed it.
    pub state: String,
    /// Why it failed, or which restart this is.
    pub state_detail: Option<String>,
    /// The server's process id, while it runs.
    pub pid: Option<u32>,
    /// The server build it runs.
    pub binary: String,
    /// The version the server reported (`surrealdb-3.0.5`).
    pub version: Option<String>,
    /// Its address, e.g. `http://127.0.0.1:8822`.
    pub endpoint: Option<String>,
    /// The port configuration asked for.
    pub configured_port: Option<u16>,
    /// The port it got (higher when the configured one was taken).
    pub actual_port: Option<u16>,
    /// Restarts after a crash since `DevPulse` started it.
    pub restarts: u32,
    /// When it last started answering (RFC 3339).
    pub ready_since: Option<String>,
}

impl SurrealStatus {
    /// The status when there is no server: boot skipped it (disabled in
    /// configuration) or could not start it (the boot log says why).
    #[must_use]
    pub fn stopped() -> Self {
        Self {
            running: false,
            managed: false,
            backend: String::new(),
            data_path: String::new(),
            state: "not started".into(),
            state_detail: None,
            pid: None,
            binary: String::new(),
            version: None,
            endpoint: None,
            configured_port: None,
            actual_port: None,
            restarts: 0,
            ready_since: None,
        }
    }
}

/// Serde-friendly health probe result.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SurrealHealth {
    /// `"up"` / `"down"` / `"stopped"`.
    pub state: String,
    /// Human-readable label (short).
    pub label: String,
}

impl SurrealHealth {
    /// Healthy — the server's `INFO FOR ROOT` returned without error.
    #[must_use]
    pub fn up() -> Self {
        Self {
            state: "up".into(),
            label: "healthy".into(),
        }
    }

    /// Down — the store is open but the most recent probe failed.
    #[must_use]
    pub fn down(reason: &str) -> Self {
        Self {
            state: "down".into(),
            label: reason.into(),
        }
    }

    /// Stopped — the Platform slot is empty (boot skipped or failed).
    #[must_use]
    pub fn stopped() -> Self {
        Self {
            state: "stopped".into(),
            label: "not running".into(),
        }
    }
}

/// Public view of the Surreal config (boot-time values, not user-editable
/// here — see [`super::config`] for the editable overlay).
///
/// The server's own settings (binary, port, log level) are in
/// [`SurrealStatus`], as it actually runs.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SurrealConfigView {
    /// Whether the service is enabled at all in `platform.default.toml`.
    pub enabled: bool,
    /// Whether boot fails if this service fails.
    pub critical: bool,
    /// Resolved data path (`{data_dir}/surreal/devpulse`).
    pub data_path: PathBuf,
}
