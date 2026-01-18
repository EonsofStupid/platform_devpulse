//! @file src-tauri/src/main.rs
//! @name main.rs
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

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    devpulse_desktop_backend::run();
}
