# Sprint: SPRINT-VOICE-LAB

**Date**: 2026-04-02
**Status**: PLAN — Owner approval required
**Research**: `SPRINT-VOICE-LAB.research.md`
**Depends on**: SPRINT-VOICE-PIPELINE (phases 1-5 committed), build passing

---

## Overview

Voice Lab is a cockpit devtool window for configuring Clyffy's voice — TTS and STT setup, voice profile management, and live testing. Opens as an OS child window (same pattern as ModelLoader). Four tabs, each with a clear purpose.

---

## Phase 1: Window Infrastructure

### 1.1 Add WindowRole::VoiceLab

File: `src-tauri/src/commands/window/types.rs`

- [ ] Add `VoiceLab` variant to `WindowRole` enum
- [ ] `label()` → `"voice-lab"`
- [ ] `title()` → `"Voice Lab"`
- [ ] `default_size()` → `(800.0, 600.0)` (wider than ModelLoader — needs tab space)
- [ ] `route()` → `"/voice-lab"`
- [ ] `decorations()` → `true`
- [ ] `always_on_top()` → `false`
- [ ] `transparent()` → `false`

### 1.2 Create route group

```
src/routes/(voice-lab)/
  +layout.svelte          ← minimal shell (dark bg, no sidebar)
  voice-lab/
    +page.svelte          ← VoiceLabPanel import
```

### 1.3 Verify

- [ ] `invoke("open_window", { role: "VoiceLab" })` spawns child window
- [ ] Window renders the voice-lab route

---

## Phase 2: Tauri Voice Commands

### 2.1 Create voice command module

File: `src-tauri/src/commands/voice/mod.rs`

- [ ] `speak(text: String, voice: Option<String>, slot: Option<String>)` → Result<(), String>
  - Routes to voice.tts.primary slot by default
  - Uses AudioService for playback
- [ ] `stop_speaking()` → Result<(), String>
- [ ] `is_speaking()` → Result<bool, String>
- [ ] `list_voices(slot_id: String)` → Result<Vec<VoiceInfo>, String>
  - Returns available voice names for a TTS slot
  - Orpheus: tara, leah, jess, leo, dan, mia, zac, zoe
  - Kokoro: queries model metadata
- [ ] `preview_voice(voice: String, slot_id: String)` → Result<(), String>
  - Speaks a sample sentence with the given voice
- [ ] `test_microphone()` → Result<MicTestResult, String>
  - Records 3 seconds, returns audio level stats
- [ ] `transcribe_audio()` → Result<String, String>
  - Records until silence, runs Whisper, returns text

### 2.2 Types

```rust
#[derive(Serialize, Deserialize, Type)]
pub struct VoiceInfo {
    pub id: String,        // "tara", "leah", etc.
    pub label: String,     // "Tara (Female, Warm)"
    pub gender: String,    // "female" | "male"
    pub sample_text: String, // Preview sentence
}

#[derive(Serialize, Deserialize, Type)]
pub struct MicTestResult {
    pub peak_level: f32,    // 0.0-1.0
    pub avg_level: f32,
    pub duration_ms: u64,
    pub device_name: String,
}

#[derive(Serialize, Deserialize, Type)]
pub struct VoiceProfile {
    pub id: String,
    pub name: String,          // "Clyffy Male Default"
    pub tts_slot: String,      // "voice.tts.primary"
    pub tts_voice: String,     // "leo"
    pub tts_speed: f32,        // 1.0 = normal
    pub stt_slot: String,      // "voice.stt"
    pub stt_language: String,  // "en"
    pub vad_sensitivity: f32,  // 0.0-1.0
    pub is_default: bool,
}
```

### 2.3 Register commands

- [ ] Add to specta router in `src-tauri/src/lib.rs`

---

## Phase 3: Voice Domain (Frontend)

### 3.1 Create domain structure

```
src/lib/domains/app/voice/
  index.ts                     ← public API
  contracts/
    voice.contract.ts          ← VoiceProfile, VoiceInfo types (from specta)
  state/
    voice.state.svelte.ts      ← $state runes for voice config
  services/
    voice.svc.ts               ← invoke wrappers (speak, list_voices, etc.)
  features/
    lab/
      VoiceLabPanel.svelte     ← main panel with tabs
      TtsSetup.svelte          ← Tab 1
      SttSetup.svelte          ← Tab 2
      VoiceProfiles.svelte     ← Tab 3
      TestBench.svelte          ← Tab 4
```

