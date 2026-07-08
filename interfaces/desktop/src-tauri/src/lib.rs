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
//! The frontend renders a skeleton + `StatusBar` immediately. Services
//! boot on a detached task and emit `platform:service-ready` events
//! as they come online. Each surface (chat, dashboard, etc.) lights
//! up reactively when its backing service is ready.
//!
//! There is no blocking path. There is no "wait for everything before
//! showing the window." If `DevForge` takes 23s, you see the window at
//! t=0 with "`DevForge`: initializing…" — not a blank screen for 23s.
//!
//! Terminal still shows real-time progress via boot.log sink (stderr)
//! in both modes. Frontend `DevTools` (F12) show platform events live.

pub mod commands;
pub mod connection_store;
pub mod crash_safety;
pub mod events;
pub mod logging;
pub mod paths;
pub mod state;

pub use crash_safety::install_early_panic_hook;

use devpulse_engine::platform::{InitStatus, Platform};
use devpulse_telemetry::boot::TelemetryGuard;
use devpulse_telemetry::spawn_blocking;
use events::{BootPhaseChanged, BootPhaseValue, HardwareMetricsUpdated};
use state::{BootStateTracker, ModelsStatusSnapshot, PlatformState};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tauri_specta::Event;
use tauri_specta::{collect_commands, collect_events, Builder};

/// Boot a Platform without Tauri and serve MCP over stdio.
///
/// Entry point for the `--mcp-stdio` CLI mode. Claude Code spawns this
/// subprocess on demand: it pipes JSON-RPC over stdin/stdout while the
/// parent process talks to the user. We MUST keep stdin/stdout pristine
/// (only the rmcp protocol writes there); diagnostics go to stderr.
///
/// Lifecycle:
/// 1. Resolve the data dir from `<exe>/.userdata` or the dev fallback.
/// 2. Boot a full `Platform` (we share the same persistence the GUI uses
///    so MCP tools see live state).
/// 3. Hand the platform to `claude::mcp::start_stdio` and block until EOF.
/// 4. Exit non-zero on any error so Claude Code surfaces the failure.
///
/// # Panics
/// Panics only if the tokio runtime can't be constructed — at which point
/// there is nothing useful to recover to.
#[allow(clippy::expect_used)]
pub fn run_mcp_stdio() {
    // Logging: stderr-only, INFO level. The file sink would also work but
    // the subprocess is short-lived per invocation; one tracing subscriber
    // attached for the duration of the rmcp connection is enough.
    let _ = tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .try_init();

    let runtime =
        tokio::runtime::Runtime::new().expect("tokio runtime construction failed in --mcp-stdio");

    let exit_code = runtime.block_on(async {
        let data_dir = match paths::resolve_data_dir_standalone() {
            Ok(d) => d,
            Err(e) => {
                eprintln!("devpulse-mcp: {e}");
                return 1;
            }
        };
        tracing::info!(data_dir = %data_dir.display(), "MCP stdio: booting platform");

        let platform = match Platform::boot(data_dir, |_| {}, None).await {
            Ok(p) => Arc::new(p),
            Err(e) => {
                eprintln!("devpulse-mcp: platform boot failed: {e:#}");
                return 1;
            }
        };

        if let Err(e) = devpulse_engine::claude::mcp::start_stdio(platform).await {
            eprintln!("devpulse-mcp: stdio session failed: {e:#}");
            return 1;
        }
        0
    });

    std::process::exit(exit_code);
}

