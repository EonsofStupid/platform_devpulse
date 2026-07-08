//! Intelligence-layer commands — Tier-2, served by headless Clyffy.
//!
//! Backs the `/devtools/clyffy/memory/intelligence` devtool. The intelligence
//! store (HNSW-indexed per-project `memories`), its embedder, and the
//! model-download keyword classifier are all **Clyffy's** — headless, on the
//! GB10 — not local DevPulse services. These commands are
//! **connection-gated**: when Clyffy is disconnected DevPulse returns the
//! honest "connect Clyffy" state; when connected they proxy to Clyffy's
//! `/v1/graph` (intelligence) + `/v1/loader` (classifier) surfaces over the
//! gb10-client wire. Available once the AI-layer connection is active.
//!
//! The response shapes below (`IntelStatus`, `ProjectIntel`) are the devtool's
//! own presentation types — desktop-local, not wire types. The [`MemoryKind`]
//! tag on a save request is the wire-contract type (`clyffyos-wire`),
//! re-exported via `devpulse-gb10-client` — one source of truth, no parallel
//! DTOs. The live endpoints are served by `clyffyd`; until they land on the
//! connected build, the connected path reports them as not-yet-served
//! (deferred, not retired).
#![expect(
    clippy::missing_errors_doc,
    clippy::needless_pass_by_value,
    reason = "Tauri command module — each Result-returning command is a thin connection-gated shell: it fails with the standalone 'connect Clyffy' message when disconnected, or the 'endpoint not yet served' message when connected but clyffyd has not exposed the surface. Args (Tauri State + deserialized payloads) are framework-mandated by-value and used only by-ref while gated; they are consumed once forwarded over the wire, so needless_pass_by_value is a false-positive here (the #![expect] warns to remove itself once clyffyd lands and the args are used)."
)]

use crate::state::ClyffyConnectionState;
use devpulse_gb10_client::{ConnectionState, MemoryKind};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// Standalone answer (Clyffy disconnected) — intelligence is a Tier-2 capability.
const INTEL_TIER2_UNAVAILABLE: &str = "Intelligence store unavailable — per-project memory + the embedder are Tier-2 capabilities served by Clyffy over the gb10-client wire. Connect Clyffy to enable.";

/// Connected, but this Clyffy endpoint does not yet serve the intelligence
/// surface (deferred, not retired — lands when `clyffyd` exposes `/v1/graph`).
const INTEL_ENDPOINT_PENDING: &str =
    "Intelligence query pending — connected to Clyffy, but its advertised capability does not include the intelligence store yet.";

/// Connected, but this Clyffy endpoint does not yet serve the model-loader
/// classifier (deferred, not retired — lands when `clyffyd` exposes `/v1/loader`).
const LOADER_ENDPOINT_PENDING: &str =
    "Capability classification pending — connected to Clyffy, but its advertised capability does not include the model-loader classifier yet.";

/// Connection gate: `Ok` only when Clyffy is connected; the honest standalone
/// `Err` otherwise.
fn require_connected(clyffy: &State<'_, ClyffyConnectionState>) -> Result<(), String> {
    match clyffy.current() {
        ConnectionState::Connected { .. } => Ok(()),
        ConnectionState::Disconnected | ConnectionState::Connecting { .. } => {
            Err(INTEL_TIER2_UNAVAILABLE.to_string())
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Presentation DTOs (desktop-local)
// ═══════════════════════════════════════════════════════════════

/// Header status surfaced in the devtool's Status tab.
#[derive(Debug, Clone, Serialize, Type)]
pub struct IntelStatus {
    /// Backing connector identifier reported by Clyffy (e.g.
    /// `"embedded-surrealkv"`). Computed from the connected capability, never
    /// hardcoded.
    pub connector_kind: String,
    /// HNSW embedding dimension of Clyffy's active embedder. Surfaced so the
    /// devtool can flag a mismatch.
    pub embedding_dim: u32,
    /// Number of project-local databases Clyffy tracks. Zero when no project
    /// has bootstrapped its intelligence schema yet.
    pub project_count: u32,
}

/// One row in the per-project inventory table the devtool renders in its
/// Status tab.
#[derive(Debug, Clone, Serialize, Type)]
pub struct ProjectIntel {
    /// Project slug — the database name in Clyffy's `projects` namespace.
    pub slug: String,
    /// Number of rows in this project's `memories` table.
    pub memory_count: u64,
    /// Number of rows in this project's `rro_archive` table.
    pub archive_count: u64,
}

/// Request shape for [`intel_save_memory`].
///
/// The embedding is supplied by the caller so the save can be composed before
/// the chat → embedder hook lands; when connected, Clyffy validates it against
/// its active embedder dimension.
#[derive(Debug, Clone, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct IntelSaveMemoryRequest {
    /// Project slug — the database name in Clyffy's `projects` namespace.
    pub project_slug: String,
    /// Verbatim memory text (~2 KB practical max).
    pub text: String,
    /// Pre-computed embedding. Length MUST match Clyffy's active embedder
    /// dimension; validated Clyffy-side before the write.
    pub embedding: Vec<f32>,
    /// Memory classification blended into recall scoring. See [`MemoryKind`].
    pub kind: MemoryKind,
    /// Priority hint `0..=10` blended into recall scoring.
    pub priority: u8,
}

// ═══════════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════════

/// Header status for the intelligence devtool, from headless Clyffy.
#[tauri::command]
#[specta::specta]
pub fn intel_status(clyffy: State<'_, ClyffyConnectionState>) -> Result<IntelStatus, String> {
    require_connected(&clyffy)?;
    Err(INTEL_ENDPOINT_PENDING.to_string())
}

/// Per-project memory + archive counts from headless Clyffy.
#[tauri::command]
#[specta::specta]
pub fn intel_list_projects(
    clyffy: State<'_, ClyffyConnectionState>,
) -> Result<Vec<ProjectIntel>, String> {
    require_connected(&clyffy)?;
    Err(INTEL_ENDPOINT_PENDING.to_string())
}

/// Infer the capability bucket (`chat` / `rag` / `voice` / `vision`) for a
/// downloadable model filename — Clyffy owns the model catalog + keyword SSOT.
#[tauri::command]
#[specta::specta]
pub fn infer_capability_bucket(
    clyffy: State<'_, ClyffyConnectionState>,
    filename: String,
) -> Result<String, String> {
    require_connected(&clyffy)?;
    let _ = filename;
    Err(LOADER_ENDPOINT_PENDING.to_string())
}

/// Persist a memory row into the project's intelligence store on Clyffy.
///
/// Returns the connector-assigned memory id. Idempotent at Clyffy's connector
/// layer when it dedupes by embedding similarity.
#[tauri::command]
#[specta::specta]
pub fn intel_save_memory(
    clyffy: State<'_, ClyffyConnectionState>,
    request: IntelSaveMemoryRequest,
) -> Result<String, String> {
    require_connected(&clyffy)?;
    let _ = request;
    Err(INTEL_ENDPOINT_PENDING.to_string())
}
