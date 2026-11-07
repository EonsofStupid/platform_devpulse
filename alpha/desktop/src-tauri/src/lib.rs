mod commands;
mod state;

pub use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::new());

    // Register commands - dev commands only in dev builds
    #[cfg(feature = "dev-tools")]
    let builder = builder.invoke_handler(tauri::generate_handler![
        // Core
        commands::chat,
        commands::get_status,
        // Adapters
        commands::list_adapters,
        commands::set_adapter,
        // Models
        commands::list_models,
        commands::set_model,
        commands::scan_models,
        commands::scan_ollama,
        // Personas
        commands::get_personas,
        commands::set_persona,
        commands::create_persona,
        // Projects
        commands::list_projects,
        commands::add_project,
        commands::set_active_project,
        commands::remove_project,
        // Sessions
        commands::list_sessions,
        commands::create_session,
        commands::get_session,
        commands::delete_session,
        // Voice
        commands::voice_transcribe,
        commands::voice_speak,
        commands::voice_stop,
        // Window
        commands::open_chat_window,
        commands::open_app_window,
        commands::close_window,
        commands::focus_window,
        // Dev-only
        commands::dev_list_internal_models,
        commands::dev_system_diagnostics,
    ]);

    #[cfg(not(feature = "dev-tools"))]
    let builder = builder.invoke_handler(tauri::generate_handler![
        // Core
        commands::chat,
        commands::get_status,
        // Adapters
        commands::list_adapters,
        commands::set_adapter,
        // Models
        commands::list_models,
        commands::set_model,
        commands::scan_models,
        commands::scan_ollama,
        // Personas
        commands::get_personas,
        commands::set_persona,
        commands::create_persona,
        // Projects
        commands::list_projects,
        commands::add_project,
        commands::set_active_project,
        commands::remove_project,
        // Sessions
        commands::list_sessions,
        commands::create_session,
        commands::get_session,
        commands::delete_session,
        // Voice
        commands::voice_transcribe,
        commands::voice_speak,
        commands::voice_stop,
        // Window
        commands::open_chat_window,
        commands::open_app_window,
        commands::close_window,
        commands::focus_window,
    ]);

    builder
        .run(tauri::generate_context!())
        .expect("error running tauri");
}
