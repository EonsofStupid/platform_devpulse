//! Direct Anthropic Messages API call using the stored API key.
//!
//! Sibling to [`super::register`] (which manages Claude Code subprocess
//! MCP registration). `ping` is the **other** Claude path the wizard
//! offers: bring your own API key, talk to Claude directly from inside
//! DevPulse without spawning Claude Code as a parent client.
//!
//! Key storage: re-uses [`crate::commands::credentials`] — namespace
//! `devpulse`, provider id `anthropic-api`. The wizard's Clyffy Collab
//! step calls `store_api_key(ProviderId::AnthropicApi, key)`, this
//! command reads it back via the same keyring entry.
//!
//! Why a separate command (vs. a generic `chat_with_provider`): the
//! AnthropicApi has a distinct request shape (`messages` field,
//! `anthropic-version` header, `x-api-key` auth) and we want the
//! cortex reasoning router to call this directly without going through
//! a routing-config indirection. Future: when more providers ship,
//! refactor to a `chat_with_provider` dispatcher.

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::commands::_util::CommandError;

/// Service name in the OS keychain — must match
/// [`crate::commands::credentials::SERVICE_NAME`].
const SERVICE_NAME: &str = "devpulse";

/// Keyring key for the Anthropic API entry — must match what
/// [`crate::commands::credentials::store_api_key`] writes when called
/// with `ProviderId::AnthropicApi`.
///
/// (The credentials module exposes a private `keyring_key_for(provider)`
/// helper; we hard-code the format here because the SSOT is the
/// `ProviderId` enum's wire string, which for `AnthropicApi` is
/// `"anthropic-api"`. If the wire string ever changes, the credentials
/// module's `store_api_key` will write to the new key and this constant
/// must move with it.)
const KEYRING_KEY: &str = "api_key_anthropic-api";

/// Anthropic Messages API endpoint. v1 stable.
const ANTHROPIC_URL: &str = "https://api.anthropic.com/v1/messages";

/// API version header value. Anthropic gates breaking schema changes
/// behind this header; bumping it requires updating the request /
/// response shapes below to match.
const ANTHROPIC_VERSION: &str = "2023-06-01";

/// Default model when the caller doesn't specify one. Sonnet is the
/// balanced default — capable enough for the cortex reasoning
/// escalation slot, cheap enough that a chat-turn call doesn't
/// surprise-bill the customer.
const DEFAULT_MODEL: &str = "claude-sonnet-4-5";

/// Default max tokens — bounded so a runaway response can't blow the
/// chat's render buffer. Callers needing more set `max_tokens`
/// explicitly.
const DEFAULT_MAX_TOKENS: u32 = 1024;

/// What the wizard / chat command sends.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PingClaudeRequest {
    /// The user-side prompt. Plain text — system prompt lives on the
    /// engine side once the reasoning router is wired.
    pub prompt: String,
    /// Optional model override. Defaults to [`DEFAULT_MODEL`] when
    /// `None`.
    pub model: Option<String>,
    /// Optional max-token cap. Defaults to [`DEFAULT_MAX_TOKENS`].
    pub max_tokens: Option<u32>,
}

/// What `ping_claude` returns to the frontend.
///
/// The shape mirrors the parts of the Anthropic Messages API response
/// the cortex actually needs (text + usage), not the full envelope.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PingClaudeResponse {
    /// Plain-text assistant reply assembled from the response's
    /// `content[].text` segments.
    pub text: String,
    /// Tokens billed in this turn.
    pub usage: PingClaudeUsage,
    /// Model id Anthropic actually answered with (may differ from the
    /// request when a model was aliased or rolled over).
    pub model: String,
}

/// Token usage reported by the Anthropic API for this turn.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct PingClaudeUsage {
    /// Tokens consumed by the request prompt (system + messages).
    pub input_tokens: u32,
    /// Tokens generated in the response content blocks.
    pub output_tokens: u32,
}

// ── Internal Anthropic API shapes ────────────────────────────────

#[derive(Debug, Serialize)]
struct AnthropicRequestBody {
    model: String,
    max_tokens: u32,
    messages: Vec<AnthropicMessage>,
}

