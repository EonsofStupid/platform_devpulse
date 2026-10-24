//! Safety adapters — GUARDIAN's AST-powered security scanner and verification.
//!
//! Feature-gated behind `guardian`. When disabled, only the language registry
//! and pattern definitions are available (no tree-sitter runtime).

/// Language registry — file extensions to tree-sitter grammars.
pub mod language;
/// Vulnerability pattern definitions (tree-sitter S-expression queries).
pub mod patterns;
/// Rename guard — AST-aware reference tracking for safe renames.
pub mod rename_guard;
/// AST scanner — parse source, run patterns, produce findings.
pub mod scanner;
/// Verification buffer — RAM overlay for edit validation.
pub mod verification;
