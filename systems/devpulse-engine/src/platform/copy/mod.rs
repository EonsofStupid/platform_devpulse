//! The UI copy catalog — every visible string, typed.
//!
//! Configuration with shipped defaults (`config/copy.default.toml`). Your
//! file at `{data_dir}/config/copy.toml` overrides any key; keys you leave
//! out keep the defaults (a deep merge, per key). A key `DevPulse` does not
//! know, or a value of the wrong type, refuses your file with the reason,
//! which is returned with the catalog so the UI can show it — never
//! silently ignored.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;

/// The bundled catalog.
const BUNDLED: &str = include_str!("../../../config/copy.default.toml");

/// Text shared by every first-run stage.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct OnboardingCommonCopy {
    /// Continue button.
    pub r#continue: String,
    /// Back button.
    pub back: String,
    /// "Set up later" button.
    pub later: String,
    /// Final button.
    pub finish: String,
    /// "Step {current} of {total}".
    pub progress: String,
    /// Shown when your flow file was not used.
    pub flow_problem: String,
    /// The top-bar chip that reopens first run.
    pub reopen: String,
}

/// The Welcome stage.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct WelcomeCopy {
    /// Greeting.
    pub title: String,
    /// What first run does.
    pub subtitle: String,
    /// Mascot image description.
    pub mascot_alt: String,
    /// Main button.
    pub cta: String,
    /// Under "Set up later".
    pub later_hint: String,
    /// While detection runs.
    pub looking: String,
    /// Above the found chips.
    pub found_heading: String,
    /// When detection found nothing.
    pub nothing_found: String,
    /// Chip: "Git knows you as {name}".
    pub found_git: String,
    /// Chip: "{path} · {count} repositories".
    pub found_folder: String,
}

/// The "You" stage.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct YouCopy {
    /// Heading.
    pub title: String,
    /// What the stage is for.
    pub subtitle: String,
    /// Name field label.
    pub name_label: String,
    /// Name field hint.
    pub name_hint: String,
    /// Email field label.
    pub email_label: String,
    /// Email field hint.
    pub email_hint: String,
    /// Projects folder field label.
    pub projects_label: String,
    /// Projects folder field hint.
    pub projects_hint: String,
    /// Folder picker button.
    pub browse: String,
    /// Folder picker window title.
    pub picker_title: String,
    /// Shown with a suggestion from git.
    pub from_git: String,
    /// "{count} repositories" next to a suggested folder.
    pub folder_repos: String,
    /// Above the repository list.
    pub repos_heading: String,
    /// Under the heading.
    pub repos_hint: String,
    /// Scan button.
    pub repos_find: String,
    /// While scanning.
    pub repos_finding: String,
    /// When the folder holds no repositories.
    pub repos_none: String,
    /// "Add {count} to `DevPulse`".
    pub repos_add: String,
    /// Badge on `DevPulse`'s own repository.
    pub repo_devpulse: String,
    /// Badge on a repository registered before.
    pub repo_registered: String,
    /// Badge on a repository just added.
    pub repo_added: String,
}

/// First run.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct OnboardingCopy {
    /// Shared text.
    pub common: OnboardingCommonCopy,
    /// Welcome.
    pub welcome: WelcomeCopy,
    /// You.
    pub you: YouCopy,
}

/// Why a form field was refused, one line per code (`{limit}` is filled).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct FormErrorsCopy {
    /// Required and empty.
    pub required: String,
    /// Too short.
    pub too_short: String,
    /// Too long.
    pub too_long: String,
    /// Not an email.
    pub email: String,
    /// Folder does not exist.
    pub not_a_folder: String,
    /// No such field.
    pub unknown: String,
    /// Anything else.
    pub invalid: String,
}

/// Text shared by every form.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct FormsCopy {
    /// Field errors.
    pub errors: FormErrorsCopy,
}

/// A route's name, and the line shown under it where a tile shows one.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct RouteCopy {
    /// Name in navigation, tiles and section headers.
    pub label: String,
    /// One line under the name.
    #[serde(default)]
    pub blurb: Option<String>,
}

/// The whole catalog.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct CopyCatalog {
    /// First run.
    pub onboarding: OnboardingCopy,
    /// Forms.
    pub forms: FormsCopy,
    /// Route names, keyed by the URL path the route folders give
    /// (`/devtools/system/datastores/turso`). The desktop's architecture
    /// test holds these keys equal to its route tree.
    pub nav: BTreeMap<String, RouteCopy>,
}

