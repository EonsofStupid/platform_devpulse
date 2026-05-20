//! `cargo xtask fetch-surreal` — download the SurrealDB server binary
//! into the Tauri sidecar bundle dir.
//!
//! Mirrors [`fetch_devforge`] in spirit but is deliberately thinner:
//! SurrealDB ships signed single-binary releases per platform and the
//! workspace pins the surrealdb crate to a specific version, so we hard
//! code the matching release tag here rather than carrying a separate
//! manifest file. Bump the const when `Cargo.toml`'s surrealdb crate
//! version bumps.
//!
//! # Output
//!
//! Drops `surreal-<target-triple>.exe` (or without the extension on
//! Unix) into `interfaces/desktop/src-tauri/binaries/` — the path Tauri
//! `externalBin = ["binaries/surreal"]` expands to at package time.
//!
//! # Targets
//!
//! - `win32-x64`      → `surreal-x86_64-pc-windows-msvc.exe`
//! - `darwin-arm64`   → `surreal-aarch64-apple-darwin`
//! - `darwin-x64`     → `surreal-x86_64-apple-darwin`
//! - `linux-x64`      → `surreal-x86_64-unknown-linux-gnu`
//! - `linux-arm64`    → `surreal-aarch64-unknown-linux-gnu`

use crate::commands::Task;
use crate::stage::Stage;
use crate::workspace::Workspace;
use anyhow::{bail, Context, Result};
use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::Command;

/// Release tag to fetch. Bump in sync with the `surrealdb` workspace dep.
const SURREAL_RELEASE_TAG: &str = "v3.0.5";

/// `(xtask-target, rust-triple, archive-suffix, binary-name-in-archive)`.
const SUPPORTED_TARGETS: &[(&str, &str, &str, &str)] = &[
    // Windows ships a raw .exe, no archive.
    ("win32-x64", "x86_64-pc-windows-msvc", ".exe", "surreal.exe"),
    ("darwin-arm64", "aarch64-apple-darwin", ".tgz", "surreal"),
    ("darwin-x64", "x86_64-apple-darwin", ".tgz", "surreal"),
    ("linux-x64", "x86_64-unknown-linux-gnu", ".tgz", "surreal"),
    (
        "linux-arm64",
        "aarch64-unknown-linux-gnu",
        ".tgz",
        "surreal",
    ),
];

/// Fetch the SurrealDB sidecar binary.
pub struct FetchSurreal {
    pub target: String,
    /// Re-download even if the target file already exists.
    pub force: bool,
}

impl Task for FetchSurreal {
    fn name(&self) -> &'static str {
        "fetch-surreal"
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        crate::stage::section("Fetch SurrealDB sidecar binary");

