# Research: Voice Lab Devtool

**Date**: 2026-04-02
**Sprint**: SPRINT-VOICE-LAB
**Status**: COMPLETE

## SSOT Map

### Window System
- `WindowRole` enum: `src-tauri/src/commands/window/types.rs` — needs `VoiceLab` variant
- Route groups: `(app)`, `(chat)`, `(cortex)`, `(model-loader)` — needs `(voice-lab)`
- `open_window()` command: `src-tauri/src/commands/window/mod.rs` — handles any WindowRole

### Voice Slot Types
- Slot struct: `kernel/model-loader/src/slots/types.rs` — has runtime, extensions, voice_profile
- 5 voice slots: `systems/devpulse-engine/src/platform/integrations/slots.rs`
  - `voice.tts.primary` (Kokoro, ort)
  - `voice.tts.secondary` (Orpheus, llama.cpp + SNAC)
  - `voice.snac` (SNAC decoder, ort, coupled to secondary)
  - `voice.stt` (Whisper small, sherpa)
  - `voice.stt.upgrade` (Whisper turbo, GPU)

### Voice Backend Traits
- `TtsBackend`: `kernel/model-loader/src/backends/voice.rs`
- `SttBackend`: same file
- `AudioDecoderBackend`: same file
- Implementations: `backends/orpheus.rs`, `backends/ort/snac.rs`, `backends/ort/kokoro.rs`, `backends/ort/whisper.rs`

### Audio Service
- `AudioService` + `AudioHandle`: `systems/devpulse-engine/src/platform/services/audio.rs`
- rodio playback, flume channel bridge

### Tauri Commands
- Model commands: `src-tauri/src/commands/models/mod.rs` (get_slots, load_slot, unload_slot, etc.)
- Voice commands: **DO NOT EXIST** — need to create `src-tauri/src/commands/voice/mod.rs`

### Frontend Domains
- No voice domain exists. Closest: `domains/app/models/` handles slot UI.
- Pattern: `domains/app/{name}/` with contracts, state, services, features, index.ts

### Narration
- `friendly_slot_name()` and `friendly_slot_purpose()` in narration.rs — already updated for new voice slots

## Codebase Analysis

### What EXISTS
1. WindowRole enum with 4 roles (Main, Chat, CortexViewer, ModelLoader)
2. Route group per window: (model-loader)/model-loader/+page.svelte pattern
3. ModelLoaderPanel component — the full slot management UI
4. Voice slots defined with extensions HashMap (voice_profile field)
5. AudioService with play/stop/is_playing
6. Voice backend traits (TtsBackend, SttBackend)
7. friendlySlotLabel/friendlySlotPurpose for all 5 voice slots

### What DOES NOT EXIST
1. No `WindowRole::VoiceLab`
2. No `(voice-lab)` route group
3. No voice Tauri commands (speak, stop_speaking, test_voice, list_voices)
4. No `domains/app/voice/` domain
5. No voice runes (voiceState, voiceProfileState)
6. No VoiceLab UI components
7. No voice profile persistence (libSQL table)
8. No microphone capture service (cpal)

## Architecture

### Voice Lab sits at the intersection of:

```
┌─────────────────┐     ┌──────────────────┐
│   Model Loader   │     │   Audio Service   │
│  (slot mgmt)     │     │  (rodio playback) │
└────────┬─────────┘     └────────┬──────────┘
         │                         │
    ┌────┴─────────────────────────┴────┐
    │           VOICE LAB               │
    │                                   │
    │  Tab 1: TTS Setup                 │
    │    - Select model per TTS slot    │
    │    - Preview voices (play sample) │
    │    - Set male/female default      │
    │                                   │
    │  Tab 2: STT Setup                 │
    │    - Select Whisper model         │
    │    - Test microphone              │
    │    - VAD sensitivity slider       │
    │    - Language selection            │
    │                                   │
    │  Tab 3: Voice Profiles            │
    │    - Save named configs           │
    │    - "Clyffy Male Default"        │
    │    - "Clyffy Female Bright"       │
    │    - Export/import                 │
    │                                   │
    │  Tab 4: Test Bench                │
    │    - Type text → hear it          │
    │    - Speak → see transcription    │
    │    - Latency metrics              │
    │    - A/B comparison               │
    └───────────────────────────────────┘
```

## Anti-Pattern Risks

1. **Duplicating slot management** — Voice Lab shows TTS/STT slots, ModelLoaderPanel also shows them. Don't rebuild slot UI — reuse SlotRow component with voice-specific extensions.
2. **Inline audio playback** — Don't play audio in the Svelte component. Route through AudioService (Rust) via Tauri commands.
3. **Hardcoded voice names** — Voice names come from the model (Orpheus: tara/leah/jess/leo/dan/mia/zac/zoe, Kokoro: different set). Don't hardcode — query from backend.
4. **State duplication** — Voice profiles stored in libSQL, not in Svelte state files. Frontend is a view.

## Files Referenced

- `src-tauri/src/commands/window/types.rs`: WindowRole enum
- `src-tauri/src/commands/window/mod.rs`: open_window logic
- `src-tauri/src/commands/models/mod.rs`: slot command pattern to follow
- `systems/devpulse-engine/src/platform/services/audio.rs`: AudioService
- `systems/devpulse-engine/src/platform/integrations/slots.rs`: voice slot definitions
- `kernel/model-loader/src/backends/voice.rs`: TtsBackend, SttBackend traits
- `kernel/model-loader/src/backends/orpheus.rs`: OrpheusTts (has VOICES constant)
- `interfaces/desktop/src/routes/(model-loader)/`: route pattern to follow
- `interfaces/desktop/src/lib/domains/app/models/`: domain pattern to follow
