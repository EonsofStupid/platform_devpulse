//! `cargo xtask fetch-surreal` — install upstream's `SurrealDB` server build
//! inside the `DevPulse` folder (plan 0007 Part S, S1).
//!
//! `DevPulse` runs Surreal as a built binary under its own supervisor, never
//! compiled in (owner decision 6, 2026-10-24). This command puts the
//! configured build where the engine looks for it:
//!
//! ```text
//! {data_dir}/{install_dir}/{version}/surreal(.exe)   upstream's binary
//! {data_dir}/{install_dir}/{version}/LICENSE         upstream's licence (BSL 1.1)
//! ```
//!
//! `version` and `install_dir` come from `[services.system.surreal]`
//! (`config/platform/services/system/surreal.toml`, or your
//! `.userdata/platform.toml`), the same keys the engine reads.
//!
//! # Steps
//!
//! 1. The release asset from GitHub, and its SHA-256 from `SurrealDB`'s
//!    download host (`download.surrealdb.com/v{V}/…txt`): two independent
//!    sources, so a tampered file has to fool both.
//! 2. The download is hashed and refused on any mismatch.
//! 3. The build is assembled in a staging folder beside its destination and
//!    renamed into place in one step; other installed versions are kept.
//!
//! # Targets
//!
//! `win32-x64`, `darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`
//! (upstream publishes no Windows arm64 build).

use crate::commands::Task;
use crate::stage::Stage;
use crate::workspace::Workspace;
use anyhow::{Context, Result, bail};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

/// `(xtask-target, upstream-os, upstream-arch, asset-suffix, binary-name-in-archive)`.
const SUPPORTED_TARGETS: &[(&str, &str, &str, &str, &str)] = &[
    // Windows ships a raw .exe, no archive.
    ("win32-x64", "windows", "amd64", ".exe", "surreal.exe"),
    ("darwin-arm64", "darwin", "arm64", ".tgz", "surreal"),
    ("darwin-x64", "darwin", "amd64", ".tgz", "surreal"),
    ("linux-x64", "linux", "amd64", ".tgz", "surreal"),
    ("linux-arm64", "linux", "arm64", ".tgz", "surreal"),
];

/// The engine's defaults when the keys are absent (`SurrealServiceEntry`).
const DEFAULT_VERSION: &str = "3.0.5";
const DEFAULT_INSTALL_DIR: &str = "global/runtimes/surreal";

/// Install the configured `SurrealDB` server build.
pub struct FetchSurreal {
    pub target: String,
    /// Reinstall even if the configured build is already installed.
    pub force: bool,
}

impl Task for FetchSurreal {
    fn name(&self) -> &'static str {
        "fetch-surreal"
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        crate::stage::section("Install the SurrealDB server build");

