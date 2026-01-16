use serde::{Deserialize, Serialize};

/// Strict Taxonomy of System Roles
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum MinionRole {
    SystemKernel,   // The Core/Root - High Privilege
    Guardian,       // Safety/Verification
    Diary,          // Logging/Observation
    Specialist(String), // Custom Task Agents
}

/// Defined Emotional/Tonal States
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum VoiceTone {
    Objective,  // Pure Facts (Default)
    Empathetic, // Gentle/Teaching
    Strict,     // Warning/Safety
    Concise,    // High-Bandwidth/Expert
}

/// The Persona Data Structure
/// Strongly typed configuration for Minions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Persona {
    pub name: String,
    pub role: MinionRole,
    pub voice_tone: VoiceTone,
    pub instructions: String, // Prompt/Context is still text
}

impl Default for Persona {
    fn default() -> Self {
        Self {
            name: "Maestro Observer".into(),
            role: MinionRole::SystemKernel,
            voice_tone: VoiceTone::Objective,
            instructions: "Monitor system health. Report anomalies.".into(),
        }
    }
}
