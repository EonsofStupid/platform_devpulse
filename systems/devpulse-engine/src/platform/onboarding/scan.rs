//! The repositories in a folder, with what they are written in.
//!
//! A repository is a folder with `.git` — the chosen folder itself, or a
//! folder directly inside it. Languages come from tokei (lines of code per
//! language, respecting `.gitignore`), the most-used first. `DevPulse`'s own
//! repository is listed first when `DevPulse` runs from its source; repos
//! already registered are marked.

use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use serde::Serialize;
use specta::Type;

use super::detect;

/// The most repositories one scan lists.
const MAX_REPOS: usize = 200;

/// Languages shown per repository.
const TOP_LANGUAGES: usize = 3;

/// Lines of code in one language.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LanguageShare {
    /// Language name, as tokei reports it.
    pub name: String,
    /// Lines of code (comments and blank lines excluded).
    pub lines: u64,
}

/// A repository found in the folder.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FoundRepo {
    /// Folder name.
    pub name: String,
    /// Full path.
    pub path: String,
    /// The most-used languages, most first.
    pub languages: Vec<LanguageShare>,
    /// This is `DevPulse`'s own repository.
    pub is_devpulse: bool,
    /// Already registered as a project.
    pub registered: bool,
}

fn same_path(a: &Path, b: &Path) -> bool {
    let canon = |p: &Path| std::fs::canonicalize(p).unwrap_or_else(|_| p.to_path_buf());
    canon(a) == canon(b)
}

/// Lines of code per language, most first.
#[must_use]
pub fn languages(repo: &Path) -> Vec<LanguageShare> {
    let mut stats = tokei::Languages::new();
    stats.get_statistics(&[repo], &[], &tokei::Config::default());
    let mut shares: Vec<LanguageShare> = stats
        .iter()
        .filter(|(_, lang)| lang.code > 0)
        .map(|(kind, lang)| LanguageShare {
            name: kind.name().to_owned(),
            lines: u64::try_from(lang.code).unwrap_or(u64::MAX),
        })
        .collect();
    shares.sort_by(|a, b| b.lines.cmp(&a.lines).then_with(|| a.name.cmp(&b.name)));
    shares.truncate(TOP_LANGUAGES);
    shares
}

/// The repositories in `folder`.
///
/// # Errors
/// Returns an error if the folder cannot be read.
pub fn scan(folder: &Path, registered: &[String]) -> Result<Vec<FoundRepo>> {
    let mut repos: Vec<PathBuf> = Vec::new();
    if detect::is_repo(folder) {
        repos.push(folder.to_path_buf());
    }
    for entry in std::fs::read_dir(folder).with_context(|| format!("read {}", folder.display()))? {
        let Ok(entry) = entry else { continue };
        let path = entry.path();
        if entry.file_type().is_ok_and(|t| t.is_dir()) && detect::is_repo(&path) {
            repos.push(path);
        }
        if repos.len() >= MAX_REPOS {
            break;
        }
    }
    let own = detect::devpulse_repo();
    let mut found: Vec<FoundRepo> = repos
        .into_iter()
        .map(|path| FoundRepo {
            name: path.file_name().map_or_else(
                || path.display().to_string(),
                |n| n.to_string_lossy().into_owned(),
            ),
            languages: languages(&path),
            is_devpulse: own.as_deref().is_some_and(|o| same_path(o, &path)),
            registered: registered.iter().any(|r| same_path(Path::new(r), &path)),
            path: path.display().to_string(),
        })
        .collect();
    found.sort_by(|a, b| {
        b.is_devpulse
            .cmp(&a.is_devpulse)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(found)
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn finds_repos_with_their_languages() {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_nanos());
        let root = std::env::temp_dir().join(format!("devpulse-scan-{nanos}"));
        let rust = root.join("beta-rust");
        std::fs::create_dir_all(rust.join(".git")).unwrap();
        std::fs::create_dir_all(rust.join("src")).unwrap();
        std::fs::write(
            rust.join("src/main.rs"),
            "fn main() {\n    println!(\"hi\");\n}\n",
        )
        .unwrap();
        let web = root.join("Alpha-web");
        std::fs::create_dir_all(web.join(".git")).unwrap();
        std::fs::write(
            web.join("app.ts"),
            "export const a = 1;\nexport const b = 2;\n",
        )
        .unwrap();
        std::fs::create_dir_all(root.join("not-a-repo")).unwrap();

        let found = scan(&root, &[rust.display().to_string()]).expect("scan");
        let names: Vec<_> = found.iter().map(|r| r.name.as_str()).collect();
        assert_eq!(names, ["Alpha-web", "beta-rust"], "repos only, by name");
        let rust_repo = &found[1];
        assert!(rust_repo.registered);
        assert_eq!(
            rust_repo.languages,
            [LanguageShare {
                name: "Rust".into(),
                lines: 3
            }]
        );
        assert_eq!(found[0].languages[0].name, "TypeScript");
        assert!(!found[0].registered);

        assert!(
            scan(&root.join("missing"), &[]).is_err(),
            "a missing folder is reported"
        );
        let _ = std::fs::remove_dir_all(root);
    }
}