        // ── Validate target ────────────────────────────────────────
        let validate = Stage::start("validate target");
        let &(_, upstream_os, upstream_arch, suffix, archive_bin_name) = SUPPORTED_TARGETS
            .iter()
            .find(|(t, ..)| *t == self.target)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "unknown target `{}` — supported: {}",
                    self.target,
                    SUPPORTED_TARGETS
                        .iter()
                        .map(|(t, ..)| *t)
                        .collect::<Vec<_>>()
                        .join(", ")
                )
            })?;
        validate.ok_with(&self.target);

        // ── Where, from the configuration ─────────────────────────
        let configured = Stage::start("configuration");
        let data_dir = ws.root().join(".userdata");
        let (version, install_dir) = configured_build(ws)?;
        let install_root = under(&data_dir, &install_dir);
        let build_dir = install_root.join(&version);
        let exe_ext = if suffix == ".exe" { ".exe" } else { "" };
        let binary = build_dir.join(format!("surreal{exe_ext}"));
        configured.ok_with(format!("v{version} → {}", build_dir.display()));

        if binary.is_file() && !self.force {
            let cached = Stage::start("installed");
            cached.ok_with(format!(
                "{} — rerun with --force to reinstall",
                binary.display()
            ));
            return Ok(());
        }

        // ── Download: asset, published digest, licence ─────────────
        let platform = format!("{upstream_os}-{upstream_arch}");
        let asset_name = format!("surreal-v{version}.{platform}{suffix}");
        let asset_url = format!(
            "https://github.com/surrealdb/surrealdb/releases/download/v{version}/{asset_name}"
        );
        let digest_url =
            format!("https://download.surrealdb.com/v{version}/surreal-v{version}.{platform}.txt");
        let license_url =
            format!("https://github.com/surrealdb/surrealdb/releases/download/v{version}/LICENSE");

        let tmp_dir = data_dir
            .join("tmp")
            .join("surreal")
            .join(format!("v{version}"));
        let _ = fs::remove_dir_all(&tmp_dir);
        fs::create_dir_all(&tmp_dir)?;
        let tmp_asset = tmp_dir.join(&asset_name);
        let tmp_digest = tmp_dir.join("digest.txt");
        let tmp_license = tmp_dir.join("LICENSE");

        let dl = Stage::start("download");
        curl_to(&asset_url, &tmp_asset).with_context(|| format!("download {asset_url}"))?;
        curl_to(&digest_url, &tmp_digest).with_context(|| format!("download {digest_url}"))?;
        curl_to(&license_url, &tmp_license).with_context(|| format!("download {license_url}"))?;
        let dl_size = fs::metadata(&tmp_asset)?.len();
        dl.ok_with(format!("{asset_name} ({dl_size} bytes)"));

        // ── Verify against the published SHA-256 ───────────────────
        let verify = Stage::start("verify sha256");
        let expected = published_digest(&fs::read_to_string(&tmp_digest)?)
            .with_context(|| format!("read the published digest at {digest_url}"))?;
        let actual = sha256_file(&tmp_asset)?;
        if actual != expected {
            let _ = fs::remove_dir_all(&tmp_dir);
            bail!(
                "{asset_name} does not match its published SHA-256 — refused, nothing installed\n  published: {expected}\n  download:  {actual}"
            );
        }
        verify.ok_with(&actual);

        // ── Assemble beside the destination, then rename into place ──
        let install = Stage::start("install");
        fs::create_dir_all(&install_root)?;
        let staging = install_root.join(format!(".staging-{version}"));
        let _ = fs::remove_dir_all(&staging);
        fs::create_dir_all(&staging)?;
        let staged_binary = staging.join(format!("surreal{exe_ext}"));
        if suffix == ".exe" {
            fs::copy(&tmp_asset, &staged_binary)
                .with_context(|| format!("stage {}", staged_binary.display()))?;
        } else {
            extract_tgz_entry(&tmp_asset, archive_bin_name, &staged_binary).with_context(|| {
                format!("extract `{archive_bin_name}` from {}", tmp_asset.display())
            })?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                fs::set_permissions(&staged_binary, fs::Permissions::from_mode(0o755))
                    .with_context(|| format!("chmod +x {}", staged_binary.display()))?;
            }
        }
        fs::copy(&tmp_license, staging.join("LICENSE")).context("stage LICENSE")?;
        replace_dir(&staging, &build_dir)?;
        let _ = fs::remove_dir_all(&tmp_dir);
        install.ok_with(binary.display().to_string());

        println!(
            "\n  SurrealDB v{version} installed for `{}`\n  Binary:  {}\n  SHA-256: {actual} (matches {digest_url})",
            self.target,
            binary.display()
        );
        Ok(())
    }
}

/// `version` and `install_dir` from `[services.system.surreal]`: your
/// `.userdata/platform.toml` when it exists (it replaces the shipped
/// configuration), otherwise the shipped `surreal.toml`.
fn configured_build(ws: &Workspace) -> Result<(String, String)> {
    let user_config = ws.root().join(".userdata").join("platform.toml");
    let source = if user_config.is_file() {
        user_config
    } else {
        ws.root()
            .join("config")
            .join("platform")
            .join("services")
            .join("system")
            .join("surreal.toml")
    };
    let text = fs::read_to_string(&source).with_context(|| format!("read {}", source.display()))?;
    let config: toml::Value =
        toml::from_str(&text).with_context(|| format!("parse {}", source.display()))?;
    let surreal = config
        .get("services")
        .and_then(|v| v.get("system"))
        .and_then(|v| v.get("surreal"));
    let key = |name: &str, default: &str| {
        surreal
            .and_then(|v| v.get(name))
            .and_then(toml::Value::as_str)
            .unwrap_or(default)
            .to_owned()
    };
    Ok((
        key("version", DEFAULT_VERSION),
        key("install_dir", DEFAULT_INSTALL_DIR),
    ))
}

/// A configured path: absolute as given, otherwise under the data dir.
fn under(data_dir: &Path, configured: &str) -> PathBuf {
    let path = Path::new(configured);
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        data_dir.join(path)
    }
}

/// The SHA-256 in a published digest file: its first word, 64 hex digits.
fn published_digest(text: &str) -> Result<String> {
    let word = text.split_whitespace().next().unwrap_or_default();
    if word.len() != 64 || !word.bytes().all(|b| b.is_ascii_hexdigit()) {
        bail!(
            "not a SHA-256: {:?}",
            text.chars().take(80).collect::<String>()
        );
    }
    Ok(word.to_ascii_lowercase())
}

