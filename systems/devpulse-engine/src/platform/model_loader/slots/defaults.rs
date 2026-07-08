//! Default slot registry loader — SSOT for the baseline slots the
//! platform ships with.
//!
//! The authoritative slot list lives in
//! `kernel/model-loader/config/slots.default.toml`. This module embeds
//! that file at compile time via `include_str!` and exposes a loader
//! that honours an optional user override at
//! `{userdata_dir}/config/slots.toml` (same pattern as `voices.rs` and
//! `wizard::copy`). When an override is present and parses, it fully
//! replaces the embedded default — no merging.
//!
//! # Extension pattern
//!
//! To add a new baseline slot:
//!
//! 1. Append a `[[slots]]` entry to `slots.default.toml` with every
//!    required field.
//! 2. Add the slot id to [`BASELINE_SLOT_IDS`] below so the baseline
//!    sanity test picks it up.
//! 3. If a new [`ModelCapability`] variant is needed, add it in
//!    `slots/types.rs`.
//!
//! No code generation, no registry registration step — the loader
//! deserialises everything declaratively. Every consumer of the
//! registry picks up the new slot automatically.

use super::{PersistenceClass, Slot};
use crate::platform::hardware::lanes::LaneKind;
use serde::Deserialize;
use std::path::Path;

/// Embedded default slot configuration, bundled at compile time.
///
/// Path is relative to this source file. `../../config/` walks from
/// `src/slots/defaults.rs` up to `kernel/model-loader/config/`.
const DEFAULT_TOML: &str = include_str!("../../../../config/slots.default.toml");

/// Slot identifiers that every build MUST include. The baseline test
/// asserts every id here is present after `load_default_slots` returns,
/// and the wizard / slot-config overlays assume these exist.
///
/// The list is split into "user-facing" and "built-in" groups. The
/// `builtin` flag on each slot controls how the devtool renders them
/// (System tab vs Slots tab) — there is no second TOML file. Same
/// data, two views.
///
/// When the list grows, update this constant AND `slots.default.toml`
/// in the same commit.
pub const BASELINE_SLOT_IDS: &[&str] = &[
    // User-facing slots — appear in the "Slots" tab of the devtool
    "chat.brain",
    "minion.shared",
    "minion.escalation",
    "vision.embedder",
    "voice.tts",
    "voice.stt",
    "voice.brain",
    "voice.wake",
    // Platform built-ins — appear in the "System" tab of the devtool.
    // Vector store (RRO) is NOT in this list — it's a storage adapter,
    // not a model binding point, and lives in connectome/persistence/rro.rs.
    // The devtool queries RRO status directly through the kernel rather
    // than through the slot registry.
    "rag.embedder",
    "rag.reranker",
    "chat.suggest",
];

/// TOML file shape — a single `slots` array of entries.
///
/// `SlotEntry` is a shallow mirror of the kernel [`Slot`] struct that
/// allows TOML-friendly defaults. The conversion into a full [`Slot`]
/// happens in [`SlotEntry::into_slot`] below.
#[derive(Debug, Clone, Deserialize)]
struct SlotsFile {
    #[serde(default)]
    slots: Vec<SlotEntry>,
}

/// A single `[[slots]]` TOML entry.
///
/// This is intentionally separate from the kernel [`Slot`] struct:
/// - `assigned_model` is always `None` at boot and does not appear in
///   the file at all.
/// - `runtime` / `default_model` / `fallback` / `overrides` are all
///   optional; missing keys deserialise to `None`.
/// - `source_tier` defaults to `UserManaged` when omitted.
/// - `persistence_class` defaults to `OnDemand`.
/// - `lane` defaults to `Vram`.
#[derive(Debug, Clone, Deserialize)]
struct SlotEntry {
    id: String,
    label: String,
    capability: crate::platform::model_loader::slots::ModelCapability,
    #[serde(default = "default_device_any")]
    preferred_device: crate::platform::model_loader::slots::DevicePreference,
    #[serde(default = "default_loading_on_demand")]
    loading: crate::platform::model_loader::slots::LoadingStrategy,
    #[serde(default)]
    persistence_class: PersistenceClass,
    #[serde(default = "default_lane_vram")]
    lane: LaneKind,
    #[serde(default)]
    fallback: Option<String>,
    #[serde(default)]
    runtime: Option<crate::platform::model_loader::models::BackendType>,
    #[serde(default)]
    default_model: Option<String>,
    #[serde(default)]
    requires: Vec<String>,
    #[serde(default)]
    overrides: Option<String>,
    #[serde(default)]
    source_tier: crate::platform::model_loader::slots::ModelSourceTier,
    #[serde(default)]
    extensions: std::collections::HashMap<String, String>,
    /// Optional KV-cache and context controls. Defaults to "use all
    /// runtime defaults" so existing slot TOML without a `kv_cache`
    /// block keeps loading unchanged.
    #[serde(default)]
    kv_cache: crate::platform::model_loader::slots::KvCacheConfig,
    /// Built-in flag — see [`Slot::builtin`]. Defaults to `false` so
    /// regular user-facing slots don't need to set it.
    #[serde(default)]
    builtin: bool,
}

