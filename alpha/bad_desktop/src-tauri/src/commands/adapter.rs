//! Adapter commands - API key management and adapter selection
//!
//! Commands:
//! - list_adapters: Get available adapters with status
//! - save_api_key: Store API key in secure vault
//! - delete_api_key: Remove API key from vault
//! - set_active_adapter: Switch active LLM adapter
//! - get_active_adapter: Get currently active adapter
//! - test_adapter: Test adapter connection/API key
//! - list_adapter_models: Get models available for a adapter

use crate::state::AppState;
use engine::AdapterKind;
use serde::{Deserialize, Serialize};
use shared::{SecureVault, Zeroizing, KNOWN_ADAPTERS};
use tauri::State;

/// Adapter status for UI display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdapterInfo {
    pub id: String,
    pub name: String,
    pub kind: String,
    pub has_key: bool,
    pub is_active: bool,
    pub is_available: bool,
}

/// List all adapters with their status
#[tauri::command]
pub async fn list_adapters(state: State<'_, AppState>) -> Result<Vec<AdapterInfo>, String> {
    let vault = SecureVault::new();

    // Get engine to check active adapter
    let active_kind = if let Ok(engine) = state.engine().await {
        engine.active_adapter_kind().await.unwrap_or(AdapterKind::Local)
    } else {
        AdapterKind::Local
    };

    let mut adapters = vec![
        AdapterInfo {
            id: "local".to_string(),
            name: "Local (Qwen3-VL-4B)".to_string(),
            kind: "local".to_string(),
            has_key: true, // Always available
            is_active: active_kind == AdapterKind::Local,
            is_available: true,
        },
        AdapterInfo {
            id: "anthropic".to_string(),
            name: "Anthropic Claude".to_string(),
            kind: "anthropic".to_string(),
            has_key: vault.has_key("anthropic"),
            is_active: active_kind == AdapterKind::Anthropic,
            is_available: vault.has_key("anthropic"),
        },
        AdapterInfo {
            id: "openai".to_string(),
            name: "OpenAI".to_string(),
            kind: "openai".to_string(),
            has_key: vault.has_key("openai"),
            is_active: active_kind == AdapterKind::OpenAI,
            is_available: vault.has_key("openai"),
        },
        AdapterInfo {
            id: "ollama".to_string(),
            name: "Ollama (Local Server)".to_string(),
            kind: "ollama".to_string(),
            has_key: true, // No key required
            is_active: active_kind == AdapterKind::Ollama,
            is_available: false, // Will check below
        },
        AdapterInfo {
            id: "lmstudio".to_string(),
            name: "LM Studio".to_string(),
            kind: "lmstudio".to_string(),
            has_key: true, // No key required
            is_active: active_kind == AdapterKind::LMStudio,
            is_available: false, // Will check below
        },
    ];

    // Check local server availability
    let client = reqwest::Client::new();

    // Check Ollama
    let ollama_url = std::env::var("OLLAMA_HOST")
        .unwrap_or_else(|_| "http://localhost:11434".to_string());
    if client
        .get(format!("{}/api/version", ollama_url))
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
        .is_ok()
    {
        if let Some(p) = adapters.iter_mut().find(|p| p.id == "ollama") {
            p.is_available = true;
        }
    }

    // Check LMStudio
    let lmstudio_url = std::env::var("LMSTUDIO_HOST")
        .unwrap_or_else(|_| "http://localhost:1234".to_string());
    if client
        .get(format!("{}/v1/models", lmstudio_url))
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
        .is_ok()
    {
        if let Some(p) = adapters.iter_mut().find(|p| p.id == "lmstudio") {
            p.is_available = true;
        }
    }

    Ok(adapters)
}

/// Save an API key to the secure vault
#[tauri::command]
pub async fn save_api_key(adapter: String, api_key: String) -> Result<(), String> {
    let vault = SecureVault::new();

    // Validate adapter
    if !KNOWN_ADAPTERS.contains(&adapter.as_str()) {
        return Err(format!("Unknown adapter: {}", adapter));
    }

    // Validate key format (basic checks)
    if api_key.is_empty() {
        return Err("API key cannot be empty".to_string());
    }

    // Adapter-specific validation
    match adapter.as_str() {
        "anthropic" => {
            if !api_key.starts_with("sk-ant-") {
                return Err("Anthropic API keys should start with 'sk-ant-'".to_string());
            }
        }
        "openai" => {
            if !api_key.starts_with("sk-") {
                return Err("OpenAI API keys should start with 'sk-'".to_string());
            }
        }
        _ => {}
    }

    // Store securely (key is zeroized on drop)
    let secure_key = Zeroizing::new(api_key);
    vault
        .store_key(&adapter, secure_key)
        .map_err(|e| format!("Failed to store key: {}", e))?;

    println!("[adapters] API key saved for {}", adapter);
    Ok(())
}