        // ── Validate target ────────────────────────────────────────
        let validate = Stage::start("validate target");
        let &(_, triple, suffix, archive_bin_name) = SUPPORTED_TARGETS
            .iter()
            .find(|(t, _, _, _)| *t == self.target)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "unknown target `{}` — supported: {}",
                    self.target,
                    SUPPORTED_TARGETS
                        .iter()
                        .map(|(t, _, _, _)| *t)
                        .collect::<Vec<_>>()
                        .join(", ")
                )
            })?;
        validate.ok_with(&self.target);

        let (exe_ext, upstream_os, upstream_arch) = match self.target.as_str() {
            "win32-x64" => (".exe", "windows", "amd64"),
            "darwin-arm64" => ("", "darwin", "arm64"),
            "darwin-x64" => ("", "darwin", "amd64"),
            "linux-x64" => ("", "linux", "amd64"),
            "linux-arm64" => ("", "linux", "arm64"),
            other => bail!("unsupported target triple shape for {other}"),
        };

        // ── Destination — Tauri sidecar convention ───────────────
        let dst_dir = ws
            .root()
            .join("interfaces")
            .join("desktop")
            .join("src-tauri")
            .join("binaries");
        fs::create_dir_all(&dst_dir)?;
        let dst_file = dst_dir.join(format!("surreal-{triple}{exe_ext}"));

        if dst_file.exists() && !self.force {
            let cached = Stage::start("cached");
            cached.ok_with(format!(
                "{} — rerun with --force to replace",
                dst_file.display()
            ));
            return Ok(());
        }

        // ── Download ───────────────────────────────────────────────
        let asset_name =
            format!("surreal-{SURREAL_RELEASE_TAG}.{upstream_os}-{upstream_arch}{suffix}");
        let url = format!(
            "https://github.com/surrealdb/surrealdb/releases/download/{SURREAL_RELEASE_TAG}/{asset_name}"
        );

        let tmp_dir = ws.root().join(".userdata").join("tmp").join("surreal");
        fs::create_dir_all(&tmp_dir)?;
        let tmp_file = tmp_dir.join(&asset_name);

        let dl = Stage::start("download");
        curl_to(&url, &tmp_file).with_context(|| format!("download {url}"))?;
        let dl_size = fs::metadata(&tmp_file)?.len();
        dl.ok_with(format!(
            "{asset_name} ({} MB)",
            dl_size / (1024 * 1024).max(1)
        ));

        // ── Extract / install ──────────────────────────────────────
        let install = Stage::start("install");
        if suffix == ".exe" {
            fs::copy(&tmp_file, &dst_file)
                .with_context(|| format!("copy {} → {}", tmp_file.display(), dst_file.display()))?;
        } else {
            extract_tgz_entry(&tmp_file, archive_bin_name, &dst_file).with_context(|| {
                format!("extract `{archive_bin_name}` from {}", tmp_file.display())
            })?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let perms = fs::Permissions::from_mode(0o755);
                fs::set_permissions(&dst_file, perms)
                    .with_context(|| format!("chmod +x {}", dst_file.display()))?;
            }
        }
        install.ok_with(format!("{}", dst_file.display()));

        println!(
            "\n  SurrealDB {} sidecar ready for target `{}`\n  Location: {}",
            SURREAL_RELEASE_TAG,
            self.target,
            dst_file.display()
        );

        Ok(())
    }
}

/// Download with `curl` — available on every dev machine that can git clone.
/// We shell out instead of pulling an HTTP crate into xtask just for this.
fn curl_to(url: &str, dst: &PathBuf) -> Result<()> {
    let status = Command::new("curl")
        .arg("-fsSL")
        .arg("--retry")
        .arg("3")
        .arg("-o")
        .arg(dst)
        .arg(url)
        .status()
        .with_context(|| "spawn curl — is it installed and on PATH?")?;
    if !status.success() {
        bail!("curl exited with status {status}");
    }
    Ok(())
}

/// Extract a single entry from a `.tgz` into `dst`. No external deps —
/// we read gzip manually via `flate2` if we had it, but xtask stays
/// dep-light, so shell out to `tar` (present on macOS, Linux, and
/// modern Windows via `System32\tar.exe`).
fn extract_tgz_entry(tgz: &PathBuf, entry_name: &str, dst: &PathBuf) -> Result<()> {
    let work_dir = tgz.parent().unwrap().join("extracted");
    let _ = fs::remove_dir_all(&work_dir);
    fs::create_dir_all(&work_dir)?;

    let status = Command::new("tar")
        .current_dir(&work_dir)
        .arg("-xzf")
        .arg(tgz)
        .status()
        .with_context(|| "spawn tar — install GNU tar or use Windows 10+")?;
    if !status.success() {
        bail!("tar exited with status {status}");
    }

    let found = walk_for_file(&work_dir, entry_name)
        .ok_or_else(|| anyhow::anyhow!("entry `{entry_name}` not found in archive"))?;

    // Stream copy rather than fs::copy so we never keep both open when the
    // destination pre-exists and is being replaced.
    let mut src = fs::File::open(&found)?;
    let mut out = fs::File::create(dst)?;
    let mut buf = [0u8; 64 * 1024];
    loop {
        let n = src.read(&mut buf)?;
        if n == 0 {
            break;
        }
        out.write_all(&buf[..n])?;
    }
    Ok(())
}

/// Depth-first search for a file named `name` under `root`.
fn walk_for_file(root: &PathBuf, name: &str) -> Option<PathBuf> {
    let mut stack = vec![root.clone()];
    while let Some(dir) = stack.pop() {
        let entries = fs::read_dir(&dir).ok()?;
        for e in entries.flatten() {
            let p = e.path();
            if p.is_dir() {
                stack.push(p);
            } else if p.file_name().and_then(|n| n.to_str()) == Some(name) {
                return Some(p);
            }
        }
    }
    None
}
