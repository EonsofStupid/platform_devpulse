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

use devpulse_engine::platform::{InitStatus, Platform, SqlAdapter};
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
            // Dev: project-local data/ dir (already gitignored).
            // Release: standard OS app data dir.
            let data_dir = if cfg!(debug_assertions) {
                // CARGO_MANIFEST_DIR = interfaces/desktop/src-tauri
                // Go up 3 levels to project root, then into data/
                let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
                let project_root = manifest
                    .parent() // interfaces/desktop
                    .and_then(|p| p.parent()) // interfaces
                    .and_then(|p| p.parent()) // project root
                    .expect("Failed to resolve project root from CARGO_MANIFEST_DIR");
                let dev_data = project_root.join("data");
                std::fs::create_dir_all(&dev_data)
                    .expect("Failed to create dev data directory");
                dev_data
            } else {
                app.path()
                    .app_data_dir()
                    .expect("Failed to resolve app data dir")
            };

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
            commands::devpulse::fetch_dashboard,
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

            // Dev mode: seed sample data if stores are empty
            #[cfg(debug_assertions)]
            {
                if let Err(e) = seed_dev_data(&platform).await {
                    tracing::warn!(error = %e, "Dev seed failed (non-fatal)");
                }
            }

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

/// Seed sample data for dev mode — only if tables are empty.
#[cfg(debug_assertions)]
async fn seed_dev_data(platform: &Platform) -> anyhow::Result<()> {
    use devpulse_engine::platform::AnalyticsAdapter;

    // Seed LibSQL projects + sessions + messages
    if let Some(store) = platform.relational() {
        let adapter = store.adapter();

        // Check if already seeded
        let rows = adapter
            .query("SELECT COUNT(*) FROM projects", &[])
            .await?;
        let count: i64 = rows
            .first()
            .and_then(|r| r.first())
            .and_then(|s| s.parse().ok())
            .unwrap_or(0);

        if count == 0 {
            tracing::info!("Seeding dev data into LibSQL...");

            adapter
                .execute_batch(
                    r"
                    INSERT INTO projects (id, name, root_path, project_type) VALUES
                        ('proj-1', 'platform_devpulse', 'D:/localdev/platform_devpulse', 'TypeScript'),
                        ('proj-2', 'maestro-kernel', 'D:/localdev/platform_devpulse/kernel', 'Rust'),
                        ('proj-3', 'coldlight-tokens', 'D:/localdev/platform_devpulse/interfaces/desktop/src/lib/design', 'CSS'),
                        ('proj-4', 'signal-router', 'D:/localdev/platform_devpulse/systems/devpulse-engine', 'Rust');

                    INSERT INTO sessions (id, project_id) VALUES
                        ('sess-1', 'proj-1'),
                        ('sess-2', 'proj-2');

                    INSERT INTO messages (session_id, role, content) VALUES
                        ('sess-1', 'user', 'Analyze the build pipeline for bottlenecks.'),
                        ('sess-1', 'assistant', 'Token generation runs in 2.1s avg. Vite HMR at 340ms. svelte-check at 8.2s could use incremental mode.'),
                        ('sess-1', 'user', 'What about the recipe system performance?'),
                        ('sess-1', 'assistant', 'The centralized recipe registry with registerRecipe() adds minimal overhead. 28 recipes resolve in under 1ms via Map lookup.'),
                        ('sess-2', 'user', 'Show me the store health status.'),
                        ('sess-2', 'assistant', 'All 4 stores healthy. LibSQL: 3ms, DuckDB: 1ms, SurrealDB: 12ms, Moka: under 1ms.');
                    ",
                )
                .await?;

            tracing::info!("LibSQL seeded: 4 projects, 2 sessions, 6 messages");
        }
    }

    // Seed DuckDB daily_stats
    if let Some(store) = platform.analytics() {
        let adapter = store.adapter();

        let rows = adapter
            .analytics_query("SELECT COUNT(*) FROM daily_stats")
            .await?;
        let count: i64 = rows
            .first()
            .and_then(|r| r.first())
            .and_then(|s| s.parse().ok())
            .unwrap_or(0);

        if count == 0 {
            tracing::info!("Seeding dev data into DuckDB...");

            let mut data = Vec::new();
            for i in 0..20 {
                data.push(serde_json::json!({
                    "date": format!("2026-02-{:02}", 16 + (i % 13)),
                    "total_signals": 50 + (i * 7) % 40,
                    "total_messages": 10 + (i * 3) % 25,
                    "total_tokens": 1000 + (i * 150) % 2000,
                    "avg_latency_ms": 15.0 + ((i * 5) % 30) as f64,
                }));
            }

            let inserted = adapter.append("daily_stats", &data).await?;
            tracing::info!(rows = inserted, "DuckDB seeded: daily_stats");
        }
    }

    Ok(())
}
