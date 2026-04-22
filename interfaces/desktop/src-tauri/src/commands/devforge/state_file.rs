//! Persistent `DevForge` state — small JSON file at `devforge/state.json`.
//!
//! Intentionally tiny and human-editable. Stores the user-facing bits that
//! need to survive restarts: last workspace, fresh-instance preference, and
//! the REH bundle version (used by the update channel to decide whether to
//! prompt for an update).

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::{Path, PathBuf};

/// Persistent state for the `DevForge` component.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
#[derive(Default)]
pub struct DevforgeState {
    /// Last project folder the user had open. Bootstrap restores this
    /// unless `fresh_instance_on_open` is set.
    pub last_workspace: Option<PathBuf>,

    /// If `true`, bootstrap opens VS Code with no folder instead of
    /// restoring `last_workspace`. User-toggled preference.
    pub fresh_instance_on_open: bool,

    /// Recently opened project paths — real directories on disk, not
    /// generated folders. Newest first, capped at [`MAX_RECENT`].
    pub recent_projects: Vec<PathBuf>,

    /// Version string of the installed REH bundle, if known. Populated by
    /// the update channel after a successful install.
    pub reh_version: Option<String>,
}

/// Maximum number of recent projects to persist.
pub const MAX_RECENT: usize = 20;


impl DevforgeState {
    /// Record a project path as recently opened. Moves it to the front
    /// if already present, caps the list at [`MAX_RECENT`].
    pub fn push_recent(&mut self, path: PathBuf) {
        self.recent_projects.retain(|p| p != &path);
        self.recent_projects.insert(0, path);
        self.recent_projects.truncate(MAX_RECENT);
    }
}

impl DevforgeState {
    /// Load the state file. Missing or corrupt files yield [`Default`] —
    /// callers don't have to distinguish "first run" from "parse error"
    /// because both are recoverable by rewriting.
    #[must_use]
    pub fn load(path: &Path) -> Self {
        let Ok(raw) = std::fs::read_to_string(path) else {
            return Self::default();
        };
        serde_json::from_str(&raw).unwrap_or_else(|e| {
            tracing::warn!(
                path = %path.display(),
                error = %e,
                "DevforgeState parse failed — using defaults"
            );
            Self::default()
        })
    }

    /// Write the state file as pretty JSON (human inspectable).
    ///
    /// # Errors
    /// Returns an error if serialization or the file write fails.
    pub fn save(&self, path: &Path) -> Result<()> {
        let json = serde_json::to_string_pretty(self)
            .context("Failed to serialize DevforgeState")?;
        std::fs::write(path, json)
            .with_context(|| format!("Failed to write {}", path.display()))?;
        Ok(())
    }
}
