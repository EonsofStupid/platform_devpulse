# SPRINT: Voice Pipeline — Clyffy Speaks & Listens

> **Status**: PLAN — Owner approval required
> **Research**: [SPRINT-VOICE-VISION.research.md](SPRINT-VOICE-VISION.research.md)
> **Depends on**: Model tier architecture (DONE), EventFacade (DONE)
> **Goal**: Clyffy speaks responses aloud (TTS) and listens to voice input (STT)

---

## What Gets Built

1. **Kokoro TTS inference** — text in, 24kHz audio out, voice-selectable
2. **Whisper STT inference** — microphone in, transcript text out
3. **Audio playback** — PCM → WebAudio in the Tauri webview
4. **Microphone capture** — cpal → resample → VAD → Whisper
5. **Voice config UI** — pick male/female voice, preview, speed control

---

## Crate Dependencies (New)

| Crate | Version | Purpose | Size Impact |
|-------|---------|---------|-------------|
| `ort` | 2.0.0-rc.12 | ONNX Runtime (already in kernel) | 0 (existing) |
| `ndarray-npy` | 0.9+ | Read voices-v1.0.bin npz | ~50 KB |
| `zip` | 2.x | npz is a zip archive | ~200 KB |
| `hound` | 3.5+ | WAV encoding for playback | ~30 KB |
| `sherpa-onnx` | 1.12+ | Full Whisper pipeline (mel + decode + VAD) | ~5 MB (static link) |
| `cpal` | 0.16 | Microphone capture | ~100 KB |
| `rubato` | 0.10+ | Audio resampling (48kHz→16kHz) | ~200 KB |

**Decision point**: sherpa-onnx vs raw ort for Whisper.

- **sherpa-onnx**: Handles mel spectrogram, KV cache, token decode, VAD. Battle-tested. But adds ~5MB static C++ library and brings its own ONNX Runtime.
- **Raw ort**: We already have ort. But requires implementing mel spectrogram (mel_spec crate), autoregressive decoder loop with KV cache, and token decoding manually.

**Recommendation**: Use `sherpa-onnx` for STT. The decoder loop is complex (12-layer KV cache management, special token handling, beam search). Reimplementing it is 500+ lines of tricky code. sherpa-onnx is production-grade and handles edge cases.

For TTS (Kokoro), use raw `ort` — the inference is a single forward pass, no loop.

---

## PHASE 1: Kokoro TTS Inference (Rust Kernel)

### Files
- `kernel/model-loader/src/backends/ort/kokoro.rs` — REWRITE from stub
- `kernel/model-loader/Cargo.toml` — add `ndarray-npy`, `zip`, `hound`

### Implementation

The stub currently sets `loaded = true` and returns silence. Replace with:

1. **Load ONNX session** from `model_quantized.onnx`
2. **Load voice embeddings** from `voices-v1.0.bin` (npz → HashMap<String, Array3<f32>>)
3. **Phonemize** input text → IPA phoneme string → token IDs via vocabulary lookup
4. **Inference**: `input_ids=[0,...tokens...,0]`, `style=voice[len(tokens)]`, `speed=[1]`
5. **Output**: f32 PCM at 24kHz

### Phonemization Strategy

Ship misaki's `us_gold.json` dictionary (~2 MB) as a bundled resource. Pure lookup:
```rust
// word → IPA string → char-by-char → token IDs via VOCAB HashMap
fn phonemize(text: &str, dict: &HashMap<String, String>) -> Vec<i64> {
    text.split_whitespace()
        .flat_map(|word| {
            let ipa = dict.get(&word.to_lowercase())
                .map(|s| s.as_str())
                .unwrap_or(word); // unknown words passed through
            ipa.chars()
                .filter_map(|c| VOCAB.get(&c).copied())
                .chain(std::iter::once(16)) // space token between words
        })
        .collect()
}
```

### Tensor Spec (from research)

| Input | Name | Shape | Dtype |
|-------|------|-------|-------|
| Tokens | `"input_ids"` | `[1, N+2]` | i64 |
| Style | `"style"` | `[1, 256]` | f32 |
| Speed | `"speed"` | `[1]` | i32 |

Output: flat `f32` PCM, 24kHz mono.

### Voice Selection

`voices-v1.0.bin` is npz with 54 keys, each `[511, 1, 256]` f32.
Index by phoneme token count (before padding): `voice_data[token_count][0]` → `[f32; 256]`.

