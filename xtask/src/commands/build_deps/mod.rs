//! Modular dependency build system.
//!
//! Each external dependency gets its own file implementing [`DepBuild`].
//! The orchestrator checks source hashes, only rebuilds when changed,
//! and copies output to `.userdata/bin/{dep}/`.
//!
//! Pattern: pluggable. Add a new dep by creating a file and registering
//! it in `ALL_DEPS`. Each dep is self-contained — source dir, build cmd,
//! output binary, hash file.

pub mod code_oss;

use crate::stage::Stage;
use crate::workspace::Workspace;
use anyhow::{Context, Result};
use std::fs;
use std::path::{Path, PathBuf};

/// Trait for a buildable external dependency.
///
/// Implement this for each dep that needs compilation outside of Cargo.
/// Cargo-native deps (libsql, surrealdb, duckdb, moka) don't need this —
/// they rebuild via Cargo's incremental compilation automatically.
pub trait DepBuild {
    /// Human-readable name (e.g., "code-oss").
    fn name(&self) -> &'static str;

    /// Source directory relative to workspace root (e.g., "deps/code-oss").
    fn source_dir(&self) -> &'static str;

    /// Output binary path relative to `.userdata/bin/` (e.g., "code-oss/code-oss.cmd").
    fn bin_path(&self) -> &'static str;

    /// Whether this dep is enabled in the current config.
    fn enabled(&self, ws: &Workspace) -> bool;

    /// Run the actual build command.
    /// Called only when source has changed since last build.
    fn build(&self, ws: &Workspace) -> Result<()>;

    /// Copy build output to `.userdata/bin/{dep}/`.
    fn install(&self, ws: &Workspace) -> Result<()>;

    /// Absolute path to the source tree used for change detection.
    ///
    /// Defaults to `ws.root().join(self.source_dir())`. Override when the
    /// source lives outside the workspace (e.g. a prebuilt sibling checkout
    /// staged into the Tauri bundle).
    fn abs_source(&self, ws: &Workspace) -> PathBuf {
        ws.root().join(self.source_dir())
    }
}

/// All registered dependency builders.
/// Add new deps here — they get picked up automatically by the orchestrator.
pub fn all_deps() -> Vec<Box<dyn DepBuild>> {
    vec![
        Box::new(code_oss::CodeOss),
        // Add more deps here as they're created:
        // Box::new(rro::Rro),
        // Box::new(kokoros::Kokoros),
    ]
}

/// Orchestrate all dep builds.
///
/// For each enabled dep:
/// 1. Check if source has changed (hash comparison)
/// 2. If changed → build → install to bin
/// 3. If unchanged → skip (use existing bin)
pub fn build_all(ws: &Workspace) -> Result<()> {
    let deps = all_deps();
    let bin_root = ws.root().join(".userdata").join("bin");
    let hash_root = ws.root().join(".userdata").join("build-hashes");

    fs::create_dir_all(&bin_root).context("failed to create .userdata/bin/")?;
    fs::create_dir_all(&hash_root).context("failed to create .userdata/build-hashes/")?;

    for dep in &deps {
        if !dep.enabled(ws) {
            let s = Stage::start(dep.name());
            s.ok_with("disabled in config — skipping");
            continue;
        }

        let source_dir = dep.abs_source(ws);
        if !source_dir.exists() {
            let s = Stage::start(dep.name());
            s.warn(format!("source dir not found: {}", dep.source_dir()));
            continue;
        }

        let hash_file = hash_root.join(format!("{}.hash", dep.name()));
        let current_hash = hash_directory(&source_dir)?;
        let previous_hash = fs::read_to_string(&hash_file).unwrap_or_default();

        if current_hash == previous_hash {
            // Source unchanged — check if binary exists
            let bin_path = bin_root.join(dep.bin_path());
            if bin_path.exists() {
                let s = Stage::start(dep.name());
                s.ok_with("unchanged — using cached build");
                continue;
            }
            // Binary missing even though hash matches — force rebuild
        }

        // Source changed or binary missing → build
        let s = Stage::start(dep.name());
        println!("    Source changed — rebuilding...");

        match dep.build(ws) {
            Ok(()) => {
                dep.install(ws)?;
                // Save hash only after successful build + install
                fs::write(&hash_file, &current_hash)
                    .context("failed to write build hash")?;
                s.ok_with("built and installed");
            }
            Err(e) => {
                s.fail(format!("build failed: {e:#}"));
                // Non-fatal — warn and continue. Optional deps (code-oss)
                // should not block the entire dev server.
                println!("  [WARN] External dep build issue: {e:#}");
            }
        }
    }

    Ok(())
}

/// Hash a directory's modification state.
///
/// Uses file count + total size + newest mtime as a fast fingerprint.
/// Not cryptographic — just needs to detect "something changed".
fn hash_directory(dir: &Path) -> Result<String> {
    let mut file_count: u64 = 0;
    let mut total_size: u64 = 0;
    let mut newest_mtime: u64 = 0;

    // Only hash key files, not node_modules or build artifacts
    let skip_dirs = [
        "node_modules",
        ".git",
        "out",
        "dist",
        "target",
        "build",
        ".build",
    ];

    visit_dir(dir, &skip_dirs, &mut |entry| {
        if let Ok(meta) = entry.metadata() {
            if meta.is_file() {
                file_count += 1;
                total_size += meta.len();
                if let Ok(mtime) = meta.modified() {
                    let secs = mtime
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs();
                    if secs > newest_mtime {
                        newest_mtime = secs;
                    }
                }
            }
        }
    })?;

    Ok(format!("{file_count}:{total_size}:{newest_mtime}"))
}

/// Recursively visit files in a directory, skipping named subdirs.
fn visit_dir(
    dir: &Path,
    skip: &[&str],
    cb: &mut dyn FnMut(&fs::DirEntry),
) -> Result<()> {
    if !dir.is_dir() {
        return Ok(());
    }

    for entry in fs::read_dir(dir).context("failed to read dir")? {
        let entry = entry?;
        let name = entry.file_name();
        let name_str = name.to_string_lossy();

        if skip.iter().any(|s| *s == name_str.as_ref()) {
            continue;
        }

        if entry.file_type()?.is_dir() {
            visit_dir(&entry.path(), skip, cb)?;
        } else {
            cb(&entry);
        }
    }

    Ok(())
}
