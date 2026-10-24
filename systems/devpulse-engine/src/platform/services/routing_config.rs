//! Routing user-scope config — escalation chain + latency tuning + response source.
//!
//! Persists to `{data_dir}/user/routing.toml`. Atomic write via
//! temp-file plus rename. Load tolerates missing or malformed files
//! by returning defaults so the wizard / settings surface always
//! renders.
//!
//! Concerns this file owns end-to-end:
//!
//! - The `InferenceProvider` enum that gates which Claude lane the
//!   dispatcher (`commands::cloud::inner_get_inference_provider`)
//!   chooses at chat dispatch time.
//! - The `EscalationConfig` chain (Voice Brain → Main Brain → Cloud API)
//!   with per-tier `enabled` + `timeout_ms`.
//! - The `LatencyConfig` knobs (audio buffer, VAD silence, stream chunk
//!   size) that the audio pipeline + token-streaming path will consume.
//!
//! Pattern mirrored from `voice_stt_config.rs` / `voice_tts_config.rs`:
//! same atomic-rename, same default-on-missing, same clamping discipline.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::io::Write as _;
use std::path::{Path, PathBuf};

const FILE_NAME: &str = "routing.toml";

// ── Defaults — match the wizard panel's hardcoded list verbatim ──

/// Default Voice Brain tier timeout in milliseconds.
pub const DEFAULT_VOICE_BRAIN_TIMEOUT_MS: u32 = 3_000;
/// Default Main Brain tier timeout in milliseconds.
pub const DEFAULT_MAIN_BRAIN_TIMEOUT_MS: u32 = 10_000;
/// Default Cloud API tier timeout in milliseconds.
pub const DEFAULT_CLOUD_API_TIMEOUT_MS: u32 = 30_000;

/// Default audio buffer in milliseconds.
pub const DEFAULT_AUDIO_BUFFER_MS: u32 = 200;
/// Default VAD silence threshold in milliseconds.
pub const DEFAULT_VAD_SILENCE_MS: u32 = 500;
/// Default stream chunk size in tokens.
pub const DEFAULT_STREAM_CHUNK_SIZE: u32 = 256;

/// Audio buffer slider range — minimum.
const AUDIO_BUFFER_MIN_MS: u32 = 50;
/// Audio buffer slider range — maximum.
const AUDIO_BUFFER_MAX_MS: u32 = 1_000;
/// VAD silence slider range — minimum.
const VAD_SILENCE_MIN_MS: u32 = 200;
/// VAD silence slider range — maximum.
const VAD_SILENCE_MAX_MS: u32 = 2_000;
/// Stream chunk size — minimum.
const STREAM_CHUNK_MIN: u32 = 64;
/// Stream chunk size — maximum.
const STREAM_CHUNK_MAX: u32 = 1_024;
/// Per-tier timeout — minimum (1 s).
const TIER_TIMEOUT_MIN_MS: u32 = 1_000;
/// Per-tier timeout — maximum (60 s).
const TIER_TIMEOUT_MAX_MS: u32 = 60_000;

// ── Inference provider — which Claude lane the dispatcher allows ──

/// Which Claude escalation lane is allowed after local-first routing.
///
/// SSOT for the `response_source` decision the dispatcher consumes at
/// chat dispatch time. Mirrors the kernel's `RoutingMode` value-for-value
/// — the kernel type is private, this is the public surface engine +
/// Tauri + frontend share via specta.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum InferenceProvider {
    /// Prefer local models first — no cloud escalation.
    #[default]
    LocalFirst,
    /// Prefer local, then escalate through the Claude subscription lane.
    LocalClaudeSubscription,
    /// Prefer local, then escalate through Claude subscription and API
    /// council lanes.
    LocalClaudeApiCouncil,
}

impl InferenceProvider {
    /// Wire-format string used for kernel persistence + IPC events.
    #[must_use]
    pub fn as_str(self) -> &'static str {
        match self {
            Self::LocalFirst => "local_first",
            Self::LocalClaudeSubscription => "local_claude_subscription",
            Self::LocalClaudeApiCouncil => "local_claude_api_council",
        }
    }

    /// Parse from the wire-format string. Unknown values fall back to
    /// `LocalFirst` so a malformed kernel persist never crashes the UI.
    ///
    /// Renamed away from `from_str` (clippy `should_implement_trait`
    /// flagged the name as confusable with `std::str::FromStr`) — this
    /// method is infallible and the trait is for fallible parsing, so
    /// the name `from_wire` better matches the semantics.
    #[must_use]
    pub fn from_wire(s: &str) -> Self {
        match s {
            "local_claude_subscription" => Self::LocalClaudeSubscription,
            "local_claude_api_council" => Self::LocalClaudeApiCouncil,
            _ => Self::LocalFirst,
        }
    }
}

