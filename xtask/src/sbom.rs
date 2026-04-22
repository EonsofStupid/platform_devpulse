//! CycloneDX 1.4 SBOM generation — Rust crates + npm packages.
//!
//! Produces `target/release/sbom.cdx.json` covering the full dependency
//! tree of the product binary, from the workspace `Cargo.lock` (via
//! `cargo_metadata`) and the frontend `pnpm-lock.yaml` (via
//! `pnpm list --json`).
//!
//! ## Spec alignment
//!
//! The emitted JSON conforms to
//! [CycloneDX 1.4](https://cyclonedx.org/docs/1.4/json/), meeting the
//! required fields: `bomFormat`, `specVersion`, `serialNumber` (URN
//! UUID), `version`, `metadata.timestamp`, `components[]`.
//!
//! ## Design
//!
//! This module owns a small set of `Serialize` structs named to mirror
//! the CycloneDX JSON wire shape. We deliberately avoid pulling in a
//! full CycloneDX library crate — the 1.4 subset we need is ~80 lines
//! of structs + two collectors, and owning the schema gives us a
//! single audit surface when the spec revs.
//!
//! ## Non-goals
//!
//! - VEX data (vulnerability exchange) — out of scope for Phase 4.
//! - Signed attestations — SLSA workflow consumes this SBOM later.
//! - Detailed license discovery beyond what `cargo_metadata` supplies.

use anyhow::{Context, Result};
use chrono::Utc;
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

const SPEC_VERSION: &str = "1.4";

// ═══════════════════════════════════════════════════════════════
// Wire shape — matches CycloneDX 1.4 JSON
// ═══════════════════════════════════════════════════════════════

#[derive(Debug, Serialize)]
#[allow(clippy::struct_field_names)] // fields mirror CycloneDX spec keys verbatim
pub struct Bom {
    #[serde(rename = "bomFormat")]
    pub bom_format: &'static str,
    #[serde(rename = "specVersion")]
    pub spec_version: &'static str,
    #[serde(rename = "serialNumber")]
    pub serial_number: String,
    pub version: u32,
    pub metadata: Metadata,
    pub components: Vec<Component>,
}

#[derive(Debug, Serialize)]
pub struct Metadata {
    pub timestamp: String,
    pub tools: Vec<Tool>,
    pub component: Component,
}

#[derive(Debug, Serialize)]
pub struct Tool {
    pub vendor: String,
    pub name: String,
    pub version: String,
}

#[derive(Debug, Serialize)]
#[allow(clippy::struct_field_names)] // fields mirror CycloneDX spec keys verbatim
pub struct Component {
    #[serde(rename = "type")]
    pub component_type: &'static str,
    #[serde(rename = "bom-ref", skip_serializing_if = "Option::is_none")]
    pub bom_ref: Option<String>,
    pub name: String,
    pub version: String,
    pub purl: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scope: Option<&'static str>,
}

// ═══════════════════════════════════════════════════════════════
// Collectors
// ═══════════════════════════════════════════════════════════════

/// Full SBOM shape for the product: root component + transitively
/// everything the compiled binary depends on, Rust + npm combined.
pub struct SbomBuild {
    pub workspace_root: PathBuf,
    pub desktop_dir: PathBuf,
    pub product_name: String,
    pub product_version: String,
}

impl SbomBuild {
    pub fn generate(&self) -> Result<Bom> {
        let rust = collect_rust_components(&self.workspace_root)
            .context("collecting Rust crate components from cargo metadata")?;
        let npm = collect_npm_components(&self.desktop_dir).unwrap_or_else(|e| {
            // npm side is non-fatal — we emit a Rust-only SBOM rather
            // than fail the build if pnpm is flaky.
            crate::xwarn!("npm SBOM collection failed (Rust-only BOM emitted): {e:#}");
            Vec::new()
        });

        let mut components = Vec::with_capacity(rust.len() + npm.len());
        components.extend(rust);
        components.extend(npm);

        let product = Component {
            component_type: "application",
            bom_ref: Some(format!(
                "pkg:generic/{}@{}",
                self.product_name, self.product_version
            )),
            name: self.product_name.clone(),
            version: self.product_version.clone(),
            purl: format!("pkg:generic/{}@{}", self.product_name, self.product_version),
            scope: None,
        };

        Ok(Bom {
            bom_format: "CycloneDX",
            spec_version: SPEC_VERSION,
            // CycloneDX 1.4 mandates `urn:uuid:<uuid>` for serialNumber.
            serial_number: format!("urn:uuid:{}", uuid::Uuid::new_v4()),
            version: 1,
            metadata: Metadata {
                timestamp: Utc::now().to_rfc3339(),
                tools: vec![Tool {
                    vendor: "DevPulse".to_string(),
                    name: "xtask".to_string(),
                    version: env!("CARGO_PKG_VERSION").to_string(),
                }],
                component: product,
            },
            components,
        })
    }
}

fn collect_rust_components(workspace_root: &Path) -> Result<Vec<Component>> {
    let metadata = cargo_metadata::MetadataCommand::new()
        .manifest_path(workspace_root.join("Cargo.toml"))
        .exec()
        .context("running cargo_metadata")?;

    let mut components = Vec::with_capacity(metadata.packages.len());
    for pkg in &metadata.packages {
        // Skip our own workspace members — they are the product, not a
        // third-party component. The product appears as `metadata.component`.
        if metadata.workspace_members.iter().any(|m| m == &pkg.id) {
            continue;
        }
        let name = pkg.name.to_string();
        let version = pkg.version.to_string();
        let purl = format!("pkg:cargo/{name}@{version}");
        components.push(Component {
            component_type: "library",
            bom_ref: Some(purl.clone()),
            name,
            version,
            purl,
            scope: Some("required"),
        });
    }

    Ok(components)
}

