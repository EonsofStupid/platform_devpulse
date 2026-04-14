//! code-oss (VSCode fork) dependency build.
//!
//! Source: `deps/code-oss/`
//! Build: `npm install && npm run compile` (Electron-based)
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
        // Respect the dedicated build toggle instead of the runtime DevForge service.
        let config_enabled = ws.platform_config()
            .ok()
            .and_then(|c| c.build.deps.code_oss)
            .is_some_and(|d| d.enabled);

        if !config_enabled {
            return false;
        }

        // Also need the source to exist
        let source = ws.root().join(self.source_dir());
        source.join("package.json").exists()
    }

    fn build(&self, ws: &Workspace) -> Result<()> {
        let source = ws.root().join(self.source_dir());
        let (program, install_args, compile_args) = resolve_package_manager(ws)?;

        // Step 1: install dependencies (if needed)
        let node_modules = source.join("node_modules");
        if !node_modules.exists() {
            println!("    > {}", install_args.join(" "));
            let status = std::process::Command::new(&program)
                .args(&install_args)
                .current_dir(&source)
                .status()
                .with_context(|| {
                    format!(
                        "failed to run {} for code-oss",
                        install_args.join(" ")
                    )
                })?;

            if !status.success() {
                anyhow::bail!("{} failed for code-oss", install_args.join(" "));
            }
        }

        // Step 2: build code-oss
        println!("    > {}", compile_args.join(" "));
        let status = std::process::Command::new(&program)
            .args(&compile_args)
            .current_dir(&source)
            .status()
            .with_context(|| {
                format!(
                    "failed to run {} for code-oss",
                    compile_args.join(" ")
                )
            })?;

        if !status.success() {
            anyhow::bail!("{} failed for code-oss", compile_args.join(" "));
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

fn resolve_package_manager(ws: &Workspace) -> Result<(std::path::PathBuf, Vec<&'static str>, Vec<&'static str>)> {
    if let Ok(npm) = ws.resolve("npm") {
        return Ok((npm, vec!["install"], vec!["run", "compile"]));
    }

    if let Ok(yarn) = ws.resolve("yarn") {
        return Ok((yarn, vec!["install"], vec!["compile"]));
    }

    let corepack = ws.resolve("corepack")
        .context("failed to resolve `npm`, `yarn`, or `corepack` for code-oss build")?;

    Ok((
        corepack,
        vec!["yarn", "install"],
        vec!["yarn", "compile"],
    ))
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
