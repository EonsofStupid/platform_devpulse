//! Canonical project routing key derivation.
//!
//! Every hook, every MCP consumer, every connector derives the
//! project-local database name from `std::env::current_dir()` (or
//! an equivalent path) the SAME way. Writes from one tool land in
//! the database that reads from another tool will query. Drift here
//! breaks the cross-tool memory invariant.

use std::path::Path;

/// Derive the project-local `SurrealDB` database name from a
/// workspace path.
///
/// Rule (canonical):
///
///   1. Take the final path component (project root name). Empty
///      paths fall back to `"default"`.
///   2. Lowercase the component.
///   3. Replace any run of non-alphanumeric bytes with a single
///      `_`.
///   4. Trim trailing `_`.
///   5. Truncate to 32 chars (`SurrealDB` identifier sanity).
///   6. If the result is empty after trimming, fall back to
///      `"default"`.
#[must_use]
pub fn slug_for_cwd(cwd: &Path) -> String {
    const MAX_LEN: usize = 32;
    let raw = cwd
        .file_name()
        .map_or_else(String::new, |s| s.to_string_lossy().into_owned());

    let mut slug = String::with_capacity(raw.len());
    let mut last_was_sep = false;
    for ch in raw.chars() {
        if ch.is_ascii_alphanumeric() {
            slug.push(ch.to_ascii_lowercase());
            last_was_sep = false;
        } else if !last_was_sep && !slug.is_empty() {
            slug.push('_');
            last_was_sep = true;
        }
    }
    while slug.ends_with('_') {
        slug.pop();
    }
    if slug.len() > MAX_LEN {
        slug.truncate(MAX_LEN);
    }
    if slug.is_empty() {
        "default".to_string()
    } else {
        slug
    }
}

#[cfg(test)]
mod tests {
    use super::slug_for_cwd;
    use std::path::{Path, PathBuf};

    #[test]
    fn slug_handles_unix_path() {
        assert_eq!(slug_for_cwd(Path::new("/home/me/My App!")), "my_app");
    }

    #[test]
    fn slug_handles_windows_path() {
        assert_eq!(
            slug_for_cwd(Path::new("D:/localdev/platform_devpulse")),
            "platform_devpulse"
        );
    }

    #[test]
    fn slug_falls_back_when_empty() {
        assert_eq!(slug_for_cwd(Path::new("")), "default");
    }

    #[test]
    fn slug_truncates_to_max_len() {
        let long = "a".repeat(40);
        let path_owned: PathBuf = long.into();
        let slug = slug_for_cwd(&path_owned);
        assert_eq!(slug.len(), 32);
        assert!(slug.chars().all(|c| c == 'a'));
    }
}
