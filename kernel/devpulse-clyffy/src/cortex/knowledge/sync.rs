//! Boot-time + remote sync — upserts knowledge entries into libSQL.
//!
//! Two callers:
//! 1. [`sync_to_libsql`]   — embedded artifacts on every boot
//! 2. [`sync_remote_entries`] — entries fetched from a remote manifest
//!    by the desktop tier (HTTP lives there, kernel stays network-free)
//!
//! Both flow through [`sync_entries`] which owns the version-compare
//! fast path, the per-entry upsert, and the `knowledge_config` write.
//!
//! `knowledge_seen` is intentionally never touched during sync — user
//! cooldowns survive content updates.

use super::loader;
use super::types::KnowledgeEntry;
use crate::cortex::persistence::SqlAdapter;

/// Sync embedded knowledge entries into libSQL.
///
/// Called during boot after user relational is ready. Delegates to
/// [`sync_entries`] after loading the embedded manifest + data.
///
/// # Errors
/// Returns an error if the embedded manifest cannot be parsed, the
/// data files cannot be loaded, or the underlying upsert/version
/// write fails.
pub async fn sync_to_libsql(adapter: &dyn SqlAdapter) -> Result<usize, String> {
    let manifest =
        loader::load_manifest().map_err(|e| format!("Knowledge manifest parse failed: {e}"))?;
    let entries = loader::load_all()?;
    sync_entries(adapter, &entries, &manifest.version).await
}

/// Upsert a remotely-fetched set of entries.
///
/// Desktop calls this from `sync_knowledge_from_remote` after `GETting`
/// the manifest + each file. Same version-compare contract as the
/// embedded path — repeated calls at the same version are no-ops.
///
/// # Errors
/// Returns an error if any upsert fails or the version write fails.
pub async fn sync_remote_entries(
    adapter: &dyn SqlAdapter,
    entries: &[KnowledgeEntry],
    content_version: &str,
) -> Result<usize, String> {
    sync_entries(adapter, entries, content_version).await
}

/// Shared upsert pipeline. Returns 0 when the version matches the
/// stored one (no work needed); returns the number of entries upserted
/// otherwise.
///
/// # Errors
/// Returns the underlying SQL error stringified on the first failing
/// upsert or version write.
async fn sync_entries(
    adapter: &dyn SqlAdapter,
    entries: &[KnowledgeEntry],
    content_version: &str,
) -> Result<usize, String> {
    let rows = adapter
        .query(
            "SELECT config_json FROM knowledge_config WHERE user_id = 'system' LIMIT 1",
            &[],
        )
        .await
        .map_err(|e| format!("Failed to query knowledge_config: {e}"))?;

    let stored_version = rows
        .first()
        .and_then(|r| r.first())
        .and_then(|v| v.as_text())
        .and_then(|json| serde_json::from_str::<serde_json::Value>(json).ok())
        .and_then(|v| v.get("version").and_then(|v| v.as_str()).map(String::from))
        .unwrap_or_default();

    if stored_version == content_version {
        tracing::info!(
            version = %content_version,
            "Knowledge content up to date — skipping sync"
        );
        return Ok(0);
    }

    tracing::info!(
        stored = %stored_version,
        new = %content_version,
        entry_count = entries.len(),
        "Knowledge content version mismatch — syncing"
    );

    for entry in entries {
        upsert_entry(adapter, entry).await?;
    }

    let config_json = serde_json::json!({ "version": content_version }).to_string();
    adapter
        .execute(
            "INSERT INTO knowledge_config (user_id, config_json, updated_at) \
             VALUES ('system', ?, unixepoch()) \
             ON CONFLICT(user_id) DO UPDATE SET config_json = excluded.config_json, updated_at = excluded.updated_at",
            &[config_json.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to update knowledge_config: {e}"))?;

    tracing::info!(
        count = entries.len(),
        version = %content_version,
        "Knowledge sync complete"
    );

    Ok(entries.len())
}

/// Upsert a single entry into `knowledge_entries`.
async fn upsert_entry(adapter: &dyn SqlAdapter, entry: &KnowledgeEntry) -> Result<(), String> {
    let entry_type = entry.entry_type.as_str();
    let tier = entry.tier.as_str();
    let payload_json = serde_json::to_string(&entry.payload)
        .map_err(|e| format!("Failed to serialize payload for {}: {e}", entry.id))?;
    let tags_csv = entry.tags.join(",");
    let content_hash = loader::content_hash(entry);
    let tool = entry.tool.as_deref().unwrap_or("");

    adapter
        .execute(
            "INSERT INTO knowledge_entries (id, type, tool, category, tier, payload_json, tags_csv, added, content_hash) \
             VALUES (?, ?, NULLIF(?, ''), ?, ?, ?, ?, ?, ?) \
             ON CONFLICT(id) DO UPDATE SET \
               type = excluded.type, \
               tool = excluded.tool, \
               category = excluded.category, \
               tier = excluded.tier, \
               payload_json = excluded.payload_json, \
               tags_csv = excluded.tags_csv, \
               added = excluded.added, \
               content_hash = excluded.content_hash",
            &[
                entry.id.as_str(),
                entry_type,
                tool,
                entry.category.as_str(),
                tier,
                payload_json.as_str(),
                tags_csv.as_str(),
                entry.added.as_str(),
                content_hash.as_str(),
            ],
        )
        .await
        .map_err(|e| format!("Failed to upsert knowledge entry {id}: {e}", id = entry.id))?;

    Ok(())
}
