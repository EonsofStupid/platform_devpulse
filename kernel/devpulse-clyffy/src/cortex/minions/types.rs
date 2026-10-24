//! Minion roles, voice tones and the minion persona.

use serde::{Deserialize, Serialize};

/// Strict Taxonomy of System Roles
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum MinionRole {
    /// The Core/Root - High Privilege
    SystemKernel,
    /// Safety/Verification
    Guardian,
    /// Logging/Observation
    Diary,
    /// Custom Task Agents
    Specialist(String),
}

/// Defined Emotional/Tonal States. Also the tone of a persona a seat speaks
/// as (`crate::rooms::persona`), by its lowercase name.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum VoiceTone {
    /// Pure Facts (Default)
    Objective,
    /// Gentle/Teaching
    Empathetic,
    /// Warning/Safety
    Strict,
    /// High-Bandwidth/Expert
    Concise,
}

/// The Persona Data Structure
/// Strongly typed configuration for Minions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Persona {
    /// The minion's name.
    pub name: String,
    /// Its system role.
    pub role: MinionRole,
    /// How it speaks.
    pub voice_tone: VoiceTone,
    /// Prompt/Context is still text
    pub instructions: String,
}

impl Default for Persona {
    fn default() -> Self {
        Self {
            name: "Clyffy Observer".into(),
            role: MinionRole::SystemKernel,
            voice_tone: VoiceTone::Objective,
            instructions: "Monitor system health. Report anomalies.".into(),
        }
    }
}
