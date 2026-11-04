//! Bounded authenticated requests to explicit API bases; no redirects or defaults.
use anyhow::{Result, ensure};
use reqwest::{Client, RequestBuilder, Response, header::HeaderValue};
use std::{sync::OnceLock, time::Duration};

pub(super) const BODY_LIMIT: usize = 4 * 1024 * 1024;
/// Largest audio accepted or uploaded: over an hour of 16-bit 16 kHz stereo.
pub(super) const AUDIO_LIMIT: usize = 256 * 1024 * 1024;
/// Speaking or transcribing a long clip outlasts a text answer's deadline.
const AUDIO_TIMEOUT: Duration = Duration::from_secs(600);

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

fn request(endpoint: &str, key: Option<&str>, path: &str) -> Result<RequestBuilder> {
    let base = super::super::models::normalize_endpoint(endpoint)?;
    let mut request = client()?.post(format!("{base}/{path}"));
    if let Some(key) = key {
        ensure!(!key.trim().is_empty(), "The saved credential is empty");
        let mut header = HeaderValue::from_str(&format!("Bearer {key}"))
            .map_err(|_| anyhow::anyhow!("The saved credential is not a valid HTTP header"))?;
        header.set_sensitive(true);
        request = request.header(reqwest::header::AUTHORIZATION, header);
    }
    Ok(request)
}

async fn send(request: RequestBuilder) -> Result<Response> {
    let response = request.send().await.map_err(|e| network_error(&e))?;
    ensure!(
        response.status().is_success(),
        "Endpoint returned HTTP {}",
        response.status()
    );
    Ok(response)
}

pub(super) async fn post(
    endpoint: &str,
    key: Option<&str>,
    path: &str,
    body: &serde_json::Value,
) -> Result<Response> {
    send(request(endpoint, key, path)?.json(body)).await
}

/// A JSON request whose answer is audio.
pub(super) async fn post_for_audio(
    endpoint: &str,
    key: Option<&str>,
    path: &str,
    body: &serde_json::Value,
) -> Result<Response> {
    send(
        request(endpoint, key, path)?
            .timeout(AUDIO_TIMEOUT)
            .json(body),
    )
    .await
}

/// A multipart form carrying audio.
pub(super) async fn post_audio_form(
    endpoint: &str,
    key: Option<&str>,
    path: &str,
    boundary: &str,
    body: Vec<u8>,
) -> Result<Response> {
    send(
        request(endpoint, key, path)?
            .timeout(AUDIO_TIMEOUT)
            .header(
                reqwest::header::CONTENT_TYPE,
                format!("multipart/form-data; boundary={boundary}"),
            )
            .body(body),
    )
    .await
}

/// The whole response body, refusing anything over `limit`.
pub(super) async fn bytes(mut response: Response, limit: usize) -> Result<Vec<u8>> {
    let mut body = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|e| network_error(&e))? {
        ensure!(
            body.len() + chunk.len() <= limit,
            "Endpoint response exceeded its size limit"
        );
        body.extend_from_slice(&chunk);
    }
    Ok(body)
}

pub(super) async fn json(response: Response) -> Result<serde_json::Value> {
    let body = bytes(response, BODY_LIMIT).await?;
    serde_json::from_slice(&body).map_err(|_| anyhow::anyhow!("Endpoint returned invalid JSON"))
}
