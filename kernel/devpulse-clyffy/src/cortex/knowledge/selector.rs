//! Runtime knowledge selection — affinity-weighted, cooldown-gated.
//!
//! Clyffy decides what to show based on:
//! - Entry type requested
//! - User tier (beginner/intermediate/advanced)
//! - Tool affinity (current tool context gets 3x weight)
//! - Cooldown (recently shown entries are skipped)
//! - Reaction filter (entries marked `not_helpful` are excluded)

use super::types::{Reaction, SelectionParams};
use crate::cortex::persistence::SqlAdapter;

/// Selected entry from the runtime query.
#[derive(Debug, Clone)]
pub struct SelectedEntry {
    /// Unique entry identifier (e.g. `dyk-001`).
    pub id: String,
    /// Discriminant: `dyk`, `kdrop`, `frust`, `insight`, `gloss`.
    pub entry_type: String,
    /// Optional tool context for affinity weighting.
    pub tool: Option<String>,
    /// Thematic category (e.g. `shortcuts`, `git`, `debugging`).
    pub category: String,
    /// Expertise tier: `beginner`, `intermediate`, `advanced`.
    pub tier: String,
    /// Type-specific JSON payload (title/body, term/definition, etc.).
    pub payload_json: String,
    /// Comma-separated tag list.
    pub tags_csv: String,
    /// ISO-8601 date the entry was authored.
    pub added: String,
}

/// Select a knowledge entry matching the given parameters.
///
/// Uses the affinity-weighted random selection query from the spec.
/// Returns `None` if no eligible entries exist.
///
/// # Errors
/// Returns an error if the selection query fails or if persisting the
/// `knowledge_seen` tracking row fails.
pub async fn select_entry(
    adapter: &dyn SqlAdapter,
    params: &SelectionParams,
) -> Result<Option<SelectedEntry>, String> {
    let entry_type = params.entry_type.as_str();
    let cooldown_cutoff = (std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0))
        - params.cooldown_secs;
    let cutoff_str = cooldown_cutoff.to_string();
    let current_tool = params.current_tool.as_deref().unwrap_or("");

    // Build tier IN clause — SQLite doesn't support array params,
    // so we use a comma-separated string with INSTR trick.
    let tiers_csv = params.allowed_tiers.join(",");

    let rows = adapter
        .query(
            "SELECT \
                k.id, k.type, k.tool, k.category, k.tier, \
                k.payload_json, k.tags_csv, k.added \
             FROM knowledge_entries k \
             LEFT JOIN knowledge_seen s \
                ON k.id = s.entry_id AND s.user_id = ? \
             WHERE \
                k.type = ? \
                AND INSTR(?, k.tier) > 0 \
                AND (s.last_shown_at IS NULL OR s.last_shown_at < ?) \
                AND (s.reaction IS NULL OR s.reaction != 'not_helpful') \
             ORDER BY RANDOM() * CASE \
                WHEN k.tool = ? THEN 3.0 \
                WHEN k.tool IS NULL THEN 1.0 \
                ELSE 0.3 \
             END DESC \
             LIMIT 1",
            &[
                params.user_id.as_str(),
                entry_type,
                tiers_csv.as_str(),
                cutoff_str.as_str(),
                current_tool,
            ],
        )
        .await
        .map_err(|e| format!("Knowledge selection query failed: {e}"))?;

    let Some(row) = rows.first() else {
        return Ok(None);
    };

    let entry = SelectedEntry {
        id: row.get(0).and_then(|v| v.as_text()).unwrap_or("").to_string(),
        entry_type: row.get(1).and_then(|v| v.as_text()).unwrap_or("").to_string(),
        tool: row.get(2).and_then(|v| v.as_text()).map(String::from),
        category: row.get(3).and_then(|v| v.as_text()).unwrap_or("").to_string(),
        tier: row.get(4).and_then(|v| v.as_text()).unwrap_or("").to_string(),
        payload_json: row.get(5).and_then(|v| v.as_text()).unwrap_or("{}").to_string(),
        tags_csv: row.get(6).and_then(|v| v.as_text()).unwrap_or("").to_string(),
        added: row.get(7).and_then(|v| v.as_text()).unwrap_or("").to_string(),
    };

    // Record that we showed this entry
    record_shown(adapter, &entry.id, &params.user_id).await?;

    Ok(Some(entry))
}

/// Record that an entry was shown to a user (upsert into `knowledge_seen`).
///
/// # Errors
/// Returns an error if the `knowledge_seen` upsert fails.
async fn record_shown(
    adapter: &dyn SqlAdapter,
    entry_id: &str,
    user_id: &str,
) -> Result<(), String> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    let now_str = now.to_string();

    adapter
        .execute(
            "INSERT INTO knowledge_seen (entry_id, user_id, first_shown_at, last_shown_at, shown_count) \
             VALUES (?, ?, ?, ?, 1) \
             ON CONFLICT(entry_id, user_id) DO UPDATE SET \
               last_shown_at = excluded.last_shown_at, \
               shown_count = shown_count + 1",
            &[entry_id, user_id, now_str.as_str(), now_str.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to record knowledge_seen: {e}"))?;

    Ok(())
}

/// Record a user reaction (`helpful` or `not_helpful`).
///
/// # Errors
/// Returns an error if the `knowledge_seen` reaction update fails.
pub async fn record_reaction(
    adapter: &dyn SqlAdapter,
    entry_id: &str,
    user_id: &str,
    reaction: Reaction,
) -> Result<(), String> {
    let reaction_str = match reaction {
        Reaction::Helpful => "helpful",
        Reaction::NotHelpful => "not_helpful",
    };

    adapter
        .execute(
            "UPDATE knowledge_seen SET reaction = ? WHERE entry_id = ? AND user_id = ?",
            &[reaction_str, entry_id, user_id],
        )
        .await
        .map_err(|e| format!("Failed to record reaction: {e}"))?;

    Ok(())
}
