//! `DevPulse` Desktop — Tauri backend.
//!
//! The Tauri layer depends on `devpulse-engine` only — never on clyffy.
//! All kernel access goes through the Platform engine.
//!
//! # Boot Architecture (P0: Boot Never Freezes)
//!
//! **Window-first, detached boot — identical in dev and release.**
//!
//! `setup()` shows the main window BEFORE spawning the boot task.
//! The frontend renders a skeleton + StatusBar immediately. Services
//! boot on a detached task and emit `platform:service-ready` events
//! as they come online. Each surface (chat, dashboard, etc.) lights
//! up reactively when its backing service is ready.
//!
//! There is no blocking path. There is no "wait for everything before
//! showing the window." If DevForge takes 23s, you see the window at
//! t=0 with "DevForge: initializing…" — not a blank screen for 23s.
//!
//! Terminal still shows real-time progress via boot.log sink (stderr)
//! in both modes. Frontend DevTools (F12) show platform events live.

pub mod commands;
pub mod logging;
pub mod paths;
pub mod state;

use devpulse_engine::platform::{InitStatus, Platform};
use devpulse_telemetry::boot::TelemetryGuard;
use state::{BootStateTracker, ModelsStatusSnapshot, PlatformState};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tauri_specta::{collect_commands, Builder};

