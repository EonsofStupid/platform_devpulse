//! `SuggestionService` — embed-and-rank service for chat-input
//! type-time suggestions.
//!
//! With an embedder answering in `chat.suggest`, prompts are recalled by
//! meaning (HNSW cosine). With none (no model loaded — the usual case when
//! your AI is your subscriptions), each prompt is stored without its
//! embedding and recalled by its words through the full-text index (plan
//! 0001 B3.9). Ranking is the same either way.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering as AtomicOrdering};

use crate::cortex::cag::traits::Embedder;
use crate::cortex::persistence::surreal::client::SurrealAdapter;
use crate::cortex::persistence::surreal::rpc::Query;

/// Default persona id for single-user installs. Multi-persona installs
/// pass their own id at the call site; this constant exists so the
/// chat-input surface can ship without a persona picker on first boot.
pub const DEFAULT_PERSONA_ID: &str = "clyffy";

/// One suggestion returned by [`SuggestionService::query`].
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct Suggestion {
    /// Original prompt id (`UUIDv7` — recency-sortable on lex order).
    pub id: String,
    /// Original prompt text the user committed previously.
    pub text: String,
    /// Closeness in `[0.0, 1.0]`, higher is closer: cosine similarity when
    /// recalled by meaning, from the word-match score when recalled by
    /// words.
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
    /// The embedder did not answer last time (said once in the log, not
    /// on every keystroke).
    embedder_down: AtomicBool,
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
            embedder_down: AtomicBool::new(false),
        }
    }

    /// The embedding of `text`, or `None` when no embedder answers — then
    /// the prompt is stored and recalled by its words. Each change between
    /// the two is logged once.
    async fn embed(&self, text: &str) -> Option<Vec<f32>> {
        match self.embedder.embed(text).await {
            Ok(embedding) => {
                if self.embedder_down.swap(false, AtomicOrdering::Relaxed) {
                    tracing::info!(
                        "chat.suggest embedder answers again; prompts are recalled by meaning"
                    );
                }
                Some(embedding)
            }
            Err(e) => {
                if !self.embedder_down.swap(true, AtomicOrdering::Relaxed) {
                    tracing::warn!(
                        error = %format!("{e:#}"),
                        "chat.suggest has no embedder answering; prompts are stored and recalled by their words"
                    );
                }
                None
            }
        }
    }

    /// Capture a committed prompt for future type-time recall.
    ///
    /// Writes a `chat_prompt` row, with the prompt's embedding when an
    /// embedder answers and without it otherwise (recalled by its words).
    /// Idempotent at the id level — caller-supplied `UUIDv7` collisions
    /// overwrite (use [`uuid::Uuid::now_v7`] to avoid that path).
    ///
    /// # Errors
    /// `SurrealDB` write failure.
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
        let embedding = self.embed(text).await;

        let id = uuid::Uuid::now_v7().to_string();
        let captured_at = unix_now_secs();

        // Every value is bound: the text needs no escaping and the
        // embedding crosses as a float array. Without one the field is
        // left out (NONE), which the optional field takes.
        let with_embedding = if embedding.is_some() {
            "embedding: $embedding, "
        } else {
            ""
        };
        let mut insert = Query::new(format!(
            "CREATE type::record('chat_prompt', $id) CONTENT {{ \
                text: $text, \
                {with_embedding}\
                persona_id: $persona, \
                captured_at: $captured_at, \
                accepted: $accepted \
            }};"
        ))
        .bind("id", &id)?
        .bind("text", text)?
        .bind("persona", persona)?
        .bind("captured_at", &captured_at)?
        .bind("accepted", &accepted)?;
        if let Some(embedding) = &embedding {
            insert = insert.bind("embedding", embedding)?;
        }
        self.surreal
            .run(&self.namespace, &self.database, insert)
            .await?
            .check()
            .context("chat_prompt insert failed")?;

        tracing::info!(
            persona_id,
            id,
            captured_at,
            accepted,
            by_meaning = embedding.is_some(),
            "chat_prompt recorded"
        );
        Ok(())
    }

    /// Recall top-`k` historical prompts most similar to the partial
    /// the user is currently typing.
    ///
    /// Pipeline: embed `partial` once → HNSW cosine pull (`k * 4`
    /// candidates) — or, with no embedder answering, the full-text index
    /// on the partial's words → in-Rust recency × accepted-boost
    /// reweighting → truncate to `k`. The `k * 4` overfetch gives the
    /// recency factor room to surface a slightly-older-but-relevant match
    /// over a brand-new low-similarity one.
    ///
    /// # Errors
    /// `SurrealDB` query failure.
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
        let overfetch = k.saturating_mul(4).max(k);
        let candidates = match self.embed(partial).await {
            Some(embedding) => self.by_meaning(&embedding, persona, overfetch).await?,
            None => self.by_words(partial, persona, overfetch).await?,
        };
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

    /// Nearest prompts by meaning (HNSW cosine).
    async fn by_meaning(
        &self,
        embedding: &[f32],
        persona: &str,
        overfetch: usize,
    ) -> Result<Vec<RawCandidate>> {
        // Surreal 3 takes a filter beside the HNSW search only when the
        // search width is given (`<|K,EF|>`; a bare `<|K|>` with a filter is
        // refused). `record::id` is Surreal 3's name for the 2.x `meta::id`.
        let ef = overfetch.max(40);
        let knn = Query::new(format!(
            "SELECT \
                record::id(id) AS id, \
                text, \
                captured_at, \
                accepted, \
                vector::similarity::cosine(embedding, $embedding) AS similarity \
             FROM chat_prompt \
             WHERE persona_id = $persona \
               AND embedding <|{overfetch},{ef}|> $embedding \
             ORDER BY similarity DESC \
             LIMIT {overfetch};"
        ))
        .bind("embedding", embedding)?
        .bind("persona", persona)?;
        let raw = serde_json::Value::Array(
            self.surreal
                .run(&self.namespace, &self.database, knn)
                .await?
                .take(0)
                .context("chat_prompt KNN query failed")?,
        );
        Ok(parse_candidates(&raw))
    }

    /// Prompts holding the partial's words (the full-text index; a word is
    /// matched while you are still typing it).
    async fn by_words(
        &self,
        partial: &str,
        persona: &str,
        overfetch: usize,
    ) -> Result<Vec<RawCandidate>> {
        let words = words_of(partial);
        if words.is_empty() {
            return Ok(Vec::new());
        }
        let search = Query::new(format!(
            "SELECT \
                record::id(id) AS id, \
                text, \
                captured_at, \
                accepted, \
                search::score(0) AS similarity \
             FROM chat_prompt \
             WHERE persona_id = $persona \
               AND text @0@ $words \
             ORDER BY similarity DESC \
             LIMIT {overfetch};"
        ))
        .bind("words", &words)?
        .bind("persona", persona)?;
        let raw = serde_json::Value::Array(
            self.surreal
                .run(&self.namespace, &self.database, search)
                .await?
                .take(0)
                .context("chat_prompt word search failed")?,
        );
        Ok(parse_candidates(&raw)
            .into_iter()
            .map(|mut c| {
                c.similarity = word_closeness(c.similarity);
                c
            })
            .collect())
    }
}

