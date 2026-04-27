//! Qwen3-TTS-12Hz-0.6B-Base — voice synthesis with zero-shot cloning.
//!
//! Pure-Rust path via Candle through the [`qwen3-tts`] crate
//! ([TrevorS/qwen3-tts-rs](https://github.com/TrevorS/qwen3-tts-rs), MIT).
//! Single engine handles three modes selectable via the `voice` arg
//! passed into [`TtsBackend::synthesize`]:
//!
//! - empty / `"default"` — default Qwen3-TTS voice
//! - `"qwen3:<speaker>"` — preset speaker (Ryan / Serena / Vivian / ...)
//! - `"custom:<name>"` — cloned voice; looks up `VoiceCloneEntry` by
//!   `name` in the snapshot held by this backend, decodes the reference
//!   audio, builds a `VoiceClonePrompt`, synthesizes against it
//!
//! The crate's [`Qwen3TTS::from_pretrained`] expects a *directory*
//! containing both `model.safetensors` (talker LM) and
//! `speech_tokenizer/model.safetensors` (codec). Slot loading hands us
//! the path to the talker file — we resolve `path.parent()` and pass
//! that. Both files are validated for existence before construction.
//!
//! Output: f32 PCM mono at 24 kHz. Drops directly into [`AudioSamples`]
//! for `rodio` playback without a separate vocoder step.
//!
//! [`qwen3-tts`]: https://crates.io/crates/qwen3-tts

use crate::assistant::config::VoiceCloneEntry;
use crate::backends::voice::{AudioSamples, TtsBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};
use std::sync::RwLock;
#[cfg(feature = "qwen3-tts-backend")]
use std::sync::Mutex;

#[cfg(feature = "qwen3-tts-backend")]
use qwen3_tts::{auto_device, AudioBuffer, Language, Qwen3TTS, Speaker};

/// Output sample rate for every Qwen3-TTS variant — the codec produces
/// 24 kHz mono regardless of which speaker / clone path was used.
#[cfg(feature = "qwen3-tts-backend")]
const SAMPLE_RATE: u32 = 24_000;

/// `voice` parameter prefix that identifies a registered voice clone.
/// Convention `custom:<name>` matches the existing TTS routing already
/// used by the `voice_profile` field at the assistant-config layer.
#[cfg(feature = "qwen3-tts-backend")]
const CUSTOM_VOICE_PREFIX: &str = "custom:";

/// `voice` parameter prefix that identifies a Qwen3-TTS preset speaker.
#[cfg(feature = "qwen3-tts-backend")]
const QWEN3_VOICE_PREFIX: &str = "qwen3:";

/// Qwen3-TTS backend — implements [`TtsBackend`] over the `qwen3-tts`
/// crate. Holds an optional voice-clones snapshot so `custom:<name>`
/// requests can resolve the reference audio + transcript without
/// re-reading `assistant.toml` on every synthesis call.
pub struct Qwen3TtsBackend {
    /// Path to the loaded `model.safetensors` (talker LM). The codec
    /// file at `speech_tokenizer/model.safetensors` lives next to it.
    model_path: Option<PathBuf>,
    /// Whether a model is currently loaded.
    loaded: bool,
    /// Snapshot of registered voice clones at the moment this backend
    /// was constructed (or last refreshed via [`TtsBackend::set_voice_clones`]).
    /// Empty by default; populated by the voice pool / engine layer
    /// after reading `assistant.toml`. Held behind an `RwLock` because
    /// the trait method must work through `&self` (the dispatcher holds
    /// the backend behind `&Box<dyn TtsBackend>` while synthesis runs
    /// concurrently with `register_voice_clone` / `remove_voice_clone`
    /// commands from the UI).
    voice_clones: RwLock<Vec<VoiceCloneEntry>>,
    /// The underlying Qwen3-TTS engine. Behind a `Mutex` to match the
    /// SNAC/Kokoro pattern — Tauri commands fire concurrently and the
    /// engine is not `Sync` on its own.
    #[cfg(feature = "qwen3-tts-backend")]
    model: Mutex<Option<Qwen3TTS>>,
}

impl Qwen3TtsBackend {
    /// Create a new (unloaded) Qwen3-TTS backend with no voice clones.
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
            voice_clones: RwLock::new(Vec::new()),
            #[cfg(feature = "qwen3-tts-backend")]
            model: Mutex::new(None),
        }
    }

    /// Number of voice clones currently registered with this backend.
    /// Returns 0 if the lock is poisoned — diagnostic accessor only.
    #[must_use]
    pub fn voice_clone_count(&self) -> usize {
        self.voice_clones.read().map(|g| g.len()).unwrap_or(0)
    }
}

