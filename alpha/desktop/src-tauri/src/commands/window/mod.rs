//! Window commands - window management
//!
//! Commands:
//! - open_chat_window: Open chat window
//! - open_app_window: Open main app window
//! - close_window: Close window by label
//! - focus_window: Focus window by label
//! - spawn_interaction: Spawn AI-driven interaction popup
//! - close_interaction: Close interaction popup

use tauri::Manager;

#[tauri::command]
pub async fn open_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    if app.get_webview_window("chat").is_none() {
        tauri::WebviewWindowBuilder::new(
            &app,
            "chat",
            tauri::WebviewUrl::App("/chat".into()),
        )
        .title("DevPulse Chat")
        .inner_size(400.0, 600.0)
        .build()
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn open_app_window(app: tauri::AppHandle) -> Result<(), String> {
    if app.get_webview_window("main").is_none() {
        tauri::WebviewWindowBuilder::new(
            &app,
            "main",
            tauri::WebviewUrl::App("/".into()),
        )
        .title("DevPulse")
        .inner_size(1200.0, 800.0)
        .build()
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn close_window(label: String, app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn focus_window(label: String, app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Spawn an AI-driven interaction popup window
#[tauri::command]
pub async fn spawn_interaction(
    app: tauri::AppHandle,
    interaction_id: String,
    width: Option<f64>,
    height: Option<f64>,
) -> Result<String, String> {
    let popup_label = format!("interaction-{}", interaction_id);

    tauri::WebviewWindowBuilder::new(
        &app,
        &popup_label,
        tauri::WebviewUrl::App(format!("/popup/{}", interaction_id).into()),
    )
    .title("")
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .resizable(false)
    .inner_size(width.unwrap_or(400.0), height.unwrap_or(300.0))
    .center()
    .build()
    .map_err(|e| e.to_string())?;

    Ok(popup_label)
}

/// Close an interaction popup window
#[tauri::command]
pub async fn close_interaction(
    app: tauri::AppHandle,
    interaction_id: String,
) -> Result<(), String> {
    let popup_label = format!("interaction-{}", interaction_id);
    if let Some(window) = app.get_webview_window(&popup_label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
