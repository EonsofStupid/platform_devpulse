//! DevPulse Desktop - Tauri backend
//!
//! Thin layer that exposes engine functionality to the SvelteKit frontend.
//! Desktop never touches orchestrator directly - all access through engine.
//!
//! ## Module Structure
//! - state: AppState and engine initialization
//! - types: Response types for frontend
//! - audio: WAV encode/decode utilities
//! - helpers: Shared utilities (parse_model_family)
//! - commands/: Domain-grouped Tauri commands
//!   - chat: Conversation with assistant
//!   - config: Platform and user settings
//!   - discovery: Model folder scanning
//!   - models: Model registry and loading
//!   - projects: Workspace management
//!   - status: Engine and system health
//!   - voice: STT and TTS
//!   - window: Multi-window management

mod audio;
mod commands;
mod helpers;
mod state;
mod types;

pub use state::AppState;

/// Initialize and run the Tauri application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            // Chat
            commands::chat,
            commands::get_chat_history,
            // Projects
            commands::list_projects,
            commands::add_project,
            commands::remove_project,
            commands::select_project,
            commands::get_selected_project,
            commands::browse_folder,
            commands::index_project,
            // Status
            commands::get_status,
            commands::get_system_status,
            commands::get_adapters,
            commands::set_adapter,
            commands::get_analytics,
            // Voice
            commands::get_voice_status,
            commands::speak,
            commands::transcribe,
            // Voice Discovery
            commands::scan_voice_models,
            commands::get_voice_discovery,
            commands::get_voice_setup_help,
            commands::select_whisper_model,
            commands::select_kokoro_model,
            commands::save_voice_model_path,
            commands::reload_voice,
            // Models
            commands::list_models,
            commands::list_models_by_family,
            commands::get_model_summary,
            commands::set_active_model,
            commands::get_model_load_states,
            commands::load_vl_model,
            commands::unload_vl_model,
            commands::get_current_vl_model,
            commands::download_model,
            commands::get_model_download_size,
            // Model Roles
            commands::set_model_role,
            commands::get_model_roles,
            // Window (Steam-style chat)
            commands::open_chat_window,
            commands::close_chat_window,
            commands::minimize_chat_window,
            commands::toggle_chat_always_on_top,
            commands::dock_chat_window,
            commands::navigate_main_window,
            commands::focus_main_window,
            commands::restore_main_window,
            // Config
            commands::get_model_path,
            commands::set_model_path,
            commands::check_model_path,
            commands::set_platform_config,
            commands::get_platform_config,
            commands::list_platform_config,
            commands::delete_platform_config,
            commands::set_user_config,
            commands::get_user_config,
            commands::list_user_config,
            commands::delete_user_config,
            // Discovery
            commands::scan_models,
            commands::set_model_directory,
            commands::get_discovered_models,
            commands::get_vl_models,
            commands::select_discovered_model,
            commands::get_selected_model,
            // Capture
            commands::capture_screen,
            commands::capture_screen_by_id,
            commands::capture_region,
            commands::list_screens,
            commands::copy_capture_to_clipboard,
            commands::save_capture,
            commands::list_captures,
            commands::load_capture,
            commands::delete_capture,
            // Experiments (Feature Flags)
            commands::get_feature_flags,
            commands::is_lab_mode,
            commands::set_feature_flag,
            // Adapters (API Keys & Adapter Management)
            commands::list_adapters,
            commands::save_api_key,
            commands::delete_api_key,
            commands::set_active_adapter,
            commands::get_active_adapter,
            commands::test_adapter,
            commands::list_adapter_models,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
