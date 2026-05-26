//! `cargo xtask fetch-devforge` — pull DevForge REH from upstream into
//! the per-platform resource dir.
//!
//! # Flow (default: auto-track latest)
//!
//! 1. Read the committed manifest at
//!    `interfaces/desktop/src-tauri/resources/devforge/manifest.json`
//!    for the per-target artifact template + SHAs as a snapshot of the
//!    last fetched release.
//! 2. Hit `GET /repos/{owner}/{repo}/releases/latest` to discover the
//!    current upstream tag. If it differs from the manifest's tag, the
//!    manifest auto-updates in place:
//!       * download the release's `SHA256SUMS` asset
//!       * rewrite each artifact's `url`, `fileName`, and `sha256`
//!         for the new tag (filename pattern is `{stem}-{tag}.{ext}`,
//!         stable across releases)
//!       * write the updated manifest back to disk (audit trail stays
//!         truthful)
//! 3. Cache-skip if the `.devforge-version` marker in the target
//!    subdir already matches the resolved tag.
//! 4. Download the artifact from the GitHub API asset URL. Uses
//!    `GITHUB_TOKEN` from env when present (required for private repo
//!    release assets).
//! 5. SHA256-verify against the resolved digest.
//! 6. Clear the target subdir and extract the zip into it.
//! 7. Confirm `out/server-main.js` exists at the extracted root.
//! 8. Write `.devforge-version` for future cache hits.
//!
//! # Pinning (override)
//!
//! Pass `--pin` to skip the upstream-latest probe and use whatever tag
//! the committed manifest names. Useful for hermetic release builds
//! where reproducibility outweighs freshness. The default is
//! auto-tracking because "newer DevForge available but xtask refuses to
//! pull it" is the worse failure mode for daily dev.
//!
//! # Why this exists
//!
//! Committing a 70 MB REH tree per platform into git is the wrong answer
//! (huge history, fragile native modules, slow clones). The right answer
//! is what every prebuilt-native-dep in Rust does: distribute via GitHub
//! Releases, ship a small committed manifest as an audit trail, and
//! fetch + verify on build. The fetched tree is then bundled into the
//! Tauri installer via `tauri.{os}.conf.json` per-target resource globs.

