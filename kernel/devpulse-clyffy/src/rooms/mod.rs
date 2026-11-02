//! Rooms, roles and personas as data (plan 0001 B4).
//!
//! - A role (`dpl.role/1`, [`role`]) is the job one seat does: a method and
//!   an output contract.
//! - A room (`dpl.room/1`, [`room`]) says who sits in it, in what order they
//!   speak, and how one answer is chosen.
//! - A persona (`dpl.persona/1`, [`persona`]) is a character a seat can
//!   speak as, added to its role's prompt.
//!
//! A room runs in three parts: [`seating`] puts an agent (and a persona) in
//! every place and checks the room's vendor rules; [`brief`] says what each
//! place is told; [`run`] takes the phases round after round and picks one
//! answer, over a host that talks to the agents.
//!
//! The design and the bundled roles and rooms are the owner's, brought from
//! devpulselabs at 4ee638b. The schemas are under `config/schemas/`, and the
//! research every bundled role and room cites is
//! `docs/research/chat-rooms-and-roles.md`.
//!
//! Your own files live in `{data_dir}/config/{roles,rooms,personas}/*.json`.
//! A new role is a new file. One of yours with a bundled id replaces it only
//! with a higher version. A file that does not pass is never loaded half-way:
//! it is named with its problems.

pub mod brief;
pub mod persona;
pub mod role;
pub mod room;
pub mod run;
pub mod seating;

use std::fmt;
use std::path::Path;

use serde::{Deserialize, Serialize};

pub use persona::{PERSONA_SCHEMA, Persona};
pub use role::{ROLE_SCHEMA, RoleCard, Stance};
pub use room::{ROOM_SCHEMA, RoomSpec, RoomType, resolve_role};
pub use run::{Outcome, Pick, RoomHost, RoomRun, RoomTurn, Stopped};
pub use seating::{Assignment, Place, SeatedRoom, seat};

/// The bundled roles, by file name.
const BUNDLED_ROLES: [(&str, &str); 11] = [
    (
        "advocate.json",
        include_str!("../../config/roles/advocate.json"),
    ),
    (
        "domain-expert.json",
        include_str!("../../config/roles/domain-expert.json"),
    ),
    (
        "dreamer.json",
        include_str!("../../config/roles/dreamer.json"),
    ),
    (
        "fact-checker.json",
        include_str!("../../config/roles/fact-checker.json"),
    ),
    (
        "planner.json",
        include_str!("../../config/roles/planner.json"),
    ),
    (
        "pre-mortem.json",
        include_str!("../../config/roles/pre-mortem.json"),
    ),
    (
        "realist.json",
        include_str!("../../config/roles/realist.json"),
    ),
    (
        "red-team.json",
        include_str!("../../config/roles/red-team.json"),
    ),
    (
        "selector.json",
        include_str!("../../config/roles/selector.json"),
    ),
    (
        "skeptic.json",
        include_str!("../../config/roles/skeptic.json"),
    ),
    (
        "steelman.json",
        include_str!("../../config/roles/steelman.json"),
    ),
];

/// The bundled rooms, by file name.
const BUNDLED_ROOMS: [(&str, &str); 5] = [
    (
        "author-critic.json",
        include_str!("../../config/rooms/author-critic.json"),
    ),
    (
        "brainstorm.json",
        include_str!("../../config/rooms/brainstorm.json"),
    ),
    (
        "council.json",
        include_str!("../../config/rooms/council.json"),
    ),
    (
        "debate.json",
        include_str!("../../config/rooms/debate.json"),
    ),
    (
        "router.json",
        include_str!("../../config/rooms/router.json"),
    ),
];

/// What a seat sees of the others before it answers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum Visibility {
    /// No other answers.
    None,
    /// Others' answers without their names.
    Anonymized,
    /// Everything said.
    Full,
}

/// How strong the evidence behind a role or room is.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum Evidence {
    /// Peer-reviewed and replicated.
    Strong,
    /// One or a few studies.
    Moderate,
    /// A long-used method with little controlled evidence.
    Practice,
}

/// Where a role or room comes from.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(deny_unknown_fields)]
pub struct Provenance {
    /// Reference keys in the research page (`8`, `A2`…).
    pub sources: Vec<String>,
    /// How strong the evidence is.
    pub evidence: Evidence,
    /// Anything the sources leave unsaid.
    #[serde(default)]
    pub note: Option<String>,
}

/// One problem with a library file, at a place you can find.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct Issue {
    /// `role skeptic · rubric`, or the file name.
    pub at: String,
    /// What is wrong.
    pub problem: String,
}

