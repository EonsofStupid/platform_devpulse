//! Connectors: a small program that speaks ACP for an agent whose own CLI
//! does not (Codex today). Each is published on npm by the protocol's
//! maintainers. `DevPulse` installs it into its own folder when you click —
//! never globally, never at startup — so it travels with the portable
//! folder: `{data_dir}/tools/connectors/{provider id}/`.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::providers::definition::ConnectorSpec;
use crate::providers::npm;
pub use crate::providers::npm::Installed;

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

/// The connector's folder for one provider.
#[must_use]
pub fn dir(data_dir: &Path, provider_id: &str) -> PathBuf {
    data_dir.join("tools").join("connectors").join(provider_id)
}

/// The connector's program (npm's launcher, a `.cmd` on Windows).
#[must_use]
pub fn program(data_dir: &Path, provider_id: &str, spec: &ConnectorSpec) -> PathBuf {
    npm::launcher(&dir(data_dir, provider_id), &spec.bin)
}

/// Is it installed, and which version (from its own `package.json`).
#[must_use]
pub fn report(data_dir: &Path, provider_id: &str, spec: &ConnectorSpec) -> ConnectorReport {
    let installed = program(data_dir, provider_id, spec).is_file();
    let version = installed
        .then(|| npm::installed_version(&dir(data_dir, provider_id), &spec.npm))
        .flatten();
    ConnectorReport {
        package: spec.npm.clone(),
        installed,
        version,
    }
}

/// Install (or update) the connector into the `DevPulse` folder with npm.
pub async fn install(data_dir: &Path, provider_id: &str, spec: &ConnectorSpec) -> Installed {
    npm::install(&dir(data_dir, provider_id), &spec.npm, &spec.bin).await
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
            .map_or(0, |d| d.as_nanos());
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
