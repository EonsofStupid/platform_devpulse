//! Download scope — where a downloaded model lands on disk.
//!
//! Two storage scopes today:
//!
//!   - [`DownloadScope::Global`] — `<models_dir>/<owner>/<repo>/<files>`.
//!     The shared pool every project + the wizard read from. New
//!     downloads default here.
//!   - [`DownloadScope::Project(id)`] — `<models_dir>/_per_project/<id>/<owner>/<repo>/<files>`.
//!     Models the user wants tied to one project's lifetime — handy for
//!     fine-tuned variants or experiments the user doesn't want
//!     polluting the global library.
//!
//! Discovery walks the whole tree recursively, so a project-scoped
//! model is still loadable into any slot — scope is a STORAGE concept,
//! not an access gate. UI surfaces decide whether to filter results by
//! scope; the kernel doesn't.
//!
//! ## Path safety
//!
//! `repo_id` arrives from HF search results (user-controlled). The
//! `<owner>/<repo>` split is sanitised so a hostile id like
//! `..//evil` cannot traverse outside `models_dir`. Sanitisation keeps
//! `[A-Za-z0-9._-]` and drops everything else — HF's own repo-id rules
//! produce that alphabet, so legitimate repos pass through unchanged.
//!
//! Project ids are sanitised the same way. Both go through
//! [`sanitise_token`].
//!
//! ## Wire format
//!
//! `DownloadScope` serialises with `#[serde(tag = "kind", content =
//! "id")]` to give layman-readable JSON in event logs and Tauri payloads:
//!
//! ```json
//! {"kind": "global"}
//! {"kind": "project", "id": "checkout-flow"}
//! ```
//!
//! ## Legacy on-disk layout (still discoverable)
//!
//! Older versions of this crate routed downloads into capability
//! subdirs (`chat/`, `rag/`, `voice/`, `vision/`). Those files remain
//! loadable — `discover_models` is fully recursive — but new downloads
//! always use the `<owner>/<repo>/` layout authored here. No migration
//! ships; pre-release, the old paths simply continue to exist.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Subdirectory under `models_dir` that holds every project-scoped
/// download. The leading underscore keeps it from colliding with an HF
/// `<owner>` namespace (HF owners cannot begin with `_`).
pub const PER_PROJECT_ROOT: &str = "_per_project";

/// Placeholder owner / name component when a repo id is malformed (no
/// slash). Lets the file still land somewhere under `models_dir`
/// without escaping the tree.
pub const UNSCOPED_PLACEHOLDER: &str = "__unscoped__";

/// Where on disk a downloaded model lands.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(tag = "kind", content = "id", rename_all = "lowercase")]
pub enum DownloadScope {
    /// Shared library — every project sees the model.
    #[default]
    Global,
    /// Tied to one project's lifetime. The string is the project id
    /// (sanitised on construction via [`DownloadScope::project`]).
    Project(String),
}

impl DownloadScope {
    /// Construct a `Project` scope from a raw id. Returns `None` when
    /// the id is empty after sanitisation — callers should fall back to
    /// `DownloadScope::Global` rather than fabricate a placeholder id.
    pub fn project(id: impl Into<String>) -> Option<Self> {
        let cleaned = sanitise_token(&id.into());
        if cleaned.is_empty() {
            None
        } else {
            Some(Self::Project(cleaned))
        }
    }

    /// Resolve the on-disk root for this scope, given the workspace's
    /// `models_dir`. Project scopes land under
    /// `<models_dir>/_per_project/<id>/`.
    pub fn resolve_root(&self, models_dir: &Path) -> PathBuf {
        match self {
            Self::Global => models_dir.to_path_buf(),
            Self::Project(id) => {
                // The enum is also constructed directly and through serde;
                // its constructor cannot be the only path-safety boundary.
                let cleaned = sanitise_token(id);
                let component = if cleaned.is_empty() {
                    UNSCOPED_PLACEHOLDER
                } else {
                    &cleaned
                };
                models_dir.join(PER_PROJECT_ROOT).join(component)
            }
        }
    }
}

/// Resolve the destination directory for a downloaded bundle.
///
/// Layout: `<scope_root>/<owner>/<repo>/`. The `<owner>/<repo>` split
/// is derived from `repo_id`; a malformed `repo_id` (no slash, or one
/// whose owner / name sanitise to empty) lands under
/// [`UNSCOPED_PLACEHOLDER`] so the bundle still has somewhere to live
/// without escaping the tree.
///
/// Every path component is sanitised via [`sanitise_token`] so a
/// hostile `repo_id` cannot traverse outside `models_dir`.
pub fn resolve_bundle_dir(models_dir: &Path, scope: &DownloadScope, repo_id: &str) -> PathBuf {
    let (owner_raw, name_raw) = repo_id
        .split_once('/')
        .unwrap_or((UNSCOPED_PLACEHOLDER, repo_id));
    let owner = sanitise_token(owner_raw);
    let owner = if owner.is_empty() {
        UNSCOPED_PLACEHOLDER.to_string()
    } else {
        owner
    };
    let name = sanitise_token(name_raw);
    let name = if name.is_empty() {
        UNSCOPED_PLACEHOLDER.to_string()
    } else {
        name
    };
    scope.resolve_root(models_dir).join(owner).join(name)
}

