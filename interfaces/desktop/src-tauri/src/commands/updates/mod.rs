//! Tauri command surface for the auto-updater.
//!
//! The updater itself is `tauri-plugin-updater`. This module wraps it with
//! typed commands so the frontend never has to touch the raw plugin API:
//!
//! - [`check_for_update`] — ask the configured endpoint whether a newer
//!   build is available. Returns metadata (version, notes, `pub_date`) but
//!   does NOT download.
//! - [`install_update`] — re-check + download + verify signature +
//!   install + restart. Progress is streamed via
//!   [`crate::events::UpdateDownloadProgress`].
//! - [`get_update_channel`] / [`set_update_channel`] — operator-facing
//!   channel preference persisted at `{data_dir}/user/updates.json`.
//!   v0.1.0 ships stable-only; beta/nightly arrive when the publish
//!   workflow grows tag-based artifact splits.
//!
//! Endpoint + pubkey live in `tauri.conf.json` `plugins.updater` — both
//! baked at build time, so the signature check cannot be bypassed at
//! runtime. The signature itself is produced by `cargo xtask
//! release-publish`, which signs the portable zip with the matching
//! Ed25519 private key.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;
use tauri_specta::Event;

use crate::events::{UpdateAvailable, UpdateDownloadProgress, UpdateInstallFinished};
use crate::paths;

// ── Types ───────────────────────────────────────────────────────────

/// Result of an update probe.
///
/// `available == false` is the steady state — the UI shows "up to date"
/// and a "check again" button. `available == true` lights up the
/// install affordance and renders `notes` as the release body.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UpdateInfo {
    /// Whether a newer build is available at the configured endpoint.
    pub available: bool,
    /// Version this build identifies as (from `tauri.conf.json`).
    pub current_version: String,
    /// Version offered by the endpoint, when one is offered.
    pub latest_version: Option<String>,
    /// Release notes from the `notes` field in `latest.json`.
    pub notes: Option<String>,
    /// ISO-8601 string from the `pub_date` field in `latest.json`.
    pub published_at: Option<String>,
}

/// Release channel preference.
///
/// v0.1.0 only `Stable` ships from CI; the other variants exist so the
/// type contract is stable when beta/nightly arrive without forcing a
/// breaking bindings regeneration at that point.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum UpdateChannel {
    /// Default — signed release artifacts published from `main`.
    Stable,
    /// Pre-release candidates. Not yet emitted by the publish workflow.
    Beta,
    /// Per-main-commit nightlies. Not yet emitted by the publish workflow.
    Nightly,
}

impl UpdateChannel {
    /// Stable serde slug used for the persisted JSON.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Stable => "stable",
            Self::Beta => "beta",
            Self::Nightly => "nightly",
        }
    }

    /// Parse from the persisted slug. Unknown values fall back to
    /// [`Self::Stable`] so a hand-edited config never traps the
    /// updater in an invalid state.
    #[must_use]
    pub fn parse_or_stable(s: &str) -> Self {
        match s {
            "beta" => Self::Beta,
            "nightly" => Self::Nightly,
            _ => Self::Stable,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct UpdatesUserConfig {
    channel: String,
}

// ── Commands ────────────────────────────────────────────────────────

/// Probe the updater endpoint and report what's available.
///
/// Network-bound; do not call on the boot path. On success the
/// [`UpdateAvailable`] event is also emitted so any other surface
/// listening (a sidebar badge, the Latest tab) can react without a
/// follow-up command call.
///
/// # Errors
/// Returns the underlying plugin error stringified — typically network
/// failure, malformed `latest.json`, or signature/version validation
/// failure at the plugin layer.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn check_for_update(app: AppHandle) -> Result<UpdateInfo, String> {
    let current = app.package_info().version.to_string();
    let updater = app
        .updater()
        .map_err(|e| format!("updater unavailable: {e}"))?;

    let outcome = updater
        .check()
        .await
        .map_err(|e| format!("update check failed: {e}"))?;

    let info = match outcome {
        Some(u) => UpdateInfo {
            available: true,
            current_version: current,
            latest_version: Some(u.version.clone()),
            notes: u.body.clone(),
            published_at: u.date.map(|d| d.to_string()),
        },
        None => UpdateInfo {
            available: false,
            current_version: current,
            latest_version: None,
            notes: None,
            published_at: None,
        },
    };

    let _ = UpdateAvailable {
        available: info.available,
        current_version: info.current_version.clone(),
        latest_version: info.latest_version.clone(),
        notes: info.notes.clone(),
    }
    .emit(&app);

    Ok(info)
}

/// Download + verify + install the available update, then restart.
///
/// Streams progress as [`UpdateDownloadProgress`] events. Fires
/// [`UpdateInstallFinished`] once the bytes are on disk and the new
/// installer has been invoked. Then calls `app.restart()` so the new
/// build takes over the running process — the user does not need to
/// re-launch.
///
/// Re-checks for the update in case the operator clicked install long
/// after the probe (a stale token would otherwise be a confusing
/// "available but won't install").
///
/// # Errors
/// Returns plugin errors stringified — signature verification failure,
/// download IO failure, installer launch failure.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    let updater = app
        .updater()
        .map_err(|e| format!("updater unavailable: {e}"))?;

    let Some(update) = updater
        .check()
        .await
        .map_err(|e| format!("update re-check failed: {e}"))?
    else {
        return Err("no update available".into());
    };

    let downloaded = Arc::new(AtomicU64::new(0));
    let total: Arc<Mutex<Option<u64>>> = Arc::new(Mutex::new(None));
    let app_for_progress = app.clone();
    let app_for_finish = app.clone();
    let downloaded_for_progress = Arc::clone(&downloaded);
    let total_for_progress = Arc::clone(&total);

    update
        .download_and_install(
            move |chunk_len, content_len| {
                if let Some(t) = content_len
                    && let Ok(mut g) = total_for_progress.lock()
                {
                    *g = Some(t);
                }
                #[allow(clippy::cast_possible_truncation)]
                let n = chunk_len as u64;
                let total_seen = downloaded_for_progress.fetch_add(n, Ordering::Relaxed) + n;
                let total_value = total_for_progress.lock().ok().and_then(|g| *g);
                let _ = UpdateDownloadProgress {
                    downloaded_bytes: total_seen,
                    total_bytes: total_value,
                }
                .emit(&app_for_progress);
            },
            move || {
                let _ = UpdateInstallFinished {}.emit(&app_for_finish);
            },
        )
        .await
        .map_err(|e| format!("download/install failed: {e}"))?;

    app.restart();
}

