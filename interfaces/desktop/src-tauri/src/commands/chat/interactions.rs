use tauri::command;

#[command]
pub fn post_reaction(msg_id: String, emoji: String) {
    println!(">> [CHAT] Reaction: {} on {}", emoji, msg_id);
}
