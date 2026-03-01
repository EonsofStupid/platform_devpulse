//! `DevPulse` Desktop — Tauri backend.
//!
//! The Tauri layer depends on `devpulse-engine` only — never on maestro.
//! All kernel access goes through the Platform facade.

pub mod commands;
pub mod state;

use devpulse_engine::platform::Platform;
use state::AppState;
use std::sync::Arc;
use tauri::Manager;

/// Bootstrap and run the Tauri application.
///
/// # Panics
/// Panics if the Tauri runtime fails to start.
#[allow(clippy::expect_used)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data dir");

            // Boot platform on the tokio runtime
            let rt = tokio::runtime::Handle::current();
            let platform = rt.block_on(async {
                Platform::boot(data_dir, |event| {
                    // Log init events (will emit to frontend in launcher sprint)
                    eprintln!(
                        "[init] {} — {:?}{}",
                        event.step,
                        event.status,
                        event
                            .latency_ms
                            .map(|ms| format!(" ({ms}ms)"))
                            .unwrap_or_default()
                    );
                })
                .await
            })?;

            app.manage(AppState {
                platform: Arc::new(platform),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Chat
            commands::chat::send_message,
            commands::chat::history::load_recent,
            commands::chat::interactions::post_reaction,
            // Sys
            commands::sys::config::get_settings,
            commands::sys::guard::verify,
            commands::sys::logger::log,
            // Platform health
            commands::devmaestro::get_status,
            // ThinkMaestro
            commands::thinkmaestro::create_canvas,
            // WiredFront
            commands::wiredfront::connect_peer,
            // Window
            commands::window::open_chat_window,
            commands::window::close_window,
            commands::window::focus_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
