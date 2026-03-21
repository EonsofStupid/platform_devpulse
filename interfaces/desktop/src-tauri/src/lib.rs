//! `DevPulse` Desktop — Tauri backend.
//!
//! The Tauri layer depends on `devpulse-engine` only — never on maestro.
//! All kernel access goes through the Platform engine.
//!
//! # Boot Architecture: Progressive Hydration
//! `setup()` returns instantly. Main window is visible immediately.
//! Subsystems boot in background via spawned task.
//! `StatusBar` shows real-time per-service progress.

pub mod commands;
pub mod logging;
pub mod state;

use devpulse_engine::platform::{InitStatus, Platform};
use state::{BootStateTracker, PlatformState};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::RwLock;

/// Bootstrap and run the Tauri application.
///
/// # Panics
/// Panics if the Tauri runtime fails to start.
#[allow(clippy::expect_used, clippy::too_many_lines)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Second instance launched — focus the existing main window
            tracing::info!("Second instance detected — focusing existing window");
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.show();
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Portable-first data directory resolution.
            //
            // Default: .userdata/ relative to project root (portable — nothing
            // leaves the project boundary). Override: set portable.enabled = false
            // in platform.toml to use OS-standard app data dirs.
            //
            // Dev mode always uses .userdata/ at project root.
            // Release mode checks for .userdata/ next to the binary first
            // (portable install), then falls back to OS app data dir.
            let data_dir = if cfg!(debug_assertions) {
                // Dev: CARGO_MANIFEST_DIR is valid at compile time.
                // interfaces/desktop/src-tauri → up 3 levels → project root
                let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
                let project_root = manifest
                    .parent() // interfaces/desktop
                    .and_then(|p| p.parent()) // interfaces
                    .and_then(|p| p.parent()) // project root
                    .expect("Failed to resolve project root from CARGO_MANIFEST_DIR");
                let dev_data = project_root.join(".userdata");
                std::fs::create_dir_all(&dev_data)
                    .expect("Failed to create .userdata directory");
                dev_data
            } else {
                // Release: CARGO_MANIFEST_DIR is a compile-time constant
                // pointing to the build machine — NOT the deployed location.
                // Use current_exe() to find the binary's actual location.
                let exe_dir = std::env::current_exe()
                    .expect("Failed to resolve current executable path")
                    .parent()
                    .expect("Executable has no parent directory")
                    .to_path_buf();
                let portable_dir = exe_dir.join(".userdata");
                if portable_dir.exists() {
                    portable_dir
                } else {
                    // Fall back to OS app data dir
                    let os_dir = app.path()
                        .app_data_dir()
                        .expect("Failed to resolve app data dir");
                    std::fs::create_dir_all(&os_dir)
                        .expect("Failed to create app data directory");
                    os_dir
                }
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
            app.manage(BootStateTracker::new());

            // Dev mode: Tauri's beforeDevCommand starts Vite and waits for it.
            // Do NOT check Vite here — Tauri handles the race condition.
            // The Rust backend just logs that it's in dev mode.
            #[cfg(debug_assertions)]
            tracing::info!("Dev mode — Tauri CLI manages Vite startup via beforeDevCommand");

            // Spawn async boot task — setup returns IMMEDIATELY
            let handle = app.handle().clone();
            let tracker = app.state::<BootStateTracker>();
            let tracker_clone = tracker.clone_tracker();
            tauri::async_runtime::spawn(boot_task(handle, data_dir, tracker_clone));

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
            commands::sys::boot::get_boot_state,
            commands::devmaestro::get_status,
            commands::devpulse::fetch_dashboard,
            commands::thinkmaestro::create_canvas,
            commands::wiredfront::connect_peer,
            commands::window::open_chat_window,
            commands::window::close_window,
            commands::window::focus_window,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                tracing::info!("Tauri exit event — initiating platform shutdown");
                let state = app.state::<PlatformState>();
                // Block on shutdown with the tokio runtime that's still alive
                tauri::async_runtime::block_on(async {
                    let lock = state.platform.read().await;
                    if let Some(platform) = lock.as_ref() {
                        platform.shutdown().await;
                    }
                });
                tracing::info!("Platform shutdown complete — process exiting");
            }
        });
}

