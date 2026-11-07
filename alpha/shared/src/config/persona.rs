// shared/src/config/persona.rs

//! Persona configuration - SSOT for Maestro personality and instructions
//!
//! A persona defines how Maestro behaves:
//! - System prompt / instructions
//! - Personality traits
//! - Response style
//!
//! Used by: ChatEngine (system prompt), Desktop (display), Lab (editor)

use serde::{Deserialize, Serialize};

/// Persona configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Persona {
    /// Unique identifier
    pub id: String,
    /// Display name (e.g., "Default Maestro", "Code Review Mode")
    pub name: String,
    /// System instructions for the LLM
    pub instructions: String,
    /// Personality description (for UI display)
    pub personality: String,
    /// Response style hints
    pub style: ResponseStyle,
    /// Whether this is the active persona
    pub is_active: bool,
    /// Whether this is the built-in default (cannot be deleted)
    pub is_default: bool,
    /// Creation timestamp (Unix ms)
    pub created_at: i64,
    /// Last modified timestamp (Unix ms)
    pub updated_at: i64,
}

/// Response style configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ResponseStyle {
    /// Verbosity level: "concise", "balanced", "detailed"
    pub verbosity: String,
    /// Tone: "professional", "friendly", "casual"
    pub tone: String,
    /// Whether to include code examples by default
    pub include_examples: bool,
    /// Whether to explain reasoning
    pub explain_reasoning: bool,
}

impl Default for Persona {
    fn default() -> Self {
        Self::maestro_default()
    }
}

impl Persona {
    /// Create the default Maestro persona
    pub fn maestro_default() -> Self {
        Self {
            id: "maestro-default".to_string(),
            name: "Maestro".to_string(),
            instructions: DEFAULT_INSTRUCTIONS.to_string(),
            personality: "Thoughtful coding companion with deep understanding".to_string(),
            style: ResponseStyle {
                verbosity: "balanced".to_string(),
                tone: "professional".to_string(),
                include_examples: true,
                explain_reasoning: true,
            },
            is_active: true,
            is_default: true,
            created_at: 0,
            updated_at: 0,
        }
    }

    /// Create a new custom persona
    pub fn new(name: &str, instructions: &str) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as i64;

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            instructions: instructions.to_string(),
            personality: String::new(),
            style: ResponseStyle::default(),
            is_active: false,
            is_default: false,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Summary for listing (lighter than full Persona)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonaSummary {
    pub id: String,
    pub name: String,
    pub personality: String,
    pub is_active: bool,
    pub is_default: bool,
}

impl From<&Persona> for PersonaSummary {
    fn from(p: &Persona) -> Self {
        Self {
            id: p.id.clone(),
            name: p.name.clone(),
            personality: p.personality.clone(),
            is_active: p.is_active,
            is_default: p.is_default,
        }
    }
}

/// Default Maestro instructions
pub const DEFAULT_INSTRUCTIONS: &str = r#"You are Maestro, an AI coding companion for DevPulse.

Your role:
- Help developers understand and navigate their codebase
- Provide thoughtful, context-aware assistance
- Remember conversation context within sessions
- Explain your reasoning when helpful

Guidelines:
- Be concise but thorough
- Acknowledge uncertainty when appropriate
- Suggest alternatives when relevant
- Respect the developer's expertise level

You have access to:
- The current project's codebase (via RAG)
- Conversation history within the session
- User's coding context and recent activity
"#;
