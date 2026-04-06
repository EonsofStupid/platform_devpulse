//! MCP tool: query_libsql — read-only SQL against libSQL.
//!
//! Always available. Queries user or system relational store.
//! SELECT only — write operations rejected at the tool level.

use serde_json::json;

use super::{error_result, rows_to_json, text_result, ToolRegistry};
use crate::claude::mcp::protocol::ToolDefinition;
use crate::platform::SqlAdapter;

pub fn register(registry: &mut ToolRegistry) {
    registry.register(
        "query_libsql",
        ToolDefinition {
            name: "query_libsql".to_string(),
            description: "Execute a read-only SQL query against libSQL. \
                scope 'user' for sessions/turns/decisions, 'system' for kernel state."
                .to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "sql": { "type": "string", "description": "SQL SELECT query" },
                    "params": {
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Bind parameters"
                    },
                    "scope": {
                        "type": "string",
                        "enum": ["user", "system"],
                        "description": "Database scope (default: user)"
                    }
                },
                "required": ["sql"]
            }),
        },
        Box::new(|platform, args| {
            Box::pin(async move {
                let sql = match args.get("sql").and_then(|v| v.as_str()) {
                    Some(s) => s.to_string(),
                    None => return error_result("Missing required parameter: sql".to_string()),
                };

                // Read-only enforcement
                let upper = sql.trim().to_uppercase();
                for keyword in &["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE"] {
                    if upper.starts_with(keyword) {
                        return error_result(
                            "Write operations not allowed via MCP. SELECT only.".to_string(),
                        );
                    }
                }

                let params: Vec<String> = args
                    .get("params")
                    .and_then(|v| v.as_array())
                    .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                    .unwrap_or_default();

                let scope = args.get("scope").and_then(|v| v.as_str()).unwrap_or("user");

                let service = match scope {
                    "system" => platform.relational(),
                    _ => platform.user_relational(),
                };

                let adapter = match service {
                    Some(svc) => svc.adapter().clone(),
                    None => return error_result(format!("LibSQL {scope} service not available")),
                };

                let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
                match adapter.query(&sql, &param_refs).await {
                    Ok(rows) => {
                        let count = rows.len();
                        let json_val = rows_to_json(&rows);
                        match serde_json::to_string_pretty(&json_val) {
                            Ok(s) => text_result(format!("{count} row(s)\n\n{s}")),
                            Err(e) => error_result(format!("Serialization error: {e}")),
                        }
                    }
                    Err(e) => error_result(format!("Query error: {e}")),
                }
            })
        }),
    );
}
