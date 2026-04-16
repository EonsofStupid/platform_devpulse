//! `cargo xtask fetch-devforge` — download, verify, and extract a pinned
//! DevForge REH release artifact into the per-platform resource dir.
//!
//! # Flow
//!
//! 1. Read the committed pinned manifest at
//!    `interfaces/desktop/src-tauri/resources/devforge/manifest.json`.
//! 2. Resolve the artifact matching `--target <win32-x64|darwin-arm64|...>`
//!    and `--kind` (default `reh-web-min`).
//! 3. Cache-skip if `.devforge-version` marker in the target subdir
//!    already matches the pinned version.
//! 4. Download the artifact from `github.com/EonsofStupid/devforge/
//!    releases/download/<tag>/<file>`. Uses `GITHUB_TOKEN` from env when
//!    present (required for private repo release assets).
//! 5. Verify SHA256 against the `sha256` field pinned in the manifest.
//! 6. Clear the target subdir and extract the zip into it.
//! 7. Confirm `out/server-main.js` exists at the extracted root — the
//!    REH entry script [`paths.rs`] uses as the validity marker.
//! 8. Write `.devforge-version` for future cache hits.
//!
//! # Why this exists
//!
//! Committing a 70 MB REH tree per platform into git is the wrong answer
//! (huge history, fragile native modules, slow clones). The right answer
//! is what every prebuilt-native-dep in Rust does: distribute via GitHub
//! Releases, pin the version + digest in a small committed manifest, and
//! fetch on build. `cargo xtask fetch-devforge` is that fetch step.
//!
//! This is **not** part of `preflight` or `run-dev` — it's a one-shot
//! command you run after bumping the manifest version. The fetched tree
//! is then bundled into the Tauri installer via `tauri.{os}.conf.json`
//! per-target resource globs.

use crate::commands::Task;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;
use anyhow::{bail, Context, Result};
use serde::Deserialize;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

/// Target id -> (platform, arch) mapping. Matches `PLATFORM_SUBDIR` in
/// [`interfaces/desktop/src-tauri/src/commands/devforge/paths.rs`].
const SUPPORTED_TARGETS: &[(&str, &str, &str)] = &[
    ("win32-x64", "win32", "x64"),
    ("darwin-arm64", "darwin", "arm64"),
    ("darwin-x64", "darwin", "x64"),
    ("linux-x64", "linux", "x64"),
];

/// Default artifact kind — the client/server REH variant with full
/// extension support. Set `--kind client-min` to fetch the Electron
/// standalone instead (not currently wired into the runtime).
const DEFAULT_KIND: &str = "reh-web-min";

/// Minimum download buffer for streaming HTTP responses.
const IO_BUF_SIZE: usize = 64 * 1024;

/// Fetch a pinned DevForge REH artifact into the per-platform resource dir.
pub struct FetchDevForge {
    pub target: String,
    pub manifest: Option<PathBuf>,
    pub kind: Option<String>,
}

impl Task for FetchDevForge {
    fn name(&self) -> &'static str {
        "fetch-devforge"
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        stage::section("Fetch DevForge REH tree");

