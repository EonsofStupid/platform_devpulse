//! Install on click (plan 0001 B3.10; owner 2026-10-24: "I need the user to
//! just actually click the actions to do the install keeping it their
//! decision and aligned"). The vendor's own, unmodified build, by its
//! official method, only when you click **Install** — into the `DevPulse`
//! folder (`{data_dir}/tools/agents/{id}`), so it travels with the folder
//! and changes nothing in your profile or `PATH`:
//!
//! - **npm** — the vendor's package (`npm install --prefix …`), as
//!   connectors are; the program is npm's launcher in the package's `.bin`.
//! - **release** — the vendor's release file for this machine, checked
//!   against the SHA-256 its manifest names (Claude Code's documented
//!   binary-integrity flow), kept per version (`{dir}/{version}/{file}`).
//!   An update adds the new version beside the old one, which stays; the
//!   newest is used. No Node.js needed.

use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::{bail, Context, Result};
use sha2::{Digest, Sha256};
use tokio::io::AsyncWriteExt;

use super::definition::{ProviderDefinition, ReleaseSpec};
use super::discovery::installed;
use super::npm::{self, Installed};

/// The longest a release download may take.
const DOWNLOAD_TIMEOUT: Duration = Duration::from_secs(30 * 60);

/// `DevPulse`'s own install of one provider.
#[must_use]
pub fn dir(data_dir: &Path, provider_id: &str) -> PathBuf {
    data_dir.join("tools").join("agents").join(provider_id)
}

/// The program `DevPulse` installed for it, when it is there.
#[must_use]
pub fn program(data_dir: &Path, definition: &ProviderDefinition) -> Option<PathBuf> {
    let spec = definition.install.as_ref()?;
    let dir = dir(data_dir, definition.id.key());
    if let Some(bin) = &spec.bin {
        let launcher = npm::launcher(&dir, bin);
        return launcher.is_file().then_some(launcher);
    }
    spec.release.as_ref()?;
    newest_release(&dir, &release_file_name(definition)?)
}

/// `location` is `DevPulse`'s own install of it: Update installs again
/// there instead of running the vendor's updater on a copy you manage.
#[must_use]
pub fn is_ours(data_dir: &Path, definition: &ProviderDefinition, location: &Path) -> bool {
    location.starts_with(dir(data_dir, definition.id.key()))
}

/// Where Install gets it, for the card: `npm @openai/codex`, or the
/// release's host (`downloads.claude.ai`).
#[must_use]
pub fn source(definition: &ProviderDefinition) -> Option<String> {
    let spec = definition.install.as_ref()?;
    if let Some(package) = &spec.npm {
        return Some(format!("npm {package}"));
    }
    let release = spec.release.as_ref()?;
    release
        .binary
        .strip_prefix("https://")
        .and_then(|rest| rest.split('/').next())
        .map(str::to_owned)
}

/// Install (or update) it into the `DevPulse` folder.
pub async fn install(data_dir: &Path, definition: &ProviderDefinition) -> Installed {
    let name = definition.name();
    let failed = |command: String, output: String| Installed {
        ok: false,
        guided: false,
        command,
        output,
    };
    let Some(spec) = &definition.install else {
        return failed(
            String::new(),
            format!("{name} has no install method in its definition."),
        );
    };
    let dir = dir(data_dir, definition.id.key());
    if let (Some(package), Some(bin)) = (&spec.npm, &spec.bin) {
        return npm::install(&dir, package, bin).await;
    }
    let (Some(release), Some(file)) = (&spec.release, release_file_name(definition)) else {
        return failed(
            String::new(),
            format!("{name}'s install method is incomplete."),
        );
    };
    match fetch_release(&dir, release, &file).await {
        Ok(fetched) => Installed {
            ok: true,
            guided: false,
            command: fetched.url,
            output: format!(
                "{name} {} ({} MB) matched its manifest's SHA-256 and is installed at {}.",
                fetched.version,
                fetched.bytes / 1_000_000,
                fetched.path.display()
            ),
        },
        Err(e) => failed(release.binary.clone(), format!("{e:#}")),
    }
}

/// The vendor's name for this machine in its release files.
#[must_use]
pub fn platform() -> Option<&'static str> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("windows", "x86_64") => Some("win32-x64"),
        ("windows", "aarch64") => Some("win32-arm64"),
        ("macos", "aarch64") => Some("darwin-arm64"),
        ("macos", "x86_64") => Some("darwin-x64"),
        ("linux", "x86_64") => Some("linux-x64"),
        ("linux", "aarch64") => Some("linux-arm64"),
        _ => None,
    }
}

