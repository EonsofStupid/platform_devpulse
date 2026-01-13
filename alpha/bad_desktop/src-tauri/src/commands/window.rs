//! Window commands - multi-window management (Steam-style)
//!
//! Chat window is a SEPARATE independent window:
//! - Own taskbar entry (can be minimized independently)
//! - Lifecycle tied to main via owner relationship (closes when main closes)
//! - NOT a modal/child that restricts interaction
//!
//! Commands:
//! - open_chat_window, close_chat_window, dock_chat_window
//! - minimize_chat_window, toggle_chat_always_on_top
//! - navigate_main_window, focus_main_window, restore_main_window

use tauri::{AppHandle, Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder};

// Platform-specific glass effects
#[cfg(target_os = "windows")]
use window_vibrancy::apply_mica;
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

/// Open chat as Steam-style independent window
///
/// NOT a child window - fully independent with:
/// - Own taskbar presence
/// - Independent minimize/maximize
/// - Owner relationship only (closes when main closes)
#[tauri::command]
pub async fn open_chat_window(app: AppHandle) -> Result<(), String> {
    // Check if chat window already exists
    if let Some(existing) = app.get_webview_window("chat") {
        // Already open - restore and focus it
        if existing.is_minimized().unwrap_or(false) {
            existing.unminimize().map_err(|e| e.to_string())?;
        }
        existing.show().map_err(|e| e.to_string())?;
        existing.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Get main window for positioning reference
    let main = app.get_webview_window("main").ok_or("No main window")?;

    // Create chat as INDEPENDENT window (Steam-style)
    // NO .parent() - this makes it a standalone window with own taskbar entry
    let chat = WebviewWindowBuilder::new(&app, "chat", WebviewUrl::App("/domains/chat".into()))
        .title("Maestro - DevPulse Chat")
        .inner_size(420.0, 700.0)
        .min_inner_size(320.0, 400.0)
        .decorations(true) // TRUE - enable native title bar for minimize/close/drag
        .transparent(false) // FALSE - solid window for performance
        .resizable(true)
        .minimizable(true) // Can minimize to taskbar
        .maximizable(false) // Chat doesn't need maximize
        .closable(true)
        .visible(false) // Start hidden, show after setup
        .skip_taskbar(false) // Show in taskbar (Steam-style)
        // Owner relationship: chat closes when main closes, but is NOT a child
        .owner(&main)
        .map_err(|e| e.to_string())?
        .build()
        .map_err(|e| e.to_string())?;

    // Apply platform glass effect to content area
    #[cfg(target_os = "windows")]
    {
        let _ = apply_mica(&chat, Some(true));
    }

    #[cfg(target_os = "macos")]
    {
        let _ = apply_vibrancy(&chat, NSVisualEffectMaterial::HudWindow, None, None);
    }

    // Position near main window's right edge
    if let (Ok(main_pos), Ok(main_size)) = (main.outer_position(), main.outer_size()) {
        let x = main_pos.x + main_size.width as i32 - 440;
        let y = main_pos.y + 80;
        let _ = chat.set_position(PhysicalPosition::new(x, y));
    }

    chat.show().map_err(|e| e.to_string())
}

/// Minimize chat window to taskbar
#[tauri::command]
pub async fn minimize_chat_window(app: AppHandle) -> Result<(), String> {
    if let Some(chat) = app.get_webview_window("chat") {
        chat.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Toggle chat window always-on-top
#[tauri::command]
pub async fn toggle_chat_always_on_top(app: AppHandle) -> Result<bool, String> {
    if let Some(chat) = app.get_webview_window("chat") {
        let current = chat.is_always_on_top().unwrap_or(false);
        chat.set_always_on_top(!current).map_err(|e| e.to_string())?;
        return Ok(!current);
    }
    Err("No chat window".to_string())
}

/// Close chat window (destroys it - will be recreated on next open)
#[tauri::command]
pub async fn close_chat_window(app: AppHandle) -> Result<(), String> {
    if let Some(chat) = app.get_webview_window("chat") {
        // Destroy window - it will be recreated fresh on next open
        // This is proper lifecycle management vs. hiding
        chat.destroy().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Dock chat to main window edge
#[tauri::command]
pub async fn dock_chat_window(app: AppHandle, edge: String) -> Result<(), String> {
    let main = app.get_webview_window("main").ok_or("No main window")?;
    let chat = app.get_webview_window("chat").ok_or("No chat window")?;

    let main_pos = main.outer_position().map_err(|e| e.to_string())?;
    let main_size = main.outer_size().map_err(|e| e.to_string())?;
    let chat_size = chat.outer_size().map_err(|e| e.to_string())?;

    let (x, y) = match edge.as_str() {
        "right" => (main_pos.x + main_size.width as i32, main_pos.y),
        "left" => (main_pos.x - chat_size.width as i32, main_pos.y),
        _ => (main_pos.x + main_size.width as i32, main_pos.y),
    };

    chat.set_position(PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())
}

/// Navigate main window to a route (for chat window control)
#[tauri::command]
pub async fn navigate_main_window(app: AppHandle, route: String) -> Result<(), String> {
    let main = app.get_webview_window("main").ok_or("No main window")?;

    // Use eval to navigate via SvelteKit's goto
    let script = format!(
        r#"
        if (window.__TAURI_INTERNALS__) {{
            window.location.href = '{}';
        }}
        "#,
        route
    );

    main.eval(&script).map_err(|e| e.to_string())
}

/// Focus the main window (bring to front)
#[tauri::command]
pub async fn focus_main_window(app: AppHandle) -> Result<(), String> {
    let main = app.get_webview_window("main").ok_or("No main window")?;

    main.set_focus().map_err(|e| e.to_string())
}

/// Restore main window if minimized
#[tauri::command]
pub async fn restore_main_window(app: AppHandle) -> Result<(), String> {
    let main = app.get_webview_window("main").ok_or("No main window")?;

    // Unminimize if minimized
    if main.is_minimized().unwrap_or(false) {
        main.unminimize().map_err(|e| e.to_string())?;
    }

    // Show if hidden
    if !main.is_visible().unwrap_or(true) {
        main.show().map_err(|e| e.to_string())?;
    }

    Ok(())
}
