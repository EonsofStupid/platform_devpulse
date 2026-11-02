//! Boot-time + remote sync — upserts knowledge entries into Turso.
//!
//! Two callers:
//! 1. [`sync_to_database`]   — embedded artifacts on every boot
//! 2. [`sync_remote_entries`] — entries fetched from a remote manifest
//!    by the desktop tier (HTTP lives there, kernel stays network-free)
//!
//! Both flow through [`sync_entries`], which compares each entry's content
//! hash with the stored one and upserts exactly the entries that are new or
//! changed. Content is the source of truth, not the manifest version: an
//! edited entry reaches the database even if nobody bumped the version
//! (a version-only check once left renamed text stale in users' databases).
//!
//! `knowledge_seen` is intentionally never touched during sync — user
//! cooldowns survive content updates.

use super::loader;
use super::types::KnowledgeEntry;
use crate::cortex::persistence::SqlAdapter;

/// Sync embedded knowledge entries into Turso.
///
/// Called during boot after user relational is ready. Delegates to
/// [`sync_entries`] after loading the embedded manifest + data.
///
/// # Errors
/// Returns an error if the embedded manifest cannot be parsed, the
/// data files cannot be loaded, or the underlying upsert/version
/// write fails.
pub async fn sync_to_database(adapter: &dyn SqlAdapter) -> Result<usize, String> {
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

/// Shared upsert pipeline: upserts the entries whose content hash differs
/// from the stored one (or that are not stored yet) and records the
/// version. Returns how many entries were written.
///
/// # Errors
/// Returns the underlying SQL error stringified on the first failing
/// upsert or version write.
async fn sync_entries(
    adapter: &dyn SqlAdapter,
    entries: &[KnowledgeEntry],
    content_version: &str,
) -> Result<usize, String> {
    let stored: std::collections::HashMap<String, String> = adapter
        .query("SELECT id, content_hash FROM knowledge_entries", &[])
        .await
        .map_err(|e| format!("Failed to read stored knowledge hashes: {e}"))?
        .into_iter()
        .filter_map(|row| {
            let id = row.first()?.as_text()?.to_owned();
            let hash = row.get(1)?.as_text()?.to_owned();
            Some((id, hash))
        })
        .collect();

    let changed: Vec<&KnowledgeEntry> = entries
        .iter()
        .filter(|e| stored.get(&e.id) != Some(&loader::content_hash(e)))
        .collect();

    if changed.is_empty() {
        tracing::info!(version = %content_version, "Knowledge content up to date — every entry matches");
    }

    tracing::info!(
        version = %content_version,
        changed = changed.len(),
        total = entries.len(),
        "Knowledge content changed — upserting changed entries"
    );

    for entry in &changed {
        upsert_entry(adapter, entry).await?;
    }

    // Keep the manifest checkpoint even if only its version changed. An
    // identical checkpoint must remain a no-op in the database.
    let config_json = serde_json::json!({ "version": content_version }).to_string();
    adapter
        .execute(
            "INSERT INTO knowledge_config (user_id, config_json, updated_at) \
             VALUES ('system', ?, unixepoch()) \
             ON CONFLICT(user_id) DO UPDATE SET config_json = excluded.config_json, updated_at = excluded.updated_at \
             WHERE knowledge_config.config_json != excluded.config_json",
            &[config_json.into()],
        )
        .await
        .map_err(|e| format!("Failed to update knowledge_config: {e}"))?;

    tracing::info!(
        count = changed.len(),
        version = %content_version,
        "Knowledge sync complete"
    );

    Ok(changed.len())
}

/// Upsert a single entry into `knowledge_entries`.
async fn upsert_entry(adapter: &dyn SqlAdapter, entry: &KnowledgeEntry) -> Result<(), String> {
    let payload_json = serde_json::to_string(&entry.payload)
        .map_err(|e| format!("Failed to serialize payload for {}: {e}", entry.id))?;
    let tags_csv = entry.tags.join(",");
    let content_hash = loader::content_hash(entry);
    let tool = entry.tool.as_deref().filter(|t| !t.is_empty());

    adapter
        .execute(
            "INSERT INTO knowledge_entries (id, type, tool, category, tier, payload_json, tags_csv, added, content_hash) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) \
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
                entry.id.as_str().into(),
                entry.entry_type.as_str().into(),
                tool.into(),
                entry.category.as_str().into(),
                entry.tier.as_str().into(),
                payload_json.into(),
                tags_csv.into(),
                entry.added.as_str().into(),
                content_hash.into(),
            ],
        )
        .await
        .map_err(|e| format!("Failed to upsert knowledge entry {id}: {e}", id = entry.id))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use crate::cortex::knowledge::types::{EntryType, Tier};
    use crate::cortex::persistence::{SqlValue, TursoAdapter, TursoOptions};

    const SCHEMA: &str = "
        CREATE TABLE IF NOT EXISTS knowledge_entries (
            id TEXT PRIMARY KEY, type TEXT NOT NULL, tool TEXT, category TEXT NOT NULL,
            tier TEXT NOT NULL, payload_json TEXT NOT NULL, tags_csv TEXT, added TEXT,
            content_hash TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS knowledge_config (
            user_id TEXT PRIMARY KEY, config_json TEXT NOT NULL, updated_at INTEGER
        );
    ";

    fn entry(id: &str, body: &str) -> KnowledgeEntry {
        KnowledgeEntry {
            id: id.into(),
            entry_type: EntryType::Insight,
            tool: None,
            category: "stores".into(),
            tier: Tier::Beginner,
            payload: serde_json::json!({ "title": "Stores", "body": body }),
            tags: vec![],
            added: "2026-10-13".into(),
        }
    }

    async fn body_of(db: &TursoAdapter, id: &str) -> String {
        let rows = db
            .query(
                "SELECT payload_json FROM knowledge_entries WHERE id = ?",
                &[id.into()],
            )
            .await
            .unwrap();
        match &rows[0][0] {
            SqlValue::Text(t) => serde_json::from_str::<serde_json::Value>(t).unwrap()["body"]
                .as_str()
                .unwrap()
                .to_owned(),
            other => panic!("{other:?}"),
        }
    }

    #[tokio::test]
    async fn changed_text_reaches_the_database_without_a_version_bump() {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_nanos());
        let dir = std::env::temp_dir().join(format!("devpulse-knowledge-sync-{nanos}"));
        let db = TursoAdapter::open_with_schema(&dir.join("k.db"), SCHEMA, TursoOptions::default())
            .await
            .unwrap();

        let v1 = [
            entry("a", "LibSQL stores rows."),
            entry("b", "DuckDB stores analytics."),
        ];
        assert_eq!(sync_entries(&db, &v1, "0.2.0").await.unwrap(), 2);
        assert_eq!(
            sync_entries(&db, &v1, "0.2.0").await.unwrap(),
            0,
            "nothing changed"
        );

        let v2 = [
            entry("a", "Turso stores rows."),
            entry("b", "DuckDB stores analytics."),
        ];
        assert_eq!(
            sync_entries(&db, &v2, "0.2.0").await.unwrap(),
            1,
            "same version, changed text"
        );
        assert_eq!(body_of(&db, "a").await, "Turso stores rows.");

        assert_eq!(sync_entries(&db, &v2, "0.2.1").await.unwrap(), 0);
        let config = db
            .query(
                "SELECT config_json FROM knowledge_config WHERE user_id = 'system'",
                &[],
            )
            .await
            .unwrap();
        let checkpoint: serde_json::Value =
            serde_json::from_str(config[0][0].as_text().unwrap()).unwrap();
        assert_eq!(checkpoint["version"], "0.2.1");

        db.close().await;
        drop(db);
        let _ = std::fs::remove_dir_all(dir);
    }
}
