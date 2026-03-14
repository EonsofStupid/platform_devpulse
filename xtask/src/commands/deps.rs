//! Dependency management — pull/verify external repos before build.
//!
//! Ensures all git dependencies referenced in workspace `Cargo.toml` are
//! fetched and up-to-date. This is a pre-build step that prevents build
//! failures from stale or missing cargo git checkouts.
//!
//! Also supports verifying local path overrides for development.

use crate::commands::Task;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;
use anyhow::{Context, Result};

/// External dependency repos to verify/pull.
struct DepRepo {
    /// Human-readable name.
    name: &'static str,
    /// Git URL.
    url: &'static str,
    /// Branch to track (None = default branch).
    branch: Option<&'static str>,
}

/// All repos that must be available for build.
const REPOS: &[DepRepo] = &[
    DepRepo {
        name: "rro",
        url: "https://github.com/EonsofStupid/rro",
        branch: Some("alpha"),
    },
    DepRepo {
        name: "rust-stemmers",
        url: "https://github.com/EonsofStupid/rust-stemmers",
        branch: None,
    },
    DepRepo {
        name: "wal",
        url: "https://github.com/EonsofStupid/wal",
        branch: Some("rro-alpha"),
    },
    DepRepo {
        name: "tar-rs",
        url: "https://github.com/EonsofStupid/tar-rs",
        branch: Some("rro-alpha"),
    },
    DepRepo {
        name: "Kokoros",
        url: "https://github.com/EonsofStupid/Kokoros",
        branch: None,
    },
];

/// Pull/verify external dependency repos.
pub struct Deps;

impl Task for Deps {
    fn name(&self) -> &'static str {
        "deps"
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        stage::section("Dependencies");

        // Step 1: Verify git is available
        let git_stage = Stage::start("git");
        let git_path = ws.resolve("git")?;
        git_stage.ok_with(git_path.display());

        // Step 2: Force cargo to update git deps
        let update_stage = Stage::start("cargo update (git deps)");
        update_git_deps(ws)?;
        update_stage.ok();

        // Step 3: Verify each repo is fetchable
        for repo in REPOS {
            let stage = Stage::start(repo.name);
            match verify_repo(ws, repo) {
                Ok(info) => stage.ok_with(info),
                Err(e) => {
                    stage.fail(format!("{e:#}"));
                    return Err(e).context(format!("Failed to verify dep: {}", repo.name));
                }
            }
        }

        // Step 4: Verify cargo can resolve all workspace deps
        let resolve_stage = Stage::start("workspace resolve");
        // Use cargo metadata to verify resolution without compiling
        let meta_result = ws.output("cargo", &["metadata", "--format-version=1"]);
        match meta_result {
            Ok(output) if output.status.success() => resolve_stage.ok(),
            _ => resolve_stage.warn("cargo metadata failed — deps may be stale"),
        }

        println!("  Dependencies OK");
        Ok(())
    }
}

/// Force cargo to re-fetch git dependencies.
///
/// Shows real-time cargo output (inherited stdio) so the user sees
/// download/update progress. Network failures are non-fatal — cached
/// deps may still work.
fn update_git_deps(ws: &Workspace) -> Result<()> {
    match ws.exec("cargo", &["update"]) {
        Ok(_) => Ok(()),
        Err(e) => {
            let msg = format!("{e:#}");
            // Non-fatal: cargo update can fail if network is down but deps are cached
            if msg.contains("failed to fetch") || msg.contains("network") {
                eprintln!("  [WARN] cargo update failed (network?) — using cached deps");
                Ok(())
            } else {
                Err(e).context("cargo update failed")
            }
        }
    }
}

/// Verify a single repo is reachable via git ls-remote.
fn verify_repo(ws: &Workspace, repo: &DepRepo) -> Result<String> {
    let args = ["ls-remote", "--heads", repo.url];

    let output = ws.output("git", &args)?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("git ls-remote failed for {}: {stderr}", repo.url);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<&str> = stdout.lines().collect();

    // Verify the expected branch exists if specified
    if let Some(branch) = repo.branch {
        let branch_ref = format!("refs/heads/{branch}");
        let found = lines.iter().any(|line| line.contains(&branch_ref));
        if !found {
            anyhow::bail!(
                "branch '{}' not found in {} (available: {})",
                branch,
                repo.url,
                lines.len()
            );
        }

        // Extract short commit hash
        let hash = lines
            .iter()
            .find(|line| line.contains(&branch_ref))
            .and_then(|line| line.split_whitespace().next())
            .map(|h| &h[..h.len().min(8)])
            .unwrap_or("?");

        Ok(format!("{branch} @ {hash}"))
    } else {
        Ok(format!("{} branch(es)", lines.len()))
    }
}
