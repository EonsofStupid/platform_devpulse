//! Knowledge library Tauri commands — generalized types only.
//!
//! No Clyffy references. No kernel-internal naming. The frontend sees
//! `Entry`, `type: "dyk"`, `payload`, and nothing more.
//!
//! Delegates to kernel selector via engine facade — no duplicated SQL.

use crate::state::PlatformState;
use devpulse_engine::platform::{
    knowledge_record_reaction, knowledge_select_entry, KnowledgeEntryType, KnowledgeReaction,
    KnowledgeSelectionParams, KnowledgeTier, SqlAdapter,
};

use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// A knowledge entry as the frontend sees it — no kernel vocabulary.
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
/// Delegates to kernel selector — affinity-weighted, cooldown-gated.
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
