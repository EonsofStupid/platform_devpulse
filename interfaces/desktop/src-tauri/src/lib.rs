//! @file src-tauri/src/lib.rs
//! @name lib.rs
//! @layer tauri
//!
//! # Description
//! [TODO: Describe this module's purpose]
//!
//! # Dependencies
//! - [TODO: List crate dependencies]
//!
//! # Consumers
//! - [TODO: List modules that use this]
//!
//! @since 1.0.0

pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Chat
            commands::chat::send_message,
            
            // Sys
            commands::sys::config::get_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
