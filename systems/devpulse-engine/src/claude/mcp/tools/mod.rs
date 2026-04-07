//! MCP Tool Registry — registers tools and dispatches calls.
//!
//! Each tool: name, description, JSON Schema input, async handler.
//! Handler receives `Arc<Platform>` + `serde_json::Value` args.
//!
//! Two categories:
//! - DevPulse tools: always available (project-scoped in release)
//! - Workstation tools: `#[cfg(feature = "internal")]` only

mod get_health;
mod query_libsql;
mod repo_get_file;
mod repo_list_files;

#[cfg(feature = "internal")]
mod shell_execute;

use crate::platform::Platform;
use serde_json::Value;
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use super::protocol::{ToolCallResult, ToolContent, ToolDefinition};

/// Async tool handler: receives platform + args, returns tool result.
pub type ToolHandler = Box<
    dyn Fn(Arc<Platform>, Value) -> Pin<Box<dyn Future<Output = ToolCallResult> + Send>>
        + Send
        + Sync,
>;

/// A registered tool with its definition and handler.
pub struct RegisteredTool {
    /// Wire-protocol definition (name, description, input schema).
    pub definition: ToolDefinition,
    /// Async function that executes the tool logic.
    pub handler: ToolHandler,
}

/// Tool registry — holds all MCP tools, dispatches calls.
pub struct ToolRegistry {
    tools: HashMap<String, RegisteredTool>,
}

impl ToolRegistry {
    /// Create registry with all tools registered.
    pub fn new() -> Self {
        let mut registry = Self {
            tools: HashMap::new(),
        };

        // DevPulse tools (always available)
        get_health::register(&mut registry);
        query_libsql::register(&mut registry);
        repo_get_file::register(&mut registry);
        repo_list_files::register(&mut registry);

        // Workstation tools (internal only)
        #[cfg(feature = "internal")]
        shell_execute::register(&mut registry);

        tracing::info!(count = registry.tools.len(), "MCP tool registry initialized");
        registry
    }

    /// Register a tool by name.
    pub fn register(&mut self, name: &str, definition: ToolDefinition, handler: ToolHandler) {
        self.tools.insert(
            name.to_string(),
            RegisteredTool {
                definition,
                handler,
            },
        );
    }

    /// List all tool definitions (for tools/list response).
    pub fn list(&self) -> Vec<&ToolDefinition> {
        self.tools.values().map(|t| &t.definition).collect()
    }

    /// Call a tool by name with arguments. Returns tool result.
    pub async fn call(
        &self,
        name: &str,
        arguments: Value,
        platform: Arc<Platform>,
    ) -> ToolCallResult {
        match self.tools.get(name) {
            Some(tool) => (tool.handler)(platform, arguments).await,
            None => error_result(format!("Unknown tool: {name}")),
        }
    }
}

/// Text-only success result.
pub fn text_result(text: String) -> ToolCallResult {
    ToolCallResult {
        content: vec![ToolContent::Text { text }],
        is_error: None,
    }
}

/// Error result.
pub fn error_result(text: String) -> ToolCallResult {
    ToolCallResult {
        content: vec![ToolContent::Text { text }],
        is_error: Some(true),
    }
}

/// Convert `SqlValue` (no Serialize) to `serde_json::Value`.
pub fn sql_value_to_json(val: &crate::platform::SqlValue) -> serde_json::Value {
    use crate::platform::SqlValue;
    match val {
        SqlValue::Null => serde_json::Value::Null,
        SqlValue::Integer(i) => serde_json::json!(i),
        SqlValue::Real(f) => serde_json::json!(f),
        SqlValue::Text(s) => serde_json::json!(s),
        SqlValue::Blob(b) => serde_json::json!(format!("<blob {} bytes>", b.len())),
    }
}

/// Convert query result rows (`Vec<SqlRow>`) to JSON array of arrays.
pub fn rows_to_json(rows: &[Vec<crate::platform::SqlValue>]) -> serde_json::Value {
    let json_rows: Vec<serde_json::Value> = rows
        .iter()
        .map(|row| {
            serde_json::Value::Array(row.iter().map(sql_value_to_json).collect())
        })
        .collect();
    serde_json::Value::Array(json_rows)
}
