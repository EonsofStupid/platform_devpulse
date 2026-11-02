//! A room (`dpl.room/1`): who sits in it, in what order they speak, and how
//! one answer is chosen.
//!
//! The rules a schema cannot say are in [`RoomSpec::validate`], checked
//! against the roles the room would seat:
//! - a seat names a role in the library and fills that role's parameters;
//! - a phase names only the room's seats;
//! - the selection seat is a selecting role (select, never blend).

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use super::role::{RoleCard, Stance};
use super::{Issue, Provenance, Visibility, is_kebab, semver};

/// The `schema` value of every room file.
pub const ROOM_SCHEMA: &str = "dpl.room/1";

/// The kind of room.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum RoomType {
    /// Everyone answers blind; a selector picks one answer.
    Council,
    /// Two sides argue; a judge selects.
    Debate,
    /// An author drafts; a critic from another vendor scores it.
    AuthorCritic,
    /// One seat, matched to the question.
    Router,
    /// Ideas first, then grouping, critique and a shortlist.
    Brainstorm,
}

/// One seat: a role, how many sit in it, and the role's parameters filled.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct Seat {
    /// The seat's name in this room; phases refer to it.
    pub seat: String,
    /// `role-id@major` (`skeptic@1`).
    pub role: String,
    /// How many sit in it (1–6).
    pub count: u32,
    /// The role's parameters, filled.
    #[serde(default)]
    pub parameters: BTreeMap<String, String>,
}

/// How a phase's seats take their turns.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum PhaseMode {
    /// All at once.
    Parallel,
    /// One after another.
    Sequential,
}

/// One step of a room.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct Phase {
    /// Its kebab-case name.
    pub name: String,
    /// The seats that speak in it.
    pub seats: Vec<String>,
    /// All at once, or one after another.
    pub mode: PhaseMode,
    /// What each seat sees of the others in it.
    pub visibility: Visibility,
    /// Turns each seat may take in it (1–10).
    pub max_turns: u32,
}

/// Who speaks next.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum TurnPolicy {
    /// The phases' order, as written.
    Fixed,
    /// Each seat in turn.
    RoundRobin,
    /// The selector seat decides.
    Selector,
    /// The router matches one seat to the question.
    Router,
}

/// When the room stops.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct StopRule {
    /// Rounds at most (1–10).
    pub max_rounds: u32,
    /// Tokens the whole room may spend.
    #[serde(default)]
    pub budget_tokens: Option<u64>,
    /// Stop when no answer changed in a round.
    #[serde(default)]
    pub stability: bool,
    /// Stop when the rubric passes.
    #[serde(default)]
    pub pass_threshold: bool,
}

/// How one answer is chosen.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum SelectionMethod {
    /// One selector picks.
    Judge,
    /// Several selectors pick together.
    Panel,
    /// The seats vote.
    Vote,
    /// You pick.
    Human,
}

/// How the room chooses one answer (select, never blend).
///
/// Four independent switches, field for field the `selection` object of
/// `dpl.room/1` (as `Capabilities` mirrors its published shape). Grouping
/// them would need serde's `flatten`, which cannot be combined with
/// refusing unknown fields.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
#[expect(
    clippy::struct_excessive_bools,
    reason = "mirrors the dpl.room/1 selection object field for field"
)]
pub struct Selection {
    /// Who picks.
    pub method: SelectionMethod,
    /// The selector's seat.
    pub seat: String,
    /// The selector does not see who wrote what.
    pub blind: bool,
    /// Judge in both orders; a disagreement is a tie or a rerun.
    pub swap_order: bool,
    /// The selector's vendor wrote none of the answers.
    pub exclude_author_vendors: bool,
    /// "None passes" is a valid outcome.
    pub allow_none: bool,
}

/// What passes from one phase to the next.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum CarryForward {
    /// Only each seat's structured answer.
    StructuredOutputs,
    /// Everything said.
    FullTranscript,
}

/// What the room keeps when it ends.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum RecordItem {
    /// The chosen answer.
    Winner,
    /// The next best.
    RunnerUp,
    /// Why it was chosen.
    Rationale,
    /// Who disagreed, and why.
    Dissent,
    /// Who changed their answer, and why.
    Flips,
}

/// A room (`dpl.room/1`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct RoomSpec {
    /// Always [`ROOM_SCHEMA`].
    pub schema: String,
    /// Stable kebab-case key.
    pub id: String,
    /// Semver; a breaking change bumps the major.
    pub version: String,
    /// What it is called.
    pub name: String,
    /// The kind of room.
    #[serde(rename = "type")]
    pub room_type: RoomType,
    /// One line on what it is for.
    pub summary: String,
    /// Who sits in it.
    pub seats: Vec<Seat>,
    /// Its steps, in order.
    pub phases: Vec<Phase>,
    /// Who speaks next.
    pub turn_policy: TurnPolicy,
    /// When it stops.
    pub stop: StopRule,
    /// How one answer is chosen, when it chooses one.
    #[serde(default)]
    pub selection: Option<Selection>,
    /// What passes from one phase to the next.
    pub carry_forward: CarryForward,
    /// What it keeps when it ends.
    pub record: Vec<RecordItem>,
    /// Where it comes from and how strong the evidence is.
    pub provenance: Provenance,
}

impl RoomSpec {
    /// Parse one room file's text and check it against the roles it would
    /// seat.
    ///
    /// # Errors
    /// Every problem found, at the field it is in.
    pub fn parse(file: &str, text: &str, roles: &[RoleCard]) -> Result<Self, Vec<Issue>> {
        let room: Self =
            serde_json::from_str(text).map_err(|e| vec![Issue::new(file, e.to_string())])?;
        let issues = room.validate(roles);
        if issues.is_empty() {
            Ok(room)
        } else {
            Err(issues)
        }
    }

