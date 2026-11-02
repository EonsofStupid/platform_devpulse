//! `ProviderDefinition` — the configurable half of a registry row, one file
//! per provider found on your machine, checked on load.
//!
//! The registry row ([`super::registry`], keyed by `ProviderId`) says what
//! the provider is: its name, vendor, docs, and how `DevPulse` talks to it.
//! The definition says where this machine keeps it: how to find it, how to
//! read its installed and latest versions, how to tell whether you are
//! signed in (its own status command, or the presence of its own login file
//! — never its contents), the vendor's own sign-in and update commands, and
//! the arguments that start it for a conversation. Your files override the
//! bundled ones by id.

use anyhow::{Context, Result, anyhow, bail};
use serde::{Deserialize, Serialize};

use super::registry;
use super::types::{AgentProtocol, AiProvider, Classification, ProviderId, Transport};

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
    /// The agent's own one-shot mode: the question as an argument, the
    /// answer on stdout (for a vendor that has not confirmed an ACP route).
    Headless,
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

/// A connector: a small program, published on npm, that speaks ACP for an
/// agent whose own CLI does not. `DevPulse` installs it into its own folder
/// when you click.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ConnectorSpec {
    /// The npm package.
    pub npm: String,
    /// The program the package installs.
    pub bin: String,
}

/// How `DevPulse` installs it when you click **Install** (plan 0001 B3.10;
/// owner 2026-10-24: "the user just actually click the actions to do the
/// install keeping it their decision"): the vendor's own, unmodified build
/// by its official method, into the `DevPulse` folder
/// (`{data_dir}/tools/agents/{id}`). Exactly one method.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct InstallSpec {
    /// The vendor's npm package (needs Node.js; its `bin` is the program).
    #[serde(default)]
    pub npm: Option<String>,
    /// The program the npm package installs.
    #[serde(default)]
    pub bin: Option<String>,
    /// The vendor's release files, checked against its manifest.
    #[serde(default)]
    pub release: Option<ReleaseSpec>,
}

/// A vendor's published release: the latest version, a manifest naming
/// each platform's file with its SHA-256, and the file itself. In the
/// addresses, `{version}` is the version, `{platform}` the vendor's name
/// for this machine (`win32-x64`, `darwin-arm64`, `linux-x64`, …) and
/// `{binary}` the file the manifest names. The manifest's shape:
/// `platforms.{platform}.{binary, checksum, size}`.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReleaseSpec {
    /// Plain text: the latest version.
    pub latest: String,
    /// The release manifest.
    pub manifest: String,
    /// The release file.
    pub binary: String,
}

/// Where it keeps its own session history — read only, so `AgentHub` lists
/// your sessions wherever `DevPulse` runs (plan 0009 R3a).
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct HistorySpec {
    /// Which reader understands its files.
    pub format: HistoryFormat,
    /// The history folder (`~` expanded).
    pub root: String,
    /// An environment variable that moves the vendor's home folder; the
    /// history is then `{that folder}/{subdir}`.
    #[serde(default)]
    pub home_env: Option<String>,
    /// The history's folder inside a moved home.
    #[serde(default)]
    pub subdir: Option<String>,
    /// How far into a file your first request can sit, in bytes — a session
    /// is named by it, and some tools write long instructions first. The
    /// reader's default when absent.
    #[serde(default)]
    pub prefix_bytes: Option<usize>,
}

/// A history format `DevPulse` reads.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum HistoryFormat {
    /// Claude Code's per-session JSON lines.
    ClaudeCode,
    /// Codex's rollout JSON lines.
    Codex,
}

impl HistoryFormat {
    /// The provider whose files this reader understands.
    #[must_use]
    pub const fn provider(self) -> ProviderId {
        match self {
            Self::ClaudeCode => ProviderId::ClaudeCode,
            Self::Codex => ProviderId::Codex,
        }
    }
}