        // ── Validate target ────────────────────────────────────────
        let validate = Stage::start("validate target");
        let (_, platform, arch) = SUPPORTED_TARGETS
            .iter()
            .find(|(t, _, _)| *t == self.target)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "unknown target `{}` — supported: {}",
                    self.target,
                    SUPPORTED_TARGETS
                        .iter()
                        .map(|(t, _, _)| *t)
                        .collect::<Vec<_>>()
                        .join(", ")
                )
            })?;
        validate.ok_with(&self.target);

        // ── Load manifest ──────────────────────────────────────────
        let manifest_path = self.manifest.clone().unwrap_or_else(|| {
            ws.root()
                .join("interfaces")
                .join("desktop")
                .join("src-tauri")
                .join("resources")
                .join("devforge")
                .join("manifest.json")
        });

        let load = Stage::start("load manifest");
        let manifest_txt = fs::read_to_string(&manifest_path)
            .with_context(|| format!("read {}", manifest_path.display()))?;
        let manifest: Manifest = serde_json::from_str(&manifest_txt)
            .with_context(|| format!("parse {}", manifest_path.display()))?;

        if manifest.schema != 1 {
            bail!(
                "manifest schema {} not supported (expected 1)",
                manifest.schema
            );
        }
        load.ok_with(format!(
            "{} {} ({})",
            manifest.product, manifest.version, manifest.tag
        ));

        // ── Select artifact ────────────────────────────────────────
        let kind = self.kind.as_deref().unwrap_or(DEFAULT_KIND);
        let select = Stage::start("select artifact");
        let artifact = manifest
            .artifacts
            .iter()
            .find(|a| a.platform == *platform && a.arch == *arch && a.kind == kind)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "no manifest artifact for platform={} arch={} kind={}",
                    platform,
                    arch,
                    kind
                )
            })?;
        select.ok_with(&artifact.file_name);

        // ── Destination ────────────────────────────────────────────
        let dst_root = ws
            .root()
            .join("interfaces")
            .join("desktop")
            .join("src-tauri")
            .join("resources")
            .join("devforge")
            .join(&self.target);

        // ── Cache check ────────────────────────────────────────────
        let marker = dst_root.join(".devforge-version");
        if let Ok(existing) = fs::read_to_string(&marker) {
            if existing.trim() == manifest.version {
                let cache = Stage::start("cache check");
                cache.ok_with("target already pinned — skipping fetch");
                println!("  DevForge {} ready at {}", manifest.version, dst_root.display());
                return Ok(());
            }
        }

        // ── Download (with local cache in .userdata/tmp) ───────────
        let tmp_dir = ws.root().join(".userdata").join("tmp").join("devforge");
        fs::create_dir_all(&tmp_dir)?;
        let tmp_file = tmp_dir.join(&artifact.file_name);

        let pinned_sha = artifact
            .sha256
            .as_deref()
            .ok_or_else(|| anyhow::anyhow!(
                "manifest artifact for target {} missing `sha256` field — \
                 refusing unverified download",
                self.target
            ))?;

        if !is_cached(&tmp_file, pinned_sha)? {
            let agent = build_http_agent()?;

            let resolve = Stage::start("resolve asset");
            let (owner, repo) = parse_github_repo(&manifest.repository)?;
            let asset_api_url =
                resolve_asset_api_url(&agent, &owner, &repo, &manifest.tag, &artifact.file_name)?;
            resolve.ok_with(format!("{owner}/{repo} {}", &manifest.tag));

            let dl = Stage::start("download");
            download_artifact(&agent, &asset_api_url, &tmp_file)
                .with_context(|| format!("download {}", artifact.file_name))?;
            let dl_size = fs::metadata(&tmp_file)?.len();
            dl.ok_with(format!(
                "{} ({} MB)",
                artifact.file_name,
                dl_size / (1024 * 1024)
            ));
        } else {
            let dl = Stage::start("download");
            dl.ok_with("cached in .userdata/tmp/devforge");
        }

        // ── SHA256 verify ──────────────────────────────────────────
        let verify = Stage::start("verify sha256");
        let actual = sha256_file(&tmp_file)?;
        if !actual.eq_ignore_ascii_case(pinned_sha) {
            verify.fail(format!("expected {} got {}", pinned_sha, actual));
            bail!("sha256 mismatch for {}", artifact.file_name);
        }
        verify.ok_with(&actual[..16]);

        // ── Extract ────────────────────────────────────────────────
        let extract = Stage::start("extract");
        clear_tree(&dst_root)?;
        let (files, bytes) = unzip(&tmp_file, &dst_root)?;
        extract.ok_with(format!("{files} files ({} MB)", bytes / (1024 * 1024)));

        // ── Validity check ─────────────────────────────────────────
        let entry = dst_root.join("out").join("server-main.js");
        if !entry.is_file() {
            bail!(
                "extracted tree missing {} — REH launcher layout mismatch",
                entry.display()
            );
        }

        // ── Write version marker ───────────────────────────────────
        fs::write(&marker, &manifest.version)
            .with_context(|| format!("write {}", marker.display()))?;

        println!(
            "\n  DevForge REH {} ready for target `{}`\n  Location: {}",
            manifest.version,
            self.target,
            dst_root.display()
        );

        Ok(())
    }
}

// ─── Manifest schema ──────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct Manifest {
    schema: u32,
    product: String,
    version: String,
    tag: String,
    #[allow(dead_code)]
    repository: String,
    #[serde(default, rename = "releaseUrl")]
    #[allow(dead_code)]
    release_url: Option<String>,
    artifacts: Vec<Artifact>,
}

