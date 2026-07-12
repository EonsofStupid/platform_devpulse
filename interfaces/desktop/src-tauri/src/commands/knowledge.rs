//! Knowledge library Tauri commands — generalized types only.
//!
//! No Clyffy references. No engine-internal naming. The frontend sees
//! `Entry`, `type: "dyk"`, `payload`, and nothing more.
//!
//! Delegates to the engine's selector via the facade — no duplicated SQL.
//! Remote-sync helper fetches updated entries from a public Supabase
//! Storage bucket so the catalog can be refreshed without a binary
//! rebuild.

use crate::commands::cloud::get_supabase_credentials;
use crate::state::PlatformState;
use anyhow::Context as _;
use devpulse_engine::platform::{
    knowledge_record_reaction, knowledge_select_entry, knowledge_sync_remote_entries,
    KnowledgeEntry, KnowledgeEntryType, KnowledgeManifest, KnowledgeReaction,
    KnowledgeSelectionParams, KnowledgeTier, SqlAdapter,
};

use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// A knowledge entry as the frontend sees it — no internal vocabulary.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeEntryDto {
    /// Stable identifier for the selected knowledge entry.
    pub id: String,
    /// Entry type: "dyk" | "kdrop" | "frust" | "insight" | "gloss"
    pub entry_type: String,
    /// Optional tool context used during selection.
    pub tool: Option<String>,
    /// Human-facing category label for grouping related entries.
    pub category: String,
    /// "beginner" | "intermediate" | "advanced"
    pub tier: String,
    /// Type-specific JSON payload string (title, body, term, definition, etc.)
    /// Frontend parses this into the appropriate typed payload.
    pub payload_json: String,
    /// Ordered tag list used for filtering and display.
    pub tags: Vec<String>,
    /// ISO-8601 timestamp recording when the entry was authored.
    pub added: String,
}

/// Get a knowledge entry matching the given type and optional tool context.
///
/// Delegates to the engine's selector — affinity-weighted, cooldown-gated.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_knowledge_entry(
    entry_type: String,
    tool: Option<String>,
    state: State<'_, PlatformState>,
) -> Result<Option<KnowledgeEntryDto>, String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("User relational service not available")?;
    let adapter: &dyn SqlAdapter = svc.adapter().as_ref();

    // Parse entry type from frontend string
    let parsed_type: KnowledgeEntryType =
        serde_json::from_value(serde_json::Value::String(entry_type.clone()))
            .map_err(|_| format!("Unknown knowledge entry type: {entry_type}"))?;

    // Default user for single-user mode, show all tiers
    let params = KnowledgeSelectionParams {
        entry_type: parsed_type,
        user_id: "default".to_string(),
        allowed_tiers: KnowledgeTier::all_strings(),
        current_tool: tool,
        cooldown_secs: 3600, // 1 hour
    };

    let selected = knowledge_select_entry(adapter, &params)
        .await
        .map_err(|e| format!("Knowledge selection failed: {e}"))?;

    let Some(entry) = selected else {
        return Ok(None);
    };

    let tags: Vec<String> = entry
        .tags_csv
        .split(',')
        .filter(|s| !s.is_empty())
        .map(String::from)
        .collect();

    Ok(Some(KnowledgeEntryDto {
        id: entry.id,
        entry_type: entry.entry_type,
        tool: entry.tool,
        category: entry.category,
        tier: entry.tier,
        payload_json: entry.payload_json,
        tags,
        added: entry.added,
    }))
}

/// Record a user reaction to a knowledge entry.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn record_knowledge_reaction(
    entry_id: String,
    reaction: String,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("User relational service not available")?;
    let adapter: &dyn SqlAdapter = svc.adapter().as_ref();

    let parsed_reaction: KnowledgeReaction =
        serde_json::from_value(serde_json::Value::String(reaction.clone()))
            .map_err(|_| format!("Unknown reaction: {reaction}"))?;

    knowledge_record_reaction(adapter, &entry_id, "default", parsed_reaction)
        .await
        .map_err(|e| format!("Failed to record reaction: {e}"))
}

// ── Remote knowledge sync ───────────────────────────────────────────