#[derive(Debug, Serialize)]
struct AnthropicMessage {
    role: &'static str,
    content: String,
}

#[derive(Debug, Deserialize)]
struct AnthropicResponseEnvelope {
    model: String,
    content: Vec<AnthropicContentBlock>,
    usage: AnthropicUsage,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum AnthropicContentBlock {
    Text {
        text: String,
    },
    /// Other block types (tool_use, etc.) are ignored for the chat
    /// surface — assistant text-only is what the cortex consumes.
    #[serde(other)]
    Other,
}

#[derive(Debug, Deserialize, Default)]
struct AnthropicUsage {
    input_tokens: u32,
    output_tokens: u32,
}

/// Send a prompt to Anthropic and return the assistant's reply.
///
/// Reads the API key from the OS keychain (entry `devpulse :: api_key_anthropic-api`).
/// If no key is stored, returns `CommandError` with a layman hint to
/// run the wizard's Clyffy Collab step.
///
/// Synchronous (non-streaming) for the first cut. A streaming variant
/// (`ping_claude_stream`) returning through Tauri events can land in a
/// follow-up if the cortex reasoning surface needs incremental tokens.
///
/// # Errors
///
/// - No API key stored.
/// - Network failure / Anthropic returned an error status (forwarded
///   with the response body so the UI can surface 401 / 429 / 5xx
///   specifically).
/// - Response body did not match the expected envelope shape.
#[tauri::command]
#[specta::specta]
pub async fn ping_claude(request: PingClaudeRequest) -> Result<PingClaudeResponse, CommandError> {
    let entry = keyring::Entry::new(SERVICE_NAME, KEYRING_KEY)
        .map_err(|e| CommandError::internal(format!("Keyring entry construction failed: {e}")))?;
    let key = entry.get_password().map_err(|e| {
        CommandError::not_found(format!(
            "Anthropic API key not stored: {e} \u{2014} run the wizard's Clyffy Collab step \
             to set it"
        ))
    })?;

    let body = AnthropicRequestBody {
        model: request.model.unwrap_or_else(|| DEFAULT_MODEL.to_string()),
        max_tokens: request.max_tokens.unwrap_or(DEFAULT_MAX_TOKENS),
        messages: vec![AnthropicMessage {
            role: "user",
            content: request.prompt,
        }],
    };

    let client = reqwest::Client::new();
    let res = client
        .post(ANTHROPIC_URL)
        .header("x-api-key", &key)
        .header("anthropic-version", ANTHROPIC_VERSION)
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| CommandError::internal(format!("Anthropic request failed: {e}")))?;

    let status = res.status();
    if !status.is_success() {
        let body = res
            .text()
            .await
            .unwrap_or_else(|_| "(no response body)".to_string());
        return Err(CommandError::internal(format!(
            "Anthropic API returned {status}: {body}"
        )));
    }

    let envelope: AnthropicResponseEnvelope = res
        .json()
        .await
        .map_err(|e| CommandError::internal(format!("Anthropic response parse failed: {e}")))?;

    let text = envelope
        .content
        .iter()
        .filter_map(|b| match b {
            AnthropicContentBlock::Text { text } => Some(text.as_str()),
            AnthropicContentBlock::Other => None,
        })
        .collect::<Vec<_>>()
        .join("");

    Ok(PingClaudeResponse {
        text,
        usage: PingClaudeUsage {
            input_tokens: envelope.usage.input_tokens,
            output_tokens: envelope.usage.output_tokens,
        },
        model: envelope.model,
    })
}

/// Check whether an Anthropic API key is currently in the OS
/// keychain. Cheap predicate the wizard + devtool poll without
/// reading the actual key.
///
/// # Errors
/// Keyring read failures other than NoEntry are surfaced verbatim.
#[tauri::command]
#[specta::specta]
pub fn anthropic_key_present() -> Result<bool, CommandError> {
    let entry = keyring::Entry::new(SERVICE_NAME, KEYRING_KEY)
        .map_err(|e| CommandError::internal(format!("Keyring entry construction failed: {e}")))?;
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(CommandError::internal(format!("Keyring read failed: {e}"))),
    }
}
