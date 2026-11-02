//! Log organization and retention: `[logs]` (master plan M8).
//!
//! Every boot writes its logs into a folder of its own,
//! `{data_dir}/logs/runs/<run id>/`, and this policy decides which runs stay.
//! The values are configuration — `[logs]` in `config/platform/runtime.toml`,
//! or in your `{data_dir}/platform.toml`. The floor no value may go below is
//! this type's schema (`#[schemars(range(min))]`), checked by the validator
//! every form uses ([`crate::platform::forms`]).
//!
//! A run that failed (a crash, a panic, a boot that never got ready) is
//! kept longer than the rest. A policy below a floor would lose the
//! breadcrumbs of a failure, so it is refused, each key by name with its
//! floor, and the shipped policy is used instead.

use std::path::Path;

use anyhow::{Context, Result, anyhow};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::platform::config::PlatformBootConfig;
use crate::platform::config::loader::DEFAULT_CONFIG;
use crate::platform::forms::{self, ErrorCode, FieldError};

/// How many runs' logs stay, and for how long.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct LogsPolicy {
    /// The newest runs kept.
    #[schemars(range(min = 5))]
    pub keep_runs: u32,
    /// Failed runs kept besides the newest ones.
    #[schemars(range(min = 5))]
    pub keep_failed_runs: u32,
    /// Days a failed run is kept.
    #[schemars(range(min = 14))]
    pub failed_run_days: u32,
    /// Cap on the whole logs folder, in MB; the oldest runs that are not
    /// pinned go first.
    #[schemars(range(min = 200))]
    pub max_total_mb: u64,
    /// Below this much free disk, in MB, verbose logging drops to `info`.
    #[schemars(range(min = 256))]
    pub keep_free_mb: u64,
    /// Cap on one log file, in MB, before it rolls over.
    #[schemars(range(min = 50))]
    pub max_file_mb: u64,
    /// Remove what the policy does not keep. Off: what would go is only
    /// reported.
    pub prune: bool,
}

/// The policy in effect, and why yours was not used, when it was not.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LoadedPolicy {
    /// The policy to apply.
    pub policy: LogsPolicy,
    /// Each problem with your `[logs]`, in words; empty when it was used.
    pub refused: Vec<String>,
}

impl LogsPolicy {
    /// The policy shipped in `config/platform/runtime.toml`.
    ///
    /// # Errors
    /// Only if the shipped config has no `[logs]` or breaks its schema,
    /// which its test rules out.
    pub fn shipped() -> Result<Self> {
        let config: toml::Value =
            toml::from_str(DEFAULT_CONFIG).context("read the shipped platform config")?;
        let section = config
            .get("logs")
            .ok_or_else(|| anyhow!("the shipped platform config has no [logs]"))?;
        Self::check(section)?.map_err(|refused| {
            anyhow!(
                "the shipped [logs] breaks its schema: {}",
                refused.join("; ")
            )
        })
    }

    /// Check a `[logs]` section against the schema: the policy, or each
    /// refused key in words.
    ///
    /// # Errors
    /// When the section cannot be read or the schema cannot be built.
    pub fn check(section: &toml::Value) -> Result<std::result::Result<Self, Vec<String>>> {
        let payload = serde_json::to_value(section).context("read [logs]")?;
        Ok(forms::validate::<Self>(&payload)?
            .map_err(|errors| errors.iter().map(describe).collect()))
    }

    /// The policy for a data folder: your `[logs]` when you have one and it
    /// keeps its floors, otherwise the shipped one (with your problems
    /// listed).
    ///
    /// # Errors
    /// Only if the shipped policy is broken.
    pub fn load(data_dir: &Path) -> Result<LoadedPolicy> {
        let shipped = Self::shipped()?;
        let section = match PlatformBootConfig::load(data_dir) {
            Ok(config) => config.logs,
            Err(e) => {
                return Ok(LoadedPolicy {
                    policy: shipped,
                    refused: vec![format!("your platform.toml could not be read: {e:#}")],
                });
            }
        };
        let Some(section) = section else {
            return Ok(LoadedPolicy {
                policy: shipped,
                refused: Vec::new(),
            });
        };
        Ok(match Self::check(&section)? {
            Ok(policy) => LoadedPolicy {
                policy,
                refused: Vec::new(),
            },
            Err(refused) => LoadedPolicy {
                policy: shipped,
                refused,
            },
        })
    }
}

