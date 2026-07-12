//! Per-project initialization orchestrator.
//!
//! `init_project_full` is the single atomic entry point for minting a
//! project's persistence state across all four stores. It is the
//! Rust-side keystone of "open a project" — every store the project
//! needs is created (or re-opened idempotently) in one call, with
//! lifecycle events surfaced through `tracing::*` so the devtool
//! log surface can replay the boot of a project the same way it
//! replays the boot of a service.
//!
//! ## What it touches
//!
//! 1. **libSQL** — `{project_root}/.userdata/project.db`
//!    (file index, RAG chunks, signals, drift log)
//! 2. **`DuckDB`** — `{project_root}/.userdata/analytics.duckdb`
//!    (per-project OLAP telemetry — model calls, indexing,
//!    retrieval, daily rollups)
//! 3. **`SurrealDB`** — namespace `projects` / database
//!    `proj_<sanitized_project_id>` inside the single embedded
//!    instance (symbol graph, call edges, `project_meta`)
//! 4. **Qdrant** — collections `proj_<sanitized>__chunks` +
//!    `proj_<sanitized>__symbols` inside the single embedded RRO
//!    instance (dense semantic vectors)
//!
//! All four are idempotent. Calling `init_project_full` on an existing
//! project = re-opening adapters + re-running `CREATE … IF NOT EXISTS`
//! / `DEFINE … IF NOT EXISTS` DDL. Safe to call on every app boot
//! against every known project (the `open_existing` codepath delegates
//! to this once the orchestrator is wired through the project registry).
//!
//! ## Failure model
//!
//! Each store fails independently. If libSQL succeeds and Surreal
//! fails, the libSQL adapter is left open (cached on the manager) and
//! the call returns an error describing which store broke. Callers
//! deciding whether to retry should consult [`ProjectScope::libsql`]
//! et al. to know which pieces did land.
//!
//! ## Why a free function, not a method on `Platform`
//!
//! Keeps testability open — fixtures can construct a mock set of
//! managers without standing up the whole `Platform`. `Platform`
//! still exposes [`crate::platform::Platform::init_project_full`]
//! as a convenience that forwards here with its own field refs.

use anyhow::{Context, Result};
use devpulse_clyffy::cortex::persistence::{
    DuckDbAdapter, LibSqlAdapter, ScopedGraphHandle, SurrealAdapter,
};
use std::path::Path;
use std::sync::Arc;

use super::project_analytics::ProjectAnalyticsManager;
use super::project_db::ProjectDbManager;
use super::project_graph::ProjectGraphManager;

#[cfg(feature = "rro")]
use super::project_vector::{ProjectCollections, ProjectCollectionsConfig, ProjectVectorManager};
#[cfg(feature = "rro")]
use super::vector::VectorService;

/// Inputs for a per-project init pass.
#[derive(Debug, Clone)]
pub struct ProjectInitConfig {
    /// Stable identifier for the project — typically a UUID, but any
    /// string is acceptable. Sanitized when used as a `SurrealDB`
    /// database name or Qdrant collection suffix.
    pub project_id: String,
    /// Project root directory. `.userdata/` is created beneath it.
    pub project_root: std::path::PathBuf,
    /// Human-readable name. Seeded into `project_meta` rows on both
    /// libSQL and `SurrealDB`.
    pub project_name: String,
    /// Per-project vector collection tuning. Only consulted when the
    /// `rro` feature is enabled.
    #[cfg(feature = "rro")]
    pub vector: ProjectCollectionsConfig,
}

/// The minted handles + collection names for one project.
///
/// Returned from [`init_project_full`] so callers don't re-fetch
/// from the managers right after init.
pub struct ProjectScope {
    /// Per-project libSQL adapter (project.db).
    pub libsql: Arc<LibSqlAdapter>,
    /// Per-project `DuckDB` adapter (analytics.duckdb).
    pub analytics: Arc<DuckDbAdapter>,
    /// Scoped `SurrealDB` handle (`projects` / `proj_<id>`).
    pub graph: Arc<ScopedGraphHandle>,
    /// Qdrant collection names owned by this project.
    #[cfg(feature = "rro")]
    pub vector: ProjectCollections,
}