fn default_device_any() -> crate::platform::model_loader::slots::DevicePreference {
    crate::platform::model_loader::slots::DevicePreference::Any
}

fn default_loading_on_demand() -> crate::platform::model_loader::slots::LoadingStrategy {
    // Owner directive 2026-04-20: no auto-load. A TOML slot that omits
    // `loading = "..."` defaults to OnDemand — nothing allocates until the
    // user explicitly hits Apply in the UI.
    crate::platform::model_loader::slots::LoadingStrategy::OnDemand
}

fn default_lane_vram() -> LaneKind {
    LaneKind::Vram
}

impl SlotEntry {
    fn into_slot(self) -> Slot {
        Slot {
            id: self.id,
            label: self.label,
            capability: self.capability,
            preferred_device: self.preferred_device,
            loading: self.loading,
            persistence_class: self.persistence_class,
            lane: self.lane,
            assigned_model: None,
            fallback: self.fallback,
            runtime: self.runtime,
            default_model: self.default_model,
            requires: self.requires,
            overrides: self.overrides,
            source_tier: self.source_tier,
            extensions: self.extensions,
            kv_cache: self.kv_cache,
            builtin: self.builtin,
        }
    }
}

/// Errors returned by [`load_default_slots`].
///
/// The embedded default must always parse — a failure there is a
/// build-time bug and the error bubbles up as an `anyhow::Error`. User
/// overrides that fail to parse are not an error: they trigger a
/// warning log and the function falls back to the embedded default.
#[derive(Debug, thiserror::Error)]
pub enum SlotDefaultsError {
    /// The embedded `slots.default.toml` failed to parse. This is
    /// always a build-time bug.
    #[error("embedded slots.default.toml is invalid: {0}")]
    EmbeddedParse(#[source] toml::de::Error),
    /// The baseline slot id assertion failed — the TOML is missing one
    /// of the ids listed in [`BASELINE_SLOT_IDS`].
    #[error("slots.default.toml is missing baseline slot id: {0}")]
    MissingBaseline(String),
    /// Two slot entries share the same id.
    #[error("slots.default.toml contains duplicate slot id: {0}")]
    DuplicateId(String),
}

/// Load the baseline slots, honouring any user override at
/// `{userdata_dir}/config/slots.toml`.
///
/// The steps are:
///
/// 1. If the override file exists, read and parse it. On success,
///    validate and return the parsed list. On parse failure, log a
///    warning and fall through to the embedded default.
/// 2. Parse the embedded default, validate, and return the list.
///
/// Validation enforces both the [`BASELINE_SLOT_IDS`] presence test
/// and the unique-id invariant.
///
/// # Errors
///
/// Returns [`SlotDefaultsError::EmbeddedParse`] if the embedded file
/// is malformed (build bug). Returns [`SlotDefaultsError::MissingBaseline`]
/// if any baseline id is absent. Returns [`SlotDefaultsError::DuplicateId`]
/// if two entries share an id.
pub fn load_default_slots(userdata_dir: &Path) -> Result<Vec<Slot>, SlotDefaultsError> {
    let override_path = userdata_dir.join("config").join("slots.toml");

    if override_path.exists() {
        match std::fs::read_to_string(&override_path) {
            Ok(bytes) => match toml::from_str::<SlotsFile>(&bytes) {
                Ok(parsed) => {
                    tracing::info!(
                        path = %override_path.display(),
                        count = parsed.slots.len(),
                        "Loaded user slots override"
                    );
                    return finalize(parsed.slots);
                }
                Err(e) => {
                    tracing::warn!(
                        path = %override_path.display(),
                        error = %e,
                        "Failed to parse user slots override — falling back to default"
                    );
                }
            },
            Err(e) => {
                tracing::warn!(
                    path = %override_path.display(),
                    error = %e,
                    "Failed to read user slots override — falling back to default"
                );
            }
        }
    }

    let parsed: SlotsFile =
        toml::from_str(DEFAULT_TOML).map_err(SlotDefaultsError::EmbeddedParse)?;
    tracing::debug!(
        count = parsed.slots.len(),
        "Loaded embedded default slot registry"
    );
    finalize(parsed.slots)
}

/// Run validation and convert [`SlotEntry`]s into [`Slot`]s.
///
/// Extracted so both the override path and the embedded path share
/// the same validation rules.
fn finalize(entries: Vec<SlotEntry>) -> Result<Vec<Slot>, SlotDefaultsError> {
    let mut seen = std::collections::HashSet::new();
    let mut slots = Vec::with_capacity(entries.len());

    for entry in entries {
        if !seen.insert(entry.id.clone()) {
            return Err(SlotDefaultsError::DuplicateId(entry.id));
        }
        slots.push(entry.into_slot());
    }

    for baseline in BASELINE_SLOT_IDS {
        if !seen.contains(*baseline) {
            return Err(SlotDefaultsError::MissingBaseline((*baseline).to_string()));
        }
    }

    Ok(slots)
}

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::expect_used)] // tests panic on default-slots parse / lookup failure by design
mod tests {
    use super::*;

