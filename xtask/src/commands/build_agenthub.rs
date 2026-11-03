//! Build and stage the bundled programs before Tauri reads its package config:
//! the `AgentHub` runtime, and the relay each agent session uses to reach your
//! memory (plan 0001 B6.2).

use anyhow::{Context, Result, bail};

use crate::commands::Task;
use crate::workspace::Workspace;

/// This same overlay is consumed by Tauri and the portable package planner.
pub const BUNDLE_CONFIG: &str = "src-tauri/tauri.agenthub.conf.json";

/// Each is both a package and its binary, shipped beside the desktop.
const BUNDLED: [&str; 2] = ["devpulse-agenthub", "devpulse-persona-mcp"];

/// Compile and stage the bundled programs without starting the application.
pub struct BuildAgentHub {
    /// Use the release executable for installer/portable packaging.
    pub release: bool,
}

impl Task for BuildAgentHub {
    fn name(&self) -> &'static str {
        "build-agenthub"
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        ws.platform_config()?.build.apply_env(ws.root());
        crate::workspace::BuildConfig::detect_build_features();
        let cache = super::sccache::Guard::new(ws);
        let result = build(ws, self.release);
        cache.report();
        result
    }
}

/// Both dev and release call this after applying the canonical build env.
pub fn build(ws: &Workspace, release: bool) -> Result<()> {
    crate::stage::section("Bundled Programs");
    let mut args = vec!["build"];
    for program in BUNDLED {
        args.extend(["-p", program, "--bin", program]);
    }
    if release {
        args.push("--release");
    }
    ws.exec("cargo", &args)?;
    let output = ws.output("rustc", &["--print", "host-tuple"])?;
    if !output.status.success() {
        bail!("rustc could not report the target triple");
    }
    let target = String::from_utf8(output.stdout).context("read the Rust host triple")?;
    let target = target.trim();
    if target.is_empty()
        || !target
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_'))
    {
        bail!("rustc returned an invalid host triple");
    }
    let extension = std::env::consts::EXE_SUFFIX;
    for program in BUNDLED {
        let source = ws
            .root()
            .join("target")
            .join(if release { "release" } else { "debug" })
            .join(format!("{program}{extension}"));
        let destination = ws
            .desktop_dir()
            .join("src-tauri/binaries")
            .join(format!("{program}-{target}{extension}"));
        std::fs::create_dir_all(destination.parent().context("program staging folder")?)?;
        // Tauri's build script watches this source. Avoid changing its mtime on
        // every dev launch when cargo has reused the same executable.
        let source_bytes =
            std::fs::read(&source).with_context(|| format!("read {}", source.display()))?;
        if std::fs::read(&destination).ok().as_deref() != Some(source_bytes.as_slice()) {
            std::fs::copy(&source, &destination)
                .with_context(|| format!("stage {}", destination.display()))?;
        }
        crate::xinfo!("  > {program} staged for {target}");
    }
    Ok(())
}