/// How `DevPulse` talks to it (the registry row's agent protocol says
/// which). In `args` and `env` values, `{program}` is the provider's own
/// program and `{prompt}` the question.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ConnectSpec {
    /// `acp_agent`: the arguments that start its ACP server on stdio.
    /// `headless`: a one-shot run that must carry `{prompt}`.
    #[serde(default)]
    pub args: Vec<String>,
    /// Environment for that program.
    #[serde(default)]
    pub env: std::collections::BTreeMap<String, String>,
    /// The connector that speaks ACP in its place (`acp_agent` only); it is
    /// run instead of the provider's own program.
    #[serde(default)]
    pub connector: Option<ConnectorSpec>,
    /// How a conversation runs in the agent's headless mode (headless only;
    /// an ACP agent keeps one session open instead).
    #[serde(default)]
    pub conversation: Option<ConversationSpec>,
}

/// One conversation turn in an agent's headless mode.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ConversationSpec {
    /// Arguments for a turn; must carry `{prompt}`.
    pub args: Vec<String>,
    /// Added on later turns to continue the same conversation; must carry
    /// `{session}` (the id the agent reported on its first turn). Without
    /// it, every turn starts fresh.
    #[serde(default)]
    pub resume: Vec<String>,
    /// Added on every turn of a room seat that only talks: the agent's own
    /// switch for no tools and no MCP servers. Without it, `DevPulse` still
    /// refuses the seat's permission requests and gives it an empty folder.
    #[serde(default)]
    pub talk_only: Vec<String>,
    /// What the agent prints.
    pub output: StreamFormat,
}

/// What a headless agent prints during a turn.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum StreamFormat {
    /// Claude Code's `--output-format stream-json`: one JSON event per line
    /// (`system/init` with the session id, `stream_event` text and thinking
    /// deltas, `assistant` tool uses, `result` at the end).
    ClaudeStreamJson,
    /// Plain text: every line is part of the answer.
    Text,
}

/// One provider `DevPulse` knows how to find and check.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ProviderDefinition {
    /// Its registry id (`claude-code`).
    pub id: ProviderId,
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
    /// How `DevPulse` installs it when you click Install.
    #[serde(default)]
    pub install: Option<InstallSpec>,
    /// Where it keeps its own session history.
    #[serde(default)]
    pub history: Option<HistorySpec>,
    /// How to talk to it; without it, it can be found but not asked.
    #[serde(default)]
    pub connect: Option<ConnectSpec>,
}

