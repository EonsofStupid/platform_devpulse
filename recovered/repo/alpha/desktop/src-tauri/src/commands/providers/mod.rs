//! Adapter commands - AI adapter management
//!
//! Commands:
//! - list_adapters: Get available adapters
//! - set_adapter: Set active adapter

use crate::AppState;
use tauri::State;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct AdapterInfo {
    pub id: String,
    pub name: String,
    pub kind: String, // "local" | "web"
    pub available: bool,
}

#[tauri::command]
pub async fn list_adapters(_state: State<'_, AppState>) -> Result<Vec<AdapterInfo>, String> {
    // Stub - will wire to engine.adapters.list() later
    Ok(vec![
        AdapterInfo {
            id: "ollama".to_string(),
            name: "Ollama".to_string(),
            kind: "local".to_string(),
            available: true,
        },
        AdapterInfo {
            id: "anthropic".to_string(),
            name: "Anthropic".to_string(),
            kind: "web".to_string(),
            available: false,
        },
        AdapterInfo {
            id: "openai".to_string(),
            name: "OpenAI".to_string(),
            kind: "web".to_string(),
            available: false,
        },
    ])
}

#[tauri::command]
pub async fn set_adapter(
    adapter_id: String,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    // Stub - will wire to engine.adapters.set_active() later
    println!("Setting adapter to: {}", adapter_id);
    Ok(())
}
