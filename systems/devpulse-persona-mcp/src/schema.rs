//! LibSQL schema for persona blocks + idempotency.
//!
//! Two tables, both scoped to this crate's database file. The schema is
//! applied at `PersonaStore::open` via
//! `LibSqlAdapter::open_with_schema(path, PERSONA_SCHEMA)`.
//!
//! # Block model (Letta-style core memory)
//!
//! Per `CLYFFY-COGNITIVE-FOUNDATION.md` §1, persona blocks are the
//! Letta-style RAM tier: character-limited, prepended to the
//! orchestrator's prefix every turn. The standard labels are `persona`
//! and `human`; project scopes add `pinned_facts`, `goals`, etc.
//!
//! # Idempotency
//!
//! Per SSOT §2, every write verb accepts an `idempotency_key`. The hot
//! path is the moka in-memory LRU (`crate::idempotency`); this table is
//! the 24h durable backstop, queried on cache miss.

/// DDL applied at `PersonaStore::open`.
///
/// All statements are `CREATE ... IF NOT EXISTS` so the schema is
/// idempotent on every boot. No migrations in v1 — pre-release reauthor
/// rule applies.
pub const PERSONA_SCHEMA: &str = r#"
CREATE TABLE IF NOT EXISTS persona_blocks (
    id            TEXT PRIMARY KEY,
    scope         TEXT NOT NULL CHECK(scope IN ('user','project')),
    slug          TEXT,
    label         TEXT NOT NULL,
    body          TEXT NOT NULL,
    char_limit    INTEGER NOT NULL DEFAULT 5000,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL,
    version       INTEGER NOT NULL DEFAULT 1,
    UNIQUE(scope, slug, label)
);

CREATE INDEX IF NOT EXISTS persona_blocks_scope_slug
    ON persona_blocks(scope, slug);

CREATE INDEX IF NOT EXISTS persona_blocks_updated_at
    ON persona_blocks(updated_at);

CREATE TABLE IF NOT EXISTS persona_idempotency (
    key           TEXT PRIMARY KEY,
    response_json TEXT NOT NULL,
    inserted_at   TEXT NOT NULL,
    expires_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS persona_idempotency_expires
    ON persona_idempotency(expires_at);
"#;

/// Default char limit for new blocks (Letta default).
pub const DEFAULT_BLOCK_CHAR_LIMIT: usize = 5000;

/// Idempotency TTL — SSOT §2 lock.
pub const IDEMPOTENCY_TTL_SECS: u64 = 24 * 60 * 60;
