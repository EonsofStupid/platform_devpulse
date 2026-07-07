//! Atomic-TOML `ConfigBackend` — DevPulse's local slot/setup persistence.
//!
//! The model-loader's [`ConfigBackend`] is a small **sync** key→value store
//! (slot assignments like `slot.chat.brain.model`, setup flags). DevPulse backs
//! it with an atomic TOML file under `{data_dir}/user/`, matching the platform's
//! existing atomic-TOML config convention. There is deliberately **no** async
//! Turso bridge here: Turso stays the SSOT for real data; slot state is
//! settings-like and the sync trait maps cleanly onto a file, avoiding an
//! async→sync bridge (kernel-severance follow-up, owner-chosen).
//!
//! Dotted keys (`slot.chat.brain.model`) are stored inside an `[entries]`
//! table so the TOML serializer **quotes** them (rather than treating each dot
//! as table nesting) and they round-trip losslessly.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};

use crate::platform::ConfigBackend;

/// Filename under `{data_dir}/user/` holding the model-loader key→value state.
const CONFIG_FILENAME: &str = "model_loader.config.toml";

/// On-disk shape. The single `entries` table forces the TOML serializer to
/// quote dotted keys instead of interpreting the dots as nested tables.
#[derive(Debug, Default, Serialize, Deserialize)]
struct ConfigFile {
    #[serde(default)]
    entries: BTreeMap<String, String>,
}

/// Atomic-TOML file-backed [`ConfigBackend`].
///
/// The in-memory `BTreeMap` is the working copy (stable ordering ⇒ stable
/// diffs); every mutation flushes the whole map to disk via a temp-then-rename
/// so a crash mid-write never leaves a truncated config.
#[derive(Debug)]
pub struct FileConfigBackend {
    path: PathBuf,
    entries: Mutex<BTreeMap<String, String>>,
}

impl FileConfigBackend {
    /// Load (or start empty) from `{userdata_dir}/model_loader.config.toml`.
    ///
    /// A missing file is the fresh-install case (empty map). A corrupt file is
    /// logged and treated as empty rather than failing boot — the user re-runs
    /// setup, they don't get a dead app.
    ///
    /// # Errors
    /// Returns an error only when the file exists but cannot be **read** (a real
    /// IO/permission failure the caller should surface); parse failures fail-soft.
    pub fn load(userdata_dir: &Path) -> anyhow::Result<Self> {
        let path = userdata_dir.join(CONFIG_FILENAME);
        let entries = if path.exists() {
            let raw = std::fs::read_to_string(&path)?;
            toml::from_str::<ConfigFile>(&raw).map_or_else(
                |e| {
                    tracing::warn!(
                        error = %e,
                        path = %path.display(),
                        "model-loader config corrupt — starting fresh"
                    );
                    BTreeMap::new()
                },
                |c| c.entries,
            )
        } else {
            BTreeMap::new()
        };
        Ok(Self {
            path,
            entries: Mutex::new(entries),
        })
    }

    /// Atomically persist the working map: write a temp sibling then rename over
    /// the target (rename is atomic on the same filesystem).
    fn flush(&self, entries: &BTreeMap<String, String>) -> anyhow::Result<()> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let body = toml::to_string_pretty(&ConfigFile {
            entries: entries.clone(),
        })?;
        let tmp = self.path.with_extension("toml.tmp");
        std::fs::write(&tmp, body)?;
        std::fs::rename(&tmp, &self.path)?;
        Ok(())
    }
}

impl ConfigBackend for FileConfigBackend {
    fn get(&self, key: &str) -> anyhow::Result<Option<String>> {
        let entries = self.entries.lock().map_err(|e| anyhow::anyhow!("{e}"))?;
        Ok(entries.get(key).cloned())
    }

    fn set(&self, key: &str, value: &str) -> anyhow::Result<()> {
        let mut entries = self.entries.lock().map_err(|e| anyhow::anyhow!("{e}"))?;
        entries.insert(key.to_string(), value.to_string());
        self.flush(&entries)
    }

    fn delete(&self, key: &str) -> anyhow::Result<()> {
        let mut entries = self.entries.lock().map_err(|e| anyhow::anyhow!("{e}"))?;
        entries.remove(key);
        self.flush(&entries)
    }

    fn list_by_prefix(&self, prefix: &str) -> anyhow::Result<Vec<(String, String)>> {
        let entries = self.entries.lock().map_err(|e| anyhow::anyhow!("{e}"))?;
        Ok(entries
            .iter()
            .filter(|(k, _)| k.starts_with(prefix))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dotted_keys_round_trip_through_toml() {
        let dir = tempfile::tempdir().unwrap();
        let backend = FileConfigBackend::load(dir.path()).unwrap();
        backend
            .set("slot.chat.brain.model", "qwen3-14b.gguf")
            .unwrap();
        backend.set("setup_complete", "true").unwrap();

        // Reload from disk — proves the atomic write + dotted-key quoting persist.
        let reloaded = FileConfigBackend::load(dir.path()).unwrap();
        assert_eq!(
            reloaded.get("slot.chat.brain.model").unwrap().as_deref(),
            Some("qwen3-14b.gguf")
        );
        assert_eq!(reloaded.get("setup_complete").unwrap().as_deref(), Some("true"));

        let slots = reloaded.list_by_prefix("slot.").unwrap();
        assert_eq!(slots.len(), 1);
        assert_eq!(slots[0].0, "slot.chat.brain.model");
    }

    #[test]
    fn delete_removes_key_and_persists() {
        let dir = tempfile::tempdir().unwrap();
        let backend = FileConfigBackend::load(dir.path()).unwrap();
        backend.set("k", "v").unwrap();
        backend.delete("k").unwrap();
        let reloaded = FileConfigBackend::load(dir.path()).unwrap();
        assert!(reloaded.get("k").unwrap().is_none());
    }
}