/// Bundle of manager refs the orchestrator needs.
///
/// Construction is verbose — `Platform::init_project_full` forwards
/// its own field refs in. Hand-construction is for tests.
pub struct ProjectInitContext<'a> {
    /// Per-project libSQL manager — owns the `<id> → adapter` map
    /// and lazy-loads `project.db` on first lookup.
    pub project_db: &'a Arc<ProjectDbManager>,
    /// Per-project `DuckDB` manager — owns the analytics adapter map.
    pub project_analytics: &'a Arc<ProjectAnalyticsManager>,
    /// Per-project `SurrealDB` scope manager — mints `proj_<id>`
    /// scoped graph handles off the shared adapter.
    pub project_graph: &'a Arc<ProjectGraphManager>,
    /// Shared `SurrealDB` adapter — borrowed from the system graph
    /// service. `None` only when `SurrealDB` is disabled in
    /// `PlatformBootConfig` (graph init will fail).
    pub surreal_adapter: Option<&'a Arc<SurrealAdapter>>,
    /// Per-project Qdrant collection manager — names + provisions
    /// the vector collections that back retrieval for one project.
    #[cfg(feature = "rro")]
    pub project_vector: &'a Arc<ProjectVectorManager>,
    /// Shared vector service. `None` when the embedded Qdrant
    /// instance has not started (RRO feature on but boot deferred).
    #[cfg(feature = "rro")]
    pub vector: Option<&'a Arc<VectorService>>,
}

/// Run the full per-project init pass — all four stores in one call.
///
/// # Errors
/// Returns the first store-init failure. Successfully-initialized
/// stores stay cached on their managers; callers can call
/// `manager.get(project_id)` to retrieve whatever did land before
/// the failure.
///
/// # Tracing
///
/// Emits one INFO span per store (`project_init.libsql`,
/// `project_init.analytics`, `project_init.graph`,
/// `project_init.vector`) plus a wrapping INFO span
/// `project_init.full` so the devtool log surface can replay the
/// per-project boot as a single tree.
pub async fn init_project_full(
    cx: ProjectInitContext<'_>,
    config: &ProjectInitConfig,
) -> Result<ProjectScope> {
    let span = tracing::info_span!(
        "project_init.full",
        project_id = %config.project_id,
        project_root = %config.project_root.display(),
    );
    let _enter = span.enter();

    tracing::info!("Starting per-project init");

    let project_id = config.project_id.as_str();
    let project_name = config.project_name.as_str();
    let project_root: &Path = config.project_root.as_path();

    // ── libSQL ────────────────────────────────────────────────────
    let libsql = {
        let _s = tracing::info_span!("project_init.libsql").entered();
        cx.project_db
            .init_project(project_id, project_root, project_name)
            .await
            .context("project init: libSQL")?
    };

    // ── DuckDB analytics ──────────────────────────────────────────
    let analytics = {
        let _s = tracing::info_span!("project_init.analytics").entered();
        cx.project_analytics
            .init_project(project_id, project_root)
            .await
            .context("project init: DuckDB analytics")?
    };

    // ── SurrealDB namespace ───────────────────────────────────────
    let graph = {
        let _s = tracing::info_span!("project_init.graph").entered();
        let adapter = cx.surreal_adapter.ok_or_else(|| {
            anyhow::anyhow!("Surreal adapter unavailable — graph not initialized")
        })?;
        cx.project_graph
            .init_project(adapter, project_id, project_name)
            .await
            .context("project init: Surreal graph")?
    };

    // ── Qdrant collections (rro feature) ──────────────────────────
    #[cfg(feature = "rro")]
    let vector = {
        let _s = tracing::info_span!("project_init.vector").entered();
        let v = cx.vector.ok_or_else(|| {
            anyhow::anyhow!("Vector service unavailable — RRO feature enabled but not booted")
        })?;
        cx.project_vector
            .init_project(v, project_id, &config.vector)
            .await
            .context("project init: Qdrant collections")?
    };

    tracing::info!("Per-project init complete");

    Ok(ProjectScope {
        libsql,
        analytics,
        graph,
        #[cfg(feature = "rro")]
        vector,
    })
}
