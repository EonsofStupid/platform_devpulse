//! Knowledge library internal types.
//!
//! Engine-owned (Tier-1, non-AI): the generalized entry / type discriminant /
//! payload shapes for the JSON-backed knowledge library. Converted to
//! presentation DTOs at the desktop command boundary.

use serde::{Deserialize, Serialize};

/// Entry type discriminant — matches JSON `type` field.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum EntryType {
    /// Did-you-know: quick facts shown during idle/loading.
    Dyk,
    /// Knowledge drop: deeper educational content.
    Kdrop,
    /// Frustration: preemptive help for known pain points.
    Frust,
    /// Insight: patterns, tradeoffs, architectural observations.
    Insight,
    /// Glossary: term definitions searchable by the user.
    Gloss,
    /// Multiple-choice quiz — user picks one of N choices,
    /// optional per-choice explanation surfaces after selection.
    Quiz,
    /// Preference ranking — user reorders N items from
    /// most-to-least preferred. No "correct" answer; useful for
    /// onboarding personalization and capturing user priorities.
    Rank,
    /// Sequence ordering — user reorders N steps into the right
    /// implementation / debugging / workflow sequence. Optional
    /// correct order exists for didactic surfaces.
    Order,
}

impl EntryType {
    /// String tag for libSQL storage.
    #[must_use]
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Dyk => "dyk",
            Self::Kdrop => "kdrop",
            Self::Frust => "frust",
            Self::Insight => "insight",
            Self::Gloss => "gloss",
            Self::Quiz => "quiz",
            Self::Rank => "rank",
            Self::Order => "order",
        }
    }
}

/// Expertise tier — controls which entries a user sees.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Tier {
    /// New users — safe, encouraging content.
    Beginner,
    /// Comfortable users — deeper workflow tips.
    Intermediate,
    /// Power users — advanced techniques and edge cases.
    Advanced,
}

impl Tier {
    /// Return the lowercase string representation used in SQL and serde.
    #[must_use]
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Beginner => "beginner",
            Self::Intermediate => "intermediate",
            Self::Advanced => "advanced",
        }
    }

    /// Tiers visible to a user at this level (inclusive of lower tiers).
    #[must_use]
    pub fn allowed_tiers(&self) -> &'static [&'static str] {
        match self {
            Self::Beginner => &["beginner"],
            Self::Intermediate => &["beginner", "intermediate"],
            Self::Advanced => &["beginner", "intermediate", "advanced"],
        }
    }

    /// All tier strings — convenience for "show everything" queries.
    #[must_use]
    pub fn all_strings() -> Vec<String> {
        vec![
            Self::Beginner.as_str().to_string(),
            Self::Intermediate.as_str().to_string(),
            Self::Advanced.as_str().to_string(),
        ]
    }
}

/// A single knowledge entry as stored in JSON and libSQL.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeEntry {
    /// Unique ID (e.g., "dyk-001").
    pub id: String,
    /// Entry type discriminant.
    #[serde(rename = "type")]
    pub entry_type: EntryType,
    /// Tool context (e.g., "model-loader", "chat"). Null = universal.
    pub tool: Option<String>,
    /// Category for grouping (e.g., "models", "inference", "rag").
    pub category: String,
    /// Expertise tier.
    pub tier: Tier,
    /// Type-specific payload (title, body, term, definition, etc.).
    pub payload: serde_json::Value,
    /// Searchable tags.
    pub tags: Vec<String>,
    /// ISO date when this entry was authored.
    pub added: String,
}

/// Manifest file — tracks version and per-file checksums for sync.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeManifest {
    /// Semantic version of the knowledge content.
    pub version: String,
    /// Per-file SHA256 checksums.
    pub files: Vec<ManifestFile>,
}

/// A file entry in the manifest.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestFile {
    /// Filename relative to `data/` (e.g., `did_you_know.json`).
    pub name: String,
    /// SHA256 hex digest of the file contents.
    pub hash: String,
    /// Number of entries in the file.
    pub count: usize,
}

/// Selection parameters for the runtime query.
#[derive(Debug, Clone)]
pub struct SelectionParams {
    /// Entry type to fetch.
    pub entry_type: EntryType,
    /// User ID for seen-tracking.
    pub user_id: String,
    /// Tiers the user is allowed to see.
    pub allowed_tiers: Vec<String>,
    /// Current tool context for affinity weighting.
    pub current_tool: Option<String>,
    /// Cooldown in seconds — entries shown within this window are skipped.
    pub cooldown_secs: i64,
}

/// User reaction to a knowledge entry.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Reaction {
    /// User found the entry useful.
    Helpful,
    /// User dismissed the entry — excluded from future selection.
    NotHelpful,
}