### 3.2 Voice state rune

```typescript
class VoiceState {
  // Current config
  activeProfile = $state<VoiceProfile | null>(null);
  profiles = $state<VoiceProfile[]>([]);
  
  // TTS state
  ttsVoices = $state<VoiceInfo[]>([]);
  isSpeaking = $state(false);
  
  // STT state  
  isListening = $state(false);
  lastTranscription = $state("");
  
  // Mic test
  micLevel = $state(0);
}
```

---

## Phase 4: Tab 1 — TTS Setup

### Layout

```
┌─────────────────────────────────────────────────┐
│  TTS SETUP                                       │
│                                                   │
│  ┌─────────────────┐  ┌──────────────────────┐  │
│  │ Primary Voice    │  │ Voice Preview         │  │
│  │ Slot: Kokoro     │  │                       │  │
│  │ Model: ✓ loaded  │  │  [Tara]  [Leo]       │  │
│  │ Status: Ready    │  │  [Leah]  [Dan]       │  │
│  │                  │  │  [Jess]  [Mia]       │  │
│  │ [Change Model]   │  │  [Zac]   [Zoe]       │  │
│  └─────────────────┘  │                       │  │
│                        │  ▶ "Hello, I'm Tara"  │  │
│  ┌─────────────────┐  │  Speed: [====●===]     │  │
│  │ Secondary Voice  │  │                       │  │
│  │ Slot: Orpheus    │  │  [Set as Default]     │  │
│  │ Model: not loaded│  └──────────────────────┘  │
│  │ Status: OnDemand │                             │
│  │ [Load Now]       │  Default Voice: Leo (Male)  │
│  └─────────────────┘                              │
└───────────────────────────────────────────────────┘
```

### Components

- [ ] `TtsSetup.svelte` — layout, two slot cards + voice picker
- [ ] Voice grid: buttons for each voice, click = preview
- [ ] Speed slider (0.5x to 2.0x)
- [ ] "Set as Default" saves to active profile
- [ ] Slot cards reuse SlotRow or similar from models domain

### STOP — Owner Decision Required

**Question**: Should Voice Lab import and reuse SlotRow from the models domain, or have its own voice-specific slot card?

**Options**:
- A: Import SlotRow from `$lib/domains/app/models/` — DRY, but couples voice to models domain
- B: New VoiceSlotCard in voice domain — duplicates some UI but voice-specific extensions (voice_profile, speed)
- C: Extract a shared SlotCard to `$lib/design/blocks/` — reusable by both

**Impact**: Determines whether voice domain depends on models domain.

---

## Phase 5: Tab 2 — STT Setup

### Layout

```
┌───────────────────────────────────────────────────┐
│  STT SETUP                                         │
│                                                     │
│  Model: Whisper Small         [Change]              │
│  Status: ✓ Loaded             Language: [English ▼] │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │  MICROPHONE TEST                         │       │
│  │                                           │       │
│  │  Device: Rode NT-USB                      │       │
│  │  Level: [████████░░░░░░░░] 62%            │       │
│  │                                           │       │
│  │  [🎙 Test Microphone]                     │       │
│  │  Peak: 0.82  Avg: 0.45  Duration: 3.0s   │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  VAD Sensitivity: [====●===========]  0.4           │
│  (Lower = more sensitive, triggers on quieter audio)│
│                                                     │
│  Upgrade: Whisper Turbo (GPU) — [Load for this      │
│  session]  Uses ~2GB VRAM, faster + more accurate   │
└───────────────────────────────────────────────────┘
```

### Components

- [ ] `SttSetup.svelte` — model status, language picker, mic test, VAD slider
- [ ] Mic level indicator (real-time via cpal → Tauri event)
- [ ] Language dropdown (Whisper supports 99 languages)
- [ ] VAD sensitivity maps to slot extensions

---

## Phase 6: Tab 3 — Voice Profiles

### Layout

