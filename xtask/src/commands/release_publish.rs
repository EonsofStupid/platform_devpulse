//! `ReleasePublish` — sign the portable zip + emit `latest.json` for
//! the Tauri auto-updater.
//!
//! Runs after a successful `cargo xtask build-release --portable-only`.
//! Reads the build manifest to locate the portable artifact and pull
//! the version, fetches the Ed25519 signing key (env var → OS keyring
//! fallback chain), invokes `pnpm tauri signer sign` to produce a
//! `.sig` file next to the zip, then writes the canonical Tauri
//! `latest.json` envelope referencing the GitHub Releases download URL
//! for this version.
//!
//! Output (under `target/release/`):
//!
//! - `devpulse-desktop-v<version>-portable.zip` (already there)
//! - `devpulse-desktop-v<version>-portable.zip.sig` (new — minisign signature)
//! - `latest.json` (new — Tauri updater envelope)
//!
//! The operator publishes all three to a GitHub Release tagged
//! `v<version>` so the URL baked into `tauri.conf.json`
//! (`.../releases/latest/download/latest.json`) resolves.

use crate::commands::Task;
use crate::workspace::Workspace;
use anyhow::{bail, Context, Result};
use serde::Serialize;
use serde_json::Value;
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

const KEYRING_SERVICE: &str = "devpulse";
const KEYRING_KEY: &str = "release-signing-key";
const PLATFORM_KEY: &str = "windows-x86_64";
/// Base download URL on the GitHub Releases CDN. Versions tag-derive
/// to `v<version>` per the conventional-commits workflow.
const GITHUB_RELEASES_BASE: &str =
    "https://github.com/EonsofStupid/platform_devpulse/releases/download";

/// Sign the portable zip and emit `latest.json`.
pub struct ReleasePublish {
    /// Release notes (markdown). When `None`, the field in `latest.json`
    /// is empty and the operator edits it on GitHub before publishing.
    pub notes: Option<String>,
}

#[derive(Serialize)]
struct LatestJson {
    version: String,
    notes: String,
    pub_date: String,
    platforms: BTreeMap<String, PlatformEntry>,
}

#[derive(Serialize)]
struct PlatformEntry {
    signature: String,
    url: String,
}

impl Task for ReleasePublish {
    fn name(&self) -> &'static str {
        "release-publish"
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        let target_release = ws.root().join("target").join("release");
        let manifest_path = target_release.join("build.manifest.json");

        let manifest_raw = fs::read_to_string(&manifest_path).with_context(|| {
            format!(
                "read build manifest at {} — run `cargo xtask build-release --portable-only` first",
                manifest_path.display()
            )
        })?;
        let manifest: Value =
            serde_json::from_str(&manifest_raw).context("parse build.manifest.json")?;

        let version = manifest
            .get("product")
            .and_then(|p| p.get("version"))
            .and_then(Value::as_str)
            .context("manifest missing product.version")?
            .to_string();

        let zip_relpath = manifest
            .get("artifacts")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .find(|a| a.get("kind").and_then(Value::as_str) == Some("portable-zip"))
            .and_then(|a| a.get("path").and_then(Value::as_str))
            .context(
                "manifest missing portable-zip artifact — \
                 the --portable-only build run did not produce a zip",
            )?
            .to_string();

        let zip_abs = ws
            .root()
            .join(zip_relpath.replace('/', std::path::MAIN_SEPARATOR_STR));
        if !zip_abs.exists() {
            bail!(
                "portable zip declared in manifest does not exist on disk: {}",
                zip_abs.display()
            );
        }

        crate::xinfo!("  product version : v{version}");
        crate::xinfo!("  portable zip    : {}", zip_abs.display());

        let private_key = resolve_private_key()?;
        let sig_path = sign_zip(ws, &zip_abs, &private_key)?;
        let signature_contents = fs::read_to_string(&sig_path).with_context(|| {
            format!(
                "read signature file written by tauri signer: {}",
                sig_path.display()
            )
        })?;

        let zip_filename = zip_abs
            .file_name()
            .and_then(|s| s.to_str())
            .context("portable zip filename was not valid UTF-8")?;
        let download_url = format!("{GITHUB_RELEASES_BASE}/v{version}/{zip_filename}");

