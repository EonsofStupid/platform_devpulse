//! Boot-time sync — upserts embedded JSON artifacts into libSQL.
//!
//! Flow:
//! 1. Read embedded manifest version
//! 2. Query libSQL for stored version
//! 3. Versions match → skip (fast path)
//! 4. Mismatch → INSERT OR REPLACE all entries
//! 5. `knowledge_seen` preserved across content updates

use super::loader;
use super::types::KnowledgeEntry;
use crate::cortex::persistence::SqlAdapter;

/// Sync embedded knowledge entries into libSQL.
///
/// Called during boot after user relational is ready.
/// Returns the number of entries upserted (0 if versions matched).
///
/// # Errors
/// Returns an error if the embedded manifest cannot be parsed, the version
/// lookup fails, any entry upsert fails, or the stored version cannot be
/// updated in `knowledge_config`.
pub async fn sync_to_libsql(adapter: &dyn SqlAdapter) -> Result<usize, String> {
    // 1. Load embedded manifest for version check
    let manifest =
        loader::load_manifest().map_err(|e| format!("Knowledge manifest parse failed: {e}"))?;
    let content_version = manifest.version.as_str();

    // 2. Check stored version in libSQL
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

    // 3. Fast path — versions match
    if stored_version == content_version {
        tracing::info!(version = %content_version, "Knowledge content up to date — skipping sync");
        return Ok(0);
    }

    tracing::info!(
        stored = %stored_version,
        new = %content_version,
        "Knowledge content version mismatch — syncing"
    );

    // 4. Load all entries from embedded data
    let entries = loader::load_all()?;
    let count = entries.len();

    // 5. Upsert all entries
    for entry in &entries {
        upsert_entry(adapter, entry).await?;
    }

    // 6. Update stored version
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

    tracing::info!(count = count, version = %content_version, "Knowledge sync complete");

    Ok(count)
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
