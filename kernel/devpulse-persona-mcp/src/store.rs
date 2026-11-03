//! `PersonaStore` — facade that wraps the kernel persistence adapters.
//!
//! Per the user-confirmed Slice 1 structural decision (2026-05-20):
//! the facade lives **inside** the persona MCP crate, not in
//! `kernel/devpulse-clyffy`. The kernel exposes lower-level adapters
//! (`TursoAdapter`, `RroAdapter`, etc.); the facade composes them.
//!
//! # Surfaces
//!
//! - **Persona blocks** (Letta-style core memory) — `persona_blocks`
//!   table in Turso. `load`, `save`, `list` operate here.
//! - **Text recall** searches labels and bodies without claiming vector scores.
//! - **Vector and graph recall** require configured retrieval backends. The
//!   optional RRO adapter handle is retained for that integration; the standalone
//!   service does not silently substitute lexical matching for those methods.
//!
//! # Concurrency
//!
//! The store shares the database adapter and opens one connection per operation.
//! Each query retains its connection until its rows have been consumed.

use crate::context::SessionNotes;
use crate::error::{PersonaError, PersonaResult};
use crate::idempotency::IdempotencyCache;
use crate::schema::{DEFAULT_BLOCK_CHAR_LIMIT, PERSONA_SCHEMA, SESSION_NOTES_CHAR_LIMIT};
use chrono::{DateTime, Utc};
#[cfg(feature = "rro")]
use devpulse_clyffy::cortex::persistence::RroAdapter;
use devpulse_clyffy::cortex::persistence::{TursoAdapter, TursoOptions};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use turso::Connection;
use uuid::Uuid;

/// Persona scope discriminator. Persisted as a TEXT column with
/// CHECK constraint per `schema.rs`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PersonaScope {
    /// User-global block (no slug). Follows the user across all projects.
    User,
    /// Project-scoped block (requires slug = the project identifier).
    Project,
}

impl PersonaScope {
    /// Wire / DB column representation.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::User => "user",
            Self::Project => "project",
        }
    }

    /// Parse from the wire string. Errors on anything else.
    ///
    /// # Errors
    /// Returns [`PersonaError::InvalidArg`] for unrecognised values.
    pub fn parse(s: &str) -> PersonaResult<Self> {
        match s {
            "user" => Ok(Self::User),
            "project" => Ok(Self::Project),
            other => Err(PersonaError::InvalidArg(format!(
                "scope must be 'user' or 'project', got {other:?}"
            ))),
        }
    }
}

/// One row of `persona_blocks`. Serialised verbatim into verb responses.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonaBlock {
    /// `UUIDv7` string identifier.
    pub id: String,
    /// Scope discriminator.
    pub scope: PersonaScope,
    /// Project slug, or `None` for user-scope blocks.
    pub slug: Option<String>,
    /// Logical block label (e.g. `"persona"`, `"human"`,
    /// `"pinned_facts"`).
    pub label: String,
    /// Block body — prepended to the orchestrator prefix every turn.
    pub body: String,
    /// Maximum chars allowed in `body`. Enforced on `save`.
    pub char_limit: usize,
    /// RFC3339 timestamp.
    pub created_at: String,
    /// RFC3339 timestamp.
    pub updated_at: String,
    /// Monotonically incrementing version. Bumped on every successful
    /// `save`.
    pub version: i64,
}

/// What a save of yours expects to find, so it cannot replace text you never
/// saw (plan 0001 B6.3).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Expected {
    /// A new note: nothing has this name yet.
    Nothing,
    /// The note at the version you were looking at.
    Version(i64),
}

/// A save made on your own screens: checked, and it decides the approval.
#[derive(Debug, Clone, Copy)]
struct YourSave {
    expected: Expected,
    include: bool,
}

/// `persona.recall` retrieval mode.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RecallMode {
    /// Case-insensitive text search over labels and memory block bodies.
    Text,
    /// Cosine similarity over dense vectors. Requires `rro` feature.
    Cos,
    /// Sparse BM25. Requires `rro` feature.
    Bm25,
    /// Graph BFS — lands in Slice 5 with the bi-temporal fact pipeline.
    Bfs,
    /// Reciprocal Rank Fusion of cos + bm25 + bfs — lands in Slice 5.
    Rrf,
}

