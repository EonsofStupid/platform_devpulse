//! The latest published version, from where the vendor publishes it.
//!
//! npm (`https://registry.npmjs.org/<package>/latest` → `version`), GitHub
//! (`/repos/<owner>/<name>/releases/latest` → `tag_name`), or a plain-text
//! address the vendor's own installer reads. The network is optional:
//! without it the card says the latest version is unknown.

use std::time::Duration;

use serde::Deserialize;

use super::installed::first_version;
use crate::providers::definition::Latest;

const TIMEOUT: Duration = Duration::from_secs(8);

#[derive(Deserialize)]
struct NpmLatest {
    version: String,
}

#[derive(Deserialize)]
struct GithubRelease {
    tag_name: String,
}

/// One client for every lookup in a check.
///
/// # Errors
/// Returns an error if the HTTP client cannot be built.
pub fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(TIMEOUT)
        .user_agent(concat!("DevPulse/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| format!("build the HTTP client: {e}"))
}

/// The latest version.
///
/// # Errors
/// Why it could not be read: the address, then the network error, the HTTP
/// status, or what was wrong with the answer.
pub async fn latest(client: &reqwest::Client, source: &Latest) -> Result<String, String> {
    if let Some(package) = &source.npm {
        let url = format!("https://registry.npmjs.org/{package}/latest");
        let response = client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("{url}: {e}"))?;
        let status = response.status();
        if !status.is_success() {
            return Err(format!("{url}: HTTP {status}"));
        }
        let body: NpmLatest = response.json().await.map_err(|e| format!("{url}: {e}"))?;
        return Ok(body.version);
    }
    if let Some(repo) = &source.github {
        let url = format!("https://api.github.com/repos/{repo}/releases/latest");
        let response = client
            .get(&url)
            .header("Accept", "application/vnd.github+json")
            .send()
            .await
            .map_err(|e| format!("{url}: {e}"))?;
        let status = response.status();
        if !status.is_success() {
            return Err(format!("{url}: HTTP {status}"));
        }
        let body: GithubRelease = response.json().await.map_err(|e| format!("{url}: {e}"))?;
        return first_version(&body.tag_name)
            .ok_or_else(|| format!("{url}: tag {:?} has no version number", body.tag_name));
    }
    if let Some(url) = &source.text_url {
        let response = client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("{url}: {e}"))?;
        let status = response.status();
        if !status.is_success() {
            return Err(format!("{url}: HTTP {status}"));
        }
        let body = response.text().await.map_err(|e| format!("{url}: {e}"))?;
        return first_version(&body)
            .ok_or_else(|| format!("{url}: the answer has no version number"));
    }
    Err("no source for the latest version".to_owned())
}
