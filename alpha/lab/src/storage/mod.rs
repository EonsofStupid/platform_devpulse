// lab/src/storage/mod.rs

//! Lab Storage Layer
//!
//! Lab has its OWN databases, separate from Engine:
//! - `lab.db` (libSQL) - Experiments, configs, baselines
//! - `lab_analytics.duckdb` (DuckDB) - All captured signals, metrics
//!
//! # Design Decision
//! Lab currently uses orchestrator's `Database` and `Analytics` types
//! but opens them at different file paths. This module will eventually
//! contain Lab-specific wrappers with Lab-specific schema.

pub mod analytics;
pub mod database;

pub use analytics::LabAnalytics;
pub use database::LabDatabase;