use crate::commands::Task;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;
use anyhow::{bail, Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
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

/// Fetch a DevForge REH artifact into the per-platform resource dir.
///
/// Default behaviour is to track upstream latest; pass `--pin` to lock
/// to the committed manifest tag.
pub struct FetchDevForge {
    pub target: String,
    pub manifest: Option<PathBuf>,
    pub kind: Option<String>,
    /// If true, skip the upstream-latest probe and use the manifest as
    /// authoritative. Useful for hermetic release builds.
    pub pin: bool,
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
        let mut manifest: Manifest = serde_json::from_str(&manifest_txt)
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

        // ── Auto-track upstream latest (unless --pin) ──────────────
        let agent = build_http_agent()?;
        let (owner, repo) = parse_github_repo(&manifest.repository)?;

        if !self.pin {
            let probe = Stage::start("probe upstream");
            let latest_tag = query_latest_release_tag(&agent, &owner, &repo)
                .with_context(|| format!("query latest release for {owner}/{repo}"))?;
            if latest_tag == manifest.tag {
                probe.ok_with(format!("{latest_tag} (manifest already current)"));
            } else {
                probe.ok_with(format!("{} → {latest_tag}", manifest.tag));

                let sync = Stage::start("sync manifest to latest");
                let shas = fetch_sha256sums(&agent, &owner, &repo, &latest_tag)
                    .with_context(|| format!("fetch SHA256SUMS for {latest_tag}"))?;
                rewrite_manifest_to_tag(&mut manifest, &owner, &repo, &latest_tag, &shas)?;
                save_manifest(&manifest_path, &manifest)?;
                sync.ok_with(format!(
                    "{} {} ({}) — manifest rewritten",
                    manifest.product, manifest.version, manifest.tag
                ));
            }
        }

        // ── Select artifact ────────────────────────────────────────
        let kind = self.kind.as_deref().unwrap_or(DEFAULT_KIND);
        let select = Stage::start("select artifact");
        let artifact = manifest
            .artifacts
            .iter()
            .find(|a| a.platform == platform && a.arch == arch && a.kind == kind)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "no manifest artifact for platform={platform} arch={arch} kind={kind}"
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
                println!(
                    "  DevForge {} ready at {}",
                    manifest.version,
                    dst_root.display()
                );
                return Ok(());
            }
        }

        let pinned_sha = artifact.sha256.as_deref().ok_or_else(|| {
            anyhow::anyhow!(
                "manifest artifact for target {} missing `sha256` field — \
                 refusing unverified download",
                self.target
            )
        })?;

        if !is_cached(&tmp_file, pinned_sha)? {
            let resolve = Stage::start("resolve asset");
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
            verify.fail(format!("expected {pinned_sha} got {actual}"));
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

/// Validate the operator-supplied target string against `SUPPORTED_TARGETS`
/// and return the matching `(platform, arch)` strings. Reports the stage
/// outcome to the terminal.
fn validate_target(target: &str) -> Result<(&'static str, &'static str)> {
    let stage = Stage::start("validate target");
    let entry = SUPPORTED_TARGETS
        .iter()
        .find(|(t, _, _)| *t == target)
        .ok_or_else(|| {
            anyhow::anyhow!(
                "unknown target `{target}` — supported: {}",
                SUPPORTED_TARGETS
                    .iter()
                    .map(|(t, _, _)| *t)
                    .collect::<Vec<_>>()
                    .join(", ")
            )
        })?;
    stage.ok_with(target);
    Ok((entry.1, entry.2))
}

/// Load and parse the pinned `DevForge` manifest. Falls back to the committed
/// path under `interfaces/desktop/src-tauri/resources/devforge/manifest.json`
/// when no override is supplied.
fn load_manifest(ws: &Workspace, override_path: Option<&Path>) -> Result<Manifest> {
    let manifest_path = override_path.map_or_else(
        || {
            ws.root()
                .join("interfaces")
                .join("desktop")
                .join("src-tauri")
                .join("resources")
                .join("devforge")
                .join("manifest.json")
        },
        std::path::Path::to_path_buf,
    );

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
    Ok(manifest)
}

/// Download the artifact into `.userdata/tmp/devforge/<file>` unless the
/// cached file already matches the pinned sha256. Returns the resolved
/// path so the caller can re-verify the SHA and extract.
fn download_or_use_cache(
    ws: &Workspace,
    manifest: &Manifest,
    artifact: &Artifact,
    pinned_sha: &str,
) -> Result<PathBuf> {
    let tmp_dir = ws.root().join(".userdata").join("tmp").join("devforge");
    fs::create_dir_all(&tmp_dir)?;
    let tmp_file = tmp_dir.join(&artifact.file_name);

    if is_cached(&tmp_file, pinned_sha)? {
        let dl = Stage::start("download");
        dl.ok_with("cached in .userdata/tmp/devforge");
        return Ok(tmp_file);
    }

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

    Ok(tmp_file)
}

// ─── Manifest schema ──────────────────────────────────────────────────

#[derive(Debug, Deserialize, Serialize)]
struct Manifest {
    schema: u32,
    product: String,
    version: String,
    tag: String,
    repository: String,
    #[serde(default, rename = "releaseUrl", skip_serializing_if = "Option::is_none")]
    release_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    comment: Option<String>,
    artifacts: Vec<Artifact>,
}

#[derive(Debug, Deserialize, Serialize)]
struct Artifact {
    /// Browser-facing GitHub release asset URL. Kept for schema parity
    /// with the upstream devforge manifest and human-readable provenance;
    /// the fetch path itself resolves the API asset URL at runtime via
    /// [`resolve_asset_api_url`] because private repos refuse direct
    /// `browser_download_url` fetches even when authenticated.
    url: String,
    platform: String,
    kind: String,
    arch: String,
    #[serde(rename = "fileName")]
    file_name: String,
    /// SHA256 digest as lowercase hex. Required for fetch verification.
    /// Sourced from the upstream release's `SHA256SUMS` asset when the
    /// manifest auto-tracks; otherwise hand-pinned per release.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    sha256: Option<String>,
}

// ─── Upstream sync ────────────────────────────────────────────────────

/// Resolve the `tag_name` of the most recent release on `{owner}/{repo}`
/// via `GET /repos/.../releases/latest`. Honors `GITHUB_TOKEN`.
fn query_latest_release_tag(agent: &ureq::Agent, owner: &str, repo: &str) -> Result<String> {
    let url = format!("https://api.github.com/repos/{owner}/{repo}/releases/latest");
    let req = with_github_auth(agent.get(&url)).set("Accept", "application/vnd.github+json");
    let resp = req.call().with_context(|| format!("GET {url}"))?;
    if resp.status() != 200 {
        bail!(
            "latest-release lookup failed: HTTP {} {} for {url}",
            resp.status(),
            resp.status_text()
        );
    }
    let body = resp.into_string().context("read release JSON body")?;
    let json: serde_json::Value = serde_json::from_str(&body).context("parse release JSON")?;
    let tag = json
        .get("tag_name")
        .and_then(|t| t.as_str())
        .ok_or_else(|| anyhow::anyhow!("release JSON missing `tag_name`"))?;
    Ok(tag.to_string())
}

/// Download and parse the `SHA256SUMS` asset attached to a release.
/// Returns a map of `filename → lowercase hex digest`. The DevForge
/// release process publishes this alongside the zips.
fn fetch_sha256sums(
    agent: &ureq::Agent,
    owner: &str,
    repo: &str,
    tag: &str,
) -> Result<HashMap<String, String>> {
    let asset_api_url = resolve_asset_api_url(agent, owner, repo, tag, "SHA256SUMS")?;
    let req =
        with_github_auth(agent.get(&asset_api_url)).set("Accept", "application/octet-stream");
    let resp = req.call().context("GET SHA256SUMS asset")?;
    if resp.status() != 200 {
        bail!(
            "SHA256SUMS download failed: HTTP {} {}",
            resp.status(),
            resp.status_text()
        );
    }
    let body = resp
        .into_string()
        .context("read SHA256SUMS body as UTF-8")?;

    let mut shas = HashMap::new();
    for (i, line) in body.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        // `sha256sum` output: `<hex>  <filename>` (two spaces) or
        // `<hex> *<filename>` (binary mode). Accept either.
        let (hex, rest) = line.split_once(char::is_whitespace).ok_or_else(|| {
            anyhow::anyhow!("malformed SHA256SUMS line {} ({}): {line}", i + 1, tag)
        })?;
        let name = rest.trim_start_matches('*').trim();
        if hex.len() != 64 || !hex.chars().all(|c| c.is_ascii_hexdigit()) {
            bail!(
                "SHA256SUMS line {} ({}): expected 64-char hex, got `{hex}`",
                i + 1,
                tag
            );
        }
        shas.insert(name.to_string(), hex.to_ascii_lowercase());
    }

    if shas.is_empty() {
        bail!("SHA256SUMS for {tag} contained no entries");
    }
    Ok(shas)
}