/// The partial's words, joined by spaces: the analyzer splits on
/// punctuation in stored text, but a query term holding punctuation
/// (`person:tob`) matches nothing.
fn words_of(partial: &str) -> String {
    partial
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| !w.is_empty())
        .collect::<Vec<_>>()
        .join(" ")
}

/// A word match is at least half as close as a perfect match; the
/// full-text score (unbounded, and 0 for words every prompt holds) adds
/// the rest, so recency and acceptance still order equal matches.
fn word_closeness(score: f32) -> f32 {
    let score = score.max(0.0);
    0.5 + 0.5 * (score / (1.0 + score))
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
///
/// The `i64 → f32` cast is intentional: `RECENCY_HALF_LIFE_SECS` is a
/// `f32` constant, and the recency window is bounded to a handful of
/// half-lives (a few days) — never approaches `2^23` seconds where
/// f32 precision starts to round. The clamp keeps the output finite.
#[expect(
    clippy::cast_precision_loss,
    reason = "age window is bounded to a few half-lives (days); \
              `i64 → f32` is exact for every realistic input."
)]
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
        .map_or(0, |d| d.as_secs().cast_signed())
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
    fn words_drop_punctuation_a_query_term_cannot_hold() {
        assert_eq!(words_of("person:tob"), "person tob");
        assert_eq!(words_of("  deploy, the app!"), "deploy the app");
        assert_eq!(words_of("::"), "");
    }

    #[test]
    fn a_word_match_is_at_least_half_close_and_below_one() {
        assert!((word_closeness(0.0) - 0.5).abs() < 1e-6);
        let strong = word_closeness(2.26);
        assert!(strong > 0.8 && strong < 1.0, "{strong}");
        assert!((word_closeness(-1.0) - 0.5).abs() < 1e-6);
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
