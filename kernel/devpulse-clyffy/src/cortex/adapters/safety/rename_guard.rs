//! Rename Guard — AST-aware reference tracking for safe renames.
//!
//! Replaces CC-007's grep-based rename detection with real AST queries.
//! Given a symbol name and language, finds all references: direct calls,
//! type references, field access, imports, re-exports, and string literals
//! that match the symbol.

#[cfg(feature = "guardian")]
use tree_sitter::{Parser, Query, QueryCursor};
#[cfg(feature = "guardian")]
use streaming_iterator::StreamingIterator;

#[cfg(feature = "guardian")]
use super::language::LangId;

/// A single reference to a symbol found via AST.
#[derive(Debug, Clone)]
pub struct SymbolRef {
    /// What kind of reference this is.
    pub kind: RefKind,
    /// 0-indexed line number.
    pub line: usize,
    /// 0-indexed column.
    pub column: usize,
    /// The matched source text.
    pub text: String,
}

/// Classification of how a symbol is referenced.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RefKind {
    /// Function/method call.
    Call,
    /// Type annotation or generic parameter.
    TypeRef,
    /// Field access (`obj.field`).
    FieldAccess,
    /// Import / use statement.
    Import,
    /// Variable binding or parameter name.
    Binding,
    /// String literal containing the symbol name.
    StringLiteral,
    /// Other identifier match.
    Identifier,
}

/// Find all AST references to `symbol` in the given source code.
///
/// This is language-aware: it parses the AST and classifies each
/// occurrence by how it's used (call, type ref, import, etc.).
///
/// # Errors
///
/// Returns an error if tree-sitter cannot parse the source.
#[cfg(feature = "guardian")]
pub fn find_references(
    lang: LangId,
    source: &str,
    symbol: &str,
) -> anyhow::Result<Vec<SymbolRef>> {
    let mut parser = Parser::new();
    let grammar = lang.grammar();
    parser
        .set_language(&grammar)
        .map_err(|e| anyhow::anyhow!("failed to set language for {}: {e}", lang.name()))?;

    let tree = parser
        .parse(source, None)
        .ok_or_else(|| anyhow::anyhow!("parse returned None for {}", lang.name()))?;

    let root = tree.root_node();
    let mut refs = Vec::new();

    // Build a query that finds all identifiers matching the symbol.
    // We classify them by their parent node type.
    let query_src = match lang {
        LangId::Rust => rust_identifier_query(symbol),
        LangId::TypeScript | LangId::JavaScript => ts_identifier_query(symbol),
        LangId::Python => python_identifier_query(symbol),
        LangId::Go => go_identifier_query(symbol),
        LangId::Java => java_identifier_query(symbol),
        LangId::C => c_identifier_query(symbol),
    };

    if let Ok(query) = Query::new(&grammar, &query_src) {
        let mut cursor = QueryCursor::new();
        let mut matches = cursor.matches(&query, root, source.as_bytes());
        while let Some(qmatch) = matches.next() {
            for capture in qmatch.captures {
                let node = capture.node;
                let text = source
                    .get(node.start_byte()..node.end_byte())
                    .unwrap_or("")
                    .to_string();
                let start = node.start_position();
                let kind = classify_ref(node);

                refs.push(SymbolRef {
                    kind,
                    line: start.row,
                    column: start.column,
                    text,
                });
            }
        }
    }

    // Also search string literals for the symbol name (dynamic refs).
    let string_query_src = string_literal_query(lang, symbol);
    if let Some(sq) = string_query_src {
        if let Ok(query) = Query::new(&grammar, &sq) {
            let mut cursor = QueryCursor::new();
            let mut matches = cursor.matches(&query, root, source.as_bytes());
            while let Some(qmatch) = matches.next() {
                for capture in qmatch.captures {
                    let node = capture.node;
                    let text = source
                        .get(node.start_byte()..node.end_byte())
                        .unwrap_or("")
                        .to_string();
                    let start = node.start_position();

                    refs.push(SymbolRef {
                        kind: RefKind::StringLiteral,
                        line: start.row,
                        column: start.column,
                        text,
                    });
                }
            }
        }
    }

    Ok(refs)
}

/// Classify a node's reference kind based on its parent in the AST.
#[cfg(feature = "guardian")]
fn classify_ref(node: tree_sitter::Node<'_>) -> RefKind {
    let parent_kind = node
        .parent()
        .map(|p| p.kind())
        .unwrap_or("");

    match parent_kind {
        "call_expression" | "macro_invocation" | "method_invocation" => RefKind::Call,
        "type_identifier" | "type_annotation" | "generic_type" | "type_arguments"
        | "scoped_type_identifier" => RefKind::TypeRef,
        "field_expression" | "field_access" | "member_expression" | "selector_expression" => {
            RefKind::FieldAccess
        }
        "use_declaration" | "import_statement" | "import_specifier" | "import_declaration" => {
            RefKind::Import
        }
        "let_declaration" | "parameter" | "short_var_declaration" | "variable_declarator"
        | "formal_parameter" => RefKind::Binding,
        _ => RefKind::Identifier,
    }
}

// ── Per-language identifier queries ─────────────────────────────

#[cfg(feature = "guardian")]
fn rust_identifier_query(symbol: &str) -> String {
    format!(
        r#"[
            (identifier) @id
            (#eq? @id "{symbol}")
        ]"#
    )
}

#[cfg(feature = "guardian")]
fn ts_identifier_query(symbol: &str) -> String {
    format!(
        r#"[
            (identifier) @id
            (#eq? @id "{symbol}")
        ]"#
    )
}

#[cfg(feature = "guardian")]
fn python_identifier_query(symbol: &str) -> String {
    format!(
        r#"[
            (identifier) @id
            (#eq? @id "{symbol}")
        ]"#
    )
}

#[cfg(feature = "guardian")]
fn go_identifier_query(symbol: &str) -> String {
    format!(
        r#"[
            (identifier) @id
            (#eq? @id "{symbol}")
        ]"#
    )
}

#[cfg(feature = "guardian")]
fn java_identifier_query(symbol: &str) -> String {
    format!(
        r#"[
            (identifier) @id
            (#eq? @id "{symbol}")
        ]"#
    )
}

#[cfg(feature = "guardian")]
fn c_identifier_query(symbol: &str) -> String {
    format!(
        r#"[
            (identifier) @id
            (#eq? @id "{symbol}")
        ]"#
    )
}

/// Build a query for string literals containing the symbol name.
/// Returns `None` if the language's string node type isn't handled.
#[cfg(feature = "guardian")]
fn string_literal_query(lang: LangId, symbol: &str) -> Option<String> {
    let node_type = match lang {
        LangId::Rust => "string_literal",
        LangId::TypeScript | LangId::JavaScript => "string",
        LangId::Python => "string",
        LangId::Go => "interpreted_string_literal",
        LangId::Java => "string_literal",
        LangId::C => "string_literal",
    };

    Some(format!(
        r#"
            ({node_type}) @str
            (#match? @str "{symbol}")
        "#
    ))
}