/// Replace `{tag}` segments in an artifact filename. Upstream DevForge
/// names assets `devforge-<kind>-<platform>-<arch>-<tag>.<ext>`; the
/// only thing that varies tag-to-tag is the embedded tag string.
fn swap_tag_in_filename(file_name: &str, old_tag: &str, new_tag: &str) -> String {
    file_name.replace(old_tag, new_tag)
}

/// Rewrite an artifact's url/fileName/sha256 for a new release tag.
/// The new SHA is pulled from the SHA256SUMS map for the new tag.
fn rewrite_artifact_to_tag(
    artifact: &mut Artifact,
    owner: &str,
    repo: &str,
    old_tag: &str,
    new_tag: &str,
    shas: &HashMap<String, String>,
) -> Result<()> {
    let new_file_name = swap_tag_in_filename(&artifact.file_name, old_tag, new_tag);
    let new_sha = shas.get(&new_file_name).cloned().ok_or_else(|| {
        anyhow::anyhow!(
            "SHA256SUMS for {new_tag} has no entry for `{new_file_name}` \
             — upstream asset naming may have changed",
        )
    })?;
    artifact.url = format!(
        "https://github.com/{owner}/{repo}/releases/download/{new_tag}/{new_file_name}"
    );
    artifact.file_name = new_file_name;
    artifact.sha256 = Some(new_sha);
    Ok(())
}

