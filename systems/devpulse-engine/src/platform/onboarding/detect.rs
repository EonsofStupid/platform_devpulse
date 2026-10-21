//! What first run can find on this machine without asking you.
//!
//! - Your git identity (`git config --global user.name / user.email`), the
//!   same place GitHub Desktop reads it from.
//! - Folders that hold git repositories: the candidates in
//!   `config/onboarding/folders.toml` (your copy wins), plus the folder that
//!   holds `DevPulse`'s own repository when `DevPulse` runs from its source.
//!
//! Nothing is assumed: a value is reported only if it was really found.

use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::{Context, Result};
use serde::Deserialize;

use devpulse_process::{self as process, Ran};

/// The bundled folder candidates.
const BUNDLED_FOLDERS: &str = include_str!("../../../config/onboarding/folders.toml");

/// How long one `git config` call may take.
const GIT_TIMEOUT: Duration = Duration::from_secs(5);

/// The most directory entries looked at per candidate folder.
const SCAN_CAP: usize = 2_000;

/// Your git identity, as git reports it.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct GitIdentity {
    /// `user.name`, if set.
    pub name: Option<String>,
    /// `user.email`, if set.
    pub email: Option<String>,
}

/// What asking git found.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GitLookup {
    /// Git answered (either value may be unset).
    Found(GitIdentity),
    /// Git is not installed or could not run.
    Unavailable(String),
}

async fn git_config(key: &str) -> Result<Option<String>> {
    let answer = match process::run(
        "git",
        &["config", "--global", "--get", key],
        &[],
        GIT_TIMEOUT,
    )
    .await?
    {
        Ran::Missing => anyhow::bail!("git is not installed"),
        Ran::Answered(answer) => answer,
    };
    // `git config --get` exits 1 when the key is unset.
    if answer.code == Some(1) {
        return Ok(None);
    }
    anyhow::ensure!(answer.ok(), "git config refused: {}", answer.reason());
    let value = unquote(answer.stdout.trim()).to_owned();
    Ok((!value.is_empty()).then_some(value))
}

/// One pair of wrapping quotes removed: a value set as
/// `git config user.name '"Ada Lovelace"'` (a common shell slip) is stored
/// with the quotes, and the name is what's inside them.
fn unquote(value: &str) -> &str {
    for quote in ['"', '\''] {
        if let Some(inner) = value
            .strip_prefix(quote)
            .and_then(|v| v.strip_suffix(quote))
        {
            return inner.trim();
        }
    }
    value
}

/// Ask git who you are.
pub async fn git_identity() -> GitLookup {
    match git_config("user.name").await {
        Ok(name) => GitLookup::Found(GitIdentity {
            name,
            email: git_config("user.email").await.ok().flatten(),
        }),
        Err(e) => GitLookup::Unavailable(format!("{e:#}")),
    }
}

/// A folder that holds git repositories.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RepoFolder {
    /// The folder.
    pub path: PathBuf,
    /// Git repositories directly inside it.
    pub repo_count: usize,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct FoldersFile {
    candidates: Vec<String>,
}

fn expand_home(raw: &str, home: Option<&Path>) -> Option<PathBuf> {
    match raw
        .strip_prefix("~/")
        .or_else(|| (raw == "~").then_some(""))
    {
        Some(rest) => home.map(|h| {
            if rest.is_empty() {
                h.to_path_buf()
            } else {
                h.join(rest)
            }
        }),
        None => Some(PathBuf::from(raw)),
    }
}

/// The candidate folders: yours if you have a valid file, else the bundled ones.
///
/// # Errors
/// Returns an error if your file exists but is invalid (the reason is
/// reported, not ignored), or the bundled file is broken.
pub fn candidates(data_dir: &Path, home: Option<&Path>) -> Result<Vec<PathBuf>> {
    let path = data_dir
        .join("config")
        .join("onboarding")
        .join("folders.toml");
    let text = match std::fs::read_to_string(&path) {
        Ok(text) => text,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => BUNDLED_FOLDERS.to_owned(),
        Err(e) => return Err(e).with_context(|| format!("read {}", path.display())),
    };
    let file: FoldersFile =
        toml::from_str(&text).with_context(|| format!("read {}", path.display()))?;
    Ok(file
        .candidates
        .iter()
        .filter_map(|c| expand_home(c, home))
        .collect())
}

/// Whether a folder is a git repository (has `.git`).
#[must_use]
pub fn is_repo(path: &Path) -> bool {
    path.join(".git").exists()
}

