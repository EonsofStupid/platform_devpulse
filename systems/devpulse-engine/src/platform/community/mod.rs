//! Community feed — local cache of remote community content (Tier-1, DevPulse).
//!
//! A **non-AI, local-first** DevPulse feature: the desktop tier owns the HTTP
//! fetch (`commands/community/`, where reqwest lives) and the sync schedule;
//! the engine owns the content [`types`] and the offline [`cache`] CRUD backed
//! by the `community_feed` / `community_config` tables in `USER_SCHEMA`. This
//! lives in the engine (DevPulse's core), never the AI-only kernel.

pub mod cache;
pub mod types;

pub use cache::{
    is_community_enabled, most_recent_sync_at, query_feed, set_community_enabled, upsert_feed_item,
};
pub use types::{FeedItem, FeedKind, DEFAULT_FEED_LIMIT, DEFAULT_FEED_TTL_SECS};
