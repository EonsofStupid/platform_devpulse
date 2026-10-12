//! Community feed types — items returned from the remote endpoint and
//! stored in the local `community_feed` cache.
//!
//! Lives inside the kernel because the cache shape is content-only; the
//! actual HTTP fetch happens in the desktop tier. Engine re-exports
//! these types under layman names at the IP boundary.

use serde::{Deserialize, Serialize};

/// Discriminant for the kind of community item.
///
/// Three kinds today; extensible by appending to this enum without
/// breaking persisted rows (the kernel matches on a string slug stored
/// in the `kind` column, falling back to [`FeedKind::Activity`] for
/// unknown values).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "snake_case")]
pub enum FeedKind {
    /// Operator announcement (release notes, roadmap, outage).
    Announcement,
    /// User-authored knowledge entry promoted to the catalog.
    KnowledgeContribution,
    /// Friend/group lifecycle: someone joined a group, started a
    /// session, posted a tip, etc.
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

    /// Parse the slug back. Unknown slugs default to
    /// [`FeedKind::Activity`] so a row inserted by a newer build never
    /// breaks an older reader.
    #[must_use]
    pub fn parse_or_activity(s: &str) -> Self {
        match s {
            "announcement" => Self::Announcement,
            "knowledge_contribution" => Self::KnowledgeContribution,
            _ => Self::Activity,
        }
    }
}

/// A single community feed item, both as fetched from the remote
/// endpoint and as stored in Turso.
///
/// `payload_json` is the JSON-encoded form of the kind-specific payload
/// shape. Kept as `String` (not `serde_json::Value`) so the type is
/// trivially `specta::Type`-able across the IP boundary; the UI layer
/// parses on receive. Mirrors the existing knowledge-entry pattern.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
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

/// Default cache TTL — when the cache is older than this, the desktop
/// sync command will refresh in the background. Chosen as one hour to
/// keep the badge fresh without flooding the endpoint.
pub const DEFAULT_FEED_TTL_SECS: i64 = 3_600;

/// Default soft cap on items returned from a single `query_feed` call.
/// Surfaces requesting more pass an explicit `limit`.
pub const DEFAULT_FEED_LIMIT: usize = 50;
