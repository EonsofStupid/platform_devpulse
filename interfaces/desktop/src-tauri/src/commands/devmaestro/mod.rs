use tauri::command;
use serde::Serialize;

#[derive(Serialize)]
pub struct MaestroStatus {
    pub active: bool,
    pub context_window: u32,
    pub mode: String,
}

#[command]
pub fn get_status() -> MaestroStatus {
    // Philosophy: "Glass Box" - Tell the user exactly what the Brain is up to.
    MaestroStatus {
        active: true,
        context_window: 128_000,
        mode: "EXECUTION".to_string(),
    }
}
