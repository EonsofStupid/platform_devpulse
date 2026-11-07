//! Discovery commands - model scanning and detection
//!
//! Commands:
//! - scan_models: Scan for local models
//! - scan_ollama: Scan Ollama specifically

use crate::AppState;
use tauri::State;

#[derive(serde::Serialize)]
pub struct DiscoveredModel {
    pub id: String,
    pub name: String,
    pub adapter: String,
    pub size_bytes: Option<u64>,
    pub quantization: Option<String>,
}

#[derive(serde::Serialize)]
pub struct ScanResult {
    pub models: Vec<DiscoveredModel>,
    pub errors: Vec<String>,
}

#[tauri::command]
pub async fn scan_models(_state: State<'_, AppState>) -> Result<ScanResult, String> {
    // Stub - will wire to engine.discovery.scan() later
    Ok(ScanResult {
        models: vec![],
        errors: vec![],
    })
}

#[tauri::command]
pub async fn scan_ollama(_state: State<'_, AppState>) -> Result<ScanResult, String> {
    // Stub - will wire to engine.discovery.scan_ollama() later
    Ok(ScanResult {
        models: vec![DiscoveredModel {
            id: "llama3.2:3b".to_string(),
            name: "Llama 3.2 3B".to_string(),
            adapter: "ollama".to_string(),
            size_bytes: Some(2_000_000_000),
            quantization: Some("Q4_0".to_string()),
        }],
        errors: vec![],
    })
}