/// A refused `[logs]` key, in words.
fn describe(error: &FieldError) -> String {
    match (error.code, error.limit) {
        (ErrorCode::BelowMinimum, Some(floor)) => {
            format!("{} is below its floor of {floor}", error.field)
        }
        (ErrorCode::Unknown, _) => format!("{} is not a [logs] setting", error.field),
        (ErrorCode::Required, _) => format!("{} is missing", error.field),
        _ => format!("{} is not a valid value", error.field),
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    fn section(text: &str) -> toml::Value {
        toml::from_str(text).expect("toml")
    }

    const SHIPPED_VALUES: &str = "keep_runs = 10\nkeep_failed_runs = 20\nfailed_run_days = 30\n\
                                  max_total_mb = 1024\nkeep_free_mb = 1024\nmax_file_mb = 256\n\
                                  prune = false\n";

    #[test]
    fn the_shipped_policy_keeps_its_floors() {
        let shipped = LogsPolicy::shipped().expect("shipped");
        assert_eq!(
            shipped,
            LogsPolicy {
                keep_runs: 10,
                keep_failed_runs: 20,
                failed_run_days: 30,
                max_total_mb: 1024,
                keep_free_mb: 1024,
                max_file_mb: 256,
                prune: false,
            }
        );
        assert_eq!(
            LogsPolicy::check(&section(SHIPPED_VALUES)).unwrap(),
            Ok(shipped)
        );
    }

    #[test]
    fn a_policy_below_its_floors_is_refused_by_name() {
        let text = SHIPPED_VALUES
            .replace("keep_runs = 10", "keep_runs = 3")
            .replace("failed_run_days = 30", "failed_run_days = 7");
        let refused = LogsPolicy::check(&section(&text))
            .unwrap()
            .expect_err("below the floors");
        assert!(
            refused.contains(&"keep_runs is below its floor of 5".to_owned()),
            "{refused:?}"
        );
        assert!(
            refused.contains(&"failed_run_days is below its floor of 14".to_owned()),
            "{refused:?}"
        );
    }

    #[test]
    fn an_unknown_or_missing_key_is_refused() {
        let unknown = format!("{SHIPPED_VALUES}keep = 3\n");
        let refused = LogsPolicy::check(&section(&unknown))
            .unwrap()
            .expect_err("unknown key");
        assert!(
            refused.contains(&"keep is not a [logs] setting".to_owned()),
            "{refused:?}"
        );
        let missing = SHIPPED_VALUES.replace("prune = false\n", "");
        let refused = LogsPolicy::check(&section(&missing))
            .unwrap()
            .expect_err("missing key");
        assert!(
            refused.contains(&"prune is missing".to_owned()),
            "{refused:?}"
        );
    }

    /// Your `platform.toml` replaces the shipped config; a `[logs]` below
    /// its floors falls back to the shipped policy with the reasons.
    #[test]
    fn your_policy_is_used_unless_it_breaks_its_floors() {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_nanos());
        let data = std::env::temp_dir().join(format!("devpulse-logs-policy-{nanos}"));
        std::fs::create_dir_all(&data).unwrap();

        assert_eq!(
            LogsPolicy::load(&data).unwrap().refused,
            [] as [std::string::String; 0]
        );

        let mine = DEFAULT_CONFIG.replace("keep_runs = 10", "keep_runs = 12");
        std::fs::write(data.join("platform.toml"), &mine).unwrap();
        let loaded = LogsPolicy::load(&data).unwrap();
        assert_eq!(loaded.policy.keep_runs, 12);
        assert_eq!(loaded.refused, [] as [std::string::String; 0]);

        let too_few = DEFAULT_CONFIG.replace("keep_runs = 10", "keep_runs = 2");
        std::fs::write(data.join("platform.toml"), &too_few).unwrap();
        let loaded = LogsPolicy::load(&data).unwrap();
        assert_eq!(loaded.policy, LogsPolicy::shipped().unwrap());
        assert_eq!(loaded.refused, ["keep_runs is below its floor of 5"]);

        let _ = std::fs::remove_dir_all(data);
    }
}
