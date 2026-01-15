use tauri::command;

#[command]
pub fn create_canvas(name: String) -> String {
    println!(">> [THINK] Creating new research canvas: {}", name);
    // TODO: Connect to `systems/userdata` to persist canvas state.
    format!("canvas-{}", uuid::Uuid::new_v7())
}