impl Default for Qwen3TtsBackend {
    fn default() -> Self {
        Self::new()
    }
}

impl TtsBackend for Qwen3TtsBackend {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "Qwen3-TTS",
            "Loading Qwen3-TTS model"
        );

        if !path.exists() {
            anyhow::bail!("Qwen3-TTS talker file not found: {}", path.display());
        }
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if ext != "safetensors" {
            anyhow::bail!(
                "Qwen3-TTS expects safetensors talker, got .{ext}: {}",
                path.display()
            );
        }

        // Crate's `from_pretrained` takes a directory containing both the
        // talker LM and the bundled `speech_tokenizer/` codec.
        let model_dir = path.parent().ok_or_else(|| {
            anyhow::anyhow!(
                "Qwen3-TTS talker path has no parent dir: {}",
                path.display()
            )
        })?;
        let codec_path = model_dir.join("speech_tokenizer").join("model.safetensors");
        if !codec_path.exists() {
            anyhow::bail!(
                "Qwen3-TTS codec missing — expected {} alongside the talker. \
                 Both files are mandatory; download the full repo from \
                 huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-Base.",
                codec_path.display()
            );
        }

        #[cfg(feature = "qwen3-tts-backend")]
        {
            let device = auto_device()
                .map_err(|e| anyhow::anyhow!("Qwen3-TTS device selection failed: {e}"))?;
            let model_dir_str = model_dir.to_str().ok_or_else(|| {
                anyhow::anyhow!(
                    "Qwen3-TTS model dir contains non-UTF-8 chars: {}",
                    model_dir.display()
                )
            })?;
            let qwen = Qwen3TTS::from_pretrained(model_dir_str, device)
                .map_err(|e| anyhow::anyhow!("Qwen3-TTS load failed: {e}"))?;
            *self
                .model
                .lock()
                .map_err(|e| anyhow::anyhow!("Qwen3-TTS model mutex poisoned: {e}"))? = Some(qwen);

            let talker_size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
            let codec_size = std::fs::metadata(&codec_path).map(|m| m.len()).unwrap_or(0);
            let total = talker_size + codec_size;

            self.model_path = Some(path.to_path_buf());
            self.loaded = true;

            let clone_count = self.voice_clones.read().map(|g| g.len()).unwrap_or(0);
            tracing::info!(
                component = "Qwen3-TTS",
                talker_mb = talker_size / (1024 * 1024),
                codec_mb = codec_size / (1024 * 1024),
                total_mb = total / (1024 * 1024),
                voice_clones = clone_count,
                "Qwen3-TTS loaded"
            );

            // Memory footprint is reported as `ram_bytes` because the
            // `qwen3-tts` crate hides its device-side allocation behind
            // Candle's tensor types; the load-budgeter accounts for the
            // GPU residency cost via the preset's `vram_estimate_mb`.
            Ok(MemoryFootprint {
                ram_bytes: total,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            })
        }

        #[cfg(not(feature = "qwen3-tts-backend"))]
        anyhow::bail!(
            "qwen3-tts-backend feature not compiled — cannot load Qwen3-TTS. \
             Enable 'qwen3-tts-backend' feature in model-loader Cargo.toml."
        )
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        tracing::info!(component = "Qwen3-TTS", "Unloading Qwen3-TTS");
        #[cfg(feature = "qwen3-tts-backend")]
        {
            *self
                .model
                .lock()
                .map_err(|e| anyhow::anyhow!("Qwen3-TTS model mutex poisoned: {e}"))? = None;
        }
        self.model_path = None;
        self.loaded = false;
        Ok(())
    }

    #[cfg(feature = "qwen3-tts-backend")]
    #[tracing::instrument(skip(self), fields(text_len = text.len(), voice))]
    fn synthesize(&self, text: &str, voice: &str) -> anyhow::Result<AudioSamples> {
        if !self.loaded {
            anyhow::bail!("Qwen3-TTS not loaded");
        }

        let mut guard = self
            .model
            .lock()
            .map_err(|e| anyhow::anyhow!("Qwen3-TTS model mutex poisoned: {e}"))?;
        let model = guard
            .as_mut()
            .ok_or_else(|| anyhow::anyhow!("Qwen3-TTS engine not initialized"))?;

        let buffer: AudioBuffer = if let Some(name) = voice.strip_prefix(CUSTOM_VOICE_PREFIX) {
            // Resolve the registered clone *before* invoking the model — we
            // hold the read lock only long enough to clone the small
            // `(reference_path, transcript)` pair, then release so a
            // concurrent `register_voice_clone` doesn't block on synthesis.
            let (reference_path, transcript_owned) = {
                let guard = self.voice_clones.read().map_err(|e| {
                    anyhow::anyhow!("Qwen3-TTS voice_clones lock poisoned: {e}")
                })?;
                let entry = guard.iter().find(|e| e.name == name).ok_or_else(|| {
                    anyhow::anyhow!("Qwen3-TTS: no voice clone named '{name}' registered")
                })?;
                (entry.reference_path.clone(), entry.transcript.clone())
            };
            let ref_audio = AudioBuffer::load(&reference_path)
                .map_err(|e| anyhow::anyhow!("Failed to load reference audio: {e}"))?;
            let transcript: Option<&str> = if transcript_owned.is_empty() {
                None
            } else {
                Some(transcript_owned.as_str())
            };
            let prompt = model
                .create_voice_clone_prompt(&ref_audio, transcript)
                .map_err(|e| anyhow::anyhow!("Voice clone prompt build failed: {e}"))?;
            model
                .synthesize_voice_clone(text, &prompt, Language::English, None)
                .map_err(|e| anyhow::anyhow!("Voice clone synthesis failed: {e}"))?
        } else if let Some(speaker_name) = voice.strip_prefix(QWEN3_VOICE_PREFIX) {
            let speaker = parse_speaker(speaker_name)?;
            model
                .synthesize_with_voice(text, speaker, Language::English, None)
                .map_err(|e| anyhow::anyhow!("Qwen3-TTS preset-speaker synthesis failed: {e}"))?
        } else {
            // Empty string or unknown prefix → default voice.
            model
                .synthesize(text, None)
                .map_err(|e| anyhow::anyhow!("Qwen3-TTS default-voice synthesis failed: {e}"))?
        };

        let pcm: Vec<f32> = buffer.samples;
        tracing::info!(
            component = "Qwen3-TTS",
            pcm_samples = pcm.len(),
            duration_secs = pcm.len() as f32 / SAMPLE_RATE as f32,
            "Synthesis complete"
        );

        Ok(AudioSamples {
            data: pcm,
            sample_rate: SAMPLE_RATE,
            channels: 1,
        })
    }

    #[cfg(not(feature = "qwen3-tts-backend"))]
    fn synthesize(&self, _text: &str, _voice: &str) -> anyhow::Result<AudioSamples> {
        anyhow::bail!("Qwen3-TTS requires qwen3-tts-backend feature — not compiled")
    }

    fn memory_usage(&self) -> MemoryFootprint {
        if let Some(ref path) = self.model_path {
            let talker = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
            let codec = path
                .parent()
                .map(|d| d.join("speech_tokenizer").join("model.safetensors"))
                .and_then(|p| std::fs::metadata(&p).ok())
                .map_or(0, |m| m.len());
            MemoryFootprint {
                ram_bytes: talker + codec,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            }
        } else {
            MemoryFootprint::default()
        }
    }

    fn is_loaded(&self) -> bool {
        self.loaded
    }

    fn set_voice_clones(&self, clones: Vec<VoiceCloneEntry>) {
        match self.voice_clones.write() {
            Ok(mut guard) => {
                let count = clones.len();
                *guard = clones;
                tracing::info!(
                    component = "Qwen3-TTS",
                    voice_clones = count,
                    "Voice-clones snapshot refreshed"
                );
            }
            Err(e) => {
                tracing::error!(
                    component = "Qwen3-TTS",
                    error = %e,
                    "Voice-clones lock poisoned — snapshot not applied"
                );
            }
        }
    }
}

/// Resolve a voice-string suffix (`"ryan"`, `"serena"`, ...) to a
/// `qwen3-tts` [`Speaker`] enum variant. Lookup is case-insensitive
/// and tolerates underscores in compound names (`"uncle_fu"` →
/// `Speaker::UncleFu`).
#[cfg(feature = "qwen3-tts-backend")]
fn parse_speaker(name: &str) -> anyhow::Result<Speaker> {
    let normalised = name.to_lowercase();
    match normalised.as_str() {
        "serena" => Ok(Speaker::Serena),
        "vivian" => Ok(Speaker::Vivian),
        "unclefu" | "uncle_fu" => Ok(Speaker::UncleFu),
        "ryan" => Ok(Speaker::Ryan),
        "aiden" => Ok(Speaker::Aiden),
        "onoanna" | "ono_anna" => Ok(Speaker::OnoAnna),
        "sohee" => Ok(Speaker::Sohee),
        "eric" => Ok(Speaker::Eric),
        "dylan" => Ok(Speaker::Dylan),
        other => anyhow::bail!(
            "Unknown Qwen3-TTS speaker '{other}'. \
             Valid: ryan, serena, vivian, uncle_fu, aiden, ono_anna, sohee, eric, dylan."
        ),
    }
}
