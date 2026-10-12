//! `clippy` / `test` — cargo lint and test under the dev loop's build env.
//!
//! A plain `cargo clippy` / `cargo test` from a shell runs without the
//! `[build.deps.*]` env (CC/CXX, cmake, the CUDA/Vulkan/MKL exports) and
//! without the sccache wrapper that `run-dev` applies. Native build
//! scripts declare `rerun-if-env-changed` on those variables, so every
//! switch between a plain cargo call and `run-dev` reruns them and
//! rebuilds everything downstream of them. These tasks apply the same env
//! and select the same acceleration features as `run-dev`, so lint, test
//! and the dev loop share one set of build artifacts.
//!
//! Everything after `--` is forwarded to cargo verbatim, after
//! `<subcommand> -p <crate> --features <accel>`:
//!
//! ```text
//! cargo xtask clippy -p devpulse-engine
//! cargo xtask clippy --workspace -- --all-targets -- -D warnings
//! cargo xtask test -p devpulse-engine -- --test signal_contract
//! ```

use crate::commands::{sccache, Task};
use crate::stage;
use crate::workspace::{BuildConfig, Workspace};
use anyhow::{Context, Result};

/// Which packages a cargo tool run covers — mirrors cargo's own flags.
#[derive(clap::Args)]
#[group(required = true, multiple = false)]
pub struct Selection {
    /// Package to run on (repeatable), as in `cargo -p`.
    #[arg(short, long = "package")]
    pub package: Vec<String>,
    /// Every workspace member, as in `cargo --workspace`.
    #[arg(long)]
    pub workspace: bool,
}

/// The cargo subcommand a [`CargoTool`] runs.
#[derive(Clone, Copy)]
pub enum Tool {
    Clippy,
    Test,
}

impl Tool {
    const fn subcommand(self) -> &'static str {
        match self {
            Self::Clippy => "clippy",
            Self::Test => "test",
        }
    }

    /// Arguments used when none are forwarded. Clippy defaults to the
    /// same gate as the `pre-push` hook and CI.
    fn default_args(self) -> Vec<String> {
        match self {
            Self::Clippy => ["--", "-D", "warnings"].map(String::from).to_vec(),
            Self::Test => Vec::new(),
        }
    }
}

/// Run `cargo clippy` / `cargo test` with `run-dev`'s build env.
pub struct CargoTool {
    pub tool: Tool,
    pub selection: Selection,
    /// Forwarded to cargo after the generated flags.
    pub args: Vec<String>,
}

impl Task for CargoTool {
    fn name(&self) -> &'static str {
        self.tool.subcommand()
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        stage::section(&format!("cargo {}", self.tool.subcommand()));

        let platform_config = ws.platform_config()?;
        println!("  > Build env from [build.deps.*] SSOT:");
        platform_config.build.apply_env(ws.root());
        // Called even when no feature applies: detection also exports
        // CUDA_PATH / VULKAN_SDK / MKL vars that build scripts watch.
        let accel = BuildConfig::detect_build_features();
        let features = self.qualified_features(ws, accel.as_deref())?;

        let sccache_guard = sccache::Guard::new(ws);

        let mut args: Vec<String> = vec![self.tool.subcommand().into()];
        if self.selection.workspace {
            args.push("--workspace".into());
        }
        for package in &self.selection.package {
            args.extend(["-p".into(), package.clone()]);
        }
        if !features.is_empty() {
            args.extend(["--features".into(), features.join(",")]);
        }
        if self.args.is_empty() {
            args.extend(self.tool.default_args());
        } else {
            args.extend(self.args.iter().cloned());
        }

        println!("  > cargo {}", args.join(" "));
        let arg_refs: Vec<&str> = args.iter().map(String::as_str).collect();
        let result = ws.exec("cargo", &arg_refs);
        sccache_guard.report();
        result.map(|_| ())
    }
}

impl CargoTool {
    /// `run-dev`'s acceleration features, qualified per selected package
    /// (`pkg/feature`) and limited to the packages that declare them, so
    /// the unit graph matches the dev loop's without asking crates for
    /// features they do not have.
    fn qualified_features(&self, ws: &Workspace, accel: Option<&str>) -> Result<Vec<String>> {
        let Some(accel) = accel else {
            return Ok(Vec::new());
        };
        let metadata = cargo_metadata::MetadataCommand::new()
            .current_dir(ws.root())
            .no_deps()
            .exec()
            .context("failed to run cargo metadata")?;
        let members = metadata.workspace_packages();

        let selected: Vec<_> = if self.selection.workspace {
            members
        } else {
            self.selection
                .package
                .iter()
                .map(|name| {
                    members
                        .iter()
                        .find(|p| &p.name == name)
                        .copied()
                        .with_context(|| format!("no workspace package named `{name}`"))
                })
                .collect::<Result<_>>()?
        };

        Ok(selected
            .iter()
            .flat_map(|package| {
                accel
                    .split(',')
                    .filter(|feature| package.features.contains_key(*feature))
                    .map(|feature| format!("{}/{feature}", package.name))
            })
            .collect())
    }
}
