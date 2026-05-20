//! `SuggestionService` — embed-and-rank service for chat-input
//! type-time suggestions.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::cortex::cag::traits::Embedder;
use crate::cortex::persistence::surreal::client::SurrealAdapter;

/// Default persona id for single-user installs. Multi-persona installs
/// pass their own id at the call site; this constant exists so the
/// chat-input surface can ship without a persona picker on first boot.
pub const DEFAULT_PERSONA_ID: &str = "clyffy";

/// One suggestion returned by [`SuggestionService::query`].
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct Suggestion {
    /// Original prompt id (UUIDv7 — recency-sortable on lex order).
    pub id: String,
    /// Original prompt text the user committed previously.
    pub text: String,
    /// Cosine similarity score in `[0.0, 1.0]`. Higher is closer.
    pub similarity: f32,
    /// Unix-seconds capture time. Used by the recency factor in the
    /// final rank.
    pub captured_at: i64,
    /// Whether the original prompt was accepted (boosts rank).
    pub accepted: bool,
    /// Final fused score after recency × similarity × accepted-boost
    /// reweighting. Sorted in descending order in the returned vec.
    pub score: f32,
}

/// Recency half-life in seconds — a prompt 24 h old contributes ~half
/// of the recency weight of a fresh prompt. Tunable; pre-release
/// directional pick.
const RECENCY_HALF_LIFE_SECS: f32 = 86_400.0;

/// Multiplier applied when a prompt was previously accepted. 1.25 ≈
/// "boost by a quarter" without dominating the cosine signal.
const ACCEPTED_BOOST: f32 = 1.25;

/// Embed-and-rank service over the `chat_prompt` corpus.
///
/// Holds an `Arc<dyn Embedder>` rather than a generic parameter so the
/// engine can store the constructed service in `PlatformState` without
/// leaking the concrete embedder type into the platform surface. The
/// `Embedder` trait is made `dyn`-compatible by `#[async_trait]` on
/// [`crate::cortex::cag::traits::Embedder`].
pub struct SuggestionService {
    embedder: Arc<dyn Embedder>,
    surreal: Arc<SurrealAdapter>,
    namespace: String,
    database: String,
}

impl SuggestionService {
    /// Build a service bound to a specific Surreal namespace/database.
    /// `chat_prompt` lives in the user-scoped graph — engine boot
    /// passes the user namespace from `PlatformBootConfig`.
    pub fn new(
        embedder: Arc<dyn Embedder>,
        surreal: Arc<SurrealAdapter>,
        namespace: impl Into<String>,
        database: impl Into<String>,
    ) -> Self {
        Self {
            embedder,
            surreal,
            namespace: namespace.into(),
            database: database.into(),
        }
    }

