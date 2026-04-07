//! Whisper STT via ONNX Runtime — speech-to-text transcription.
//!
//! Runs Whisper encoder + decoder ONNX models directly through ort.
//! Pattern matches SNAC decoder (`snac.rs`) — gold standard for ort usage.
//!
//! Model directory structure:
//!   - `encoder.onnx` (or `*-encoder.onnx`)
//!   - `decoder.onnx` (or `*-decoder.onnx`)
//!   - `tokens.txt` — vocabulary (one token per line)
//!
//! Input: PCM f32, 16kHz mono (Whisper's native sample rate)
//! Pipeline: audio → mel spectrogram → encoder → decoder (autoregressive) → text

use crate::backends::voice::{AudioSamples, SttBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};
#[cfg(feature = "ort-backend")]
use std::sync::Mutex;

/// Whisper expects 16kHz input audio.
#[cfg(feature = "ort-backend")]
const WHISPER_SAMPLE_RATE: u32 = 16000;
/// Number of mel filterbank channels.
#[cfg(feature = "ort-backend")]
const N_MELS: usize = 80;
/// FFT window size in samples (25ms at 16kHz).
#[cfg(feature = "ort-backend")]
const N_FFT: usize = 400;
/// Hop length in samples (10ms at 16kHz).
#[cfg(feature = "ort-backend")]
const HOP_LENGTH: usize = 160;
/// Maximum audio length in frames (30 seconds).
#[cfg(feature = "ort-backend")]
const MAX_FRAMES: usize = 3000;
/// SOT (start of transcript) token ID.
#[cfg(feature = "ort-backend")]
const SOT_TOKEN: i64 = 50258;
/// EOT (end of transcript) token ID.
#[cfg(feature = "ort-backend")]
const EOT_TOKEN: i64 = 50257;
/// Maximum decoder steps to prevent infinite loop.
#[cfg(feature = "ort-backend")]
const MAX_DECODE_STEPS: usize = 448;

/// Whisper STT backed by ort (ONNX Runtime).
pub struct WhisperStt {
    /// Path to the model directory.
    model_path: Option<PathBuf>,
    /// Whether encoder + decoder are loaded.
    loaded: bool,
    /// Token vocabulary (index → string).
    tokens: Vec<String>,
    /// ONNX Runtime encoder session.
    #[cfg(feature = "ort-backend")]
    encoder: Mutex<Option<ort::session::Session>>,
    /// ONNX Runtime decoder session.
    #[cfg(feature = "ort-backend")]
    decoder: Mutex<Option<ort::session::Session>>,
}

impl WhisperStt {
    /// Create a new Whisper STT instance (unloaded).
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
            tokens: Vec::new(),
            #[cfg(feature = "ort-backend")]
            encoder: Mutex::new(None),
            #[cfg(feature = "ort-backend")]
            decoder: Mutex::new(None),
        }
    }
}

impl Default for WhisperStt {
    fn default() -> Self {
        Self::new()
    }
}

