// orchestrator/src/github/mod.rs

//! GitHub integration (IP/Llm layer)
//!
//! This is the BLACK BOX that protects vibe coders.
//! Subscribes to GitHub signals, runs ML validation, emits results.
//!
//! User never sees this code. They only see "✅ Gus approved".

mod validator;
mod client;

pub use validator::GitHubValidator;
pub use client::GitHubClient;