impl RecallMode {
    /// Parse from the wire string.
    ///
    /// # Errors
    /// Returns [`PersonaError::InvalidArg`] for unrecognised values.
    pub fn parse(s: &str) -> PersonaResult<Self> {
        match s {
            "text" => Ok(Self::Text),
            "cos" => Ok(Self::Cos),
            "bm25" => Ok(Self::Bm25),
            "bfs" => Ok(Self::Bfs),
            "rrf" => Ok(Self::Rrf),
            other => Err(PersonaError::InvalidArg(format!(
                "mode must be one of text|cos|bm25|bfs|rrf, got {other:?}"
            ))),
        }
    }
}

/// One hit returned from `persona.recall`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecallHit {
    /// Originating block or RRO record id.
    pub record_id: String,
    /// Inline body — the persona MCP returns the text directly to avoid
    /// a follow-up read.
    pub text: String,
    /// Block label (`persona`, `human`, …) or RRO kind label.
    pub kind: String,
    /// Similarity score in `[0.0, 1.0]` for cos; BM25 raw score
    /// otherwise.
    pub score: f32,
    /// RFC3339 timestamp at which this content was *valid*. Slice 5
    /// extends with bi-temporal closure.
    pub t_valid: Option<String>,
    /// RFC3339 timestamp at which this content was *invalidated*
    /// (Slice 5).
    pub t_invalid: Option<String>,
}

/// Composed adapters + idempotency cache. `Arc<PersonaStore>` is the
/// owned reference handed to verb dispatch.
pub struct PersonaStore {
    database: Arc<TursoAdapter>,
    idempotency: IdempotencyCache,
    #[cfg(feature = "rro")]
    rro: Option<Arc<RroAdapter>>,
}

impl PersonaStore {
    /// Open a persona store rooted at `db_path`.
    ///
    /// Creates the parent directory if missing, applies
    /// `PERSONA_SCHEMA`, and constructs the idempotency cache.
    ///
    /// The `rro` adapter is wired by the binary (`main.rs`) when the
    /// crate is built with `--features rro`; pass `None` for v1 local
    /// stdio operation.
    ///
    /// # Errors
    /// Returns [`PersonaError::Backend`] if Turso open or schema
    /// initialisation fails.
    pub async fn open(
        db_path: &Path,
        #[cfg(feature = "rro")] rro: Option<Arc<RroAdapter>>,
    ) -> PersonaResult<Arc<Self>> {
        let database =
            TursoAdapter::open_with_schema(db_path, PERSONA_SCHEMA, TursoOptions::default())
                .await
                .map_err(PersonaError::Backend)?;

        Ok(Self::assemble(
            Arc::new(database),
            #[cfg(feature = "rro")]
            rro,
        )
        .await)
    }

    /// A persona store inside a database someone else owns: `DevPulse`'s user
    /// database, which allows one process at a time (plan 0001 B6.2). Applies
    /// `PERSONA_SCHEMA`, which is idempotent, and shares the owner's adapter.
    ///
    /// # Errors
    /// Returns [`PersonaError::Backend`] if the schema cannot be applied.
    pub async fn over(
        database: Arc<TursoAdapter>,
        #[cfg(feature = "rro")] rro: Option<Arc<RroAdapter>>,
    ) -> PersonaResult<Arc<Self>> {
        database
            .connect()
            .map_err(PersonaError::Backend)?
            .execute_batch(PERSONA_SCHEMA)
            .await
            .map_err(|e| PersonaError::Backend(e.into()))?;
        Ok(Self::assemble(
            database,
            #[cfg(feature = "rro")]
            rro,
        )
        .await)
    }

