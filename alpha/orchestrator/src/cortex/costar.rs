// orchestrator/src/cortex/costar.rs

//! COSTAR+ Builder - Context-Augmented Generation
//!
//! CAG = assemble context BEFORE the hop (not RAG during).
//! COSTAR+ format:
//! - Context: What we know
//! - Objective: What we want
//! - Style: How to communicate
//! - Tone: Emotional register
//! - Audience: Who we're talking to
//! - Response: Expected format
//! - Plus: Additional constraints, examples

use shared::types::profile::CollectionSet;
use crate::types::Toon;
use serde::{Deserialize, Serialize};

/// COSTAR+ context structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostarContext {
    /// What we know (assembled from collections)
    pub context: String,
    /// What we want to achieve
    pub objective: String,
    /// Communication style
    pub style: String,
    /// Emotional register
    pub tone: String,
    /// Who we're addressing
    pub audience: String,
    /// Expected response format
    pub response_format: String,
    /// Additional constraints
    pub constraints: Vec<String>,
    /// Examples (few-shot)
    pub examples: Vec<Example>,
}

/// Few-shot example
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Example {
    pub input: String,
    pub output: String,
}

/// Builder for assembling COSTAR+ context
pub struct CostarBuilder {
    context_parts: Vec<String>,
    objective: Option<String>,
    style: String,
    tone: String,
    audience: String,
    response_format: String,
    constraints: Vec<String>,
    examples: Vec<Example>,
}

impl Default for CostarBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl CostarBuilder {
    pub fn new() -> Self {
        Self {
            context_parts: Vec::new(),
            objective: None,
            style: "technical".to_string(),
            tone: "helpful".to_string(),
            audience: "developer".to_string(),
            response_format: "structured".to_string(),
            constraints: Vec::new(),
            examples: Vec::new(),
        }
    }

    /// Add context from a toon
    pub fn with_toon(mut self, toon: &Toon) -> Self {
        // Extract signal-specific context
        let signal_context = format!("Signal: {:?}", toon.signal);
        self.context_parts.push(signal_context);

        if let Some(ref project_id) = toon.project_id {
            self.context_parts.push(format!("Project: {}", project_id));
        }

        self
    }

    /// Add context from collections (CAG - done BEFORE hop)
    pub async fn with_collections(self, collections: CollectionSet) -> Self {
        // TODO: Query RRO for relevant context from each collection
        // For now, just log what collections were requested
        let _ = collections; // Suppress unused warning until implemented

        // TODO: Implement actual collection queries:
        // if collections.contains(CollectionSet::CODE) { ... }
        // if collections.contains(CollectionSet::DOCS) { ... }
        // if collections.contains(CollectionSet::HISTORY) { ... }
        // if collections.contains(CollectionSet::MEMORY) { ... }

        self
    }

    /// Set the objective
    pub fn with_objective(mut self, objective: impl Into<String>) -> Self {
        self.objective = Some(objective.into());
        self
    }

    /// Set communication style
    pub fn with_style(mut self, style: impl Into<String>) -> Self {
        self.style = style.into();
        self
    }

    /// Set tone
    pub fn with_tone(mut self, tone: impl Into<String>) -> Self {
        self.tone = tone.into();
        self
    }

    /// Set audience
    pub fn with_audience(mut self, audience: impl Into<String>) -> Self {
        self.audience = audience.into();
        self
    }

    /// Set response format
    pub fn with_response_format(mut self, format: impl Into<String>) -> Self {
        self.response_format = format.into();
        self
    }

    /// Add a constraint
    pub fn with_constraint(mut self, constraint: impl Into<String>) -> Self {
        self.constraints.push(constraint.into());
        self
    }

    /// Add a few-shot example
    pub fn with_example(mut self, input: impl Into<String>, output: impl Into<String>) -> Self {
        self.examples.push(Example {
            input: input.into(),
            output: output.into(),
        });
        self
    }

    /// Build the final COSTAR+ context
    pub fn build(self) -> CostarContext {
        CostarContext {
            context: self.context_parts.join("\n\n"),
            objective: self.objective.unwrap_or_else(|| "Assist the user".to_string()),
            style: self.style,
            tone: self.tone,
            audience: self.audience,
            response_format: self.response_format,
            constraints: self.constraints,
            examples: self.examples,
        }
    }

    /// Build and format as prompt string
    pub fn build_prompt(self) -> String {
        let ctx = self.build();

        let mut prompt = String::new();

        prompt.push_str("# Context\n");
        prompt.push_str(&ctx.context);
        prompt.push_str("\n\n");

        prompt.push_str("# Objective\n");
        prompt.push_str(&ctx.objective);
        prompt.push_str("\n\n");

        prompt.push_str("# Style\n");
        prompt.push_str(&ctx.style);
        prompt.push_str("\n\n");

        prompt.push_str("# Tone\n");
        prompt.push_str(&ctx.tone);
        prompt.push_str("\n\n");

        prompt.push_str("# Audience\n");
        prompt.push_str(&ctx.audience);
        prompt.push_str("\n\n");

        prompt.push_str("# Response Format\n");
        prompt.push_str(&ctx.response_format);

        if !ctx.constraints.is_empty() {
            prompt.push_str("\n\n# Constraints\n");
            for c in &ctx.constraints {
                prompt.push_str("- ");
                prompt.push_str(c);
                prompt.push('\n');
            }
        }

        if !ctx.examples.is_empty() {
            prompt.push_str("\n\n# Examples\n");
            for (i, ex) in ctx.examples.iter().enumerate() {
                prompt.push_str(&format!("\n## Example {}\n", i + 1));
                prompt.push_str("Input: ");
                prompt.push_str(&ex.input);
                prompt.push_str("\nOutput: ");
                prompt.push_str(&ex.output);
                prompt.push('\n');
            }
        }

        prompt
    }
}
