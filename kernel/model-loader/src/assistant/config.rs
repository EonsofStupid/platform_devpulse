//! `AssistantConfig` — the single source of truth for Clyffy's identity,
//! wake detection, 24/7 voice brain toggle, TTS voice profile, custom
//! voice clones, keyword actions, window idle behaviour, and per-slot
//! partial-offload hints.
//!
//! Loaded at boot via [`AssistantConfig::load`] which tries
//! `{userdata_dir}/config/assistant.toml` first and falls back to the
//! embedded compile-time default. Mutations from the Voice Lab UI go
//! through [`AssistantConfig::save`] to persist the userdata override.
//!
//! No field here is a secret. The `HuggingFace` token lives in the
//! separate `Secrets` store and never touches this module.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Embedded default configuration. Always available; the boot path
/// uses this when the userdata override is missing or corrupt.
const DEFAULT_TOML: &str =
    include_str!("../../../../kernel/model-loader/config/assistant.default.toml");

/// Relative filename within `{userdata_dir}/config/` for the user
/// override.
const OVERRIDE_FILENAME: &str = "assistant.toml";

/// Identity of the local assistant.
///
/// `name` drives every prompt template via `{assistant_name}` and the
/// default wake phrase root. `tagline` is displayed under the name in
/// the welcome overlay and boot splash.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct IdentityConfig {
    /// User-facing label the assistant answers to. Default "Clyffy".
    pub name: String,
    /// One-line descriptor shown under the name. Default
    /// `"your local AI co-pilot"`.
    pub tagline: String,
}

impl Default for IdentityConfig {
    fn default() -> Self {
        Self {
            name: "Clyffy".to_string(),
            tagline: "your local AI co-pilot".to_string(),
        }
    }
}

/// Wake phrase detector configuration.
///
/// Drives the bundled sherpa-onnx KWS zipformer open-vocab keyword
/// spotter. Changing `phrase` reloads the KWS worker's keywords file
/// at runtime — no model retraining required.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct WakeConfig {
    /// Whether 24/7 wake listening is active. `false` disables the
    /// microphone entirely; the assistant only responds to explicit
    /// push-to-talk or UI clicks.
    pub enabled: bool,
    /// The phrase to listen for. Case-insensitive. Open vocabulary —
    /// any string works without retraining the KWS model.
    pub phrase: String,
    /// Minimum detection confidence in `[0.0, 1.0]`. Raise for fewer
    /// false positives in noisy rooms.
    pub sensitivity: f32,
    /// Cooldown in milliseconds between consecutive wake events.
    pub cooldown_ms: u32,
}

impl Default for WakeConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            phrase: "hey clyffy".to_string(),
            sensitivity: 0.5,
            cooldown_ms: 1500,
        }
    }
}

/// 24/7 full-duplex voice brain (Moshi) configuration.
///
/// When `enabled_24_7 = true`, `voice.brain` stays hot and handles
/// real-time speech-to-speech with native turn-taking. When `false`,
/// the cascaded path (wake -> STT -> chat.fast -> TTS) handles voice
/// interactions instead.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct VoiceBrainConfig {
    /// Whether Moshi stays hot in VRAM for always-on STS.
    pub enabled_24_7: bool,
    /// Whether Moshi may hand complex queries off to `chat.brain`
    /// (Qwen3-30B-A3B) via the kernel escalation path.
    pub escalate_on_complex: bool,
    /// Silence threshold in milliseconds that marks a user turn as
    /// complete. Moshi's own VAD handles the low-latency path; this
    /// value is the fallback for the cascaded path.
    pub turn_end_silence_ms: u32,
    /// Layman-language label shown on the thinking spinner during an
    /// escalation handoff. Never model names.
    pub escalation_label: String,
}

