//! MCP tool: `get_health` — platform health status, all subsystems + uptime.

use crate::platform::Platform;

/// Execute health check — returns JSON-serialized `SystemHealth`.
pub async fn execute(platform: &Platform) -> String {
    let health = platform.health().await;
    serde_json::to_string_pretty(&health)
        .unwrap_or_else(|e| format!("Failed to serialize health: {e}"))
}
