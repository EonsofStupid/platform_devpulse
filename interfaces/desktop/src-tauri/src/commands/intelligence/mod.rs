//! Intelligence layer Tauri commands.
//!
//! Backs the `/devtools/clyffy/memory/intelligence` devtool. Three
//! commands today, all read-only:
//!
//! - [`intel_status`] — connector kind + embedding dim + project
//!   count for the inventory header.
//! - [`intel_list_projects`] — per-project memory + archive counts
//!   so the devtool can render the namespace inventory table.
//! - [`infer_capability_bucket`] — wraps
//!   `model_loader::infer_download_folder` so the UI can preview
//!   "this filename → chat / rag / voice / vision" before a
//!   download lands.
//!
//! Writes: [`intel_save_memory`] is the first write-side command
//! exposed — accepts a pre-computed embedding so it can ship without
//! the chat→embedder hook (that lands in the next batch when the
//! Burn embedder bridge is wired). MCP-server-side writes still
//! defer to the future hook layer to keep the IPC surface guarded.

use crate::state::PlatformState;
use serde::Serialize;
use specta::Type;
use tauri::State;

// `devpulse_engine::platform` re-exports both the intelligence
// types (always-on, kernel pass-through) and `infer_download_folder`
// (gated behind engine's `candle` feature, which `devpulse_desktop_backend`
// always enables — see this crate's `Cargo.toml`'s
// `devpulse-engine = { features = [..., "candle", ...] }` line).
use devpulse_engine::platform::{
    EMBEDDING_DIM, IntelligenceStore, MemoryKind, MemoryRecord, infer_download_folder,
};

macro_rules! get_platform {
    ($state:expr) => {
        $state
            .platform
            .load_full()
            .ok_or_else(|| "Platform is still booting".to_string())
    };
}

/// Surreal namespace under which every project-local intelligence
/// store lives. Mirrors the `PROJECT_NAMESPACE` constant in
/// `kernel/devpulse-clyffy/.../surreal/intelligence_impl.rs`.
const PROJECT_NAMESPACE: &str = "projects";

/// Header status surfaced in the devtool's Status tab.
#[derive(Debug, Clone, Serialize, Type)]
pub struct IntelStatus {
    /// Backing connector identifier — fixed at `"embedded-surrealkv"`
    /// while we ship only the local connector. Replaced with the
    /// active connector kind once the cloud connector ships.
    pub connector_kind: String,
    /// HNSW embedding dimension locked in
    /// `cortex::intelligence::EMBEDDING_DIM`. Surfaced so the
    /// devtool can flag a mismatch when a different embedder
    /// would be wired in.
    pub embedding_dim: u32,
    /// Number of project-local databases under
    /// [`PROJECT_NAMESPACE`]. Zero when no project has bootstrapped
    /// its intelligence schema yet.
    pub project_count: u32,
}

/// One row in the per-project inventory table the devtool renders
/// in its Status tab.
#[derive(Debug, Clone, Serialize, Type)]
pub struct ProjectIntel {
    /// Project slug — the `SurrealDB` database name under
    /// [`PROJECT_NAMESPACE`]. Derived from the project root path
    /// via `cortex::intelligence::slug_for_cwd`.
    pub slug: String,
    /// Number of rows in this project's `memories` table.
    pub memory_count: u64,
    /// Number of rows in this project's `rro_archive` table.
    pub archive_count: u64,
}

/// Header status for the intelligence devtool.
///
/// # Errors
/// - Platform is still booting.
/// - Graph service is not available (Surreal not booted).
/// - Surreal `INFO FOR NS` query fails.
#[tauri::command]
#[specta::specta]
pub async fn intel_status(state: State<'_, PlatformState>) -> Result<IntelStatus, String> {
    let platform = get_platform!(state)?;
    let graph = platform
        .graph()
        .ok_or_else(|| "Graph service not available".to_string())?;
    let adapter = graph.adapter();
    let projects = adapter
        .list_databases_in_ns(PROJECT_NAMESPACE)
        .await
        .map_err(|e| format!("{e:#}"))?;
    Ok(IntelStatus {
        connector_kind: "embedded-surrealkv".to_string(),
        embedding_dim: u32::try_from(EMBEDDING_DIM).unwrap_or(u32::MAX),
        project_count: u32::try_from(projects.len()).unwrap_or(u32::MAX),
    })
}

