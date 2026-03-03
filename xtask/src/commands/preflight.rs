//! Pre-flight — validate toolchain and dependencies before dev or build.
//!
//! Each check is a timed [`Stage`]. Errors are fatal, warnings continue.
//! Version policy checks use `skip()` when the policy source is absent.

use crate::commands::Task;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;
use anyhow::Result;
use std::fs;

/// Pre-flight toolchain validation.
pub struct Preflight;

impl Task for Preflight {
    fn name(&self) -> &'static str {
        "preflight"
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        stage::section("Pre-flight");

        check_node_modules(ws)?;
        check_pnpm(ws)?;
        check_node(ws)?;
        check_cargo(ws)?;

        println!("  Pre-flight OK");
        Ok(())
    }
}

fn check_node_modules(ws: &Workspace) -> Result<()> {
    let stage = Stage::start("node_modules");
    let bin_dir = ws.desktop_dir().join("node_modules").join(".bin");

    anyhow::ensure!(
        bin_dir.is_dir(),
        "node_modules/.bin not found.\n  Fix: cd interfaces/desktop && pnpm install"
    );

    stage.ok();
    Ok(())
}

fn check_pnpm(ws: &Workspace) -> Result<()> {
    // Existence check — required
    let stage = Stage::start("pnpm");
    let path = ws.resolve("pnpm")?;
    let out = ws.output("pnpm", &["--version"])?;
    let actual = String::from_utf8_lossy(&out.stdout).trim().to_string();
    stage.ok_with(format!("{actual} — {}", path.display()));

    // Version policy — skippable
    let policy = Stage::start("pnpm version policy");
    match read_package_manager_version(ws) {
        Some(expected) if actual == expected => policy.ok(),
        Some(expected) => {
            policy.warn(format!("{actual} (expected {expected})"));
        }
        None => {
            policy.skip("no packageManager in package.json");
        }
    }

    Ok(())
}

fn check_node(ws: &Workspace) -> Result<()> {
    // Existence check — required
    let stage = Stage::start("node");
    let path = ws.resolve("node")?;
    let out = ws.output("node", &["--version"])?;
    let actual = String::from_utf8_lossy(&out.stdout).trim().to_string();
    stage.ok_with(format!("{actual} — {}", path.display()));

    // Version policy — skippable
    let policy = Stage::start("node version policy");
    match read_nvmrc_major(ws) {
        None => {
            policy.skip("no .nvmrc");
        }
        Some(expected_major) => {
            let actual_major = actual
                .strip_prefix('v')
                .and_then(|s| s.split('.').next())
                .unwrap_or(&actual);

            if actual_major == expected_major {
                policy.ok();
            } else {
                policy.warn(format!(
                    "v{actual_major}.x (policy: v{expected_major}.x from .nvmrc)"
                ));
            }
        }
    }

    Ok(())
}

fn check_cargo(ws: &Workspace) -> Result<()> {
    let stage = Stage::start("cargo");
    let path = ws.resolve("cargo")?;
    stage.ok_with(path.display());
    Ok(())
}

/// Parse pnpm version from root `package.json` `"packageManager": "pnpm@10.29.3"`.
fn read_package_manager_version(ws: &Workspace) -> Option<String> {
    let pkg = ws.root().join("package.json");
    let content = fs::read_to_string(pkg).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    let pm = json.get("packageManager")?.as_str()?;
    pm.split_once('@').map(|(_, ver)| ver.to_string())
}

/// Parse expected Node major version from root `.nvmrc`.
fn read_nvmrc_major(ws: &Workspace) -> Option<String> {
    let nvmrc = ws.root().join(".nvmrc");
    let content = fs::read_to_string(nvmrc).ok()?;
    Some(content.trim().to_string())
}
