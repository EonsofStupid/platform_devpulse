use crate::commands::capture::types::{
    CaptureFilters, CaptureResult, SaveOptions, SaveScope, SavedCapture,
};
use crate::state::AppState;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use sha2::{Digest, Sha256};
use shared::types::capture::{CaptureRRO, CaptureScope};
use std::path::PathBuf;
use tauri::Manager;
use uuid::Uuid;

/// Save capture to file
#[tauri::command]
pub async fn save_capture(
    data_base64: String,
    options: SaveOptions,
    app: tauri::AppHandle,
) -> Result<String, String> {
    // Decode base64 to bytes
    let png_bytes = STANDARD
        .decode(&data_base64)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Generate content hash (SHA-256)
    let mut hasher = Sha256::new();
    hasher.update(&png_bytes);
    let content_hash = format!("sha256:{}", hex::encode(hasher.finalize()));

    // Determine save path and scope
    let (base_dir, scope) = match options.scope {
        SaveScope::Global => {
            let app_data = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data dir: {}", e))?;
            (app_data.join("captures"), CaptureScope::Global)
        }
        SaveScope::Project => {
            let project_id_str = options
                .project_id
                .clone()
                .ok_or("Project ID required for project scope")?;
            // Validate UUID
            let _uuid = Uuid::parse_str(&project_id_str)
                .map_err(|_| "Invalid project UUID")?;
            (
                PathBuf::from(format!(".devpulse/captures/{}", project_id_str)),
                CaptureScope::Project,
            )
        }
    };

    // Create directory if needed
    std::fs::create_dir_all(&base_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    // Generate filename
    let filename = options.filename.unwrap_or_else(|| {
        let now = chrono::Local::now();
        format!("capture_{}.png", now.format("%Y%m%d_%H%M%S"))
    });

    let file_path = base_dir.join(&filename);

    // Get dimensions from PNG (using image crate)
    let img = image::load_from_memory(&png_bytes)
        .map_err(|e| format!("Failed to load PNG: {}", e))?;
    let width = img.width();
    let height = img.height();

    // Write file to disk
    std::fs::write(&file_path, &png_bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    // Generate ID
    let id = Uuid::new_v4();

    // Create RRO using the constructor
    let rro = CaptureRRO::new_screenshot(
        id,
        file_path.clone(),
        width,
        height,
        png_bytes.len() as u64,
        content_hash,
        scope,
    );

    // Register with GlobalDb via Engine
    let state = app.state::<AppState>();
    let engine = state.engine().await.map_err(|e| e.to_string())?;
    let db = engine.database();

    // Register
    match db.register_capture(&rro).await {
        Ok(_) => Ok(file_path.to_string_lossy().to_string()),
        Err(e) => {
            // If DB fails, file is still saved
            Err(format!("Saved file but failed to register: {}", e))
        }
    }
}

/// List saved captures (global or project)
#[tauri::command]
pub async fn list_captures(
    filters: CaptureFilters,
    app: tauri::AppHandle,
) -> Result<Vec<SavedCapture>, String> {
    let state = app.state::<AppState>();
    let engine = state.engine().await.map_err(|e| e.to_string())?;
    let db = engine.database();

    // Map filters (scope/project_id filtering could be added later)
    let limit = filters.limit.unwrap_or(50);

    let rros = db
        .list_captures(None, limit) // No tag filter from frontend currently
        .await
        .map_err(|e| format!("Failed to list captures: {}", e))?;

    // Convert RROs to SavedCapture for frontend
    let saved: Vec<SavedCapture> = rros
        .into_iter()
        .map(|rro| SavedCapture {
            id: rro.capture.id.clone(),
            filename: PathBuf::from(&rro.storage.primary_path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string(),
            path: rro.storage.primary_path.clone(),
            width: Some(rro.storage.width),
            height: Some(rro.storage.height),
            file_size: rro.storage.file_size,
            created_at: rro.capture.timestamp.timestamp_millis(),
        })
        .collect();

    Ok(saved)
}

/// Load a capture file as base64
#[tauri::command]
pub async fn load_capture(path: String) -> Result<CaptureResult, String> {
    let path = PathBuf::from(&path);

    if !path.exists() {
        return Err(format!("File not found: {}", path.display()));
    }

    let bytes = std::fs::read(&path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Load image to get dimensions
    let img = image::load_from_memory(&bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    let id = path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    let metadata = std::fs::metadata(&path).ok();
    let timestamp = metadata
        .and_then(|m| m.created().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as i64)
        .unwrap_or_else(|| chrono::Utc::now().timestamp_millis());

    Ok(CaptureResult {
        id,
        data_base64: STANDARD.encode(&bytes),
        width: img.width(),
        height: img.height(),
        timestamp,
        file_path: Some(path.to_string_lossy().to_string()),
    })
}

/// Delete a capture file
#[tauri::command]
pub async fn delete_capture(path: String) -> Result<(), String> {
    let path = PathBuf::from(&path);

    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }

    Ok(())
}

