//! `cargo xtask fetch-llama-cpp` — download, verify, and extract a pinned
//! `llama-cpp-prebuilt` release artifact into the per-target dep dir.
//!
//! # Flow
//!
//! 1. Read the committed pinned manifest at
//!    `deps/llama-cpp-prebuilt/manifest.json`.
//! 2. Resolve the artifact matching `--target <win32-x64-vulkan|...|cpu>`.
//! 3. Cache-skip if the `.llama-cpp-prebuilt-version` marker in the target
//!    subdir already matches the pinned version.
//! 4. Download the artifact from
//!    `github.com/EonsofStupid/llama-cpp-prebuilt/releases/download/<tag>/<file>`.
//!    Uses `GITHUB_TOKEN` from env (required — the source repo is private).
//! 5. Verify SHA256 against the `sha256` field pinned in the manifest.
//! 6. Clear the target subdir and extract the zip into it.
//! 7. Confirm `lib/llama.lib` + `llama.cpp/include/llama.h` exist as the
//!    layout-validity markers.
//! 8. Write `.llama-cpp-prebuilt-version` for future cache hits.
//!
//! # Pairing with xtask `apply_env`
//!
//! Once this command has populated `deps/llama-cpp-prebuilt/<target>/`,
//! `BuildConfig::apply_env` in `workspace.rs` detects the directory and
//! exports `LLAMA_CPP_PREBUILT_LIB_DIR` automatically. The vendored
//! `llama-cpp-sys-2`'s `build.rs` fast-path then skips its in-tree cmake
//! build and links the prebuilt static libs directly. End result: a
//! standalone DevPulse `.exe` with llama.cpp inference compiled in, no
//! 11-minute cmake step per cold build, no Windows MAX_PATH pain.
//!
//! # When to re-run
//!
//! - After bumping `deps/llama-cpp-prebuilt/manifest.json` to a new release.
//! - When the cache marker is missing (fresh checkout, blown `target/`).
//! - When the target subdir's contents are tampered with (cache won't
//!   detect tampering — re-running re-downloads and re-verifies sha256).

use crate::commands::Task;
use crate::stage::{self, Stage};
use crate::workspace::Workspace;
use anyhow::{bail, Context, Result};
use serde::Deserialize;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

/// Targets we know how to fetch. Must stay in sync with the matrix in
/// `github.com/EonsofStupid/llama-cpp-prebuilt/.github/workflows/release.yml`.
const SUPPORTED_TARGETS: &[&str] = &["win32-x64-vulkan", "win32-x64-cuda", "win32-x64-cpu"];

/// Minimum download buffer for streaming HTTP responses.
const IO_BUF_SIZE: usize = 64 * 1024;

/// Fetch a pinned llama-cpp-prebuilt artifact into the per-target dep dir.
pub struct FetchLlamaCpp {
    pub target: String,
    pub manifest: Option<PathBuf>,
}

impl Task for FetchLlamaCpp {
    fn name(&self) -> &'static str {
        "fetch-llama-cpp"
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        stage::section("Fetch llama-cpp-prebuilt static libs");

        // ── Validate target ────────────────────────────────────────
        let validate = Stage::start("validate target");
        if !SUPPORTED_TARGETS.contains(&self.target.as_str()) {
            validate.fail(format!("unknown target `{}`", self.target));
            bail!(
                "unknown target `{}` — supported: {}",
                self.target,
                SUPPORTED_TARGETS.join(", ")
            );
        }
        validate.ok_with(&self.target);