    /// The rules a room keeps beyond its schema.
    #[must_use]
    pub fn validate(&self, roles: &[RoleCard]) -> Vec<Issue> {
        let at = |field: &str| format!("room {} · {field}", self.id);
        let mut issues = Vec::new();
        if self.schema != ROOM_SCHEMA {
            issues.push(Issue::new(at("schema"), format!("must be {ROOM_SCHEMA}")));
        }
        if !is_kebab(&self.id) {
            issues.push(Issue::new(at("id"), "must be kebab-case"));
        }
        if semver(&self.version).is_none() {
            issues.push(Issue::new(at("version"), "must be major.minor.patch"));
        }
        let mut seats = BTreeMap::new();
        for seat in &self.seats {
            if seats.insert(seat.seat.as_str(), seat).is_some() {
                issues.push(Issue::new(
                    at("seats"),
                    format!("seat {} appears twice", seat.seat),
                ));
            }
            let Some(role) = resolve_role(roles, &seat.role) else {
                issues.push(Issue::new(
                    at("seats"),
                    format!(
                        "seat {} names {}, which is not in the library",
                        seat.seat, seat.role
                    ),
                ));
                continue;
            };
            for parameter in &role.parameters {
                if !seat.parameters.contains_key(&parameter.name) {
                    issues.push(Issue::new(
                        at("seats"),
                        format!(
                            "seat {} must fill {}'s {}",
                            seat.seat, role.id, parameter.name
                        ),
                    ));
                }
            }
        }
        for phase in &self.phases {
            for seat in &phase.seats {
                if !seats.contains_key(seat.as_str()) {
                    issues.push(Issue::new(
                        at("phases"),
                        format!(
                            "phase {} names seat {seat}, which the room does not have",
                            phase.name
                        ),
                    ));
                }
            }
        }
        if let Some(selection) = &self.selection {
            match seats.get(selection.seat.as_str()) {
                None => issues.push(Issue::new(
                    at("selection"),
                    format!("the selection seat {} is not a seat", selection.seat),
                )),
                Some(seat) => {
                    let selects = resolve_role(roles, &seat.role)
                        .is_some_and(|role| role.stance == Stance::Select);
                    if !selects {
                        issues.push(Issue::new(
                            at("selection"),
                            format!(
                                "seat {} must be a selecting role (select, never blend)",
                                selection.seat
                            ),
                        ));
                    }
                }
            }
        }
        issues
    }
}

/// `skeptic@1` → `("skeptic", 1)`.
#[must_use]
pub fn role_reference(reference: &str) -> Option<(&str, u64)> {
    let (id, major) = reference.split_once('@')?;
    Some((id, major.parse().ok()?))
}

/// The role a `role-id@major` reference names: the highest version with
/// that major.
#[must_use]
pub fn resolve_role<'a>(roles: &'a [RoleCard], reference: &str) -> Option<&'a RoleCard> {
    let (id, major) = role_reference(reference)?;
    roles
        .iter()
        .filter(|role| role.id == id && semver(&role.version).is_some_and(|v| v.0 == major))
        .max_by_key(|role| semver(&role.version))
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use crate::rooms::Library;

    /// A room is checked against the library it would seat.
    #[test]
    fn a_room_must_seat_real_roles_and_fill_their_parameters() {
        let library = Library::bundled();
        let mut room = library.room("council").expect("council").clone();
        room.seats[0].parameters.clear();
        room.seats.push(Seat {
            seat: "ghost".to_owned(),
            role: "oracle@1".to_owned(),
            count: 1,
            parameters: BTreeMap::new(),
        });
        let problems: Vec<String> = room
            .validate(&library.roles)
            .into_iter()
            .map(|issue| issue.problem)
            .collect();
        assert!(
            problems
                .iter()
                .any(|p| p.contains("must fill domain-expert's domain")),
            "{problems:?}"
        );
        assert!(
            problems.iter().any(|p| p.contains("oracle@1")),
            "{problems:?}"
        );
    }

    #[test]
    fn a_rooms_selection_seat_must_be_a_selector() {
        let library = Library::bundled();
        let mut room = library.room("council").expect("council").clone();
        if let Some(selection) = room.selection.as_mut() {
            selection.seat = "answerer".to_owned();
        }
        assert!(
            room.validate(&library.roles)
                .iter()
                .any(|issue| issue.problem.contains("must be a selecting role"))
        );
    }

    #[test]
    fn a_reference_resolves_to_the_highest_version_of_its_major() {
        let library = Library::bundled();
        let mut newer = library.role("skeptic").expect("skeptic").clone();
        newer.version = "1.4.0".to_owned();
        newer.summary = "newer".to_owned();
        let mut other_major = newer.clone();
        other_major.version = "2.0.0".to_owned();
        let roles = [
            library.role("skeptic").expect("skeptic").clone(),
            newer,
            other_major,
        ];
        assert_eq!(
            resolve_role(&roles, "skeptic@1").map(|r| r.version.as_str()),
            Some("1.4.0")
        );
        assert!(resolve_role(&roles, "skeptic").is_none());
        assert!(resolve_role(&roles, "skeptic@x").is_none());
    }

    #[test]
    fn a_room_type_serializes_as_the_schema_names_it() {
        assert_eq!(
            serde_json::to_value(RoomType::AuthorCritic).unwrap(),
            "author-critic"
        );
    }
}
