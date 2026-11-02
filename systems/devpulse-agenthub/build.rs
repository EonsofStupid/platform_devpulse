//! Bind both ends of the private protocol to the same runtime sources.

use std::path::Path;

use sha2::{Digest, Sha256};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut digest = Sha256::new();
    for source in [
        "src",
        "build.rs",
        "Cargo.toml",
        "../../Cargo.toml",
        "../../Cargo.lock",
        "../../kernel/devpulse-clyffy/Cargo.toml",
        "../../kernel/devpulse-clyffy/config/providers",
        "../../kernel/devpulse-clyffy/src/providers",
        "../infra/devpulse-process/src",
    ] {
        hash(Path::new(source), &mut digest)?;
    }
    println!(
        "cargo:rustc-env=AGENTHUB_BUILD={}",
        hex::encode(digest.finalize())
    );
    Ok(())
}

fn hash(path: &Path, digest: &mut Sha256) -> std::io::Result<()> {
    println!("cargo:rerun-if-changed={}", path.display());
    if path.is_dir() {
        let mut paths = std::fs::read_dir(path)?
            .map(|entry| entry.map(|entry| entry.path()))
            .collect::<Result<Vec<_>, _>>()?;
        paths.sort();
        for child in paths {
            hash(&child, digest)?;
        }
    } else {
        digest.update(path.to_string_lossy().replace('\\', "/").as_bytes());
        digest.update([0]);
        digest.update(std::fs::read(path)?);
    }
    Ok(())
}
