# SPRINT: Voice Enable — Get Clyffy Talking and Listening

**Date**: 2026-04-02
**Status**: PLAN — Owner approval required
**Research**: `SPRINT-VOICE-ENABLE.research.md`
**Depends on**: Build passing, Model Loader working (SPRINT-BOOT-WIZARD-FIX done)

---

## Problem Statement

Clyffy can't speak or listen. The voice infrastructure exists in pieces — audio playback works (rodio), Whisper STT works (Candle), voice slots are defined, frontend UI is skeletal. But the connecting tissue is missing: Kokoro TTS inference is stubbed, there's no boot stage for it, no Tauri commands to call speak/transcribe from the frontend, and no microphone capture.

**Goal**: Clyffy speaks aloud via Kokoro TTS, and can transcribe speech via Whisper STT. End-to-end: type text → hear voice, speak into mic → see text.

---

## PHASE 1: Kokoro TTS — Make Clyffy Speak

### Task 1.1: Complete Kokoro ORT inference

**File**: `kernel/model-loader/src/backends/ort/kokoro.rs`

The stubbed `synthesize()` returns silence. Complete it:

1. In `load()`: Create `ort::Session` from the ONNX model file
2. In `synthesize()`: Run inference with text input → get PCM f32 output
3. Return actual audio samples at 24kHz mono

### STOP — Owner Decision Required

**Question**: Which Kokoro model variant should we target?

**Options**:
- A: `hexgrad/Kokoro-82M-v1.0-ONNX` (ONNX, ~80MB, fast, 8 voices) — matches existing ORT backend
- B: `hexgrad/Kokoro-82M-GGUF` (GGUF, ~82MB) — would need llama.cpp FFI path
- C: Different TTS entirely (e.g., Piper, Coqui) — different architecture

**My recommendation**: A — the ORT backend is already proven with SNAC, the model is small, and 8 voices (tara, leah, jess, leo, dan, mia, zac, zoe) match the slot config.

**Impact**: Determines the inference code in kokoro.rs and model download.

### Task 1.2: Create Kokoro boot stage

**File**: `systems/devpulse-engine/src/platform/boot/kokoro.rs` (NEW)

Follow whisper.rs pattern:
- `#[cfg(feature = "kokoros")]` gate
- Read slot config from `service_config.json`
- Check `entry.enabled`
- Resolve model path
- Spawn blocking: `KokoroService::boot(model_path)`
- Log timing, handle errors

### Task 1.3: Wire into boot orchestrator

**File**: `systems/devpulse-engine/src/platform/boot/mod.rs`

Add kokoro boot stage after slot 7 (Voice position in boot order). Follows same pattern as whisper boot.

### Task 1.4: Delete dead kokoros.rs adapter

**File**: `kernel/devpulse-clyffy/src/cortex/persistence/kokoros.rs`

This file imports a nonexistent `kokoros` crate. It's dead code from an abandoned path. Delete it and remove the `#[cfg(feature = "kokoros")]` module declaration in `persistence/mod.rs`.

### Task 1.5: Verify

- [ ] `cargo check -p model-loader`
- [ ] `cargo check -p devpulse-engine`
- [ ] Boot with Kokoro model present → see "voice.tts.primary: ready" in boot.log

---

## PHASE 2: Tauri Voice Commands

### Task 2.1: Create voice command module

**File**: `interfaces/desktop/src-tauri/src/commands/voice/mod.rs` (NEW)

Commands:

```rust
#[tauri::command]
#[specta::specta]
pub async fn speak(state, text: String, voice: Option<String>) -> Result<(), String>
// Get TTS service → synthesize text → send to AudioService → playback

#[tauri::command]
#[specta::specta]
pub async fn stop_speaking(state) -> Result<(), String>
// AudioService.stop()

#[tauri::command]
#[specta::specta]
pub async fn is_speaking(state) -> Result<bool, String>
// AudioService.is_playing()

#[tauri::command]
#[specta::specta]
pub async fn list_voices(state) -> Result<Vec<VoiceInfo>, String>
// Query KokoroService for available voices

#[tauri::command]
#[specta::specta]
pub async fn preview_voice(state, voice: String) -> Result<(), String>
// Synthesize sample sentence + play
```

Types:
```rust
#[derive(Serialize, Deserialize, Type)]
pub struct VoiceInfo {
    pub id: String,      // "tara", "leo", etc.
    pub label: String,   // "Tara (Female, Warm)"
    pub gender: String,  // "female" | "male"
}
```

### Task 2.2: Register commands

**File**: `interfaces/desktop/src-tauri/src/lib.rs`

Add `speak`, `stop_speaking`, `is_speaking`, `list_voices`, `preview_voice` to `collect_commands!`.

### Task 2.3: Verify

- [ ] `cargo check -p devpulse_desktop_backend`
- [ ] Specta regenerates bindings with voice commands
- [ ] `pnpm svelte-check` — 0 errors

---

## PHASE 3: Frontend Voice Service

### Task 3.1: Wire voice.svc.ts

**File**: `interfaces/desktop/src/lib/domains/app/voice/services/voice.svc.ts`

Use specta-generated `commands.speak()`, `commands.stopSpeaking()`, etc. Same pattern as the fixed search/hardware services.

### Task 3.2: Wire voice state rune

**File**: `interfaces/desktop/src/lib/domains/app/voice/state/voice.state.svelte.ts`

Reactive state tracking:
- `isSpeaking` — updated via polling or Tauri event
- `voices` — loaded once on init
- `selectedVoice` — persisted

### Task 3.3: Add speak button to ClyffyNarration