    async fn assemble(
        database: Arc<TursoAdapter>,
        #[cfg(feature = "rro")] rro: Option<Arc<RroAdapter>>,
    ) -> Arc<Self> {
        let idempotency = IdempotencyCache::new(Arc::clone(&database));

        // Opportunistic sweep at boot — keeps the table from growing
        // unbounded across long-running sessions without spawning a
        // timer task.
        if let Err(e) = idempotency.sweep_expired().await {
            tracing::warn!(error = %e, "idempotency sweep at open failed (non-fatal)");
        }

        Arc::new(Self {
            database,
            idempotency,
            #[cfg(feature = "rro")]
            rro,
        })
    }

    /// Open a connection for one operation; retain it until rows are consumed.
    ///
    /// # Errors
    /// Returns a backend error if the connection cannot be opened.
    pub fn conn(&self) -> PersonaResult<Connection> {
        self.database.connect().map_err(PersonaError::Backend)
    }

    /// Idempotency facade.
    #[must_use]
    pub fn idempotency(&self) -> &IdempotencyCache {
        &self.idempotency
    }

    /// Whether vector recall is wired (feature `rro` built AND adapter
    /// non-None).
    #[must_use]
    pub fn recall_available(&self) -> bool {
        #[cfg(feature = "rro")]
        {
            self.rro.is_some()
        }
        #[cfg(not(feature = "rro"))]
        {
            false
        }
    }

    /// Borrow the RRO adapter if present.
    #[cfg(feature = "rro")]
    #[must_use]
    pub fn rro(&self) -> Option<&RroAdapter> {
        self.rro.as_deref()
    }

    // ─────────────────────────────────────────────────────────────
    // Persona block CRUD.
    //
    // These methods are wired by `verbs::persona::*`. Each returns
    // raw `PersonaResult<T>`; the verb layer is responsible for
    // wrapping responses in JSON-RPC frames.
    // ─────────────────────────────────────────────────────────────

    /// Load all blocks under `(scope, slug)`. `slug` is REQUIRED when
    /// `scope == Project` and forbidden when `scope == User`.
    ///
    /// # Errors
    /// Returns [`PersonaError::InvalidArg`] for slug/scope mismatch,
    /// or [`PersonaError::Backend`] on Turso failure.
    pub async fn load_blocks(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
    ) -> PersonaResult<Vec<PersonaBlock>> {
        let connection = self.conn()?;
        validate_scope_slug(scope, slug)?;

        // database params take owned String; can't bind a typed enum.
        let scope_str = scope.as_str().to_string();
        let mut rows = match slug {
            Some(s) => connection
                .query(
                    "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug = ?2 \
                     ORDER BY label",
                    turso::params![scope_str, s.to_string()],
                )
                .await
                .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?,
            None => connection
                .query(
                    "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug IS NULL \
                     ORDER BY label",
                    turso::params![scope_str],
                )
                .await
                .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?,
        };

        let mut blocks = Vec::new();
        while let Some(row) = rows
            .next()
            .await
            .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?
        {
            blocks.push(row_to_block(&row)?);
        }
        Ok(blocks)
    }

    /// Upsert a block. Body length is enforced against the per-block
    /// `char_limit` (defaulting to [`DEFAULT_BLOCK_CHAR_LIMIT`] on
    /// insert).
    ///
    /// Returns the saved block (with bumped `version`).
    ///
    /// # Errors
    /// Returns [`PersonaError::InvalidArg`] for slug/scope mismatch or
    /// over-limit body; [`PersonaError::Backend`] on storage failure.
    pub async fn save_block(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
        label: &str,
        body: &str,
    ) -> PersonaResult<PersonaBlock> {
        self.save_atomic(scope, slug, label, body, None, None).await
    }

    /// Your own save: it refuses when the note is not as you `expected`, which
    /// changes nothing, and `include` decides whether this exact text goes with
    /// every session. This is for your own screens; no MCP tool offers it.
    ///
    /// # Errors
    /// Returns [`PersonaError::Conflict`] when the note moved on, or the errors
    /// of [`Self::save_block`].
    pub async fn save_yours(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
        label: &str,
        body: &str,
        expected: Expected,
        include: bool,
    ) -> PersonaResult<PersonaBlock> {
        let yours = YourSave { expected, include };
        self.save_atomic(scope, slug, label, body, None, Some(yours))
            .await
    }