/// Delete an API key from the vault
#[tauri::command]
pub async fn delete_api_key(adapter: String) -> Result<(), String> {
    let vault = SecureVault::new();

    vault
        .delete_key(&adapter)
        .map_err(|e| format!("Failed to delete key: {}", e))?;

    println!("[adapters] API key deleted for {}", adapter);
    Ok(())
}

/// Set the active LLM adapter
#[tauri::command]
pub async fn set_active_adapter(
    adapter: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let engine = state.engine().await?;

    let kind = parse_adapter_kind(&adapter)?;

    engine
        .set_active_adapter(kind)
        .await
        .map_err(|e| format!("Failed to set adapter: {}", e))?;

    println!("[adapters] Active adapter set to {}", adapter);
    Ok(())
}

/// Get the currently active adapter
#[tauri::command]
pub async fn get_active_adapter(state: State<'_, AppState>) -> Result<String, String> {
    let engine = state.engine().await?;

    let kind = engine.active_adapter_kind().await.map_err(|e| e.to_string())?;

    Ok(kind.to_string())
}

/// Test response for adapter connection test
#[derive(Debug, Clone, Serialize)]
pub struct AdapterTestResult {
    pub success: bool,
    pub message: String,
    pub latency_ms: Option<u64>,
    pub model: Option<String>,
}

/// Test a adapter connection (validates API key)
#[tauri::command]
pub async fn test_adapter(adapter: String) -> Result<AdapterTestResult, String> {
    let vault = SecureVault::new();
    let client = reqwest::Client::new();

    match adapter.as_str() {
        "anthropic" => {
            let api_key = vault
                .get_key("anthropic")
                .map_err(|_| "No API key configured for Anthropic")?;

            let start = std::time::Instant::now();

            let response = client
                .post("https://api.anthropic.com/v1/messages")
                .header("x-api-key", api_key.as_str())
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .json(&serde_json::json!({
                    "model": "claude-3-5-haiku-20241022",
                    "max_tokens": 10,
                    "messages": [{"role": "user", "content": "Say 'test ok'"}]
                }))
                .timeout(std::time::Duration::from_secs(30))
                .send()
                .await
                .map_err(|e| format!("Connection failed: {}", e))?;

            let latency_ms = start.elapsed().as_millis() as u64;

            if response.status().is_success() {
                Ok(AdapterTestResult {
                    success: true,
                    message: "Anthropic API connection successful".to_string(),
                    latency_ms: Some(latency_ms),
                    model: Some("claude-3-5-haiku-20241022".to_string()),
                })
            } else {
                let error = response.text().await.unwrap_or_default();
                Ok(AdapterTestResult {
                    success: false,
                    message: format!("API error: {}", error),
                    latency_ms: None,
                    model: None,
                })
            }
        }
        "openai" => {
            let api_key = vault
                .get_key("openai")
                .map_err(|_| "No API key configured for OpenAI")?;

            let start = std::time::Instant::now();

            let response = client
                .get("https://api.openai.com/v1/models")
                .header("Authorization", format!("Bearer {}", api_key.as_str()))
                .timeout(std::time::Duration::from_secs(30))
                .send()
                .await
                .map_err(|e| format!("Connection failed: {}", e))?;

            let latency_ms = start.elapsed().as_millis() as u64;

            if response.status().is_success() {
                Ok(AdapterTestResult {
                    success: true,
                    message: "OpenAI API connection successful".to_string(),
                    latency_ms: Some(latency_ms),
                    model: Some("gpt-4o".to_string()),
                })
            } else {
                let error = response.text().await.unwrap_or_default();
                Ok(AdapterTestResult {
                    success: false,
                    message: format!("API error: {}", error),
                    latency_ms: None,
                    model: None,
                })
            }
        }
        "ollama" => {
            let url = std::env::var("OLLAMA_HOST")
                .unwrap_or_else(|_| "http://localhost:11434".to_string());

            let start = std::time::Instant::now();

            let response = client
                .get(format!("{}/api/version", url))
                .timeout(std::time::Duration::from_secs(5))
                .send()
                .await;

            let latency_ms = start.elapsed().as_millis() as u64;

            match response {
                Ok(r) if r.status().is_success() => Ok(AdapterTestResult {
                    success: true,
                    message: "Ollama server is running".to_string(),
                    latency_ms: Some(latency_ms),
                    model: None,
                }),
                Ok(r) => Ok(AdapterTestResult {
                    success: false,
                    message: format!("Ollama returned status {}", r.status()),
                    latency_ms: None,
                    model: None,
                }),
                Err(e) => Ok(AdapterTestResult {
                    success: false,
                    message: format!("Ollama not reachable: {}", e),
                    latency_ms: None,
                    model: None,
                }),
            }
        }
        "lmstudio" => {
            let url = std::env::var("LMSTUDIO_HOST")
                .unwrap_or_else(|_| "http://localhost:1234".to_string());

            let start = std::time::Instant::now();

            let response = client
                .get(format!("{}/v1/models", url))
                .timeout(std::time::Duration::from_secs(5))
                .send()
                .await;

            let latency_ms = start.elapsed().as_millis() as u64;

            match response {
                Ok(r) if r.status().is_success() => Ok(AdapterTestResult {
                    success: true,
                    message: "LM Studio server is running".to_string(),
                    latency_ms: Some(latency_ms),
                    model: None,
                }),
                Ok(r) => Ok(AdapterTestResult {
                    success: false,
                    message: format!("LM Studio returned status {}", r.status()),
                    latency_ms: None,
                    model: None,
                }),
                Err(e) => Ok(AdapterTestResult {
                    success: false,
                    message: format!("LM Studio not reachable: {}", e),
                    latency_ms: None,
                    model: None,
                }),
            }
        }
        "local" => Ok(AdapterTestResult {
            success: true,
            message: "Local adapter always available".to_string(),
            latency_ms: Some(0),
            model: Some("qwen3-vl-4b".to_string()),
        }),
        _ => Err(format!("Unknown adapter: {}", adapter)),
    }
}