/// The release file's name on this machine: the program's own name
/// (`claude`, `claude.exe`).
fn release_file_name(definition: &ProviderDefinition) -> Option<String> {
    let name = definition.detect.executables.first()?;
    Some(format!("{name}{}", std::env::consts::EXE_SUFFIX))
}

/// The newest version folder holding the release file.
fn newest_release(dir: &Path, file: &str) -> Option<PathBuf> {
    std::fs::read_dir(dir)
        .ok()?
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let version = entry.file_name().to_string_lossy().into_owned();
            let program = entry.path().join(file);
            (plain_version(&version) && program.is_file()).then_some((version, program))
        })
        .reduce(|best, next| {
            if installed::newer(&next.0, &best.0) {
                next
            } else {
                best
            }
        })
        .map(|(_, program)| program)
}

/// A version is digits, dots and dashes only — it names a folder.
fn plain_version(version: &str) -> bool {
    !version.is_empty()
        && version.starts_with(|c: char| c.is_ascii_digit())
        && version
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-'))
}

#[derive(Debug)]
struct Fetched {
    version: String,
    path: PathBuf,
    bytes: u64,
    url: String,
}

/// Download this machine's release file, check it against the manifest's
/// SHA-256 and size, and keep it in its version's folder. A file whose
/// sum does not match is removed and nothing is installed.
async fn fetch_release(dir: &Path, spec: &ReleaseSpec, file: &str) -> Result<Fetched> {
    let platform = platform().context("there is no release for this machine's platform")?;
    let client = reqwest::Client::builder()
        .timeout(DOWNLOAD_TIMEOUT)
        .build()
        .context("build the download client")?;

    let version = client
        .get(&spec.latest)
        .send()
        .await
        .and_then(reqwest::Response::error_for_status)
        .with_context(|| format!("ask {} for the latest version", spec.latest))?
        .text()
        .await
        .context("read the latest version")?
        .trim()
        .to_owned();
    if !plain_version(&version) {
        bail!("the latest version {version:?} is not a version number");
    }

    let manifest_url = spec.manifest.replace("{version}", &version);
    let manifest: serde_json::Value = client
        .get(&manifest_url)
        .send()
        .await
        .and_then(reqwest::Response::error_for_status)
        .with_context(|| format!("fetch the manifest {manifest_url}"))?
        .json()
        .await
        .context("read the manifest")?;
    let entry = manifest
        .get("platforms")
        .and_then(|p| p.get(platform))
        .with_context(|| format!("the manifest has no {platform} release"))?;
    let named = entry.get("binary").and_then(serde_json::Value::as_str);
    if named != Some(file) {
        bail!("the manifest names {named:?} for {platform}, not {file:?}");
    }
    let checksum = entry
        .get("checksum")
        .and_then(serde_json::Value::as_str)
        .filter(|c| c.len() == 64 && c.chars().all(|ch| ch.is_ascii_hexdigit()))
        .context("the manifest gives no SHA-256 for this machine")?
        .to_ascii_lowercase();
    let size = entry.get("size").and_then(serde_json::Value::as_u64);

    let url = spec
        .binary
        .replace("{version}", &version)
        .replace("{platform}", platform)
        .replace("{binary}", file);
    let folder = dir.join(&version);
    let target = folder.join(file);
    if target.is_file() && sha256_file(&target)? == checksum {
        let bytes = std::fs::metadata(&target).map_or(0, |m| m.len());
        return Ok(Fetched {
            version,
            path: target,
            bytes,
            url,
        });
    }
    std::fs::create_dir_all(&folder).with_context(|| format!("make {}", folder.display()))?;
    let part = folder.join(format!("{file}.part"));
    let (sum, bytes) = download(&client, &url, &part).await?;
    if sum != checksum || size.is_some_and(|s| s != bytes) {
        let _ = std::fs::remove_file(&part);
        bail!(
            "the download from {url} does not match its manifest (SHA-256 {sum}, {bytes} bytes; \
             the manifest says {checksum}, {} bytes); nothing was installed",
            size.map_or_else(|| "?".to_owned(), |s| s.to_string())
        );
    }
    std::fs::rename(&part, &target)
        .with_context(|| format!("put {} in place", target.display()))?;
    #[cfg(unix)]
    make_runnable(&target)?;
    Ok(Fetched {
        version,
        path: target,
        bytes,
        url,
    })
}