    /// Save the block and its retry result in the same transaction.
    ///
    /// # Errors
    /// Returns validation or storage errors without committing either record.
    pub async fn save_idempotent(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
        label: &str,
        body: &str,
        key: &str,
    ) -> PersonaResult<PersonaBlock> {
        if key.trim().is_empty() {
            return Err(PersonaError::InvalidArg(
                "idempotency_key is required".into(),
            ));
        }
        self.save_atomic(scope, slug, label, body, Some(key), None)
            .await
    }

    async fn save_atomic(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
        label: &str,
        body: &str,
        key: Option<&str>,
        yours: Option<YourSave>,
    ) -> PersonaResult<PersonaBlock> {
        validate_scope_slug(scope, slug)?;
        if label.trim().is_empty() {
            return Err(PersonaError::InvalidArg(
                "block label must be non-empty".into(),
            ));
        }
        let mut connection = self.conn()?;
        let transaction = connection
            .transaction_with_behavior(turso::transaction::TransactionBehavior::Immediate)
            .await
            .map_err(|e| PersonaError::Backend(e.into()))?;
        let outcome = async {
            let now = Utc::now();
            let now_string = now.to_rfc3339();
            if let Some(key) = key {
                let mut rows = transaction.query(
                    "SELECT response_json FROM persona_idempotency WHERE key = ?1 AND expires_at > ?2",
                    turso::params![key, now_string.clone()],
                ).await.map_err(|e| PersonaError::Backend(e.into()))?;
                if let Some(row) = rows.next().await.map_err(|e| PersonaError::Backend(e.into()))? {
                    let cached: String = row.get(0).map_err(|e| PersonaError::Backend(e.into()))?;
                    let cached: PersonaBlock = serde_json::from_str(&cached).map_err(|e| PersonaError::Backend(e.into()))?;
                    // A retry gets its first answer. A different write under
                    // the same key must not vanish while reporting success.
                    if cached.scope == scope
                        && cached.slug.as_deref() == slug
                        && cached.label == label
                        && cached.body == body
                    {
                        return Ok(cached);
                    }
                    return Err(PersonaError::Conflict(
                        "this idempotency_key was already used for a different write, so nothing was saved; use a new key".to_owned(),
                    ));
                }
            }
            let existing = read_block(&transaction, scope, slug, label).await?;
            if let Some(yours) = yours {
                let current = existing.as_ref().map(|block| block.version);
                let expected = match yours.expected {
                    Expected::Nothing => None,
                    Expected::Version(version) => Some(version),
                };
                if current != expected {
                    return Err(PersonaError::Conflict(NOTE_MOVED_ON.to_owned()));
                }
            }
            let limit = existing.as_ref().map_or(DEFAULT_BLOCK_CHAR_LIMIT, |block| block.char_limit);
            let length = body.chars().count();
            if length > limit {
                return Err(PersonaError::InvalidArg(format!(
                    "block body has {length} characters; char_limit is {limit}"
                )));
            }
            let id = existing.as_ref().map_or_else(|| Uuid::now_v7().to_string(), |block| block.id.clone());
            let limit = i64::try_from(limit).map_err(|e| PersonaError::Backend(e.into()))?;
            transaction.execute(
                "INSERT INTO persona_blocks (id, scope, slug, label, body, char_limit, created_at, updated_at, version) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7, 1) \
                 ON CONFLICT DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at, version = persona_blocks.version + 1",
                turso::params![id, scope.as_str(), slug.map(str::to_owned), label, body, limit, now_string.clone()],
            ).await.map_err(|e| PersonaError::Backend(e.into()))?;
            let block = read_block(&transaction, scope, slug, label).await?
                .ok_or_else(|| PersonaError::Backend(anyhow::anyhow!("saved block disappeared")))?;
            if let Some(yours) = yours {
                set_approval(&transaction, &block, yours.include).await?;
            }
            if let Some(key) = key {
                let response = serde_json::to_string(&block).map_err(|e| PersonaError::Backend(e.into()))?;
                let ttl = i64::try_from(crate::schema::IDEMPOTENCY_TTL_SECS)
                    .map_err(|e| PersonaError::Backend(e.into()))?;
                let expires = (now + chrono::Duration::seconds(ttl)).to_rfc3339();
                transaction.execute(
                    "INSERT OR REPLACE INTO persona_idempotency (key, response_json, inserted_at, expires_at) VALUES (?1, ?2, ?3, ?4)",
                    turso::params![key, response, now_string, expires],
                ).await.map_err(|e| PersonaError::Backend(e.into()))?;
            }
            Ok(block)
        }.await;
        finish(transaction, outcome).await
    }