impl SttBackend for WhisperStt {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "Whisper STT",
            "Loading Whisper STT model"
        );

        if !path.exists() {
            anyhow::bail!("Whisper model not found: {}", path.display());
        }

        #[cfg(feature = "ort-backend")]
        {
            if path.is_dir() {
                // Directory mode: find encoder + decoder + tokens
                let encoder_path = find_onnx_file(path, "encoder")?;
                let decoder_path = find_onnx_file(path, "decoder")?;
                let tokens_path = path.join("tokens.txt");

                if !tokens_path.exists() {
                    anyhow::bail!(
                        "Whisper model directory missing tokens.txt: {}",
                        path.display()
                    );
                }

                // Load token vocabulary
                let tokens_content = std::fs::read_to_string(&tokens_path)
                    .map_err(|e| anyhow::anyhow!("Failed to read tokens.txt: {e}"))?;
                self.tokens = tokens_content.lines().map(|l| l.to_string()).collect();
                tracing::debug!(
                    component = "Whisper STT",
                    vocab_size = self.tokens.len(),
                    "Token vocabulary loaded"
                );

                // Create encoder session
                let enc_session = ort::session::Session::builder()
                    .map_err(|e| anyhow::anyhow!("Failed to create encoder SessionBuilder: {e}"))?
                    .commit_from_file(&encoder_path)
                    .map_err(|e| anyhow::anyhow!("Failed to load Whisper encoder: {e}"))?;

                tracing::debug!(
                    component = "Whisper STT",
                    encoder_inputs = ?enc_session.inputs().iter().map(|i| i.name()).collect::<Vec<_>>(),
                    encoder_outputs = ?enc_session.outputs().iter().map(|o| o.name()).collect::<Vec<_>>(),
                    "Encoder session created"
                );

                *self.encoder.lock()
                    .map_err(|e| anyhow::anyhow!("Encoder mutex poisoned: {e}"))? = Some(enc_session);

                // Create decoder session
                let dec_session = ort::session::Session::builder()
                    .map_err(|e| anyhow::anyhow!("Failed to create decoder SessionBuilder: {e}"))?
                    .commit_from_file(&decoder_path)
                    .map_err(|e| anyhow::anyhow!("Failed to load Whisper decoder: {e}"))?;

                tracing::debug!(
                    component = "Whisper STT",
                    decoder_inputs = ?dec_session.inputs().iter().map(|i| i.name()).collect::<Vec<_>>(),
                    decoder_outputs = ?dec_session.outputs().iter().map(|o| o.name()).collect::<Vec<_>>(),
                    "Decoder session created"
                );

                *self.decoder.lock()
                    .map_err(|e| anyhow::anyhow!("Decoder mutex poisoned: {e}"))? = Some(dec_session);
            } else {
                anyhow::bail!(
                    "Whisper STT requires a model directory (with encoder.onnx + decoder.onnx + tokens.txt), got file: {}",
                    path.display()
                );
            }
        }

        #[cfg(not(feature = "ort-backend"))]
        anyhow::bail!(
            "ort-backend feature not compiled — cannot load Whisper STT. \
             Enable 'ort-backend' feature in model-loader Cargo.toml."
        );

        #[cfg(feature = "ort-backend")]
        {
            let size = dir_size(path);
            self.model_path = Some(path.to_path_buf());
            self.loaded = true;

            tracing::info!(
                component = "Whisper STT",
                size_mb = size / (1024 * 1024),
                "Whisper STT loaded"
            );

            Ok(MemoryFootprint {
                ram_bytes: size,
                vram_bytes: 0,
            })
        }
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        tracing::info!(component = "Whisper STT", "Unloading Whisper STT");
        #[cfg(feature = "ort-backend")]
        {
            *self.encoder.lock()
                .map_err(|e| anyhow::anyhow!("Encoder mutex poisoned: {e}"))? = None;
            *self.decoder.lock()
                .map_err(|e| anyhow::anyhow!("Decoder mutex poisoned: {e}"))? = None;
        }
        self.model_path = None;
        self.loaded = false;
        self.tokens.clear();
        Ok(())
    }

    #[cfg(feature = "ort-backend")]
    #[tracing::instrument(skip(self, samples), fields(sample_count = samples.data.len(), sample_rate = samples.sample_rate))]
    fn transcribe(&self, samples: &AudioSamples) -> anyhow::Result<String> {
        if !self.loaded {
            anyhow::bail!("Whisper STT not loaded");
        }

        tracing::debug!(
            component = "Whisper STT",
            sample_count = samples.data.len(),
            sample_rate = samples.sample_rate,
            "Transcribing audio"
        );

        // Resample to 16kHz if needed
        let audio_16k = if samples.sample_rate != WHISPER_SAMPLE_RATE {
            resample(&samples.data, samples.sample_rate, WHISPER_SAMPLE_RATE)
        } else {
            samples.data.clone()
        };

        // Compute log-mel spectrogram
        let mel = compute_mel_spectrogram(&audio_16k)?;

        // Run encoder
        let mut enc_guard = self.encoder.lock()
            .map_err(|e| anyhow::anyhow!("Encoder mutex poisoned: {e}"))?;
        let encoder = enc_guard.as_mut()
            .ok_or_else(|| anyhow::anyhow!("Whisper encoder session not initialized"))?;

        let mel_tensor = ndarray::Array3::<f32>::from_shape_vec(
            (1, N_MELS, mel.len() / N_MELS),
            mel,
        ).map_err(|e| anyhow::anyhow!("Failed to create mel tensor: {e}"))?;

        let mel_value = ort::value::Value::from_array(mel_tensor)
            .map_err(|e| anyhow::anyhow!("Failed to create ort Value for mel: {e}"))?;

        let enc_outputs = encoder
            .run(ort::inputs![mel_value])
            .map_err(|e| anyhow::anyhow!("Whisper encoder inference failed: {e}"))?;

        // Extract encoder hidden states
        let hidden_states = &enc_outputs[0];

        // Run decoder autoregressively
        let mut dec_guard = self.decoder.lock()
            .map_err(|e| anyhow::anyhow!("Decoder mutex poisoned: {e}"))?;
        let decoder = dec_guard.as_mut()
            .ok_or_else(|| anyhow::anyhow!("Whisper decoder session not initialized"))?;

        let mut token_ids: Vec<i64> = vec![SOT_TOKEN];
        let mut decoded_text = String::new();

        for step in 0..MAX_DECODE_STEPS {
            let input_ids = ndarray::Array2::<i64>::from_shape_vec(
                (1, token_ids.len()),
                token_ids.clone(),
            ).map_err(|e| anyhow::anyhow!("Failed to create decoder input tensor: {e}"))?;

            let v_ids = ort::value::Value::from_array(input_ids)
                .map_err(|e| anyhow::anyhow!("Failed to create ort Value for decoder input: {e}"))?;

            // Clone encoder hidden states for each decoder step
            let v_hidden = hidden_states.clone();

            let dec_outputs = decoder
                .run(ort::inputs![v_ids, v_hidden])
                .map_err(|e| anyhow::anyhow!("Whisper decoder step {step} failed: {e}"))?;

            // Get logits and take argmax for greedy decoding
            let logits = dec_outputs[0]
                .try_extract_tensor::<f32>()
                .map_err(|e| anyhow::anyhow!("Failed to extract decoder logits: {e}"))?;

            let logits_slice = logits.1;

            // Argmax over the last position's vocabulary
            let vocab_size = self.tokens.len();
            let last_pos_start = logits_slice.len().saturating_sub(vocab_size);
            let last_logits = &logits_slice[last_pos_start..];

            let next_token = last_logits
                .iter()
                .enumerate()
                .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
                .map(|(idx, _)| idx as i64)
                .unwrap_or(EOT_TOKEN);

            if next_token == EOT_TOKEN {
                break;
            }

            // Detokenize
            if let Some(token_str) = self.tokens.get(next_token as usize) {
                decoded_text.push_str(token_str);
            }

            token_ids.push(next_token);
        }

        let trimmed = decoded_text.trim().to_string();
        tracing::info!(
            component = "Whisper STT",
            text_len = trimmed.len(),
            tokens = token_ids.len() - 1,
            "Transcription complete"
        );

        Ok(trimmed)
    }

    #[cfg(not(feature = "ort-backend"))]
    fn transcribe(&self, _samples: &AudioSamples) -> anyhow::Result<String> {
        anyhow::bail!("Whisper STT requires ort-backend feature — not compiled")
    }

    fn memory_usage(&self) -> MemoryFootprint {
        if let Some(ref path) = self.model_path {
            let size = dir_size(path);
            MemoryFootprint {
                ram_bytes: size,
                vram_bytes: 0,
            }
        } else {
            MemoryFootprint::default()
        }
    }

    fn is_loaded(&self) -> bool {
        self.loaded
    }
}

