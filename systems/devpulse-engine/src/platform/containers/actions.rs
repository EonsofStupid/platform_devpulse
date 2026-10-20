//! Running one setup step — only when you click it.
//!
//! Each step runs the real tool and keeps its real output: WSL through
//! Windows' own administrator prompt, installs through `winget` (Windows) or
//! Homebrew (macOS), start and test through the engine itself. On Linux the
//! install is shown, never run: it needs your password.

use std::time::Duration;

use serde::{Deserialize, Serialize};
use specta::Type;

use super::advice::{AdviceConfig, Product, Step, StepKind};
use super::detect::{ContainersReport, EngineSpec};
use crate::platform::process::{self, Answer, Ran};

/// The most output kept per step (the end of it, where results and errors are).
const OUTPUT_CAP: usize = 8 * 1024;

const INSTALL_TIMEOUT: Duration = Duration::from_secs(30 * 60);
const START_TIMEOUT: Duration = Duration::from_secs(10 * 60);
const TEST_TIMEOUT: Duration = Duration::from_secs(10 * 60);

/// What running a step did.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct StepRun {
    /// The step.
    pub step: Step,
    /// It finished successfully.
    pub ok: bool,
    /// Nothing was run: the output is what to do yourself.
    pub guided: bool,
    /// Windows must restart before the next step.
    pub restart_needed: bool,
    /// The commands run, one per line, as typed.
    pub commands: Vec<String>,
    /// The tools' own output (the end of it, when long).
    pub output: String,
    /// Unix seconds when it finished.
    pub finished_at: i64,
}

fn now() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| i64::try_from(d.as_secs()).unwrap_or(i64::MAX))
}

/// Keep the end of `text`, on a character boundary.
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

struct Run {
    ok: bool,
    commands: Vec<String>,
    output: String,
}

impl Run {
    fn new() -> Self {
        Self {
            ok: true,
            commands: Vec::new(),
            output: String::new(),
        }
    }

    fn note(&mut self, text: &str) {
        if !self.output.is_empty() && !self.output.ends_with('\n') {
            self.output.push('\n');
        }
        self.output.push_str(text);
    }

    /// Run one command; stop the step on the first failure.
    async fn command(&mut self, program: &str, args: &[&str], missing: &str, timeout: Duration) {
        if !self.ok {
            return;
        }
        self.commands.push(
            std::iter::once(program)
                .chain(args.iter().copied())
                .collect::<Vec<_>>()
                .join(" "),
        );
        match process::run(program, args, &[], timeout).await {
            Ok(Ran::Missing) => {
                self.ok = false;
                self.note(missing);
            }
            Ok(Ran::Answered(answer)) => self.answered(&answer),
            Err(e) => {
                self.ok = false;
                self.note(&format!("{e:#}"));
            }
        }
    }

    fn answered(&mut self, answer: &Answer) {
        self.note(answer.stdout.trim_end());
        if !answer.stderr.trim().is_empty() {
            self.note(answer.stderr.trim_end());
        }
        if !answer.ok() {
            self.ok = false;
            self.note(&format!("— {}", answer.reason()));
        }
    }
}

/// `wsl.exe` with its arguments, through Windows' administrator prompt,
/// waiting for it and keeping its exit code.
fn elevated_wsl(args: &[&str]) -> String {
    let list = args
        .iter()
        .map(|a| format!("'{a}'"))
        .collect::<Vec<_>>()
        .join(",");
    format!(
        "$p = Start-Process -FilePath wsl.exe -ArgumentList {list} -Verb RunAs -Wait -PassThru; exit $p.ExitCode"
    )
}

fn source_hint(config: &AdviceConfig, key: &str, what: &str) -> String {
    config.sources.get(key).map_or_else(
        || format!("{what} is not on this machine."),
        |s| {
            format!(
                "{what} is not on this machine — get it from {} ({}).",
                s.title, s.url
            )
        },
    )
}