    /// Read a single block by `(scope, slug, label)`.
    ///
    /// # Errors
    /// Returns [`PersonaError::NotFound`] if no matching row exists,
    /// or [`PersonaError::Backend`] on storage failure.
    pub async fn get_block(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
        label: &str,
    ) -> PersonaResult<PersonaBlock> {
        validate_scope_slug(scope, slug)?;
        let connection = self.conn()?;
        read_block(&connection, scope, slug, label)
            .await?
            .ok_or_else(|| {
                PersonaError::NotFound(format!(
                    "no block for scope={} slug={slug:?} label={label}",
                    scope.as_str()
                ))
            })
    }

    /// Say whether the note at `version` goes with every session. Approving
    /// names the version, so you approve the text you read and not whatever an
    /// agent has saved since. For your own screens; no MCP tool offers it.
    ///
    /// # Errors
    /// Returns [`PersonaError::NotFound`] when there is no such note,
    /// [`PersonaError::Conflict`] when it moved on, or a storage error.
    pub async fn set_included(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
        label: &str,
        version: i64,
        include: bool,
    ) -> PersonaResult<PersonaBlock> {
        validate_scope_slug(scope, slug)?;
        let mut connection = self.conn()?;
        let transaction = connection
            .transaction_with_behavior(turso::transaction::TransactionBehavior::Immediate)
            .await
            .map_err(|e| PersonaError::Backend(e.into()))?;
        let outcome = async {
            let block = read_block(&transaction, scope, slug, label)
                .await?
                .ok_or_else(|| PersonaError::NotFound(format!("no note named {label}")))?;
            if block.version != version {
                return Err(PersonaError::Conflict(NOTE_MOVED_ON.to_owned()));
            }
            set_approval(&transaction, &block, include).await?;
            Ok(block)
        }
        .await;
        finish(transaction, outcome).await
    }

    /// The version of each note you approved under `(scope, slug)`, by name.
    /// One that differs from the note's own version was changed since.
    ///
    /// # Errors
    /// Returns a validation or storage error.
    pub async fn approved_versions(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
    ) -> PersonaResult<HashMap<String, i64>> {
        validate_scope_slug(scope, slug)?;
        let connection = self.conn()?;
        let mut rows = connection
            .query(
                "SELECT b.label, a.version FROM persona_note_approvals a \
                 JOIN persona_blocks b ON b.id = a.block_id \
                 WHERE b.scope = ?1 AND b.slug IS ?2",
                turso::params![scope.as_str(), slug.map(str::to_owned)],
            )
            .await
            .map_err(|e| PersonaError::Backend(e.into()))?;
        let mut versions = HashMap::new();
        while let Some(row) = rows
            .next()
            .await
            .map_err(|e| PersonaError::Backend(e.into()))?
        {
            let label: String = row.get(0).map_err(|e| PersonaError::Backend(e.into()))?;
            let version: i64 = row.get(1).map_err(|e| PersonaError::Backend(e.into()))?;
            versions.insert(label, version);
        }
        Ok(versions)
    }

    /// What a session in `project` gets unasked: your approved notes and the
    /// project's, each still at the version you approved, up to the limit.
    ///
    /// # Errors
    /// Returns a validation or storage error.
    pub async fn session_notes(&self, project: &str) -> PersonaResult<SessionNotes> {
        let mut notes = self.approved_blocks(PersonaScope::User, None).await?;
        notes.extend(
            self.approved_blocks(PersonaScope::Project, Some(project))
                .await?,
        );
        Ok(SessionNotes::fit(notes, SESSION_NOTES_CHAR_LIMIT))
    }