/// Find an ONNX file in a directory by name pattern.
#[cfg(feature = "ort-backend")]
fn find_onnx_file(dir: &Path, pattern: &str) -> anyhow::Result<PathBuf> {
    let entries = std::fs::read_dir(dir)
        .map_err(|e| anyhow::anyhow!("Failed to read Whisper model directory: {e}"))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("onnx") {
            let name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
            if name.contains(pattern) {
                return Ok(path);
            }
        }
    }

    anyhow::bail!(
        "No *{pattern}*.onnx file found in {}",
        dir.display()
    )
}

/// Compute log-mel spectrogram from PCM audio.
///
/// Standard Whisper preprocessing: STFT → mel filterbank → log scale.
/// Simplified implementation — no external DSP crate needed.
#[cfg(feature = "ort-backend")]
fn compute_mel_spectrogram(audio: &[f32]) -> anyhow::Result<Vec<f32>> {
    let n_frames = (audio.len() / HOP_LENGTH).min(MAX_FRAMES);
    if n_frames == 0 {
        anyhow::bail!("Audio too short for mel spectrogram computation");
    }

    // Pre-allocate mel output: [N_MELS, n_frames]
    let mut mel = vec![0.0f32; N_MELS * n_frames];

    // Hann window
    let window: Vec<f32> = (0..N_FFT)
        .map(|i| {
            0.5 * (1.0 - (2.0 * std::f32::consts::PI * i as f32 / N_FFT as f32).cos())
        })
        .collect();

    // Mel filterbank (simplified: linearly spaced in mel scale)
    let mel_filters = build_mel_filterbank(N_MELS, N_FFT / 2 + 1, WHISPER_SAMPLE_RATE as f32);

    for frame_idx in 0..n_frames {
        let start = frame_idx * HOP_LENGTH;
        let end = (start + N_FFT).min(audio.len());

        // Windowed frame
        let mut windowed = vec![0.0f32; N_FFT];
        for i in 0..(end - start) {
            windowed[i] = audio[start + i] * window[i];
        }

        // DFT magnitude (real-valued FFT approximation)
        let n_freq = N_FFT / 2 + 1;
        let mut magnitudes = vec![0.0f32; n_freq];
        for k in 0..n_freq {
            let mut re = 0.0f32;
            let mut im = 0.0f32;
            for n in 0..N_FFT {
                let angle = -2.0 * std::f32::consts::PI * k as f32 * n as f32 / N_FFT as f32;
                re += windowed[n] * angle.cos();
                im += windowed[n] * angle.sin();
            }
            magnitudes[k] = (re * re + im * im).sqrt();
        }

        // Apply mel filterbank
        for mel_idx in 0..N_MELS {
            let mut energy = 0.0f32;
            for freq_idx in 0..n_freq {
                energy += mel_filters[mel_idx * n_freq + freq_idx] * magnitudes[freq_idx];
            }
            // Log scale with floor to prevent -inf
            mel[mel_idx * n_frames + frame_idx] = (energy.max(1e-10)).ln();
        }
    }

    Ok(mel)
}

