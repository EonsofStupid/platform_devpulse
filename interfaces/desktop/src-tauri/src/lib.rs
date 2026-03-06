//! `DevPulse` Desktop — Tauri backend.
//!
//! The Tauri layer depends on `devpulse-engine` only — never on maestro.
//! All kernel access goes through the Platform facade.
//!
//! # Boot Architecture: Progressive Hydration
//! ```text
//! setup() returns instantly
//!     |
//!     v
//! Main window visible -- Shell renders (topbar, sidebar, statusbar)
//!     |                       |
//!     v                       v
//! spawn(boot_task)       StatusBar: "Initializing..."
//!     |
//!     +-- LibSQL ready ------> StatusBar: [Data Store: ready 12ms]
//!     +-- DuckDB ready ------> StatusBar: [Analytics: ready 45ms]
//!     +-- SurrealDB ready ----> StatusBar: [Knowledge Graph: ready 340ms]
//!     +-- Moka ready ---------> StatusBar: [Memory Cache: ready 1ms]
//!     |
//!     v
//! All ready -----------------> StatusBar transitions to health display
//! ```

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
    // Phase 1: stderr logging — before anything else
    logging::init_stderr();
    tracing::info!("DevPulse Desktop starting");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data dir");

            tracing::info!(data_dir = %data_dir.display(), "Resolved app data directory");

            // Phase 2: log rotation + file logging
            if let Err(e) = logging::rotate_logs(&data_dir) {
                tracing::warn!(error = %e, "Failed to rotate logs");
            }
            let _log_guard = match logging::init_file_layer(&data_dir) {
                Ok(guard) => {
                    tracing::info!("File logging initialized");
                    Some(guard)
                }
                Err(e) => {
                    tracing::warn!(error = %e, "Failed to initialize file logging");
                    None
                }
            };

            // Phase 3: Register empty platform state — filled by background boot task
            app.manage(PlatformState {
                platform: RwLock::new(None),
            });

            // Phase 4: Spawn async boot task — setup returns IMMEDIATELY
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(boot_task(handle, data_dir));

            tracing::info!("Setup complete — main window visible, boot running in background");
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

/// Background boot task — boots all platform stores and emits progress events.
///
/// The frontend listens for `platform:boot-phase` and `platform:subsystem-status`
/// events to render real-time progress in the StatusBar.
async fn boot_task(app: tauri::AppHandle, data_dir: PathBuf) {
    tracing::info!("Boot task started");

    // Emit "initializing" phase to frontend
    let _ = app.emit(
        "platform:boot-phase",
        serde_json::json!({ "phase": "initializing" }),
    );

    // Boot platform with real-time event callback
    let app_for_callback = app.clone();
    let result = Platform::boot(data_dir, move |event| {
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

        // Log to structured tracing
        match event.status {
            InitStatus::Ok => tracing::info!(
                step = %event.step,
                latency_ms = event.latency_ms,
                "[{symbol}] {}{msg}{latency}",
                event.step
            ),
            InitStatus::Error => tracing::error!(
                step = %event.step,
                message = event.message.as_deref(),
                "[{symbol}] {}{msg}",
                event.step
            ),
            InitStatus::Skipped => tracing::info!(
                step = %event.step,
                "[{symbol}] {}{msg}",
                event.step
            ),
            InitStatus::Running => {}
        }

        // Bridge to frontend StatusBar
        let _ = app_for_callback.emit("platform:subsystem-status", &event);
    })
    .await;

    match result {
        Ok(platform) => {
            // Post-boot: health verification
            tracing::info!("Boot complete — running health verification");
            let health = platform.health().await;
            for sub in &health.subsystems {
                let symbol =
                    if sub.status == devpulse_engine::platform::HealthStatus::Healthy {
                        "+"
                    } else {
                        "!"
                    };
                tracing::info!(
                    store = %sub.name,
                    status = ?sub.status,
                    latency_ms = sub.latency_ms,
                    "[{symbol}] {} verified",
                    sub.name
                );
            }
            tracing::info!(
                status = ?health.status,
                stores = health.subsystems.len(),
                "Platform {:?} — {} store(s) verified",
                health.status,
                health.subsystems.len()
            );

            // Store platform in managed state
            let state = app.state::<PlatformState>();
            {
                let mut lock = state.platform.write().await;
                *lock = Some(Arc::new(platform));
            }

            // Emit "ready" phase to frontend
            let _ = app.emit(
                "platform:boot-phase",
                serde_json::json!({
                    "phase": "ready",
                    "health": health
                }),
            );

            tracing::info!("Platform ready — progressive hydration complete");
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
