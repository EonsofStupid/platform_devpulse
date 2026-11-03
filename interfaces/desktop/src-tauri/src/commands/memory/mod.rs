//! Your memory — thin wrappers over the engine's `memory` facade
//! (`devpulse_engine::platform::memory`): reading, writing and deleting the
//! notes your agents can read. No logic here.

use std::sync::Arc;

use crate::commands::_util::CommandError;
use crate::state::PlatformState;
use devpulse_engine::platform::memory::{Memory, MemoryNote};
use tauri::State;

fn memory(state: &PlatformState) -> Result<Arc<Memory>, CommandError> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| CommandError::not_configured("Platform is still booting"))?;
    platform
        .memory()
        .cloned()
        .ok_or_else(|| CommandError::not_configured("Memory is not available"))
}

/// Your own notes (`project_id` absent) or one project's, newest first.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn memory_notes(
    project_id: Option<String>,
    state: State<'_, PlatformState>,
) -> Result<Vec<MemoryNote>, CommandError> {
    Ok(memory(&state)?.notes(project_id.as_deref()).await?)
}

/// Write a note.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn memory_save(
    project_id: Option<String>,
    label: String,
    body: String,
    state: State<'_, PlatformState>,
) -> Result<MemoryNote, CommandError> {
    Ok(memory(&state)?
        .save(project_id.as_deref(), &label, &body)
        .await?)
}

/// Delete a note; says whether there was one.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn memory_remove(
    project_id: Option<String>,
    label: String,
    state: State<'_, PlatformState>,
) -> Result<bool, CommandError> {
    Ok(memory(&state)?
        .remove(project_id.as_deref(), &label)
        .await?)
}