/// Stream `url` into `path`, hashing as it goes: the SHA-256 (lowercase
/// hex) and the byte count.
async fn download(client: &reqwest::Client, url: &str, path: &Path) -> Result<(String, u64)> {
    let mut answer = client
        .get(url)
        .send()
        .await
        .and_then(reqwest::Response::error_for_status)
        .with_context(|| format!("download {url}"))?;
    let mut out = tokio::fs::File::create(path)
        .await
        .with_context(|| format!("write {}", path.display()))?;
    let mut hasher = Sha256::new();
    let mut bytes = 0_u64;
    while let Some(chunk) = answer
        .chunk()
        .await
        .with_context(|| format!("download {url}"))?
    {
        hasher.update(&chunk);
        out.write_all(&chunk)
            .await
            .with_context(|| format!("write {}", path.display()))?;
        bytes += chunk.len() as u64;
    }
    out.flush()
        .await
        .with_context(|| format!("write {}", path.display()))?;
    Ok((format!("{:x}", hasher.finalize()), bytes))
}

fn sha256_file(path: &Path) -> Result<String> {
    let mut file = std::fs::File::open(path).with_context(|| format!("read {}", path.display()))?;
    let mut hasher = Sha256::new();
    std::io::copy(&mut file, &mut hasher).with_context(|| format!("read {}", path.display()))?;
    Ok(format!("{:x}", hasher.finalize()))
}

