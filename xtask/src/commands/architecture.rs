//! `Architecture` — verify the facade pattern via cargo-metadata.
//!
//! Invariants:
//!   1. Desktop does NOT depend on clyffy directly
//!   2. Engine DOES depend on clyffy (facade)
//!   3. Kernel is included without a secrecy feature switch

use crate::commands::Task;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;
use anyhow::Context;

/// Verify architecture invariants.
pub struct Architecture;

impl Task for Architecture {
    fn name(&self) -> &'static str {
        "architecture"
    }

    fn run(&self, _ws: &Workspace) -> anyhow::Result<()> {
        stage::section("Architecture");

        let metadata = cargo_metadata::MetadataCommand::new()
            .exec()
            .context("failed to run cargo metadata")?;

        // 1. Desktop must NOT depend on clyffy
        let s1 = Stage::start("desktop isolation");
        let desktop = metadata
            .packages
            .iter()
            .find(|p| p.name == "devpulse_desktop_backend")
            .context("package devpulse_desktop_backend not found")?;

        let has_clyffy = desktop
            .dependencies
            .iter()
            .any(|d| d.name == "devpulse-clyffy");

        anyhow::ensure!(
            !has_clyffy,
            "DEPENDENCY OWNERSHIP VIOLATION: desktop depends on clyffy directly. \
             All kernel access must go through devpulse-engine."
        );
        s1.ok();

        // 2. Engine MUST depend on clyffy
        let s2 = Stage::start("engine facade");
        let engine = metadata
            .packages
            .iter()
            .find(|p| p.name == "devpulse-engine")
            .context("package devpulse-engine not found")?;

        let engine_has_clyffy = engine
            .dependencies
            .iter()
            .any(|d| d.name == "devpulse-clyffy" && !d.optional && d.target.is_none());

        anyhow::ensure!(
            engine_has_clyffy,
            "KERNEL INCLUSION FAILED: engine does not depend on clyffy. \
             The facade pattern requires this dependency."
        );
        s2.ok();

        let s3 = Stage::start("single included kernel");
        anyhow::ensure!(
            !engine.features.contains_key("kernel") && !engine.features.contains_key("engine"),
            "Secrecy build features must not replace runtime presentation preferences"
        );
        s3.ok();

        println!();
        println!("  architecture verified.");
        Ok(())
    }
}
