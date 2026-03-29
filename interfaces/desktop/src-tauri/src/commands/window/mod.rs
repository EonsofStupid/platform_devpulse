//! Window management commands.
//!
//! Commands:
//! - `open_chat_window`: Open or focus the Maestro Chat window
//! - `close_window`: Close a window by label
//! - `focus_window`: Focus a window by label

use tauri::Manager;

/// Open or focus the Maestro Chat child window.
///
/// # Errors
/// Returns an error string if the window cannot be focused or created.
#[tauri::command]
#[specta::specta]
pub async fn open_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("chat") {
        window.set_focus().map_err(|e| e.to_string())?;
    } else {
        tauri::WebviewWindowBuilder::new(&app, "chat", tauri::WebviewUrl::App("/chat".into()))
            .title("Maestro Chat")
            .inner_size(450.0, 600.0)
            .decorations(false)
            .transparent(true)
            .always_on_top(true)
            .build()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Close a window by its label.
///
/// # Errors
/// Returns an error string if the window cannot be closed.
#[tauri::command]
#[specta::specta]
pub async fn close_window(label: String, app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Focus a window by its label.
///
/// # Errors
/// Returns an error string if the window cannot be focused.
#[tauri::command]
#[specta::specta]
pub async fn focus_window(label: String, app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}