    async fn approved_blocks(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
    ) -> PersonaResult<Vec<PersonaBlock>> {
        validate_scope_slug(scope, slug)?;
        let connection = self.conn()?;
        let mut rows = connection
            .query(
                "SELECT b.id, b.scope, b.slug, b.label, b.body, b.char_limit, \
                        b.created_at, b.updated_at, b.version \
                 FROM persona_blocks b \
                 JOIN persona_note_approvals a ON a.block_id = b.id AND a.version = b.version \
                 WHERE b.scope = ?1 AND b.slug IS ?2 ORDER BY b.label",
                turso::params![scope.as_str(), slug.map(str::to_owned)],
            )
            .await
            .map_err(|e| PersonaError::Backend(e.into()))?;
        let mut blocks = Vec::new();
        while let Some(row) = rows
            .next()
            .await
            .map_err(|e| PersonaError::Backend(e.into()))?
        {
            blocks.push(row_to_block(&row)?);
        }
        Ok(blocks)
    }

    /// Delete one block; returns whether there was one. This is for your own
    /// screens in `DevPulse`: no MCP tool offers it, so an agent can change a
    /// project's memory but cannot erase it.
    ///
    /// # Errors
    /// Returns [`PersonaError::InvalidArg`] on scope/slug mismatch, or
    /// [`PersonaError::Backend`] on storage failure.
    pub async fn delete_block(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
        label: &str,
    ) -> PersonaResult<bool> {
        validate_scope_slug(scope, slug)?;
        let mut connection = self.conn()?;
        let transaction = connection
            .transaction_with_behavior(turso::transaction::TransactionBehavior::Immediate)
            .await
            .map_err(|e| PersonaError::Backend(e.into()))?;
        let outcome = async {
            transaction
                .execute(
                    "DELETE FROM persona_note_approvals WHERE block_id IN \
                     (SELECT id FROM persona_blocks \
                      WHERE scope = ?1 AND coalesce(slug, '') = ?2 AND label = ?3)",
                    turso::params![scope.as_str(), slug.unwrap_or_default(), label],
                )
                .await
                .map_err(|e| PersonaError::Backend(e.into()))?;
            let deleted = transaction
                .execute(
                    "DELETE FROM persona_blocks \
                     WHERE scope = ?1 AND coalesce(slug, '') = ?2 AND label = ?3",
                    turso::params![scope.as_str(), slug.unwrap_or_default(), label],
                )
                .await
                .map_err(|e| PersonaError::Backend(e.into()))?;
            Ok(deleted > 0)
        }
        .await;
        finish(transaction, outcome).await
    }

    /// List blocks under `(scope, slug)` with optional `label` filter
    /// and `since` RFC3339 cutoff. Bounded by `limit` (clamped to
    /// `[1, 1000]`).
    ///
    /// # Errors
    /// Returns [`PersonaError::InvalidArg`] on validation failure or
    /// [`PersonaError::Backend`] on storage failure.
    pub async fn list_blocks(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
        label_filter: Option<&str>,
        since: Option<DateTime<Utc>>,
        limit: usize,
    ) -> PersonaResult<Vec<PersonaBlock>> {
        validate_scope_slug(scope, slug)?;
        let connection = self.conn()?;
        let limit =
            i64::try_from(limit.clamp(1, 1000)).map_err(|e| PersonaError::Backend(e.into()))?;
        let mut rows = connection
            .query(
                "SELECT id, scope, slug, label, body, char_limit, created_at, updated_at, version \
             FROM persona_blocks WHERE scope = ?1 AND slug IS ?2 \
             AND (?3 IS NULL OR label = ?3) AND (?4 IS NULL OR updated_at >= ?4) \
             ORDER BY updated_at DESC, id DESC LIMIT ?5",
                turso::params![
                    scope.as_str(),
                    slug.map(str::to_owned),
                    label_filter.map(str::to_owned),
                    since.map(|value| value.to_rfc3339()),
                    limit
                ],
            )
            .await
            .map_err(|e| PersonaError::Backend(e.into()))?;
        let mut blocks = Vec::new();
        while let Some(row) = rows
            .next()
            .await
            .map_err(|e| PersonaError::Backend(e.into()))?
        {
            blocks.push(row_to_block(&row)?);
        }
        Ok(blocks)
    }
}

