//! `ConfigBackend` implementations for model-loader persistence.
//!
//! Two backends:
//! - `MemoryConfig` (re-exported from model-loader) — volatile, for tests
//! - `TursoConfig` — persists to the system Turso database, survives restarts

#[cfg(feature = "inference")]
pub use devpulse_clyffy::model_loader::MemoryConfig;

#[cfg(feature = "inference")]
use devpulse_clyffy::model_loader::ConfigBackend;

#[cfg(feature = "inference")]
use devpulse_clyffy::cortex::persistence::TursoAdapter;

#[cfg(feature = "inference")]
use std::sync::Arc;

/// Turso-backed `ConfigBackend` — persists model assignments to the system database.
///
/// Uses the system Turso's `kv_store` table with a `model_loader.` prefix.
/// The `ConfigBackend` trait is sync; Turso is async. We bridge via
/// `tokio::task::block_in_place(|| handle.block_on(...))` which yields the
/// current tokio worker thread to run the async block without nesting runtimes.
#[cfg(feature = "inference")]
pub struct TursoConfig {
    adapter: Arc<TursoAdapter>,
    /// tokio runtime handle captured at construction time.
    handle: tokio::runtime::Handle,
}

#[cfg(feature = "inference")]
impl TursoConfig {
    /// Create a new Turso config backend.
    ///
    /// Must be called from a tokio context (captures `Handle::current()`).
    pub fn new(adapter: Arc<TursoAdapter>) -> Self {
        Self {
            adapter,
            handle: tokio::runtime::Handle::current(),
        }
    }

    /// Prefix all keys with `model_loader.` to namespace within the shared `kv_store`.
    fn prefixed_key(key: &str) -> String {
        format!("model_loader.{key}")
    }
}

#[cfg(feature = "inference")]
impl ConfigBackend for TursoConfig {
    fn get(&self, key: &str) -> anyhow::Result<Option<String>> {
        let adapter = self.adapter.clone();
        let pk = Self::prefixed_key(key);

        tokio::task::block_in_place(|| {
            self.handle.block_on(async {
                // One connection per operation (Turso runs one operation per connection).
                let conn = adapter.connect()?;
                let mut rows = conn
                    .query("SELECT value FROM kv_store WHERE key = ?1", [pk.as_str()])
                    .await
                    .map_err(|e| anyhow::anyhow!("TursoConfig get failed: {e}"))?;

                if let Some(row) = rows
                    .next()
                    .await
                    .map_err(|e| anyhow::anyhow!("TursoConfig row fetch failed: {e}"))?
                {
                    let blob: Vec<u8> = row
                        .get(0)
                        .map_err(|e| anyhow::anyhow!("TursoConfig column read failed: {e}"))?;
                    Ok(Some(String::from_utf8(blob)?))
                } else {
                    Ok(None)
                }
            })
        })
    }

    fn set(&self, key: &str, value: &str) -> anyhow::Result<()> {
        let adapter = self.adapter.clone();
        let pk = Self::prefixed_key(key);
        let val = value.to_string();

        tokio::task::block_in_place(|| {
            self.handle.block_on(async {
            // One connection per operation (Turso runs one operation per connection).
            let conn = adapter.connect()?;
            conn.execute(
                "INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?1, CAST(?2 AS BLOB), unixepoch())",
                (pk.as_str(), val.as_str()),
            )
            .await
            .map_err(|e| anyhow::anyhow!("TursoConfig set failed: {e}"))?;
            Ok(())
        })
        })
    }

    fn delete(&self, key: &str) -> anyhow::Result<()> {
        let adapter = self.adapter.clone();
        let pk = Self::prefixed_key(key);

        tokio::task::block_in_place(|| {
            self.handle.block_on(async {
                // One connection per operation (Turso runs one operation per connection).
                let conn = adapter.connect()?;
                conn.execute("DELETE FROM kv_store WHERE key = ?1", [pk.as_str()])
                    .await
                    .map_err(|e| anyhow::anyhow!("TursoConfig delete failed: {e}"))?;
                Ok(())
            })
        })
    }

    fn list_by_prefix(&self, prefix: &str) -> anyhow::Result<Vec<(String, String)>> {
        let adapter = self.adapter.clone();
        let full_prefix = Self::prefixed_key(prefix);

        tokio::task::block_in_place(|| {
            self.handle.block_on(async {
                // One connection per operation (Turso runs one operation per connection).
                let conn = adapter.connect()?;
                let like_pattern = format!("{full_prefix}%");
                let mut rows = conn
                    .query(
                        "SELECT key, value FROM kv_store WHERE key LIKE ?1 ORDER BY key",
                        [like_pattern.as_str()],
                    )
                    .await
                    .map_err(|e| anyhow::anyhow!("TursoConfig list_by_prefix failed: {e}"))?;

                let mut results = Vec::new();
                while let Some(row) = rows
                    .next()
                    .await
                    .map_err(|e| anyhow::anyhow!("TursoConfig row iteration failed: {e}"))?
                {
                    let full_key: String = row
                        .get(0)
                        .map_err(|e| anyhow::anyhow!("TursoConfig key read failed: {e}"))?;
                    let blob: Vec<u8> = row
                        .get(1)
                        .map_err(|e| anyhow::anyhow!("TursoConfig value read failed: {e}"))?;
                    // Strip the `model_loader.` prefix from keys before returning
                    let key = full_key
                        .strip_prefix("model_loader.")
                        .unwrap_or(&full_key)
                        .to_string();
                    results.push((key, String::from_utf8(blob)?));
                }
                Ok(results)
            })
        })
    }
}
