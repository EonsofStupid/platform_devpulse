//! Schema-driven inputs — one pattern for every form (plan 0001 A2).
//!
//! A Rust type carries its rules (`#[schemars(length(..))]`, `email`, …).
//! Its JSON Schema is generated from it and sent to the UI, which renders the
//! form from the schema. A submission comes back as JSON and is validated
//! against the same schema, then deserialized into the type. Problems come
//! back per field, as codes the UI turns into copy. Rules the schema cannot
//! express (a folder must exist) are checked by the form's owner and
//! reported the same way.

use std::collections::BTreeMap;

use anyhow::{Context, Result};
use jsonschema::error::ValidationErrorKind;
use schemars::JsonSchema;
use serde::de::DeserializeOwned;
use serde::Serialize;
use specta::Type;

/// Why a field was refused.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum ErrorCode {
    /// The field is required and empty.
    Required,
    /// Shorter than `limit`.
    TooShort,
    /// Longer than `limit`.
    TooLong,
    /// Not an email address.
    Email,
    /// Not a folder that exists.
    NotAFolder,
    /// The form has no such field.
    Unknown,
    /// Any other rule.
    Invalid,
}

/// One refused field.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FieldError {
    /// The field name, as in the schema.
    pub field: String,
    /// Why.
    pub code: ErrorCode,
    /// The length limit, for `tooShort` / `tooLong`.
    pub limit: Option<u64>,
}

impl FieldError {
    /// A field error without a limit.
    #[must_use]
    pub fn new(field: &str, code: ErrorCode) -> Self {
        Self {
            field: field.to_owned(),
            code,
            limit: None,
        }
    }
}

/// Where a suggested value came from.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum FieldSuggestionSource {
    /// Your git configuration.
    GitConfig,
    /// A folder on this machine that holds repositories.
    Folder,
}

/// A value the UI can offer for a field.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FieldSuggestion {
    /// The value.
    pub value: String,
    /// Where it came from.
    pub source: FieldSuggestionSource,
    /// Extra facts shown with it (for a folder: how many repositories).
    pub detail: Option<String>,
}

/// Everything the UI needs to render a form.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FormView {
    /// JSON Schema of the form, generated from its Rust type.
    pub schema: serde_json::Value,
    /// Current values, as stored.
    pub values: serde_json::Value,
    /// The field names, in the order they are shown.
    pub fields: Vec<String>,
    /// Suggested values per field.
    pub suggestions: BTreeMap<String, Vec<FieldSuggestion>>,
}

/// The result of a submission.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FormOutcome {
    /// Whether the values were written.
    pub saved: bool,
    /// Refused fields; empty when saved.
    pub errors: Vec<FieldError>,
}

impl FormOutcome {
    /// Written.
    #[must_use]
    pub const fn saved() -> Self {
        Self {
            saved: true,
            errors: Vec::new(),
        }
    }

    /// Refused, nothing written.
    #[must_use]
    pub const fn refused(errors: Vec<FieldError>) -> Self {
        Self {
            saved: false,
            errors,
        }
    }
}

/// The JSON Schema of a form type.
///
/// # Errors
/// Only if the schema cannot be serialized.
pub fn schema_of<T: JsonSchema>() -> Result<serde_json::Value> {
    serde_json::to_value(schemars::schema_for!(T)).context("serialize the form schema")
}

/// The first segment of a JSON pointer (`/displayName` → `displayName`).
fn top_field(pointer: &str) -> String {
    pointer
        .trim_start_matches('/')
        .split('/')
        .next()
        .unwrap_or_default()
        .to_owned()
}

