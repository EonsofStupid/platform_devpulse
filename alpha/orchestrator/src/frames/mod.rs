// orchestrator/src/frames/mod.rs

//! Frames - Ephemeral Personas
//!
//! Frames are short-lived personas that spawn for ONE hop and then die.
//! They provide specialized perspective/expertise for that hop.
//!
//! FrameTemplate.spawn() -> Frame (lives for one hop)
//! After hop completes -> Frame is killed

pub mod catalog;

use shared::types::ids::FrameId;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Template for spawning frames
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameTemplate {
    /// Unique identifier for this template
    pub id: String,
    /// Human-readable name
    pub name: String,
    /// System prompt prefix
    pub system_prompt: String,
    /// Personality traits
    pub traits: Vec<String>,
    /// Expertise domains
    pub domains: Vec<String>,
    /// Communication style modifiers
    pub style: FrameStyle,
}

/// Style modifiers for a frame
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameStyle {
    /// Formality level (0.0 = casual, 1.0 = formal)
    pub formality: f32,
    /// Verbosity level (0.0 = terse, 1.0 = verbose)
    pub verbosity: f32,
    /// Confidence level (0.0 = uncertain, 1.0 = assertive)
    pub confidence: f32,
}

impl Default for FrameStyle {
    fn default() -> Self {
        Self {
            formality: 0.5,
            verbosity: 0.5,
            confidence: 0.7,
        }
    }
}

/// An ephemeral frame instance (lives for ONE hop)
#[derive(Debug)]
pub struct Frame {
    /// Unique ID for this frame instance
    pub id: FrameId,
    /// Template this frame was spawned from
    pub template_id: String,
    /// The assembled system prompt
    pub system_prompt: String,
    /// Whether this frame is still alive
    alive: bool,
}

impl Frame {
    /// Get the system prompt for this frame
    pub fn prompt(&self) -> &str {
        &self.system_prompt
    }

    /// Check if frame is alive
    pub fn is_alive(&self) -> bool {
        self.alive
    }

    /// Kill this frame (called after hop completes)
    pub fn kill(&mut self) {
        self.alive = false;
    }
}

/// Manager for frame templates and instances
pub struct FrameManager {
    templates: HashMap<String, FrameTemplate>,
}

impl FrameManager {
    pub fn new() -> Self {
        let mut manager = Self {
            templates: HashMap::new(),
        };
        // Load built-in templates
        manager.load_catalog();
        manager
    }

    /// Load templates from catalog
    fn load_catalog(&mut self) {
        // Add built-in templates
        self.register(catalog::architect());
        self.register(catalog::supportive_ally());
        self.register(catalog::devil_advocate());
        self.register(catalog::pragmatist());
    }

    /// Register a template
    pub fn register(&mut self, template: FrameTemplate) {
        self.templates.insert(template.id.clone(), template);
    }

    /// Spawn a frame from a template
    pub fn spawn(&self, template_id: &str) -> Option<Frame> {
        let template = self.templates.get(template_id)?;

        Some(Frame {
            id: FrameId::new(),
            template_id: template.id.clone(),
            system_prompt: self.build_prompt(template),
            alive: true,
        })
    }

    /// Build the system prompt from template
    fn build_prompt(&self, template: &FrameTemplate) -> String {
        let mut prompt = template.system_prompt.clone();

        if !template.traits.is_empty() {
            prompt.push_str("\n\nPersonality traits:\n");
            for trait_ in &template.traits {
                prompt.push_str("- ");
                prompt.push_str(trait_);
                prompt.push('\n');
            }
        }

        if !template.domains.is_empty() {
            prompt.push_str("\nExpertise domains:\n");
            for domain in &template.domains {
                prompt.push_str("- ");
                prompt.push_str(domain);
                prompt.push('\n');
            }
        }

        prompt
    }

    /// Get all available template IDs
    pub fn available_templates(&self) -> Vec<&str> {
        self.templates.keys().map(|s| s.as_str()).collect()
    }

    /// Select best template for a given context
    pub fn select_for_context(&self, _context: &str) -> Option<&str> {
        // TODO: Implement template selection based on context
        // For now, default to architect
        Some("architect")
    }
}

impl Default for FrameManager {
    fn default() -> Self {
        Self::new()
    }
}
