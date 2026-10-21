//! `ProviderDefinition` — one file per AI you can bring, checked on load.
//!
//! A definition says how to find the provider on this machine, how to read
//! its installed and latest versions, how to tell whether you are signed in
//! (its own status command, or the presence of its own login file — never
//! its contents), and the vendor's own commands to sign in and to update.
//! Adding a provider means adding a file that validates; nothing about a
//! vendor lives in code.

use anyhow::{bail, Context, Result};
use serde::{Deserialize, Serialize};

/// What kind of provider this is.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "snake_case")]
pub enum ProviderKind {
    /// A coding agent you use through your own subscription (its CLI).
    SubscriptionAgent,
    /// A desktop app (no programmatic chat; it can be given context over MCP).
    DesktopApp,
}

/// The protocol `DevPulse` speaks to it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "snake_case")]
pub enum AdapterKind {
    /// The Agent Client Protocol (the agent owns its login and billing).
    AcpAgent,
    /// The Model Context Protocol: `DevPulse` offers context to the app.
    McpClient,
}

/// Values per operating system (`windows`, `macos`, `linux`).
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PerOs {
    /// Windows.
    #[serde(default)]
    pub windows: Vec<String>,
    /// macOS.
    #[serde(default)]
    pub macos: Vec<String>,
    /// Linux.
    #[serde(default)]
    pub linux: Vec<String>,
}

impl PerOs {
    /// The values for this OS.
    #[must_use]
    pub fn current(&self) -> &[String] {
        match std::env::consts::OS {
            "windows" => &self.windows,
            "macos" => &self.macos,
            _ => &self.linux,
        }
    }
}

/// How to find it installed.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Detect {
    /// Program names looked up on `PATH`, in order.
    #[serde(default)]
    pub executables: Vec<String>,
    /// Known install locations, checked when it is not on `PATH`
    /// (`~`, `%VAR%` and `$VAR` are expanded).
    #[serde(default)]
    pub paths: PerOs,
}

/// A command: the provider's own program unless `program` names another
/// (for example `npm` for a CLI that has no updater of its own).
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CommandSpec {
    /// Another program to run instead of the provider's own.
    #[serde(default)]
    pub program: Option<String>,
    /// Arguments after the program (may be empty for an interactive sign-in
    /// that starts with the program itself).
    pub args: Vec<String>,
}

/// Where its latest release is published — exactly one source.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Latest {
    /// An npm package (`https://registry.npmjs.org/<package>/latest`).
    #[serde(default)]
    pub npm: Option<String>,
    /// A GitHub repository `owner/name` (its latest release's tag).
    #[serde(default)]
    pub github: Option<String>,
    /// An `https://` address whose plain-text body is the version.
    #[serde(default)]
    pub text_url: Option<String>,
}

/// How to tell whether you are signed in.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SignedInSpec {
    /// The vendor's own status command. With no output rules, exit code 0
    /// means signed in and any other means signed out.
    #[serde(default)]
    pub args: Option<Vec<String>>,
    /// The status output contains this when signed in.
    #[serde(default)]
    pub output_signed_in: Option<String>,
    /// The status output contains this when signed out.
    #[serde(default)]
    pub output_signed_out: Option<String>,
    /// Login files the vendor writes: one present means signed in. Only
    /// their presence is checked, never their contents.
    #[serde(default)]
    pub files: PerOs,
    /// No login file means signed out. Leave false when the vendor can also
    /// keep the login in the OS keychain or an environment variable — then
    /// a missing file only means "can't tell".
    #[serde(default)]
    pub absent_means_signed_out: bool,
}

/// One provider `DevPulse` knows how to find and check.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ProviderDefinition {
    /// Stable id (`claude-code`).
    pub id: String,
    /// Display name.
    pub name: String,
    /// What it is.
    pub kind: ProviderKind,
    /// How `DevPulse` talks to it.
    pub adapter: AdapterKind,
    /// The vendor's documentation.
    pub docs: String,
    /// Something the vendor has said that you should know (shown on its
    /// card), with the date it was checked.
    #[serde(default)]
    pub note: Option<String>,
    /// How to find it.
    pub detect: Detect,
    /// How to read the installed version (with its own program).
    #[serde(default)]
    pub version: Option<CommandSpec>,
    /// Where the latest version is published.
    #[serde(default)]
    pub latest: Option<Latest>,
    /// How to tell whether you are signed in.
    #[serde(default)]
    pub signed_in: Option<SignedInSpec>,
    /// The vendor's own sign-in command (opened in a terminal window).
    #[serde(default)]
    pub sign_in: Option<CommandSpec>,
    /// The vendor's own update command.
    #[serde(default)]
    pub update: Option<CommandSpec>,
}

impl ProviderDefinition {
    /// Parse and check one definition file.
    ///
    /// # Errors
    /// Returns an error naming the field that is wrong.
    pub fn parse(text: &str) -> Result<Self> {
        let definition: Self = toml::from_str(text).context("read the provider definition")?;
        definition.check()?;
        Ok(definition)
    }