impl ProviderDefinition {
    /// Its registry row — always there for a definition [`Self::parse`]
    /// accepted (it refuses an id the registry does not have).
    #[must_use]
    pub fn row(&self) -> Option<&'static AiProvider> {
        registry::find(self.id)
    }

    /// Display name, from the registry.
    #[must_use]
    pub fn name(&self) -> &'static str {
        self.row().map_or(self.id.key(), |r| r.display_name)
    }

    /// The vendor's documentation, from the registry.
    #[must_use]
    pub fn docs(&self) -> &'static str {
        self.row().map_or("", |r| r.docs_url)
    }

    /// What it is, from the registry: a desktop app, or an agent you use
    /// through your own subscription.
    #[must_use]
    pub fn kind(&self) -> ProviderKind {
        let desktop = self
            .row()
            .is_some_and(|r| r.classifications.contains(&Classification::DesktopApp));
        if desktop {
            ProviderKind::DesktopApp
        } else {
            ProviderKind::SubscriptionAgent
        }
    }

    /// The agent protocol `DevPulse` talks to it with, from the registry;
    /// `None` for a provider that is not an agent program.
    #[must_use]
    pub fn protocol(&self) -> Option<AgentProtocol> {
        self.row()?.transports.iter().find_map(|t| match t {
            Transport::AgentCli { protocol } => Some(*protocol),
            _ => None,
        })
    }

    /// How `DevPulse` talks to it, as the report shows it.
    #[must_use]
    pub fn adapter(&self) -> AdapterKind {
        match self.protocol() {
            Some(AgentProtocol::Acp) => AdapterKind::AcpAgent,
            Some(AgentProtocol::Headless) => AdapterKind::Headless,
            None => AdapterKind::McpClient,
        }
    }

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
        let id = self.id.key();
        let row =
            registry::find(self.id).ok_or_else(|| anyhow!("{id}: not in the provider registry"))?;
        let found_on_this_machine = row.classifications.iter().any(|c| {
            matches!(
                c,
                Classification::SubscriptionPath | Classification::DesktopApp
            )
        });
        if !found_on_this_machine {
            bail!("{id}: definitions are for subscription agents and desktop apps");
        }
        let paths = &self.detect.paths;
        if self.detect.executables.is_empty()
            && paths.windows.is_empty()
            && paths.macos.is_empty()
            && paths.linux.is_empty()
        {
            bail!("{id}: detect lists no executable and no path");
        }
        if let Some(latest) = &self.latest {
            let sources = [
                latest.npm.is_some(),
                latest.github.is_some(),
                latest.text_url.is_some(),
            ];
            if sources.iter().filter(|s| **s).count() != 1 {
                bail!("{id}: latest names exactly one of npm, github or text_url");
            }
            if let Some(repo) = &latest.github
                && repo.split('/').count() != 2
            {
                bail!("{id}: latest.github must be owner/name, got {repo:?}");
            }
            if latest
                .text_url
                .as_ref()
                .is_some_and(|u| !u.starts_with("https://"))
            {
                bail!("{id}: latest.text_url must be an https:// address");
            }
        }
        if let Some(signed_in) = &self.signed_in {
            let files = &signed_in.files;
            let has_files =
                !(files.windows.is_empty() && files.macos.is_empty() && files.linux.is_empty());
            if signed_in.args.is_none() && !has_files {
                bail!("{id}: signed_in needs a status command or login files");
            }
            if signed_in.args.is_none()
                && (signed_in.output_signed_in.is_some() || signed_in.output_signed_out.is_some())
            {
                bail!("{id}: signed_in output rules need a status command");
            }
        }
        for (field, spec) in [("version", &self.version), ("update", &self.update)] {
            if spec.as_ref().is_some_and(|s| s.args.is_empty()) {
                bail!("{id}: {field}.args is empty");
            }
        }
        if let Some(connect) = &self.connect {
            self.check_connect(connect)?;
        }
        if let Some(install) = &self.install {
            self.check_install(install)?;
        }
        if let Some(history) = &self.history {
            if history.format.provider() != self.id {
                bail!(
                    "{id}: history.format reads {}'s files, not {id}'s",
                    history.format.provider().key()
                );
            }
            if history.root.trim().is_empty() {
                bail!("{id}: history.root is empty");
            }
            if history.home_env.is_some() != history.subdir.is_some() {
                bail!("{id}: history.home_env and history.subdir go together");
            }
            if let Some(bytes) = history.prefix_bytes {
                let range = crate::providers::history::PREFIX_BYTES;
                if !range.contains(&bytes) {
                    bail!(
                        "{id}: history.prefix_bytes is {bytes}; it must be {} to {}",
                        range.start(),
                        range.end()
                    );
                }
            }
        }
        Ok(())
    }

    fn check_install(&self, install: &InstallSpec) -> Result<()> {
        let id = self.id.key();
        match (&install.npm, &install.bin, &install.release) {
            (Some(npm), Some(bin), None) => check_package(&format!("{id}: install"), npm, bin),
            (None, None, Some(release)) => {
                for (field, url) in [
                    ("latest", &release.latest),
                    ("manifest", &release.manifest),
                    ("binary", &release.binary),
                ] {
                    if !url.starts_with("https://") {
                        bail!("{id}: install.release.{field} must be an https:// address");
                    }
                }
                for (field, url, needs) in [
                    ("manifest", &release.manifest, ["{version}"].as_slice()),
                    (
                        "binary",
                        &release.binary,
                        ["{version}", "{platform}", "{binary}"].as_slice(),
                    ),
                ] {
                    if let Some(missing) = needs.iter().find(|n| !url.contains(*n)) {
                        bail!("{id}: install.release.{field} must carry {missing}");
                    }
                }
                Ok(())
            }
            _ => bail!("{id}: install names npm with bin, or release — exactly one"),
        }
    }

    fn check_connect(&self, connect: &ConnectSpec) -> Result<()> {
        let id = self.id.key();
        match self.adapter() {
            AdapterKind::McpClient => {
                bail!("{id}: connect is for acp_agent or headless, not mcp_client");
            }
            AdapterKind::Headless => {
                if !connect.args.iter().any(|a| a.contains("{prompt}")) {
                    bail!("{id}: connect.args for headless must carry {{prompt}}");
                }
                if connect.connector.is_some() {
                    bail!("{id}: connect.connector is for acp_agent only");
                }
                if let Some(conversation) = &connect.conversation {
                    if !conversation.args.iter().any(|a| a.contains("{prompt}")) {
                        bail!("{id}: connect.conversation.args must carry {{prompt}}");
                    }
                    if !conversation.resume.is_empty()
                        && !conversation.resume.iter().any(|a| a.contains("{session}"))
                    {
                        bail!("{id}: connect.conversation.resume must carry {{session}}");
                    }
                }
            }
            AdapterKind::AcpAgent => {
                if connect.args.iter().any(|a| a.contains("{prompt}")) {
                    bail!(
                        "{id}: connect.args for acp_agent start a server; the question goes over ACP, not {{prompt}}"
                    );
                }
                if connect.conversation.is_some() {
                    bail!(
                        "{id}: connect.conversation is for headless agents; an ACP agent keeps one session open"
                    );
                }
            }
        }
        if let Some(connector) = &connect.connector {
            check_package(
                &format!("{id}: connect.connector"),
                &connector.npm,
                &connector.bin,
            )?;
        }
        Ok(())
    }
}