/// Outcome of [`sync_knowledge_from_remote`].
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case", tag = "kind")]
pub enum KnowledgeSyncResult {
    /// Sync ran and `upserted` rows landed in the local cache. `0` when
    /// the remote version matched what was already stored.
    Synced {
        /// Number of entries upserted in this run.
        upserted: usize,
        /// Manifest version that was applied.
        version: String,
    },
    /// Sync skipped — supabase URL missing, public bucket layout
    /// not configured, or operator declined.
    Skipped {
        /// Human-readable reason.
        reason: String,
    },
    /// Sync attempted and failed.
    Failed {
        /// Stringified error.
        error: String,
    },
}

/// Pull the latest knowledge catalog from the configured Supabase
/// Storage bucket and upsert into libSQL.
///
/// URL convention (public bucket, anon-keyed read):
///
/// - `{supabase_url}/storage/v1/object/public/knowledge/manifest.json`
/// - `{supabase_url}/storage/v1/object/public/knowledge/{filename}`
///
/// When the manifest version matches what's already stored, the engine
/// fast-paths to zero work (returns `Synced { upserted: 0, .. }`).
///
/// # Errors
/// Returns string error only when the platform handle is unavailable.
/// All other failures degrade to a `KnowledgeSyncResult` variant.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn sync_knowledge_from_remote(
    state: State<'_, PlatformState>,
) -> Result<KnowledgeSyncResult, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("User relational service not available")?;
    let adapter: &dyn SqlAdapter = svc.adapter().as_ref();

    let creds = match get_supabase_credentials().await {
        Ok(c) => c,
        Err(e) => {
            return Ok(KnowledgeSyncResult::Skipped {
                reason: format!("supabase credentials unavailable: {e}"),
            });
        }
    };

    let manifest_url = format!(
        "{}/storage/v1/object/public/knowledge/manifest.json",
        creds.url.trim_end_matches('/')
    );

    let (manifest, entries) = match fetch_remote_catalog(&creds.url, &manifest_url).await {
        Ok(v) => v,
        Err(e) => {
            return Ok(KnowledgeSyncResult::Failed {
                error: format!("{e:#}"),
            });
        }
    };

    let upserted = match knowledge_sync_remote_entries(adapter, &entries, &manifest.version).await {
        Ok(n) => n,
        Err(e) => {
            return Ok(KnowledgeSyncResult::Failed {
                error: format!("kernel upsert failed: {e}"),
            });
        }
    };

    tracing::info!(
        version = %manifest.version,
        upserted,
        "Remote knowledge sync complete"
    );

    Ok(KnowledgeSyncResult::Synced {
        upserted,
        version: manifest.version,
    })
}

async fn fetch_remote_catalog(
    base_url: &str,
    manifest_url: &str,
) -> anyhow::Result<(KnowledgeManifest, Vec<KnowledgeEntry>)> {
    let client = reqwest::Client::new();

    let manifest_resp = client
        .get(manifest_url)
        .header("accept", "application/json")
        .send()
        .await
        .context("GET knowledge/manifest.json")?;
    if !manifest_resp.status().is_success() {
        anyhow::bail!(
            "knowledge manifest fetch returned {}",
            manifest_resp.status()
        );
    }
    let manifest: KnowledgeManifest = manifest_resp
        .json()
        .await
        .context("decode knowledge manifest")?;

    let mut entries: Vec<KnowledgeEntry> = Vec::new();
    for file in &manifest.files {
        let file_url = format!(
            "{}/storage/v1/object/public/knowledge/{}",
            base_url.trim_end_matches('/'),
            file.name
        );
        let file_resp = client
            .get(&file_url)
            .header("accept", "application/json")
            .send()
            .await
            .with_context(|| format!("GET knowledge/{}", file.name))?;
        if !file_resp.status().is_success() {
            anyhow::bail!(
                "knowledge file {} fetch returned {}",
                file.name,
                file_resp.status()
            );
        }
        let mut parsed: Vec<KnowledgeEntry> = file_resp
            .json()
            .await
            .with_context(|| format!("decode knowledge/{}", file.name))?;
        entries.append(&mut parsed);
    }

    Ok((manifest, entries))
}
