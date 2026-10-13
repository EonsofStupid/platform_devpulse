//! The UI copy catalog — every visible string, typed.
//!
//! Configuration with shipped defaults (`config/copy.default.toml`). Your
//! file at `{data_dir}/config/copy.toml` overrides any key; keys you leave
//! out keep the defaults (a deep merge, per key). A key `DevPulse` does not
//! know, or a value of the wrong type, refuses your file with the reason,
//! which is returned with the catalog so the UI can show it — never
//! silently ignored.

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
}

/// First run.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct OnboardingCopy {
    /// Shared text.
    pub common: OnboardingCommonCopy,
    /// Welcome.
    pub welcome: WelcomeCopy,
}

/// The whole catalog.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct CopyCatalog {
    /// First run.
    pub onboarding: OnboardingCopy,
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
    fn unknown_keys_and_wrong_types_are_refused_with_the_reason() {
        let unknown = with_overrides("[onboarding.welcome]\nctaa = \"x\"\n").unwrap_err();
        assert!(format!("{unknown:#}").contains("ctaa"), "{unknown:#}");
        assert!(with_overrides("[onboarding.welcome]\ncta = 3\n").is_err());
    }
}