/// An npm package and the program it installs: both named, the program a
/// bare name (it is looked up in the package's own `.bin`).
fn check_package(field: &str, npm: &str, bin: &str) -> Result<()> {
    if npm.trim().is_empty() || bin.trim().is_empty() {
        bail!("{field} needs npm and bin");
    }
    let bin_ok = bin
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'));
    if !bin_ok {
        bail!("{field}.bin {bin:?} is a program name, not a path");
    }
    Ok(())
}

/// `~`, `%VAR%` and `$VAR` expanded; `None` when a variable is not set.
#[must_use]
pub fn expand(path: &str, home: Option<&std::path::Path>) -> Option<std::path::PathBuf> {
    expand_with(path, home, |name| std::env::var(name).ok())
}

fn expand_with(
    path: &str,
    home: Option<&std::path::Path>,
    variable: impl Fn(&str) -> Option<String>,
) -> Option<std::path::PathBuf> {
    let mut out = String::new();
    let mut rest = path;
    if let Some(tail) = rest.strip_prefix('~') {
        out.push_str(home?.to_str()?);
        rest = tail;
    }
    while !rest.is_empty() {
        if let Some(tail) = rest.strip_prefix('%') {
            let end = tail.find('%')?;
            out.push_str(&variable(&tail[..end])?);
            rest = &tail[end + 1..];
        } else if let Some(tail) = rest.strip_prefix('$') {
            let end = tail
                .find(|c: char| !(c.is_ascii_alphanumeric() || c == '_'))
                .unwrap_or(tail.len());
            out.push_str(&variable(&tail[..end])?);
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

    // Codex: an ACP agent in the registry.
    const GOOD: &str = r#"
id = "codex"

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
    fn a_complete_definition_parses_and_reads_its_registry_row() {
        let d = ProviderDefinition::parse(GOOD).expect("good");
        assert_eq!(d.id, ProviderId::Codex);
        assert_eq!(d.name(), "Codex");
        assert_eq!(d.kind(), ProviderKind::SubscriptionAgent);
        assert_eq!(d.adapter(), AdapterKind::AcpAgent);
        assert!(d.docs().starts_with("https://"));
        assert_eq!(d.detect.paths.windows.len(), 1);

        let desktop = GOOD.replace("id = \"codex\"", "id = \"claude-desktop\"");
        let d = ProviderDefinition::parse(&desktop).expect("desktop app");
        assert_eq!(d.kind(), ProviderKind::DesktopApp);
        assert_eq!(d.adapter(), AdapterKind::McpClient);
    }

    #[test]
    fn connect_sections_parse() {
        let acp = format!(
            "{GOOD}
[connect]
env = {{ AGENT_PATH = \"{{program}}\" }}
connector = {{ npm = \"@example/agent-acp\", bin = \"agent-acp\" }}
"
        );
        let d = ProviderDefinition::parse(&acp).expect("acp");
        let connect = d.connect.expect("connect");
        assert_eq!(connect.env["AGENT_PATH"], "{program}");
        assert_eq!(connect.connector.expect("connector").bin, "agent-acp");

        let headless = format!(
            "{GOOD}
[connect]
args = [\"-p\", \"{{prompt}}\"]
"
        )
        .replace("id = \"codex\"", "id = \"claude-code\"");
        let d = ProviderDefinition::parse(&headless).expect("headless");
        assert_eq!(d.adapter(), AdapterKind::Headless);
    }

    #[test]
    fn broken_definitions_name_what_is_wrong() {
        let cases = [
            (
                GOOD.replace("id = \"codex\"", "id = \"Example Agent\""),
                "id",
            ),
            (
                GOOD.replace("id = \"codex\"", "id = \"ollama\""),
                "subscription agents and desktop apps",
            ),
            (
                GOOD.replace(
                    "id = \"codex\"",
                    "name = \"x\"
id = \"codex\"",
                ),
                "name",
            ),
            (
                GOOD.replace(
                    "npm = \"@example/agent\"",
                    "npm = \"a\"
github = \"o/r\"",
                ),
                "exactly one",
            ),
            (
                GOOD.replace("npm = \"@example/agent\"", "text_url = \"http://x/latest\""),
                "text_url",
            ),
            (
                GOOD.replace(
                    "[update]
args = [\"update\"]",
                    "[update]
args = []",
                ),
                "update.args",
            ),
            (
                format!(
                    "{GOOD}
[connect]
args = [\"-p\", \"{{prompt}}\"]
"
                ),
                "server",
            ),
            (
                format!(
                    "{GOOD}
[connect]
args = [\"-p\"]
"
                )
                .replace("id = \"codex\"", "id = \"claude-code\""),
                "{prompt}",
            ),
            (
                format!(
                    "{GOOD}
[connect]
connector = {{ npm = \"x\", bin = \"../x\" }}
"
                ),
                "not a path",
            ),
            (
                format!(
                    "{GOOD}
[connect]
args = [\"acp\"]
"
                )
                .replace("id = \"codex\"", "id = \"claude-desktop\""),
                "mcp_client",
            ),
            (
                format!("{GOOD}\n[connect]\nargs = [\"-p\", \"{{prompt}}\"]\n[connect.conversation]\nargs = [\"-p\"]\noutput = \"text\"\n")
                    .replace("id = \"codex\"", "id = \"claude-code\""),
                "conversation.args",
            ),
            (
                format!("{GOOD}\n[connect]\nargs = [\"-p\", \"{{prompt}}\"]\n[connect.conversation]\nargs = [\"-p\", \"{{prompt}}\"]\nresume = [\"--resume\"]\noutput = \"text\"\n")
                    .replace("id = \"codex\"", "id = \"claude-code\""),
                "{session}",
            ),
            (
                format!("{GOOD}\n[connect]\n[connect.conversation]\nargs = [\"{{prompt}}\"]\noutput = \"text\"\n"),
                "keeps one session open",
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
        let variable = |name: &str| (name == "DEVPULSE_TEST_DIR").then(|| "/opt/x".to_owned());
        assert_eq!(
            expand_with("%DEVPULSE_TEST_DIR%/a", None, variable).unwrap(),
            std::path::PathBuf::from("/opt/x/a")
        );
        assert_eq!(
            expand_with("$DEVPULSE_TEST_DIR/b", None, variable).unwrap(),
            std::path::PathBuf::from("/opt/x/b")
        );
        assert!(expand_with("%DEVPULSE_NOT_SET_9F%/a", None, variable).is_none());
        assert!(expand("~/x", None).is_none(), "no home, no path");
    }
}
