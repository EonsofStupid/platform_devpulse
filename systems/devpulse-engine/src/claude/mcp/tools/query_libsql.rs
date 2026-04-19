//! MCP tool: query_libsql — read-only SQL against libSQL.
//!
//! SELECT only — write operations rejected at the tool level.
//! Scans full query for write keywords (CTE-safe, string-literal-safe).

use crate::platform::{Platform, SqlAdapter};

use super::rows_to_json;

/// Execute a read-only SQL query against libSQL.
///
/// Security: blocks INSERT/UPDATE/DELETE/DROP/ALTER/CREATE and 9 other
/// write keywords. Strips string literals before scanning to prevent
/// false positives on quoted values.
pub async fn execute(platform: &Platform, sql: &str, scope: &str) -> String {
    let upper = sql.trim().to_uppercase();
    let sanitized = strip_sql_strings(&upper);

    const WRITE_KEYWORDS: &[&str] = &[
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
        "REPLACE", "TRUNCATE", "MERGE", "UPSERT", "ATTACH",
        "DETACH", "REINDEX", "VACUUM", "PRAGMA",
    ];

    for keyword in WRITE_KEYWORDS {
        if contains_sql_keyword(&sanitized, keyword) {
            return format!(
                "ERROR: Write operations not allowed via MCP. Found '{keyword}' in query. SELECT only."
            );
        }
    }

    if !sanitized.starts_with("SELECT") && !sanitized.starts_with("WITH") {
        return "ERROR: Query must begin with SELECT or WITH. Write operations not allowed via MCP."
            .to_string();
    }

    let service = match scope {
        "system" => platform.relational(),
        _ => platform.user_relational(),
    };

    let adapter = match service {
        Some(svc) => svc.adapter().clone(),
        None => return format!("ERROR: LibSQL {scope} service not available"),
    };

    let params: Vec<&str> = Vec::new();
    match adapter.query(sql, &params).await {
        Ok(rows) => {
            let count = rows.len();
            let json_val = rows_to_json(&rows);
            match serde_json::to_string_pretty(&json_val) {
                Ok(s) => format!("{count} row(s)\n\n{s}"),
                Err(e) => format!("ERROR: Serialization error: {e}"),
            }
        }
        Err(e) => format!("ERROR: Query error: {e}"),
    }
}

/// Strip SQL string literals to prevent false keyword matches.
fn strip_sql_strings(sql: &str) -> String {
    let mut result = String::with_capacity(sql.len());
    let mut chars = sql.chars().peekable();

    while let Some(ch) = chars.next() {
        if ch == '\'' || ch == '"' {
            let quote = ch;
            loop {
                match chars.next() {
                    Some(c) if c == quote => {
                        if chars.peek() == Some(&quote) {
                            chars.next();
                        } else {
                            break;
                        }
                    }
                    None => break,
                    _ => {}
                }
            }
            result.push(' ');
        } else {
            result.push(ch);
        }
    }

    result
}

/// Check if `sql` contains `keyword` as a whole word.
fn contains_sql_keyword(sql: &str, keyword: &str) -> bool {
    let keyword_bytes = keyword.as_bytes();
    let sql_bytes = sql.as_bytes();
    let klen = keyword_bytes.len();

    if sql_bytes.len() < klen {
        return false;
    }

    for i in 0..=(sql_bytes.len() - klen) {
        if &sql_bytes[i..i + klen] == keyword_bytes {
            let left_ok = i == 0 || !sql_bytes[i - 1].is_ascii_alphanumeric();
            let right_ok =
                i + klen == sql_bytes.len() || !sql_bytes[i + klen].is_ascii_alphanumeric();
            if left_ok && right_ok {
                return true;
            }
        }
    }

    false
}
