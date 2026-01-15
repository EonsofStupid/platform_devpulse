use tauri::command;

/// Bridges Frontend Console Logs to Backend Tracing.
/// Philosophy: "Glass Box" - We need to see what the frontend is thinking.
#[command]
pub fn log_frontend(level: String, message: String, context: Option<serde_json::Value>) {
    // In production, this would feed into the specific tracing subscriber
    // defined in lib.rs or the kernel.
    match level.as_str() {
        "ERROR" => eprintln!("[UI-ERR] {} {:?}", message, context),
        "WARN" => println!("[UI-WARN] {} {:?}", message, context),
        _ => println!("[UI-INFO] {} {:?}", message, context),
    }
}