// ── Escalation chain ─────────────────────────────────────────

/// Stable identifier for an escalation tier.
///
/// Closed enum so the schema survives renames over time — the wire
/// format is the variant string, not a free-form id, and code matches
/// on `EscalationTierId::*` rather than string comparison.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum EscalationTierId {
    /// Lightweight CPU model for fast turn-taking.
    VoiceBrain,
    /// Full reasoning model on GPU — primary chat brain.
    MainBrain,
    /// External AI service (Claude / `OpenAI` / etc.).
    CloudApi,
}

impl EscalationTierId {
    /// All tier ids in canonical chain order.
    #[must_use]
    pub fn all() -> [Self; 3] {
        [Self::VoiceBrain, Self::MainBrain, Self::CloudApi]
    }

    /// Layman label for tracing / logs (UI uses tokenized copy).
    #[must_use]
    pub fn label(self) -> &'static str {
        match self {
            Self::VoiceBrain => "voice_brain",
            Self::MainBrain => "main_brain",
            Self::CloudApi => "cloud_api",
        }
    }
}

/// Persisted state for one escalation tier.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct EscalationTier {
    /// Stable tier id — matches a closed enum, never a free-form key.
    pub id: EscalationTierId,
    /// Whether the tier participates in the escalation chain.
    pub enabled: bool,
    /// Per-tier timeout in milliseconds. Clamped on write to
    /// `[1_000, 60_000]` — outside that range the slider in the wizard
    /// can't author the value either.
    pub timeout_ms: u32,
    /// Optional slot id this tier dispatches to (`voice.brain`,
    /// `chat.brain`, etc.). `None` for tiers that do not bind to a
    /// model loader slot (e.g. `CloudApi`).
    pub slot_id: Option<String>,
}

/// Persisted escalation chain.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct EscalationConfig {
    /// Tiers in fall-through order. The chain runs top to bottom; if a
    /// tier is disabled or times out, the next enabled tier handles
    /// the request.
    pub tiers: Vec<EscalationTier>,
}

impl Default for EscalationConfig {
    fn default() -> Self {
        Self {
            tiers: vec![
                EscalationTier {
                    id: EscalationTierId::VoiceBrain,
                    enabled: true,
                    timeout_ms: DEFAULT_VOICE_BRAIN_TIMEOUT_MS,
                    slot_id: Some("voice.brain".to_string()),
                },
                EscalationTier {
                    id: EscalationTierId::MainBrain,
                    enabled: true,
                    timeout_ms: DEFAULT_MAIN_BRAIN_TIMEOUT_MS,
                    slot_id: Some("chat.brain".to_string()),
                },
                EscalationTier {
                    id: EscalationTierId::CloudApi,
                    enabled: false,
                    timeout_ms: DEFAULT_CLOUD_API_TIMEOUT_MS,
                    slot_id: None,
                },
            ],
        }
    }
}

impl EscalationConfig {
    fn clamp(mut self) -> Self {
        // Drop unknown tiers, clamp timeouts, ensure each canonical tier
        // appears exactly once. Order is canonical (VoiceBrain → MainBrain
        // → CloudApi) — the chain has a defined shape.
        let mut canonical = Vec::with_capacity(EscalationTierId::all().len());
        let defaults = Self::default();
        for canonical_id in EscalationTierId::all() {
            let existing = self.tiers.iter().find(|t| t.id == canonical_id).cloned();
            let default_for_id = defaults
                .tiers
                .iter()
                .find(|t| t.id == canonical_id)
                .cloned()
                .unwrap_or(EscalationTier {
                    id: canonical_id,
                    enabled: false,
                    timeout_ms: TIER_TIMEOUT_MIN_MS,
                    slot_id: None,
                });
            let mut tier = existing.unwrap_or_else(|| default_for_id.clone());
            tier.timeout_ms = tier
                .timeout_ms
                .clamp(TIER_TIMEOUT_MIN_MS, TIER_TIMEOUT_MAX_MS);
            // The canonical slot binding is part of the schema, not user
            // data. If a deserialised value drifted, snap it back.
            tier.slot_id.clone_from(&default_for_id.slot_id);
            canonical.push(tier);
        }
        self.tiers = canonical;
        self
    }

