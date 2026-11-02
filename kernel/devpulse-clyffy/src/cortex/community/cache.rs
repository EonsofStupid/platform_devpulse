//! Local cache CRUD for the `community_feed` table.
//!
//! Schema lives in `systems/devpulse-engine/src/platform/services/relational.rs`
//! (`USER_SCHEMA`). This module owns the read/write helpers so callers
//! never hand-author SQL against the table — keeping the column list in
//! one place keeps schema bumps from rippling across the codebase.

use super::types::{DEFAULT_FEED_LIMIT, FeedItem, FeedKind};
use crate::cortex::persistence::SqlAdapter;

/// Insert or replace one feed item.
///
/// `synced_at` is callsite-set so a sync run can stamp every upserted
/// row with the same timestamp (useful for `query_stale_after()`).
///
/// # Errors
/// Returns the underlying SQL error stringified.
pub async fn upsert_feed_item(adapter: &dyn SqlAdapter, item: &FeedItem) -> Result<(), String> {
    adapter
        .execute(
            "INSERT INTO community_feed \
             (id, kind, title, body, actor, created_at, synced_at, url, payload_json) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) \
             ON CONFLICT(id) DO UPDATE SET \
               kind = excluded.kind, \
               title = excluded.title, \
               body = excluded.body, \
               actor = excluded.actor, \
               created_at = excluded.created_at, \
               synced_at = excluded.synced_at, \
               url = excluded.url, \
               payload_json = excluded.payload_json",
            &[
                item.id.as_str().into(),
                item.kind.as_str().into(),
                item.title.as_deref().into(),
                item.body.as_deref().into(),
                item.actor.as_deref().into(),
                item.created_at.into(),
                item.synced_at.into(),
                item.url.as_deref().into(),
                item.payload_json.as_str().into(),
            ],
        )
        .await
        .map(|_rows_affected| ())
        .map_err(|e| format!("upsert community_feed[{id}]: {e}", id = item.id))
}

/// Query recent feed items, ordered by `created_at DESC`.
///
/// Filter by `kind` when set — `None` returns all kinds. `limit` is
/// clamped to [1, 500] so a runaway caller never asks for an unbounded
/// result.
///
/// # Errors
/// Returns the underlying SQL error stringified.
pub async fn query_feed(
    adapter: &dyn SqlAdapter,
    kind: Option<FeedKind>,
    limit: Option<usize>,
) -> Result<Vec<FeedItem>, String> {
    // Clamped to 500, so the conversion cannot fail.
    let limit = i64::try_from(limit.unwrap_or(DEFAULT_FEED_LIMIT).clamp(1, 500)).unwrap_or(500);

    let rows = if let Some(k) = kind {
        adapter
            .query(
                "SELECT id, kind, title, body, actor, created_at, synced_at, url, payload_json \
                 FROM community_feed \
                 WHERE kind = ? \
                 ORDER BY created_at DESC \
                 LIMIT ?",
                &[k.as_str().into(), limit.into()],
            )
            .await
            .map_err(|e| format!("query community_feed (kind={}): {e}", k.as_str()))?
    } else {
        adapter
            .query(
                "SELECT id, kind, title, body, actor, created_at, synced_at, url, payload_json \
                 FROM community_feed \
                 ORDER BY created_at DESC \
                 LIMIT ?",
                &[limit.into()],
            )
            .await
            .map_err(|e| format!("query community_feed: {e}"))?
    };

    Ok(rows
        .iter()
        .filter_map(|r| row_to_item(r.as_slice()))
        .collect())
}

/// Most-recent `synced_at` across all rows, or `0` when empty.
///
/// Callers compare against `now - DEFAULT_FEED_TTL_SECS` to decide
/// whether a background sync is due. Errors collapse to `0` (which is
/// indistinguishable from "never synced" and triggers a fresh sync on
/// next attempt — the safe direction).
///
/// # Errors
/// Returns the underlying SQL error stringified.
pub async fn most_recent_sync_at(adapter: &dyn SqlAdapter) -> Result<i64, String> {
    let rows = adapter
        .query(
            "SELECT COALESCE(MAX(synced_at), 0) FROM community_feed",
            &[],
        )
        .await
        .map_err(|e| format!("max(synced_at): {e}"))?;
    Ok(rows
        .first()
        .and_then(|r| r.first())
        .and_then(crate::cortex::persistence::SqlValue::as_integer)
        .unwrap_or(0))
}

/// Persist the operator's community-enabled toggle. `enabled = false`
/// suspends the background sync but does not purge the cache (the user
/// can still browse the last-known state).
///
/// # Errors
/// Returns the underlying SQL error stringified.
pub async fn set_community_enabled(adapter: &dyn SqlAdapter, enabled: bool) -> Result<(), String> {
    adapter
        .execute(
            "INSERT INTO community_config (user_id, enabled) VALUES ('system', ?) \
             ON CONFLICT(user_id) DO UPDATE SET enabled = excluded.enabled",
            &[enabled.into()],
        )
        .await
        .map(|_rows_affected| ())
        .map_err(|e| format!("set community enabled: {e}"))
}

/// Read the operator's community-enabled toggle. Defaults to `true`.
///
/// # Errors
/// Returns the underlying SQL error stringified.
pub async fn is_community_enabled(adapter: &dyn SqlAdapter) -> Result<bool, String> {
    let rows = adapter
        .query(
            "SELECT enabled FROM community_config WHERE user_id = 'system' LIMIT 1",
            &[],
        )
        .await
        .map_err(|e| format!("get community enabled: {e}"))?;
    Ok(rows
        .first()
        .and_then(|r| r.first())
        .and_then(crate::cortex::persistence::SqlValue::as_integer)
        != Some(0))
}

fn row_to_item(row: &[crate::cortex::persistence::SqlValue]) -> Option<FeedItem> {
    let id = row.first()?.as_text()?.to_string();
    let kind = FeedKind::parse_or_activity(row.get(1)?.as_text()?);
    let title = row
        .get(2)?
        .as_text()
        .filter(|s| !s.is_empty())
        .map(str::to_string);
    let body = row
        .get(3)?
        .as_text()
        .filter(|s| !s.is_empty())
        .map(str::to_string);
    let actor = row
        .get(4)?
        .as_text()
        .filter(|s| !s.is_empty())
        .map(str::to_string);
    let created_at = row.get(5)?.as_integer()?;
    let synced_at = row.get(6)?.as_integer()?;
    let url = row
        .get(7)?
        .as_text()
        .filter(|s| !s.is_empty())
        .map(str::to_string);
    let payload_json = row.get(8)?.as_text().unwrap_or("{}").to_string();

    Some(FeedItem {
        id,
        kind,
        title,
        body,
        actor,
        created_at,
        synced_at,
        url,
        payload_json,
    })
}
