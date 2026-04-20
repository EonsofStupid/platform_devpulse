//! Build script for `DevPulse` engine.
//!
//! Reads `ip/kernel_terms.toml` and generates:
//! - `engine_vocabulary.rs` — `HashMap` entries for engine builds (`ip_term!` remapping)
//! - `scanner_terms.json` — term list for CI scanner

// Build scripts can only panic on errors — expect is the standard pattern.
#![allow(clippy::expect_used)]

use std::env;
use std::fs;
use std::path::Path;

#[path = "../../tools/platform_config.rs"]
mod platform_config;

fn main() {
    println!("cargo:rerun-if-changed=ip/kernel_terms.toml");
	println!("cargo:rerun-if-changed=../../config/platform");

    let toml_path = Path::new("ip/kernel_terms.toml");
    if !toml_path.exists() {
        // During cargo metadata or doc builds, the file might not be reachable.
        return;
    }

    let toml_content = fs::read_to_string(toml_path).expect("kernel_terms.toml must be readable");
    let dict: TermsDictionary =
        toml::from_str(&toml_content).expect("kernel_terms.toml must be valid TOML");

    let out_dir = env::var("OUT_DIR").expect("OUT_DIR must be set");
    let workspace_root = Path::new(&env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR must be set"))
        .join("../..");
    let composed = platform_config::compose_platform_config(&workspace_root)
        .expect("platform config fragments must compose");
    for source in &composed.source_files {
        println!("cargo:rerun-if-changed={}", source.display());
    }

    generate_engine_vocabulary(&dict, &out_dir);
    generate_scanner_terms(&dict, &out_dir);
    fs::write(Path::new(&out_dir).join("platform.default.toml"), composed.content)
        .expect("Failed to write composed platform.default.toml");
}

/// Generate the `HashMap` constructor for engine builds.
/// Included via `include!()` in `src/ip/mod.rs`.
fn generate_engine_vocabulary(dict: &TermsDictionary, out_dir: &str) {
    use std::fmt::Write;

    let dest = Path::new(out_dir).join("engine_vocabulary.rs");

    let mut code = String::from("{\n    let mut m = std::collections::HashMap::new();\n");
    for term in &dict.terms {
        // Escape any special characters in the strings
        let kernel_escaped = term.kernel.replace('\\', "\\\\").replace('"', "\\\"");
        let engine_escaped = term.engine.replace('\\', "\\\\").replace('"', "\\\"");
        let _ = writeln!(
            code,
            "    m.insert(\"{kernel_escaped}\", \"{engine_escaped}\");"
        );
    }
    code.push_str("    m\n}");

    fs::write(dest, code).expect("Failed to write engine_vocabulary.rs");
}

/// Generate the scanner terms JSON for CI validation.
fn generate_scanner_terms(dict: &TermsDictionary, out_dir: &str) {
    let dest = Path::new(out_dir).join("scanner_terms.json");

    let terms: Vec<ScannerTerm> = dict
        .terms
        .iter()
        .map(|t| ScannerTerm {
            kernel: t.kernel.clone(),
            severity: t.severity.clone(),
            category: t.category.clone(),
        })
        .collect();

    let json = serde_json::to_string_pretty(&terms).expect("Failed to serialize scanner terms");
    fs::write(dest, json).expect("Failed to write scanner_terms.json");
}

#[derive(serde::Deserialize)]
struct TermsDictionary {
    terms: Vec<Term>,
}

#[derive(serde::Deserialize)]
struct Term {
    kernel: String,
    engine: String,
    category: String,
    #[allow(dead_code)]
    context: Vec<String>,
    severity: String,
}

#[derive(serde::Serialize)]
struct ScannerTerm {
    kernel: String,
    severity: String,
    category: String,
}