/// Build a mel filterbank matrix.
///
/// Returns [N_MELS * n_freq] flat array.
#[cfg(feature = "ort-backend")]
fn build_mel_filterbank(n_mels: usize, n_freq: usize, sample_rate: f32) -> Vec<f32> {
    let f_min = 0.0f32;
    let f_max = sample_rate / 2.0;

    // Hz to mel
    let hz_to_mel = |f: f32| -> f32 { 2595.0 * (1.0 + f / 700.0).log10() };
    let mel_to_hz = |m: f32| -> f32 { 700.0 * (10.0f32.powf(m / 2595.0) - 1.0) };

    let mel_min = hz_to_mel(f_min);
    let mel_max = hz_to_mel(f_max);

    // Linearly spaced mel points
    let mel_points: Vec<f32> = (0..=n_mels + 1)
        .map(|i| mel_min + (mel_max - mel_min) * i as f32 / (n_mels + 1) as f32)
        .collect();

    // Convert back to Hz and then to FFT bin indices
    let freq_per_bin = sample_rate / (2.0 * (n_freq - 1) as f32);
    let bins: Vec<f32> = mel_points
        .iter()
        .map(|&m| mel_to_hz(m) / freq_per_bin)
        .collect();

    let mut filters = vec![0.0f32; n_mels * n_freq];

    for m in 0..n_mels {
        let left = bins[m];
        let center = bins[m + 1];
        let right = bins[m + 2];

        for k in 0..n_freq {
            let freq = k as f32;
            if freq >= left && freq <= center {
                filters[m * n_freq + k] = (freq - left) / (center - left).max(1e-10);
            } else if freq > center && freq <= right {
                filters[m * n_freq + k] = (right - freq) / (right - center).max(1e-10);
            }
        }
    }

    filters
}

/// Simple linear resampling.
#[cfg(feature = "ort-backend")]
fn resample(audio: &[f32], from_rate: u32, to_rate: u32) -> Vec<f32> {
    if from_rate == to_rate {
        return audio.to_vec();
    }
    let ratio = to_rate as f64 / from_rate as f64;
    let new_len = (audio.len() as f64 * ratio) as usize;
    let mut resampled = Vec::with_capacity(new_len);
    for i in 0..new_len {
        let src_pos = i as f64 / ratio;
        let idx = src_pos as usize;
        let frac = src_pos - idx as f64;
        let sample = if idx + 1 < audio.len() {
            audio[idx] * (1.0 - frac as f32) + audio[idx + 1] * frac as f32
        } else if idx < audio.len() {
            audio[idx]
        } else {
            0.0
        };
        resampled.push(sample);
    }
    resampled
}

/// Recursively compute directory size in bytes.
fn dir_size(path: &Path) -> u64 {
    if path.is_file() {
        return std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    }
    std::fs::read_dir(path)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .map(|e| {
                    let p = e.path();
                    if p.is_dir() {
                        dir_size(&p)
                    } else {
                        std::fs::metadata(&p).map(|m| m.len()).unwrap_or(0)
                    }
                })
                .sum()
        })
        .unwrap_or(0)
}
