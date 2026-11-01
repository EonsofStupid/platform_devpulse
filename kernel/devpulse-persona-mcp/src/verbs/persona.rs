//! `persona.*` verb handlers.
//!
//! Each function maps one MCP tool call to a [`PersonaStore`] method
//! and shapes the response per the SSOT verb signatures.
//!
//! # Deviation from SSOT §2
//!
//! The SSOT verb signature for `persona.save` lists `block_id` as the
//! addressing parameter. The implementation uses `label` instead: the
//! natural unique key on `persona_blocks` is `(scope, slug, label)`,
//! matching Letta's `memory_insert(label, content)` /
//! `memory_replace(label, …)` API. UUID `id` is server-assigned and
//! returned to the caller; clients address blocks by label, not by id.
//! This is the only Slice 1 deviation from the SSOT verb signatures
//! and is documented in the v1 release notes.

use crate::error::{PersonaError, PersonaResult};
use crate::store::{PersonaBlock, PersonaScope, PersonaStore, RecallHit, RecallMode};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

// ─────────────────────────────────────────────────────────────
// persona.load
// ─────────────────────────────────────────────────────────────

/// Args for `persona.load`.
#[derive(Debug, Clone, Deserialize)]
pub struct PersonaLoadArgs {
    /// `"user"` or `"project"`.
    pub scope: String,
    /// Required when `scope == "project"`.
    #[serde(default)]
    pub slug: Option<String>,
}

/// Response for `persona.load`.
#[derive(Debug, Clone, Serialize)]
pub struct PersonaLoadResult {
    /// All blocks under the requested `(scope, slug)`.
    pub blocks: Vec<PersonaBlock>,
}

/// Dispatch `persona.load`.
///
/// # Errors
/// Returns [`PersonaError::InvalidArg`] on scope/slug validation
/// failure or [`PersonaError::Backend`] on storage failure.
pub async fn load(
    store: &Arc<PersonaStore>,
    args: PersonaLoadArgs,
) -> PersonaResult<PersonaLoadResult> {
    let scope = PersonaScope::parse(&args.scope)?;
    let blocks = store.load_blocks(scope, args.slug.as_deref()).await?;
    Ok(PersonaLoadResult { blocks })
}

// ─────────────────────────────────────────────────────────────
// persona.save
// ─────────────────────────────────────────────────────────────

/// Args for `persona.save`.
#[derive(Debug, Clone, Deserialize)]
pub struct PersonaSaveArgs {
    /// `"user"` or `"project"`.
    pub scope: String,
    /// Required when `scope == "project"`.
    #[serde(default)]
    pub slug: Option<String>,
    /// Block label — natural key (see module-level deviation note).
    pub label: String,
    /// Block body. Length checked against the per-block `char_limit`.
    pub body: String,
    /// SSOT §2 idempotency key. `UUIDv7` recommended.
    pub idempotency_key: String,
}

/// Response for `persona.save`. `Deserialize` is REQUIRED — the
/// idempotency cache stores the JSON-serialised response and
/// `save()` round-trips it through `serde_json::from_str` on
/// cache hit.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonaSaveResult {
    /// Server-assigned `UUIDv7` of the saved block.
    pub id: String,
    /// Monotonic version. Bumped on every update.
    pub version: i64,
    /// Present when the caller's write lost a concurrent race. v1 sets
    /// this only when the upsert produced no row update and no insert
    /// (impossible at the moment, kept for future LWW semantics in
    /// Slice 7).
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub conflict: Option<String>,
}

/// Dispatch `persona.save`. Implements idempotency check first; on
/// cache hit returns the cached response verbatim.
///
/// # Errors
/// Returns [`PersonaError::InvalidArg`] on validation failure,
/// [`PersonaError::Backend`] on storage failure.
pub async fn save(
    store: &Arc<PersonaStore>,
    args: PersonaSaveArgs,
) -> PersonaResult<PersonaSaveResult> {
    if args.idempotency_key.is_empty() {
        return Err(PersonaError::InvalidArg(
            "idempotency_key is required for write verbs (per SSOT §2)".to_string(),
        ));
    }

    let scope = PersonaScope::parse(&args.scope)?;
    let block = store
        .save_idempotent(
            scope,
            args.slug.as_deref(),
            &args.label,
            &args.body,
            &args.idempotency_key,
        )
        .await?;
    let result = PersonaSaveResult {
        id: block.id,
        version: block.version,
        conflict: None,
    };

    Ok(result)
}

// ─────────────────────────────────────────────────────────────
// persona.recall
// ─────────────────────────────────────────────────────────────

/// Args for `persona.recall`.
#[derive(Debug, Clone, Deserialize)]
pub struct PersonaRecallArgs {
    /// `"user"` or `"project"`.
    pub scope: String,
    /// Required when `scope == "project"`.
    #[serde(default)]
    pub slug: Option<String>,
    /// Query text. v1 does case-insensitive LIKE match over `(label, body)`.
    pub query: String,
    /// Maximum results. Clamped to `[1, 100]`.
    #[serde(default = "default_top_k")]
    pub top_k: usize,
    /// Filter by kind (block label). When `None`, all kinds match.
    #[serde(default)]
    pub kinds: Option<Vec<String>>,
    /// Retrieval mode. `text` searches stored labels and bodies. Other modes
    /// report unavailable backends; text matches are never called vectors.
    #[serde(default = "default_mode")]
    pub mode: String,
}

fn default_top_k() -> usize {
    10
}

fn default_mode() -> String {
    "text".to_string()
}

/// Response for `persona.recall`.
#[derive(Debug, Clone, Serialize)]
pub struct PersonaRecallResult {
    /// Hits ordered by descending score.
    pub hits: Vec<RecallHit>,
}