impl Default for VoiceBrainConfig {
    fn default() -> Self {
        Self {
            enabled_24_7: true,
            escalate_on_complex: true,
            turn_end_silence_ms: 600,
            escalation_label: "Clyffy is thinking deeply...".to_string(),
        }
    }
}

/// Text-to-speech voice profile.
///
/// The `profile` field is the canonical identifier. Two forms are
/// accepted:
///
/// - `kokoro:<voice_id>` — a built-in Kokoro voice from the bundled
///   English v0.19 release. Voice IDs follow the `am_*` (American
///   male) / `af_*` (American female) / `bm_*` (British male) /
///   `bf_*` (British female) convention.
/// - `custom:<filename_stem>` — a user-uploaded reference sample
///   cloned via `CosyVoice2-0.5B`. The stem matches the filename in
///   `{userdata_dir}/voice/custom/*.mp3`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct TtsConfig {
    /// Canonical voice profile identifier.
    pub profile: String,
    /// Speech rate multiplier. `1.0` = natural. Kokoro accepts
    /// `0.5..=2.0`; values outside that range clamp at runtime.
    pub rate: f32,
    /// Output gain in decibels. `0` = unchanged.
    pub gain_db: i32,
}

impl Default for TtsConfig {
    fn default() -> Self {
        Self {
            profile: "kokoro:am_eric".to_string(),
            rate: 1.0,
            gain_db: 0,
        }
    }
}

/// Registered user-uploaded voice clone sample.
///
/// The UI populates this list as the user uploads MP3 files through
/// the Voice Lab panel. Each entry is passed to `CosyVoice2-0.5B` via
/// sherpa-onnx for zero-shot cloning on the next TTS call that
/// selects `custom:<name>`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct VoiceCloneEntry {
    /// Short name the user gave this clone (e.g. `"my_male"`).
    pub name: String,
    /// Absolute path to the reference audio file on disk.
    pub reference_path: String,
    /// Optional transcript of the reference audio — improves clone
    /// quality when provided but not required.
    #[serde(default)]
    pub transcript: String,
}

/// A named action the assistant can run when its associated phrase is
/// detected after the wake phrase fires.
///
/// The `action` field names a handler; `payload` is a handler-specific
/// free-form string. Handlers live frontend-side; see
/// `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/
/// assistant-actions.ts` for the dispatch table.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct KeywordActionEntry {
    /// Phrase to listen for (case-insensitive, open vocabulary).
    pub phrase: String,
    /// Action identifier — see [`AssistantAction`] variants.
    pub action: AssistantAction,
    /// Free-form handler payload (app name, shell command, URL,
    /// file path). Interpretation is action-specific.
    #[serde(default)]
    pub payload: String,
    /// Whether this entry is currently active.
    pub enabled: bool,
}

/// Built-in keyword action types the assistant can dispatch.
///
/// Handlers are implemented on the frontend side inside the
/// `assistant-actions.ts` dispatch table. New variants require both a
/// Rust addition here and a matching frontend handler.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "snake_case")]
pub enum AssistantAction {
    /// Start the voice note recorder.
    StartRecording,
    /// Stop the voice note recorder.
    StopRecording,
    /// Capture the full screen to `{userdata}/screenshots/`.
    Screenshot,
    /// Launch an app. Payload = bundle ID (macOS) or executable path.
    OpenApp,
    /// Run a shell command. Payload = command string.
    RunCommand,
    /// Open a URL in the default browser. Payload = URL.
    OpenUrl,
    /// Open a file in its default handler. Payload = absolute path.
    OpenFile,
    /// Emit a custom event the frontend can bind to arbitrary logic.
    /// Payload = event name.
    Custom,
}

/// Window auto-minimise behaviour.
///
/// The Tauri main window registers focus / pointer / keydown listeners
/// and tracks a last-activity timestamp. When the window has been
/// unfocused for `idle_timeout_secs`, it auto-minimises. Setting the
/// value to `0` disables the behaviour entirely.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct WindowConfig {
    /// Seconds of inactivity before auto-minimise. `0` disables.
    pub idle_timeout_secs: u32,
    /// Minimise to the system tray instead of the taskbar.
    pub minimize_to_tray: bool,
}