/// Bootstrap and run the Tauri application.
///
/// # Panics
/// Panics if the Tauri runtime fails to start.
#[allow(clippy::expect_used, clippy::too_many_lines)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ── Dev-build diagnostic env vars ────────────────────────────
    // Set before Tauri constructs any thread so WebView2 + the Rust
    // runtime pick these up at startup.
    #[cfg(debug_assertions)]
    {
        // Chromium / WebView2 stderr logging: every JS exception,
        // console.error, unhandled promise rejection, navigation
        // failure, and renderer crash prints to the Tauri process's
        // stderr. Visible in the terminal even when F12 is frozen.
        if std::env::var_os("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").is_none() {
            // SAFETY: single-threaded at this point in `run()`.
            std::env::set_var(
                "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
                "--enable-logging=stderr --v=1",
            );
        }
        // Rust backtrace on panic. Our panic hook (see logging.rs) uses
        // `Backtrace::force_capture()` anyway, but this also covers the
        // case where a panic escapes to the default handler.
        if std::env::var_os("RUST_BACKTRACE").is_none() {
            std::env::set_var("RUST_BACKTRACE", "1");
        }
        if std::env::var_os("RUST_LIB_BACKTRACE").is_none() {
            std::env::set_var("RUST_LIB_BACKTRACE", "1");
        }
    }

    // ── specta: typed IPC bindings ──────────────────────────────
    let builder = Builder::<tauri::Wry>::new().commands(collect_commands![
        commands::chat::pick_save_file,
        commands::chat::send_message,
        commands::chat::store_assistant_turn,
        commands::chat::history::load_recent,
        commands::chat::sessions::list_sessions,
        commands::chat::sessions::delete_session,
        commands::chat::sessions::clear_all_chat_history,
        commands::chat::sessions::export_session,
        commands::chat::sessions::export_all_sessions,
        commands::chat::interactions::post_reaction,
        commands::sys::config::get_settings,
        commands::sys::config::get_preference,
        commands::sys::config::set_preference,
        commands::sys::guard::verify,
        commands::sys::logger::log,
        commands::sys::action_log::tail_action_log,
        commands::sys::action_log::open_action_logs_folder,
        commands::sys::boot::get_boot_state,
        commands::sys::metrics::get_process_metrics,
        commands::sys::telemetry::get_lane_config,
        commands::sys::telemetry::set_lane_config,
        commands::sys::telemetry::query_span_traces,
        commands::sys::telemetry::query_lane_baselines,
        // Vector store (RRO) devtools
        commands::sys::vector::get_vector_config,
        commands::sys::vector::set_vector_config,
        commands::sys::vector::get_vector_health,
        commands::sys::vector::vector_test_search,
        commands::sys::vector::create_vector_collection,
        commands::sys::vector::delete_vector_collection,
        commands::sys::vector::get_retrieval_param_meta,
        // Graph store (SurrealDB) devtools
        commands::sys::graph::ping_graph,
        commands::sys::graph::graph_health_all,
        commands::sys::graph::graph_list_tables,
        commands::sys::graph::graph_stats,
        commands::sys::graph::graph_query,
        commands::sys::graph::graph_kv_list,
        // Relational store (LibSQL) devtools
        commands::sys::relational::libsql_health_all,
        commands::sys::relational::libsql_list_tables,
        commands::sys::relational::libsql_query,
        // Project store (per-project LibSQL) devtools
        commands::sys::project_db::init_project_db,
        commands::sys::project_db::project_db_health,
        commands::sys::project_db::project_db_list_tables,
        commands::sys::project_db::project_db_query,
        // Analytics store (DuckDB) devtools
        commands::sys::analytics::duckdb_health,
        commands::sys::analytics::duckdb_list_tables,
        commands::sys::analytics::duckdb_query,
        commands::devclyffy::get_status,
        commands::devforge::spawn_reh_server,
        commands::devforge::stop_reh_server,
        commands::devforge::get_reh_status,
        commands::devforge::get_connection_url,
        commands::devforge::devforge_get_status,
        commands::devforge::devforge_list_recent_projects,
        commands::devforge::devforge_add_project,
        commands::devforge::devforge_remove_project,
        commands::devforge::devforge_set_fresh_instance,
        commands::devforge::window::open_devforge_window,
        commands::devforge::window::close_devforge_window,
        commands::devpulse::fetch_dashboard,
        commands::devpulse::profile::fetch_user_profile,
        commands::devpulse::profile::update_user_profile,
        commands::devpulse::profile::fetch_user_preferences,
        commands::devpulse::profile::update_user_preferences,
        commands::knowledge::get_knowledge_entry,
        commands::knowledge::record_knowledge_reaction,
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
        commands::models::mark_setup_complete,
        commands::models::is_setup_complete,
        commands::models::assign_model_to_slot,
        commands::models::load_slot,
        commands::models::unload_slot,
        commands::models::swap_slot_model,
        commands::models::download_model,
        commands::models::cancel_download,
        commands::models::set_hf_token,
        commands::models::has_hf_token,
        commands::models::clear_hf_token,
        commands::models::hf_token_suffix,
        commands::models::get_assistant_config,
        commands::models::set_assistant_name,
        commands::models::set_wake_phrase,
        commands::models::set_wake_enabled,
        commands::models::set_voice_brain_24_7,
        commands::models::set_voice_profile,
        commands::models::register_voice_clone,
        commands::models::remove_voice_clone,
        commands::models::add_keyword_action,
        commands::models::remove_keyword_action,
        commands::models::update_keyword_action,
        commands::models::set_idle_timeout,
        commands::models::set_brain_ngl,
        commands::models::upload_voice_sample,
        commands::models::list_kokoro_voices,
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
        // Compatibility registry — architecture × backend matrix
        commands::models::list_backend_matrix,
        commands::models::resolve_architecture_compatibility,
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
        // llama.cpp sidecar (GGUF inference)
        commands::llama::start_llama_server,
        commands::llama::stop_llama_server,
        commands::llama::llama_server_health,
        commands::llama::llama_chat,
        commands::llama::llama_embed,
        // Cloud inference (Anthropic API — dogfooding + turbo escalation)
        commands::cloud::get_inference_provider,
        commands::cloud::set_inference_provider,
        commands::cloud::cloud_ready,
        commands::cloud::cloud_chat,
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

    // Export-only mode: `DEVPULSE_BINDINGS_EXPORT_ONLY=1 cargo run
    // -p devpulse_desktop_backend` writes bindings.ts and exits
    // before the Tauri builder touches the window system. Used by
    // the pre-push hook + CI regen pipeline so svelte-check always
    // sees current types without needing to launch the whole app.
    #[cfg(debug_assertions)]
    if std::env::var("DEVPULSE_BINDINGS_EXPORT_ONLY").is_ok() {
        eprintln!("[bindings-export] specta bindings written; exiting early");
        return;
    }

    // ── IPC tracing wrapper ─────────────────────────────────────
    // Every invoke() from the frontend passes through this middleware
    // BEFORE specta/Tauri dispatch. Logs the command name at TRACE so
    // we can prove commands reach the Rust side (vs frontend-side hang).
    // If we see `invoke received` but no corresponding handler output,
    // the hang is inside the handler (not in IPC dispatch).
    let specta_handler = builder.invoke_handler();
    let traced_invoke_handler = move |invoke: tauri::ipc::Invoke<tauri::Wry>| -> bool {
        tracing::trace!(
            target: "ipc",
            command = invoke.message.command(),
            "invoke received"
        );
        specta_handler(invoke)
    };

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
        .invoke_handler(traced_invoke_handler)
        .setup(move |app| {
            builder.mount_events(app);
            // ── Telemetry: create OTel provider + layer (no subscriber yet) ──
            let telemetry_setup = devpulse_telemetry::boot::prepare(
                env!("CARGO_PKG_VERSION"),
                &format!("session-{}", chrono::Local::now().format("%Y%m%d-%H%M%S")),
            );
            let telemetry_handle = telemetry_setup.handle;
            let otel_layer = telemetry_setup.layer;

            // ── Data directory resolution ─────────────────────────
            let data_dir = crate::paths::resolve_data_dir(app).map_err(|e| {
                Box::new(std::io::Error::new(std::io::ErrorKind::Other, e))
                    as Box<dyn std::error::Error>
            })?;

            // ── Logging: stderr + file + DuckDB + OTel ────────────
            let _ = logging::rotate_logs(&data_dir);
            let mut span_rx = match logging::init(&data_dir, otel_layer) {
                Ok(handle) => {
                    // Leak the file guard so file logging lives for the entire process
                    std::mem::forget(handle.file_guard);
                    Some(handle.span_rx)
                }
                Err(e) => {
                    eprintln!("[FATAL] logging::init failed: {e:?}");
                    logging::init_stderr_only();
                    None
                }
            };
            tracing::info!(data_dir = %data_dir.display(), "DevPulse Desktop starting");

            // ── Telemetry: install OTLP JSONL file exporter ──────
            let telemetry_dir = data_dir.join("telemetry");
            let telemetry_guard = match devpulse_telemetry::boot::install_exporter(
                telemetry_handle,
                &telemetry_dir,
                3, // keep 3 session files
            ) {
                Ok(guard) => {
                    tracing::info!(
                        dir = %telemetry_dir.display(),
                        "OTel JSONL file exporter active — boot-time buffer drained"
                    );
                    Some(guard)
                }
                Err(e) => {
                    tracing::warn!(
                        error = %e,
                        "OTel file exporter failed to initialize — spans will buffer and drop"
                    );
                    None
                }
            };

            // ── Platform state (empty until boot completes) ───────
            // Resolve the per-platform bundled REH seed tree inside the
            // Tauri resource dir. `resources/devforge/` (base of the bundle
            // is just `devforge/` once installed — per-target configs strip
            // the platform subdir prefix at bundle time).
            let devforge_paths = match app.path().resource_dir() {
                Ok(resource_dir) => {
                    let bundled = resource_dir.join("devforge");
                    commands::devforge::paths::DevforgePaths::from_paths(&data_dir, bundled)
                }
                Err(_) => commands::devforge::paths::DevforgePaths::from_data_dir(&data_dir),
            };

            // First-launch seed: copy the bundled REH tree into the
            // runtime install dir if the install is empty. Idempotent —
            // no-op once `install/current/` points at a valid tree.
            if let Err(err) = devforge_paths.ensure_layout() {
                tracing::warn!(%err, "DevForge: ensure_layout failed");
            }
            if let Err(err) = devforge_paths.seed_install_from_bundle() {
                tracing::warn!(%err, "DevForge: seed_install_from_bundle failed");
            }

            app.manage(PlatformState::new(devforge_paths));
            app.manage(BootStateTracker::new());
            app.manage(std::sync::Mutex::new(telemetry_guard));
            app.manage(commands::llama::LlamaServerState::new());
            app.manage(commands::voice::PlaybackState::new());

            // DevForge REH now boots through the platform service pipeline
            // (boot/devforge.rs), NOT a parallel Tauri bootstrap. Removed
            // the async_runtime::spawn(bootstrap::run(...)) call. The
            // devforge://ready event is emitted from the boot callback.

            // ── P0: Boot Never Freezes — UI-first, lock-free async ──
            //
            // Window shows IMMEDIATELY (before services boot). The frontend
            // renders a skeleton + StatusBar with per-service progress.
            // Boot runs detached — any individual service can take as long
            // as it needs, the UI stays responsive and visible throughout.
            //
            // Services announce themselves via `platform:service-ready` /
            // `platform:service-failed` events. The frontend subscribes
            // and lights up each surface as its backing service comes online.
            let handle = app.handle().clone();
            let tracker = app.state::<BootStateTracker>();
            let tracker_clone = tracker.clone_tracker();

            // Show window NOW — do not wait for boot. This is the core
            // P0 invariant: cold boot window visible in <2s.
            //
            // In dev builds we ALSO open devtools automatically — without it,
            // webview crashes that happen before the Svelte logger bridge is
            // ready never land in the Rust JSONL (the IPC invoke silently fails
            // when __TAURI_INTERNALS__ hasn't connected yet). Opening devtools
            // gives an always-visible console for those early crashes.
            //
            // Opt out with `DEVPULSE_NO_DEVTOOLS=1`.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                tracing::info!("Main window shown immediately (pre-boot) — frontend renders skeleton while services initialize");

                #[cfg(debug_assertions)]
                {
                    let want_devtools = std::env::var("DEVPULSE_NO_DEVTOOLS").is_err();
                    if want_devtools {
                        window.open_devtools();
                        tracing::info!("Dev build: devtools opened automatically (set DEVPULSE_NO_DEVTOOLS=1 to disable)");
                    }
                }
            } else {
                tracing::warn!("Could not get 'main' webview window to show pre-boot — tauri.conf.json label mismatch?");
            }

            tracing::info!("Detached boot — window already visible, services booting in background");
            tauri::async_runtime::spawn(
                boot_task(handle, data_dir, tracker_clone, span_rx.take())
            );

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
                    // DevForge REH shutdown is now handled by Platform::shutdown()
                    // via the DevForgeService::shutdown() impl — same pipeline
                    // as every other Layer 1 service.

                    // P0: lock-free atomic load.
                    if let Some(platform) = state.platform.load_full() {
                        platform.shutdown().await;
                    }
                });

                // Flush OTel spans AFTER platform shutdown (captures shutdown spans).
                let telemetry = app.state::<std::sync::Mutex<Option<TelemetryGuard>>>();
                if let Ok(mut lock) = telemetry.lock() {
                    if let Some(guard) = lock.take() {
                        guard.shutdown();
                        tracing::info!("OTel telemetry flushed");
                    }
                }

                tracing::info!("Platform shutdown complete — process exiting");
            }
        });
}

