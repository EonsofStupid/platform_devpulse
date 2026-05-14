//! SurrealQL schema for the project-local intelligence store.
//!
//! Connector-agnostic at this layer: any backend that speaks
//! SurrealQL applies the same DDL to its `projects/<slug>`
//! namespace. The schema defines:
//!
//! * `memories` — HNSW-indexed embedding column for cosine
//!   similarity recall. Embedding dimension is locked at
//!   [`EMBEDDING_DIM`] (matches the active text embedder).
//! * `rro_archive` — sidecar bytes column, one row per memory,
//!   holds the rkyv-archived `RroRecord` blob. Linked back to
//!   `memories` via a record reference so a recall step can fetch
//!   the archive without a second key lookup.

/// Embedding dimension for the HNSW index on the `memories` table.
///
/// Matches `CandleEmbedder`'s `all-MiniLM-L6-v2` default. If a
/// different embedder is wired in, bump this constant AND re-init
/// every per-project namespace — the HNSW index dimension is fixed
/// at table-definition time.
pub const EMBEDDING_DIM: usize = 384;

/// SurrealQL schema applied per-project under `projects/<slug>`.
pub const MEMORY_SCHEMA: &str = r"
DEFINE TABLE IF NOT EXISTS memories SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS text       ON memories TYPE string;
DEFINE FIELD IF NOT EXISTS embedding  ON memories TYPE array<float>;
DEFINE FIELD IF NOT EXISTS kind       ON memories TYPE string;
DEFINE FIELD IF NOT EXISTS priority   ON memories TYPE int;
DEFINE FIELD IF NOT EXISTS created_at ON memories TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON memories TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS memories_kind ON memories FIELDS kind;
DEFINE INDEX IF NOT EXISTS memories_hnsw ON memories FIELDS embedding HNSW DIMENSION 384 DIST COSINE;

DEFINE TABLE IF NOT EXISTS rro_archive SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS memory_id ON rro_archive TYPE record<memories>;
DEFINE FIELD IF NOT EXISTS bytes     ON rro_archive TYPE bytes;
DEFINE INDEX IF NOT EXISTS rro_archive_memory ON rro_archive FIELDS memory_id UNIQUE;
";
