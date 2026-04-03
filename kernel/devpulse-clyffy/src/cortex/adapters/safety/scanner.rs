//! AST Scanner — parses source files and runs vulnerability queries.
//!
//! The scanner is the core engine: given source code and a language, it
//! produces a tree-sitter AST, runs all matching [`VulnPattern`] queries,
//! and returns structured findings. No regex. Real AST.

#[cfg(feature = "guardian")]
use tree_sitter::{Parser, Query, QueryCursor};
#[cfg(feature = "guardian")]
use streaming_iterator::StreamingIterator;

use super::language::LangId;
use super::patterns::patterns_for_lang;

/// A single finding from an AST scan.
#[derive(Debug, Clone)]
pub struct Finding {
    /// The pattern that matched.
    pub pattern_id: &'static str,
    /// Human-readable description.
    pub description: &'static str,
    /// Severity level.
    pub severity: &'static str,
    /// 0-indexed start byte in source.
    pub start_byte: usize,
    /// 0-indexed end byte in source.
    pub end_byte: usize,
    /// 0-indexed start line.
    pub start_line: usize,
    /// 0-indexed start column.
    pub start_col: usize,
    /// The matched source text.
    pub matched_text: String,
}

/// Result of scanning a single file.
#[derive(Debug)]
pub struct ScanResult {
    /// Language that was parsed.
    pub lang: LangId,
    /// Findings (vulnerabilities detected).
    pub findings: Vec<Finding>,
}

/// Parse source code and run all vulnerability patterns for the given language.
///
/// Returns `Err` if the parser fails to set the language or parse the source.
///
/// # Errors
///
/// Returns an error if tree-sitter cannot parse the source.
#[cfg(feature = "guardian")]
pub fn scan_source(lang: LangId, source: &str) -> anyhow::Result<ScanResult> {
    let mut parser = Parser::new();
    parser
        .set_language(&lang.grammar())
        .map_err(|e| anyhow::anyhow!("failed to set tree-sitter language for {}: {e}", lang.name()))?;

    let tree = parser
        .parse(source, None)
        .ok_or_else(|| anyhow::anyhow!("tree-sitter parse returned None for {}", lang.name()))?;

    let root = tree.root_node();
    let patterns = patterns_for_lang(lang);
    let mut findings = Vec::new();

    for pattern in &patterns {
        match Query::new(&lang.grammar(), pattern.query) {
            Ok(query) => {
                let match_idx = query
                    .capture_names()
                    .iter()
                    .position(|name| *name == "match");

                let mut cursor = QueryCursor::new();
                let mut matches = cursor.matches(&query, root, source.as_bytes());
                while let Some(qmatch) = matches.next() {
                    // Use the @match capture if present, otherwise the first capture.
                    let capture = match match_idx {
                        Some(idx) => qmatch.captures.iter().find(|c| c.index as usize == idx),
                        None => qmatch.captures.first(),
                    };

                    if let Some(cap) = capture {
                        let node = cap.node;
                        let start = node.start_position();
                        let matched_text = source
                            .get(node.start_byte()..node.end_byte())
                            .unwrap_or("")
                            .to_string();

                        findings.push(Finding {
                            pattern_id: pattern.id,
                            description: pattern.description,
                            severity: pattern.severity,
                            start_byte: node.start_byte(),
                            end_byte: node.end_byte(),
                            start_line: start.row,
                            start_col: start.column,
                            matched_text,
                        });
                    }
                }
            }
            Err(e) => {
                tracing::warn!(
                    pattern_id = pattern.id,
                    lang = lang.name(),
                    "invalid tree-sitter query: {e}"
                );
            }
        }
    }

    Ok(ScanResult { lang, findings })
}

/// Scan a file by reading it from disk. Detects language from extension.
///
/// Returns `None` if the file extension is unsupported.
///
/// # Errors
///
/// Returns an error if the file cannot be read or parsed.
#[cfg(feature = "guardian")]
pub fn scan_file(path: &std::path::Path) -> anyhow::Result<Option<ScanResult>> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let lang = match super::language::lang_from_extension(ext) {
        Some(l) => l,
        None => return Ok(None),
    };

    let source = std::fs::read_to_string(path)?;
    scan_source(lang, &source).map(Some)
}

/// Batch-scan multiple files. Skips unsupported extensions silently.
///
/// # Errors
///
/// Returns errors for individual files that fail to read/parse.
#[cfg(feature = "guardian")]
pub fn scan_files(paths: &[std::path::PathBuf]) -> Vec<(std::path::PathBuf, anyhow::Result<ScanResult>)> {
    let mut results = Vec::with_capacity(paths.len());
    for path in paths {
        match scan_file(path) {
            Ok(Some(result)) => results.push((path.clone(), Ok(result))),
            Ok(None) => {} // unsupported extension, skip
            Err(e) => results.push((path.clone(), Err(e))),
        }
    }
    results
}
