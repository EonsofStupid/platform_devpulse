//! Built-in catalog — the set of platform services that ship with
//! the binary and load at boot. Not user-toggleable as slots, but
//! visible in the Slot Config overlay's "System" tab.
//!
//! Source of truth: `kernel/model-loader/config/built_ins.default.toml`.
//! User override: `{userdata_dir}/config/built_ins.toml` (full-replace).
//!
//! Built-ins are conceptually separate from slots:
//!
//! | Aspect             | Slot                               | Built-in                              |
//! | ------------------ | ---------------------------------- | ------------------------------------- |
//! | User toggleable    | Yes                                | No (toggle gated on `BuildMode`)      |
//! | Model swappable    | Always                             | Only when `upgradeable = true`        |
//! | Lane assignment    | User picks                         | Fixed at config time                  |
//! | Persistence class  | User picks                         | Fixed at config time                  |
//! | Appears in `slots` | Yes (`slots.default.toml`)         | No (this file)                        |
//! | UI tab             | Slot Config → Slots                | Slot Config → System                  |
//!
//! # IP boundary
//!
//! Every [`BuiltIn`] carries a `kernel_name` (used for logs, traces,
//! and internal metrics inside `kernel/`) and a `public_label` (what
//! the frontend displays to users). The public label comes from the
//! TOML file and must match the `engine` / `prod` column in
//! `systems/devpulse-engine/ip/kernel_terms.toml`. See `D3` in the
//! sprint spec.

use crate::build_mode::BuildMode;
use crate::hardware::lanes::LaneKind;
use crate::slots::PersistenceClass;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Embedded default built-in catalog, bundled at compile time.
const DEFAULT_TOML: &str = include_str!("../config/built_ins.default.toml");

// ── Types ────────────────────────────────────────────────────────

/// A platform built-in — always-loaded service that does not live in
/// the user-facing slot table.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct BuiltIn {
    /// Stable identifier (e.g. `"rro"`, `"encoder.primary"`). Used as
    /// the key when the Slot Config System tab looks up status rows.
    pub id: String,

    /// Internal kernel-side name — may contain terms forbidden in
    /// public code (RRO, reranker, etc.). Never shown to users.
    pub kernel_name: String,

    /// User-facing label. Must match the public alias defined in
    /// `kernel_terms.toml` — the loader does not enforce this, a
    /// lefthook preflight check will.
    pub public_label: String,

    /// One-line description shown under the label in the System tab.
    pub description: String,

    /// Grouping for the System tab sections: `memory`, `encoder`,
    /// `filter`, `wake_word`, etc. Free-form string; the UI bins rows
    /// by category but does not enforce a closed set.
    pub category: String,

    /// Residency contract. Most built-ins are `always_on`; the filter
    /// is `on_demand` because it runs only when a search produces
    /// more candidates than needed.
    #[serde(default)]
    pub persistence_class: PersistenceClass,

    /// Which compute lane the built-in is pinned to.
    pub lane: LaneKind,

    /// Whether the user can swap the underlying model. `false` for
    /// code-backed built-ins like RRO (the storage engine ships with
    /// the binary). `true` for model-backed built-ins where a user
    /// might want to upgrade to a bigger / fine-tuned variant.
    ///
    /// Even when `true`, the swap is gated on the current
    /// [`BuildMode`] — see [`BuiltIn::allows_model_swap`].
    #[serde(default)]
    pub upgradeable: bool,

    /// Whether the default model is bundled with the binary.
    ///
    /// `true` → the binary ships with the model file and it is ready
    /// at first boot. `false` → the model is downloaded on first boot
    /// or on user demand.
    #[serde(default)]
    pub bundled: bool,

    /// HuggingFace repo id for the default model. Empty when the
    /// built-in is code-only (no model file).
    #[serde(default)]
    pub default_model_repo: String,

    /// Default model filename inside the repo. Empty when the built-in
    /// is code-only.
    #[serde(default)]
    pub default_model_filename: String,
}

impl BuiltIn {
    /// Whether the current build mode allows the user to swap the
    /// underlying model file for this built-in.
    ///
    /// Combines the built-in's `upgradeable` flag with the runtime
    /// `BuildMode`:
    ///
    /// | upgradeable | BuildMode        | allowed? |
    /// | ----------- | ---------------- | -------- |
    /// | `false`     | any              | no       |
    /// | `true`      | `Dev`            | yes      |
    /// | `true`      | `Production`     | yes (sanctioned upgrade flow) |
    /// | `true`      | `Customer`       | no       |
    #[must_use]
    pub fn allows_model_swap(&self) -> bool {
        if !self.upgradeable {
            return false;
        }
        match BuildMode::current() {
            BuildMode::Dev | BuildMode::Production => true,
            BuildMode::Customer => false,
        }
    }
}

// ── TOML file shape ──────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
struct BuiltInsFile {
    #[serde(default)]
    built_ins: Vec<BuiltIn>,
}

// ── Loader errors ────────────────────────────────────────────────

