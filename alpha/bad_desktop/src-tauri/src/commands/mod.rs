//! Tauri command modules - grouped by domain
//!
//! Each module exports functions annotated with #[tauri::command].
//! This mod.rs re-exports everything for the invoke_handler macro.

pub mod chat;
pub mod config;
pub mod discovery;
pub mod experiments;
pub mod models;
pub mod projects;
pub mod adapters;
pub mod status;
pub mod voice;
pub mod window;
pub mod capture;

// Re-export all commands for invoke_handler
pub use chat::*;
pub use config::*;
pub use discovery::*;
pub use experiments::*;
pub use models::*;
pub use projects::*;
pub use status::*;
pub use voice::*;
pub use window::*;

// Capture commands
pub use capture::*;

// Adapter commands
pub use adapters::*;
