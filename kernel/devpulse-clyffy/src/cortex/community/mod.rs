//! Community feed cache — local mirror of remote community content.
//!
//! Two responsibilities:
//!
//! 1. **Types** ([`FeedItem`], [`FeedKind`]) that describe content
//!    returned by the remote endpoint. The HTTP fetch itself lives in
//!    the desktop tier (`commands/community/`); the kernel exposes
//!    only the shape so engine + UI agree on what crosses the wire.
//! 2. **Cache CRUD** ([`upsert_feed_item`], [`query_feed`],
//!    [`most_recent_sync_at`]) backed by the `community_feed` table
//!    in `USER_SCHEMA`. Makes the Latest tab + Community page work
//!    offline by serving whatever was synced on the last online run.
//!
//! The kernel deliberately does NOT own the network code or the sync
//! schedule — those are operator-facing concerns that belong in the
//! desktop tier where reqwest lives. Re-exports through the engine
//! present these types under layman names at the IP boundary.

pub mod cache;
pub mod types;

pub use cache::{
    is_community_enabled, most_recent_sync_at, query_feed, set_community_enabled, upsert_feed_item,
};
pub use types::{FeedItem, FeedKind, DEFAULT_FEED_LIMIT, DEFAULT_FEED_TTL_SECS};
