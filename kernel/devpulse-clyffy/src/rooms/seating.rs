//! Seating a room: an agent (and, if you like, a persona) in every place
//! (plan 0001 B4.2).
//!
//! A seat with `count` 3 is three places, each with its own agent and its
//! own conversation; the same agent may take several places. [`seat`] checks
//! what a room asks of its seating before anything runs:
//! - every place has exactly one agent, and every persona named exists;
//! - `avoid_same_vendor_as`: a place's vendor differs from those of the
//!   places whose roles it lists (a critic never shares the author's
//!   vendor);
//! - `exclude_author_vendors`: the selector's vendor wrote no candidate;
//! - the room's turn policy and selection method are ones a room can run.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use super::role::{RoleCard, Stance};
use super::room::{RoomSpec, Seat, SelectionMethod, TurnPolicy, resolve_role};
use super::{Issue, Library, Persona, Visibility};
use crate::providers::registry;
use crate::providers::types::{ProviderId, Vendor};

/// Who sits in one place of a room, as you chose it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct Assignment {
    /// The room's seat (`answerer`).
    pub seat: String,
    /// Which of the seat's places, from 0.
    pub place: u32,
    /// The agent in it.
    pub provider: ProviderId,
    /// The id of the persona it speaks as.
    #[serde(default)]
    pub persona: Option<String>,
    /// Your choice for this place's notes; absent, the room's seat decides.
    #[serde(default)]
    pub notes: Option<bool>,
    /// The role this place takes instead of the seat's (`code-reviewer@1`).
    #[serde(default)]
    pub role: Option<String>,
    /// Values for its role's parameters, over the room's.
    #[serde(default)]
    pub parameters: BTreeMap<String, String>,
}

/// One place of a room, seated.
#[derive(Debug, Clone, PartialEq)]
pub struct Place {
    /// The room's seat.
    pub seat: String,
    /// Which of the seat's places, from 0.
    pub index: u32,
    /// The role the seat names.
    pub role: RoleCard,
    /// The role's parameters, as the room fills them.
    pub parameters: BTreeMap<String, String>,
    /// It answers where it may see no other answer, so it gets no shared tools.
    pub blind: bool,
    /// Its seat's answers are what a selector chooses between.
    pub author: bool,
    /// The character it speaks as.
    pub persona: Option<Persona>,
    /// It gets the notes you chose.
    pub notes: bool,
    /// The agent in it.
    pub provider: ProviderId,
    /// The agent's vendor.
    pub vendor: Vendor,
}

impl Place {
    /// `answerer-1`: the seat and the place's number, from 1.
    #[must_use]
    pub fn key(&self) -> String {
        format!("{}-{}", self.seat, self.index + 1)
    }

    /// Its answers are candidates. That is the seat's job in the room, whichever
    /// role you seat in it: a reviewer in an answer seat still answers.
    #[must_use]
    pub const fn is_author(&self) -> bool {
        self.author
    }

    /// The agent's name.
    #[must_use]
    pub fn agent_name(&self) -> &'static str {
        registry::find(self.provider).map_or("an agent", |row| row.display_name)
    }
}

/// A room with every place seated.
#[derive(Debug, Clone, PartialEq)]
pub struct SeatedRoom {
    /// The room.
    pub room: RoomSpec,
    /// Its places, in the room's seat order.
    pub places: Vec<Place>,
}

impl SeatedRoom {
    /// The places of a seat.
    pub fn places_of<'a>(&'a self, seat: &'a str) -> impl Iterator<Item = &'a Place> + 'a {
        self.places.iter().filter(move |place| place.seat == seat)
    }
}

/// Seat a room from your library with your choices.
///
/// # Errors
/// Every problem with the seating, at the place it is in.
pub fn seat(
    library: &Library,
    room_id: &str,
    assignments: &[Assignment],
) -> Result<SeatedRoom, Vec<Issue>> {
    let Some(room) = library.room(room_id) else {
        return Err(vec![Issue::new(
            format!("room {room_id}"),
            "is not in your library",
        )]);
    };
    let at = |field: &str| format!("room {} · {field}", room.id);
    let mut issues = runnable(room);
    let mut places = Vec::new();
    for seat in &room.seats {
        for index in 0..seat.count {
            let mut chosen = assignments
                .iter()
                .filter(|a| a.seat == seat.seat && a.place == index);
            let key = format!("{}-{}", seat.seat, index + 1);
            let Some(assignment) = chosen.next() else {
                issues.push(Issue::new(at(&key), "needs an agent"));
                continue;
            };
            if chosen.next().is_some() {
                issues.push(Issue::new(at(&key), "is given more than one agent"));
            }
            if let Some(place) = seat_place(library, room, seat, index, assignment, &mut issues) {
                places.push(place);
            }
        }
    }
    for assignment in assignments {
        let known = room
            .seats
            .iter()
            .any(|seat| seat.seat == assignment.seat && assignment.place < seat.count);
        if !known {
            issues.push(Issue::new(
                at("seats"),
                format!(
                    "{}-{} is not a place in this room",
                    assignment.seat,
                    assignment.place + 1
                ),
            ));
        }
    }
    let seated = SeatedRoom {
        room: room.clone(),
        places,
    };
    issues.extend(vendor_rules(&seated));
    if issues.is_empty() {
        Ok(seated)
    } else {
        Err(issues)
    }
}

