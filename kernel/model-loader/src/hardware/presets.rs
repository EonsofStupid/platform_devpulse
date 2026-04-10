//! Preset loader — reads `presets.default.toml` and produces tier-keyed
//! `AutoConfig` plans.
//!
//! This module is the TOML-driven replacement for the hardcoded
//! `preset_for_tier()` function that used to live in [`auto_config`].
//! The content moved verbatim into
//! `kernel/model-loader/config/presets.default.toml` so presets become
//! editable without recompiling.
//!
//! # Merge semantics
//!
//! Every preset inherits the `[[common.slots]]` entries from the TOML
//! file unless the preset itself already declares an entry with the
//! same `slot_id`. Tier-specific entries always win. This matches the
//! old Rust code where every preset called `recs.push(rec(...))` for
//! its tier-specific slots first, then appended the common five.
//!
//! # User override
//!
//! `{userdata_dir}/config/presets.toml`, when present and parseable,
//! fully replaces the embedded defaults — same pattern as every other
//! kernel-owned config file (`slots.default.toml`, `voices.default.toml`,
//! `wizard_copy.default.toml`).

use super::auto_config::{AutoConfig, BrainSwapPolicy, HardwareTier, SlotRecommendation};
use crate::slots::DevicePreference;
use serde::Deserialize;
use std::path::Path;

/// Embedded default preset catalog, bundled at compile time.
///
/// Path is relative to this source file. `../../config/` walks from
/// `src/hardware/presets.rs` up to `kernel/model-loader/config/`.
const DEFAULT_TOML: &str = include_str!("../../config/presets.default.toml");

// ── TOML file shape ──────────────────────────────────────────────

/// Root of `presets.default.toml`.
#[derive(Debug, Clone, Deserialize)]
struct PresetsFile {
    /// One entry per [`HardwareTier`] variant.
    #[serde(default)]
    presets: Vec<PresetEntry>,
    /// Shared slot recommendations appended to every tier unless the
    /// tier already declares an entry with the same `slot_id`.
    #[serde(default)]
    common: CommonSection,
}

/// Container for `[common.slots]`. Split into its own struct so TOML
/// parses the `[[common.slots]]` array idiomatically.
#[derive(Debug, Clone, Default, Deserialize)]
struct CommonSection {
    #[serde(default)]
    slots: Vec<SlotRecEntry>,
}

/// A single `[[presets]]` block.
#[derive(Debug, Clone, Deserialize)]
struct PresetEntry {
    /// Which [`HardwareTier`] variant this preset is keyed to.
    tier: HardwareTier,
    /// Display name shown in the wizard preset picker.
    preset_name: String,
    /// Brain swap policy. Maps directly to [`BrainSwapPolicy`] via
    /// serde — TOML accepts `"Static"`, `"ApiEnhanced"`, or a nested
    /// `ActiveIdle` table with its three fields.
    brain_policy: BrainSwapPolicy,
    /// Tier-specific slot recommendations. Common slots append after.
    #[serde(default)]
    slots: Vec<SlotRecEntry>,
}

/// A single `[[presets.slots]]` or `[[common.slots]]` recommendation.
///
/// Fields mirror [`SlotRecommendation`] one-for-one. `already_downloaded`
/// is not a TOML field — the loader computes it from the runtime
/// download set.
#[derive(Debug, Clone, Deserialize)]
struct SlotRecEntry {
    slot_id: String,
    model_repo_id: String,
    model_filename: String,
    model_size_mb: u64,
    vram_estimate_mb: u64,
    device: DevicePreferenceConfig,
}

/// Serialisation shadow for [`DevicePreference`] — TOML writes them
/// as bare PascalCase strings (`"Gpu"`, `"Cpu"`, etc).
#[derive(Debug, Clone, Copy, Deserialize)]
enum DevicePreferenceConfig {
    Gpu,
    Cpu,
    GpuWithCpuFallback,
    Any,
}

impl DevicePreferenceConfig {
    const fn into_kernel(self) -> DevicePreference {
        match self {
            Self::Gpu => DevicePreference::Gpu,
            Self::Cpu => DevicePreference::Cpu,
            Self::GpuWithCpuFallback => DevicePreference::GpuWithCpuFallback,
            Self::Any => DevicePreference::Any,
        }
    }
}

// ── Loader errors ────────────────────────────────────────────────