/// Errors returned by [`load_default_built_ins`].
#[derive(Debug, thiserror::Error)]
pub enum BuiltInsError {
    /// Embedded default failed to parse — build-time bug.
    #[error("embedded built_ins.default.toml is invalid: {0}")]
    EmbeddedParse(#[source] toml::de::Error),
    /// Two built-ins share the same id.
    #[error("built_ins.default.toml contains duplicate id: {0}")]
    DuplicateId(String),
}

// ── Public API ───────────────────────────────────────────────────

/// Load the built-in catalog, honouring any user override at
/// `{userdata_dir}/config/built_ins.toml`.
///
/// Behaviour matches [`crate::slots::load_default_slots`]:
///
/// - If the override file exists and parses, use it.
/// - If the override file exists but fails to parse, log a warning
///   and fall back to the embedded default.
/// - If no override file exists, parse the embedded default.
///
/// # Errors
///
/// Returns [`BuiltInsError::EmbeddedParse`] when the embedded TOML is
/// malformed (build-time bug) or [`BuiltInsError::DuplicateId`] when
/// two entries share an id.
pub fn load_default_built_ins(userdata_dir: &Path) -> Result<Vec<BuiltIn>, BuiltInsError> {
    let override_path = userdata_dir.join("config").join("built_ins.toml");

    if override_path.exists() {
        match std::fs::read_to_string(&override_path) {
            Ok(bytes) => match toml::from_str::<BuiltInsFile>(&bytes) {
                Ok(parsed) => {
                    tracing::info!(
                        path = %override_path.display(),
                        count = parsed.built_ins.len(),
                        "Loaded user built-ins override"
                    );
                    return finalize(parsed.built_ins);
                }
                Err(e) => {
                    tracing::warn!(
                        path = %override_path.display(),
                        error = %e,
                        "Failed to parse user built-ins override — falling back to default"
                    );
                }
            },
            Err(e) => {
                tracing::warn!(
                    path = %override_path.display(),
                    error = %e,
                    "Failed to read user built-ins override — falling back to default"
                );
            }
        }
    }

    let parsed: BuiltInsFile =
        toml::from_str(DEFAULT_TOML).map_err(BuiltInsError::EmbeddedParse)?;
    tracing::debug!(
        count = parsed.built_ins.len(),
        "Loaded embedded default built-in catalog"
    );
    finalize(parsed.built_ins)
}

fn finalize(entries: Vec<BuiltIn>) -> Result<Vec<BuiltIn>, BuiltInsError> {
    let mut seen = std::collections::HashSet::new();
    for entry in &entries {
        if !seen.insert(entry.id.clone()) {
            return Err(BuiltInsError::DuplicateId(entry.id.clone()));
        }
    }
    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn embedded_default_parses() {
        let built_ins = load_default_built_ins(Path::new("/nonexistent"))
            .expect("embedded built_ins.default.toml must load");
        assert!(
            !built_ins.is_empty(),
            "built-in catalog must not be empty"
        );
    }

    #[test]
    fn required_built_ins_present() {
        let built_ins = load_default_built_ins(Path::new("/nonexistent")).unwrap();
        let ids: std::collections::HashSet<&str> =
            built_ins.iter().map(|b| b.id.as_str()).collect();
        for required in ["rro", "encoder.primary", "filter.primary", "wake.builtin"] {
            assert!(
                ids.contains(required),
                "required built-in '{required}' missing from default catalog"
            );
        }
    }

    #[test]
    fn rro_is_not_upgradeable_and_always_on() {
        let built_ins = load_default_built_ins(Path::new("/nonexistent")).unwrap();
        let rro = built_ins.iter().find(|b| b.id == "rro").unwrap();
        assert!(!rro.upgradeable);
        assert_eq!(rro.persistence_class, PersistenceClass::AlwaysOn);
    }

    #[test]
    fn encoder_is_upgradeable() {
        let built_ins = load_default_built_ins(Path::new("/nonexistent")).unwrap();
        let encoder = built_ins
            .iter()
            .find(|b| b.id == "encoder.primary")
            .unwrap();
        assert!(encoder.upgradeable);
    }

    #[test]
    fn filter_is_not_called_reranker_publicly() {
        let built_ins = load_default_built_ins(Path::new("/nonexistent")).unwrap();
        let filter = built_ins
            .iter()
            .find(|b| b.id == "filter.primary")
            .unwrap();
        // IP boundary: the public label must NOT contain "rerank".
        // Kernel name is allowed to since this file lives in kernel/.
        assert!(
            !filter.public_label.to_lowercase().contains("rerank"),
            "filter.primary public_label leaks the 'reranker' term: {}",
            filter.public_label
        );
    }

    #[test]
    fn rro_public_label_hides_kernel_name() {
        let built_ins = load_default_built_ins(Path::new("/nonexistent")).unwrap();
        let rro = built_ins.iter().find(|b| b.id == "rro").unwrap();
        // Public label must not leak "RRO" — users see "Prepared Context".
        assert!(
            !rro.public_label.to_uppercase().contains("RRO"),
            "rro public_label leaks kernel term: {}",
            rro.public_label
        );
    }

    #[test]
    fn non_upgradeable_never_allows_swap() {
        let built_ins = load_default_built_ins(Path::new("/nonexistent")).unwrap();
        let rro = built_ins.iter().find(|b| b.id == "rro").unwrap();
        assert!(!rro.allows_model_swap());
    }

    #[test]
    fn upgradeable_allows_swap_in_dev_mode() {
        // Under the default feature set, `mode-dev` is active so the
        // encoder's model file should be swappable.
        let built_ins = load_default_built_ins(Path::new("/nonexistent")).unwrap();
        let encoder = built_ins
            .iter()
            .find(|b| b.id == "encoder.primary")
            .unwrap();
        // This assertion relies on the default features — only valid
        // when the test binary is built with `mode-dev`. Every CI job
        // runs the default features so this is always the tested path.
        assert_eq!(BuildMode::current(), BuildMode::Dev);
        assert!(encoder.allows_model_swap());
    }
}
