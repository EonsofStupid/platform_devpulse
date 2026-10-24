//! Task-based command dispatch.
//!
//! Every subcommand implements [`Task`] — receives the shared [`Workspace`]
//! context, reports progress via [`Stage`], returns `Result<()>`.

pub mod build_deps;
pub mod build_release;
pub mod cargo_tool;
pub mod deps;
pub mod dev;
pub mod fetch_devforge;
pub mod fetch_surreal;
pub mod ip_boundary;
pub mod launch;
pub mod model_manifest_backfill;
pub mod package_portable;
pub mod preflight;
pub mod regen_bindings;
pub mod release_publish;
pub mod sccache;
pub mod verify;

use crate::workspace::Workspace;
use anyhow::Result;

/// A composable unit of work in the `DevPulse` orchestrator.
///
/// Implemented by every subcommand. The [`Workspace`] context is created
/// once in `main()` and threaded through — no re-discovery per command.
pub trait Task {
    /// Human-readable name for banner/logging output.
    fn name(&self) -> &'static str;

    /// Execute this task against the workspace.
    fn run(&self, ws: &Workspace) -> Result<()>;
}