**File**: `interfaces/desktop/src/lib/domains/app/models/components/ClyffyNarration.svelte`

Small speaker icon button — when clicked, calls `speak(message)`. Shows during TTS-capable state.

### Task 3.4: Verify

- [ ] `pnpm svelte-check` — 0 errors
- [ ] Click speak on ClyffyNarration → hear Clyffy's voice

---

## PHASE 4: Microphone Capture + Whisper STT

### Task 4.1: Add cpal dependency

**File**: `systems/devpulse-engine/Cargo.toml`

```toml
cpal = { version = "0.15", optional = true }
```

Gate behind a feature flag (e.g., `voice-input`).

### Task 4.2: Mic capture service

**File**: `systems/devpulse-engine/src/platform/services/mic.rs` (NEW)

- Enumerate audio input devices
- Record N seconds of audio (or until silence via VAD)
- Return PCM samples

### Task 4.3: Transcribe command

**File**: `interfaces/desktop/src-tauri/src/commands/voice/mod.rs`

```rust
#[tauri::command]
#[specta::specta]
pub async fn transcribe(state, duration_secs: Option<f32>) -> Result<String, String>
// MicService.record(duration) → WhisperService.transcribe(samples)

#[tauri::command]
#[specta::specta]
pub async fn test_microphone(state) -> Result<MicTestResult, String>
// Record 3s, return peak/avg levels + device name
```

### Task 4.4: Verify

- [ ] `cargo check -p devpulse-engine`
- [ ] Speak into mic → see transcription text

---

## PHASE 5: Voice Lab Window

### Task 5.1: Register WindowRole::VoiceLab

**File**: `src-tauri/src/commands/window/types.rs`

```rust
VoiceLab => label: "voice-lab", title: "Voice Lab", size: (800, 600), route: "/voice-lab"
```

### Task 5.2: Create route

```
src/routes/(voice-lab)/+layout.svelte
src/routes/(voice-lab)/voice-lab/+page.svelte → <VoiceLabPanel />
```

### Task 5.3: Wire existing tab components

The 4 tabs already exist in `domains/app/voice/features/lab/`:
- TtsSetup.svelte — wire to `list_voices`, `preview_voice`, `speak`
- SttSetup.svelte — wire to `test_microphone`, `transcribe`
- VoiceProfiles.svelte — CRUD via libSQL (future)
- TestBench.svelte — type→hear + speak→see round trips

### Task 5.4: Verify

- [ ] `invoke("open_window", { role: "VoiceLab" })` opens window
- [ ] 4 tabs render and function

---

## Execution Order

1. **Phase 1** (Kokoro TTS) — the core: make inference produce real audio
2. **Phase 2** (Tauri commands) — expose TTS to frontend
3. **Phase 3** (Frontend wiring) — ClyffyNarration speaks
4. **Phase 4** (Mic + STT) — can defer if TTS is the priority
5. **Phase 5** (Voice Lab) — devtool window, can defer

**MVP milestone**: After Phase 3, Clyffy narration bubbles have a speak button. Click it → hear Clyffy's voice through speakers. That's the "Clyffy talks" moment.

---

## STOP — Owner Decision Required

**Question 1**: Kokoro model choice (see Phase 1 STOP)

**Question 2**: Should Clyffy speak automatically during the boot wizard, or only on user click?

**Options**:
- A: Auto-speak narration messages (immersive, but could be annoying on repeated boots)
- B: Speak button only (user-initiated, always available)
- C: Auto-speak first run only, button after

**Question 3**: Priority — TTS first (Phases 1-3) then STT (Phase 4-5)? Or both in parallel?

**Options**:
- A: TTS first — get Clyffy talking, STT follows
- B: Both in parallel — more work but complete voice pipeline faster

---

## Files Modified/Created

| Phase | File | Change |
|-------|------|--------|
| 1 | `kernel/model-loader/src/backends/ort/kokoro.rs` | Complete inference |
| 1 | `systems/devpulse-engine/src/platform/boot/kokoro.rs` | NEW — boot stage |
| 1 | `systems/devpulse-engine/src/platform/boot/mod.rs` | Wire kokoro boot |
| 1 | `kernel/devpulse-clyffy/src/cortex/persistence/kokoros.rs` | DELETE |
| 1 | `kernel/devpulse-clyffy/src/cortex/persistence/mod.rs` | Remove kokoros module |
| 2 | `src-tauri/src/commands/voice/mod.rs` | NEW — 5 commands |
| 2 | `src-tauri/src/lib.rs` | Register voice commands |
| 3 | `domains/app/voice/services/voice.svc.ts` | Invoke wrappers |
| 3 | `domains/app/voice/state/voice.state.svelte.ts` | Reactive state |
| 3 | `domains/app/models/components/ClyffyNarration.svelte` | Speak button |
| 4 | `systems/devpulse-engine/Cargo.toml` | Add cpal |
| 4 | `systems/devpulse-engine/src/platform/services/mic.rs` | NEW — mic capture |
| 4 | `src-tauri/src/commands/voice/mod.rs` | Add transcribe, test_microphone |
| 5 | `src-tauri/src/commands/window/types.rs` | WindowRole::VoiceLab |
| 5 | `src/routes/(voice-lab)/` | NEW — route group |

---

## Gate

- [ ] Kokoro model downloads via Model Loader
- [ ] `speak("Hello, I'm Clyffy")` → audio plays through speakers
- [ ] ClyffyNarration bubble has working speak button
- [ ] Voice Lab window opens with 4 tabs
- [ ] TTS tab: select voice, preview, hear audio
- [ ] STT tab: mic test works, transcription returns text
