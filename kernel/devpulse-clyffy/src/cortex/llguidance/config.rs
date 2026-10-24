//! Grammar configuration owned by the kernel.
//!
//! `llguidance` is a kernel/runtime concern. The engine may expose it through
//! facade-safe types, but the canonical configuration shape lives here.

use serde::{Deserialize, Serialize};

/// Canonical grammar backend identifier for upstream llguidance.
pub const DEFAULT_GRAMMAR_KIND: &str = "llguidance";

/// Kernel-owned grammar / constrained decoding configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrammarConfig {
    /// Whether constrained decoding is enabled.
    #[serde(default)]
    pub enabled: bool,
    /// Whether boot should fail if grammar initialization fails.
    #[serde(default)]
    pub critical: bool,
    /// Grammar backend identifier.
    #[serde(default = "default_grammar_kind")]
    pub kind: String,
}

fn default_grammar_kind() -> String {
    DEFAULT_GRAMMAR_KIND.to_string()
}

impl Default for GrammarConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            critical: false,
            kind: default_grammar_kind(),
        }
    }
}