/// Read the persisted release channel preference.
///
/// Resolves the data dir via [`paths::resolve_data_dir`] instead of
/// the `PlatformState` handle, so this command works the instant the
/// Tauri runtime is up — well before the platform boot task finishes.
/// Channel preference is operator metadata, not a runtime-critical
/// signal; making it available pre-boot eliminates the race where the
/// Sidebar / Latest tab mount before `Platform::boot` completes.
///
/// Defaults to [`UpdateChannel::Stable`] when the file is missing or
/// unreadable — the channel preference is never load-bearing on boot,
/// only on the next update probe.
///
/// # Errors
/// Returns a string only if the data dir itself cannot be resolved
/// (e.g. the executable has no parent path, which shouldn't happen
/// outside a broken install). Disk-read failures fall back to
/// [`UpdateChannel::Stable`] silently.
#[tauri::command]
#[specta::specta]
pub async fn get_update_channel(app: AppHandle) -> Result<UpdateChannel, String> {
    let data_dir = paths::resolve_data_dir(&app)?;
    let path = data_dir.join("user").join("updates.json");
    if !path.exists() {
        return Ok(UpdateChannel::Stable);
    }
    let Ok(raw) = std::fs::read_to_string(&path) else {
        return Ok(UpdateChannel::Stable);
    };
    let parsed: UpdatesUserConfig = match serde_json::from_str(&raw) {
        Ok(p) => p,
        Err(_) => return Ok(UpdateChannel::Stable),
    };
    Ok(UpdateChannel::parse_or_stable(&parsed.channel))
}

/// Persist the release channel preference via atomic write.
///
/// Writes to `{data_dir}/user/updates.json` using the `tmp + rename`
/// pattern so a crash mid-write never leaves the operator with a
/// truncated config. Uses [`paths::resolve_data_dir`] for the same
/// pre-boot-safe reason as [`get_update_channel`].
///
/// # Errors
/// Returns string errors for data-dir resolution failure, filesystem
/// write failure, or serialization failure (the latter is a
/// programming error and indicates this build is broken).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn set_update_channel(app: AppHandle, channel: UpdateChannel) -> Result<(), String> {
    let data_dir = paths::resolve_data_dir(&app)?;
    let dir = data_dir.join("user");
    std::fs::create_dir_all(&dir).map_err(|e| format!("mkdir failed: {e}"))?;
    let path = dir.join("updates.json");
    let payload = UpdatesUserConfig {
        channel: channel.as_str().to_string(),
    };
    let json =
        serde_json::to_string_pretty(&payload).map_err(|e| format!("serialize failed: {e}"))?;
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, json).map_err(|e| format!("write tmp failed: {e}"))?;
    std::fs::rename(&tmp, &path).map_err(|e| format!("atomic rename failed: {e}"))?;
    Ok(())
}