/// Errors returned by [`load_default_presets`].
#[derive(Debug, thiserror::Error)]
pub enum PresetsError {
    /// The embedded `presets.default.toml` failed to parse. Build-time bug.
    #[error("embedded presets.default.toml is invalid: {0}")]
    EmbeddedParse(#[source] toml::de::Error),
    /// The TOML does not contain a preset for a tier that was requested.
    #[error("no preset defined for tier {tier:?}")]
    UnknownTier {
        /// The hardware tier that was requested but not found.
        tier: HardwareTier,
    },
}

// ── Public API ───────────────────────────────────────────────────

/// Load every preset from the embedded default file (or the user
/// override when present), keyed by [`HardwareTier`].
///
/// Returns a `Vec<(HardwareTier, PresetBlueprint)>` rather than a map
/// so consumers get stable ordering that matches the TOML file.
/// [`config_for_tier`] looks up by tier.
///
/// # Errors
///
/// Returns [`PresetsError::EmbeddedParse`] when the embedded TOML is
/// malformed (build-time bug).
pub fn load_default_presets(userdata_dir: &Path) -> Result<Vec<PresetBlueprint>, PresetsError> {
    let override_path = userdata_dir.join("config").join("presets.toml");

    if override_path.exists() {
        match std::fs::read_to_string(&override_path) {
            Ok(bytes) => match toml::from_str::<PresetsFile>(&bytes) {
                Ok(parsed) => {
                    tracing::info!(
                        path = %override_path.display(),
                        count = parsed.presets.len(),
                        "Loaded user presets override"
                    );
                    return Ok(finalize(parsed));
                }
                Err(e) => {
                    tracing::warn!(
                        path = %override_path.display(),
                        error = %e,
                        "Failed to parse user presets override — falling back to default"
                    );
                }
            },
            Err(e) => {
                tracing::warn!(
                    path = %override_path.display(),
                    error = %e,
                    "Failed to read user presets override — falling back to default"
                );
            }
        }
    }

    let parsed: PresetsFile =
        toml::from_str(DEFAULT_TOML).map_err(PresetsError::EmbeddedParse)?;
    tracing::debug!(
        count = parsed.presets.len(),
        "Loaded embedded default preset catalog"
    );
    Ok(finalize(parsed))
}

/// Build an [`AutoConfig`] for a specific hardware tier. `downloaded`
/// is consulted to mark each recommendation's `already_downloaded`
/// flag.
///
/// Drop-in replacement for the old `auto_config::preset_for_tier`
/// function — callers hand in a tier and a download set, get back a
/// ready-to-serve `AutoConfig`.
///
/// # Errors
///
/// Returns [`PresetsError::UnknownTier`] when the TOML is missing a
/// preset for the requested tier (which would indicate either a
/// corrupt override file or a new tier variant that hasn't been added
/// to the catalog yet).
pub fn config_for_tier(
    tier: HardwareTier,
    downloaded: &std::collections::HashSet<String>,
    userdata_dir: &Path,
) -> Result<AutoConfig, PresetsError> {
    let blueprints = load_default_presets(userdata_dir)?;
    let blueprint = blueprints
        .into_iter()
        .find(|bp| bp.tier == tier)
        .ok_or(PresetsError::UnknownTier { tier })?;
    Ok(blueprint.into_auto_config(downloaded))
}

// ── Blueprint (resolved, download-status-agnostic) ───────────────

/// A preset with all slot recommendations fully resolved against the
/// TOML catalog, but with `already_downloaded` still unset.
///
/// Having this intermediate form lets the loader parse the TOML once
/// and then produce multiple [`AutoConfig`] values (one per call to
/// [`PresetBlueprint::into_auto_config`]) against different download
/// sets without re-reading the file.
#[derive(Debug, Clone)]
pub struct PresetBlueprint {
    /// Which tier this blueprint applies to.
    pub tier: HardwareTier,
    /// Display name.
    pub preset_name: String,
    /// Brain swap policy.
    pub brain_policy: BrainSwapPolicy,
    /// Merged slot recommendations (tier-specific first, then common).
    pub recommendations: Vec<ResolvedRec>,
}

/// A single blueprint recommendation, mirrored from [`SlotRecEntry`]
/// but exposed publicly so callers can inspect presets without going
/// through [`AutoConfig`].
#[derive(Debug, Clone)]
pub struct ResolvedRec {
    /// Target slot id.
    pub slot_id: String,
    /// HuggingFace repo id.
    pub model_repo_id: String,
    /// Filename within the repo.
    pub model_filename: String,
    /// Download size in MB.
    pub model_size_mb: u64,
    /// Estimated VRAM footprint in MB once loaded.
    pub vram_estimate_mb: u64,
    /// Device preference for this slot in this preset.
    pub device: DevicePreference,
}

impl PresetBlueprint {
    /// Convert the blueprint into a concrete [`AutoConfig`] against the
    /// given set of already-downloaded filenames.
    #[must_use]
    pub fn into_auto_config(self, downloaded: &std::collections::HashSet<String>) -> AutoConfig {
        let recommendations: Vec<SlotRecommendation> = self
            .recommendations
            .into_iter()
            .map(|r| SlotRecommendation {
                slot_id: r.slot_id,
                model_repo_id: r.model_repo_id,
                already_downloaded: downloaded.contains(&r.model_filename),
                model_filename: r.model_filename,
                model_size_mb: r.model_size_mb,
                vram_estimate_mb: r.vram_estimate_mb,
                device: r.device,
            })
            .collect();

        let total_vram: u64 = recommendations.iter().map(|r| r.vram_estimate_mb).sum();
        let total_download: u64 = recommendations
            .iter()
            .filter(|r| !r.already_downloaded)
            .map(|r| r.model_size_mb)
            .sum();

        AutoConfig {
            tier: self.tier,
            preset_name: self.preset_name,
            brain_policy: self.brain_policy,
            recommendations,
            total_vram_needed_mb: total_vram,
            total_download_size_mb: total_download,
        }
    }
}

// ── Internal helpers ─────────────────────────────────────────────

/// Merge tier-specific slots with the `[common.slots]` list and turn
/// the TOML entries into [`PresetBlueprint`]s.
///
/// Merge rule: tier-specific slots win over common slots when both
/// reference the same `slot_id`. The common slots are appended after
/// the tier-specific ones so the order in `recommendations` matches
/// the file layout.
fn finalize(parsed: PresetsFile) -> Vec<PresetBlueprint> {
    let common = parsed.common.slots;

    parsed
        .presets
        .into_iter()
        .map(|entry| {
            let mut ids = std::collections::HashSet::with_capacity(entry.slots.len());
            let mut merged: Vec<ResolvedRec> = Vec::with_capacity(entry.slots.len() + common.len());

            for s in entry.slots {
                ids.insert(s.slot_id.clone());
                merged.push(resolve(s));
            }
            for s in &common {
                if !ids.contains(&s.slot_id) {
                    merged.push(resolve(s.clone()));
                }
            }

            PresetBlueprint {
                tier: entry.tier,
                preset_name: entry.preset_name,
                brain_policy: entry.brain_policy,
                recommendations: merged,
            }
        })
        .collect()
}

fn resolve(entry: SlotRecEntry) -> ResolvedRec {
    ResolvedRec {
        slot_id: entry.slot_id,
        model_repo_id: entry.model_repo_id,
        model_filename: entry.model_filename,
        model_size_mb: entry.model_size_mb,
        vram_estimate_mb: entry.vram_estimate_mb,
        device: entry.device.into_kernel(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The embedded default must parse cleanly and produce at least
    /// one blueprint per hardware tier.
    #[test]
    fn embedded_default_parses() {
        let blueprints = load_default_presets(Path::new("/nonexistent"))
            .expect("embedded presets.default.toml must load");
        assert!(
            blueprints.len() >= 6,
            "expected at least 6 presets (one per tier), got {}",
            blueprints.len()
        );
    }

    /// Every [`HardwareTier`] variant must have a preset.
    #[test]
    fn every_tier_has_a_preset() {
        let blueprints = load_default_presets(Path::new("/nonexistent")).unwrap();
        let tiers: std::collections::HashSet<HardwareTier> =
            blueprints.iter().map(|bp| bp.tier).collect();
        for required in [
            HardwareTier::High,
            HardwareTier::JessePrimary,
            HardwareTier::Mid,
            HardwareTier::Floor,
            HardwareTier::Minimal,
            HardwareTier::CpuOnly,
        ] {
            assert!(
                tiers.contains(&required),
                "preset for tier {required:?} is missing from presets.default.toml"
            );
        }
    }

    /// Every preset must include the five common slots (rag.embedder,
    /// rag.reranker, vision.embedder, voice.stt, voice.tts).
    #[test]
    fn every_preset_includes_common_slots() {
        let blueprints = load_default_presets(Path::new("/nonexistent")).unwrap();
        let required_common = [
            "rag.embedder",
            "rag.reranker",
            "vision.embedder",
            "voice.stt",
            "voice.tts",
        ];
        for bp in &blueprints {
            for common_id in required_common {
                assert!(
                    bp.recommendations.iter().any(|r| r.slot_id == common_id),
                    "preset {:?} is missing common slot '{common_id}'",
                    bp.tier
                );
            }
        }
    }

    /// Floor preset has exactly 7 recommendations: 2 tier-specific +
    /// 5 common. Matches the contract the old `preset_for_tier` test
    /// was re-validated against earlier.
    #[test]
    fn floor_preset_has_seven_recommendations() {
        let downloaded = std::collections::HashSet::new();
        let cfg = config_for_tier(HardwareTier::Floor, &downloaded, Path::new("/nonexistent"))
            .unwrap();
        assert_eq!(cfg.recommendations.len(), 7);
        assert_eq!(cfg.preset_name, "Floor (8GB)");
    }

    /// Mid tier uses `ActiveIdle` brain policy.
    #[test]
    fn mid_tier_is_active_idle() {
        let downloaded = std::collections::HashSet::new();
        let cfg = config_for_tier(HardwareTier::Mid, &downloaded, Path::new("/nonexistent"))
            .unwrap();
        assert!(matches!(cfg.brain_policy, BrainSwapPolicy::ActiveIdle { .. }));
    }

    /// `already_downloaded` flag reduces `total_download_size_mb`.
    #[test]
    fn already_downloaded_reduces_total() {
        let mut downloaded = std::collections::HashSet::new();
        downloaded.insert("Qwen3.5-9B-Q4_K_M.gguf".to_string());

        let cfg = config_for_tier(HardwareTier::Mid, &downloaded, Path::new("/nonexistent"))
            .unwrap();
        let brain = cfg
            .recommendations
            .iter()
            .find(|r| r.slot_id == "chat.brain")
            .unwrap();
        assert!(brain.already_downloaded);
    }
}
