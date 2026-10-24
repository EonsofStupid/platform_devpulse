//! Connectors: a small program that speaks ACP for an agent whose own CLI
//! does not (Codex today). Each is published on npm by the protocol's
//! maintainers. `DevPulse` installs it into its own folder when you click —
//! never globally, never at startup — so it travels with the portable
//! folder: `{data_dir}/tools/connectors/{provider id}/`.

use std::path::{Path, PathBuf};
use std::time::Duration;

use devpulse_process::{self as process, Ran};
use serde::{Deserialize, Serialize};

use crate::providers::definition::ConnectorSpec;
use crate::providers::discovery::installed;

const INSTALL_TIMEOUT: Duration = Duration::from_secs(10 * 60);

/// A provider's connector, as found.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct ConnectorReport {
    /// The npm package.
    pub package: String,
    /// It is installed in the `DevPulse` folder.
    pub installed: bool,
    /// Its installed version.
    pub version: Option<String>,
}

/// What installing did.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Installed {
    /// It is installed now.
    pub ok: bool,
    /// npm is not on this machine: `output` says so, and `command` is what
    /// to run once it is.
    pub guided: bool,
    /// The command, as typed.
    pub command: String,
    /// npm's own output.
    pub output: String,
}

/// The connector's folder for one provider.
#[must_use]
pub fn dir(data_dir: &Path, provider_id: &str) -> PathBuf {
    data_dir.join("tools").join("connectors").join(provider_id)
}

/// The connector's program (npm's launcher, a `.cmd` on Windows).
#[must_use]
pub fn program(data_dir: &Path, provider_id: &str, spec: &ConnectorSpec) -> PathBuf {
    let name = if cfg!(windows) {
        format!("{}.cmd", spec.bin)
    } else {
        spec.bin.clone()
    };
    dir(data_dir, provider_id)
        .join("node_modules")
        .join(".bin")
        .join(name)
}

/// Is it installed, and which version (from its own `package.json`).
#[must_use]
pub fn report(data_dir: &Path, provider_id: &str, spec: &ConnectorSpec) -> ConnectorReport {
    let installed = program(data_dir, provider_id, spec).is_file();
    let manifest = spec
        .npm
        .split('/')
        .fold(
            dir(data_dir, provider_id).join("node_modules"),
            |p, part| p.join(part),
        )
        .join("package.json");
    let version = installed
        .then(|| std::fs::read_to_string(manifest).ok())
        .flatten()
        .and_then(|text| serde_json::from_str::<serde_json::Value>(&text).ok())
        .and_then(|json| json.get("version")?.as_str().map(str::to_owned));
    ConnectorReport {
        package: spec.npm.clone(),
        installed,
        version,
    }
}

/// Install (or update) the connector into the `DevPulse` folder with npm.
pub async fn install(data_dir: &Path, provider_id: &str, spec: &ConnectorSpec) -> Installed {
    let target = dir(data_dir, provider_id);
    let target_text = target.display().to_string();
    let package = format!("{}@latest", spec.npm);
    let args = [
        "install",
        "--prefix",
        target_text.as_str(),
        "--no-fund",
        "--no-audit",
        package.as_str(),
    ];
    let command = format!("npm {}", args.join(" "));
    let Some(npm) = installed::on_path("npm") else {
        return Installed {
            ok: false,
            guided: true,
            command,
            output: "npm is not on this machine. Install Node.js (https://nodejs.org), then click again.".to_owned(),
        };
    };
    if let Err(e) = std::fs::create_dir_all(&target) {
        return Installed {
            ok: false,
            guided: false,
            command,
            output: format!("{target_text} could not be made: {e}"),
        };
    }
    let npm = npm.display().to_string();
    let (ok, output) = match process::run(&npm, &args, &[], INSTALL_TIMEOUT).await {
        Ok(Ran::Answered(answer)) => {
            let mut output = answer.stdout.trim_end().to_owned();
            if !answer.stderr.trim().is_empty() {
                if !output.is_empty() {
                    output.push('\n');
                }
                output.push_str(answer.stderr.trim_end());
            }
            let ok = answer.ok() && program(data_dir, provider_id, spec).is_file();
            if answer.ok() && !ok {
                output.push_str("\n— npm finished but ");
                output.push_str(&spec.bin);
                output.push_str(" is not where it should be");
            } else if !answer.ok() {
                output.push_str("\n— ");
                output.push_str(&answer.reason());
            }
            (ok, output)
        }
        Ok(Ran::Missing) => (false, format!("{npm} could not be started.")),
        Err(e) => (false, format!("{e:#}")),
    };
    Installed {
        ok,
        guided: false,
        command,
        output,
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    fn spec() -> ConnectorSpec {
        ConnectorSpec {
            npm: "@example/agent-acp".into(),
            bin: "agent-acp".into(),
        }
    }

    #[test]
    fn it_lives_in_the_devpulse_folder_and_reports_its_own_version() {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let data = std::env::temp_dir().join(format!("devpulse-connector-{nanos}"));
        let none = report(&data, "example", &spec());
        assert!(!none.installed);
        assert_eq!(none.version, None);

        let bin = program(&data, "example", &spec());
        assert!(bin.starts_with(data.join("tools").join("connectors").join("example")));
        std::fs::create_dir_all(bin.parent().unwrap()).unwrap();
        std::fs::write(&bin, "").unwrap();
        let package = dir(&data, "example")
            .join("node_modules")
            .join("@example")
            .join("agent-acp");
        std::fs::create_dir_all(&package).unwrap();
        std::fs::write(package.join("package.json"), r#"{"version":"2.2.2"}"#).unwrap();

        let found = report(&data, "example", &spec());
        assert!(found.installed);
        assert_eq!(found.version.as_deref(), Some("2.2.2"));
        let _ = std::fs::remove_dir_all(data);
    }
}
