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

                // Read-only enforcement — scan FULL query, not just prefix.
                // Blocks write keywords anywhere in the SQL to prevent
                // CTE-wrapped or subquery-embedded mutations.
                let upper = sql.trim().to_uppercase();

                // Strip string literals before scanning to avoid false positives
                // on keywords inside quoted values (e.g. WHERE name = 'DROP TABLE').
                let sanitized = strip_sql_strings(&upper);

                const WRITE_KEYWORDS: &[&str] = &[
                    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
                    "REPLACE", "TRUNCATE", "MERGE", "UPSERT", "ATTACH",
                    "DETACH", "REINDEX", "VACUUM", "PRAGMA",
                ];

                for keyword in WRITE_KEYWORDS {
                    // Match as whole word: keyword must be preceded/followed by
                    // non-alphanumeric or be at string boundary.
                    if contains_sql_keyword(&sanitized, keyword) {
                        return error_result(format!(
                            "Write operations not allowed via MCP. Found '{keyword}' in query. SELECT only."
                        ));
                    }
                }

                // Must begin with SELECT or WITH (for CTEs that resolve to SELECT)
                if !sanitized.starts_with("SELECT") && !sanitized.starts_with("WITH") {
                    return error_result(
                        "Query must begin with SELECT or WITH. Write operations not allowed via MCP.".to_string(),
                    );
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

/// Strip SQL string literals (both single and double quoted) from a query.
/// Replaces quoted content with empty strings to prevent false keyword matches
/// inside string values like `WHERE name = 'DROP TABLE'`.
fn strip_sql_strings(sql: &str) -> String {
    let mut result = String::with_capacity(sql.len());
    let mut chars = sql.chars().peekable();

    while let Some(ch) = chars.next() {
        if ch == '\'' || ch == '"' {
            let quote = ch;
            // Skip everything until matching close quote (handling escaped quotes)
            loop {
                match chars.next() {
                    Some(c) if c == quote => {
                        // Check for escaped quote (doubled)
                        if chars.peek() == Some(&quote) {
                            chars.next(); // skip the escape
                        } else {
                            break;
                        }
                    }
                    None => break, // Unterminated string — stop
                    _ => {}
                }
            }
            // Replace the entire string literal with a space
            result.push(' ');
        } else {
            result.push(ch);
        }
    }

    result
}

/// Check if `sql` contains `keyword` as a whole word (not as a substring of
/// an identifier like `UPDATED_AT` or `DELETED_FLAG`).
fn contains_sql_keyword(sql: &str, keyword: &str) -> bool {
    let keyword_bytes = keyword.as_bytes();
    let sql_bytes = sql.as_bytes();
    let klen = keyword_bytes.len();

    if sql_bytes.len() < klen {
        return false;
    }

    for i in 0..=(sql_bytes.len() - klen) {
        if &sql_bytes[i..i + klen] == keyword_bytes {
            // Check left boundary: must be start of string or non-alphanumeric
            let left_ok = i == 0 || !sql_bytes[i - 1].is_ascii_alphanumeric();
            // Check right boundary: must be end of string or non-alphanumeric
            let right_ok =
                i + klen == sql_bytes.len() || !sql_bytes[i + klen].is_ascii_alphanumeric();

            if left_ok && right_ok {
                return true;
            }
        }
    }

    false
}
