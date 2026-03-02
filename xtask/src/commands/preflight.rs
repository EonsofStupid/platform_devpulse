//! Pre-flight checks — validate toolchain before dev or build.

use crate::tools::ToolResolver;
use anyhow::Result;
use std::fs;

/// Run all pre-flight checks. Errors are fatal, warnings print and continue.
pub fn run() -> Result<()> {
    println!("--- Pre-flight ---");
    let tools = ToolResolver::discover()?;

    check_node_modules(&tools)?;
    check_pnpm(&tools)?;
    check_node(&tools)?;
    check_cargo(&tools)?;

    println!("  Pre-flight OK");
    Ok(())
}

fn check_node_modules(tools: &ToolResolver) -> Result<()> {
    let bin_dir = tools.desktop_dir().join("node_modules").join(".bin");
    anyhow::ensure!(
        bin_dir.is_dir(),
        "node_modules/.bin not found.\n  Fix: cd interfaces/desktop && pnpm install"
    );
    println!("  [OK] node_modules");
    Ok(())
}

fn check_pnpm(tools: &ToolResolver) -> Result<()> {
    let path = tools.resolve("pnpm")?;
    let out = tools.output("pnpm", &["--version"])?;
    let actual = String::from_utf8_lossy(&out.stdout).trim().to_string();

    if let Some(expected) = read_package_manager_version(tools) {
        if actual == expected {
            println!("  [OK] pnpm {actual} — {}", path.display());
        } else {
            eprintln!("  [WARN] pnpm {actual} (expected {expected} from packageManager)");
        }
    } else {
        println!("  [OK] pnpm {actual} — {}", path.display());
    }
    Ok(())
}

fn check_node(tools: &ToolResolver) -> Result<()> {
    let path = tools.resolve("node")?;
    let out = tools.output("node", &["--version"])?;
    let actual = String::from_utf8_lossy(&out.stdout).trim().to_string();

    if let Some(expected_major) = read_nvmrc_major(tools) {
        // node --version returns "vX.Y.Z", extract major
        let actual_major = actual
            .strip_prefix('v')
            .and_then(|s| s.split('.').next())
            .unwrap_or(&actual);

        if actual_major == expected_major {
            println!("  [OK] node {actual} — {}", path.display());
        } else {
            eprintln!("  [WARN] node {actual} (expected v{expected_major}.x from .nvmrc)");
        }
    } else {
        println!("  [OK] node {actual} — {}", path.display());
    }
    Ok(())
}

fn check_cargo(tools: &ToolResolver) -> Result<()> {
    let path = tools.resolve("cargo")?;
    println!("  [OK] cargo — {}", path.display());
    Ok(())
}

/// Read pnpm version from `packageManager` field in root `package.json`.
///
/// Expected format: `"pnpm@10.29.3"` → returns `Some("10.29.3")`.
fn read_package_manager_version(tools: &ToolResolver) -> Option<String> {
    let pkg_path = tools.desktop_dir().parent()?.parent()?.join("package.json");
    let content = fs::read_to_string(pkg_path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    let pm = json.get("packageManager")?.as_str()?;
    // "pnpm@10.29.3" → "10.29.3"
    pm.split_once('@').map(|(_, ver)| ver.to_string())
}

/// Read expected Node major version from `.nvmrc`.
fn read_nvmrc_major(tools: &ToolResolver) -> Option<String> {
    let nvmrc_path = tools.desktop_dir().parent()?.parent()?.join(".nvmrc");
    let content = fs::read_to_string(nvmrc_path).ok()?;
    Some(content.trim().to_string())
}
