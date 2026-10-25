// lab/src/lib.rs

//! DevPulse Lab - Internal Development Tool
//!
//! # Overview
//! Lab observes Engine signals, persists to its own databases,
//! and provides a web dashboard for monitoring and experimentation.
//!
//! # Crate Features
//! - `cli` - Enable CLI commands (model tools)
//! - `web` - Enable Axum web server
//! - `full` - Enable all features (default)
//!
//! # Architecture
//! Lab NEVER ships to end users. It subscribes to Engine's SignalRouter
//! and persists everything to lab_analytics.duckdb for analysis.
//!
//! # Databases
//! - `lab.db` (libSQL) - Experiments, configs, baselines
//! - `lab_analytics.duckdb` (DuckDB) - All captured signals, metrics

// Feature-gated modules
#[cfg(feature = "cli")]
pub mod cli;

#[cfg(feature = "web")]
pub mod web;

// Routes need to be available for web module to re-export
#[cfg(feature = "web")]
pub mod routes;

#[cfg(feature = "web")]
pub mod state;

// Always available
pub mod error;
pub mod storage;
pub mod types;

// TUI inspector (always available, used by CLI)
pub mod signal_inspector;

// Re-exports
pub use error::{AppError, AppResult};
pub use types::{LabSignalEvent, LabSource};
