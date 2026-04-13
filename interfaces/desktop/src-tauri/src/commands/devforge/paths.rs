//! DevForge filesystem layout.
//!
//! All DevForge runtime data lives under `<data_dir>/devforge/`. In dev,
//! `data_dir` resolves to `<repo>/.userdata/` via `resolve_data_dir` in
//! `lib.rs`, so the concrete layout is:
//!
//! ```text
//! .userdata/devforge/
//! ├── install/           — REH binaries (prod). Dev uses the repo junction.
//! │   └── current/       — junction/symlink to the active version
//! ├── user-data/         — VS Code profiles, settings, keybindings, state
//! ├── extensions/        — installed VS Code extensions
//! ├── logs/              — REH stdout/stderr tail
//! └── state.json         — DevforgeState
//! ```
//!
//! **Workspaces are real project directories** (e.g. `D:/localdev/platform_devpulse`).
//! They are NOT generated or managed under this layout — the user's actual
//! project folders are passed to REH via `--folder-uri`. DevforgeState
//! remembers the last-opened project path so bootstrap can restore it.
//!
//! [`DevforgePaths`] is cheap to clone and held in [`PlatformState`]
//! so any command can ask for a canonical subpath without re-resolving.

use anyhow::{Context, Result};
use std::path::{Path, PathBuf};

/// Immutable snapshot of the DevForge directory layout.
#[derive(Debug, Clone)]
pub struct DevforgePaths {
    /// `<data_dir>/devforge/` — the root of everything.
    pub root: PathBuf,
}

impl DevforgePaths {
    /// Build the layout rooted at `<data_dir>/devforge/`.
    #[must_use]
    pub fn from_data_dir(data_dir: &Path) -> Self {
        Self {
            root: data_dir.join("devforge"),
        }
    }

    /// Root of the REH install tree — holds versioned subdirs and `current`.
    #[must_use]
    pub fn install_dir(&self) -> PathBuf {
        self.root.join("install")
    }

    /// Junction/symlink pointing at the active REH version in prod.
    #[must_use]
    pub fn install_current(&self) -> PathBuf {
        self.install_dir().join("current")
    }

    /// VS Code user-data directory — profiles, settings, keybindings, state.
    /// Passed to REH via `--user-data-dir`.
    #[must_use]
    pub fn user_data_dir(&self) -> PathBuf {
        self.root.join("user-data")
    }

    /// VS Code extensions directory — passed to REH via `--extensions-dir`.
    #[must_use]
    pub fn extensions_dir(&self) -> PathBuf {
        self.root.join("extensions")
    }

    /// Directory for REH stdout/stderr tail files.
    #[must_use]
    pub fn logs_dir(&self) -> PathBuf {
        self.root.join("logs")
    }

    /// Persistent [`DevforgeState`](super::state_file::DevforgeState) file.
    #[must_use]
    pub fn state_file(&self) -> PathBuf {
        self.root.join("state.json")
    }

    /// Create every directory in the layout if missing. Safe to call
    /// repeatedly — `create_dir_all` is idempotent.
    ///
    /// # Errors
    /// Returns an error if any directory cannot be created (usually a
    /// permissions issue on the data directory).
    pub fn ensure_layout(&self) -> Result<()> {
        for dir in [
            self.root.clone(),
            self.install_dir(),
            self.user_data_dir(),
            self.extensions_dir(),
            self.logs_dir(),
        ] {
            std::fs::create_dir_all(&dir)
                .with_context(|| format!("Failed to create {}", dir.display()))?;
        }
        Ok(())
    }

    /// Resolve the REH server directory.
    ///
    /// - **Dev** (`debug_assertions`): first tries the repo junction at
    ///   `<repo>/deps/code-oss-reh-web/`. This lets developers iterate on
    ///   the REH build without going through the install flow.
    /// - **Prod**: uses `<install>/current/` — populated by the DevForge
    ///   component installer / update channel.
    ///
    /// Returns `None` if neither location contains a valid REH build.
    #[must_use]
    pub fn resolve_reh_server_dir(&self) -> Option<PathBuf> {
        #[cfg(debug_assertions)]
        {
            // Derive repo root from CARGO_MANIFEST_DIR at compile time,
            // matching the pattern used by `resolve_data_dir` in lib.rs.
            let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
            if let Some(repo_root) = manifest
                .parent() // interfaces/desktop
                .and_then(Path::parent) // interfaces
                .and_then(Path::parent)
            // repo root
            {
                let dev_reh = repo_root.join("deps").join("code-oss-reh-web");
                if dev_reh.join("out").join("server-main.js").exists() {
                    return Some(dev_reh);
                }
            }
        }

        let prod = self.install_current();
        if prod.join("out").join("server-main.js").exists() {
            Some(prod)
        } else {
            None
        }
    }
}