/// Boot task — boots all platform services and emits progress events.
///
/// In dev mode this runs BLOCKING (setup waits for it).
/// In release mode this runs as a spawned async task.
///
/// The engine's `BootLog` handles real-time file + stderr logging.
/// This function handles Tauri-specific concerns: events, state, seeding.
#[allow(clippy::too_many_lines)]
#[tracing::instrument(skip_all, fields(data_dir = %data_dir.display()))]
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
            // P0: lock-free atomic store. Boot task writes exactly once.
            state.platform.store(Some(Arc::new(platform)));

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
                tracing::info!("boot: atomic-loading platform for model readiness check...");
                // P0: lock-free atomic load.
                let platform_opt = state.platform.load_full();
                tracing::info!("boot: platform loaded (lock-free)");
                if let Some(ref platform) = platform_opt {
                    if let Some(loader) = platform.model_loader() {
                        tracing::info!("boot: get_registry...");
                        let registry = loader.get_registry().await;
                        tracing::info!("boot: list_slots...");
                        let slots = loader.list_slots().await;
                        tracing::info!("boot: is_first_run...");
                        let first_run = loader.is_first_run().await;
                        let assigned = slots.iter()
                            .filter(|s| s.assigned_model.is_some())
                            .count();
                        tracing::info!("boot: is_setup_complete...");
                        let setup_done = loader.is_setup_complete().await;
                        tracing::info!("boot: all loader queries done — building snapshot");
                        let ready = setup_done && !registry.is_empty() && assigned > 0;
                        tracing::info!(
                            models = registry.len(),
                            slots = slots.len(),
                            assigned,
                            first_run,
                            setup_done,
                            ready,
                            "Model readiness check"
                        );
                        let models_snapshot = ModelsStatusSnapshot {
                            ready,
                            first_run,
                            model_count: registry.len(),
                            slot_count: slots.len(),
                            assigned_count: assigned,
                            error: None,
                        };
                        // Push full model state — frontend sets $state directly
                        let slot_infos: Vec<commands::models::SlotInfo> = slots
                            .iter()
                            .map(|s| commands::models::slot_to_slot_info(s, &registry))
                            .collect();
                        let model_infos: Vec<commands::models::ModelInfo> = registry
                            .iter()
                            .map(|e| commands::models::entry_to_model_info(e))
                            .collect();
                        commands::emit_status(
                            &app,
                            "models",
                            commands::StatusKind::Data,
                            &commands::models::ModelsStatusData {
                                slots: slot_infos,
                                models: model_infos,
                                first_run,
                            },
                        );
                        // Store in tracker so get_boot_state catches up
                        // late-mounting frontends that missed the live event.
                        tracker.set_models_status(models_snapshot);
                        tracing::info!("boot: model readiness block done — dropping platform read lock");
                        ready
                    } else {
                        tracing::warn!("Model Loader not available — models not ready");
                        commands::emit_status(
                            &app,
                            "models",
                            commands::StatusKind::Data,
                            &commands::models::ModelsStatusData {
                                slots: vec![],
                                models: vec![],
                                first_run: true,
                            },
                        );
                        false
                    }
                } else {
                    false
                }
            };
            tracing::info!("boot: platform read lock RELEASED — IPC commands unblocked");

            // Window was already shown pre-boot (P0). Frontend received
            // `platform:boot-phase = ready` above and has swapped its
            // skeleton for the full UI already — no additional event needed.
            tracing::info!("All services confirmed — main window already visible since pre-boot");

            // Chat window is USER-INITIATED only — never auto-opened from boot.
            // The inline ModelSetupBanner guides first-run setup within the
            // main window. User opens chat via sidebar nav or "Complete Setup".
            if models_ready {
                tracing::info!("Models ready and setup complete — app fully operational");
            } else {
                tracing::info!("Setup not complete — inline model banner will guide user");
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
            // P0: lock-free atomic load.
            let platform_arc = state.platform.load_full();

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
                        ('user-1', NULL, '32g_engineer', 0, 1);

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