        let pub_date = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);

        let mut platforms = BTreeMap::new();
        platforms.insert(
            PLATFORM_KEY.to_string(),
            PlatformEntry {
                signature: signature_contents,
                url: download_url,
            },
        );

        let latest = LatestJson {
            version: format!("v{version}"),
            notes: self.notes.clone().unwrap_or_default(),
            pub_date,
            platforms,
        };

        let latest_path = target_release.join("latest.json");
        let json = serde_json::to_string_pretty(&latest).context("serialize latest.json")?;
        fs::write(&latest_path, json)
            .with_context(|| format!("write {}", latest_path.display()))?;

        crate::xinfo!("");
        crate::xinfo!("── Release artifacts ─────────────────────────────");
        crate::xinfo!("  zip       : {}", zip_abs.display());
        crate::xinfo!("  signature : {}", sig_path.display());
        crate::xinfo!("  manifest  : {}", latest_path.display());
        crate::xinfo!("");
        crate::xinfo!("Publish to GitHub Releases (one-liner via gh CLI):");
        crate::xinfo!(
            "  gh release create v{version} --notes \"<release notes>\" \\\n    \
             \"{zip}\" \\\n    \"{sig}\" \\\n    \"{latest}\"",
            zip = zip_abs.display(),
            sig = sig_path.display(),
            latest = latest_path.display(),
        );
        crate::xinfo!("");
        crate::xinfo!(
            "The tag MUST be `v{version}` so the auto-updater URL\n  \
             https://github.com/EonsofStupid/platform_devpulse/releases/latest/download/latest.json\n  \
             resolves to this release."
        );

        Ok(())
    }
}

/// Pull the Ed25519 private key from env or OS keyring.
///
/// Precedence:
/// 1. `TAURI_SIGNING_PRIVATE_KEY` env var — set explicitly by the operator
///    when they want to override (CI runs, alternate key for testing).
/// 2. OS keyring entry `devpulse:release-signing-key` — the canonical
///    storage location written during keypair generation.
///
/// Returns a clear, actionable error when neither source supplies a key.
fn resolve_private_key() -> Result<String> {
    if let Ok(env) = std::env::var("TAURI_SIGNING_PRIVATE_KEY") {
        if !env.is_empty() {
            crate::xinfo!("  signing key     : $env:TAURI_SIGNING_PRIVATE_KEY");
            return Ok(env);
        }
    }
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_KEY).with_context(|| {
        format!(
            "construct keyring entry {KEYRING_SERVICE}:{KEYRING_KEY} — \
             OS keyring access failed"
        )
    })?;
    let key = entry.get_password().with_context(|| {
        format!(
            "read {KEYRING_SERVICE}:{KEYRING_KEY} from OS keyring — \
             store the private key under that entry, or set \
             $env:TAURI_SIGNING_PRIVATE_KEY before invoking this task"
        )
    })?;
    crate::xinfo!("  signing key     : OS keyring ({KEYRING_SERVICE}:{KEYRING_KEY})");
    Ok(key)
}

/// Invoke `pnpm tauri signer sign` to produce a `<zip>.sig` next to the
/// portable zip. The private key reaches the signer via the
/// `TAURI_SIGNING_PRIVATE_KEY` env var so the key never appears on the
/// command line (process args are world-readable on most platforms).
fn sign_zip(ws: &Workspace, zip: &Path, private_key: &str) -> Result<PathBuf> {
    let desktop_dir = ws.desktop_dir();
    let mut cmd = Command::new("pnpm");
    cmd.current_dir(&desktop_dir)
        .args(["tauri", "signer", "sign", "--password", ""])
        .arg("--file")
        .arg(zip)
        .env("TAURI_SIGNING_PRIVATE_KEY", private_key);

    let status = cmd
        .status()
        .context("spawn `pnpm tauri signer sign` — pnpm must be on PATH")?;
    if !status.success() {
        bail!("`pnpm tauri signer sign` exited with status {status}");
    }

    let zip_filename = zip
        .file_name()
        .and_then(|s| s.to_str())
        .context("portable zip filename was not valid UTF-8")?;
    let sig_path = zip.with_file_name(format!("{zip_filename}.sig"));
    if !sig_path.exists() {
        bail!(
            "expected signature file at {} — tauri signer succeeded but no .sig was produced",
            sig_path.display()
        );
    }
    Ok(sig_path)
}