### Task Checklist
- [ ] 1.1: Add `ndarray-npy`, `zip`, `hound` to kernel/model-loader/Cargo.toml
- [ ] 1.2: Download `us_gold.json` from hexgrad/misaki, place in models/voice/kokoro/
- [ ] 1.3: Implement VOCAB HashMap (113 entries, from research)
- [ ] 1.4: Implement npz voice loading
- [ ] 1.5: Implement phonemization (dictionary lookup → token IDs)
- [ ] 1.6: Implement ort inference (single forward pass)
- [ ] 1.7: Implement WAV encoding via hound
- [ ] 1.8: Wire into `TtsBackend::synthesize()` — replace silence stub
- [ ] 1.9: `cargo check -p model-loader`
- [ ] 1.10: Test: load kokoro model → synthesize "Hello world" → WAV file on disk

**Gate**: `synthesize("Hello world")` returns real audio, not silence.

---

## PHASE 2: Audio Playback in Frontend

### Files
- `interfaces/desktop/src/lib/domains/app/models/services/voice.service.ts` — NEW
- Tauri command for TTS: `synthesize_speech` → returns base64 WAV or f32 array

### Implementation

**Rust side**: New Tauri command `synthesize_speech(text, voice_id, speed)`:
```rust
#[tauri::command]
async fn synthesize_speech(
    state: State<'_, PlatformState>,
    text: String,
    voice_id: String,
    speed: f32,
) -> Result<Vec<u8>, String> {
    // Get TTS from model loader
    // Synthesize → f32 PCM
    // Encode as WAV bytes via hound
    // Return WAV bytes
}
```

**Frontend side**: Web Audio API playback:
```typescript
async function playTts(text: string, voiceId: string, speed: number) {
    const wavBytes = await commands.synthesizeSpeech(text, voiceId, speed);
    const blob = new Blob([new Uint8Array(wavBytes)], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
}
```

### Task Checklist
- [ ] 2.1: Add `synthesize_speech` Tauri command
- [ ] 2.2: Wire to ModelLoaderService → TtsBackend
- [ ] 2.3: Create voice.service.ts in frontend
- [ ] 2.4: Implement Web Audio playback
- [ ] 2.5: Test: click "speak" → hear Clyffy's voice

**Gate**: Type text, click speak, hear audio.

---

## PHASE 3: Whisper STT Inference

### Decision: sherpa-onnx vs raw ort

**Use sherpa-onnx crate.** Rationale:
- Handles mel spectrogram, KV cache, decoder loop, token decode
- Battle-tested with these exact model files
- Built-in Silero VAD
- 500+ lines of complex code we don't have to write or maintain

### Files
- `kernel/model-loader/src/backends/ort/whisper.rs` — REWRITE from stub
- `kernel/model-loader/Cargo.toml` — add `sherpa-onnx`

### Implementation

Replace the stub with sherpa-onnx recognizer:
```rust
use sherpa_onnx::{OfflineRecognizer, OfflineRecognizerConfig, OfflineWhisperModelConfig};

pub struct WhisperStt {
    recognizer: Option<OfflineRecognizer>,
    loaded: bool,
}

impl SttBackend for WhisperStt {
    fn load(&mut self, model_dir: &Path) -> Result<()> {
        let mut config = OfflineRecognizerConfig::default();
        config.model_config.whisper = OfflineWhisperModelConfig {
            encoder: Some(model_dir.join("small-encoder.int8.onnx").to_string_lossy().into()),
            decoder: Some(model_dir.join("small-decoder.int8.onnx").to_string_lossy().into()),
            ..Default::default()
        };
        config.model_config.tokens = Some(model_dir.join("small-tokens.txt").to_string_lossy().into());
        config.model_config.num_threads = 4;
        self.recognizer = Some(OfflineRecognizer::create(&config)?);
        self.loaded = true;
        Ok(())
    }

    fn transcribe(&self, audio: &[f32], sample_rate: u32) -> Result<String> {
        let recognizer = self.recognizer.as_ref().ok_or(anyhow!("not loaded"))?;
        let stream = recognizer.create_stream();
        stream.accept_waveform(sample_rate as i32, audio);
        recognizer.decode(&stream);
        Ok(stream.get_result()?.text)
    }
}
```

