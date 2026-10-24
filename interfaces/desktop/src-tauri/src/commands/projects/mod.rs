//! Project intents — thin wrappers over the engine's projects service
//! (`devpulse_engine::platform::projects`), which validates every intent,
//! writes to Turso, mirrors to the graph and publishes the `projects` state
//! every window renders. No logic here.

use std::sync::Arc;

use crate::state::PlatformState;
use devpulse_engine::platform::projects::{
    AddReferenceInput, CreateProjectInput, Project, ProjectReference, Projects,
};
use tauri::State;

/// The engine's projects service, once the platform has booted with the user
/// database open.
pub(crate) fn service(state: &PlatformState) -> Result<Arc<Projects>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_owned())?;
    platform.projects().cloned().ok_or_else(|| {
        "Projects are unavailable: the user database is not open (see the boot log)".to_owned()
    })
}

fn report(e: &anyhow::Error) -> String {
    format!("{e:#}")
}

/// Register a folder as a project, in place. A folder removed earlier comes
/// back; a folder that already is a live project is refused.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn create_project(
    state: State<'_, PlatformState>,
    input: CreateProjectInput,
) -> Result<Project, String> {
    service(&state)?.create(input).await.map_err(|e| report(&e))
}

/// Live projects, most recently used first (removed ones too when asked).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn list_projects(
    state: State<'_, PlatformState>,
    include_archived: Option<bool>,
) -> Result<Vec<Project>, String> {
    service(&state)?
        .list(include_archived.unwrap_or(false))
        .await
        .map_err(|e| report(&e))
}

/// One project by id; `None` when there is none.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_project(
    state: State<'_, PlatformState>,
    id: String,
) -> Result<Option<Project>, String> {
    service(&state)?.get(&id).await.map_err(|e| report(&e))
}

/// Remove a project (its folder can be registered again). When it was the
/// active one, the most recently used remaining project becomes active.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn delete_project(state: State<'_, PlatformState>, id: String) -> Result<bool, String> {
    service(&state)?.remove(&id).await.map_err(|e| report(&e))
}

/// Bring a removed project back.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn restore_project(state: State<'_, PlatformState>, id: String) -> Result<bool, String> {
    service(&state)?.restore(&id).await.map_err(|e| report(&e))
}

/// The active project, if any.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_active_project(
    state: State<'_, PlatformState>,
) -> Result<Option<Project>, String> {
    service(&state)?.active().await.map_err(|e| report(&e))
}

/// Make a live project the active one.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn set_active_project(
    state: State<'_, PlatformState>,
    id: String,
) -> Result<Project, String> {
    service(&state)?
        .set_active(&id)
        .await
        .map_err(|e| report(&e))
}

/// Leave no project active.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn clear_active_project(state: State<'_, PlatformState>) -> Result<(), String> {
    service(&state)?
        .clear_active()
        .await
        .map_err(|e| report(&e))
}

/// Link a read-only directory to a project.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn add_project_reference(
    state: State<'_, PlatformState>,
    input: AddReferenceInput,
) -> Result<ProjectReference, String> {
    service(&state)?
        .add_reference(input)
        .await
        .map_err(|e| report(&e))
}

/// A project's reference directories, oldest first.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn list_project_references(
    state: State<'_, PlatformState>,
    project_id: String,
) -> Result<Vec<ProjectReference>, String> {
    service(&state)?
        .references(&project_id)
        .await
        .map_err(|e| report(&e))
}

/// Unlink a reference directory.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn remove_project_reference(
    state: State<'_, PlatformState>,
    id: String,
) -> Result<bool, String> {
    service(&state)?
        .remove_reference(&id)
        .await
        .map_err(|e| report(&e))
}
