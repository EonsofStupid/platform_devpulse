# Sprint: SPRINT-VOICE-PIPELINE

**Date**: 2026-04-02
**Status**: APPROVED
**Research**: `SPRINT-VOICE-PIPELINE.research.md`
**Depends on**: Voice slot scaffolding (committed), model-loader service
**Scope**: Wire ort/rodio/cpal deps, implement all TODO placeholders, coupled lifecycle, signal emission

---

## Locked Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | ort for ALL ONNX models (SNAC, Whisper, Kokoro) | One dep, one API. sherpa-rs deprecated. |
| 2 | rodio for audio playback | High-level, built on cpal, 5.3M downloads, f32 PCM native |
| 3 | cpal for microphone capture | rodio doesn't capture. cpal is the standard. |
| 4 | No sherpa-rs | Deprecated. Official k2-fsa Rust API too unstable. |
| 5 | Orpheus LLM through existing InferenceHandle (llama.cpp) | Already works for text gen. Audio tokens are just different output. |

---

## Phase 1: Dependencies

### 1.1 Add crates to kernel/model-loader/Cargo.toml

- [ ] `ort = { version = "2", features = ["load-dynamic"] }`
- [ ] `ndarray = "0.16"`

### 1.2 Add crates to systems/devpulse-engine/Cargo.toml

- [ ] `rodio = "0.19"`
- [ ] `cpal = "0.15"` (behind feature flag `voice-capture`)

### 1.3 Run cargo check -p model-loader

---

## Phase 2: SNAC Decoder (ort)

### 2.1 Wire ort::Session in SnacDecoder

File: `kernel/model-loader/src/backends/ort/snac.rs`

- [ ] Add `session: Option<ort::Session>` field
- [ ] `load()`: create Session from .onnx file path
- [ ] `decode()`: build 3 ndarray::Array2<i64> inputs, run session, extract f32 output
- [ ] `unload()`: drop session
- [ ] Remove placeholder silence, return real PCM

### 2.2 Verify

- [ ] Unit test: load snac_24khz.onnx, decode dummy codes, get 24576 samples back
- [ ] cargo check -p model-loader

---

## Phase 3: Orpheus Full Pipeline

### 3.1 Wire InferenceHandle into OrpheusTts

File: `kernel/model-loader/src/backends/orpheus.rs`

- [ ] Add `inference: Option<InferenceHandle>` field
- [ ] `load()`: receive InferenceHandle from BackendPool, load GGUF
- [ ] `synthesize()` full pipeline:
  1. `format_prompt(text, voice)` → prompt string
  2. `inference.generate(prompt, max_tokens=2048, temperature=0.6)` → token stream
  3. Collect tokens, find CODE_START_TOKEN_ID
  4. Filter audio tokens (>= CODE_TOKEN_OFFSET), stop at END_TOKEN_IDS
  5. Group into 7-per-frame chunks
  6. `redistribute_codes()` → (codes0, codes1, codes2)
  7. Chunk into SNAC windows (12+24+48 per window)
  8. `snac.decode()` per window → Vec<AudioSamples>
  9. Concatenate PCM across windows
  10. Return AudioSamples

### 3.2 Streaming support

- [ ] First decode after MIN_FRAMES_BEFORE_DECODE (4 frames = 28 tokens)
- [ ] Subsequent decodes per SNAC window (84 tokens)
- [ ] Fade crossover at chunk boundaries (5-10ms)

### 3.3 Verify

- [ ] Integration test: load Orpheus GGUF + SNAC ONNX, synthesize "hello", get non-silence PCM
- [ ] cargo check -p model-loader

---

## Phase 4: Coupled Lifecycle

### 4.1 Cascade load in ModelLoaderService

File: `kernel/model-loader/src/service.rs`

- [ ] When `load_slot(slot_id)` is called:
  1. Check slot's `requires` Vec
  2. For each required slot, if not loaded, load it first
  3. Check slot's `loading` — if `Coupled { parent }`, skip (parent triggers)
- [ ] When loading a slot with `requires`:
  1. Load self
  2. For each slot in registry where `loading == Coupled { parent: self.id }`, load that too

### 4.2 Cascade unload

- [ ] When `unload_slot(slot_id)`:
  1. Find all slots where `loading == Coupled { parent: slot_id }`
  2. Unload children first, then parent

### 4.3 Verify

- [ ] Loading voice.tts.primary auto-loads voice.snac
- [ ] Unloading voice.tts.primary auto-unloads voice.snac
- [ ] cargo check -p model-loader

---

## Phase 5: Audio Playback (rodio)

### 5.1 Create audio playback service