    /// Capture a committed prompt for future type-time recall.
    ///
    /// Embeds `text` and writes a `chat_prompt` row. Idempotent at the
    /// id level — caller-supplied UUIDv7 collisions overwrite (use
    /// [`uuid::Uuid::now_v7`] to avoid that path).
    ///
    /// # Errors
    /// - Embedder failure (model not loaded, tokenization error).
    /// - SurrealDB write failure.
    #[tracing::instrument(
        skip(self, text),
        fields(
            persona_id,
            text_len = text.len(),
            accepted,
        ),
        err
    )]
    pub async fn record_prompt(&self, text: &str, persona_id: &str, accepted: bool) -> Result<()> {
        let persona = resolve_persona(persona_id);
        let embedding = self
            .embedder
            .embed(text)
            .await
            .context("chat.suggest embed failed during record_prompt")?;

        let id = uuid::Uuid::now_v7().to_string();
        let captured_at = unix_now_secs();
        let embedding_json = serde_json::to_string(&embedding)
            .context("serialize embedding to JSON for SurrealDB CONTENT clause")?;
        let safe_text = text.replace('\\', "\\\\").replace('\'', "\\'");

        let surql = format!(
            "CREATE type::thing('chat_prompt', '{id}') CONTENT {{ \
                text: '{safe_text}', \
                embedding: {embedding_json}, \
                persona_id: '{persona}', \
                captured_at: {captured_at}, \
                accepted: {accepted} \
            }};"
        );

        self.surreal
            .execute_in_ns(&self.namespace, &self.database, &surql)
            .await
            .context("chat_prompt insert failed")?;

        tracing::info!(
            persona_id,
            id,
            captured_at,
            accepted,
            "chat_prompt recorded"
        );
        Ok(())
    }

    /// Recall top-`k` historical prompts most similar to the partial
    /// the user is currently typing.
    ///
    /// Pipeline: embed `partial` once → HNSW cosine pull (`k * 4`
    /// candidates) → in-Rust recency × accepted-boost reweighting →
    /// truncate to `k`. The `k * 4` overfetch gives the recency factor
    /// room to surface a slightly-older-but-relevant match over a
    /// brand-new low-similarity one.
    ///
    /// # Errors
    /// - Embedder failure.
    /// - SurrealDB query failure.
    #[tracing::instrument(
        skip(self, partial),
        fields(
            persona_id,
            partial_len = partial.len(),
            k,
        ),
        err
    )]
    pub async fn query(
        &self,
        partial: &str,
        persona_id: &str,
        k: usize,
    ) -> Result<Vec<Suggestion>> {
        if partial.is_empty() || k == 0 {
            return Ok(Vec::new());
        }

        let persona = resolve_persona(persona_id);
        let embedding = self
            .embedder
            .embed(partial)
            .await
            .context("chat.suggest embed failed during query")?;

        let embedding_json = serde_json::to_string(&embedding)
            .context("serialize partial embedding for SurrealDB KNN parameter")?;

        let overfetch = k.saturating_mul(4).max(k);
        let surql = format!(
            "SELECT \
                meta::id(id) AS id, \
                text, \
                captured_at, \
                accepted, \
                vector::similarity::cosine(embedding, {embedding_json}) AS similarity \
             FROM chat_prompt \
             WHERE persona_id = '{persona}' \
               AND embedding <|{overfetch}|> {embedding_json} \
             ORDER BY similarity DESC \
             LIMIT {overfetch};"
        );

        let raw = self
            .surreal
            .query_in_ns(&self.namespace, &self.database, &surql)
            .await
            .context("chat_prompt KNN query failed")?;

        let candidates = parse_candidates(&raw);
        let now = unix_now_secs();

        let mut scored: Vec<Suggestion> = candidates
            .into_iter()
            .map(|c| {
                let recency = recency_weight(now, c.captured_at);
                let accept = if c.accepted { ACCEPTED_BOOST } else { 1.0 };
                let score = c.similarity * recency * accept;
                Suggestion {
                    id: c.id,
                    text: c.text,
                    similarity: c.similarity,
                    captured_at: c.captured_at,
                    accepted: c.accepted,
                    score,
                }
            })
            .collect();

        scored.sort_by(|a, b| {
            b.score
                .partial_cmp(&a.score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        scored.truncate(k);

        tracing::info!(
            persona_id,
            returned = scored.len(),
            "chat_prompt suggestion recall"
        );
        Ok(scored)
    }
}

#[derive(Debug)]
struct RawCandidate {
    id: String,
    text: String,
    similarity: f32,
    captured_at: i64,
    accepted: bool,
}

/// Decode the `Vec<serde_json::Value>` returned by
/// [`SurrealAdapter::query_in_ns`] into typed candidates. Tolerates
/// missing fields by skipping the row — a half-decoded result is
/// preferable to a hard failure on a single malformed record.
fn parse_candidates(raw: &serde_json::Value) -> Vec<RawCandidate> {
    let serde_json::Value::Array(rows) = raw else {
        return Vec::new();
    };

    let mut out = Vec::with_capacity(rows.len());
    for row in rows {
        let Some(obj) = row.as_object() else {
            continue;
        };

        let Some(id) = obj.get("id").and_then(serde_json::Value::as_str) else {
            continue;
        };
        let Some(text) = obj.get("text").and_then(serde_json::Value::as_str) else {
            continue;
        };
        let similarity = obj
            .get("similarity")
            .and_then(serde_json::Value::as_f64)
            .unwrap_or(0.0) as f32;
        let captured_at = obj
            .get("captured_at")
            .and_then(serde_json::Value::as_i64)
            .unwrap_or(0);
        let accepted = obj
            .get("accepted")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false);

        out.push(RawCandidate {
            id: id.to_string(),
            text: text.to_string(),
            similarity,
            captured_at,
            accepted,
        });
    }
    out
}

/// Exponential decay on age: 1.0 for fresh, 0.5 at one half-life, ≈0
/// past several half-lives. Capped at 1.0 to defend against
/// clock-skew producing future timestamps.
fn recency_weight(now_secs: i64, captured_at_secs: i64) -> f32 {
    let age_secs = (now_secs - captured_at_secs).max(0) as f32;
    let half_lives = age_secs / RECENCY_HALF_LIFE_SECS;
    (-half_lives * std::f32::consts::LN_2).exp().clamp(0.0, 1.0)
}

/// Wall-clock seconds since the Unix epoch. Falls back to 0 if the
/// system clock is set before 1970-01-01 (impossible in practice but
/// keeps the function total).
fn unix_now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// Empty persona id falls back to [`DEFAULT_PERSONA_ID`]. Caller-supplied
/// ids are passed through verbatim — multi-persona installs partition
/// the corpus by this field, single-user installs ride the default.
fn resolve_persona(persona_id: &str) -> &str {
    if persona_id.is_empty() {
        DEFAULT_PERSONA_ID
    } else {
        persona_id
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recency_weight_fresh_is_one() {
        let now = 1_000_000;
        assert!((recency_weight(now, now) - 1.0).abs() < 1e-6);
    }

    #[test]
    fn recency_weight_half_life_is_half() {
        let now = 1_000_000;
        let captured = now - RECENCY_HALF_LIFE_SECS as i64;
        let w = recency_weight(now, captured);
        assert!((w - 0.5).abs() < 0.01, "expected ~0.5, got {w}");
    }

    #[test]
    fn recency_weight_future_clamps_to_one() {
        let now = 1_000_000;
        let captured = now + 3600;
        assert!((recency_weight(now, captured) - 1.0).abs() < 1e-6);
    }

    #[test]
    fn resolve_persona_falls_back_on_empty() {
        assert_eq!(resolve_persona(""), DEFAULT_PERSONA_ID);
        assert_eq!(resolve_persona("alice"), "alice");
    }

    #[test]
    fn parse_candidates_skips_missing_fields() {
        let raw = serde_json::json!([
            { "id": "a", "text": "hello", "similarity": 0.9, "captured_at": 1, "accepted": true },
            { "id": "b" },
            { "id": "c", "text": "world", "similarity": 0.5, "captured_at": 2, "accepted": false },
        ]);
        let parsed = parse_candidates(&raw);
        assert_eq!(parsed.len(), 2);
        assert_eq!(parsed[0].id, "a");
        assert_eq!(parsed[1].id, "c");
    }
}
