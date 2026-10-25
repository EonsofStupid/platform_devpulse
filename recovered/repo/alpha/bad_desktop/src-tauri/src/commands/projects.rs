//! Project commands - workspace management
//!
//! Commands:
//! - list_projects, add_project, remove_project
//! - select_project, get_selected_project
//! - browse_folder (native dialog)
//! - index_project (with progress events)

use crate::state::AppState;
use crate::types::{IndexProgressEvent, IndexingResult};
use engine::Project;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_dialog::DialogExt;

/// List all registered projects
#[tauri::command]
pub async fn list_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let engine = state.engine().await?;
    Ok(engine.projects.list().await)
}

/// Add a new project by path
#[tauri::command]
pub async fn add_project(path: String, state: State<'_, AppState>) -> Result<Project, String> {
    let engine = state.engine().await?;
    engine.projects.add(&path).await.map_err(|e| e.to_string())
}

/// Remove a project
#[tauri::command]
pub async fn remove_project(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine
        .projects
        .remove(&id)
        .await
        .map_err(|e| e.to_string())
}

/// Select a project as active
#[tauri::command]
pub async fn select_project(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine
        .projects
        .select(&id)
        .await
        .map_err(|e| e.to_string())
}

/// Get selected project
#[tauri::command]
pub async fn get_selected_project(state: State<'_, AppState>) -> Result<Option<Project>, String> {
    let engine = state.engine().await?;
    Ok(engine.projects.selected().await)
}

/// Browse for a folder using native dialog
#[tauri::command]
pub async fn browse_folder(app: AppHandle) -> Result<Option<String>, String> {
    let folder = app.dialog().file().blocking_pick_folder();
    Ok(folder.map(|p| p.to_string()))
}

/// Index a project - walks files, chunks code, embeds, stores to RRO
/// Emits 'indexing-progress' events to frontend
#[tauri::command]
pub async fn index_project(
    project_id: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<IndexingResult, String> {
    let engine = state.engine().await?;

    // Verify project exists
    let _project = engine
        .projects
        .get(&project_id)
        .await
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    // Emit initial progress
    let _ = app.emit(
        "indexing-progress",
        IndexProgressEvent {
            stage: "scanning".to_string(),
            current: 0,
            total: 0,
            files_scanned: 0,
            chunks_processed: 0,
            error: None,
        },
    );

    // Clone app handle for the closure
    let app_clone = app.clone();

    // Start indexing
    match engine
        .index_project(&project_id, move |progress| {
            let stage_str = match &progress.stage {
                engine::IndexStage::Scanning => "scanning",
                engine::IndexStage::Chunking => "chunking",
                engine::IndexStage::Embedding => "embedding",
                engine::IndexStage::Uploading => "uploading",
                engine::IndexStage::Complete => "complete",
                engine::IndexStage::Error => "error",
            };
            let _ = app_clone.emit(
                "indexing-progress",
                IndexProgressEvent {
                    stage: stage_str.to_string(),
                    current: progress.current as usize,
                    total: progress.total as usize,
                    files_scanned: progress.files_scanned as usize,
                    chunks_processed: progress.chunks_processed as usize,
                    error: None,
                },
            );
        })
        .await
    {
        Ok(stats) => {
            // Emit completion
            let _ = app.emit(
                "indexing-progress",
                IndexProgressEvent {
                    stage: "complete".to_string(),
                    current: stats.points_uploaded as usize,
                    total: stats.points_uploaded as usize,
                    files_scanned: stats.files_scanned as usize,
                    chunks_processed: stats.chunks_created as usize,
                    error: None,
                },
            );

            Ok(IndexingResult {
                files_scanned: stats.files_scanned as usize,
                chunks_created: stats.chunks_created as usize,
                embeddings_generated: stats.embeddings_generated as usize,
                points_uploaded: stats.points_uploaded as usize,
                duration_ms: stats.duration_ms,
                errors: stats.errors,
            })
        }
        Err(e) => {
            // Emit error
            let _ = app.emit(
                "indexing-progress",
                IndexProgressEvent {
                    stage: "error".to_string(),
                    current: 0,
                    total: 0,
                    files_scanned: 0,
                    chunks_processed: 0,
                    error: Some(e.to_string()),
                },
            );
            Err(e.to_string())
        }
    }
}
