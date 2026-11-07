// engine/src/registry/mod.rs

//! Registry - Non-AI features that work immediately
//!
//! These features enable dogfooding even without AI:
//! - Project management: track codebases
//! - Session management: resume conversations
//!
//! All registries persist to libSQL - data survives restarts.

mod projects;
mod sessions;

pub use projects::{Project, ProjectRegistry, ProjectType};
pub use sessions::{Session, SessionRegistry};