    /// Iterator over tiers that are currently `enabled` in canonical
    /// chain order. The dispatcher walks this in escalation order.
    pub fn enabled_tiers(&self) -> impl Iterator<Item = &EscalationTier> {
        self.tiers.iter().filter(|t| t.enabled)
    }
}

// ── Latency tuning ──────────────────────────────────────────

/// Persisted latency / response-source tuning.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
pub struct LatencyConfig {
    /// Which Claude lane is allowed after local-first routing. SSOT for
    /// the chat dispatcher.
    pub response_source: InferenceProvider,
    /// Audio capture buffer in milliseconds. Smaller = lower latency,
    /// larger = smoother audio. Clamped to `[50, 1000]` on write.
    pub audio_buffer_ms: u32,
    /// VAD silence threshold in milliseconds — how long after the user
    /// stops talking before processing kicks in. Clamped to
    /// `[200, 2000]` on write.
    pub vad_silence_ms: u32,
    /// Stream chunk size in tokens. Larger reduces overhead but delays
    /// the first token. Clamped to `[64, 1024]` on write.
    pub stream_chunk_size: u32,
}

impl Default for LatencyConfig {
    fn default() -> Self {
        Self {
            response_source: InferenceProvider::default(),
            audio_buffer_ms: DEFAULT_AUDIO_BUFFER_MS,
            vad_silence_ms: DEFAULT_VAD_SILENCE_MS,
            stream_chunk_size: DEFAULT_STREAM_CHUNK_SIZE,
        }
    }
}

impl LatencyConfig {
    fn clamp(mut self) -> Self {
        self.audio_buffer_ms = self
            .audio_buffer_ms
            .clamp(AUDIO_BUFFER_MIN_MS, AUDIO_BUFFER_MAX_MS);
        self.vad_silence_ms = self
            .vad_silence_ms
            .clamp(VAD_SILENCE_MIN_MS, VAD_SILENCE_MAX_MS);
        self.stream_chunk_size = self
            .stream_chunk_size
            .clamp(STREAM_CHUNK_MIN, STREAM_CHUNK_MAX);
        self
    }
}

// ── Root config ─────────────────────────────────────────────

/// Persisted user-scope routing configuration.
///
/// One TOML file (`{data_dir}/user/routing.toml`), one accessor pair
/// (`Platform::routing_config_load` / `routing_config_save`).
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize, Type)]
pub struct RoutingConfig {
    /// Escalation chain — Voice Brain → Main Brain → Cloud API.
    pub escalation: EscalationConfig,
    /// Latency tuning + response source.
    pub latency: LatencyConfig,
}

impl RoutingConfig {
    /// Apply every per-section clamp before persisting / surfacing.
    #[must_use]
    pub fn clamp(self) -> Self {
        Self {
            escalation: self.escalation.clamp(),
            latency: self.latency.clamp(),
        }
    }
}

// ── Atomic IO ───────────────────────────────────────────────

fn resolve_path(data_dir: &Path) -> PathBuf {
    data_dir.join("user").join(FILE_NAME)
}

/// Load the persisted config, or defaults on any error.
///
/// Mirrors `voice_stt_config::load`: parse failures log a warning and
/// fall back to defaults so the surface always renders.
#[must_use]
pub fn load(data_dir: &Path) -> RoutingConfig {
    let path = resolve_path(data_dir);
    let Ok(raw) = fs::read_to_string(&path) else {
        return RoutingConfig::default();
    };
    match toml::from_str::<RoutingConfig>(&raw) {
        Ok(cfg) => cfg.clamp(),
        Err(err) => {
            tracing::warn!(
                path = %path.display(),
                error = %err,
                "routing config parse failed — using defaults"
            );
            RoutingConfig::default()
        }
    }
}