File: `systems/devpulse-engine/src/platform/services/audio.rs`

- [ ] `AudioService` struct wrapping rodio `OutputStream` + `Sink`
- [ ] `play(samples: AudioSamples)` — creates SamplesBuffer, appends to sink
- [ ] `stop()` — clears sink
- [ ] `is_playing()` → bool
- [ ] Thread-safe: Arc<Mutex<Sink>> or flume channel pattern

### 5.2 Wire into Platform

- [ ] Add AudioService to Platform struct
- [ ] Init in boot (after platform ready, before model loading)
- [ ] Expose via Tauri command: `speak(text, voice)` → invokes TTS + playback

### 5.3 Tauri command

File: `interfaces/desktop/src-tauri/src/commands/voice/mod.rs`

- [ ] `speak(text: String, voice: Option<String>)` → Result<(), String>
- [ ] `stop_speaking()` → Result<(), String>
- [ ] `is_speaking()` → Result<bool, String>

### 5.4 Verify

- [ ] Tauri command invokes TTS → PCM → speakers
- [ ] cargo check -p devpulse-engine
- [ ] cargo check -p devpulse_desktop_backend

---

## Phase 6: Microphone Capture (cpal)

### 6.1 Create capture service

File: `systems/devpulse-engine/src/platform/services/microphone.rs`

- [ ] `MicrophoneService` struct wrapping cpal input stream
- [ ] `start_capture()` → begins writing PCM to a ring buffer
- [ ] `stop_capture()` → returns AudioSamples from buffer
- [ ] Resample to 16kHz if device sample rate differs (Whisper needs 16kHz)
- [ ] Thread-safe: flume channel for PCM chunks

### 6.2 Wire VAD (future)

- [ ] Placeholder: manual start/stop for now
- [ ] Future: Silero VAD ONNX model triggers start/stop automatically

### 6.3 Tauri commands

- [ ] `start_listening()` → starts capture
- [ ] `stop_listening()` → stops capture, runs Whisper STT, returns text

### 6.4 Verify

- [ ] Capture → Whisper → text round-trip works
- [ ] cargo check

---

## Phase 7: Signal Emission

### 7.1 Emit speech.requested from chat

File: `systems/devpulse-engine/src/platform/integrations/events.rs`

- [ ] When chat response arrives and TTS is enabled:
  emit `EngineSignal::SpeechRequested { text, voice }` on broadcast channel
- [ ] ModelLoaderService subscribes: loads voice.tts.primary if Signal("speech.requested") matches

### 7.2 Emit voice.activated from frontend

- [ ] Frontend "Voice Active" button click → Tauri command → emit `voice.activated` signal
- [ ] Loads voice.stt slot

### 7.3 Wire EventBridge

- [ ] Route `SpeechRequested` to Chat window
- [ ] Route `VoiceActivated` to relevant windows

---

## Phase 8: Whisper + Kokoro Implementation

### 8.1 Whisper via ort

File: `kernel/model-loader/src/backends/ort/whisper.rs`

- [ ] Load encoder.onnx + decoder.onnx as two Sessions
- [ ] Compute mel spectrogram from PCM (need mel feature extraction)
- [ ] Run encoder → decoder loop with beam search or greedy
- [ ] Detokenize output IDs using tokens.txt

### 8.2 Kokoro via ort

File: `kernel/model-loader/src/backends/ort/kokoro.rs`

- [ ] Load kokoro.onnx as Session
- [ ] Tokenize input text (Kokoro uses espeak phonemes or similar)
- [ ] Run inference → PCM output
- [ ] Return AudioSamples

---

## Execution Order

1. Phase 1 (deps) — unblocks everything
2. Phase 2 (SNAC) — needed by Phase 3
3. Phase 4 (coupled lifecycle) — needed for auto-loading SNAC with Orpheus
4. Phase 3 (Orpheus pipeline) — the primary TTS path
5. Phase 5 (rodio playback) — hear the output
6. Phase 7 (signals) — trigger from chat
7. Phase 6 (microphone) — STT input
8. Phase 8 (Whisper + Kokoro) — secondary voice paths

---

## Gate

- [ ] `cargo check -p model-loader` — 0 errors
- [ ] `cargo check -p devpulse-engine` — 0 errors
- [ ] `cargo check -p devpulse_desktop_backend` — 0 errors
- [ ] Orpheus TTS produces non-silence PCM from text input
- [ ] SNAC decodes 3-codebook input to 24kHz waveform
- [ ] rodio plays PCM through speakers
- [ ] Coupled lifecycle: loading voice.tts.primary auto-loads voice.snac
- [ ] Signal: chat response triggers speech.requested