/// Construct the tauri-specta `Builder` with the full command surface.
///
/// Shared by [`run`] (runtime app) and `bin/export-bindings.rs` (the
/// bindings-export tool). The command list is the single source of
/// truth for both — there is no way for them to drift.
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_specta_builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            commands::chat::pick_save_file,
            commands::chat::send_message,
            commands::chat::store_assistant_turn,
            commands::chat::history::load_recent,
            commands::chat::suggest::suggest_query,
            commands::chat::suggest::suggest_record,
            commands::chat::sessions::list_sessions,
            commands::chat::sessions::delete_session,
            commands::chat::sessions::clear_all_chat_history,
            commands::chat::sessions::export_session,
            commands::chat::sessions::export_all_sessions,
            commands::chat::interactions::post_reaction,
            commands::sys::config::get_settings,
            commands::sys::config::list_services,
            commands::sys::config::get_preference,
            commands::sys::config::set_preference,
            commands::sys::guard::verify,
            commands::sys::logger::log,
            commands::sys::action_log::tail_action_log,
            commands::sys::action_log::open_action_logs_folder,
            commands::sys::scoped_log::query_scoped_log,
            commands::sys::boot::get_boot_state,
            commands::sys::metrics::get_process_metrics,
            commands::sys::telemetry::get_lane_config,
            commands::sys::telemetry::set_lane_config,
            commands::sys::telemetry::query_span_traces,
            commands::sys::telemetry::query_lane_baselines,
            commands::sys::telemetry::get_telemetry_info,
            commands::sys::telemetry::list_telemetry_sessions,
            commands::sys::telemetry::open_telemetry_folder,
            commands::sys::telemetry::get_telemetry_row_counts,
            // Vector store (RRO/qortex) devtools. In the standalone desktop
            // (no `kernel-inproc`) these return a typed "Tier-2 unavailable"
            // until Clyffy connects over the gb10-client wire; the real
            // in-process impl is compiled only under `kernel-inproc`.
            commands::sys::vector::get_vector_config,
            commands::sys::vector::set_vector_config,
            commands::sys::vector::get_vector_health,
            commands::sys::vector::vector_test_search,
            commands::sys::vector::create_vector_collection,
            commands::sys::vector::delete_vector_collection,
            commands::sys::vector::get_retrieval_param_meta,
            // RRO state machine (reasoning lifecycle)
            commands::sys::rro_state::get_rro_state,
            commands::sys::rro_state::set_rro_depth,
            commands::sys::rro_state::trigger_rro_gather,
            commands::sys::rro_state::trigger_rro_purge,
            commands::sys::rro_state::trigger_rro_fork,
            commands::sys::rro_state::set_rro_proximity,
            // Grammar (structured-output constraint engine) — same tier as RRO
            commands::sys::grammar::get_grammar_state,
            commands::sys::grammar::set_grammar_kind,
            commands::sys::grammar::enable_grammar,
            commands::sys::grammar::disable_grammar,
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
            // Cache service (Moka) devtool
            commands::sys::cache::cache_health,
            // Clyffy wire connection status (gb10-client) — Tier-2 availability.
            commands::sys::clyffy::connection_status,
            // Runtime connect/disconnect — re-points the probe loop without a restart.
            commands::sys::clyffy::connect_clyffy,
            commands::sys::clyffy::disconnect_clyffy,
            // Persisted connect-or-skip decision — drives the boot gate.
            commands::sys::clyffy::is_clyffy_setup_decided,
            commands::sys::clyffy::skip_clyffy_setup,
            commands::devclyffy::get_status,
            commands::devforge::devforge_start,
            commands::devforge::devforge_stop,
            commands::devforge::devforge_restart,
            commands::devforge::devforge_health,
            commands::devforge::get_reh_status,
            commands::devforge::get_connection_url,
            commands::devforge::devforge_get_status,
            commands::devforge::devforge_get_config,
            commands::devforge::devforge_list_recent_projects,
            commands::devforge::devforge_add_project,
            commands::devforge::devforge_remove_project,
            commands::devforge::devforge_set_fresh_instance,
            commands::devforge::window::open_devforge_window,
            commands::devforge::window::close_devforge_window,
            commands::candle::candle_load_config,
            commands::candle::candle_save_config,
            commands::candle::candle_restart_pool,
            commands::llama_cpp_embedded::llama_cpp_embedded_load_config,
            commands::llama_cpp_embedded::llama_cpp_embedded_save_config,
            commands::llama_cpp::llama_cpp_build_info,
            commands::llama_cpp::llama_cpp_open_prebuilt_dir,
            commands::llama_cpp::llama_cpp_bump_manifest,
            commands::ollama::sidecar::ollama_start,
            commands::ollama::sidecar::ollama_stop,
            commands::ollama::sidecar::ollama_restart,
            commands::ollama::sidecar::ollama_status,
            commands::ollama::sidecar::ollama_health,
            commands::ollama::sidecar::ollama_config,
            commands::ollama::sidecar::ollama_list_models,
            commands::ollama::sidecar::ollama_pull_model,
            commands::ollama::sidecar::ollama_delete_model,
            commands::surreal::sidecar::surreal_status,
            commands::surreal::sidecar::surreal_health,
            commands::surreal::sidecar::surreal_config_load,
            commands::surreal::sidecar::surreal_config_save,
            // Connectome governance graph (CORTEX.md §4) — B-1 foundation slice.
            commands::connectome::connectome_thought_create,
            commands::connectome::connectome_thought_load_branch,
            commands::connectome::connectome_swap_encoder,
            commands::intelligence::intel_status,
            commands::intelligence::intel_list_projects,
            commands::intelligence::intel_save_memory,
            commands::intelligence::infer_capability_bucket,
            commands::interactions::get_interaction_template,
            commands::sherpa::sherpa_compile_info,
            commands::sherpa::sherpa_list_models,
            commands::sherpa::sherpa_delete_model,
            commands::sherpa::sherpa_start_session,
            commands::sherpa::sherpa_feed_audio,
            commands::sherpa::sherpa_finish_session,
            commands::sherpa::sherpa_stop_session,
            commands::sherpa::sherpa_list_sessions,
            commands::sherpa::sherpa_models_dir,
            commands::claude::get_mcp_status,
            commands::claude::detect_claude_installs,
            commands::claude::register_devpulse_mcp,
            commands::claude::unregister_devpulse_mcp,
            // Direct Anthropic API (BYO key) path. Sibling to the MCP-via-
            // subprocess registration above — different way to talk to
            // Claude, same Claude. Registered through the submodule path
            // because `collect_commands!` follows the attribute-macro-
            // generated symbol names (`__cmd__*`, `__specta__fn__*`) at
            // the literal path, not through `pub use` re-exports.
            commands::claude::ping::ping_claude,
            commands::claude::ping::anthropic_key_present,
            // AI Providers — multi-vendor SSOT-driven validation surface
            commands::providers::list_provider_status,
            commands::providers::validate_provider,
            commands::providers::list_provider_models,
            // PixVix — capture primitives (V-3): monitor/window/webcam one-shots.
            // `pixvix_*` prefix avoids collision with the existing
            // `commands::window` module that owns `list_windows` for window
            // manipulation (Tauri/specta uses module-flat `__cmd__{name}`
            // codegen so name uniqueness across modules matters).
            commands::pixvix::pixvix_list_monitors,
            commands::pixvix::pixvix_capture_monitor_once,
            commands::pixvix::pixvix_list_windows,
            commands::pixvix::pixvix_capture_window_once,
            commands::pixvix::pixvix_list_webcams,
            commands::pixvix::pixvix_capture_webcam_once,
            commands::devpulse::fetch_dashboard,
            commands::devpulse::profile::fetch_user_profile,
            commands::devpulse::profile::update_user_profile,
            commands::devpulse::profile::fetch_user_preferences,
            commands::devpulse::profile::update_user_preferences,
            commands::projects::create_project,
            commands::projects::list_projects,
            commands::projects::get_project,
            commands::projects::delete_project,
            commands::projects::restore_project,
            commands::projects::get_active_project,
            commands::projects::set_active_project,
            commands::projects::clear_active_project,
            commands::projects::add_project_reference,
            commands::projects::list_project_references,
            commands::projects::remove_project_reference,
            commands::knowledge::get_knowledge_entry,
            commands::knowledge::record_knowledge_reaction,
            commands::knowledge::sync_knowledge_from_remote,
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
            commands::models::clear_slot_assignment,
            commands::models::swap_slot_model,
            commands::models::download_model,
            commands::models::models_dir_path,
            commands::models::recommend_primary_for_slot,
            commands::models::install_to_slot,
            commands::models::cancel_download,
            commands::models::list_repo_files,
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
            commands::models::list_runtime_fingerprints,
            commands::models::check_runtime_updates,
            commands::models::warm_slot,
            commands::models::delete_model,
            commands::models::search_huggingface,
            commands::models::import_local_model,
            commands::models::pick_directory,
            commands::models::pick_audio_file,
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
            // Burn encoder — text embedding (Phase C: tokenizer + forward pass)
            commands::models::encoder_is_loaded,
            commands::models::encoder_embed,
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
            commands::voice::voice_tts_load_config,
            commands::voice::voice_tts_save_config,
            commands::voice::voice_stt_load_config,
            commands::voice::voice_stt_save_config,
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
            // Supabase cloud credentials (auth + remote DB + storage)
            commands::cloud::secrets::get_supabase_credentials,
            commands::cloud::secrets::set_supabase_anon_key,
            commands::cloud::secrets::clear_supabase_anon_key,
            commands::cloud::secrets::get_supabase_credentials_status,
            // License validation (dev-mode bypass; Supabase wiring is follow-up)
            commands::cloud::license::validate_license,
            commands::cloud::license::get_license_summary,
            // Onboarding analytics — typed event stream into tracing pipeline
            commands::analytics::emit_analytics_event,
            // Routing config (escalation chain + latency tuning, user scope)
            commands::routing::routing_load_config,
            commands::routing::routing_save_config,
            // Auto-updater — tauri-plugin-updater wrapped in typed surface.
            commands::updates::check_for_update,
            commands::updates::install_update,
            commands::updates::get_update_channel,
            commands::updates::set_update_channel,
            // Community feed — local cache + remote Supabase sync.
            commands::community::fetch_feed,
            commands::community::sync_community_feed,
            commands::community::community_status,
            commands::community::set_community_enabled_cmd,
        ])
        .events(collect_events![
            // Platform boot lifecycle — replaces `platform:boot-phase` string event.
            events::BootPhaseChanged,
            // Periodic hardware push (2 s tick) — replaces `model:hardware`.
            events::HardwareMetricsUpdated,
            // llama-server sidecar — replaces `llama:server-ready` / `llama:token`.
            events::LlamaServerReady,
            events::LlamaTokenStreamed,
            // In-process Candle / llama.cpp FFI inference — replaces `inference-token`.
            events::InferenceTokenStreamed,
            // Cloud inference (Anthropic Messages API) — replaces `provider:changed`,
            // `cloud:token`, `cloud:complete`.
            events::InferenceProviderChanged,
            events::CloudTokenStreamed,
            events::CloudCompletionFinished,
            // Chat sessions — replaces `platform:chat-session-deleted`.
            events::ChatSessionDeleted,
            // Auto-updater lifecycle — replaces ad-hoc string events.
            events::UpdateAvailable,
            events::UpdateDownloadProgress,
            events::UpdateInstallFinished,
            // Clyffy wire connection — probe task pushes state transitions.
            events::ClyffyConnectionChanged,
        ])
}

