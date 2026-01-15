pub mod interactions;

#[tauri::command]
pub fn send_message(content: String) -> String {
    format!("Echo: {}", content)
}