/// Count the git repositories directly inside a folder (the folder itself
/// counts if it is one). `None` when the folder does not exist.
#[must_use]
pub fn count_repos(folder: &Path) -> Option<usize> {
    let entries = std::fs::read_dir(folder).ok()?;
    let inside = entries
        .take(SCAN_CAP)
        .filter_map(std::result::Result::ok)
        .filter(|e| e.file_type().is_ok_and(|t| t.is_dir()) && is_repo(&e.path()))
        .count();
    Some(inside + usize::from(is_repo(folder)))
}

/// The repository `DevPulse` runs from, when it runs from its source (the
/// executable sits inside the repository, under `target/`). `None` for an
/// installed `DevPulse`.
#[must_use]
pub fn devpulse_repo() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    exe.ancestors()
        .skip(1)
        .find(|dir| is_repo(dir))
        .map(Path::to_path_buf)
}

/// Folders that hold repositories, most repositories first. `DevPulse`'s own
/// parent folder (when running from source) comes first.
///
/// # Errors
/// Returns an error if the candidate list cannot be read.
pub fn repo_folders(data_dir: &Path, home: Option<&Path>) -> Result<Vec<RepoFolder>> {
    let mut seen: Vec<PathBuf> = Vec::new();
    let mut found: Vec<RepoFolder> = Vec::new();
    let own_parent = devpulse_repo().and_then(|r| r.parent().map(Path::to_path_buf));
    for path in own_parent
        .iter()
        .cloned()
        .chain(candidates(data_dir, home)?)
    {
        let key = dunce_key(&path);
        if seen.contains(&key) {
            continue;
        }
        seen.push(key);
        if let Some(repo_count) = count_repos(&path).filter(|n| *n > 0) {
            found.push(RepoFolder { path, repo_count });
        }
    }
    let own = own_parent.as_deref();
    found.sort_by_key(|f| {
        (
            Some(f.path.as_path()) != own,
            std::cmp::Reverse(f.repo_count),
        )
    });
    Ok(found)
}

/// A comparison key that treats `~/Projects` and `~/projects` as one folder
/// on case-insensitive file systems.
fn dunce_key(path: &Path) -> PathBuf {
    std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    fn temp(tag: &str) -> PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        std::env::temp_dir().join(format!("devpulse-detect-{tag}-{nanos}"))
    }

    #[test]
    fn wrapping_quotes_are_removed_once() {
        assert_eq!(unquote("\"Ada Lovelace\""), "Ada Lovelace");
        assert_eq!(unquote("'Ada'"), "Ada");
        assert_eq!(unquote("Ada \"the\" Lovelace"), "Ada \"the\" Lovelace");
        assert_eq!(unquote("\""), "\"");
    }

    #[test]
    fn bundled_candidates_parse_and_expand_home() {
        let home = PathBuf::from("/home/ada");
        let list = candidates(&temp("none"), Some(&home)).expect("bundled");
        assert!(list.contains(&home.join("Documents/GitHub")));
        assert!(candidates(&temp("none"), None)
            .expect("no home")
            .iter()
            .all(|p| !p.starts_with("~")));
    }

    #[test]
    fn counts_repos_and_ranks_folders() {
        let root = temp("repos");
        for name in ["a", "b", "c"] {
            std::fs::create_dir_all(root.join("many").join(name).join(".git")).unwrap();
        }
        std::fs::create_dir_all(root.join("one").join("x").join(".git")).unwrap();
        std::fs::create_dir_all(root.join("none").join("plain")).unwrap();
        assert_eq!(count_repos(&root.join("many")), Some(3));
        assert_eq!(count_repos(&root.join("none")), Some(0));
        assert_eq!(count_repos(&root.join("missing")), None);

        let data = temp("data");
        let cfg = data.join("config").join("onboarding");
        std::fs::create_dir_all(&cfg).unwrap();
        let list = |p: &str| root.join(p).to_string_lossy().replace('\\', "/");
        std::fs::write(
            cfg.join("folders.toml"),
            format!(
                "candidates = [\"{}\", \"{}\", \"{}\"]",
                list("one"),
                list("many"),
                list("none")
            ),
        )
        .unwrap();
        let found = repo_folders(&data, None).expect("folders");
        let counts: Vec<usize> = found
            .iter()
            .filter(|f| f.path.starts_with(&root))
            .map(|f| f.repo_count)
            .collect();
        assert_eq!(
            counts,
            [3, 1],
            "empty folders are not suggested; most repos first"
        );

        std::fs::write(cfg.join("folders.toml"), "candidates = 3").unwrap();
        assert!(
            repo_folders(&data, None).is_err(),
            "a broken file is reported"
        );
        let _ = std::fs::remove_dir_all(root);
        let _ = std::fs::remove_dir_all(data);
    }
}
