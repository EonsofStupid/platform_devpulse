//! `DevPulse` Desktop — Tauri backend.
//!
//! The Tauri layer depends on `devpulse-engine` only — never on clyffy.
//! All kernel access goes through the Platform engine.
//!
//! # Boot Architecture
//!
//! ## Dev mode (debug_assertions)
//! **Blocking boot.** `setup()` does NOT return until every service is
//! confirmed or failed. The window does not render until the platform is
//! ready. Terminal shows real-time progress via boot.log sink (stderr).
//! If a critical service fails, setup returns an error and the app exits.
//!
//! ## Release mode
//! **Progressive hydration.** `setup()` returns instantly. Services boot
//! in background. Frontend shows StatusBar with per-service progress.
//! Window is visible immediately.

pub mod commands;
pub mod logging;
pub mod state;

use devpulse_engine::platform::{InitStatus, Platform};
use state::{BootStateTracker, PlatformState};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tauri_specta::{collect_commands, Builder};
use tokio::sync::RwLock;

/// Bootstrap and run the Tauri application.
///
/// # Panics
/// Panics if the Tauri runtime fails to start.
#[allow(clippy::expect_used, clippy::too_many_lines)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ── specta: typed IPC bindings ──────────────────────────────
    let builder = Builder::<tauri::Wry>::new().commands(collect_commands![
        commands::chat::send_message,
        commands::chat::history::load_recent,
        commands::chat::interactions::post_reaction,
        commands::sys::config::get_settings,
        commands::sys::config::get_preference,
        commands::sys::config::set_preference,
        commands::sys::guard::verify,
        commands::sys::logger::log,
        commands::sys::boot::get_boot_state,
        commands::sys::metrics::get_process_metrics,
        commands::sys::telemetry::get_lane_config,
        commands::sys::telemetry::set_lane_config,
        commands::sys::telemetry::query_span_traces,
        commands::sys::telemetry::query_lane_baselines,
        commands::devclyffy::get_status,
        commands::devforge::spawn_reh_server,
        commands::devforge::stop_reh_server,
        commands::devforge::get_reh_status,
        commands::devforge::get_connection_url,
        commands::devforge::devforge_get_status,
        commands::devforge::devforge_list_workspaces,
        commands::devforge::devforge_create_workspace,
        commands::devforge::devforge_set_fresh_instance,
        commands::devpulse::fetch_dashboard,
        commands::thinkclyffy::create_canvas,
        commands::wiredfront::connect_peer,
        commands::window::open_window,
        commands::window::close_child_window,
        commands::window::list_windows,
        commands::window::open_chat_window,
        commands::window::close_window,
        commands::window::focus_window,
        commands::window::toggle_devtools,
        // Model management
        commands::models::get_hardware_metrics,
        commands::models::scan_models,
        commands::models::get_slots,
        commands::models::get_model_catalog,
        commands::models::is_first_run,
        commands::models::assign_model_to_slot,
        commands::models::load_slot,
        commands::models::unload_slot,
        commands::models::swap_slot_model,
        commands::models::download_model,
        commands::models::cancel_download,
        commands::models::warm_slot,
        commands::models::delete_model,
        commands::models::search_huggingface,
        commands::models::import_local_model,
        commands::models::pick_directory,
        commands::models::create_dev_profile,
        commands::models::auto_configure,
        commands::models::list_presets,
        commands::models::config_for_tier,
        commands::models::get_wizard_copy,
        commands::models::get_tier_display,
        commands::models::complete_model_setup,
        commands::models::inference_generate,
        commands::models::test_inference,
        commands::models::get_vram_budget,
        // Capability backends — embedder, reranker, vision encoder
        commands::models::embed_text,
        commands::models::embed_batch,
        commands::models::rerank_documents,
        commands::models::encode_image,
        // Voice management
        commands::voice::get_voice_status,
        commands::voice::speak,
        commands::voice::stop_speaking,
        commands::voice::is_speaking,
        commands::voice::list_voices,
        commands::voice::preview_voice,
        commands::voice::test_microphone,
        commands::voice::transcribe_audio,
        commands::voice::transcribe_audio_file,
        commands::voice::run_sts_pipeline,
        commands::voice::voice_smoke_test,
        commands::voice::list_voice_profiles,
        commands::voice::save_voice_profile,
        commands::voice::delete_voice_profile,
        commands::voice::activate_voice_profile,
        // Credential management (keyring)
        commands::credentials::store_api_key,
        commands::credentials::get_api_key,
        commands::credentials::delete_api_key,
        commands::credentials::get_api_key_status,
    ]);

    // Dev: export typed TS bindings on every build
    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default()
                .bigint(specta_typescript::BigIntExportBehavior::Number),
            "../src/lib/sys/generated/bindings.ts",
        )
        .expect("Failed to export specta TypeScript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            tracing::info!("Second instance detected — focusing existing window");
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.show();
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);
            // ── Data directory resolution ─────────────────────────
            let data_dir = resolve_data_dir(app)?;

            // ── Logging: stderr + file ────────────────────────────
            let _ = logging::rotate_logs(&data_dir);
            let mut span_rx = match logging::init(&data_dir) {
                Ok(handle) => {
                    // Leak the file guard so file logging lives for the entire process
                    std::mem::forget(handle.file_guard);
                    Some(handle.span_rx)
                }
                Err(_) => {
                    logging::init_stderr_only();
                    None
                }
            };
            tracing::info!(data_dir = %data_dir.display(), "DevPulse Desktop starting");

            // ── Platform state (empty until boot completes) ───────
            let devforge_paths = commands::devforge::paths::DevforgePaths::from_data_dir(&data_dir);
            app.manage(PlatformState {
                platform: RwLock::new(None),
                reh: RwLock::new(None),
                devforge_paths,
            });
            app.manage(BootStateTracker::new());

            // ── DevForge preload ──────────────────────────────────
            // Fire-and-forget: starts the REH web server in the background
            // so "click DevPulse → click DevForge" has zero spawn latency.
            // Status is delivered to the frontend via the `devforge://ready`
            // event (and pullable via `devforge_get_status`).
            tauri::async_runtime::spawn(commands::devforge::bootstrap::run(
                app.handle().clone(),
                data_dir.clone(),
            ));

            // ── Boot strategy: blocking (dev) vs async (release) ──
            //
            // Dev mode: block here. Every service must confirm before
            // the window renders. You see each stage in the terminal.
            // If boot fails, the app exits with a clear error.
            //
            // Release mode: spawn background task. Window shows
            // immediately with a loading indicator. Progressive hydration.
            let handle = app.handle().clone();
            let tracker = app.state::<BootStateTracker>();
            let tracker_clone = tracker.clone_tracker();

            if cfg!(debug_assertions) {
                // ── DEV MODE: BLOCKING BOOT ───────────────────────
                // Window is invisible (tauri.conf.json visible=false).
                // Boot blocks here. Every service must confirm or fail.
                // ONLY after boot succeeds does the window become visible.
                tracing::info!("Dev mode — BLOCKING boot (window hidden until all services confirm)");
                tauri::async_runtime::block_on(
                    boot_task(handle, data_dir, tracker_clone, span_rx.take())
                );

                // Boot complete — NOW show the window
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    tracing::info!("Boot complete — window now visible");
                } else {
                    tracing::error!("Boot complete but main window not found");
                }
            } else {
                // ── RELEASE MODE: ASYNC BOOT ──────────────────────
                // Window starts hidden. boot_task shows it when ready.
                tracing::info!("Release mode — async boot (window hidden until ready)");
                tauri::async_runtime::spawn(
                    boot_task(handle, data_dir, tracker_clone, span_rx.take())
                );
            }

            // ── Global shortcuts ──────────────────────────────────
            // Ctrl+Shift+Z toggles the dev tools panel
            {
                use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, Modifiers, Code};
                let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyZ);
                let app_handle = app.handle().clone();
                app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        let h = app_handle.clone();
                        tauri::async_runtime::spawn(async move {
                            if let Err(e) = commands::window::toggle_devtools(h).await {
                                tracing::warn!(error = %e, "Failed to toggle devtools");
                            }
                        });
                    }
                }).map_err(|e| anyhow::anyhow!("Failed to register Ctrl+Shift+Z: {e}"))?;
                tracing::info!("Registered Ctrl+Shift+Z → dev tools panel");
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                tracing::info!("Tauri exit event — initiating platform shutdown");
                let state = app.state::<PlatformState>();
                tauri::async_runtime::block_on(async {
                    // Stop the DevForge REH server first so we don't leave
                    // an orphan Node process if the platform shutdown stalls.
                    let reh_manager = {
                        let mut guard = state.reh.write().await;
                        guard.take()
                    };
                    if let Some(manager) = reh_manager {
                        if let Err(e) = manager.stop().await {
                            tracing::warn!(error = %e, "REH server shutdown failed");
                        } else {
                            tracing::info!("REH server stopped");
                        }
                    }

                    let lock = state.platform.read().await;
                    if let Some(platform) = lock.as_ref() {
                        platform.shutdown().await;
                    }
                });
                tracing::info!("Platform shutdown complete — process exiting");
            }
        });
}

