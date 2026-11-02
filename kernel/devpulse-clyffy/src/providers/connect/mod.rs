//! Talking to a provider: one question, its own answer (plan 0001 R4).
//!
//! How depends on the definition's `adapter`:
//! - `acp_agent` — the Agent Client Protocol over stdio, with the official
//!   SDK ([`acp`]): the agent's own program, or the connector that speaks
//!   ACP for it, installed into the `DevPulse` folder on click
//!   ([`connector`]).
//! - `headless` — the agent's own one-shot mode: the question as an
//!   argument, the answer on stdout.
//!
//! Either way the vendor's own program does the work under your own login;
//! `DevPulse` never holds a token. Questions are asked in an empty folder
//! inside the `DevPulse` folder, so the agent has no project to read.

pub mod acp;
pub mod connector;

use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::{Context, Result, anyhow, bail};
use devpulse_process::{self as process, Ran};

use super::definition::{AdapterKind, ProviderDefinition};

/// How long one question may take (an agent may start a runtime first).
pub const ASK_TIMEOUT: Duration = Duration::from_secs(180);

/// What to start, and how.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Launch {
    /// The protocol.
    pub adapter: AdapterKind,
    /// The program: the provider's own, or its connector.
    pub program: PathBuf,
    /// Its arguments, filled in.
    pub args: Vec<String>,
    /// Its environment, filled in.
    pub env: Vec<(String, String)>,
}

/// What the provider said.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Asked {
    /// Its answer, as given.
    pub answer: String,
    /// The agent's own name and version, when it gave them.
    pub agent: Option<String>,
}

/// The empty folder questions are asked in.
#[must_use]
pub fn ask_dir(data_dir: &Path) -> PathBuf {
    data_dir.join("tools").join("ask")
}

fn fill(text: &str, program: &Path, prompt: &str) -> String {
    text.replace("{program}", &program.to_string_lossy())
        .replace("{prompt}", prompt)
}

/// How to ask this provider, installed at `program`.
///
/// # Errors
/// When the definition says nothing about talking to it, or its connector
/// is not installed yet.
pub fn launch(
    definition: &ProviderDefinition,
    program: &Path,
    data_dir: &Path,
    prompt: &str,
) -> Result<Launch> {
    let Some(connect) = &definition.connect else {
        bail!(
            "{} can't be asked yet: its definition has no connect section",
            definition.name()
        );
    };
    let start = match (definition.adapter(), &connect.connector) {
        (AdapterKind::McpClient, _) => {
            bail!(
                "{} is a desktop app; DevPulse offers it context, it can't be asked",
                definition.name()
            )
        }
        (AdapterKind::AcpAgent, Some(spec)) => {
            let at = connector::program(data_dir, definition.id.key(), spec);
            if !at.is_file() {
                bail!(
                    "{} needs its connector ({}) — install it first",
                    definition.name(),
                    spec.npm
                );
            }
            at
        }
        _ => program.to_path_buf(),
    };
    Ok(Launch {
        adapter: definition.adapter(),
        program: start,
        args: connect
            .args
            .iter()
            .map(|a| fill(a, program, prompt))
            .collect(),
        env: connect
            .env
            .iter()
            .map(|(k, v)| (k.clone(), fill(v, program, prompt)))
            .collect(),
    })
}

/// Ask once, in `cwd`, within [`ASK_TIMEOUT`].
///
/// # Errors
/// The provider's own refusal (not signed in, no such flag), a program that
/// could not start, or no answer in time.
pub async fn ask(launch: &Launch, cwd: &Path, prompt: &str) -> Result<Asked> {
    std::fs::create_dir_all(cwd).with_context(|| format!("make {}", cwd.display()))?;
    let program = launch.program.display().to_string();
    match launch.adapter {
        AdapterKind::Headless => {
            let args: Vec<&str> = launch.args.iter().map(String::as_str).collect();
            let env: Vec<(&str, &str)> = launch
                .env
                .iter()
                .map(|(k, v)| (k.as_str(), v.as_str()))
                .collect();
            match process::run_in(Some(cwd), &program, &args, &env, ASK_TIMEOUT).await? {
                Ran::Answered(answer) if answer.ok() => Ok(Asked {
                    answer: answer.stdout.trim().to_owned(),
                    agent: None,
                }),
                Ran::Answered(answer) => Err(anyhow!(answer.reason())),
                Ran::Missing => Err(anyhow!("{program} is not on this machine")),
            }
        }
        AdapterKind::AcpAgent => {
            let answered = tokio::time::timeout(
                ASK_TIMEOUT,
                acp::ask(&launch.program, &launch.args, &launch.env, cwd, prompt),
            )
            .await
            .map_err(|_| anyhow!("{program} did not answer within {}s", ASK_TIMEOUT.as_secs()))??;
            Ok(Asked {
                answer: answered.text.trim().to_owned(),
                agent: answered.agent,
            })
        }
        AdapterKind::McpClient => Err(anyhow!("a desktop app can't be asked")),
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    // Codex: an ACP agent in the registry.
    const BASE: &str = r#"
id = "codex"
[detect]
executables = ["example"]
"#;

    #[test]
    fn headless_fills_the_question_into_its_arguments() {
        // Claude Code: headless in the registry.
        let text = format!("{BASE}[connect]\nargs = [\"-p\", \"{{prompt}}\"]\n")
            .replace("id = \"codex\"", "id = \"claude-code\"");
        let d = ProviderDefinition::parse(&text).unwrap();
        let l = launch(&d, Path::new("/bin/example"), Path::new("/data"), "hello?").unwrap();
        assert_eq!(l.program, PathBuf::from("/bin/example"));
        assert_eq!(l.args, ["-p", "hello?"]);
    }

    #[test]
    fn a_connector_runs_in_place_of_the_program_once_installed() {
        let text = format!(
            "{BASE}[connect]\nenv = {{ EXAMPLE_PATH = \"{{program}}\" }}\nconnector = {{ npm = \"@example/acp\", bin = \"example-acp\" }}\n"
        );
        let d = ProviderDefinition::parse(&text).unwrap();
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_nanos());
        let data = std::env::temp_dir().join(format!("devpulse-launch-{nanos}"));

        let error = launch(&d, Path::new("/bin/example"), &data, "q").unwrap_err();
        assert!(
            format!("{error:#}").contains("install it first"),
            "{error:#}"
        );

        let spec = d.connect.as_ref().unwrap().connector.as_ref().unwrap();
        let bin = connector::program(&data, "codex", spec);
        std::fs::create_dir_all(bin.parent().unwrap()).unwrap();
        std::fs::write(&bin, "").unwrap();
        let l = launch(&d, Path::new("/bin/example"), &data, "q").unwrap();
        assert_eq!(l.program, bin);
        assert_eq!(
            l.env,
            [(
                "EXAMPLE_PATH".to_owned(),
                Path::new("/bin/example").to_string_lossy().into_owned()
            )]
        );
        let _ = std::fs::remove_dir_all(data);
    }

    #[test]
    fn without_a_connect_section_it_says_so() {
        let d = ProviderDefinition::parse(BASE).unwrap();
        let error = launch(&d, Path::new("/bin/example"), Path::new("/data"), "q").unwrap_err();
        assert!(format!("{error:#}").contains("connect"), "{error:#}");
    }
}