/// Background Clyffy connection probe + seamless auto-reconnect.
///
/// Builds one kernel-free [`ClyffyClient`] and probes `{base_url}/v1/capability`
/// every `interval`. Each **changed** state is written to the managed
/// [`ClyffyConnectionState`] and pushed to the frontend as a
/// [`ClyffyConnectionChanged`] event. An unreachable endpoint yields
/// `Disconnected` (honest standalone) — never a fabricated capability — and the
/// loop keeps retrying so the AI layer lights up seamlessly whenever Clyffy comes
/// back. Detached via `devpulse_telemetry::spawn`; never awaited by boot.
///
/// [`ClyffyClient`]: devpulse_gb10_client::ClyffyClient
/// [`ClyffyConnectionState`]: crate::state::ClyffyConnectionState
/// [`ClyffyConnectionChanged`]: crate::events::ClyffyConnectionChanged
async fn clyffy_probe_loop(
    app: tauri::AppHandle,
    interval: std::time::Duration,
    timeout: std::time::Duration,
) {
    use crate::events::ClyffyConnectionChanged;
    use crate::state::ClyffyConnectionState;
    use devpulse_gb10_client::{ClyffyClient, ConnectionState};
    use tauri::Manager;
    use tauri_specta::Event;

    let client = match ClyffyClient::new(timeout) {
        Ok(c) => c,
        Err(err) => {
            tracing::warn!(%err, "clyffy probe: HTTP client build failed — AI layer stays offline");
            return;
        }
    };

    // Write managed state + emit the typed transition to the webview.
    let publish = |next: &ConnectionState| {
        app.state::<ClyffyConnectionState>().store(next.clone());
        let _ = ClyffyConnectionChanged {
            connection: next.clone(),
        }
        .emit(&app);
    };

    let mut last = app.state::<ClyffyConnectionState>().current();

    loop {
        // Re-read the target endpoint every tick — it is re-pointable at runtime
        // via `connect_clyffy` / `disconnect_clyffy` with no restart. `None` is
        // the honest standalone (Tier-1) answer; a set endpoint that is
        // unreachable stays `Disconnected` and the loop keeps retrying so the AI
        // layer lights up seamlessly whenever Clyffy comes back.
        let next = match app.state::<ClyffyConnectionState>().endpoint() {
            None => ConnectionState::Disconnected,
            Some(url) => match client.probe_capability(&url).await {
                Ok(capability) => ConnectionState::Connected { url, capability },
                Err(_) => ConnectionState::Disconnected,
            },
        };
        if next != last {
            publish(&next);
            last = next;
        }
        tokio::time::sleep(interval).await;
    }
}