/// A downloaded program needs its run permission on Unix (Windows runs an
/// `.exe` as it is).
#[cfg(unix)]
fn make_runnable(path: &Path) -> Result<()> {
    use std::os::unix::fs::PermissionsExt;
    std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o755))
        .with_context(|| format!("make {} runnable", path.display()))
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use std::io::{Read, Write};

    fn temp(name: &str) -> PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        std::env::temp_dir().join(format!("devpulse-install-{name}-{nanos}"))
    }

    fn definition(install: &str) -> ProviderDefinition {
        ProviderDefinition::parse(&format!(
            "id = \"claude-code\"\n[detect]\nexecutables = [\"claude\"]\n{install}"
        ))
        .unwrap()
    }

    #[test]
    fn a_definition_names_exactly_one_install_method() {
        assert!(ProviderDefinition::parse(
            "id = \"codex\"\n[detect]\nexecutables = [\"codex\"]\n[install]\nnpm = \"@openai/codex\"\n"
        )
        .is_err(), "npm without bin");
        assert!(ProviderDefinition::parse(
            "id = \"codex\"\n[detect]\nexecutables = [\"codex\"]\n[install]\nnpm = \"@openai/codex\"\nbin = \"codex\"\n[install.release]\nlatest = \"https://a/latest\"\nmanifest = \"https://a/{version}/m.json\"\nbinary = \"https://a/{version}/{platform}/{binary}\"\n"
        )
        .is_err(), "both methods");
        assert!(ProviderDefinition::parse(
            "id = \"codex\"\n[detect]\nexecutables = [\"codex\"]\n[install.release]\nlatest = \"http://a/latest\"\nmanifest = \"https://a/{version}/m.json\"\nbinary = \"https://a/{version}/{platform}/{binary}\"\n"
        )
        .is_err(), "not https");
        assert!(ProviderDefinition::parse(
            "id = \"codex\"\n[detect]\nexecutables = [\"codex\"]\n[install.release]\nlatest = \"https://a/latest\"\nmanifest = \"https://a/{version}/m.json\"\nbinary = \"https://a/{version}/{binary}\"\n"
        )
        .is_err(), "binary without {{platform}}");
    }

    #[test]
    fn an_npm_install_is_found_in_the_devpulse_folder() {
        let data = temp("npm");
        let definition = definition("[install]\nnpm = \"@example/agent\"\nbin = \"agent-x\"\n");
        assert_eq!(program(&data, &definition), None);
        let launcher = npm::launcher(&dir(&data, "claude-code"), "agent-x");
        std::fs::create_dir_all(launcher.parent().unwrap()).unwrap();
        std::fs::write(&launcher, "").unwrap();
        assert_eq!(program(&data, &definition), Some(launcher.clone()));
        assert!(is_ours(&data, &definition, &launcher));
        assert!(!is_ours(&data, &definition, Path::new("/usr/bin/agent-x")));
        assert_eq!(source(&definition).as_deref(), Some("npm @example/agent"));
        let _ = std::fs::remove_dir_all(data);
    }

    #[test]
    fn the_newest_release_folder_is_used() {
        let data = temp("versions");
        let definition = definition(
            "[install.release]\nlatest = \"https://downloads.example/latest\"\nmanifest = \"https://downloads.example/{version}/manifest.json\"\nbinary = \"https://downloads.example/{version}/{platform}/{binary}\"\n",
        );
        let file = format!("claude{}", std::env::consts::EXE_SUFFIX);
        for version in ["2.1.9", "2.1.310", "2.1.40", "not-a-version"] {
            let folder = dir(&data, "claude-code").join(version);
            std::fs::create_dir_all(&folder).unwrap();
            std::fs::write(folder.join(&file), "").unwrap();
        }
        assert_eq!(
            program(&data, &definition),
            Some(dir(&data, "claude-code").join("2.1.310").join(&file))
        );
        assert_eq!(source(&definition).as_deref(), Some("downloads.example"));
        let _ = std::fs::remove_dir_all(data);
    }

    /// Serves `latest`, the manifest and the file on 127.0.0.1, then stops.
    fn release_server(
        body: &'static [u8],
        checksum: &str,
    ) -> (String, std::thread::JoinHandle<()>) {
        let listener = std::net::TcpListener::bind(("127.0.0.1", 0)).unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let platform = platform().unwrap();
        let file = format!("claude{}", std::env::consts::EXE_SUFFIX);
        let manifest = serde_json::json!({
            "version": "9.8.7",
            "platforms": { platform: { "binary": file, "checksum": checksum, "size": body.len() } }
        })
        .to_string();
        let handle = std::thread::spawn(move || {
            for stream in listener.incoming().take(3) {
                let mut stream = stream.unwrap();
                let mut request = [0_u8; 2048];
                let n = stream.read(&mut request).unwrap();
                let line = String::from_utf8_lossy(&request[..n]).to_string();
                let answer: Vec<u8> = if line.starts_with("GET /latest") {
                    b"9.8.7\n".to_vec()
                } else if line.contains("/manifest.json") {
                    manifest.clone().into_bytes()
                } else {
                    body.to_vec()
                };
                let _ = stream.write_all(
                    format!(
                        "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                        answer.len()
                    )
                    .as_bytes(),
                );
                let _ = stream.write_all(&answer);
            }
        });
        (base, handle)
    }

    fn spec(base: &str) -> ReleaseSpec {
        ReleaseSpec {
            latest: format!("{base}/latest"),
            manifest: format!("{base}/{{version}}/manifest.json"),
            binary: format!("{base}/{{version}}/{{platform}}/{{binary}}"),
        }
    }

    #[tokio::test]
    async fn a_release_is_installed_only_when_its_sum_matches() {
        const BODY: &[u8] = b"the vendor's own build";
        let file = format!("claude{}", std::env::consts::EXE_SUFFIX);

        let good = format!("{:x}", Sha256::digest(BODY));
        let (base, server) = release_server(BODY, &good);
        let data = temp("release-ok");
        let fetched = fetch_release(&dir(&data, "claude-code"), &spec(&base), &file)
            .await
            .expect("installs");
        server.join().unwrap();
        assert_eq!(fetched.version, "9.8.7");
        assert_eq!(
            fetched.path,
            dir(&data, "claude-code").join("9.8.7").join(&file)
        );
        assert_eq!(std::fs::read(&fetched.path).unwrap(), BODY);
        let _ = std::fs::remove_dir_all(&data);

        let (base, server) = release_server(BODY, &"0".repeat(64));
        let data = temp("release-bad");
        let err = fetch_release(&dir(&data, "claude-code"), &spec(&base), &file)
            .await
            .expect_err("refused");
        server.join().unwrap();
        assert!(
            format!("{err:#}").contains("does not match its manifest"),
            "{err:#}"
        );
        let folder = dir(&data, "claude-code").join("9.8.7");
        assert!(!folder.join(&file).exists(), "nothing installed");
        assert!(
            !folder.join(format!("{file}.part")).exists(),
            "the bad download is gone"
        );
        let _ = std::fs::remove_dir_all(&data);
    }
}
