//! Saving your own roles, rooms and personas (plan 0001 B4.5).
//!
//! A bundled entry is a template: yours starts from it under a new id, or
//! replaces it with a higher version. The kernel checks a file against the same
//! rules as the library it joins, so a file that would not load is never saved,
//! and what is wrong with it is said at the field it is in.
//! `config/AUTHORING.md` says the minimal requirements to write one by hand.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use super::{Issue, Library, Persona, RoleCard, RoomSpec, load, semver};

/// Which part of your library a file belongs to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum LibraryKind {
    /// A job one seat does.
    Role,
    /// Who sits where, in what order.
    Room,
    /// A character a seat speaks as.
    Persona,
}

impl LibraryKind {
    const fn folder(self) -> &'static str {
        match self {
            Self::Role => "roles",
            Self::Room => "rooms",
            Self::Persona => "personas",
        }
    }
}

fn your_file(data_dir: &Path, kind: LibraryKind, id: &str) -> PathBuf {
    data_dir
        .join("config")
        .join(kind.folder())
        .join(format!("{id}.json"))
}

/// The id and version in `text`, checked as the library would check it. The id
/// comes back kebab-case, which is what makes it safe to name a file with.
fn checked(
    library: &Library,
    kind: LibraryKind,
    text: &str,
) -> Result<(String, String), Vec<Issue>> {
    let file = "your file";
    match kind {
        LibraryKind::Role => RoleCard::parse(file, text).map(|role| (role.id, role.version)),
        LibraryKind::Persona => Persona::parse(file, text).map(|p| (p.id, p.version)),
        LibraryKind::Room => {
            let room = RoomSpec::parse(file, text, &library.roles)?;
            let unknown: Vec<Issue> = room
                .seats
                .iter()
                .flat_map(|seat| seat.personas.iter())
                .filter(|id| library.persona(id).is_none())
                .map(|id| {
                    Issue::new(
                        format!("room {} · seats", room.id),
                        format!("persona {id} is not in your library"),
                    )
                })
                .collect();
            if unknown.is_empty() {
                Ok((room.id, room.version))
            } else {
                Err(unknown)
            }
        }
    }
}

/// What a bundled entry of this id is at, if there is one.
fn bundled_version(kind: LibraryKind, id: &str) -> Option<String> {
    let bundled = Library::bundled();
    match kind {
        LibraryKind::Role => bundled.role(id).map(|role| role.version.clone()),
        LibraryKind::Room => bundled.room(id).map(|room| room.version.clone()),
        LibraryKind::Persona => bundled.persona(id).map(|p| p.version.clone()),
    }
}

/// Save a file of yours to `{data_dir}/config/`, replacing your earlier one of
/// the same id. Returns its id.
///
/// # Errors
/// Everything wrong with it, at the field it is in; nothing is written.
pub fn save(data_dir: &Path, kind: LibraryKind, text: &str) -> Result<String, Vec<Issue>> {
    let library = load(data_dir);
    let (id, version) = checked(&library, kind, text)?;
    if let Some(bundled) = bundled_version(kind, &id)
        && semver(&version) <= semver(&bundled)
    {
        return Err(vec![Issue::new(
            format!("{} {id}", kind.folder()),
            format!(
                "ships with DevPulse at version {bundled}; use a new id, or raise the version above it to replace it"
            ),
        )]);
    }
    let path = your_file(data_dir, kind, &id);
    write_whole(&path, text).map_err(|error| {
        vec![Issue::new(
            path.display().to_string(),
            format!("could not be saved: {error}"),
        )]
    })?;
    Ok(id)
}

/// Delete a file of yours; returns whether there was one. A bundled entry it
/// replaced comes back.
///
/// # Errors
/// When the id is not one a file of yours could have, or it cannot be deleted.
pub fn remove(data_dir: &Path, kind: LibraryKind, id: &str) -> Result<bool, Vec<Issue>> {
    if !super::is_kebab(id) {
        return Err(vec![Issue::new(
            format!("{} {id}", kind.folder()),
            "must be kebab-case",
        )]);
    }
    let path = your_file(data_dir, kind, id);
    match std::fs::remove_file(&path) {
        Ok(()) => Ok(true),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(false),
        Err(error) => Err(vec![Issue::new(
            path.display().to_string(),
            format!("could not be deleted: {error}"),
        )]),
    }
}