impl Default for WindowConfig {
    fn default() -> Self {
        Self {
            idle_timeout_secs: 300,
            minimize_to_tray: true,
        }
    }
}

/// Primary routing mode for chat and escalation decisions.
///
/// These are the three explicit product modes exposed in setup:
/// - `local_first` - prefer local inference first
/// - `local_claude_subscription` - prefer local and escalate through the Claude subscription lane
/// - `local_claude_api_council` - prefer local and allow both Claude subscription and API council escalation
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "snake_case")]
pub enum RoutingMode {
    /// Prefer local inference — no cloud escalation.
    #[default]
    LocalFirst,
    /// Prefer local, escalate through the Claude subscription lane.
    LocalClaudeSubscription,
    /// Prefer local, escalate through both Claude subscription and API council lanes.
    LocalClaudeApiCouncil,
}

impl RoutingMode {
    /// Parse a routing mode from its wire-format string.
    ///
    /// # Errors
    /// Returns an error for any value not in
    /// `local_first` / `local_claude_subscription` / `local_claude_api_council`.
    pub fn parse(mode: &str) -> Result<Self> {
        match mode {
            "local_first" => Ok(Self::LocalFirst),
            "local_claude_subscription" => Ok(Self::LocalClaudeSubscription),
            "local_claude_api_council" => Ok(Self::LocalClaudeApiCouncil),
            other => Err(anyhow::anyhow!(
                "Unknown routing mode '{other}'. Expected local_first, local_claude_subscription, or local_claude_api_council"
            )),
        }
    }

    /// Return the `snake_case` string representation for persistence and IPC.
    #[must_use]
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::LocalFirst => "local_first",
            Self::LocalClaudeSubscription => "local_claude_subscription",
            Self::LocalClaudeApiCouncil => "local_claude_api_council",
        }
    }
}

/// Assistant-scope routing wrapper persisted in `assistant.toml`.
///
/// Renamed from `RoutingConfig` so the user-facing engine `RoutingConfig`
/// (escalation chain + latency tuning) keeps the canonical short name
/// at the specta / TS boundary. This struct only holds the kernel-side
/// `mode` field consumed by `set_routing_mode`.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct AssistantRoutingConfig {
    /// Active routing mode — determines which escalation lanes are available.
    pub mode: RoutingMode,
}

/// Partial GPU offload hints for llama.cpp-backed slots that exceed
/// the GPU VRAM budget.
///
/// Values are transformer layer counts:
/// - `-1` = all layers on GPU (full load)
/// - `0` = CPU only
/// - positive integer N = N layers on GPU, rest on CPU
///
/// The three fields target the three llama.cpp slots in the preset
/// loadout: `chat.brain` (the 30B-A3B warm brain), `chat.fast` (the
/// Qwen3-4B hot routing brain), and `chat.vision` (Qwen3-VL-2B).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct OffloadConfig {
    /// Layers of `chat.brain` on GPU.
    pub brain_ngl: i32,
    /// Layers of `chat.fast` on GPU.
    pub fast_ngl: i32,
    /// Layers of `chat.vision` on GPU.
    pub vision_ngl: i32,
}

impl Default for OffloadConfig {
    fn default() -> Self {
        Self {
            brain_ngl: 50,
            fast_ngl: -1,
            vision_ngl: -1,
        }
    }
}

