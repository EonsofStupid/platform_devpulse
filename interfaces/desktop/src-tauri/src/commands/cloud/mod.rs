//! Cloud inference provider — Anthropic API for dogfooding + turbo escalation.
//!
//! Architecture:
//!   - `InferenceProvider::Local`  → chat routes to llama-server / Candle
//!   - `InferenceProvider::Cloud`  → chat routes to Anthropic Messages API
//!
//! Regardless of provider selection, Claude API is ALWAYS available to
//! Clyffy as a turbo escalation path. The toggle only controls the
//! PRIMARY chat brain. Local models always own non-chat slots
//! (rag.embedder, voice.stt, voice.tts, vision.embedder).
//!
//! Provider preference is persisted to `{userdata}/preferences.json`
//! under the key `inference_provider`. Defaults to `"cloud"` during
//! dogfooding so the platform works without any local model setup.

use crate::commands::credentials::{get_api_key, ApiProvider};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{Emitter, State};

use crate::state::PlatformState;
use devpulse_engine::platform::SqlAdapter;

// ── Provider Enum ───────────────────────────────────────────────

/// Which backend handles the primary chat brain.
///
/// Cross-linked: StatusBar, Settings, Chat header, Devtools all
/// read and write this same persisted value.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum InferenceProvider {
    /// Local LLM via llama-server sidecar or Candle in-process.
    Local,
    /// Anthropic Claude API (subscription or API key).
    Cloud,
}

impl InferenceProvider {
    fn as_str(self) -> &'static str {
        match self {
            Self::Local => "local",
            Self::Cloud => "cloud",
        }
    }

    fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "local" => Self::Local,
            _ => Self::Cloud, // default to cloud during dogfooding
        }
    }
}

// ── Provider Config Commands ────────────────────────────────────

/// Get the current inference provider setting.
///
/// Reads from `preferences.json`. Defaults to `Cloud` if unset
/// (dogfooding mode — platform works without local models).
#[tauri::command]
#[specta::specta]
pub async fn get_inference_provider(
    state: State<'_, PlatformState>,
) -> Result<InferenceProvider, String> {
    let guard = state.platform.read().await;
    if let Some(platform) = guard.as_ref() {
        if let Some(svc) = platform.user_relational() {
            let adapter = svc.adapter();
            let rows = adapter
                .query(
                    "SELECT value FROM preferences WHERE key = 'inference_provider' LIMIT 1",
                    &[],
                )
                .await
                .unwrap_or_default();
            if let Some(val) = rows.first().and_then(|r| r.first()).and_then(|v| v.as_text()) {
                return Ok(InferenceProvider::from_str(val));
            }
        }
    }
    // Default: cloud during dogfooding
    Ok(InferenceProvider::Cloud)
}

/// Set the inference provider. Persisted to preferences table.
///
/// Emitted as `provider:changed` event so all cross-linked UI
/// components (StatusBar, Chat header, Settings) update instantly.
#[tauri::command]
#[specta::specta]
pub async fn set_inference_provider(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
    provider: InferenceProvider,
) -> Result<(), String> {
    tracing::info!(provider = provider.as_str(), "Setting inference provider");

    let guard = state.platform.read().await;
    if let Some(platform) = guard.as_ref() {
        if let Some(svc) = platform.user_relational() {
            let adapter = svc.adapter();
            let val = provider.as_str();
            adapter
                .execute(
                    "INSERT OR REPLACE INTO preferences (key, value) VALUES ('inference_provider', ?)",
                    &[val],
                )
                .await
                .map_err(|e| format!("Failed to persist inference provider: {e}"))?;
        }
    }

    let _ = app.emit(
        "provider:changed",
        serde_json::json!({ "provider": provider.as_str() }),
    );

    tracing::info!(provider = provider.as_str(), "Inference provider set");
    Ok(())
}

/// Check if Anthropic API key is configured and ready for cloud inference.
#[tauri::command]
#[specta::specta]
pub async fn cloud_ready() -> Result<bool, String> {
    // Env var first — piggybacks off Claude Code session
    if let Ok(key) = std::env::var("ANTHROPIC_API_KEY") {
        if !key.is_empty() {
            return Ok(true);
        }
    }
    // Fall back to keyring
    match get_api_key(ApiProvider::Anthropic).await {
        Ok(Some(key)) => Ok(!key.is_empty()),
        Ok(None) => Ok(false),
        Err(e) => {
            tracing::warn!(error = %e, "Failed to check Anthropic API key");
            Ok(false)
        }
    }
}

// ── Cloud Inference Types ───────────────────────────────────────

/// A chat message in Anthropic Messages API format.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CloudMessage {
    /// Role: "user" or "assistant".
    pub role: String,
    /// Message content.
    pub content: String,
}

/// Cloud inference result metadata.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CloudChatResult {
    /// Full assembled response text.
    pub content: String,
    /// Model used (e.g. "claude-sonnet-4-20250514").
    pub model: String,
    /// Input tokens consumed.
    pub input_tokens: u64,
    /// Output tokens generated.
    pub output_tokens: u64,
}

