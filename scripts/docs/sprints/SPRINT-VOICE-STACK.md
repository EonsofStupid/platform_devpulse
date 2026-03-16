# SPRINT: Voice Stack — Sayna + Kokoros + Piper-RS + eSpeak-NG

**Date**: 2026-03-16
**Priority**: CRITICAL — platform ships with voice as a core service
**Owner**: Maestro kernel (Clyffy orchestrates all voice services)
**Status**: PLANNED — pending owner approval

---

## Vision

DevPulse ships with **voice-to-voice, text-to-speech, and speech-to-text** as first-class platform services. The user assigns default male/female voices, trains custom voices from MP3 files, and all AI interactions (Clyffy, minions) can speak and listen.

This is NOT optional. Voice is a core service under `[services.system.voice]`.

---

## Architecture

```
Maestro (Clyffy)
  ├── Sayna          — real-time voice server (STT + TTS routing)
  ├── Kokoros         — Kokoro 87M ONNX model inference (TTS engine)
  ├── piper-rs        — Piper TTS models (alternative/additional voices)
  ├── espeak-rs       — phoneme generation for Kokoros/Piper
  ├── espeak-ng       — system C library (pre-installed, not built from source)
  └── Voice Trainer   — custom voice training from MP3 files
```

### Owned Repos (all in deps/)
| Repo | URL | Purpose |
|------|-----|---------|
| sayna | github.com/EonsofStupid/sayna | Voice server — STT/TTS routing |
| kokoros | github.com/EonsofStupid/Kokoros | Kokoro 87M TTS inference |
| piper-rs | github.com/EonsofStupid/piper-rs | Piper TTS + espeak-rs + espeak-rs-sys |
| espeak-ng | github.com/EonsofStupid/espeak-ng | C library fork |
| espeak-ng-sapi | github.com/EonsofStupid/espeak-ng-sapi | Windows SAPI integration |
| ort | github.com/EonsofStupid/ort | ONNX Runtime (load-dynamic) |

### Service Config (platform.default.toml)
```toml
[services.system.voice]
enabled = true
critical = false          # degraded mode if voice fails — app still works
kind = "sayna"
default_tts = "kokoros"   # or "piper"
default_stt = "whisper"   # future
default_voice_female = "af_heart"
default_voice_male = "am_michael"
custom_voices_dir = "system/voice/custom/"
models_dir = "system/voice/models/"
```

---

## Blockers (WHY it doesn't build today)

