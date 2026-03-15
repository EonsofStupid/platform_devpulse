//! Outlines-core adapter — structured generation via grammar compilation.
//!
//! Wraps `outlines-core` for building finite-state automata from JSON schemas.
//! Used by the CAG pipeline to constrain LLM output to valid structured formats.

use anyhow::{Context, Result};

/// Outlines structured generation adapter.
///
/// Provides schema → regex → FSA compilation for constraining
/// LLM token generation to valid JSON/code structures.
pub struct OutlinesAdapter {
    _initialized: bool,
}

impl OutlinesAdapter {
    /// Boot the outlines engine.
    ///
    /// Verifies that `outlines-core` can compile a trivial schema
    /// to confirm the engine is functional.
    ///
    /// # Errors
    /// Returns error if the engine fails to initialize.
    pub fn boot() -> Result<Self> {
        // Verify the engine works by compiling a trivial schema
        let test_schema = r#"{"type": "string"}"#;
        let _regex = outlines_core::json_schema::build_regex_from_schema(test_schema, None)
            .context("outlines-core failed to compile test schema during boot")?;

        Ok(Self {
            _initialized: true,
        })
    }

    /// Health check — compile a trivial schema to verify the engine is responsive.
    ///
    /// # Errors
    /// Returns error if schema compilation fails.
    pub fn ping(&self) -> Result<()> {
        let test_schema = r#"{"type": "boolean"}"#;
        let _regex = outlines_core::json_schema::build_regex_from_schema(test_schema, None)
            .context("outlines-core health check failed")?;
        Ok(())
    }

    /// Compile a JSON schema into a regular expression for constrained generation.
    ///
    /// # Errors
    /// Returns error if the schema is invalid or compilation fails.
    pub fn schema_to_regex(&self, json_schema: &str) -> Result<String> {
        outlines_core::json_schema::build_regex_from_schema(json_schema, None)
            .context("Failed to compile JSON schema to regex")
    }
}
