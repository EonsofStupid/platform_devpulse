//! llama.cpp sidecar management — spawn, health check, proxy, kill.
//!
//! Manages the llama-server process for GGUF inference. The server
//! exposes an OpenAI-compatible API on localhost. Tauri commands proxy
//! requests from the frontend through the Rust backend.
//!
//! Lifecycle:
//!   1. `start_llama_server(model_path, port, gpu_layers, ctx_size)`
//!   2. Health poll until `GET /health` returns `{"status":"ok"}`
//!   3. Inference via `POST /v1/chat/completions` (streaming SSE)
//!   4. `stop_llama_server()` on app exit or model unload
//!
//! Logging at every step — every spawn, health check, request, error.

use tauri::{Emitter, Manager};
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::ShellExt;
use tokio::sync::Mutex;

/// State managed by Tauri — holds the active llama-server child process.
pub struct LlamaServerState {
    child: Mutex<Option<CommandChild>>,
    port: Mutex<u16>,
}

impl LlamaServerState {
    #[must_use]
    pub fn new() -> Self {
        Self {
            child: Mutex::new(None),
            port: Mutex::new(0),
        }
    }
}

/// Start the llama-server sidecar with a GGUF model.
///
/// Spawns the process, polls `/health` until ready, then returns.
/// If a server is already running, kills it first.
#[tauri::command]
#[specta::specta]
pub async fn start_llama_server(
    app: tauri::AppHandle,
    state: tauri::State<'_, LlamaServerState>,
    model_path: String,
    port: Option<u16>,
    gpu_layers: Option<i32>,
    ctx_size: Option<u32>,
) -> Result<LlamaServerInfo, String> {
    let port = port.unwrap_or(8899);
    let gpu_layers = gpu_layers.unwrap_or(999); // default: all layers on GPU
    let ctx_size = ctx_size.unwrap_or(8192);

    tracing::info!(
        model = %model_path,
        port,
        gpu_layers,
        ctx_size,
        "Starting llama-server sidecar"
    );

    // Kill existing if running
    {
        let mut child_lock = state.child.lock().await;
        if let Some(child) = child_lock.take() {
            tracing::info!("Killing existing llama-server before restart");
            let _ = child.kill();
        }
    }

    // Spawn the sidecar
    let shell = app.shell();
    let (mut rx, child) = shell
        .sidecar("binaries/llama-server")
        .map_err(|e| format!("Failed to create sidecar command: {e}"))?
        .args([
            "-m",
            &model_path,
            "--port",
            &port.to_string(),
            "-ngl",
            &gpu_layers.to_string(),
            "-c",
            &ctx_size.to_string(),
            "--host",
            "127.0.0.1",
            "-fa",
            "on",
        ])
        .spawn()
        .map_err(|e| format!("Failed to spawn llama-server: {e}"))?;

    let pid = child.pid();
    tracing::info!(pid, port, "llama-server process spawned");

    // Store child handle
    {
        let mut child_lock = state.child.lock().await;
        *child_lock = Some(child);
        let mut port_lock = state.port.lock().await;
        *port_lock = port;
    }

    // Stream stdout/stderr to tracing
    let app_clone = app.clone();
    tokio::spawn(async move {
        use tauri_plugin_shell::process::CommandEvent;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let msg = String::from_utf8_lossy(&line);
                    tracing::debug!(target: "llama-server", "{}", msg.trim());
                }
                CommandEvent::Stderr(line) => {
                    let msg = String::from_utf8_lossy(&line);
                    tracing::warn!(target: "llama-server", "{}", msg.trim());
                }
                CommandEvent::Terminated(status) => {
                    tracing::info!(
                        target: "llama-server",
                        code = ?status.code,
                        signal = ?status.signal,
                        "llama-server terminated"
                    );
                    let _ = app_clone.emit("llama:server-stopped", serde_json::json!({
                        "code": status.code,
                    }));
                    break;
                }
                _ => {}
            }
        }
    });

    // Health check — poll until ready or timeout
    let url = format!("http://127.0.0.1:{port}/health");
    let client = reqwest::Client::new();
    let mut ready = false;

    for attempt in 1..=60 {
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        match client.get(&url).send().await {
            Ok(resp) => {
                if let Ok(body) = resp.text().await {
                    if body.contains("\"ok\"") {
                        tracing::info!(attempt, "llama-server health check passed");
                        ready = true;
                        break;
                    }
                    tracing::debug!(attempt, body = %body, "llama-server not ready yet");
                }
            }
            Err(_) => {
                if attempt % 10 == 0 {
                    tracing::debug!(attempt, "llama-server not responding yet");
                }
            }
        }
    }

    if !ready {
        tracing::error!("llama-server health check timed out after 30s");
        // Kill the stuck process
        let mut child_lock = state.child.lock().await;
        if let Some(child) = child_lock.take() {
            let _ = child.kill();
        }
        return Err("llama-server failed to start within 30 seconds".into());
    }

    let _ = app.emit("llama:server-ready", serde_json::json!({
        "port": port,
        "model": model_path,
    }));

    Ok(LlamaServerInfo {
        port,
        pid: pid as u64,
        model_path,
    })
}

