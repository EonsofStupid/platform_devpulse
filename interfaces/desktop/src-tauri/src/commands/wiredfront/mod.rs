use tauri::command;

/// Connects to a Peer-to-Peer session (AngryViber Network).
/// Philosophy: "Native Performance" - This will eventually bridge to the Rust WebRTC stack.
#[command]
pub fn connect_peer(peer_id: String) {
    println!(">> [WIRED] Attempting connection to peer: {}", peer_id);
    // TODO: Init `systems/wired-protocol`
}

// Future: pub fn start_capture() -> Result<()>