/// Background boot task — boots all platform services and emits progress events.
///
/// Writes `.userdata/logs/boot.log` on every run (overwritten, not appended).
/// Human-readable summary so you can immediately see what booted and what didn't.
#[allow(clippy::too_many_lines)]
async fn boot_task(app: tauri::AppHandle, data_dir: PathBuf, tracker: BootStateTracker) {
    use devpulse_engine::platform::InitEvent;
    use std::fmt::Write as _;
    use std::sync::Mutex;

    tracing::info!("Boot task started");

    let _ = app.emit(
        "platform:boot-phase",
        serde_json::json!({ "phase": "initializing" }),
    );

    // Accumulate boot log lines for boot.log
    let boot_lines: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));
    let boot_start = std::time::Instant::now();

    let app_for_callback = app.clone();
    let tracker_for_callback = tracker.clone_tracker();
    let lines_for_callback = Arc::clone(&boot_lines);

    let result = Platform::boot(data_dir.clone(), move |event: InitEvent| {
        // Accumulate in tracker BEFORE emitting (so frontend can catch up)
        tracker_for_callback.record_event(event.clone());

        // Build boot.log line
        if event.status != InitStatus::Running {
            let elapsed = boot_start.elapsed().as_secs_f64();
            let status_tag = match event.status {
                InitStatus::Ok => "   OK",
                InitStatus::Error => "FAIL!",
                InitStatus::Skipped => " SKIP",
                InitStatus::Running => unreachable!(),
            };
            let latency_str = event
                .latency_us
                .map(|us| {
                    if us >= 1000 {
                        format!(" ({}ms)", us / 1000)
                    } else {
                        format!(" ({us}µs)")
                    }
                })
                .unwrap_or_default();
            let msg_str = event
                .message
                .as_deref()
                .map(|m| format!(": {m}"))
                .unwrap_or_default();
            let line = format!(
                "[+{elapsed:07.3}s] [{status_tag}] {}{msg_str}{latency_str}",
                event.step
            );

            if let Ok(mut lines) = lines_for_callback.lock() {
                lines.push(line);
            }
        }

        // Log completion events via tracing
        if event.status != InitStatus::Running {
            let latency_str = event
                .latency_us
                .map(|us| {
                    if us >= 1000 {
                        format!(" {}ms", us / 1000)
                    } else {
                        format!(" {us}µs")
                    }
                })
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

    // Build final boot.log content
    let total_elapsed = boot_start.elapsed();
    let mut log = String::with_capacity(4096);
    let _ = writeln!(log, "# DevPulse Boot Log");
    let _ = writeln!(log, "# {}", chrono::Local::now().format("%Y-%m-%d %H:%M:%S"));
    let _ = writeln!(log, "# OS: {} {}", std::env::consts::OS, std::env::consts::ARCH);
    let _ = writeln!(log, "# data_dir: {}", data_dir.display());
    let config_source = if data_dir.join("platform.toml").exists() {
        "platform.toml (user override)"
    } else {
        "platform.default.toml (embedded)"
    };
    let _ = writeln!(log, "# config: {config_source}");
    let _ = writeln!(log, "#");

    if let Ok(lines) = boot_lines.lock() {
        for line in lines.iter() {
            let _ = writeln!(log, "{line}");
        }
    }
    let _ = writeln!(log);

    match result {
        Ok(platform) => {
            tracing::info!("Boot complete — verifying health");
            let health = platform.health().await;

            let _ = writeln!(log, "# Health check:");
            for sub in &health.subsystems {
                let _ = writeln!(log, "#   {}: {:?}", sub.name, sub.status);
                tracing::info!(service = %sub.name, status = ?sub.status, "verified");
            }
            let _ = writeln!(log, "#");
            let _ = writeln!(
                log,
                "# Result: READY ({:.1}s total)",
                total_elapsed.as_secs_f64()
            );
            tracing::info!(status = ?health.status, "Platform ready");

            // Dev mode: seed sample data if services are empty
            #[cfg(debug_assertions)]
            {
                if let Err(e) = seed_dev_data(&platform).await {
                    tracing::warn!(error = %e, "Dev seed failed (non-fatal)");
                    let _ = writeln!(log, "# WARNING: Dev seed failed: {e}");
                }
            }

            // Record in tracker before emitting
            tracker.set_ready(health.clone());

            // Set platform in managed state
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

            // Open chat window AFTER boot — graceful lazy load
            tracing::info!("Opening Maestro Chat window");
            if let Err(e) = commands::window::open_chat_window(app.clone()).await {
                tracing::warn!(error = %e, "Chat window failed to open (non-fatal)");
            }
        }
        Err(e) => {
            let _ = writeln!(
                log,
                "# Result: FAILED ({:.1}s total)",
                total_elapsed.as_secs_f64()
            );
            let _ = writeln!(log, "# Error: {e}");
            tracing::error!(error = %e, "Platform boot failed");
            tracker.set_failed(e.to_string());
            let _ = app.emit(
                "platform:boot-phase",
                serde_json::json!({
                    "phase": "failed",
                    "error": e.to_string()
                }),
            );
        }
    }

    // Write boot.log — overwrites every run
    let boot_log_path = data_dir.join("logs").join("boot.log");
    if let Err(e) = std::fs::write(&boot_log_path, &log) {
        tracing::warn!(error = %e, "Failed to write boot.log");
    } else {
        tracing::info!(path = %boot_log_path.display(), "boot.log written");
    }
}

/// Seed sample data for dev mode — only if tables are empty.
#[cfg(debug_assertions)]
#[allow(clippy::too_many_lines)]
async fn seed_dev_data(platform: &Platform) -> anyhow::Result<()> {
    use devpulse_engine::platform::{AnalyticsAdapter, SqlAdapter};

    // Seed system relational: platform_config + boot_history
    if let Some(svc) = platform.relational() {
        let adapter = svc.adapter();

        let rows = adapter
            .query("SELECT COUNT(*) FROM platform_config", &[])
            .await?;
        let count = rows
            .first()
            .and_then(|r| r.first())
            .and_then(devpulse_engine::platform::SqlValue::as_integer)
            .unwrap_or(0);

        if count == 0 {
            tracing::info!("Seeding system config into LibSQL...");

            adapter
                .execute_batch(
                    r"
                    INSERT INTO platform_config (key, value, category) VALUES
                        ('version', '0.1.0', 'system'),
                        ('portable_mode', 'true', 'system'),
                        ('log_level', 'info', 'system'),
                        ('default_model', 'claude-sonnet-4-6', 'ai'),
                        ('max_tokens_per_turn', '8192', 'ai'),
                        ('default_temperature', '0.7', 'ai');
                    ",
                )
                .await?;

            tracing::info!("System LibSQL seeded: 6 config entries");
        }
    }

    // Seed user relational: profile + projects + sessions + turns
    if let Some(svc) = platform.user_relational() {
        let adapter = svc.adapter();

        let rows = adapter
            .query("SELECT COUNT(*) FROM projects", &[])
            .await?;
        let count = rows
            .first()
            .and_then(|r| r.first())
            .and_then(devpulse_engine::platform::SqlValue::as_integer)
            .unwrap_or(0);

        if count == 0 {
            tracing::info!("Seeding user data into LibSQL...");

            adapter
                .execute_batch(
                    r"
                    INSERT INTO profiles (id, display_name, hardware_profile, onboarding_complete, expertise_level) VALUES
                        ('user-1', 'Developer', '32g_engineer', 1, 3);

                    INSERT INTO preferences (id, user_id, theme, context_mode, verbosity) VALUES
                        ('pref-1', 'user-1', 'dark', 'normal', 'balanced');

                    INSERT INTO projects (id, name, root_path, project_type) VALUES
                        ('proj-1', 'platform_devpulse', 'D:/localdev/platform_devpulse', 'personal'),
                        ('proj-2', 'maestro-kernel', 'D:/localdev/platform_devpulse/kernel', 'personal'),
                        ('proj-3', 'coldlight-tokens', 'D:/localdev/platform_devpulse/interfaces/desktop/src/lib/design', 'personal'),
                        ('proj-4', 'signal-router', 'D:/localdev/platform_devpulse/systems/devpulse-engine', 'personal');

                    INSERT INTO sessions (id, project_id, title, context_mode) VALUES
                        ('sess-1', 'proj-1', 'Build pipeline analysis', 'normal'),
                        ('sess-2', 'proj-2', 'Service health review', 'normal');

                    INSERT INTO turns (id, session_id, project_id, role, content, sequence_num) VALUES
                        ('turn-1', 'sess-1', 'proj-1', 'user', 'Analyze the build pipeline for bottlenecks.', 1),
                        ('turn-2', 'sess-1', 'proj-1', 'assistant', 'Token generation runs in 2.1s avg. Vite HMR at 340ms. svelte-check at 8.2s could use incremental mode.', 2),
                        ('turn-3', 'sess-1', 'proj-1', 'user', 'What about the recipe system performance?', 3),
                        ('turn-4', 'sess-1', 'proj-1', 'assistant', 'The centralized recipe registry with registerRecipe() adds minimal overhead. 28 recipes resolve in under 1ms via Map lookup.', 4),
                        ('turn-5', 'sess-2', 'proj-2', 'user', 'Show me the service health status.', 1),
                        ('turn-6', 'sess-2', 'proj-2', 'assistant', 'All services healthy. LibSQL: 3ms, DuckDB: 1ms, SurrealDB: 12ms, Moka: under 1ms.', 2);
                    ",
                )
                .await?;

            tracing::info!("User LibSQL seeded: 1 profile, 4 projects, 2 sessions, 6 turns");
        }
    }

    // Seed DuckDB daily_stats
    if let Some(svc) = platform.analytics() {
        let adapter = svc.adapter();

        let rows = adapter
            .analytics_query("SELECT COUNT(*) FROM daily_stats")
            .await?;
        let count = rows
            .first()
            .and_then(|r| r.first())
            .and_then(devpulse_engine::platform::SqlValue::as_integer)
            .unwrap_or(0);

        if count == 0 {
            tracing::info!("Seeding dev data into DuckDB...");

            let mut data = Vec::new();
            for i in 0..20 {
                data.push(serde_json::json!({
                    "date": format!("2026-02-{:02}", 16 + (i % 13)),
                    "total_model_calls": 20 + (i * 5) % 30,
                    "total_sessions": 3 + (i * 2) % 8,
                    "total_messages": 10 + (i * 3) % 25,
                    "total_prompt_tokens": 500 + (i * 80) % 1200,
                    "total_completion_tokens": 400 + (i * 60) % 900,
                    "total_cost_usd": 0.05 + f64::from((i * 3) % 20) * 0.01,
                    "avg_latency_ms": 15.0 + f64::from((i * 5) % 30),
                    "avg_roti_ratio": 1.5 + f64::from((i * 2) % 10) * 0.1,
                    "cache_hit_rate": 0.3 + f64::from((i * 4) % 30) * 0.01,
                    "error_count": (i * 3) % 5,
                    "governance_violations": (i * 2) % 3,
                }));
            }

            let inserted = adapter.append("daily_stats", &data).await?;
            tracing::info!(rows = inserted, "DuckDB seeded: daily_stats");
        }
    }

    Ok(())
}