/// One place, seated, with what stops it added to `issues`.
fn seat_place(
    library: &Library,
    room: &RoomSpec,
    seat: &Seat,
    index: u32,
    assignment: &Assignment,
    issues: &mut Vec<Issue>,
) -> Option<Place> {
    let at = format!("room {} · {}-{}", room.id, seat.seat, index + 1);
    let reference = assignment.role.as_deref().unwrap_or(&seat.role);
    let Some(role) = resolve_role(&library.roles, reference) else {
        issues.push(Issue::new(
            at,
            format!("names {reference}, which is not in the library"),
        ));
        return None;
    };
    let parameters = merged_parameters(seat, assignment);
    issues.extend(role_fit(room, seat, role, &parameters, &at));
    let blind = answers_blind(room, seat);
    if blind && role.may_change() {
        issues.push(Issue::new(
            at.clone(),
            format!(
                "{} can change things, and this seat answers blind: another seat could read what it changed",
                role.id
            ),
        ));
    }
    let author = resolve_role(&library.roles, &seat.role)
        .is_some_and(|own| matches!(own.stance, Stance::Generate | Stance::Adversarial));
    let default_persona = seat
        .personas
        .get(usize::try_from(index).unwrap_or(usize::MAX));
    // Empty means you chose no character, even where the seat brings one.
    let persona = match assignment.persona.as_ref().or(default_persona) {
        None => None,
        Some(id) if id.is_empty() => None,
        Some(id) => {
            let found = library.persona(id).cloned();
            if found.is_none() {
                issues.push(Issue::new(
                    at.clone(),
                    format!("persona {id} is not in your library"),
                ));
            }
            found
        }
    };
    let Some(row) = registry::find(assignment.provider) else {
        issues.push(Issue::new(
            at,
            format!(
                "{} is not an agent DevPulse knows",
                assignment.provider.key()
            ),
        ));
        return None;
    };
    Some(Place {
        seat: seat.seat.clone(),
        index,
        role: role.clone(),
        parameters,
        blind,
        author,
        persona,
        notes: assignment.notes.unwrap_or(seat.notes),
        provider: assignment.provider,
        vendor: row.vendor,
    })
}

/// A place's parameters: the room's, with yours over them.
fn merged_parameters(seat: &Seat, assignment: &Assignment) -> BTreeMap<String, String> {
    let mut parameters = seat.parameters.clone();
    parameters.extend(assignment.parameters.clone());
    parameters
}

/// This seat answers in a phase where it may see no other answer.
fn answers_blind(room: &RoomSpec, seat: &Seat) -> bool {
    room.phases
        .iter()
        .any(|phase| phase.visibility == Visibility::None && phase.seats.contains(&seat.seat))
}

/// A role taken in place of the seat's still has to do the seat's job.
fn role_fit(
    room: &RoomSpec,
    seat: &Seat,
    role: &RoleCard,
    parameters: &BTreeMap<String, String>,
    at: &str,
) -> Vec<Issue> {
    let mut issues = Vec::new();
    for parameter in &role.parameters {
        if !parameters.contains_key(&parameter.name) {
            issues.push(Issue::new(
                at,
                format!("{} needs its {}", role.id, parameter.name),
            ));
        }
    }
    let selects = room
        .selection
        .as_ref()
        .is_some_and(|selection| selection.seat == seat.seat);
    if selects && role.stance != Stance::Select {
        issues.push(Issue::new(
            at,
            format!(
                "{} does not select, and this seat picks the answer",
                role.id
            ),
        ));
    }
    if room.routing_seat() == Some(seat.seat.as_str()) {
        let fields = role.output_fields();
        if !fields.contains(&"place") || !fields.contains(&"escalate") {
            issues.push(Issue::new(
                at,
                format!("{} does not name a place, and this seat routes", role.id),
            ));
        }
    }
    issues
}