/// The catalog in effect, and why your file was not used (if it wasn't).
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LoadedCopy {
    /// The catalog.
    pub copy: CopyCatalog,
    /// Why your `copy.toml` was not used; `None` when it was, or there is none.
    pub override_problem: Option<String>,
}

/// Where your overrides live.
#[must_use]
pub fn override_path(data_dir: &Path) -> PathBuf {
    data_dir.join("config").join("copy.toml")
}

/// Overlay `over` onto `base`, table by table; any other value replaces.
fn merge(base: &mut toml::Value, over: toml::Value) {
    match (base, over) {
        (toml::Value::Table(base), toml::Value::Table(over)) => {
            for (key, value) in over {
                match base.get_mut(&key) {
                    Some(existing) => merge(existing, value),
                    None => {
                        base.insert(key, value);
                    }
                }
            }
        }
        (base, over) => *base = over,
    }
}

fn bundled_value() -> Result<toml::Value> {
    toml::from_str(BUNDLED).context("bundled copy catalog")
}

/// The bundled catalog.
///
/// # Errors
/// Only if the bundled file is broken, which its test rules out.
pub fn bundled() -> Result<CopyCatalog> {
    bundled_value()?.try_into().context("bundled copy catalog")
}

/// Merge your overrides onto the bundled catalog.
///
/// # Errors
/// Returns an error if your text is not TOML, or names a key or type the
/// catalog does not have.
pub fn with_overrides(override_text: &str) -> Result<CopyCatalog> {
    let mut value = bundled_value()?;
    let over: toml::Value = toml::from_str(override_text).context("read your copy.toml")?;
    merge(&mut value, over);
    value.try_into().context("your copy.toml")
}

/// The catalog with your overrides, or the bundled one and the reason your
/// file was not used.
///
/// # Errors
/// Only if the bundled catalog is broken.
pub fn load(data_dir: &Path) -> Result<LoadedCopy> {
    let path = override_path(data_dir);
    let override_problem = match std::fs::read_to_string(&path) {
        Ok(text) => match with_overrides(&text) {
            Ok(copy) => {
                return Ok(LoadedCopy {
                    copy,
                    override_problem: None,
                })
            }
            Err(e) => Some(format!("{} was not used: {e:#}", path.display())),
        },
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
        Err(e) => Some(format!("{} could not be read: {e}", path.display())),
    };
    if let Some(reason) = &override_problem {
        tracing::warn!(target: "copy", %reason, "copy override rejected");
    }
    Ok(LoadedCopy {
        copy: bundled()?,
        override_problem,
    })
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn bundled_catalog_is_complete() {
        let copy = bundled().expect("bundled");
        assert!(!copy.onboarding.welcome.title.is_empty());
        assert!(copy.onboarding.common.progress.contains("{current}"));
    }

    #[test]
    fn your_keys_win_and_the_rest_keep_their_defaults() {
        let copy = with_overrides("[onboarding.welcome]\ncta = \"Start\"\n").expect("override");
        assert_eq!(copy.onboarding.welcome.cta, "Start");
        assert_eq!(
            copy.onboarding.welcome.title,
            bundled().unwrap().onboarding.welcome.title
        );
    }

    #[test]
    fn every_route_has_a_name() {
        let copy = bundled().expect("bundled");
        assert!(copy.nav.contains_key("/devpulse"));
        for (path, route) in &copy.nav {
            assert!(path.starts_with('/'), "{path}");
            assert!(!route.label.trim().is_empty(), "{path} has no label");
        }
    }

    #[test]
    fn your_route_name_wins() {
        let copy = with_overrides("[nav.\"/devpulse\"]\nlabel = \"Start\"\n").expect("override");
        assert_eq!(copy.nav["/devpulse"].label, "Start");
        assert_eq!(
            copy.nav["/latest"].label,
            bundled().unwrap().nav["/latest"].label
        );
    }

    #[test]
    fn unknown_keys_and_wrong_types_are_refused_with_the_reason() {
        let unknown = with_overrides("[onboarding.welcome]\nctaa = \"x\"\n").unwrap_err();
        assert!(format!("{unknown:#}").contains("ctaa"), "{unknown:#}");
        assert!(with_overrides("[onboarding.welcome]\ncta = 3\n").is_err());
    }
}