/// Resolve the data directory — portable-first.
///
/// Dev: `.userdata/` at project root (CARGO_MANIFEST_DIR → up 3 levels).
/// Release: `.userdata/` next to binary (portable), or OS app data dir.
fn resolve_data_dir(app: &tauri::App) -> Result<PathBuf, Box<dyn std::error::Error>> {
    if cfg!(debug_assertions) {
        let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let project_root = manifest
            .parent() // interfaces/desktop
            .and_then(|p| p.parent()) // interfaces
            .and_then(|p| p.parent()) // project root
            .expect("Failed to resolve project root from CARGO_MANIFEST_DIR");
        let dev_data = project_root.join(".userdata");
        std::fs::create_dir_all(&dev_data)
            .expect("Failed to create .userdata directory");
        Ok(dev_data)
    } else {
        let exe_dir = std::env::current_exe()
            .expect("Failed to resolve current executable path")
            .parent()
            .expect("Executable has no parent directory")
            .to_path_buf();
        let portable_dir = exe_dir.join(".userdata");
        if portable_dir.exists() {
            Ok(portable_dir)
        } else {
            let os_dir = app.path()
                .app_data_dir()
                .expect("Failed to resolve app data dir");
            std::fs::create_dir_all(&os_dir)
                .expect("Failed to create app data directory");
            Ok(os_dir)
        }
    }
}

