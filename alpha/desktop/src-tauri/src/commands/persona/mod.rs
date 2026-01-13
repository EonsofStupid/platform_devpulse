//! Persona commands - AI personality management
//!
//! Commands:
//! - get_personas: List available personas
//! - set_persona: Set active persona
//! - create_persona: Create new persona

use crate::AppState;
use tauri::State;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct PersonaInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub system_prompt: String,
    pub active: bool,
}

#[tauri::command]
pub async fn get_personas(_state: State<'_, AppState>) -> Result<Vec<PersonaInfo>, String> {
    // Stub - will wire to engine.persona.list() later
    Ok(vec![PersonaInfo {
        id: "default".to_string(),
        name: "Assistant".to_string(),
        description: "General purpose assistant".to_string(),
        system_prompt: "You are a helpful assistant.".to_string(),
        active: true,
    }])
}

#[tauri::command]
pub async fn set_persona(
    persona_id: String,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    // Stub - will wire to engine.persona.set_active() later
    println!("Setting persona to: {}", persona_id);
    Ok(())
}

#[tauri::command]
pub async fn create_persona(
    name: String,
    description: String,
    system_prompt: String,
    _state: State<'_, AppState>,
) -> Result<PersonaInfo, String> {
    // Stub - will wire to engine.persona.create() later
    Ok(PersonaInfo {
        id: format!("persona_{}", chrono::Utc::now().timestamp()),
        name,
        description,
        system_prompt,
        active: false,
    })
}
