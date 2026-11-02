//! npm packages installed into the `DevPulse` folder — the connectors that
//! speak ACP for an agent, and the vendors' own CLIs that are published on
//! npm — only when you click, never globally and never at startup, so they
//! travel with the portable folder. Moved out of the connector module so
//! connectors and agents share one installer (plan 0001 B3.10).

use std::path::{Path, PathBuf};
use std::time::Duration;

use devpulse_process::{self as process, Ran};

use super::discovery::installed;

const INSTALL_TIMEOUT: Duration = Duration::from_mins(10);

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

/// The program npm puts in `dir` for `bin` (its launcher, a `.cmd` on
/// Windows).
#[must_use]
pub fn launcher(dir: &Path, bin: &str) -> PathBuf {
    let name = if cfg!(windows) {
        format!("{bin}.cmd")
    } else {
        bin.to_owned()
    };
    dir.join("node_modules").join(".bin").join(name)
}

/// The version of `package` installed in `dir`, from its own `package.json`.
#[must_use]
pub fn installed_version(dir: &Path, package: &str) -> Option<String> {
    let manifest = package
        .split('/')
        .fold(dir.join("node_modules"), |p, part| p.join(part))
        .join("package.json");
    std::fs::read_to_string(manifest)
        .ok()
        .and_then(|text| serde_json::from_str::<serde_json::Value>(&text).ok())
        .and_then(|json| json.get("version")?.as_str().map(str::to_owned))
}

/// npm's arguments for installing `package` (its latest) into `dir`.
fn args(dir: &Path, package: &str) -> Vec<String> {
    vec![
        "install".to_owned(),
        "--prefix".to_owned(),
        dir.display().to_string(),
        "--no-fund".to_owned(),
        "--no-audit".to_owned(),
        format!("{package}@latest"),
    ]
}

/// The install command as typed (`npm install --prefix … pkg@latest`).
#[must_use]
pub fn command_line(dir: &Path, package: &str) -> String {
    format!("npm {}", args(dir, package).join(" "))
}

/// Install (or update) `package` into `dir` with npm; it is there when its
/// `bin` launcher is.
pub async fn install(dir: &Path, package: &str, bin: &str) -> Installed {
    let target_text = dir.display().to_string();
    let owned = args(dir, package);
    let args: Vec<&str> = owned.iter().map(String::as_str).collect();
    let command = command_line(dir, package);
    let Some(npm) = installed::on_path("npm") else {
        return Installed {
            ok: false,
            guided: true,
            command,
            output: "npm is not on this machine. Install Node.js (https://nodejs.org), then click again.".to_owned(),
        };
    };
    if let Err(e) = std::fs::create_dir_all(dir) {
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
            let ok = answer.ok() && launcher(dir, bin).is_file();
            if answer.ok() && !ok {
                output.push_str("\n— npm finished but ");
                output.push_str(bin);
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
