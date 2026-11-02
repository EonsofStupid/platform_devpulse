//! A role (`dpl.role/1`): the job one seat does, defined by its method and
//! its output contract. A character is not part of a role: a persona
//! ([`super::persona`]) is added at the seat.
//!
//! The rules a schema cannot say are in [`RoleCard::validate`]:
//! - a talk-only role allows no tools;
//! - a selecting role forbids merging (select, never blend);
//! - every `{placeholder}` its text uses is a declared parameter, and every
//!   declared parameter is used.

use std::collections::BTreeSet;

use serde::{Deserialize, Serialize};

use super::{Issue, Provenance, Visibility, is_kebab, semver};

/// The `schema` value of every role file.
pub const ROLE_SCHEMA: &str = "dpl.role/1";

/// What a role does to the conversation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum Stance {
    /// Produces ideas or answers.
    Generate,
    /// Checks claims against sources.
    Ground,
    /// Finds weaknesses in an answer.
    Critique,
    /// Attacks an answer to make it fail.
    Adversarial,
    /// Turns ideas into steps.
    Plan,
    /// Picks one answer, never merging several.
    Select,
}

/// How hard the seat's agent should think.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum Effort {
    /// A quick answer.
    Low,
    /// The agent's usual effort.
    Medium,
    /// Its most careful answer.
    High,
}

/// The named technique and its steps.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct Method {
    /// The technique's name.
    pub name: String,
    /// What the seat does, in order.
    pub steps: Vec<String>,
}

/// What the seat may use besides talking.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct RolePermissions {
    /// No tools, no files: the role only answers.
    pub talk_only: bool,
    /// The tools it may use when it is not talk-only.
    pub tools_allowed: Vec<String>,
}

/// Which agents suit the seat.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct ModelPrefs {
    /// Vendors that suit the role, best first.
    #[serde(default)]
    pub preferred_vendors: Vec<String>,
    /// Role ids whose vendor this seat must differ from (a critic never
    /// shares the author's vendor).
    pub avoid_same_vendor_as: Vec<String>,
    /// How hard the seat's agent should think.
    #[serde(default)]
    pub effort: Option<Effort>,
}

/// How much one seat may say.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct Budget {
    /// Turns it may take in a room (1–20).
    pub max_turns: u32,
    /// The longest answer it may give.
    #[serde(default)]
    pub max_output_tokens: Option<u32>,
}

/// A value a room fills in (a domain expert's domain).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct Parameter {
    /// Its `{placeholder}` name in the role's text.
    pub name: String,
    /// What the room should fill in.
    pub description: String,
}

/// One role a seat plays (`dpl.role/1`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct RoleCard {
    /// Always [`ROLE_SCHEMA`].
    pub schema: String,
    /// Stable kebab-case key.
    pub id: String,
    /// Semver; a breaking change bumps the major.
    pub version: String,
    /// What it is called.
    pub name: String,
    /// One line a router or selector uses to pick this seat.
    pub summary: String,
    /// The job.
    pub purpose: String,
    /// What it does to the conversation.
    pub stance: Stance,
    /// The named technique and its steps.
    pub method: Method,
    /// The role's prompt.
    pub instructions: String,
    /// Hard limits.
    pub must_not: Vec<String>,
    /// A JSON Schema of what the role must produce.
    pub output_contract: serde_json::Value,
    /// Pass/fail criteria its output is scored against.
    pub rubric: Vec<String>,
    /// The room phases or triggers it answers in.
    pub speaks_when: Vec<String>,
    /// What it sees of its peers before it answers.
    pub visibility: Visibility,
    /// What it may use besides talking.
    pub permissions: RolePermissions,
    /// Which agents suit the seat.
    pub model_prefs: ModelPrefs,
    /// How much it may say.
    pub budget: Budget,
    /// Sample answers.
    #[serde(default)]
    pub examples: Vec<String>,
    /// Words to find it by.
    pub tags: Vec<String>,
    /// Values a room fills in.
    #[serde(default)]
    pub parameters: Vec<Parameter>,
    /// Where it comes from and how strong the evidence is.
    pub provenance: Provenance,
}

impl RoleCard {
    /// Parse one role file's text and check its rules.
    ///
    /// # Errors
    /// Every problem found, at the field it is in.
    pub fn parse(file: &str, text: &str) -> Result<Self, Vec<Issue>> {
        let role: Self =
            serde_json::from_str(text).map_err(|e| vec![Issue::new(file, e.to_string())])?;
        let issues = role.validate();
        if issues.is_empty() {
            Ok(role)
        } else {
            Err(issues)
        }
    }