#[derive(Debug, Deserialize)]
struct Artifact {
    /// Browser-facing GitHub release asset URL. Kept for schema parity
    /// with the upstream devforge manifest and human-readable provenance;
    /// the fetch path itself resolves the API asset URL at runtime via
    /// [`resolve_asset_api_url`] because private repos refuse direct
    /// `browser_download_url` fetches even when authenticated.
    #[allow(dead_code)]
    url: String,
    platform: String,
    kind: String,
    arch: String,
    #[serde(rename = "fileName")]
    file_name: String,
    /// SHA256 digest as lowercase hex. Required for fetch verification.
    /// The upstream devforge release manifest does not include this field;
    /// it is pinned locally in the committed copy at
    /// `resources/devforge/manifest.json`.
    #[serde(default)]
    sha256: Option<String>,
}

// ─── Download + hash ──────────────────────────────────────────────────

/// Returns true if `path` exists and its SHA256 matches `expected_hex`.
fn is_cached(path: &Path, expected_hex: &str) -> Result<bool> {
    if !path.is_file() {
        return Ok(false);
    }
    let actual = sha256_file(path)?;
    Ok(actual.eq_ignore_ascii_case(expected_hex))
}

/// Build a ureq agent with native-tls (Windows Schannel) wired in.
///
/// ureq 2.12 with `default-features = false` ships no TLS backend; we
/// have to pass one explicitly. `redirects(10)` follows GitHub's API →
/// signed-S3 redirect chain for asset downloads.
fn build_http_agent() -> Result<ureq::Agent> {
    let tls_connector = native_tls::TlsConnector::new()
        .context("failed to build native-tls connector (Schannel)")?;
    Ok(ureq::AgentBuilder::new()
        .tls_connector(std::sync::Arc::new(tls_connector))
        .redirects(10)
        .user_agent("devpulse-xtask fetch-devforge/1.0")
        .build())
}

/// Apply `Authorization: Bearer $GITHUB_TOKEN` to a request if the env
/// var is set and non-empty. No-op otherwise (public repos work unauth).
fn with_github_auth(req: ureq::Request) -> ureq::Request {
    match std::env::var("GITHUB_TOKEN") {
        Ok(token) if !token.is_empty() => {
            req.set("Authorization", &format!("Bearer {token}"))
        }
        _ => req,
    }
}

/// Parse `https://github.com/{owner}/{repo}` into `(owner, repo)`.
///
/// Trailing `.git`, `/`, and `/releases/...` suffixes are stripped.
fn parse_github_repo(url: &str) -> Result<(String, String)> {
    let rest = url
        .strip_prefix("https://github.com/")
        .or_else(|| url.strip_prefix("http://github.com/"))
        .ok_or_else(|| anyhow::anyhow!("not a github.com URL: {url}"))?;
    let mut parts = rest.trim_end_matches('/').split('/');
    let owner = parts
        .next()
        .ok_or_else(|| anyhow::anyhow!("missing owner in {url}"))?;
    let repo = parts
        .next()
        .ok_or_else(|| anyhow::anyhow!("missing repo in {url}"))?;
    let repo = repo.trim_end_matches(".git");
    Ok((owner.to_string(), repo.to_string()))
}

/// Resolve a release asset's API download URL via `GET /releases/tags/{tag}`.
///
/// Private repos refuse `browser_download_url` even with auth — the only
/// reliable path is the asset API URL with `Accept: application/octet-stream`.
fn resolve_asset_api_url(
    agent: &ureq::Agent,
    owner: &str,
    repo: &str,
    tag: &str,
    file_name: &str,
) -> Result<String> {
    let release_url = format!("https://api.github.com/repos/{owner}/{repo}/releases/tags/{tag}");
    let req = with_github_auth(agent.get(&release_url))
        .set("Accept", "application/vnd.github+json");

    let resp = req
        .call()
        .with_context(|| format!("GET {release_url}"))?;
    if resp.status() != 200 {
        bail!(
            "release lookup failed: HTTP {} {} for {}",
            resp.status(),
            resp.status_text(),
            release_url
        );
    }

    let body = resp.into_string().context("read release JSON body")?;
    let json: serde_json::Value =
        serde_json::from_str(&body).context("parse release JSON")?;
    let assets = json
        .get("assets")
        .and_then(|a| a.as_array())
        .ok_or_else(|| anyhow::anyhow!("release JSON has no `assets` array"))?;

    for asset in assets {
        let name = asset.get("name").and_then(|n| n.as_str()).unwrap_or("");
        if name == file_name {
            let api_url = asset
                .get("url")
                .and_then(|u| u.as_str())
                .ok_or_else(|| anyhow::anyhow!("asset `{name}` missing `url` field"))?;
            return Ok(api_url.to_string());
        }
    }

    bail!(
        "no asset named `{file_name}` in release {tag} of {owner}/{repo} \
         (available: {})",
        assets
            .iter()
            .filter_map(|a| a.get("name").and_then(|n| n.as_str()))
            .collect::<Vec<_>>()
            .join(", ")
    )
}

