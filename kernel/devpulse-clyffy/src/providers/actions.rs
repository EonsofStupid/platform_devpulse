//! What you can do from a provider's card — only when you click.
//!
//! **Install** puts the vendor's own build into the `DevPulse` folder
//! (plan 0001 B3.10). **Update** runs the vendor's own updater and keeps its
//! real output — or, for the copy `DevPulse` installed, installs the latest
//! there again.
//! **Sign in** opens the vendor's own login in a terminal window: logins are
//! interactive (a browser, a code to type), and `DevPulse` never sees a token.
//! **Try it** asks the provider one question the way `DevPulse` will talk to
//! it, and shows its real answer. **Install connector** puts the connector
//! that speaks for it into the `DevPulse` folder.

use std::path::Path;
use std::time::{Duration, Instant};

use devpulse_process::{self as process, Ran};
use serde::{Deserialize, Serialize};

use super::connect::{self, connector};
use super::definition::{CommandSpec, ProviderDefinition};
use super::discovery::installed;
use super::install;
use super::types::ProviderId;

const UPDATE_TIMEOUT: Duration = Duration::from_mins(15);
const OPEN_TIMEOUT: Duration = Duration::from_secs(20);
const OUTPUT_CAP: usize = 8 * 1024;

/// Which action.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub enum ProviderAction {
    /// Install the vendor's own build into the `DevPulse` folder.
    Install,
    /// Run the vendor's updater.
    Update,
    /// Open the vendor's login in a terminal window.
    SignIn,
    /// Ask it one question and show the answer.
    Test,
    /// Install (or update) its connector in the `DevPulse` folder.
    InstallConnector,
}

/// What an action may need beyond the definition.
#[derive(Debug, Clone, Copy)]
pub struct ActionContext<'a> {
    /// The `DevPulse` data folder: connectors install here, and questions
    /// are asked in an empty folder inside it.
    pub data_dir: &'a Path,
    /// The question Try it asks.
    pub prompt: &'a str,
}

/// What an action did.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct ProviderActionRun {
    /// The provider.
    pub provider_id: ProviderId,
    /// The action.
    pub action: ProviderAction,
    /// It worked (for Sign in: the terminal window opened).
    pub ok: bool,
    /// It could not be done from here: `command` is what to run yourself,
    /// and `output` says why.
    pub guided: bool,
    /// The command, as typed.
    pub command: String,
    /// The tool's own output (the end of it, when long); for Try it, the
    /// answer.
    pub output: String,
    /// The agent's own name and version, when it gave them (Try it).
    pub agent: Option<String>,
    /// How long it took, in milliseconds.
    pub elapsed_ms: u32,
    /// Unix seconds when it finished.
    pub finished_at: i64,
}

fn now() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| i64::try_from(d.as_secs()).unwrap_or(i64::MAX))
}

fn tail(text: &str) -> String {
    if text.len() <= OUTPUT_CAP {
        return text.to_owned();
    }
    let mut start = text.len() - OUTPUT_CAP;
    while !text.is_char_boundary(start) {
        start += 1;
    }
    format!("…{}", &text[start..])
}

/// The program and arguments of a command spec (the provider's own program
/// unless the spec names another, found on `PATH` the way a terminal finds
/// it — `npm` is `npm.cmd` on Windows).
fn command(spec: &CommandSpec, location: &Path) -> (String, Vec<String>) {
    let program = match &spec.program {
        Some(name) => {
            installed::on_path(name).map_or_else(|| name.clone(), |p| p.display().to_string())
        }
        None => location.to_string_lossy().into_owned(),
    };
    (program, spec.args.clone())
}

/// The vendor's own sign-in command as you would type it in a terminal:
/// the program by its bare name when that name on `PATH` is this program
/// (`claude auth login`), otherwise by its full path. `None` when the
/// definition has no sign-in command.
#[must_use]
pub fn sign_in_typed(definition: &ProviderDefinition, location: &Path) -> Option<String> {
    let spec = definition.sign_in.as_ref()?;
    let (program, args) = command(spec, location);
    let program = if spec.program.is_none() {
        definition
            .detect
            .executables
            .iter()
            .find(|name| installed::on_path(name).is_some_and(|found| found == location))
            .cloned()
            .unwrap_or(program)
    } else {
        program
    };
    Some(typed(&program, &args))
}