/// Stop the llama-server sidecar.
#[tauri::command]
#[specta::specta]
pub async fn stop_llama_server(
    state: tauri::State<'_, LlamaServerState>,
) -> Result<(), String> {
    let mut child_lock = state.child.lock().await;
    if let Some(child) = child_lock.take() {
        tracing::info!("Stopping llama-server");
        child.kill().map_err(|e| format!("Failed to kill llama-server: {e}"))?;
    } else {
        tracing::debug!("stop_llama_server called but no server running");
    }
    Ok(())
}

/// Check if the llama-server is running and healthy.
#[tauri::command]
#[specta::specta]
pub async fn llama_server_health(
    state: tauri::State<'_, LlamaServerState>,
) -> Result<LlamaHealthStatus, String> {
    let port = *state.port.lock().await;
    if port == 0 {
        return Ok(LlamaHealthStatus {
            running: false,
            status: "not_started".into(),
            port: 0,
        });
    }

    let url = format!("http://127.0.0.1:{port}/health");
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(2))
        .build()
        .map_err(|e| e.to_string())?;

    match client.get(&url).send().await {
        Ok(resp) => {
            let body = resp.text().await.unwrap_or_default();
            let status = if body.contains("\"ok\"") {
                "ok"
            } else if body.contains("loading") {
                "loading"
            } else {
                "unknown"
            };
            Ok(LlamaHealthStatus {
                running: true,
                status: status.into(),
                port,
            })
        }
        Err(_) => Ok(LlamaHealthStatus {
            running: false,
            status: "unreachable".into(),
            port,
        }),
    }
}

/// Send a chat completion request to the running llama-server.
///
/// Streams tokens back via Tauri events (`llama:token`).
#[tauri::command]
#[specta::specta]
pub async fn llama_chat(
    app: tauri::AppHandle,
    state: tauri::State<'_, LlamaServerState>,
    messages: Vec<ChatMessage>,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
) -> Result<String, String> {
    let port = *state.port.lock().await;
    if port == 0 {
        return Err("llama-server not running".into());
    }

    let url = format!("http://127.0.0.1:{port}/v1/chat/completions");
    let max_tokens = max_tokens.unwrap_or(512);
    let temperature = temperature.unwrap_or(0.7);

    tracing::info!(
        messages = messages.len(),
        max_tokens,
        temperature,
        "llama_chat: sending request"
    );

    let body = serde_json::json!({
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": true,
    });

    let client = reqwest::Client::new();
    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("llama-server request failed: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("llama-server returned {status}: {body}"));
    }

    // Stream SSE response
    let mut full_response = String::new();
    let mut stream = resp.bytes_stream();

    use futures::StreamExt;
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {e}"))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        // Process complete SSE lines
        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end + 1..].to_string();

            if line.is_empty() || line == "data: [DONE]" {
                continue;
            }

            if let Some(json_str) = line.strip_prefix("data: ") {
                if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(json_str) {
                    if let Some(content) = parsed
                        .get("choices")
                        .and_then(|c| c.get(0))
                        .and_then(|c| c.get("delta"))
                        .and_then(|d| d.get("content"))
                        .and_then(|c| c.as_str())
                    {
                        full_response.push_str(content);
                        let _ = app.emit("llama:token", serde_json::json!({
                            "content": content,
                        }));
                    }
                }
            }
        }
    }

    tracing::info!(
        response_len = full_response.len(),
        "llama_chat: complete"
    );

    Ok(full_response)
}

/// Send an embedding request to the running llama-server.
#[tauri::command]
#[specta::specta]
pub async fn llama_embed(
    state: tauri::State<'_, LlamaServerState>,
    input: String,
) -> Result<Vec<f32>, String> {
    let port = *state.port.lock().await;
    if port == 0 {
        return Err("llama-server not running".into());
    }

    let url = format!("http://127.0.0.1:{port}/v1/embeddings");
    let body = serde_json::json!({
        "input": input,
        "model": "default",
    });

    tracing::info!(input_len = input.len(), "llama_embed: request");

    let client = reqwest::Client::new();
    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Embedding request failed: {e}"))?;

    let result: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse embedding response: {e}"))?;

    let embedding = result
        .get("data")
        .and_then(|d| d.get(0))
        .and_then(|d| d.get("embedding"))
        .and_then(|e| e.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_f64().map(|f| f as f32))
                .collect::<Vec<f32>>()
        })
        .ok_or_else(|| "Invalid embedding response format".to_string())?;

    tracing::info!(dims = embedding.len(), "llama_embed: complete");

    Ok(embedding)
}

// ── Types ────────────────────────────────────────────────────

/// Info returned when llama-server starts successfully.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct LlamaServerInfo {
    /// Port the server is listening on.
    pub port: u16,
    /// OS process ID of the sidecar.
    pub pid: u64,
    /// Path to the loaded GGUF model.
    pub model_path: String,
}

/// Health status of the llama-server sidecar.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct LlamaHealthStatus {
    /// Whether the process is alive.
    pub running: bool,
    /// Server status: "ok", "loading", "unreachable", "not_started".
    pub status: String,
    /// Port the server is bound to (0 if not started).
    pub port: u16,
}

/// A single chat message (OpenAI format).
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct ChatMessage {
    /// Role: "system", "user", or "assistant".
    pub role: String,
    /// Message content.
    pub content: String,
}
