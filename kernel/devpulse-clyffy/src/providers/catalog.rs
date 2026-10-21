//! The provider catalog: the bundled definitions, plus yours.
//!
//! Bundled definitions ship with the kernel (`config/providers/*.toml`), one
//! per subscription agent and desktop app in the registry. Your files in
//! `{data_dir}/config/providers/*.toml` replace a bundled one with the same
//! id (a different install path, another update command). A file of yours
//! that does not validate — or names an id the registry does not have — is
//! not used, and the reason is reported, never ignored.

use std::path::Path;

use anyhow::{Context, Result};

use super::definition::ProviderDefinition;

/// The bundled definitions, by file name, in registry order.
const BUNDLED: [(&str, &str); 8] = [
    (
        "claude-code.toml",
        include_str!("../../config/providers/claude-code.toml"),
    ),
    (
        "codex.toml",
        include_str!("../../config/providers/codex.toml"),
    ),
    (
        "grok-build.toml",
        include_str!("../../config/providers/grok-build.toml"),
    ),
    (
        "antigravity-cli.toml",
        include_str!("../../config/providers/antigravity-cli.toml"),
    ),
    (
        "gemini-cli.toml",
        include_str!("../../config/providers/gemini-cli.toml"),
    ),
    (
        "cursor.toml",
        include_str!("../../config/providers/cursor.toml"),
    ),
    (
        "claude-desktop.toml",
        include_str!("../../config/providers/claude-desktop.toml"),
    ),
    (
        "antigravity.toml",
        include_str!("../../config/providers/antigravity.toml"),
    ),
];

/// The definitions in effect, and why any of your files were not used.
#[derive(Debug, Clone)]
pub struct Catalog {
    /// Definitions, bundled order first, then yours by file name.
    pub definitions: Vec<ProviderDefinition>,
    /// One line per file of yours that was not used.
    pub problems: Vec<String>,
}

/// The bundled definitions.
///
/// # Errors
/// Only if a bundled file is broken, which its test rules out.
pub fn bundled() -> Result<Vec<ProviderDefinition>> {
    BUNDLED
        .iter()
        .map(|(file, text)| {
            ProviderDefinition::parse(text).with_context(|| format!("bundled {file}"))
        })
        .collect()
}

/// Bundled definitions with yours applied.
///
/// # Errors
/// Only if a bundled file is broken.
pub fn load(data_dir: &Path) -> Result<Catalog> {
    let mut definitions = bundled()?;
    let mut problems = Vec::new();
    let dir = data_dir.join("config").join("providers");
    let mut files: Vec<_> = match std::fs::read_dir(&dir) {
        Ok(entries) => entries
            .filter_map(Result::ok)
            .map(|e| e.path())
            .filter(|p| p.extension().is_some_and(|x| x == "toml"))
            .collect(),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Vec::new(),
        Err(e) => {
            problems.push(format!("{} could not be read: {e}", dir.display()));
            Vec::new()
        }
    };
    files.sort();
    for path in files {
        let parsed = std::fs::read_to_string(&path)
            .context("read it")
            .and_then(|text| ProviderDefinition::parse(&text));
        match parsed {
            Ok(definition) => match definitions.iter_mut().find(|d| d.id == definition.id) {
                Some(existing) => *existing = definition,
                None => definitions.push(definition),
            },
            Err(e) => problems.push(format!("{} was not used: {e:#}", path.display())),
        }
    }
    for problem in &problems {
        tracing::warn!(target: "providers", %problem, "provider definition not used");
    }
    Ok(Catalog {
        definitions,
        problems,
    })
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use crate::providers::types::ProviderId;

    /// What every provider looks like on the machine running the test.
    /// Run with `--ignored --nocapture`.
    #[tokio::test]
    #[ignore = "asks this machine's tools and the network"]
    async fn this_machine() {
        let catalog = Catalog {
            definitions: bundled().expect("bundled"),
            problems: Vec::new(),
        };
        let report = crate::providers::check(&catalog, &std::env::temp_dir()).await;
        for p in &report.providers {
            println!(
                "{:<15} installed={:<5} version={:<22} latest={:<12} update={:<5} signed_in={:?} at={:?} problems={:?}",
                p.id.key(),
                p.installed,
                p.version.as_deref().unwrap_or("-"),
                p.latest.as_deref().unwrap_or("-"),
                p.update_available,
                p.signed_in,
                p.location,
                p.problems
            );
        }
    }

    #[test]
    fn every_bundled_definition_validates_in_registry_order() {
        let ids: Vec<ProviderId> = bundled()
            .expect("bundled")
            .into_iter()
            .map(|d| d.id)
            .collect();
        assert_eq!(
            ids,
            [
                ProviderId::ClaudeCode,
                ProviderId::Codex,
                ProviderId::GrokBuild,
                ProviderId::AntigravityCli,
                ProviderId::GeminiCli,
                ProviderId::Cursor,
                ProviderId::ClaudeDesktop,
                ProviderId::Antigravity,
            ]
        );
        // Registry order: the bundled files list the registry's own rows.
        let positions: Vec<usize> = ids
            .iter()
            .filter_map(|id| {
                crate::providers::registry::PROVIDERS
                    .iter()
                    .position(|p| p.id == *id)
            })
            .collect();
        assert_eq!(positions.len(), ids.len(), "every bundled id has a row");
    }

    #[test]
    fn your_file_replaces_by_id_and_unknown_or_broken_files_are_reported() {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let data = std::env::temp_dir().join(format!("devpulse-providers-{nanos}"));
        let dir = data.join("config").join("providers");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(
            dir.join("a-codex.toml"),
            "id = \"codex\"
[detect]
executables = [\"my-codex\"]
",
        )
        .unwrap();
        std::fs::write(
            dir.join("b-new.toml"),
            "id = \"my-agent\"
[detect]
executables = [\"my-agent\"]
",
        )
        .unwrap();
        std::fs::write(dir.join("c-broken.toml"), "id = \"codex\"").unwrap();

        let catalog = load(&data).expect("load");
        let codex = catalog
            .definitions
            .iter()
            .find(|d| d.id == ProviderId::Codex)
            .unwrap();
        assert_eq!(codex.detect.executables, ["my-codex"]);
        assert_eq!(catalog.definitions.len(), BUNDLED.len());
        assert_eq!(catalog.problems.len(), 2, "{:?}", catalog.problems);
        assert!(catalog.problems.iter().any(|p| p.contains("b-new.toml")));
        assert!(catalog.problems.iter().any(|p| p.contains("c-broken.toml")));
        let _ = std::fs::remove_dir_all(data);
    }
}
