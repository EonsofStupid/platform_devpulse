//! Cortex governance-graph commands.
//!
//! Operator-authored reasoning trees per `CORTEX.md` §4. B-1 ships
//! the foundation slice — `cortex_thought_create` and
//! `cortex_thought_load_branch`. Edge linking lands in B-2; the
//! visualizer lands in B-3.

use crate::state::PlatformState;
use devpulse_engine::platform::cortex::{thought_create, thought_load_branch, ThoughtRecord};
use devpulse_engine::platform::RroState;
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
        graph,
        &project_id,
        &branch_id,
        &content,
        rro_state,
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

    thought_load_branch(graph, &project_id, &branch_id)
        .await
        .map_err(|e| format!("{e:#}"))
}
