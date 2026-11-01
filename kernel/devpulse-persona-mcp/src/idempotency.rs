//! Idempotency key cache — moka in-memory hot path + Turso durable backstop.
//!
//! Per `CLYFFY-COGNITIVE-FOUNDATION.md` §2: every write verb accepts an
//! `idempotency_key` (`UUIDv7` recommended). The server stores
//! `(key, response_json)` for 24 hours; duplicate keys return the cached
//! response verbatim.
//!
//! # Failure modes
//!
//! - Key reused with a *different* payload: caller's mistake. The cache
//!   returns the original cached response anyway — the spec is
//!   "duplicate keys return the cached response," not "validate
//!   payload equality." Callers SHOULD use `UUIDv7` or a digest to avoid
//!   this class of bug.
//! - Server restart with hot-cache loss: Turso backstop hydrates the
//!   in-memory cache on lookup miss. No data loss.

use crate::error::PersonaError;
use chrono::{DateTime, Utc};
use devpulse_clyffy::cortex::persistence::TursoAdapter;
use moka::future::Cache;
use std::sync::Arc;
use std::time::Duration;

use crate::schema::IDEMPOTENCY_TTL_SECS;

/// Cached idempotency entry. Stored as JSON-serialised response.
#[derive(Debug, Clone)]
pub struct IdempotentResponse {
    /// Raw JSON of the original response body (the `result` field of
    /// the JSON-RPC frame, not the full frame — the JSON-RPC `id` is
    /// per-request and would otherwise pollute the cache).
    pub response_json: String,
    /// Original durable deadline; warming the hot cache never extends it.
    pub expires_at: DateTime<Utc>,
}

/// Two-tier idempotency store.
///
/// Hot path: moka LRU keyed on the idempotency string, 10k max entries,
/// 24h TTL (matches SSOT lock).
///
/// Durable: Turso `persona_idempotency` table — survives server restart
/// for the full TTL window.
#[derive(Clone)]
pub struct IdempotencyCache {
    hot: Cache<String, IdempotentResponse>,
    database: Arc<TursoAdapter>,
}

impl IdempotencyCache {
    /// Construct over the shared Turso database, opening connections per operation.
    ///
    /// The schema (`persona_idempotency` table) MUST already be applied
    /// — `PersonaStore::open` runs `PERSONA_SCHEMA` before constructing
    /// this cache.
    #[must_use]
    pub fn new(database: Arc<TursoAdapter>) -> Self {
        let hot = Cache::builder()
            .max_capacity(10_000)
            .time_to_live(Duration::from_secs(IDEMPOTENCY_TTL_SECS))
            .build();
        Self { hot, database }
    }

    /// Look up a cached response. Checks the moka cache first; on miss,
    /// queries Turso and re-hydrates the cache on hit.
    ///
    /// # Errors
    /// Returns [`PersonaError::Backend`] if the Turso query fails.
    pub async fn get(&self, key: &str) -> Result<Option<IdempotentResponse>, PersonaError> {
        if let Some(hit) = self.hot.get(key).await {
            if hit.expires_at > Utc::now() {
                return Ok(Some(hit));
            }
            self.hot.invalidate(key).await;
        }
        let connection = self.database.connect().map_err(PersonaError::Backend)?;

        let mut rows = connection
            .query(
                "SELECT response_json, expires_at FROM persona_idempotency \
                 WHERE key = ?1 AND expires_at > ?2 LIMIT 1",
                turso::params![key, Utc::now().to_rfc3339()],
            )
            .await
            .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;

        let Some(row) = rows
            .next()
            .await
            .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?
        else {
            return Ok(None);
        };

        let response_json: String = row
            .get(0)
            .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;
        let expiry: String = row.get(1).map_err(|e| PersonaError::Backend(e.into()))?;
        let expires_at = DateTime::parse_from_rfc3339(&expiry)
            .map_err(|e| PersonaError::Backend(e.into()))?
            .with_timezone(&Utc);
        let entry = IdempotentResponse {
            response_json,
            expires_at,
        };

        // Hydrate the hot tier.
        self.hot.insert(key.to_string(), entry.clone()).await;
        Ok(Some(entry))
    }

    /// Store a response for the given key. Writes to both moka and
    /// Turso.
    ///
    /// # Errors
    /// Returns [`PersonaError::Backend`] if the Turso insert fails.
    pub async fn put(&self, key: &str, response_json: &str) -> Result<(), PersonaError> {
        let connection = self.database.connect().map_err(PersonaError::Backend)?;
        let now = Utc::now();
        let expires = now
            + chrono::Duration::seconds(i64::try_from(IDEMPOTENCY_TTL_SECS).unwrap_or(i64::MAX));

        connection
            .execute(
                "INSERT OR REPLACE INTO persona_idempotency \
                 (key, response_json, inserted_at, expires_at) \
                 VALUES (?1, ?2, ?3, ?4)",
                turso::params![key, response_json, now.to_rfc3339(), expires.to_rfc3339(),],
            )
            .await
            .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;

        self.hot
            .insert(
                key.to_string(),
                IdempotentResponse {
                    response_json: response_json.to_string(),
                    expires_at: expires,
                },
            )
            .await;

        Ok(())
    }

    /// Sweep expired rows. Called opportunistically — not on a timer
    /// per `feedback_no_process_flooding.md` (no orphaned background
    /// tasks). The opportunistic call point is `PersonaStore::open`.
    ///
    /// # Errors
    /// Returns [`PersonaError::Backend`] if the Turso delete fails.
    pub async fn sweep_expired(&self) -> Result<u64, PersonaError> {
        let connection = self.database.connect().map_err(PersonaError::Backend)?;
        let count = connection
            .execute(
                "DELETE FROM persona_idempotency WHERE expires_at <= ?1",
                turso::params![Utc::now().to_rfc3339()],
            )
            .await
            .map_err(|e| PersonaError::Backend(anyhow::anyhow!(e)))?;
        Ok(count)
    }

    /// Snapshot stats for devtool telemetry.
    #[must_use]
    pub fn stats(&self) -> IdempotencyStats {
        IdempotencyStats {
            hot_entry_count: self.hot.entry_count(),
            hot_max_capacity: self.hot.policy().max_capacity().unwrap_or(0),
        }
    }
}

/// Telemetry snapshot.
#[derive(Debug, Clone, Copy)]
pub struct IdempotencyStats {
    /// Live entries in the moka cache.
    pub hot_entry_count: u64,
    /// moka max capacity.
    pub hot_max_capacity: u64,
}
