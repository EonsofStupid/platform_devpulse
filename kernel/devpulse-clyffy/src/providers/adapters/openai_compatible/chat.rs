//! Restored orchestrator text generation, now shared with the desktop runtime.
//! Provenance and deliberate corrections: docs/restoration/endpoint-execution.md.
use super::{
    http,
    sse::Decoder,
    types::{EndpointChatRequest, EndpointChatResult, EndpointUsage},
};
use anyhow::{Context, Result, ensure};
use serde::Deserialize;
use std::time::Instant;

fn body(request: &EndpointChatRequest, streaming: bool) -> Result<serde_json::Value> {
    ensure!(!request.messages.is_empty(), "Provide at least one message");
    ensure!(
        request
            .messages
            .iter()
            .all(|m| !m.content.trim().is_empty()),
        "Messages cannot be empty"
    );
    ensure!(
        request.model.as_ref().is_none_or(|m| !m.trim().is_empty()),
        "Model cannot be empty"
    );
    ensure!(
        request.max_tokens.is_none_or(|n| n > 0),
        "Output limit must be positive"
    );
    ensure!(
        request.max_completion_tokens.is_none_or(|n| n > 0),
        "Output limit must be positive"
    );
    ensure!(
        request.max_tokens.is_none() || request.max_completion_tokens.is_none(),
        "Use one output-limit dialect"
    );
    ensure!(
        request
            .temperature
            .is_none_or(|n| n.is_finite() && (0.0..=2.0).contains(&n)),
        "Temperature must be between 0 and 2"
    );
    ensure!(
        request
            .top_p
            .is_none_or(|n| n.is_finite() && (0.0..=1.0).contains(&n)),
        "Top-p must be between 0 and 1"
    );
    ensure!(
        request.stop.len() <= 4 && request.stop.iter().all(|s| !s.is_empty()),
        "Use at most four nonempty stop sequences"
    );
    let mut body = serde_json::to_value(request)?;
    body["stream"] = streaming.into();
    Ok(body)
}

pub(super) fn finish_reason(reason: &str) -> Result<()> {
    ensure!(
        matches!(reason, "stop" | "length"),
        "Endpoint did not complete a text answer"
    );
    Ok(())
}

/// Generate one text answer at the configured endpoint.
/// # Errors
/// Invalid configuration, transport errors, refusal and malformed responses fail.
pub async fn complete(
    endpoint: &str,
    key: Option<&str>,
    request: &EndpointChatRequest,
) -> Result<EndpointChatResult> {
    let body = body(request, false)?;
    let started = Instant::now();
    let response = http::json(http::post(endpoint, key, "chat/completions", &body).await?).await?;
    let response: Completion = serde_json::from_value(response)
        .map_err(|_| anyhow::anyhow!("Invalid text completion response"))?;
    let choice = response
        .choices
        .into_iter()
        .find(|c| c.index == 0)
        .context("Endpoint returned no text choice")?;
    finish_reason(&choice.finish_reason)?;
    ensure!(
        choice.message.refusal.is_none(),
        "Endpoint refused this text request"
    );
    let text = choice
        .message
        .content
        .context("Endpoint returned no text")?;
    ensure!(!text.trim().is_empty(), "Endpoint returned an empty answer");
    Ok(EndpointChatResult {
        text,
        model: response.model,
        usage: response.usage,
        finish_reason: choice.finish_reason,
        elapsed_ms: elapsed(started),
    })
}

/// Stream complete UTF-8 deltas, finishing only on a valid terminal SSE event.
/// Dropping the future or refusing a callback drops the HTTP response immediately.
/// # Errors
/// Includes malformed frames, truncated responses, deadlines and callback errors.
pub async fn stream(
    endpoint: &str,
    key: Option<&str>,
    request: &EndpointChatRequest,
    mut on_delta: impl FnMut(&str) -> Result<()>,
) -> Result<EndpointChatResult> {
    let body = body(request, true)?;
    let started = Instant::now();
    let mut response = http::post(endpoint, key, "chat/completions", &body).await?;
    ensure!(
        response
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .is_some_and(|v| v
                .split(';')
                .next()
                .is_some_and(|t| t.trim().eq_ignore_ascii_case("text/event-stream"))),
        "Endpoint did not return an event stream"
    );
    let mut decoder = Decoder::default();
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|e| http::network_error(&e))?
    {
        if decoder.push(&chunk, &mut on_delta)? {
            break;
        }
    }
    decoder.finish(elapsed(started))
}

fn elapsed(started: Instant) -> u64 {
    u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX)
}

#[derive(Deserialize)]
struct Completion {
    choices: Vec<Choice>,
    model: Option<String>,
    usage: Option<EndpointUsage>,
}
#[derive(Deserialize)]
struct Choice {
    index: usize,
    message: Message,
    finish_reason: String,
}
#[derive(Deserialize)]
struct Message {
    content: Option<String>,
    refusal: Option<String>,
}

/// Request a single embedding through the same bounded endpoint transport.
/// # Errors
/// Rejects unsuccessful HTTP responses, absent or malformed vectors, and extra rows.
pub async fn embed(
    endpoint: &str,
    key: Option<&str>,
    model: &str,
    input: &str,
) -> Result<Vec<f32>> {
    ensure!(
        !model.trim().is_empty() && !input.trim().is_empty(),
        "Embedding model and input are required"
    );
    let body = serde_json::json!({"model": model, "input": input, "encoding_format": "float"});
    let response = http::json(http::post(endpoint, key, "embeddings", &body).await?).await?;
    let response: Embeddings = serde_json::from_value(response)
        .map_err(|_| anyhow::anyhow!("Invalid embedding response"))?;
    ensure!(
        response.data.len() == 1,
        "Endpoint did not return exactly one embedding"
    );
    let row = response
        .data
        .into_iter()
        .next()
        .context("Endpoint returned no embedding")?;
    ensure!(
        row.index == 0 && !row.embedding.is_empty() && row.embedding.iter().all(|v| v.is_finite()),
        "Endpoint returned an invalid embedding"
    );
    Ok(row.embedding)
}
#[derive(Deserialize)]
struct Embeddings {
    data: Vec<Embedding>,
}
#[derive(Deserialize)]
struct Embedding {
    index: usize,
    embedding: Vec<f32>,
}
