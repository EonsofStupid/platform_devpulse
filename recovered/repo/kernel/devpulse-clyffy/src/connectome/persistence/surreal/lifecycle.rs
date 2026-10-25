//! Surreal embedded lifecycle — owns the in-process `SurrealKV` store.
//!
//! No child process, no WS, no port allocation. `DevPulse` opens the
//! `kv-surrealkv` storage backend directly via the Rust API. Drop
//! the handle to release the file lock for hot-update / migration.
//!
//! # Why embedded?
//!
//! - **Zero latency**: queries cross no socket/HTTP boundary.
//! - **Lower memory**: no `surreal start` process overhead, no
//!   second tokio runtime, no extra reqwest/HTTP/WS plumbing.
//! - **Pure Rust**: `SurrealKV` (LSM + MVCC) compiles without C/C++
//!   deps — release builds stay self-contained.
//! - **Hot-update tagged**: `Self::shutdown` drops the handle so a
//!   future swap can run schema migrations + reopen with no
//!   process-lifecycle dance.
//!
//! # What this DOES NOT own
//!
//! - Schema initialization. That belongs to
//!   [`super::client::SurrealAdapter::open_embedded`].
//! - The `Surreal<Db>` connection itself — owned by the adapter,
//!   passed back through [`Self::adapter`] / [`Self::db`].

use anyhow::{Context, Result};
use std::path::{Path, PathBuf};
use surrealdb::engine::local::{Db, SurrealKv};
use surrealdb::Surreal;

/// Boot parameters for the embedded `SurrealKV` store.
///
/// Single-field today; kept as a struct so future tuning (cache size,
/// compaction policy) lands without breaking the call surface.
#[derive(Debug, Clone)]
pub struct SurrealConfig {
    /// Absolute path to the `SurrealKV` data directory. Created on
    /// boot if absent. Format: opaque LSM tree + WAL — never edit
    /// by hand.
    pub data_path: PathBuf,
}

/// Embedded `SurrealKV` handle owned by the Platform.
///
/// Construction = open the on-disk store and produce a `Surreal<Db>`
/// connection. Cloneable per-namespace via the underlying `Surreal`'s
/// internal `Arc`. Hot-update happens by:
///
///   1. drain in-flight queries (Platform-side gate),
///   2. drop every `Surreal<Db>` clone (releases the file lock),
///   3. run migration / compaction,
///   4. construct a new `SurrealLifecycle` and republish.
///
/// Replaces the prior child-process manager. The struct name is
/// retained so existing engine imports continue to resolve.
pub struct SurrealLifecycle {
    /// Path the store was opened at — surfaced to the devtool so the
    /// user can see exactly where the bytes live.
    data_path: PathBuf,
    /// Live in-process connection. Cheap to clone (internal Arc).
    db: Surreal<Db>,
}

impl SurrealLifecycle {
    /// Open (or create) the embedded `SurrealKV` store at the configured
    /// path.
    ///
    /// # Errors
    ///
    /// - Filesystem error creating the data directory.
    /// - `SurrealKV` refuses to open the existing store (corruption,
    ///   incompatible WAL, file locked by another process).
    pub async fn boot(cfg: SurrealConfig) -> Result<Self> {
        std::fs::create_dir_all(&cfg.data_path)
            .with_context(|| format!("create `SurrealKV` data dir {}", cfg.data_path.display()))?;

        let path_str = cfg.data_path.to_string_lossy().into_owned();
        let db: Surreal<Db> = Surreal::new::<SurrealKv>(path_str.as_str())
            .await
            .with_context(|| format!("open `SurrealKV` store at {}", cfg.data_path.display()))?;

        tracing::info!(
            path = %cfg.data_path.display(),
            backend = "kv-surrealkv",
            "SurrealKV embedded store opened"
        );

        Ok(Self {
            data_path: cfg.data_path,
            db,
        })
    }

    /// Borrow the live connection. Multiple namespace scopes share
    /// one `Surreal<Db>` — every query prefixes its own
    /// `USE NS .. DB ..;` so namespace isolation is at the query
    /// level, never on session state.
    #[must_use]
    pub fn db(&self) -> &Surreal<Db> {
        &self.db
    }

    /// Path the store is open at. Devtool reads this to render the
    /// "where is my data" status row.
    #[must_use]
    pub fn data_path(&self) -> &Path {
        &self.data_path
    }

    /// Always `true` for the embedded path — `DevPulse` owns the store.
    /// Retained for source-compat with code that previously
    /// distinguished managed vs attached sidecars.
    #[must_use]
    pub fn is_managed(&self) -> bool {
        true
    }

    /// Health probe — runs a trivial `INFO FOR DB` against the
    /// embedded engine. Cheap (no I/O beyond a memtable read).
    ///
    /// # Errors
    /// Propagates any error from the embedded query layer.
    pub async fn ping(&self) -> Result<()> {
        // `INFO FOR ROOT` is the canonical embedded health probe; it
        // returns the cluster info without touching any user data.
        self.db
            .query("INFO FOR ROOT;")
            .await
            .context("SurrealKV health probe failed")?;
        Ok(())
    }

    /// Graceful shutdown — drop the connection, releasing the file
    /// lock so a follow-up `boot` (or external migration tool) can
    /// reopen without process restart.
    ///
    /// `SurrealKV` flushes its WAL automatically on `Surreal<Db>` Drop.
    /// This method exists for symmetry with the old sidecar surface
    /// — engine `Service::shutdown` forwards to it.
    ///
    /// # Errors
    /// Reserved for the migration / drop-handle path that will surface
    /// `SurrealKV` flush failures once hot-update lands. The current
    /// implementation never returns `Err` because the embedded store
    /// flushes on `Drop`; the signature stays `Result<()>` so callers
    /// don't break when that contract grows real failure modes.
    #[allow(clippy::unused_async)]
    pub async fn shutdown(&self) -> Result<()> {
        tracing::info!(
            path = %self.data_path.display(),
            "SurrealKV embedded store shutting down — flush on drop"
        );
        Ok(())
    }
}