impl Issue {
    pub(crate) fn new(at: impl Into<String>, problem: impl Into<String>) -> Self {
        Self {
            at: at.into(),
            problem: problem.into(),
        }
    }
}

impl fmt::Display for Issue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}: {}", self.at, self.problem)
    }
}

/// A file that was not loaded, and why.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct Rejected {
    /// The file name (`bundled skeptic.json` for a bundled one).
    pub file: String,
    /// Everything wrong with it.
    pub issues: Vec<Issue>,
}

/// `skeptic`, `fact-checker`: lowercase words joined by single dashes.
pub(crate) fn is_kebab(value: &str) -> bool {
    value.chars().next().is_some_and(|c| c.is_ascii_lowercase())
        && value.split('-').all(|part| {
            !part.is_empty()
                && part
                    .chars()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
        })
}

/// `1.2.3` → `(1, 2, 3)`.
pub fn semver(version: &str) -> Option<(u64, u64, u64)> {
    let mut parts = version.split('.');
    let parsed = (
        parts.next()?.parse().ok()?,
        parts.next()?.parse().ok()?,
        parts.next()?.parse().ok()?,
    );
    parts.next().is_none().then_some(parsed)
}

/// An entry the library keeps one of per id: the highest version.
trait Versioned {
    fn id(&self) -> &str;
    fn version(&self) -> &str;
}

impl Versioned for RoleCard {
    fn id(&self) -> &str {
        &self.id
    }
    fn version(&self) -> &str {
        &self.version
    }
}

impl Versioned for RoomSpec {
    fn id(&self) -> &str {
        &self.id
    }
    fn version(&self) -> &str {
        &self.version
    }
}

impl Versioned for Persona {
    fn id(&self) -> &str {
        &self.id
    }
    fn version(&self) -> &str {
        &self.version
    }
}

/// Your library files, as `(file name, text)`.
#[derive(Debug, Clone, Default)]
pub struct Files {
    /// Your role files.
    pub roles: Vec<(String, String)>,
    /// Your room files.
    pub rooms: Vec<(String, String)>,
    /// Your persona files.
    pub personas: Vec<(String, String)>,
}

/// Everything you can seat and open: the bundled roles and rooms plus your
/// files, with every file that did not pass named.
#[derive(Debug, Clone, Default, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct Library {
    /// By name.
    pub roles: Vec<RoleCard>,
    /// By name.
    pub rooms: Vec<RoomSpec>,
    /// By name. None ship; these are yours.
    pub personas: Vec<Persona>,
    /// Files that were not loaded, and why.
    pub rejected: Vec<Rejected>,
}

impl Library {
    /// The bundled library alone.
    #[must_use]
    pub fn bundled() -> Self {
        Self::with_files(&Files::default())
    }

    /// The bundled library plus your files.
    #[must_use]
    pub fn with_files(files: &Files) -> Self {
        let mut library = Self::default();
        let bundled_roles = BUNDLED_ROLES
            .iter()
            .map(|(file, text)| (format!("bundled {file}"), *text));
        let your_roles = files
            .roles
            .iter()
            .map(|(file, text)| (file.clone(), text.as_str()));
        for (file, text) in bundled_roles.chain(your_roles) {
            match RoleCard::parse(&file, text) {
                Ok(role) => admit(&mut library.roles, &mut library.rejected, &file, role),
                Err(issues) => library.rejected.push(Rejected { file, issues }),
            }
        }
        // Rooms are checked against the whole role library they would seat.
        let bundled_rooms = BUNDLED_ROOMS
            .iter()
            .map(|(file, text)| (format!("bundled {file}"), *text));
        let your_rooms = files
            .rooms
            .iter()
            .map(|(file, text)| (file.clone(), text.as_str()));
        for (file, text) in bundled_rooms.chain(your_rooms) {
            match RoomSpec::parse(&file, text, &library.roles) {
                Ok(room) => admit(&mut library.rooms, &mut library.rejected, &file, room),
                Err(issues) => library.rejected.push(Rejected { file, issues }),
            }
        }
        for (file, text) in &files.personas {
            match Persona::parse(file, text) {
                Ok(persona) => admit(&mut library.personas, &mut library.rejected, file, persona),
                Err(issues) => library.rejected.push(Rejected {
                    file: file.clone(),
                    issues,
                }),
            }
        }
        library.roles.sort_by(|a, b| a.name.cmp(&b.name));
        library.rooms.sort_by(|a, b| a.name.cmp(&b.name));
        library.personas.sort_by(|a, b| a.name.cmp(&b.name));
        library
    }

    /// The role with this id.
    #[must_use]
    pub fn role(&self, id: &str) -> Option<&RoleCard> {
        self.roles.iter().find(|role| role.id == id)
    }

