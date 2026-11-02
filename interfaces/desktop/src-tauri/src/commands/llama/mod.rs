//! llama.cpp sidecar management — spawn, health check, proxy, kill.
//!
//! Manages the llama-server process for GGUF inference. The server
//! exposes an OpenAI-compatible API on localhost. Tauri commands proxy
//! requests from the frontend through the Rust backend.
//!
//! Lifecycle:
//!   1. `start_llama_server(model_path, port, gpu_layers, ctx_size)`, or a
//!      slot load, which starts it with your saved llama-server settings
//!      ([`start_server`])
//!   2. Health poll until `GET /health` returns `{"status":"ok"}`
//!   3. Inference via `POST /v1/chat/completions` (streaming SSE)
//!   4. `stop_llama_server()` on app exit or model unload
//!
//! Logging at every step — every spawn, health check, request, error.
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri command module — every Result-returning fn is a thin wrapper over the llama-server sidecar lifecycle (spawn / kill / HTTP proxy). Error context flows through the formatted String at the IPC boundary; per-fn doc summaries describe the failure modes."
)]

use devpulse_engine::ai_providers::openai_compatible::{
    self, EndpointChatMessage, EndpointChatRequest,
};
use tauri::Emitter;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;
use tauri_specta::Event;
use tokio::sync::Mutex;

/// State managed by Tauri — holds the active llama-server child process.
pub struct LlamaServerState {
    child: Mutex<Option<CommandChild>>,
    /// Port the llama-server is listening on (0 = not started).
    pub port: Mutex<u16>,
}

impl Default for LlamaServerState {
    fn default() -> Self {
        Self::new()
    }
}

impl LlamaServerState {
    /// Create an empty sidecar state with no running server.
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
    let gpu_layers = gpu_layers.unwrap_or(999); // default: all layers on GPU
    let ctx_size = ctx_size.unwrap_or(8192);
    let flags = vec![
        "-ngl".to_owned(),
        gpu_layers.to_string(),
        "-c".to_owned(),
        ctx_size.to_string(),
    ];
    start_server(app, state, model_path, port.unwrap_or(8899), flags).await
}

/// Start the sidecar for `model_path` on `port` with llama-server `flags`
/// (context, GPU layers, KV cache, batch …). If a server is already running,
/// it is stopped first; returns once `/health` answers.
pub async fn start_server(
    app: tauri::AppHandle,
    state: tauri::State<'_, LlamaServerState>,
    model_path: String,
    port: u16,
    flags: Vec<String>,
) -> Result<LlamaServerInfo, String> {
    tracing::info!(
        model = %model_path,
        port,
        flags = %flags.join(" "),
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
    let mut args = vec![
        "-m".to_owned(),
        model_path.clone(),
        "--port".to_owned(),
        port.to_string(),
    ];
    args.extend(flags);
    args.extend(["--host", "127.0.0.1", "-fa", "on"].map(str::to_owned));
    let shell = app.shell();
    let (mut rx, child) = shell
        .sidecar("binaries/llama-server")
        .map_err(|e| format!("Failed to create sidecar command: {e}"))?
        .args(args)
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
    devpulse_telemetry::spawn(async move {
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
                    let _ = app_clone.emit(
                        "llama:server-stopped",
                        serde_json::json!({
                            "code": status.code,
                        }),
                    );
                    break;
                }
                _ => {}
            }
        }
    });

    // Health check — poll until ready or timeout
    if !poll_llama_health(port).await {
        tracing::error!("llama-server health check timed out after 30s");
        // Kill the stuck process
        let mut child_lock = state.child.lock().await;
        if let Some(child) = child_lock.take() {
            let _ = child.kill();
        }
        return Err("llama-server failed to start within 30 seconds".into());
    }

    let _ = crate::events::LlamaServerReady {
        port,
        model_path: model_path.clone(),
    }
    .emit(&app);

    Ok(LlamaServerInfo {
        port,
        pid: u64::from(pid),
        model_path,
    })
}

/// Poll `GET /health` for up to 30s (60 × 500ms). Returns `true` when
/// the server returns a body containing `"ok"`, `false` on timeout.
async fn poll_llama_health(port: u16) -> bool {
    let url = format!("http://127.0.0.1:{port}/health");
    let client = reqwest::Client::new();
    for attempt in 1..=60_u32 {
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        match client.get(&url).send().await {
            Ok(resp) => {
                if let Ok(body) = resp.text().await {
                    if body.contains("\"ok\"") {
                        tracing::info!(attempt, "llama-server health check passed");
                        return true;
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
    false
}

/// Stop the llama-server sidecar.
#[tauri::command]
#[specta::specta]
pub async fn stop_llama_server(state: tauri::State<'_, LlamaServerState>) -> Result<(), String> {
    let mut child_lock = state.child.lock().await;
    if let Some(child) = child_lock.take() {
        tracing::info!("Stopping llama-server");
        child
            .kill()
            .map_err(|e| format!("Failed to kill llama-server: {e}"))?;
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
    messages: Vec<EndpointChatMessage>,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
) -> Result<String, String> {
    let port = *state.port.lock().await;
    chat_at(port, messages, max_tokens, temperature, |text| {
        crate::events::LlamaTokenStreamed {
            content: text.to_owned(),
        }
        .emit(&app)
        .map_err(|error| error.to_string())
    })
    .await
}

/// Adapt the supervised endpoint and caller's event sink to the kernel transport.
pub(crate) async fn chat_at(
    port: u16,
    messages: Vec<EndpointChatMessage>,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
    mut on_delta: impl FnMut(&str) -> Result<(), String>,
) -> Result<String, String> {
    if port == 0 {
        return Err("llama-server not running".into());
    }
    let request = EndpointChatRequest {
        model: None,
        messages,
        max_tokens: Some(max_tokens.unwrap_or(512)),
        max_completion_tokens: None,
        temperature: Some(temperature.unwrap_or(0.7)),
        top_p: None,
        stop: Vec::new(),
    };
    openai_compatible::stream(
        &format!("http://127.0.0.1:{port}/v1"),
        None,
        &request,
        |text| on_delta(text).map_err(anyhow::Error::msg),
    )
    .await
    .map(|answer| answer.text)
    .map_err(|error| error.to_string())
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
    openai_compatible::embed(
        &format!("http://127.0.0.1:{port}/v1"),
        None,
        "default",
        &input,
    )
    .await
    .map_err(|error| error.to_string())
}

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
    /// Server status: "ok", "loading", "unreachable", "`not_started`".
    pub status: String,
    /// Port the server is bound to (0 if not started).
    pub port: u16,
}
