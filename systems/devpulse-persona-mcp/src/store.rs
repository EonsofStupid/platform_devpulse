//! `PersonaStore` — facade that wraps the kernel persistence adapters.
//!
//! Per the user-confirmed Slice 1 structural decision (2026-05-20):
//! the facade lives **inside** the persona MCP crate, not in
//! `kernel/devpulse-clyffy`. The kernel exposes lower-level adapters
//! (`LibSqlAdapter`, `RroAdapter`, etc.); the facade composes them.
//!
//! # Surfaces
//!
//! - **Persona blocks** (Letta-style core memory) — `persona_blocks`
//!   table in LibSQL. `load`, `save`, `list` operate here.
//! - **Vector recall** — `RroAdapter` (embedded Qdrant) when the `rro`
//!   feature is built. `recall` operates here. Without the feature,
//!   `recall` returns a typed `Backend` error per
//!   `feedback_no_stubs.md`.
//! - **Graph (bi-temporal facts)** — lands in Slice 5. `recall.mode`
//!   values `"bfs"` and `"rrf"` return `InvalidArg` until then.
//!
//! # Concurrency
//!
//! `LibSqlAdapter` is internally `Arc<dyn Conn>` per its module docs;
//! the connection is cheap to share. The store holds an `Arc<Self>` so
//! verb handlers can clone it across tasks without lock contention.

use crate::error::{PersonaError, PersonaResult};
use crate::idempotency::IdempotencyCache;
use crate::schema::{DEFAULT_BLOCK_CHAR_LIMIT, PERSONA_SCHEMA};
use chrono::{DateTime, Utc};
use devpulse_clyffy::cortex::persistence::LibSqlAdapter;
#[cfg(feature = "rro")]
use devpulse_clyffy::cortex::persistence::RroAdapter;
use libsql::Connection;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
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
    /// UUIDv7 string identifier.
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

