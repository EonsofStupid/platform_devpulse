//! Build settings belong to child commands, never the process environment.
//!
//! xtask has log and progress threads before it configures native tools. Keeping
//! overrides in Rust-owned memory makes configuration safe on every host and
//! lets tool discovery observe the same PATH that build subprocesses receive.

use std::collections::BTreeMap;
use std::ffi::{OsStr, OsString};
use std::path::PathBuf;
use std::process::Command;
use std::sync::{Mutex, OnceLock};

#[derive(Default)]
struct Environment {
    overrides: BTreeMap<OsString, Option<OsString>>,
}

fn key(name: &OsStr) -> OsString {
    #[cfg(windows)]
    {
        // Environment names supplied by the build configuration are ASCII;
        // Windows treats Path/PATH as one variable, as does Command::env.
        name.to_ascii_uppercase()
    }
    #[cfg(not(windows))]
    {
        name.to_owned()
    }
}

impl Environment {
    fn get(&self, name: &OsStr) -> Option<OsString> {
        self.overrides
            .get(&key(name))
            .cloned()
            .unwrap_or_else(|| std::env::var_os(name))
    }

    fn apply(&self, command: &mut Command) {
        for (name, value) in &self.overrides {
            if let Some(value) = value {
                command.env(name, value);
            } else {
                command.env_remove(name);
            }
        }
    }
}

fn environment() -> &'static Mutex<Environment> {
    static ENVIRONMENT: OnceLock<Mutex<Environment>> = OnceLock::new();
    ENVIRONMENT.get_or_init(|| Mutex::new(Environment::default()))
}

pub fn set(name: impl AsRef<OsStr>, value: impl AsRef<OsStr>) {
    environment()
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
        .overrides
        .insert(key(name.as_ref()), Some(value.as_ref().to_owned()));
}

pub fn remove(name: impl AsRef<OsStr>) {
    environment()
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
        .overrides
        .insert(key(name.as_ref()), None);
}

pub fn var_os(name: impl AsRef<OsStr>) -> Option<OsString> {
    environment()
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
        .get(name.as_ref())
}

pub fn var(name: impl AsRef<OsStr>) -> Result<String, std::env::VarError> {
    var_os(name)
        .ok_or(std::env::VarError::NotPresent)?
        .into_string()
        .map_err(std::env::VarError::NotUnicode)
}

pub fn command(program: impl AsRef<OsStr>) -> Command {
    let mut command = Command::new(program);
    environment()
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
        .apply(&mut command);
    command
}

pub fn which(program: impl AsRef<OsStr>) -> which::Result<PathBuf> {
    which::which_in(
        program,
        var_os("PATH"),
        std::env::current_dir().unwrap_or_default(),
    )
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, clippy::expect_used, reason = "test assertions")]
    use super::*;

    #[test]
    fn overrides_reach_child_without_mutating_parent() {
        const NAME: &str = "DEVPULSE_CHILD_ENV_TEST";
        let before = std::env::var_os(NAME);
        let mut environment = Environment::default();
        environment
            .overrides
            .insert(key(OsStr::new(NAME)), Some("child only".into()));
        #[cfg(windows)]
        let mut child = {
            let mut command = Command::new("cmd");
            command.args(["/D", "/C", "echo %DEVPULSE_CHILD_ENV_TEST%"]);
            command
        };
        #[cfg(not(windows))]
        let mut child = {
            let mut command = Command::new("sh");
            command.args(["-c", "printf '%s' \"$DEVPULSE_CHILD_ENV_TEST\""]);
            command
        };
        environment.apply(&mut child);
        let output = child.output().expect("child starts");
        assert!(output.status.success());
        assert_eq!(
            String::from_utf8(output.stdout).unwrap().trim(),
            "child only"
        );
        assert_eq!(std::env::var_os(NAME), before);
    }

    #[test]
    fn removal_masks_inherited_values_and_windows_keys_are_case_insensitive() {
        let before = std::env::var_os("PATH");
        let mut environment = Environment::default();
        environment.overrides.insert(key(OsStr::new("PATH")), None);
        assert_eq!(environment.get(OsStr::new("PATH")), None);
        #[cfg(windows)]
        assert_eq!(environment.get(OsStr::new("Path")), None);
        let mut child = Command::new("unused");
        environment.apply(&mut child);
        assert!(
            child
                .get_envs()
                .any(|(name, value)| name == "PATH" && value.is_none())
        );
        assert_eq!(std::env::var_os("PATH"), before);
    }
}
