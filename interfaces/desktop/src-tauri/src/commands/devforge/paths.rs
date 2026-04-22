//! `DevForge` filesystem layout.
//!
//! All `DevForge` runtime data lives under `<data_dir>/devforge/`. In dev,
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
//! project folders are passed to REH via `--folder-uri`. `DevforgeState`
//! remembers the last-opened project path so bootstrap can restore it.
//!
//! [`DevforgePaths`] is cheap to clone and held in [`PlatformState`]
//! so any command can ask for a canonical subpath without re-resolving.

use anyhow::{Context, Result};
use std::path::{Path, PathBuf};

/// Compile-time platform subdir inside `resources/devforge/`.
///
/// Each OS ships its own REH tree under a per-platform subdirectory — one
/// build lane per OS. Unsupported targets hard-fail at build time rather
/// than at runtime, matching the one-installer-per-OS shipping model.
pub const PLATFORM_SUBDIR: &str = {
    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    {
        "win32-x64"
    }
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        "darwin-arm64"
    }
    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    {
        "darwin-x64"
    }
    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    {
        "linux-x64"
    }
    #[cfg(not(any(
        all(target_os = "windows", target_arch = "x86_64"),
        all(target_os = "macos", target_arch = "aarch64"),
        all(target_os = "macos", target_arch = "x86_64"),
        all(target_os = "linux", target_arch = "x86_64"),
    )))]
    {
        compile_error!(
            "DevForge: unsupported target. Add a platform subdir under \
             interfaces/desktop/src-tauri/resources/devforge/ and extend \
             PLATFORM_SUBDIR in paths.rs."
        );
    }
};

/// Immutable snapshot of the `DevForge` directory layout.
#[derive(Debug, Clone)]
pub struct DevforgePaths {
    /// `<data_dir>/devforge/` — the root of everything.
    pub root: PathBuf,
    /// Tauri `resourceDir()/devforge/` — bundled REH seed tree.
    ///
    /// `None` in contexts where the resource dir could not be resolved
    /// (e.g. unit tests). The prod resolver falls back to dev paths when
    /// this is missing.
    pub bundled_root: Option<PathBuf>,
}

impl DevforgePaths {
    /// Build the layout rooted at `<data_dir>/devforge/`, without a bundled
    /// resource root. Prefer [`from_paths`](Self::from_paths) when a Tauri
    /// `AppHandle` is available so prod builds can seed-copy from the
    /// installed resources.
    #[must_use]
    pub fn from_data_dir(data_dir: &Path) -> Self {
        Self {
            root: data_dir.join("devforge"),
            bundled_root: None,
        }
    }

    /// Build the layout with both the runtime data dir and the Tauri
    /// bundled resource root (pointing at the per-platform REH seed tree).
    #[must_use]
    pub fn from_paths(data_dir: &Path, bundled_devforge_root: PathBuf) -> Self {
        Self {
            root: data_dir.join("devforge"),
            bundled_root: Some(bundled_devforge_root),
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
    /// Lookup order:
    ///
    /// 1. **Dev** (`debug_assertions`): repo junction at
    ///    `<repo>/deps/code-oss-reh-web/` — the live developer REH build
    ///    (kept as code-oss-reh-web for dev-only backwards compat; production
    ///    uses the fetched devforge release under `resources/devforge/`).
    ///    Always wins in dev so `cargo xtask run-dev` iterates on the
    ///    working tree without an install step.
    /// 2. **Runtime install**: `<install>/current/` — populated by the
    ///    update channel or the first-launch seed-copy.
    /// 3. **Bundled seed**: `{resourceDir}/devforge/` — the committed
    ///    per-platform REH tree shipped inside the Tauri installer. The
    ///    first-launch seed step copies this into `install/current/`.
    ///
    /// Returns `None` if no location contains a valid REH build.
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
                if is_valid_reh_tree(&dev_reh) {
                    return Some(dev_reh);
                }
            }
        }

        let installed = self.install_current();
        if is_valid_reh_tree(&installed) {
            return Some(installed);
        }

        if let Some(bundled) = self.bundled_root.as_ref() {
            if is_valid_reh_tree(bundled) {
                return Some(bundled.clone());
            }
        }

        None
    }

    /// Seed the runtime install tree from the bundled REH resource on
    /// first launch.
    ///
    /// When `<install>/current/` is empty and a bundled tree exists, copies
    /// the bundled tree into `<install>/v-bundled/` and flips `current/`
    /// to point at it. Idempotent — a second call is a no-op once the
    /// runtime copy exists.
    ///
    /// # Errors
    /// Returns an error if directory creation, copy, or symlink/junction
    /// creation fails (usually a permissions issue on the data directory).
    pub fn seed_install_from_bundle(&self) -> Result<()> {
        if is_valid_reh_tree(&self.install_current()) {
            return Ok(());
        }
        let Some(bundled) = self.bundled_root.as_ref() else {
            return Ok(());
        };
        if !is_valid_reh_tree(bundled) {
            return Ok(());
        }

        let seed_version = self.install_dir().join("v-bundled");
        if !is_valid_reh_tree(&seed_version) {
            tracing::info!(
                src = %bundled.display(),
                dst = %seed_version.display(),
                "DevForge: seeding install tree from bundled resource",
            );
            std::fs::create_dir_all(&seed_version)
                .with_context(|| format!("Failed to create {}", seed_version.display()))?;
            copy_dir_recursive(bundled, &seed_version)?;
        }

        point_current_at(&self.install_current(), &seed_version)?;
        Ok(())
    }
}

/// Cheap structural validity check — a REH tree is "valid" if it contains
/// `out/server-main.js`. That's the entry script the Node launcher execs,
/// so its presence is a reliable signal the tree was staged correctly.
fn is_valid_reh_tree(root: &Path) -> bool {
    root.join("out").join("server-main.js").is_file()
}

/// Replace the `current` junction/symlink with a new target. On Windows
/// we use a directory junction (no admin required); on Unix, a symlink.
fn point_current_at(current: &Path, target: &Path) -> Result<()> {
    if current.exists() || current.is_symlink() {
        // Junctions and symlinks both show up as symlinks — remove safely.
        if current.is_dir() && !current.is_symlink() {
            std::fs::remove_dir_all(current)
                .with_context(|| format!("Failed to remove {}", current.display()))?;
        } else {
            std::fs::remove_file(current)
                .or_else(|_| std::fs::remove_dir(current))
                .with_context(|| format!("Failed to unlink {}", current.display()))?;
        }
    }

    #[cfg(windows)]
    {
        std::os::windows::fs::symlink_dir(target, current).with_context(|| {
            format!(
                "Failed to link {} -> {}",
                current.display(),
                target.display()
            )
        })?;
    }
    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(target, current).with_context(|| {
            format!(
                "Failed to link {} -> {}",
                current.display(),
                target.display()
            )
        })?;
    }
    Ok(())
}

/// Recursively copy a directory tree. Follows neither symlinks nor
/// junctions — the bundled resource tree is expected to be a plain
/// directory of files.
fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<()> {
    std::fs::create_dir_all(dst).with_context(|| format!("Failed to create {}", dst.display()))?;

    for entry in
        std::fs::read_dir(src).with_context(|| format!("Failed to read {}", src.display()))?
    {
        let entry = entry?;
        let sp = entry.path();
        let dp = dst.join(entry.file_name());
        let ft = entry.file_type()?;
        if ft.is_dir() {
            copy_dir_recursive(&sp, &dp)?;
        } else if ft.is_file() {
            std::fs::copy(&sp, &dp).with_context(|| format!("Failed to copy {}", sp.display()))?;
        }
    }
    Ok(())
}