        // ── Load manifest ──────────────────────────────────────────
        let manifest_path = self.manifest.clone().unwrap_or_else(|| {
            ws.root()
                .join("deps")
                .join("llama-cpp-prebuilt")
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
        let select = Stage::start("select artifact");
        let artifact = manifest
            .artifacts
            .iter()
            .find(|a| a.target == self.target)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "no artifact for target `{}` in {} — available: {}",
                    self.target,
                    manifest_path.display(),
                    manifest
                        .artifacts
                        .iter()
                        .map(|a| a.target.as_str())
                        .collect::<Vec<_>>()
                        .join(", ")
                )
            })?;
        select.ok_with(&artifact.file_name);

        // ── Destination ────────────────────────────────────────────
        let dst_root = ws
            .root()
            .join("deps")
            .join("llama-cpp-prebuilt")
            .join(&self.target);

        // ── Cache check ────────────────────────────────────────────
        let marker = dst_root.join(".llama-cpp-prebuilt-version");
        if let Ok(existing) = fs::read_to_string(&marker) {
            if existing.trim() == manifest.version {
                let cache = Stage::start("cache check");
                cache.ok_with("target already pinned — skipping fetch");
                println!(
                    "  llama-cpp-prebuilt {} ready at {}",
                    manifest.version,
                    dst_root.display()
                );
                return Ok(());
            }
        }

        // ── Download (with local cache in .userdata/tmp) ───────────
        let tmp_dir = ws
            .root()
            .join(".userdata")
            .join("tmp")
            .join("llama-cpp-prebuilt");
        fs::create_dir_all(&tmp_dir)?;
        let tmp_file = tmp_dir.join(&artifact.file_name);

        if !is_cached(&tmp_file, &artifact.sha256)? {
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
            dl.ok_with("cached in .userdata/tmp/llama-cpp-prebuilt");
        }

        // ── SHA256 verify ──────────────────────────────────────────
        let verify = Stage::start("verify sha256");
        let actual = sha256_file(&tmp_file)?;
        if !actual.eq_ignore_ascii_case(&artifact.sha256) {
            verify.fail(format!("expected {} got {}", artifact.sha256, actual));
            bail!("sha256 mismatch for {}", artifact.file_name);
        }
        verify.ok_with(&actual[..16]);

        // ── Extract ────────────────────────────────────────────────
        let extract = Stage::start("extract");
        clear_tree(&dst_root)?;
        let (files, bytes) = unzip(&tmp_file, &dst_root)?;
        extract.ok_with(format!("{files} files ({} MB)", bytes / (1024 * 1024)));

        // ── Validity check ─────────────────────────────────────────
        let lib_entry = dst_root.join("lib").join("llama.lib");
        let header_entry = dst_root.join("llama.cpp").join("include").join("llama.h");
        if !lib_entry.is_file() {
            bail!(
                "extracted tree missing {} — prebuilt zip layout mismatch",
                lib_entry.display()
            );
        }
        if !header_entry.is_file() {
            bail!(
                "extracted tree missing {} — prebuilt zip must mirror llama.cpp/ source-tree layout",
                header_entry.display()
            );
        }

        // ── Write version marker ───────────────────────────────────
        fs::write(&marker, &manifest.version)
            .with_context(|| format!("write {}", marker.display()))?;

        println!(
            "\n  llama-cpp-prebuilt {} ready for target `{}`\n  Location: {}",
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
    repository: String,
    #[allow(dead_code)]
    #[serde(default, rename = "releaseUrl")]
    release_url: Option<String>,
    artifacts: Vec<Artifact>,
}

#[derive(Debug, Deserialize)]
struct Artifact {
    /// Full target id like `win32-x64-vulkan`. This is the primary key
    /// the fetch command resolves against (`--target` matches here).
    target: String,
    #[allow(dead_code)]
    platform: String,
    #[allow(dead_code)]
    arch: String,
    #[allow(dead_code)]
    backend: String,
    #[serde(rename = "fileName")]
    file_name: String,
    /// SHA256 digest as lowercase hex. Required.
    sha256: String,
    #[allow(dead_code)]
    url: String,
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
fn build_http_agent() -> Result<ureq::Agent> {
    let tls_connector = native_tls::TlsConnector::new()
        .context("failed to build native-tls connector (Schannel)")?;
    Ok(ureq::AgentBuilder::new()
        .tls_connector(std::sync::Arc::new(tls_connector))
        .redirects(10)
        .user_agent("devpulse-xtask fetch-llama-cpp/1.0")
        .build())
}

/// Apply `Authorization: Bearer $GITHUB_TOKEN` to a request when the env
/// var is set. The source repo is private, so this is effectively required.
fn with_github_auth(req: ureq::Request) -> ureq::Request {
    match std::env::var("GITHUB_TOKEN") {
        Ok(token) if !token.is_empty() => req.set("Authorization", &format!("Bearer {token}")),
        _ => req,
    }
}

/// Parse `https://github.com/{owner}/{repo}` into `(owner, repo)`.
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

/// Resolve a release asset's API download URL via
/// `GET /releases/tags/{tag}`.
///
/// Private repos refuse `browser_download_url` even with auth — the only
/// reliable path is the asset API URL with
/// `Accept: application/octet-stream`.
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

/// Download a release asset via the GitHub API asset URL.
fn download_artifact(agent: &ureq::Agent, asset_api_url: &str, dst: &Path) -> Result<()> {
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
        use std::io::Write;
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
