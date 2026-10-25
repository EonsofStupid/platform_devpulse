//! Status commands - system health and readiness
//!
//! Commands:
//! - get_status: Get system component status

use crate::AppState;
use tauri::State;

#[derive(serde::Serialize)]
pub struct ComponentStatus {
    pub name: String,
    pub healthy: bool,
    pub message: Option<String>,
}

#[derive(serde::Serialize)]
pub struct SystemStatus {
    pub ready: bool,
    pub components: Vec<ComponentStatus>,
}

#[tauri::command]
pub async fn get_status(_state: State<'_, AppState>) -> Result<SystemStatus, String> {
    // Stub - will wire to engine.status() later
    Ok(SystemStatus {
        ready: true,
        components: vec![
            ComponentStatus {
                name: "engine".to_string(),
                healthy: true,
                message: None,
            },
            ComponentStatus {
                name: "inference".to_string(),
                healthy: false,
                message: Some("Not initialized".to_string()),
            },
        ],
    })
}