    /// The room with this id.
    #[must_use]
    pub fn room(&self, id: &str) -> Option<&RoomSpec> {
        self.rooms.iter().find(|room| room.id == id)
    }

    /// The persona with this id.
    #[must_use]
    pub fn persona(&self, id: &str) -> Option<&Persona> {
        self.personas.iter().find(|persona| persona.id == id)
    }
}

/// Add an entry, or replace one with the same id when it is a higher
/// version; otherwise name the file.
fn admit<T: Versioned>(items: &mut Vec<T>, rejected: &mut Vec<Rejected>, file: &str, item: T) {
    let Some(index) = items.iter().position(|e| e.id() == item.id()) else {
        items.push(item);
        return;
    };
    if semver(item.version()) > semver(items[index].version()) {
        items[index] = item;
    } else {
        rejected.push(Rejected {
            file: file.to_owned(),
            issues: vec![Issue::new(
                file,
                format!(
                    "{} {} does not replace version {}; raise its version",
                    item.id(),
                    item.version(),
                    items[index].version()
                ),
            )],
        });
    }
}

/// The bundled library plus your files in
/// `{data_dir}/config/{roles,rooms,personas}/`.
#[must_use]
pub fn load(data_dir: &Path) -> Library {
    let config = data_dir.join("config");
    let mut unreadable = Vec::new();
    let files = Files {
        roles: read_dir(&config.join("roles"), &mut unreadable),
        rooms: read_dir(&config.join("rooms"), &mut unreadable),
        personas: read_dir(&config.join("personas"), &mut unreadable),
    };
    let mut library = Library::with_files(&files);
    library.rejected.splice(0..0, unreadable);
    for rejected in &library.rejected {
        let issues = rejected
            .issues
            .iter()
            .map(ToString::to_string)
            .collect::<Vec<_>>()
            .join("; ");
        tracing::warn!(target: "rooms", file = %rejected.file, %issues, "library file not used");
    }
    library
}

