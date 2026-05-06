//! Surreal service — engine facade over the embedded SurrealKV store.
//!
//! The engine facade wraps [`SurrealLifecycle`] (now an embedded
//! `Surreal<Db>` owner — no child process) with the platform `Service`
//! trait and exposes serde-friendly status / health structs for the
//! Tauri command layer. Lifecycle is owned here; the kernel adapter
//! does the actual file lock + WAL flush.
//!
//! # Boot-time, not lazy
//!
//! Surreal is a critical boot-time dependency — every graph namespace
//! connects through it. The boot pipeline constructs this service;
//! the devtool reads its status and (for hot-update) the Platform
//! drops + reopens the lifecycle.

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_clyffy::cortex::persistence::surreal::{SurrealConfig, SurrealLifecycle};
use serde::Serialize;
use specta::Type;
use std::path::PathBuf;
use std::sync::Arc;

/// Engine-level service wrapping the embedded kernel adapter.
pub struct SurrealService {
    adapter: Arc<SurrealLifecycle>,
}

impl SurrealService {
    /// Boot the service — opens the embedded SurrealKV store at the
    /// configured data path.
    ///
    /// # Errors
    /// Propagates any failure from [`SurrealLifecycle::boot`] (FS error,
    /// existing lock, corrupted store).
    pub async fn boot(cfg: SurrealConfig) -> Result<Self> {
        let adapter = SurrealLifecycle::boot(cfg).await?;
        Ok(Self {
            adapter: Arc::new(adapter),
        })
    }

    /// Underlying adapter (for the graph boot step that reads the live
    /// `Surreal<Db>` connection).
    #[must_use]
    pub fn adapter(&self) -> &Arc<SurrealLifecycle> {
        &self.adapter
    }

    /// Serde-friendly status snapshot for the Tauri command layer.
    #[must_use]
    pub fn snapshot(&self) -> SurrealStatus {
        SurrealStatus {
            running: true,
            // Embedded — DevPulse always owns the file. Retained for
            // source-compat with the prior sidecar surface.
            managed: self.adapter.is_managed(),
            backend: "kv-surrealkv".into(),
            data_path: self.adapter.data_path().to_string_lossy().into_owned(),
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
///
/// Embedded path: no host/port/HTTP/WS — DevPulse holds the file lock
/// directly. The devtool surfaces `data_path` so a layman can see
/// exactly where the bytes live.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SurrealStatus {
    /// True iff the service is present in the platform slot.
    pub running: bool,
    /// True iff DevPulse owns the embedded store. Always `true`
    /// for the embedded path — retained for source-compat with the
    /// prior managed/attached sidecar distinction.
    pub managed: bool,
    /// Storage backend identifier (`"kv-surrealkv"`).
    pub backend: String,
    /// Absolute path to the SurrealKV data directory.
    pub data_path: String,
}

impl SurrealStatus {
    /// A "stopped" placeholder for when the platform slot is empty.
    #[must_use]
    pub fn stopped() -> Self {
        Self {
            running: false,
            managed: false,
            backend: "kv-surrealkv".into(),
            data_path: String::new(),
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
    /// Healthy — the embedded probe (`INFO FOR ROOT`) returned without error.
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
/// here — see `surreal_config.rs` for the editable overlay).
///
/// Embedded path: no port, no binary, no auth fields. The only knob
/// today is `enabled` + `critical`. Future tuning (cache size, compaction
/// policy) lands here without breaking the field surface.
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