/// Sanitise a path component — keep `[A-Za-z0-9._-]`, drop everything
/// else. HF's own repo-id rules produce that alphabet, so legitimate
/// repos pass through unchanged. Length is not bounded here; the
/// filesystem will reject anything genuinely too long. Remove trailing dots
/// for consistent Windows behavior; dot-only names become empty rather than
/// resolving to the current or parent directory.
pub fn sanitise_token(raw: &str) -> String {
    let cleaned: String = raw
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
        .collect();
    cleaned.trim_end_matches('.').to_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn global_resolves_to_models_dir_root() {
        let scope = DownloadScope::Global;
        assert_eq!(scope.resolve_root(Path::new("/m")), PathBuf::from("/m"));
    }

    #[test]
    fn project_resolves_under_per_project_subdir() -> anyhow::Result<()> {
        let scope = DownloadScope::project("alpha")
            .ok_or_else(|| anyhow::anyhow!("valid project rejected"))?;
        assert_eq!(
            scope.resolve_root(Path::new("/m")),
            PathBuf::from("/m/_per_project/alpha"),
        );
        Ok(())
    }

    #[test]
    fn project_with_traversal_chars_is_sanitised() -> anyhow::Result<()> {
        let scope = DownloadScope::project("../evil")
            .ok_or_else(|| anyhow::anyhow!("sanitized project rejected"))?;
        // `..` (dots are kept) and `/` are stripped; what's left is "..evil"
        // — still fully inside `_per_project/`.
        assert_eq!(
            scope.resolve_root(Path::new("/m")),
            PathBuf::from("/m/_per_project/..evil"),
        );
        Ok(())
    }

    #[test]
    fn project_with_only_invalid_chars_returns_none() {
        assert!(DownloadScope::project("///").is_none());
        assert!(DownloadScope::project("").is_none());
        assert!(DownloadScope::project(".").is_none());
        assert!(DownloadScope::project("..").is_none());
        assert!(DownloadScope::project("...").is_none());
    }

    #[test]
    fn bundle_dir_uses_owner_repo_split() {
        let dir = resolve_bundle_dir(
            Path::new("/m"),
            &DownloadScope::Global,
            "microsoft/harrier-oss-v1-0.6b",
        );
        assert_eq!(dir, PathBuf::from("/m/microsoft/harrier-oss-v1-0.6b"));
    }

    #[test]
    fn bundle_dir_strips_traversal_segments() {
        let dir = resolve_bundle_dir(Path::new("/m"), &DownloadScope::Global, "../..");
        assert_eq!(dir, PathBuf::from("/m/__unscoped__/__unscoped__"));
    }

    #[test]
    fn bundle_dir_repo_id_without_slash_uses_placeholder_owner() {
        let dir = resolve_bundle_dir(Path::new("/m"), &DownloadScope::Global, "solo-file");
        assert_eq!(dir, PathBuf::from("/m/__unscoped__/solo-file"));
    }

    #[test]
    fn bundle_dir_under_project_scope_nests_correctly() -> anyhow::Result<()> {
        let scope = DownloadScope::project("alpha")
            .ok_or_else(|| anyhow::anyhow!("valid project rejected"))?;
        let dir = resolve_bundle_dir(Path::new("/m"), &scope, "owner/name");
        assert_eq!(dir, PathBuf::from("/m/_per_project/alpha/owner/name"));
        Ok(())
    }

    #[test]
    fn wire_format_round_trip() -> serde_json::Result<()> {
        let global = serde_json::to_string(&DownloadScope::Global)?;
        assert_eq!(global, r#"{"kind":"global"}"#);

        let project = serde_json::to_string(&DownloadScope::Project("alpha".to_string()))?;
        assert_eq!(project, r#"{"kind":"project","id":"alpha"}"#);

        let parsed: DownloadScope = serde_json::from_str(r#"{"kind":"project","id":"beta"}"#)?;
        assert_eq!(parsed, DownloadScope::Project("beta".to_string()));
        Ok(())
    }

    #[test]
    fn deserialized_projects_and_repo_ids_cannot_escape_the_model_root() -> anyhow::Result<()> {
        let root = Path::new("models");
        for id in [
            "..",
            ".",
            "...",
            "../../outside",
            "/absolute",
            r"C:\outside",
            "valid-project",
        ] {
            let scope: DownloadScope =
                serde_json::from_value(serde_json::json!({"kind": "project", "id": id}))?;
            for repo in [
                "../..",
                "./model",
                "owner/..",
                "/model",
                "owner/repo",
                ".../...",
            ] {
                let destination = resolve_bundle_dir(root, &scope, repo);
                let relative = destination.strip_prefix(root.join(PER_PROJECT_ROOT))?;
                let components: Vec<_> = relative.components().collect();
                assert_eq!(components.len(), 3, "{destination:?}");
                assert!(
                    components
                        .iter()
                        .all(|part| matches!(part, std::path::Component::Normal(_))),
                    "{destination:?}"
                );
            }
        }
        Ok(())
    }

    #[test]
    fn default_is_global() {
        assert_eq!(DownloadScope::default(), DownloadScope::Global);
    }
}