/// What a room asks that cannot run yet.
fn runnable(room: &RoomSpec) -> Vec<Issue> {
    let at = |field: &str| format!("room {} · {field}", room.id);
    let mut issues = Vec::new();
    if room.turn_policy == TurnPolicy::Selector {
        issues.push(Issue::new(
            at("turn_policy"),
            "a room whose selector picks the next speaker does not run yet",
        ));
    }
    if let Some(selection) = &room.selection
        && matches!(
            selection.method,
            SelectionMethod::Vote | SelectionMethod::Human
        )
    {
        issues.push(Issue::new(
            at("selection"),
            "selection by vote or by you does not run yet; a judge or a panel does",
        ));
    }
    issues
}

/// `avoid_same_vendor_as` and `exclude_author_vendors`.
fn vendor_rules(seated: &SeatedRoom) -> Vec<Issue> {
    let mut issues = Vec::new();
    let at = |place: &Place| format!("room {} · {}", seated.room.id, place.key());
    for place in &seated.places {
        let avoid = &place.role.model_prefs.avoid_same_vendor_as;
        for other in &seated.places {
            if other.key() != place.key()
                && avoid.contains(&other.role.id)
                && other.vendor == place.vendor
            {
                issues.push(Issue::new(
                    at(place),
                    format!(
                        "as {} it must not share a vendor with {} ({}); seat another vendor's agent",
                        place.role.name,
                        other.key(),
                        other.agent_name()
                    ),
                ));
            }
        }
    }
    if let Some(selection) = seated
        .room
        .selection
        .as_ref()
        .filter(|s| s.exclude_author_vendors.0)
    {
        for selector in seated.places_of(&selection.seat) {
            if let Some(author) = seated
                .places
                .iter()
                .find(|p| p.is_author() && p.vendor == selector.vendor)
            {
                issues.push(Issue::new(
                    at(selector),
                    format!(
                        "the selector must come from a vendor that wrote no candidate, and {} ({}) does",
                        author.key(),
                        author.agent_name()
                    ),
                ));
            }
        }
    }
    issues
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use crate::rooms::Files;

    fn assign(seat: &str, place: u32, provider: ProviderId) -> Assignment {
        Assignment {
            seat: seat.to_owned(),
            place,
            provider,
            persona: None,
            notes: None,
            role: None,
            parameters: std::collections::BTreeMap::new(),
        }
    }

    fn council(answerers: [ProviderId; 3], selector: ProviderId) -> Vec<Assignment> {
        let mut seating: Vec<Assignment> = answerers
            .iter()
            .zip(0..)
            .map(|(provider, place)| assign("answerer", place, *provider))
            .collect();
        seating.push(assign("selector", 0, selector));
        seating
    }

    #[test]
    fn a_council_seats_three_answerers_and_a_selector_of_another_vendor() {
        let library = Library::bundled();
        let seated = seat(
            &library,
            "council",
            &council([ProviderId::ClaudeCode; 3], ProviderId::Codex),
        )
        .expect("seated");
        let keys: Vec<String> = seated.places.iter().map(Place::key).collect();
        assert_eq!(
            keys,
            ["answerer-1", "answerer-2", "answerer-3", "selector-1"]
        );
        assert!(seated.places[0].is_author());
        assert!(!seated.places[3].is_author());
    }

    #[test]
    fn the_selector_must_come_from_a_vendor_that_wrote_no_candidate() {
        let library = Library::bundled();
        let problems: Vec<String> = seat(
            &library,
            "council",
            &council(
                [
                    ProviderId::ClaudeCode,
                    ProviderId::Codex,
                    ProviderId::ClaudeCode,
                ],
                ProviderId::Codex,
            ),
        )
        .expect_err("same vendor")
        .into_iter()
        .map(|i| i.to_string())
        .collect();
        assert_eq!(problems.len(), 1, "{problems:?}");
        assert!(problems[0].contains("selector-1"), "{problems:?}");
        assert!(problems[0].contains("answerer-2"), "{problems:?}");
    }

    #[test]
    fn a_critic_never_shares_the_authors_vendor() {
        let library = Library::bundled();
        let problems: Vec<String> = seat(
            &library,
            "author-critic",
            &[
                assign("author", 0, ProviderId::ClaudeCode),
                assign("critic", 0, ProviderId::ClaudeCode),
                assign("selector", 0, ProviderId::Codex),
            ],
        )
        .expect_err("critic shares the author's vendor")
        .into_iter()
        .map(|i| i.to_string())
        .collect();
        assert!(
            problems
                .iter()
                .any(|p| p.contains("critic-1") && p.contains("author-1")),
            "{problems:?}"
        );
    }

    #[test]
    fn every_place_needs_one_agent_and_known_personas() {
        let library = Library::bundled();
        let mut seating = council([ProviderId::ClaudeCode; 3], ProviderId::Codex);
        seating.remove(1);
        seating.push(assign("answerer", 0, ProviderId::ClaudeCode));
        seating.push(assign("answerer", 7, ProviderId::ClaudeCode));
        seating[2].persona = Some("nobody".to_owned());
        let problems: Vec<String> = seat(&library, "council", &seating)
            .expect_err("bad seating")
            .into_iter()
            .map(|i| i.to_string())
            .collect();
        for expected in [
            "answerer-2: needs an agent",
            "answerer-1: is given more than one agent",
            "persona nobody",
            "answerer-8 is not a place",
        ] {
            assert!(
                problems.iter().any(|p| p.contains(expected)),
                "{expected}: {problems:?}"
            );
        }
    }

    #[test]
    fn a_persona_of_yours_is_seated() {
        let persona = serde_json::json!({
            "schema": "dpl.persona/1", "id": "ada", "version": "1.0.0", "name": "Ada",
            "summary": "A patient engineer.", "tone": "concise",
            "backstory": "Kept trains on time.", "expertise": ["scheduling"]
        });
        let library = Library::with_files(&Files {
            personas: vec![("ada.json".to_owned(), persona.to_string())],
            ..Files::default()
        });
        let mut seating = council([ProviderId::ClaudeCode; 3], ProviderId::Codex);
        seating[0].persona = Some("ada".to_owned());
        let seated = seat(&library, "council", &seating).expect("seated");
        assert_eq!(
            seated.places[0].persona.as_ref().map(|p| p.name.as_str()),
            Some("Ada")
        );
    }

    #[test]
    fn a_seat_gets_notes_unless_the_room_or_you_say_no() {
        let mut library = Library::bundled();
        let seating = |notes: Option<bool>| {
            let mut seating: Vec<Assignment> = (0..3)
                .map(|place| Assignment {
                    notes,
                    ..assign("answerer", place, ProviderId::ClaudeCode)
                })
                .collect();
            seating.push(assign("selector", 0, ProviderId::Codex));
            seating
        };
        let answerer = |seated: &SeatedRoom| seated.places_of("answerer").next().unwrap().notes;

        let by_default = seat(&library, "council", &seating(None)).unwrap();
        assert!(answerer(&by_default), "the room says nothing: yes");
        let yours = seat(&library, "council", &seating(Some(false))).unwrap();
        assert!(!answerer(&yours), "you said no");

        let council = library
            .rooms
            .iter_mut()
            .find(|r| r.id == "council")
            .unwrap();
        for seat in &mut council.seats {
            seat.notes = false;
        }
        let room_says_no = seat(&library, "council", &seating(None)).unwrap();
        assert!(!answerer(&room_says_no), "the room's seat said no");
        let you_overrule = seat(&library, "council", &seating(Some(true))).unwrap();
        assert!(answerer(&you_overrule), "your choice wins");
    }

    #[test]
    fn a_place_can_take_any_role_that_can_do_the_seats_job() {
        let library = Library::bundled();
        let mut seating: Vec<Assignment> = (0..3)
            .map(|place| assign("answerer", place, ProviderId::ClaudeCode))
            .collect();
        seating.push(assign("selector", 0, ProviderId::Codex));

        seating[0].role = Some("code-reviewer@1".to_owned());
        let seated = seat(&library, "council", &seating).expect("a reviewer can answer");
        assert_eq!(seated.places[0].role.id, "code-reviewer");
        assert!(
            seated.places[0].is_author(),
            "its answer is still a candidate, or it would be dropped without a word"
        );
        assert_eq!(seated.places[1].role.id, "domain-expert");

        seating[3].role = Some("skeptic@1".to_owned());
        let issues = seat(&library, "council", &seating).expect_err("a selector must select");
        assert!(
            issues.iter().any(|i| i.problem.contains("does not select")),
            "{issues:?}"
        );
        seating[3].role = None;

        seating[0].role = Some("oracle@1".to_owned());
        let issues = seat(&library, "council", &seating).expect_err("no such role");
        assert!(
            issues.iter().any(|i| i.problem.contains("oracle")),
            "{issues:?}"
        );
    }

    #[test]
    fn a_blind_seat_may_read_and_may_not_change_things() {
        let mut library = Library::bundled();
        let mut seating: Vec<Assignment> = (0..3)
            .map(|place| assign("answerer", place, ProviderId::ClaudeCode))
            .collect();
        seating.push(assign("selector", 0, ProviderId::Codex));

        seating[0].role = Some("code-reviewer@1".to_owned());
        let seated = seat(&library, "council", &seating).expect("a reviewer can read blind");
        assert!(seated.places[0].blind);

        let mut writer = library.role("code-reviewer").unwrap().clone();
        writer.id = "fixer".to_owned();
        writer.permissions.tools_allowed = vec!["read".to_owned(), "write".to_owned()];
        library.roles.push(writer);
        seating[0].role = Some("fixer@1".to_owned());
        let issues = seat(&library, "council", &seating).expect_err("it could leave an answer");
        assert!(
            issues.iter().any(|i| i.problem.contains("blind")),
            "{issues:?}"
        );

        // Where everyone sees everything, it may.
        let mut group: Vec<Assignment> = (0..3)
            .map(|place| assign("member", place, ProviderId::ClaudeCode))
            .collect();
        group[0].role = Some("fixer@1".to_owned());
        let seated = seat(&library, "round-robin", &group).expect("a group sees everything");
        assert!(!seated.places[0].blind);
    }

    #[test]
    fn a_role_that_needs_a_value_gets_it_from_the_place_or_is_refused() {
        let library = Library::bundled();
        let mut seating: Vec<Assignment> = (0..3)
            .map(|place| assign("member", place, ProviderId::ClaudeCode))
            .collect();
        seating[0].role = Some("domain-expert@1".to_owned());
        let issues = seat(&library, "round-robin", &seating).expect_err("no domain");
        assert!(
            issues.iter().any(|i| i.problem.contains("domain")),
            "{issues:?}"
        );

        seating[0]
            .parameters
            .insert("domain".to_owned(), "soldering".to_owned());
        let seated = seat(&library, "round-robin", &seating).expect("a domain");
        assert_eq!(seated.places[0].parameters["domain"], "soldering");
    }

    #[test]
    fn a_seat_brings_its_default_persona_and_you_can_change_it() {
        let library = Library::bundled();
        let mut seating: Vec<Assignment> = library
            .room("clyffy-council")
            .unwrap()
            .seats
            .iter()
            .map(|s| assign(&s.seat, 0, ProviderId::ClaudeCode))
            .collect();
        let seated = seat(&library, "clyffy-council", &seating).expect("the Council");
        let persona = |seated: &SeatedRoom, name: &str| {
            seated
                .places_of(name)
                .next()
                .and_then(|place| place.persona.clone())
                .map(|persona| persona.id)
        };
        assert_eq!(persona(&seated, "conductor").as_deref(), Some("clyffy"));
        assert_eq!(persona(&seated, "hardware").as_deref(), Some("rusty"));
        assert_eq!(persona(&seated, "software").as_deref(), Some("pip"));

        seating[3].persona = Some(String::new());
        let without = seat(&library, "clyffy-council", &seating).expect("no character");
        assert_eq!(persona(&without, "guardian"), None);

        seating[0].persona = Some("pragmatist".to_owned());
        let changed = seat(&library, "clyffy-council", &seating).expect("yours");
        assert_eq!(
            persona(&changed, "conductor").as_deref(),
            Some("pragmatist")
        );
    }

    #[test]
    fn a_seating_saved_before_this_choice_existed_still_reads() {
        let saved = r#"{"seat":"answerer","place":0,"provider":"claude-code","persona":null}"#;
        let assignment: Assignment = serde_json::from_str(saved).unwrap();
        assert_eq!(assignment.notes, None);
    }

    #[test]
    fn a_router_room_can_be_seated_and_its_experts_are_told_apart() {
        let library = Library::bundled();
        let seating: Vec<Assignment> = ["router", "code", "facts", "decisions"]
            .into_iter()
            .map(|seat| Assignment {
                seat: seat.to_owned(),
                place: 0,
                provider: ProviderId::ClaudeCode,
                persona: None,
                notes: None,
                role: None,
                parameters: std::collections::BTreeMap::new(),
            })
            .collect();
        let seated = seat(&library, "router", &seating).expect("seated");
        let domains: std::collections::BTreeSet<_> = seated
            .places
            .iter()
            .filter(|place| place.seat != "router")
            .map(|place| place.parameters["domain"].clone())
            .collect();
        assert_eq!(domains.len(), 3, "each expert has its own domain");
    }
}
