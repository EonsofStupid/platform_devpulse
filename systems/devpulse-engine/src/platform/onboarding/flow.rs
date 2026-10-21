//! The first-run flow: which stages, in what order.
//!
//! Configuration with a shipped default (`config/onboarding/first-run.flow.toml`).
//! Your file at `{data_dir}/config/onboarding/first-run.flow.toml` replaces
//! the list. An invalid file is never silently ignored: [`Flow::load`]
//! returns the bundled flow together with the reason yours was not used,
//! and that reason is published with the onboarding state.

use std::path::{Path, PathBuf};

use anyhow::{bail, Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;

/// The bundled flow.
const BUNDLED: &str = include_str!("../../../config/onboarding/first-run.flow.toml");

/// One first-run stage. A stage exists here only once it works end to end.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum Stage {
    /// Clyffy greets you; detection starts.
    Welcome,
    /// Your name, email and projects folder.
    You,
    /// Your AI: the subscriptions and apps you already have.
    YourAi,
    /// Your dev environment: a container engine for your projects.
    Containers,
}

impl Stage {
    /// The stage's id, as written in the flow file and stored in Turso.
    #[must_use]
    pub const fn id(self) -> &'static str {
        match self {
            Self::Welcome => "welcome",
            Self::You => "you",
            Self::YourAi => "your_ai",
            Self::Containers => "containers",
        }
    }

    /// The stage with this id.
    ///
    /// # Errors
    /// Returns an error naming the id when it is not a known stage.
    pub fn from_id(id: &str) -> Result<Self> {
        match id {
            "welcome" => Ok(Self::Welcome),
            "you" => Ok(Self::You),
            "your_ai" => Ok(Self::YourAi),
            "containers" => Ok(Self::Containers),
            other => bail!("unknown first-run stage {other:?}"),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct FlowFile {
    stages: Vec<Stage>,
}

/// The stages of first run, in order.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Flow {
    stages: Vec<Stage>,
}

/// A flow, and why your override was not used (if it wasn't).
#[derive(Debug, Clone)]
pub struct LoadedFlow {
    /// The flow in effect.
    pub flow: Flow,
    /// Why your file was not used; `None` when it was, or when there is none.
    pub override_error: Option<String>,
}

impl Flow {
    /// Parse a flow file.
    ///
    /// # Errors
    /// Returns an error if the TOML is invalid, a stage is unknown, the list
    /// is empty, or a stage repeats.
    pub fn parse(toml_text: &str) -> Result<Self> {
        let file: FlowFile = toml::from_str(toml_text).context("read the flow file")?;
        if file.stages.is_empty() {
            bail!("the flow lists no stages");
        }
        for (i, stage) in file.stages.iter().enumerate() {
            if file.stages[..i].contains(stage) {
                bail!("stage {:?} is listed twice", stage.id());
            }
        }
        Ok(Self {
            stages: file.stages,
        })
    }

    /// The bundled flow.
    ///
    /// # Errors
    /// Only if the bundled file is broken, which its test rules out.
    pub fn bundled() -> Result<Self> {
        Self::parse(BUNDLED).context("bundled first-run flow")
    }

    /// Where your override lives.
    #[must_use]
    pub fn override_path(data_dir: &Path) -> PathBuf {
        data_dir
            .join("config")
            .join("onboarding")
            .join("first-run.flow.toml")
    }

    /// Your flow if you have one and it is valid, otherwise the bundled one
    /// with the reason yours was not used.
    ///
    /// # Errors
    /// Only if the bundled flow is broken.
    pub fn load(data_dir: &Path) -> Result<LoadedFlow> {
        let path = Self::override_path(data_dir);
        let override_error = match std::fs::read_to_string(&path) {
            Ok(text) => match Self::parse(&text) {
                Ok(flow) => {
                    return Ok(LoadedFlow {
                        flow,
                        override_error: None,
                    })
                }
                Err(e) => Some(format!("{} was not used: {e:#}", path.display())),
            },
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
            Err(e) => Some(format!("{} could not be read: {e}", path.display())),
        };
        if let Some(reason) = &override_error {
            tracing::warn!(target: "onboarding", %reason, "first-run flow override rejected");
        }
        Ok(LoadedFlow {
            flow: Self::bundled()?,
            override_error,
        })
    }

    /// The stages, in order.
    #[must_use]
    pub fn stages(&self) -> &[Stage] {
        &self.stages
    }

    /// The first stage.
    #[must_use]
    pub fn first(&self) -> Stage {
        self.stages[0]
    }

    /// Whether the flow includes a stage.
    #[must_use]
    pub fn contains(&self, stage: Stage) -> bool {
        self.stages.contains(&stage)
    }

    /// The stage after this one; `None` at the end.
    #[must_use]
    pub fn next(&self, stage: Stage) -> Option<Stage> {
        let i = self.stages.iter().position(|s| *s == stage)?;
        self.stages.get(i + 1).copied()
    }

    /// The stage before this one; `None` at the start.
    #[must_use]
    pub fn previous(&self, stage: Stage) -> Option<Stage> {
        let i = self.stages.iter().position(|s| *s == stage)?;
        i.checked_sub(1).and_then(|p| self.stages.get(p)).copied()
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn bundled_flow_is_valid_and_ordered() {
        let flow = Flow::bundled().expect("bundled");
        assert_eq!(
            flow.stages(),
            [Stage::Welcome, Stage::You, Stage::YourAi, Stage::Containers]
        );
        assert_eq!(flow.first(), Stage::Welcome);
        assert_eq!(flow.next(Stage::Welcome), Some(Stage::You));
        assert_eq!(flow.next(Stage::You), Some(Stage::YourAi));
        assert_eq!(flow.next(Stage::YourAi), Some(Stage::Containers));
        assert_eq!(flow.next(Stage::Containers), None);
        assert_eq!(flow.previous(Stage::You), Some(Stage::Welcome));
        assert_eq!(flow.previous(Stage::Welcome), None);
    }

    #[test]
    fn invalid_flows_are_refused_with_the_reason() {
        let unknown = Flow::parse(r#"stages = ["welcome", "magic"]"#).unwrap_err();
        assert!(format!("{unknown:#}").contains("magic"), "{unknown:#}");
        assert!(Flow::parse("stages = []").is_err());
        let twice = Flow::parse(r#"stages = ["you", "you"]"#).unwrap_err();
        assert!(format!("{twice:#}").contains("twice"));
        assert!(Flow::parse(
            r#"stages = ["you"]
extra = 1"#
        )
        .is_err());
    }

    #[test]
    fn your_flow_wins_and_a_broken_one_is_reported_not_ignored() {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let dir = std::env::temp_dir().join(format!("devpulse-flow-{nanos}"));
        let path = Flow::override_path(&dir);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();

        let none = Flow::load(&dir).expect("load");
        assert_eq!(none.flow, Flow::bundled().unwrap());
        assert!(none.override_error.is_none());

        std::fs::write(&path, r#"stages = ["you"]"#).unwrap();
        let yours = Flow::load(&dir).expect("load");
        assert_eq!(yours.flow.stages(), [Stage::You]);
        assert!(yours.override_error.is_none());

        std::fs::write(&path, r#"stages = ["nope"]"#).unwrap();
        let broken = Flow::load(&dir).expect("load");
        assert_eq!(broken.flow, Flow::bundled().unwrap());
        assert!(broken
            .override_error
            .as_deref()
            .unwrap_or_default()
            .contains("nope"));

        let _ = std::fs::remove_dir_all(dir);
    }
}