/// List models available for a specific adapter
#[tauri::command]
pub async fn list_adapter_models(adapter: String) -> Result<Vec<String>, String> {
    let client = reqwest::Client::new();
    let _vault = SecureVault::new(); // Reserved for future API key-authenticated model lists

    match adapter.as_str() {
        "anthropic" => Ok(vec![
            "claude-sonnet-4-20250514".to_string(),
            "claude-opus-4-20250514".to_string(),
            "claude-3-5-haiku-20241022".to_string(),
        ]),
        "openai" => Ok(vec![
            "gpt-4o".to_string(),
            "gpt-4o-mini".to_string(),
            "gpt-4-turbo".to_string(),
            "o1-preview".to_string(),
        ]),
        "ollama" => {
            let url = std::env::var("OLLAMA_HOST")
                .unwrap_or_else(|_| "http://localhost:11434".to_string());

            let response = client
                .get(format!("{}/api/tags", url))
                .timeout(std::time::Duration::from_secs(5))
                .send()
                .await
                .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

            if !response.status().is_success() {
                return Ok(Vec::new());
            }

            let data: serde_json::Value = response
                .json()
                .await
                .map_err(|e| format!("Invalid response: {}", e))?;

            let models = data["models"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|m| m["name"].as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default();

            Ok(models)
        }
        "lmstudio" => {
            let url = std::env::var("LMSTUDIO_HOST")
                .unwrap_or_else(|_| "http://localhost:1234".to_string());

            let response = client
                .get(format!("{}/v1/models", url))
                .timeout(std::time::Duration::from_secs(5))
                .send()
                .await
                .map_err(|e| format!("Failed to connect to LM Studio: {}", e))?;

            if !response.status().is_success() {
                return Ok(Vec::new());
            }

            let data: serde_json::Value = response
                .json()
                .await
                .map_err(|e| format!("Invalid response: {}", e))?;

            let models = data["data"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|m| m["id"].as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default();

            Ok(models)
        }
        "local" => Ok(vec!["qwen3-vl-4b-q6k".to_string()]),
        _ => Err(format!("Unknown adapter: {}", adapter)),
    }
}

fn parse_adapter_kind(s: &str) -> Result<AdapterKind, String> {
    match s.to_lowercase().as_str() {
        "local" => Ok(AdapterKind::Local),
        "anthropic" => Ok(AdapterKind::Anthropic),
        "openai" => Ok(AdapterKind::OpenAI),
        "ollama" => Ok(AdapterKind::Ollama),
        "lmstudio" => Ok(AdapterKind::LMStudio),
        _ => Err(format!("Unknown adapter: {}", s)),
    }
}
