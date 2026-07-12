//! Vulnerability pattern definitions — tree-sitter S-expression queries.
//!
//! Each pattern targets a structural vulnerability class from G-018.
//! Patterns are language-specific tree-sitter queries that match dangerous
//! AST structures. GUARDIAN runs these against parsed source to surface
//! real security issues, not regex approximations.

use super::language::LangId;

/// A named vulnerability pattern with a tree-sitter query.
#[derive(Debug, Clone)]
pub struct VulnPattern {
    /// Unique identifier (e.g. `"G018-RUST-001"`).
    pub id: &'static str,
    /// Human-readable description of what this detects.
    pub description: &'static str,
    /// Severity: `"critical"`, `"high"`, `"medium"`, `"low"`.
    pub severity: &'static str,
    /// Which language this pattern targets.
    pub lang: LangId,
    /// Tree-sitter S-expression query. Capture `@match` is the flagged node.
    pub query: &'static str,
}

/// All registered vulnerability patterns.
///
/// Organized by G-018 categories:
/// 1. Broken access control
/// 2. Unauthenticated endpoints
/// 3. Missing input validation
/// 4. Business logic flaws
/// 5. JWT/OAuth misuse
/// 6. Missing rate limiting
/// 7. IDOR (direct object references)
/// 8. Client-only validation
/// 9. Unsafe unwrap in production
/// 10. SQL injection surface
pub const PATTERNS: &[VulnPattern] = &[
    // ── Rust ────────────────────────────────────────────────────
    VulnPattern {
        id: "G018-RUST-001",
        description: "unwrap() in production code — use `?` or explicit error handling",
        severity: "high",
        lang: LangId::Rust,
        query: r#"
            (call_expression
              function: (field_expression
                field: (field_identifier) @method)
              (#eq? @method "unwrap")) @match
        "#,
    },
    VulnPattern {
        id: "G018-RUST-002",
        description: "Raw SQL string interpolation — potential SQL injection",
        severity: "critical",
        lang: LangId::Rust,
        query: r#"
            (macro_invocation
              macro: (identifier) @macro_name
              (#match? @macro_name "^(format|format_args)$")
              (token_tree
                (string_literal) @sql_str
                (#match? @sql_str "(SELECT|INSERT|UPDATE|DELETE|DROP)"))) @match
        "#,
    },
    VulnPattern {
        id: "G018-RUST-003",
        description: "expect() with non-descriptive message — use `?` or proper error context",
        severity: "medium",
        lang: LangId::Rust,
        query: r#"
            (call_expression
              function: (field_expression
                field: (field_identifier) @method)
              (#eq? @method "expect")) @match
        "#,
    },
    VulnPattern {
        id: "G018-RUST-004",
        description: "Unsafe block detected — requires manual audit",
        severity: "high",
        lang: LangId::Rust,
        query: r"
            (unsafe_block) @match
        ",
    },
    // ── TypeScript / JavaScript ─────────────────────────────────
    VulnPattern {
        id: "G018-TS-001",
        description: "eval() call — arbitrary code execution risk",
        severity: "critical",
        lang: LangId::TypeScript,
        query: r#"
            (call_expression
              function: (identifier) @fn_name
              (#eq? @fn_name "eval")) @match
        "#,
    },
    VulnPattern {
        id: "G018-TS-002",
        description: "innerHTML assignment — XSS vulnerability",
        severity: "critical",
        lang: LangId::TypeScript,
        query: r#"
            (assignment_expression
              left: (member_expression
                property: (property_identifier) @prop)
              (#eq? @prop "innerHTML")) @match
        "#,
    },
    VulnPattern {
        id: "G018-JS-001",
        description: "eval() call — arbitrary code execution risk",
        severity: "critical",
        lang: LangId::JavaScript,
        query: r#"
            (call_expression
              function: (identifier) @fn_name
              (#eq? @fn_name "eval")) @match
        "#,
    },
    VulnPattern {
        id: "G018-JS-002",
        description: "innerHTML assignment — XSS vulnerability",
        severity: "critical",
        lang: LangId::JavaScript,
        query: r#"
            (assignment_expression
              left: (member_expression
                property: (property_identifier) @prop)
              (#eq? @prop "innerHTML")) @match
        "#,
    },
    // ── Python ──────────────────────────────────────────────────
    VulnPattern {
        id: "G018-PY-001",
        description: "eval() / exec() call — arbitrary code execution",
        severity: "critical",
        lang: LangId::Python,
        query: r#"
            (call
              function: (identifier) @fn_name
              (#match? @fn_name "^(eval|exec)$")) @match
        "#,
    },
    VulnPattern {
        id: "G018-PY-002",
        description: "subprocess.shell=True — command injection risk",
        severity: "critical",
        lang: LangId::Python,
        query: r#"
            (call
              function: (attribute
                object: (identifier) @mod
                attribute: (identifier) @fn)
              (#eq? @mod "subprocess")
              arguments: (argument_list
                (keyword_argument
                  name: (identifier) @kwarg
                  (#eq? @kwarg "shell")
                  value: (true) @val))) @match
        "#,
    },
    VulnPattern {
        id: "G018-PY-003",
        description: "pickle.loads — deserialization of untrusted data",
        severity: "high",
        lang: LangId::Python,
        query: r#"
            (call
              function: (attribute
                object: (identifier) @mod
                attribute: (identifier) @fn)
              (#eq? @mod "pickle")
              (#eq? @fn "loads")) @match
        "#,
    },
    // ── Go ──────────────────────────────────────────────────────
    VulnPattern {
        id: "G018-GO-001",
        description: "Unhandled error — Go error must be checked",
        severity: "high",
        lang: LangId::Go,
        query: r#"
            (short_var_declaration
              left: (expression_list
                (identifier) @err_var)
              (#eq? @err_var "_")
              right: (expression_list
                (call_expression))) @match
        "#,
    },
    VulnPattern {
        id: "G018-GO-002",
        description: "fmt.Sprintf in SQL query — potential SQL injection",
        severity: "critical",
        lang: LangId::Go,
        query: r#"
            (call_expression
              function: (selector_expression
                operand: (identifier) @pkg
                field: (field_identifier) @fn)
              (#eq? @pkg "fmt")
              (#eq? @fn "Sprintf")
              arguments: (argument_list
                (interpreted_string_literal) @sql
                (#match? @sql "(SELECT|INSERT|UPDATE|DELETE)"))) @match
        "#,
    },
    // ── Java ────────────────────────────────────────────────────
    VulnPattern {
        id: "G018-JAVA-001",
        description: "Runtime.exec() — command injection risk",
        severity: "critical",
        lang: LangId::Java,
        query: r#"
            (method_invocation
              object: (method_invocation
                object: (identifier) @cls
                name: (identifier) @getter
                (#eq? @cls "Runtime")
                (#eq? @getter "getRuntime"))
              name: (identifier) @method
              (#eq? @method "exec")) @match
        "#,
    },
    VulnPattern {
        id: "G018-JAVA-002",
        description: "String concatenation in SQL — SQL injection",
        severity: "critical",
        lang: LangId::Java,
        query: r#"
            (method_invocation
              name: (identifier) @method
              (#match? @method "^(executeQuery|executeUpdate|execute)$")
              arguments: (argument_list
                (binary_expression
                  operator: "+"))) @match
        "#,
    },
    // ── C ───────────────────────────────────────────────────────
    VulnPattern {
        id: "G018-C-001",
        description: "gets() — buffer overflow, banned function",
        severity: "critical",
        lang: LangId::C,
        query: r#"
            (call_expression
              function: (identifier) @fn_name
              (#eq? @fn_name "gets")) @match
        "#,
    },
    VulnPattern {
        id: "G018-C-002",
        description: "strcpy() without bounds check — buffer overflow risk",
        severity: "high",
        lang: LangId::C,
        query: r#"
            (call_expression
              function: (identifier) @fn_name
              (#eq? @fn_name "strcpy")) @match
        "#,
    },
    VulnPattern {
        id: "G018-C-003",
        description: "sprintf() — format string / overflow risk, use snprintf",
        severity: "high",
        lang: LangId::C,
        query: r#"
            (call_expression
              function: (identifier) @fn_name
              (#eq? @fn_name "sprintf")) @match
        "#,
    },
];

/// Return all patterns for a given language.
#[must_use]
pub fn patterns_for_lang(lang: LangId) -> Vec<&'static VulnPattern> {
    PATTERNS.iter().filter(|p| p.lang == lang).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn has_patterns_for_all_languages() {
        for lang in LangId::ALL {
            let pats = patterns_for_lang(*lang);
            assert!(
                !pats.is_empty(),
                "no vulnerability patterns for {}",
                lang.name()
            );
        }
    }

    #[test]
    fn pattern_ids_unique() {
        let mut ids: Vec<&str> = PATTERNS.iter().map(|p| p.id).collect();
        ids.sort_unstable();
        ids.dedup();
        assert_eq!(ids.len(), PATTERNS.len(), "duplicate pattern IDs found");
    }
}
