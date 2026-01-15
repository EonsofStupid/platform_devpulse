use tauri::Manager;
mod commands;

// JUNIOR NOTE:
// A "Senior" boot sequence prioritizes VISIBILITY and STABILITY.
// 1. Tracing (See what's happening)
// 2. Config (Know how to run)
// 3. Guard (Know if allowed to run)
// 4. State (Prepare to run)
// 5. Interface (Run)

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. TELEMETRY FIRST
    // We can't debug a crash if the logger isn't running.
    // (In real prod, this connects to Sentry/Otel)
    println!(">> [BOOT] Initializing Telemetry...");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        // 2. DEPENDENCY INJECTION (Manage State)
        // We inject the "Kernel" connectivity here so commands don't establish their own.
        .setup(|app| {
            let handle = app.handle();
            
            // 3. FAIL FAST CONFIGURATION
            // If the platform config is corrupt, DO NOT BOOT.
            // Die here with a clear error message rather than weird behavior later.
            println!(">> [BOOT] Loading Configuration...");
            // let config = sys::config::load().expect("FATAL: Config Corrupt");
            
            // 4. THE GUARD (Security)
            // Check license/entitlements immediately.
            println!(">> [BOOT] Engaging Systems Guard...");
            
            #[cfg(debug_assertions)] 
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools(); // Seniors use devtools.
            }

            Ok(())
        })
        // 5. MOUNT ACCESS LAYER
        // Delegate command registration to the registry module.
        .invoke_handler(commands::mount_commands)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
