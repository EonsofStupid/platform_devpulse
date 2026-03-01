//! `VerifyIpBoundary` — cargo metadata checks for the facade pattern.

use anyhow::Context;

/// Verify the IP boundary invariants using cargo metadata.
///
/// Checks:
/// 1. Desktop backend does NOT depend on maestro directly
/// 2. Engine DOES depend on maestro (facade pattern)
/// 3. Engine has both `kernel` and `engine` features
pub fn run() -> anyhow::Result<()> {
    println!("Verifying IP boundary...");

    let metadata = cargo_metadata::MetadataCommand::new()
        .exec()
        .context("Failed to run cargo metadata")?;

    // 1. Desktop must NOT depend on maestro
    let desktop = metadata
        .packages
        .iter()
        .find(|p| p.name == "devpulse_desktop_backend")
        .context("Desktop backend package not found in workspace")?;

    let desktop_has_maestro = desktop
        .dependencies
        .iter()
        .any(|d| d.name == "devpulse-maestro");

    if desktop_has_maestro {
        anyhow::bail!(
            "IP BOUNDARY VIOLATION: devpulse_desktop_backend has a direct \
             dependency on devpulse-maestro. All kernel access must go \
             through the devpulse-engine facade."
        );
    }
    println!("  [OK] Desktop does not depend on maestro directly");

    // 2. Engine MUST depend on maestro (facade pattern)
    let engine = metadata
        .packages
        .iter()
        .find(|p| p.name == "devpulse-engine")
        .context("Engine package not found in workspace")?;

    let engine_has_maestro = engine
        .dependencies
        .iter()
        .any(|d| d.name == "devpulse-maestro");

    if !engine_has_maestro {
        anyhow::bail!(
            "IP BOUNDARY BROKEN: devpulse-engine does not depend on \
             devpulse-maestro. The facade pattern requires this dependency."
        );
    }
    println!("  [OK] Engine depends on maestro (facade pattern)");

    // 3. Engine must have both feature gates
    let feature_names: Vec<&str> = engine.features.keys().map(String::as_str).collect();

    if !feature_names.contains(&"kernel") {
        anyhow::bail!("Engine missing 'kernel' feature gate");
    }
    if !feature_names.contains(&"engine") {
        anyhow::bail!("Engine missing 'engine' feature gate");
    }
    println!("  [OK] Feature gates present: kernel, engine");

    println!("IP boundary verified.");
    Ok(())
}
