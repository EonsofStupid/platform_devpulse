//! Is it installed, where, and which version — asked, never assumed.

use std::path::{Path, PathBuf};
use std::time::Duration;

use devpulse_process::{self as process, Ran};

use crate::providers::definition::{ProviderDefinition, expand};

/// How long a `--version` may take (some CLIs start a runtime first).
const VERSION_TIMEOUT: Duration = Duration::from_secs(20);

/// Where the program is, or `None` when it is not on this machine.
#[must_use]
pub fn locate(
    definition: &ProviderDefinition,
    home: Option<&Path>,
    data_dir: &Path,
) -> Option<PathBuf> {
    definition
        .detect
        .executables
        .iter()
        .find_map(|name| on_path(name))
        .or_else(|| {
            definition
                .detect
                .paths
                .current()
                .iter()
                .filter_map(|p| expand(p, home))
                .find(|p| p.exists())
        })
        // Last, the copy `DevPulse` installed in its own folder (plan 0001
        // B3.10): one you installed yourself is used first.
        .or_else(|| crate::providers::install::program(data_dir, definition))
}

/// The program on `PATH` (with `PATHEXT` on Windows: `.exe`, `.cmd`, …).
#[must_use]
pub fn on_path(name: &str) -> Option<PathBuf> {
    let path = std::env::var_os("PATH")?;
    let extensions: Vec<String> = if cfg!(windows) {
        std::env::var("PATHEXT")
            .unwrap_or_else(|_| ".COM;.EXE;.BAT;.CMD".to_owned())
            .split(';')
            .filter(|e| !e.is_empty())
            .map(str::to_ascii_lowercase)
            .collect()
    } else {
        Vec::new()
    };
    std::env::split_paths(&path).find_map(|dir| {
        if extensions.is_empty() {
            let candidate = dir.join(name);
            candidate.is_file().then_some(candidate)
        } else {
            extensions
                .iter()
                .map(|ext| dir.join(format!("{name}{ext}")))
                .find(|c| c.is_file())
        }
    })
}

/// The first dotted version number in a tool's answer
/// (`2.0.14 (Claude Code)`, `codex-cli 0.46.0`, `v1.2.3`, the tag
/// `rust-v0.163.0`).
#[must_use]
pub fn first_version(text: &str) -> Option<String> {
    text.split(|c: char| c.is_whitespace() || matches!(c, ',' | '(' | ')' | '/'))
        // A word may carry a prefix before its number (`v1.2`, `rust-v0.1.0`).
        .filter_map(|w| w.find(|c: char| c.is_ascii_digit()).map(|i| &w[i..]))
        .find(|w| {
            let mut parts = w.split('.');
            let numeric = |p: Option<&str>| {
                p.is_some_and(|p| !p.is_empty() && p.chars().all(|c| c.is_ascii_digit()))
            };
            numeric(parts.next()) && numeric(parts.next())
        })
        .map(|w| {
            // Keep build metadata out: `1.2.3-beta+x` → `1.2.3-beta`.
            w.split('+').next().unwrap_or(w).to_owned()
        })
}

/// Ask the program for its version. `Ok(None)` when the definition has no
/// version command, or the answer holds no version number.
///
/// # Errors
/// The tool's own reason when it refused, could not start, or timed out.
pub async fn version(
    definition: &ProviderDefinition,
    program: &Path,
) -> Result<Option<String>, String> {
    let Some(spec) = &definition.version else {
        return Ok(None);
    };
    let args: Vec<&str> = spec.args.iter().map(String::as_str).collect();
    let program = spec
        .program
        .clone()
        .unwrap_or_else(|| program.to_string_lossy().into_owned());
    match process::run(&program, &args, &[], VERSION_TIMEOUT).await {
        Ok(Ran::Answered(answer)) if answer.ok() => {
            Ok(first_version(&answer.stdout).or_else(|| first_version(&answer.stderr)))
        }
        Ok(Ran::Answered(answer)) => Err(answer.reason()),
        Ok(Ran::Missing) => Err(format!("{program} could not be started")),
        Err(e) => Err(format!("{e:#}")),
    }
}

/// `true` when `latest` is newer than `installed` (number by number).
#[must_use]
pub fn newer(latest: &str, installed: &str) -> bool {
    let nums =
        |v: &str| -> Vec<u64> { v.split(['.', '-']).map_while(|p| p.parse().ok()).collect() };
    let (l, i) = (nums(latest), nums(installed));
    for k in 0..l.len().max(i.len()) {
        let (a, b) = (
            l.get(k).copied().unwrap_or(0),
            i.get(k).copied().unwrap_or(0),
        );
        if a != b {
            return a > b;
        }
    }
    false
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn versions_are_read_from_any_wording() {
        assert_eq!(
            first_version("2.0.14 (Claude Code)").as_deref(),
            Some("2.0.14")
        );
        assert_eq!(first_version("codex-cli 0.46.0").as_deref(), Some("0.46.0"));
        assert_eq!(first_version("v1.2.3+build.5").as_deref(), Some("1.2.3"));
        assert_eq!(
            first_version("gemini 0.9.0-preview.1").as_deref(),
            Some("0.9.0-preview.1")
        );
        assert_eq!(first_version("rust-v0.163.0").as_deref(), Some("0.163.0"));
        assert_eq!(
            first_version("2026.10.19-6bbf2c4").as_deref(),
            Some("2026.10.19-6bbf2c4")
        );
        assert_eq!(first_version("no version here"), None);
    }

    #[test]
    fn newer_compares_number_by_number() {
        assert!(newer("2.0.15", "2.0.14"));
        assert!(newer("2.10.0", "2.9.9"));
        assert!(!newer("2.0.14", "2.0.14"));
        assert!(!newer("1.9.0", "2.0.0"));
        assert!(newer("0.47.0", "0.46.0-alpha.1"));
    }

    #[test]
    fn a_program_that_is_nowhere_is_not_located() {
        let definition = crate::providers::definition::ProviderDefinition::parse(
            r#"
id = "codex"
[detect]
executables = ["devpulse-no-such-cli-7c3a"]
paths = { windows = ["~/devpulse-no-such-7c3a.exe"], macos = ["~/devpulse-no-such-7c3a"], linux = ["~/devpulse-no-such-7c3a"] }
"#,
        )
        .expect("definition");
        let data_dir = std::env::temp_dir().join("devpulse-no-such-data-7c3a");
        assert!(locate(&definition, std::env::home_dir().as_deref(), &data_dir).is_none());
    }
}
