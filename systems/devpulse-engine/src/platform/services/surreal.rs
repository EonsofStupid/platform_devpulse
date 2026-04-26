//! Surreal service — engine facade over the kernel adapter.
//!
//! The engine facade wraps [`SurrealLifecycle`] with the
//! platform `Service` trait and exposes serde-friendly status / health
//! structs for the Tauri command layer. Lifecycle is owned here; the
//! kernel adapter does the actual process management.
//!
//! # Boot-time, not lazy
//!
//! Unlike Ollama (optional, lazy), Surreal is a critical boot-time
//! dependency — every graph namespace connects through it. The boot
//! pipeline constructs this service; the devtool can read its status
//! but **restart requires an app restart** (the graph services hold WS
//! connections tied to this process; hot-swap is a follow-up).

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_clyffy::cortex::persistence::surreal::{
    SurrealLifecycle, SurrealConfig, SurrealEndpoint,
};
use serde::Serialize;
use specta::Type;
use std::path::PathBuf;
use std::sync::Arc;

/// Engine-level service wrapping the kernel adapter.
pub struct SurrealService {
    adapter: Arc<SurrealLifecycle>,
}

impl SurrealService {
    /// Boot the service — spawns the child, waits for health.
    ///
    /// # Errors
    /// Propagates any failure from [`SurrealLifecycle::boot`].
    pub async fn boot(cfg: SurrealConfig) -> Result<Self> {
        let adapter = SurrealLifecycle::boot(cfg).await?;
        Ok(Self {
            adapter: Arc::new(adapter),
        })
    }

    /// Underlying adapter (for the graph boot step that needs the endpoint).
    #[must_use]
    pub fn adapter(&self) -> &Arc<SurrealLifecycle> {
        &self.adapter
    }

    /// Resolved endpoint (URL, port, credentials).
    #[must_use]
    pub fn endpoint(&self) -> &SurrealEndpoint {
        self.adapter.endpoint()
    }

    /// Serde-friendly status snapshot for the Tauri command layer.
    #[must_use]
    pub fn snapshot(&self) -> SurrealStatus {
        let ep = self.adapter.endpoint();
        SurrealStatus {
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
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        self.adapter.shutdown().await
    }
}

// ═══════════════════════════════════════════════════════════════
// Public DTOs for the Tauri command layer
// ═══════════════════════════════════════════════════════════════

/// Runtime status of the Surreal service — what the devtool renders.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SurrealStatus {
    /// True iff the service is present in the platform slot.
    pub running: bool,
    /// True iff we spawned the child; false if we attached to an
    /// externally-running `SurrealDB`.
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
    /// WebSocket RPC URL (what the `SurrealLifecycle` client uses).
    pub ws_url: String,
    /// Explicit binary path, if configured.
    pub binary_path: Option<String>,
}

impl SurrealStatus {
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
pub struct SurrealHealth {
    /// `"up"` / `"down"` / `"stopped"`.
    pub state: String,
    /// Human-readable label (short).
    pub label: String,
}

impl SurrealHealth {
    /// Healthy — the child responded to `/health` with 2xx.
    #[must_use]
    pub fn up() -> Self {
        Self {
            state: "up".into(),
            label: "healthy".into(),
        }
    }

    /// Down — the child is in the Platform slot but the most recent
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

/// Public view of the Surreal config (boot-time values, not user-editable
/// here — see `surreal_config.rs` for the editable overlay).
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SurrealConfigView {
    /// Whether the service is enabled at all in `platform.default.toml`.
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
