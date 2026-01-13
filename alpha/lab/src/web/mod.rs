// lab/src/web/mod.rs

//! Lab Web Module - Axum server components
//!
//! Provides the HTTP + WebSocket API for the Lab SvelteKit frontend.
//! Feature-gated under `web`.
//!
//! # Structure
//! - `state` - AppState with Engine, LabDatabase, LabAnalytics (in parent)
//! - `routes` - Axum route handlers (in parent)
//!
//! # Re-exports
//! This module re-exports state and routes from parent for a cleaner API.

// Re-export from parent (state.rs and routes/ live at src/ level)
pub use crate::state::AppState;
pub use crate::routes;
