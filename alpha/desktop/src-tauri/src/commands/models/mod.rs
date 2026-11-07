//! Model commands - AI model management
//!
//! Commands:
//! - list_models: Get available models
//! - set_model: Set active model

use crate::AppState;
use tauri::State;

#[derive(serde::Serialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub adapter: String,
    pub context_size: u32,
    pub loaded: bool,
}

#[tauri::command]
pub async fn list_models(_state: State<'_, AppState>) -> Result<Vec<ModelInfo>, String> {
    // Stub - will wire to engine.models.list() later
    Ok(vec![ModelInfo {
        id: "llama3.2:3b".to_string(),
        name: "Llama 3.2 3B".to_string(),
        adapter: "ollama".to_string(),
        context_size: 8192,
        loaded: false,
    }])
}

#[tauri::command]
pub async fn set_model(model_id: String, _state: State<'_, AppState>) -> Result<(), String> {
    // Stub - will wire to engine.models.set_active() later
    println!("Setting model to: {}", model_id);
    Ok(())
}