/// The file's SHA-256, lowercase hex.
fn sha256_file(path: &Path) -> Result<String> {
    let mut file = fs::File::open(path).with_context(|| format!("open {}", path.display()))?;
    let mut hasher = Sha256::new();
    let mut buf = vec![0u8; 64 * 1024].into_boxed_slice();
    loop {
        let n = file.read(&mut buf)?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(hex::encode(hasher.finalize()))
}

/// Move `staging` to `dest` in one rename. An existing `dest` (a reinstall)
/// is set aside first and put back if the rename fails.
fn replace_dir(staging: &Path, dest: &Path) -> Result<()> {
    if !dest.exists() {
        return fs::rename(staging, dest)
            .with_context(|| format!("rename {} → {}", staging.display(), dest.display()));
    }
    let aside = set_aside_path(dest);
    let _ = fs::remove_dir_all(&aside);
    fs::rename(dest, &aside).with_context(|| format!("set aside {}", dest.display()))?;
    if let Err(e) = fs::rename(staging, dest) {
        let _ = fs::rename(&aside, dest);
        return Err(e)
            .with_context(|| format!("rename {} → {}", staging.display(), dest.display()));
    }
    let _ = fs::remove_dir_all(&aside);
    Ok(())
}

/// Where a build being replaced waits: `.replaced-{name}` beside it (a
/// version like `3.0.5` has no extension to swap).
fn set_aside_path(dest: &Path) -> PathBuf {
    let name = dest
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    dest.with_file_name(format!(".replaced-{name}"))
}

/// Download with `curl` — available on every dev machine that can git clone.
fn curl_to(url: &str, dst: &Path) -> Result<()> {
    let status = crate::child_env::command("curl")
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

/// Extract a single entry from a `.tgz` into `dst`, through `tar` (present on
/// macOS, Linux, and Windows 10+ as `System32\tar.exe`).
fn extract_tgz_entry(tgz: &Path, entry_name: &str, dst: &Path) -> Result<()> {
    let work_dir = tgz
        .parent()
        .ok_or_else(|| anyhow::anyhow!("tgz path has no parent: {}", tgz.display()))?
        .join("extracted");
    let _ = fs::remove_dir_all(&work_dir);
    fs::create_dir_all(&work_dir)?;

    let status = crate::child_env::command("tar")
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

    let mut src = fs::File::open(&found)?;
    let mut out = fs::File::create(dst)?;
    let mut buf = vec![0u8; 64 * 1024].into_boxed_slice();
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
fn walk_for_file(root: &Path, name: &str) -> Option<PathBuf> {
    let mut stack = vec![root.to_path_buf()];
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

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, clippy::expect_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn the_published_digest_is_its_first_word() {
        let hash = "fa96694e3ebc3c21da08493518c2199354b3a34f5022187b4cbdd4a6f4d325ec";
        assert_eq!(published_digest(&format!("{hash}\n")).unwrap(), hash);
        assert_eq!(
            published_digest(&format!("{}  surreal.exe\n", hash.to_uppercase())).unwrap(),
            hash
        );
        assert!(published_digest("<html>not found</html>").is_err());
        assert!(published_digest("").is_err());
    }

    #[test]
    fn a_file_hashes_to_its_sha256() {
        let dir = std::env::temp_dir().join(format!("xtask-fetch-surreal-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let file = dir.join("abc");
        fs::write(&file, b"abc").unwrap();
        assert_eq!(
            sha256_file(&file).unwrap(),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn a_reinstall_replaces_the_build_in_one_rename_and_keeps_other_versions() {
        let root =
            std::env::temp_dir().join(format!("xtask-surreal-install-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        let older = root.join("3.0.4");
        let dest = root.join("3.0.5");
        fs::create_dir_all(&older).unwrap();
        fs::create_dir_all(&dest).unwrap();
        fs::write(dest.join("surreal"), b"old").unwrap();
        let staging = root.join(".staging-3.0.5");
        fs::create_dir_all(&staging).unwrap();
        fs::write(staging.join("surreal"), b"new").unwrap();

        replace_dir(&staging, &dest).unwrap();

        assert_eq!(fs::read(dest.join("surreal")).unwrap(), b"new");
        assert!(!staging.exists());
        assert!(!set_aside_path(&dest).exists());
        assert_eq!(set_aside_path(&dest), root.join(".replaced-3.0.5"));
        assert!(older.is_dir(), "other versions are kept");
        fs::remove_dir_all(&root).unwrap();
    }
}
