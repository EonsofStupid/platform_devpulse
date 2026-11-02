//! Are you signed in — by the vendor's own status command, or by whether its
//! own login file exists. `DevPulse` never reads a token or a login file's
//! contents.

use std::path::Path;
use std::time::Duration;

use devpulse_process::{self as process, Answer, Ran};
use serde::{Deserialize, Serialize};

use crate::providers::definition::{SignedInSpec, expand};

const STATUS_TIMEOUT: Duration = Duration::from_secs(20);

/// Signed in, as far as can be told.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub enum SignedIn {
    /// The vendor says so (or its login file is there).
    Yes,
    /// The vendor says not (or no login file is there).
    No,
    /// It could not be told (not installed, or the check failed).
    Unknown,
}

/// Read a status command's answer with the definition's rules.
#[must_use]
pub fn judge(spec: &SignedInSpec, answer: &Answer) -> SignedIn {
    if answer.code.is_none() {
        return SignedIn::Unknown;
    }
    let output = format!("{}\n{}", answer.stdout, answer.stderr).to_lowercase();
    if let Some(out) = &spec.output_signed_out
        && output.contains(&out.to_lowercase())
    {
        return SignedIn::No;
    }
    if let Some(inside) = &spec.output_signed_in {
        return if answer.ok() && output.contains(&inside.to_lowercase()) {
            SignedIn::Yes
        } else {
            SignedIn::Unknown
        };
    }
    match answer.code {
        Some(0) => SignedIn::Yes,
        Some(1) => SignedIn::No,
        _ => SignedIn::Unknown,
    }
}

/// Ask.
pub async fn check(spec: &SignedInSpec, program: &Path, home: Option<&Path>) -> SignedIn {
    if let Some(args) = &spec.args {
        let args: Vec<&str> = args.iter().map(String::as_str).collect();
        // A configured status command is authoritative. A timeout or launch
        // failure cannot be turned into a successful login by a stale file.
        return match process::run(&program.to_string_lossy(), &args, &[], STATUS_TIMEOUT).await {
            Ok(Ran::Answered(answer)) => judge(spec, &answer),
            _ => SignedIn::Unknown,
        };
    }
    from_files(spec, home)
}

/// One login file present means signed in; none means signed out only when
/// the definition says the vendor keeps its login nowhere else.
fn from_files(spec: &SignedInSpec, home: Option<&Path>) -> SignedIn {
    let files = spec.files.current();
    if files.is_empty() {
        return SignedIn::Unknown;
    }
    if files
        .iter()
        .filter_map(|f| expand(f, home))
        .any(|f| f.is_file())
    {
        SignedIn::Yes
    } else if spec.absent_means_signed_out {
        SignedIn::No
    } else {
        SignedIn::Unknown
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use crate::providers::definition::PerOs;

    fn spec(signed_in: Option<&str>, signed_out: Option<&str>) -> SignedInSpec {
        SignedInSpec {
            args: Some(vec!["status".into()]),
            output_signed_in: signed_in.map(str::to_owned),
            output_signed_out: signed_out.map(str::to_owned),
            files: PerOs::default(),
            absent_means_signed_out: false,
        }
    }

    #[test]
    fn a_missing_login_file_is_unknown_unless_the_vendor_keeps_it_nowhere_else() {
        let missing = "~/devpulse-no-such-login-5e1d.json".to_owned();
        let mut s = SignedInSpec {
            args: None,
            output_signed_in: None,
            output_signed_out: None,
            files: PerOs {
                windows: vec![missing.clone()],
                macos: vec![missing.clone()],
                linux: vec![missing],
            },
            absent_means_signed_out: false,
        };
        let home = std::env::home_dir();
        assert_eq!(from_files(&s, home.as_deref()), SignedIn::Unknown);
        s.absent_means_signed_out = true;
        assert_eq!(from_files(&s, home.as_deref()), SignedIn::No);
    }

    fn answer(code: i32, stdout: &str) -> Answer {
        Answer {
            code: Some(code),
            stdout: stdout.into(),
            stderr: String::new(),
        }
    }

    #[test]
    fn exit_codes_decide_without_output_rules() {
        assert_eq!(judge(&spec(None, None), &answer(0, "")), SignedIn::Yes);
        assert_eq!(judge(&spec(None, None), &answer(1, "")), SignedIn::No);
    }

    #[test]
    fn explicit_sign_out_wins_and_unrecognized_output_is_unknown() {
        let s = spec(Some("Logged in"), Some("Not logged in"));
        assert_eq!(judge(&s, &answer(0, "Not logged in")), SignedIn::No);
        assert_eq!(
            judge(&s, &answer(0, "Logged in using ChatGPT")),
            SignedIn::Yes
        );
        assert_eq!(judge(&s, &answer(0, "something else")), SignedIn::Unknown);
        assert_eq!(judge(&s, &answer(1, "Not logged in")), SignedIn::No);
    }

    #[test]
    fn failed_or_abnormal_status_cannot_activate_a_provider() {
        let s = spec(Some("Logged in"), Some("Not logged in"));
        for code in [Some(1), Some(2), None] {
            let mut response = answer(0, "Logged in using ChatGPT");
            response.code = code;
            assert_eq!(judge(&s, &response), SignedIn::Unknown);
        }
        assert_eq!(
            judge(&spec(None, None), &answer(2, "failed")),
            SignedIn::Unknown
        );
    }

    #[test]
    fn bundled_codex_requires_recognized_evidence_and_gates_chat() {
        use crate::providers::{ProviderId, catalog, supervisor};
        let definition = catalog::bundled()
            .unwrap()
            .into_iter()
            .find(|d| d.id == ProviderId::Codex)
            .unwrap();
        let rule = definition.signed_in.as_ref().unwrap();
        for (message, expected) in [
            ("Logged in using ChatGPT", SignedIn::Yes),
            ("Logged in using API key", SignedIn::Yes),
            ("Logged in with API key", SignedIn::Yes),
            ("Not logged in", SignedIn::No),
            ("future status", SignedIn::Unknown),
        ] {
            // Codex may print status to stderr. Neither stream is persisted.
            let mut response = answer(0, "");
            response.stderr = message.into();
            let observed = judge(rule, &response);
            assert_eq!(observed, expected);
            let availability = supervisor::assess(&definition, true, observed, true);
            assert_eq!(
                availability.chat.require(definition.name()).is_ok(),
                expected == SignedIn::Yes
            );
            assert_eq!(
                availability.test.require(definition.name()).is_ok(),
                expected == SignedIn::Yes
            );
        }
    }

    #[tokio::test]
    async fn a_failed_status_command_does_not_fall_back_to_a_login_file() {
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let home = std::env::temp_dir().join(format!("devpulse-status-{stamp}"));
        std::fs::create_dir_all(&home).unwrap();
        let file = home.join("login.json");
        std::fs::write(&file, "fixture; contents must not be read").unwrap();
        let paths = vec!["~/login.json".to_owned()];
        let mut rule = spec(None, None);
        rule.files = PerOs {
            windows: paths.clone(),
            macos: paths.clone(),
            linux: paths,
        };
        assert_eq!(from_files(&rule, Some(&home)), SignedIn::Yes);
        assert_eq!(
            check(&rule, &home.join("missing-program.exe"), Some(&home)).await,
            SignedIn::Unknown
        );
        std::fs::remove_file(&file).unwrap();
        std::fs::create_dir(&file).unwrap();
        assert_eq!(from_files(&rule, Some(&home)), SignedIn::Unknown);
        std::fs::remove_dir_all(home).unwrap();
    }
}