    /// The embedded default must always parse and satisfy every
    /// invariant. A failure here is a build-time bug in the TOML file.
    #[test]
    fn embedded_default_parses_and_validates() {
        let slots = load_default_slots(Path::new("/nonexistent/path"))
            .expect("embedded default must load cleanly");
        assert!(
            slots.len() >= BASELINE_SLOT_IDS.len(),
            "embedded default must contain at least {} slots, found {}",
            BASELINE_SLOT_IDS.len(),
            slots.len()
        );
    }

    /// Every baseline id must be present in the loaded list.
    #[test]
    fn every_baseline_id_is_present() {
        let slots = load_default_slots(Path::new("/nonexistent/path")).unwrap();
        let ids: std::collections::HashSet<&str> = slots.iter().map(|s| s.id.as_str()).collect();
        for baseline in BASELINE_SLOT_IDS {
            assert!(
                ids.contains(*baseline),
                "baseline slot '{baseline}' missing from default registry"
            );
        }
    }

    /// Slot ids must be unique.
    #[test]
    fn no_duplicate_slot_ids() {
        let slots = load_default_slots(Path::new("/nonexistent/path")).unwrap();
        let mut seen = std::collections::HashSet::new();
        for slot in &slots {
            assert!(
                seen.insert(slot.id.clone()),
                "duplicate slot id in default registry: {}",
                slot.id
            );
        }
    }

    /// Every baseline slot must be a valid dotted identifier (at least
    /// one `.` separator, no empty segments).
    #[test]
    fn every_slot_id_is_well_formed() {
        let slots = load_default_slots(Path::new("/nonexistent/path")).unwrap();
        for slot in &slots {
            assert!(
                Slot::is_valid_id(&slot.id),
                "slot id '{}' is not a valid dotted identifier",
                slot.id
            );
        }
    }

    /// At least 7 baseline slots, per the locked sprint spec.
    #[test]
    fn baseline_count_meets_floor() {
        assert!(
            BASELINE_SLOT_IDS.len() >= 7,
            "baseline must be at least 7 slots, found {}",
            BASELINE_SLOT_IDS.len()
        );
    }

    /// `voice.wake` defaults to `OnDemand` when no user model has been
    /// assigned yet. The previous default of `Hot + AlwaysOn` caused a
    /// boot deadlock: the budgeter reserved capacity for a slot that
    /// had no model to load and no fallback chain, so it held the
    /// reservation forever. The devtool flips this to
    /// `Hot + AlwaysOn` via the `{userdata}/config/slots.toml`
    /// override path once the user picks a wake-word model.
    #[test]
    fn voice_wake_defaults_to_on_demand_until_model_assigned() {
        let slots = load_default_slots(Path::new("/nonexistent/path")).unwrap();
        let wake = slots
            .iter()
            .find(|s| s.id == "voice.wake")
            .expect("voice.wake must be in baseline");
        assert_eq!(wake.persistence_class, PersistenceClass::OnDemand);
        assert!(
            wake.default_model.is_none(),
            "voice.wake must ship without a default model — user picks via devtool"
        );
    }

    /// The main brain must be on VRAM — we never want it relegated
    /// to CPU by accident via a silent default.
    #[test]
    fn chat_brain_lives_on_vram() {
        let slots = load_default_slots(Path::new("/nonexistent/path")).unwrap();
        let brain = slots
            .iter()
            .find(|s| s.id == "chat.brain")
            .expect("chat.brain must be in baseline");
        assert_eq!(brain.lane, LaneKind::Vram);
    }