fn typed(program: &str, args: &[String]) -> String {
    std::iter::once(program.to_owned())
        .chain(args.iter().cloned())
        .map(|a| {
            if a.contains(' ') {
                format!("\"{a}\"")
            } else {
                a
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Run one action for an installed provider.
pub async fn run(
    definition: &ProviderDefinition,
    location: &Path,
    action: ProviderAction,
    context: ActionContext<'_>,
) -> ProviderActionRun {
    let started = Instant::now();
    let mut result = ProviderActionRun {
        provider_id: definition.id,
        action,
        ok: false,
        guided: false,
        command: String::new(),
        output: String::new(),
        agent: None,
        elapsed_ms: 0,
        finished_at: 0,
    };
    match action {
        ProviderAction::Install => {
            installed_into_folder(definition, context, &mut result).await;
        }
        ProviderAction::Update if install::is_ours(context.data_dir, definition, location) => {
            installed_into_folder(definition, context, &mut result).await;
        }
        ProviderAction::Update | ProviderAction::SignIn => {
            let spec = match action {
                ProviderAction::Update => definition.update.as_ref(),
                _ => definition.sign_in.as_ref(),
            };
            if let Some(spec) = spec {
                let (program, args) = command(spec, location);
                result.command = typed(&program, &args);
                if action == ProviderAction::Update {
                    update(&program, &args, &mut result).await;
                } else {
                    open_terminal(definition.name(), &program, &args, &mut result).await;
                }
            } else {
                result.output = format!(
                    "{} has no {action:?} command in its definition.",
                    definition.name()
                );
            }
        }
        ProviderAction::Test => test(definition, location, context, &mut result).await,
        ProviderAction::InstallConnector => {
            install_connector(definition, context, &mut result).await;
        }
    }
    result.elapsed_ms = u32::try_from(started.elapsed().as_millis()).unwrap_or(u32::MAX);
    result.finished_at = now();
    result
}

async fn test(
    definition: &ProviderDefinition,
    location: &Path,
    context: ActionContext<'_>,
    result: &mut ProviderActionRun,
) {
    if let Err(error) = super::supervisor::inspect(definition, location, context.data_dir)
        .await
        .availability
        .test
        .require(definition.name())
    {
        result.output = format!("{error:#}");
        return;
    }
    let launch = match connect::launch(definition, location, context.data_dir, context.prompt) {
        Ok(launch) => launch,
        Err(e) => {
            result.output = format!("{e:#}");
            return;
        }
    };
    result.command = typed(&launch.program.display().to_string(), &launch.args);
    let cwd = connect::ask_dir(context.data_dir);
    match connect::ask(&launch, &cwd, context.prompt).await {
        Ok(asked) => {
            result.ok = !asked.answer.is_empty();
            result.output = if asked.answer.is_empty() {
                "It answered with no text.".to_owned()
            } else {
                tail(&asked.answer)
            };
            result.agent = asked.agent;
        }
        Err(e) => result.output = tail(&format!("{e:#}")),
    }
}

/// Install the vendor's own build into the `DevPulse` folder (Install, and
/// Update of that copy).
async fn installed_into_folder(
    definition: &ProviderDefinition,
    context: ActionContext<'_>,
    result: &mut ProviderActionRun,
) {
    let installed = install::install(context.data_dir, definition).await;
    result.ok = installed.ok;
    result.guided = installed.guided;
    result.command = installed.command;
    result.output = tail(&installed.output);
}

async fn install_connector(
    definition: &ProviderDefinition,
    context: ActionContext<'_>,
    result: &mut ProviderActionRun,
) {
    let Some(spec) = definition
        .connect
        .as_ref()
        .and_then(|c| c.connector.as_ref())
    else {
        result.output = format!("{} needs no connector.", definition.name());
        return;
    };
    let installed = connector::install(context.data_dir, definition.id.key(), spec).await;
    result.ok = installed.ok;
    result.guided = installed.guided;
    result.command = installed.command;
    result.output = tail(&installed.output);
}

async fn update(program: &str, args: &[String], result: &mut ProviderActionRun) {
    let args: Vec<&str> = args.iter().map(String::as_str).collect();
    match process::run(program, &args, &[], UPDATE_TIMEOUT).await {
        Ok(Ran::Answered(answer)) => {
            result.ok = answer.ok();
            let mut output = answer.stdout.trim_end().to_owned();
            if !answer.stderr.trim().is_empty() {
                if !output.is_empty() {
                    output.push('\n');
                }
                output.push_str(answer.stderr.trim_end());
            }
            if !answer.ok() {
                output.push_str("\n— ");
                output.push_str(&answer.reason());
            }
            result.output = tail(&output);
        }
        Ok(Ran::Missing) => result.output = format!("{program} is not on this machine."),
        Err(e) => result.output = format!("{e:#}"),
    }
}

/// Open a terminal window running the command; it stays open so you can
/// finish the vendor's login there.
async fn open_terminal(name: &str, program: &str, args: &[String], result: &mut ProviderActionRun) {
    let title = format!("Sign in to {name}");
    let launch: Vec<(String, Vec<String>)> = match std::env::consts::OS {
        // `start` gives the program its own console window.
        "windows" => {
            let mut a = vec![
                "/c".to_owned(),
                "start".to_owned(),
                title,
                program.to_owned(),
            ];
            a.extend(args.iter().cloned());
            vec![("cmd".to_owned(), a)]
        }
        "macos" => {
            let line = typed(program, args)
                .replace('\\', "\\\\")
                .replace('"', "\\\"");
            vec![(
                "osascript".to_owned(),
                vec![
                    "-e".to_owned(),
                    format!("tell application \"Terminal\" to do script \"{line}\""),
                    "-e".to_owned(),
                    "tell application \"Terminal\" to activate".to_owned(),
                ],
            )]
        }
        _ => {
            // The distribution's default terminal, then the common ones.
            let with_e = |term: &str| {
                let mut a = vec!["-e".to_owned(), program.to_owned()];
                a.extend(args.iter().cloned());
                (term.to_owned(), a)
            };
            let mut gnome = vec!["--".to_owned(), program.to_owned()];
            gnome.extend(args.iter().cloned());
            vec![
                with_e("x-terminal-emulator"),
                ("gnome-terminal".to_owned(), gnome),
                with_e("konsole"),
                with_e("xterm"),
            ]
        }
    };
    for (terminal, terminal_args) in launch {
        let refs: Vec<&str> = terminal_args.iter().map(String::as_str).collect();
        match process::run(&terminal, &refs, &[], OPEN_TIMEOUT).await {
            Ok(Ran::Answered(answer)) if answer.ok() => {
                result.ok = true;
                result.output = format!(
                    "A terminal window is open running {}. Finish signing in there, then check again.",
                    result.command
                );
                return;
            }
            Ok(Ran::Answered(answer)) => {
                result.output = format!("{terminal}: {}", answer.reason());
                return;
            }
            Ok(Ran::Missing) => {}
            Err(e) => {
                result.output = format!("{terminal}: {e:#}");
                return;
            }
        }
    }
    result.guided = true;
    "No terminal window could be opened on this machine.".clone_into(&mut result.output);
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn the_command_is_typed_as_you_would_type_it() {
        assert_eq!(
            typed("C:/Program Files/x/codex.exe", &["login".into()]),
            "\"C:/Program Files/x/codex.exe\" login"
        );
        let spec = CommandSpec {
            program: Some("devpulse-no-such-tool-7c".into()),
            args: vec![
                "install".into(),
                "-g".into(),
                "@google/gemini-cli@latest".into(),
            ],
        };
        let (program, args) = command(&spec, Path::new("/usr/bin/gemini"));
        assert_eq!(
            typed(&program, &args),
            "devpulse-no-such-tool-7c install -g @google/gemini-cli@latest",
            "a program that is nowhere stays as typed"
        );
    }

    #[test]
    fn the_sign_in_command_names_the_program_as_a_terminal_finds_it() {
        // `cargo` is present wherever these tests run; it stands in for the
        // vendor's program.
        let definition: ProviderDefinition = toml::from_str(
            "id = \"claude-code\"\n[detect]\nexecutables = [\"cargo\"]\n[sign_in]\nargs = [\"auth\", \"login\"]\n",
        )
        .unwrap();
        let on_path = installed::on_path("cargo").expect("cargo on PATH");
        assert_eq!(
            sign_in_typed(&definition, &on_path).as_deref(),
            Some("cargo auth login"),
            "found on PATH: its bare name"
        );
        let elsewhere = std::env::temp_dir()
            .join("devpulse-elsewhere")
            .join("cargo");
        assert_eq!(
            sign_in_typed(&definition, &elsewhere),
            Some(typed(
                &elsewhere.display().to_string(),
                &["auth".into(), "login".into()]
            )),
            "found only at a known path: its full path"
        );
    }

    #[test]
    fn a_named_program_is_found_on_path_like_a_terminal_finds_it() {
        // `cargo` is present wherever these tests run (`cargo.exe` on Windows).
        let spec = CommandSpec {
            program: Some("cargo".into()),
            args: vec!["--version".into()],
        };
        let (program, _) = command(&spec, Path::new("/usr/bin/x"));
        let found = Path::new(&program);
        assert!(found.is_absolute(), "{program}");
        assert!(found.is_file(), "{program}");
        assert_eq!(found.file_stem().and_then(|s| s.to_str()), Some("cargo"));
    }

    #[test]
    fn long_output_keeps_its_end() {
        let long = "x".repeat(OUTPUT_CAP + 5) + "END";
        assert!(tail(&long).ends_with("END"));
    }
}
