//! SurrealDB sidecar service — engine facade over the kernel adapter.
//!
//! The engine facade wraps [`SurrealdbSidecarAdapter`] with the
//! platform `Service` trait and exposes serde-friendly status / health
//! structs for the Tauri command layer. Lifecycle is owned here; the
//! kernel adapter does the actual process management.
//!
//! # Boot-time, not lazy
//!
//! Unlike Ollama (optional, lazy), the SurrealDB sidecar is a critical
//! boot-time dependency — every graph namespace connects through it.
//! The boot pipeline constructs this service; the devtool can read its
//! status but **restart requires an app restart** (the graph services
//! hold WS connections tied to this process; hot-swap is a follow-up).

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_clyffy::cortex::persistence::surrealdb_sidecar::{
    SidecarConfig, SidecarEndpoint, SurrealdbSidecarAdapter,
};
use serde::Serialize;
use specta::Type;
use std::path::PathBuf;
use std::sync::Arc;

/// Engine-level service wrapping the kernel sidecar adapter.
pub struct SurrealdbSidecarService {
    adapter: Arc<SurrealdbSidecarAdapter>,
}

impl SurrealdbSidecarService {
    /// Boot the service — spawns the sidecar, waits for health.
    ///
    /// # Errors
    /// Propagates any failure from [`SurrealdbSidecarAdapter::boot`].
    pub async fn boot(cfg: SidecarConfig) -> Result<Self> {
        let adapter = SurrealdbSidecarAdapter::boot(cfg).await?;
        Ok(Self {
            adapter: Arc::new(adapter),
        })
    }

    /// Underlying adapter (for the graph boot step that needs the endpoint).
    #[must_use]
    pub fn adapter(&self) -> &Arc<SurrealdbSidecarAdapter> {
        &self.adapter
    }

    /// Resolved endpoint (URL, port, credentials).
    #[must_use]
    pub fn endpoint(&self) -> &SidecarEndpoint {
        self.adapter.endpoint()
    }

    /// Serde-friendly status snapshot for the Tauri command layer.
    #[must_use]
    pub fn snapshot(&self) -> SurrealdbSidecarStatus {
        let ep = self.adapter.endpoint();
        SurrealdbSidecarStatus {
            running: true,
            managed: self.adapter.is_managed(),
            host: ep.host.clone(),
            configured_port: ep.allocation.configured,
            actual_port: ep.allocation.actual,
            port_bumps: ep.allocation.bumps,
            http_url: ep.http_url(),
            ws_url: ep.ws_url(),
            binary_path: self
                .adapter
                .binary_path()
                .map(|p| p.to_string_lossy().into_owned()),
        }
    }
}

impl Service for SurrealdbSidecarService {
    fn name(&self) -> &'static str {
        "SurrealDB sidecar"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::SurrealdbSidecar
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        self.adapter.shutdown().await
    }
}

// ═══════════════════════════════════════════════════════════════
// Public DTOs for the Tauri command layer
// ═══════════════════════════════════════════════════════════════

/// Runtime status of the SurrealDB sidecar — what the devtool renders.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SurrealdbSidecarStatus {
    /// True iff the service is present in the platform slot.
    pub running: bool,
    /// True iff we spawned the child; false if we attached to an
    /// externally-running SurrealDB.
    pub managed: bool,
    /// Bind host (e.g. `127.0.0.1`).
    pub host: String,
    /// Port as configured in `platform.default.toml`.
    pub configured_port: u16,
    /// Port we actually bound — may differ from `configured_port`
    /// if the allocator bumped past a foreign listener.
    pub actual_port: u16,
    /// `actual_port - configured_port`. `0` = no bump.
    pub port_bumps: u16,
    /// HTTP base URL (for `.claude/hooks` + curl debugging).
    pub http_url: String,
    /// WebSocket RPC URL (what the `SurrealAdapter` client uses).
    pub ws_url: String,
    /// Explicit binary path, if configured.
    pub binary_path: Option<String>,
}

impl SurrealdbSidecarStatus {
    /// A "stopped" placeholder for when the platform slot is empty.
    #[must_use]
    pub fn stopped(configured_port: u16) -> Self {
        Self {
            running: false,
            managed: false,
            host: String::new(),
            configured_port,
            actual_port: 0,
            port_bumps: 0,
            http_url: String::new(),
            ws_url: String::new(),
            binary_path: None,
        }
    }
}

/// Serde-friendly health probe result.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SurrealdbSidecarHealth {
    /// `"up"` / `"down"` / `"stopped"`.
    pub state: String,
    /// Human-readable label (short).
    pub label: String,
}

impl SurrealdbSidecarHealth {
    /// Healthy — the sidecar responded to `/health` with 2xx.
    #[must_use]
    pub fn up() -> Self {
        Self {
            state: "up".into(),
            label: "healthy".into(),
        }
    }

    /// Down — the sidecar is in the Platform slot but the most recent
    /// probe failed. `reason` is the stringified error.
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

/// Public view of the sidecar config (boot-time values, not user-editable
/// here — see `surrealdb_sidecar_config.rs` for the editable overlay).
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SurrealdbSidecarConfigView {
    /// Whether the sidecar is enabled at all in `platform.default.toml`.
    pub enabled: bool,
    /// Whether boot fails if this service fails.
    pub critical: bool,
    /// Explicit binary path, if configured.
    pub binary_path: Option<PathBuf>,
    /// Whether to start at platform boot.
    pub auto_start: bool,
    /// Port from `[services.network.graph_api].port`.
    pub configured_port: u16,
    /// Root user passed to `surreal start --user`.
    pub root_user: String,
    /// `--log <level>` flag.
    pub log_level: String,
    /// Max `+1` bumps (None = allocator default).
    pub max_bumps: Option<u16>,
}
