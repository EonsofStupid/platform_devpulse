//! `cargo xtask refresh-devforge` — copy a built REH tree into the
//! committed per-platform devforge resource dir.
//!
//! # Flow
//!
//! 1. Developer builds the REH server externally under
//!    `deps/code-oss-reh-web/` (gitignored working tree).
//! 2. `cargo xtask refresh-devforge --target win32-x64` copies that tree
//!    into `interfaces/desktop/src-tauri/resources/devforge/<target>/` —
//!    the committed, tracked, per-platform shipping root.
//! 3. Developer commits the updated tree. Laptop pulls it, `cargo xtask
//!    run-dev` uses it, Tauri's per-target `tauri.{os}.conf.json` bundles
//!    only the active platform subdir into each installer.
//!
//! This is a **manual** command — it is **not** part of `preflight` or
//! `run-dev`. Build once, commit, ship. The main pipeline never rebuilds
//! the REH tree.

use crate::commands::Task;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;
use anyhow::{Context, Result};
use std::fs;
use std::path::{Path, PathBuf};

/// Supported per-platform target subdirectories under `resources/devforge/`.
///
/// Matches `PLATFORM_SUBDIR` in `interfaces/desktop/src-tauri/src/commands/devforge/paths.rs`.
/// Adding a new target here must be mirrored there.
const SUPPORTED_TARGETS: &[&str] = &["win32-x64", "darwin-arm64", "darwin-x64", "linux-x64"];

/// Refresh the committed DevForge REH tree for a given target.
pub struct RefreshDevForge {
    /// Target platform subdir (e.g. `win32-x64`).
    pub target: String,
    /// Optional source override — defaults to `deps/code-oss-reh-web/`.
    pub source: Option<PathBuf>,
}

impl Task for RefreshDevForge {
    fn name(&self) -> &'static str {
        "refresh-devforge"
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        stage::section("Refresh DevForge REH tree");

        let validate = Stage::start("validate target");
        if !SUPPORTED_TARGETS.contains(&self.target.as_str()) {
            validate.fail(format!(
                "unknown target `{}` (supported: {})",
                self.target,
                SUPPORTED_TARGETS.join(", ")
            ));
            anyhow::bail!("unsupported target `{}`", self.target);
        }
        validate.ok_with(&self.target);

        let resolve_src = Stage::start("resolve source");
        let source = self
            .source
            .clone()
            .unwrap_or_else(|| ws.root().join("deps").join("code-oss-reh-web"));
        if !source.join("out").join("server-main.js").is_file() {
            resolve_src.fail(format!(
                "no valid REH build at {} (expected out/server-main.js)",
                source.display()
            ));
            anyhow::bail!("REH source tree missing or incomplete at {}", source.display());
        }
        resolve_src.ok_with(source.display());

        let dst_root = ws
            .root()
            .join("interfaces")
            .join("desktop")
            .join("src-tauri")
            .join("resources")
            .join("devforge")
            .join(&self.target);

        let clear = Stage::start("clear stale tree");
        clear_tree_preserving_gitkeep(&dst_root)
            .with_context(|| format!("failed to clear {}", dst_root.display()))?;
        clear.ok_with(dst_root.display());

        let copy = Stage::start("copy tree");
        let (files, bytes) = copy_tree(&source, &dst_root)?;
        copy.ok_with(format!("{files} files ({} MB)", bytes / (1024 * 1024)));

        println!(
            "\n  DevForge REH tree refreshed for target `{}`.\n  Commit {} to ship the update.",
            self.target,
            dst_root.display()
        );

        Ok(())
    }
}

/// Remove everything under `root` except a top-level `.gitkeep` (if any),
/// and ensure `root` itself exists.
fn clear_tree_preserving_gitkeep(root: &Path) -> Result<()> {
    if !root.exists() {
        fs::create_dir_all(root)?;
        return Ok(());
    }
    for entry in fs::read_dir(root).with_context(|| format!("read {}", root.display()))? {
        let entry = entry?;
        if entry.file_name() == ".gitkeep" {
            continue;
        }
        let path = entry.path();
        let ft = entry.file_type()?;
        if ft.is_dir() {
            fs::remove_dir_all(&path)
                .with_context(|| format!("remove dir {}", path.display()))?;
        } else {
            fs::remove_file(&path)
                .with_context(|| format!("remove file {}", path.display()))?;
        }
    }
    Ok(())
}

/// Recursively copy `src` into `dst`, returning `(file_count, total_bytes)`.
fn copy_tree(src: &Path, dst: &Path) -> Result<(u64, u64)> {
    fs::create_dir_all(dst)?;
    let mut files = 0u64;
    let mut bytes = 0u64;

    for entry in fs::read_dir(src).with_context(|| format!("read dir {}", src.display()))? {
        let entry = entry?;
        let sp = entry.path();
        let dp = dst.join(entry.file_name());
        let ft = entry.file_type()?;
        if ft.is_dir() {
            let (f, b) = copy_tree(&sp, &dp)?;
            files += f;
            bytes += b;
        } else if ft.is_file() {
            let n = fs::copy(&sp, &dp)
                .with_context(|| format!("copy {} -> {}", sp.display(), dp.display()))?;
            files += 1;
            bytes += n;
        }
    }

    Ok((files, bytes))
}
