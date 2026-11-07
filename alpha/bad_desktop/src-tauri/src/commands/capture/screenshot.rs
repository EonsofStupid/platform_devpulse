use crate::commands::capture::types::{CaptureRegion, CaptureResult, ScreenInfo};
use arboard::Clipboard;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use image::ImageFormat;
use screenshots::Screen;
use std::io::Cursor;

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

/// Capture a specific screen by ID
#[tauri::command]
pub async fn capture_screen_by_id(screen_id: u32) -> Result<CaptureResult, String> {
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;

    let screen = screens
        .get(screen_id as usize)
        .ok_or_else(|| format!("Screen {} not found", screen_id))?;

    let image = screen
        .capture()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    let id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().timestamp_millis();

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
