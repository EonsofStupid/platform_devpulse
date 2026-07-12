//! `IpBoundary` — verify the DevPulse/Clyffy boundary via cargo-metadata.
//!
//! Invariants (the AI layer is Clyffy's — clyffyos repo):
//!   1. Desktop does NOT depend on `devpulse-clyffy`.
//!   2. Engine does NOT depend on `devpulse-clyffy` — the AI layer is Clyffy's;
//!      DevPulse builds standalone and reaches Clyffy over the gb10-client wire.
//!   3. Engine keeps the `engine` feature gate (release/customer selection).
//!   4. No inference-runtime crate is a *non-optional* dependency of engine or
//!      desktop — the standalone build links zero AI inference.
//!
//! Note: `sherpa-onnx` (ASR) is still declared as an OPTIONAL, off-by-default
//! dep of the engine (the `sherpa` feature). It is off in the standalone build
//! so it does not violate #4, but it is pending relocation to Clyffy over the
//! wire; when that lands, add it to `BANNED_INFERENCE_CRATES` and drop the
//! optional-skip so a re-introduction is caught.

use crate::commands::Task;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;
use anyhow::Context;

/// Inference-runtime crates that must never be a *non-optional* dependency of a
/// DevPulse-built crate. All AI inference is Clyffy's, on GB10, over the wire.
const BANNED_INFERENCE_CRATES: &[&str] = &[
    "candle-core",
    "candle-nn",
    "candle-transformers",
    "llama-cpp-2",
    "llama-cpp-sys-2",
    "burn",
    "burn-core",
    "cubecl",
    "ort",
    "mistralrs",
    "mistralrs-core",
    "llguidance",
];

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

        let find = |name: &str| {
            metadata
                .packages
                .iter()
                .find(|p| p.name == name)
                .with_context(|| format!("package {name} not found"))
        };

        // 1. Desktop must NOT depend on clyffy.
        let s1 = Stage::start("desktop severed from clyffy");
        let desktop = find("devpulse_desktop_backend")?;
        anyhow::ensure!(
            !desktop
                .dependencies
                .iter()
                .any(|d| d.name == "devpulse-clyffy"),
            "IP BOUNDARY VIOLATION: desktop depends on devpulse-clyffy. The AI \
             kernel is severed — desktop reaches Clyffy over the gb10-client wire."
        );
        s1.ok();

        // 2. Engine must NOT depend on clyffy (the AI layer is Clyffy's).
        let s2 = Stage::start("engine severed from clyffy");
        let engine = find("devpulse-engine")?;
        anyhow::ensure!(
            !engine
                .dependencies
                .iter()
                .any(|d| d.name == "devpulse-clyffy"),
            "IP BOUNDARY VIOLATION: engine depends on devpulse-clyffy. The kernel \
             severance requires the engine to be clyffy-free — DevPulse builds \
             standalone (Tier-1) and reaches the AI layer over the wire."
        );
        s2.ok();

        // 3. Engine keeps the `engine` feature gate (release/customer selection).
        let s3 = Stage::start("engine feature gate");
        anyhow::ensure!(
            engine.features.contains_key("engine"),
            "engine missing the 'engine' feature gate"
        );
        s3.ok();

        // 4. No inference runtime is a non-optional dep of engine or desktop.
        let s4 = Stage::start("standalone build is inference-free");
        for pkg in [engine, desktop] {
            for dep in &pkg.dependencies {
                // Optional deps are gated off in the standalone default build.
                if dep.optional {
                    continue;
                }
                anyhow::ensure!(
                    !BANNED_INFERENCE_CRATES.contains(&dep.name.as_str()),
                    "IP BOUNDARY VIOLATION: {} declares non-optional inference dep \
                     '{}'. All inference is Clyffy's on GB10, served over the wire.",
                    pkg.name,
                    dep.name
                );
            }
        }
        s4.ok();

        println!();
        println!("  IP boundary verified (kernel severed; standalone build is inference-free).");
        Ok(())
    }
}
