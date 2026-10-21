//! What you can do from a provider's card — only when you click.
//!
//! **Update** runs the vendor's own updater and keeps its real output.
//! **Sign in** opens the vendor's own login in a terminal window: logins are
//! interactive (a browser, a code to type), and `DevPulse` never sees a token.

use std::path::Path;
use std::time::Duration;

use devpulse_process::{self as process, Ran};
use serde::{Deserialize, Serialize};

use super::definition::{CommandSpec, ProviderDefinition};

const UPDATE_TIMEOUT: Duration = Duration::from_secs(15 * 60);
const OPEN_TIMEOUT: Duration = Duration::from_secs(20);
const OUTPUT_CAP: usize = 8 * 1024;

/// Which action.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub enum ProviderAction {
    /// Run the vendor's updater.
    Update,
    /// Open the vendor's login in a terminal window.
    SignIn,
}

/// What an action did.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct ProviderActionRun {
    /// The provider.
    pub provider_id: String,
    /// The action.
    pub action: ProviderAction,
    /// It worked (for Sign in: the terminal window opened).
    pub ok: bool,
    /// Nothing could be opened: `output` is the command to run yourself.
    pub guided: bool,
    /// The command, as typed.
    pub command: String,
    /// The tool's own output (the end of it, when long).
    pub output: String,
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
/// unless the spec names another).
fn command(spec: &CommandSpec, location: &Path) -> (String, Vec<String>) {
    let program = spec
        .program
        .clone()
        .unwrap_or_else(|| location.to_string_lossy().into_owned());
    (program, spec.args.clone())
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
) -> ProviderActionRun {
    let spec = match action {
        ProviderAction::Update => definition.update.as_ref(),
        ProviderAction::SignIn => definition.sign_in.as_ref(),
    };
    let mut result = ProviderActionRun {
        provider_id: definition.id.clone(),
        action,
        ok: false,
        guided: false,
        command: String::new(),
        output: String::new(),
        finished_at: 0,
    };
    let Some(spec) = spec else {
        result.output = format!(
            "{} has no {action:?} command in its definition.",
            definition.name
        );
        result.finished_at = now();
        return result;
    };
    let (program, args) = command(spec, location);
    result.command = typed(&program, &args);
    match action {
        ProviderAction::Update => update(&program, &args, &mut result).await,
        ProviderAction::SignIn => {
            open_terminal(&definition.name, &program, &args, &mut result).await;
        }
    }
    result.finished_at = now();
    result
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
                result.output = format!("A terminal window is open running {}. Finish signing in there, then check again.", result.command);
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
    result.output.clone_from(&result.command);
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
            program: Some("npm".into()),
            args: vec![
                "install".into(),
                "-g".into(),
                "@google/gemini-cli@latest".into(),
            ],
        };
        let (program, args) = command(&spec, Path::new("/usr/bin/gemini"));
        assert_eq!(
            typed(&program, &args),
            "npm install -g @google/gemini-cli@latest"
        );
    }

    #[test]
    fn long_output_keeps_its_end() {
        let long = "x".repeat(OUTPUT_CAP + 5) + "END";
        assert!(tail(&long).ends_with("END"));
    }
}
