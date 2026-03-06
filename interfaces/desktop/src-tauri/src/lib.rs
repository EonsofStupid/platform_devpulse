//! `DevPulse` Desktop — Tauri backend.
//!
//! The Tauri layer depends on `devpulse-engine` only — never on maestro.
//! All kernel access goes through the Platform facade.
//!
//! # Boot Architecture: Progressive Hydration
//! setup() returns instantly. Main window is visible immediately.
//! Subsystems boot in background via spawned task.
//! StatusBar shows real-time per-store progress.

pub mod commands;
pub mod logging;
pub mod state;

use devpulse_engine::platform::{InitStatus, Platform};
use state::PlatformState;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::RwLock;

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

            // Logging: rotate old logs, then init stderr + file together
            let _ = logging::rotate_logs(&data_dir);
            match logging::init(&data_dir) {
                Ok(guard) => {
                    // Leak the guard so file logging lives for the entire process
                    std::mem::forget(guard);
                }
                Err(_) => {
                    // Fall back to stderr-only logging
                    logging::init_stderr_only();
                }
            }
            tracing::info!(data_dir = %data_dir.display(), "DevPulse Desktop starting");

            // Register empty platform state — filled by background boot task
            app.manage(PlatformState {
                platform: RwLock::new(None),
            });

            // Spawn async boot task — setup returns IMMEDIATELY
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(boot_task(handle, data_dir));

            tracing::info!("Setup complete — boot running in background");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::chat::send_message,
            commands::chat::history::load_recent,
            commands::chat::interactions::post_reaction,
            commands::sys::config::get_settings,
            commands::sys::guard::verify,
            commands::sys::logger::log,
            commands::devmaestro::get_status,
            commands::thinkmaestro::create_canvas,
            commands::wiredfront::connect_peer,
            commands::window::open_chat_window,
            commands::window::close_window,
            commands::window::focus_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Background boot task — boots all platform stores and emits progress events.
async fn boot_task(app: tauri::AppHandle, data_dir: PathBuf) {
    tracing::info!("Boot task started");

    let _ = app.emit(
        "platform:boot-phase",
        serde_json::json!({ "phase": "initializing" }),
    );

    let app_for_callback = app.clone();
    let result = Platform::boot(data_dir, move |event| {
        // Log completion events via tracing
        if event.status != InitStatus::Running {
            let latency_str = event
                .latency_ms
                .map(|ms| format!(" {ms}ms"))
                .unwrap_or_default();
            let msg_str = event
                .message
                .as_deref()
                .map(|m| format!(" ({m})"))
                .unwrap_or_default();
            let line = format!("{}{msg_str}{latency_str}", event.step);

            match event.status {
                InitStatus::Ok => tracing::info!(step = %event.step, "[+] {}", line),
                InitStatus::Error => tracing::error!(step = %event.step, "[!] {}", line),
                InitStatus::Skipped => tracing::info!(step = %event.step, "[-] {}", line),
                InitStatus::Running => {}
            }
        }

        // Bridge to frontend StatusBar
        let _ = app_for_callback.emit("platform:subsystem-status", &event);
    })
    .await;

    match result {
        Ok(platform) => {
            tracing::info!("Boot complete — verifying health");
            let health = platform.health().await;
            for sub in &health.subsystems {
                tracing::info!(store = %sub.name, status = ?sub.status, "verified");
            }
            tracing::info!(status = ?health.status, "Platform ready");

            // Store platform in managed state
            let state = app.state::<PlatformState>();
            {
                let mut lock = state.platform.write().await;
                *lock = Some(Arc::new(platform));
            }

            let _ = app.emit(
                "platform:boot-phase",
                serde_json::json!({
                    "phase": "ready",
                    "health": health
                }),
            );
        }
        Err(e) => {
            tracing::error!(error = %e, "Platform boot failed");
            let _ = app.emit(
                "platform:boot-phase",
                serde_json::json!({
                    "phase": "failed",
                    "error": e.to_string()
                }),
            );
        }
    }
}