fn to_field_error(error: &jsonschema::ValidationError<'_>) -> FieldError {
    let at = top_field(error.instance_path().as_str());
    match error.kind() {
        ValidationErrorKind::Required { property } => FieldError {
            field: property
                .as_str()
                .map_or_else(|| property.to_string(), str::to_owned),
            code: ErrorCode::Required,
            limit: None,
        },
        ValidationErrorKind::MinLength { limit } => FieldError {
            field: at,
            code: ErrorCode::TooShort,
            limit: Some(*limit),
        },
        ValidationErrorKind::MaxLength { limit } => FieldError {
            field: at,
            code: ErrorCode::TooLong,
            limit: Some(*limit),
        },
        ValidationErrorKind::Format { format } if format == "email" => {
            FieldError::new(&at, ErrorCode::Email)
        }
        ValidationErrorKind::AdditionalProperties { unexpected } => FieldError::new(
            unexpected.first().map_or("", String::as_str),
            ErrorCode::Unknown,
        ),
        _ => FieldError::new(&at, ErrorCode::Invalid),
    }
}

/// Validate a submission against `T`'s schema, then read it as `T`.
///
/// The outer `Result` is for failures of the machinery; the inner one is
/// the user's: `Err` lists every refused field.
///
/// # Errors
/// Returns an error if the schema cannot be built.
pub fn validate<T: JsonSchema + DeserializeOwned>(
    payload: &serde_json::Value,
) -> Result<Result<T, Vec<FieldError>>> {
    let schema = schema_of::<T>()?;
    let validator = jsonschema::options()
        .should_validate_formats(true)
        .build(&schema)
        .map_err(|e| anyhow::anyhow!("build the form validator: {e}"))?;
    let mut errors: Vec<FieldError> = validator
        .iter_errors(payload)
        .map(|e| to_field_error(&e))
        .collect();
    if !errors.is_empty() {
        errors.dedup();
        return Ok(Err(errors));
    }
    Ok(serde_json::from_value::<T>(payload.clone())
        .map_err(|_| vec![FieldError::new("", ErrorCode::Invalid)]))
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use serde::Deserialize;
    use serde_json::json;

    #[derive(Debug, Deserialize, JsonSchema, PartialEq)]
    #[serde(rename_all = "camelCase", deny_unknown_fields)]
    struct Sample {
        #[schemars(length(min = 1, max = 5))]
        display_name: String,
        #[schemars(email)]
        email: Option<String>,
    }

    #[test]
    fn valid_payload_becomes_the_type() {
        let ok = validate::<Sample>(&json!({ "displayName": "Ada", "email": "ada@example.com" }))
            .expect("machinery")
            .expect("valid");
        assert_eq!(
            ok,
            Sample {
                display_name: "Ada".into(),
                email: Some("ada@example.com".into())
            }
        );
        let no_email = validate::<Sample>(&json!({ "displayName": "Ada", "email": null })).unwrap();
        assert!(no_email.is_ok());
    }

    #[test]
    fn every_problem_is_reported_per_field() {
        let errors =
            validate::<Sample>(&json!({ "displayName": "Adalovelace", "email": "nope", "x": 1 }))
                .expect("machinery")
                .expect_err("invalid");
        assert!(errors.contains(&FieldError {
            field: "displayName".into(),
            code: ErrorCode::TooLong,
            limit: Some(5)
        }));
        assert!(errors.contains(&FieldError::new("email", ErrorCode::Email)));
        assert!(errors.contains(&FieldError::new("x", ErrorCode::Unknown)));

        let missing = validate::<Sample>(&json!({}))
            .unwrap()
            .expect_err("missing");
        assert!(
            missing.contains(&FieldError::new("displayName", ErrorCode::Required)),
            "{missing:?}"
        );
        let empty = validate::<Sample>(&json!({ "displayName": "" }))
            .unwrap()
            .expect_err("empty");
        assert!(empty.contains(&FieldError {
            field: "displayName".into(),
            code: ErrorCode::TooShort,
            limit: Some(1)
        }));
    }

    #[test]
    fn schema_carries_the_rules() {
        let schema = schema_of::<Sample>().unwrap();
        assert_eq!(schema["properties"]["displayName"]["maxLength"], 5);
        assert_eq!(schema["properties"]["email"]["format"], "email");
    }
}