### Task Checklist
- [ ] 3.1: Add `sherpa-onnx` to kernel/model-loader/Cargo.toml (behind feature flag)
- [ ] 3.2: Rewrite WhisperStt to use sherpa-onnx OfflineRecognizer
- [ ] 3.3: Test: load model → transcribe WAV → text output
- [ ] 3.4: `cargo check -p model-loader`

**Gate**: `transcribe(audio_samples)` returns real text, not empty string.

---

## PHASE 4: Microphone Capture + VAD

### Files
- `kernel/model-loader/Cargo.toml` — add `cpal`, `rubato`
- NEW: `systems/devpulse-engine/src/platform/services/audio_capture.rs`

### Implementation

1. `cpal` captures from default mic (likely 48kHz stereo)
2. Downmix to mono, resample to 16kHz via `rubato`
3. Silero VAD (via sherpa-onnx built-in) detects speech boundaries
4. On speech end → send accumulated buffer to Whisper

### Task Checklist
- [ ] 4.1: Add `cpal`, `rubato` to engine Cargo.toml
- [ ] 4.2: Implement AudioCapture service (mic → resampled f32 mono)
- [ ] 4.3: Integrate VAD for speech boundary detection
- [ ] 4.4: Wire: VAD end → transcribe → emit SurfaceEvent with text
- [ ] 4.5: Tauri command: `start_listening()`, `stop_listening()`

**Gate**: Speak into mic → text appears in UI.

---

## PHASE 5: Voice Configuration UI

### Files
- NEW: Voice settings panel in model-loader or voice-lab window
- Frontend components for voice picker, preview, speed slider

### Features
- Dropdown: 54 built-in voices grouped by language + gender
- Preview button: synthesize "Hello, I'm Clyffy" with selected voice
- Speed slider: 0.5x – 2.0x
- Save preference to config (voice.tts slot extension: `voice_profile`)

### Suggested Default Voices

| Preset | Voice ID | Name | Gender |
|--------|----------|------|--------|
| Default | `af_heart` | Heart | Female (American) |
| Male | `am_adam` | Adam | Male (American) |
| British F | `bf_emma` | Emma | Female (British) |
| British M | `bm_george` | George | Male (British) |

### Task Checklist
- [ ] 5.1: Voice picker component (dropdown grouped by language/gender)
- [ ] 5.2: Preview button (synthesize short phrase)
- [ ] 5.3: Speed slider
- [ ] 5.4: Persist selection in slot extensions
- [ ] 5.5: Wire chat UI: option to read responses aloud

**Gate**: Pick voice → preview → hear different voice → save preference.

---

## PHASE 6: Voice Blending + Custom Voices (Future)

Not in this sprint. Documented for next iteration:

- **Blending slider**: weighted average of two voice embeddings
- **MP3 upload for cloning**: KokoClone pipeline (~100 MB Kanade model download)
- **Voice evolution**: KVoiceWalk optimization (20-30s reference WAV → custom embedding)
- **Save custom presets**: store as `(511, 1, 256)` f32 tensors in user data

---

## Model Files Needed

Before this sprint can execute, download to `models/voice/`:

```
models/voice/kokoro/
  model_quantized.onnx    # 92 MB — https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
  voices-v1.0.bin         # ~2 MB — https://github.com/thewh1teagle/kokoro-onnx/releases
  us_gold.json            # ~2 MB — https://github.com/hexgrad/misaki (English phoneme dict)

models/voice/whisper-small/
  small-encoder.int8.onnx # 112 MB — https://huggingface.co/csukuangfj/sherpa-onnx-whisper-small
  small-decoder.int8.onnx # 262 MB — https://huggingface.co/csukuangfj/sherpa-onnx-whisper-small
  small-tokens.txt        # 817 KB — same repo
```

---

## Execution Order

```
Phase 1 (Kokoro TTS)  → Phase 2 (Audio Playback) → Phase 5 (Voice UI)
      2-3 hours              1-2 hours                1-2 hours
                                    
Phase 3 (Whisper STT) → Phase 4 (Mic Capture + VAD)
      2-3 hours              2-3 hours
```

Phases 1-2 and 3-4 can run in parallel — TTS and STT are independent pipelines.

**Total: ~10-14 hours. Clyffy speaks after Phase 2. Clyffy listens after Phase 4.**
