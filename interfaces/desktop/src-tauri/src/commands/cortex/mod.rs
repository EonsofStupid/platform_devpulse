//! Cortex governance-graph commands.
//!
//! Operator-authored reasoning trees per `CORTEX.md` §4. B-1 ships
//! the foundation slice — `cortex_thought_create` and
//! `cortex_thought_load_branch`. Edge linking lands in B-2; the
//! visualizer lands in B-3.

use crate::state::PlatformState;
use devpulse_engine::platform::{
    thought_create, thought_load_branch, RroState, SwapStats, ThoughtRecord,
};
use std::path::PathBuf;
use tauri::State;

macro_rules! get_platform {
    ($state:expr) => {
        $state
            .platform
            .load_full()
            .ok_or_else(|| "Platform is still booting".to_string())
    };
}

/// Create a new thought in the operator's reasoning tree.
///
/// Writes to the user namespace under the given `project_id` per
/// `CORTEX.md` §4.5. Returns the persisted `ThoughtRecord` whose `id`
/// is the canonical Surreal record reference for subsequent edges.
///
/// # Errors
/// - Platform is still booting.
/// - User graph service is not available.
/// - Surreal write fails.
#[tauri::command]
#[specta::specta]
pub async fn cortex_thought_create(
    state: State<'_, PlatformState>,
    project_id: String,
    branch_id: String,
    content: String,
    rro_state: RroState,
    depth: i32,
    proximity: f32,
) -> Result<ThoughtRecord, String> {
    let platform = get_platform!(state)?;
    let graph = platform
        .user_graph()
        .ok_or_else(|| "User graph not available".to_string())?;

    thought_create(
        graph.handle(),
        &project_id,
        &branch_id,
        &content,
        rro_state.as_str(),
        depth,
        proximity,
    )
    .await
    .map_err(|e| format!("{e:#}"))
}

/// Load every thought in a branch, ordered by depth ascending.
///
/// Returns an empty vector for unknown branches — never an error.
///
/// # Errors
/// - Platform is still booting.
/// - User graph service is not available.
/// - Surreal query fails.
#[tauri::command]
#[specta::specta]
pub async fn cortex_thought_load_branch(
    state: State<'_, PlatformState>,
    project_id: String,
    branch_id: String,
) -> Result<Vec<ThoughtRecord>, String> {
    let platform = get_platform!(state)?;
    let graph = platform
        .user_graph()
        .ok_or_else(|| "User graph not available".to_string())?;

    thought_load_branch(graph.handle(), &project_id, &branch_id)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Hot-swap the live Burn encoder weights to a safetensors file on disk.
///
/// Drives the RRD daemon through one full
/// `pause → drain → load → validate → swap → resume` cycle. Returns the
/// structured [`SwapStats`] (renamed `SwapReport` on the TS side via the
/// `swap.svc.ts` mirror) on a healthy swap; on failure the live encoder
/// is unchanged and the daemon is resumed before the error returns.
///
/// The matching UI surface is the `SwapDialog` under
/// `interfaces/desktop/src/lib/devtools/clyffy/reasoning/rrd/feature`.
/// First-load (turning the slot from cold to ready) goes through the
/// normal `load_slot` path on `rag.embedder`; only the second-and-later
/// path uses this command.
///
/// # Errors
/// - Platform is still booting.
/// - Model Loader service is disabled or burn feature is off.
/// - First-load has never run (daemon not constructed yet).
/// - Source file missing / unreadable / wrong format.
/// - Validate forward returned non-finite output (live unchanged).
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state), fields(weights_path = %weights_path))]
pub async fn cortex_swap_encoder(
    state: State<'_, PlatformState>,
    weights_path: String,
) -> Result<SwapStats, String> {
    let platform = get_platform!(state)?;
    let loader = platform
        .model_loader()
        .cloned()
        .ok_or_else(|| "Model Loader not available (disabled or failed to boot)".to_string())?;

    loader
        .burn_swap_encoder(PathBuf::from(weights_path))
        .await
        .map_err(|e| format!("{e:#}"))
}
