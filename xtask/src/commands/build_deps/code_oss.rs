//! code-oss (VSCode fork) dependency build.
//!
//! Source: `deps/code-oss/`
//! Build: `yarn && yarn compile` (Electron-based)
//! Output: `deps/code-oss/out/` → copied to `.userdata/bin/code-oss/`
//!
//! Only rebuilds when source files in `deps/code-oss/src/` change.
//! The built binary is used by the DevForge service to spawn VSCode.

use super::DepBuild;
use crate::workspace::Workspace;
use anyhow::{Context, Result};
use std::fs;
use std::path::Path;

/// code-oss dependency builder.
pub struct CodeOss;

impl DepBuild for CodeOss {
    fn name(&self) -> &'static str {
        "code-oss"
    }

    fn source_dir(&self) -> &'static str {
        "deps/code-oss"
    }

    fn bin_path(&self) -> &'static str {
        #[cfg(windows)]
        {
            "code-oss/Code - OSS.exe"
        }
        #[cfg(not(windows))]
        {
            "code-oss/code-oss"
        }
    }

    fn enabled(&self, ws: &Workspace) -> bool {
        // Enabled if source directory exists and has a package.json
        let source = ws.root().join(self.source_dir());
        source.join("package.json").exists()
    }

    fn build(&self, ws: &Workspace) -> Result<()> {
        let source = ws.root().join(self.source_dir());

        // Step 1: yarn install (if needed)
        let node_modules = source.join("node_modules");
        if !node_modules.exists() {
            println!("    > yarn install");
            let status = std::process::Command::new("yarn")
                .arg("install")
                .current_dir(&source)
                .status()
                .context("failed to run yarn install for code-oss")?;

            if !status.success() {
                anyhow::bail!("yarn install failed for code-oss");
            }
        }

        // Step 2: yarn compile
        println!("    > yarn compile");
        let status = std::process::Command::new("yarn")
            .arg("compile")
            .current_dir(&source)
            .status()
            .context("failed to run yarn compile for code-oss")?;

        if !status.success() {
            anyhow::bail!("yarn compile failed for code-oss");
        }

        Ok(())
    }

    fn install(&self, ws: &Workspace) -> Result<()> {
        let source_out = ws.root().join(self.source_dir()).join("out");
        let bin_dir = ws.root().join(".userdata").join("bin").join("code-oss");

        if !source_out.exists() {
            anyhow::bail!(
                "code-oss build output not found at {}",
                source_out.display()
            );
        }

        // Create bin directory
        fs::create_dir_all(&bin_dir)?;

        // Copy the built output
        // On Windows, the Electron output is typically in out/
        // The exact structure depends on how code-oss is configured to build
        println!(
            "    > Installing code-oss to {}",
            bin_dir.display()
        );

        copy_dir_recursive(&source_out, &bin_dir)?;

        Ok(())
    }
}

/// Recursively copy a directory tree.
fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<()> {
    fs::create_dir_all(dst)?;

    for entry in fs::read_dir(src).context("failed to read source dir")? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)
                .with_context(|| format!("failed to copy {}", src_path.display()))?;
        }
    }

    Ok(())
}
