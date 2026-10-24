//! What the IPC trace writes about a call's arguments (plan 0001 A3).
//!
//! Debug builds trace every invoke's arguments (`lib.rs`, the IPC tracing
//! wrapper), and the debug log keeps TRACE, so whatever a command receives
//! lands in the run's `session.jsonl`. A secret must never be written there:
//! an API key, a token, a session.
//!
//! Redaction goes by the argument's name, at any depth. A value whose name
//! ends in a secret word (`key`, `token`, `secret`, `password`, …) is
//! replaced by [`REDACTED`]. A new command that takes an `apiKey` or an
//! `accessToken` is covered without a list to keep up to date; a name that
//! only looks like a secret (`key` for a preference name) is redacted too,
//! which costs a little detail and never leaks.

use serde_json::Value;
use tauri::ipc::InvokeBody;

/// What a secret value is written as.
pub const REDACTED: &str = "[redacted]";

/// Endings that mark an argument as a secret, compared with the name
/// lowercased and stripped to letters and digits (`accessToken`,
/// `access_token` and `ACCESS-TOKEN` all read `accesstoken`). Fixed in code,
/// not configuration: a setting must never be able to turn redaction off.
const SECRET_ENDINGS: &[&str] = &[
    "key",
    "token",
    "secret",
    "password",
    "passphrase",
    "credential",
    "credentials",
    "authorization",
    "cookie",
];

/// Whether an argument with this name holds a secret.
#[must_use]
pub fn is_secret_name(name: &str) -> bool {
    let flat: String = name
        .chars()
        .filter(char::is_ascii_alphanumeric)
        .map(|c| c.to_ascii_lowercase())
        .collect();
    SECRET_ENDINGS.iter().any(|ending| flat.ends_with(ending))
}

/// A call's arguments as the trace writes them: JSON with every secret
/// value replaced, or the size of a raw body (never its bytes).
#[must_use]
pub fn describe(body: &InvokeBody) -> String {
    match body {
        InvokeBody::Json(value) => redacted(value).to_string(),
        InvokeBody::Raw(bytes) => format!("{} raw bytes", bytes.len()),
    }
}

/// A copy of `value` with the value of every secret-named field replaced.
fn redacted(value: &Value) -> Value {
    match value {
        Value::Object(fields) => Value::Object(
            fields
                .iter()
                .map(|(name, field)| {
                    let field = if is_secret_name(name) {
                        Value::String(REDACTED.to_owned())
                    } else {
                        redacted(field)
                    };
                    (name.clone(), field)
                })
                .collect(),
        ),
        Value::Array(items) => Value::Array(items.iter().map(redacted).collect()),
        other => other.clone(),
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, reason = "test assertions")]

    use super::*;
    use serde_json::json;

    #[test]
    fn secret_names_in_every_spelling() {
        for name in [
            "key",
            "apiKey",
            "api_key",
            "anonKey",
            "token",
            "accessToken",
            "access_token",
            "refreshToken",
            "hfToken",
            "ACCESS-TOKEN",
            "clientSecret",
            "password",
            "newPassword",
            "passphrase",
            "credentials",
            "authorization",
            "cookie",
        ] {
            assert!(is_secret_name(name), "{name} is a secret");
        }
        for name in [
            "command",
            "sessionId",
            "text",
            "maxTokens",
            "tokenCount",
            "keys",
            "value",
            "projectId",
            "",
        ] {
            assert!(!is_secret_name(name), "{name} is not a secret");
        }
    }

    #[test]
    fn secret_values_are_replaced_at_any_depth_and_the_rest_is_kept() {
        let body = InvokeBody::Json(json!({
            "accessToken": "eyJ.secret.value",
            "sessionId": "sess-1",
            "seating": [
                { "place": "answerer-1", "apiKey": "sk-hidden" },
                { "place": "selector" }
            ],
            "values": { "name": "Ada", "nested": { "password": "hunter2" } },
            "count": 3
        }));
        let written = describe(&body);
        for secret in ["eyJ.secret.value", "sk-hidden", "hunter2"] {
            assert!(!written.contains(secret), "{secret} leaked: {written}");
        }
        let back: Value = serde_json::from_str(&written).expect("the trace stays JSON");
        assert_eq!(back["accessToken"], REDACTED);
        assert_eq!(back["seating"][0]["apiKey"], REDACTED);
        assert_eq!(back["values"]["nested"]["password"], REDACTED);
        assert_eq!(back["sessionId"], "sess-1");
        assert_eq!(back["seating"][1]["place"], "selector");
        assert_eq!(back["values"]["name"], "Ada");
        assert_eq!(back["count"], 3);
    }

    #[test]
    fn a_secret_name_hides_any_value_shape() {
        let body = InvokeBody::Json(json!({ "token": { "raw": "abc" }, "key": ["a", "b"] }));
        let back: Value = serde_json::from_str(&describe(&body)).expect("json");
        assert_eq!(back, json!({ "token": REDACTED, "key": REDACTED }));
    }

    #[test]
    fn raw_bodies_are_described_by_size_only() {
        let body = InvokeBody::Raw(b"secret bytes".to_vec());
        assert_eq!(describe(&body), "12 raw bytes");
    }
}
