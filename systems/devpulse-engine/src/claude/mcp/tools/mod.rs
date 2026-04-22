//! Tool implementation modules for `DevPulse` MCP server.
//!
//! Each module exposes an `execute()` async function called by the
//! `#[tool]` methods on `DevPulseMcpServer`. Business logic, security
//! policies, and Platform access live here — protocol plumbing handled
//! by rmcp.

pub mod get_health;
pub mod query_libsql;
pub mod repo_get_file;
pub mod repo_list_files;

#[cfg(feature = "kernel")]
pub mod shell_execute;

// ── Shared helpers used by tool implementations ──────────────

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

/// Convert query result rows to JSON array of arrays.
pub fn rows_to_json(rows: &[Vec<crate::platform::SqlValue>]) -> serde_json::Value {
    let json_rows: Vec<serde_json::Value> = rows
        .iter()
        .map(|row| serde_json::Value::Array(row.iter().map(sql_value_to_json).collect()))
        .collect();
    serde_json::Value::Array(json_rows)
}