/// Boot task — boots all platform services and emits progress events.
///
/// In dev mode this runs BLOCKING (setup waits for it).
/// In release mode this runs as a spawned async task.
///
/// The engine's `BootLog` handles real-time file + stderr logging.
/// This function handles Tauri-specific concerns: events, state, seeding.
#[allow(clippy::too_many_lines)]
async fn boot_task(
    app: tauri::AppHandle,
    data_dir: PathBuf,
    tracker: BootStateTracker,
    span_rx: Option<tokio::sync::mpsc::Receiver<devpulse_engine::platform::telemetry::SpanRecord>>,
) {
    use devpulse_engine::platform::InitEvent;

    tracing::info!("Boot task started");

    let _ = app.emit(
        "platform:boot-phase",
        serde_json::json!({ "phase": "initializing" }),
    );

    let boot_start = std::time::Instant::now();
    let app_for_callback = app.clone();
    let tracker_for_callback = tracker.clone_tracker();

    // Create model-loader event bridge — emits Tauri events for load/download progress
    let model_event_sink: Option<std::sync::Arc<dyn std::any::Any + Send + Sync>> = {
        let app_for_events = app.clone();
        Some(std::sync::Arc::new(
            devpulse_engine::platform::integrations::EventBridge::new(
                std::sync::Arc::new(move |event_name: &str, payload: serde_json::Value| {
                    let _ = app_for_events.emit(event_name, payload);
                }),
            ),
        ))
    };

    // Platform::boot() now writes boot.log in real-time via BootLog.
    // The callback here is ONLY for Tauri event bridging + tracker.
    let result = Platform::boot(data_dir.clone(), move |event: InitEvent| {
        // Record in tracker (so get_boot_state IPC works)
        tracker_for_callback.record_event(event.clone());

        // Log completion events via tracing (for session log file)
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
    }, model_event_sink)
    .await;

    let total_ms = boot_start.elapsed().as_millis() as u64;

    match result {
        Ok(platform) => {
            tracing::info!("Boot complete ({total_ms}ms) — verifying health");
            let health = platform.health().await;

            for sub in &health.subsystems {
                tracing::info!(service = %sub.name, status = ?sub.status, "health verified");
            }
            tracing::info!(status = ?health.status, total_ms, "Platform ready");

            // Dev mode: seed sample data if services are empty
            #[cfg(debug_assertions)]
            {
                if let Err(e) = seed_dev_data(&platform).await {
                    tracing::warn!(error = %e, "Dev seed failed (non-fatal)");
                }
            }

            // Record in tracker before emitting
            tracker.set_ready(health.clone());

            // Spawn span trace writer now that analytics is available
            if let Some(rx) = span_rx {
                if let Some(analytics) = platform.analytics() {
                    let writer = devpulse_engine::platform::telemetry::SpanTraceWriter::new(
                        rx,
                        analytics.clone(),
                    );
                    tokio::spawn(writer.run());
                    tracing::info!("Span trace writer spawned — DuckDB span persistence active");
                } else {
                    tracing::warn!("Analytics service not available — span traces will buffer and drop");
                }
            }

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

            // ── Hardware metrics push loop ───────────────────────
            // Rust-driven: no frontend polling. Browser throttling can't
            // affect this — Rust tokio runtime is never throttled.
            spawn_hardware_push(app.clone());

            // ── Model readiness check ────────────────────────────
            // Query the model loader to determine if models are present
            // and assigned. Frontend uses this to decide: show app or
            // show the setup wizard.
            let models_ready = {
                let guard = state.platform.read().await;
                if let Some(ref platform) = *guard {
                    if let Some(loader) = platform.model_loader() {
                        let registry = loader.get_registry().await;
                        let slots = loader.list_slots().await;
                        let first_run = loader.is_first_run().await;
                        let assigned = slots.iter()
                            .filter(|s| s.assigned_model.is_some())
                            .count();
                        let ready = !registry.is_empty() && assigned > 0;
                        tracing::info!(
                            models = registry.len(),
                            slots = slots.len(),
                            assigned,
                            first_run,
                            ready,
                            "Model readiness check"
                        );
                        let _ = app.emit(
                            "platform:models-status",
                            serde_json::json!({
                                "ready": ready,
                                "firstRun": first_run,
                                "modelCount": registry.len(),
                                "slotCount": slots.len(),
                                "assignedCount": assigned,
                            }),
                        );
                        ready
                    } else {
                        tracing::warn!("Model Loader not available — models not ready");
                        let _ = app.emit(
                            "platform:models-status",
                            serde_json::json!({
                                "ready": false,
                                "firstRun": true,
                                "modelCount": 0,
                                "slotCount": 0,
                                "assignedCount": 0,
                            }),
                        );
                        false
                    }
                } else {
                    false
                }
            };

            // Show main window NOW — all services confirmed
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                tracing::info!("Main window now visible — all services confirmed");
            }

            // Chat window GATED on model readiness.
            // If models aren't ready, the BootSetupWizard handles setup
            // and calls complete_model_setup when done — which opens chat.
            if models_ready {
                tracing::info!("Models ready — opening Clyffy Chat window");
                if let Err(e) = commands::window::open_chat_window(app.clone()).await {
                    tracing::warn!(error = %e, "Chat window failed to open (non-fatal)");
                }
            } else {
                tracing::info!("Models not ready — wizard will handle setup, chat deferred");
            }
        }
        Err(e) => {
            tracing::error!(error = %e, total_ms, "Platform boot failed");
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
}

/// Rust-driven hardware metrics push — replaces frontend setInterval polling.
///
/// Runs every 2s. Emits `"model:hardware"` Tauri events with fresh metrics.
/// The frontend just listens — no timers, no browser throttling issues.
fn spawn_hardware_push(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(2));
        loop {
            interval.tick().await;

            // Access managed state each tick via AppHandle
            let state = app.state::<PlatformState>();
            let platform_arc = {
                let guard = state.platform.read().await;
                guard.clone()
            };

            let Some(platform) = platform_arc else {
                continue;
            };

            #[cfg(feature = "inference")]
            {
                let Some(loader) = platform.model_loader() else {
                    continue;
                };
                let metrics = loader.hardware_metrics().await;
                let _ = app.emit("model:hardware", &metrics);
            }
        }
    });
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
                        ('proj-2', 'clyffy-kernel', 'D:/localdev/platform_devpulse/kernel', 'personal'),
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