    fn check(&self) -> Result<()> {
        let id_ok = !self.id.is_empty()
            && self
                .id
                .chars()
                .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-');
        if !id_ok {
            bail!("id {:?}: lowercase letters, digits and '-' only", self.id);
        }
        if self.name.trim().is_empty() {
            bail!("{}: name is empty", self.id);
        }
        if !self.docs.starts_with("https://") {
            bail!("{}: docs must be an https:// address", self.id);
        }
        let paths = &self.detect.paths;
        if self.detect.executables.is_empty()
            && paths.windows.is_empty()
            && paths.macos.is_empty()
            && paths.linux.is_empty()
        {
            bail!("{}: detect lists no executable and no path", self.id);
        }
        if let Some(latest) = &self.latest {
            let sources = [
                latest.npm.is_some(),
                latest.github.is_some(),
                latest.text_url.is_some(),
            ];
            if sources.iter().filter(|s| **s).count() != 1 {
                bail!(
                    "{}: latest names exactly one of npm, github or text_url",
                    self.id
                );
            }
            if let Some(repo) = &latest.github {
                if repo.split('/').count() != 2 {
                    bail!(
                        "{}: latest.github must be owner/name, got {repo:?}",
                        self.id
                    );
                }
            }
            if latest
                .text_url
                .as_ref()
                .is_some_and(|u| !u.starts_with("https://"))
            {
                bail!("{}: latest.text_url must be an https:// address", self.id);
            }
        }
        if let Some(signed_in) = &self.signed_in {
            let files = &signed_in.files;
            let has_files =
                !(files.windows.is_empty() && files.macos.is_empty() && files.linux.is_empty());
            if signed_in.args.is_none() && !has_files {
                bail!(
                    "{}: signed_in needs a status command or login files",
                    self.id
                );
            }
            if signed_in.args.is_none()
                && (signed_in.output_signed_in.is_some() || signed_in.output_signed_out.is_some())
            {
                bail!("{}: signed_in output rules need a status command", self.id);
            }
        }
        for (field, spec) in [("version", &self.version), ("update", &self.update)] {
            if spec.as_ref().is_some_and(|s| s.args.is_empty()) {
                bail!("{}: {field}.args is empty", self.id);
            }
        }
        Ok(())
    }
}

/// `~`, `%VAR%` and `$VAR` expanded; `None` when a variable is not set.
#[must_use]
pub fn expand(path: &str, home: Option<&std::path::Path>) -> Option<std::path::PathBuf> {
    let mut out = String::new();
    let mut rest = path;
    if let Some(tail) = rest.strip_prefix('~') {
        out.push_str(home?.to_str()?);
        rest = tail;
    }
    while !rest.is_empty() {
        if let Some(tail) = rest.strip_prefix('%') {
            let end = tail.find('%')?;
            out.push_str(&std::env::var(&tail[..end]).ok()?);
            rest = &tail[end + 1..];
        } else if let Some(tail) = rest.strip_prefix('$') {
            let end = tail
                .find(|c: char| !(c.is_ascii_alphanumeric() || c == '_'))
                .unwrap_or(tail.len());
            out.push_str(&std::env::var(&tail[..end]).ok()?);
            rest = &tail[end..];
        } else {
            let next = rest.find(['%', '$']).unwrap_or(rest.len());
            out.push_str(&rest[..next]);
            rest = &rest[next..];
        }
    }
    // Rebuilt from its components so the separators are the OS's own.
    Some(std::path::Path::new(&out).components().collect())
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    const GOOD: &str = r#"
id = "example-agent"
name = "Example Agent"
kind = "subscription_agent"
adapter = "acp_agent"
docs = "https://example.com/docs"

[detect]
executables = ["example"]
paths = { windows = ["%LOCALAPPDATA%/Example/example.exe"] }

[version]
args = ["--version"]

[latest]
npm = "@example/agent"

[signed_in]
args = ["auth", "status"]

[sign_in]
args = ["login"]

[update]
args = ["update"]
"#;

    #[test]
    fn a_complete_definition_parses() {
        let d = ProviderDefinition::parse(GOOD).expect("good");
        assert_eq!(d.id, "example-agent");
        assert_eq!(d.kind, ProviderKind::SubscriptionAgent);
        assert_eq!(d.detect.paths.windows.len(), 1);
    }

    #[test]
    fn broken_definitions_name_what_is_wrong() {
        let cases = [
            (GOOD.replace("example-agent", "Example Agent"), "id"),
            (
                GOOD.replace("https://example.com/docs", "example.com"),
                "docs",
            ),
            (
                GOOD.replace("npm = \"@example/agent\"", "npm = \"a\"\ngithub = \"o/r\""),
                "exactly one",
            ),
            (
                GOOD.replace("npm = \"@example/agent\"", "text_url = \"http://x/latest\""),
                "text_url",
            ),
            (
                GOOD.replace("[update]\nargs = [\"update\"]", "[update]\nargs = []"),
                "update.args",
            ),
            (
                GOOD.replace("kind = \"subscription_agent\"", "kind = \"magic\""),
                "kind",
            ),
        ];
        for (text, needle) in cases {
            let error = format!("{:#}", ProviderDefinition::parse(&text).unwrap_err());
            assert!(error.contains(needle), "{needle:?} not named in: {error}");
        }
    }

    #[test]
    fn paths_expand_home_and_variables() {
        let home = std::path::Path::new("/home/ada");
        assert_eq!(
            expand("~/.local/bin/claude", Some(home)).unwrap(),
            std::path::PathBuf::from("/home/ada/.local/bin/claude")
        );
        std::env::set_var("DEVPULSE_TEST_DIR", "/opt/x");
        assert_eq!(
            expand("%DEVPULSE_TEST_DIR%/a", None).unwrap(),
            std::path::PathBuf::from("/opt/x/a")
        );
        assert_eq!(
            expand("$DEVPULSE_TEST_DIR/b", None).unwrap(),
            std::path::PathBuf::from("/opt/x/b")
        );
        assert!(expand("%DEVPULSE_NOT_SET_9F%/a", None).is_none());
        assert!(expand("~/x", None).is_none(), "no home, no path");
    }
}
