use tauri::{Builder, Wry};

// Domain modules (mapped 1:1 to Svelte)
pub mod devmaestro;
pub mod thinkmaestro;
pub mod wiredfront;
pub mod chat;
pub mod sys;

/// SENIOR PATTERN: Central Command Registration
///
/// Instead of cluttering `lib.rs` with 50+ invoke handlers, we aggregate them here.
/// This enforces modularity and makes the "API Surface" of the backend visible at a glance.
pub fn mount_commands(builder: Builder<Wry>) -> Builder<Wry> {
    builder.invoke_handler(tauri::generate_handler![
        // System (The "Bios")
        sys::config::get_config,
        sys::logger::log_frontend,
        sys::guard::validate_session,

        // WiredFront (The "Eyes")
        // wiredfront::get_sources,
        
        // Chat (The "Mouth")
        // chat::send_message
    ])
}
