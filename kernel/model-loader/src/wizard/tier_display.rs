//! Tier display metadata — name, description, semantic role.
//!
//! Returns SEMANTIC role keywords (`reasoning`, `observation`, `encoder`, `voice`)
//! NOT CSS token names or hex colors. The frontend maps roles to SD5 tokens via
//! a single `ROLE_TOKENS` constant in `wizard.types.ts`.
//!
//! Why semantic, not presentational:
//! - `reasoning` is a domain concept that survives a redesign
//! - `--accent-purple-main` is a presentation detail that breaks if you rename a token
//! - Rebrand purple → blue: only the frontend ROLE_TOKENS map changes, Rust never moves
//! - Same pattern as React Aria returning ARIA states, not CSS classes

use crate::hardware::auto_config::HardwareTier;
use serde::{Deserialize, Serialize};

/// Semantic role for visual coding. Frontend maps to SD5 design tokens.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum TierRole {
    /// Workstation tier — purple, top-of-line
    Workstation,
    /// Prosumer tier — cyan, brand primary
    Prosumer,
    /// Mainstream tier — green, healthy default
    Mainstream,
    /// Entry tier — gold, capable but constrained
    Entry,
    /// CPU mode — coral, fallback
    CpuMode,
    /// Minimal tier — salmon, last resort
    Minimal,
}

/// Display metadata for a hardware tier.
///
/// All user-facing strings. Frontend renders these directly inside ColdLight
/// `<Heading>`, `<Text>`, `<Badge>` components.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct TierDisplay {
    /// Layman tier name shown on the badge (e.g. "Mainstream", "Workstation").
    pub name: String,
    /// One-line description shown under the badge name (e.g. "All models at full quality").
    pub description: String,
    /// Semantic role for color coding. Frontend maps to SD5 tokens.
    pub role: TierRole,
    /// Educational tooltip explaining what this tier means.
    pub tooltip: String,
}

impl HardwareTier {
    /// Returns layman display metadata for this tier.
    ///
    /// All strings are hardcoded defaults. To override, edit
    /// `wizard_copy.toml` and the frontend reads from `get_wizard_copy` instead.
    #[must_use]
    pub fn display(&self) -> TierDisplay {
        match self {
            Self::High => TierDisplay {
                name: "Workstation".into(),
                description: "All models at full quality".into(),
                role: TierRole::Workstation,
                tooltip: "Your GPU has 24GB+ VRAM. You can run the largest models and keep multiple loaded at once.".into(),
            },
            Self::JessePrimary => TierDisplay {
                name: "Prosumer".into(),
                description: "Large models, multi-model loading".into(),
                role: TierRole::Prosumer,
                tooltip: "16GB VRAM is excellent. You can run 9B parameter models and keep 2-3 loaded.".into(),
            },
            Self::Mid => TierDisplay {
                name: "Mainstream".into(),
                description: "Most models, all features".into(),
                role: TierRole::Mainstream,
                tooltip: "12GB VRAM handles most models well. We'll pick sizes that leave room for voice and vision.".into(),
            },
            Self::Floor => TierDisplay {
                name: "Entry".into(),
                description: "Smaller models, voice on-demand".into(),
                role: TierRole::Entry,
                tooltip: "8GB VRAM can run smaller models. Voice loads on-demand to save memory.".into(),
            },
            Self::Minimal => TierDisplay {
                name: "Minimal".into(),
                description: "Micro-models only".into(),
                role: TierRole::Minimal,
                tooltip: "Limited resources. We'll use the smallest available models.".into(),
            },
            Self::CpuOnly => TierDisplay {
                name: "CPU Mode".into(),
                description: "Slower but works".into(),
                role: TierRole::CpuMode,
                tooltip: "No dedicated GPU detected. Models run on CPU — slower but fully functional.".into(),
            },
        }
    }
}