    /// The fields the role's output contract requires, in order.
    #[must_use]
    pub fn output_fields(&self) -> Vec<&str> {
        self.output_contract
            .get("required")
            .and_then(serde_json::Value::as_array)
            .map(|fields| {
                fields
                    .iter()
                    .filter_map(serde_json::Value::as_str)
                    .collect()
            })
            .unwrap_or_default()
    }

    /// The rules a role keeps beyond its schema.
    #[must_use]
    pub fn validate(&self) -> Vec<Issue> {
        let at = |field: &str| format!("role {} · {field}", self.id);
        let mut issues = Vec::new();
        if self.schema != ROLE_SCHEMA {
            issues.push(Issue::new(at("schema"), format!("must be {ROLE_SCHEMA}")));
        }
        if !is_kebab(&self.id) {
            issues.push(Issue::new(at("id"), "must be kebab-case"));
        }
        if semver(&self.version).is_none() {
            issues.push(Issue::new(at("version"), "must be major.minor.patch"));
        }
        if self.method.steps.is_empty() {
            issues.push(Issue::new(at("method"), "needs at least one step"));
        }
        if self.rubric.is_empty() {
            issues.push(Issue::new(at("rubric"), "needs at least one criterion"));
        }
        if self.provenance.sources.is_empty() {
            issues.push(Issue::new(at("provenance"), "needs at least one source"));
        }
        if self.permissions.talk_only && !self.permissions.tools_allowed.is_empty() {
            issues.push(Issue::new(
                at("permissions"),
                "a talk-only role cannot allow tools",
            ));
        }
        // Select, never blend: a selecting role must forbid merging.
        if self.stance == Stance::Select
            && !self
                .must_not
                .iter()
                .any(|rule| rule.to_ascii_lowercase().contains("merge"))
        {
            issues.push(Issue::new(
                at("must_not"),
                "a selecting role must forbid merging candidates (select, never blend)",
            ));
        }
        let declared: BTreeSet<&str> = self.parameters.iter().map(|p| p.name.as_str()).collect();
        let mut used = placeholders(&self.instructions);
        for step in &self.method.steps {
            used.extend(placeholders(step));
        }
        for name in used.difference(&declared) {
            issues.push(Issue::new(
                at("parameters"),
                format!("{{{name}}} is used but not declared"),
            ));
        }
        for name in declared.difference(&used) {
            issues.push(Issue::new(
                at("parameters"),
                format!("{name} is declared but never used"),
            ));
        }
        issues
    }
}

/// The `{name}` placeholders a text uses.
fn placeholders(text: &str) -> BTreeSet<&str> {
    let mut found = BTreeSet::new();
    let mut rest = text;
    while let Some(open) = rest.find('{') {
        let after = &rest[open + 1..];
        let Some(close) = after.find('}') else { break };
        let name = &after[..close];
        if !name.is_empty() && name.chars().all(|c| c.is_ascii_lowercase() || c == '_') {
            found.insert(name);
        }
        rest = &after[close + 1..];
    }
    found
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    fn selector() -> RoleCard {
        let text = include_str!("../../config/roles/selector.json");
        RoleCard::parse("selector.json", text).expect("selector")
    }

    /// Select, never blend: a selecting role that may merge is refused.
    #[test]
    fn a_selector_that_may_merge_is_refused() {
        let mut role = selector();
        role.must_not.retain(|rule| !rule.contains("merge"));
        assert!(
            role.validate()
                .iter()
                .any(|issue| issue.problem.contains("select, never blend"))
        );
    }

    #[test]
    fn a_talk_only_role_allows_no_tools() {
        let mut role = selector();
        role.permissions.talk_only = true;
        role.permissions.tools_allowed = vec!["web".to_owned()];
        assert!(
            role.validate()
                .iter()
                .any(|issue| issue.problem.contains("talk-only"))
        );
    }

    #[test]
    fn placeholders_are_declared_and_used() {
        let mut role = selector();
        role.instructions.push_str(" Judge for {audience}.");
        let problems: Vec<String> = role.validate().into_iter().map(|i| i.problem).collect();
        assert!(
            problems
                .iter()
                .any(|p| p.contains("{audience} is used but not declared")),
            "{problems:?}"
        );
    }

    #[test]
    fn the_output_fields_come_from_the_contract() {
        assert_ne!(selector().output_fields(), [] as [&str; 0]);
    }

    #[test]
    fn a_stance_serializes_as_the_schema_names_it() {
        assert_eq!(
            serde_json::to_value(Stance::Adversarial).unwrap(),
            "adversarial"
        );
    }
}