/// Write beside the target and rename over it, so a failure never leaves half a
/// file for the library to refuse.
fn write_whole(path: &Path, text: &str) -> std::io::Result<()> {
    if let Some(folder) = path.parent() {
        std::fs::create_dir_all(folder)?;
    }
    let partial = path.with_extension("json.partial");
    std::fs::write(&partial, text)?;
    std::fs::rename(&partial, path)
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    fn persona(id: &str, version: &str) -> String {
        serde_json::json!({
            "schema": "dpl.persona/1", "id": id, "version": version, "name": "Ada",
            "summary": "A character.", "tone": "concise",
            "backstory": "Someone.", "expertise": ["things"],
        })
        .to_string()
    }

    fn room_from_template(id: &str) -> serde_json::Value {
        let library = Library::bundled();
        let mut room = serde_json::to_value(library.room("council").unwrap()).unwrap();
        room["id"] = id.into();
        room["name"] = "My Council".into();
        room
    }

    #[test]
    fn a_saved_file_joins_your_library_and_deleting_it_leaves_it() {
        let data = tempfile::tempdir().unwrap();
        let id = save(data.path(), LibraryKind::Persona, &persona("ada", "1.0.0")).unwrap();
        assert_eq!(id, "ada");
        let library = load(data.path());
        assert!(library.persona("ada").is_some());
        assert!(library.yours.personas.contains(&"ada".to_owned()));
        assert!(library.rejected.is_empty(), "{:?}", library.rejected);

        assert!(remove(data.path(), LibraryKind::Persona, "ada").unwrap());
        assert!(load(data.path()).persona("ada").is_none());
        assert!(!remove(data.path(), LibraryKind::Persona, "ada").unwrap());
    }

    #[test]
    fn a_tailored_council_starts_from_the_template_under_its_own_id() {
        let data = tempfile::tempdir().unwrap();
        let mut room = room_from_template("my-council");
        room["seats"][0]["count"] = 5.into();
        let id = save(data.path(), LibraryKind::Room, &room.to_string()).unwrap();
        let library = load(data.path());
        let saved = library.room(&id).unwrap();
        assert_eq!(saved.seats[0].count, 5);
        assert!(library.room("council").is_some(), "the template stays");
    }

    #[test]
    fn taking_a_bundled_id_needs_a_higher_version() {
        let data = tempfile::tempdir().unwrap();
        let same = room_from_template("council");
        let issues = save(data.path(), LibraryKind::Room, &same.to_string()).unwrap_err();
        assert!(issues[0].problem.contains("use a new id"), "{issues:?}");

        let mut newer = room_from_template("council");
        newer["version"] = "2.0.0".into();
        save(data.path(), LibraryKind::Room, &newer.to_string()).unwrap();
        assert_eq!(
            load(data.path()).room("council").unwrap().name,
            "My Council"
        );

        // Deleting yours brings the bundled one back.
        remove(data.path(), LibraryKind::Room, "council").unwrap();
        assert_ne!(
            load(data.path()).room("council").unwrap().name,
            "My Council"
        );
    }

    #[test]
    fn a_file_that_would_not_load_is_never_saved_and_says_why() {
        let data = tempfile::tempdir().unwrap();
        let mut bad = room_from_template("my-council");
        bad["seats"][0]["role"] = "oracle@1".into();
        let issues = save(data.path(), LibraryKind::Room, &bad.to_string()).unwrap_err();
        assert!(
            issues
                .iter()
                .any(|i| i.problem.contains("not in the library")),
            "{issues:?}"
        );
        assert!(load(data.path()).room("my-council").is_none());

        let mut ghost = room_from_template("my-council");
        ghost["seats"][0]["personas"] = serde_json::json!(["nobody"]);
        let issues = save(data.path(), LibraryKind::Room, &ghost.to_string()).unwrap_err();
        assert!(issues[0].problem.contains("nobody"), "{issues:?}");

        assert!(save(data.path(), LibraryKind::Role, "{ not json").is_err());
    }

    #[test]
    fn an_id_cannot_walk_out_of_your_folder() {
        let data = tempfile::tempdir().unwrap();
        let bad = persona("../../escape", "1.0.0");
        assert!(save(data.path(), LibraryKind::Persona, &bad).is_err());
        assert!(remove(data.path(), LibraryKind::Persona, "../../escape").is_err());
    }
}
