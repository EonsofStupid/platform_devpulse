//! Build manifest — provenance + artifact checksums for every `build-release`.
//!
//! Writes `target/release/build.manifest.json` at the end of a successful
//! build. Every downstream supply-chain tool (SLSA attestation, signed
//! release workflow, reproducibility auditor, release-notes generator)
//! reads this file as its ground truth. The SHA256s computed here are
//! the exact digests a SLSA provenance predicate would reference.
//!
//! ## Scope discipline
//!
//! This module is intentionally boring:
//!   - It shells out to `git`, `rustc`, `cargo`, `node`, `pnpm`, `hostname`
//!     using [`std::process::Command`]. Failures downgrade to `None` —
//!     the manifest always writes, even on a partial environment.
//!   - SHA256 is computed in 64 KiB streamed reads, so artifacts the size
//!     of a 200 MB tauri-bundle installer don't spike RAM.
//!   - ISO8601 timestamps via `chrono` — no hand-rolled date math.
//!
//! ## Shape
//!
//! The JSON wire shape is stable; every field is documented on the
//! corresponding struct. Consumers (including future SLSA generators)
//! depend on it.

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::SystemTime;

/// JSON schema version for `build.manifest.json`. Bump on breaking shape changes.
pub const SCHEMA_VERSION: &str = "devpulse.build/v1";

/// Top-level manifest written to `target/release/build.manifest.json`.
#[derive(Debug, Serialize)]
pub struct BuildManifest {
    /// Stable schema identifier — downstream tools match on this.
    pub schema: &'static str,
    /// Identity of the product being built (from `tauri.conf.json`).
    pub product: ProductInfo,
    /// Version control state at build start.
    pub vcs: VcsInfo,
    /// Toolchain versions captured at build start.
    pub toolchain: ToolchainInfo,
    /// Build wall-clock envelope.
    pub build: BuildInfo,
    /// Artifacts produced — each with SHA256 and size.
    pub artifacts: Vec<ArtifactInfo>,
}

/// Product identity. Source of truth: `tauri.conf.json`.
#[derive(Debug, Serialize)]
pub struct ProductInfo {
    /// `productName` from tauri.conf.json.
    pub name: String,
    /// `version` from tauri.conf.json.
    pub version: String,
}

/// Git state at build start. Missing fields are `None` when git is
/// unavailable or the working tree isn't a repository.
#[derive(Debug, Serialize)]
pub struct VcsInfo {
    /// Full commit SHA of HEAD.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sha: Option<String>,
    /// Current branch name (None if detached HEAD).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub branch: Option<String>,
    /// True if `git status --porcelain` reports uncommitted changes.
    /// A dirty build should NOT be released — SLSA L1+ requires a clean tree.
    pub dirty: bool,
}

/// Compiler and Node toolchain versions. Each is captured via the tool's
/// `--version` output; unparseable output downgrades to `None`.
#[derive(Debug, Serialize)]
pub struct ToolchainInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rustc: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cargo: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pnpm: Option<String>,
    /// Target triple from `platform.default.toml [build.toolchain]`.
    pub target_triple: String,
    /// MSVC CRT linkage — `static` (/MT) or `dynamic` (/MD).
    pub msvc_crt: String,
}

/// Build wall-clock + host context.
#[derive(Debug, Serialize)]
pub struct BuildInfo {
    /// Build host identifier (COMPUTERNAME on Windows, HOSTNAME otherwise).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,
    /// ISO8601 UTC timestamp of build start.
    pub started_utc: String,
    /// ISO8601 UTC timestamp of build finish (None for in-progress manifests).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub finished_utc: Option<String>,
    /// Wall-clock duration in seconds.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_s: Option<f64>,
}

/// A single artifact produced by the build.
#[derive(Debug, Serialize)]
pub struct ArtifactInfo {
    /// Artifact kind tag — stable strings for tooling to match on:
    /// `standalone-exe`, `installer-nsis`, `installer-msi`, `portable-zip`,
    /// `sbom-cyclonedx`, `sbom-spdx`.
    pub kind: String,
    /// Path relative to workspace root (forward slashes, platform-stable).
    pub path: String,
    /// File size in bytes.
    pub size_bytes: u64,
    /// SHA256 hex digest. Source-of-truth for SLSA provenance subject digests.
    pub sha256: String,
}