// ── Cloud Chat Command ──────────────────────────────────────────

/// Send a chat completion to Anthropic Claude API.
///
/// Streams tokens back via `cloud:token` Tauri events (same pattern
/// as `llama:token`). Returns the full response + usage metadata
/// for `store_assistant_turn`.
///
/// Used for:
/// 1. Primary chat brain when `InferenceProvider::Cloud` is active
/// 2. Clyffy turbo escalation regardless of provider setting
///
/// The `turbo` parameter bypasses the provider check — Clyffy can
/// always call this for escalation even when provider is Local.
#[tauri::command]
#[specta::specta]
pub async fn cloud_chat(
    app: tauri::AppHandle,
    messages: Vec<CloudMessage>,
    system_prompt: Option<String>,
    model: Option<String>,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
) -> Result<CloudChatResult, String> {
    // 1. Get API key — env var first (piggybacks off Claude Code session),
    //    then keyring, then fail with clear message.
    let api_key = if let Ok(key) = std::env::var("ANTHROPIC_API_KEY") {
        if !key.is_empty() {
            tracing::debug!("cloud_chat: using ANTHROPIC_API_KEY from environment");
            key
        } else {
            get_api_key(ApiProvider::Anthropic)
                .await?
                .ok_or("No Anthropic API key configured. Add it in Settings → API Keys.")?
        }
    } else {
        get_api_key(ApiProvider::Anthropic)
            .await?
            .ok_or("No Anthropic API key found. Set ANTHROPIC_API_KEY or add key in Settings.")?
    };

    let model = model.unwrap_or_else(|| "claude-sonnet-4-20250514".to_string());
    let max_tokens = max_tokens.unwrap_or(4096);
    let temperature = temperature.unwrap_or(0.7);

    tracing::info!(
        model = %model,
        messages = messages.len(),
        max_tokens,
        temperature,
        "cloud_chat: sending to Anthropic API"
    );

    // 2. Build request body
    let mut body = serde_json::json!({
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": true,
        "messages": messages.iter().map(|m| {
            serde_json::json!({
                "role": m.role,
                "content": m.content,
            })
        }).collect::<Vec<_>>(),
    });

    if let Some(sys) = &system_prompt {
        body["system"] = serde_json::json!(sys);
    }

    // 3. Send streaming request
    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Anthropic API request failed: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let err_body = resp.text().await.unwrap_or_default();
        tracing::error!(status = %status, body = %err_body, "Anthropic API error");
        return Err(format!("Anthropic API returned {status}: {err_body}"));
    }

    // 4. Stream SSE response — same pattern as llama_chat
    let mut full_response = String::new();
    let mut input_tokens: u64 = 0;
    let mut output_tokens: u64 = 0;
    let mut model_used = model.clone();

    use futures::StreamExt;
    let mut stream = resp.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {e}"))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        // Process complete SSE lines
        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end + 1..].to_string();

            if line.is_empty() || line.starts_with("event:") {
                continue;
            }

            if let Some(json_str) = line.strip_prefix("data: ") {
                if json_str == "[DONE]" {
                    continue;
                }

                if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(json_str) {
                    let event_type = parsed
                        .get("type")
                        .and_then(|t| t.as_str())
                        .unwrap_or("");

                    match event_type {
                        "content_block_delta" => {
                            if let Some(text) = parsed
                                .get("delta")
                                .and_then(|d| d.get("text"))
                                .and_then(|t| t.as_str())
                            {
                                full_response.push_str(text);
                                let _ = app.emit(
                                    "cloud:token",
                                    serde_json::json!({ "content": text }),
                                );
                            }
                        }
                        "message_start" => {
                            if let Some(msg) = parsed.get("message") {
                                if let Some(m) = msg.get("model").and_then(|m| m.as_str()) {
                                    model_used = m.to_string();
                                }
                                if let Some(usage) = msg.get("usage") {
                                    input_tokens = usage
                                        .get("input_tokens")
                                        .and_then(|t| t.as_u64())
                                        .unwrap_or(0);
                                }
                            }
                        }
                        "message_delta" => {
                            if let Some(usage) = parsed.get("usage") {
                                output_tokens = usage
                                    .get("output_tokens")
                                    .and_then(|t| t.as_u64())
                                    .unwrap_or(0);
                            }
                        }
                        _ => {}
                    }
                }
            }
        }
    }

    let _ = app.emit(
        "cloud:complete",
        serde_json::json!({
            "model": model_used,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
        }),
    );

    tracing::info!(
        model = %model_used,
        response_len = full_response.len(),
        input_tokens,
        output_tokens,
        "cloud_chat: complete"
    );

    Ok(CloudChatResult {
        content: full_response,
        model: model_used,
        input_tokens,
        output_tokens,
    })
}
