//! `IpBoundary` — verify the facade pattern via cargo-metadata.
//!
//! Invariants:
//!   1. Desktop does NOT depend on maestro directly
//!   2. Engine DOES depend on maestro (facade)
//!   3. Engine has `kernel` + `engine` feature gates

use crate::commands::Task;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;
use anyhow::Context;

/// Verify IP boundary invariants.
pub struct IpBoundary;

impl Task for IpBoundary {
    fn name(&self) -> &'static str {
        "ip-boundary"
    }

    fn run(&self, _ws: &Workspace) -> anyhow::Result<()> {
        stage::section("IP Boundary");

        let metadata = cargo_metadata::MetadataCommand::new()
            .exec()
            .context("failed to run cargo metadata")?;

        // 1. Desktop must NOT depend on maestro
        let s1 = Stage::start("desktop isolation");
        let desktop = metadata
            .packages
            .iter()
            .find(|p| p.name == "devpulse_desktop_backend")
            .context("package devpulse_desktop_backend not found")?;

        let has_maestro = desktop
            .dependencies
            .iter()
            .any(|d| d.name == "devpulse-maestro");

        anyhow::ensure!(
            !has_maestro,
            "IP BOUNDARY VIOLATION: desktop depends on maestro directly. \
             All kernel access must go through devpulse-engine."
        );
        s1.ok();

        // 2. Engine MUST depend on maestro
        let s2 = Stage::start("engine facade");
        let engine = metadata
            .packages
            .iter()
            .find(|p| p.name == "devpulse-engine")
            .context("package devpulse-engine not found")?;

        let engine_has_maestro = engine
            .dependencies
            .iter()
            .any(|d| d.name == "devpulse-maestro");

        anyhow::ensure!(
            engine_has_maestro,
            "IP BOUNDARY BROKEN: engine does not depend on maestro. \
             The facade pattern requires this dependency."
        );
        s2.ok();

        // 3. Feature gates
        let s3 = Stage::start("feature gates");
        let features: Vec<&str> = engine.features.keys().map(String::as_str).collect();

        anyhow::ensure!(features.contains(&"kernel"), "engine missing 'kernel' feature");
        anyhow::ensure!(features.contains(&"engine"), "engine missing 'engine' feature");
        s3.ok();

        println!();
        println!("  IP boundary verified.");
        Ok(())
    }
}