impl BuildManifest {
    /// Construct a manifest header. Artifacts are added via [`Self::add_artifact`]
    /// after the build produces them; [`Self::finalize`] stamps the finish time
    /// and returns the writable value.
    ///
    /// `workspace_root` is used to locate `tauri.conf.json` and run git.
    /// `target_triple` / `msvc_crt` come from the caller's platform config.
    pub fn gather(
        workspace_root: &Path,
        target_triple: String,
        msvc_crt: String,
        started: SystemTime,
    ) -> Result<Self> {
        let product = gather_product(workspace_root)
            .context("gathering product info from tauri.conf.json")?;
        let vcs = gather_vcs(workspace_root);
        let toolchain = ToolchainInfo {
            rustc: tool_version("rustc"),
            cargo: tool_version("cargo"),
            node: tool_version("node"),
            pnpm: tool_version("pnpm"),
            target_triple,
            msvc_crt,
        };
        let started_utc: DateTime<Utc> = started.into();
        let build = BuildInfo {
            host: gather_host(),
            started_utc: started_utc.to_rfc3339(),
            finished_utc: None,
            duration_s: None,
        };

        Ok(Self {
            schema: SCHEMA_VERSION,
            product,
            vcs,
            toolchain,
            build,
            artifacts: Vec::new(),
        })
    }

    /// Attach an artifact. SHA256 is computed eagerly so the caller
    /// learns of read failures at the call site, not at JSON serialization.
    pub fn add_artifact(
        &mut self,
        workspace_root: &Path,
        kind: &str,
        absolute_path: &Path,
    ) -> Result<()> {
        let meta = std::fs::metadata(absolute_path)
            .with_context(|| format!("stat {}", absolute_path.display()))?;
        let sha256 = sha256_file(absolute_path)
            .with_context(|| format!("hashing {}", absolute_path.display()))?;
        let rel = absolute_path
            .strip_prefix(workspace_root)
            .unwrap_or(absolute_path);
        // Forward slashes so the manifest is platform-stable.
        let path = rel.to_string_lossy().replace('\\', "/");
        self.artifacts.push(ArtifactInfo {
            kind: kind.to_string(),
            path,
            size_bytes: meta.len(),
            sha256,
        });
        Ok(())
    }

    /// Stamp finish time and duration, then write the manifest to disk as
    /// pretty JSON (`serde_json::to_string_pretty`). Truncates any prior file.
    pub fn finalize_and_write(
        mut self,
        output_path: &Path,
        finished: SystemTime,
    ) -> Result<PathBuf> {
        let finished_utc: DateTime<Utc> = finished.into();
        self.build.finished_utc = Some(finished_utc.to_rfc3339());

        // Parse started_utc back to compute duration — cheap and avoids
        // passing the SystemTime around through every call site. `to_std`
        // returns Ok only for non-negative durations, which is the only
        // sane case here; a negative value would indicate clock skew
        // between start and finish and we'd rather elide `duration_s`
        // than record a nonsense number.
        if let Ok(started) = DateTime::parse_from_rfc3339(&self.build.started_utc) {
            if let Ok(std_dur) = finished_utc
                .signed_duration_since(started.with_timezone(&Utc))
                .to_std()
            {
                self.build.duration_s = Some(std_dur.as_secs_f64());
            }
        }

        if let Some(parent) = output_path.parent() {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("creating manifest dir {}", parent.display()))?;
        }
        let json =
            serde_json::to_string_pretty(&self).context("serializing build manifest to JSON")?;
        let mut f = File::create(output_path)
            .with_context(|| format!("creating {}", output_path.display()))?;
        f.write_all(json.as_bytes())
            .with_context(|| format!("writing {}", output_path.display()))?;
        f.write_all(b"\n").ok();
        Ok(output_path.to_path_buf())
    }
}

// ═══════════════════════════════════════════════════════════════
// Gathering helpers — shell out, downgrade to None on failure
// ═══════════════════════════════════════════════════════════════

fn gather_product(workspace_root: &Path) -> Result<ProductInfo> {
    let conf_path = workspace_root
        .join("interfaces")
        .join("desktop")
        .join("src-tauri")
        .join("tauri.conf.json");
    let raw = std::fs::read_to_string(&conf_path)
        .with_context(|| format!("reading {}", conf_path.display()))?;
    let v: serde_json::Value =
        serde_json::from_str(&raw).with_context(|| format!("parsing {}", conf_path.display()))?;
    let name = v
        .get("productName")
        .and_then(|x| x.as_str())
        .with_context(|| format!("productName missing from {}", conf_path.display()))?
        .to_string();
    let version = v
        .get("version")
        .and_then(|x| x.as_str())
        .with_context(|| format!("version missing from {}", conf_path.display()))?
        .to_string();
    Ok(ProductInfo { name, version })
}

fn gather_vcs(workspace_root: &Path) -> VcsInfo {
    let sha = git(workspace_root, &["rev-parse", "HEAD"]);
    let branch = git(workspace_root, &["rev-parse", "--abbrev-ref", "HEAD"]).and_then(|b| {
        // Detached HEAD returns "HEAD" literally — normalize to None.
        if b == "HEAD" {
            None
        } else {
            Some(b)
        }
    });
    let dirty =
        git(workspace_root, &["status", "--porcelain"]).is_some_and(|s| !s.trim().is_empty());
    VcsInfo { sha, branch, dirty }
}