/// Per-project memory + archive counts.
///
/// Returns one [`ProjectIntel`] per database under
/// [`PROJECT_NAMESPACE`]. Empty vector when no project has
/// bootstrapped its intelligence schema yet.
///
/// # Errors
/// - Platform is still booting.
/// - Graph service is not available.
/// - Surreal queries fail.
#[tauri::command]
#[specta::specta]
pub async fn intel_list_projects(
    state: State<'_, PlatformState>,
) -> Result<Vec<ProjectIntel>, String> {
    let platform = get_platform!(state)?;
    let graph = platform
        .graph()
        .ok_or_else(|| "Graph service not available".to_string())?;
    let adapter = graph.adapter();

    let slugs = adapter
        .list_databases_in_ns(PROJECT_NAMESPACE)
        .await
        .map_err(|e| format!("{e:#}"))?;

    let mut out = Vec::with_capacity(slugs.len());
    for slug in slugs {
        // Counts default to zero on table-undefined; the devtool
        // surfaces the row regardless so the operator sees the
        // bootstrapped namespace even before any memory is saved.
        let memory_count = adapter
            .count_in_ns(PROJECT_NAMESPACE, &slug, "memories")
            .await
            .map_err(|e| format!("{e:#}"))?;
        let archive_count = adapter
            .count_in_ns(PROJECT_NAMESPACE, &slug, "rro_archive")
            .await
            .map_err(|e| format!("{e:#}"))?;
        out.push(ProjectIntel {
            slug,
            memory_count,
            archive_count,
        });
    }
    Ok(out)
}

/// Infer the capability bucket (`chat` / `rag` / `voice` / `vision`)
/// for a downloadable model filename.
///
/// Wraps `model_loader::infer_download_folder` — the keyword SSOT
/// that routes model files to their capability bucket. Surfaced for
/// the model-downloader UI's preview ("this filename → RAG") and
/// for the intelligence devtool's Debug tab so an operator can
/// verify how a filename WOULD be classified before downloading.
///
/// Pure CPU work, no I/O — runs synchronously inside the async
/// command body. Always available in `devpulse_desktop_backend`
/// because the engine dep enables `candle` unconditionally.
///
/// # Errors
/// Never errors today; the `Result` shape matches the rest of the
/// command surface and reserves room for a future failure mode
/// (e.g. quarantine flag on a known-bad filename).
#[tauri::command]
#[specta::specta]
#[allow(clippy::needless_pass_by_value)] // Tauri command convention
pub async fn infer_capability_bucket(filename: String) -> Result<String, String> {
    Ok(infer_download_folder(&filename).to_string())
}

/// Request shape for [`intel_save_memory`].
///
/// Embedding is supplied by the caller so this command can ship
/// before the chat → Burn-embedder hook lands. Future "capture this
/// chat turn" verbs will compose this command on the engine side
/// after running the text through the active embedder.
#[derive(Debug, Clone, serde::Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct IntelSaveMemoryRequest {
    /// Project slug — the `SurrealDB` database name under the
    /// `projects` namespace. Derive on the frontend via the
    /// `intel_list_projects` output or hardcode for single-project
    /// dev flows.
    pub project_slug: String,
    /// Verbatim memory text (~2 KB practical max).
    pub text: String,
    /// Pre-computed embedding. MUST be [`EMBEDDING_DIM`] long; any
    /// other length is rejected up front rather than corrupting the
    /// HNSW index downstream.
    pub embedding: Vec<f32>,
    /// `"Prompt"` (user input) or `"Response"` (assistant reply) or
    /// `"Reflection"` (summary). Passed verbatim as a serde tag —
    /// see [`MemoryKind`].
    pub kind: MemoryKind,
    /// Priority hint `0..=10` blended into recall scoring.
    pub priority: u8,
}

/// Persist a memory row into the project's intelligence store.
///
/// Returns the connector-assigned memory id (typically a `UUIDv7` the
/// command generates). Idempotent at the connector layer when the
/// connector dedupes by embedding similarity.
///
/// # Errors
///
/// - Platform is still booting.
/// - Graph service is not available (Surreal not booted).
/// - `embedding.len() != EMBEDDING_DIM` (rejected before the write).
/// - Connector write failed.
#[tauri::command]
#[specta::specta]
pub async fn intel_save_memory(
    state: State<'_, PlatformState>,
    request: IntelSaveMemoryRequest,
) -> Result<String, String> {
    if request.embedding.len() != EMBEDDING_DIM {
        return Err(format!(
            "embedding dim {} != EMBEDDING_DIM ({EMBEDDING_DIM})",
            request.embedding.len()
        ));
    }
    let platform = get_platform!(state)?;
    let graph = platform
        .graph()
        .ok_or_else(|| "Graph service not available".to_string())?;
    let adapter = graph.adapter();

    // SurrealAdapter implements `IntelligenceStore` (per
    // kernel/devpulse-clyffy/src/cortex/persistence/surreal/intelligence_impl.rs).
    // Reference-cast via the trait object so future connector swaps
    // route through the same call site unchanged.
    let store: &dyn IntelligenceStore = adapter.as_ref();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| i64::try_from(d.as_secs()).unwrap_or(i64::MAX));
    let record = MemoryRecord {
        id: format!("mem-{}", uuid::Uuid::new_v4()),
        text: request.text,
        embedding: request.embedding,
        kind: request.kind,
        priority: request.priority,
        created_at: now,
        updated_at: now,
    };

    store
        .save_memory(&request.project_slug, &record)
        .await
        .map_err(|e| format!("{e:#}"))
}
