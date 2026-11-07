//! Screen capture module - screenshots and region capture
//!
//! Provides:
//! - Full screen capture
//! - Region capture (x, y, width, height)
//! - Window capture (by title)
//! - Copy to clipboard
//! - Save to file (global or project-specific)

use arboard::Clipboard;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use image::ImageFormat;
use screenshots::Screen;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::path::PathBuf;
use tauri::{Manager, State};

use crate::AppState;

/// Capture result returned to frontend
#[derive(Debug, Clone, Serialize)]
pub struct CaptureResult {
    /// Unique ID for this capture
    pub id: String,
    /// Base64-encoded PNG data
    pub data_base64: String,
    /// Width in pixels
    pub width: u32,
    /// Height in pixels
    pub height: u32,
    /// Timestamp (Unix ms)
    pub timestamp: i64,
    /// Optional file path if saved
    pub file_path: Option<String>,
}

/// Region for capture
#[derive(Debug, Clone, Deserialize)]
pub struct CaptureRegion {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

/// Save options for captures
#[derive(Debug, Clone, Deserialize)]
pub struct SaveOptions {
    /// Save globally or to project
    pub scope: SaveScope,
    /// Project ID if scope is Project
    pub project_id: Option<String>,
    /// Optional custom filename
    pub filename: Option<String>,
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SaveScope {
    Global,
    Project,
}

/// Capture the entire screen (primary monitor)
#[tauri::command]
pub async fn capture_screen() -> Result<CaptureResult, String> {
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;

    let screen = screens.first().ok_or("No screens found")?;

    let image = screen
        .capture()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    let id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().timestamp_millis();

    // Convert to PNG and base64
    let mut buffer = Cursor::new(Vec::new());
    image
        .write_to(&mut buffer, ImageFormat::Png)
        .map_err(|e| format!("Failed to encode PNG: {}", e))?;

    let data_base64 = STANDARD.encode(buffer.into_inner());

    Ok(CaptureResult {
        id,
        data_base64,
        width: image.width(),
        height: image.height(),
        timestamp,
        file_path: None,
    })
}

/// Capture a specific region of the screen
#[tauri::command]
pub async fn capture_region(region: CaptureRegion) -> Result<CaptureResult, String> {
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;

    let screen = screens.first().ok_or("No screens found")?;

    let image = screen
        .capture_area(region.x, region.y, region.width, region.height)
        .map_err(|e| format!("Failed to capture region: {}", e))?;

    let id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().timestamp_millis();

    // Convert to PNG and base64
    let mut buffer = Cursor::new(Vec::new());
    image
        .write_to(&mut buffer, ImageFormat::Png)
        .map_err(|e| format!("Failed to encode PNG: {}", e))?;

    let data_base64 = STANDARD.encode(buffer.into_inner());

    Ok(CaptureResult {
        id,
        data_base64,
        width: image.width(),
        height: image.height(),
        timestamp,
        file_path: None,
    })
}

/// List all available screens/monitors
#[tauri::command]
pub async fn list_screens() -> Result<Vec<ScreenInfo>, String> {
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;

    Ok(screens
        .iter()
        .enumerate()
        .map(|(i, s)| {
            let info = s.display_info;
            ScreenInfo {
                id: i as u32,
                name: format!("Display {}", i + 1),
                x: info.x,
                y: info.y,
                width: info.width,
                height: info.height,
                is_primary: info.is_primary,
                scale_factor: info.scale_factor,
            }
        })
        .collect())
}

#[derive(Debug, Clone, Serialize)]
pub struct ScreenInfo {
    pub id: u32,
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub is_primary: bool,
    pub scale_factor: f32,
}

/// Copy image data to clipboard
#[tauri::command]
pub async fn copy_capture_to_clipboard(data_base64: String) -> Result<(), String> {
    // Decode base64 to bytes
    let png_bytes = STANDARD
        .decode(&data_base64)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Load as image
    let img = image::load_from_memory(&png_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    // Convert to RGBA
    let rgba = img.to_rgba8();

    // Create clipboard image
    let clipboard_img = arboard::ImageData {
        width: rgba.width() as usize,
        height: rgba.height() as usize,
        bytes: rgba.into_raw().into(),
    };

    // Copy to clipboard
    let mut clipboard = Clipboard::new().map_err(|e| format!("Failed to open clipboard: {}", e))?;

    clipboard
        .set_image(clipboard_img)
        .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;

    Ok(())
}

/// Save capture to file
#[tauri::command]
pub async fn save_capture(
    data_base64: String,
    options: SaveOptions,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    // Decode base64 to bytes
    let png_bytes = STANDARD
        .decode(&data_base64)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Determine save path
    let base_dir = match options.scope {
        SaveScope::Global => {
            // Save to app data directory
            let app_data = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data dir: {}", e))?;
            app_data.join("captures")
        }
        SaveScope::Project => {
            // Save to project directory
            let project_id = options.project_id.ok_or("Project ID required for project scope")?;

            let engine = state.engine().await?;
            let project = engine
                .projects
                .get(&project_id)
                .await
                .ok_or_else(|| format!("Project not found: {}", project_id))?;

            PathBuf::from(&project.path).join(".devpulse").join("captures")
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

    // Write file
    std::fs::write(&file_path, &png_bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}

/// List saved captures (global or project)
#[tauri::command]
pub async fn list_captures(
    scope: SaveScope,
    project_id: Option<String>,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<Vec<SavedCapture>, String> {
    let base_dir = match scope {
        SaveScope::Global => {
            let app_data = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data dir: {}", e))?;
            app_data.join("captures")
        }
        SaveScope::Project => {
            let project_id = project_id.ok_or("Project ID required for project scope")?;

            let engine = state.engine().await?;
            let project = engine
                .projects
                .get(&project_id)
                .await
                .ok_or_else(|| format!("Project not found: {}", project_id))?;

            PathBuf::from(&project.path).join(".devpulse").join("captures")
        }
    };

    if !base_dir.exists() {
        return Ok(vec![]);
    }

    let mut captures = Vec::new();

    let entries = std::fs::read_dir(&base_dir)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().map(|e| e == "png").unwrap_or(false) {
            let metadata = std::fs::metadata(&path).ok();
            let created = metadata
                .and_then(|m| m.created().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_millis() as i64)
                .unwrap_or(0);

            captures.push(SavedCapture {
                id: path.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_default(),
                filename: path.file_name().map(|s| s.to_string_lossy().to_string()).unwrap_or_default(),
                path: path.to_string_lossy().to_string(),
                created_at: created,
            });
        }
    }

    // Sort by created time, newest first
    captures.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(captures)
}

#[derive(Debug, Clone, Serialize)]
pub struct SavedCapture {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub created_at: i64,
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
