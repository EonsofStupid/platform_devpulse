//! Language registry — maps file extensions to tree-sitter grammars.
//!
//! Each supported language gets a [`LanguageEntry`] that pairs the grammar
//! with the set of file extensions it handles. The registry is the single
//! source of truth for "can GUARDIAN parse this file?"

#[cfg(feature = "guardian")]
use tree_sitter::Language;

/// Identifier for a supported language.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum LangId {
    /// The Rust programming language.
    Rust,
    /// The TypeScript programming language.
    TypeScript,
    /// The JavaScript programming language.
    JavaScript,
    /// The Python programming language.
    Python,
    /// The Go programming language.
    Go,
    /// The Java programming language.
    Java,
    /// The C programming language.
    C,
}

impl LangId {
    /// All supported language identifiers.
    pub const ALL: &[Self] = &[
        Self::Rust,
        Self::TypeScript,
        Self::JavaScript,
        Self::Python,
        Self::Go,
        Self::Java,
        Self::C,
    ];

    /// Human-readable name.
    #[must_use]
    pub const fn name(self) -> &'static str {
        match self {
            Self::Rust => "Rust",
            Self::TypeScript => "TypeScript",
            Self::JavaScript => "JavaScript",
            Self::Python => "Python",
            Self::Go => "Go",
            Self::Java => "Java",
            Self::C => "C",
        }
    }

    /// File extensions (without leading dot) that map to this language.
    #[must_use]
    pub const fn extensions(self) -> &'static [&'static str] {
        match self {
            Self::Rust => &["rs"],
            Self::TypeScript => &["ts", "tsx", "mts", "cts"],
            Self::JavaScript => &["js", "jsx", "mjs", "cjs"],
            Self::Python => &["py", "pyi"],
            Self::Go => &["go"],
            Self::Java => &["java"],
            Self::C => &["c", "h"],
        }
    }

    /// Load the tree-sitter [`Language`] grammar for this language.
    #[cfg(feature = "guardian")]
    #[must_use]
    pub fn grammar(self) -> Language {
        match self {
            Self::Rust => tree_sitter_rust::LANGUAGE.into(),
            Self::TypeScript => tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into(),
            Self::JavaScript => tree_sitter_javascript::LANGUAGE.into(),
            Self::Python => tree_sitter_python::LANGUAGE.into(),
            Self::Go => tree_sitter_go::LANGUAGE.into(),
            Self::Java => tree_sitter_java::LANGUAGE.into(),
            Self::C => tree_sitter_c::LANGUAGE.into(),
        }
    }
}

/// Resolve a file extension (without dot) to a [`LangId`].
///
/// Returns `None` for unsupported extensions.
#[must_use]
pub fn lang_from_extension(ext: &str) -> Option<LangId> {
    let ext_lower = ext.to_ascii_lowercase();
    for lang in LangId::ALL {
        if lang.extensions().iter().any(|e| *e == ext_lower) {
            return Some(*lang);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extension_lookup() {
        assert_eq!(lang_from_extension("rs"), Some(LangId::Rust));
        assert_eq!(lang_from_extension("tsx"), Some(LangId::TypeScript));
        assert_eq!(lang_from_extension("py"), Some(LangId::Python));
        assert_eq!(lang_from_extension("go"), Some(LangId::Go));
        assert_eq!(lang_from_extension("java"), Some(LangId::Java));
        assert_eq!(lang_from_extension("c"), Some(LangId::C));
        assert_eq!(lang_from_extension("h"), Some(LangId::C));
        assert_eq!(lang_from_extension("zig"), None);
    }
}
