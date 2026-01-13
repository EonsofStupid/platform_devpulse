// shared/src/types/github.rs

//! GitHub integration types
//!
//! All typed enums for GitHub webhook handling and protection.
//! NO STRINGS - compiler-enforced contracts.

use serde::{Deserialize, Serialize};

/// Git adapter type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum GitAdapter {
    GitHub,
    GitLab,
    Bitbucket,
}

/// Protection rules that can be enabled
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ProtectionRule {
    /// Block commits with secrets/API keys
    BlockSecrets,
    /// Block large files (>5MB)
    BlockLargeFiles,
    /// Warn about code drift from project patterns
    WarnDrift,
    /// Require documentation updates with code changes
    RequireDocSync,
}

/// Result of GitHub check run
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum GitHubCheckResult {
    /// All checks passed
    Pass,
    /// Warnings but allowed to proceed
    Warn { warnings: Vec<String> },
    /// Hard failure - merge blocked
    Fail { violations: Vec<String> },
    /// Low confidence - needs human review
    NeedsReview { context: String },
}

impl GitHubCheckResult {
    /// User-friendly summary for desktop notification
    pub fn summary(&self) -> String {
        match self {
            GitHubCheckResult::Pass => "✅ Gus approved".to_string(),
            GitHubCheckResult::Warn { warnings } => {
                format!("⚠️ Gus noticed {} issue(s)", warnings.len())
            }
            GitHubCheckResult::Fail { violations } => {
                format!("❌ Blocked: {} violation(s)", violations.len())
            }
            GitHubCheckResult::NeedsReview { .. } => {
                "🤔 Gus needs your help".to_string()
            }
        }
    }

    /// GitHub check conclusion enum value
    pub fn github_conclusion(&self) -> &'static str {
        match self {
            GitHubCheckResult::Pass => "success",
            GitHubCheckResult::Warn { .. } => "neutral",
            GitHubCheckResult::Fail { .. } => "failure",
            GitHubCheckResult::NeedsReview { .. } => "action_required",
        }
    }
}