/// What a stale save or approval of yours is told. It changed nothing.
const NOTE_MOVED_ON: &str = "this note changed since you opened it, so nothing was saved";

/// Commit on success, roll back on failure, and hand back `outcome`.
async fn finish<T>(
    transaction: turso::transaction::Transaction<'_>,
    outcome: PersonaResult<T>,
) -> PersonaResult<T> {
    match outcome {
        Ok(value) => {
            transaction
                .commit()
                .await
                .map_err(|e| PersonaError::Backend(e.into()))?;
            Ok(value)
        }
        Err(error) => {
            transaction
                .rollback()
                .await
                .map_err(|e| PersonaError::Backend(e.into()))?;
            Err(error)
        }
    }
}

/// Record whether `block`, at its current version, goes with every session.
async fn set_approval(
    connection: &Connection,
    block: &PersonaBlock,
    include: bool,
) -> PersonaResult<()> {
    if include {
        connection
            .execute(
                "INSERT OR REPLACE INTO persona_note_approvals (block_id, version, approved_at) \
                 VALUES (?1, ?2, ?3)",
                turso::params![block.id.as_str(), block.version, Utc::now().to_rfc3339()],
            )
            .await
    } else {
        connection
            .execute(
                "DELETE FROM persona_note_approvals WHERE block_id = ?1",
                turso::params![block.id.as_str()],
            )
            .await
    }
    .map_err(|e| PersonaError::Backend(e.into()))?;
    Ok(())
}

async fn read_block(
    connection: &Connection,
    scope: PersonaScope,
    slug: Option<&str>,
    label: &str,
) -> PersonaResult<Option<PersonaBlock>> {
    let mut rows = connection.query(
        "SELECT id, scope, slug, label, body, char_limit, created_at, updated_at, version FROM persona_blocks WHERE scope = ?1 AND slug IS ?2 AND label = ?3",
        turso::params![scope.as_str(), slug.map(str::to_owned), label],
    ).await.map_err(|e| PersonaError::Backend(e.into()))?;
    rows.next()
        .await
        .map_err(|e| PersonaError::Backend(e.into()))?
        .as_ref()
        .map(row_to_block)
        .transpose()
}

fn validate_scope_slug(scope: PersonaScope, slug: Option<&str>) -> PersonaResult<()> {
    match (scope, slug) {
        (PersonaScope::Project, None) => Err(PersonaError::InvalidArg(
            "scope=project requires a slug".to_string(),
        )),
        (PersonaScope::Project, Some(slug)) if slug.trim().is_empty() => Err(
            PersonaError::InvalidArg("project slug must be non-empty".to_string()),
        ),
        (PersonaScope::User, Some(_)) => Err(PersonaError::InvalidArg(
            "scope=user does not accept a slug".to_string(),
        )),
        _ => Ok(()),
    }
}

fn row_to_block(row: &turso::Row) -> PersonaResult<PersonaBlock> {
    let id: String = row
        .get(0)
        .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;
    let scope_str: String = row
        .get(1)
        .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;
    let slug: Option<String> = row
        .get(2)
        .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;
    let label: String = row
        .get(3)
        .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;
    let body: String = row
        .get(4)
        .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;
    let char_limit_i64: i64 = row
        .get(5)
        .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;
    let created_at: String = row
        .get(6)
        .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;
    let updated_at: String = row
        .get(7)
        .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;
    let version: i64 = row
        .get(8)
        .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;

    Ok(PersonaBlock {
        id,
        scope: PersonaScope::parse(&scope_str)?,
        slug,
        label,
        body,
        char_limit: usize::try_from(char_limit_i64).unwrap_or(DEFAULT_BLOCK_CHAR_LIMIT),
        created_at,
        updated_at,
        version,
    })
}
