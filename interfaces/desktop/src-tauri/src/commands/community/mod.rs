//! Tauri command surface for the community feed.
//!
//! Pure desktop tier — owns the reqwest client that pulls from the
//! configured Supabase REST endpoint, plus the cache-read commands the
//! UI calls every time the Latest tab or Community page mounts.
//!
//! # Local-first contract
//!
//! - [`fetch_feed`] reads from the local libSQL cache only. Always
//!   responds in milliseconds regardless of network state.
//! - [`sync_community_feed`] makes the remote call. Failures
//!   (no Supabase creds, table missing, network down) report through
//!   [`SyncResult::Skipped`] or [`SyncResult::Failed`] but never panic
//!   and never block the cache reader.
//! - [`community_status`] surfaces last-sync time + enabled toggle so
//!   the UI can render an honest "synced 12 min ago" line.
//!
//! No automatic schedule today — the UI fires `sync_community_feed`
//! on tab-mount and lets the operator click "refresh." A server-side
//! schedule can land later by spawning a tokio task that calls the
//! same kernel helpers; the shape of this module won't change.

use anyhow::Context as _;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use devpulse_engine::platform::{
    is_community_enabled, most_recent_sync_at, query_feed, set_community_enabled,
    upsert_feed_item, FeedItem, FeedKind, SqlAdapter, DEFAULT_FEED_TTL_SECS,
};

use crate::commands::cloud::{get_supabase_credentials, SupabaseCredentials};
use crate::state::PlatformState;

// ── Types ───────────────────────────────────────────────────────────

/// Outcome of a [`sync_community_feed`] invocation.
///
/// `Synced` is the happy path; `Skipped` means we declined to call out
/// (cache is fresh, or community is disabled); `Failed` carries a
/// stringified reason for the UI to surface inline.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case", tag = "kind")]
pub enum SyncResult {
    /// Sync ran and `upserted` rows landed in the local cache.
    Synced {
        /// Number of rows upserted into `community_feed`.
        upserted: usize,
        /// Epoch seconds when the sync completed.
        completed_at: i64,
    },
    /// Sync skipped intentionally — cache fresh, disabled, or no creds.
    Skipped {
        /// Human-readable reason.
        reason: String,
    },
    /// Sync attempted and failed — message describes the failure.
    Failed {
        /// Stringified error from the failing layer.
        error: String,
    },
}

/// Lightweight status payload for the community subsystem.
///
/// Used by the Latest tab / Community page header to render "synced
/// 12 min ago · enabled" without forcing a full feed reload.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CommunityStatus {
    /// Whether community sync is allowed per operator toggle.
    pub enabled: bool,
    /// Most recent `synced_at` in the cache (epoch seconds, 0 = never).
    pub last_sync_at: i64,
    /// Whether the cache is older than `DEFAULT_FEED_TTL_SECS`.
    pub cache_stale: bool,
    /// Total rows currently in `community_feed`.
    pub cached_items: usize,
}

// ── Helpers ─────────────────────────────────────────────────────────

fn now_epoch_secs() -> i64 {
    #[allow(clippy::cast_possible_wrap)]
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

// ── Commands ────────────────────────────────────────────────────────

/// Read recent feed items from the local cache.
///
/// Pure cache read — never touches the network. Returns whatever was
/// synced last; an empty Vec is the legitimate steady state when no
/// sync has run or the upstream table is empty.
///
/// # Errors
/// Returns string errors for missing platform handle or SQL failure.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn fetch_feed(
    kind: Option<String>,
    limit: Option<usize>,
    state: State<'_, PlatformState>,
) -> Result<Vec<FeedItem>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("user relational service not available")?;
    let adapter: &dyn SqlAdapter = svc.adapter().as_ref();
    let parsed_kind = kind.as_deref().map(FeedKind::parse_or_activity);
    query_feed(adapter, parsed_kind, limit).await
}