/// Run one step of the current advice.
pub async fn run_step(
    step: &Step,
    report: &ContainersReport,
    config: &AdviceConfig,
    engines: &[EngineSpec],
) -> StepRun {
    let mut run = Run::new();
    let mut guided = false;
    let mut restart_needed = false;
    let host = &report.host;
    let product = config.product(&step.product);
    let engine = product.and_then(|p| engines.iter().find(|e| e.id == p.engine));

    match (step.kind, product) {
        (StepKind::InstallWsl | StepKind::UpdateWsl, _) => {
            let args: &[&str] = if step.kind == StepKind::InstallWsl {
                &["--install", "--no-distribution"]
            } else {
                &["--update"]
            };
            let script = elevated_wsl(args);
            run.command(
                "powershell",
                &["-NoProfile", "-NonInteractive", "-Command", &script],
                "PowerShell is not on this machine.",
                INSTALL_TIMEOUT,
            )
            .await;
            restart_needed = run.ok && step.kind == StepKind::InstallWsl;
            if run.ok {
                run.note(if restart_needed {
                    "WSL is installed. Restart Windows, then come back to this step."
                } else {
                    "WSL is up to date."
                });
            }
        }
        (StepKind::Install, Some(product)) => {
            install(product, host.os.as_str(), config, &mut run, &mut guided).await;
        }
        (StepKind::Start, Some(product)) => {
            if let Some(engine) = engine {
                start(product, engine, report, &mut run).await;
            } else {
                run.ok = false;
                run.note("No engine for this product is in the engine list.");
            }
        }
        (StepKind::Test, Some(product)) => {
            if let Some(engine) = engine {
                run.command(
                    &engine.program,
                    &["run", "--rm", &product.test_image],
                    &format!("{} is not installed yet.", engine.name),
                    TEST_TIMEOUT,
                )
                .await;
            } else {
                run.ok = false;
                run.note("No engine for this product is in the engine list.");
            }
        }
        (_, None) => {
            run.ok = false;
            run.note(&format!(
                "{:?} is not a product in the advice data.",
                step.product
            ));
        }
    }

    StepRun {
        step: step.clone(),
        ok: run.ok,
        guided,
        restart_needed,
        commands: run.commands,
        output: tail(&run.output),
        finished_at: now(),
    }
}

async fn install(
    product: &Product,
    os: &str,
    config: &AdviceConfig,
    run: &mut Run,
    guided: &mut bool,
) {
    match os {
        "windows" => {
            let missing = source_hint(config, "winget", "winget");
            for id in &product.windows_winget {
                run.command(
                    "winget",
                    &[
                        "install",
                        "--id",
                        id,
                        "--exact",
                        "--silent",
                        "--accept-package-agreements",
                        "--accept-source-agreements",
                        "--disable-interactivity",
                    ],
                    &missing,
                    INSTALL_TIMEOUT,
                )
                .await;
            }
        }
        "macos" => {
            let missing = source_hint(config, "homebrew", "Homebrew");
            for args in &product.macos_brew {
                let args: Vec<&str> = args.iter().map(String::as_str).collect();
                run.command("brew", &args, &missing, INSTALL_TIMEOUT).await;
            }
        }
        _ => {
            *guided = true;
            run.note(&product.linux_install);
        }
    }
}

async fn start(product: &Product, engine: &EngineSpec, report: &ContainersReport, run: &mut Run) {
    let missing = format!("{} is not installed yet.", engine.name);
    if !product.start.is_empty() {
        for args in &product.start {
            let args: Vec<&str> = args.iter().map(String::as_str).collect();
            run.command(&engine.program, &args, &missing, START_TIMEOUT)
                .await;
        }
        return;
    }
    // Podman: create the machine the first time (and start it), else start
    // the default machine.
    let machines = report
        .engines
        .iter()
        .find(|e| e.id == engine.id)
        .map(|e| e.machines.as_slice())
        .unwrap_or_default();
    if machines.is_empty() {
        run.command(
            &engine.program,
            &["machine", "init", "--now"],
            &missing,
            START_TIMEOUT,
        )
        .await;
    } else if machines.iter().any(|m| m.running) {
        run.note("The machine is already running.");
    } else {
        let name = machines
            .iter()
            .find(|m| m.default)
            .or_else(|| machines.first())
            .map(|m| m.name.clone())
            .unwrap_or_default();
        run.command(
            &engine.program,
            &["machine", "start", &name],
            &missing,
            START_TIMEOUT,
        )
        .await;
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn long_output_keeps_its_end() {
        let long = "x".repeat(OUTPUT_CAP + 10) + "THE END";
        let kept = tail(&long);
        assert!(kept.ends_with("THE END"));
        assert!(kept.len() <= OUTPUT_CAP + "…".len());
        assert_eq!(tail("short"), "short");
    }

    #[test]
    fn wsl_goes_through_the_administrator_prompt() {
        let script = elevated_wsl(&["--install", "--no-distribution"]);
        assert!(script.contains("-Verb RunAs"));
        assert!(script.contains("'--install','--no-distribution'"));
        assert!(script.ends_with("exit $p.ExitCode"));
    }
}