/// Root assistant configuration struct. One TOML file, one Tauri call
/// returns the whole thing, the UI mutates sub-sections via targeted
/// Tauri commands.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct AssistantConfig {
    /// Who the assistant is.
    pub identity: IdentityConfig,
    /// Wake phrase detection.
    pub wake: WakeConfig,
    /// 24/7 voice brain (Moshi) toggles.
    pub voice_brain: VoiceBrainConfig,
    /// Active TTS voice profile.
    pub tts: TtsConfig,
    /// Registered custom voice clones from user-uploaded MP3 samples.
    #[serde(default)]
    pub voice_clones: Vec<VoiceCloneEntry>,
    /// Keyword action mappings.
    #[serde(default, rename = "keyword_actions")]
    pub keyword_actions: Vec<KeywordActionEntry>,
    /// Window idle + tray behaviour.
    pub window: WindowConfig,
    /// Chat routing mode and escalation lane selection.
    pub routing: AssistantRoutingConfig,
    /// Partial GPU offload hints.
    pub offload: OffloadConfig,
}

impl AssistantConfig {
    /// Compute the override path for a userdata directory.
    ///
    /// Layout: `{userdata_dir}/config/assistant.toml`. If the `config`
    /// subdir does not exist, [`AssistantConfig::save`] creates it.
    pub fn override_path(userdata_dir: &Path) -> PathBuf {
        userdata_dir.join("config").join(OVERRIDE_FILENAME)
    }

    /// Load the assistant config, preferring the userdata override.
    ///
    /// Order of precedence:
    ///
    /// 1. `{userdata_dir}/config/assistant.toml` — if present and
    ///    parses cleanly, wins.
    /// 2. Embedded `assistant.default.toml` — compile-time baseline.
    ///
    /// Any parse failure on the override path logs a warning and
    /// falls through to the embedded default. Missing override is
    /// silent — first boot is valid state.
    ///
    /// # Errors
    /// Returns an error only if the embedded default fails to parse —
    /// effectively a build-time invariant violation. Userdata-override
    /// IO and parse failures are caught and downgraded to warnings.
    pub fn load(userdata_dir: &Path) -> Result<Self> {
        let path = Self::override_path(userdata_dir);

        if path.exists() {
            match std::fs::read_to_string(&path) {
                Ok(contents) => match toml::from_str::<Self>(&contents) {
                    Ok(cfg) => {
                        tracing::info!(
                            target: "assistant",
                            path = %path.display(),
                            name = %cfg.identity.name,
                            wake_enabled = cfg.wake.enabled,
                            voice_24_7 = cfg.voice_brain.enabled_24_7,
                            keyword_count = cfg.keyword_actions.len(),
                            clone_count = cfg.voice_clones.len(),
                            "Loaded assistant config from userdata override"
                        );
                        return Ok(cfg);
                    }
                    Err(e) => {
                        tracing::warn!(
                            target: "assistant",
                            path = %path.display(),
                            error = %e,
                            "Failed to parse assistant.toml, falling back to default"
                        );
                    }
                },
                Err(e) => {
                    tracing::warn!(
                        target: "assistant",
                        path = %path.display(),
                        error = %e,
                        "Failed to read assistant.toml, falling back to default"
                    );
                }
            }
        }

        Self::load_default()
    }

    /// Load the embedded default config. Always succeeds in release
    /// builds — the embedded TOML is validated by
    /// [`tests::embedded_default_parses`].
    ///
    /// # Errors
    /// Returns an error if the embedded `assistant.default.toml` fails
    /// to parse — this is a build-time invariant and should never fire
    /// in a shipped binary.
    pub fn load_default() -> Result<Self> {
        toml::from_str(DEFAULT_TOML).context("Failed to parse embedded assistant.default.toml")
    }

    /// Persist the current config to the userdata override path.
    ///
    /// Creates `{userdata_dir}/config/` if missing. Writes an atomic
    /// replacement via `tempfile + rename` so a crash mid-write does
    /// not corrupt the file the next boot reads.
    ///
    /// # Errors
    /// Returns an error if the parent directory cannot be created
    /// (permission denied), if TOML serialization fails (effectively
    /// impossible — every field has a serde impl), or if the temp
    /// write / atomic rename step fails (disk full, permission denied,
    /// or filesystem doesn't support `rename` across the same dir).
    pub fn save(&self, userdata_dir: &Path) -> Result<()> {
        let path = Self::override_path(userdata_dir);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create {}", parent.display()))?;
        }

