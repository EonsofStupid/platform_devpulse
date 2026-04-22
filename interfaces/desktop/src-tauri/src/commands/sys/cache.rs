//! Cache service devtool commands — Moka in-memory store.
//!
//! The cache is a non-persistent Moka-backed in-process store. Its
//! devtool exposes only a health probe; "list keys" and "clear" are
//! deliberately not surfaced here — Moka is not meant to be inspected
//! at the devtool level (TTL-driven, thread-local counters).

use crate::state::PlatformState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// Health of the Moka cache service.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CacheHealth {
    /// Whether the service is booted + responding.
    pub reachable: bool,
    /// Latency of the ping in microseconds.
    pub latency_us: u64,
    /// Error message if unreachable.
    pub error: Option<String>,
}

/// Health check for the Moka cache service.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn cache_health(state: State<'_, PlatformState>) -> Result<CacheHealth, String> {
    let platform = state.platform.load_full().ok_or("Platform is still booting")?;

    match platform.cache() {
        Some(svc) => {
            let start = std::time::Instant::now();
            match svc.adapter().ping().await {
                Ok(()) => Ok(CacheHealth {
                    reachable: true,
                    latency_us: u64::try_from(start.elapsed().as_micros()).unwrap_or(u64::MAX),
                    error: None,
                }),
                Err(e) => Ok(CacheHealth {
                    reachable: false,
                    latency_us: 0,
                    error: Some(format!("{e:#}")),
                }),
            }
        }
        None => Ok(CacheHealth {
            reachable: false,
            latency_us: 0,
            error: Some("Cache service not booted".into()),
        }),
    }
}
