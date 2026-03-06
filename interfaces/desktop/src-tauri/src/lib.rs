//! `DevPulse` Desktop — Tauri backend.
//!
//! The Tauri layer depends on `devpulse-engine` only — never on maestro.
//! All kernel access goes through the Platform facade.

pub mod commands;
pub mod state;

use devpulse_engine::platform::{InitStatus, Platform};
use state::AppState;
use std::sync::Arc;
use tauri::{Emitter, Manager};

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

            eprintln!();
            eprintln!("--- Platform Boot ---");
            eprintln!("  data: {}", data_dir.display());

            // Boot platform — create a dedicated Tokio runtime for async init.
            // Tauri's setup closure doesn't run inside a Tokio context,
            // so Handle::current() would panic.
            let app_handle = app.handle().clone();
            let rt = tokio::runtime::Runtime::new()
                .expect("Failed to create Tokio runtime");
            let platform = rt.block_on(async {
                Platform::boot(data_dir, |event| {
                    let symbol = match event.status {
                        InitStatus::Running => ">",
                        InitStatus::Ok => "+",
                        InitStatus::Error => "!",
                        InitStatus::Skipped => "-",
                    };
                    let latency = event
                        .latency_ms
                        .map(|ms| format!("  {ms}ms"))
                        .unwrap_or_default();
                    let msg = event
                        .message
                        .as_deref()
                        .map(|m| format!(" ({m})"))
                        .unwrap_or_default();

                    // Only print completion events (Ok/Error/Skipped), not Running
                    if event.status != InitStatus::Running {
                        eprintln!("  [{symbol}] {}{msg}{latency}", event.step);
                    }

                    // Bridge to splashscreen UI
                    let _ = app_handle.emit("platform:boot", &event);
                })
                .await
            })?;

            // Post-boot verification — ping all stores
            eprintln!();
            eprintln!("--- Verification ---");
            let health = rt.block_on(platform.health());
            for sub in &health.subsystems {
                let latency = sub
                    .latency_ms
                    .map(|ms| format!("  {ms}ms"))
                    .unwrap_or_default();
                let symbol = if sub.status == devpulse_engine::platform::HealthStatus::Healthy {
                    "+"
                } else {
                    "!"
                };
                eprintln!("  [{symbol}] {}{latency}", sub.name);
            }
            eprintln!(
                "  Platform {:?} — {} store(s) verified",
                health.status,
                health.subsystems.len()
            );

            app.manage(AppState {
                platform: Arc::new(platform),
            });

            // Emit completion to splashscreen
            let _ = app.emit("platform:boot-complete", &health);

            // Window swap: show main, close splashscreen
            if let Some(splash) = app.get_webview_window("splashscreen") {
                let _ = splash.close();
            }
            if let Some(main) = app.get_webview_window("main") {
                let _ = main.show();
                let _ = main.set_focus();
            }

            eprintln!();
            eprintln!("--- Ready ---");
            eprintln!();

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
