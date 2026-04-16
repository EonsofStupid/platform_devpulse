//! # devpulse-telemetry-macros
//!
//! Proc-macro companion to [`devpulse-telemetry`]. Owns the `#[devpulse_command]`
//! attribute macro that wraps every Tauri IPC command with a standard
//! `#[tracing::instrument]` span plus `tauri.command.name`, `tauri.window.label`,
//! and optional `gen_ai.*` attributes.
//!
//! Proc-macro crates cannot be combined with regular library crates, which is
//! why this lives as a separate crate under `systems/infra/`.
//!
//! ## Status
//!
//! **P1 scaffold** — crate exists, workspace picks it up, `cargo check` green.
//! `#[devpulse_command]` lands in sprint P7.
//!
//! See:
//! - ADR: `scripts/docs/adr/ADR-002-TELEMETRY-PRIMITIVES.md`
//! - Sprint: `scripts/docs/sprints/SPRINT-TELEMETRY-FOUNDATION.md` §P7

#![forbid(unsafe_code)]