/// Atomically persist the config. Returns the clamped value written.
///
/// # Errors
/// - Creating the `user/` directory fails.
/// - Temp-file write or rename fails.
/// - TOML serialization fails (effectively impossible — every field
///   has a serde impl).
pub fn save(data_dir: &Path, cfg: &RoutingConfig) -> Result<RoutingConfig> {
    let clamped = cfg.clone().clamp();
    let path = resolve_path(data_dir);
    let parent = path
        .parent()
        .with_context(|| format!("routing path has no parent: {}", path.display()))?;
    fs::create_dir_all(parent).with_context(|| format!("create parent {}", parent.display()))?;

    let serialized = toml::to_string_pretty(&clamped).context("serialize routing config")?;
    let mut tmp = path.clone();
    let mut ext = tmp
        .extension()
        .and_then(|s| s.to_str())
        .map(str::to_owned)
        .unwrap_or_default();
    ext.push_str(".tmp");
    tmp.set_extension(ext);

    {
        let mut f =
            fs::File::create(&tmp).with_context(|| format!("open tmp {}", tmp.display()))?;
        f.write_all(serialized.as_bytes())
            .with_context(|| format!("write tmp {}", tmp.display()))?;
        f.sync_all().ok();
    }

    fs::rename(&tmp, &path)
        .with_context(|| format!("rename {} -> {}", tmp.display(), path.display()))?;

    Ok(clamped)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_when_missing() {
        let tmp = tempfile::tempdir().unwrap();
        let cfg = load(tmp.path());
        assert_eq!(cfg.escalation.tiers.len(), 3);
        assert_eq!(cfg.escalation.tiers[0].id, EscalationTierId::VoiceBrain);
        assert!(cfg.escalation.tiers[0].enabled);
        assert_eq!(cfg.latency.response_source, InferenceProvider::LocalFirst);
        assert_eq!(cfg.latency.audio_buffer_ms, DEFAULT_AUDIO_BUFFER_MS);
    }

    #[test]
    fn clamps_timeouts_and_buffers() {
        let tmp = tempfile::tempdir().unwrap();
        let mut cfg = RoutingConfig::default();
        cfg.escalation.tiers[0].timeout_ms = 999_999;
        cfg.latency.audio_buffer_ms = 9_999;
        cfg.latency.vad_silence_ms = 50;
        cfg.latency.stream_chunk_size = 4_000;
        let saved = save(tmp.path(), &cfg).unwrap();
        assert_eq!(saved.escalation.tiers[0].timeout_ms, TIER_TIMEOUT_MAX_MS);
        assert_eq!(saved.latency.audio_buffer_ms, AUDIO_BUFFER_MAX_MS);
        assert_eq!(saved.latency.vad_silence_ms, VAD_SILENCE_MIN_MS);
        assert_eq!(saved.latency.stream_chunk_size, STREAM_CHUNK_MAX);
    }

    #[test]
    fn round_trip_preserves_response_source() {
        let tmp = tempfile::tempdir().unwrap();
        let mut cfg = RoutingConfig::default();
        cfg.latency.response_source = InferenceProvider::LocalClaudeApiCouncil;
        cfg.escalation.tiers[2].enabled = true;
        save(tmp.path(), &cfg).unwrap();
        let reloaded = load(tmp.path());
        assert_eq!(
            reloaded.latency.response_source,
            InferenceProvider::LocalClaudeApiCouncil
        );
        assert!(reloaded.escalation.tiers[2].enabled);
    }

    #[test]
    fn enabled_tiers_iterator_filters_disabled() {
        let cfg = EscalationConfig {
            tiers: vec![
                EscalationTier {
                    id: EscalationTierId::VoiceBrain,
                    enabled: false,
                    timeout_ms: 3_000,
                    slot_id: Some("voice.brain".into()),
                },
                EscalationTier {
                    id: EscalationTierId::MainBrain,
                    enabled: true,
                    timeout_ms: 10_000,
                    slot_id: Some("chat.brain".into()),
                },
                EscalationTier {
                    id: EscalationTierId::CloudApi,
                    enabled: true,
                    timeout_ms: 30_000,
                    slot_id: None,
                },
            ],
        };
        let enabled: Vec<_> = cfg.enabled_tiers().map(|t| t.id).collect();
        assert_eq!(
            enabled,
            vec![EscalationTierId::MainBrain, EscalationTierId::CloudApi]
        );
    }
}