fn collect_npm_components(desktop_dir: &Path) -> Result<Vec<Component>> {
    // `pnpm list --json --depth=Infinity --prod` emits an array of
    // workspace entries, each with a `dependencies` tree. We walk the
    // tree and flatten into a unique (name, version) set.
    let output = Command::new("pnpm")
        .args(["list", "--json", "--depth=Infinity", "--prod"])
        .current_dir(desktop_dir)
        .output()
        .context("running `pnpm list --json`")?;

    if !output.status.success() {
        anyhow::bail!(
            "pnpm list exited with code {}",
            output.status.code().unwrap_or(-1)
        );
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let root_entries: Vec<serde_json::Value> =
        serde_json::from_str(&stdout).context("parsing `pnpm list --json` output as JSON array")?;

    let mut collected: std::collections::BTreeSet<(String, String)> =
        std::collections::BTreeSet::new();
    for entry in &root_entries {
        walk_dep_tree(entry, &mut collected);
    }

    let mut components = Vec::with_capacity(collected.len());
    for (name, version) in collected {
        let purl = format!("pkg:npm/{name}@{version}");
        components.push(Component {
            component_type: "library",
            bom_ref: Some(purl.clone()),
            name,
            version,
            purl,
            scope: Some("required"),
        });
    }

    Ok(components)
}

/// Recursively walk a `pnpm list --json` node, collecting every
/// (name, version) pair in its `dependencies` subtree. pnpm's JSON
/// shape nests `dependencies: { <name>: { version, dependencies: ... } }`.
fn walk_dep_tree(node: &serde_json::Value, out: &mut std::collections::BTreeSet<(String, String)>) {
    let Some(deps) = node.get("dependencies").and_then(|d| d.as_object()) else {
        return;
    };
    for (name, dep) in deps {
        let Some(version) = dep.get("version").and_then(|v| v.as_str()) else {
            continue;
        };
        out.insert((name.clone(), version.to_string()));
        walk_dep_tree(dep, out);
    }
}

// ═══════════════════════════════════════════════════════════════
// Write
// ═══════════════════════════════════════════════════════════════

/// Serialize the BOM to pretty JSON and write to disk.
pub fn write_bom(bom: &Bom, path: &Path) -> Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .with_context(|| format!("creating SBOM dir {}", parent.display()))?;
    }
    let json = serde_json::to_string_pretty(bom).context("serializing CycloneDX BOM to JSON")?;
    std::fs::write(path, json.as_bytes()).with_context(|| format!("writing {}", path.display()))?;
    Ok(())
}

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn walk_dep_tree_collects_nested_deps() {
        let node: serde_json::Value = serde_json::from_str(
            r#"{
                "dependencies": {
                    "foo": {
                        "version": "1.0.0",
                        "dependencies": {
                            "bar": { "version": "2.1.3" }
                        }
                    },
                    "baz": { "version": "0.4.1" }
                }
            }"#,
        )
        .unwrap();

        let mut out = std::collections::BTreeSet::new();
        walk_dep_tree(&node, &mut out);

        assert_eq!(out.len(), 3);
        assert!(out.contains(&("foo".to_string(), "1.0.0".to_string())));
        assert!(out.contains(&("bar".to_string(), "2.1.3".to_string())));
        assert!(out.contains(&("baz".to_string(), "0.4.1".to_string())));
    }

    #[test]
    fn walk_dep_tree_deduplicates() {
        // Same (name, version) appearing twice in the tree collapses to one.
        let node: serde_json::Value = serde_json::from_str(
            r#"{
                "dependencies": {
                    "foo": {
                        "version": "1.0.0",
                        "dependencies": {
                            "shared": { "version": "3.0.0" }
                        }
                    },
                    "bar": {
                        "version": "2.0.0",
                        "dependencies": {
                            "shared": { "version": "3.0.0" }
                        }
                    }
                }
            }"#,
        )
        .unwrap();

        let mut out = std::collections::BTreeSet::new();
        walk_dep_tree(&node, &mut out);
        assert_eq!(out.len(), 3, "shared@3.0.0 must collapse");
    }

    #[test]
    fn bom_minimal_shape_serializes_cleanly() {
        let bom = Bom {
            bom_format: "CycloneDX",
            spec_version: SPEC_VERSION,
            serial_number: "urn:uuid:00000000-0000-0000-0000-000000000000".into(),
            version: 1,
            metadata: Metadata {
                timestamp: "2026-01-01T00:00:00Z".into(),
                tools: vec![Tool {
                    vendor: "DevPulse".into(),
                    name: "xtask".into(),
                    version: "0.1.0".into(),
                }],
                component: Component {
                    component_type: "application",
                    bom_ref: Some("pkg:generic/test@0.0.1".into()),
                    name: "test".into(),
                    version: "0.0.1".into(),
                    purl: "pkg:generic/test@0.0.1".into(),
                    scope: None,
                },
            },
            components: vec![Component {
                component_type: "library",
                bom_ref: Some("pkg:cargo/serde@1.0.0".into()),
                name: "serde".into(),
                version: "1.0.0".into(),
                purl: "pkg:cargo/serde@1.0.0".into(),
                scope: Some("required"),
            }],
        };

        let json = serde_json::to_string_pretty(&bom).expect("serialize");
        assert!(json.contains("\"bomFormat\": \"CycloneDX\""));
        assert!(json.contains("\"specVersion\": \"1.4\""));
        assert!(json.contains("\"serialNumber\": \"urn:uuid:"));
        assert!(json.contains("\"purl\": \"pkg:cargo/serde@1.0.0\""));
    }
}