        let toml_str =
            toml::to_string_pretty(self).context("Failed to serialize AssistantConfig")?;

        // Atomic replacement: write to a sibling temp file then rename.
        let tmp_path = path.with_extension("toml.tmp");
        std::fs::write(&tmp_path, &toml_str)
            .with_context(|| format!("Failed to write temp file {}", tmp_path.display()))?;
        std::fs::rename(&tmp_path, &path).with_context(|| {
            format!(
                "Failed to rename {} -> {}",
                tmp_path.display(),
                path.display()
            )
        })?;

        tracing::info!(
            target: "assistant",
            path = %path.display(),
            "Persisted assistant config"
        );
        Ok(())
    }

    /// Convenience: rename the assistant and persist.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures (parent dir, TOML serialize,
    /// atomic write, rename).
    pub fn set_name(&mut self, userdata_dir: &Path, name: String) -> Result<()> {
        self.identity.name = name;
        self.save(userdata_dir)
    }

    /// Convenience: replace the wake phrase and persist.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures.
    pub fn set_wake_phrase(&mut self, userdata_dir: &Path, phrase: String) -> Result<()> {
        self.wake.phrase = phrase;
        self.save(userdata_dir)
    }

    /// Convenience: toggle 24/7 wake listening and persist.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures.
    pub fn set_wake_enabled(&mut self, userdata_dir: &Path, enabled: bool) -> Result<()> {
        self.wake.enabled = enabled;
        self.save(userdata_dir)
    }

    /// Convenience: toggle the 24/7 Moshi voice brain and persist.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures.
    pub fn set_voice_brain_24_7(&mut self, userdata_dir: &Path, enabled: bool) -> Result<()> {
        self.voice_brain.enabled_24_7 = enabled;
        self.save(userdata_dir)
    }

    /// Convenience: replace the TTS voice profile and persist.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures.
    pub fn set_voice_profile(&mut self, userdata_dir: &Path, profile: String) -> Result<()> {
        self.tts.profile = profile;
        self.save(userdata_dir)
    }

    /// Convenience: replace the routing mode and persist.
    ///
    /// # Errors
    /// Returns an error from [`RoutingMode::parse`] if `mode` isn't one
    /// of the known wire-format strings, or from [`Self::save`] if the
    /// persist step fails.
    pub fn set_routing_mode(&mut self, userdata_dir: &Path, mode: &str) -> Result<()> {
        self.routing.mode = RoutingMode::parse(mode)?;
        self.save(userdata_dir)
    }

    /// Register a new custom voice clone and persist. Duplicate names
    /// replace the existing entry in-place.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures.
    pub fn register_voice_clone(
        &mut self,
        userdata_dir: &Path,
        entry: VoiceCloneEntry,
    ) -> Result<()> {
        if let Some(existing) = self.voice_clones.iter_mut().find(|e| e.name == entry.name) {
            *existing = entry;
        } else {
            self.voice_clones.push(entry);
        }
        self.save(userdata_dir)
    }

    /// Remove a registered voice clone by name and persist. Silent if
    /// the name does not match any entry.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures.
    pub fn remove_voice_clone(&mut self, userdata_dir: &Path, name: &str) -> Result<()> {
        self.voice_clones.retain(|e| e.name != name);
        self.save(userdata_dir)
    }

    /// Add a new keyword action entry and persist. Duplicate phrases
    /// replace the existing entry in-place.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures.
    pub fn add_keyword_action(
        &mut self,
        userdata_dir: &Path,
        entry: KeywordActionEntry,
    ) -> Result<()> {
        if let Some(existing) = self
            .keyword_actions
            .iter_mut()
            .find(|e| e.phrase == entry.phrase)
        {
            *existing = entry;
        } else {
            self.keyword_actions.push(entry);
        }
        self.save(userdata_dir)
    }

    /// Remove a keyword action by phrase and persist. Silent if the
    /// phrase does not match any entry.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures.
    pub fn remove_keyword_action(&mut self, userdata_dir: &Path, phrase: &str) -> Result<()> {
        self.keyword_actions.retain(|e| e.phrase != phrase);
        self.save(userdata_dir)
    }

    /// Update an existing keyword action in place by its phrase, and
    /// persist. If the phrase does not exist, this is a no-op.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures (only invoked if a matching
    /// phrase is found and updated).
    pub fn update_keyword_action(
        &mut self,
        userdata_dir: &Path,
        phrase: &str,
        new_entry: KeywordActionEntry,
    ) -> Result<()> {
        if let Some(existing) = self.keyword_actions.iter_mut().find(|e| e.phrase == phrase) {
            *existing = new_entry;
            self.save(userdata_dir)?;
        }
        Ok(())
    }

    /// Replace the idle timeout and persist.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures.
    pub fn set_idle_timeout(&mut self, userdata_dir: &Path, secs: u32) -> Result<()> {
        self.window.idle_timeout_secs = secs;
        self.save(userdata_dir)
    }

    /// Replace the partial-offload layer count for `chat.brain` and
    /// persist. The backend router reads this on the next swap.
    ///
    /// # Errors
    /// Forwards [`Self::save`]'s failures.
    pub fn set_brain_ngl(&mut self, userdata_dir: &Path, ngl: i32) -> Result<()> {
        self.offload.brain_ngl = ngl;
        self.save(userdata_dir)
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::expect_used)] // tests panic on assistant config IO failures by design
mod tests {
    use super::*;

