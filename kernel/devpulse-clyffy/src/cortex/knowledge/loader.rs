//! Knowledge artifact loader — embedded at compile time via `include_str!`.
//!
//! JSON data ships inside the binary. No filesystem reads needed at runtime.
//! The manifest is also embedded for version tracking during sync.

use super::types::{KnowledgeEntry, KnowledgeManifest};

// ── Embedded JSON artifacts ─────────────────────────────────────

const MANIFEST_JSON: &str = include_str!("data/_manifest.json");
const DID_YOU_KNOW_JSON: &str = include_str!("data/did_you_know.json");
const KNOWLEDGE_DROPS_JSON: &str = include_str!("data/knowledge_drops.json");
const FRUSTRATIONS_JSON: &str = include_str!("data/frustrations.json");
const INSIGHTS_JSON: &str = include_str!("data/insights.json");
const GLOSSARY_JSON: &str = include_str!("data/glossary.json");

/// All embedded artifact sources in order.
const EMBEDDED_ARTIFACTS: &[(&str, &str)] = &[
    ("did_you_know.json", DID_YOU_KNOW_JSON),
    ("knowledge_drops.json", KNOWLEDGE_DROPS_JSON),
    ("frustrations.json", FRUSTRATIONS_JSON),
    ("insights.json", INSIGHTS_JSON),
    ("glossary.json", GLOSSARY_JSON),
];

// ── Public API ──────────────────────────────────────────────────

/// Load the embedded manifest.
pub fn load_manifest() -> Result<KnowledgeManifest, String> {
    serde_json::from_str(MANIFEST_JSON)
        .map_err(|e| format!("Failed to parse embedded _manifest.json: {e}"))
}

/// Parse entries from a single embedded JSON string.
fn parse_entries(name: &str, json: &str) -> Result<Vec<KnowledgeEntry>, String> {
    let entries: Vec<KnowledgeEntry> = serde_json::from_str(json)
        .map_err(|e| format!("Failed to parse embedded {name}: {e}"))?;

    tracing::info!(file = %name, count = entries.len(), "Knowledge entries parsed");
    Ok(entries)
}

/// Load ALL knowledge entries from the embedded artifacts.
pub fn load_all() -> Result<Vec<KnowledgeEntry>, String> {
    let mut all_entries = Vec::new();

    for &(name, json) in EMBEDDED_ARTIFACTS {
        match parse_entries(name, json) {
            Ok(entries) => all_entries.extend(entries),
            Err(e) => {
                tracing::warn!(file = %name, error = %e, "Failed to parse knowledge file — skipping");
            }
        }
    }

    let manifest = load_manifest().ok();
    tracing::info!(
        total = all_entries.len(),
        files = EMBEDDED_ARTIFACTS.len(),
        manifest_version = manifest.as_ref().map(|m| m.version.as_str()).unwrap_or("none"),
        "Knowledge library loaded from embedded data"
    );

    Ok(all_entries)
}

/// Compute a content hash for an entry (for change detection during sync).
#[must_use]
pub fn content_hash(entry: &KnowledgeEntry) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    entry.id.hash(&mut hasher);
    entry.category.hash(&mut hasher);
    entry.payload.to_string().hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}
