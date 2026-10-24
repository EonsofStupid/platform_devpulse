//! Step tooltips — structural explanations of what each UI element means.
//!
//! Static tooltips live in `WizardCopy` (the WHAT — "Your graphics card. AI models run on GPU...").
//! Dynamic educational content comes from the `knowledge_drops` table (the WHY/CONTEXT —
//! "Did you know GPT stands for Generative Pre-trained Transformer?").
//!
//! This module exposes a query interface that returns BOTH for any element ID.

use serde::{Deserialize, Serialize};

/// A single tooltip entry — short structural label + optional knowledge drop.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct TooltipEntry {
    /// Element identifier (e.g. "hardware.gpu", "models.vram").
    pub element_id: String,
    /// Short structural explanation (1-2 sentences).
    pub label: String,
    /// Optional educational/context fact for layered tooltip display.
    pub knowledge_drop: Option<String>,
}

/// Tooltips for a single wizard step.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct StepTooltips {
    /// Step identifier (e.g. "hardware", "models", "browse").
    pub step_id: String,
    /// All tooltip entries for this step.
    pub entries: Vec<TooltipEntry>,
}