```
┌───────────────────────────────────────────────────┐
│  VOICE PROFILES                                    │
│                                                     │
│  ┌────────────────────────────────┐  ┌──────────┐ │
│  │ ★ Clyffy Male Default         │  │  NEW      │ │
│  │   Voice: Leo | Speed: 1.0x    │  │  PROFILE  │ │
│  │   STT: Whisper Small | EN     │  │           │ │
│  │   [Activate] [Edit] [Delete]  │  │  [+]      │ │
│  └────────────────────────────────┘  └──────────┘ │
│                                                     │
│  ┌────────────────────────────────┐                 │
│  │   Clyffy Female Warm           │                 │
│  │   Voice: Tara | Speed: 0.95x   │                 │
│  │   STT: Whisper Small | EN      │                 │
│  │   [Activate] [Edit] [Delete]   │                 │
│  └────────────────────────────────┘                 │
│                                                     │
│  ┌────────────────────────────────┐                 │
│  │   Fast Mode (Dev)              │                 │
│  │   Voice: Zac | Speed: 1.3x     │                 │
│  │   STT: Whisper Turbo | EN      │                 │
│  │   [Activate] [Edit] [Delete]   │                 │
│  └────────────────────────────────┘                 │
└───────────────────────────────────────────────────┘
```

### Persistence

- [ ] Voice profiles stored in libSQL GlobalDb (same pattern as saved layouts)
- [ ] Table: `voice_profiles (id TEXT PK, name TEXT, config JSON, is_default BOOL, created_at INT)`
- [ ] Tauri commands: `list_voice_profiles`, `save_voice_profile`, `delete_voice_profile`, `activate_voice_profile`

---

## Phase 7: Tab 4 — Test Bench

### Layout

```
┌───────────────────────────────────────────────────┐
│  TEST BENCH                                        │
│                                                     │
│  ┌─ TTS Test ──────────────────────────────────┐  │
│  │                                               │  │
│  │  [Type something for Clyffy to say...      ]  │  │
│  │                                               │  │
│  │  Voice: [Leo ▼]  Slot: [Primary ▼]           │  │
│  │  [▶ Speak]  [■ Stop]                          │  │
│  │                                               │  │
│  │  Latency: 340ms  Duration: 2.1s               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ STT Test ──────────────────────────────────┐  │
│  │                                               │  │
│  │  [🎙 Hold to Speak]                           │  │
│  │                                               │  │
│  │  Transcription:                                │  │
│  │  "Hello, this is a test of the voice input"   │  │
│  │                                               │  │
│  │  Latency: 180ms  Confidence: 0.94             │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ A/B Compare ───────────────────────────────┐  │
│  │  Text: [The quick brown fox...]               │  │
│  │  [▶ A: Kokoro/Tara]  [▶ B: Orpheus/Tara]     │  │
│  │  Latency A: 120ms    Latency B: 890ms         │  │
│  └───────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

### Components

- [ ] `TestBench.svelte` — TTS test area, STT test area, A/B compare
- [ ] Latency measurement: timestamp before invoke, timestamp on audio start
- [ ] Hold-to-speak button: mousedown starts recording, mouseup stops + transcribes

---

## Execution Order

1. Phase 1 (window infra) — WindowRole + route group
2. Phase 2 (Tauri commands) — voice command module
3. Phase 3 (domain) — state + services + barrel
4. Phase 4 (TTS tab) — the primary use case
5. Phase 5 (STT tab) — mic + whisper
6. Phase 6 (profiles) — persistence
7. Phase 7 (test bench) — dev testing UX

---

## STOP — Owner Decision Required

**Question**: Should Voice Lab be a completely separate window, or a tab/panel within the existing Model Loader window?

**Options**:
- A: Separate `WindowRole::VoiceLab` window — clean separation, can open alongside model loader
- B: New tab inside Model Loader — all model config in one place, but gets crowded

**Question**: Voice profile persistence — libSQL or just TOML config file?

**Options**:
- A: libSQL table — consistent with other platform state, queryable
- B: TOML section in platform.default.toml — simpler, no DB dependency
- C: JSON file in .userdata/ — middle ground

---

## Gate

- [ ] Voice Lab window opens and renders 4 tabs
- [ ] TTS: can select voice, preview it, hear audio through speakers
- [ ] STT: can test mic, see levels, transcribe speech
- [ ] Profiles: can create, save, activate, delete profiles
- [ ] Test Bench: type→hear and speak→see round trips work
- [ ] Default male + female voice profiles ship with app