/// Bootstrap and run the Tauri application.
///
/// # Panics
/// Panics if the Tauri runtime fails to start.
#[allow(clippy::expect_used, clippy::too_many_lines)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ── Windows: make bundled runtime DLLs discoverable to children ──
    //
    // The NSIS installer lays out its resources under
    // `$INSTDIR/binaries/` (Tauri array-form `bundle.resources` preserves
    // the source subdirectory). `llama-server.exe` is spawned as a child
    // process via tauri-plugin-shell; when Windows resolves ITS imports
    // (llama.dll, ggml-cuda.dll, cublas64_12.dll, cublasLt64_12.dll,
    // cudart64_12.dll, libomp, etc.) it searches its own directory
    // first, then `PATH`. If `binaries/` isn't on `PATH`, the imports
    // fail and the sidecar dies on startup with a cryptic `0xC0000135`.
    //
    // Modifying the parent process's `PATH` here ensures every child
    // spawned from this point on inherits an environment where
    // `<exe_dir>/binaries/` is first on the search list. No-op in dev
    // (target/debug doesn't have a `binaries/` subdir), no-op in the
    // portable zip (flat layout — DLLs already sibling the exe).
    //
    // There is a known Tauri bundler bug ([#9525]) where object-form
    // resources mapped to `./` don't land next to the exe; this hook
    // is the workaround that keeps the array-form (subdir) layout
    // actually loadable at runtime.
    //
    // [#9525]: https://github.com/tauri-apps/tauri/issues/9525
    #[cfg(windows)]
    {
        if let Ok(exe) = std::env::current_exe() {
            if let Some(exe_dir) = exe.parent() {
                let bin_dir = exe_dir.join("binaries");
                if bin_dir.is_dir() {
                    let existing = std::env::var_os("PATH").unwrap_or_default();
                    let joined = std::env::join_paths(
                        std::iter::once(bin_dir.clone()).chain(std::env::split_paths(&existing)),
                    )
                    .unwrap_or(existing);
                    // SAFETY: `run()` executes single-threaded before
                    // Tauri spins up any worker. Env mutation is safe
                    // here and only here.
                    std::env::set_var("PATH", joined);
                    eprintln!(
                        "devpulse: prepended {} to PATH for child DLL search",
                        bin_dir.display()
                    );
                }
            }
        }
    }

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
    // Construction is shared with `bin/export-bindings.rs`, the
    // dedicated tool used by `cargo xtask regen-bindings` and the
    // bindings-drift pre-commit hook. `run()` no longer writes
    // bindings.ts — that responsibility lives entirely in the
    // export-bindings binary, removing the prior env-var hack and
    // the spurious "write to a path relative to the installed exe's
    // cwd" behavior on every release launch.
    let builder = build_specta_builder();

    // ── IPC tracing wrapper ─────────────────────────────────────
    // Every invoke() from the frontend passes through this middleware
    // BEFORE specta/Tauri dispatch. Logs the command name at TRACE so
    // we can prove commands reach the Rust side (vs frontend-side hang).
    // If we see `invoke received` but no corresponding handler output,
    // the hang is inside the handler (not in IPC dispatch).
    //
    // **Level rationale (changed 2026-04-26).** Was DEBUG; production
    // sessions accumulated ~1.8 GB of JSONL in 2 hours because every
    // IPC poll (`get_status` runs every 5 s plus per-page polls)
    // emitted two DEBUG records that fell through the JSONL filter's
    // global `debug,...` directive and got persisted. Demoted to TRACE:
    // - Default release (faithful=off): JSONL filter is
    //   `debug,devpulse=trace,...` — `ipc` target matches `debug` so
    //   TRACE is BELOW threshold and these records are dropped on the
    //   floor. No disk-fill loop.
    // - `DEVPULSE_LOG_FAITHFUL=1` or debug builds: JSONL filter is
    //   `trace` globally — these still land verbatim. Operators
    //   debugging an IPC hang opt in via env var; the default no
    //   longer pays for it.
    // Handler-side `#[tracing::instrument]` spans are unaffected — those
    // are the canonical per-command trace and they stay at their
    // declared level.
    let specta_handler = builder.invoke_handler();
    let traced_invoke_handler = move |invoke: tauri::ipc::Invoke<tauri::Wry>| -> bool {
        let command = invoke.message.command().to_string();
        #[cfg(debug_assertions)]
        {
            let payload = format!("{:?}", invoke.message.payload());
            tracing::trace!(
                target: "ipc",
                command = %command,
                args = %payload,
                "invoke received"
            );
        }
        #[cfg(not(debug_assertions))]
        {
            tracing::trace!(target: "ipc", command = %command, "invoke received");
        }
        let start = std::time::Instant::now();
        let handled = specta_handler(invoke);
        let elapsed_us = start.elapsed().as_micros() as u64;
        tracing::trace!(
            target: "ipc",
            command = %command,
            handled,
            elapsed_us,
            "invoke dispatched"
        );
        handled
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
        .plugin(tauri_plugin_updater::Builder::new().build())
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
                Box::new(std::io::Error::other(e))
                    as Box<dyn std::error::Error>
            })?;

            // ── Ultra-early bootstrap log ─────────────────────────
            // Writes <data_dir>/bootstrap.log with "Rust is alive"
            // evidence + the resolved data/logs paths BEFORE the
            // tracing subscriber is initialized. If anything after
            // this point panics (incl. the tracing init itself, boot
            // pipeline, DLL load failures on first LoadLibrary call),
            // this file is the one guaranteed artifact the user has.
            // Also drops <exe_dir>/bootstrap-pointer.txt containing
            // just the path so the user can jump to the right log
            // location regardless of whether data_dir resolved to
            // %APPDATA%/DevPulse or the exe-sibling .userdata/.
            write_bootstrap_log(&data_dir);

            // ── Process-end marker ────────────────────────────────
            // RAII guard handed to Tauri's managed state so it lives
            // as long as the app does. Drops only on a clean Tauri
            // shutdown — at which point its Drop impl appends
            // `process_ended_at_utc: <ts>` to bootstrap.log. If the
            // process is killed mid-flight (segfault, taskkill, OOM,
            // window-vanish bug), the guard never drops and the
            // marker stays absent. Post-mortem checks bootstrap.log:
            // `process_started_at_utc` present + no end marker ⇒
            // abnormal termination ⇒ check stderr-<ts>.log next.
            app.manage(crash_safety::ProcessExitGuard::arm(
                data_dir.join("bootstrap.log"),
            ));

            // ── Stderr → file (Windows release safety net) ───────
            // Production runs `windows_subsystem = "windows"` so the
            // OS detaches stderr at process start; any default-panic-
            // handler printout, RUST_BACKTRACE dump, or third-party
            // crate that writes to fd 2 evaporates. Rebinding the
            // STD_ERROR_HANDLE to a file at this point captures every
            // subsequent byte. Runs BEFORE the tracing subscriber so
            // the file also catches stderr lines emitted between here
            // and `logging::init` completing.
            match crash_safety::redirect_stderr_to_file(&data_dir.join("logs")) {
                Ok(Some(path)) => {
                    eprintln!("devpulse: stderr captured to {}", path.display());
                }
                Ok(None) => {}
                Err(e) => {
                    eprintln!("devpulse: stderr redirect failed: {e}");
                }
            }

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
            // Clyffy wire connection — kernel-free managed state; probe task writes it.
            app.manage(crate::state::ClyffyConnectionState::new());

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
            // Spawn boot_task and chain a second task that awaits its
            // JoinHandle. Tokio wraps every spawned task in a catch_unwind
            // internally; the panic payload is preserved in the JoinError
            // and accessible via `.is_panic()` + `.try_into_panic()`. Without
            // this supervisor task a panic inside boot_task is swallowed
            // silently and the splash hangs forever. Now: panic → tracing
            // error + `platform:boot-failed` Tauri event → BootOverlay
            // frontend listener renders a red failure panel with the
            // message so the user sees the root cause instead of a frozen
            // spinner.
            let boot_handle = tauri::async_runtime::spawn(
                boot_task(handle, data_dir, tracker_clone, span_rx.take())
            );
            let emit_on_fail = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match boot_handle.await {
                    Ok(()) => {
                        // boot_task ran to completion. Its own code path
                        // handles success / subsystem-error emission.
                    }
                    Err(tauri::Error::JoinError(join_err)) => {
                        let msg = if join_err.is_panic() {
                            let payload = join_err.into_panic();
                            panic_message(&payload)
                        } else {
                            format!("boot_task cancelled / JoinError: {join_err}")
                        };
                        tracing::error!(
                            target: "boot",
                            panic = %msg,
                            "boot_task did not complete normally — emitting platform:boot-failed"
                        );
                        let _ = emit_on_fail.emit("platform:boot-failed", &msg);
                    }
                    Err(other) => {
                        let msg = format!("boot_task tauri::Error: {other}");
                        tracing::error!(target: "boot", err = %msg, "boot_task wrapper error");
                        let _ = emit_on_fail.emit("platform:boot-failed", &msg);
                    }
                }
            });

            // ── Global shortcuts ──────────────────────────────────
            // Ctrl+Shift+Q toggles the unified DevPulse Tools dashboard.
            // (Rebound from Ctrl+Shift+Z so Z is free for in-app editor use.)
            {
                use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, Modifiers, Code};
                let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyQ);
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
                }).map_err(|e| anyhow::anyhow!("Failed to register Ctrl+Shift+Q: {e}"))?;
                tracing::info!("Registered Ctrl+Shift+Q → DevPulse Tools dashboard");
            }

            // ── Ctrl+Shift+Space → open / focus the Chat window ──
            // Summons the chat surface from anywhere in the app.
            {
                use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, Modifiers, Code};
                let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);
                let app_handle = app.handle().clone();
                app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        let h = app_handle.clone();
                        tauri::async_runtime::spawn(async move {
                            if let Err(e) = commands::window::open_chat_window(h).await {
                                tracing::warn!(error = %e, "Failed to open chat window");
                            }
                        });
                    }
                }).map_err(|e| anyhow::anyhow!("Failed to register Ctrl+Shift+Space: {e}"))?;
                tracing::info!("Registered Ctrl+Shift+Space → Chat window");
            }

            // ── Ctrl+Shift+I → Chromium webview devtools (main window) ──
            // Different from Ctrl+Shift+Q which opens the DevPulse-authored
            // `/devtools` Svelte route. This one opens the raw Chromium
            // inspector on the MAIN window — essential when the main window
            // is black-screened and you need to see the JS console.
            // Requires `devtools` feature on the `tauri` crate (added to
            // Cargo.toml so open_devtools() is compiled into release too,
            // not just debug). Without that feature, this shortcut is a
            // no-op in release.
            {
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut,
                };
                let shortcut = Shortcut::new(
                    Some(Modifiers::CONTROL | Modifiers::SHIFT),
                    Code::KeyI,
                );
                let app_handle = app.handle().clone();
                app.global_shortcut().on_shortcut(shortcut, move |_a, _s, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            if window.is_devtools_open() {
                                window.close_devtools();
                                tracing::info!("Chromium devtools closed on main window");
                            } else {
                                window.open_devtools();
                                tracing::info!("Chromium devtools opened on main window");
                            }
                        } else {
                            tracing::warn!(
                                "Ctrl+Shift+I pressed but 'main' window missing"
                            );
                        }
                    }
                }).map_err(|e| anyhow::anyhow!("Failed to register Ctrl+Shift+I: {e}"))?;
                tracing::info!(
                    "Registered Ctrl+Shift+I → Chromium webview devtools (main)"
                );
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

    let _ = BootPhaseChanged {
        phase: BootPhaseValue::Initializing,
        error: None,
    }
    .emit(&app);

    let boot_start = std::time::Instant::now();
    let app_for_callback = app.clone();
    let tracker_for_callback = tracker.clone_tracker();

    // Model-loader inference events (load / download progress) are Clyffy's now
    // — they arrive over the gb10-client wire, not from a local EventBridge (the
    // engine `integrations` module was removed in the kernel-severance). Boot
    // with no sink; the engine's Tier-1 services emit no local inference events.
    let model_event_sink: Option<std::sync::Arc<dyn std::any::Any + Send + Sync>> = None;

    // Platform::boot() now writes boot.log in real-time via BootLog.
    // The callback here is ONLY for Tauri event bridging + tracker.
    let result = Platform::boot(
        data_dir.clone(),
        move |event: InitEvent| {
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
        },
        model_event_sink,
    )
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
                    devpulse_telemetry::spawn(writer.run());
                    tracing::info!("Span trace writer spawned — DuckDB span persistence active");
                } else {
                    tracing::warn!(
                        "Analytics service not available — span traces will buffer and drop"
                    );
                }
            }

            // Set platform in managed state
            let state = app.state::<PlatformState>();
            // P0: lock-free atomic store. Boot task writes exactly once.
            state.platform.store(Some(Arc::new(platform)));

            let _ = BootPhaseChanged {
                phase: BootPhaseValue::Ready,
                error: None,
            }
            .emit(&app);

            // ── Claude MCP autoregister (operator opt-in) ────────
            // Reads `claude.autoregister.code` / `claude.autoregister.desktop`
            // from `.userdata/preferences.json` and registers the DevPulse MCP
            // entry with each enabled target. Existing user MCP entries are
            // preserved by the atomic-merge writer in commands/claude/register.
            if let Some(platform_arc) = state.platform.load_full() {
                let data_dir = platform_arc.data_dir().clone();
                spawn_blocking(move || {
                    commands::claude::autoregister::apply_on_boot(&data_dir);
                });
            }

            // ── RRO + Grammar state event bridges — REMOVED ──────
            // The reasoning (RRO) and grammar deliberation state machines are
            // Clyffy's (headless, on the GB10), not local Platform services —
            // `Platform::reasoning()` / `::grammar()` were dropped in the
            // kernel-severance. Their snapshots reach the frontend over the
            // gb10-client wire once `clyffyd` advertises them (deferred, not
            // retired). The `platform:rro-state-changed` /
            // `platform:grammar-changed` event contracts are re-established from
            // Clyffy's event stream at that point; nothing is emitted locally.

            // ── RRD lifecycle event bridge ───────────────────────
            // Two-step wiring per HOT_UPDATE_PATTERN.md §11:
            //   (1) Install the engine's `internal_tx` broadcast
            //       sender into the global LAZY_SENDER so the
            //       `RrdLifecycleTranslator` Layer (registered in
            //       logging::init()) can publish typed events.
            //   (2) Subscribe to the bus, filter for
            //       `InternalEvent::RrdPhaseTransition`, and forward
            //       to the frontend on `platform:rrd-phase-transition`
            //       so the RRD devtool can render lifecycle history
            //       without parsing log lines.
            if let Some(platform_arc) = state.platform.load_full() {
                use devpulse_engine::platform::facade::events::InternalEvent;
                use devpulse_engine::platform::services::rrd_translator::RrdLifecycleTranslator;

                let internal_tx = std::sync::Arc::new(platform_arc.internal_tx().clone());
                if let Err(_existing) =
                    RrdLifecycleTranslator::install_global_sender(internal_tx.clone())
                {
                    tracing::warn!(
                        "rrd event bridge: LAZY_SENDER already installed (boot ran twice?) — keeping existing"
                    );
                } else {
                    tracing::info!("rrd event bridge: LAZY_SENDER installed");
                }

                let mut rx = internal_tx.subscribe();
                let app_handle = app.clone();
                devpulse_telemetry::spawn(async move {
                    while let Ok(envelope) = rx.recv().await {
                        let (event, _producer_cx) = envelope.into_parts();
                        if let InternalEvent::RrdPhaseTransition { phase, detail } = event {
                            let _ = app_handle.emit(
                                "platform:rrd-phase-transition",
                                serde_json::json!({ "phase": phase, "detail": detail }),
                            );
                        }
                    }
                    tracing::info!("rrd event bridge: broadcast channel closed");
                });
                tracing::info!("rrd event bridge: spawned");
            }

            // ── Clyffy wire connection probe (re-pointable, auto-reconnect) ──
            // Kernel-free: the loop dials whatever endpoint the managed
            // ClyffyConnectionState currently holds, re-reading it EACH tick, so
            // a runtime `connect_clyffy` / `disconnect_clyffy` re-points it with
            // no restart. We seed it from persisted config (if any) and spawn the
            // loop UNCONDITIONALLY — an empty/disabled endpoint stays standalone
            // (Tier-1) until the operator connects. Never blocks or fails boot.
            if let Some(platform_arc) = state.platform.load_full() {
                let clyffy_cfg = &platform_arc.boot_config().services.system.clyffy;
                let interval =
                    std::time::Duration::from_secs(clyffy_cfg.probe_interval_secs.max(1));
                let timeout =
                    std::time::Duration::from_secs(clyffy_cfg.probe_timeout_secs.max(1));
                // Seed priority: the operator's PERSISTED choice (survives
                // restarts, written by connect/disconnect) wins over the
                // static boot config's base_url. A persisted explicit
                // disconnect (record present, endpoint None) stays
                // standalone even when the boot config names an endpoint —
                // the operator's last decision is the truth.
                let persisted = crate::paths::resolve_data_dir(&app)
                    .ok()
                    .map(|dir| crate::connection_store::ConnectionStore::new(&dir).load());
                let seed: Option<String> = match &persisted {
                    Some(record) if record.setup_decided => record.endpoint.clone(),
                    _ => {
                        let configured = clyffy_cfg.base_url.trim();
                        (clyffy_cfg.enabled && !configured.is_empty())
                            .then(|| configured.to_string())
                    }
                };
                match &seed {
                    Some(endpoint) => {
                        app.state::<crate::state::ClyffyConnectionState>()
                            .set_endpoint(Some(endpoint.clone()));
                        tracing::info!(
                            target: "clyffy.connection",
                            endpoint = %endpoint,
                            source = if persisted.as_ref().is_some_and(|r| r.setup_decided) {
                                "persisted"
                            } else {
                                "boot-config"
                            },
                            "clyffy probe: seeded endpoint"
                        );
                    }
                    None => {
                        tracing::info!(
                            target: "clyffy.connection",
                            "clyffy probe: no endpoint — standalone (Tier-1), awaiting runtime connect"
                        );
                    }
                }
                devpulse_telemetry::spawn(clyffy_probe_loop(app.clone(), interval, timeout));
                tracing::info!("clyffy connection probe: spawned (re-pointable)");
            }

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
                        let assigned = slots.iter().filter(|s| s.assigned_model.is_some()).count();
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
                            .map(commands::models::entry_to_model_info)
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
                        tracing::info!(
                            "boot: model readiness block done — dropping platform read lock"
                        );
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
            let _ = BootPhaseChanged {
                phase: BootPhaseValue::Failed,
                error: Some(e.to_string()),
            }
            .emit(&app);
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
                let metrics = loader.hardware_metrics();
                let _ = HardwareMetricsUpdated { metrics }.emit(&app);
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

    // Seed user relational: default profile + preferences ONLY.
    //
    // Owner directive 2026-04-22: fresh installs start with an EMPTY
    // projects table. The user creates their first project through the
    // wizard's "Let's Go" (which calls `commands::projects::create_project`)
    // or the dashboard's "Add Project" flow. Sessions/turns depend on
    // a real project id, so they're also user-created downstream.
    //
    // The legacy 4 hardcoded projects (`proj-1` … `proj-4`) with
    // canned chat turns were developer convenience fixtures — they
    // made the "4 projects" dashboard look populated on fresh installs
    // but pointed at paths that only exist on one machine. Out.
    if let Some(svc) = platform.user_relational() {
        let adapter = svc.adapter();

        let rows = adapter.query("SELECT COUNT(*) FROM profiles", &[]).await?;
        let count = rows
            .first()
            .and_then(|r| r.first())
            .and_then(devpulse_engine::platform::SqlValue::as_integer)
            .unwrap_or(0);

        if count == 0 {
            tracing::info!("Seeding default user profile into LibSQL...");

            adapter
                .execute_batch(
                    r"
                    INSERT INTO profiles (id, display_name, hardware_profile, onboarding_complete, expertise_level) VALUES
                        ('user-1', NULL, '32g_engineer', 0, 1);

                    INSERT INTO preferences (id, user_id, theme, context_mode, verbosity) VALUES
                        ('pref-1', 'user-1', 'dark', 'normal', 'balanced');
                    ",
                )
                .await?;

            tracing::info!(
                "User LibSQL seeded: default profile + preferences (no projects — user-created)"
            );
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

/// Extract a string message from a panic payload (the `Box<dyn Any>`
/// returned by `JoinError::into_panic`). Handles the two common shapes
/// emitted by `panic!("...")` (`&'static str`) and `panic!("{x}")`
/// (`String`); falls back to a generic label for non-string payloads.
fn panic_message(payload: &Box<dyn std::any::Any + Send>) -> String {
    if let Some(s) = payload.downcast_ref::<&'static str>() {
        (*s).to_string()
    } else if let Some(s) = payload.downcast_ref::<String>() {
        s.clone()
    } else {
        "<non-string panic payload>".to_string()
    }
}

/// Write `<data_dir>/bootstrap.log` with "Rust is alive" evidence and
/// the resolved log paths, AND drop `<exe_dir>/bootstrap-pointer.txt`
/// so the user can jump to the active log dir from next to the exe.
///
/// # Why this exists
///
/// Windows GUI apps (`windows_subsystem = "windows"` at `main.rs`) have
/// no attached stdout/stderr. If the `tracing` subscriber or any code
/// AFTER this point panics — or if a `LoadLibrary` call after `main()`
/// returns `STATUS_DLL_NOT_FOUND` on a dynamic DLL — there is no trace
/// at all of "did Rust even start". `bootstrap.log` is the one place
/// the user can look: "file exists with fresh timestamp → process
/// started, at least through data-dir resolution". Failures AFTER this
/// land in `boot.log` (authored at `platform/boot/log.rs:43`) or
/// `crash-{ts}.json` (authored by the panic hook at `logging.rs:179`).
///
/// All writes use synchronous `std::fs::write` — tracing-appender's
/// background worker hasn't been spawned yet, and synchronous is what
/// we want here anyway (we want the file on disk before we proceed).
///
/// Best-effort: errors are swallowed because this log is an aide, not
/// a precondition. If we can't write it, boot still proceeds.
fn write_bootstrap_log(data_dir: &std::path::Path) {
    use std::fs;

    let timestamp = chrono::Utc::now().to_rfc3339();
    let exe_path = std::env::current_exe()
        .map_or_else(|_| "<unknown>".to_string(), |p| p.display().to_string());
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(std::path::Path::to_path_buf));
    let logs_dir = data_dir.join("logs");
    let boot_log = logs_dir.join("boot.log");
    let bootstrap_log = data_dir.join("bootstrap.log");

    let header = format!(
        "devpulse-desktop v{version}\n\
         process_started_at_utc: {timestamp}\n\
         exe_path:    {exe_path}\n\
         data_dir:    {data_dir}\n\
         logs_dir:    {logs_dir}\n\
         boot_log:    {boot_log}\n\
         session_log: {logs_dir}/session-<timestamp>.jsonl\n\
         crash_dumps: {logs_dir}/crash-<timestamp>.json\n\
         ---\n\
         If you are reading this, Rust reached the data-dir resolution step.\n\
         If session-*.jsonl or boot.log have fresher timestamps than this\n\
         file, boot progressed further. If not, a panic or DLL load error\n\
         happened between data-dir resolution and the logging subscriber\n\
         init — check Windows Event Viewer for the exe name or look for\n\
         a crash-*.json in logs_dir.\n",
        version = env!("CARGO_PKG_VERSION"),
        data_dir = data_dir.display(),
        logs_dir = logs_dir.display(),
        boot_log = boot_log.display(),
    );

    // Ensure data_dir + logs_dir exist so the bootstrap write succeeds
    // even on a truly fresh install where neither directory has been
    // created yet by any prior step.
    let _ = fs::create_dir_all(&logs_dir);
    let _ = fs::write(&bootstrap_log, &header);

    // Drop a pointer file next to the exe so the user can find the
    // right log dir without guessing between %APPDATA%\DevPulse and
    // <exe_dir>/.userdata. Overwrites every launch — the path in
    // this file is always the path this process chose.
    if let Some(parent) = exe_dir {
        let pointer_path = parent.join("bootstrap-pointer.txt");
        let pointer_body = format!(
            "bootstrap.log: {}\nlogs_dir:      {}\n",
            bootstrap_log.display(),
            logs_dir.display()
        );
        let _ = fs::write(&pointer_path, &pointer_body);
    }

    // In debug builds (cargo xtask run-dev), also mirror to stderr
    // for immediate terminal visibility. Release has no attached
    // console so eprintln is a no-op — hence the bootstrap.log file.
    #[cfg(debug_assertions)]
    {
        eprintln!("devpulse: data_dir    = {}", data_dir.display());
        eprintln!("devpulse: logs_dir    = {}", logs_dir.display());
        eprintln!("devpulse: boot.log    = {}", boot_log.display());
        eprintln!("devpulse: bootstrap   = {}", bootstrap_log.display());
    }
}
