//! Community feed types — items returned from the remote endpoint and stored
//! in the local `community_feed` cache.
//!
//! Content-only shapes. The HTTP fetch lives in the desktop tier
//! (`commands/community/`); the engine owns the cache shape + CRUD so the
//! store and the UI agree on what a feed item is. This is a **Tier-1 DevPulse**
//! concern — non-AI, local-first — which is why it lives in the engine, not
//! Clyffy's AI layer.

use serde::{Deserialize, Serialize};
use specta::Type;

/// Discriminant for the kind of community item.
///
/// Extensible by appending — the `kind` column stores a string slug and
/// unknown values fall back to [`FeedKind::Activity`], so a row written by a
/// newer build never breaks an older reader.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum FeedKind {
    /// Operator announcement (release notes, roadmap, outage).
    Announcement,
    /// User-authored knowledge entry promoted to the catalog.
    KnowledgeContribution,
    /// Friend/group lifecycle: someone joined a group, started a session,
    /// posted a tip, etc.
    Activity,
}

impl FeedKind {
    /// Stable slug for the `kind` column.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Announcement => "announcement",
            Self::KnowledgeContribution => "knowledge_contribution",
            Self::Activity => "activity",
        }
    }

    /// Parse the slug back. Unknown slugs default to [`FeedKind::Activity`].
    #[must_use]
    pub fn parse_or_activity(s: &str) -> Self {
        match s {
            "announcement" => Self::Announcement,
            "knowledge_contribution" => Self::KnowledgeContribution,
            _ => Self::Activity,
        }
    }
}

/// A single community feed item, both as fetched from the remote endpoint and
/// as stored in the local `community_feed` cache.
///
/// `payload_json` is the JSON-encoded kind-specific payload, kept as `String`
/// (not `serde_json::Value`) so the type is trivially `specta::Type`-able; the
/// UI parses on receive.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FeedItem {
    /// Stable, globally-unique id (UUID or `kind:hash`).
    pub id: String,
    /// What sort of item this is.
    pub kind: FeedKind,
    /// Short display title.
    pub title: Option<String>,
    /// Long-form body / preview.
    pub body: Option<String>,
    /// Author or source identifier.
    pub actor: Option<String>,
    /// Original publication timestamp from the source (epoch seconds).
    pub created_at: i64,
    /// When this row was last synchronised locally (epoch seconds).
    pub synced_at: i64,
    /// Canonical URL on the community site, when one exists.
    pub url: Option<String>,
    /// Kind-specific structured payload as a JSON-encoded string.
    pub payload_json: String,
}

/// Default cache TTL — when the cache is older than this, the desktop sync
/// command refreshes in the background. One hour keeps the badge fresh without
/// flooding the endpoint.
pub const DEFAULT_FEED_TTL_SECS: i64 = 3_600;

/// Default soft cap on items returned from a single `query_feed` call.
pub const DEFAULT_FEED_LIMIT: usize = 50;