/// Every `*.json` in `dir`, by file name. A missing folder is empty.
fn read_dir(dir: &Path, unreadable: &mut Vec<Rejected>) -> Vec<(String, String)> {
    let mut paths: Vec<_> = match std::fs::read_dir(dir) {
        Ok(entries) => entries
            .filter_map(Result::ok)
            .map(|e| e.path())
            .filter(|p| p.extension().is_some_and(|x| x == "json"))
            .collect(),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Vec::new(),
        Err(e) => {
            let file = dir.display().to_string();
            unreadable.push(Rejected {
                issues: vec![Issue::new(&file, format!("could not be read: {e}"))],
                file,
            });
            Vec::new()
        }
    };
    paths.sort();
    paths
        .into_iter()
        .filter_map(|path| {
            let file = path.file_name()?.to_string_lossy().into_owned();
            match std::fs::read_to_string(&path) {
                Ok(text) => Some((file, text)),
                Err(e) => {
                    unreadable.push(Rejected {
                        issues: vec![Issue::new(&file, format!("could not be read: {e}"))],
                        file,
                    });
                    None
                }
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    const RESEARCH: &str = include_str!("../../../../docs/research/chat-rooms-and-roles.md");

    fn validator(file: &str) -> jsonschema::Validator {
        let path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("config")
            .join("schemas")
            .join(file);
        let raw = std::fs::read_to_string(&path).expect("schema file");
        let schema: serde_json::Value = serde_json::from_str(&raw).expect("schema is JSON");
        jsonschema::validator_for(&schema).expect("schema compiles")
    }

    fn errors(validator: &jsonschema::Validator, text: &str) -> Vec<String> {
        let doc: serde_json::Value = serde_json::from_str(text).expect("JSON");
        validator.iter_errors(&doc).map(|e| e.to_string()).collect()
    }

    fn persona_text(id: &str, version: &str) -> String {
        serde_json::json!({
            "schema": PERSONA_SCHEMA,
            "id": id,
            "version": version,
            "name": "Ada",
            "summary": "A patient systems engineer.",
            "tone": "empathetic",
            "backstory": "Thirty years keeping trains on time.",
            "expertise": ["scheduling", "failure analysis"]
        })
        .to_string()
    }

    /// Every bundled file passes its JSON Schema and the rules a schema
    /// cannot say, and nothing is rejected.
    #[test]
    fn every_bundled_file_passes_its_schema_and_its_rules() {
        let roles = validator("role.v1.schema.json");
        for (file, text) in BUNDLED_ROLES {
            assert!(
                errors(&roles, text).is_empty(),
                "{file}: {:?}",
                errors(&roles, text)
            );
        }
        let rooms = validator("room.v1.schema.json");
        for (file, text) in BUNDLED_ROOMS {
            assert!(
                errors(&rooms, text).is_empty(),
                "{file}: {:?}",
                errors(&rooms, text)
            );
        }
        let library = Library::bundled();
        assert!(library.rejected.is_empty(), "{:?}", library.rejected);
        assert_eq!(library.roles.len(), BUNDLED_ROLES.len());
        assert_eq!(library.rooms.len(), BUNDLED_ROOMS.len());
        assert!(library.personas.is_empty(), "no persona ships");
        for id in ["dreamer", "realist", "skeptic", "selector"] {
            assert!(library.role(id).is_some(), "the owner's named role {id}");
        }
    }

    /// A persona file of yours passes the persona schema.
    #[test]
    fn a_persona_passes_its_schema() {
        let personas = validator("persona.v1.schema.json");
        let text = persona_text("ada", "1.0.0");
        assert!(
            errors(&personas, &text).is_empty(),
            "{:?}",
            errors(&personas, &text)
        );
    }

    /// Every source a bundled entry cites is in the research page, so its
    /// evidence can always be followed.
    #[test]
    fn every_cited_source_is_in_the_research() {
        let library = Library::bundled();
        let provenances = library
            .roles
            .iter()
            .map(|role| (role.id.as_str(), &role.provenance))
            .chain(
                library
                    .rooms
                    .iter()
                    .map(|room| (room.id.as_str(), &room.provenance)),
            );
        for (id, provenance) in provenances {
            for source in &provenance.sources {
                let numbered = format!("\n{source}. ");
                let lettered = format!("\n- {source} ");
                assert!(
                    RESEARCH.contains(&numbered) || RESEARCH.contains(&lettered),
                    "{id} cites [{source}], which the research page does not list"
                );
            }
        }
    }

    /// Your files: a broken one is named and skipped; a higher version
    /// replaces a bundled one; an equal version does not.
    #[test]
    fn your_files_are_checked_and_only_a_higher_version_replaces() {
        let selector = BUNDLED_ROLES
            .iter()
            .find(|(file, _)| *file == "selector.json")
            .map(|(_, text)| *text)
            .expect("selector");
        let mut newer: serde_json::Value = serde_json::from_str(selector).expect("selector");
        newer["version"] = "1.1.0".into();
        newer["summary"] = "Your own selector.".into();
        let files = Files {
            roles: vec![
                ("broken.json".to_owned(), "{ not json".to_owned()),
                ("selector-newer.json".to_owned(), newer.to_string()),
                ("selector-same.json".to_owned(), selector.to_owned()),
            ],
            rooms: Vec::new(),
            personas: vec![
                ("ada.json".to_owned(), persona_text("ada", "1.0.0")),
                ("ada-again.json".to_owned(), persona_text("ada", "1.0.0")),
                ("nameless.json".to_owned(), persona_text("Not Kebab", "1")),
            ],
        };
        let library = Library::with_files(&files);
        assert_eq!(
            library.role("selector").map(|role| role.summary.as_str()),
            Some("Your own selector.")
        );
        assert_eq!(library.persona("ada").map(|p| p.name.as_str()), Some("Ada"));
        let rejected: Vec<&str> = library.rejected.iter().map(|r| r.file.as_str()).collect();
        assert_eq!(
            rejected,
            [
                "broken.json",
                "selector-same.json",
                "ada-again.json",
                "nameless.json"
            ]
        );
    }

    /// Files are read from the data folder; a missing folder is empty.
    #[test]
    fn load_reads_your_folders() {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_nanos());
        let data = std::env::temp_dir().join(format!("devpulse-rooms-{nanos}"));
        let personas = data.join("config").join("personas");
        std::fs::create_dir_all(&personas).unwrap();
        std::fs::write(personas.join("ada.json"), persona_text("ada", "1.0.0")).unwrap();
        std::fs::write(personas.join("notes.txt"), "not a persona").unwrap();

        let library = load(&data);
        assert_eq!(library.personas.len(), 1);
        assert_eq!(library.roles.len(), BUNDLED_ROLES.len());
        assert!(library.rejected.is_empty(), "{:?}", library.rejected);
        let _ = std::fs::remove_dir_all(data);
    }

    #[test]
    fn kebab_and_semver() {
        assert!(is_kebab("fact-checker"));
        assert!(is_kebab("pre-mortem2"));
        assert!(!is_kebab("Fact-checker"));
        assert!(!is_kebab("2nd"));
        assert!(!is_kebab("a--b"));
        assert!(!is_kebab("a-"));
        assert_eq!(semver("1.2.3"), Some((1, 2, 3)));
        assert_eq!(semver("1.2"), None);
        assert_eq!(semver("1.2.3.4"), None);
    }
}
