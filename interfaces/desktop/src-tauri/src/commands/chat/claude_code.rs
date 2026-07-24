//! Claude Code CLI chat provider — the first working AI-provider *client*.
//!
//! Spawns the operator's local `claude` CLI (Claude Code) in headless print
//! mode and returns its answer. Claude Code carries its own auth
//! (subscription or API key), so DevPulse never touches a key here. Per
//! `devpulse_engine::ai_providers` the provider registry is data-only; the
//! callable clients live outside it — this is that client for the
//! subscription path (`ProviderId::AnthropicSubscription`).
//!
//! v1 is non-streamed: `claude -p --output-format json` prints one result
//! object which we parse and return whole. Token-by-token streaming is a
//! follow-up over the existing `InferenceTokenStreamed` event family.

use tauri_plugin_shell::ShellExt;

/// Run one prompt through the local Claude Code CLI and return its answer.
///
/// The prompt is passed as a single argument (not shell-interpolated), so a
/// multi-line chat message is preserved verbatim. Requires the `claude` CLI
/// installed and authenticated on the operator's machine.
///
/// # Errors
/// Returns a formatted message when the `claude` CLI can't be launched, exits
/// non-zero, or emits output that isn't the expected JSON result object.
#[tauri::command]
#[specta::specta]
pub async fn claude_code_chat(app: tauri::AppHandle, prompt: String) -> Result<String, String> {
    let trimmed = prompt.trim();
    if trimmed.is_empty() {
        return Err("Prompt is empty.".to_string());
    }

    // `claude -p --output-format json` runs headless (print mode) and prints
    // a single JSON object whose `result` field is the assistant's answer.
    let output = app
        .shell()
        .command("claude")
        .args(["-p", trimmed, "--output-format", "json"])
        .output()
        .await
        .map_err(|e| {
            format!(
                "Could not run the `claude` CLI — is Claude Code installed and on PATH? ({e})"
            )
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "claude exited with code {:?}: {}",
            output.status.code(),
            stderr.trim()
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parsed: serde_json::Value = serde_json::from_str(stdout.trim()).map_err(|e| {
        format!("Could not parse claude output as JSON ({e}). Raw: {}", stdout.trim())
    })?;

    parsed
        .get("result")
        .and_then(serde_json::Value::as_str)
        .map(str::to_owned)
        .ok_or_else(|| format!("claude output had no `result` field. Raw: {}", stdout.trim()))
}
