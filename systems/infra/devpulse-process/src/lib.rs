//! Asking a command-line tool on this machine and reading its answer.
//!
//! The engine (first run, containers) and the kernel (AI providers) ask tools
//! the person already has — git, container engines, WSL, the GPU driver, the
//! AI vendors' own CLIs. Every call runs with no console
//! window (`DevPulse` is a GUI app), a deadline, and the child killed if the call
//! is dropped. "The tool is not installed" and "the tool answered with an
//! error" stay apart, because the UI says different things for each.

use std::path::Path;
use std::time::Duration;

use anyhow::{Context, Result};

/// What running a tool produced.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Ran {
    /// The program is not installed (or not on `PATH`).
    Missing,
    /// The program ran and exited.
    Answered(Answer),
}

/// A finished run.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Answer {
    /// Exit code; `None` when the process was ended by a signal.
    pub code: Option<i32>,
    /// Standard output, as text.
    pub stdout: String,
    /// Standard error, as text.
    pub stderr: String,
}

impl Answer {
    /// Exited with code 0.
    #[must_use]
    pub fn ok(&self) -> bool {
        self.code == Some(0)
    }

    /// The first non-empty line of stderr, else of stdout — what to show
    /// when a tool refused.
    #[must_use]
    pub fn reason(&self) -> String {
        first_line(&self.stderr)
            .or_else(|| first_line(&self.stdout))
            .map_or_else(
                || match self.code {
                    Some(code) => format!("exited with code {code}"),
                    None => "ended without an exit code".to_owned(),
                },
                str::to_owned,
            )
    }
}

fn first_line(text: &str) -> Option<&str> {
    text.lines().map(str::trim).find(|l| !l.is_empty())
}

/// Run `program args…` with `env` added, and wait at most `timeout`.
///
/// # Errors
/// Returns an error if the program could not be started for a reason other
/// than not being installed, or did not finish in time.
pub async fn run(
    program: &str,
    args: &[&str],
    env: &[(&str, &str)],
    timeout: Duration,
) -> Result<Ran> {
    run_in(None, program, args, env, timeout).await
}

/// [`run`] in the folder `dir` (the caller's own folder when `None`).
///
/// # Errors
/// As [`run`].
pub async fn run_in(
    dir: Option<&Path>,
    program: &str,
    args: &[&str],
    env: &[(&str, &str)],
    timeout: Duration,
) -> Result<Ran> {
    let mut cmd = tokio::process::Command::new(program);
    cmd.args(args).kill_on_drop(true);
    if let Some(dir) = dir {
        cmd.current_dir(dir);
    }
    for (key, value) in env {
        cmd.env(key, value);
    }
    #[cfg(windows)]
    {
        // No console window flashes up from a GUI app.
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    let output = match tokio::time::timeout(timeout, cmd.output()).await {
        Err(_) => anyhow::bail!("{program} did not answer within {}s", timeout.as_secs()),
        Ok(Err(e)) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Ran::Missing),
        Ok(result) => result.with_context(|| format!("run {program}"))?,
    };
    Ok(Ran::Answered(Answer {
        code: output.status.code(),
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
    }))
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[tokio::test]
    async fn a_missing_program_is_missing_not_an_error() {
        let ran = run(
            "devpulse-no-such-program-4b1d",
            &["--version"],
            &[],
            Duration::from_secs(5),
        )
        .await
        .expect("missing is an answer");
        assert_eq!(ran, Ran::Missing);
    }

    #[tokio::test]
    async fn an_installed_program_answers() {
        // `cargo` is present wherever these tests run.
        let ran = run("cargo", &["--version"], &[], Duration::from_secs(30))
            .await
            .expect("cargo runs");
        match ran {
            Ran::Answered(answer) => {
                assert!(answer.ok(), "{answer:?}");
                assert!(answer.stdout.starts_with("cargo "), "{answer:?}");
            }
            Ran::Missing => panic!("cargo is installed"),
        }
    }

    #[tokio::test]
    async fn it_runs_in_the_folder_given() {
        let dir = std::env::temp_dir();
        let (program, args): (&str, &[&str]) = if cfg!(windows) {
            ("cmd", &["/c", "cd"])
        } else {
            ("pwd", &[])
        };
        match run_in(Some(&dir), program, args, &[], Duration::from_secs(10))
            .await
            .expect("runs")
        {
            Ran::Answered(answer) => assert_eq!(
                Path::new(answer.stdout.trim()).canonicalize().unwrap(),
                dir.canonicalize().unwrap()
            ),
            Ran::Missing => panic!("{program} is part of the OS"),
        }
    }

    #[test]
    fn the_reason_is_the_first_meaningful_line() {
        let answer = Answer {
            code: Some(1),
            stdout: String::new(),
            stderr: "\n  Cannot connect to the engine\nmore detail\n".into(),
        };
        assert_eq!(answer.reason(), "Cannot connect to the engine");
        let silent = Answer {
            code: Some(3),
            stdout: String::new(),
            stderr: String::new(),
        };
        assert_eq!(silent.reason(), "exited with code 3");
    }
}