    /// The compile-time default TOML must always parse — if not, the
    /// embedded file has drifted from the struct and we ship broken.
    #[test]
    fn embedded_default_parses() {
        let cfg = AssistantConfig::load_default().expect("default TOML must parse");
        assert_eq!(cfg.identity.name, "Clyffy");
        assert!(cfg.wake.enabled);
        assert_eq!(cfg.wake.phrase, "hey clyffy");
        assert!(cfg.voice_brain.enabled_24_7);
        assert_eq!(cfg.tts.profile, "kokoro:am_eric");
        assert_eq!(cfg.offload.brain_ngl, 50);
        assert!(!cfg.keyword_actions.is_empty());
    }

    /// Save + reload round-trip must preserve every field so the UI
    /// can round-trip edits without losing data.
    #[test]
    fn save_load_round_trip() {
        let tmp = std::env::temp_dir().join(format!(
            "devpulse-assistant-rt-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(&tmp).unwrap();

        let mut cfg = AssistantConfig::load_default().unwrap();
        cfg.identity.name = "TestBot".to_string();
        cfg.wake.phrase = "yo test".to_string();
        cfg.wake.enabled = false;
        cfg.voice_brain.enabled_24_7 = false;
        cfg.tts.profile = "kokoro:af_bella".to_string();
        cfg.window.idle_timeout_secs = 900;
        cfg.offload.brain_ngl = 30;
        cfg.voice_clones.push(VoiceCloneEntry {
            name: "my_test".into(),
            reference_path: "/tmp/ref.mp3".into(),
            transcript: "This is a test sample.".into(),
        });
        cfg.keyword_actions.push(KeywordActionEntry {
            phrase: "do thing".into(),
            action: AssistantAction::RunCommand,
            payload: "echo hi".into(),
            enabled: true,
        });

        cfg.save(&tmp).unwrap();

        let reloaded = AssistantConfig::load(&tmp).unwrap();
        assert_eq!(reloaded.identity.name, "TestBot");
        assert_eq!(reloaded.wake.phrase, "yo test");
        assert!(!reloaded.wake.enabled);
        assert!(!reloaded.voice_brain.enabled_24_7);
        assert_eq!(reloaded.tts.profile, "kokoro:af_bella");
        assert_eq!(reloaded.window.idle_timeout_secs, 900);
        assert_eq!(reloaded.offload.brain_ngl, 30);
        assert_eq!(reloaded.voice_clones.len(), 1);
        assert_eq!(reloaded.voice_clones[0].name, "my_test");
        // The embedded default carries 3 keyword_actions; we appended one.
        assert_eq!(reloaded.keyword_actions.len(), 4);
        let our_entry = reloaded
            .keyword_actions
            .iter()
            .find(|e| e.phrase == "do thing")
            .expect("appended entry should round-trip");
        assert_eq!(our_entry.action, AssistantAction::RunCommand);
        assert_eq!(our_entry.payload, "echo hi");
        assert!(our_entry.enabled);

        // Sanity: updating in-place does not duplicate.
        let mut reloaded2 = reloaded.clone();
        reloaded2
            .update_keyword_action(
                &tmp,
                "do thing",
                KeywordActionEntry {
                    phrase: "do thing".into(),
                    action: AssistantAction::Screenshot,
                    payload: String::new(),
                    enabled: false,
                },
            )
            .unwrap();
        let reloaded3 = AssistantConfig::load(&tmp).unwrap();
        let updated = reloaded3
            .keyword_actions
            .iter()
            .find(|e| e.phrase == "do thing")
            .unwrap();
        assert_eq!(updated.action, AssistantAction::Screenshot);
        assert!(!updated.enabled);
        assert_eq!(reloaded3.keyword_actions.len(), 4);

        // Remove path.
        let mut reloaded4 = reloaded3.clone();
        reloaded4.remove_keyword_action(&tmp, "do thing").unwrap();
        let reloaded5 = AssistantConfig::load(&tmp).unwrap();
        assert!(!reloaded5
            .keyword_actions
            .iter()
            .any(|e| e.phrase == "do thing"));
        assert_eq!(reloaded5.keyword_actions.len(), 3);

        // Missing override silently falls back to defaults.
        let _ = std::fs::remove_dir_all(&tmp);
    }

    /// An empty userdata directory (no override file) returns the
    /// compile-time defaults — first-run behaviour.
    #[test]
    fn missing_override_loads_default() {
        let tmp = std::env::temp_dir().join(format!(
            "devpulse-assistant-missing-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(&tmp).unwrap();
        let cfg = AssistantConfig::load(&tmp).unwrap();
        assert_eq!(cfg.identity.name, "Clyffy");
        let _ = std::fs::remove_dir_all(&tmp);
    }

    /// Voice clone dedupe: adding a clone with an existing name must
    /// replace, not duplicate.
    #[test]
    fn voice_clone_dedupe() {
        let tmp = std::env::temp_dir().join(format!(
            "devpulse-assistant-clone-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(&tmp).unwrap();

        let mut cfg = AssistantConfig::load_default().unwrap();
        cfg.register_voice_clone(
            &tmp,
            VoiceCloneEntry {
                name: "me".into(),
                reference_path: "/tmp/v1.mp3".into(),
                transcript: String::new(),
            },
        )
        .unwrap();
        cfg.register_voice_clone(
            &tmp,
            VoiceCloneEntry {
                name: "me".into(),
                reference_path: "/tmp/v2.mp3".into(),
                transcript: "newer".into(),
            },
        )
        .unwrap();

        let reloaded = AssistantConfig::load(&tmp).unwrap();
        assert_eq!(reloaded.voice_clones.len(), 1);
        assert_eq!(reloaded.voice_clones[0].reference_path, "/tmp/v2.mp3");
        assert_eq!(reloaded.voice_clones[0].transcript, "newer");

        let _ = std::fs::remove_dir_all(&tmp);
    }
}