/// Dispatch `persona.recall`.
///
/// Text retrieval preserves the original case-insensitive label/body search.
/// Scores are lexical weights, not cosine similarity or BM25. Requests for
/// other retrieval methods require their configured backend.
///
/// # Errors
/// Returns [`PersonaError::InvalidArg`] for unsupported modes,
/// [`PersonaError::Backend`] on storage failure.
pub async fn recall(
    store: &Arc<PersonaStore>,
    args: PersonaRecallArgs,
) -> PersonaResult<PersonaRecallResult> {
    let mode = RecallMode::parse(&args.mode)?;
    match mode {
        RecallMode::Bfs | RecallMode::Rrf => {
            return Err(PersonaError::InvalidArg(format!(
                "recall mode={mode:?} requires a graph retrieval backend; use text for lexical search"
            )));
        }
        RecallMode::Cos | RecallMode::Bm25 => {
            return Err(PersonaError::Backend(anyhow::anyhow!(
                "recall mode={mode:?} requires a configured retrieval backend; use text for lexical search"
            )));
        }
        RecallMode::Text => {}
    }

    if args.query.is_empty() {
        return Err(PersonaError::InvalidArg(
            "query must be non-empty".to_string(),
        ));
    }

    let scope = PersonaScope::parse(&args.scope)?;
    let top_k = args.top_k.clamp(1, 100);

    // Pull all blocks for the scope; v1 in-memory LIKE filter so the
    // implementation is correct without depending on libsql's LIKE
    // collation. Slice 3 replaces this with vector recall via
    // RroAdapter when feature `rro` is built.
    let all = store.load_blocks(scope, args.slug.as_deref()).await?;
    let needle = args.query.to_lowercase();

    let mut scored: Vec<(f32, &PersonaBlock)> = all
        .iter()
        .filter(|b| args.kinds.as_ref().is_none_or(|k| k.contains(&b.label)))
        .filter_map(|b| {
            let label = b.label.to_lowercase();
            let body = b.body.to_lowercase();
            let label_hit = label.contains(&needle);
            let body_hit = body.contains(&needle);
            if !label_hit && !body_hit {
                return None;
            }
            // Crude score — label hit weights higher than body, longer
            // bodies receive a small length penalty to keep relevance
            // tight. Replaced by cosine score in Slice 3.
            let base = if label_hit { 1.0_f32 } else { 0.7_f32 };
            // Body lengths are bounded < 64 KB in practice (persona blocks
            // are short JSON snippets, not large blobs). f32 mantissa is
            // 23 bits ≈ 8 MB max precise representation — body.len() is
            // well within that. `as f32` is safe here. Replaced by proper
            // scoring in Slice 3 anyway.
            #[expect(
                clippy::cast_precision_loss,
                reason = "persona block bodies are bounded < 64 KB; usize → f32 stays within mantissa precision; crude scoring superseded in Slice 3"
            )]
            let body_len_f32 = b.body.len() as f32;
            let len_penalty = 1.0_f32 / ((body_len_f32 / 256.0).max(1.0));
            Some((base * len_penalty, b))
        })
        .collect();

    scored.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));

    let hits: Vec<RecallHit> = scored
        .into_iter()
        .take(top_k)
        .map(|(score, block)| RecallHit {
            record_id: block.id.clone(),
            text: block.body.clone(),
            kind: block.label.clone(),
            score,
            t_valid: None,
            t_invalid: None,
        })
        .collect();

    Ok(PersonaRecallResult { hits })
}

// ─────────────────────────────────────────────────────────────
// persona.list
// ─────────────────────────────────────────────────────────────

/// Args for `persona.list`.
#[derive(Debug, Clone, Deserialize)]
pub struct PersonaListArgs {
    /// `"user"` or `"project"`.
    pub scope: String,
    /// Required when `scope == "project"`.
    #[serde(default)]
    pub slug: Option<String>,
    /// Filter by block label.
    #[serde(default)]
    pub kind: Option<String>,
    /// ISO-8601 cutoff — only return blocks with `updated_at >= since`.
    #[serde(default)]
    pub since: Option<String>,
    /// Result cap. Clamped to `[1, 1000]`.
    #[serde(default = "default_list_limit")]
    pub limit: usize,
}

fn default_list_limit() -> usize {
    100
}

/// Response for `persona.list`.
#[derive(Debug, Clone, Serialize)]
pub struct PersonaListResult {
    /// Matching blocks ordered by descending `updated_at`.
    pub items: Vec<PersonaBlock>,
    /// Opaque cursor for follow-up pages. v1 returns `None` — pagination
    /// lands when the catalog grows beyond a single 1k batch.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cursor: Option<String>,
}

/// Dispatch `persona.list`.
///
/// # Errors
/// Returns [`PersonaError::InvalidArg`] on scope/slug or timestamp
/// validation failure; [`PersonaError::Backend`] on storage failure.
pub async fn list(
    store: &Arc<PersonaStore>,
    args: PersonaListArgs,
) -> PersonaResult<PersonaListResult> {
    let scope = PersonaScope::parse(&args.scope)?;
    let since = args
        .since
        .as_deref()
        .map(|s| {
            DateTime::parse_from_rfc3339(s)
                .map(|t| t.with_timezone(&Utc))
                .map_err(|e| {
                    PersonaError::InvalidArg(format!("since must be RFC3339, got {s:?}: {e}"))
                })
        })
        .transpose()?;

    let items = store
        .list_blocks(
            scope,
            args.slug.as_deref(),
            args.kind.as_deref(),
            since,
            args.limit,
        )
        .await?;

    Ok(PersonaListResult {
        items,
        cursor: None,
    })
}