fn git(workspace_root: &Path, args: &[&str]) -> Option<String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(workspace_root)
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

fn tool_version(tool: &str) -> Option<String> {
    let output = Command::new(tool).arg("--version").output().ok()?;
    if !output.status.success() {
        return None;
    }
    let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

fn gather_host() -> Option<String> {
    // Windows uses COMPUTERNAME; most *nix uses HOSTNAME (may be unset
    // when running under systemd service). Fall back to the `hostname`
    // command on non-Windows. None if nothing works.
    if cfg!(windows) {
        std::env::var("COMPUTERNAME").ok()
    } else {
        std::env::var("HOSTNAME").ok().or_else(|| {
            Command::new("hostname")
                .output()
                .ok()
                .and_then(|o| {
                    if o.status.success() {
                        Some(String::from_utf8_lossy(&o.stdout).trim().to_string())
                    } else {
                        None
                    }
                })
                .filter(|s| !s.is_empty())
        })
    }
}

// ═══════════════════════════════════════════════════════════════
// SHA256 — streamed, 64 KiB buffer
// ═══════════════════════════════════════════════════════════════

/// Compute the SHA256 of a file as a lowercase hex string.
/// Streams in 64 KiB chunks so large bundle installers don't spike RAM.
pub fn sha256_file(path: &Path) -> Result<String> {
    let file = File::open(path).with_context(|| format!("opening {}", path.display()))?;
    let mut reader = BufReader::with_capacity(64 * 1024, file);
    let mut hasher = Sha256::new();
    // Heap-allocated buffer — a 64 KiB stack array would trip
    // `clippy::large_stack_arrays` on some builds and makes no
    // difference on warm-loop throughput.
    let mut buf = vec![0u8; 64 * 1024];
    loop {
        let n = reader
            .read(&mut buf)
            .with_context(|| format!("reading {}", path.display()))?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(hex::encode(hasher.finalize()))
}

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, reason = "test assertions")]

    use super::*;

    fn test_tmp_path(name: &str) -> PathBuf {
        let pid = std::process::id();
        std::env::temp_dir().join(format!("xtask-manifest-{name}-{pid}"))
    }

    #[test]
    fn sha256_of_known_bytes_matches_reference() {
        // "hello" → 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
        let path = test_tmp_path("hello").with_extension("txt");
        std::fs::write(&path, b"hello").expect("write");
        let digest = sha256_file(&path).expect("sha256");
        let _ = std::fs::remove_file(&path);
        assert_eq!(
            digest,
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
        );
    }

    #[test]
    fn sha256_empty_file_is_known_digest() {
        let path = test_tmp_path("empty").with_extension("txt");
        std::fs::write(&path, b"").expect("write");
        let digest = sha256_file(&path).expect("sha256");
        let _ = std::fs::remove_file(&path);
        assert_eq!(
            digest,
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
    }

    #[test]
    fn add_artifact_stores_relative_path_and_hash() {
        let root = test_tmp_path("ws");
        std::fs::create_dir_all(root.join("target/release")).expect("mkdir");
        let artifact = root.join("target/release/fake.exe");
        std::fs::write(&artifact, b"abc").expect("write");

        // Direct construction (bypass gather) so the test isn't coupled
        // to external tools (git, rustc) being installed.
        let mut mf = BuildManifest {
            schema: SCHEMA_VERSION,
            product: ProductInfo {
                name: "test".into(),
                version: "0.0.1".into(),
            },
            vcs: VcsInfo {
                sha: None,
                branch: None,
                dirty: false,
            },
            toolchain: ToolchainInfo {
                rustc: None,
                cargo: None,
                node: None,
                pnpm: None,
                target_triple: "x86_64-pc-windows-msvc".into(),
                msvc_crt: "static".into(),
            },
            build: BuildInfo {
                host: None,
                started_utc: "2026-01-01T00:00:00Z".into(),
                finished_utc: None,
                duration_s: None,
            },
            artifacts: Vec::new(),
        };

        mf.add_artifact(&root, "standalone-exe", &artifact)
            .expect("add_artifact");

        assert_eq!(mf.artifacts.len(), 1);
        let a = &mf.artifacts[0];
        assert_eq!(a.kind, "standalone-exe");
        assert_eq!(a.path, "target/release/fake.exe");
        assert_eq!(a.size_bytes, 3);
        // sha256("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
        assert_eq!(
            a.sha256,
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );

        // Serialize to pretty JSON and check the top-level schema key is present.
        let json = serde_json::to_string_pretty(&mf).expect("serialize");
        assert!(json.contains("\"schema\": \"devpulse.build/v1\""));
        assert!(json.contains("\"kind\": \"standalone-exe\""));

        let _ = std::fs::remove_dir_all(&root);
    }
}
