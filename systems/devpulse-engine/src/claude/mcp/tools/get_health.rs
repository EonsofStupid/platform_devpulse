//! MCP tool: get_health — platform health status, all subsystems + uptime.
//!
//! Always available. No arguments. Returns serialized `SystemHealth`.

use serde_json::json;

use super::{error_result, text_result, ToolRegistry};
use crate::claude::mcp::protocol::ToolDefinition;

pub fn register(registry: &mut ToolRegistry) {
    registry.register(
        "get_health",
        ToolDefinition {
            name: "get_health".to_string(),
            description: "Get platform health status — all subsystems with uptime".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {},
                "required": []
            }),
        },
        Box::new(|platform, _args| {
            Box::pin(async move {
                let health = platform.health().await;
                match serde_json::to_string_pretty(&health) {
                    Ok(json) => text_result(json),
                    Err(e) => error_result(format!("Failed to serialize health: {e}")),
                }
            })
        }),
    );
}