/// Download a release asset via the GitHub API asset URL with
/// `Accept: application/octet-stream`. The API responds with 302 → signed
/// S3; `ureq`'s default redirect policy strips the Authorization header
/// on cross-host redirects, which is exactly what S3 wants.
fn download_artifact(
    agent: &ureq::Agent,
    asset_api_url: &str,
    dst: &Path,
) -> Result<()> {
    let req = with_github_auth(agent.get(asset_api_url))
        .set("Accept", "application/octet-stream");

    let resp = req.call().context("HTTP request failed")?;

    if resp.status() != 200 {
        bail!(
            "GitHub returned HTTP {} {} for {}",
            resp.status(),
            resp.status_text(),
            asset_api_url
        );
    }

    let mut reader = resp.into_reader();
    let mut file = fs::File::create(dst)
        .with_context(|| format!("create {}", dst.display()))?;
    let mut buf = vec![0u8; IO_BUF_SIZE];
    loop {
        let n = reader.read(&mut buf).context("read response body")?;
        if n == 0 {
            break;
        }
        use std::io::Write;
        file.write_all(&buf[..n])
            .with_context(|| format!("write {}", dst.display()))?;
    }
    Ok(())
}

/// Compute the SHA256 of a file as lowercase hex.
fn sha256_file(path: &Path) -> Result<String> {
    use sha2::{Digest, Sha256};
    let mut file = fs::File::open(path)
        .with_context(|| format!("open {}", path.display()))?;
    let mut hasher = Sha256::new();
    let mut buf = vec![0u8; IO_BUF_SIZE];
    loop {
        let n = file.read(&mut buf).context("read file")?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(hex::encode(hasher.finalize()))
}

// ─── Extract ──────────────────────────────────────────────────────────

/// Remove the target dir if it exists and recreate it empty.
fn clear_tree(root: &Path) -> Result<()> {
    if root.exists() {
        fs::remove_dir_all(root)
            .with_context(|| format!("remove {}", root.display()))?;
    }
    fs::create_dir_all(root)
        .with_context(|| format!("create {}", root.display()))?;
    Ok(())
}

/// Extract a zip archive into `dst`. Returns `(file_count, total_bytes)`.
///
/// Uses `enclosed_name()` which rejects path traversal (`..` entries) —
/// important when extracting untrusted archives.
fn unzip(zip_path: &Path, dst: &Path) -> Result<(u64, u64)> {
    let file = fs::File::open(zip_path)
        .with_context(|| format!("open {}", zip_path.display()))?;
    let mut archive = zip::ZipArchive::new(file).context("parse zip archive")?;

    let mut files = 0u64;
    let mut bytes = 0u64;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let rel = entry
            .enclosed_name()
            .ok_or_else(|| anyhow::anyhow!("unsafe zip entry: {}", entry.name()))?
            .to_owned();
        let out_path = dst.join(&rel);

        if entry.is_dir() {
            fs::create_dir_all(&out_path)
                .with_context(|| format!("create dir {}", out_path.display()))?;
            continue;
        }

        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("create parent {}", parent.display()))?;
        }

        let mut out_file = fs::File::create(&out_path)
            .with_context(|| format!("create {}", out_path.display()))?;
        let n = std::io::copy(&mut entry, &mut out_file)
            .with_context(|| format!("write {}", out_path.display()))?;
        files += 1;
        bytes += n;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Some(mode) = entry.unix_mode() {
                let _ = fs::set_permissions(&out_path, fs::Permissions::from_mode(mode));
            }
        }
    }

    Ok((files, bytes))
}
