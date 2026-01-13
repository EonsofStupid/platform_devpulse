//! Project commands - workspace/project management
//!
//! Commands:
//! - list_projects: Get all projects
//! - add_project: Add new project
//! - set_active_project: Set active project
//! - remove_project: Remove project

use crate::AppState;
use tauri::State;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ProjectInfo {
    pub id: String,
    pub name: String,
    pub path: String,
    pub active: bool,
}

#[tauri::command]
pub async fn list_projects(_state: State<'_, AppState>) -> Result<Vec<ProjectInfo>, String> {
    // Stub - will wire to engine.projects.list() later
    Ok(vec![])
}

#[tauri::command]
pub async fn add_project(
    name: String,
    path: String,
    _state: State<'_, AppState>,
) -> Result<ProjectInfo, String> {
    // Stub - will wire to engine.projects.add() later
    Ok(ProjectInfo {
        id: format!("proj_{}", chrono::Utc::now().timestamp()),
        name,
        path,
        active: false,
    })
}

#[tauri::command]
pub async fn set_active_project(
    project_id: String,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    // Stub - will wire to engine.projects.set_active() later
    println!("Setting active project to: {}", project_id);
    Ok(())
}

#[tauri::command]
pub async fn remove_project(
    project_id: String,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    // Stub - will wire to engine.projects.remove() later
    println!("Removing project: {}", project_id);
    Ok(())
}