    /// User-facing slots default to `builtin = false`. The flag is opt-in.
    #[test]
    fn user_facing_slots_are_not_builtin() {
        let slots = load_default_slots(Path::new("/nonexistent/path")).unwrap();
        for slot_id in [
            "chat.brain",
            "minion.shared",
            "minion.escalation",
            "voice.tts",
            "voice.stt",
            "voice.brain",
        ] {
            let slot = slots
                .iter()
                .find(|s| s.id == slot_id)
                .unwrap_or_else(|| panic!("{slot_id} must exist"));
            assert!(!slot.builtin, "{slot_id} must not be flagged builtin");
        }
    }

    /// Platform essentials (embedder, reranker, wake-word) must carry
    /// `builtin = true` so the devtool can group them in the System tab.
    /// The vector store (RRO) is intentionally NOT in this list — it's
    /// a storage adapter, not a slot, and is surfaced through a
    /// separate kernel query.
    #[test]
    fn platform_essentials_are_builtin() {
        let slots = load_default_slots(Path::new("/nonexistent/path")).unwrap();
        for slot_id in ["rag.embedder", "rag.reranker", "voice.wake", "chat.suggest"] {
            let slot = slots
                .iter()
                .find(|s| s.id == slot_id)
                .unwrap_or_else(|| panic!("{slot_id} must exist"));
            assert!(slot.builtin, "{slot_id} must be flagged builtin");
        }
    }

    /// Regression guard: the slot registry must NOT contain a
    /// `vector.store` slot. RRO is a storage adapter, not a model slot.
    /// Adding it back would re-introduce the capability-mismatch bug
    /// from the previous refactor where `vector.store` was tagged
    /// `Embedding` (which it is not — it consumes embeddings, it
    /// doesn't produce them).
    #[test]
    fn vector_store_is_not_a_slot() {
        let slots = load_default_slots(Path::new("/nonexistent/path")).unwrap();
        assert!(
            slots.iter().all(|s| s.id != "vector.store"),
            "vector.store must NOT be in the slot registry — RRO is a \
             storage adapter, not a model binding point"
        );
    }

    /// The two filtered views the devtool renders must produce
    /// non-empty, disjoint sets that together cover the entire baseline.
    #[test]
    fn builtin_filter_produces_disjoint_views() {
        let slots = load_default_slots(Path::new("/nonexistent/path")).unwrap();
        let user_facing: Vec<&str> = slots
            .iter()
            .filter(|s| !s.builtin)
            .map(|s| s.id.as_str())
            .collect();
        let builtins: Vec<&str> = slots
            .iter()
            .filter(|s| s.builtin)
            .map(|s| s.id.as_str())
            .collect();

        assert!(
            !user_facing.is_empty(),
            "user-facing view must not be empty"
        );
        assert!(!builtins.is_empty(), "built-in view must not be empty");
        assert_eq!(
            user_facing.len() + builtins.len(),
            slots.len(),
            "every slot must land in exactly one view"
        );
    }

    /// IP boundary — the public `label` on every slot must never contain
    /// a competitive-tactic term that leaks implementation approach.
    ///
    /// This is narrowed from the full `.claude/rules/ip-protection.md`
    /// list to only the *tactic / dep / library* names that would tell
    /// a reader "`DevPulse` uses X technique for Y". Internal codenames
    /// (DIARY, GUARDIAN, PSYCH, Minion, Connectome, Trinity) are not on this
    /// list — they are labels for industry-standard things ("agent skill",
    /// "specialist agent", "data layer") and naming them internally
    /// doesn't leak anything useful to a competitor.
    ///
    /// Case-insensitive substring match. Add terms only when they name a
    /// real competitive tactic that must not show up verbatim in the UI.
    #[test]
    fn slot_labels_do_not_leak_competitive_tactics() {
        const FORBIDDEN: &[&str] = &[
            // Retrieval tactics — public labels say "memory search", not these.
            "rag",
            "cag",
            "reranker",
            "reranking",
            "rrf",
            "reciprocal rank",
            "bm25",
            "hybrid search",
            // Context pipeline tactics
            "costar",
            "rumination",
            // Vector store dep names
            "qdrant",
            "rro",
        ];
        let slots = load_default_slots(Path::new("/nonexistent/path")).unwrap();
        for slot in &slots {
            let lower = slot.label.to_lowercase();
            for term in FORBIDDEN {
                assert!(
                    !lower.contains(term),
                    "slot '{}' has label '{}' which leaks tactic term '{}'",
                    slot.id,
                    slot.label,
                    term
                );
            }
        }
    }
}
