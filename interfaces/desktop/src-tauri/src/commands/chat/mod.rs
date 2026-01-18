//! @file src-tauri/src/commands/chat/mod.rs
//! @name mod.rs
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

pub mod interactions;

#[tauri::command]
pub fn send_message(content: String) -> String {
    format!("Echo: {}", content)
}
