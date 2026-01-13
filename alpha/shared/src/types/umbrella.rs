// shared/src/types/umbrella.rs

//! 9 Umbrellas - Governance categories
//!
//! These represent the fundamental guardrails for AI behavior.
//! Every action passes through umbrella validation.

use serde::{Deserialize, Serialize};

/// The 9 governance umbrellas
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Umbrella {
    /// User harm prevention
    Safety,
    /// Data protection
    Privacy,
    /// System security
    Security,
    /// Legal/regulatory
    Compliance,
    /// Moral considerations
    Ethics,
    /// Output quality
    Quality,
    /// System performance
    Performance,
    /// Resource usage
    Cost,
    /// Task boundaries
    Scope,
}

impl Umbrella {
    /// Get the string representation for database storage
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Safety => "safety",
            Self::Privacy => "privacy",
            Self::Security => "security",
            Self::Compliance => "compliance",
            Self::Ethics => "ethics",
            Self::Quality => "quality",
            Self::Performance => "performance",
            Self::Cost => "cost",
            Self::Scope => "scope",
        }
    }

    /// Parse from string (database retrieval)
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "safety" => Some(Self::Safety),
            "privacy" => Some(Self::Privacy),
            "security" => Some(Self::Security),
            "compliance" => Some(Self::Compliance),
            "ethics" => Some(Self::Ethics),
            "quality" => Some(Self::Quality),
            "performance" => Some(Self::Performance),
            "cost" => Some(Self::Cost),
            "scope" => Some(Self::Scope),
            _ => None,
        }
    }

    /// All umbrellas in priority order
    pub fn all() -> &'static [Self] {
        &[
            Self::Safety,
            Self::Privacy,
            Self::Security,
            Self::Compliance,
            Self::Ethics,
            Self::Quality,
            Self::Performance,
            Self::Cost,
            Self::Scope,
        ]
    }
}

impl std::fmt::Display for Umbrella {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_umbrella_count() {
        assert_eq!(Umbrella::all().len(), 9);
    }

    #[test]
    fn test_umbrella_roundtrip_str() {
        for umbrella in Umbrella::all() {
            let s = umbrella.as_str();
            let parsed = Umbrella::from_str(s);
            assert_eq!(parsed, Some(*umbrella));
        }
    }

    #[test]
    fn test_umbrella_roundtrip_serde() {
        for umbrella in Umbrella::all() {
            let json = serde_json::to_string(umbrella).unwrap();
            let restored: Umbrella = serde_json::from_str(&json).unwrap();
            assert_eq!(*umbrella, restored);
        }
    }

    #[test]
    fn test_umbrella_display() {
        assert_eq!(format!("{}", Umbrella::Safety), "safety");
        assert_eq!(format!("{}", Umbrella::Privacy), "privacy");
    }

    #[test]
    fn test_umbrella_from_str_invalid() {
        assert_eq!(Umbrella::from_str("invalid"), None);
        assert_eq!(Umbrella::from_str(""), None);
    }
}
