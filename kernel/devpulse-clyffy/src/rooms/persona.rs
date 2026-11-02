//! A persona (`dpl.persona/1`): a character a seat can speak as.
//!
//! Owner ruling 2026-10-21, "Persona = full character": a persona carries
//! its own backstory and expertise, added to the seated role's prompt. The
//! role still decides the method, the limits and the output. The research
//! found a character adds nothing to accuracy; the choice is the owner's.
//!
//! None ship: you write yours in `{data_dir}/config/personas/`. The tone is
//! the minions' [`VoiceTone`].

use serde::{Deserialize, Serialize};

pub use crate::cortex::minions::types::VoiceTone;

use super::{Issue, is_kebab, semver};

/// The `schema` value of every persona file.
pub const PERSONA_SCHEMA: &str = "dpl.persona/1";

/// A character a seat speaks as (`dpl.persona/1`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct Persona {
    /// Always [`PERSONA_SCHEMA`].
    pub schema: String,
    /// Stable kebab-case key.
    pub id: String,
    /// Semver; a breaking change bumps the major.
    pub version: String,
    /// The character's name.
    pub name: String,
    /// One line shown where you pick a persona for a seat.
    pub summary: String,
    /// How the character speaks.
    pub tone: VoiceTone,
    /// Who the character is.
    pub backstory: String,
    /// What the character knows well.
    pub expertise: Vec<String>,
    /// Anything else about how the character answers.
    #[serde(default)]
    pub instructions: String,
    /// Words to find it by.
    #[serde(default)]
    pub tags: Vec<String>,
}

impl Persona {
    /// Parse one persona file's text and check its rules.
    ///
    /// # Errors
    /// Every problem found, at the field it is in.
    pub fn parse(file: &str, text: &str) -> Result<Self, Vec<Issue>> {
        let persona: Self =
            serde_json::from_str(text).map_err(|e| vec![Issue::new(file, e.to_string())])?;
        let issues = persona.validate();
        if issues.is_empty() {
            Ok(persona)
        } else {
            Err(issues)
        }
    }

    /// The rules a persona keeps beyond its schema.
    #[must_use]
    pub fn validate(&self) -> Vec<Issue> {
        let at = |field: &str| format!("persona {} · {field}", self.id);
        let mut issues = Vec::new();
        if self.schema != PERSONA_SCHEMA {
            issues.push(Issue::new(
                at("schema"),
                format!("must be {PERSONA_SCHEMA}"),
            ));
        }
        if !is_kebab(&self.id) {
            issues.push(Issue::new(at("id"), "must be kebab-case"));
        }
        if semver(&self.version).is_none() {
            issues.push(Issue::new(at("version"), "must be major.minor.patch"));
        }
        if self.name.trim().is_empty() {
            issues.push(Issue::new(at("name"), "needs a name"));
        }
        if self.backstory.trim().is_empty() {
            issues.push(Issue::new(at("backstory"), "needs a backstory"));
        }
        if self.expertise.iter().all(|e| e.trim().is_empty()) {
            issues.push(Issue::new(at("expertise"), "needs at least one area"));
        }
        issues
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn a_persona_needs_a_character() {
        let text = serde_json::json!({
            "schema": PERSONA_SCHEMA,
            "id": "ada",
            "version": "1.0.0",
            "name": "Ada",
            "summary": "A patient systems engineer.",
            "tone": "concise",
            "backstory": " ",
            "expertise": []
        })
        .to_string();
        let problems: Vec<String> = Persona::parse("ada.json", &text)
            .expect_err("no backstory or expertise")
            .into_iter()
            .map(|i| i.problem)
            .collect();
        assert_eq!(problems, ["needs a backstory", "needs at least one area"]);
    }

    #[test]
    fn a_tone_is_its_lowercase_name() {
        assert_eq!(
            serde_json::to_value(VoiceTone::Empathetic).unwrap(),
            "empathetic"
        );
    }
}
