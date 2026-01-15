use tauri::command;

pub mod interactions;
pub mod history;

#[command]
pub fn send_message(content: String) -> String {
    // This is the entry point for "Vibe Coding".
    // 1. Ingest
    // 2. Classify (Keystroke Layer)
    // 3. Dispatch to Kernel
    println!(">> [CHAT] User says: {}", content);
    "ACK".to_string()
}
