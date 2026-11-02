//! Bounded authenticated requests to explicit API bases; no redirects or defaults.
use anyhow::{Result, ensure};
use reqwest::{Client, Response, header::HeaderValue};
use std::{sync::OnceLock, time::Duration};

pub(super) const BODY_LIMIT: usize = 4 * 1024 * 1024;

fn client() -> Result<&'static Client> {
    static CLIENT: OnceLock<Result<Client, String>> = OnceLock::new();
    CLIENT
        .get_or_init(|| {
            Client::builder()
                .connect_timeout(Duration::from_secs(5))
                .timeout(Duration::from_secs(120))
                .redirect(reqwest::redirect::Policy::none())
                .build()
                .map_err(|_| "Could not initialize endpoint transport".to_owned())
        })
        .as_ref()
        .map_err(|error| anyhow::anyhow!(error.clone()))
}

pub(super) fn network_error(error: &reqwest::Error) -> anyhow::Error {
    if error.is_timeout() {
        anyhow::anyhow!("Endpoint operation timed out")
    } else {
        // Never copy a server's body, credential, or reflected request into errors.
        anyhow::anyhow!("Endpoint transport failed")
    }
}

pub(super) async fn post(
    endpoint: &str,
    key: Option<&str>,
    path: &str,
    body: &serde_json::Value,
) -> Result<Response> {
    let base = super::super::models::normalize_endpoint(endpoint)?;
    let mut request = client()?.post(format!("{base}/{path}")).json(body);
    if let Some(key) = key {
        ensure!(!key.trim().is_empty(), "The saved credential is empty");
        let mut header = HeaderValue::from_str(&format!("Bearer {key}"))
            .map_err(|_| anyhow::anyhow!("The saved credential is not a valid HTTP header"))?;
        header.set_sensitive(true);
        request = request.header(reqwest::header::AUTHORIZATION, header);
    }
    let response = request.send().await.map_err(|e| network_error(&e))?;
    ensure!(
        response.status().is_success(),
        "Endpoint returned HTTP {}",
        response.status()
    );
    Ok(response)
}

pub(super) async fn json(mut response: Response) -> Result<serde_json::Value> {
    let mut body = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|e| network_error(&e))? {
        ensure!(
            body.len() + chunk.len() <= BODY_LIMIT,
            "Endpoint response exceeded its size limit"
        );
        body.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&body).map_err(|_| anyhow::anyhow!("Endpoint returned invalid JSON"))
}
