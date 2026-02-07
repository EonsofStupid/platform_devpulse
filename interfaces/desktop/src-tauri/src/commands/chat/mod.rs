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

pub mod history;
pub mod interactions;

/// Send a chat message and receive an echo response.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn send_message(content: String) -> String {
    format!("Echo: {content}")
}
