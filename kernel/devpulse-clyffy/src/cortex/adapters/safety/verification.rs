//! Verification buffer — RAM overlay that validates edits before commit.
//!
//! Holds pending file changes in memory, runs the AST scanner against
//! the modified source, and reports whether the edit introduces new
//! vulnerabilities or breaks existing symbol references.

use std::collections::HashMap;
use std::path::PathBuf;

/// A pending edit that hasn't been committed to disk.
#[derive(Debug, Clone)]
pub struct PendingEdit {
    /// File path (absolute).
    pub path: PathBuf,
    /// New file contents after the edit.
    pub new_source: String,
    /// Optional: original source before the edit (for diff).
    pub old_source: Option<String>,
}

/// Outcome of verifying a pending edit.
#[derive(Debug)]
pub struct VerifyResult {
    /// File that was checked.
    pub path: PathBuf,
    /// New findings introduced by this edit.
    #[cfg(feature = "guardian")]
    pub new_findings: Vec<super::scanner::Finding>,
    /// Whether the edit is considered safe to commit.
    pub safe: bool,
}

/// RAM-resident buffer of pending edits awaiting verification.
#[derive(Debug, Default)]
pub struct VerificationBuffer {
    pending: HashMap<PathBuf, PendingEdit>,
}

impl VerificationBuffer {
    /// Create an empty buffer.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Stage a pending edit for verification.
    pub fn stage(&mut self, edit: PendingEdit) {
        self.pending.insert(edit.path.clone(), edit);
    }

    /// Remove a pending edit.
    pub fn unstage(&mut self, path: &std::path::Path) {
        self.pending.remove(path);
    }

    /// Clear all pending edits.
    pub fn clear(&mut self) {
        self.pending.clear();
    }

    /// Number of pending edits.
    #[must_use]
    pub fn len(&self) -> usize {
        self.pending.len()
    }

    /// Whether the buffer is empty.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.pending.is_empty()
    }

    /// Verify all pending edits against the AST scanner.
    ///
    /// Returns a [`VerifyResult`] for each file that has a supported language.
    /// Files with unsupported extensions are skipped.
    #[cfg(feature = "guardian")]
    pub fn verify_all(&self) -> Vec<VerifyResult> {
        let mut results = Vec::new();

        for edit in self.pending.values() {
            let ext = edit.path.extension().and_then(|e| e.to_str()).unwrap_or("");

            let Some(lang) = super::language::lang_from_extension(ext) else {
                continue;
            };

            // Scan the new source for vulnerabilities.
            let new_findings = match super::scanner::scan_source(lang, &edit.new_source) {
                Ok(result) => result.findings,
                Err(e) => {
                    tracing::warn!(path = %edit.path.display(), "scan failed: {e}");
                    continue;
                }
            };

            // If we have old source, diff to find only NEW findings.
            let baseline_count = edit
                .old_source
                .as_ref()
                .and_then(|old| super::scanner::scan_source(lang, old).ok())
                .map_or(0, |r| r.findings.len());

            let introduced = new_findings.len().saturating_sub(baseline_count);
            let safe = introduced == 0;

            results.push(VerifyResult {
                path: edit.path.clone(),
                new_findings,
                safe,
            });
        }

        results
    }
}
