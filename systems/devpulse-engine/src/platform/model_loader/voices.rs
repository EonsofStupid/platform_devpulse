//! Voice Registry — SSOT loader for the TTS voice catalog.
//!
//! The authoritative voice list lives in
//! `systems/devpulse-engine/config/voices.default.toml`, baked into the
//! binary via `include_str!`. At runtime, the loader first checks for a
//! user override at `{userdata}/config/voices.toml` and — if present —
//! fully replaces the default (no merging).
//!
//! The frontend never hardcodes voice IDs or metadata. It calls
//! `list_voices()` which resolves the registry via this module.

use serde::{Deserialize, Serialize};
use std::path::Path;

/// Embedded default voice registry, bundled at compile time.
const DEFAULT_TOML: &str = include_str!("../../../config/voices.default.toml");

/// A single TTS voice entry — metadata used by the UI picker.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, specta::Type)]
pub struct VoiceEntry {
    /// Stable identifier consumed by the TTS engine (e.g. `af_heart`).
    pub id: String,
    /// Human-friendly display name shown in the UI picker.
    pub label: String,
    /// Gender bucket for filtering: `male`, `female`, or `neutral`.
    pub gender: String,
    /// BCP-47 language tag (e.g. `en-US`, `en-GB`).
    pub language: String,
    /// Which TTS backend owns this voice — `kokoro` or `piper`.
    pub engine: String,
    /// Freeform style descriptor (`warm`, `casual`, `professional`).
    pub style: String,
    /// Preview line used by the "Preview" button in the UI.
    pub sample_text: String,
    /// One-line blurb shown under the label in the voice picker.
    pub description: String,
}

/// Root of the voice registry TOML file — a single `voice` array.
#[derive(Debug, Clone, Deserialize)]
struct VoiceRegistryFile {
    /// The `[[voice]]` entries from the TOML document.
    #[serde(default)]
    voice: Vec<VoiceEntry>,
}

/// Loaded voice registry — list of available voices for UI display.
#[derive(Debug, Clone)]
pub struct VoiceRegistry {
    /// All voices known to the platform, in declaration order.
    voices: Vec<VoiceEntry>,
}

impl VoiceRegistry {
    /// Load the voice registry, honouring the user override at
    /// `{userdata_dir}/config/voices.toml` if present.
    ///
    /// On parse failure of the user override, the error is logged and the
    /// embedded default is used — never silently produce an empty list.
    ///
    /// # Errors
    /// Returns an error only if the embedded default cannot parse, which
    /// would indicate a build-time bug rather than a runtime condition.
    pub fn load(userdata_dir: &Path) -> anyhow::Result<Self> {
        let user_override = userdata_dir.join("config").join("voices.toml");

        if user_override.exists() {
            match std::fs::read_to_string(&user_override) {
                Ok(bytes) => match toml::from_str::<VoiceRegistryFile>(&bytes) {
                    Ok(parsed) => {
                        tracing::info!(
                            path = %user_override.display(),
                            count = parsed.voice.len(),
                            "Loaded user voice registry override"
                        );
                        return Ok(Self {
                            voices: parsed.voice,
                        });
                    }
                    Err(e) => {
                        tracing::warn!(
                            path = %user_override.display(),
                            error = %e,
                            "Failed to parse voice registry override — falling back to default"
                        );
                    }
                },
                Err(e) => {
                    tracing::warn!(
                        path = %user_override.display(),
                        error = %e,
                        "Failed to read voice registry override — falling back to default"
                    );
                }
            }
        }

        let parsed: VoiceRegistryFile = toml::from_str(DEFAULT_TOML)
            .map_err(|e| anyhow::anyhow!("Failed to parse embedded voice registry: {e}"))?;

        tracing::debug!(
            count = parsed.voice.len(),
            "Loaded embedded default voice registry"
        );
        Ok(Self {
            voices: parsed.voice,
        })
    }

    /// All voices, in declaration order.
    #[must_use]
    pub fn all(&self) -> &[VoiceEntry] {
        &self.voices
    }

    /// Find a voice by its identifier.
    #[must_use]
    pub fn find(&self, id: &str) -> Option<&VoiceEntry> {
        self.voices.iter().find(|v| v.id == id)
    }

    /// Filter voices by engine backend (`kokoro` or `piper`).
    #[must_use]
    pub fn for_engine(&self, engine: &str) -> Vec<VoiceEntry> {
        self.voices
            .iter()
            .filter(|v| v.engine == engine)
            .cloned()
            .collect()
    }

    /// Number of voices in the registry.
    #[must_use]
    pub fn len(&self) -> usize {
        self.voices.len()
    }

    /// Whether the registry is empty (should never happen in practice).
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.voices.is_empty()
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)] // tests panic on assertion failure by design
mod tests {
    use super::*;

    #[test]
    fn embedded_default_parses_and_is_non_empty() {
        // Use a bogus path so the override branch is skipped.
        let registry = VoiceRegistry::load(Path::new("/nonexistent/path")).unwrap();
        assert!(
            !registry.is_empty(),
            "Embedded default voice registry must not be empty"
        );
        assert!(
            registry.find("af_heart").is_some(),
            "Default 'af_heart' voice must be present"
        );
    }

    #[test]
    fn every_default_voice_has_required_fields() {
        let registry = VoiceRegistry::load(Path::new("/nonexistent/path")).unwrap();
        for v in registry.all() {
            assert!(!v.id.is_empty(), "Voice id must not be empty");
            assert!(!v.label.is_empty(), "Voice label must not be empty");
            assert!(
                matches!(v.gender.as_str(), "male" | "female" | "neutral"),
                "Voice gender must be one of male/female/neutral, got {}",
                v.gender
            );
            assert!(!v.engine.is_empty(), "Voice engine must not be empty");
        }
    }
}