/// Fetch fresh items from the configured Supabase endpoint and upsert
/// them into the local cache.
///
/// Behavior:
/// 1. If community is operator-disabled → [`SyncResult::Skipped`].
/// 2. If `force == false` and the cache is younger than
///    `DEFAULT_FEED_TTL_SECS` → [`SyncResult::Skipped`] (no work needed).
/// 3. If Supabase credentials are missing or the anon key is unset →
///    [`SyncResult::Skipped`] (operator hasn't enrolled cloud yet).
/// 4. Otherwise call `{supabase_url}/rest/v1/community_feed` with the
///    anon key, parse the response, and upsert each row.
///
/// All failure modes degrade to a `SyncResult` variant — the command
/// itself only `Err`s when the platform handle is unavailable.
///
/// # Errors
/// Returns a string only when the platform handle is not yet bound.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn sync_community_feed(
    force: bool,
    state: State<'_, PlatformState>,
) -> Result<SyncResult, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("user relational service not available")?;
    let adapter: &dyn SqlAdapter = svc.adapter().as_ref();

    if !is_community_enabled(adapter).await.unwrap_or(true) {
        return Ok(SyncResult::Skipped {
            reason: "community is disabled in this install".into(),
        });
    }

    let last_sync = most_recent_sync_at(adapter).await.unwrap_or(0);
    let now = now_epoch_secs();
    if !force && now.saturating_sub(last_sync) < DEFAULT_FEED_TTL_SECS {
        return Ok(SyncResult::Skipped {
            reason: "cache is fresh — re-run with force=true to refresh".into(),
        });
    }

    let creds: SupabaseCredentials = match get_supabase_credentials().await {
        Ok(c) => c,
        Err(e) => {
            return Ok(SyncResult::Skipped {
                reason: format!("supabase credentials unavailable: {e}"),
            });
        }
    };

    let items = match fetch_from_supabase(&creds).await {
        Ok(v) => v,
        Err(e) => {
            return Ok(SyncResult::Failed {
                error: format!("{e:#}"),
            });
        }
    };

    let mut upserted = 0_usize;
    for item in items {
        if upsert_feed_item(adapter, &item).await.is_ok() {
            upserted += 1;
        }
    }

    Ok(SyncResult::Synced {
        upserted,
        completed_at: now,
    })
}

/// Surface current community-subsystem health: enabled flag, last sync
/// time, cache freshness, cached item count.
///
/// # Errors
/// Returns string errors for missing platform handle.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn community_status(
    state: State<'_, PlatformState>,
) -> Result<CommunityStatus, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("user relational service not available")?;
    let adapter: &dyn SqlAdapter = svc.adapter().as_ref();
    let enabled = is_community_enabled(adapter).await.unwrap_or(true);
    let last_sync_at = most_recent_sync_at(adapter).await.unwrap_or(0);
    let cache_stale = (now_epoch_secs().saturating_sub(last_sync_at)) >= DEFAULT_FEED_TTL_SECS;
    let cached_items = query_feed(adapter, None, Some(500))
        .await
        .map(|v| v.len())
        .unwrap_or(0);
    Ok(CommunityStatus {
        enabled,
        last_sync_at,
        cache_stale,
        cached_items,
    })
}

/// Flip the operator-facing toggle for community sync.
///
/// # Errors
/// Returns string errors for missing platform handle or SQL failure.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn set_community_enabled_cmd(
    enabled: bool,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("user relational service not available")?;
    let adapter: &dyn SqlAdapter = svc.adapter().as_ref();
    set_community_enabled(adapter, enabled).await
}

// ── Supabase fetch ──────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct SupabaseRow {
    id: String,
    kind: Option<String>,
    title: Option<String>,
    body: Option<String>,
    actor: Option<String>,
    created_at: Option<String>,
    url: Option<String>,
    #[serde(default)]
    payload: serde_json::Value,
}

async fn fetch_from_supabase(creds: &SupabaseCredentials) -> anyhow::Result<Vec<FeedItem>> {
    let anon = creds
        .anon_key
        .as_deref()
        .filter(|s| !s.is_empty())
        .context("supabase anon key not configured")?;

    let url = format!(
        "{base}/rest/v1/community_feed?select=*&order=created_at.desc&limit=100",
        base = creds.url.trim_end_matches('/')
    );

    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header("apikey", anon)
        .header("authorization", format!("Bearer {anon}"))
        .header("accept", "application/json")
        .send()
        .await
        .context("supabase community_feed GET")?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        anyhow::bail!("supabase returned {status}: {body}");
    }

    let rows: Vec<SupabaseRow> = resp
        .json()
        .await
        .context("decode community_feed response body")?;

    let now = now_epoch_secs();
    let items = rows
        .into_iter()
        .map(|r| {
            let kind = r.kind.as_deref().map_or(FeedKind::Activity, FeedKind::parse_or_activity);
            let created_at = r
                .created_at
                .as_deref()
                .and_then(parse_iso8601_to_epoch)
                .unwrap_or(now);
            let payload_json = serde_json::to_string(&r.payload).unwrap_or_else(|_| "{}".into());
            FeedItem {
                id: r.id,
                kind,
                title: r.title,
                body: r.body,
                actor: r.actor,
                created_at,
                synced_at: now,
                url: r.url,
                payload_json,
            }
        })
        .collect();

    Ok(items)
}

/// Lightweight ISO-8601 → epoch-seconds parser. Returns `None` on any
/// non-RFC3339 input; the caller falls back to `now()` in that case so
/// the row still lands in the cache with a sensible-enough timestamp.
fn parse_iso8601_to_epoch(s: &str) -> Option<i64> {
    chrono::DateTime::parse_from_rfc3339(s)
        .ok()
        .map(|dt| dt.timestamp())
}
