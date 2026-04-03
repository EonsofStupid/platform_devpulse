# Research: Voice Pipeline Enablement — Kokoro TTS + Whisper STT

**Date**: 2026-04-02
**Sprint**: SPRINT-VOICE-ENABLE
**Status**: COMPLETE

## SSOT Map

| Concern | SSOT File | Status |
|---------|-----------|--------|
| Kokoro TTS (ORT backend) | `kernel/model-loader/src/backends/ort/kokoro.rs` | STUBBED — synthesize() returns silence |
| Kokoros adapter (crate) | `kernel/devpulse-clyffy/src/cortex/persistence/kokoros.rs` | BROKEN — imports nonexistent `kokoros` crate |
| Whisper STT (Candle) | `kernel/devpulse-clyffy/src/cortex/persistence/whisper.rs` | FULLY IMPLEMENTED — boot, transcribe, ping |
| Whisper STT (ORT) | `kernel/model-loader/src/backends/ort/whisper.rs` | STUBBED — returns empty string |
| SNAC decoder | `kernel/model-loader/src/backends/ort/snac.rs` | FULLY IMPLEMENTED |
| Orpheus TTS | `kernel/model-loader/src/backends/ort/orpheus.rs` | STUBBED — needs InferenceHandle |
| Audio playback | `systems/devpulse-engine/src/platform/services/audio.rs` | FULLY IMPLEMENTED — rodio, thread, flume |
| Voice slots | `systems/devpulse-engine/src/platform/integrations/slots.rs` | 5 slots defined |
| Whisper boot | `systems/devpulse-engine/src/platform/boot/whisper.rs` | IMPLEMENTED — cfg(feature = "candle") |
| Kokoro boot | DOES NOT EXIST | Missing boot/kokoro.rs |
| Tauri voice commands | DOES NOT EXIST | No commands/voice/ module |
| Frontend voice domain | `interfaces/desktop/src/lib/domains/app/voice/` | SKELETON — UI tabs exist, services stub |
| Voice Lab window | NOT REGISTERED | No WindowRole::VoiceLab |

## Key Findings

### What's production-ready RIGHT NOW
1. **Audio playback** (rodio) — spawns OS thread, flume channel, play/stop/shutdown
2. **Whisper STT (Candle backend)** — full pipeline: load safetensors, mel spectrogram, encoder, greedy decode
3. **Whisper boot stage** — cfg-gated, loads from model dir, spawns blocking
4. **SNAC decoder** — full ONNX pipeline for Orpheus audio codec
5. **Voice slot definitions** — all 5 slots configured with model assignments

### What's stubbed (structure exists, inference not wired)
1. **Kokoro TTS (ORT)** — `synthesize()` returns `vec![0.0f32; count]`, TODO comments for ort::Session
2. **Whisper STT (ORT)** — `transcribe()` returns empty string, TODO for encoder/decoder sessions
3. **Orpheus TTS** — needs InferenceHandle integration (llama.cpp FFI)

### What's missing entirely
1. **cpal** (microphone capture) — not in any Cargo.toml
2. **kokoros crate** — imported in kokoros.rs but doesn't exist
3. **Kokoro boot stage** — no boot/kokoro.rs file
4. **Tauri voice commands** — no commands/voice/mod.rs
5. **Frontend voice service** — voice.svc.ts has no invoke wrappers
6. **Voice Lab window** — WindowRole::VoiceLab not registered

### Critical decision: Kokoro backend path
Two paths exist in the codebase:
- **Path A**: `kokoros.rs` (cortex adapter) — imports external `kokoros` crate that doesn't exist
- **Path B**: `kokoro.rs` (model-loader ORT backend) — uses ort Session, stubbed but architecturally correct

Path B is the right answer. It follows the model-loader pattern, doesn't need an external crate, and the ORT infrastructure is already working (SNAC proves it). Path A should be deleted.

### Dependencies present
- `ort = "2.0.0-rc.12"` — ONNX Runtime (working, SNAC uses it)
- `rodio = "0.19"` — audio playback (working)
- `candle-*` — Candle inference (Whisper uses it)
- `tokenizers = "0.21"` — tokenization (Whisper uses it)

### Dependencies missing
- `cpal` — microphone capture for STT
- No external kokoros/orpheus crate needed if using ORT path

## Model Requirements

| Slot | Model | Repo | Size | Format |
|------|-------|------|------|--------|
| voice.tts.primary | Kokoro | hexgrad/Kokoro-82M-v1.0-ONNX | ~80MB | ONNX |
| voice.tts.secondary | Orpheus | lex-hue/orpheus-3b-0.1-ft-Q8_0-GGUF | ~3.2GB | GGUF |
| voice.snac | SNAC | hubertsiuzdak/snac_24khz | ~25MB | ONNX |
| voice.stt | Whisper Small | openai/whisper-small | ~1.5GB | safetensors |
| voice.stt.upgrade | Whisper Turbo | openai/whisper-large-v3-turbo | ~6GB | safetensors |