/// `persona.recall` retrieval mode.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RecallMode {
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
            "cos" => Ok(Self::Cos),
            "bm25" => Ok(Self::Bm25),
            "bfs" => Ok(Self::Bfs),
            "rrf" => Ok(Self::Rrf),
            other => Err(PersonaError::InvalidArg(format!(
                "mode must be one of cos|bm25|bfs|rrf, got {other:?}"
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
    libsql: LibSqlAdapter,
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
    /// Returns [`PersonaError::Backend`] if LibSQL open or schema
    /// initialisation fails.
    pub async fn open(
        db_path: &Path,
        #[cfg(feature = "rro")] rro: Option<Arc<RroAdapter>>,
    ) -> PersonaResult<Arc<Self>> {
        let libsql = LibSqlAdapter::open_with_schema(db_path, PERSONA_SCHEMA)
            .await
            .map_err(PersonaError::Backend)?;

        let idempotency = IdempotencyCache::new(libsql.connection().clone());

        // Opportunistic sweep at boot — keeps the table from growing
        // unbounded across long-running sessions without spawning a
        // timer task.
        if let Err(e) = idempotency.sweep_expired().await {
            tracing::warn!(error = %e, "idempotency sweep at open failed (non-fatal)");
        }

        Ok(Arc::new(Self {
            libsql,
            idempotency,
            #[cfg(feature = "rro")]
            rro,
        }))
    }

    /// Borrow the underlying LibSQL connection. Used by verb handlers.
    pub fn conn(&self) -> &Connection {
        self.libsql.connection()
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
    /// or [`PersonaError::Backend`] on LibSQL failure.
    pub async fn load_blocks(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
    ) -> PersonaResult<Vec<PersonaBlock>> {
        validate_scope_slug(scope, slug)?;

        // libsql params take owned String; can't bind a typed enum.
        let scope_str = scope.as_str().to_string();
        let mut rows = match slug {
            Some(s) => self
                .conn()
                .query(
                    "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug = ?2 \
                     ORDER BY label",
                    libsql::params![scope_str, s.to_string()],
                )
                .await
                .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?,
            None => self
                .conn()
                .query(
                    "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug IS NULL \
                     ORDER BY label",
                    libsql::params![scope_str],
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
        validate_scope_slug(scope, slug)?;
        if label.is_empty() {
            return Err(PersonaError::InvalidArg(
                "block label must be non-empty".to_string(),
            ));
        }
        if body.len() > DEFAULT_BLOCK_CHAR_LIMIT {
            return Err(PersonaError::InvalidArg(format!(
                "block body length {} exceeds default char_limit {}",
                body.len(),
                DEFAULT_BLOCK_CHAR_LIMIT
            )));
        }

        let now = Utc::now();
        let now_str = now.to_rfc3339();
        let scope_str = scope.as_str().to_string();
        let slug_owned = slug.map(ToString::to_string);
        let label_owned = label.to_string();
        let body_owned = body.to_string();

        // Try existing-row update first; if zero rows, insert.
        let updated = match slug.as_ref() {
            Some(s) => self
                .conn()
                .execute(
                    "UPDATE persona_blocks \
                     SET body = ?1, updated_at = ?2, version = version + 1 \
                     WHERE scope = ?3 AND slug = ?4 AND label = ?5",
                    libsql::params![
                        body_owned.clone(),
                        now_str.clone(),
                        scope_str.clone(),
                        (*s).to_string(),
                        label_owned.clone(),
                    ],
                )
                .await
                .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?,
            None => self
                .conn()
                .execute(
                    "UPDATE persona_blocks \
                     SET body = ?1, updated_at = ?2, version = version + 1 \
                     WHERE scope = ?3 AND slug IS NULL AND label = ?4",
                    libsql::params![
                        body_owned.clone(),
                        now_str.clone(),
                        scope_str.clone(),
                        label_owned.clone(),
                    ],
                )
                .await
                .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?,
        };

        if updated == 0 {
            let id = Uuid::now_v7().to_string();
            let char_limit_i64 = i64::try_from(DEFAULT_BLOCK_CHAR_LIMIT).unwrap_or(5000);
            self.conn()
                .execute(
                    "INSERT INTO persona_blocks \
                     (id, scope, slug, label, body, char_limit, \
                      created_at, updated_at, version) \
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1)",
                    libsql::params![
                        id,
                        scope_str.clone(),
                        slug_owned.clone(),
                        label_owned.clone(),
                        body_owned.clone(),
                        char_limit_i64,
                        now_str.clone(),
                        now_str.clone(),
                    ],
                )
                .await
                .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;
        }

        // Read back the canonical row so the caller sees the bumped
        // version + canonical created_at.
        self.get_block(scope, slug, label)
            .await
            .map_err(|e| match e {
                PersonaError::NotFound(_) => {
                    PersonaError::Backend(anyhow::anyhow!("save_block: row missing after upsert"))
                }
                other => other,
            })
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
        let scope_str = scope.as_str().to_string();
        let label_owned = label.to_string();
        let mut rows = match slug {
            Some(s) => self
                .conn()
                .query(
                    "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug = ?2 AND label = ?3 \
                     LIMIT 1",
                    libsql::params![scope_str, s.to_string(), label_owned],
                )
                .await
                .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?,
            None => self
                .conn()
                .query(
                    "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug IS NULL AND label = ?2 \
                     LIMIT 1",
                    libsql::params![scope_str, label_owned],
                )
                .await
                .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?,
        };

        let Some(row) = rows
            .next()
            .await
            .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?
        else {
            return Err(PersonaError::NotFound(format!(
                "no block for scope={} slug={:?} label={label}",
                scope.as_str(),
                slug,
            )));
        };
        row_to_block(&row)
    }

    /// List blocks under `(scope, slug)` with optional `label` filter
    /// and `since` RFC3339 cutoff. Bounded by `limit` (clamped to
    /// `[1, 1000]`).
    ///
    /// # Errors
    /// Returns [`PersonaError::InvalidArg`] on validation failure or
    /// [`PersonaError::Backend`] on storage failure.
    #[expect(
        clippy::too_many_lines,
        reason = "branching SQL builder across 4 optional filters (scope, slug, label_filter, since); extracting helpers would obscure the WHERE-clause flow and the param-binding order which is positional in libsql"
    )]
    pub async fn list_blocks(
        &self,
        scope: PersonaScope,
        slug: Option<&str>,
        label_filter: Option<&str>,
        since: Option<DateTime<Utc>>,
        limit: usize,
    ) -> PersonaResult<Vec<PersonaBlock>> {
        validate_scope_slug(scope, slug)?;
        let clamped = limit.clamp(1, 1000);
        let limit_i64 = i64::try_from(clamped).unwrap_or(1000);

        let scope_str = scope.as_str().to_string();
        let since_rfc = since.map(|t| t.to_rfc3339()).unwrap_or_default();

        // Compose a single query string per branch; libsql parameter
        // binding is positional and doesn't support OR-IS-NULL elegantly,
        // so we keep four branches readable rather than dynamic.
        let mut rows = match (slug, label_filter, since.is_some()) {
            (Some(s), Some(lab), true) => {
                self.conn()
                    .query(
                        "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug = ?2 AND label = ?3 \
                       AND updated_at >= ?4 \
                     ORDER BY updated_at DESC LIMIT ?5",
                        libsql::params![
                            scope_str,
                            s.to_string(),
                            lab.to_string(),
                            since_rfc,
                            limit_i64
                        ],
                    )
                    .await
            }
            (Some(s), Some(lab), false) => {
                self.conn()
                    .query(
                        "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug = ?2 AND label = ?3 \
                     ORDER BY updated_at DESC LIMIT ?4",
                        libsql::params![scope_str, s.to_string(), lab.to_string(), limit_i64],
                    )
                    .await
            }
            (Some(s), None, true) => {
                self.conn()
                    .query(
                        "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug = ?2 AND updated_at >= ?3 \
                     ORDER BY updated_at DESC LIMIT ?4",
                        libsql::params![scope_str, s.to_string(), since_rfc, limit_i64],
                    )
                    .await
            }
            (Some(s), None, false) => {
                self.conn()
                    .query(
                        "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug = ?2 \
                     ORDER BY updated_at DESC LIMIT ?3",
                        libsql::params![scope_str, s.to_string(), limit_i64],
                    )
                    .await
            }
            (None, Some(lab), true) => {
                self.conn()
                    .query(
                        "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug IS NULL AND label = ?2 \
                       AND updated_at >= ?3 \
                     ORDER BY updated_at DESC LIMIT ?4",
                        libsql::params![scope_str, lab.to_string(), since_rfc, limit_i64],
                    )
                    .await
            }
            (None, Some(lab), false) => {
                self.conn()
                    .query(
                        "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug IS NULL AND label = ?2 \
                     ORDER BY updated_at DESC LIMIT ?3",
                        libsql::params![scope_str, lab.to_string(), limit_i64],
                    )
                    .await
            }
            (None, None, true) => {
                self.conn()
                    .query(
                        "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug IS NULL AND updated_at >= ?2 \
                     ORDER BY updated_at DESC LIMIT ?3",
                        libsql::params![scope_str, since_rfc, limit_i64],
                    )
                    .await
            }
            (None, None, false) => {
                self.conn()
                    .query(
                        "SELECT id, scope, slug, label, body, char_limit, \
                            created_at, updated_at, version \
                     FROM persona_blocks \
                     WHERE scope = ?1 AND slug IS NULL \
                     ORDER BY updated_at DESC LIMIT ?2",
                        libsql::params![scope_str, limit_i64],
                    )
                    .await
            }
        }
        .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;

        let mut out = Vec::new();
        while let Some(row) = rows
            .next()
            .await
            .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?
        {
            out.push(row_to_block(&row)?);
        }
        Ok(out)
    }
}

fn validate_scope_slug(scope: PersonaScope, slug: Option<&str>) -> PersonaResult<()> {
    match (scope, slug) {
        (PersonaScope::Project, None) => Err(PersonaError::InvalidArg(
            "scope=project requires a slug".to_string(),
        )),
        (PersonaScope::Project, Some("")) => Err(PersonaError::InvalidArg(
            "project slug must be non-empty".to_string(),
        )),
        (PersonaScope::User, Some(_)) => Err(PersonaError::InvalidArg(
            "scope=user does not accept a slug".to_string(),
        )),
        _ => Ok(()),
    }
}

fn row_to_block(row: &libsql::Row) -> PersonaResult<PersonaBlock> {
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