/// Rewrite the whole manifest to point at a new release tag. Mutates in
/// place; caller saves the result to disk via [`save_manifest`].
fn rewrite_manifest_to_tag(
    manifest: &mut Manifest,
    owner: &str,
    repo: &str,
    new_tag: &str,
    shas: &HashMap<String, String>,
) -> Result<()> {
    let old_tag = manifest.tag.clone();
    for artifact in &mut manifest.artifacts {
        rewrite_artifact_to_tag(artifact, owner, repo, &old_tag, new_tag, shas)?;
    }
    manifest.tag = new_tag.to_string();
    manifest.version = new_tag.trim_start_matches('v').to_string();
    manifest.release_url = Some(format!(
        "https://github.com/{owner}/{repo}/releases/tag/{new_tag}"
    ));
    Ok(())
}

/// Pretty-write manifest back to disk with tab indentation (matches the
/// committed file's style — preserves diff cleanliness across runs).
fn save_manifest(path: &Path, manifest: &Manifest) -> Result<()> {
    let mut buf = Vec::with_capacity(2048);
    let formatter = serde_json::ser::PrettyFormatter::with_indent(b"\t");
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    manifest
        .serialize(&mut ser)
        .context("serialize manifest JSON")?;
    buf.push(b'\n');
    fs::write(path, &buf).with_context(|| format!("write {}", path.display()))?;
    Ok(())
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
        Ok(token) if !token.is_empty() => req.set("Authorization", &format!("Bearer {token}")),
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
    let req =
        with_github_auth(agent.get(&release_url)).set("Accept", "application/vnd.github+json");

    let resp = req.call().with_context(|| format!("GET {release_url}"))?;
    if resp.status() != 200 {
        bail!(
            "release lookup failed: HTTP {} {} for {}",
            resp.status(),
            resp.status_text(),
            release_url
        );
    }

    let body = resp.into_string().context("read release JSON body")?;
    let json: serde_json::Value = serde_json::from_str(&body).context("parse release JSON")?;
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
fn download_artifact(agent: &ureq::Agent, asset_api_url: &str, dst: &Path) -> Result<()> {
    use std::io::Write;

    let req = with_github_auth(agent.get(asset_api_url)).set("Accept", "application/octet-stream");

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
    let mut file = fs::File::create(dst).with_context(|| format!("create {}", dst.display()))?;
    let mut buf = vec![0u8; IO_BUF_SIZE];
    loop {
        let n = reader.read(&mut buf).context("read response body")?;
        if n == 0 {
            break;
        }
        file.write_all(&buf[..n])
            .with_context(|| format!("write {}", dst.display()))?;
    }
    Ok(())
}

/// Compute the SHA256 of a file as lowercase hex.
fn sha256_file(path: &Path) -> Result<String> {
    use sha2::{Digest, Sha256};
    let mut file = fs::File::open(path).with_context(|| format!("open {}", path.display()))?;
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
        fs::remove_dir_all(root).with_context(|| format!("remove {}", root.display()))?;
    }
    fs::create_dir_all(root).with_context(|| format!("create {}", root.display()))?;
    Ok(())
}

/// Extract a zip archive into `dst`. Returns `(file_count, total_bytes)`.
///
/// Uses `enclosed_name()` which rejects path traversal (`..` entries) —
/// important when extracting untrusted archives.
fn unzip(zip_path: &Path, dst: &Path) -> Result<(u64, u64)> {
    let file = fs::File::open(zip_path).with_context(|| format!("open {}", zip_path.display()))?;
    let mut archive = zip::ZipArchive::new(file).context("parse zip archive")?;

    let mut files = 0u64;
    let mut bytes = 0u64;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let rel = entry
            .enclosed_name()
            .ok_or_else(|| anyhow::anyhow!("unsafe zip entry: {}", entry.name()))?
            .clone();
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
