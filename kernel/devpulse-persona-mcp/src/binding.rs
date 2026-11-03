//! What one connection may reach (plan 0001 B6.2).
//!
//! The owner of the memory decides this per connection; a caller's arguments
//! never widen it. A session bound to a project reads your own blocks and its
//! project's, and writes only its project's: your own blocks reach every
//! project, so an agent, or text an agent read, must not be able to change
//! them. You change those in `DevPulse`.
//!
//! This keeps each session's context to its project. It is not a sandbox: an
//! agent with tools can already read your files.

use crate::error::{PersonaError, PersonaResult};

const PROJECT_SCOPE: &str = "project";
const USER_SCOPE: &str = "user";

/// Whose memory a connection serves.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Binding {
    /// Nothing narrows it: direct mode, or `DevPulse`'s own screens.
    Unbound,
    /// A session working in this project.
    Project(String),
}

impl Binding {
    /// Check a read, filling in the session's project when the caller named
    /// none.
    ///
    /// # Errors
    /// Returns [`PersonaError::Auth`] for another project's memory.
    pub fn read(&self, scope: &str, slug: &mut Option<String>) -> PersonaResult<()> {
        let Self::Project(own) = self else {
            return Ok(());
        };
        if scope != PROJECT_SCOPE {
            return Ok(());
        }
        match slug.as_deref() {
            None => {
                *slug = Some(own.clone());
                Ok(())
            }
            Some(asked) if asked == own => Ok(()),
            Some(asked) => Err(PersonaError::Auth(format!(
                "this session works in project {own:?} and cannot reach project {asked:?}"
            ))),
        }
    }

    /// Check a write, filling in the session's project when the caller named
    /// none.
    ///
    /// # Errors
    /// Returns [`PersonaError::Auth`] for another project's memory, or for
    /// your own blocks from a session.
    pub fn write(&self, scope: &str, slug: &mut Option<String>) -> PersonaResult<()> {
        if matches!(self, Self::Project(_)) && scope == USER_SCOPE {
            return Err(PersonaError::Auth(
                "your own memory applies to every project, so it is changed in DevPulse; \
                 this session can save to its project's memory (scope \"project\")"
                    .to_owned(),
            ));
        }
        self.read(scope, slug)
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, reason = "test assertions")]

    use super::*;

    fn bound() -> Binding {
        Binding::Project("alpha".to_owned())
    }

    #[test]
    fn a_session_reads_your_blocks_and_its_project_only() {
        let mut none = None;
        bound().read(USER_SCOPE, &mut none).expect("your blocks");
        assert_eq!(none, None, "your blocks have no project");

        let mut unnamed = None;
        bound().read(PROJECT_SCOPE, &mut unnamed).expect("its own");
        assert_eq!(unnamed.as_deref(), Some("alpha"));

        let mut own = Some("alpha".to_owned());
        bound().read(PROJECT_SCOPE, &mut own).expect("named");

        let mut other = Some("beta".to_owned());
        let error = bound()
            .read(PROJECT_SCOPE, &mut other)
            .expect_err("another project");
        assert!(matches!(error, PersonaError::Auth(_)), "{error}");
    }

    #[test]
    fn a_session_writes_only_its_project() {
        let mut none = None;
        let error = bound()
            .write(USER_SCOPE, &mut none)
            .expect_err("your blocks");
        assert!(matches!(error, PersonaError::Auth(_)), "{error}");

        let mut unnamed = None;
        bound().write(PROJECT_SCOPE, &mut unnamed).expect("its own");
        assert_eq!(unnamed.as_deref(), Some("alpha"));

        let mut other = Some("beta".to_owned());
        bound()
            .write(PROJECT_SCOPE, &mut other)
            .expect_err("another project");
    }

    #[test]
    fn nothing_narrows_an_unbound_connection() {
        let mut other = Some("beta".to_owned());
        Binding::Unbound
            .write(PROJECT_SCOPE, &mut other)
            .expect("any project");
        assert_eq!(other.as_deref(), Some("beta"));
        let mut none = None;
        Binding::Unbound
            .write(USER_SCOPE, &mut none)
            .expect("your blocks");
        let mut missing = None;
        Binding::Unbound
            .read(PROJECT_SCOPE, &mut missing)
            .expect("the verb reports a missing project");
        assert_eq!(missing, None);
    }

    #[test]
    fn an_unknown_scope_is_left_for_the_verb_to_report() {
        let mut slug = Some("beta".to_owned());
        bound().read("galaxy", &mut slug).expect("not this check's");
        bound()
            .write("galaxy", &mut slug)
            .expect("not this check's");
        assert_eq!(slug.as_deref(), Some("beta"));
    }
}
