//! Cockpit window management commands.
//!
//! Commands:
//! - `open_window`: Open or focus a window by role
//! - `close_child_window`: Close a window by role
//! - `list_windows`: Get all currently open windows
//! - `focus_window`: Focus a window by label
//!
//! Every window is a normal top-level OS window: its own taskbar entry,
//! resizable, draggable and minimizable on its own. None is owned by the
//! main window or forced on top.

pub mod types;

pub use types::{WindowInfo, WindowRole};

use tauri::Manager;

/// Open or focus a window by its role.
///
/// If already open, focuses it.
/// Otherwise spawns a new OS child window with role-derived config.
///
/// # Errors
/// Returns an error string if the window cannot be created or focused.
#[tauri::command]
#[specta::specta]
pub async fn open_window(app: tauri::AppHandle, role: WindowRole) -> Result<WindowInfo, String> {
    let label = role.label();

    // Already open? Focus it.
    if let Some(window) = app.get_webview_window(label) {
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(WindowInfo {
            role: role.clone(),
            label: label.to_string(),
            is_open: true,
        });
    }

    let (width, height) = role.default_size();
    let route = role.route();

    tauri::WebviewWindowBuilder::new(&app, label, tauri::WebviewUrl::App(route.into()))
        .title(role.title())
        .inner_size(width, height)
        .decorations(role.decorations())
        .transparent(role.transparent())
        .build()
        .map_err(|e| e.to_string())?;

    Ok(WindowInfo {
        role,
        label: label.to_string(),
        is_open: true,
    })
}

/// Close a window by its role. Main cannot be closed this way.
///
/// # Errors
/// Returns an error string if the window cannot be closed.
#[tauri::command]
#[specta::specta]
pub async fn close_child_window(app: tauri::AppHandle, role: WindowRole) -> Result<(), String> {
    if role == WindowRole::Main {
        return Err("Cannot close main window via this command".to_string());
    }
    let label = role.label();
    if let Some(window) = app.get_webview_window(label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Get all window roles and whether they are currently open.
///
/// # Errors
/// Infallible — the `Result` shape is preserved for binding parity with
/// the sibling `open_window` / `close_child_window` commands so the TS
/// surface stays uniform.
#[tauri::command]
#[specta::specta]
pub async fn list_windows(app: tauri::AppHandle) -> Result<Vec<WindowInfo>, String> {
    let all_roles = [
        WindowRole::Main,
        WindowRole::Chat,
        WindowRole::KnowledgeViewer,
        WindowRole::ModelLoader,
        WindowRole::DevTools,
    ];

    let mut windows = Vec::new();
    for role in &all_roles {
        let label = role.label();
        let is_open = app.get_webview_window(label).is_some();
        windows.push(WindowInfo {
            role: role.clone(),
            label: label.to_string(),
            is_open,
        });
    }
    Ok(windows)
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

// ═══════════════════════════════════════════════════════════════
// Dev tools toggle
// ═══════════════════════════════════════════════════════════════

/// Toggle the dev tools panel — open if closed, close if open.
///
/// Bound to Ctrl+Shift+Z global shortcut.
///
/// # Errors
/// Returns an error string if the window cannot be created or closed.
#[tauri::command]
#[specta::specta]
pub async fn toggle_devtools(app: tauri::AppHandle) -> Result<(), String> {
    let label = WindowRole::DevTools.label();
    if let Some(window) = app.get_webview_window(label) {
        window.close().map_err(|e| e.to_string())?;
    } else {
        open_window(app, WindowRole::DevTools).await?;
    }
    Ok(())
}
