// shared/src/config/mod.rs

//! Configuration module - SSOT for paths, environment, and settings.

pub mod env;
pub mod paths;
pub mod persona;

pub use env::{context, RuntimeConfig, PortConfig, RunMode};
pub use paths::{get_paths, DevPulsePaths};
pub use persona::{Persona, PersonaSummary, ResponseStyle, DEFAULT_INSTRUCTIONS};