### 1. espeak-rs-sys builds from source — crashes on VS 2026 Insiders
- `espeak-ng.exe` compiled by VS 2026 crashes with access violation during dict generation
- The build.rs has ZERO support for using a system-installed espeak-ng
- **Fix**: Patch `piper-rs/crates/espeak-rs-sys/build.rs` to detect system install at `C:\Program Files (x86)\eSpeak\` and link against it instead of building from source
- Add env var `ESPEAK_NG_DIR` support for portable path

### 2. Kokoros depends on crates.io espeak-rs
- Kokoros `Cargo.toml` has `espeak-rs = "0.1.9"` from crates.io
- **Fix**: Change to `espeak-rs = { path = "../piper-rs/crates/espeak-rs" }` or use `[patch.crates-io]`
- Already partially done — workspace `[patch.crates-io]` redirects espeak-rs to piper-rs

### 3. ort needs load-dynamic on Windows
- **Fix**: Already done — `ort = { default-features = false, features = ["std", "ndarray", "load-dynamic"] }`
- Ship `onnxruntime.dll` alongside the exe

### 4. audiopus_sys cmake compatibility
- VS 2026 cmake rejects CMakeLists with `cmake_minimum_required` < 3.5
- **Fix**: Already done — `CMAKE_POLICY_VERSION_MINIMUM=3.5` in build SSOT config

---

## Phase 1: Fix espeak-rs-sys (system install support)

### 1.1 Patch piper-rs/crates/espeak-rs-sys/build.rs
- [ ] Add `ESPEAK_NG_DIR` env var check at top of `main()`
- [ ] If set or system install found, skip cmake build entirely
- [ ] Link against system libs: `espeak-ng.lib`, `speechPlayer.lib`, `ucd.lib`
- [ ] Copy espeak-data from system install to OUT_DIR
- [ ] Fall back to cmake source build if no system install found
- [ ] Add `system` feature flag for explicit system install mode

### 1.2 Add espeak-ng to build SSOT
```toml
[build.deps.espeak_ng]
path = "C:/Program Files (x86)/eSpeak"
env = ["ESPEAK_NG_DIR"]
```

### 1.3 Verify espeak-rs compiles on Windows
- [ ] `cargo check -p espeak-rs` passes
- [ ] `cargo check -p kokoros` passes
- [ ] Full platform build with kokoros feature passes

---

## Phase 2: Wire Kokoros as managed service

### 2.1 Boot integration
- [ ] Add Kokoros boot to `platform/boot/mod.rs`
- [ ] Load ONNX model from `services.system.voice.models_dir`
- [ ] Report boot status (model loaded, voice ready)
- [ ] Health check: synthesize silent audio, verify no errors

### 2.2 Tauri commands
- [ ] `synthesize_speech(text, voice_id) -> audio_bytes`
- [ ] `list_voices() -> Vec<VoiceInfo>`
- [ ] `set_default_voice(gender, voice_id)`
- [ ] `preview_voice(voice_id, sample_text) -> audio_bytes`

### 2.3 Voice config UI
- [ ] Settings panel: default male/female voice selection
- [ ] Voice preview button (plays sample)
- [ ] Custom voice training section (drag MP3 files)

---

## Phase 3: Sayna integration (real-time voice server)

### 3.1 Embed Sayna as internal service
- [ ] Sayna runs as managed service under `[services.system.voice]`
- [ ] Routes TTS requests to Kokoros or Piper based on config
- [ ] Routes STT requests to Whisper (future) or system STT
- [ ] WebSocket API for real-time voice streaming

### 3.2 Clyffy voice
- [ ] Assign default voice to Clyffy (Maestro AI persona)
- [ ] Minions get their own voice assignments
- [ ] Voice responses in chat — text + audio playback
- [ ] Push-to-talk for voice commands

---

## Phase 4: Custom voice training

### 4.1 Voice cloning from MP3
- [ ] Import MP3 files as training data
- [ ] Extract voice characteristics (pitch, timbre, cadence)
- [ ] Fine-tune Kokoro model with custom voice data
- [ ] Save custom voice profile to `custom_voices_dir`

### 4.2 Voice management
- [ ] List custom voices in settings
- [ ] Delete/rename custom voices
- [ ] Export voice profiles for sharing

---

## Phase 5: Speech-to-text (STT)

### 5.1 Whisper integration
- [ ] Add Whisper ONNX model to ort load-dynamic pipeline
- [ ] Real-time transcription via Sayna
- [ ] Voice commands: "Hey Clyffy, run the tests"
- [ ] Transcription in chat — voice messages become text

---

## Files Modified

| File | What Changes |
|------|-------------|
| `deps/piper-rs/crates/espeak-rs-sys/build.rs` | System install detection, skip cmake |
| `deps/kokoros/kokoros/Cargo.toml` | Point espeak-rs to piper-rs fork |
| `systems/devpulse-engine/platform.default.toml` | `[services.system.voice]` config |
| `systems/devpulse-engine/src/platform/boot/mod.rs` | Kokoros boot integration |
| `interfaces/desktop/src-tauri/src/lib.rs` | Voice Tauri commands |
| `interfaces/desktop/src-tauri/Cargo.toml` | Re-enable kokoros feature |

## NOT Touched
- Database services (already working)
- ColdLight / UI components
- xtask build pipeline (already has SSOT config)

---

## Dependencies for this sprint
- Platform must boot without voice first (verify in current session)
- espeak-ng MSI installed on dev machine
- ONNX Runtime DLL available in deps/ for load-dynamic
- Kokoro model files (.onnx) downloaded to models dir
